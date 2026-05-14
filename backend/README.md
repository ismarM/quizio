# Backend

Stack:
- chi router
- pgx driver
- godotenv
- goose migrations

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

Endpoints:
- GET /api/users?limit=50
- POST /api/users
  {"name":"Ada Lovelace","email":"ada@example.com"}