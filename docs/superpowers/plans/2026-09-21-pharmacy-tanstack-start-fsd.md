# MyLightDrugstore TanStack Start and Full FSD Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the mock Vite React frontend with a TanStack Start application that follows the Botchabuster full FSD structure and uses the Laravel API through its AES-256-GCM transport.

**Architecture:** TanStack Start and file-based TanStack Router routes will be thin application adapters over `src/pages`. FSD layers will follow `shared <- entities <- features <- widgets <- pages <- app`; cross-slice imports will use public `index.ts` APIs. The browser will call Laravel directly with HTTP-only session cookies and a shared Web Crypto transport client; TanStack Start will not duplicate backend business logic.

**Tech Stack:** React 19, TypeScript, TanStack Start, TanStack Router, TanStack Query, Vite, Tailwind CSS v4, Web Crypto API, Laravel API v1, Vitest, Testing Library, Playwright, pnpm.

## Global Constraints

- Preserve all existing pharmacy workflows and documented `/api/v1` endpoint behavior.
- Use the Botchabuster FSD layer order and public slice-barrel convention.
- All API bodies except the public transport-key bootstrap success response use the documented AES-256-GCM transport envelope.
- Generate a fresh 32-byte AES request key for every encrypted request and wrap it with RSA-OAEP-SHA-256.
- Use `METHOD + " " + normalized path` without query string as AES-GCM additional authenticated data.
- Keep Laravel HTTP-only session credentials out of localStorage, sessionStorage, URL parameters, and persisted application state.
- Keep all session, CSRF, transport-key, and decrypted payload material in memory only.
- Require idempotency keys for sale creation, sale-item addition, and stock receipts; never retry those operations with a different key.
- Preserve server-authoritative prices, stock totals, sale totals, role checks, and audit behavior.
- Remove all Figma-specific files, environment variables, plugins, package metadata, comments, assets, and instructions from `MyLightDrugstore-Frontend`.
- Do not weaken, skip, focus, or make advisory any existing backend CI lane.
- After each code/configuration/dependency/test/workflow edit, run the smallest complete affected local check.
- Keep every test lane bounded below two minutes; do not hide failures with skipped tests or increased timeouts.

---

## File Map

### Create

- `MyLightDrugstore-Frontend/src/router.tsx` — typed TanStack Router instance and module registration.
- `MyLightDrugstore-Frontend/src/routes/__root.tsx` — root route, document shell, global error boundary, providers.
- `MyLightDrugstore-Frontend/src/routes/index.tsx` — root redirect to `/dashboard` or `/login`.
- `MyLightDrugstore-Frontend/src/routes/login.tsx` — public login route.
- `MyLightDrugstore-Frontend/src/routes/_authenticated.tsx` — authenticated layout and session guard.
- `MyLightDrugstore-Frontend/src/routes/_authenticated/dashboard.tsx` — dashboard route adapter.
- `MyLightDrugstore-Frontend/src/routes/_authenticated/catalog/medicines.tsx` — catalog route adapter.
- `MyLightDrugstore-Frontend/src/routes/_authenticated/inventory/index.tsx` — inventory route adapter.
- `MyLightDrugstore-Frontend/src/routes/_authenticated/inventory/receipts.tsx` — receipts route adapter.
- `MyLightDrugstore-Frontend/src/routes/_authenticated/inventory/adjustments.tsx` — adjustments route adapter.
- `MyLightDrugstore-Frontend/src/routes/_authenticated/inventory/movements.tsx` — movements route adapter.
- `MyLightDrugstore-Frontend/src/routes/_authenticated/sales/index.tsx` — sales history route adapter.
- `MyLightDrugstore-Frontend/src/routes/_authenticated/sales/new.tsx` — new sale route adapter.
- `MyLightDrugstore-Frontend/src/routes/_authenticated/sales/cart.tsx` — cart route adapter.
- `MyLightDrugstore-Frontend/src/routes/_authenticated/sales/print/$saleId.tsx` — sale print route adapter.
- `MyLightDrugstore-Frontend/src/routes/_authenticated/reports/inventory.tsx` — inventory report route adapter.
- `MyLightDrugstore-Frontend/src/routes/_authenticated/reports/sales.tsx` — sales report route adapter.
- `MyLightDrugstore-Frontend/src/routes/_authenticated/settings/security.tsx` — password route adapter.
- `MyLightDrugstore-Frontend/src/routes/_authenticated/admin/users.tsx` — staff users route adapter.
- `MyLightDrugstore-Frontend/src/routes/_authenticated/backups.tsx` — backups route adapter.
- `MyLightDrugstore-Frontend/src/routeTree.gen.ts` — generated TanStack route tree committed as application runtime code.
- `MyLightDrugstore-Frontend/src/client.tsx` — TanStack Start client entry.
- `MyLightDrugstore-Frontend/src/server.ts` — TanStack Start server entry.
- `MyLightDrugstore-Frontend/src/app/providers/app-providers.tsx` — QueryClient and session providers.
- `MyLightDrugstore-Frontend/src/app/router/guards.ts` — typed auth/admin guard helpers.
- `MyLightDrugstore-Frontend/src/shared/api/transport/base64url.ts`, `crypto.ts`, `envelope.ts`, `client.ts`, `errors.ts` — base64url, crypto, envelope, client, and transport errors.
- `MyLightDrugstore-Frontend/src/shared/api/index.ts`, `errors.ts`, and `request-id.ts` — API request helpers, error normalization, and request IDs.
- `MyLightDrugstore-Frontend/src/entities/user`, `medicine`, `inventory`, `sale`, `report`, `backup` — domain models, query keys, response mappers, and public APIs.
- `MyLightDrugstore-Frontend/src/features/auth`, `catalog-medicine-editing`, `inventory-receiving`, `inventory-adjustments`, `sale-creation`, `sale-cart-actions`, `password-change`, `staff-management`, `backup-management` — workflow APIs, models, hooks, and UI.
- `MyLightDrugstore-Frontend/src/widgets/app-shell`, `catalog`, `inventory`, `sales`, `reports` — shell and larger reusable compositions.
- `MyLightDrugstore-Frontend/src/pages/login`, `dashboard`, `catalog`, `inventory`, `sales`, `reports`, `security`, `admin`, `backups` — route-level screen compositions.
- `MyLightDrugstore-Frontend/tests/unit/router.test.ts`, `base64url.test.ts`, `transport.test.ts`, `entity-contracts.test.ts`, and `auth-session.test.ts` — transport, adapter, guard, mapper, and query behavior tests.
- `MyLightDrugstore-Frontend/tests/component/login-form.test.tsx`, `catalog-page.test.tsx`, `inventory-workflows.test.tsx`, `sales-workflows.test.tsx`, `reports.test.tsx`, and `admin-security-backups.test.tsx` — feature/page interaction tests.
- `MyLightDrugstore-Frontend/tests/e2e/smoke.spec.ts`, `auth-and-catalog.spec.ts`, `inventory-and-sales.spec.ts`, and `admin-and-reports.spec.ts` — critical browser journeys.
- `MyLightDrugstore-Frontend/scripts/package-validation.test.mjs`, `frontend-ci-contract.test.mjs`, `check-fsd-boundaries.test.mjs`, and `check-source-size.test.mjs` — package, workflow, FSD, and source-size contract tests.
- `MyLightDrugstore-Frontend/scripts/check-fsd-boundaries.mjs` — Botchabuster-style boundary checker adapted to this source root.
- `MyLightDrugstore-Frontend/scripts/check-source-size.mjs` — production source-size checker.
- `MyLightDrugstore-Frontend/scripts/check-fsd-boundaries.test.mjs` — checker unit tests.
- `MyLightDrugstore-Frontend/scripts/check-source-size.test.mjs` — source-size checker tests.
- `MyLightDrugstore-Frontend/.env.example` — client-safe API base URL and application settings only.
- `.github/workflows/frontend.yml` — frontend install, architecture, typecheck, test, and build gate.

