# Pharmacy Frontend Full FSD and Encrypted Transport Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the existing frontend migration into complete FSD, connect every current screen to the Laravel API, and implement the Laravel-compatible AES-256-GCM transport while preserving the current UI/UX.

**Architecture:** Keep the current working-tree JSX, classes, copy, and interaction layout as the visual source of truth. Move domain access into typed entity clients, user actions into feature slices, reusable compositions into widgets, route-level composition into pages, and explicit TanStack Start route files. Isolate all encryption, CSRF, cookie, error, and binary transport behavior in `shared/api/transport`.

**Tech Stack:** React 19, TanStack Start/Router, TypeScript 5.7, Vite 8, Tailwind CSS 4, Web Crypto API, RSA-OAEP-SHA-256, AES-256-GCM, pnpm, oxfmt, Vitest, Node test runner.

## Global Constraints

- Preserve the current working-tree UI: rendered structure, Tailwind classes, labels, copy, visual hierarchy, print behavior, and user-facing interaction behavior.
- Change system architecture only. UI changes are out of scope unless required to preserve an existing interaction after an API migration.
- Do not use local mock data, `mockApi`, `MockApiClient`, `createSeedDb`, or local-storage session credentials in production code.
- Keep authentication session state in Laravel's HTTP-only cookie; keep CSRF and transport state in memory.
- Do not change Laravel business logic or transport protocol unless a verified frontend/backend contract mismatch requires a narrowly scoped backend correction.
- Preserve existing tests and quality gates; add tests for new transport, adapter, and boundary behavior.
- Do not reset or discard the existing dirty working tree. Stage only files belonging to the current checkpoint.
- Produce exactly 40 non-empty commits, one commit per task below. Do not create an aggregate migration commit.

## Implementation quality contract

Every implementation step and every one of the 40 implementation commits must satisfy these rules:

- **Strict typing:** Keep TypeScript `strict` mode enabled. Exported functions, hooks, adapters, components, errors, and callbacks must have explicit input and output types. Use `unknown` at untrusted boundaries and narrow it with validators. Do not introduce `any`, `@ts-ignore`, `@ts-expect-error`, non-null assertions, unchecked JSON casts, or implicit `any`; generated TanStack files are the only `@ts-nocheck` exception.
- **Production-ready code:** Each checkpoint must leave working code with real behavior, tests, and error handling. Do not commit stubs, placeholders, speculative abstractions, dead compatibility layers, swallowed exceptions, disabled checks, or “temporary” bypasses.
- **Functional React:** Keep React components, hooks, providers, and page composition functional. Do not force class-based OOP into TSX. Use small pure functions for mapping, validation, query construction, and view-model derivation.
- **Focused OOP:** Use classes only where object identity/state or platform error semantics materially help, such as typed transport/API errors or an explicitly stateful boundary. Prefer interfaces, discriminated unions, closures, and pure functions for the rest of the frontend.
- **Readable structure:** One responsibility per module and function; use named intermediate variables for multi-step logic; avoid one-line monsters, deeply nested ternaries, chained side effects, and dense callback bodies. Keep JSX readable and do not hide data fetching or mutation side effects inside visual primitives.
- **Maintainability and debugging:** Preserve error codes, HTTP status, request IDs, and safe details across boundaries. Catch `unknown`, normalize it once, and never silently swallow failures. Do not add automatic retries for non-idempotent requests. Keep security-sensitive data out of logs and persistent browser storage.
- **Reviewability:** Each commit must be independently understandable and testable. Avoid drive-by formatting, unrelated renames, generated-file edits outside the owning task, and broad mechanical rewrites that obscure behavior changes.
- **Verification:** Before each commit, run the narrowest relevant test plus `pnpm run typecheck` for TypeScript changes. Before the final commit, run the complete frontend gate, architecture/code-quality scans, `git diff --check`, and applicable browser/backend verification.

## File map

| Area | Responsibility |
| --- | --- |
| `src/shared/api/transport/**` | Public-key bootstrap, RSA wrapping, AES-GCM envelopes, response decoding, CSRF memory state, transport errors |
| `src/shared/api/http/**` | Typed API error normalization, request IDs, URL/query helpers, shared response envelopes |
| `src/entities/**` | Wire types, domain models, mappers, and endpoint clients for medicines, inventory, sales, users, reports, backups, and system time |
| `src/features/**` | Auth/session, forms, mutations, idempotency keys, permission-aware actions, and page-facing hooks |
| `src/widgets/**` | App shell and multi-entity screen compositions, preserving existing visual markup |
| `src/pages/**` | Route-level screen components, preserving current page bodies and visual behavior |
| `src/routes/**` | TanStack Start route files and route guards |
| `scripts/**` | FSD boundary/source checks and test contracts |
| `tests/**` | Transport, adapter, feature, and architecture tests |

---

## Commit 01: Establish frontend quality commands

**Files:** Modify `MyLightDrugstore-Frontend/package.json`; create `MyLightDrugstore-Frontend/vitest.config.ts`; create `MyLightDrugstore-Frontend/tests/setup.ts`.

**Interfaces:** Add scripts `typecheck`, `format:check`, `test:unit`, `test:architecture`, and `test`; configure Vitest to run `tests/**/*.test.ts` and `tests/**/*.test.tsx` without changing application runtime.

- [ ] Write a command-contract test in `tests/package-scripts.test.mjs` asserting every script exists and `typecheck` invokes `tsc --noEmit`.
- [ ] Run `pnpm exec node --test tests/package-scripts.test.mjs`; expect failure because the scripts are absent.
- [ ] Add the scripts and Vitest config. The intended script shape is:

