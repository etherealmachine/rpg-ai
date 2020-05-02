package main

import (
	"encoding/json"
	"io/ioutil"
	"net/http"

	googleAuthIDTokenVerifier "github.com/futurenda/google-auth-id-token-verifier"

	"github.com/etherealmachine/rpg.ai/server/models"
)

type GoogleLoginRequest struct {
	TokenID string
}

type FacebookLoginRequest struct {
	AccessToken string
}

type LoginResponse struct {
	User *models.User
}

type LoginService struct {
	db *models.Queries
}

func (s *LoginService) GoogleLogin(r *http.Request, args *GoogleLoginRequest, reply *LoginResponse) error {
	authenticatedUser := r.Context().Value(ContextAuthenticatedUserKey).(*AuthenticatedUser)
	if authenticatedUser.InternalUser != nil {
		reply.User = authenticatedUser.InternalUser
		return nil
	}
	v := googleAuthIDTokenVerifier.Verifier{}
	if err := v.VerifyIDToken(args.TokenID, []string{GoogleClientID}); err != nil {
		return err
	}
	claimSet, err := googleAuthIDTokenVerifier.Decode(args.TokenID)
	if err != nil {
		return err
	}
	user, err := s.db.GetUserByEmail(r.Context(), claimSet.Email)
	if err != nil {
		return err
	}
	reply.User = &user
	authenticatedUser.InternalUser = &user
	authenticatedUser.GoogleUser = claimSet
	return nil
}

func (s *LoginService) FacebookLogin(r *http.Request, args *FacebookLoginRequest, reply *LoginResponse) error {
	authenticatedUser := r.Context().Value(ContextAuthenticatedUserKey).(*AuthenticatedUser)
	if authenticatedUser.InternalUser != nil {
		reply.User = authenticatedUser.InternalUser
		return nil
	}
	url := "https://graph.facebook.com/v3.2/me?fields=email&access_token=" + args.AccessToken
	resp, err := http.Get(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return err
	}
	fbResp := struct {
		ID    string `json:"id"`
		Email string `json:"email"`
	}{}
	if err := json.Unmarshal(body, &fbResp); err != nil {
		return err
	}
	user, err := s.db.GetUserByEmail(r.Context(), fbResp.Email)
	if err != nil {
		return err
	}
	reply.User = &user
	authenticatedUser.InternalUser = &user
	authenticatedUser.FacebookUser = fbResp
	return nil
}
