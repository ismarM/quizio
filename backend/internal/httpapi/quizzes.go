package httpapi

import (
	"context"
	"database/sql"
	"errors"
	"net/http"
	"time"

	"github.com/ismarM/quizio/internal/db/sqlc"
)

// CreateQuiz godoc
// @Summary Create quiz
// @Description Create a quiz with questions and answers.
// @Tags quizzes
// @Accept json
// @Produce json
// @Param request body CreateQuizRequest true "Create quiz request"
// @Success 201 {object} QuizFullResponse
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 403 {object} ErrorResponse
// @Failure 409 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/quizzes [post]
func (api *API) CreateQuiz(w http.ResponseWriter, r *http.Request) {
	claims, ok := UserFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized", "unauthorized")
		return
	}
	if !claims.IsAdmin {
		writeError(w, http.StatusForbidden, "forbidden", "only admins can create quizzes")
		return
	}

	var req CreateQuizRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_payload", "invalid JSON payload")
		return
	}

	if req.Title == "" {
		writeError(w, http.StatusBadRequest, "invalid_payload", "title is required")
		return
	}
	if req.TimeLimitSeconds <= 0 {
		writeError(w, http.StatusBadRequest, "invalid_payload", "time_limit_seconds must be positive")
		return
	}
	if len(req.Questions) == 0 {
		writeError(w, http.StatusBadRequest, "invalid_payload", "questions are required")
		return
	}

	ctx := r.Context()
	tx, err := api.db.BeginTx(ctx, nil)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "tx_failed", "failed to start transaction")
		return
	}
	defer func() {
		_ = tx.Rollback()
	}()

	qtx := api.queries.WithTx(tx)
	quizRow, err := qtx.CreateQuiz(ctx, sqlc.CreateQuizParams{
		Title:       req.Title,
		Secs:        float64(req.TimeLimitSeconds),
		Description: toNullString(req.Description),
		TkUser:      claims.ID,
	})
	if err != nil {
		if isUniqueViolation(err) {
			writeError(w, http.StatusConflict, "quiz_exists", "quiz title already exists")
			return
		}
		writeError(w, http.StatusInternalServerError, "create_quiz_failed", "failed to create quiz")
		return
	}

	questions := make([]QuestionDTO, 0, len(req.Questions))
	for _, question := range req.Questions {
		if question.Title == "" {
			writeError(w, http.StatusBadRequest, "invalid_payload", "question title is required")
			return
		}
		if len(question.Answers) == 0 {
			writeError(w, http.StatusBadRequest, "invalid_payload", "question answers are required")
			return
		}
		questionRow, err := qtx.CreateQuestion(ctx, sqlc.CreateQuestionParams{
			Title:  question.Title,
			Value:  question.Value,
			TkQuiz: quizRow.IDQuiz,
		})
		if err != nil {
			writeError(w, http.StatusInternalServerError, "create_question_failed", "failed to create question")
			return
		}

		answers := make([]AnswerDTO, 0, len(question.Answers))
		for _, answer := range question.Answers {
			if answer.Title == "" {
				writeError(w, http.StatusBadRequest, "invalid_payload", "answer title is required")
				return
			}
			answerRow, err := qtx.CreateAnswer(ctx, sqlc.CreateAnswerParams{
				Title:      answer.Title,
				TkQuestion: questionRow.IDQuestion,
				IsCorrect:  answer.IsCorrect,
			})
			if err != nil {
				writeError(w, http.StatusInternalServerError, "create_answer_failed", "failed to create answer")
				return
			}
			answers = append(answers, AnswerDTO{
				ID:        answerRow.IDAnswer,
				Title:     answerRow.Title,
				IsCorrect: answerRow.IsCorrect,
			})
		}

		questions = append(questions, QuestionDTO{
			ID:      questionRow.IDQuestion,
			Title:   questionRow.Title,
			Value:   questionRow.Value,
			QuizID:  questionRow.TkQuiz,
			Answers: answers,
		})
	}

	if err := tx.Commit(); err != nil {
		writeError(w, http.StatusInternalServerError, "commit_failed", "failed to commit quiz")
		return
	}

	quizDTO := QuizDTO{
		ID:               quizRow.IDQuiz,
		Title:            quizRow.Title,
		Description:      nullStringPtr(quizRow.Description),
		CreatedAt:        quizRow.CreatedAt,
		PublishDate:      nullTimePtr(quizRow.PublishDate),
		OwnerID:          quizRow.TkUser,
		IsArchived:       quizRow.IsArchived,
		TimeLimitSeconds: quizRow.TimeLimitSeconds,
		QuestionCount:    int32Ptr(int32(len(questions))),
	}

	writeJSON(w, http.StatusCreated, QuizFullResponse{
		Quiz:      quizDTO,
		Questions: questions,
	})
}

