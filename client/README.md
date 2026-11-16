# Gatehouse — Visitor Management System (Frontend)

A React + Vite frontend for visitor registration, check-in/check-out, employee &
department management, reporting, and role-based administration.

Built strictly against the provided backend API contract — no endpoints were
invented. Where the spec called for a feature with no matching endpoint
(system Logs), the UI is built and clearly labeled **"Pending Backend
Support"** instead.

## Tech stack

- React 18 + Vite 5
- React Router v6 (role-based route guards)
- Axios (with JWT access/refresh interceptors)
- Tailwind CSS (custom "badge" design system — see below)
- React Hook Form (all forms/validation)
- Chart.js (`chart.js/auto`, wrapped in a small hook — daily/monthly charts)

## Getting started

```bash
npm install
cp .env.example .env      # set VITE_API_BASE_URL if your backend isn't on :5000
npm run dev                # http://localhost:5173
npm run build               # production build to /dist
```

The backend is expected at `http://localhost:5000/api` by default (see `.env.example`).

## Folder structure

```
src/
  api/            axios instance + one file per resource (auth, users, ...)
  context/        AuthContext, ToastContext, ThemeContext
  hooks/          useAuth, useToast, useTheme, usePagination, useDebounce
  routes/         ProtectedRoute (auth check), RoleRoute (role check), AppRoutes
  components/
    layout/       Sidebar, Topbar, DashboardLayout, AuthLayout, navConfig
    common/       Table, Pagination, Modal, ConfirmDialog, Badge, SearchInput,
                  Spinner, EmptyState, Card (StatCard), PageHeader, FormField,
                  PendingBackendNotice
    charts/       Chart.js wrappers: DailyVisitorsChart, MonthlyVisitorsChart
  pages/
    auth/         Login, Register
    admin/        Dashboard, Users, Visitors, Employees, Departments, Visits,
                  Reports, Logs (pending backend), Profile
    security/     Dashboard, VisitorRegistration, CheckIn, CheckOut, VisitorSearch
    employee/     Dashboard, MyVisitors
  utils/          roles.js, constants.js, formatters.js
```

## Authentication flow

1. `POST /auth/login` returns an access token (+ refresh token), stored in
   `localStorage` via `tokenStore` (`src/api/axiosClient.js`).
2. Every request attaches `Authorization: Bearer <token>` via an axios request
   interceptor.
3. On a `401`, a response interceptor calls `POST /auth/refresh` once
   (in-flight requests share a single refresh call), retries the original
   request, and forces a logout if the refresh itself fails.
4. `GET /auth/me` hydrates the current user on page load if a token exists.
5. Registration (`POST /auth/register`) always creates an **Employee**
   account, per the API contract.

## Role-based access

- `ProtectedRoute` redirects unauthenticated users to `/login`.
- `RoleRoute` redirects authenticated users who lack the required role to
  their own dashboard (`roleHomePath` in `utils/roles.js`).
- The sidebar (`components/layout/navConfig.js`) renders only the nav items
  for the signed-in user's role.

## Notes on API response shapes

The contract specifies routes and access rules but not exact response
bodies. Every data-consuming page reads defensively — e.g.
`data?.data || data?.employees || data` — and dashboard/report charts
normalize a couple of plausible shapes. Adjust the `render`/normalize
functions in each page or in `components/charts/*.jsx` once real response
shapes are confirmed.

## Features implemented

- Responsive layout (mobile sidebar drawer, responsive tables/grids)
- Dark mode (toggle in the top bar, persisted to `localStorage`)
- Form validation (React Hook Form on every form)
- Search, filters, and client-side pagination on all list pages
- Toast notifications for every create/update/delete action
- CSV/PDF export buttons on the Reports page (streams the backend's file
  response as a download)
- System Logs page is UI-only and marked "Pending Backend Support" since
  `/api/logs` isn't part of the contract
