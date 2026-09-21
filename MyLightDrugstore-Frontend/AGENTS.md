# MyLightDrugstore frontend

TanStack Start application using React, TypeScript, TanStack Router, TanStack Query, Tailwind CSS, and the Feature-Sliced Design architecture.

## Development commands

Run these commands from `MyLightDrugstore-Frontend` through Corepack's pinned pnpm:

```powershell
corepack pnpm install --frozen-lockfile
corepack pnpm run dev
corepack pnpm run typecheck
corepack pnpm run test:architecture
corepack pnpm run test:unit
corepack pnpm run test:component
corepack pnpm run build
```

## FSD boundaries

Production code follows this dependency direction:

```text
shared <- entities <- features <- widgets <- pages <- app
```

- `shared` contains generic UI, transport, configuration, and utilities.
- `entities` contains domain models, entity clients, query keys, and public APIs.
- `features` contains user workflows and their UI.
- `widgets` contains larger reusable compositions such as the application shell.
- `pages` contains route-level screens.
- `app` contains providers, route guards, and application composition.
- `routes` contains thin TanStack file-based route adapters.

Import another slice through its public `index.ts` API. Do not import another slice's internal `api`, `model`, `lib`, or `ui` file directly. Run `corepack pnpm run test:architecture` after moving files.

## API and security

All Laravel API requests use the shared Web Crypto transport client. The client bootstraps the public transport key, uses a fresh AES-256-GCM request key, wraps it with RSA-OAEP-SHA-256, binds ciphertext to the method and normalized path, and includes the HTTP-only session cookie. Never persist session credentials, CSRF tokens, transport keys, or decrypted payloads.

Do not send client-calculated stock totals, prices, or sale totals. Use idempotency keys for sale creation, sale-item addition, and stock receipts.
