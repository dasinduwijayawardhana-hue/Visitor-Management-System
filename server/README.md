# Visitor Management System (VMS) — Backend API

A production-oriented REST API for managing visitor registration, check-in/check-out,
employee hosting, departments, reporting, authentication, and audit logging — built with
**Node.js, Express, MySQL, Prisma ORM, JWT, bcrypt, Winston, and Swagger/OpenAPI**.

The database design (tables, indexes, constraints) matches `database_design.md` /
`schema.sql` exactly — this repo is the application layer on top of that schema.

---

## 1. Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 18+ |
| Framework | Express.js |
| Database | MySQL 8.x |
| ORM | Prisma |
| Auth | JWT (access + refresh tokens) |
| Password hashing | bcrypt |
| Validation | Joi |
| Logging | Winston (daily-rotating files) + Morgan (HTTP access logs) |
| API docs | Swagger / OpenAPI 3 (swagger-jsdoc + swagger-ui-express) |
| Reports | json2csv (CSV), pdfkit (PDF) |
| Security | helmet, cors, express-rate-limit |

---

## 2. Project Structure

```
vms/
├── prisma/
│   ├── schema.prisma        # Data model (7 tables, matches database_design.md)
│   └── seed.js               # Seeds roles + an admin/security/employee user
├── src/
│   ├── config/
│   │   ├── env.js             # Centralized, validated env var loader
│   │   ├── database.js        # Prisma client singleton
│   │   ├── logger.js          # Winston logger (daily rotation)
│   │   └── swagger.js         # OpenAPI spec generation
│   ├── controllers/           # Thin HTTP layer — calls services, shapes responses
│   ├── services/              # Business logic (the "real" application code)
│   ├── routes/                # Express routers + Swagger JSDoc annotations
│   ├── middleware/
│   │   ├── auth.middleware.js       # JWT verification
│   │   ├── role.middleware.js       # RBAC (authorize('Admin', ...))
│   │   ├── validate.middleware.js   # Joi request validation
│   │   ├── error.middleware.js      # Centralized error handling
│   │   ├── rateLimit.middleware.js  # Global + login-specific rate limits
│   │   └── requestLogger.middleware.js
│   ├── validators/            # Joi schemas per module
│   ├── utils/                 # ApiError, ApiResponse, asyncHandler, jwt, etc.
│   ├── app.js                 # Express app assembly (middleware order, routes)
│   └── server.js              # Boot + graceful shutdown
├── logs/                      # Winston output (git-ignored)
├── .env.example
├── package.json
└── README.md
```

This follows a **clean/layered architecture**:

```
Route (HTTP + validation + Swagger docs)
   → Controller (thin — request/response shaping only)
       → Service (business rules, Prisma queries, error decisions)
           → Prisma / MySQL
```

Controllers never talk to Prisma directly, and services never touch `req`/`res` —
this keeps business logic testable and reusable.

---

## 3. Getting Started

### 3.1 Prerequisites
- Node.js 18+
- A running MySQL 8.x server
- A MySQL user with privileges on a `vms_db` database (see `database_design.md`
  section 8, item 4 for the least-privilege recommendation)

### 3.2 Install

```bash
cd vms
npm install
cp .env.example .env
```

Edit `.env` and set at minimum:

```
DATABASE_URL="mysql://vms_app:yourpassword@localhost:3306/vms_db"
JWT_ACCESS_SECRET=<long random string>
JWT_REFRESH_SECRET=<a different long random string>
```

Generate strong secrets, e.g.:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 3.3 Set up the database

```bash
npm run prisma:migrate     # creates all tables from prisma/schema.prisma
npm run prisma:seed        # seeds roles + admin/security/employee sample users
```

Seeded accounts (change these passwords immediately outside local dev):

| Role | Username | Password |
|---|---|---|
| Admin | `admin` | `Admin@12345` |
| Security Officer | `security1` | `Security@12345` |
| Employee | `jsmith` | `Employee@12345` |

### 3.4 Run

```bash
npm run dev      # nodemon, auto-restart
# or
npm start        # production
```

Server: `http://localhost:5000`
Swagger UI: `http://localhost:5000/api-docs`
Health check: `http://localhost:5000/health`

---

## 4. Authentication & Roles

Auth uses **short-lived JWT access tokens** (default 15m) + **long-lived refresh
tokens** (default 7d) signed with separate secrets.

```
Authorization: Bearer <accessToken>
```

| Role | Permissions |
|---|---|
| **Admin** | Full CRUD on all modules (users, departments, employees, visitors, visits, reports) |
| **Security Officer** | Register visitors, check-in/check-out, view visits & reports |
| **Employee** | View only the visits where they are the host (`GET /api/employees/my-visitors`) |

`POST /api/auth/register` always assigns the **Employee** role — it's a self-signup
endpoint for staff, not a way to create privileged accounts. Admins create Admin /
Security Officer accounts via `POST /api/users` (Admin-only).

---

## 5. REST API Overview

Full interactive docs (with try-it-out) live at **`/api-docs`**. Summary:

