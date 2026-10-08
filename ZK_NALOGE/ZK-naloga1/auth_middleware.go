// Package httpapi defines HTTP routing, middleware, and request dispatching for Quizio API.
package httpapi

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/ismarM/quizio/internal/httpapi/shared"
)

// "magic" constants are defined and named
const (
	HeaderUserID = "X-User-Id"
	HeaderUserEmail = "X-User-Email"
	HeaderUserIsAdmin = "X-User-IsAdmin"

	ErrCodeUnauthorized = "unauthorized"
	ErrMsgMissingEmail = "missing X-User-Email header"
	ErrMsgMissingUserID = "missing X-User-Id header"
	ErrMsgInvalidUserID = "invalid X-User-Id header"
	ErrMsgInvalidAdminStatus = "invalid X-User-IsAdmin header value"

	parseDecimalBase = 10
	int32BitSize = 32
)

// isPublicEndpoint checks whether a request is destined for an endpoint
// that does not require prior user identity claims (e.g., initial registration or lookup).
func isPublicEndpoint(method, path string) bool {
	if method == http.MethodPost && path == "/api/users" {
		return true
	}
	if method == http.MethodGet && path == "/api/users/lookup" {
		return true
	}
	return false
}

// parseAdminFlag safely converts the header string value into a boolean flag.
// Accepts "true", "1", "t", etc., via strconv.ParseBool.
func parseAdminFlag(raw string) bool {
	if raw == "" {
		return false
	}
	isAdmin, err := strconv.ParseBool(strings.TrimSpace(raw))
	if err != nil {
		return false
	}
	return isAdmin
}

// AuthMiddleware validates upstream identity headers injected by the Next.js BFF proxy
// and injects authenticated user claims into the request context.
func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// 1. Check for public bypass endpoints
		if isPublicEndpoint(r.Method, r.URL.Path) {
			next.ServeHTTP(w, r)
			return
		}

		// 2. Extract and validate required identity headers
		userEmail := strings.TrimSpace(r.Header.Get(HeaderUserEmail))
		if userEmail == "" {
			shared.WriteError(w, http.StatusUnauthorized, ErrCodeUnauthorized, ErrMsgMissingEmail)
			return
		}

		userIDStr := strings.TrimSpace(r.Header.Get(HeaderUserID))
		if userIDStr == "" {
			shared.WriteError(w, http.StatusUnauthorized, ErrCodeUnauthorized, ErrMsgMissingUserID)
			return
		}

		// 3. Parse and validate user ID
		parsedID, err := strconv.ParseInt(userIDStr, parseDecimalBase, int32BitSize)
		if err != nil || parsedID <= 0 {
			shared.WriteError(w, http.StatusUnauthorized, ErrCodeUnauthorized, ErrMsgInvalidUserID)
			return
		}

		// 4. Parse admin privileges flag
		isAdmin := parseAdminFlag(r.Header.Get(HeaderUserIsAdmin))

		// 5. Construct user claims and bind to request context
		claims := shared.UserClaims{
			ID:      int32(parsedID),
			Email:   userEmail,
			IsAdmin: isAdmin,
		}

		ctx := shared.WithUser(r.Context(), claims)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
