package httpapi

import (
	"context"
	"net/http"
	"strconv"
)

type contextKey string

var userClaimsKey contextKey = "userClaims"

type UserClaims struct {
	ID      int32
	Email   string
	IsAdmin bool
}

func UserFromContext(ctx context.Context) (UserClaims, bool) {
	claims, ok := ctx.Value(userClaimsKey).(UserClaims)
	return claims, ok
}

func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Bypass authentication only for user registration
		if (r.URL.Path == "/api/users" && r.Method == http.MethodPost) ||
			(r.URL.Path == "/api/users/lookup" && r.Method == http.MethodGet) {
			next.ServeHTTP(w, r)
			return
		}

		userIDStr := r.Header.Get("X-User-Id")
		userEmail := r.Header.Get("X-User-Email")
		isAdminStr := r.Header.Get("X-User-IsAdmin")

		if userEmail == "" {
			writeError(w, http.StatusUnauthorized, "unauthorized", "missing X-User-Email header")
			return
		}

		if userIDStr == "" {
			writeError(w, http.StatusUnauthorized, "unauthorized", "missing X-User-Id header")
			return
		}

		userID, err := strconv.ParseInt(userIDStr, 10, 32)
		if err != nil {
			writeError(w, http.StatusUnauthorized, "unauthorized", "invalid X-User-Id header")
			return
		}

		var isAdmin bool
		if isAdminStr == "true" || isAdminStr == "1" {
			isAdmin = true
		}

		claims := UserClaims{
			ID:      int32(userID),
			Email:   userEmail,
			IsAdmin: isAdmin,
		}

		ctx := context.WithValue(r.Context(), userClaimsKey, claims)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
