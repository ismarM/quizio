package ismar_test

import (
	"database/sql"
	"testing"
	"time"

	"github.com/ismarM/quizio/internal/db/sqlc"
	"github.com/ismarM/quizio/internal/httpapi/quizzes"
)

func TestIsQuizPublishLocked_PublicationStates_ReturnExpectedLockState(t *testing.T) {
	now := time.Date(2026, time.October, 20, 12, 0, 0, 0, time.UTC)
	tests := []struct {
		name  string
		state sqlc.GetQuizStateRow
		want  bool
	}{
		{
			name: "draft quiz is unlocked",
			state: sqlc.GetQuizStateRow{
				PublishDate: sql.NullTime{},
			},
			want: false,
		},
		{
			name: "invalid null date stays unlocked even if time contains a value",
			state: sqlc.GetQuizStateRow{
				PublishDate: sql.NullTime{Time: now.Add(-time.Hour), Valid: false},
			},
			want: false,
		},
		{
			name: "future scheduled quiz is unlocked",
			state: sqlc.GetQuizStateRow{
				PublishDate: sql.NullTime{Time: now.Add(time.Nanosecond), Valid: true},
			},
			want: false,
		},
		{
			name: "quiz published exactly now is locked",
			state: sqlc.GetQuizStateRow{
				PublishDate: sql.NullTime{Time: now, Valid: true},
			},
			want: true,
		},
		{
			name: "quiz published in the past is locked",
			state: sqlc.GetQuizStateRow{
				PublishDate: sql.NullTime{Time: now.Add(-time.Nanosecond), Valid: true},
			},
			want: true,
		},
		{
			name: "archived draft is locked",
			state: sqlc.GetQuizStateRow{
				IsArchived: true,
			},
			want: true,
		},
		{
			name: "archived future quiz remains locked",
			state: sqlc.GetQuizStateRow{
				IsArchived:  true,
				PublishDate: sql.NullTime{Time: now.Add(time.Hour), Valid: true},
			},
			want: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := quizzes.IsQuizPublishLocked(tt.state, now); got != tt.want {
				t.Errorf("IsQuizPublishLocked() = %t, want %t", got, tt.want)
			}
		})
	}
}
