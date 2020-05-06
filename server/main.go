package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gorilla/csrf"
	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
	"github.com/gorilla/rpc"
	jsonrpc "github.com/gorilla/rpc/json"
	"github.com/jmoiron/sqlx"
	"golang.org/x/net/html"

	"github.com/etherealmachine/rpg.ai/server/models"

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

	r.Handle("/", http.HandlerFunc(IndexController)).Methods("GET")
	r.Handle("/profile", LoginRequired(http.HandlerFunc(ProfileController))).Methods("GET")
	r.Handle("/upload-assets", LoginRequired(http.HandlerFunc(UploadAssetsController))).Methods("POST")
	r.Handle("/map", http.HandlerFunc(MapController)).Methods("GET")
	r.Handle("/tilemap/{id:[0-9]+}", http.HandlerFunc(TilemapController)).Methods("GET")
	r.Handle("/spritesheet/image/{id:[0-9]+}", http.HandlerFunc(SpritesheetImageController)).Methods("GET")
	r.Handle("/spritesheet/definition/{id:[0-9]+}", http.HandlerFunc(SpritesheetDefinitionController)).Methods("GET")
	r.Handle("/csrf", http.HandlerFunc(CsrfTokenController)).Methods("GET")
	r.PathPrefix("/").Handler(http.StripPrefix("/", http.FileServer(http.Dir("build")))).Methods("GET")

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