### Modify

- `MyLightDrugstore-Frontend/package.json` — TanStack Start, Query, test, lint, and CI scripts/dependencies.
- `MyLightDrugstore-Frontend/pnpm-lock.yaml` — locked dependency graph.
- `MyLightDrugstore-Frontend/vite.config.ts` — TanStack Start plugin, React plugin order, alias, and server settings.
- `MyLightDrugstore-Frontend/tsconfig.json` — Start-compatible module settings and generated route types.
- `MyLightDrugstore-Frontend/index.html` — ordinary application shell without placeholder slots.
- `MyLightDrugstore-Frontend/src/index.css` — global styles moved from the old entry and FSD app style boundary.
- `MyLightDrugstore-Frontend/src/main.tsx` — replace the old React Router bootstrap with the Start client entry or remove it if the Start adapter owns the entry.
- `MyLightDrugstore-Frontend/AGENTS.md` — replace Figma Make instructions with TanStack Start/FSD commands and boundaries.
- `MyLightDrugstore-Frontend/CLAUDE.md` — retain the local include while removing Figma-only wording.
- `MyLightDrugstore-Frontend/.gitignore` — remove Figma paths and add Start/Nitro output paths.

### Delete

- `MyLightDrugstore-Frontend/.figma/` — all Figma Make scripts and metadata.
- `MyLightDrugstore-Frontend/src/App.tsx` — replaced by Start root/routes/app providers.
- `MyLightDrugstore-Frontend/src/shared/api/client.ts` — localStorage `MockApiClient`.
- `MyLightDrugstore-Frontend/src/shared/api/seed.ts` — mock database seed data.
- `MyLightDrugstore-Frontend/src/shared/api/types.ts` — replaced by entity/API contract types.
- `MyLightDrugstore-Frontend/src/shared/SessionContext.tsx` — replaced by the auth feature/session model.
- `MyLightDrugstore-Frontend/src/shared/ui.tsx` — split into `shared/ui` modules.
- `MyLightDrugstore-Frontend/src/widgets/AppShell.tsx` — moved into the widgets slice.
- `MyLightDrugstore-Frontend/src/pages/AdminUsersPage.tsx`, `BackupsPage.tsx`, `CatalogPage.tsx`, `DashboardPage.tsx`, `InventoryAdjustmentsPage.tsx`, `InventoryMovementsPage.tsx`, `InventoryPage.tsx`, `InventoryReceiptsPage.tsx`, `LoginPage.tsx`, `ReportsInventoryPage.tsx`, `ReportsSalesPage.tsx`, `SalesCartPage.tsx`, `SalesListPage.tsx`, `SalesNewPage.tsx`, `SalesPrintPage.tsx`, and `SecurityPage.tsx` — moved into FSD page slices and then removed from the legacy root.
- `MyLightDrugstore-Frontend/src/assets/reference.png` — Figma/reference-only asset.
- `MyLightDrugstore-Frontend/src/imports/pasted_text/pasted-attachment.txt` — Figma-imported attachment.

---

### Task 1: Replace the Figma/Vite scaffold with a clean TanStack Start toolchain

**Files:**
- Modify: `MyLightDrugstore-Frontend/package.json`
- Modify: `MyLightDrugstore-Frontend/pnpm-lock.yaml`
- Modify: `MyLightDrugstore-Frontend/vite.config.ts`
- Modify: `MyLightDrugstore-Frontend/tsconfig.json`
- Modify: `MyLightDrugstore-Frontend/index.html`
- Modify: `MyLightDrugstore-Frontend/.gitignore`
- Modify: `MyLightDrugstore-Frontend/AGENTS.md`
- Modify: `MyLightDrugstore-Frontend/CLAUDE.md`
- Delete: `MyLightDrugstore-Frontend/.figma/`
- Delete: `MyLightDrugstore-Frontend/src/assets/reference.png`
- Delete: `MyLightDrugstore-Frontend/src/imports/pasted_text/pasted-attachment.txt`

**Interfaces:**
- Produces scripts named `dev`, `build`, `start`, `typecheck`, `lint`, `format:check`, `test:unit`, `test:component`, `test:architecture`, and `check`.
- Produces a Vite config using `tanstackStart()` before the React plugin, with the existing `@/*` alias preserved.
- Produces an index shell containing `lang="en"`, a real title, and `<div id="app"></div>`.

- [ ] **Step 1: Write the package/config acceptance test**

Create `MyLightDrugstore-Frontend/scripts/package-validation.test.mjs` with assertions that package scripts contain the required commands, dependencies include `@tanstack/react-start`, `@tanstack/react-router`, and `@tanstack/react-query`, and no package or source path contains `figma`.

```js
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("frontend package exposes Start and quality-gate scripts without Figma metadata", async () => {
  const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
  assert.equal(packageJson.scripts.dev, "vite dev");
  assert.equal(packageJson.scripts.build, "vite build");
  assert.equal(packageJson.scripts.typecheck, "tsc --noEmit");
  assert.equal(packageJson.scripts['test:architecture'], "node scripts/check-fsd-boundaries.test.mjs && node scripts/check-fsd-boundaries.mjs --enforce && node scripts/check-source-size.mjs --enforce");
  assert.ok(packageJson.dependencies["@tanstack/react-start"]);
  assert.ok(packageJson.dependencies["@tanstack/react-router"]);
  assert.ok(packageJson.dependencies["@tanstack/react-query"]);
  assert.equal(Object.keys(packageJson).join(" ").toLowerCase().includes("figma"), false);
});
```

- [ ] **Step 2: Run the acceptance test and confirm the scaffold fails it**

Run from `MyLightDrugstore-Frontend`:

```powershell
pnpm exec node scripts/package-validation.test.mjs
```

Expected: FAIL because the current package is named `figma-make-app`, does not contain TanStack Start dependencies, and does not contain the required scripts.

- [ ] **Step 3: Install Start, Query, and test dependencies**

Run:

```powershell
pnpm add @tanstack/react-start @tanstack/react-router @tanstack/react-query
pnpm add -D @vitejs/plugin-react vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event playwright eslint prettier
```

Keep React 19 and Tailwind CSS v4. Do not add a second router or retain `react-router` after the migration.

- [ ] **Step 4: Replace Figma configuration and update application metadata**

Replace `vite.config.ts` with the minimal Start/Vite configuration below, preserving the `@` alias and local development port:

```ts
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: Number(process.env.PORT ?? 8443),
    strictPort: true,
  },
  plugins: [tanstackStart(), react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

Set the package name to `mylightdrugstore-frontend`, remove `react-router`, and add `start: "node .output/server/index.mjs"` only if the selected Nitro deployment adapter requires it. Update `index.html` to contain a normal title and `#app`. Update `AGENTS.md` so its instructions describe TanStack Start/FSD rather than Figma Make.

- [ ] **Step 5: Delete exact Figma-only targets**

Confirm the resolved targets are inside `MyLightDrugstore-Frontend`, then remove `.figma/`, `src/assets/reference.png`, and `src/imports/pasted_text/pasted-attachment.txt`. Do not delete product images or application code outside those exact targets.

- [ ] **Step 6: Run the acceptance test and Figma scan**

Run:

```powershell
pnpm install --frozen-lockfile
pnpm exec node scripts/package-validation.test.mjs
rg -n -i -uuu "figma" . -g '!node_modules/**' -g '!dist/**'
```

Expected: package validation PASS and the Figma scan exits with no matches.

- [ ] **Step 7: Commit the toolchain boundary**

```powershell
git add MyLightDrugstore-Frontend .github/workflows/frontend.yml
git commit -m "build(frontend): replace Figma scaffold with TanStack Start"
```

---

### Task 2: Create the TanStack Start entry, router, and FSD application layer