```json
{
  "scripts": {
    "typecheck": "tsc --noEmit",
    "format:check": "oxfmt --check .",
    "test:unit": "vitest run",
    "test:architecture": "node scripts/check-fsd-boundaries.mjs --enforce",
    "test": "pnpm run test:unit && pnpm run test:architecture && pnpm run typecheck && pnpm run build"
  }
}
```

- [ ] Run `pnpm exec node --test tests/package-scripts.test.mjs`; expect PASS.
- [ ] Run `pnpm run typecheck`; record any pre-existing failures without changing unrelated behavior.
- [ ] Commit as `build(frontend): establish quality commands`.

## Commit 02: Define transport protocol types and base64url codec

**Files:** Create `src/shared/api/transport/types.ts`, `src/shared/api/transport/base64url.ts`, `tests/transport/base64url.test.ts`.

**Interfaces:** Export `TRANSPORT_VERSION`, `TRANSPORT_ALGORITHM`, `TransportPublicKey`, `TransportCiphertext`, `EncryptedTransportEnvelope`, `TransportRequestPayload`, `TransportResponsePayload`, `encodeBase64Url(bytes)`, and `decodeBase64Url(value)`.

- [ ] Write tests for empty bytes, binary bytes, canonical round trips, padding rejection, invalid alphabet rejection, and non-canonical encodings.
- [ ] Run `pnpm exec vitest run tests/transport/base64url.test.ts`; expect failure because the codec is absent.
- [ ] Implement the codec using `btoa`/`atob` and reject values whose re-encoding differs from the input.
- [ ] Run the focused test; expect all tests PASS.
- [ ] Commit as `feat(frontend): add transport protocol primitives`.

## Commit 03: Implement RSA-OAEP and AES-GCM primitives

**Files:** Create `src/shared/api/transport/crypto.ts`; create `tests/transport/crypto.test.ts`.

**Interfaces:** Export `generateAes256Key(): Promise<{ aesKey: CryptoKey; rawKey: Uint8Array }>`, `importRsaOaepPublicKey(pem): Promise<CryptoKey>`, `wrapAesKey(publicKey, rawKey): Promise<Uint8Array>`, `encryptAesGcm(key, plaintext, aad): Promise<TransportCiphertext>`, and `decryptAesGcm(key, encrypted, aad): Promise<Uint8Array>`.

- [ ] Write tests for exact 32-byte AES keys, RSA-OAEP SHA-256 wrapping against a generated RSA key pair, AES round trip, tampered ciphertext rejection, and changed-AAD rejection.
- [ ] Run `pnpm exec vitest run tests/transport/crypto.test.ts`; expect failure because the exports are absent.
- [ ] Implement Web Crypto calls with AES-GCM `iv` length 12 and `tagLength: 128`; convert every `Uint8Array` to a detached `ArrayBuffer` before passing it to `subtle`.
- [ ] Run the focused test; expect PASS.
- [ ] Commit as `feat(frontend): implement transport cryptography`.

## Commit 04: Encode and validate transport envelopes

**Files:** Create `src/shared/api/transport/envelope.ts`; create `tests/transport/envelope.test.ts`.

**Interfaces:** Export `buildAdditionalData(method, requestTarget)`, `encodeTransportEnvelope(envelope)`, and `decodeTransportEnvelope(payload)`. `decodeTransportEnvelope` must return typed `Uint8Array` nonce/ciphertext and enforce key ID, version, algorithm, nonce length, tag-inclusive ciphertext bounds, and canonical base64url.

- [ ] Write tests for AAD path normalization, query exclusion, exact envelope round trip, invalid version/algorithm/key ID, invalid nonce/tag length, oversized ciphertext, and extra fields.
- [ ] Run `pnpm exec vitest run tests/transport/envelope.test.ts`; expect failure.
- [ ] Implement validation matching `TransportEnvelopeCodec.php` and `RequestAdditionalData.php`.
- [ ] Run the focused test; expect PASS.
- [ ] Commit as `feat(frontend): validate encrypted transport envelopes`.

## Commit 05: Add typed transport error and logical payload validators

**Files:** Create `src/shared/api/transport/errors.ts`; create `src/shared/api/transport/payload.ts`; create `tests/transport/payload.test.ts`.

**Interfaces:** Export `TransportRequestError`, `parseLogicalResponsePayload(value)`, `serializeJsonPayload(value)`, `decodeLogicalResponseBody(payload)`, and `serializeBinaryPayload(bytes, contentType)`.

- [ ] Write tests for JSON descriptors, UTF-8 response bodies, base64 binary bodies, missing descriptor fields, invalid header values, and request size limits.
- [ ] Run the focused test; expect failure.
- [ ] Implement typed errors retaining `status`, `code`, `requestId`, and safe `details`; reject malformed descriptors generically.
- [ ] Run the focused test; expect PASS.
- [ ] Commit as `feat(frontend): add transport payload validation`.

## Commit 06: Add public-key bootstrap and transport-session cache

**Files:** Create `src/shared/api/transport/session.ts`; create `tests/transport/session.test.ts`.

**Interfaces:** Export `createTransportSession(options)`, `clearTransportSession()`, and `TransportSession` with `keyId`, `aesKey`, and `wrappedKey`.

