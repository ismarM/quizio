# Quizio — Features & Requirements

This document is the authoritative reference for the functional features and non-functional requirements of the **Quizio** platform.

---

## Table of Contents

- [1. Functional Features](#1-functional-features)
  - [1.1 Admin Capabilities](#11-admin-capabilities)
  - [1.2 User Capabilities](#12-user-capabilities)
  - [1.3 Real-Time Leaderboard](#13-real-time-leaderboard)
- [2. Non-Functional Requirements](#2-non-functional-requirements)

---

## 1. Functional Features

### 1.1 Admin Capabilities

#### Quiz Management
- Create a new quiz with a title, description, and total time limit
- Edit an existing quiz (title, time limit, questions, and answers)
- Delete/archive a quiz
- Publish or unpublish a quiz to control user visibility

#### Question Composition
- Add multiple-choice questions to a quiz
- Add image-based comparison questions (minimum two images per question)
- Assign a point value to each individual question
- Use AI to generate questions automatically

#### Results
- View individual user results per quiz
- View a leaderboard of all scores for a quiz

---

### 1.2 User Capabilities

#### Authentication
- Register and log in using Firebase Authentication
- Secure session management via HTTP-only session cookie, synchronized between client, BFF, and database

#### Quiz Taking
- Browse all currently published quizzes
- Start a quiz from the quiz listing or quiz detail page
- A visible countdown timer is displayed throughout the entire quiz session
- The countdown timer continues server-side even if the user closes their browser tab or loses connection — closing the browser does not pause or extend the attempt
- Answers are saved incrementally as the user progresses
- When the timer expires, the quiz is automatically submitted with all answers saved up to that point
- Submit the quiz manually at any point before the timer runs out

#### Personal
- View a history of past quiz attempts, scores, and time taken
- Select the theme and language
- Set a username to hide their email

---

### 1.3 Real-Time Leaderboard

- A live leaderboard is displayed per quiz, updated automatically when any user finalises an attempt
- Rankings are ordered by points (descending), with time taken as the tie-breaker (faster completion wins)
- Updates are pushed to connected clients via Server-Sent Events (SSE) — no page refresh or polling required

---

## 2. Non-Functional Requirements

| Ref | Category | Requirement |
| :--- | :--- | :--- |
| **NFR-01** | Security | All requests from the Next.js BFF to the Go REST API must be signed with HMAC-SHA256 using a shared secret and a timestamp. The backend rejects any request with a timestamp skew greater than 10 seconds to prevent replay attacks. |
| **NFR-02** | Security | Admin-only endpoints are enforced at the BFF proxy layer. Non-admin users are blocked from create, edit, delete, and publish actions before the request reaches the Go backend. |
| **NFR-03** | Security | No Firebase credentials or third-party tokens are passed to the Go backend. The backend operates solely on trusted identity headers injected by the BFF. |
| **NFR-04** | Data Integrity | All SQL queries in the Go backend are pre-compiled and parameterised at build time via `sqlc`, eliminating the risk of SQL injection. |
| **NFR-05** | Correctness | Quiz attempt timers are derived entirely from PostgreSQL timestamps (`start_time` and `time_limit`). The timer cannot be manipulated by closing the browser, clearing local storage, or sending forged requests after expiry. |
| **NFR-06** | Real-Time | Leaderboard updates must be delivered to connected clients within 200ms of an attempt being finalised. |
| **NFR-07** | Scalability | All components (except the database) must be completely stateless, enabling horizontal scaling behind a load balancer. All mutable state is persisted to PostgreSQL before a response is returned. |
| **NFR-08** | Availability | Multiple users submitting answers or completing attempts concurrently must be handled without database race conditions or leaderboard data corruption. Database-triggered notifications are debounced by 100ms per `quiz_id` to prevent excessive recalculation under concurrent load. |