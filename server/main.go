package main

import (
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gorilla/csrf"
	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
	"github.com/gorilla/rpc"
	"github.com/gorilla/rpc/json"
	"github.com/jmoiron/sqlx"
	"golang.org/x/net/html"

	"github.com/etherealmachine/rpg.ai/server/models"
	"github.com/etherealmachine/rpg.ai/server/views"

	_ "github.com/lib/pq"
)

var (
	Port           = os.Getenv("PORT")
	Dev            = os.Getenv("DEV") != ""
	SessionKey     = os.Getenv("SESSION_KEY")
	GoogleClientID = os.Getenv("GOOGLE_CLIENT_ID")
	DatabaseURL    = os.Getenv("DATABASE_URL")
)

var (
	db        *models.Queries
	scripts   []*html.Node
	links     []*html.Node
	styles    []*html.Node
	CSRF      = csrf.Protect([]byte(SessionKey))
	publicURL string
)

func profileHandler(w http.ResponseWriter, r *http.Request) {
	authenticatedUser := r.Context().Value(ContextAuthenticatedUserKey).(*AuthenticatedUser)
	assets, err := db.ListAssetMetadataByOwnerID(r.Context(), authenticatedUser.InternalUser.ID)
	if err != nil {
		panic(err)
	}
	views.WritePageTemplate(w, &views.UserProfilePage{
		BasePage: &views.BasePage{
			PublicURL: publicURL,
			Scripts:   scripts,
			Links:     links,
			Styles:    styles,
			CSRFToken: csrf.Token(r),
		},
		User:       *authenticatedUser.InternalUser,
		UserAssets: assets,
	})
}

func uploadAssetsHandler(w http.ResponseWriter, r *http.Request) {
	authenticatedUser := r.Context().Value(ContextAuthenticatedUserKey).(*AuthenticatedUser)
	if err := r.ParseMultipartForm(32 << 20); err != nil {
		panic(err)
	}
	fhs := r.MultipartForm.File["files[]"]
	for _, fh := range fhs {
		f, err := fh.Open()
		if err != nil {
			panic(err)
		}
		bs, err := ioutil.ReadAll(f)
		if err != nil {
			panic(err)
		}
		f.Close()
		if _, err := db.CreateAsset(r.Context(), models.CreateAssetParams{
			OwnerID:     authenticatedUser.InternalUser.ID,
			ContentType: fh.Header.Get("Content-Type"),
			Filename:    fh.Filename,
			Filedata:    bs,
		}); err != nil {
			panic(err)
		}
	}
	redirectURL := r.URL.Query().Get("redirect")
	if redirectURL == "" {
		redirectURL = "/"
	}
	http.Redirect(w, r, redirectURL, http.StatusFound)
}

func detectNodes(n *html.Node) {
	if n.Type == html.ElementNode && n.Data == "script" {
		scripts = append(scripts, n)
	} else if n.Type == html.ElementNode && n.Data == "link" {
		links = append(links, n)
	} else if n.Type == html.ElementNode && n.Data == "style" {
		styles = append(styles, n)
	}
	for c := n.FirstChild; c != nil; c = c.NextSibling {
		detectNodes(c)
	}
}

func RedirectToHTTPS(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		proto := r.Header.Get("X-Forwarded-Proto")
		if (proto == "http" || proto == "HTTP") && !Dev {
			http.Redirect(w, r, fmt.Sprintf("https://%s%s", r.Host, r.URL), http.StatusPermanentRedirect)
			return
		}
		h.ServeHTTP(w, r)
	})
}

func LoginRequired(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authenticatedUser := r.Context().Value(ContextAuthenticatedUserKey).(*AuthenticatedUser)
		if authenticatedUser.InternalUser == nil {
			http.Redirect(w, r, "/", http.StatusTemporaryRedirect)
			return
		}
		h.ServeHTTP(w, r)
	})
}

func main() {
	log.SetFlags(log.LstdFlags | log.Lshortfile)

	port := Port
	if port == "" {
		port = "8000"
	}

	if len(os.Args) == 3 && os.Args[1] == "generate" {
		if err := generateJSONRPCService(&LoginService{}, os.Args[2]); err != nil {
			log.Fatal(err)
		}
		if err := generateJSONRPCService(&AssetService{}, os.Args[2]); err != nil {
			log.Fatal(err)
		}
		return
	}

	publicURL = "https://rpg-ai.herokuapp.com"
	if Dev {
		publicURL = "http://localhost:8000"
		CSRF = csrf.Protect(
			[]byte(SessionKey),
			csrf.Secure(false),
			csrf.SameSite(csrf.SameSiteNoneMode),
			csrf.TrustedOrigins([]string{"https://localhost:3000", "http://localhost:8000"}))
	}

	f, err := os.Open("build/index.html")
	if err != nil {
		log.Fatal(err)
	}
	defer f.Close()
	doc, err := html.Parse(f)
	if err != nil {
		log.Fatal(err)
	}
	detectNodes(doc)

	sqlxDB, err := sqlx.Connect("postgres", DatabaseURL)
	if err != nil {
		log.Fatal(err)
	}
	db = models.New(sqlxDB)

	r := mux.NewRouter().StrictSlash(true)

	api := rpc.NewServer()
	api.RegisterCodec(json.NewCodec(), "application/json")
	api.RegisterService(&LoginService{db: db}, "")
	api.RegisterService(&AssetService{db: db}, "")
	apiHandler := SetAuthenticatedSession(api)
	if Dev {
		apiHandler = handlers.CORS(
			handlers.AllowCredentials(),
			handlers.AllowedHeaders([]string{"Content-Type"}),
			handlers.AllowedOrigins([]string{"https://localhost:3000"}),
		)(apiHandler)
	}
	r.Handle("/api", apiHandler)

	r.Handle("/profile", LoginRequired(http.HandlerFunc(profileHandler)))
	r.Handle("/upload-assets", LoginRequired(http.HandlerFunc(uploadAssetsHandler))).Methods("POST")
	r.PathPrefix("/").Handler(http.StripPrefix("/", http.FileServer(http.Dir("build"))))

	srv := &http.Server{
		Handler:      RedirectToHTTPS(CSRF(GetAuthenticatedSession(r))),
		Addr:         fmt.Sprintf("0.0.0.0:%s", port),
		WriteTimeout: 15 * time.Second,
		ReadTimeout:  15 * time.Second,
	}
	log.Printf("server starting at %v", srv.Addr)
	log.Fatal(srv.ListenAndServe())
}