- [ ] Write tests that mock plaintext `/transport/public-key`, verify `{ data: ... }` unwrapping, validate the PEM key, generate one AES key, reuse the in-flight bootstrap promise, and clear/recreate after failure.
- [ ] Run `pnpm exec vitest run tests/transport/session.test.ts`; expect failure.
- [ ] Implement a module-local cache with no persistent storage and `credentials: "include"` on the bootstrap request.
- [ ] Run the focused test; expect PASS.
- [ ] Commit as `feat(frontend): bootstrap encrypted transport sessions`.

## Commit 07: Add CSRF state and safe request lifecycle

**Files:** Create `src/shared/api/transport/csrf.ts`; create `tests/transport/csrf.test.ts`.

**Interfaces:** Export `getCsrfToken()`, `setCsrfToken(token)`, `clearCsrfToken()`, `ensureCsrfToken(fetchCsrf)`, and `isSafeMethod(method)`.

- [ ] Write tests for safe methods, one concurrent CSRF bootstrap, blank-token rejection, unsafe-request bootstrap, and explicit token clearing.
- [ ] Run the focused test; expect failure.
- [ ] Implement in-memory state and a shared in-flight promise; never read or write local storage.
- [ ] Run the focused test; expect PASS.
- [ ] Commit as `feat(frontend): manage csrf transport state`.

## Commit 08: Implement encrypted request/response client

**Files:** Create `src/shared/api/transport/client.ts`; create `tests/transport/client.test.ts`.

**Interfaces:** Export `createTransportClient({ baseUrl, fetchImpl? })`, `TransportRequestInit`, `TransportResponse<T>`, and `TransportClient.request<T>(path, init?)`.

- [ ] Write tests for GET headers, encrypted JSON request descriptors, AAD using path without query, CSRF header propagation, encrypted JSON success, encrypted API error, 204/304 handling, and encrypted binary response decoding.
- [ ] Run the focused test; expect failure.
- [ ] Implement the request flow: resolve URL, obtain session, add `Accept`/`X-Transport-Key`, ensure CSRF for unsafe methods, encrypt non-empty bodies, call `fetch` with cookies, decrypt the response, and throw `TransportRequestError` for non-2xx logical errors.
- [ ] Do not replay failed POST/PATCH/DELETE requests. Clear cached session only when the transport key is rejected.
- [ ] Run the focused test; expect PASS.
- [ ] Commit as `feat(frontend): add encrypted api transport client`.

## Commit 09: Replace shared API error and request-ID contracts

**Files:** Modify `src/shared/api/errors.ts`; modify `src/shared/api/request-id.ts`; create `src/shared/api/http/types.ts`; create `src/shared/api/index.ts`; create `tests/api/errors.test.ts`.

**Interfaces:** Export `ApiError`, `normalizeApiError(error)`, `getRequestId(headers)`, `ApiResponse<T>`, and the transport client public exports.

- [ ] Write tests mapping Laravel `{ error: { code, message, requestId } }`, validation errors, transport errors, and unknown exceptions into one stable error type.
- [ ] Run the focused test; expect failure for the new cases.
- [ ] Implement the public shared API barrel without exporting domain clients or legacy `MockApiError`.
- [ ] Run the focused test and `pnpm run typecheck`; expect PASS for the new contract.
- [ ] Commit as `refactor(frontend): centralize api error contracts`.

## Commit 10: Add shared API composition and query helpers

**Files:** Create `src/shared/api/api-client.ts`; create `src/shared/api/query.ts`; create `tests/api/query.test.ts`.

**Interfaces:** Export `apiClient`, `withQuery(path, params)`, `unwrapData(body)`, and `readPageMeta(body)`.

- [ ] Write tests for omitted empty query values, encoded dates, pagination metadata defaults, and `{ data: ... }` response unwrapping.
- [ ] Run the focused test; expect failure.
- [ ] Implement one transport-backed composition object consumed by entity factories; keep endpoint logic out of this file.
- [ ] Run the focused test and typecheck; expect PASS.
- [ ] Commit as `refactor(frontend): compose shared api dependencies`.

## Commit 11: Normalize domain models and remove duplicate wire assumptions

**Files:** Modify `src/entities/medicine/model/types.ts`; modify `src/entities/inventory/model/types.ts`; modify `src/entities/sale/model/types.ts`; modify `src/entities/user/model/types.ts`; modify `src/entities/report/model/types.ts`; modify `src/entities/backup/model/types.ts`; create `src/entities/shared/model/page.ts`; create `tests/entities/model-types.test.ts`.

**Interfaces:** Define domain types matching existing UI usage and backend docs, including `Page<T>`, `Medicine`, `Lot`, `Movement`, `Sale`, `SaleItem`, `User`, `ReportFilters`, and `BackupJob`.

- [ ] Write compile-time fixtures for nullable dates, decimal strings, roles, status unions, pagination, and binary download metadata.
- [ ] Run `pnpm run typecheck`; expect failures from inconsistent current types.
- [ ] Update only model/type declarations and keep current UI-facing field names stable.
- [ ] Run typecheck and the model test; expect PASS.
- [ ] Commit as `refactor(frontend): normalize entity contracts`.

## Commit 12: Finish medicine entity adapter

**Files:** Modify `src/entities/medicine/api/medicine-client.ts`; modify `src/entities/medicine/index.ts`; create `tests/entities/medicine-client.test.ts`.

**Interfaces:** `createMedicineApi(client)` exposes `list`, `show`, `create`, `update`, and `archive`, each returning mapped domain data and using documented `q`, `active`, `lowStock`, `expiresBefore`, `page`, and `perPage` query names.

