package httpapi

import (
	"context"
	"database/sql"
	"errors"
	"net/http"
	"strings"
)

type authUser struct {
	ID      int32
	Email   string
	IsAdmin bool
}

type authContextKey struct{}

var authUserKey authContextKey

func (api *API) requireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		email := strings.TrimSpace(r.Header.Get("x-user-email"))
		if email == "" {
			writeError(w, http.StatusUnauthorized, "missing_auth", "missing user email")
			return
		}

		if isCreateUserRequest(r) {
			ctx := context.WithValue(r.Context(), authUserKey, authUser{Email: email})
			next.ServeHTTP(w, r.WithContext(ctx))
			return
		}

		user, err := api.queries.GetUserByEmail(r.Context(), email)
		if err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				writeError(w, http.StatusUnauthorized, "user_not_found", "user not found")
				return
			}
			writeError(w, http.StatusInternalServerError, "auth_failed", "failed to validate user")
			return
		}

		ctx := context.WithValue(r.Context(), authUserKey, authUser{
			ID:      user.IDUser,
			Email:   user.Email,
			IsAdmin: user.IsAdmin,
		})
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func (api *API) requireAdmin(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user, ok := getAuthUser(r)
		if !ok || !user.IsAdmin {
			writeError(w, http.StatusForbidden, "forbidden", "admin access required")
			return
		}
		next.ServeHTTP(w, r)
	})
}

func getAuthUser(r *http.Request) (authUser, bool) {
	user, ok := r.Context().Value(authUserKey).(authUser)
	return user, ok
}

func isCreateUserRequest(r *http.Request) bool {
	if r.Method != http.MethodPost {
		return false
	}
	path := strings.TrimRight(r.URL.Path, "/")
	return path == "/api/users"
}
