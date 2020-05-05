package main

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/gorilla/csrf"
	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
	"github.com/gorilla/rpc"
	jsonrpc "github.com/gorilla/rpc/json"
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
	sqlxDB    *sqlx.DB
	db        *models.Queries
	scripts   []*html.Node
	links     []*html.Node
	styles    []*html.Node
	CSRF      = csrf.Protect([]byte(SessionKey))
	publicURL string
)

func profileHandler(w http.ResponseWriter, r *http.Request) {
	authenticatedUser := r.Context().Value(ContextAuthenticatedUserKey).(*AuthenticatedUser)
	spritesheets, err := db.ListSpritesheetsByOwnerID(r.Context(), authenticatedUser.InternalUser.ID)
	if err != nil {
		panic(err)
	}
	tilemaps, err := db.ListTilemapsByOwnerID(r.Context(), authenticatedUser.InternalUser.ID)
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
		User:             *authenticatedUser.InternalUser,
		UserSpritesheets: spritesheets,
		UserTilemaps:     tilemaps,
	})
}

func uploadAssetsHandler(w http.ResponseWriter, r *http.Request) {
	authenticatedUser := r.Context().Value(ContextAuthenticatedUserKey).(*AuthenticatedUser)
	if err := r.ParseMultipartForm(32 << 20); err != nil {
		panic(err)
	}
	fhs := r.MultipartForm.File["files[]"]
	var assets []*models.Upload
	for _, fh := range fhs {
		contentType := fh.Header.Get("Content-Type")
		if !(contentType == "application/json" || contentType == "image/png" || contentType == "image/jpeg") {
			panic(fmt.Sprintf("unsupported Content-Type %s", contentType))
		}
		f, err := fh.Open()
		if err != nil {
			panic(err)
		}
		bs, err := ioutil.ReadAll(f)
		if err != nil {
			panic(err)
		}
		f.Close()
		asset := &models.Upload{Filename: fh.Filename, Filedata: bs}
		if contentType == "application/json" {
			if err := json.Unmarshal(bs, &asset.Json); err != nil {
				panic(err)
			}
		}
		assets = append(assets, asset)
	}
	tx := sqlxDB.MustBeginTx(r.Context(), nil)
	if err := models.CreateAssets(r.Context(), db.WithTx(tx.Tx), authenticatedUser.InternalUser.ID, assets); err != nil {
		tx.Rollback()
		panic(err)
	}
	tx.Commit()
	redirectURL := r.URL.Query().Get("redirect")
	if redirectURL == "" {
		redirectURL = "/"
	}
	http.Redirect(w, r, redirectURL, http.StatusFound)
}

func spritesheetImageHandler(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(mux.Vars(r)["id"], 10, 32)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	spritesheet, err := db.GetSpritesheetByID(r.Context(), int32(id))
	if err == sql.ErrNoRows {
		w.WriteHeader(http.StatusNotFound)
		return
	} else if err != nil {
		panic(err)
	}
	http.ServeContent(w, r, spritesheet.Name, spritesheet.CreatedAt, bytes.NewReader(spritesheet.Image))
}

func spritesheetDefinitionHandler(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(mux.Vars(r)["id"], 10, 32)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	spritesheet, err := db.GetSpritesheetByID(r.Context(), int32(id))
	if err == sql.ErrNoRows {
		w.WriteHeader(http.StatusNotFound)
		return
	} else if err != nil {
		panic(err)
	}
	http.ServeContent(w, r, spritesheet.Name, spritesheet.CreatedAt, bytes.NewReader(spritesheet.Definition))
}

func tilemapHandler(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(mux.Vars(r)["id"], 10, 32)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	tilemap, err := db.GetTilemapByID(r.Context(), int32(id))
	if err == sql.ErrNoRows {
		w.WriteHeader(http.StatusNotFound)
		return
	} else if err != nil {
		panic(err)
	}
	http.ServeContent(w, r, tilemap.Name, tilemap.CreatedAt, bytes.NewReader(tilemap.Definition))
}

func csrfTokenHandler(w http.ResponseWriter, r *http.Request) {
	w.Write([]byte(csrf.Token(r)))
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

	sqlxDB, err = sqlx.Connect("postgres", DatabaseURL)
	if err != nil {
		log.Fatal(err)
	}
	db = models.New(sqlxDB)

	r := mux.NewRouter().StrictSlash(true)

	api := rpc.NewServer()
	api.RegisterCodec(jsonrpc.NewCodec(), "application/json")
	api.RegisterService(&LoginService{db: db}, "")
	api.RegisterService(&AssetService{db: db}, "")
	r.Handle("/api", SetAuthenticatedSession(api))

	r.Handle("/profile", LoginRequired(http.HandlerFunc(profileHandler)))
	r.Handle("/upload-assets", LoginRequired(http.HandlerFunc(uploadAssetsHandler))).Methods("POST")
	r.Handle("/tilemap/{id:[0-9]+}", http.HandlerFunc(tilemapHandler))
	r.Handle("/spritesheet/image/{id:[0-9]+}", http.HandlerFunc(spritesheetImageHandler))
	r.Handle("/spritesheet/definition/{id:[0-9]+}", http.HandlerFunc(spritesheetDefinitionHandler))
	r.Handle("/csrf", LoginRequired(http.HandlerFunc(csrfTokenHandler)))
	r.PathPrefix("/").Handler(http.StripPrefix("/", http.FileServer(http.Dir("build"))))

	mainHandler := RedirectToHTTPS(CSRF(GetAuthenticatedSession(r)))
	if Dev {
		mainHandler = handlers.CORS(
			handlers.AllowCredentials(),
			handlers.AllowedHeaders([]string{"Content-Type", "X-CSRF-Token"}),
			handlers.ExposedHeaders([]string{"X-Filename"}),
			handlers.AllowedOrigins([]string{"https://localhost:3000"}),
		)(mainHandler)
	}

	srv := &http.Server{
		Handler:      mainHandler,
		Addr:         fmt.Sprintf("0.0.0.0:%s", port),
		WriteTimeout: 15 * time.Second,
		ReadTimeout:  15 * time.Second,
	}
	log.Printf("server starting at %v", srv.Addr)
	log.Fatal(srv.ListenAndServe())
}
