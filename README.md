# Live Crypto Gateway

Live Crypto Gateway is a non-custodial donation service for livestream creators. A donor pays the creator's configured wallet on an enabled chain; the service verifies the transaction, records it durably, and delivers a replayable OBS alert. The service does not custody funds or private keys.

> Payment rails are disabled by default. This repository provides a local preview and staging deployment configuration. Public-beta validation is still pending. Enable a rail only after the deployment, contract, RPC, and end-to-end testnet checks in [PRODUCTION_GLOBAL_LAUNCH.md](PRODUCTION_GLOBAL_LAUNCH.md).

**Resume here:** [project handoff and roadmap](docs/RETOMADA_E_ROADMAP.md) · [current evidence](STATUS.md) · [browser acceptance checklist](docs/VALIDATION_MATRIX.md).

## Product Gallery

The current **Protocol / Matrix** direction combines the logo's blue, cyan and green with violet accents, terminal typography, an SVG blockchain simulation and an interactive OBS demonstration. Login, checkout and Creator Studio share the design and onboarding guides. See [the design notes](docs/LANDING_DESIGN.md); browser acceptance of this revision is pending.

Screenshots and a short demo will be added here after the browser review. The slots below are reserved for actual captures of the application; they are not evidence of a completed payment or deployment.

| Preview | What to show | Planned image path |
|---|---|---|
| Landing page | Product introduction, visual identity, and language selector | `docs/images/landing.webp` |
| Creator dashboard | Payout setup, alert customization, and transaction history | `docs/images/dashboard.webp` |
| Donation checkout | Selected network, recipient, amount, and fee breakdown | `docs/images/checkout.webp` |
| OBS overlay | An alert displayed over a sample stream, labeled as a test | `docs/images/obs-overlay.webp` |
| Mobile experience | Responsive landing and checkout on a phone-sized screen | `docs/images/mobile.webp` |

**Demo video:** link to be added after recording the creator setup and testnet donation journey.

<!-- Uncomment each image only after its file has been added.
![Live Crypto landing page](docs/images/landing.webp)
![Creator dashboard with payout and overlay settings](docs/images/dashboard.webp)
![Donation checkout showing the network and fee breakdown](docs/images/checkout.webp)
![Test donation alert displayed in OBS](docs/images/obs-overlay.webp)
![Live Crypto mobile layout](docs/images/mobile.webp)
-->

See [the image guide](docs/images/README.md) for capture and replacement instructions.

## Capabilities

- Wallet authentication with SIWE (EVM) and signed Solana login challenges.
- Revocable 12-hour `HttpOnly`, `SameSite=Strict` sessions backed by Redis.
- Per-network payout address validation, including reserved router, treasury, zero, and system addresses.
- Persistent payment intents bound to creator, chain, payout address, sender, amount, memo, and Solana reference.
- Server-side EVM event discovery and Solana reference discovery, so reconciliation continues after the donor closes checkout.
- Exact decimal verification for native EVM and SOL payment splits, confirmations, configured RPC network, router, treasury, and payment intent fields.
- Atomic transaction ledger and donation outbox; OBS alerts are replayed in order until a browser source acknowledges each alert.
- Locale routes and UI catalogs for English, Brazilian Portuguese, and Spanish.
- Production Compose stack with PostgreSQL, Redis, migrations, non-root application images, Caddy HTTPS/WSS routing, and CI verification.

## Payment Model

The backend creates an opaque payment intent before a wallet transaction. Its database record snapshots the creator, configured destination, sender, expected gross amount, fee terms, memo, chain, and monitoring cursor. A verified transaction settles only when all of those values match.

For EVM, the verifier requires a confirmed `DonationRouted` event from the configured router. For Solana, it requires a finalized native transfer split, the configured cluster genesis hash, a matching memo, and the generated reference account. A browser-submitted transaction hash helps speed reconciliation, but is not the sole discovery mechanism.

