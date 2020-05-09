package main

import (
	"bytes"
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"image"
	"io/ioutil"
	"net/http"
	"strconv"

	"github.com/etherealmachine/rpg.ai/server/models"
	"github.com/etherealmachine/rpg.ai/server/views"
	"github.com/gorilla/csrf"
	"github.com/gorilla/mux"

	_ "image/jpeg"
	_ "image/png"
)

func basePage(r *http.Request) *views.BasePage {
	return &views.BasePage{
		PublicURL: publicURL,
		Scripts:   scripts,
		Links:     links,
		Styles:    styles,
		User:      currentUser(r),
	}
}

func currentUser(r *http.Request) *models.User {
	authenticatedUser := r.Context().Value(ContextAuthenticatedUserKey).(*AuthenticatedUser)
	if authenticatedUser != nil && authenticatedUser.InternalUser != nil {
		return authenticatedUser.InternalUser
	}
	return nil
}

func IndexController(w http.ResponseWriter, r *http.Request) {
	tilemaps, err := db.ListRecentTilemaps(r.Context(), 10)
	if err != nil {
		panic(err)
	}
	spritesheets, err := db.ListRecentSpritesheets(r.Context(), 10)
	if err != nil {
		panic(err)
	}
	var tilemapIDs []int32
	for _, tilemap := range tilemaps {
		tilemapIDs = append(tilemapIDs, tilemap.ID)
	}
	rows, err := db.ListThumbnailsForTilemaps(r.Context(), tilemapIDs)
	tilemapThumbnails := make(map[int32][]models.Thumbnail)
	for _, row := range rows {
		if row.TilemapID.Valid {
			tilemapThumbnails[row.TilemapID.Int32] = append(tilemapThumbnails[row.TilemapID.Int32], models.Thumbnail{
				TilemapID: row.TilemapID,
				Hash:      row.Hash,
			})
		}
	}
	var tilemapsWithThumbnails []models.TilemapWithThumbnail
	for _, tilemap := range tilemaps {
		tilemapsWithThumbnails = append(tilemapsWithThumbnails, models.TilemapWithThumbnail{
			Tilemap:    tilemap,
			Thumbnails: tilemapThumbnails[tilemap.ID],
		})
	}
	views.WritePageTemplate(w, &views.IndexPage{
		BasePage:     basePage(r),
		Tilemaps:     tilemapsWithThumbnails,
		Spritesheets: spritesheets,
	})
}

func ProfileController(w http.ResponseWriter, r *http.Request) {
	currentUserID := currentUser(r).ID
	spritesheets, err := db.ListSpritesheetsByOwnerID(r.Context(), currentUserID)
	if err != nil {
		panic(err)
	}
	tilemaps, err := db.ListTilemapsByOwnerID(r.Context(), currentUserID)
	if err != nil {
		panic(err)
	}
	views.WritePageTemplate(w, &views.UserProfilePage{
		BasePage:         basePage(r),
		UserSpritesheets: spritesheets,
		UserTilemaps:     tilemaps,
	})
}

func MapController(w http.ResponseWriter, r *http.Request) {
	hash, err := base64.StdEncoding.DecodeString(mux.Vars(r)["hash"])
	if err != nil {
		panic(err)
	}
	tilemap, err := db.GetTilemapByHash(r.Context(), hash)
	if err != nil {
		panic(err)
	}
	views.WritePageTemplate(w, &views.MapPage{BasePage: basePage(r), Map: tilemap})
}

