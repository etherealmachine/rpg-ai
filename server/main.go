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
		if err := generateJSONRPCService(&CampaignService{}, os.Args[2]); err != nil {
			log.Fatal(err)
		}
		if err := generateJSONRPCService(&ClingoService{}, os.Args[2]); err != nil {
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
			csrf.SameSite(csrf.SameSiteLaxMode),
			csrf.TrustedOrigins([]string{"http://localhost:8000"}))
		go func() {
			if err := runWebpack(); err != nil {
				log.Fatal(err)
			}
		}()
	} else {
		if err := loadProductionAssets(); err != nil {
			log.Fatal(err)
		}
	}

	refreshPosts()

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
	api.RegisterService(&CampaignService{db: db}, "")
	api.RegisterService(&ClingoService{}, "")
	r.Handle("/api", SetAuthenticatedSession(api)).Name("API")

	r.Handle("/", http.HandlerFunc(IndexController)).Methods("GET").Name("Index")
	r.Handle("/profile", LoginRequired(http.HandlerFunc(ProfileController))).Methods("GET").Name("Profile")
	r.Handle("/search", http.HandlerFunc(UnderConstructionController)).Methods("GET").Name("Search")
	r.Handle("/tags", http.HandlerFunc(UnderConstructionController)).Methods("GET").Name("Tags")
	r.Handle("/devlog", http.HandlerFunc(DevlogController)).Methods("GET").Name("Devlog")
	r.Handle("/devlog/{slug:[A-Za-z0-9-]+}", http.HandlerFunc(DevlogController)).Methods("GET").Name("DevlogBySlug")
	r.Handle("/upload-assets", LoginRequired(http.HandlerFunc(UploadAssetsController))).Methods("POST").Name("UploadAssets")
	r.Handle("/set-tilemap-thumbnail", LoginRequired(http.HandlerFunc(SetTilemapThumbnailController))).Methods("POST").Name("SetTilemapThumbnail")
	r.Handle("/map/{hash:[A-Za-z0-9+=/]+}", http.HandlerFunc(MapController)).Methods("GET").Name("MapByHash")
	r.Handle("/tilemap/download/{hash:[A-Za-z0-9+=/]+}", http.HandlerFunc(TilemapDownloadController)).Methods("GET").Name("TilemapDownloadByHash")
	r.Handle("/tilemap/{hash:[A-Za-z0-9+=/]+}", http.HandlerFunc(TilemapController)).Methods("GET").Name("TilemapByHash")
	r.Handle("/spritesheet/download/definition/{hash:[A-Za-z0-9+=/]+}", http.HandlerFunc(SpritesheetDownloadDefinitionController)).Methods("GET").Name("SpritesheetDefinitionDownloadByHash")
	r.Handle("/spritesheet/download/image/{hash:[A-Za-z0-9+=/]+}", http.HandlerFunc(SpritesheetDownloadImageController)).Methods("GET").Name("SpritesheetImageDownloadByHash")
	r.Handle("/spritesheet/definition/{hash:[A-Za-z0-9+=/]+}", http.HandlerFunc(SpritesheetDefinitionController)).Methods("GET").Name("SpritesheetDefinitionByHash")
	r.Handle("/spritesheet/image/{hash:[A-Za-z0-9+=/]+}", http.HandlerFunc(SpritesheetImageController)).Methods("GET").Name("SpritesheetImageByHash")
	r.Handle("/thumbnail/{hash:[A-Za-z0-9+=/]+}", http.HandlerFunc(ThumbnailController)).Methods("GET").Name("ThumbnailByHash")
	r.Handle("/encounter/{id:[0-9+=/]+}/{character_id:[0-9+=/]+}", http.HandlerFunc(EncounterController)).Methods("GET").Name("EncounterByIDAndCharacter")
	r.Handle("/login", http.HandlerFunc(LoginController)).Methods("GET").Name("Login")
	r.Handle("/logout", LoginRequired(http.HandlerFunc(LogoutController))).Methods("GET").Name("Logout")
	r.Handle("/csrf", http.HandlerFunc(CsrfTokenController)).Methods("GET").Name("CSRF")
	if Dev {
		u, _ := url.Parse("http://localhost:3000")
		r.PathPrefix("/").Handler(NewWebpackProxy(u)).Methods("GET")
	} else {
		r.PathPrefix("/").Handler(http.StripPrefix("/", http.FileServer(http.Dir("build")))).Methods("GET")
	}

	r.Use(LogRequest)
	r.Use(RedirectToHTTPS)
	r.Use(CSRF)
	r.Use(GetAuthenticatedSession)
	if Dev {
		r.Use(CacheBuster)
	}

	srv := &http.Server{
		Handler:      r,
		Addr:         fmt.Sprintf("0.0.0.0:%s", port),
		WriteTimeout: 15 * time.Second,
		ReadTimeout:  15 * time.Second,
	}
	log.Printf("server starting at %v", srv.Addr)
	log.Fatal(srv.ListenAndServe())
}
