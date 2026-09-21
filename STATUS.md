# Live Crypto Gateway Status

> Last reviewed: 2026-09-21
> Operational state: preview ready; real payments are disabled by default; production is not approved.

## Start Here

Always start the project from the root launcher in `live-crypto-gateway`:

```bat
.\start-dev.bat
```

This is the safe preview mode. It installs missing frontend/backend dependencies, starts the API and web application, opens `http://localhost:3000`, keeps all data in memory, and forces `DONATIONS_ENABLED=false`.

For the local persistent stack, open Docker Desktop first and run:

```bat
.\start-dev.bat --full
```

Full mode starts PostgreSQL and Redis with Docker Compose before starting the application. It fails if Docker is not running or the required services are unhealthy. Do not start the API and frontend in separate terminals for normal development.

## What Works

| Area | State |
|---|---|
| Product landing, creator demo and fee calculator | Ready for product validation |
| Creator login | EVM SIWE and Solana Ed25519 signature validation |
| Dashboard and OBS overlay | Available in preview; alerts use local temporary data |
| Checkout | Only server-configured EVM native and SOL rails are shown |
| EVM settlement | Verifies network, router event, recipient, fee and confirmations |
| SOL settlement | Verifies finalized transfer split and registered recipient |
| Duplicate settlement prevention | Database transaction plus outbox record |
| Smart contract | Native and ERC-20 router tests passing; no audited deployment |

## Deliberately Not Available

- Production payments, mainnet wallets and custody.
- ERC-20 and SPL donations in the public checkout.
- Sui, Bitcoin, Lightning, TRON, TON, Dogecoin, Pix, cards and CEX QR settlement.
- Automatic background reconciliation of missed donor-browser verification requests.
- Production cookie sessions, CSRF protection, audit approval and legal/compliance controls.

## Verification Snapshot

| Check | Result |
|---|---|
| Backend tests | 21 passed; 1 PostgreSQL integration test skipped without `TEST_DATABASE_URL` |
| Contract tests | 8 passed |
| Frontend production build | Passed |
| Root preview launcher | Verified: API health and landing returned HTTP 200 |
| Full Docker stack | Not verified in this workspace because Docker Desktop was not running |

The frontend build emits a non-blocking `bigint` native binding warning and uses its JavaScript fallback.

## Before Testnet Payments

1. Start Docker Desktop and run the root launcher with `--full`.
2. Run the PostgreSQL integration test with `TEST_DATABASE_URL`.
3. Deploy and independently review `LiveCryptoRouter` on Polygon Amoy or Base Sepolia.
4. Configure dedicated RPC endpoints, router address, treasury, JWT secret and permitted frontend URL in `backend/.env`.
5. Test exact fee split, recipient, confirmations, duplicate hash and OBS delivery on testnet.
6. Add a persistent reconciliation worker before allowing external donors to rely on alerts.

## Before Production

- Complete an independent contract/security audit and remediation review.
- Replace browser-held JWTs with secure HttpOnly cookies and CSRF protection.
- Add observability, backup/restore drills, dead-letter handling and incident response.
- Complete legal, tax, sanctions/AML and consumer disclosure review for each launch jurisdiction.

Detailed payment and operational gates are in [OPERATIONS_AND_LAUNCH.md](OPERATIONS_AND_LAUNCH.md).
