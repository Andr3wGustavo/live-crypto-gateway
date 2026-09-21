# Live Crypto Gateway

Non-Custodial Web3 Donation Infrastructure & Real-Time OBS Streaming Overlay Engine.

> **Pre-release status:** the landing page and local preview are ready for product validation. Real payments are deliberately disabled by default and only testnet rails that pass the controls in [`OPERATIONS_AND_LAUNCH.md`](OPERATIONS_AND_LAUNCH.md) may be enabled. Do not use this repository to receive production funds yet.

---

## Executive Summary & Value Proposition

Live Crypto is a decentralized, non-custodial streaming donation SaaS designed for content creators across Twitch, YouTube, Kick, and X. It bridges the gap between decentralized finance and live broadcasting by enabling viewers to send cryptocurrency donations directly to streamers' self-custody wallets with sub-400ms animated alert overlays in OBS Studio.

### The Creator Economy Problem

Traditional streaming monetization platforms impose severe constraints:
- Heavy platform revenue cuts ranging from 15% to 50% (Twitch Bits, YouTube Super Chats, Stripe processing).
- Chargeback fraud and rolling payment holds lasting up to 90 days.
- Geographic restrictions and currency conversion penalties.
- Custodial risks where creator funds are held in platform intermediaries.

### The Live Crypto Solution

- 100% Non-Custodial: Funds route directly peer-to-peer into the streamer's personal wallets. The platform never holds private keys or user balances.
- Zero Chargeback Risk: Blockchain settlement guarantees irreversible transactions.
- Sub-400ms Latency: High-performance WebSocket architecture dispatches visual alerts, sound chimes, and Text-to-Speech to OBS Studio in under 400 milliseconds.
- Configured-Rail Checkout: EVM native donations on Polygon Amoy or Base Sepolia, plus SOL on Solana Devnet, only after server-side configuration and verification.
- Honest Product Boundary: additional networks, tokens, Lightning, Pix, cards and CEX QR settlement remain unavailable until their independent verification flows are implemented.

---

## System Architecture

```
                       [ Viewer / Donor ]
                               │
                 ┌─────────────┴─────────────┐
                 │                           │
          [ 1-Click Web3 ]           [ Mobile QR Scan ]
          (Phantom, Slush,           (Binance, Coinbase,
           MetaMask, Rabby)           TrustWallet Mobile)
                 │                           │
                 └─────────────┬─────────────┘
                               │
                               ▼
                    [ Blockchain Settlement ]
             (Configured EVM native or SOL rail)
                               │
                               ▼ (On-Chain Event / RPC Indexer)
                 ┌───────────────────────────┐
                 │   Live Crypto Backend     │
                 │   Express + ChainVerifier │
                 │   Anti-Replay Protection  │
                 └─────────────┬─────────────┘
                               │
                               ▼ (Redis Pub/Sub < 400ms)
                 ┌───────────────────────────┐
                 │  WebSocket Connection     │
                 │  Pool Manager             │
                 └─────────────┬─────────────┘
                               │
                               ▼ (Secure obs_token URI)
                 ┌───────────────────────────┐
                 │  OBS Studio Browser       │
                 │  Source Overlay Engine    │
                 │  - Glassmorphic Card      │
                 │  - IPFS Audio Chime       │
                 │  - Web Speech Voice TTS   │
                 │  - Live Goal Progress Bar │
                 └───────────────────────────┘
```

---

## Supported Blockchain Ecosystems

| Network | Native Currency | Current Availability | Settlement Type |
|---|---|---|---|
| Polygon Amoy | POL | Testnet only when configured | EVM native via LiveCryptoRouter |
| Base Sepolia | ETH | Testnet only when configured | EVM native via LiveCryptoRouter |
| Solana Devnet | SOL | Testnet only when configured | Finalized native SOL split |
| ERC-20 / SPL | - | Not enabled | Requires token allowlist and verification |
| Other rails | - | Not enabled | Requires native signing and verifier |

---

## Core Components & Repository Structure

```
live-crypto-gateway/
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   └── index.js             # PostgreSQL pool with high-resilience in-memory fallback
│   │   ├── middleware/
│   │   │   └── auth.js              # JWT cryptographic verification middleware
│   │   ├── redis/
│   │   │   └── index.js             # Redis Pub/Sub client with in-memory fallback engine
│   │   ├── routes/
│   │   │   ├── auth.js              # Dual-wallet auth: SIWE (EVM) and Solana Sign-In
│   │   │   ├── dashboard.js         # Creator configs, telemetry, goals, and test alert trigger
│   │   │   ├── public.js            # Sanitized public profile endpoint (no private token leak)
│   │   │   ├── upload.js            # IPFS file pinning via Pinata (GIFs, MP4s, MP3s)
│   │   │   └── webhooks.js          # Universal verification endpoint and HMAC webhooks
│   │   ├── services/
│   │   │   ├── chainVerifier.js     # Universal multi-chain transaction inspector
│   │   │   └── polling.js           # Cron fallback scanner for pending on-chain blocks
│   │   ├── utils/
│   │   │   └── logger.js            # Structured production logger
│   │   ├── ws/
│   │   │   └── index.js             # Streamer WebSocket connection pool
│   │   └── server.js                # Express entry point, rate limiting, and rawBody HMAC
│   └── tests/
│       └── system.test.js           # Automated cryptographic and security test suite
│
├── frontend/
│   ├── public/
│   │   └── brand/                   # Brand logos, cinematic video loops, and HUD concepts
│   ├── src/
│   │   ├── app/
│   │   │   ├── dashboard/page.tsx   # Streamer Command Center (Liquid Glass UI & KPIs)
│   │   │   ├── login/page.tsx       # Dual Web3 Sign-In (EVM + Solana)
│   │   │   ├── overlay/[obs_token]/ # Transparent OBS Browser Source Overlay
│   │   │   ├── pay/[streamer_id]/   # Multi-chain donation checkout (1-Click & QR)
│   │   │   ├── globals.css          # Liquid glassmorphism, glowing borders, animations
│   │   │   ├── layout.tsx           # Universal HTML shell and metadata
│   │   │   └── page.tsx             # Interactive landing page and OBS simulator
│   │   ├── components/
│   │   │   ├── BackgroundLayer.tsx  # Ambient video background with OBS isolation
│   │   │   └── Web3Provider.tsx     # Reown AppKit & Wagmi multi-chain connector
│   │   └── services/
│   │       └── coingecko.ts         # Real-time multi-token price feed and fiat converter
│   └── package.json
│
├── contracts/
│   ├── LiveCryptoRouter.sol         # Solidity atomic fee-splitting router (ERC-20 + Native)
│   ├── hardhat.config.js            # Multi-network deployment config (Polygon, Base, Amoy)
│   └── test/
│       └── LiveCryptoRouter.test.js # Smart contract automated test suite
│
├── solana-programs/
│   └── live_crypto/
│       └── programs/live_crypto/src/lib.rs # Anchor program for Solana fee routing
│
├── dev-runner.js                    # Single-terminal concurrent launcher
├── docker-compose.yml               # PostgreSQL 15 and Redis 7 container configuration
└── start-dev.bat                    # 1-Click developer execution script
```

