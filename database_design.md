# Visitor Management System for Facilities — Database Design Document

**DBMS:** MySQL 8.x | **Engine:** InnoDB | **Charset:** utf8mb4
**Companion file:** `schema.sql` (ready to execute — contains all tables, indexes, sample data, and report queries)

---

## 1. ER Diagram (Text Format)

```
┌────────────┐        1      N ┌────────────┐
│   ROLES    │────────────────▶│   USERS    │
├────────────┤                 ├────────────┤
│ role_id PK │                 │ user_id PK │
│ role_name  │                 │ username   │
│ description│                 │ email      │
└────────────┘                 │ password_hash
                                │ role_id FK │
                                │ full_name  │
                                │ is_active  │
                                └─────┬──────┘
                                      │ 1
                                      │
                                      │ 0..1 (optional login)
                                      ▼
┌────────────┐        1      N ┌────────────┐
│ DEPARTMENTS│────────────────▶│  EMPLOYEES │
├────────────┤                 ├────────────┤
│department_id PK│             │employee_id PK│
│department_name │             │employee_code │
│description      │            │first_name    │
│location          │           │last_name     │
└──────┬─────┘                 │department_id FK│
       │                       │user_id FK (nullable, unique)│
       │ 1                     └──────┬───────┘
       │                              │ 1
       │                              │  N (host)
       │ N                            ▼
┌──────┴─────────────────────────────────────┐
│                   VISITS                    │
├──────────────────────────────────────────────┤
│ visit_id PK                                  │
│ visitor_id FK  ────────────┐                 │
│ host_employee_id FK        │                 │
│ department_id FK           │                 │
│ purpose                    │                 │
│ badge_number                │                │
│ check_in_time                │               │
│ check_out_time                 │             │
│ visit_status                     │           │
│ approved_by FK (users)             │         │
│ checked_in_by FK (users)             │       │
│ checked_out_by FK (users)              │     │
└──────────────────┬────────────────────────────┘
                    │ N
                    │
                    │ 1
             ┌──────┴──────┐
             │  VISITORS   │
             ├─────────────┤
             │ visitor_id PK│
             │ first_name   │
             │ last_name    │
             │ phone        │
             │ email        │
             │ id_proof_type│
             │ id_proof_number│
             │ is_blacklisted │
             └─────────────┘

┌────────────┐        N      1 ┌────────────┐
│    LOGS    │────────────────▶│   USERS    │
├────────────┤                 └────────────┘
│ log_id PK  │
│ user_id FK │ (nullable — system events)
│ action     │
│ entity_type│
│ entity_id  │
│ description│
│ created_at │
└────────────┘
```

**Relationship summary**

| Relationship | Cardinality | Notes |
|---|---|---|
| roles → users | 1 : N | Every user has exactly one role |
| users → employees | 1 : 0..1 | An employee *may* have a login account |
| departments → employees | 1 : N | Every employee belongs to one department |
| departments → visits | 1 : N | Each visit is logged against a department |
| employees → visits (host) | 1 : N | Every visit has one host employee |
| visitors → visits | 1 : N | A visitor can have many visit records (history) |
| users → visits (approved_by / checked_in_by / checked_out_by) | 1 : N | Tracks which staff performed each action |
| users → logs | 1 : N | Audit trail of actions (nullable for system/anonymous events) |

---

## 2. Relational Schema (Summary Notation)

```
roles(role_id PK, role_name UQ, description, created_at)

users(user_id PK, username UQ, email UQ, password_hash, role_id FK→roles,
      full_name, phone, is_active, last_login_at, created_at, updated_at)

departments(department_id PK, department_name UQ, description, location,
            is_active, created_at, updated_at)

employees(employee_id PK, employee_code UQ, first_name, last_name, email UQ,
          phone, designation, department_id FK→departments,
          user_id FK→users (nullable, UQ), is_active, created_at, updated_at)

visitors(visitor_id PK, first_name, last_name, email, phone, company_name,
         id_proof_type, id_proof_number, photo_url, address, is_blacklisted,
         created_at, updated_at)
         UQ(id_proof_type, id_proof_number)

visits(visit_id PK, visitor_id FK→visitors, host_employee_id FK→employees,
       department_id FK→departments, purpose, badge_number,
       check_in_time, check_out_time, visit_status,
       approved_by FK→users, checked_in_by FK→users, checked_out_by FK→users,
       remarks, created_at, updated_at)

logs(log_id PK, user_id FK→users (nullable), action, entity_type, entity_id,
     description, ip_address, user_agent, created_at)
```

---

## 3. Table Design, Primary Keys & Foreign Keys

