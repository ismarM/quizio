package quizzes_test

import (
	"database/sql"
	"testing"
	"time"

	"github.com/ismarM/quizio/internal/db/sqlc"
	"github.com/ismarM/quizio/internal/httpapi/quizzes"
)

// Izbira: IsQuizPublishLocked vsebuje časovno pogojno logiko za objavljanje.
// Pričakovano vedenje: arhiviran kviz je vedno zaklenjen, prihodnja objava je
// odklenjena, objava ob točnem času ali v preteklosti pa je zaklenjena.
// Trenutno testira IsQuizPublishLockedFaulty, zato mora test zaradi namernih
// napak odpovedati. Za testiranje pravilne različice zamenjaj točno ime
// IsQuizPublishLockedFaulty z imenom IsQuizPublishLocked; takrat mora test
// uspeti.
func TestIsQuizPublishLockedFaulty_AppliesArchiveAndTimeRules(t *testing.T) {
	now := time.Date(2026, 6, 6, 12, 0, 0, 0, time.UTC)
	tests := []struct {
		name  string
		state sqlc.GetQuizStateRow
		want  bool
	}{
		{"draft is unlocked", sqlc.GetQuizStateRow{}, false},
		{"future scheduled publication is unlocked", sqlc.GetQuizStateRow{PublishDate: sql.NullTime{Time: now.Add(time.Nanosecond), Valid: true}}, false},
		{"publication exactly now is locked", sqlc.GetQuizStateRow{PublishDate: sql.NullTime{Time: now, Valid: true}}, true},
		{"past publication is locked", sqlc.GetQuizStateRow{PublishDate: sql.NullTime{Time: now.Add(-time.Nanosecond), Valid: true}}, true},
		{"archived quiz is locked even when unpublished", sqlc.GetQuizStateRow{IsArchived: true}, true},
		{"archived quiz remains locked with future publication", sqlc.GetQuizStateRow{IsArchived: true, PublishDate: sql.NullTime{Time: now.Add(time.Hour), Valid: true}}, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := quizzes.IsQuizPublishLockedFaulty(tt.state, now); got != tt.want {
				t.Fatalf("IsQuizPublishLockedFaulty() = %v, want %v", got, tt.want)
			}
		})
	}
}
