# Backend

Stack:

- chi router
- pgx driver
- godotenv
- golang-migrate migrations
- sqlc for database queries
- swaggo for openapi documentation (http://localhost:8080/swagger/index.html)

Setup:

1. From the repo root, start Postgres:
   docker compose up -d postgres
2. From the backend directory:
   cd backend
3. Update .env (defaults match docker-compose.yml).
4. Run migrations:
   go run ./cmd/server migrate
5. Start the API:
   go run ./cmd/server
