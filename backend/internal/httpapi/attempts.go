package httpapi

import (
	"context"
	"database/sql"
	"errors"
	"net/http"
	"time"

	"github.com/ismarM/quizio/internal/db/sqlc"
)

// StartAttempt godoc
// @Summary Start attempt
// @Description Start a quiz attempt (only once per user).
// @Tags attempts
// @Produce json
// @Param userId path int true "User ID"
// @Param quizId path int true "Quiz ID"
// @Success 201 {object} AttemptDTO
// @Failure 400 {object} ErrorResponse
// @Failure 409 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/users/{userId}/quizzes/{quizId}/attempts [post]
func (api *API) StartAttempt(w http.ResponseWriter, r *http.Request) {
	quizID, err := parseIDParam(r, "quizId")
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_quiz_id", "quiz id is required")
		return
	}
	userID, err := parseIDParam(r, "userId")
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_user_id", "user id is required")
		return
	}

	quizRow, err := api.queries.GetQuizByID(r.Context(), quizID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusNotFound, "not_found", "quiz not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "get_quiz_failed", "failed to load quiz")
		return
	}

	if quizRow.IsArchived || !quizRow.PublishDate.Valid || quizRow.PublishDate.Time.After(time.Now()) {
		writeError(w, http.StatusConflict, "quiz_unavailable", "quiz is not available")
		return
	}

	attempt, err := api.queries.CreateAttempt(r.Context(), sqlc.CreateAttemptParams{
		TkQuiz: quizID,
		TkUser: userID,
	})
	if err != nil {
		if isUniqueViolation(err) {
			writeError(w, http.StatusConflict, "attempt_exists", "attempt already exists")
			return
		}
		writeError(w, http.StatusInternalServerError, "create_attempt_failed", "failed to create attempt")
		return
	}

	writeJSON(w, http.StatusCreated, attemptDTOFromAttempt(attempt))
}

// UpdateAttemptStatus godoc
// @Summary Update attempt status
// @Description Update answers during an attempt (only while active).
// @Tags attempts
// @Accept json
// @Produce json
// @Param userId path int true "User ID"
// @Param quizId path int true "Quiz ID"
// @Param request body UpdateAttemptRequest true "Update attempt"
// @Success 200 {object} AttemptResultResponse
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 409 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/users/{userId}/quizzes/{quizId}/attempts [patch]
func (api *API) UpdateAttemptStatus(w http.ResponseWriter, r *http.Request) {
	quizID, err := parseIDParam(r, "quizId")
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_quiz_id", "quiz id is required")
		return
	}
	userID, err := parseIDParam(r, "userId")
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_user_id", "user id is required")
		return
	}

	var req UpdateAttemptRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_payload", "invalid JSON payload")
		return
	}

	row, err := api.queries.GetAttemptWithQuiz(r.Context(), sqlc.GetAttemptWithQuizParams{
		TkQuiz: quizID,
		TkUser: userID,
	})
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusNotFound, "not_found", "attempt not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "get_attempt_failed", "failed to load attempt")
		return
	}

	if row.TimeTaken.Valid {
		writeError(w, http.StatusConflict, "attempt_finished", "attempt already finished")
		return
	}

	if !row.IsActive {
		finalized, err := api.queries.FinalizeAttemptIfExpired(r.Context(), row.IDAttempt)
		if err != nil && !errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusInternalServerError, "finalize_attempt_failed", "failed to finalize attempt")
			return
		}
		attemptDTO := attemptFromRow(row)
		if err == nil {
			attemptDTO = attemptDTOFromAttempt(finalized)
		} else if errors.Is(err, sql.ErrNoRows) {
			latest, err := api.queries.GetAttemptByUserQuiz(r.Context(), sqlc.GetAttemptByUserQuizParams{
				TkQuiz: quizID,
				TkUser: userID,
			})
			if err == nil {
				attemptDTO = attemptDTOFromAttempt(latest)
			}
		}
		result, err := api.buildAttemptResult(r.Context(), attemptDTO, quizID, true)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "build_results_failed", "failed to build attempt result")
			return
		}
		writeJSON(w, http.StatusOK, result)
		return
	}

	for _, update := range req.Updates {
		if update.QuestionID <= 0 || update.AnswerID <= 0 {
			writeError(w, http.StatusBadRequest, "invalid_payload", "question_id and answer_id are required")
			return
		}
		questionQuizID, err := api.queries.GetQuestionQuizID(r.Context(), update.QuestionID)
		if err != nil {
			writeError(w, http.StatusBadRequest, "invalid_payload", "question does not belong to quiz")
			return
		}
		if questionQuizID != quizID {
			writeError(w, http.StatusBadRequest, "invalid_payload", "question does not belong to quiz")
			return
		}
		_, err = api.queries.GetAnswerForQuestion(r.Context(), sqlc.GetAnswerForQuestionParams{
			IDAnswer:   update.AnswerID,
			TkQuestion: update.QuestionID,
		})
		if err != nil {
			writeError(w, http.StatusBadRequest, "invalid_payload", "answer does not belong to question")
			return
		}
		if err := api.queries.UpsertAttemptQuestion(r.Context(), sqlc.UpsertAttemptQuestionParams{
			TkAttempt:  row.IDAttempt,
			TkQuestion: update.QuestionID,
			TkAnswer:   update.AnswerID,
		}); err != nil {
			writeError(w, http.StatusInternalServerError, "update_attempt_failed", "failed to update attempt")
			return
		}
	}

	attempt := attemptFromRow(row)
	result, err := api.buildAttemptResult(r.Context(), attempt, quizID, false)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "build_results_failed", "failed to build attempt result")
		return
	}
	writeJSON(w, http.StatusOK, result)
}

