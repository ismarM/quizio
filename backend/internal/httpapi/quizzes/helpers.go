package quizzes

import (
	"context"
	"github.com/ismarM/quizio/internal/db/sqlc"
	"sort"
)

func (h *Handler) loadQuizzes(ctx context.Context, scope, title string, ownerID int32, submittedOnly bool, submittedBy int32, sortBy string, limit, offset int32) ([]QuizDTO, error) {
	rows, err := h.queries.ListQuizzes(ctx, sqlc.ListQuizzesParams{
		Column1: scope,
		Column2: title,
		Column3: ownerID,
		Column4: submittedOnly,
		TkUser:  submittedBy,
		Column6: sortBy,
		Limit:   limit,
		Offset:  offset,
	})
	if err != nil {
		return nil, err
	}
	results := make([]QuizDTO, 0, len(rows))
	for _, row := range rows {
		results = append(results, quizFromListRow(
			row.IDQuiz,
			row.Title,
			row.Description,
			row.CreatedAt,
			row.PublishDate,
			row.TkUser,
			row.IsArchived,
			row.TimeLimitSeconds,
			row.QuestionCount,
			row.TkCategory,
			row.ImageUrl,
			row.CategoryName,
		))
	}
	return results, nil
}

// calculateLeaderboard is a helper method to calculate the leaderboard for a quiz
func (h *Handler) calculateLeaderboard(ctx context.Context, quizID int32) (*LeaderboardResponse, error) {
	_, err := h.queries.GetQuizByID(ctx, quizID)
	if err != nil {
		return nil, err
	}

	questions, err := h.loadQuizQuestions(ctx, quizID, true)
	if err != nil {
		return nil, err
	}

	questionValue := make(map[int32]float64, len(questions))
	answerIsCorrect := make(map[int32]bool)
	var maxPoints float64
	for _, q := range questions {
		questionValue[q.ID] = q.Value
		maxPoints += q.Value
		for _, a := range q.Answers {
			answerIsCorrect[a.ID] = a.IsCorrect
		}
	}

	attempts, err := h.queries.ListFinishedAttemptsByQuiz(ctx, quizID)
	if err != nil {
		return nil, err
	}

	entries := make([]LeaderboardEntryDTO, 0, len(attempts))
	for _, att := range attempts {
		responses, err := h.queries.ListAttemptQuestions(ctx, att.IDAttempt)
		if err != nil {
			return nil, err
		}

		var achieved float64
		for _, resp := range responses {
			if correct, ok := answerIsCorrect[resp.TkAnswer]; ok && correct {
				if val, ok := questionValue[resp.TkQuestion]; ok {
					achieved += val
				}
			}
		}

		var timeTakenSecs *int32
		if att.TimeTaken.Valid {
			timeTakenSecs = nullTimeStringToSeconds(att.TimeTaken)
		}

		var displayName *string
		if att.UserDisplayName.Valid {
			displayName = &att.UserDisplayName.String
		}

		entries = append(entries, LeaderboardEntryDTO{
			UserID:           att.TkUser,
			Email:            att.UserEmail,
			DisplayName:      displayName,
			AchievedPoints:   achieved,
			MaxPoints:        maxPoints,
			TimeTakenSeconds: timeTakenSecs,
		})
	}

	sort.Slice(entries, func(i, j int) bool {
		if entries[i].AchievedPoints != entries[j].AchievedPoints {
			return entries[i].AchievedPoints > entries[j].AchievedPoints
		}
		var ti, tj int32 = 999999, 999999
		if entries[i].TimeTakenSeconds != nil {
			ti = *entries[i].TimeTakenSeconds
		}
		if entries[j].TimeTakenSeconds != nil {
			tj = *entries[j].TimeTakenSeconds
		}
		return ti < tj
	})

	return &LeaderboardResponse{
		QuizID:  quizID,
		Entries: entries,
	}, nil
}