**Files:**
- Create: `MyLightDrugstore-Frontend/src/client.tsx`
- Create: `MyLightDrugstore-Frontend/src/server.ts`
- Create: `MyLightDrugstore-Frontend/src/router.tsx`
- Create: `MyLightDrugstore-Frontend/src/routes/__root.tsx`
- Create: `MyLightDrugstore-Frontend/src/routes/index.tsx`
- Create: `MyLightDrugstore-Frontend/src/routes/login.tsx`
- Create: `MyLightDrugstore-Frontend/src/routes/_authenticated.tsx`
- Create: `MyLightDrugstore-Frontend/src/routes/_authenticated/dashboard.tsx`
- Create: `MyLightDrugstore-Frontend/src/app/providers/app-providers.tsx`
- Create: `MyLightDrugstore-Frontend/src/app/router/guards.ts`
- Create: `MyLightDrugstore-Frontend/src/app/styles/globals.css`
- Create: `MyLightDrugstore-Frontend/src/routeTree.gen.ts` (generated)
- Delete: `MyLightDrugstore-Frontend/src/main.tsx`
- Delete: `MyLightDrugstore-Frontend/src/App.tsx`
- Modify: `MyLightDrugstore-Frontend/src/index.css`

**Interfaces:**
- `createAppRouter(): Router` in `src/router.tsx`.
- `AppProviders({ children }: { children: React.ReactNode }): JSX.Element`.
- `requireAuthenticated(context): Promise<void>` and `requireAdmin(context): Promise<void>` in `src/app/router/guards.ts`.
- Route components render `pages/login`, `pages/dashboard`, or the authenticated shell without importing lower-level implementation files from another slice.

- [ ] **Step 1: Write the router smoke test**

Create `tests/unit/router.test.ts`:

```ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createMemoryHistory } from '@tanstack/react-router'
import { createAppRouter } from '@/router'

test('router exposes public login and authenticated dashboard paths', async () => {
  const router = createAppRouter({
    history: createMemoryHistory({ initialEntries: ['/login'] }),
  })

  await router.load()

  assert.equal(router.state.location.pathname, '/login')
  assert.ok(router.routesByPath['/dashboard'])
})
```

- [ ] **Step 2: Run the smoke test and confirm the new router is missing**

Run:

```powershell
pnpm exec tsx --test tests/unit/router.test.ts
```

Expected: FAIL because `src/router.tsx` and the generated route tree do not exist.

- [ ] **Step 3: Add the Start router and root route**

Use the generated file-based route tree and typed module registration:

```tsx
// src/router.tsx
import { createRouter, type CreateRouterOptions } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

export function createAppRouter(options: Omit<CreateRouterOptions, 'routeTree'> = {}) {
  return createRouter({
    routeTree,
    defaultPreload: 'intent',
    scrollRestoration: true,
    ...options,
  })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>
  }
}
```

The root route must render `AppProviders`, global styles, a document title of `MyLightDrugstore`, and an error component that displays a request ID when the normalized API error contains one.

- [ ] **Step 4: Add client/server entry points and route generation**

`src/client.tsx` must create a browser router and render `RouterProvider` into `#app`. `src/server.ts` must use TanStack Start's server entry handler and must not import Laravel models or backend secrets. Run the TanStack route generator through the configured Vite dev/build command so `src/routeTree.gen.ts` matches the route files.

- [ ] **Step 5: Implement the authenticated layout and guards**

The authenticated route must call the session bootstrap before rendering the shell. Unauthenticated users redirect to `/login`; non-admin users redirect to `/dashboard` for admin-only routes. Guards must consume the session feature public API, never the transport internals.

- [ ] **Step 6: Run the router test and production build**

Run:

```powershell
pnpm exec tsx --test tests/unit/router.test.ts
pnpm run typecheck
pnpm run build
```

Expected: router test PASS, TypeScript exit 0, and Vite produce the TanStack Start build.

- [ ] **Step 7: Commit the application shell**

```powershell
git add MyLightDrugstore-Frontend/src
git commit -m "feat(frontend): add TanStack Start application shell"
```

---

### Task 3: Implement and test the shared AES-256-GCM transport

**Files:**
- Create: `MyLightDrugstore-Frontend/src/shared/api/transport/base64url.ts`
- Create: `MyLightDrugstore-Frontend/src/shared/api/transport/crypto.ts`
- Create: `MyLightDrugstore-Frontend/src/shared/api/transport/envelope.ts`
- Create: `MyLightDrugstore-Frontend/src/shared/api/transport/client.ts`
- Create: `MyLightDrugstore-Frontend/src/shared/api/transport/errors.ts`
- Create: `MyLightDrugstore-Frontend/src/shared/api/request-id.ts`
- Create: `MyLightDrugstore-Frontend/tests/unit/transport.test.ts`
- Create: `MyLightDrugstore-Frontend/tests/unit/base64url.test.ts`
- Create: `MyLightDrugstore-Frontend/src/shared/api/index.ts`

**Interfaces:**
- `encodeBase64Url(bytes: Uint8Array): string` and `decodeBase64Url(value: string): Uint8Array`.
- `normalizeRequestTarget(method: string, url: string): string`.
- `encryptTransportPayload(input: { aesKey: CryptoKey; method: string; path: string; payload: unknown }): Promise<TransportEnvelope>`.
- `decryptTransportResponse(input: { aesKey: CryptoKey; method: string; path: string; envelope: TransportEnvelope }): Promise<TransportResponseDescriptor>`.
- `TransportClient.request<T>(method: string, path: string, options?: RequestOptions): Promise<T>`.
- `TransportClient.requestBinary(method: string, path: string, options?: RequestOptions): Promise<Blob>`.
- `ApiError` with `status`, `code`, `message`, `details`, and `requestId`.

- [ ] **Step 1: Write failing base64url and AAD tests**

```ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { decodeBase64Url, encodeBase64Url } from '@/shared/api/transport/base64url'
import { normalizeRequestTarget } from '@/shared/api/transport/crypto'

test('base64url encoding is canonical and padding-free', () => {
  const bytes = new Uint8Array([0, 1, 2, 250, 255])
  const encoded = encodeBase64Url(bytes)
  assert.equal(encoded.includes('='), false)
  assert.deepEqual([...decodeBase64Url(encoded)], [...bytes])
})

test('AAD uses uppercase method and excludes the query string', () => {
  assert.equal(normalizeRequestTarget('post', '/api/v1/sales?page=2'), 'POST /api/v1/sales')
})
```

- [ ] **Step 2: Run the tests and confirm they fail for missing modules**

```powershell
pnpm exec tsx --test tests/unit/base64url.test.ts
```

Expected: FAIL because the transport modules do not exist.

- [ ] **Step 3: Implement canonical base64url and Web Crypto primitives**

Use `crypto.subtle.importKey` for SPKI RSA public keys with `RSA-OAEP`/`SHA-256`, `crypto.subtle.generateKey` for AES-GCM, `crypto.subtle.encrypt`/`decrypt` with a 12-byte nonce and a 16-byte tag, and explicit byte concatenation for the backend's ciphertext-plus-tag representation. Reject invalid base64url characters, impossible padding lengths, non-12-byte IVs, and ciphertexts shorter than the GCM tag.

- [ ] **Step 4: Write the transport round-trip and failure tests**

Add tests for:

```ts
test('encrypts and decrypts a JSON descriptor with path-bound AAD', async () => {
  const encrypted = await encryptTransportPayload({
    aesKey,
    method: 'POST',
    path: '/api/v1/sales',
    payload: { items: [{ medicineId: 42, quantity: 2 }] },
  })

  const descriptor = await decryptTransportResponse({
    aesKey,
    method: 'POST',
    path: '/api/v1/sales',
    envelope: encrypted,
  })

  assert.deepEqual(JSON.parse(descriptor.value), { items: [{ medicineId: 42, quantity: 2 }] })
})

test('rejects the same ciphertext when the path changes', async () => {
  await assert.rejects(() => decryptTransportResponse({ ...encryptedInput, path: '/api/v1/users' }))
})
```

Add bodyless request, binary response, malformed envelope, wrong key ID, invalid tag, and non-JSON error response tests.

