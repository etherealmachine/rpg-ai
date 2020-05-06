package main

import (
	"fmt"
	"net/http"
)

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
