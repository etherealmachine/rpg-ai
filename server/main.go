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

var db *models.Database

func indexHandler(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "build/index.html")
}

func usersHandler(w http.ResponseWriter, r *http.Request) {
	publicURL := "https://rpg-ai.herokuapp.com"
	if CORS {
		publicURL = "http://localhost:8000"
	}
	users := []models.User{}
	err := db.Select(&users, "SELECT * FROM users")
	if err != nil {
		log.Fatal(err)
	}
	views.WriteUsers(w, publicURL, users)
}

func main() {
	port := Port
	if port == "" {
		port = "8000"
	}

	var sqlxDB *sqlx.DB
	var err error
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
	db = &models.Database{sqlxDB}

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
	r.PathPrefix("/app").HandlerFunc(indexHandler)
	r.PathPrefix("/users").HandlerFunc(usersHandler)
	r.PathPrefix("/").Handler(http.StripPrefix("/", http.FileServer(http.Dir("build"))))

	srv := &http.Server{
		Handler:      GetAuthenticatedSessionMiddleware(r),
		Addr:         fmt.Sprintf("0.0.0.0:%s", port),
		WriteTimeout: 15 * time.Second,
		ReadTimeout:  15 * time.Second,
	}
	log.Printf("server starting at %v", srv.Addr)
	log.Fatal(srv.ListenAndServe())
}
