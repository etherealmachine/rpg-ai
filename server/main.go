package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
	"github.com/gorilla/rpc"
	"github.com/gorilla/rpc/json"
	"github.com/jmoiron/sqlx"
	"golang.org/x/net/html"

	"github.com/etherealmachine/rpg.ai/server/models"
	"github.com/etherealmachine/rpg.ai/server/views"

	_ "github.com/lib/pq"
	_ "github.com/mattn/go-sqlite3"
)

var (
	Port           = os.Getenv("PORT")
	CORS           = os.Getenv("CORS") != ""
	SessionKey     = os.Getenv("SESSION_KEY")
	GoogleClientID = os.Getenv("GOOGLE_CLIENT_ID")
	DatabaseURL    = os.Getenv("DATABASE_URL")
)

var (
	db      *models.Queries
	scripts []*html.Node
	links   []*html.Node
	styles  []*html.Node
)

func profileHandler(w http.ResponseWriter, r *http.Request) {
	publicURL := "https://rpg-ai.herokuapp.com"
	if CORS {
		publicURL = "http://localhost:8000"
	}

	authenticatedUser := r.Context().Value(ContextAuthenticatedUserKey).(*AuthenticatedUser)
	if authenticatedUser.InternalUser == nil {
		http.Redirect(w, r, publicURL, http.StatusTemporaryRedirect)
		return
	}
	assets, err := db.GetAssetsByOwnerID(r.Context(), authenticatedUser.InternalUser.ID)
	if err != nil {
		panic(err)
	}
	views.WritePageTemplate(w, &views.UserProfilePage{
		BasePage: &views.BasePage{
			PublicURL: publicURL,
			Scripts:   scripts,
			Links:     links,
			Styles:    styles,
		},
		User:       *authenticatedUser.InternalUser,
		UserAssets: assets,
	})
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

func RedirectToHTTPSMiddleware(h http.Handler) http.Handler {
	return http.HandlerFunc(func(res http.ResponseWriter, req *http.Request) {
		proto := req.Header.Get("X-Forwarded-Proto")
		if (proto == "http" || proto == "HTTP") && !CORS {
			http.Redirect(res, req, fmt.Sprintf("https://%s%s", req.Host, req.URL), http.StatusPermanentRedirect)
			return
		}
		h.ServeHTTP(res, req)
	})
}

func main() {
	log.SetFlags(log.LstdFlags | log.Lshortfile)

	port := Port
	if port == "" {
		port = "8000"
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

	var sqlxDB *sqlx.DB
	if DatabaseURL != "" {
		sqlxDB, err = sqlx.Connect("postgres", DatabaseURL)
		if err != nil {
			log.Fatal(err)
		}
	} else {
		sqlxDB, err = sqlx.Connect("sqlite3", "database.sqlite")
		if err != nil {
			log.Fatal(err)
		}
	}
	db = models.New(sqlxDB)

	r := mux.NewRouter().StrictSlash(true)

	api := rpc.NewServer()
	api.RegisterCodec(json.NewCodec(), "application/json")
	api.RegisterService(&LoginService{db: db}, "")
	apiHandler := SetAuthenticatedSessionMiddleware(api)
	if CORS {
		apiHandler = handlers.CORS(
			handlers.AllowCredentials(),
			handlers.AllowedHeaders([]string{"Content-Type"}),
			handlers.AllowedOrigins([]string{"https://localhost:3000"}),
		)(apiHandler)
	}
	r.Handle("/api", apiHandler)

	r.HandleFunc("/session/{code}", sessionHandler)
	r.PathPrefix("/profile").HandlerFunc(profileHandler)
	r.PathPrefix("/").Handler(http.StripPrefix("/", http.FileServer(http.Dir("build"))))

	srv := &http.Server{
		Handler:      RedirectToHTTPSMiddleware(GetAuthenticatedSessionMiddleware(r)),
		Addr:         fmt.Sprintf("0.0.0.0:%s", port),
		WriteTimeout: 15 * time.Second,
		ReadTimeout:  15 * time.Second,
	}
	log.Printf("server starting at %v", srv.Addr)
	log.Fatal(srv.ListenAndServe())
}