// UpdateQuiz godoc
// @Summary Update quiz
// @Description Update quiz metadata (only when not published).
// @Tags quizzes
// @Accept json
// @Produce json
// @Param quizId path int true "Quiz ID"
// @Param request body UpdateQuizRequest true "Update quiz"
// @Success 200 {object} QuizResponse
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 403 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 409 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/quizzes/{quizId} [put]
func (api *API) UpdateQuiz(w http.ResponseWriter, r *http.Request) {
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
		writeError(w, http.StatusForbidden, "forbidden", "only admins can update quizzes")
		return
	}

	var req UpdateQuizRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_payload", "invalid JSON payload")
		return
	}

	if req.Title == "" {
		writeError(w, http.StatusBadRequest, "invalid_payload", "title is required")
		return
	}
	if req.TimeLimitSeconds <= 0 {
		writeError(w, http.StatusBadRequest, "invalid_payload", "time_limit_seconds must be positive")
		return
	}

	state, err := api.queries.GetQuizState(r.Context(), quizID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusNotFound, "not_found", "quiz not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "get_quiz_failed", "failed to load quiz")
		return
	}
	if state.TkUser != claims.ID {
		writeError(w, http.StatusForbidden, "forbidden", "only the quiz owner can update it")
		return
	}
	if state.IsArchived || state.PublishDate.Valid {
		writeError(w, http.StatusConflict, "quiz_locked", "quiz is already published")
		return
	}

	updated, err := api.queries.UpdateQuiz(r.Context(), sqlc.UpdateQuizParams{
		IDQuiz:      quizID,
		Title:       req.Title,
		Description: toNullString(req.Description),
		Secs:        float64(req.TimeLimitSeconds),
	})
	if err != nil {
		if isUniqueViolation(err) {
			writeError(w, http.StatusConflict, "quiz_exists", "quiz title already exists")
			return
		}
		writeError(w, http.StatusInternalServerError, "update_quiz_failed", "failed to update quiz")
		return
	}

	quizDTO := quizFromUpdateRow(updated)
	writeJSON(w, http.StatusOK, QuizResponse{Quiz: quizDTO})
}

// GetQuizInfo godoc
// @Summary Get quiz info
// @Description Get quiz info for published quizzes.
// @Tags quizzes
// @Produce json
// @Param quizId path int true "Quiz ID"
// @Success 200 {object} QuizResponse
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/quizzes/{quizId}/info [get]
func (api *API) GetQuizInfo(w http.ResponseWriter, r *http.Request) {
	quizID, err := parseIDParam(r, "quizId")
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_quiz_id", "quiz id is required")
		return
	}

	row, err := api.queries.GetQuizInfo(r.Context(), quizID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusNotFound, "not_found", "quiz not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "get_quiz_failed", "failed to load quiz")
		return
	}

	if row.IsArchived || !row.PublishDate.Valid || row.PublishDate.Time.After(time.Now()) {
		writeError(w, http.StatusNotFound, "not_found", "quiz not found")
		return
	}

	quizDTO := quizFromInfoRow(row)
	writeJSON(w, http.StatusOK, QuizResponse{Quiz: quizDTO})
}

// GetFullQuiz godoc
// @Summary Get full quiz
// @Description Get the full quiz definition (only for admin/owner).
// @Tags quizzes
// @Produce json
// @Param quizId path int true "Quiz ID"
// @Success 200 {object} QuizFullResponse
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 403 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/quizzes/{quizId} [get]
func (api *API) GetFullQuiz(w http.ResponseWriter, r *http.Request) {
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

	quizRow, err := api.queries.GetQuizByID(r.Context(), quizID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusNotFound, "not_found", "quiz not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "get_quiz_failed", "failed to load quiz")
		return
	}

	if !claims.IsAdmin || quizRow.TkUser != claims.ID {
		writeError(w, http.StatusForbidden, "forbidden", "only the quiz owner can view the full quiz details")
		return
	}

	questions, err := api.loadQuizQuestions(r.Context(), quizID, true)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "load_questions_failed", "failed to load quiz questions")
		return
	}

	quizDTO := quizFromQuizRow(quizRow, int32(len(questions)))
	writeJSON(w, http.StatusOK, QuizFullResponse{Quiz: quizDTO, Questions: questions})
}

