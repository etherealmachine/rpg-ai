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
	db      *models.Database
	scripts []*html.Node
	links   []*html.Node
	styles  []*html.Node
)

func usersHandler(w http.ResponseWriter, r *http.Request) {
	publicURL := "https://rpg-ai.herokuapp.com"
	if CORS {
		publicURL = "http://localhost:8000"
	}

	users := []models.User{}
	authenticatedUser := r.Context().Value(ContextAuthenticatedUserKey).(*AuthenticatedUser)
	if authenticatedUser.InternalUser != nil {
		err := db.Select(&users, "SELECT * FROM users")
		if err != nil {
			log.Fatal(err)
		}
	}
	views.WriteUsers(w, publicURL, users, scripts, links, styles)
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

func main() {
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
