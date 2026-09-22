# MyLight Drugstore frontend

This package is the React/TanStack Start frontend for MyLight Drugstore. Its
source is organized using Feature-Sliced Design (FSD): `app`, `pages`,
`widgets`, `features`, `entities`, and `shared` are the allowed architectural
layers. The migration preserves the existing presentation and routes; the
backend remains a separate workspace and is not changed by frontend work.

## Install and run

```powershell
pnpm install --frozen-lockfile
pnpm run dev
```

The default development port is `8443`. Set `PORT` to use another port.

The API base URL is configured with `VITE_API_BASE_URL`. If it is omitted, the
frontend uses `http://localhost:8000/api/v1`.

## Quality commands

Run the complete local frontend gate from this directory:

```powershell
pnpm install --frozen-lockfile
pnpm run test:architecture
pnpm run typecheck
pnpm run format:check
pnpm run test:unit
pnpm run build
```

`test:architecture` enforces FSD import boundaries, source-size limits, and
production-code quality rules. `test:unit` includes transport, entity,
feature, page, widget, integration, and architecture contract tests.

## Transport security boundary

All API requests are made through `src/shared/api/transport`. The frontend
bootstraps an RSA-OAEP-256-wrapped AES-256 key from the plaintext
`/transport/public-key` endpoint, then encrypts request and response payloads
with AES-256-GCM. The HTTP method and path are authenticated as additional
authenticated data. CSRF protection, cookies, request IDs, response errors,
idempotency keys, and binary downloads remain in the same typed transport
boundary.

Feature and entity code must depend on the typed API client instead of calling
`fetch` directly. Transport failures are normalized into user-visible feature
errors; encryption keys and session state are kept in memory rather than
persisted in browser storage.

## Browser smoke verification

The smoke test is intentionally separate from the deterministic unit gate. It
requires a running frontend, a compatible backend, test-only credentials, and
an in-stock medicine ID. It covers protected redirects, login, dashboard,
catalog, inventory, sale creation, staff admin denial, encrypted transport
failure visibility, and the admin backup/download path.

Install the Playwright browser once, then provide credentials through the
environment without committing them:

```powershell
pnpm exec playwright install chromium
$env:FRONTEND_SMOKE_URL = "http://localhost:8443"
$env:SMOKE_STAFF_USERNAME = "<staff test username>"
$env:SMOKE_STAFF_PASSWORD = "<staff test password>"
$env:SMOKE_ADMIN_USERNAME = "<admin test username>"
$env:SMOKE_ADMIN_PASSWORD = "<admin test password>"
$env:SMOKE_MEDICINE_ID = "<in-stock medicine id>"
pnpm run test:smoke
```

If the backend or its test data is unavailable, the smoke command must be
reported as blocked with its exact failure; do not replace it with plaintext
API calls or committed credentials.