- [ ] **Step 5: Implement `TransportClient`**

The client must:

1. Fetch `/api/v1/transport/public-key` without an encrypted envelope.
2. Cache only public key metadata in memory.
3. Generate and wrap a fresh AES key per request.
4. Set `credentials: 'include'`, `X-Request-ID`, `X-Transport-Key`, and `X-CSRF-TOKEN` when applicable.
5. Encrypt JSON bodies as `{ kind: 'json', contentType: 'application/json', value: JSON.stringify(body) }`.
6. Decrypt success and error bodies before mapping status codes.
7. Reconstruct binary response bodies from `bodyEncoding: 'base64'`.
8. Never log headers, keys, plaintext descriptors, or decrypted response content.

- [ ] **Step 6: Run transport unit tests and typecheck**

```powershell
pnpm exec tsx --test tests/unit/base64url.test.ts tests/unit/transport.test.ts
pnpm run typecheck
```

Expected: all transport tests PASS and TypeScript exit 0.

- [ ] **Step 7: Commit the transport boundary**

```powershell
git add MyLightDrugstore-Frontend/src/shared/api MyLightDrugstore-Frontend/tests/unit
git commit -m "feat(frontend): add encrypted Laravel transport client"
```

---

### Task 4: Add shared API error handling and entity contract slices

**Files:**
- Create: `MyLightDrugstore-Frontend/src/shared/config/env.ts`
- Create: `MyLightDrugstore-Frontend/src/shared/api/errors.ts`
- Create: `MyLightDrugstore-Frontend/src/shared/lib/dates.ts`
- Create: `MyLightDrugstore-Frontend/src/shared/lib/money.ts`
- Create: `MyLightDrugstore-Frontend/src/entities/user/model/types.ts`
- Create: `MyLightDrugstore-Frontend/src/entities/user/model/queries.ts`
- Create: `MyLightDrugstore-Frontend/src/entities/user/index.ts`
- Create: `MyLightDrugstore-Frontend/src/entities/medicine/model/types.ts`
- Create: `MyLightDrugstore-Frontend/src/entities/medicine/api/medicine-client.ts`
- Create: `MyLightDrugstore-Frontend/src/entities/medicine/model/queries.ts`
- Create: `MyLightDrugstore-Frontend/src/entities/medicine/index.ts`
- Create: `MyLightDrugstore-Frontend/src/entities/inventory/model/types.ts`
- Create: `MyLightDrugstore-Frontend/src/entities/inventory/api/inventory-client.ts`
- Create: `MyLightDrugstore-Frontend/src/entities/inventory/model/queries.ts`
- Create: `MyLightDrugstore-Frontend/src/entities/inventory/index.ts`
- Create: `MyLightDrugstore-Frontend/src/entities/sale/model/types.ts`
- Create: `MyLightDrugstore-Frontend/src/entities/sale/api/sale-client.ts`
- Create: `MyLightDrugstore-Frontend/src/entities/sale/model/queries.ts`
- Create: `MyLightDrugstore-Frontend/src/entities/sale/index.ts`
- Create: `MyLightDrugstore-Frontend/src/entities/report/model/types.ts`
- Create: `MyLightDrugstore-Frontend/src/entities/report/api/report-client.ts`
- Create: `MyLightDrugstore-Frontend/src/entities/report/index.ts`
- Create: `MyLightDrugstore-Frontend/src/entities/backup/model/types.ts`
- Create: `MyLightDrugstore-Frontend/src/entities/backup/api/backup-client.ts`
- Create: `MyLightDrugstore-Frontend/src/entities/backup/index.ts`
- Create: `MyLightDrugstore-Frontend/tests/unit/entity-contracts.test.ts`

**Interfaces:**
- Entity types use camelCase API names and money as strings.
- List responses use `{ data: T[]; meta: { page: number; perPage: number; total: number } }`.
- `MedicineClient`, `InventoryClient`, `SaleClient`, `ReportClient`, and `BackupClient` accept a `TransportClient` dependency and return typed API data.
- Each entity slice exports only its public types, query keys, client methods, and safe mappers.

- [ ] **Step 1: Write failing API adapter contract tests**

Use a transport test double with a typed `request` method and assert exact method/path/query/body mapping. Example:

```ts
test('medicine list adapter forwards documented filters and pagination', async () => {
  const transport = createRecordingTransport()
  const client = new MedicineClient(transport)

  await client.list({ q: 'amoxicillin', active: true, lowStock: false, page: 2, perPage: 25 })

  assert.deepEqual(transport.lastRequest, {
    method: 'GET',
    path: '/api/v1/medicines?q=amoxicillin&active=true&lowStock=false&page=2&perPage=25',
  })
})
```

- [ ] **Step 2: Run the contract tests and confirm missing adapters fail**

```powershell
pnpm exec tsx --test tests/unit/entity-contracts.test.ts
```

Expected: FAIL because the entity clients do not exist.

- [ ] **Step 3: Implement the entity contracts and adapters**

Model every documented response field, including `stockOnHand`, `earliestExpiry`, `quantityRemaining`, `active`, sale cancellation metadata, backup status, report totals, and pagination metadata. Build query-string parameters with `URLSearchParams`; omit undefined filters; do not send client-calculated prices, totals, or stock values.

- [ ] **Step 4: Add query keys and server-state factories**

Use stable keys such as `['medicines', filters]`, `['inventory', filters]`, `['inventory-lots', filters]`, `['inventory-movements', filters]`, `['sales', filters]`, `['sale', saleId]`, `['reports', reportType, filters]`, and `['backups']`. Keep key constructors in entity slices and export them through `index.ts`.

- [ ] **Step 5: Run adapter tests, typecheck, and format**

```powershell
pnpm exec tsx --test tests/unit/entity-contracts.test.ts
pnpm run typecheck
pnpm run format:check
```

Expected: all contract tests PASS, typecheck exit 0, and format check exit 0.

- [ ] **Step 6: Commit entity/API contracts**

```powershell
git add MyLightDrugstore-Frontend/src/entities MyLightDrugstore-Frontend/src/shared MyLightDrugstore-Frontend/tests/unit/entity-contracts.test.ts
git commit -m "feat(frontend): add typed Laravel entity adapters"
```

---

### Task 5: Replace mock session state with the auth feature and protected routing

**Files:**
- Create: `MyLightDrugstore-Frontend/src/features/auth/api/auth-client.ts`
- Create: `MyLightDrugstore-Frontend/src/features/auth/model/session.ts`
- Create: `MyLightDrugstore-Frontend/src/features/auth/model/types.ts`
- Create: `MyLightDrugstore-Frontend/src/features/auth/model/use-session.ts`
- Create: `MyLightDrugstore-Frontend/src/features/auth/ui/login-form.tsx`
- Create: `MyLightDrugstore-Frontend/src/features/auth/index.ts`
- Create: `MyLightDrugstore-Frontend/src/pages/login/login-page.tsx`
- Create: `MyLightDrugstore-Frontend/src/pages/dashboard/dashboard-page.tsx`
- Create: `MyLightDrugstore-Frontend/tests/unit/auth-session.test.ts`
- Create: `MyLightDrugstore-Frontend/tests/component/login-form.test.tsx`
- Modify: `MyLightDrugstore-Frontend/src/app/router/guards.ts`
- Modify: `MyLightDrugstore-Frontend/src/routes/login.tsx`
- Modify: `MyLightDrugstore-Frontend/src/routes/_authenticated.tsx`
- Delete: `MyLightDrugstore-Frontend/src/shared/SessionContext.tsx`

**Interfaces:**
- `AuthClient.csrf(): Promise<string>`.
- `AuthClient.login(input: { username: string; password: string }): Promise<User>`.
- `AuthClient.logout(): Promise<void>`.
- `AuthClient.me(): Promise<User>`.
- `SessionStore` exposes `user`, `status`, `bootstrap`, `login`, and `logout` without persistence.

- [ ] **Step 1: Write failing auth/session tests**

