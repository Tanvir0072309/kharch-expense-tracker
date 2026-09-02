# Kharch API

Node.js + Express backend for Kharch (an expense tracker): OTP-verified auth,
JWT access/refresh tokens, transactions, categories, dashboard and analytics.

This README documents every route in the API. It was rewritten after fixing
the issues below that were stopping the server from starting / routes from
working.

---

## What was broken, and what was fixed

| # | Problem | Fix |
|---|---|---|
| 1 | `.env` had `SHARD_0_USER=postgres`, but the actual Postgres role is `kharch_user` → every DB query failed with `password authentication failed for user "postgres"` | Corrected to `kharch_user` in `.env` |
| 2 | `.env` was missing `REDIS_*`, `JWT_*`, and `SMTP_*` entirely → `src/services/email.service.js` throws at import time if any SMTP var is missing, so the process crashed before it could even start listening | Added all required variables to `.env`, and a sanitized `.env.example` for future setups |
| 3 | No `migrations/` folder existed anywhere in the project → `npm run migrate` failed with `ENOENT: no such file or directory` | Added `migrations/001`–`004` (users, categories, transactions, refresh_tokens), matching the models exactly |
| 4 | `scripts/migrate.js` pointed at `../../infrastructure/postgres/migrations`, a path outside this package that doesn't exist in a plain deploy of this repo | Migrations now live inside the package at `server/migrations`; `MIGRATIONS_DIR` env var can still override it |
| 5 | `.gitignore` was empty → `node_modules/` and `.env` (with real secrets) would get committed | Populated with `node_modules/`, `.env`, logs, etc. |
| 6 | `src/middleware/errorHandler.js`, `rateLimit.js`, and `cache.js` were dead/duplicate files, not imported anywhere, and `cache.js` used a Redis client API that doesn't match the installed `redis` version | Removed all three — the app only ever used `error.middleware.js` and `rate-limit.middleware.js` |
| 7 | No `.env.example` existed even though the old README told people to `cp .env.example .env` | Added one, with placeholder (non-secret) values |

Everything above was verified end-to-end against a real local Postgres +
Redis instance: migrations ran and were idempotent on a second run, the
server booted cleanly, and every route below was exercised with `curl`
(signup → OTP verify → login → OTP verify → create transaction → dashboard →
analytics → categories → profile update), including error paths (missing
auth token → 401, unknown route → 404, bad signup payload → 400).

**One thing worth doing yourself:** the Gmail app password and JWT secrets
in `.env` were pasted in plaintext earlier in this conversation. They still
work, but since they've now been shared outside your own machine, it's good
practice to rotate the Gmail app password and regenerate `JWT_ACCESS_SECRET`
/ `JWT_REFRESH_SECRET` (any long random string works) once things are
running.

---

## Tech stack

- **Runtime**: Node.js 22, Express 5
- **Database**: PostgreSQL (single primary in use today; `SHARD_1`/`SHARD_2`
  config and `shard-router.js` exist for future horizontal sharding but
  aren't wired into the models yet — every model currently reads/writes
  through the single pool in `src/config/database.js`)
- **Cache / sessions**: Redis (OTPs, reset tokens, sliding-window rate limits)
- **Auth**: JWT access tokens (short-lived) + opaque refresh tokens (hashed
  at rest, rotated on every refresh)
- **Password hashing**: argon2id
- **Email**: Nodemailer (SMTP)

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

`.env` is already filled in with working values for your existing Docker
setup (`shard-1-primary`, `redis`, etc. as hostnames — these only resolve
inside your `kharch` Docker network). For a fresh/local setup, copy
`.env.example` instead and fill in your own values.

```bash
cp .env.example .env   # only if starting fresh
```

### 3. Run migrations

```bash
npm run migrate
```

This creates `users`, `categories` (seeded with 8 global default
categories), `transactions`, and `refresh_tokens`, tracked in a
`schema_migrations` table so re-running is a no-op for files already
applied.

By default this connects using the same `SHARD_0_*` variables the app
itself uses. You can override with plain `DB_HOST` / `DB_PORT` / `DB_USER` /
`DB_PASSWORD` / `DB_NAME` env vars, and point at a different migrations
folder with `MIGRATIONS_DIR=/some/other/path`.