func UploadAssetsController(w http.ResponseWriter, r *http.Request) {
	currentUserID := currentUser(r).ID
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
	if err := models.CreateAssets(r.Context(), db.WithTx(tx.Tx), currentUserID, assets); err != nil {
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

func SetTilemapThumbnailController(w http.ResponseWriter, r *http.Request) {
	currentUserID := currentUser(r).ID
	if err := r.ParseMultipartForm(32 << 20); err != nil {
		panic(err)
	}
	tilemapID, err := strconv.Atoi(r.FormValue("tilemapID"))
	if err != nil {
		panic(err)
	}
	f, header, err := r.FormFile("thumbnail")
	if err != nil {
		panic(err)
	}
	contentType := header.Header.Get("Content-Type")
	if !(contentType == "image/png" || contentType == "image/jpeg") {
		panic(fmt.Sprintf("unsupported Content-Type %s", contentType))
	}
	imageBytes, err := ioutil.ReadAll(f)
	if err != nil {
		panic(err)
	}
	img, format, err := image.DecodeConfig(bytes.NewReader(imageBytes))
	if err != nil {
		panic(err)
	}
	if (contentType == "image/png" && format != "png") || (contentType == "image/jpeg" && format != "jpeg") {
		panic(fmt.Sprintf("incorrect Content-Type %s", contentType))
	}
	affected, err := db.InsertThumbnailForOwnedTilemap(r.Context(), models.InsertThumbnailForOwnedTilemapParams{
		OwnerID:     currentUserID,
		TilemapID:   sql.NullInt32{Int32: int32(tilemapID), Valid: true},
		Image:       imageBytes,
		ContentType: contentType,
		Width:       int32(img.Width),
		Height:      int32(img.Height),
	})
	if err != nil {
		panic(err)
	}
	if affected == 0 {
		if err := db.UpdateThumbnailForOwnedTilemap(r.Context(), models.UpdateThumbnailForOwnedTilemapParams{
			OwnerID:     currentUserID,
			TilemapID:   int32(tilemapID),
			Image:       imageBytes,
			ContentType: contentType,
			Width:       int32(img.Width),
			Height:      int32(img.Height),
		}); err != nil {
			panic(err)
		}
	}
	redirectURL := r.URL.Query().Get("redirect")
	if redirectURL == "" {
		redirectURL = "/"
	}
	http.Redirect(w, r, redirectURL, http.StatusFound)
}

func SpritesheetImageController(w http.ResponseWriter, r *http.Request) {
	hash, err := base64.StdEncoding.DecodeString(mux.Vars(r)["hash"])
	if err != nil {
		panic(err)
	}
	spritesheet, err := db.GetSpritesheetByHash(r.Context(), hash)
	if err == sql.ErrNoRows {
		w.WriteHeader(http.StatusNotFound)
		return
	} else if err != nil {
		panic(err)
	}
	w.Header().Add("Content-Type", http.DetectContentType(spritesheet.Image))
	http.ServeContent(w, r, spritesheet.Name, spritesheet.CreatedAt, bytes.NewReader(spritesheet.Image))
}

func SpritesheetDefinitionController(w http.ResponseWriter, r *http.Request) {
	hash, err := base64.StdEncoding.DecodeString(mux.Vars(r)["hash"])
	if err != nil {
		panic(err)
	}
	spritesheet, err := db.GetSpritesheetByHash(r.Context(), hash)
	if err == sql.ErrNoRows {
		w.WriteHeader(http.StatusNotFound)
		return
	} else if err != nil {
		panic(err)
	}
	w.Header().Add("Content-Type", "application/json")
	http.ServeContent(w, r, spritesheet.Name, spritesheet.CreatedAt, bytes.NewReader(spritesheet.Definition))
}

func TilemapController(w http.ResponseWriter, r *http.Request) {
	hash, err := base64.StdEncoding.DecodeString(mux.Vars(r)["hash"])
	if err != nil {
		panic(err)
	}
	tilemap, err := db.GetTilemapByHash(r.Context(), hash)
	if err == sql.ErrNoRows {
		w.WriteHeader(http.StatusNotFound)
		return
	} else if err != nil {
		panic(err)
	}
	http.ServeContent(w, r, tilemap.Name, tilemap.CreatedAt, bytes.NewReader(tilemap.Definition))
}

func ThumbnailController(w http.ResponseWriter, r *http.Request) {
	hash, err := base64.StdEncoding.DecodeString(mux.Vars(r)["hash"])
	if err != nil {
		panic(err)
	}
	thumbnail, err := db.GetThumbnailByHash(r.Context(), hash)
	if err == sql.ErrNoRows {
		w.WriteHeader(http.StatusNotFound)
		return
	} else if err != nil {
		panic(err)
	}
	w.Header().Add("Content-Type", thumbnail.ContentType)
	http.ServeContent(w, r, fmt.Sprintf("thumbnail-%d", thumbnail.ID), thumbnail.CreatedAt, bytes.NewReader(thumbnail.Image))
}

func LogoutController(w http.ResponseWriter, r *http.Request) {
	session, err := SessionCookieStore.Get(r, "authenticated_user")
	if err != nil {
		panic(err)
	}
	session.Options.MaxAge = -1
	if err := session.Save(r, w); err != nil {
		panic(err)
	}
	http.Redirect(w, r, "/", http.StatusTemporaryRedirect)
}

func CsrfTokenController(w http.ResponseWriter, r *http.Request) {
	w.Write([]byte(csrf.Token(r)))
}
