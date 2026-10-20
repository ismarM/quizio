// Izbira: IsQuizPublishLocked vsebuje časovno pogojno logiko, ki nadzoruje
// pomembno pravilo objavljanja kvizov.
// Pričakovano vedenje: arhiviran kviz je vedno zaklenjen; prihodnja objava je
// odklenjena; objava ob točnem času ali v preteklosti je zaklenjena.
// Ker je funkcija deterministična in brez I/O, testi mockov ne potrebujejo.
// Trenutno testira IsQuizPublishLockedFaulty, zato mora test zaradi namernih
// napak odpovedati. Za testiranje pravilne različice zamenjaj točno ime
// IsQuizPublishLockedFaulty z imenom IsQuizPublishLocked; takrat mora test
// uspeti.
package quizzes_test

import (
	"database/sql"
	"testing"
	"time"

	"github.com/ismarM/quizio/internal/db/sqlc"
	"github.com/ismarM/quizio/internal/httpapi/quizzes"
)

func TestIsQuizPublishLocked_AppliesArchiveAndTimeRules(t *testing.T) {
	now := time.Date(2026, 6, 6, 12, 0, 0, 0, time.UTC)

	tests := []struct {
		name  string
		state sqlc.GetQuizStateRow
		want  bool
	}{
		{
			name:  "draft is unlocked",
			state: sqlc.GetQuizStateRow{},
			want:  false,
		},
		{
			name: "future scheduled publication is unlocked",
			state: sqlc.GetQuizStateRow{
				PublishDate: sql.NullTime{Time: now.Add(time.Nanosecond), Valid: true},
			},
			want: false,
		},
		{
			name: "publication exactly now is locked",
			state: sqlc.GetQuizStateRow{
				PublishDate: sql.NullTime{Time: now, Valid: true},
			},
			want: true,
		},
		{
			name: "past publication is locked",
			state: sqlc.GetQuizStateRow{
				PublishDate: sql.NullTime{Time: now.Add(-time.Nanosecond), Valid: true},
			},
			want: true,
		},
		{
			name: "archived quiz is locked even when unpublished",
			state: sqlc.GetQuizStateRow{
				IsArchived: true,
			},
			want: true,
		},
		{
			name: "archived quiz remains locked with future publication",
			state: sqlc.GetQuizStateRow{
				IsArchived:  true,
				PublishDate: sql.NullTime{Time: now.Add(time.Hour), Valid: true},
			},
			want: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := quizzes.IsQuizPublishLockedFaulty(tt.state, now); got != tt.want {
				t.Fatalf("IsQuizPublishLocked() = %v, want %v", got, tt.want)
			}
		})
	}
}