// PublishQuiz godoc
// @Summary Publish quiz
// @Description Publish a quiz immediately or schedule a publish date.
// @Tags quizzes
// @Accept json
// @Produce json
// @Param quizId path int true "Quiz ID"
// @Param request body PublishQuizRequest true "Publish quiz"
// @Success 200 {object} QuizResponse
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 403 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 409 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/quizzes/{quizId}/publish [patch]
func (api *API) PublishQuiz(w http.ResponseWriter, r *http.Request) {
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
		writeError(w, http.StatusForbidden, "forbidden", "only admins can publish quizzes")
		return
	}

	var req PublishQuizRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_payload", "invalid JSON payload")
		return
	}

	state, err := api.queries.GetQuizState(r.Context(), quizID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusNotFound, "not_found", "quiz not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "get_quiz_failed", "failed to load quiz")
		return
	}
	if state.TkUser != claims.ID {
		writeError(w, http.StatusForbidden, "forbidden", "only the quiz owner can publish it")
		return
	}
	if state.PublishDate.Valid {
		writeError(w, http.StatusConflict, "quiz_locked", "quiz is already published")
		return
	}

	publishTime := time.Now()
	if req.PublishDate != nil {
		publishTime = *req.PublishDate
	}

	updated, err := api.queries.SetQuizPublishDate(r.Context(), sqlc.SetQuizPublishDateParams{
		IDQuiz:      quizID,
		PublishDate: sql.NullTime{Time: publishTime, Valid: true},
	})
	if err != nil {
		writeError(w, http.StatusInternalServerError, "publish_quiz_failed", "failed to publish quiz")
		return
	}

	quizDTO := quizFromPublishRow(updated)
	writeJSON(w, http.StatusOK, QuizResponse{Quiz: quizDTO})
}

// ArchiveQuiz godoc
// @Summary Archive quiz
// @Description Archive or unarchive a quiz.
// @Tags quizzes
// @Accept json
// @Produce json
// @Param quizId path int true "Quiz ID"
// @Param request body ArchiveQuizRequest true "Archive quiz"
// @Success 200 {object} QuizResponse
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 403 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/quizzes/{quizId}/archive [patch]
func (api *API) ArchiveQuiz(w http.ResponseWriter, r *http.Request) {
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
		writeError(w, http.StatusForbidden, "forbidden", "only admins can archive quizzes")
		return
	}

	var req ArchiveQuizRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_payload", "invalid JSON payload")
		return
	}

	state, err := api.queries.GetQuizState(r.Context(), quizID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusNotFound, "not_found", "quiz not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "get_quiz_failed", "failed to load quiz")
		return
	}
	if state.TkUser != claims.ID {
		writeError(w, http.StatusForbidden, "forbidden", "only the quiz owner can archive it")
		return
	}

	updated, err := api.queries.ArchiveQuiz(r.Context(), sqlc.ArchiveQuizParams{
		IDQuiz:     quizID,
		IsArchived: req.IsArchived,
	})
	if err != nil {
		writeError(w, http.StatusInternalServerError, "archive_quiz_failed", "failed to archive quiz")
		return
	}

	quizDTO := quizFromArchiveRow(updated)
	writeJSON(w, http.StatusOK, QuizResponse{Quiz: quizDTO})
}

// DeleteQuiz godoc
// @Summary Delete quiz
// @Description Delete a quiz and all related data.
// @Tags quizzes
// @Produce json
// @Param quizId path int true "Quiz ID"
// @Success 204
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 403 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/quizzes/{quizId} [delete]
func (api *API) DeleteQuiz(w http.ResponseWriter, r *http.Request) {
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
		writeError(w, http.StatusForbidden, "forbidden", "only admins can delete quizzes")
		return
	}

	state, err := api.queries.GetQuizState(r.Context(), quizID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusNotFound, "not_found", "quiz not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "get_quiz_failed", "failed to load quiz")
		return
	}
	if state.TkUser != claims.ID {
		writeError(w, http.StatusForbidden, "forbidden", "only the quiz owner can delete it")
		return
	}

	if err := api.queries.DeleteQuiz(r.Context(), quizID); err != nil {
		writeError(w, http.StatusInternalServerError, "delete_quiz_failed", "failed to delete quiz")
		return
	}

	writeJSON(w, http.StatusNoContent, nil)
}

