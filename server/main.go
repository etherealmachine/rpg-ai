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

func indexHandler(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "build/index.html")
}

func main() {
	port := Port
	if port == "" {
		port = "8000"
	}

	var db *sqlx.DB
	var err error
	if DatabaseURL != "" {
		db, err = sqlx.Connect("postgres", DatabaseURL)
		if err != nil {
			log.Fatal(err)
		}
	} else {
		db, err = sqlx.Connect("sqlite3", "database.sqlite")
		if err != nil {
			log.Fatal(err)
		}
	}

	r := mux.NewRouter().StrictSlash(true)

	api := rpc.NewServer()
	api.RegisterCodec(json.NewCodec(), "application/json")
	api.RegisterService(&LoginService{db: &Database{db}}, "")
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