### 4. Start the server

```bash
npm start        # production
npm run dev       # nodemon, auto-restart on changes
```

On success you'll see:

```
PostgreSQL connection successful
Redis connection successful
Email SMTP connection successful
Kharch API running on port 5000
```

If it exits immediately instead, it's almost always one of: DB unreachable,
Redis unreachable, or a missing/wrong SMTP credential — `server.js` checks
all three before it starts listening, on purpose, so a broken dependency
fails fast instead of serving requests it can't actually fulfill.

---

## Environment variables

| Variable | Required | Notes |
|---|---|---|
| `PORT` | No (default `5000`) | HTTP port |
| `SHARD_0_HOST` / `_PORT` / `_DB` / `_USER` / `_PASSWORD` | Yes | Primary Postgres connection |
| `SHARD_1_*`, `SHARD_2_*` | No | Reserved for future sharding, not read by any model today |
| `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` | Yes | OTPs, reset tokens, rate limiting |
| `JWT_ACCESS_SECRET` / `JWT_ACCESS_EXPIRES_IN` | Yes | Access token signing (default expiry `15m`) |
| `JWT_REFRESH_SECRET` / `JWT_REFRESH_EXPIRES_IN` | `JWT_REFRESH_SECRET` unused directly (refresh tokens are opaque, not JWTs) but kept for clarity; expiry hardcoded to 30 days in `token.service.js` |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` / `SMTP_USER` / `SMTP_PASSWORD` / `EMAIL_FROM` | Yes | All required — the process throws at startup if any is missing |
| `MIGRATIONS_DIR` | No | Overrides the default `server/migrations` folder for `npm run migrate` |

---

## API reference

Base path for every route below: `/api/v1`. All request/response bodies are
JSON. Every response has the shape:

```json
{ "success": true,  "message": "...", "data": { ... } }
{ "success": false, "message": "...", "code": "SOME_ERROR_CODE", "errors": { "field": "..." } }
```

`code` and `errors` are only present on error responses, and only when
relevant (see [Error codes](#error-codes) below).

### Health

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` or `/health` | No | Checks Postgres + Redis, used for Docker/HAProxy health checks. Returns `503` if either is down. |

---

### Auth — `/api/v1/auth`

Login and signup are both two-step (password/identity check → OTP emailed →
OTP verified → tokens issued). This means a stolen password alone can't log
in without also controlling the user's inbox.

| Method | Path | Auth | Rate limit | Body |
|---|---|---|---|---|
| POST | `/signup` | No | 10 / 15 min / IP | `{ name, email, password }` |
| POST | `/verify-signup-otp` | No | 30/15min/IP + 10/15min/email | `{ email, otp }` |
| POST | `/login` | No | 20/15min/IP + 8/15min/email | `{ email, password }` |
| POST | `/verify-login-otp` | No | 30/15min/IP + 10/15min/email | `{ email, otp }` |
| POST | `/refresh` | No | 60 / 15 min / IP | `{ refreshToken }` |
| POST | `/logout` | No | — | `{ refreshToken }` |
| POST | `/forgot-password` | No | 5 / 15 min / IP | `{ email }` |
| POST | `/verify-reset-otp` | No | 30/15min/IP + 10/15min/email | `{ email, otp }` |
| POST | `/reset-password` | No | 5 / 15 min / IP | `{ email, resetToken, password }` |
| POST | `/resend-otp` | No | 5 / 5 min / IP | `{ email, purpose }` (`purpose` ∈ `signup`, `login`, `password_reset`) |
| GET | `/me` | **Yes** | — | — |
| POST | `/logout-all` | **Yes** | — | — |

**Flow — signup:**
1. `POST /signup` → creates the user (unverified), emails a 6-digit OTP.
2. `POST /verify-signup-otp` → marks email verified, **issues tokens
   immediately** (no separate login needed).

**Flow — login:**
1. `POST /login` → checks password, emails a 6-digit OTP (only if the
   account exists, password is correct, and email is verified).
2. `POST /verify-login-otp` → issues tokens.

