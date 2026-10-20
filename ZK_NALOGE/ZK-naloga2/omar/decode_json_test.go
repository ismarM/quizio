// Izbira: DecodeJSON vsebuje validacijsko logiko za strogo dekodiranje JSON-a.
// Pričakovano vedenje: sprejme en veljaven JSON objekt, zavrne neznana polja,
// napačne tipe, neveljavno sintakso, prazno telo in dodaten JSON dokument.
// Mocki niso potrebni, ker httptest.NewRequest zagotovi vhod brez zunanjega I/O.
package shared_test

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/ismarM/quizio/internal/httpapi/shared"
)

func TestDecodeJSON(t *testing.T) {
	type payload struct {
		Name     string `json:"name"`
		Optional string `json:"optional,omitempty"`
	}

	tests := []struct {
		name         string
		body         string
		wantName     string
		wantOptional string
		wantErr      bool
	}{
		{name: "decodes valid object", body: `{"name":"quiz","optional":"set"}`, wantName: "quiz", wantOptional: "set"},
		{name: "accepts missing optional field", body: `{"name":"quiz"}`, wantName: "quiz"},
		{name: "rejects unknown fields", body: `{"name":"quiz","extra":true}`, wantErr: true},
		{name: "rejects invalid syntax", body: `{"name":`, wantErr: true},
		{name: "rejects empty body", body: ``, wantErr: true},
		{name: "rejects second JSON object", body: `{"name":"quiz"}{"name":"again"}`, wantErr: true},
		{name: "rejects wrong data type", body: `{"name":42}`, wantErr: true},
		{name: "accepts surrounding whitespace", body: "  \n\t {\"name\":\"quiz\"} \r\n ", wantName: "quiz"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(tt.body))
			var got payload
			err := shared.DecodeJSON(req, &got)

			if tt.wantErr {
				if err == nil {
					t.Fatal("DecodeJSON() error = nil, want error")
				}
				return
			}
			if err != nil {
				t.Fatalf("DecodeJSON() unexpected error: %v", err)
			}
			if got.Name != tt.wantName || got.Optional != tt.wantOptional {
				t.Fatalf("decoded payload = %+v, want name=%q optional=%q", got, tt.wantName, tt.wantOptional)
			}
		})
	}
}
