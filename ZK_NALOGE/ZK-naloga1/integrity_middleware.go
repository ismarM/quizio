package httpapi

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/ismarM/quizio/internal/httpapi/shared"
)

// hmacMaxSkew is the maximum allowed difference between the request timestamp
// and the server's current time.
var hmacMaxSkew = 10 * time.Second

const (
	integrityTimestampHeader   = "X-Timestamp"
	integritySignatureHeader   = "X-Signature"
	integrityUserIDHeader      = "X-User-Id"
	integrityUserEmailHeader   = "X-User-Email"
	integrityUserIsAdminHeader = "X-User-IsAdmin"

	integrityServerErrorCode  = "server_error"
	integrityUnauthorizedCode = "unauthorized"
	integrityBadRequestCode   = "bad_request"

	integrityMissingSecretMessage    = "missing HMAC secret"
	integrityMissingTimestampMessage = "missing X-Timestamp header"
	integrityMissingSignatureMessage = "missing X-Signature header"
	integrityInvalidTimestampMessage = "invalid X-Timestamp header"
	integrityStaleTimestampMessage   = "stale X-Timestamp header"
	integrityUnreadableBodyMessage   = "unable to read request body"
	integrityInvalidSignatureMessage = "invalid X-Signature header"
)

// IntegrityMiddleware verifies the request timestamp and HMAC signature before
// forwarding the request. Swagger paths and requests from the configured
// loopback address prefix retain their existing bypass behavior.
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
				shared.WriteError(w, http.StatusInternalServerError, integrityServerErrorCode, integrityMissingSecretMessage)
				return
			}

			timestampValue := strings.TrimSpace(r.Header.Get(integrityTimestampHeader))
			if timestampValue == "" {
				shared.WriteError(w, http.StatusUnauthorized, integrityUnauthorizedCode, integrityMissingTimestampMessage)
				return
			}

			signatureValue := strings.TrimSpace(r.Header.Get(integritySignatureHeader))
			if signatureValue == "" {
				shared.WriteError(w, http.StatusUnauthorized, integrityUnauthorizedCode, integrityMissingSignatureMessage)
				return
			}

			timestampMillis, err := strconv.ParseInt(timestampValue, 10, 64)
			if err != nil {
				shared.WriteError(w, http.StatusUnauthorized, integrityUnauthorizedCode, integrityInvalidTimestampMessage)
				return
			}

			nowMillis := time.Now().UnixMilli()
			maxSkewMillis := int64(hmacMaxSkew / time.Millisecond)
			if nowMillis-timestampMillis > maxSkewMillis || timestampMillis-nowMillis > maxSkewMillis {
				shared.WriteError(w, http.StatusUnauthorized, integrityUnauthorizedCode, integrityStaleTimestampMessage)
				return
			}

			bodyBytes, err := io.ReadAll(r.Body)
			if err != nil {
				shared.WriteError(w, http.StatusBadRequest, integrityBadRequestCode, integrityUnreadableBodyMessage)
				return
			}
			r.Body = io.NopCloser(bytes.NewReader(bodyBytes))

			requestPath := r.URL.RequestURI()
			if requestPath == "" {
				requestPath = r.URL.Path
			}

			// The identity headers must be signed in this exact order.
			identityHeaderOrder := []string{integrityUserIDHeader, integrityUserEmailHeader, integrityUserIsAdminHeader}
			mac := hmac.New(sha256.New, []byte(trimmedSecret))
			_, _ = mac.Write([]byte(requestPath))
			_, _ = mac.Write([]byte(timestampValue))
			for _, headerName := range identityHeaderOrder {
				_, _ = mac.Write([]byte(r.Header.Get(headerName)))
			}
			_, _ = mac.Write(bodyBytes)
			expected := mac.Sum(nil)

			provided, err := hex.DecodeString(signatureValue)
			if err != nil {
				shared.WriteError(w, http.StatusUnauthorized, integrityUnauthorizedCode, integrityInvalidSignatureMessage)
				return
			}

			if !hmac.Equal(provided, expected) {
				shared.WriteError(w, http.StatusUnauthorized, integrityUnauthorizedCode, integrityInvalidSignatureMessage)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
