package shared_test

import (
	"context"
	"encoding/json"
	"math"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/go-chi/chi/v5"
	"github.com/ismarM/quizio/internal/httpapi/shared"
)

func TestParseIDParam(t *testing.T) {
	tests := []struct {
		name    string
		id      string
		want    int32
		wantErr bool
	}{
		{name: "positive id", id: "12", want: 12},
		{name: "maximum int32", id: "2147483647", want: math.MaxInt32},
		{name: "missing id", wantErr: true},
		{name: "negative id", id: "-1", wantErr: true},
		{name: "zero invalid", id: "0", wantErr: true},
		{name: "text invalid", id: "abc", wantErr: true},
		{name: "int32 overflow", id: "2147483648", wantErr: true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, "/items/"+tt.id, nil)
			rctx := chi.NewRouteContext()
			rctx.URLParams.Add("id", tt.id)
			req = req.WithContext(contextWithRoute(req.Context(), rctx))

			got, err := shared.ParseIDParam(req, "id")
			if tt.wantErr {
				if err == nil {
					t.Fatalf("ParseIDParam(%q) error = nil, want error", tt.id)
				}
				return
			}
			if err != nil {
				t.Fatalf("ParseIDParam(%q) unexpected error: %v", tt.id, err)
			}
			if got != tt.want {
				t.Fatalf("ParseIDParam(%q) = %d, want %d", tt.id, got, tt.want)
			}
		})
	}
}

func TestParseQueryInt32(t *testing.T) {
	tests := []struct {
		name         string
		query        string
		defaultValue int32
		want         int32
		ok           bool
	}{
		{name: "default", defaultValue: 7, want: 7, ok: true},
		{name: "value", query: "?limit=15", defaultValue: 7, want: 15, ok: true},
		{name: "invalid", query: "?limit=abc", ok: false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, "/"+tt.query, nil)

			got, err := shared.ParseQueryInt32(req, "limit", tt.defaultValue)
			if tt.ok && err != nil {
				t.Fatalf("ParseQueryInt32() unexpected error: %v", err)
			}
			if !tt.ok && err == nil {
				t.Fatalf("ParseQueryInt32() error = nil, want error")
			}
			if got != tt.want {
				t.Fatalf("ParseQueryInt32() = %d, want %d", got, tt.want)
			}
		})
	}
}

func TestParseQueryBool(t *testing.T) {
	tests := []struct {
		name         string
		query        string
		defaultValue bool
		want         bool
		ok           bool
	}{
		{name: "default", defaultValue: true, want: true, ok: true},
		{name: "true", query: "?archived=true", want: true, ok: true},
		{name: "false", query: "?archived=false", want: false, ok: true},
		{name: "invalid", query: "?archived=maybe", ok: false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, "/"+tt.query, nil)

			got, err := shared.ParseQueryBool(req, "archived", tt.defaultValue)
			if tt.ok && err != nil {
				t.Fatalf("ParseQueryBool() unexpected error: %v", err)
			}
			if !tt.ok && err == nil {
				t.Fatalf("ParseQueryBool() error = nil, want error")
			}
			if got != tt.want {
				t.Fatalf("ParseQueryBool() = %t, want %t", got, tt.want)
			}
		})
	}
}

func TestWriteJSON(t *testing.T) {
	recorder := httptest.NewRecorder()

	shared.WriteJSON(recorder, http.StatusCreated, map[string]string{"status": "ok"})

	if recorder.Code != http.StatusCreated {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusCreated)
	}
	if got := recorder.Header().Get("Content-Type"); got != "application/json" {
		t.Fatalf("Content-Type = %q, want application/json", got)
	}

	var body map[string]string
	if err := json.Unmarshal(recorder.Body.Bytes(), &body); err != nil {
		t.Fatalf("response JSON invalid: %v", err)
	}
	if body["status"] != "ok" {
		t.Fatalf("status body = %q, want ok", body["status"])
	}
}

func TestWriteError(t *testing.T) {
	recorder := httptest.NewRecorder()

	shared.WriteError(recorder, http.StatusBadRequest, "invalid_payload", "bad input")

	var body shared.ErrorResponse
	if err := json.Unmarshal(recorder.Body.Bytes(), &body); err != nil {
		t.Fatalf("response JSON invalid: %v", err)
	}
	if recorder.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusBadRequest)
	}
	if body.Error != "invalid_payload" || body.Message != "bad input" {
		t.Fatalf("body = %+v, want invalid_payload/bad input", body)
	}
}

func contextWithRoute(ctx context.Context, rctx *chi.Context) context.Context {
	return context.WithValue(ctx, chi.RouteCtxKey, rctx)
}
