# Pharmacy Frontend Full FSD and Encrypted Transport Design

**Date:** 2026-09-22

**Scope:** `MyLightDrugstore-Frontend` only, using the current working-tree UI as the visual source of truth and the Laravel API in `MyLightDrugstore-Backend` as the integration contract.

## Goal

Convert the existing React/TanStack Start frontend to a complete Feature-Sliced Design architecture, connect every existing screen to the implemented Laravel API, and complete the browser-side AES-256-GCM transport without changing the current UI/UX.

## Non-negotiable constraints

- Preserve the current working-tree UI: rendered structure, Tailwind classes, labels, copy, visual hierarchy, print behavior, and user-facing interaction behavior.
- Change system architecture only. UI changes are out of scope unless required to preserve an existing interaction after an API migration.
- Do not use local mock data, `mockApi`, `MockApiClient`, `createSeedDb`, or local-storage session credentials in production code.
- Keep authentication session state in Laravel's HTTP-only cookie; keep CSRF and transport state in memory.
- Do not change Laravel business logic or transport protocol unless a verified frontend/backend contract mismatch requires a narrowly scoped backend correction.
- Preserve existing tests and quality gates; add tests for new transport, adapter, and boundary behavior.

## Current-state findings

The working tree already contains partial FSD and transport work, but it is incomplete:

- Entity clients exist for medicine, inventory, sale, report, user, and backup resources.
- A transport client exists, but the CSRF response token is not persisted for later unsafe requests.
- Legacy pages still call `mockApi` and import the monolithic `shared/api/client.ts`.
- `SessionContext` remains in `shared`, even though session/auth is domain behavior.
- The application still uses a catch-all route and legacy root page/widget files.
- The existing backend contract is implemented under `/api/v1` and requires encrypted request/response bodies for every endpoint except the plaintext public-key bootstrap.

## Target architecture

The frontend will use the following FSD layers and public-slice boundaries:

```text
src/
  app/
    providers/
    router/
  pages/
    login/
    dashboard/
    catalog/
    inventory/
    sales/
    reports/
    security/
    admin-users/
    backups/
  widgets/
    app-shell/
    dashboard/
    inventory/
    sales/
    reports/
  features/
    auth/
    catalog-management/
    inventory-receipts/
    inventory-adjustments/
    sales-entry/
    sales-cart/
    password-change/
    staff-management/
    backup-management/
  entities/
    user/
    medicine/
    inventory/
    sale/
    report/
    backup/
    system/
  shared/
    api/
      transport/
      http/
    config/
    lib/
    ui/
  routes/
```

The allowed dependency direction is:

```text
shared -> entities -> features -> widgets -> pages -> app/routes
```

Imports may only cross a slice through its public `index.ts` entry point. A lower layer cannot import a higher layer. Routes compose pages and guards; they do not contain domain calls or visual implementations.

The existing generic UI components will move from the monolithic `shared/ui.tsx` into focused `shared/ui` modules while preserving their props and output. Domain-specific components will live in their owning entity, feature, or widget slice.

## Route architecture

TanStack Start file routes will replace the catch-all surface:

- `routes/__root.tsx` owns the document shell and app providers.
- `routes/login.tsx` owns the public login entry.
- `routes/_authenticated.tsx` owns the authenticated layout and session guard.
- Nested authenticated route files map the existing dashboard, catalog, inventory, sales, reports, security, admin, and backup URLs.
- Generated route metadata remains generated and is not hand-maintained.

The existing URL paths will remain stable, including `/login`, `/dashboard`, `/catalog/medicines`, `/inventory`, `/inventory/receipts`, `/inventory/adjustments`, `/inventory/movements`, `/sales`, `/sales/new`, `/sales/cart`, `/sales/print/:saleId`, `/reports/inventory`, `/reports/sales`, `/settings/security`, `/admin/users`, and `/backups`.

## Backend integration boundaries

Entity API clients will be typed adapters over one shared transport client. They will normalize Laravel response envelopes and map wire fields into the existing UI-facing models.

The endpoint ownership is:

| Slice | Endpoints |
| --- | --- |
| `features/auth` and `entities/user` | CSRF, login, logout, current user, password change, admin user list/detail/create/update |
| `entities/medicine` | medicine list/detail/create/update/archive |
| `entities/inventory` | summary, lots, receipts, adjustments, movements |
| `entities/sale` | sale list/detail/create, add/remove item, mark paid, cancel |
| `entities/report` | inventory and sales reports |
| `entities/backup` | backup request/status/download |
| `entities/system` | server time |
| `shared/api/transport` | public-key bootstrap and encrypted HTTP request/response processing |

Feature slices will own mutations, form validation, idempotency-key lifetime, error presentation, and cache/refetch decisions. Pages and widgets will consume feature/entity public APIs rather than calling `fetch` or a transport client directly.

Sale creation, sale-item addition, and stock receipt actions will generate one idempotency key per user action and reuse it when that same action is retried. Backup downloads will request binary data through the encrypted transport, create a temporary `Blob` URL, trigger the browser download, and revoke the URL.

## AES-256-GCM transport design

The transport implementation is isolated in `shared/api/transport` and follows the existing Laravel protocol:

1. Fetch `GET /api/v1/transport/public-key` with credentials and validate the `{ data: ... }` metadata.
2. Import the RSA public key with RSA-OAEP and SHA-256.
3. Generate a random 32-byte AES-GCM key and wrap its raw bytes with RSA-OAEP.
4. Send `X-Transport-Key: <keyId>.<base64url(wrappedKey)>` on every API request.
5. Encode non-empty logical request bodies as JSON descriptors and encrypt them with AES-GCM using a fresh 12-byte nonce and a 128-bit authentication tag.
6. Use AAD exactly equal to uppercase HTTP method, one space, and the normalized URL path without the query string, for example `POST /api/v1/sales`.
7. Send the envelope `{ version: 1, algorithm: "A256GCM", keyId, iv, ciphertext }`, where `ciphertext` contains the AES-GCM authentication tag appended by Web Crypto.
8. Decrypt response envelopes using the same key and AAD, validate the logical descriptor, decode UTF-8 JSON or base64 binary data, and preserve the HTTP status and safe logical headers.
9. Keep CSRF state in memory. Before an unsafe request, bootstrap `GET /auth/csrf` when needed, retain its returned token, and send `X-CSRF-TOKEN`.
10. Use `credentials: "include"` for session cookies. Never persist session credentials, AES keys, wrapped keys, or decrypted payloads in local storage.
11. Clear cached transport and CSRF state after authentication/transport invalidation. Do not automatically replay a non-idempotent request.

Transport errors will be normalized into a typed error that retains status, stable API code, request ID, and safe details. Malformed envelopes, invalid base64url, wrong key IDs, wrong nonce/tag lengths, AAD mismatch, and authentication failures will fail closed with generic messages.

## Testing and verification design

The frontend will expose quality scripts matching the repository gate:

- `pnpm run typecheck`
- `pnpm run format:check`
- `pnpm run test:architecture`
- `pnpm run test:unit`
- `pnpm run build`

Tests will cover:

- AES key generation, RSA wrapping, AES-GCM round trips, AAD/path binding, tampered ciphertext, invalid envelopes, and base64url canonicalization.
- CSRF bootstrap and header propagation, encrypted JSON success/error responses, encrypted binary responses, and transport key reuse/refresh behavior.
- Entity adapter request paths, payload mapping, pagination, and backend error normalization.
- Feature mutation behavior, including permissions, idempotency keys, cancellation, password changes, and backup downloads.
- FSD architecture rules: upward imports, deep cross-slice imports, legacy `mockApi` references, and unauthorized root-layer files.

Verification will run targeted tests first, then the complete frontend gate and a browser smoke pass against the existing development environment. No test will use focused or skipped execution to mask failures.

## Acceptance criteria

The work is complete only when:

1. All current screens render with their existing UI/UX and stable URLs.
2. No production code imports `mockApi`, `MockApiClient`, `createSeedDb`, the old session context, or the old monolithic API client.
3. All backend-backed reads and writes use typed FSD entity/feature boundaries.
4. All API requests and responses use the Laravel AES-256-GCM transport, except the public-key bootstrap endpoint.
5. CSRF, HTTP-only session cookies, idempotency keys, role checks, and encrypted binary downloads work through the frontend boundary.
6. FSD boundary tests, transport tests, typecheck, format check, build, and applicable CI checks pass with fresh output.

