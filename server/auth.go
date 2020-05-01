package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"

	session_cookies "github.com/gorilla/sessions"
)

var SessionCookieStore = session_cookies.NewCookieStore([]byte(os.Getenv("SESSION_KEY")))

type ContextKey string

const ContextAuthenticatedUserKey ContextKey = "authenticated_user"

type AuthenticatedUser struct {
	InternalUser *User
	GoogleUser   interface{}
	FacebookUser interface{}
}

func AuthenticateSessionMiddleware(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		session, err := SessionCookieStore.Get(r, "authenticated_user")
		if err != nil {
			panic(err)
		}

		authenticatedUser := new(AuthenticatedUser)
		if encodedInternalUser, ok := session.Values["internal_user"].(*string); ok {
			json.Unmarshal([]byte(*encodedInternalUser), authenticatedUser.InternalUser)
		}
		if encodedGoogleUser, ok := session.Values["google_user"].(*string); ok {
			json.Unmarshal([]byte(*encodedGoogleUser), authenticatedUser.GoogleUser)
		}
		if encodedFacebookUser, ok := session.Values["facebook_user"].(*string); ok {
			json.Unmarshal([]byte(*encodedFacebookUser), authenticatedUser.FacebookUser)
		}

		h.ServeHTTP(w, r.WithContext(context.WithValue(r.Context(), ContextAuthenticatedUserKey, authenticatedUser)))

		if authenticatedUser.InternalUser != nil {
			bs, err := json.Marshal(authenticatedUser.InternalUser)
			if err != nil {
				panic(err)
			} else {
				session.Values["internal_user"] = string(bs)
			}
		}

		if authenticatedUser.GoogleUser != nil {
			bs, err := json.Marshal(authenticatedUser.GoogleUser)
			if err != nil {
				panic(err)
			} else {
				session.Values["google_user"] = string(bs)
			}
		}
		if authenticatedUser.FacebookUser != nil {
			bs, err := json.Marshal(authenticatedUser.FacebookUser)
			if err != nil {
				panic(err)
			} else {
				session.Values["facebook_user"] = string(bs)
			}
		}
		log.Println("saving session")
		if err := session.Save(r, w); err != nil {
			panic(err)
		}
		w.Header().Add("X-Session-Middleware", "hello")
	})
}
