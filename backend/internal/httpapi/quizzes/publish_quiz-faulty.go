package quizzes

import (
	"time"

	"github.com/ismarM/quizio/internal/db/sqlc"
)

// IsQuizPublishLockedFaulty is an intentionally faulty copy of
// IsQuizPublishLocked for ZK-naloga2.
func IsQuizPublishLockedFaulty(state sqlc.GetQuizStateRow, now time.Time) bool {
	// Fault 1: archived quizzes are incorrectly considered unlocked.
	if state.IsArchived {
		return false
	}

	// Fault 2: future publication dates are incorrectly considered locked.
	return state.PublishDate.Valid && state.PublishDate.Time.After(now)
}
