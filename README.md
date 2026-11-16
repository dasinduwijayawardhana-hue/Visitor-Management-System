# Gatehouse — Visitor Management System (VMS)

A modern, full-stack enterprise Visitor Management System designed for high-security facilities, corporate campuses, and administrative complexes. Gatehouse streamlines visitor registration, real-time host employee approvals, physical and QR gate pass issuance, badge check-in/check-out workflows, and audit reporting.

---

## 1. Project Architecture

Gatehouse is organized as a unified monorepo comprising a React client application and an Express.js backend REST API service:

```
VMS_Project_FIXED_4/
├── client/                      # React 18 + Vite 5 Frontend Application
│   ├── src/
│   │   ├── api/                 # Axios HTTP client with JWT refresh interceptor
│   │   ├── components/          # Reusable UI component library (badge motif)
│   │   ├── context/             # AuthContext, ToastContext, ThemeContext
│   │   ├── hooks/               # Custom React hooks (pagination, debounce)
│   │   ├── pages/               # Role-based views: Admin, Security, Employee, Portal
│   │   └── routes/              # Protected & Role-guarded route definitions
│   ├── package.json
│   └── vite.config.js
│
├── server/                      # Node.js + Express + Prisma REST API Backend
│   ├── prisma/
│   │   ├── schema.prisma        # Database relational schema (Prisma ORM)
│   │   └── seed.js              # Database seed script for roles & initial users
│   ├── src/
│   │   ├── config/              # Centralized environment, logger & database config
│   │   ├── controllers/         # HTTP request handlers & response formatting
│   │   ├── middleware/          # JWT auth, RBAC, Multer upload & error handling
│   │   ├── routes/              # API router declarations & Swagger JSDoc docs
│   │   ├── services/            # Core business logic & database transactions
│   │   ├── utils/               # ApiError, ApiResponse & token utilities
│   │   └── validators/          # Joi request schema validation rules
│   ├── package.json
│   └── nodemon.json
│
├── database_design.md           # Relational schema specification & ER diagram
├── schema.sql                   # Executable raw MySQL DDL script
├── FIXES_APPLIED.md             # Changelog of audit fixes and optimizations
└── README.md                    # Root project documentation
```

---

## 2. Key Features

- **Multi-Role Access Control (RBAC):** Distinct permissions for Administrator, Security Officer, Employee, and Visitor roles.
- **Visitor Self-Service Portal:** Pre-registration, visit requests with host selection, and profile tracking.
- **Employee Approval Queue:** Host employees can review, approve, or reject visitor appointment requests with remarks.
- **QR Code Gate Pass:** Generates cryptographically secure QR tokens and printable/scannable gate passes.
- **Security Check-In / Check-Out:** Live front desk intake, physical badge assignment, duration tracking, and walk-in support.
- **Blacklist Enforcement:** Instant identity cross-check against blacklisted records preventing entry of flagged individuals.
- **Audit Logging & Analytics:** Automated system event logging, daily traffic summaries, and PDF/CSV report exports.

---

## 3. Getting Started

### Prerequisites
- Node.js 18+ and npm
- MySQL 8.x running locally or via Docker

### Backend Setup (`server/`)
```bash
cd server
npm install
cp .env.example .env
# Configure DATABASE_URL, JWT secrets, and PORT=5000 in .env

# Run database migrations and seed default records
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed

# Start development server
npm run dev
# Server running at http://localhost:5000
# API documentation available at http://localhost:5000/api-docs
```

### Frontend Setup (`client/`)
```bash
cd client
npm install
cp .env.example .env
# Ensure VITE_API_BASE_URL=http://localhost:5000/api

# Start Vite development server
npm run dev
# Application accessible at http://localhost:5173
```

---

## 4. Contributors

- **Janitha Kushan** ([@janithakushaa-ops](https://github.com/janithakushaa-ops)) — Database design, Prisma ORM migrations, server infrastructure, Winston logging, security middleware, and configuration.
- **Dasindu Wijayawardhana** ([@dasinduwijayawardhana-hue](https://github.com/dasinduwijayawardhana-hue)) — REST API architecture, Express routes, controllers, business services, Joi validators, and integration testing.
- **Nikila Abeysinghe** ([@nikila-abeysinghe](https://github.com/nikila-abeysinghe)) — Frontend React application, custom design system, component architecture, state management, and API integration.