- [ ] Write request-recording tests for every endpoint, body shape, and response mapper.
- [ ] Run the focused test; expect failure for missing create/show/mapping behavior.
- [ ] Implement the adapter with no UI imports and no `fetch` outside the injected transport.
- [ ] Run the focused test and typecheck; expect PASS.
- [ ] Commit as `feat(frontend): complete medicine entity api`.

## Commit 13: Finish inventory entity adapter

**Files:** Modify `src/entities/inventory/api/inventory-client.ts`; modify `src/entities/inventory/index.ts`; create `tests/entities/inventory-client.test.ts`.

**Interfaces:** `createInventoryApi(client)` exposes `summary`, `lots`, `receive`, `adjust`, and `movements`, with exact backend payloads for receipts and adjustments and typed pagination.

- [ ] Write request-recording tests for `/inventory`, `/inventory/lots`, `/inventory/receipts`, `/inventory/adjustments`, and `/inventory/movements`.
- [ ] Run the focused test; expect failure for missing `lots`/payload mapping.
- [ ] Implement mapping for `lotId`, `quantityRemaining`, `movementType`, actor fields, and UTC dates.
- [ ] Run the focused test and typecheck; expect PASS.
- [ ] Commit as `feat(frontend): complete inventory entity api`.

## Commit 14: Finish sale entity adapter and idempotency interface

**Files:** Modify `src/entities/sale/api/sale-client.ts`; modify `src/entities/sale/index.ts`; create `src/shared/lib/idempotency-key.ts`; create `tests/entities/sale-client.test.ts`.

**Interfaces:** `createSaleApi(client)` exposes `list`, `show`, `create(payload, idempotencyKey)`, `addItem(saleId, payload, idempotencyKey)`, `removeItem`, `markPaid`, and `cancel`. `createIdempotencyKey()` returns a UUID string.

- [ ] Write tests for exact sale paths, `Idempotency-Key`, cancellation body, query filters, and stable UUID format.
- [ ] Run the focused test; expect failure for missing exact contracts.
- [ ] Implement the adapter and key factory using `crypto.randomUUID()` with a secure fallback only when the API is unavailable.
- [ ] Run the focused test and typecheck; expect PASS.
- [ ] Commit as `feat(frontend): complete sale entity api`.

## Commit 15: Finish user, report, backup, and system entity adapters

**Files:** Modify `src/entities/user/api/user-client.ts`; modify `src/entities/report/api/report-client.ts`; modify `src/entities/backup/api/backup-client.ts`; create `src/entities/system/api/system-client.ts`; update corresponding `index.ts` files; create `tests/entities/operational-client.test.ts`.

**Interfaces:** Expose typed user CRUD, report filters, backup request/status/download returning `Uint8Array`, and `getServerTime()` returning `{ now: string }`.

- [ ] Write request-recording tests for admin user APIs, reports, `/backups`, `/backups/{id}`, `/backups/{id}/download`, and `/system/time`.
- [ ] Run the focused test; expect failure for missing system/binary behavior.
- [ ] Implement binary requests through `TransportClient.request<Uint8Array>` and never parse backup bytes as JSON.
- [ ] Run the focused test and typecheck; expect PASS.
- [ ] Commit as `feat(frontend): complete operational entity apis`.

## Commit 16: Move authentication into a feature slice

**Files:** Modify `src/features/auth/api/auth-client.ts`; create `src/features/auth/model/session-types.ts`; create `src/features/auth/model/session-context.tsx`; create `src/features/auth/index.ts`; create `tests/features/auth-client.test.ts`.

**Interfaces:** Export `createAuthClient`, `AuthSession`, `AuthProvider`, and `useAuthSession`; provider methods are `login(credentials): Promise<User>`, `logout(): Promise<void>`, `refresh(): Promise<User | null>`, and `clear(): void`.

- [ ] Write tests for login CSRF sequencing, profile mapping, refresh on `/auth/me`, logout clearing local state, and unauthenticated 401 handling.
- [ ] Run the focused test; expect failure because the feature session provider is absent.
- [ ] Implement the provider around the shared client; keep session state in React memory and use no local storage.
- [ ] Run the focused test and typecheck; expect PASS.
- [ ] Commit as `refactor(frontend): move session behavior into auth feature`.

## Commit 17: Compose application providers without changing visual output

**Files:** Modify `src/app/providers/app-providers.tsx`; create `src/app/providers/index.ts`; modify `src/routes/__root.tsx`; create `tests/app/providers.test.tsx`.

**Interfaces:** `AppProviders({ children })` composes `AuthProvider` and the existing toast container; no provider imports `shared/SessionContext`.

- [ ] Write a provider rendering test that asserts children and toast container mount under the same tree.
- [ ] Run the focused test; expect failure for the old provider import.
- [ ] Replace the session provider import only; preserve existing document markup and toast behavior.
- [ ] Run the focused test and typecheck; expect PASS.
- [ ] Commit as `refactor(frontend): compose app providers through fsd`.

## Commit 18: Add catalog-management feature actions

**Files:** Create `src/features/catalog-management/api/mutations.ts`; create `src/features/catalog-management/model/forms.ts`; create `src/features/catalog-management/index.ts`; create `tests/features/catalog-management.test.ts`.

**Interfaces:** Export `useMedicineList`, `useCreateMedicine`, `useUpdateMedicine`, `useArchiveMedicine`, and form validators whose input matches the current catalog form.

