-- Users
-- name: CreateUser :one
INSERT INTO quizio."User" (
	email,
	is_admin,
	displayName,
	language,
	theme,
	profile_picture
)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING id_User, email, is_admin, displayName, language, theme, profile_picture;

-- name: GetUserByID :one
SELECT id_User, email, is_admin, displayName, language, theme, profile_picture
FROM quizio."User"
WHERE id_User = $1;

-- name: GetUserByEmail :one
SELECT id_User, email, is_admin, displayName, language, theme, profile_picture
FROM quizio."User"
WHERE email = $1;

-- name: UpdateUserDisplayName :one
UPDATE quizio."User"
SET displayName = $2
WHERE id_User = $1
RETURNING id_User, email, is_admin, displayName, language, theme, profile_picture;

-- name: UpdateUserRole :one
UPDATE quizio."User"
SET is_admin = $2
WHERE id_User = $1
RETURNING id_User, email, is_admin, displayName, language, theme, profile_picture;

-- name: UpdateUserPreferences :one
UPDATE quizio."User"
SET language = $2,
		theme = $3
WHERE id_User = $1
RETURNING id_User, email, is_admin, displayName, language, theme, profile_picture;

-- name: DeleteUser :exec
DELETE FROM quizio."User"
WHERE id_User = $1;

-- Quizzes
-- name: CreateQuiz :one
INSERT INTO quizio."Quiz" (
	title,
	time_limit,
	description,
	tk_User
)
VALUES ($1, make_interval(secs => $2), $3, $4)
RETURNING id_Quiz,
	title,
	description,
	created_at,
	publish_date,
	tk_User,
	is_archived,
	EXTRACT(EPOCH FROM time_limit)::int AS time_limit_seconds;

-- name: UpdateQuiz :one
UPDATE quizio."Quiz"
SET title = $2,
		description = $3,
		time_limit = make_interval(secs => $4)
WHERE id_Quiz = $1
RETURNING id_Quiz,
	title,
	description,
	created_at,
	publish_date,
	tk_User,
	is_archived,
	EXTRACT(EPOCH FROM time_limit)::int AS time_limit_seconds;

-- name: SetQuizPublishDate :one
UPDATE quizio."Quiz"
SET publish_date = $2
WHERE id_Quiz = $1
RETURNING id_Quiz,
	title,
	description,
	created_at,
	publish_date,
	tk_User,
	is_archived,
	EXTRACT(EPOCH FROM time_limit)::int AS time_limit_seconds;

-- name: ArchiveQuiz :one
UPDATE quizio."Quiz"
SET is_archived = $2
WHERE id_Quiz = $1
RETURNING id_Quiz,
	title,
	description,
	created_at,
	publish_date,
	tk_User,
	is_archived,
	EXTRACT(EPOCH FROM time_limit)::int AS time_limit_seconds;

-- name: DeleteQuiz :exec
DELETE FROM quizio."Quiz"
WHERE id_Quiz = $1;

-- name: GetQuizByID :one
SELECT id_Quiz,
	title,
	description,
	created_at,
	publish_date,
	tk_User,
	is_archived,
	EXTRACT(EPOCH FROM time_limit)::int AS time_limit_seconds
FROM quizio."Quiz"
WHERE id_Quiz = $1;

-- name: GetQuizState :one
SELECT id_Quiz, tk_User, publish_date, is_archived
FROM quizio."Quiz"
WHERE id_Quiz = $1;

-- name: GetQuizInfo :one
SELECT q.id_Quiz,
	q.title,
	q.description,
	q.created_at,
	q.publish_date,
	q.tk_User,
	q.is_archived,
	EXTRACT(EPOCH FROM q.time_limit)::int AS time_limit_seconds,
	COUNT(qq.id_Question)::int AS question_count
FROM quizio."Quiz" q
LEFT JOIN quizio."Question" qq ON qq.tk_Quiz = q.id_Quiz
WHERE q.id_Quiz = $1
GROUP BY q.id_Quiz;