// GetAttemptStatus godoc
// @Summary Get attempt status
// @Description Get attempt status for session restoration; finalize if expired.
// @Tags attempts
// @Produce json
// @Param userId path int true "User ID"
// @Param quizId path int true "Quiz ID"
// @Success 200 {object} AttemptResultResponse
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/users/{userId}/quizzes/{quizId}/attempts [get]
func (api *API) GetAttemptStatus(w http.ResponseWriter, r *http.Request) {
	quizID, err := parseIDParam(r, "quizId")
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_quiz_id", "quiz id is required")
		return
	}
	userID, err := parseIDParam(r, "userId")
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_user_id", "user id is required")
		return
	}

	row, err := api.queries.GetAttemptWithQuiz(r.Context(), sqlc.GetAttemptWithQuizParams{
		TkQuiz: quizID,
		TkUser: userID,
	})
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusNotFound, "not_found", "attempt not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "get_attempt_failed", "failed to load attempt")
		return
	}

	if row.TimeTaken.Valid {
		result, err := api.buildAttemptResult(r.Context(), attemptFromRow(row), quizID, true)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "build_results_failed", "failed to build attempt result")
			return
		}
		writeJSON(w, http.StatusOK, result)
		return
	}

	if !row.IsActive {
		finalized, err := api.queries.FinalizeAttemptIfExpired(r.Context(), row.IDAttempt)
		if err != nil && !errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusInternalServerError, "finalize_attempt_failed", "failed to finalize attempt")
			return
		}
		attempt := attemptFromRow(row)
		if err == nil {
			attempt = attemptDTOFromAttempt(finalized)
		} else if errors.Is(err, sql.ErrNoRows) {
			latest, err := api.queries.GetAttemptByUserQuiz(r.Context(), sqlc.GetAttemptByUserQuizParams{
				TkQuiz: quizID,
				TkUser: userID,
			})
			if err == nil {
				attempt = attemptDTOFromAttempt(latest)
			}
		}
		result, err := api.buildAttemptResult(r.Context(), attempt, quizID, true)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "build_results_failed", "failed to build attempt result")
			return
		}
		writeJSON(w, http.StatusOK, result)
		return
	}

	attempt := attemptFromRow(row)
	result, err := api.buildAttemptResult(r.Context(), attempt, quizID, false)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "build_results_failed", "failed to build attempt result")
		return
	}
	writeJSON(w, http.StatusOK, result)
}