- [ ] Write tests for list loading, create/update/archive calls, validation errors, and API error normalization.
- [ ] Run the focused test; expect failure.
- [ ] Implement hooks/actions using the medicine entity public API and preserve current form state semantics.
- [ ] Run the focused test and typecheck; expect PASS.
- [ ] Commit as `feat(frontend): add catalog management feature`.

## Commit 19: Add inventory receipt and adjustment features

**Files:** Create `src/features/inventory-receipts/api/mutations.ts`; create `src/features/inventory-receipts/model/forms.ts`; create `src/features/inventory-adjustments/api/mutations.ts`; create `src/features/inventory-adjustments/model/forms.ts`; create both public `index.ts` files; create `tests/features/inventory-mutations.test.ts`.

**Interfaces:** Receipt actions submit `{ receivedAt, items }`; adjustment actions submit `{ reason, items }`; both expose loading/error/result state compatible with existing pages.

- [ ] Write tests for date/quantity validation, receipt request body, signed adjustment deltas, and inventory refresh callbacks.
- [ ] Run the focused test; expect failure.
- [ ] Implement feature-owned actions without changing current form labels, buttons, or feedback components.
- [ ] Run the focused test and typecheck; expect PASS.
- [ ] Commit as `feat(frontend): add inventory mutation features`.

## Commit 20: Add sales-entry and sales-cart features

**Files:** Create `src/features/sales-entry/api/mutations.ts`; create `src/features/sales-entry/model/actions.ts`; create `src/features/sales-cart/api/mutations.ts`; create `src/features/sales-cart/model/actions.ts`; create both public `index.ts` files; create `tests/features/sales-workflows.test.ts`.

**Interfaces:** Entry actions create/add with one stable idempotency key per action; cart actions remove, mark paid, and cancel with exact sale IDs and reason body.

- [ ] Write tests proving retrying one create/add action reuses its key and a new action receives a new key.
- [ ] Run the focused test; expect failure.
- [ ] Implement action-scoped key storage and entity calls; never calculate server totals in the frontend.
- [ ] Run the focused test and typecheck; expect PASS.
- [ ] Commit as `feat(frontend): add sales workflow features`.

## Commit 21: Add password, staff, and backup features

**Files:** Create `src/features/password-change/**`; create `src/features/staff-management/**`; create `src/features/backup-management/**`; create `tests/features/admin-operations.test.ts`.

**Interfaces:** Password change calls `changePassword`; staff actions expose create/update/deactivate; backup actions expose request/status/download and accept a Blob download callback.

- [ ] Write tests for current/new password validation, staff role/active payloads, admin-only action guards, and binary-to-Blob download handling.
- [ ] Run the focused test; expect failure.
- [ ] Implement feature actions and error mapping while preserving current forms and confirmation dialogs.
- [ ] Run the focused test and typecheck; expect PASS.
- [ ] Commit as `feat(frontend): add security administration features`.

## Commit 22: Add widget-level app shell model

**Files:** Create `src/widgets/app-shell/model/navigation.ts`; create `src/widgets/app-shell/model/use-server-clock.ts`; create `src/widgets/app-shell/ui/app-shell.tsx`; create `src/widgets/app-shell/index.ts`; create `tests/widgets/app-shell.test.tsx`.

**Interfaces:** `getNavigationForRole(role)`, `useServerClock()`, and `AppShell({ children })` replace the old shell module while preserving navigation labels, classes, responsive behavior, logout, and clock placement.

- [ ] Write tests for admin/staff navigation filtering, server-time refresh, logout invocation, and child rendering.
- [ ] Run the focused test; expect failure because the widget slice is absent.
- [ ] Move the current AppShell markup verbatim into the widget and replace only data/session/router imports.
- [ ] Run the focused test and typecheck; expect PASS.
- [ ] Commit as `refactor(frontend): move app shell into widget slice`.

## Commit 23: Split shared UI primitives without visual changes

**Files:** Create `src/shared/ui/button.tsx`, `card.tsx`, `form.tsx`, `table.tsx`, `feedback.tsx`, `dialog.tsx`, `date.ts`; create `src/shared/ui/index.ts`; modify imports across frontend sources.

**Interfaces:** Preserve every existing export and prop type currently exported from `shared/ui.tsx`; the new barrel is the compatibility surface during migration.

- [ ] Write an export-contract test importing every current shared UI export from `@/shared/ui`.
- [ ] Run the focused test; expect failure until the new modules/barrel exist.
- [ ] Move implementations mechanically, preserving JSX, classes, copy, and formatting semantics; keep no domain API imports in shared UI.
- [ ] Run the export-contract test, typecheck, and `git diff --check`; expect PASS/no whitespace errors.
- [ ] Commit as `refactor(frontend): split shared ui primitives`.

## Commit 24: Migrate login page to auth feature

**Files:** Create `src/pages/login/login-page.tsx`; modify the current login source only for import/handler wiring; create `tests/pages/login-page.test.tsx`; create `src/routes/login.tsx`.

**Interfaces:** `LoginPage` keeps the current markup and calls `useAuthSession().login`; the route exports `Route = createFileRoute('/login')({ component: LoginPage })`.

- [ ] Write a test for validation, auth error rendering, successful navigation, and existing login visual labels.
- [ ] Run the focused test; expect failure for the new page/route.
- [ ] Copy the current UI body exactly, replace `mockApi`/legacy session/router imports with FSD public APIs, and keep all classes/copy unchanged.
- [ ] Run the focused test and typecheck; expect PASS.
- [ ] Commit as `refactor(frontend): migrate login page to fsd`.