```ts
test('session bootstrap uses /auth/me and keeps the user in memory', async () => {
  const transport = createTransportStub({ '/api/v1/auth/me': { data: user } })
  const session = createSessionStore(new AuthClient(transport))

  await session.bootstrap()

  assert.equal(session.getSnapshot().user?.id, user.id)
  assert.equal(localStorage.getItem('session'), null)
})

test('login requests CSRF before the login mutation', async () => {
  const transport = createOrderedTransportStub()
  await new AuthClient(transport).login({ username: 'admin', password: 'correct' })
  assert.deepEqual(transport.methodsAndPaths, [
    ['GET', '/api/v1/auth/csrf'],
    ['POST', '/api/v1/auth/login'],
  ])
})
```

- [ ] **Step 2: Run auth tests and confirm they fail without the feature**

```powershell
pnpm exec tsx --test tests/unit/auth-session.test.ts
```

Expected: FAIL because the auth feature and session store do not exist.

- [ ] **Step 3: Implement the auth client and in-memory session store**

Use the shared transport, call CSRF bootstrap before state-changing requests, call `/auth/me` on initial bootstrap, and clear the user on logout or `401`. Do not write a session key or user object to browser storage.

- [ ] **Step 4: Move the login page into the FSD page/feature structure**

Move the existing login form behavior into `features/auth/ui/login-form.tsx` and `pages/login/login-page.tsx`. Replace React Router navigation with TanStack `useNavigate` and route links. Map `invalid_credentials`, `419`, and validation errors to safe form messages.

- [ ] **Step 5: Connect route guards and authenticated providers**

Make `AppProviders` own the QueryClient and session store. The authenticated route calls `bootstrap`; the admin guard checks `user.role === 'admin'` and never trusts hidden navigation alone.

- [ ] **Step 6: Run auth tests, component tests, typecheck, and build**

```powershell
pnpm exec tsx --test tests/unit/auth-session.test.ts
pnpm exec vitest run tests/component/login-form.test.tsx
pnpm run typecheck
pnpm run build
```

Expected: all listed tests PASS, typecheck exit 0, and build exit 0.

- [ ] **Step 7: Commit authentication**

```powershell
git add MyLightDrugstore-Frontend/src/app MyLightDrugstore-Frontend/src/features/auth MyLightDrugstore-Frontend/src/pages/login MyLightDrugstore-Frontend/src/pages/dashboard MyLightDrugstore-Frontend/src/routes MyLightDrugstore-Frontend/tests
git commit -m "feat(frontend): wire session authentication to Laravel"
```

---

### Task 6: Migrate catalog and inventory features to FSD

**Files:**
- Create: `MyLightDrugstore-Frontend/src/features/catalog-medicine-editing/api/mutations.ts`
- Create: `MyLightDrugstore-Frontend/src/features/catalog-medicine-editing/model/forms.ts`
- Create: `MyLightDrugstore-Frontend/src/features/catalog-medicine-editing/ui/medicine-form.tsx`
- Create: `MyLightDrugstore-Frontend/src/features/catalog-medicine-editing/index.ts`
- Create: `MyLightDrugstore-Frontend/src/features/inventory-receiving/api/mutations.ts`
- Create: `MyLightDrugstore-Frontend/src/features/inventory-receiving/model/forms.ts`
- Create: `MyLightDrugstore-Frontend/src/features/inventory-receiving/ui/receipt-form.tsx`
- Create: `MyLightDrugstore-Frontend/src/features/inventory-receiving/index.ts`
- Create: `MyLightDrugstore-Frontend/src/features/inventory-adjustments/api/mutations.ts`
- Create: `MyLightDrugstore-Frontend/src/features/inventory-adjustments/model/forms.ts`
- Create: `MyLightDrugstore-Frontend/src/features/inventory-adjustments/ui/adjustment-form.tsx`
- Create: `MyLightDrugstore-Frontend/src/features/inventory-adjustments/index.ts`
- Create: `MyLightDrugstore-Frontend/src/widgets/catalog/ui/catalog-table.tsx`
- Create: `MyLightDrugstore-Frontend/src/widgets/inventory/ui/inventory-overview.tsx`
- Create: `MyLightDrugstore-Frontend/src/widgets/inventory/ui/inventory-table.tsx`
- Create: `MyLightDrugstore-Frontend/src/widgets/inventory/ui/movement-table.tsx`
- Create: `MyLightDrugstore-Frontend/src/pages/catalog/catalog-page.tsx`
- Create: `MyLightDrugstore-Frontend/src/pages/inventory/inventory-page.tsx`
- Create: `MyLightDrugstore-Frontend/src/pages/inventory/receipts-page.tsx`
- Create: `MyLightDrugstore-Frontend/src/pages/inventory/adjustments-page.tsx`
- Create: `MyLightDrugstore-Frontend/src/pages/inventory/movements-page.tsx`
- Create: `MyLightDrugstore-Frontend/src/routes/_authenticated/catalog/medicines.tsx`
- Create: `MyLightDrugstore-Frontend/src/routes/_authenticated/inventory/index.tsx`
- Create: `MyLightDrugstore-Frontend/src/routes/_authenticated/inventory/receipts.tsx`
- Create: `MyLightDrugstore-Frontend/src/routes/_authenticated/inventory/adjustments.tsx`
- Create: `MyLightDrugstore-Frontend/src/routes/_authenticated/inventory/movements.tsx`
- Create: `MyLightDrugstore-Frontend/tests/component/catalog-page.test.tsx`
- Create: `MyLightDrugstore-Frontend/tests/component/inventory-workflows.test.tsx`
- Delete: `MyLightDrugstore-Frontend/src/pages/CatalogPage.tsx`
- Delete: `MyLightDrugstore-Frontend/src/pages/InventoryPage.tsx`
- Delete: `MyLightDrugstore-Frontend/src/pages/InventoryReceiptsPage.tsx`
- Delete: `MyLightDrugstore-Frontend/src/pages/InventoryAdjustmentsPage.tsx`
- Delete: `MyLightDrugstore-Frontend/src/pages/InventoryMovementsPage.tsx`

**Interfaces:**
- Medicine mutations call only `POST /medicines`, `PATCH /medicines/{medicineId}`, and `POST /medicines/{medicineId}/archive`.
- Receipt mutation calls `POST /inventory/receipts` with `receivedAt` and lot items; it does not send `stockOnHand` or `initialQuantity` in medicine payloads.
- Adjustment mutation calls `POST /inventory/adjustments` with a reason and signed lot deltas.
- Inventory query adapters support the documented `lowStock`, `expiresBefore`, `available`, `medicineId`, `type`, `from`, `to`, `page`, and `perPage` filters.

- [ ] **Step 1: Write failing workflow tests**

Cover these behaviors:

```tsx
test('medicine edit submits only catalog fields', async () => {
  render(<CatalogPage />)
  await userEvent.click(screen.getByRole('button', { name: 'Edit' }))
  await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))
  assert.deepEqual(recordingTransport.lastBody, {
    genericName: 'Amoxicillin',
    brandName: 'AmoxiCare',
    description: 'Antibiotic',
    dosageForm: 'Capsule',
    strength: '500mg',
    unitPrice: '12.50',
    storageLocation: 'A-01',
  })
  assert.equal('stockOnHand' in recordingTransport.lastBody, false)
})

test('stock receipt sends a lot and invalidates inventory queries', async () => {
  await submitReceipt({ medicineId: 42, quantity: 24, expiresAt: '2028-06-30' })
  assert.equal(recordingTransport.lastPath, '/api/v1/inventory/receipts')
  assert.ok(queryClient.wasInvalidated(['inventory']))
})
```

- [ ] **Step 2: Run targeted tests and confirm the migrated feature is absent**

```powershell
pnpm exec vitest run tests/component/catalog-page.test.tsx tests/component/inventory-workflows.test.tsx
```

Expected: FAIL because the new FSD pages/features do not exist.

