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
	tk_User,
	tk_Category,
	image_url
)
VALUES ($1, make_interval(secs => $2), $3, $4, $5, $6)
RETURNING id_Quiz,
	title,
	description,
	created_at,
	publish_date,
	tk_User,
	is_archived,
	tk_Category,
	image_url,
	EXTRACT(EPOCH FROM time_limit)::int AS time_limit_seconds;

-- name: UpdateQuiz :one
UPDATE quizio."Quiz"
SET title = $2,
		description = $3,
		time_limit = make_interval(secs => $4),
		tk_Category = $5,
		image_url = $6
WHERE id_Quiz = $1
RETURNING id_Quiz,
	title,
	description,
	created_at,
	publish_date,
	tk_User,
	is_archived,
	tk_Category,
	image_url,
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
	tk_Category,
	image_url,
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
	tk_Category,
	image_url,
	EXTRACT(EPOCH FROM time_limit)::int AS time_limit_seconds;

-- name: DeleteQuiz :exec
DELETE FROM quizio."Quiz"
WHERE id_Quiz = $1;


-- name: GetQuizByID :one
SELECT q.id_Quiz,
	q.title,
	q.description,
	q.created_at,
	q.publish_date,
	q.tk_User,
	q.is_archived,
	q.tk_Category,
	q.image_url,
	c.name AS category_name,
	EXTRACT(EPOCH FROM q.time_limit)::int AS time_limit_seconds,
	COUNT(qq.id_Question)::int AS question_count
FROM quizio."Quiz" q
LEFT JOIN quizio."Question" qq ON qq.tk_Quiz = q.id_Quiz
LEFT JOIN quizio."Category" c ON q.tk_Category = c.id_Category
WHERE q.id_Quiz = $1
GROUP BY q.id_Quiz, c.name;

-- name: GetQuizState :one
SELECT id_Quiz, tk_User, publish_date, is_archived
FROM quizio."Quiz"
WHERE id_Quiz = $1;

-- name: ListQuizzes :many
SELECT q.id_Quiz,
	q.title,
	q.description,
	q.created_at,
	q.publish_date,
	q.tk_User,
	q.is_archived,
	EXTRACT(EPOCH FROM q.time_limit)::int AS time_limit_seconds,
	COUNT(qq.id_Question)::int AS question_count,
	q.tk_Category,
	q.image_url,
	c.name AS category_name
FROM quizio."Quiz" q
LEFT JOIN quizio."Question" qq ON qq.tk_Quiz = q.id_Quiz
LEFT JOIN quizio."Category" c ON q.tk_Category = c.id_Category
WHERE (
	($1 = 'published' AND q.is_archived = FALSE AND q.publish_date IS NOT NULL AND q.publish_date <= NOW())
	OR ($1 = 'not_published' AND q.is_archived = FALSE)
	OR ($1 = 'archived' AND q.is_archived = TRUE)
)
	AND ($2 = '' OR q.title ILIKE '%' || $2 || '%')
	AND ($3 = 0 OR q.tk_User = $3)
	AND ($4 = FALSE OR EXISTS (
		SELECT 1
		FROM quizio."Attempt" a
		WHERE a.tk_Quiz = q.id_Quiz
			AND a.tk_User = $5
	))
GROUP BY q.id_Quiz, c.name
ORDER BY 
	CASE WHEN $6 = 'category' THEN c.name END ASC,
	CASE WHEN $6 = 'category' THEN q.id_Quiz END ASC,
	CASE WHEN $6 = '' AND $1 = 'published' THEN q.publish_date END DESC,
	CASE WHEN $6 = '' AND $1 <> 'published' THEN q.created_at END DESC
LIMIT $7 OFFSET $8;

-- Categories
-- name: ListCategories :many
SELECT id_Category, name
FROM quizio."Category"
ORDER BY name ASC;

-- Leaderboard
-- name: ListFinishedAttemptsByQuiz :many
SELECT a.id_Attempt,
	a.start_time,
	a.time_taken,
	a.tk_Quiz,
	a.tk_User,
	u.email AS user_email,
	u.displayName AS user_display_name
FROM quizio."Attempt" a
JOIN quizio."User" u ON a.tk_User = u.id_User
WHERE a.tk_Quiz = $1
	AND a.time_taken IS NOT NULL;

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

-- Attempts
-- name: CreateAttempt :one
INSERT INTO quizio."Attempt" (start_time, tk_Quiz, tk_User)
VALUES (NOW(), $1, $2)
RETURNING id_Attempt, start_time, time_taken, tk_Quiz, tk_User;

-- name: ListAttemptsByUser :many
SELECT id_Attempt, start_time, time_taken, tk_Quiz, tk_User
FROM quizio."Attempt"
WHERE tk_User = $1
ORDER BY start_time DESC;

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
SET time_taken = time '00:00' + q.time_limit
FROM quizio."Quiz" q
WHERE a.id_Attempt = $1
	AND a.tk_Quiz = q.id_Quiz
	AND a.time_taken IS NULL
	AND NOW() >= a.start_time + q.time_limit
RETURNING a.id_Attempt, a.start_time, a.time_taken, a.tk_Quiz, a.tk_User;

-- name: FinalizeExpiredAttemptsForUser :exec
UPDATE quizio."Attempt" a
SET time_taken = time '00:00' + q.time_limit
FROM quizio."Quiz" q
WHERE a.tk_User = $1
	AND a.tk_Quiz = q.id_Quiz
	AND a.time_taken IS NULL
	AND NOW() >= a.start_time + q.time_limit;

-- name: FinalizeAttempt :one
UPDATE quizio."Attempt" a
SET time_taken = time '00:00' + LEAST(NOW() - a.start_time, q.time_limit)
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
