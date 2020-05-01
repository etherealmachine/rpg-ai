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

func indexHandler(w http.ResponseWriter, r *http.Request) {
	authenticatedUser := r.Context().Value(ContextAuthenticatedUserKey).(*AuthenticatedUser)
	if authenticatedUser.InternalUser != nil {
		w.WriteHeader(200)
		return
	}
	http.ServeFile(w, r, "build/index.html")
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8000"
	}

	var db *sqlx.DB
	var err error
	if os.Getenv("DATABASE_URL") != "" {
		db, err = sqlx.Connect("postgres", os.Getenv("DATABASE_URL"))
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
	api.RegisterService(&APIService{db: &Database{db}}, "")
	if os.Getenv("CORS") != "" {
		r.Handle("/api", handlers.CORS(handlers.AllowedHeaders([]string{"Content-Type"}))(api))
	} else {
		r.Handle("/api", api)
	}

	r.HandleFunc("/session/{code}", sessionHandler)
	r.PathPrefix("/app").HandlerFunc(indexHandler)
	r.PathPrefix("/").Handler(http.StripPrefix("/", http.FileServer(http.Dir("build"))))

	srv := &http.Server{
		Handler:      AuthenticateSessionMiddleware(r),
		Addr:         fmt.Sprintf("0.0.0.0:%s", port),
		WriteTimeout: 15 * time.Second,
		ReadTimeout:  15 * time.Second,
	}
	log.Printf("server starting at %v", srv.Addr)
	log.Fatal(srv.ListenAndServe())
}