- [ ] **Step 3: Move the catalog behavior into entity/feature/widget/page slices**

Preserve visible labels, search, active/archived filtering, pagination, create/edit/archive actions, and receipt entry. Replace direct `mockApi` calls with entity clients and TanStack Query hooks. Keep server-returned medicine objects as the source of truth.

- [ ] **Step 4: Move inventory behavior into entity/feature/widget/page slices**

Preserve overview metrics, lot display, receipt form, adjustment validation, movement filters, pagination, date formatting, and safe error banners. Use mutation query invalidation instead of manual localStorage refreshes.

- [ ] **Step 5: Add route search schemas and route adapters**

Expose catalog search/page, inventory filters, receipt medicine selection, adjustment reason, movement type/date/page, and pagination through typed TanStack search parameters. Route files may import only page public APIs.

- [ ] **Step 6: Run focused tests, typecheck, and build**

```powershell
pnpm exec vitest run tests/component/catalog-page.test.tsx tests/component/inventory-workflows.test.tsx
pnpm run typecheck
pnpm run build
```

Expected: all focused tests PASS, typecheck exit 0, and build exit 0.

- [ ] **Step 7: Commit catalog/inventory migration**

```powershell
git add MyLightDrugstore-Frontend/src/entities MyLightDrugstore-Frontend/src/features MyLightDrugstore-Frontend/src/widgets MyLightDrugstore-Frontend/src/pages MyLightDrugstore-Frontend/src/routes MyLightDrugstore-Frontend/tests/component
git commit -m "feat(frontend): migrate catalog and inventory workflows"
```

---

### Task 7: Migrate sales, printing, and report workflows

**Files:**
- Create: `MyLightDrugstore-Frontend/src/features/sale-creation/api/mutations.ts`
- Create: `MyLightDrugstore-Frontend/src/features/sale-creation/model/idempotency.ts`
- Create: `MyLightDrugstore-Frontend/src/features/sale-creation/ui/sale-form.tsx`
- Create: `MyLightDrugstore-Frontend/src/features/sale-creation/index.ts`
- Create: `MyLightDrugstore-Frontend/src/features/sale-cart-actions/api/mutations.ts`
- Create: `MyLightDrugstore-Frontend/src/features/sale-cart-actions/model/actions.ts`
- Create: `MyLightDrugstore-Frontend/src/features/sale-cart-actions/ui/cart-actions.tsx`
- Create: `MyLightDrugstore-Frontend/src/features/sale-cart-actions/index.ts`
- Create: `MyLightDrugstore-Frontend/src/widgets/sales/ui/sale-picker.tsx`
- Create: `MyLightDrugstore-Frontend/src/widgets/sales/ui/cart-summary.tsx`
- Create: `MyLightDrugstore-Frontend/src/widgets/sales/ui/sale-table.tsx`
- Create: `MyLightDrugstore-Frontend/src/widgets/reports/ui/inventory-report.tsx`
- Create: `MyLightDrugstore-Frontend/src/widgets/reports/ui/sales-report.tsx`
- Create: `MyLightDrugstore-Frontend/src/pages/sales/new-sale-page.tsx`
- Create: `MyLightDrugstore-Frontend/src/pages/sales/cart-page.tsx`
- Create: `MyLightDrugstore-Frontend/src/pages/sales/sales-list-page.tsx`
- Create: `MyLightDrugstore-Frontend/src/pages/sales/sales-print-page.tsx`
- Create: `MyLightDrugstore-Frontend/src/pages/reports/inventory-report-page.tsx`
- Create: `MyLightDrugstore-Frontend/src/pages/reports/sales-report-page.tsx`
- Create: `MyLightDrugstore-Frontend/src/routes/_authenticated/sales/index.tsx`
- Create: `MyLightDrugstore-Frontend/src/routes/_authenticated/sales/new.tsx`
- Create: `MyLightDrugstore-Frontend/src/routes/_authenticated/sales/cart.tsx`
- Create: `MyLightDrugstore-Frontend/src/routes/_authenticated/sales/print/$saleId.tsx`
- Create: `MyLightDrugstore-Frontend/src/routes/_authenticated/reports/inventory.tsx`
- Create: `MyLightDrugstore-Frontend/src/routes/_authenticated/reports/sales.tsx`
- Create: `MyLightDrugstore-Frontend/tests/component/sales-workflows.test.tsx`
- Create: `MyLightDrugstore-Frontend/tests/component/reports.test.tsx`
- Delete: `MyLightDrugstore-Frontend/src/pages/SalesNewPage.tsx`
- Delete: `MyLightDrugstore-Frontend/src/pages/SalesCartPage.tsx`
- Delete: `MyLightDrugstore-Frontend/src/pages/SalesListPage.tsx`
- Delete: `MyLightDrugstore-Frontend/src/pages/SalesPrintPage.tsx`
- Delete: `MyLightDrugstore-Frontend/src/pages/ReportsInventoryPage.tsx`
- Delete: `MyLightDrugstore-Frontend/src/pages/ReportsSalesPage.tsx`

**Interfaces:**
- Sale create and add-item mutations require an `Idempotency-Key` generated once per user action.
- Sale creation body is `{ items: Array<{ medicineId: number; quantity: number }> }`.
- Add-item body is `{ medicineId: number; quantity: number }`.
- Mark-paid, line removal, and cancellation map to the exact documented action endpoints.
- Print page loads `/sales/{saleId}` and uses browser print; it does not fabricate totals.
- Report filters use typed `from` and `to` URL search parameters.

- [ ] **Step 1: Write failing sales/report workflow tests**

Cover:

```tsx
test('creating a sale sends one stable idempotency key', async () => {
  await submitNewSale([{ medicineId: 42, quantity: 2 }])
  const firstKey = recordingTransport.lastHeaders['Idempotency-Key']
  assert.match(firstKey, /^[0-9a-f-]{36}$/)
  await retrySameSale()
  assert.equal(recordingTransport.lastHeaders['Idempotency-Key'], firstKey)
})

test('canceling a sale calls the cancel action and preserves the sale query', async () => {
  await cancelSale('entered_in_error')
  assert.equal(recordingTransport.lastPath, '/api/v1/sales/900/cancel')
  assert.deepEqual(recordingTransport.lastBody, { reason: 'entered_in_error' })
})
```

- [ ] **Step 2: Run focused tests and confirm missing sales features fail**

```powershell
pnpm exec vitest run tests/component/sales-workflows.test.tsx tests/component/reports.test.tsx
```

Expected: FAIL because the new sales/report slices do not exist.

- [ ] **Step 3: Implement sale creation and cart mutations**

Preserve medicine selection, quantity validation, open-cart behavior, line removal, mark-paid, cancellation, server error mapping, and query invalidation. Keep idempotency keys in an action-scoped memory object so retries of the same action reuse the key.

- [ ] **Step 4: Implement sale list/detail/print screens**

Use the entity sale client for list and detail. Use a dedicated page layout for browser printing with `@media print`; preserve print actions without adding a PDF library or client-calculated totals.

- [ ] **Step 5: Implement inventory and sales reports**

Map report response strings and UTC timestamps through shared formatters. Keep filters in route search parameters and provide explicit loading, empty, error, and retry states.

- [ ] **Step 6: Run focused tests, typecheck, and build**

```powershell
pnpm exec vitest run tests/component/sales-workflows.test.tsx tests/component/reports.test.tsx
pnpm run typecheck
pnpm run build
```

Expected: all focused tests PASS, typecheck exit 0, and build exit 0.

- [ ] **Step 7: Commit sales/report migration**

```powershell
git add MyLightDrugstore-Frontend/src/entities MyLightDrugstore-Frontend/src/features MyLightDrugstore-Frontend/src/widgets MyLightDrugstore-Frontend/src/pages MyLightDrugstore-Frontend/src/routes MyLightDrugstore-Frontend/tests/component
git commit -m "feat(frontend): migrate sales and reporting workflows"
```

---

### Task 8: Migrate security, staff administration, backups, and the application shell

