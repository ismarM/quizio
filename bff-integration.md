# BFF integration summary

This document summarizes the BFF (Next proxy) integration work and lists all edited/added files.

## What was implemented

- Added a Next.js Route Handler that proxies all Go API calls under `/api/proxy/*`.
- Enforced auth in the Go backend by requiring `x-user-email` from the BFF and looking up the user in the database.
- Enforced admin-only access for the admin endpoints based on the database `is_admin` flag.
- Added a client helper for calling the BFF proxy from the Next app.
- Documented BFF/proxy usage and auth expectations in README files.
- Added a TODO in the plan to add HMAC signing later.

## Files and changes

- Added Next proxy route: `next/src/app/api/proxy/[...path]/route.ts`
  - Validates session via `getSessionUser()`.
  - Builds a target URL to Go using `GO_BACKEND_URL`.
  - Proxies all methods and passes `x-user-email` and `x-user-uid` headers.
  - Enforces admin-only endpoints by email before forwarding.

- Added Go auth middleware: `backend/internal/httpapi/auth.go`
  - `requireAuth` reads `x-user-email`, verifies user from DB, and injects auth context.
  - `requireAdmin` blocks non-admins using `is_admin`.
  - Allows `POST /api/users` even if user is not yet in DB.

- Updated Go router to apply auth/admin middleware: `backend/internal/httpapi/router.go`
  - All `/api` routes now require `requireAuth`.
  - Admin-only routes are protected with `requireAdmin`.

- Added proxy client helper: `next/src/lib/proxyClient.ts`
  - `buildProxyUrl` and `proxyFetch`/`proxyFetchJson` for calling `/api/proxy/*`.

- Documentation updates:
  - `next/README.md` includes proxy usage and required env vars.
  - `README.md` notes that the BFF proxies `/api/proxy` to Go.
  - `backend/README.md` documents required auth headers and admin enforcement.

- Plan update:
  - `načrt.txt` includes TODO to add HMAC signing later.

## Admin-only endpoints

These are enforced both in the BFF and Go backend:

- `POST /api/images`
- `DELETE /api/images`
- `PUT /api/questions/{questionId}`
- `DELETE /api/questions/{questionId}`
- `POST /api/quizzes/{quizId}/questions`
- `POST /api/quizzes`
- `PUT /api/quizzes/{quizId}`
- `DELETE /api/quizzes/{quizId}`
- `PATCH /api/quizzes/{quizId}/archive`
- `PATCH /api/quizzes/{quizId}/publish`

## Environment variables

- `GO_BACKEND_URL` (example: `http://localhost:8080`)
- `ADMIN_EMAIL` (defaults to `tets@maaail.csssf` if not set)

## Notes

- Direct calls to Go without `x-user-email` now return 401.
- HMAC signing is intentionally postponed; add later on both BFF and Go.

## Quick test checklist

- Start Postgres: `docker compose up -d postgres`
- Run backend migrations: `go run ./cmd/server migrate`
- Start Go API: `go run ./cmd/server`
- Start Next app: `npm run dev` (from `next/`)
- Sign in via `/login` and open `/dashboard`.
- Call a public endpoint via BFF (example): `GET /api/proxy/quizzes`.
- Try an admin endpoint with a non-admin user and confirm 403.
- Promote a user to admin in DB (`is_admin = true`) and retry admin endpoint.

## HMAC integration checklist (later)

- Add `PROXY_HMAC_SECRET` to Next and Go environment configs.
- In the BFF, sign payload with method + path + query + timestamp + body hash.
- Send `x-proxy-timestamp` and `x-proxy-signature` headers.
- In Go, verify signature and timestamp skew on every request.
- Reject missing/invalid signatures with 401 or 403.
- Add logging for signature failures (without leaking secrets).