**Flow — password reset:**
1. `POST /forgot-password` → emails OTP if the account exists & is verified
   (always returns the same generic message either way, so this endpoint
   can't be used to check whether an email is registered).
2. `POST /verify-reset-otp` → exchanges a valid OTP for a short-lived
   (10 min) single-use `resetToken`.
3. `POST /reset-password` → `resetToken` + new password → password changed,
   **every refresh token for that user is revoked** (all devices signed
   out), confirmation email sent.

OTPs are 6 digits, expire after 5 minutes, allow 5 wrong attempts before
being invalidated, and have a 60-second resend cooldown.

Example — successful login OTP verification:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { "id": 1, "name": "Test User", "email": "test@example.com", "isEmailVerified": true },
    "accessToken": "eyJ...",
    "refreshToken": "Xw2K...",
    "accessTokenExpiresIn": "15m",
    "refreshTokenExpiresAt": "2026-10-02T07:52:19.730Z"
  }
}
```

---

### Users — `/api/v1/users` (all routes require auth)

| Method | Path | Rate limit | Body |
|---|---|---|---|
| GET | `/me` | — | — |
| PATCH | `/me` | — | `{ name }` |
| POST | `/me/change-password` | 10 / 15 min / IP | `{ currentPassword, newPassword }` |

Changing your password revokes every refresh token for your account (same
as a password reset) — you're logged out of every other session.

---

### Transactions — `/api/v1/transactions` (all routes require auth)

Every route is scoped to the authenticated user — there's no way to read or
modify another user's transactions, enforced at the query level
(`WHERE user_id = $authenticatedId`), not just in the application logic.

| Method | Path | Body / Query |
|---|---|---|
| POST | `/` | `{ type, amount, categoryId?, description?, transactionDate? }` |
| GET | `/` | Query: `page`, `limit` (max 100), `type`, `categoryId`, `startDate`, `endDate`, `search`, `sortBy` (`transactionDate`\|`amount`\|`createdAt`), `sortOrder` (`asc`\|`desc`) |
| GET | `/:id` | — |
| PATCH | `/:id` | Any subset of `{ type, amount, categoryId, description, transactionDate }` |
| DELETE | `/:id` | — |

- `type` must be `income` or `expense`.
- `amount` must be a positive number.
- `categoryId`, if provided, must resolve to a category you own or a global
  default — an arbitrary/foreign id is rejected with `CATEGORY_NOT_FOUND`.
- `transactionDate` defaults to today if omitted.
- `GET /` never 400s on a malformed `page`/`limit` — it just falls back to
  sane defaults, since it's a listing endpoint.

Example response (`GET /transactions`):
```json
{
  "success": true,
  "message": "Transactions fetched successfully",
  "data": {
    "transactions": [ { "id": 2, "type": "income", "amount": 50000, "categoryId": 7, "description": "Salary", "transactionDate": "2026-09-01T00:00:00.000Z", "createdAt": "...", "updatedAt": "..." } ],
    "pagination": { "page": 1, "limit": 20, "total": 2, "totalPages": 1 }
  }
}
```

---

### Categories — `/api/v1/categories` (all routes require auth)

Every user automatically sees the 8 seeded global default categories
(`Food`, `Transport`, `Shopping`, `Bills & Utilities`, `Entertainment`,
`Health`, `Salary`, `Other`) plus any custom categories they create.

| Method | Path | Body |
|---|---|---|
| GET | `/` | — |
| POST | `/` | `{ name }` (1–50 chars) |
| PATCH | `/:id` | `{ name }` |
| DELETE | `/:id` | — |

- You can only update/delete categories **you** created — default/global
  categories and other users' categories 404 with `CATEGORY_NOT_FOUND`.
- Deleting a category never deletes its transactions — they just become
  uncategorized (`category_id` set to `NULL`).
- Category names are unique per scope (case-insensitive): you can't have
  two categories named "Food", but different users can each have their own.

---

### Dashboard — `/api/v1/dashboard` (requires auth)

| Method | Path | Query |
|---|---|---|
| GET | `/summary` | `startDate`, `endDate` (optional, `YYYY-MM-DD`) |

One aggregation call returning income/expense totals, a per-category
breakdown, and the 5 most recent transactions — built for a single "home
screen" render with no extra round trips.

---

### Analytics — `/api/v1/analytics` (requires auth)

| Method | Path | Query |
|---|---|---|
| GET | `/overview` | `startDate`, `endDate` (optional) |
| GET | `/categories` | `startDate`, `endDate` (optional) |
| GET | `/monthly` | `year` (optional, defaults to current year) |

`/overview` additionally computes average income/expense per transaction
and a savings rate (`(income - expense) / income * 100`).

`/monthly` always returns all 12 months, even ones with zero activity
(via `generate_series` in the query), so charts don't need to backfill
missing months themselves.

---

## Error codes

The central handler (`src/middleware/error.middleware.js`) maps a stable
`error.code` to an HTTP status. Frontend code should switch on `code`, not
on the human-readable `message`.

| Code | Status | Meaning |
|---|---|---|
| `VALIDATION_ERROR` | 400 | (validators return their own `errors` object directly, without this code) |
| `USER_ALREADY_EXISTS` | 409 | Signup with an email already in use |
| `INVALID_VERIFICATION` | 400 | OTP verification for an unknown/invalid signup |
| `EMAIL_ALREADY_VERIFIED` | 400 | Re-verifying an already-verified email |
| `INVALID_CREDENTIALS` | 401 | Wrong email or password |
| `EMAIL_NOT_VERIFIED` | 403 | Login attempt before verifying email |
| `OTP_EXPIRED` | 400 | OTP not found / expired (5 min TTL) |
| `INVALID_OTP` | 400 | Wrong code |
| `OTP_ATTEMPTS_EXCEEDED` | 429 | 5 wrong attempts — OTP invalidated, must resend |
| `OTP_RESEND_COOLDOWN` | 429 | Resend requested within the 60s cooldown (`retryAfter` in response) |
| `INVALID_OTP_PURPOSE` | 400 | Internal — shouldn't surface given the validator whitelist |
| `MISSING_REFRESH_TOKEN` | 400 | No refresh token in body |
| `INVALID_REFRESH_TOKEN` | 401 | Unknown/garbage refresh token |
| `REFRESH_TOKEN_REVOKED` | 401 | Reusing an already-rotated token — treated as a possible theft signal, revokes *all* sessions for that user |
| `REFRESH_TOKEN_EXPIRED` | 401 | Past its 30-day expiry |
| `MISSING_ACCESS_TOKEN` | 401 | No `Authorization: Bearer <token>` header |
| `INVALID_ACCESS_TOKEN` | 401 | Malformed access token, or the token's user no longer exists |
| `INVALID_RESET_TOKEN` | 400 | Bad/expired/already-used password-reset token |
| `RESET_TOKEN_EXPIRED` | 400 | (reserved; reset tokens currently fall under `INVALID_RESET_TOKEN` once expired) |
| `RATE_LIMIT_EXCEEDED` | 429 | (reserved; the rate limiter returns 429 directly without this code today) |
| `NOT_FOUND` | 404 | (reserved; unmatched routes get a plain 404 without a `code`) |
| `USER_NOT_FOUND` | 404 | Authenticated user's row is gone |
| `INVALID_CURRENT_PASSWORD` | 401 | Wrong current password on change-password |
| `TRANSACTION_NOT_FOUND` | 404 | Doesn't exist, or belongs to another user |
| `CATEGORY_NOT_FOUND` | 404 | Doesn't exist, belongs to another user, or isn't a valid default |
| `CATEGORY_ALREADY_EXISTS` | 409 | Duplicate category name in your scope |

`TOKEN_EXPIRED` / `INVALID_TOKEN` (401) can also appear — these come
straight from the `jsonwebtoken` library for a malformed/expired access
token, before it ever reaches your route code.

---

## Project structure

```
server/
├── migrations/              # SQL migrations, run via `npm run migrate`
├── scripts/migrate.js       # Migration runner
├── src/
│   ├── app.js                # Express app, middleware wiring, route mounting
│   ├── server.js             # Entry point: connects DB/Redis/SMTP, then listens
│   ├── config/                # Pool, Redis client, shard config
│   ├── controllers/           # Thin HTTP layer — calls services, formats responses
│   ├── services/               # Business logic
│   ├── models/                 # SQL queries, one file per table
│   ├── middleware/              # auth, rate-limit, centralized error handling
│   └── validators/               # Per-route input validation
├── .env                     # Your actual config (never commit this)
└── .env.example              # Template with placeholder values
```
