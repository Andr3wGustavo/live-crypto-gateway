# LiveCrypto — implementation and verification status

**Updated: 5 October 2026.** See [the resumption roadmap](docs/RETOMADA_E_ROADMAP.md) for priorities, dependencies and publication policy.

## Current delivery

The Matrix/Protocol design combines the logo's blue/cyan/green with violet accents. Shared branding and guides are integrated into landing, login, Creator Studio and checkout. The SVG blockchain scene provides automatic playback, scroll, pause/replay and manual exploration. Reduced-motion users can explicitly opt in.

Creator Studio now explains authentication, receiving destinations, payment availability, OBS Browser Source setup and the difference between public checkout and private overlay links. UI status uses the profile/network configuration, not an assumed successful payment or OBS connection.

The backend work accumulated before this resumption includes revocable cookie sessions, persistent creator-bound payment intents, RPC discovery/reconciliation, exact-value settlement and durable OBS replay/ACK. Mainnet acceptance remains pending.

## Evidence from this resumption

| Check | Result | Scope |
|---|---|---|
| Frontend TypeScript (`--noEmit --incremental false`) | Passed | Application types; not browser interaction |
| Targeted frontend ESLint | Passed | Product routes, animation/guide components and localization |
| Locale/catalog tests | 6 passed | Negotiation, route handling, exact decimal display and translation parity |
| Backend tests | 32 passed; 3 skipped | HTTP auth, sessions, verification and preview behavior; PostgreSQL tests skipped without `TEST_DATABASE_URL` |
| Launcher regression tests | 5 passed | Memory diagnostics, readiness, timeout and storage-mode checks |
| Solana cluster constants | Corrected and regression-tested | Full genesis hashes confirmed against public Devnet/mainnet `getGenesisHash` responses; no funds moved |
| Current browser/design acceptance | Deferred | Owner chose to continue without visual testing on the constrained machine |
| Current production build | Pending | Earlier build results belong to the previous visual revision |
| PostgreSQL integration / Docker images | Pending | Docker did not respond during the attempted inspection |
| GitHub Actions | Workflow included; result not verified here | `gh` CLI is unavailable in this environment |

The Solana configuration previously contained shortened chain identifiers where the verifier required full genesis hashes. Both configured-cluster acceptance cases now pass alongside the wrong-cluster rejection test.

## Historical evidence

Before the Matrix rewrite, the Afterglow landing passed production build and headless browser checks. The Windows launcher also passed five HTTP scenarios covering fifteen localized pages after memory/startup corrections. Eight Solidity contract tests passed in a previous review. These are historical results, not a fresh approval of this release.

## Remaining gates

1. Run the [Matrix browser acceptance checklist](docs/VALIDATION_MATRIX.md), production build and actual wallet-extension journey.
2. Run the complete backend suite with PostgreSQL, clean/upgrade migrations and restart recovery. Preview tests use process-local Redis substitutes and do not validate real Redis recovery.
3. Refresh dependency auditing. The previous frontend audit reported moderate transitive findings through the legacy Solana SDK; no forced downgrade has been applied.
4. Validate EVM and Solana testnet donations end to end with the exact router, treasury, fee, RPC and real OBS source, including outage and duplicate scenarios.
5. Build/start the production Compose stack on staging; verify DNS, TLS/WSS, health checks, migrations, rollback and externally stored backup restoration.
6. Complete monitoring, operational ownership and a small creator pilot.
7. Before mainnet, complete independent contract/security review and the business's legal, tax, privacy, fee and support decisions.

## Product boundaries

- Payments default to disabled. Only configured native EVM and SOL rails can create intents.
- Ledger/outbox durability requires PostgreSQL. Demo mode is temporary and does not accept payments.
- Wallet keys and funds remain outside platform custody. A test alert is not payment proof.
- USD estimates are unavailable. Goals are manually configured; automatic fiat conversion and minimum-amount filtering remain inactive.
- Token checkout, additional networks, fiat rails, public paid TTS quotas, subscriptions and billing are future work.
- A Git push is not a VPS deployment. No remote production service or mainnet acceptance is claimed.

## Documentation

- [Design and animation](docs/LANDING_DESIGN.md)
- [Resumption roadmap and publication log](docs/RETOMADA_E_ROADMAP.md)
- [VPS/staging runbook](PRODUCTION_GLOBAL_LAUNCH.md)
- [Business, pricing and acquisition hypotheses](PRODUCT_BUSINESS_AND_GTM_PLAN.md)

Earlier checklist files are historical planning context. This status distinguishes implemented code, executed tests, deferred checks and deployment.
