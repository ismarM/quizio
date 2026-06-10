# Backend

Stack:

- chi router
- pgx driver
- godotenv
- golang-migrate migrations
- sqlc for database queries
- swaggo for openapi documentation (http://localhost:8080/swagger/index.html, "go run github.com/swaggo/swag/cmd/swag@latest init -g cmd/server/main.go")

Setup:

1. From the repo root, start Postgres:
   docker compose up -d postgres
2. From the backend directory:
   cd backend
3. Generate local SSL certificates (enables HTTPS automatically):
   go run ./cmd/generate_cert/main.go
4. Update .env (defaults match docker-compose.yml).
5. Run migrations:
   go run ./cmd/server migrate
6. Start the API:
   go run ./cmd/server

Dev (auto-reload):

1. Install Air (one-time):
   go install github.com/air-verse/air@latest
2. Run the watcher from backend/:
   air

Notes:
- .air.toml runs migrations before each rebuild via pre_cmd.
- If you want to run migrations only once, remove pre_cmd and run:
  go run ./cmd/server migrate
