package quizzes

import (
	"time"

	"github.com/ismarM/quizio/internal/db/sqlc"
)

// IsQuizPublishLockedFaulty is the ZK-naloga2 copy of IsQuizPublishLocked,
// restored to the working version.
func IsQuizPublishLockedFaulty(state sqlc.GetQuizStateRow, now time.Time) bool {
	if state.IsArchived {
		return true
	}

	return state.PublishDate.Valid && !state.PublishDate.Time.After(now)
}