-- name: ListPublishedQuizzes :many
SELECT q.id_Quiz,
	q.title,
	q.description,
	q.created_at,
	q.publish_date,
	q.tk_User,
	q.is_archived,
	EXTRACT(EPOCH FROM q.time_limit)::int AS time_limit_seconds,
	COUNT(qq.id_Question)::int AS question_count
FROM quizio."Quiz" q
LEFT JOIN quizio."Question" qq ON qq.tk_Quiz = q.id_Quiz
WHERE q.is_archived = FALSE
	AND q.publish_date IS NOT NULL
	AND q.publish_date <= NOW()
	AND ($1 = '' OR q.title ILIKE '%' || $1 || '%')
	AND ($2 = 0 OR q.tk_User = $2)
	AND ($3 = FALSE OR EXISTS (
		SELECT 1
		FROM quizio."Attempt" a
		WHERE a.tk_Quiz = q.id_Quiz
			AND a.tk_User = $4
	))
GROUP BY q.id_Quiz
ORDER BY q.publish_date DESC
LIMIT $5 OFFSET $6;

-- name: ListNotPublishedQuizzes :many
SELECT q.id_Quiz,
	q.title,
	q.description,
	q.created_at,
	q.publish_date,
	q.tk_User,
	q.is_archived,
	EXTRACT(EPOCH FROM q.time_limit)::int AS time_limit_seconds,
	COUNT(qq.id_Question)::int AS question_count
FROM quizio."Quiz" q
LEFT JOIN quizio."Question" qq ON qq.tk_Quiz = q.id_Quiz
WHERE q.is_archived = FALSE
	AND ($1 = '' OR q.title ILIKE '%' || $1 || '%')
	AND ($2 = 0 OR q.tk_User = $2)
	AND ($3 = FALSE OR EXISTS (
		SELECT 1
		FROM quizio."Attempt" a
		WHERE a.tk_Quiz = q.id_Quiz
			AND a.tk_User = $4
	))
GROUP BY q.id_Quiz
ORDER BY q.created_at DESC
LIMIT $5 OFFSET $6;

-- name: ListArchivedQuizzes :many
SELECT q.id_Quiz,
	q.title,
	q.description,
	q.created_at,
	q.publish_date,
	q.tk_User,
	q.is_archived,
	EXTRACT(EPOCH FROM q.time_limit)::int AS time_limit_seconds,
	COUNT(qq.id_Question)::int AS question_count
FROM quizio."Quiz" q
LEFT JOIN quizio."Question" qq ON qq.tk_Quiz = q.id_Quiz
WHERE q.is_archived = TRUE
	AND ($1 = '' OR q.title ILIKE '%' || $1 || '%')
	AND ($2 = 0 OR q.tk_User = $2)
	AND ($3 = FALSE OR EXISTS (
		SELECT 1
		FROM quizio."Attempt" a
		WHERE a.tk_Quiz = q.id_Quiz
			AND a.tk_User = $4
	))
GROUP BY q.id_Quiz
ORDER BY q.created_at DESC
LIMIT $5 OFFSET $6;

-- Questions
-- name: CreateQuestion :one
INSERT INTO quizio."Question" (title, value, tk_Quiz)
VALUES ($1, $2, $3)
RETURNING id_Question, title, value, tk_Quiz;

-- name: UpdateQuestion :one
UPDATE quizio."Question"
SET title = $2,
		value = $3
WHERE id_Question = $1
RETURNING id_Question, title, value, tk_Quiz;

-- name: DeleteQuestion :exec
DELETE FROM quizio."Question"
WHERE id_Question = $1;

-- name: ListQuestionsByQuiz :many
SELECT id_Question, title, value, tk_Quiz
FROM quizio."Question"
WHERE tk_Quiz = $1
ORDER BY id_Question;

-- Answers
-- name: CreateAnswer :one
INSERT INTO quizio."Answer" (title, tk_Question, is_correct)
VALUES ($1, $2, $3)
RETURNING id_Answer, title, tk_Question, is_correct;

-- name: ListAnswersByQuestion :many
SELECT id_Answer, title, tk_Question, is_correct
FROM quizio."Answer"
WHERE tk_Question = $1
ORDER BY id_Answer;

-- name: DeleteAnswersByQuestion :exec
DELETE FROM quizio."Answer"
WHERE tk_Question = $1;

