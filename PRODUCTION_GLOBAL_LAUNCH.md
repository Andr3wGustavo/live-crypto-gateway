# Production and Global Launch Guide

This guide deploys the current service as a hosted **testnet beta**. It does not approve mainnet payment processing. Complete the evidence gates in [STATUS.md](STATUS.md) before enabling a payment rail.

## Architecture

```text
Internet
  -> Caddy (HTTPS/WSS :443)
     -> Next.js frontend (:3000, internal)
     -> Express API and WebSocket (:8080, internal)
        -> PostgreSQL (:5432, internal)
        -> Redis (:6379, internal)
```

`compose.production.yml` starts PostgreSQL and Redis, runs the additive migration job once, then starts backend, frontend, and Caddy. Application containers run as an unprivileged user. PostgreSQL and Redis have no host port mapping.

## Host Requirements

- A supported Linux host with Docker Engine and Docker Compose plugin.
- A public domain with A/AAAA records pointing to the host.
- Firewall rules allowing only TCP 80, TCP 443, and restricted administrative SSH.
- A separate staging environment. Do not reuse its database, Redis volume, wallets, RPC credentials, or secrets in production.
- At least 4 vCPU, 8 GB RAM, and 80 GB NVMe for an initial beta. Measure before increasing traffic.

## Configure Secrets

```sh
cp deploy/.env.example deploy/.env
chmod 600 deploy/.env
```

Set every placeholder before deploying:

| Variable | Requirement |
|---|---|
| `APP_DOMAIN` | Exact public hostname, without a protocol. |
| `POSTGRES_PASSWORD` | Unique long database password. |
| `JWT_SECRET` | Unique random value of at least 32 characters. The server rejects placeholders and weak values in production. |
| `DONATIONS_ENABLED` | Keep `false` until the testnet gate is approved. |
| `EVM_*` | Verified chain ID, dedicated RPC, deployed router, treasury, and required confirmations. |
| `SOLANA_*` | Correct cluster, dedicated RPC, and test treasury. |
| `PLATFORM_FEE_BPS` | Matches the deployed router configuration. |

Do not place secrets in Git, frontend `NEXT_PUBLIC_*` variables, shell history, or screenshots. Values prefixed `NEXT_PUBLIC_` are embedded in the frontend image at build time.

## Deploy

Run the static configuration check before starting services:

```sh
docker compose --env-file deploy/.env -f compose.production.yml config --quiet
docker compose --env-file deploy/.env -f compose.production.yml up -d --build
docker compose --env-file deploy/.env -f compose.production.yml ps
curl --fail https://$APP_DOMAIN/api/health
```

The migration service must finish successfully before the backend starts. A failed migration blocks rollout. Migrations have checksums and an advisory lock; never edit an already-applied migration. Back up PostgreSQL before applying a release to an existing environment.

## Testnet Acceptance Gate

Keep `DONATIONS_ENABLED=false` until every item is evidenced in staging:

1. Connect real EVM and Solana wallet extensions on desktop and mobile browsers.
2. Verify the exact deployed router, treasury, fee, confirmations, RPC network, and Solana genesis hash.
3. Send EVM and SOL test payments and confirm creator attribution, gross/fee/net ledger values, and explorer links.
4. Close checkout before submitting a hash and confirm background discovery settles the intent once.
5. Test duplicate hashes, wrong recipient, wrong sender, wrong memo/reference, reverted transactions, RPC outage, and backend restart.
6. Test OBS offline replay, ordered bursts, `ACK`, browser reload, token rotation, and a prolonged WSS connection.
7. Restore a backup into an isolated database and verify payment intent and outbox recovery.
8. Review logs and metrics for secrets, OBS tokens, wallet signatures, and raw payment payloads.

Enable only the approved testnet rails. Mainnet additionally requires an independent contract review, legal and tax review for intended markets, documented incident response, external backup restoration evidence, monitoring and alerting, and a controlled pilot.

## Operations

- Health: `GET /api/health` must report PostgreSQL and Redis connected in persistent mode.
- Logs: `docker compose --env-file deploy/.env -f compose.production.yml logs -f backend`.
- Stop a release: `docker compose --env-file deploy/.env -f compose.production.yml down`. Do not include `-v` unless intentionally destroying data.
- Back up PostgreSQL outside the VPS, encrypt backups, define retention, and rehearse restore. Redis is not the source of truth for donations or alert delivery.
- Roll back only to an image compatible with the current database schema. Use additive expand/migrate/contract database changes.
- Maintain a separate incident action for disabling new payments while leaving reconciliation available for already-created intents.

## Internationalization and Privacy

English, Brazilian Portuguese, and Spanish are currently supported. Locale selection follows the explicit URL, saved preference, browser language, trusted country header if configured, then English. The deployment Caddyfile removes client-supplied country headers; connect a trusted CDN only after it overwrites that header at the edge.

OBS URLs include a bearer-like token. Treat them as private credentials: avoid full URL logging, rotate tokens on exposure, and restrict dashboard access.
