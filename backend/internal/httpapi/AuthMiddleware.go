package httpapi

import (
	"net/http"
	"strconv"

	"github.com/ismarM/quizio/internal/httpapi/shared"
)

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
			shared.WriteError(w, http.StatusUnauthorized, "unauthorized", "missing X-User-Email header")
			return
		}

		if userIDStr == "" {
			shared.WriteError(w, http.StatusUnauthorized, "unauthorized", "missing X-User-Id header")
			return
		}

		userID, err := strconv.ParseInt(userIDStr, 10, 32)
		if err != nil {
			shared.WriteError(w, http.StatusUnauthorized, "unauthorized", "invalid X-User-Id header")
			return
		}

		var isAdmin bool
		if isAdminStr == "true" || isAdminStr == "1" {
			isAdmin = true
		}

		claims := shared.UserClaims{
			ID:      int32(userID),
			Email:   userEmail,
			IsAdmin: isAdmin,
		}

		ctx := shared.WithUser(r.Context(), claims)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
