package ismar_test

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"strconv"
	"strings"
	"testing"
	"time"

	"github.com/ismarM/quizio/internal/httpapi"
)

const integritySecret = "assignment-test-secret"

type errorResponse struct {
	Error string `json:"error"`
}

type failingReadCloser struct{}

func (failingReadCloser) Read([]byte) (int, error) { return 0, errors.New("test read failure") }
func (failingReadCloser) Close() error             { return nil }

func TestIntegrityMiddleware_RequestValidation_ReturnsExpectedStatus(t *testing.T) {
	tests := []struct {
		name       string
		secret     string
		path       string
		body       string
		remoteAddr string
		mutate     func(*http.Request)
		wantStatus int
		wantError  string
		wantNext   bool
		wantBody   string
	}{
		{
			name:       "valid signature forwards request and restores body",
			secret:     integritySecret,
			path:       "/api/quizzes?scope=mine",
			body:       `{"title":"Go"}`,
			wantStatus: http.StatusNoContent,
			wantNext:   true,
			wantBody:   `{"title":"Go"}`,
		},
		{
			name:       "blank server secret returns internal server error",
			secret:     "   ",
			path:       "/api/quizzes",
			wantStatus: http.StatusInternalServerError,
			wantError:  "server_error",
		},
		{
			name:       "missing timestamp is unauthorized",
			secret:     integritySecret,
			path:       "/api/quizzes",
			mutate:     func(r *http.Request) { r.Header.Del("X-Timestamp") },
			wantStatus: http.StatusUnauthorized,
			wantError:  "unauthorized",
		},
		{
			name:       "missing signature is unauthorized",
			secret:     integritySecret,
			path:       "/api/quizzes",
			mutate:     func(r *http.Request) { r.Header.Del("X-Signature") },
			wantStatus: http.StatusUnauthorized,
			wantError:  "unauthorized",
		},
		{
			name:       "non numeric timestamp is unauthorized",
			secret:     integritySecret,
			path:       "/api/quizzes",
			mutate:     func(r *http.Request) { r.Header.Set("X-Timestamp", "yesterday") },
			wantStatus: http.StatusUnauthorized,
			wantError:  "unauthorized",
		},
		{
			name:   "timestamp older than allowed skew is unauthorized",
			secret: integritySecret,
			path:   "/api/quizzes",
			mutate: func(r *http.Request) {
				r.Header.Set("X-Timestamp", formatUnixMillis(time.Now().Add(-11*time.Second)))
				r.Header.Set("X-Signature", requestSignature(r, ""))
			},
			wantStatus: http.StatusUnauthorized,
			wantError:  "unauthorized",
		},
		{
			name:   "timestamp too far in the future is unauthorized",
			secret: integritySecret,
			path:   "/api/quizzes",
			mutate: func(r *http.Request) {
				r.Header.Set("X-Timestamp", formatUnixMillis(time.Now().Add(11*time.Second)))
				r.Header.Set("X-Signature", requestSignature(r, ""))
			},
			wantStatus: http.StatusUnauthorized,
			wantError:  "unauthorized",
		},
		{
			name:       "non hexadecimal signature is unauthorized",
			secret:     integritySecret,
			path:       "/api/quizzes",
			mutate:     func(r *http.Request) { r.Header.Set("X-Signature", "not-hex") },
			wantStatus: http.StatusUnauthorized,
			wantError:  "unauthorized",
		},
		{
			name:       "incorrect signature is unauthorized",
			secret:     integritySecret,
			path:       "/api/quizzes",
			mutate:     func(r *http.Request) { r.Header.Set("X-Signature", strings.Repeat("00", sha256.Size)) },
			wantStatus: http.StatusUnauthorized,
			wantError:  "unauthorized",
		},
		{
			name:   "unreadable request body returns bad request",
			secret: integritySecret,
			path:   "/api/quizzes",
			mutate: func(r *http.Request) {
				r.Body = failingReadCloser{}
			},
			wantStatus: http.StatusBadRequest,
			wantError:  "bad_request",
		},
		{
			name:   "body changed after signing is unauthorized",
			secret: integritySecret,
			path:   "/api/quizzes",
			body:   `{"title":"signed"}`,
			mutate: func(r *http.Request) {
				r.Body = io.NopCloser(strings.NewReader(`{"title":"tampered"}`))
			},
			wantStatus: http.StatusUnauthorized,
			wantError:  "unauthorized",
		},
		{
			name:   "query changed after signing is unauthorized",
			secret: integritySecret,
			path:   "/api/quizzes?scope=mine",
			mutate: func(r *http.Request) {
				r.URL.RawQuery = "scope=all"
			},
			wantStatus: http.StatusUnauthorized,
			wantError:  "unauthorized",
		},
		{
			name:   "identity changed after signing is unauthorized",
			secret: integritySecret,
			path:   "/api/quizzes",
			mutate: func(r *http.Request) {
				r.Header.Set("X-User-Id", "99")
			},
			wantStatus: http.StatusUnauthorized,
			wantError:  "unauthorized",
		},
		{
			name:       "localhost request bypasses integrity headers",
			secret:     integritySecret,
			path:       "/api/quizzes",
			remoteAddr: "127.0.0.1:4321",
			mutate: func(r *http.Request) {
				r.Header = make(http.Header)
			},
			wantStatus: http.StatusNoContent,
			wantNext:   true,
		},
		{
			name:   "swagger request bypasses integrity headers",
			secret: integritySecret,
			path:   "/swagger/index.html",
			mutate: func(r *http.Request) {
				r.Header = make(http.Header)
			},
			wantStatus: http.StatusNoContent,
			wantNext:   true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := newSignedRequest(t, tt.path, tt.body)
			if tt.remoteAddr != "" {
				req.RemoteAddr = tt.remoteAddr
			}
			if tt.mutate != nil {
				tt.mutate(req)
			}

			nextCalled := false
			var nextBody string
			next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				nextCalled = true
				body, err := io.ReadAll(r.Body)
				if err != nil {
					t.Fatalf("next handler could not read body: %v", err)
				}
				nextBody = string(body)
				w.WriteHeader(http.StatusNoContent)
			})

			recorder := httptest.NewRecorder()
			httpapi.IntegrityMiddleware(tt.secret)(next).ServeHTTP(recorder, req)

			if recorder.Code != tt.wantStatus {
				t.Errorf("status = %d, want %d", recorder.Code, tt.wantStatus)
			}
			if nextCalled != tt.wantNext {
				t.Errorf("next called = %t, want %t", nextCalled, tt.wantNext)
			}
			if nextBody != tt.wantBody {
				t.Errorf("body observed by next = %q, want %q", nextBody, tt.wantBody)
			}
			if tt.wantError != "" {
				var got errorResponse
				if err := json.Unmarshal(recorder.Body.Bytes(), &got); err != nil {
					t.Fatalf("decode error response: %v", err)
				}
				if got.Error != tt.wantError {
					t.Errorf("error code = %q, want %q", got.Error, tt.wantError)
				}
			}
		})
	}
}

func newSignedRequest(t *testing.T, path, body string) *http.Request {
	t.Helper()

	req := httptest.NewRequest(http.MethodPost, path, strings.NewReader(body))
	req.RemoteAddr = "198.51.100.10:4321"
	req.Header.Set("X-Timestamp", formatUnixMillis(time.Now()))
	req.Header.Set("X-User-Id", "7")
	req.Header.Set("X-User-Email", "student@example.com")
	req.Header.Set("X-User-IsAdmin", "false")

	req.Header.Set("X-Signature", requestSignature(req, body))

	return req
}

func requestSignature(req *http.Request, body string) string {
	mac := hmac.New(sha256.New, []byte(integritySecret))
	mac.Write([]byte(req.URL.RequestURI()))
	mac.Write([]byte(req.Header.Get("X-Timestamp")))
	mac.Write([]byte(req.Header.Get("X-User-Id")))
	mac.Write([]byte(req.Header.Get("X-User-Email")))
	mac.Write([]byte(req.Header.Get("X-User-IsAdmin")))
	mac.Write([]byte(body))
	return hex.EncodeToString(mac.Sum(nil))
}

func formatUnixMillis(value time.Time) string {
	return strconv.FormatInt(value.UnixMilli(), 10)
}
