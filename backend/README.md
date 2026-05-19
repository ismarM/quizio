# Backend

Stack:
- chi router
- pgx driver
- godotenv
- golang-migrate migrations
- sqlc for database queries
- swaggo for openapi documentation (http://localhost:8080/swagger/index.html)

Setup:
1) From the repo root, start Postgres:
	docker compose up -d postgres
2) From the backend directory:
	cd backend
3) Update .env (defaults match docker-compose.yml).
4) Run migrations:
	go run ./cmd/server migrate
5) Start the API:
	go run ./cmd/server

## Decisions log
- Use `/api` prefix for all routes.
- Remove the actor envelope; request fields are at the root of the JSON body.
- Use RESTful methods and query parameters for list/search endpoints.
- Collaborators and categories are out of scope for now.
- Allow scheduled `publish_date`, but lock edits once `publish_date` is set.
- Enforce single attempt per user per quiz in the database.
- Deleting a quiz cascades to questions, answers, and attempts.
- Deleting a user cascades to their quizzes and attempts.
- Answer images are treated as normal answers with the URL stored as the answer value.
- Migrate `Quiz.time_limit` to INTERVAL.
- No scheduler for expired attempts; finalize on relevant API reads/writes and enforce expiry checks.
- Image upload is a stub: accept request, return placeholder URL, no storage.
- Attempt results return raw data (questions, answers, which were correct); frontend computes scores.

## Open questions
- Long-term image storage and final URL format once a bucket is introduced.