## Commit 25: Migrate dashboard and catalog pages

**Files:** Create `src/pages/dashboard/dashboard-page.tsx`; create `src/pages/catalog/catalog-page.tsx`; create related widgets under `src/widgets/dashboard/**`; update current page imports; create `tests/pages/dashboard-catalog.test.tsx`.

**Interfaces:** Pages consume `entities/medicine`, `entities/inventory`, `entities/sale`, and catalog feature public APIs; no direct transport/mock client imports remain.

- [ ] Write tests for dashboard loading/error/empty states and catalog list/create/update/archive action wiring.
- [ ] Run the focused test; expect failure for new page paths.
- [ ] Move JSX unchanged and replace only data/action imports and effect bodies with the feature/entity contracts.
- [ ] Run focused tests, typecheck, and a source scan for `mockApi` in these pages; expect PASS/no matches.
- [ ] Commit as `refactor(frontend): migrate dashboard and catalog pages`.

## Commit 26: Migrate inventory pages

**Files:** Create `src/pages/inventory/inventory-page.tsx`; create `receipts-page.tsx`, `adjustments-page.tsx`, and `movements-page.tsx`; create `src/widgets/inventory/**`; create `tests/pages/inventory-pages.test.tsx`.

**Interfaces:** Inventory pages consume entity queries and receipt/adjustment features; filters preserve current URL/search-param behavior and date display.

- [ ] Write tests for summary/lots/movement loading, receipt body, adjustment reason/delta, and error feedback.
- [ ] Run the focused test; expect failure.
- [ ] Move current page markup unchanged and adapt only API/session/router imports.
- [ ] Run focused tests, typecheck, and `rg -n 'mockApi|MockApiError' src/pages/inventory`; expect no matches.
- [ ] Commit as `refactor(frontend): migrate inventory pages`.

## Commit 27: Migrate sales pages

**Files:** Create `src/pages/sales/new-sale-page.tsx`; create `cart-page.tsx`, `sales-list-page.tsx`, and `sales-print-page.tsx`; create `src/widgets/sales/**`; create `tests/pages/sales-pages.test.tsx`.

**Interfaces:** Sales pages consume sales-entry/cart features and sale entity queries; print uses server-returned totals and existing browser print behavior.

- [ ] Write tests for medicine lookup, create/add idempotency, cart remove/paid/cancel, list filters, and print detail loading.
- [ ] Run the focused test; expect failure.
- [ ] Move current sales JSX unchanged and replace only legacy API/error/router calls.
- [ ] Run focused tests, typecheck, and a static check that no sale page calculates totals or imports `mockApi`.
- [ ] Commit as `refactor(frontend): migrate sales pages`.

## Commit 28: Migrate reports, security, admin, and backups pages

**Files:** Create `src/pages/reports/**`; create `src/pages/security/security-page.tsx`; create `src/pages/admin/users-page.tsx`; create `src/pages/backups/backups-page.tsx`; create `tests/pages/operations-pages.test.tsx`.

**Interfaces:** Reports consume report entities; security/admin/backups consume their feature slices; role denial is enforced by route and feature guards.

- [ ] Write tests for date filters, password change, staff deactivation, admin-only rendering, backup request/status/download, and generic API errors.
- [ ] Run the focused test; expect failure.
- [ ] Move current markup unchanged and wire only FSD actions/queries.
- [ ] Run focused tests and typecheck; expect PASS.
- [ ] Commit as `refactor(frontend): migrate operational pages`.

## Commit 29: Replace router compatibility helpers with TanStack public APIs

**Files:** Modify `src/shared/router-compat.tsx`; modify migrated pages/widgets; create `tests/router/router-compat.test.tsx`.

**Interfaces:** Remove production use of `Navigate`, `Link`, `Outlet`, `useNavigate`, `useParams`, and `useSearchParams` compatibility wrappers; migrated consumers use TanStack Router imports or route APIs directly.

- [ ] Write a source contract test that fails when migrated pages import `shared/router-compat`.
- [ ] Run the focused test; expect failure.
- [ ] Replace imports one slice at a time while preserving `to`, params, search, and navigation behavior; delete the compatibility module only after no production imports remain.
- [ ] Run the focused test, typecheck, and `rg -n 'shared/router-compat' src`; expect no production matches.
- [ ] Commit as `refactor(frontend): use tanstack router at slice boundaries`.

## Commit 30: Create authenticated route layout and guard

**Files:** Create `src/routes/_authenticated.tsx`; create `src/app/router/guards/authenticated-route.tsx`; modify `src/routes/__root.tsx`; create `tests/router/authenticated-route.test.tsx`.

**Interfaces:** The authenticated route redirects unauthenticated users to `/login` and renders an `Outlet`; authenticated users render nested routes under the app shell.

- [ ] Write tests for anonymous redirect, loading state, authenticated outlet rendering, and role guard input.
- [ ] Run the focused test; expect failure.
- [ ] Implement the guard using auth feature session state and preserve root document markup.
- [ ] Run the focused test and typecheck; expect PASS.
- [ ] Commit as `feat(frontend): add authenticated route boundary`.

## Commit 31: Add explicit authenticated route files

**Files:** Create route files under `src/routes/_authenticated/**` for dashboard, catalog, inventory, sales, reports, security, admin, backups, and print; update generated route metadata through the TanStack plugin.