-- name: GetQuestionQuizID :one
SELECT tk_Quiz
FROM quizio."Question"
WHERE id_Question = $1;

-- name: GetAnswerForQuestion :one
SELECT id_Answer, tk_Question
FROM quizio."Answer"
WHERE id_Answer = $1
	AND tk_Question = $2;

-- Attempts
-- name: CreateAttempt :one
INSERT INTO quizio."Attempt" (start_time, tk_Quiz, tk_User)
VALUES (NOW(), $1, $2)
RETURNING id_Attempt, start_time, time_taken, tk_Quiz, tk_User;

-- name: GetAttemptByUserQuiz :one
SELECT id_Attempt, start_time, time_taken, tk_Quiz, tk_User
FROM quizio."Attempt"
WHERE tk_Quiz = $1
	AND tk_User = $2;

-- name: GetAttemptWithQuiz :one
SELECT a.id_Attempt,
	a.start_time,
	a.time_taken,
	a.tk_Quiz,
	a.tk_User,
	(NOW() < a.start_time + q.time_limit) AS is_active,
	EXTRACT(EPOCH FROM q.time_limit)::int AS time_limit_seconds
FROM quizio."Attempt" a
JOIN quizio."Quiz" q ON q.id_Quiz = a.tk_Quiz
WHERE a.tk_Quiz = $1
	AND a.tk_User = $2;

-- name: FinalizeAttemptIfExpired :one
UPDATE quizio."Attempt" a
SET time_taken = LEAST(NOW() - a.start_time, q.time_limit)::time
FROM quizio."Quiz" q
WHERE a.id_Attempt = $1
	AND a.tk_Quiz = q.id_Quiz
	AND a.time_taken IS NULL
	AND NOW() >= a.start_time + q.time_limit
RETURNING a.id_Attempt, a.start_time, a.time_taken, a.tk_Quiz, a.tk_User;

-- name: FinalizeExpiredAttemptsForUser :exec
UPDATE quizio."Attempt" a
SET time_taken = LEAST(NOW() - a.start_time, q.time_limit)::time
FROM quizio."Quiz" q
WHERE a.tk_User = $1
	AND a.tk_Quiz = q.id_Quiz
	AND a.time_taken IS NULL
	AND NOW() >= a.start_time + q.time_limit;

-- name: FinalizeAttempt :one
UPDATE quizio."Attempt" a
SET time_taken = LEAST(NOW() - a.start_time, q.time_limit)::time
FROM quizio."Quiz" q
WHERE a.id_Attempt = $1
	AND a.tk_Quiz = q.id_Quiz
	AND a.time_taken IS NULL
RETURNING a.id_Attempt, a.start_time, a.time_taken, a.tk_Quiz, a.tk_User;

-- name: ListOpenAttemptsByUser :many
SELECT a.id_Attempt,
	a.start_time,
	a.time_taken,
	a.tk_Quiz,
	a.tk_User,
	EXTRACT(EPOCH FROM q.time_limit)::int AS time_limit_seconds
FROM quizio."Attempt" a
JOIN quizio."Quiz" q ON q.id_Quiz = a.tk_Quiz
WHERE a.tk_User = $1
	AND a.time_taken IS NULL
	AND NOW() < a.start_time + q.time_limit
ORDER BY a.start_time DESC;

-- name: ListFinishedAttemptsByUser :many
SELECT id_Attempt, start_time, time_taken, tk_Quiz, tk_User
FROM quizio."Attempt"
WHERE tk_User = $1
	AND time_taken IS NOT NULL
ORDER BY start_time DESC
LIMIT $2 OFFSET $3;

-- name: UpsertAttemptQuestion :exec
INSERT INTO quizio."Attempt_Question" (tk_Attempt, tk_Question, tk_Answer)
VALUES ($1, $2, $3)
ON CONFLICT (tk_Attempt, tk_Question)
DO UPDATE SET tk_Answer = EXCLUDED.tk_Answer;

-- name: ListAttemptQuestions :many
SELECT tk_Attempt, tk_Question, tk_Answer
FROM quizio."Attempt_Question"
WHERE tk_Attempt = $1;
