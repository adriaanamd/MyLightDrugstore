# MyLightDrugstore frontend

This frontend is a TanStack Start application for the MyLightDrugstore Laravel API.

## Setup

```powershell
corepack pnpm install --frozen-lockfile
corepack pnpm run dev
```

Set the client-safe API base URL in `.env` when the Laravel API is not served from the same origin:

```text
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

Do not put private keys, session credentials, or database settings in frontend environment variables.

## Quality gates

```powershell
corepack pnpm run test:architecture
corepack pnpm run typecheck
corepack pnpm run format:check
corepack pnpm run test
corepack pnpm run build
```

The source tree uses the Feature-Sliced Design layers `shared`, `entities`, `features`, `widgets`, `pages`, and `app`. TanStack file-based routes live in `src/routes` and delegate to page slices. The browser transport client encrypts API request and response bodies with the Laravel v1 AES-256-GCM envelope.
