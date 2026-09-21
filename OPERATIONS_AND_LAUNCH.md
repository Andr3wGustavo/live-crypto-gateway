# Live Crypto Operations and Launch Gate

This is a financial product. A visual preview, a test alert and a wallet connection do not establish payment readiness. Production payments remain disabled until every launch gate below passes.

## Product Boundary

Live Crypto is a non-custodial donation experience for live creators:

1. A supporter signs from their own wallet.
2. The payment router splits the configured platform fee and the creator payout atomically.
3. The backend verifies the finalized transaction against the configured network, router, recipient and fee.
4. The verified event is persisted transactionally and queued in `Donation_Outbox`.
5. The outbox worker publishes the alert to the creator's authenticated OBS browser source.

The platform does not hold a user balance or private key. The initial proposed business model is a 2% routing fee (`PLATFORM_FEE_BPS=200`) plus the network fee charged separately by the blockchain.

## Supported Scope

The checkout only permits a payment rail when it is enabled by server-side configuration and the creator registered a wallet for that exact rail.

| Rail | Current target | Requirement before enabling |
|---|---|---|
| EVM native asset | Polygon Amoy or Base Sepolia | Router deployed, exact router address, dedicated RPC, 3 confirmations and testnet reconciliation |
| SOL | Solana Devnet | Registered creator wallet, treasury wallet, fee split and finalized RPC verification |
| ERC-20 / SPL tokens | Not enabled | Token allowlist, decimal-aware verification, approval UX, token-specific tests |
| Sui, Bitcoin, Lightning, TRON, TON, Dogecoin | Not enabled | Native signing/invoice integration and an independent verifier for that rail |
| Pix, card, CEX QR | Not enabled | Regulated payments partner, KYC/AML/legal review and settlement/reconciliation design |

Do not market an unsupported rail as available. QR codes and synthetic hashes are not payment confirmation and must never dispatch a real donation alert.

## Local Modes

### Preview

Double-click `start-dev.bat`, or run:

```powershell
.\start-dev.bat
```

This starts with `--demo`: in-memory temporary data, local alerts and `DONATIONS_ENABLED=false`. It is safe for visual work and cannot accept funds. Restarting clears the preview account data.

### Full local stack

Start Docker Desktop, then run:

```powershell
docker compose up -d
Copy-Item backend\.env.example backend\.env
.\start-dev.bat --full
```

The launcher waits for `GET /api/health` and the first Next.js response before opening the browser. Full mode fails closed when PostgreSQL or Redis is unavailable. `GET /api/health` returns `preview` for memory mode; it must report `ok` with connected database and Redis before any payment test.

Apply the migration once for an existing database:

```powershell
Get-Content db\migrations\001_donation_outbox.sql | docker compose exec -T postgres psql -U postgres -d livecrypto
```

For a new Docker volume, `db/init.sql` creates the outbox automatically.

## Testnet Payment Gate

1. Create an isolated deployer and treasury wallet. Never use a personal seed phrase or commit a private key.
2. Fund it with testnet assets only.
3. Set `EVM_CHAIN_ID`, `EVM_RPC_URL`, `EVM_ROUTER_ADDRESS`, `SOLANA_CLUSTER`, `SOLANA_RPC_URL`, `SOLANA_TREASURY_ADDRESS` and a unique `JWT_SECRET` in `backend/.env`.
4. Leave `DONATIONS_ENABLED=false` while configuring; inspect `/api/public/payment-config` and ensure only the intended rail appears.
5. Register a creator wallet for that exact network through the authenticated dashboard.
6. Set `DONATIONS_ENABLED=true` only after contract address and treasury are reviewed by a second person.
7. Send a native testnet payment. Verify: exact recipient, 2% fee, configured confirmation depth, `Transactions` row, `Donation_Outbox` row and one OBS alert.
8. Submit the same transaction hash twice. The second request must return `409`, and OBS must emit no second alert.
9. Test a wrong recipient, wrong router, wrong fee, reverted transaction and insufficient confirmations. All must be rejected or remain pending.
10. Rotate the OBS token and confirm the previous URL is rejected.

## Production Gates

- Independent smart-contract audit and a remediation review.
- A dedicated RPC provider per enabled rail, rate limits, provider health alerts and network-specific confirmation policy.
- PostgreSQL backup and restoration drill; Redis persistence/availability strategy; outbox delivery metrics and dead-letter alerting.
- HTTPS-only `FRONTEND_URL`, real 32+ character `JWT_SECRET`, secret manager, no default credentials, protected Docker host and restricted database ports.
- Migrate browser-held JWTs to HttpOnly secure cookies and add CSRF protection before public creator accounts.
- Legal, tax, consumer disclosure, sanctions/AML and jurisdiction review before charging real users.
- Error monitoring, structured audit logs without sensitive payloads, uptime monitoring and a public incident/contact channel.
- Threat model and load test of WebSockets, webhook ingestion and wallet verification.

## Business Model

The recommended initial offer is a transparent 2% fee on verified, router-routed donations. Keep network fee separate in the wallet confirmation. Avoid a free tier that makes real-time settlement uneconomical; instead, use a time-limited creator beta and offer optional Pro features after core payments prove reliable:

- branded overlays and media storage;
- premium neural voices with hard account quotas;
- advanced moderation, analytics and team controls;
- dedicated support and higher verified-event limits.

Never take a percentage from funds outside a transaction the platform can verify. Never bill Pro usage without usage limits, receipts and cancellation handling.
