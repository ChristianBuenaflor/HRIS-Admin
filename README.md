# SNL IT SOLUTIONS — Human Resource Information System (HRIS Admin)

Admin frontend for the HRIS platform (React + TypeScript + Vite + Tailwind + shadcn/ui). Backend API is Laravel (separate repository).

## Requirements

- Node.js 20+
- npm 10+

## Installation

```bash
npm ci
```

## Development

```bash
npm run dev
```

App base path is `/snl-hr/frontend/` (see `vite.config.ts`). Public assets must use `import.meta.env.BASE_URL` (e.g. `${import.meta.env.BASE_URL}logo.png`).

## Build

```bash
npm run build
```

Runs `tsc -b` then `vite build`. Build currently gates on TypeScript; fix `TS6192` unused imports before release.

## Lint

```bash
npm run lint
```

## Environment

- API base: `https://api-hris.slarenasitsolutions.com/public/api` (see `src/utils/axios.ts` and `src/utils/BASE_URL_API.ts`)
- Auth token stored in `localStorage` (`token`, `user`, `role`). Logout clears local session and calls `POST /logout` when available.
- Unknown roles are denied by default (`src/utils/role.ts`).

## Security notes

- Announcement HTML is sanitized client-side before `dangerouslySetInnerHTML`; server must also validate/sanitize.
- Do not commit credential hints or verbose FormData logs (may contain passwords/PII).
- `npm audit` reports advisories in locked deps (axios, jspdf, react-router-dom, vite, xlsx, etc.). Review reachability before upgrading; `jspdf` fix is a major version, `xlsx` has no auto-fix.

## Repository layout

- `src/auth` — login
- `src/client` — public candidate portal
- `src/features` — dashboard, employees, payroll, attendance, recruitment, setup-manager, etc.
- `src/routes/MainRoutes.tsx` — route guards (`RequireAuth`, `RequireAccess`)
- `src/utils/role.ts`, `src/utils/permissions.ts` — role checks