The financial record and the OBS outbox are inserted atomically. Publishing to Redis does not mark an alert displayed. An OBS browser source receives one alert at a time and sends an `ACK`; unacknowledged alerts remain durable and replay after reconnect.

## Local Development

Prerequisites: Node.js 24, npm, and optionally Docker Desktop for PostgreSQL and Redis.

```powershell
.\start-dev.bat
```

This starts preview mode with temporary data and payments disabled. For persistent local services, start Docker Desktop first and run:

```powershell
.\start-dev.bat --full
```

The local API is served on `http://localhost:8080`; the web application is served on `http://localhost:3000`.

### Startup and memory troubleshooting

Keep the launcher terminal open. It checks the API first, then waits for a complete HTML response before opening the browser. A Next.js `Ready` message alone does not mean the first page has compiled.

- Allow several minutes for a cold start, especially immediately after reboot or inside Dropbox/OneDrive. Progress is printed every 15 seconds; the API has a four-minute startup budget and the initial page has ten minutes.
- Aim for at least 2 GB of available RAM. On Windows, leave the paging file system-managed with enough free disk space. The launcher checks available RAM and virtual memory before starting the services.
- If you see `Failed to allocate memory` or `heap out of memory`, close unused apps/tabs before retrying. Increasing the Node heap limit is not a remedy for exhausted system memory.
- The Windows launcher's local Webpack configuration disables persistent pack caching and optimizes wallet-package imports to reduce compilation pressure. Cold compilation may still take time.
- For frontend diagnostics, inspect `frontend/.next/dev/logs/next-development.log`. API failures are reported separately in the launcher terminal.
- `start-dev.bat --check` validates localized pages, redirects, API, assets, and sitemap, then stops its application processes. It does not test a real wallet signature or donation.

Launcher regression tests can be run from the repository root with `node --test tests/startup-checks.test.js`.

## Verification

```powershell
# Backend HTTP, authentication, verifier, and preview tests
cd backend
npm test

# PostgreSQL integration tests require a running local database
$env:TEST_DATABASE_URL='postgresql://postgres:password@127.0.0.1:5432/livecrypto'
npm run migrate
npm test

# Frontend locale tests, lint, and production build
cd ..\frontend
npm run test:i18n
npm run lint:product
npm run build

# Smart contract tests
cd ..\contracts
npm test
```

## Production Deployment

The production stack is defined in `compose.production.yml`. It exposes only Caddy on ports 80 and 443. PostgreSQL, Redis, frontend, backend, and the migration job remain on an internal Docker network.

```powershell
Copy-Item deploy/.env.example deploy/.env
# Set APP_DOMAIN, POSTGRES_PASSWORD, JWT_SECRET, and testnet configuration.
docker compose --env-file deploy/.env -f compose.production.yml up -d --build
```

DNS for `APP_DOMAIN` must point to the host before Caddy can issue a certificate. Use distinct secrets, databases, wallets, RPC endpoints, and domains for staging and production. The full operational checklist, rollback, and payment enablement gates are in [PRODUCTION_GLOBAL_LAUNCH.md](PRODUCTION_GLOBAL_LAUNCH.md).

## Repository Layout

```text
backend/       Express API, settlement workers, WebSocket server, and tests
frontend/      Next.js application, locales, checkout, dashboard, and OBS overlay
contracts/     EVM donation router and Solidity tests
db/            Base schema and versioned migrations
deploy/        Caddy configuration and deployment environment template
docs/images/   README screenshots and capture instructions
```

## Current Status

See [STATUS.md](STATUS.md) for implementation evidence and remaining external validation. [PRODUCT_BUSINESS_AND_GTM_PLAN.md](PRODUCT_BUSINESS_AND_GTM_PLAN.md) defines the staged revenue, traffic, marketing, measurement, and commercial launch plan. In particular, real browser-extension login, testnet transactions, OBS rendering, backups, TLS deployment, and independent smart-contract review require environments and credentials outside this repository.

## License

MIT