**Interfaces:** Each route maps one stable URL to exactly one page slice; admin routes additionally require role `admin`.

- [ ] Write a route-map test that asserts every accepted URL has a file route and no route depends on the old splat component.
- [ ] Run the focused test; expect failure while the catch-all route remains.
- [ ] Add explicit route files using `createFileRoute(path)({ component })` and the authenticated parent; do not put API calls in route files.
- [ ] Run the route-map test, typecheck, and `pnpm run build`; expect generated route tree and build success.
- [ ] Commit as `refactor(frontend): define explicit fsd routes`.

## Commit 32: Remove legacy route surface and root page/widget files

**Files:** Delete `src/routes/$.tsx`; delete legacy `src/pages/*.tsx`; delete `src/widgets/AppShell.tsx`; modify `src/App.tsx`; modify generated route metadata only through tooling.

**Interfaces:** No production import may reference legacy root pages, root AppShell, splat route, `SessionContext`, `shared/api/client`, or `shared/api/seed`.

- [ ] Write a legacy-reference test using `rg`-equivalent file scanning for the forbidden names.
- [ ] Run it; expect failure because legacy files remain.
- [ ] Delete only files whose replacement route/page/widget has passed its focused tests; remove `App.tsx` implementation without changing TanStack Start bootstrapping.
- [ ] Run the legacy-reference test, typecheck, and build; expect no matches and PASS.
- [ ] Commit as `refactor(frontend): remove legacy page architecture`.

## Commit 33: Remove monolithic API and legacy domain error types

**Files:** Delete `src/shared/api/client.ts`; delete `src/shared/api/seed.ts`; modify `src/shared/api/types.ts`; update all remaining imports; create `tests/architecture/no-legacy-api.test.mjs`.

**Interfaces:** All domain calls now enter through entity/feature public barrels; `MockApiError` is replaced by `ApiError`/`TransportRequestError`.

- [ ] Write the static forbidden-symbol test for `mockApi`, `MockApiClient`, `createSeedDb`, `MockApiError`, and `shared/api/client`.
- [ ] Run it; expect failure.
- [ ] Delete the old adapter and update the last imports; do not replace it with another global domain client.
- [ ] Run the test, typecheck, and build; expect PASS/no matches.
- [ ] Commit as `refactor(frontend): remove legacy api adapter`.

## Commit 34: Add FSD boundary checker

**Files:** Create `MyLightDrugstore-Frontend/scripts/check-fsd-boundaries.mjs`; create `MyLightDrugstore-Frontend/scripts/check-fsd-boundaries.test.mjs`.

**Interfaces:** Export/test `findViolations(root)` and CLI `node scripts/check-fsd-boundaries.mjs --enforce`. Rules include layer order, public-barrel cross-slice imports, forbidden legacy roots, and route/generated exceptions.

- [ ] Write temporary-fixture tests for upward imports, allowed page-to-feature barrel imports, deep cross-slice imports, and forbidden root legacy files.
- [ ] Run `pnpm exec node --test scripts/check-fsd-boundaries.test.mjs`; expect failure because the checker is absent.
- [ ] Implement deterministic path/import parsing for TypeScript/TSX and report `{ file, importPath, rule }` violations.
- [ ] Run the checker tests and `pnpm run test:architecture`; expect PASS.
- [ ] Commit as `test(frontend): enforce fsd import boundaries`.

## Commit 35: Add source-size, strict-code, and legacy architecture checks

**Files:** Create `scripts/check-source-size.mjs`; create `scripts/check-source-size.test.mjs`; create `scripts/check-code-quality.mjs`; create `scripts/check-code-quality.test.mjs`; modify `package.json` architecture script; modify `tests/architecture/no-legacy-api.test.mjs`.

**Interfaces:** `node scripts/check-source-size.mjs --enforce` rejects non-generated production files above 300 lines and reports path/line count. `node scripts/check-code-quality.mjs --enforce` rejects production `any`, `@ts-ignore`, `@ts-expect-error`, non-null assertions, and forbidden `@ts-nocheck` outside generated route metadata. Legacy checks reject mock, local-session, and compatibility imports.

- [ ] Write fixture tests for an over-limit source file, generated route-tree exclusion, forbidden legacy references, `any`, `@ts-ignore`, `@ts-expect-error`, non-null assertions, and non-generated `@ts-nocheck`.
- [ ] Run `pnpm exec node --test scripts/check-source-size.test.mjs scripts/check-code-quality.test.mjs`; expect failure for missing checker behavior.
- [ ] Implement both checks and compose them under `pnpm run test:architecture`; keep the parser readable and report `{ file, line, rule }` for each violation.
- [ ] Run the checker tests and `pnpm run test:architecture`; expect PASS with the migrated source.
- [ ] Commit as `test(frontend): enforce source and code quality limits`.

## Commit 36: Add transport and entity integration contract tests

**Files:** Create `tests/integration/encrypted-api-contract.test.ts`; create `tests/integration/entity-contracts.test.ts`; modify test setup/config as needed.

**Interfaces:** Use a recording `fetchImpl` for transport and assert endpoint paths, headers, encrypted envelopes, CSRF, pagination, idempotency, and binary data without bypassing the transport.