**Files:**
- Create: `MyLightDrugstore-Frontend/src/features/password-change/api/mutations.ts`
- Create: `MyLightDrugstore-Frontend/src/features/password-change/model/form.ts`
- Create: `MyLightDrugstore-Frontend/src/features/password-change/ui/password-form.tsx`
- Create: `MyLightDrugstore-Frontend/src/features/password-change/index.ts`
- Create: `MyLightDrugstore-Frontend/src/features/staff-management/api/mutations.ts`
- Create: `MyLightDrugstore-Frontend/src/features/staff-management/model/forms.ts`
- Create: `MyLightDrugstore-Frontend/src/features/staff-management/ui/staff-form.tsx`
- Create: `MyLightDrugstore-Frontend/src/features/staff-management/index.ts`
- Create: `MyLightDrugstore-Frontend/src/features/backup-management/api/mutations.ts`
- Create: `MyLightDrugstore-Frontend/src/features/backup-management/model/actions.ts`
- Create: `MyLightDrugstore-Frontend/src/features/backup-management/ui/backup-actions.tsx`
- Create: `MyLightDrugstore-Frontend/src/features/backup-management/index.ts`
- Create: `MyLightDrugstore-Frontend/src/widgets/app-shell/ui/app-shell.tsx`
- Create: `MyLightDrugstore-Frontend/src/widgets/app-shell/model/navigation.ts`
- Create: `MyLightDrugstore-Frontend/src/widgets/app-shell/index.ts`
- Create: `MyLightDrugstore-Frontend/src/pages/security/security-page.tsx`
- Create: `MyLightDrugstore-Frontend/src/pages/admin/users-page.tsx`
- Create: `MyLightDrugstore-Frontend/src/pages/backups/backups-page.tsx`
- Create: `MyLightDrugstore-Frontend/src/routes/_authenticated/settings/security.tsx`
- Create: `MyLightDrugstore-Frontend/src/routes/_authenticated/admin/users.tsx`
- Create: `MyLightDrugstore-Frontend/src/routes/_authenticated/backups.tsx`
- Create: `MyLightDrugstore-Frontend/tests/component/admin-security-backups.test.tsx`
- Delete: `MyLightDrugstore-Frontend/src/pages/SecurityPage.tsx`
- Delete: `MyLightDrugstore-Frontend/src/pages/AdminUsersPage.tsx`
- Delete: `MyLightDrugstore-Frontend/src/pages/BackupsPage.tsx`
- Delete: `MyLightDrugstore-Frontend/src/widgets/AppShell.tsx`

**Interfaces:**
- Password change calls `POST /api/v1/auth/change-password` and maps field errors.
- Staff management calls `/users` endpoints and exposes deactivate rather than delete.
- Backup request calls `POST /backups`; status/download calls admin-only endpoints and uses `requestBinary` for the encrypted download.
- The shell obtains server time from `GET /system/time`, displays role-aware navigation, and calls the auth feature logout action.

- [ ] **Step 1: Write failing permission and binary-download tests**

```tsx
test('staff users cannot see admin navigation or render admin route content', async () => {
  renderWithSession({ role: 'staff' }, <AdminUsersPage />)
  assert.equal(screen.queryByText('Staff Accounts'), null)
  assert.ok(screen.getByText('Admin access required'))
})

test('backup download requests binary data through the encrypted transport', async () => {
  await downloadBackup(12)
  assert.equal(recordingTransport.binaryPath, '/api/v1/backups/12/download')
})
```

- [ ] **Step 2: Run focused tests and confirm missing slices fail**

```powershell
pnpm exec vitest run tests/component/admin-security-backups.test.tsx
```

Expected: FAIL because the new slices and shell do not exist.

- [ ] **Step 3: Move the app shell into `widgets/app-shell`**

Replace `react-router` `Outlet`, `NavLink`, and `useNavigate` with TanStack Router `Outlet`, `Link`, and `useNavigate`. Keep role-aware navigation, sidebar state, logout, server clock, responsive behavior, and the existing visual language.

- [ ] **Step 4: Implement security, staff, and backup features**

Use feature-owned mutation hooks and entity clients. Ensure admin screens have both route and backend permission handling. For backup downloads, create a Blob from decrypted bytes and use a temporary object URL that is revoked after the browser download starts.

- [ ] **Step 5: Run focused tests, typecheck, and build**

```powershell
pnpm exec vitest run tests/component/admin-security-backups.test.tsx
pnpm run typecheck
pnpm run build
```

Expected: all focused tests PASS, typecheck exit 0, and build exit 0.

- [ ] **Step 6: Commit admin/security/shell migration**

```powershell
git add MyLightDrugstore-Frontend/src MyLightDrugstore-Frontend/tests/component
git commit -m "feat(frontend): migrate shell security users and backups"
```

---

### Task 9: Split shared UI and complete the Botchabuster-style FSD boundaries

**Files:**
- Create: `MyLightDrugstore-Frontend/src/shared/ui/button.tsx`
- Create: `MyLightDrugstore-Frontend/src/shared/ui/card.tsx`
- Create: `MyLightDrugstore-Frontend/src/shared/ui/table.tsx`
- Create: `MyLightDrugstore-Frontend/src/shared/ui/form.tsx`
- Create: `MyLightDrugstore-Frontend/src/shared/ui/dialog.tsx`
- Create: `MyLightDrugstore-Frontend/src/shared/ui/feedback.tsx`
- Create: `MyLightDrugstore-Frontend/src/shared/ui/index.ts`
- Create: `MyLightDrugstore-Frontend/scripts/check-fsd-boundaries.mjs`
- Create: `MyLightDrugstore-Frontend/scripts/check-fsd-boundaries.test.mjs`
- Create: `MyLightDrugstore-Frontend/scripts/check-source-size.mjs`
- Create: `MyLightDrugstore-Frontend/scripts/check-source-size.test.mjs`
- Delete: `MyLightDrugstore-Frontend/src/shared/ui.tsx`

**Interfaces:**
- `shared/ui/index.ts` exports all generic primitives without exporting domain-specific components.
- The boundary checker recognizes `shared`, `entities`, `features`, `widgets`, `pages`, and `app` in that order.
- Root production source permits only `client.tsx`, `server.ts`, `router.tsx`, `routeTree.gen.ts`, and `vite-env.d.ts` as explicitly allowed application entry files.
- The checker rejects upward imports and deep cross-slice imports while allowing public slice barrels.

- [ ] **Step 1: Write checker tests**

Use temporary fixture directories to assert these rules:

```js
test("rejects a feature importing a widget implementation", async () => {
  await writeFixture("features/auth/model/login.ts", "import x from '@/widgets/app-shell/ui/app-shell'")
  assert.deepEqual(await findViolations(fixtureRoot), [
    { file: "features/auth/model/login.ts", importPath: "@/widgets/app-shell/ui/app-shell", rule: "upward-layer-import" },
  ])
})

test("allows a page importing a feature public barrel", async () => {
  await writeFixture("pages/login/login-page.tsx", "import { useLogin } from '@/features/auth'")
  assert.deepEqual(await findViolations(fixtureRoot), [])
})
```

- [ ] **Step 2: Run checker tests and confirm missing checker behavior fails**

```powershell
pnpm exec node --test scripts/check-fsd-boundaries.test.mjs scripts/check-source-size.test.mjs
```

Expected: FAIL because the checker scripts do not exist.

- [ ] **Step 3: Split the UI module by responsibility**

Move the current reusable components and formatters into focused `shared/ui` files. Preserve the existing component props and visible behavior while removing imports from any entity/feature/page slice.

- [ ] **Step 4: Implement the boundary and source-size checkers**

Adapt Botchabuster's `layerOrder`, legacy-root detection, import parser, upward-layer rule, and cross-slice deep-import rule. Set the production file size limit to 300 lines and report each violation with file and line count. Exclude generated `routeTree.gen.ts` from the size rule.

