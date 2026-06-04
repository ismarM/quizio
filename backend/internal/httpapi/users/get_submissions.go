package users

import (
	"github.com/ismarM/quizio/internal/db/sqlc"
	"net/http"
)

// GetSubmissions godoc
// @Summary Get submissions
// @Description Return finished attempts and raw data for scoring for the authenticated user.
// @Tags users
// @Produce json
// @Param limit query int false "Limit"
// @Param offset query int false "Offset"
// @Success 200 {object} SubmissionsResponse
// @Failure 401 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/users/me/submissions [get]
func (h *Handler) GetSubmissions(w http.ResponseWriter, r *http.Request) {
	claims, ok := UserFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized", "unauthorized")
		return
	}
	userID := claims.ID

	limit, err := parseQueryInt32(r, "limit", defaultLimit)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_query", "invalid limit")
		return
	}
	offset, err := parseQueryInt32(r, "offset", 0)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_query", "invalid offset")
		return
	}
	limit = normalizeLimit(limit)
	if offset < 0 {
		writeError(w, http.StatusBadRequest, "invalid_payload", "offset must be non-negative")
		return
	}

	if err := h.queries.FinalizeExpiredAttemptsForUser(r.Context(), userID); err != nil {
		writeError(w, http.StatusInternalServerError, "finalize_attempts_failed", "failed to finalize expired attempts")
		return
	}

	rows, err := h.queries.ListFinishedAttemptsByUser(r.Context(), sqlc.ListFinishedAttemptsByUserParams{
		TkUser: userID,
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		writeError(w, http.StatusInternalServerError, "list_submissions_failed", "failed to list submissions")
		return
	}

	results := make([]SubmissionSummary, 0, len(rows))
	for _, row := range rows {
		// load quiz title
		quizRow, err := h.queries.GetQuizByID(r.Context(), row.TkQuiz)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "get_quiz_failed", "failed to load quiz")
			return
		}

		// load questions with correct flags
		questions, err := h.loadQuizQuestions(r.Context(), row.TkQuiz, true)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "load_questions_failed", "failed to load quiz questions")
			return
		}

		// build maps for quick lookup
		questionValue := make(map[int32]float64, len(questions))
		answerIsCorrect := make(map[int32]bool)
		for _, q := range questions {
			questionValue[q.ID] = q.Value
			for _, a := range q.Answers {
				answerIsCorrect[a.ID] = a.IsCorrect
			}
		}

		// load attempt responses
		responses, err := h.queries.ListAttemptQuestions(r.Context(), row.IDAttempt)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "list_responses_failed", "failed to load attempt responses")
			return
		}

		// calculate scores
		var maxPoints float64
		for _, q := range questions {
			maxPoints += q.Value
		}
		var achieved float64
		for _, resp := range responses {
			if correct, ok := answerIsCorrect[resp.TkAnswer]; ok && correct {
				if val, ok := questionValue[resp.TkQuestion]; ok {
					achieved += val
				}
			}
		}

		results = append(results, SubmissionSummary{
			QuizID:           row.TkQuiz,
			QuizTitle:        quizRow.Title,
			StartTime:        row.StartTime,
			TimeTakenSeconds: nullTimeStringToSeconds(row.TimeTaken),
			MaxPoints:        maxPoints,
			AchievedPoints:   achieved,
		})
	}

	writeJSON(w, http.StatusOK, SubmissionsResponse{
		Results: results,
		Limit:   limit,
		Offset:  offset,
	})
}