| Table | Primary Key | Foreign Keys | Purpose |
|---|---|---|---|
| **roles** | `role_id` | — | Defines Admin / Security Officer / Employee |
| **users** | `user_id` | `role_id → roles` | Login accounts for all system actors |
| **departments** | `department_id` | — | Organizational units within the facility |
| **employees** | `employee_id` | `department_id → departments`, `user_id → users` | Staff who can be visit hosts |
| **visitors** | `visitor_id` | — | Master directory of all people who have visited |
| **visits** | `visit_id` | `visitor_id → visitors`, `host_employee_id → employees`, `department_id → departments`, `approved_by / checked_in_by / checked_out_by → users` | Transactional check-in/out record |
| **logs** | `log_id` | `user_id → users` | System/audit activity trail |

`visitors` is deliberately kept separate from `visits` so that a visitor's **history** (all past visits) is queryable via `visits.visitor_id`, while their personal/ID data is stored once and reused — this avoids duplicate data entry and supports blacklisting.

---

## 4. Constraints

- **NOT NULL** on all mandatory business fields (names, phone, purpose, check_in_time, etc.).
- **UNIQUE** constraints:
  - `users.username`, `users.email`
  - `employees.employee_code`, `employees.email`, `employees.user_id`
  - `roles.role_name`, `departments.department_name`
  - `visitors(id_proof_type, id_proof_number)` — prevents duplicate visitor identities.
- **CHECK constraints:**
  - `visits`: `check_out_time IS NULL OR check_out_time >= check_in_time` (logical time ordering).
  - `visitors.phone`: minimum length validation.
  - `users.email`: basic pattern validation.
- **ENUM constraints** restrict `visit_status` to (`Pre-Registered`, `Checked In`, `Checked Out`, `Cancelled`, `Denied`) and `id_proof_type` to a fixed set — enforced at the DB level, not just application level.
- **ON DELETE** rules:
  - `RESTRICT` on core reference data (roles, departments, visitors, employees) to prevent orphaned/accidental history loss.
  - `SET NULL` on optional links (`employees.user_id`, `visits.approved_by/checked_in_by/checked_out_by`, `logs.user_id`) so deleting a user account doesn't destroy audit/visit history.
- **Default timestamps** (`created_at`, `updated_at`) auto-managed by MySQL for traceability.

---

## 5. Normalization Explanation

The schema is normalized to **Third Normal Form (3NF)**:

- **1NF:** All columns hold atomic values (e.g., `first_name`/`last_name` split rather than a single `name` field; no repeating groups or comma-separated lists).
- **2NF:** All tables use single-column surrogate primary keys (`*_id`), so there are no partial dependencies possible on a composite key. Every non-key attribute depends on the whole key.
- **3NF:** No transitive dependencies:
  - `department_name` lives only in `departments`, referenced by FK from `employees`/`visits` — not duplicated.
  - Host employee details are not copied into `visits`; only `host_employee_id` is stored, and full name/department are derived via JOIN.
  - Visitor personal details live only in `visitors`, not repeated per visit — `visits` stores only the transactional facts (purpose, times, status).
- Controlled denormalization is **intentionally avoided** (e.g., no cached `visitor_name` column on `visits`) to prevent update anomalies; reporting queries use JOINs, supported by indexes (Section 6) to keep performance acceptable at expected volumes.

This design eliminates insertion, update, and deletion anomalies: e.g., updating a department's name requires one `UPDATE` on `departments` rather than N updates across every visit record.

---

## 6. Index Recommendations

| Index | Table.Column(s) | Reason |
|---|---|---|
| `idx_users_role` | `users(role_id)` | Speeds role-based filtering/authorization checks |
| `idx_employees_department` | `employees(department_id)` | Department employee listings |
| `idx_visitors_phone` | `visitors(phone)` | Fast visitor lookup during check-in (search by phone) |
| `idx_visitors_name` | `visitors(last_name, first_name)` | Name-based visitor search |
| `idx_visits_visitor` | `visits(visitor_id)` | Visitor history lookups |
| `idx_visits_host` | `visits(host_employee_id)` | "Visits for my meetings" queries |
| `idx_visits_department` | `visits(department_id)` | Department-level reports |
| `idx_visits_status` | `visits(visit_status)` | Filtering current/active visitors |
| `idx_visits_checkin` | `visits(check_in_time)` | Daily/monthly report date filtering, sorting |
| `idx_visits_checkout` | `visits(check_out_time)` | "Currently inside" queries (`IS NULL`) |
| `idx_visits_status_checkin` | `visits(visit_status, check_in_time)` | Composite index optimized for the "who's inside now" and date-range + status reports |
| `idx_logs_user` | `logs(user_id)` | Per-user audit trail |
| `idx_logs_created_at` | `logs(created_at)` | Time-based log queries/purging |
| `idx_logs_entity` | `logs(entity_type, entity_id)` | Audit lookup by affected record |

