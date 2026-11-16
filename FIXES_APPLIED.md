# Fix Changelog

This zip contains the same VMS project (frontend + backend) with every issue from the audit report fixed. `node_modules` is **not** included — run `npm install` in each folder before starting either app.

## Backend (`visitor-management-backend/`)

1. **Deleted** the empty leftover directory `src/{config,controllers,routes,middleware,services,validators,utils}`.
2. **`.env` / `.env.example`** — `CORS_ORIGIN` changed from `http://localhost:3000` to `http://localhost:5173` to match the frontend's actual Vite dev server port.
3. **`.env`** — JWT access/refresh secrets replaced with real randomly-generated 96-character hex strings (previously literal placeholder text). Regenerate your own before any deployment beyond your machine.
4. **`src/controllers/user.controller.js`** — `changePassword`'s authorization check now `throw`s `ApiError.forbidden(...)` instead of manually building a `ApiResponse(403, ...)`, so it goes through the same centralized error logging as every other 403 in the app.
5. **`src/validators/auth.validator.js`** — removed the unused, misleading `roleId` field from the public `/auth/register` schema (the service always forces the Employee role and never read this field).

## Frontend (`vms-frontend/`)

The core problem: the frontend was built assuming a generic REST shape (`id`, `name`, `blacklisted`, `employeeId`) while the backend actually uses specific Prisma-mapped field names (`visitorId`, `firstName`/`lastName`, `isBlacklisted`, `hostEmployeeId`, etc.), and the backend wraps every response in `{ success, message, data, meta }`. Every file below was rewritten to match the backend exactly.

| File | What changed |
|---|---|
| `src/utils/constants.js` | Visit status values corrected to the real Prisma enum (`Pre_Registered`, `Checked_In`, `Checked_Out`, `Cancelled`, `Denied`) instead of made-up strings (`Scheduled`, `Checked In`...). Added shared `ID_PROOF_TYPES`. |
| `src/api/axiosClient.js` | Token refresh now reads `body.data.accessToken` (the real envelope shape) instead of a non-existent top-level `body.accessToken`. |
| `src/context/AuthContext.jsx` | `login`, `register`, and `loadCurrentUser` now correctly unwrap `{ data: { user, accessToken, refreshToken } }`; `register` no longer expects tokens that the backend never sends. |
| `src/pages/auth/Login.jsx` | Field renamed `email` → `username` (backend matches this against either column). |
| `src/pages/auth/Register.jsx` | Added required `username` field; `name` → `fullName`. |
| `src/pages/security/VisitorRegistrationPage.jsx` | Visitor fields aligned to `firstName`/`lastName`/`companyName`/`idProofType`/`idProofNumber`; visit fields aligned to `hostEmployeeId` + auto-derived `departmentId`. |
| `src/pages/security/CheckInPage.jsx` / `CheckOutPage.jsx` | `visit.id` → `visit.visitId`; `visitor?.name` → `firstName`/`lastName`; status field/enum fixed. |
| `src/pages/security/VisitorSearchPage.jsx` | All visitor fields aligned (`firstName`/`lastName`/`companyName`/`idProofNumber`/`isBlacklisted`). |
| `src/pages/admin/UsersPage.jsx` | Added `username`; `name` → `fullName`; role `<select>` now submits numeric `roleId` (see note below). |
| `src/pages/admin/EmployeesPage.jsx` | Added `employeeCode`; `name` → `firstName`/`lastName`; `designation`; `department.departmentId`/`departmentName`. |
| `src/pages/admin/DepartmentsPage.jsx` | `name` → `departmentName`; added `location`. |
| `src/pages/admin/VisitorsPage.jsx` | Same visitor field fixes as above; blacklist toggle now sends `isBlacklisted`. |
| `src/pages/admin/VisitsPage.jsx` | `visit.id` → `visitId`; status field renamed `status` → `visitStatus` with the corrected enum. |
| `src/pages/employee/MyVisitorsPage.jsx` | Same visitor/status field fixes. |
| `src/pages/admin/AdminDashboard.jsx` / `src/pages/security/SecurityDashboard.jsx` | Fixed report/list response unwrapping — was reading fields (`hourly`, `total`, plain array counts) that don't exist in the real API responses, so all four stat cards and both charts were silently showing 0/empty before. |
| `src/pages/employee/EmployeeDashboard.jsx` | Same visitor/status field fixes as `MyVisitorsPage`. |
| `src/pages/admin/ReportsPage.jsx` | Fixed daily/monthly report row extraction (`body.data.visits`, an object, was being treated as the array itself). |
| `src/pages/admin/ProfilePage.jsx` | `user.id` → `user.userId`; `user.name` → `user.fullName`. |
| `src/components/common/Badge.jsx` | Now shows a human-readable label (`Checked In`) for the underlying enum value (`Checked_In`). |

### One known limitation, called out honestly

`UsersPage.jsx` needs a `roleId` (numeric foreign key) to create/edit a user, but the documented API contract has **no `GET /api/roles` endpoint** to fetch valid IDs dynamically. The fix hardcodes `{Admin: 1, "Security Officer": 2, Employee: 3}`, matching the deterministic order roles are created in `prisma/seed.js` on a fresh database. This is called out in a code comment in `UsersPage.jsx`. If you ever reseed roles in a different order, or want this to be fully robust, the correct long-term fix is adding a small `GET /api/roles` endpoint on the backend — happy to add that if you want it.