- [ ] Write failing contract tests for login, medicine list, inventory receipt, sale create, backup download, and encrypted error mapping.
- [ ] Run `pnpm exec vitest run tests/integration/encrypted-api-contract.test.ts tests/integration/entity-contracts.test.ts`; expect failure for missing end-to-end wiring.
- [ ] Implement only the missing composition/mapping code; keep fixtures at the wire boundary and never mock entity internals.
- [ ] Run focused tests; expect PASS.
- [ ] Commit as `test(frontend): verify encrypted api contracts`.

## Commit 37: Add feature/page behavior tests for permissions and mutations

**Files:** Create `tests/component/auth-and-catalog.test.tsx`; create `tests/component/inventory-and-sales.test.tsx`; create `tests/component/admin-and-reports.test.tsx`; modify Vitest environment/config.

**Interfaces:** Render current page components with injected entity/feature dependencies and assert visible existing messages/actions, not CSS redesigns.

- [ ] Write failing tests for staff admin denial, sale idempotency, inventory receipt, cancellation, password change, and backup binary download.
- [ ] Run the focused component tests; expect failures for missing migrated behavior.
- [ ] Implement only action/provider wiring required by the tests; preserve current JSX/classes.
- [ ] Run focused component tests and `pnpm run typecheck`; expect PASS.
- [ ] Commit as `test(frontend): cover migrated feature workflows`.

## Commit 38: Add frontend CI workflow contract

**Files:** Create `.github/workflows/frontend.yml`; create `MyLightDrugstore-Frontend/tests/frontend-ci-contract.test.mjs`; modify frontend `package.json` only if a required script name differs.

**Interfaces:** CI uses `pnpm install --frozen-lockfile`, runs architecture, typecheck, format check, unit tests, and build, and has `timeout-minutes: 10` or less.

- [ ] Write the workflow contract test asserting exact commands, working directory, Node/pnpm setup, lockfile-keyed caching, and bounded timeout.
- [ ] Run `pnpm exec node --test tests/frontend-ci-contract.test.mjs`; expect failure because the workflow is absent.
- [ ] Add the workflow with read-only contents permission and no advisory/skipped quality lanes.
- [ ] Run the contract test and validate YAML with `pnpm exec prettier --check .github/workflows/frontend.yml` if available; expect PASS.
- [ ] Commit as `ci(frontend): add full quality workflow`.

## Commit 39: Add browser smoke verification and developer documentation

**Files:** Create `MyLightDrugstore-Frontend/tests/e2e/smoke.spec.ts` or an equivalent existing-browser smoke script; create/update `MyLightDrugstore-Frontend/README.md`; update `AGENTS.md` only if commands are genuinely changed.

**Interfaces:** Smoke verification covers login, protected redirect, catalog load, inventory read, one sale mutation, admin denial, encrypted transport failure visibility, and backup download path using environment-provided credentials.

- [ ] Write the smoke checks against the running app/backend URL without bypassing encryption or committing credentials.
- [ ] Run the smoke command and record exact failures if the local backend is unavailable; do not weaken assertions.
- [ ] Document `pnpm install --frozen-lockfile`, `pnpm run dev`, all quality commands, API base URL configuration, and the transport security boundary.
- [ ] Run the documentation/command checks; expect PASS or a clearly reported environment blocker.
- [ ] Commit as `docs(frontend): document architecture and smoke verification`.

## Commit 40: Final integration verification and cleanup

**Files:** Only files needed to fix final verification failures; no unrelated backend files.

**Interfaces:** The final tree contains only the FSD source layout, explicit routes, shared transport, typed entity/feature APIs, tests, scripts, CI, and documentation.

- [ ] Run the complete frontend gate from `MyLightDrugstore-Frontend`:

```powershell
pnpm install --frozen-lockfile
pnpm run test:architecture
pnpm run typecheck
pnpm run format:check
pnpm run test:unit
pnpm run build
```

- [ ] Run `rg -n -i -uuu 'figma|mockApi|MockApiClient|createSeedDb|react-router|localStorage.*session|session.*localStorage|shared/SessionContext|shared/api/client' MyLightDrugstore-Frontend/src -g '!routeTree.gen.ts'`; expect no output.
- [ ] Run `git diff --check`, `git status --short`, and `git diff --stat HEAD`; verify only the requested frontend architecture, transport, tests, CI, and docs are included.
- [ ] Run applicable backend verification without modifying backend code: `composer validate --strict --no-check-publish`, the documented PHPUnit suites, and `composer run analyse`; report any unavailable infrastructure exactly.
- [ ] Run the browser smoke verification once more if the environment is available; capture the exact URL and result.
- [ ] Commit only final scoped fixes as `chore(frontend): complete fsd migration verification`; this is the fortieth commit and must not be empty.

## Plan self-review

- The design's UI-preservation constraint is covered by Commits 17, 22, 23, and 24–28.
- The strict typing, final-code, focused-OOP, readability, maintainability, and debuggability requirements are global acceptance criteria for every commit and are mechanically checked in Commit 35 plus TypeScript/format gates.
- AES-256-GCM protocol requirements are covered by Commits 02–08 and 36.
- CSRF, cookies, error normalization, idempotency, binary downloads, and role checks are covered by Commits 07–10, 14–21, and 36–37.
- Full FSD structure and route boundaries are covered by Commits 16–35.
- CI and fresh verification are covered by Commits 01, 34–40.
- No placeholders, skipped tests, focused tests in committed scripts, or advisory quality lanes are permitted.
- The 40 commit checkpoints are non-empty and grouped by transport, domain, features, UI-preserving migration, routing, architecture enforcement, tests, CI, documentation, and final verification.