---

## OBS Studio Setup Guide (Streamer Workflow)

Live Crypto requires zero local plugin installations. It operates natively through the universal OBS Browser Source standard.

### Step-by-Step Configuration

1. Streamer Authentication:
   Log in at `http://localhost:3000/login` using your Web3 wallet (MetaMask, Phantom, Rabby, etc.).

2. Copy Overlay URL:
   In the Creator Command Center (`/dashboard`), copy your unique Overlay URL:
   `https://app.livecrypto.io/overlay/obs_tok_9f8a7c6b5e...`

3. Add Browser Source in OBS Studio:
   - Click `+` (Add Source) in the Sources panel.
   - Select `Browser`.
   - Paste your unique Overlay URL into the `URL` input.
   - Set Width to `1920` and Height to `1080` (or `800x600`).
   - Enable `Refresh browser when scene becomes active`.
   - Disable `Shutdown source when not visible` to maintain persistent WebSocket connectivity.

4. Test Live Broadcast:
   In your dashboard, click `Test Live OBS Broadcast`. The animated frosted glass card, custom IPFS sound chime, and Text-to-Speech voice will render instantly on stream.

---

## Security and Cryptographic Integrity

### 1. Anti-Replay and Deduplication
Every incoming transaction hash is recorded with a unique constraint. Duplicate submission of previously confirmed transaction hashes is rejected immediately with HTTP 409, preventing double-alert replay attacks.

### 2. Strict HMAC Signature Validation
Webhooks received from external indexers (Alchemy, Helius, QuickNode) are verified against the raw request buffer (`req.rawBody`) using HMAC-SHA256:
```
signature = HMAC_SHA256(rawBody, WEBHOOK_SECRET)
```
This eliminates signature mismatches caused by JSON parser key reordering.

### 3. Recipient Wallet Address Enforcement
The `ChainVerifier` cross-references on-chain destination addresses against the streamer's registered payout addresses before marking any transaction as confirmed.

### 4. XSS Sanitization on Speech Synthesis
Viewer donation messages are stripped of all HTML tags, script injections, and non-printable characters before being processed by the browser speech synthesis engine.

---

## Quick Start & Local Execution

### Option A: 1-Click Launcher (Recommended for Windows)

Double-click `start-dev.bat` in the repository root. It is the official entry point and launches safe preview mode: temporary in-memory data and real donations disabled. This initiates `dev-runner.js`, which installs missing dependencies, waits for the backend API (:8080) and frontend (:3000), then opens the browser.

```bash
.\start-dev.bat
```

For the full local PostgreSQL + Redis stack, start Docker Desktop and run the same root launcher. It runs Docker Compose automatically:

```bat
.\start-dev.bat --full
```

Read [`OPERATIONS_AND_LAUNCH.md`](OPERATIONS_AND_LAUNCH.md) before enabling any payment rail.

### Option B: Manual Execution (Maintenance Only)

Normal development and validation must use the root `start-dev.bat`. The commands below are only for diagnosing a single service.

#### 1. Backend Server

```bash
cd backend
npm install
npm run dev
```
The backend API and WebSocket server will run at `http://localhost:8080`.

#### 2. Frontend Web Application

```bash
cd frontend
npm install
npm run dev
```
The Next.js web application will run at `http://localhost:3000`.

#### 3. Run Automated Security Test Suite

```bash
cd backend
npm test
```

---

## Smart Contract Deployment

### Solidity Router (EVM)

The `LiveCryptoRouter.sol` contract handles atomic fee splitting for EVM networks:

```solidity
function donateNative(address payable streamer) external payable;
function donateERC20(address token, address streamer, uint256 amount) external;
```

To compile and test the contracts:

```bash
cd contracts
npm install
npx hardhat compile
npx hardhat test
npm run sync:abi
```

To deploy to Polygon Amoy Testnet:

```bash
npx hardhat run scripts/deploy.js --network amoy
```

The deployment now requires `PRIVATE_KEY`, `PLATFORM_TREASURY` and `PLATFORM_FEE_BPS` in the environment. It intentionally has no default deployer or treasury address.

---

## License

This project is licensed under the MIT License.