// ListPublishedQuizzes godoc
// ListQuizzes godoc
// @Summary List quizzes
// @Description List quizzes with filters and pagination.
// @Tags quizzes
// @Produce json
// @Param scope query string false "published|active|archived" default(active)
// @Param title query string false "Filter by title"
// @Param owner_id query int false "Filter by owner id"
// @Param submitted_only query bool false "Only quizzes the user submitted"
// @Param submitted_by query int false "User id for submitted_only filter"
// @Param limit query int false "Limit"
// @Param offset query int false "Offset"
// @Success 200 {object} QuizListResponse
// @Failure 400 {object} ErrorResponse
// @Failure 401 {object} ErrorResponse
// @Failure 403 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/quizzes [get]
func (api *API) ListQuizzes(w http.ResponseWriter, r *http.Request) {
	claims, ok := UserFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "unauthorized", "unauthorized")
		return
	}

	scope := r.URL.Query().Get("scope")
	if scope == "" {
		if claims.IsAdmin {
			scope = "active"
		} else {
			scope = "published"
		}
	}

	if !claims.IsAdmin && scope != "published" {
		writeError(w, http.StatusForbidden, "forbidden", "only admins can list unpublished or archived quizzes")
		return
	}

	title := r.URL.Query().Get("title")
	ownerID, err := parseQueryInt32(r, "owner_id", 0)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_query", "invalid owner_id")
		return
	}
	if ownerID < 0 {
		writeError(w, http.StatusBadRequest, "invalid_query", "owner_id must be non-negative")
		return
	}
	submittedOnly, err := parseQueryBool(r, "submitted_only", false)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid_query", "invalid submitted_only")
		return
	}
	var submittedBy int32
	if submittedOnly {
		submittedBy = claims.ID
	}

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
		writeError(w, http.StatusBadRequest, "invalid_query", "offset must be non-negative")
		return
	}

	var (
		rows    []QuizDTO
		loadErr error
	)

	switch scope {
	case "published":
		rows, loadErr = api.loadPublishedQuizzes(r.Context(), title, ownerID, submittedOnly, submittedBy, limit, offset)
	case "archived":
		rows, loadErr = api.loadArchivedQuizzes(r.Context(), title, ownerID, submittedOnly, submittedBy, limit, offset)
	default:
		rows, loadErr = api.loadActiveQuizzes(r.Context(), title, ownerID, submittedOnly, submittedBy, limit, offset)
	}
	if loadErr != nil {
		writeError(w, http.StatusInternalServerError, "list_quizzes_failed", "failed to list quizzes")
		return
	}

	writeJSON(w, http.StatusOK, QuizListResponse{
		Quizzes: rows,
		Limit:   limit,
		Offset:  offset,
	})
}

func (api *API) loadPublishedQuizzes(ctx context.Context, title string, ownerID int32, submittedOnly bool, submittedBy int32, limit, offset int32) ([]QuizDTO, error) {
	rows, err := api.queries.ListPublishedQuizzes(ctx, sqlc.ListPublishedQuizzesParams{
		Column1: title,
		Column2: ownerID,
		Column3: submittedOnly,
		TkUser:  submittedBy,
		Limit:   limit,
		Offset:  offset,
	})
	if err != nil {
		return nil, err
	}
	results := make([]QuizDTO, 0, len(rows))
	for _, row := range rows {
		results = append(results, quizFromListRow(row.IDQuiz, row.Title, row.Description, row.CreatedAt, row.PublishDate, row.TkUser, row.IsArchived, row.TimeLimitSeconds, row.QuestionCount))
	}
	return results, nil
}

func (api *API) loadActiveQuizzes(ctx context.Context, title string, ownerID int32, submittedOnly bool, submittedBy int32, limit, offset int32) ([]QuizDTO, error) {
	rows, err := api.queries.ListActiveQuizzes(ctx, sqlc.ListActiveQuizzesParams{
		Column1: title,
		Column2: ownerID,
		Column3: submittedOnly,
		TkUser:  submittedBy,
		Limit:   limit,
		Offset:  offset,
	})
	if err != nil {
		return nil, err
	}
	results := make([]QuizDTO, 0, len(rows))
	for _, row := range rows {
		results = append(results, quizFromListRow(row.IDQuiz, row.Title, row.Description, row.CreatedAt, row.PublishDate, row.TkUser, row.IsArchived, row.TimeLimitSeconds, row.QuestionCount))
	}
	return results, nil
}