- [ ] **Step 5: Run boundary, source-size, typecheck, and format gates**

```powershell
pnpm exec node --test scripts/check-fsd-boundaries.test.mjs scripts/check-source-size.test.mjs
pnpm exec node scripts/check-fsd-boundaries.mjs --enforce
pnpm exec node scripts/check-source-size.mjs --enforce
pnpm run typecheck
pnpm run format:check
```

Expected: all commands exit 0 with no legacy-root, upward-import, deep-import, or source-size violations.

- [ ] **Step 6: Commit FSD enforcement**

```powershell
git add MyLightDrugstore-Frontend/src/shared/ui MyLightDrugstore-Frontend/scripts
git commit -m "test(frontend): enforce Botchabuster FSD boundaries"
```

---

### Task 10: Add frontend CI and critical browser verification

**Files:**
- Create: `.github/workflows/frontend.yml`
- Create: `MyLightDrugstore-Frontend/playwright.config.ts`
- Create: `MyLightDrugstore-Frontend/tests/e2e/smoke.spec.ts`
- Create: `MyLightDrugstore-Frontend/tests/e2e/auth-and-catalog.spec.ts`
- Create: `MyLightDrugstore-Frontend/tests/e2e/inventory-and-sales.spec.ts`
- Create: `MyLightDrugstore-Frontend/tests/e2e/admin-and-reports.spec.ts`
- Modify: `MyLightDrugstore-Frontend/package.json`
- Modify: `MyLightDrugstore-Frontend/.env.example`

**Interfaces:**
- CI installs with `pnpm install --frozen-lockfile`.
- CI runs architecture, typecheck, format check, unit/component tests, and build.
- E2E tests run against a configured Laravel backend URL and fail with diagnostics if the API is unavailable.
- The CI workflow has bounded job timeouts and does not turn failures into advisory results.

- [ ] **Step 1: Write the CI command contract test**

Create a Node test that reads `.github/workflows/frontend.yml` and asserts it contains `pnpm install --frozen-lockfile`, `pnpm run test:architecture`, `pnpm run typecheck`, `pnpm run format:check`, `pnpm run test:unit`, and `pnpm run build`, plus `timeout-minutes` no greater than 10.

- [ ] **Step 2: Run the workflow contract test and confirm CI config is missing**

```powershell
pnpm exec node --test scripts/frontend-ci-contract.test.mjs
```

Expected: FAIL because `.github/workflows/frontend.yml` and the contract test do not exist.

- [ ] **Step 3: Add scripts and workflow**

Use this workflow shape:

```yaml
name: Frontend CI

on:
  push:
  pull_request:

permissions:
  contents: read

jobs:
  quality:
    name: TanStack Start frontend quality
    runs-on: ubuntu-latest
    timeout-minutes: 10
    defaults:
      run:
        working-directory: MyLightDrugstore-Frontend
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
          cache-dependency-path: MyLightDrugstore-Frontend/pnpm-lock.yaml
      - run: pnpm install --frozen-lockfile
      - run: pnpm run test:architecture
      - run: pnpm run typecheck
      - run: pnpm run format:check
      - run: pnpm run test:unit
      - run: pnpm run build
```

Add a separate E2E job only when the repository has a reproducible Laravel service bootstrap; until then, keep browser E2E local and document the exact command rather than creating an unreliable CI lane.

- [ ] **Step 4: Add Playwright smoke coverage**

The smoke suite must verify login, protected redirect, catalog load, one inventory read, one sale creation, and an admin denial for a staff user. Use environment-provided test credentials; never commit credentials or bypass encryption in E2E helpers.

- [ ] **Step 5: Validate workflow YAML and run all local gates**

```powershell
pnpm exec node --test scripts/frontend-ci-contract.test.mjs
pnpm run test:architecture
pnpm run typecheck
pnpm run format:check
pnpm run test:unit
pnpm run build
```

Expected: all commands exit 0. Validate YAML with the repository's available YAML parser or `npx prettier --check .github/workflows/frontend.yml` without changing the workflow after validation.

- [ ] **Step 6: Commit frontend CI**

```powershell
git add .github/workflows/frontend.yml MyLightDrugstore-Frontend
git commit -m "ci(frontend): gate TanStack Start and FSD quality"
```

---

### Task 11: Remove legacy mock code, perform full trace checks, and complete integration verification

**Files:**
- Delete: `MyLightDrugstore-Frontend/src/shared/api/client.ts`
- Delete: `MyLightDrugstore-Frontend/src/shared/api/seed.ts`
- Delete: `MyLightDrugstore-Frontend/src/shared/SessionContext.tsx`
- Delete: `MyLightDrugstore-Frontend/src/shared/ui.tsx`
- Delete: all remaining legacy `src/pages/*.tsx`, `src/widgets/AppShell.tsx`, and root `src/App.tsx` after their replacements are verified.
- Modify: `MyLightDrugstore-Frontend/README.md` if it exists or create it with normal TanStack Start/FSD setup instructions.

**Interfaces:**
- No production import may reference `mockApi`, `MockApiClient`, `createSeedDb`, `localStorage` session keys, `react-router`, or Figma paths.
- Every route in the accepted route map resolves to a generated TanStack route.
- Every documented API mutation is covered by an adapter test and at least one feature/component test.

- [ ] **Step 1: Write the final static trace checks**

Run these exact checks as the final regression guard:

```powershell
rg -n -i -uuu "figma|mockApi|MockApiClient|createSeedDb|react-router|localStorage.*session|session.*localStorage" MyLightDrugstore-Frontend -g '!node_modules/**' -g '!dist/**'
rg --files MyLightDrugstore-Frontend/src | Where-Object { $_ -match '\\(pages|widgets|features|entities|shared|app|routes)\\' } | Sort-Object
```

Expected: the first command exits with no matches; the second shows only the FSD/Start paths described in the spec.

- [ ] **Step 2: Run the full frontend gate**

```powershell
Set-Location MyLightDrugstore-Frontend
pnpm install --frozen-lockfile
pnpm run test:architecture
pnpm run typecheck
pnpm run format:check
pnpm run test:unit
pnpm run build
```

Expected: every command exits 0 with no skipped or focused tests.

- [ ] **Step 3: Run applicable backend gates without changing backend code**

From `MyLightDrugstore-Backend`, use the repository's documented commands:

```powershell
composer validate --strict --no-check-publish
php artisan test --compact --testsuite=Unit
php artisan test --compact --testsuite=Architecture
php artisan test --compact --testsuite=FeatureFoundation
php artisan test --compact --testsuite=FeatureBusiness
php artisan test --compact --testsuite=FeatureTransport
composer run analyse
```

Expected: all applicable backend lanes pass. If local infrastructure prevents a lane, report the exact command and blocker rather than claiming the gate passed.

- [ ] **Step 4: Verify the final diff and preserve unrelated work**

```powershell
git status --short
git diff --check
git diff --stat HEAD
git diff --name-only HEAD -- MyLightDrugstore-Frontend .github/workflows/frontend.yml docs/superpowers
```

Confirm the diff contains only the frontend refactor, frontend CI, and its documentation. Do not stage or revert the pre-existing backend deletions/untracked changes outside this task.

- [ ] **Step 5: Commit the final cleanup only after all gates pass**

```powershell
git add MyLightDrugstore-Frontend .github/workflows/frontend.yml
git commit -m "refactor(frontend): complete Laravel TanStack Start FSD cutover"
```

---

## Plan Self-Review

- Spec coverage: TanStack Start runtime, Botchabuster-style FSD boundaries, all documented pharmacy workflows, AES-256-GCM transport, session/CSRF behavior, idempotency, Figma removal, tests, CI, and backend gate preservation are each covered by tasks.
- Placeholder scan: no incomplete markers or unspecified implementation steps are used.
- Type consistency: route, client, session, entity, feature, and checker interfaces are named consistently across tasks.
- Scope: the work remains one frontend cutover with independently testable migration phases; no Laravel business logic changes are planned.