// FinishAttempt godoc
// @Summary Finish attempt
// @Description Finish an attempt and return raw results.
// @Tags attempts
// @Produce json
// @Param userId path int true "User ID"
// @Param quizId path int true "Quiz ID"
// @Success 200 {object} AttemptResultResponse
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/users/{userId}/quizzes/{quizId}/attempts/finish [post]
func (api *API) FinishAttempt(w http.ResponseWriter, r *http.Request) {
	quizID, err := parseIDParam(r, "quizId")
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_quiz_id", "quiz id is required")
		return
	}
	userID, err := parseIDParam(r, "userId")
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_user_id", "user id is required")
		return
	}

	attempt, err := api.queries.GetAttemptByUserQuiz(r.Context(), sqlc.GetAttemptByUserQuizParams{
		TkQuiz: quizID,
		TkUser: userID,
	})
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusNotFound, "not_found", "attempt not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "get_attempt_failed", "failed to load attempt")
		return
	}

	attemptDTO := attemptDTOFromAttempt(attempt)
	if !attempt.TimeTaken.Valid {
		finalized, err := api.queries.FinalizeAttempt(r.Context(), attempt.IDAttempt)
		if err != nil {
			if !errors.Is(err, sql.ErrNoRows) {
				writeError(w, http.StatusInternalServerError, "finalize_attempt_failed", "failed to finalize attempt")
				return
			}
		} else {
			attemptDTO = attemptDTOFromAttempt(finalized)
		}
		if errors.Is(err, sql.ErrNoRows) {
			latest, err := api.queries.GetAttemptByUserQuiz(r.Context(), sqlc.GetAttemptByUserQuizParams{
				TkQuiz: quizID,
				TkUser: userID,
			})
			if err == nil {
				attemptDTO = attemptDTOFromAttempt(latest)
			}
		}
	}

	result, err := api.buildAttemptResult(r.Context(), attemptDTO, quizID, true)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "build_results_failed", "failed to build attempt result")
		return
	}

	writeJSON(w, http.StatusOK, result)
}

func (api *API) buildAttemptResult(ctx context.Context, attempt AttemptDTO, quizID int32, includeCorrect bool) (AttemptResultResponse, error) {
	quizRow, err := api.queries.GetQuizByID(ctx, quizID)
	if err != nil {
		return AttemptResultResponse{}, err
	}
	questions, err := api.loadQuizQuestions(ctx, quizID, includeCorrect)
	if err != nil {
		return AttemptResultResponse{}, err
	}
	responses, err := api.queries.ListAttemptQuestions(ctx, attempt.ID)
	if err != nil {
		return AttemptResultResponse{}, err
	}

	quizDTO := quizFromQuizRow(quizRow, int32(len(questions)))
	return AttemptResultResponse{
		Attempt:   attempt,
		Quiz:      quizDTO,
		Questions: questions,
		Responses: mapAttemptResponses(responses),
	}, nil
}

func (api *API) loadQuizQuestions(ctx context.Context, quizID int32, includeCorrect bool) ([]QuestionDTO, error) {
	questionRows, err := api.queries.ListQuestionsByQuiz(ctx, quizID)
	if err != nil {
		return nil, err
	}

	questions := make([]QuestionDTO, 0, len(questionRows))
	for _, question := range questionRows {
		answersRows, err := api.queries.ListAnswersByQuestion(ctx, question.IDQuestion)
		if err != nil {
			return nil, err
		}
		answers := make([]AnswerDTO, 0, len(answersRows))
		for _, answer := range answersRows {
			isCorrect := answer.IsCorrect
			if !includeCorrect {
				isCorrect = false
			}
			answers = append(answers, AnswerDTO{
				ID:        answer.IDAnswer,
				Title:     answer.Title,
				IsCorrect: isCorrect,
			})
		}
		questions = append(questions, QuestionDTO{
			ID:      question.IDQuestion,
			Title:   question.Title,
			Value:   question.Value,
			QuizID:  question.TkQuiz,
			Answers: answers,
		})
	}

	return questions, nil
}

func attemptDTOFromAttempt(attempt sqlc.QuizioAttempt) AttemptDTO {
	return AttemptDTO{
		ID:               attempt.IDAttempt,
		StartTime:        attempt.StartTime,
		TimeTakenSeconds: nullTimeToSeconds(attempt.TimeTaken),
		QuizID:           attempt.TkQuiz,
		UserID:           attempt.TkUser,
	}
}

func attemptFromRow(row sqlc.GetAttemptWithQuizRow) AttemptDTO {
	return AttemptDTO{
		ID:               row.IDAttempt,
		StartTime:        row.StartTime,
		TimeTakenSeconds: nullTimeToSeconds(row.TimeTaken),
		QuizID:           row.TkQuiz,
		UserID:           row.TkUser,
	}
}

func mapAttemptResponses(rows []sqlc.QuizioAttemptQuestion) []AttemptQuestionDTO {
	responses := make([]AttemptQuestionDTO, 0, len(rows))
	for _, row := range rows {
		responses = append(responses, AttemptQuestionDTO{
			QuestionID: row.TkQuestion,
			AnswerID:   row.TkAnswer,
		})
	}
	return responses
}
