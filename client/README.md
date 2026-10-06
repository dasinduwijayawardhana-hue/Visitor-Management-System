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