All primary keys and UNIQUE constraints already create indexes automatically; the above are additional indexes for query patterns specific to this system (search, reporting, "who is inside now").

---

## 7. Reporting Queries

See `schema.sql` for the runnable versions. Summary of what each does:

1. **Daily Visitor Report** — all visits where `DATE(check_in_time) = :date`, joined with visitor/employee/department names.
2. **Monthly Visitor Report** — two variants: (a) aggregated counts per day for the month, (b) full detail rows for the month — both filtered with a half-open date range (`>= first_day AND < first_day_of_next_month`), which is index-friendly (uses `idx_visits_checkin`) unlike wrapping the column in a function.
3. **Current Visitors Inside Facility** — `visit_status = 'Checked In' AND check_out_time IS NULL`, including elapsed minutes inside via `TIMESTAMPDIFF`.

---

## 8. Security Recommendations

1. **Password security:** Store only bcrypt/Argon2 hashes (never plain text or reversible encryption) in `users.password_hash`; enforce minimum complexity and rate-limit login attempts.
2. **SQL Injection prevention:** Use parameterized queries / prepared statements (or an ORM) exclusively — never string-concatenate user input into SQL.
3. **Role-Based Access Control (RBAC):** Enforce `roles` at the application layer for every endpoint (e.g., only Security Officer/Admin can check visitors in/out; only Admin manages departments/employees).
4. **Principle of least privilege:** Create a dedicated MySQL application user with only `SELECT/INSERT/UPDATE/DELETE` on `vms_db` (no `DROP`/`GRANT`/`ALTER` in production); use a separate, more restricted read-only account for reporting/BI tools.
5. **Transport security:** Enforce HTTPS/TLS for the web application and `require_secure_transport` for MySQL connections.
6. **Sensitive data protection:** Treat `id_proof_number`, `phone`, and `photo_url` as PII — mask in UI logs, encrypt at rest (e.g., via disk-level or column-level encryption) where regulations require, and restrict export permissions.
7. **Audit logging:** Every login, check-in/out, and CRUD action on visitors/employees/departments should write to `logs`, including `ip_address` and `user_agent`, to support incident investigation.
8. **Session management:** Use short-lived, signed session tokens/JWTs; invalidate sessions on logout and after password change.
9. **Input validation:** Validate all form input server-side (phone formats, email formats, date ranges) in addition to DB-level CHECK constraints — defense in depth.
10. **Blacklist enforcement:** Check `visitors.is_blacklisted` at check-in time and block/flag automatically.
11. **Regular patching:** Keep MySQL server and application dependencies updated to current stable/security-patched versions.
12. **Optional 2FA:** Consider two-factor authentication for Admin and Security Officer roles given their elevated privileges.

---

## 9. Backup Strategy

1. **Full logical backups:** Run `mysqldump --single-transaction --routines --triggers vms_db` daily during off-peak hours (InnoDB + `--single-transaction` avoids locking live tables).
2. **Binary log (incremental) backups:** Enable MySQL binary logging (`log_bin`) to allow point-in-time recovery between full backups, minimizing data loss to minutes rather than a full day.
3. **Retention policy:** Keep at least 7 daily backups, 4 weekly backups, and 12 monthly backups (adjust to institutional policy); older backups rotated out automatically via a retention script.
4. **Off-site / redundant storage:** Copy backups to a separate physical location or cloud object storage (e.g., encrypted S3-compatible storage), not only the same server as the database.
5. **Encryption:** Encrypt backup files at rest and in transit, since they contain visitor PII.
6. **Automated scheduling:** Use `cron` (Linux) or a task scheduler to run backups automatically, with alerting on failure.
7. **Restore testing:** Periodically (e.g., monthly) perform a test restore into a staging environment to verify backup integrity — an untested backup is not a reliable backup.
8. **High availability (optional, for production scale):** Consider MySQL replication (primary/replica) so a replica can be promoted quickly if the primary fails, complementing rather than replacing backups.

---

## 10. Files Delivered

- `database_design.md` — this document (ER diagram, design rationale, normalization, security, backup strategy).
- `schema.sql` — complete, executable MySQL script: `CREATE TABLE` statements for all 7 tables, all constraints/indexes, sample `INSERT` data, and the three required reporting queries (daily report, monthly report, current visitors inside).
