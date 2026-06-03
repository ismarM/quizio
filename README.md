# Quizio

Interactive web-based quiz platform built with Next.js, Go, PostgreSQL, Firebase Authentication, and Supabase Storage.

---

# Table of Contents

1. Vision

   * Purpose
   * Solution Boundaries
   * Key Functionalities
   * Business Limits
2. Glossary
3. Architecture Overview
4. Technology Stack
5. Production Installation

   * Prerequisites
   * Firebase Configuration
   * Supabase Configuration
   * Environment Variables
   * Docker Deployment
6. Development Setup

   * Prerequisites
   * PostgreSQL
   * Backend Setup
   * Frontend Setup
7. Project Structure
8. Developer Documentation

   * Technologies and Versions
   * Coding Standards
   * Git Workflow
   * Commit Message Convention
9. Contributing
10. Troubleshooting

---

# Vision

## Purpose

Quizio is a web-based quiz platform that enables administrators to create and manage quizzes while allowing registered users to participate in timed quiz sessions and compete on real-time leaderboards.

The platform emphasizes:

* Fair server-authoritative timing
* Real-time ranking updates
* Secure authentication
* Maintainable architecture
* Horizontal scalability

---

## Solution Boundaries

### Included

* User registration and login
* Quiz creation and management
* Multiple-choice questions
* Image comparison questions
* Quiz publishing/unpublishing
* Timed quiz attempts
* Automatic quiz submission on timeout
* User score history
* Real-time leaderboards
* Administrator result visibility
* Role-based access control

### Not Included

* Payments or subscriptions
* Public API for third parties
* Offline quiz participation
* Team competitions
* Live collaborative quiz sessions
* Question banks shared between quizzes
* Advanced analytics dashboards
* AI-generated quiz content
* Native mobile applications

---

## Key Functionalities

### For Users

* Register and authenticate
* Browse published quizzes
* Start quiz attempts
* Answer questions incrementally
* Submit quizzes manually
* Automatic timeout handling
* View previous attempts
* View real-time rankings

### For Administrators

* Create quizzes
* Edit quizzes
* Delete quizzes
* Publish and unpublish quizzes
* Create questions
* Configure scoring
* Review user results

---

## Business Limits

### Roles

Only two roles exist:

* User
* Administrator

### Quiz Timing

* Timers are authoritative on the server
* Browser manipulation cannot extend attempts

### Leaderboards

Rankings are ordered by:

1. Total points (descending)
2. Completion time (ascending)

### Authentication

Authentication is delegated to Firebase Authentication.

### Storage

Supabase Storage is used for image assets.

---

# Glossary

This glossary intentionally focuses on business terminology rather than implementation details.

| Term             | Meaning                                           |
| ---------------- | ------------------------------------------------- |
| Quiz             | A collection of questions that users can complete |
| Question         | A single challenge within a quiz                  |
| Answer           | A selectable response to a question               |
| Attempt          | One user's participation in a quiz                |
| Score            | Points earned during an attempt                   |
| Leaderboard      | Ranking of users for a quiz                       |
| Published Quiz   | Quiz visible to users                             |
| Unpublished Quiz | Quiz visible only to administrators               |
| Administrator    | User who manages quizzes                          |
| Participant      | User taking quizzes                               |
| Time Limit       | Maximum allowed duration for a quiz               |
| Result           | Final outcome of an attempt                       |

---

# Architecture Overview

The system consists of four primary components:

1. Next.js Frontend
2. Next.js Backend-for-Frontend (BFF)
3. Go Backend API
4. PostgreSQL Database

Supporting services:

* Firebase Authentication
* Supabase Storage

The architecture follows a Backend-for-Frontend (BFF) pattern.

All browser requests pass through the Next.js server before reaching the Go backend.

---

# Technology Stack

## Frontend

* Next.js 14+
* React 18+
* TypeScript
* Tailwind CSS 3+
* shadcn/ui

## Backend

* Go 1.21+
* Chi Router v5

## Database

* PostgreSQL 15+
* sqlc

## Authentication

* Firebase Authentication
* Firebase Admin SDK

## Storage

* Supabase Storage

## Infrastructure

* Docker
* Docker Compose

---

# Production Installation

## Prerequisites

Required software:

* Docker Engine 24+
* Docker Compose
* Firebase Project
* Supabase Project
* Domain name (recommended)
* HTTPS certificate

---

## Firebase Configuration

Create a Firebase project and enable:

### Authentication

Enable at least one provider:

* Email/Password
* Google OAuth

### Service Account

Generate a Firebase Admin SDK service account.

The following values will be required:

* FIREBASE_PROJECT_ID
* FIREBASE_CLIENT_EMAIL
* FIREBASE_PRIVATE_KEY

---

## Supabase Configuration

Create a Supabase project.

Create a storage bucket for quiz images.

Required values:

* SUPABASE_URL
* SUPABASE_SERVICE_ROLE_KEY

---

## Environment Variables

### Frontend (.env)

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

GO_BACKEND_URL=

HMAC_SECRET=

SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

### Backend (.env)

```env
SERVER_PORT=8080

DB_HOST=
DB_PORT=5432
DB_NAME=
DB_USER=
DB_PASSWORD=
DB_SSLMODE=require

HMAC_SECRET=
```

---

## Docker Deployment

Build and start the full platform:

```bash
docker compose up -d --build
```

Verify services:

```bash
docker compose ps
```

Run database migrations:

```bash
docker compose exec backend go run ./cmd/server migrate
```

View logs:

```bash
docker compose logs -f
```

---

# Development Setup

## Prerequisites

Install:

* Node.js 20+
* npm 10+
* Go 1.21+
* Docker Desktop or Docker Engine
* Git

---

## Start PostgreSQL

From repository root:

```bash
docker compose up -d postgres
```

Verify:

```bash
docker ps
```

---

## Backend Setup

Navigate to backend:

```bash
cd backend
```

Install dependencies:

```bash
go mod download
```

Run migrations:

```bash
go run ./cmd/server migrate
```

Run server:

```bash
go run ./cmd/server
```

or:

```bash
air
```

Default API:

```text
http://localhost:8080
```

---

## Frontend Setup

Navigate to frontend:

```bash
cd next
```

Install dependencies:

```bash
npm install
```

Run development server:

```bash
npm run dev
```

Default frontend:

```text
http://localhost:3000
```

---

# Project Structure

```text
/
├── next/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── lib/
│   │   └── hooks/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── cmd/
│   │   └── server/
│   ├── internal/
│   │   ├── db/
│   │   ├── handlers/
│   │   ├── middleware/
│   │   ├── hub/
│   │   └── services/
│   ├── sql/
│   │   ├── schema/
│   │   └── queries/
│   └── go.mod
│
├── docker-compose.yml
├── README.md
└── .gitignore
```

---

# Developer Documentation

## Technologies and Versions

| Technology         | Version |
| ------------------ | ------- |
| Go                 | 1.21+   |
| PostgreSQL         | 15+     |
| Node.js            | 20+     |
| Next.js            | 14+     |
| React              | 18+     |
| TypeScript         | 5+      |
| Tailwind CSS       | 3+      |
| Firebase Admin SDK | 12+     |
| Chi Router         | v5      |
| sqlc               | v1+     |
| Docker             | 24+     |

---

## Coding Standards

### General

* Prefer readability over cleverness.
* Keep functions small and focused.
* Avoid duplicated business logic.
* Follow existing architectural patterns.

---

### TypeScript

* Enable strict mode.
* Avoid `any`.
* Prefer explicit interfaces.
* Use server components by default.

---

### Go

* Follow standard Go formatting:

```bash
go fmt ./...
```

* Run:

```bash
go vet ./...
```

* Prefer explicit error handling.
* Keep handlers thin.
* Place business logic in services.

---

### SQL

* Use sqlc-generated queries.
* No string-concatenated SQL.
* All schema changes must be migration-based.

---

# Git Workflow

## Branch Naming

Feature:

```text
feature/quiz-publishing
```

Bugfix:

```text
fix/leaderboard-refresh
```

Hotfix:

```text
hotfix/auth-bypass
```

Documentation:

```text
docs/readme-update
```

---

## Commit Messages

Use Conventional Commits.

Examples:

```text
feat: add quiz publishing workflow

fix: prevent duplicate leaderboard events

docs: update installation guide

refactor: simplify attempt scoring logic
```

Common types:

* feat
* fix
* docs
* refactor
* test
* chore
* ci

---

## Pull Requests

Requirements:

* Passing build
* Passing tests
* No secrets committed
* Documentation updated if applicable

---

# Contributing

1. Fork the repository.
2. Create a feature branch.
3. Implement changes.
4. Add or update tests.
5. Run formatting and linting.
6. Open a pull request.

Checklist:

* [ ] Code builds successfully
* [ ] Tests pass
* [ ] No secrets included
* [ ] Documentation updated
* [ ] Migrations included if schema changed

---

# Troubleshooting

## Database Connection Failed

Verify PostgreSQL is running:

```bash
docker ps
```

Check backend configuration:

```bash
DB_HOST
DB_PORT
DB_NAME
DB_USER
DB_PASSWORD
```

---

## Firebase Authentication Errors

Verify:

* Project ID
* Service account credentials
* Authentication provider configuration

---

## Leaderboard Not Updating

Verify:

* PostgreSQL trigger exists
* LISTEN/NOTIFY is functioning
* SSE endpoint is reachable
* Go Leaderboard Hub is running

---

## HMAC Validation Failures

Verify:

```text
HMAC_SECRET
```

matches in both:

* Next.js
* Go Backend

The value must be identical in every environment.
