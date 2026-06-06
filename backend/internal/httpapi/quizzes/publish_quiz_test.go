package quizzes

import (
	"database/sql"
	"testing"
	"time"

	"github.com/ismarM/quizio/internal/db/sqlc"
)

func TestIsQuizPublishLocked(t *testing.T) {
	now := time.Date(2026, 6, 6, 12, 0, 0, 0, time.UTC)

	tests := []struct {
		name  string
		state sqlc.GetQuizStateRow
		want  bool
	}{
		{
			name: "draft quiz can be scheduled",
			state: sqlc.GetQuizStateRow{
				PublishDate: sql.NullTime{},
			},
			want: false,
		},
		{
			name: "scheduled quiz can be rescheduled",
			state: sqlc.GetQuizStateRow{
				PublishDate: sql.NullTime{Time: now.Add(time.Hour), Valid: true},
			},
			want: false,
		},
		{
			name: "scheduled quiz can be published immediately",
			state: sqlc.GetQuizStateRow{
				PublishDate: sql.NullTime{Time: now.Add(time.Second), Valid: true},
			},
			want: false,
		},
		{
			name: "published quiz is locked",
			state: sqlc.GetQuizStateRow{
				PublishDate: sql.NullTime{Time: now.Add(-time.Second), Valid: true},
			},
			want: true,
		},
		{
			name: "archived quiz is locked",
			state: sqlc.GetQuizStateRow{
				IsArchived: true,
			},
			want: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := isQuizPublishLocked(tt.state, now)
			if got != tt.want {
				t.Fatalf("isQuizPublishLocked() = %v, want %v", got, tt.want)
			}
		})
	}
}