func (api *API) loadArchivedQuizzes(ctx context.Context, title string, ownerID int32, submittedOnly bool, submittedBy int32, limit, offset int32) ([]QuizDTO, error) {
	rows, err := api.queries.ListArchivedQuizzes(ctx, sqlc.ListArchivedQuizzesParams{
		Column1: title,
		Column2: ownerID,
		Column3: submittedOnly,
		TkUser:  submittedBy,
		Limit:   limit,
		Offset:  offset,
	})
	if err != nil {
		return nil, err
	}
	results := make([]QuizDTO, 0, len(rows))
	for _, row := range rows {
		results = append(results, quizFromListRow(row.IDQuiz, row.Title, row.Description, row.CreatedAt, row.PublishDate, row.TkUser, row.IsArchived, row.TimeLimitSeconds, row.QuestionCount))
	}
	return results, nil
}

func quizFromInfoRow(row sqlc.GetQuizInfoRow) QuizDTO {
	count := row.QuestionCount
	return QuizDTO{
		ID:               row.IDQuiz,
		Title:            row.Title,
		Description:      nullStringPtr(row.Description),
		CreatedAt:        row.CreatedAt,
		PublishDate:      nullTimePtr(row.PublishDate),
		OwnerID:          row.TkUser,
		IsArchived:       row.IsArchived,
		TimeLimitSeconds: row.TimeLimitSeconds,
		QuestionCount:    int32Ptr(count),
	}
}

func quizFromQuizRow(row sqlc.GetQuizByIDRow, questionCount int32) QuizDTO {
	return QuizDTO{
		ID:               row.IDQuiz,
		Title:            row.Title,
		Description:      nullStringPtr(row.Description),
		CreatedAt:        row.CreatedAt,
		PublishDate:      nullTimePtr(row.PublishDate),
		OwnerID:          row.TkUser,
		IsArchived:       row.IsArchived,
		TimeLimitSeconds: row.TimeLimitSeconds,
		QuestionCount:    int32Ptr(questionCount),
	}
}

func quizFromUpdateRow(row sqlc.UpdateQuizRow) QuizDTO {
	return QuizDTO{
		ID:               row.IDQuiz,
		Title:            row.Title,
		Description:      nullStringPtr(row.Description),
		CreatedAt:        row.CreatedAt,
		PublishDate:      nullTimePtr(row.PublishDate),
		OwnerID:          row.TkUser,
		IsArchived:       row.IsArchived,
		TimeLimitSeconds: row.TimeLimitSeconds,
	}
}

func quizFromPublishRow(row sqlc.SetQuizPublishDateRow) QuizDTO {
	return QuizDTO{
		ID:               row.IDQuiz,
		Title:            row.Title,
		Description:      nullStringPtr(row.Description),
		CreatedAt:        row.CreatedAt,
		PublishDate:      nullTimePtr(row.PublishDate),
		OwnerID:          row.TkUser,
		IsArchived:       row.IsArchived,
		TimeLimitSeconds: row.TimeLimitSeconds,
	}
}

func quizFromArchiveRow(row sqlc.ArchiveQuizRow) QuizDTO {
	return QuizDTO{
		ID:               row.IDQuiz,
		Title:            row.Title,
		Description:      nullStringPtr(row.Description),
		CreatedAt:        row.CreatedAt,
		PublishDate:      nullTimePtr(row.PublishDate),
		OwnerID:          row.TkUser,
		IsArchived:       row.IsArchived,
		TimeLimitSeconds: row.TimeLimitSeconds,
	}
}

func quizFromListRow(id int32, title string, description sql.NullString, createdAt time.Time, publishDate sql.NullTime, ownerID int32, isArchived bool, timeLimitSeconds int32, questionCount int32) QuizDTO {
	count := questionCount
	return QuizDTO{
		ID:               id,
		Title:            title,
		Description:      nullStringPtr(description),
		CreatedAt:        createdAt,
		PublishDate:      nullTimePtr(publishDate),
		OwnerID:          ownerID,
		IsArchived:       isArchived,
		TimeLimitSeconds: timeLimitSeconds,
		QuestionCount:    int32Ptr(count),
	}
}

func int32Ptr(value int32) *int32 {
	return &value
}
