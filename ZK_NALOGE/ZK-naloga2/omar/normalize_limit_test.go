// Izbira: NormalizeLimit vsebuje mejno in privzeto logiko paginacije.
// Pričakovano vedenje: vrednosti <= 0 spremeni v 20, interval 1..100 pusti
// nespremenjen, vrednosti nad 100 pa omeji na 100. Mocki niso potrebni.
package shared_test

import (
	"math"
	"testing"

	"github.com/ismarM/quizio/internal/httpapi/shared"
)

func TestNormalizeLimit(t *testing.T) {
	tests := []struct {
		name  string
		limit int32
		want  int32
	}{
		{name: "minimum int32 uses default", limit: math.MinInt32, want: 20},
		{name: "negative ten uses default", limit: -10, want: 20},
		{name: "negative one uses default", limit: -1, want: 20},
		{name: "zero uses default", limit: 0, want: 20},
		{name: "one is unchanged", limit: 1, want: 1},
		{name: "nineteen is unchanged", limit: 19, want: 19},
		{name: "twenty is unchanged", limit: 20, want: 20},
		{name: "fifty is unchanged", limit: 50, want: 50},
		{name: "ninety nine is unchanged", limit: 99, want: 99},
		{name: "one hundred is unchanged", limit: 100, want: 100},
		{name: "one hundred one is capped", limit: 101, want: 100},
		{name: "five hundred is capped", limit: 500, want: 100},
		{name: "maximum int32 is capped", limit: math.MaxInt32, want: 100},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := shared.NormalizeLimit(tt.limit); got != tt.want {
				t.Fatalf("NormalizeLimit(%d) = %d, want %d", tt.limit, got, tt.want)
			}
		})
	}
}
