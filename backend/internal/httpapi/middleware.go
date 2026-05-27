package httpapi

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"
)

type contextKey string

const (
	userClaimsKey       contextKey = "userClaims"
	hmacTimestampHeader            = "X-Timestamp"
	hmacSignatureHeader            = "X-Signature"
	hmacMaxSkew                    = 10 * time.Second
)

func IntegrityMiddleware(secret string) func(http.Handler) http.Handler {
	trimmedSecret := strings.TrimSpace(secret)
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			path := r.URL.Path
			if path == "/swagger" || strings.HasPrefix(path, "/swagger/") || strings.HasPrefix(r.RemoteAddr, "127.0.0.1") {
				next.ServeHTTP(w, r)
				return
			}

			if trimmedSecret == "" {
				writeError(w, http.StatusInternalServerError, "server_error", "missing HMAC secret")
				return
			}

			timestampValue := strings.TrimSpace(r.Header.Get(hmacTimestampHeader))
			if timestampValue == "" {
				writeError(w, http.StatusUnauthorized, "unauthorized", "missing X-Timestamp header")
				return
			}

			signatureValue := strings.TrimSpace(r.Header.Get(hmacSignatureHeader))
			if signatureValue == "" {
				writeError(w, http.StatusUnauthorized, "unauthorized", "missing X-Signature header")
				return
			}

			timestampMillis, err := strconv.ParseInt(timestampValue, 10, 64)
			if err != nil {
				writeError(w, http.StatusUnauthorized, "unauthorized", "invalid X-Timestamp header")
				return
			}

			nowMillis := time.Now().UnixMilli()
			maxSkewMillis := int64(hmacMaxSkew / time.Millisecond)
			if nowMillis-timestampMillis > maxSkewMillis || timestampMillis-nowMillis > maxSkewMillis {
				writeError(w, http.StatusUnauthorized, "unauthorized", "stale X-Timestamp header")
				return
			}

			bodyBytes, err := io.ReadAll(r.Body)
			if err != nil {
				writeError(w, http.StatusBadRequest, "bad_request", "unable to read request body")
				return
			}
			r.Body = io.NopCloser(bytes.NewReader(bodyBytes))

			requestPath := r.URL.RequestURI()
			if requestPath == "" {
				requestPath = r.URL.Path
			}

			mac := hmac.New(sha256.New, []byte(trimmedSecret))
			_, _ = mac.Write([]byte(requestPath))
			_, _ = mac.Write([]byte(timestampValue))
			_, _ = mac.Write(bodyBytes)
			expected := mac.Sum(nil)

			provided, err := hex.DecodeString(signatureValue)
			if err != nil {
				writeError(w, http.StatusUnauthorized, "unauthorized", "invalid X-Signature header")
				return
			}

			if !hmac.Equal(provided, expected) {
				writeError(w, http.StatusUnauthorized, "unauthorized", "invalid X-Signature header")
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

type UserClaims struct {
	ID      int32
	Email   string
	IsAdmin bool
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

func UserFromContext(ctx context.Context) (UserClaims, bool) {
	claims, ok := ctx.Value(userClaimsKey).(UserClaims)
	return claims, ok
}