### Auth — `/api/auth`
| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/register` | Public | Self-register (Employee role) |
| POST | `/login` | Public (rate-limited) | Returns access + refresh tokens |
| POST | `/refresh` | Public | Exchange refresh token for new access token |
| POST | `/logout` | Authenticated | Revokes current access token |
| GET | `/me` | Authenticated | Current user profile |

### Users — `/api/users` (Admin only)
`GET /` · `POST /` · `GET /:id` · `PUT /:id` · `DELETE /:id` · `PATCH /:id/change-password`

### Departments — `/api/departments`
`GET /`, `GET /:id` — any authenticated role
`POST /`, `PUT /:id`, `DELETE /:id` — Admin only

### Employees — `/api/employees`
`GET /`, `GET /:id` — Admin, Security Officer
`POST /`, `PUT /:id`, `DELETE /:id` — Admin only
`GET /my-visitors` — Employee (self)

### Visitors — `/api/visitors`
`GET /`, `POST /`, `GET /:id`, `PUT /:id` — Admin, Security Officer
`DELETE /:id`, `PATCH /:id/blacklist` — Admin only

### Visits — `/api/visits` (Admin, Security Officer)
`GET /` · `POST /` · `GET /:id` · `POST /:id/check-in` · `POST /:id/check-out` ·
`PATCH /:id/status` · `GET /currently-inside`

### Reports — `/api/reports` (Admin, Security Officer)
`GET /daily?date=YYYY-MM-DD&format=json|csv|pdf`
`GET /monthly?year=YYYY&month=M&format=json|csv|pdf`
`GET /current-visitors?format=json|csv|pdf`

---

## 6. API Examples

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "security1", "password": "Security@12345"}'
```
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Login successful.",
  "data": {
    "user": { "userId": 2, "username": "security1", "role": "Security Officer", "...": "..." },
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi..."
  }
}
```

### Register a visitor
```bash
curl -X POST http://localhost:5000/api/visitors \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Alice",
    "lastName": "Brown",
    "phone": "+1-555-0123",
    "idProofType": "NATIONAL_ID",
    "idProofNumber": "N12345678"
  }'
```

### Create a visit (pre-register) and check in
```bash
curl -X POST http://localhost:5000/api/visits \
  -H "Authorization: Bearer <accessToken>" -H "Content-Type: application/json" \
  -d '{"visitorId": 1, "hostEmployeeId": 1, "departmentId": 1, "purpose": "Vendor meeting"}'

curl -X POST http://localhost:5000/api/visits/1/check-in \
  -H "Authorization: Bearer <accessToken>" -H "Content-Type: application/json" \
  -d '{"badgeNumber": "B-204"}'
```

### Who's inside right now
```bash
curl http://localhost:5000/api/visits/currently-inside \
  -H "Authorization: Bearer <accessToken>"
```

### Download a daily report as PDF
```bash
curl "http://localhost:5000/api/reports/daily?date=2026-07-20&format=pdf" \
  -H "Authorization: Bearer <accessToken>" -o daily-report.pdf
```

---

## 7. Security Notes (implements database_design.md §8)

- Passwords hashed with **bcrypt** (configurable salt rounds), never stored/logged in plain text.
- **SQL injection** is structurally prevented — all queries go through Prisma's
  parameterized query builder; no raw string-concatenated SQL anywhere.
- **RBAC** enforced per-route via `authorize('Admin', ...)` middleware.
- **Rate limiting**: global API limiter + a stricter limiter on `/api/auth/login`
  to blunt brute-force attempts.
- **helmet** sets standard hardening HTTP headers; **cors** restricts allowed origins.
- **Blacklist enforcement**: visitor registration and check-in both reject blacklisted visitors.
- **Audit logging**: login, logout, failed logins, and every CRUD/check-in/check-out
  action writes a row to `logs` with `ip_address` and `user_agent`.
- Centralized error handler never leaks stack traces or raw DB errors in production.
- JWT access tokens are short-lived; logout revokes the current token via an
  in-memory blacklist (swap for Redis in a multi-instance production deployment —
  see the comment in `src/utils/tokenBlacklist.js`).

---

## 8. Logging

Winston writes daily-rotating JSON logs to `logs/`:
- `app-YYYY-MM-DD.log` — all levels (14-day retention)
- `error-YYYY-MM-DD.log` — errors only (30-day retention)

In development, logs are also pretty-printed to the console. HTTP access logs
(via Morgan) are piped into the same Winston logger.

---

## 9. Error Response Shape

All errors return a consistent JSON envelope:
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "phone", "message": "Phone must be a valid phone number (min 7 digits)" }
  ]
}
```

---

## 10. Extending the Project

- **Testing**: add Jest/Supertest; services are pure functions around Prisma calls,
  so they're straightforward to unit-test with a mocked `prisma` client.
- **Refresh token rotation / storage**: for stricter security, persist refresh
  tokens (or their hashes) in a table and invalidate on use.
- **2FA**: the design doc recommends optional 2FA for Admin/Security roles —
  hook into `auth.service.js#login` after password verification.
- **Photo upload**: `visitors.photoUrl` currently expects a URL string; wire up
  S3/Cloud Storage + multer if you need direct file uploads.
