package main

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"strconv"

	"github.com/etherealmachine/rpg.ai/server/models"
	"github.com/etherealmachine/rpg.ai/server/views"
	"github.com/gorilla/csrf"
	"github.com/gorilla/mux"
)

func IndexController(w http.ResponseWriter, r *http.Request) {
	authenticatedUser := r.Context().Value(ContextAuthenticatedUserKey).(*AuthenticatedUser)
	var user models.User
	if authenticatedUser != nil && authenticatedUser.InternalUser != nil {
		user = *authenticatedUser.InternalUser
	}
	views.WritePageTemplate(w, &views.IndexPage{
		BasePage: &views.BasePage{
			PublicURL: publicURL,
			Scripts:   scripts,
			Links:     links,
			Styles:    styles,
		},
		User: user,
	})
}

func ProfileController(w http.ResponseWriter, r *http.Request) {
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

func MapController(w http.ResponseWriter, r *http.Request) {
	authenticatedUser := r.Context().Value(ContextAuthenticatedUserKey).(*AuthenticatedUser)
	views.WritePageTemplate(w, &views.MapPage{
		BasePage: &views.BasePage{
			PublicURL: publicURL,
			Scripts:   scripts,
			Links:     links,
			Styles:    styles,
		},
		User: *authenticatedUser.InternalUser,
	})
}

func UploadAssetsController(w http.ResponseWriter, r *http.Request) {
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

func SpritesheetImageController(w http.ResponseWriter, r *http.Request) {
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

func SpritesheetDefinitionController(w http.ResponseWriter, r *http.Request) {
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

func TilemapController(w http.ResponseWriter, r *http.Request) {
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

func CsrfTokenController(w http.ResponseWriter, r *http.Request) {
	w.Write([]byte(csrf.Token(r)))
}
