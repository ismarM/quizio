# Quizio

![Next.js](https://img.shields.io/badge/Next.js-16+-black?logo=next.js)
![Go](https://img.shields.io/badge/Go-1.23+-00ADD8?logo=go)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-336791?logo=postgresql)
![Firebase](https://img.shields.io/badge/Firebase-Auth-FFCA28?logo=firebase)
![License](https://img.shields.io/badge/license-MIT-green)

An interactive web-based quiz platform built with a Next.js BFF, Go REST API, and PostgreSQL backend. Developed in collaboration with [Inova IT d.o.o.](https://www.inovait.si/). Link to our website: (https://frontend.proudmoss-a17ef286.germanywestcentral.azurecontainerapps.io)

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [Getting Started](#getting-started)
- [Agentic Development](#agentic-development)

---

## Overview

Quizio allows administrators to create and publish quizzes with multiple-choice and image-based questions. Registered users can take quizzes against a server-enforced countdown timer, and results are reflected on a real-time leaderboard.

Key characteristics:
- **Server-authoritative timers** — quiz countdowns are enforced in PostgreSQL; closing a browser tab cannot extend an attempt.
- **Stateless design** — all state is stored in the database and sessions are JWT-based, enabling horizontal scaling of all components.
- **Real-time leaderboard** — event-driven push via `pg_notify → SSE`, no polling.
- **Layered security** — JWT session management, HMAC-SHA256 request signing, and compile-time parameterized SQL via `sqlc`.

A full list of supported features and Non-Functional Requirements (NFRs) can be found in the [documentation](docs/features.md).

---

## Architecture

Quizio uses a **BFF (Backend-For-Frontend)** pattern:

```
Browser → Next.js BFF → Go REST API → PostgreSQL
                ↕
        Firebase Auth (external)
```

- The **Next.js BFF** handles session management, RBAC enforcement, and HMAC request signing. It is the only entry point for browser traffic.
- The **Go API** is a stateless HTTP server responsible for the quiz and attempt lifecycle. It is not publicly exposed.
- **PostgreSQL** is the single source of truth for all mutable state, including timers.
- **Firebase Authentication** handles user registration, login, and ID token issuance.

Additional architectural information along with sequence diagrams can be found in the [docs](docs/ARCHITECTURE.md).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend / BFF | Next.js 16 (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Go 1.23+, Chi router |
| Database | PostgreSQL 16 |
| Auth | Firebase Authentication |
| DB Access | sqlc (compile-time SQL → type-safe Go) |
| Real-time | PostgreSQL `pg_notify` + Server-Sent Events (SSE) |

---


## Project Structure

```
quizio/
├── .agents/                  # Configuration and skills for AI agents
├── docs/                     # Documentation files & draw.io diagrams
├── next/                     # Next.js BFF & frontend app
│   └── src/
│       ├── app/              # App Router pages and API routes
│       │   └── api/
│       │       ├── session/  # Firebase session cookie route
│       │       ├── proxy/    # BFF proxy (RBAC, HMAC signing, forwarding)
│       │       └── upload/   # File uploads handling
│       ├── lib/              # Shared utilities (HMAC, Firebase Admin, sessions)
│       └── components/       # React components (shadcn/ui)
└── backend/                  # Go REST API backend
    ├── cmd/server/           # Application entry point (main.go)
    ├── internal/             # Internal packages
    │   ├── config/           # Configuration parsing & dotenv loading
    │   ├── db/               # Database connection & sqlc-generated code
    │   │   ├── sqlc/         # sqlc type-safe generated code
    │   │   └── migrate.go    # Migration logic
    │   └── httpapi/          # Chi router and route mounts
    └── migrations/           # PostgreSQL migration DDL files
```

---


## Configuration

Both the Next.js BFF and the Go server require configuration via environment variables.

### Generating the HMAC Secret
The Go backend and Next.js BFF use a shared `HMAC_SECRET` to verify requests. Generate a secret string using:
```bash
openssl rand -base64 32
```

### Acquiring External API Keys

#### 1. Firebase Authentication & Admin SDK Keys
- Go to the [Firebase Console](https://console.firebase.google.com/).
- Create or select a project (e.g., `quizio`).
- **Client Keys**: In your project settings page, under General, create a Web App. Copy the configurations to populate the `NEXT_PUBLIC_FIREBASE_*` variables.
- **Admin Keys**: Go to Project Settings -> Service Accounts -> Click "Generate new private key". A JSON credentials file will download. Use the `client_email` for `FIREBASE_CLIENT_EMAIL` and the `private_key` block (replacing newlines with `\n`) for `FIREBASE_PRIVATE_KEY`.

#### 2. Gemini AI Key
- Navigate to [Google AI Studio](https://aistudio.google.com/).
- Sign in and click **Get API key**.
- Create a new API key and copy its value to `GEMINI_API_KEY`.

#### 3. Supabase URL & Keys
- Create a database project on [Supabase](https://supabase.com/).
- Navigate to Project Settings -> API.
- Copy the Project URL to `SUPABASE_URL`.
- Copy the `service_role` secret key to `SUPABASE_SERVICE_ROLE_KEY`.

---

## Getting Started

### Prerequisites
- Node.js v22+
- Go 1.23+
- Docker Desktop

### Copy Environment Files
Before running the services, copy the environment files templates and replace placeholders with the [acquired keys](#configuration):
- Backend: Copy `backend/.env.example` $\rightarrow$ `backend/.env`
- Frontend: Copy `next/.env.local.example` $\rightarrow$ `next/.env.local`

---

### Method A: Run via Docker Compose (Recommended)
This method spins up the database, compiles the services, runs migrations, and starts everything in the correct sequence automatically.

1. Start Docker Desktop on your machine.
2. Verify you meet all [prerequisites](#prerequisites) and have correctly set up [environment variables](#copy-environment-files).
3. In the repository root, build and start all containers in the background:
   ```bash
   docker compose up --build -d
   ```
4. Access the applications:
   - **Frontend App**: [http://localhost:3000](http://localhost:3000)
   - **API Docs (Swagger)**: [https://localhost:8080/swagger/index.html](https://localhost:8080/swagger/index.html)

---

### Method B: Run on Host Machine (Development)

#### 1. Start Database Container
Only run PostgreSQL in Docker:
```bash
docker compose up -d postgres
```

#### 2. Start Go Backend
Ensure you are in the `backend/` directory:
```bash
cd backend
# Download dependencies
go mod download

# Generate local SSL certificates (enables HTTPS automatically)
go run ./cmd/generate_cert/main.go

# Run migrations
go run ./cmd/server migrate

# Run server (or run 'air' for live reloading)
go run ./cmd/server
```

#### 3. Start Next.js Frontend
Ensure you are in the `next/` directory:
```bash
cd next
# Install dependencies
npm install

# Start development server
npm run dev
```
#### 4. Access the applications:
   - **Frontend App**: [http://localhost:3000](http://localhost:3000)
   - **API Docs (Swagger)**: [https://localhost:8080/swagger/index.html](https://localhost:8080/swagger/index.html)

---

## Agentic Development

This repository is optimized for development with AI coding agents.

- **Skills**: Specialized development tasks, code constraints, and guidelines are defined as instructions under the [.agents/skills/](.agents/skills) directory. Before asking an AI agent to perform any task, the agent should read respective `SKILL.md` files located in `.agents/skills/<skill-name>/SKILL.md`.
- **Rules**: Global repository constraints and styling rules are enforced via [AGENTS.md](AGENTS.md) in the root.
