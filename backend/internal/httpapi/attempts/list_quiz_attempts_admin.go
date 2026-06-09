package attempts

import (
	"database/sql"
	"errors"
	"net/http"
	"strings"
)

// ListQuizAttemptsAdmin godoc
// @Summary List all attempts for a quiz (admin only)
// @Description Retrieve a list of all attempts on a quiz with start time, time taken, user name, and score achieved.
// @Tags attempts
// @Produce json
// @Param quizId path int true "Quiz ID"
// @Success 200 {object} QuizAttemptsResponse
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 403 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/quizzes/{quizId}/attempts/admin [get]
func (h *Handler) ListQuizAttemptsAdmin(w http.ResponseWriter, r *http.Request) {
	quizID, err := parseIDParam(r, "quizId")
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_quiz_id", "quiz id is required")
		return
	}

	claims, ok := UserFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized", "unauthorized")
		return
	}

	if !claims.IsAdmin {
		writeError(w, http.StatusForbidden, "forbidden", "only admins can list all attempts")
		return
	}

	// Verify quiz exists
	_, err = h.queries.GetQuizByID(r.Context(), quizID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusNotFound, "not_found", "quiz not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "get_quiz_failed", "failed to load quiz")
		return
	}

	questions, err := h.loadQuizQuestions(r.Context(), quizID, true)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "load_questions_failed", "failed to load quiz questions")
		return
	}

	questionValue := make(map[int32]float64, len(questions))
	answerIsCorrect := make(map[int32]bool)
	for _, q := range questions {
		questionValue[q.ID] = q.Value
		for _, a := range q.Answers {
			answerIsCorrect[a.ID] = a.IsCorrect
		}
	}

	attempts, err := h.queries.ListAttemptsByQuiz(r.Context(), quizID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "list_attempts_failed", "failed to list attempts")
		return
	}

	attemptsDTO := make([]QuizAttemptDTO, 0, len(attempts))
	for _, att := range attempts {
		responses, err := h.queries.ListAttemptQuestions(r.Context(), att.IDAttempt)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "load_responses_failed", "failed to load attempt responses")
			return
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

		if att.UserName == "" {
			at := strings.Index(att.UserEmail, "@")
			if at > 0 {
				att.UserName = att.UserEmail[:at]
			} else {
				att.UserName = att.UserEmail // no @ found, use full email
			}
		}

		attemptsDTO = append(attemptsDTO, QuizAttemptDTO{
			IDAttempt:        att.IDAttempt,
			UserID:           att.TkUser,
			UserName:         att.UserName,
			StartTime:        att.StartTime,
			TimeTakenSeconds: timeTakenSecs,
			ScoreAchieved:    achieved,
		})
	}

	writeJSON(w, http.StatusOK, QuizAttemptsResponse{Attempts: attemptsDTO})
}
