package main

import (
	"fmt"
	"log"
	"net/http"
	"net/url"
	"os"
	"time"

	"github.com/gorilla/csrf"
	"github.com/gorilla/mux"
	"github.com/gorilla/rpc"
	jsonrpc "github.com/gorilla/rpc/json"
	"github.com/jmoiron/sqlx"

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
	CSRF      = csrf.Protect([]byte(SessionKey))
	publicURL string
)

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
			csrf.TrustedOrigins([]string{"http://localhost:8000"}))
	}

	if err := loadAssets(); err != nil {
		log.Fatal(err)
	}

	var err error
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
	r.Handle("/set-tilemap-thumbnail", LoginRequired(http.HandlerFunc(SetTilemapThumbnailController))).Methods("POST")
	r.Handle("/map/{hash:[A-Za-z0-9+=/]+}", http.HandlerFunc(MapController)).Methods("GET")
	r.Handle("/tilemap/{hash:[A-Za-z0-9+=/]+}", http.HandlerFunc(TilemapController)).Methods("GET")
	r.Handle("/spritesheet/definition/{hash:[A-Za-z0-9+=/]+}", http.HandlerFunc(SpritesheetDefinitionController)).Methods("GET")
	r.Handle("/spritesheet/image/{hash:[A-Za-z0-9+=/]+}", http.HandlerFunc(SpritesheetImageController)).Methods("GET")
	r.Handle("/thumbnail/{hash:[A-Za-z0-9+=/]+}", http.HandlerFunc(ThumbnailController)).Methods("GET")
	r.Handle("/logout", http.HandlerFunc(LogoutController)).Methods("GET")
	r.Handle("/csrf", http.HandlerFunc(CsrfTokenController)).Methods("GET")
	if Dev {
		u, _ := url.Parse("http://localhost:3000")
		r.PathPrefix("/").Handler(NewWebpackProxy(u)).Methods("GET")
	} else {
		r.PathPrefix("/").Handler(http.StripPrefix("/", http.FileServer(http.Dir("build")))).Methods("GET")
	}

	mainHandler := RedirectToHTTPS(CSRF(GetAuthenticatedSession(r)))

	srv := &http.Server{
		Handler:      mainHandler,
		Addr:         fmt.Sprintf("0.0.0.0:%s", port),
		WriteTimeout: 15 * time.Second,
		ReadTimeout:  15 * time.Second,
	}
	log.Printf("server starting at %v", srv.Addr)
	log.Fatal(srv.ListenAndServe())
}
