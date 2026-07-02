<p align="center">
  <!-- TODO: Replace with your actual logo -->
  <!-- <img src="./assets/logo.png" alt="Live Crypto Logo" width="280" /> -->
  <h1 align="center">⚡ LIVE CRYPTO</h1>
  <p align="center"><strong>Non-Custodial Web3 Donation Platform & Real-Time Streaming Overlay System</strong></p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Solidity-0.8.19-363636?style=for-the-badge&logo=solidity&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-15-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis&logoColor=white" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" />
</p>

---

## 📸 Screenshots

<!-- TODO: Add screenshots of the dashboard, overlay, and payment gateway -->

| Dashboard | OBS Overlay | Payment dApp |
|-----------|-------------|--------------|
| ![Dashboard Screenshot](./assets/screenshots/dashboard.png) | ![OBS Overlay Screenshot](./assets/screenshots/overlay.png) | ![Payment dApp Screenshot](./assets/screenshots/pay.png) |

| Login (SIWE) | CEX Manual Mode |
|--------------|-----------------|
| ![Login Screenshot](./assets/screenshots/login.png) | ![CEX Mode Screenshot](./assets/screenshots/cex_mode.png) |

---

## 🧠 What is Live Crypto?

Live Crypto is a **non-custodial, blockchain-native donation platform** designed for streamers — analogous to LivePix, but built entirely on Web3 infrastructure. It allows anyone to send crypto donations to a streamer, with real-time alerts appearing on OBS Studio via a Browser Source overlay.

### Key Principles

- 🔒 **Non-Custodial**: The backend **never** stores, processes, or touches user private keys.
- ⚡ **Real-Time**: Donations trigger instant WebSocket alerts to the OBS overlay.
- 🌐 **Universal Gateway**: Works with Web3 wallets (MetaMask, WalletConnect) **and** centralized exchanges (Binance, Coinbase) via QR code manual send.
- 💸 **Atomic Fee Splitting**: A Solidity Router Smart Contract handles the platform fee (1-2%) and streamer payout in a single atomic transaction.

---

## 🏗️ Architecture

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Next.js App    │     │  Express Backend  │     │   PostgreSQL     │
│                  │     │                   │     │                  │
│  /login (SIWE)   │────▶│  /api/auth        │────▶│  Streamers       │
│  /dashboard      │────▶│  /api/dashboard   │────▶│  Wallets         │
│  /pay/:id        │     │  /api/webhooks    │────▶│  Transactions    │
│  /overlay/:token │◀────│  WebSocket Server │     │  Alert_Configs   │
└──────────────────┘     └────────┬─────────┘     └──────────────────┘
                                  │
                           ┌──────┴──────┐
                           │    Redis     │
                           │  Pub/Sub    │
                           └─────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 18
- **Docker** & **Docker Compose**
- **npm**

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/live-crypto.git
cd live-crypto
```

### 2. Start Infrastructure (PostgreSQL + Redis)

```bash
docker-compose up -d
```

> This automatically runs the DDL schema (`db/init.sql`) on first boot.

### 3. Start the Backend

```bash
cd backend
cp .env.example .env   # Edit with your values
npm install
npm run dev
```

The API will be running at `http://localhost:8080`.

### 4. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

The app will be running at `http://localhost:3000`.

### 5. Compile Smart Contracts (Optional)

```bash
cd contracts
npm install
npx hardhat compile
```

The compiled ABI is already exported to `frontend/src/abi/LiveCryptoRouter.json`.

---

## 📂 Project Structure

```
live-crypto/
├── backend/                    # Node.js + Express API
│   ├── src/
│   │   ├── db/index.js         # PostgreSQL connection pool
│   │   ├── redis/index.js      # Redis Pub/Sub clients
│   │   ├── ws/index.js         # WebSocket server (OBS connections)
│   │   ├── routes/
│   │   │   ├── auth.js         # SIWE authentication (nonce + verify)
│   │   │   ├── dashboard.js    # Wallet config, transactions, token rotation
│   │   │   └── webhooks.js     # HMAC-validated webhook listener
│   │   ├── services/
│   │   │   └── polling.js      # Fallback cron job for missed webhooks
│   │   └── server.js           # Express entry point with rate limiting
│   └── .env
│
├── frontend/                   # Next.js 16 + Tailwind CSS
│   ├── src/
│   │   ├── abi/                # Compiled Smart Contract ABIs
│   │   ├── components/
│   │   │   └── Web3Provider.tsx # Wagmi + Web3Modal provider
│   │   └── app/
│   │       ├── login/          # SIWE streamer authentication
│   │       ├── dashboard/      # Streamer dashboard (Green-on-Black)
│   │       ├── pay/[streamer_id]/ # Universal Payment Gateway (Dual Mode)
│   │       └── overlay/[obs_token]/ # OBS Browser Source overlay
│   └── globals.css             # CRT scanlines, Matrix decode, flicker FX
│
├── contracts/                  # Solidity Smart Contracts (Hardhat 3)
│   ├── src/
│   │   └── LiveCryptoRouter.sol # Non-custodial fee-splitting router
│   └── hardhat.config.js
│
├── db/
│   └── init.sql                # PostgreSQL DDL schema
│
└── docker-compose.yml          # PostgreSQL 15 + Redis 7
```

---

## 🔐 Security Features

| Feature | Implementation |
|---------|---------------|
| **SIWE Authentication** | EIP-4361 — Streamers sign a nonce with their wallet. No passwords. |
| **HMAC Webhook Validation** | `x-alchemy-signature` verified via `crypto.timingSafeEqual`. |
| **Rate Limiting** | 3-tier: Global (100/15min), Auth (20/15min), Webhooks (60/min). |
| **OBS Token Rotation** | `POST /api/dashboard/rotate-token` regenerates the UUID instantly. |
| **Fallback Polling** | Cron job every 2 minutes catches transactions missed by webhooks. |
| **XSS Sanitization** | Donation messages are sanitized before DOM render and TTS output. |
| **Non-Custodial** | Backend **never** handles private keys. All signing happens client-side. |

---

## 🎨 OBS Overlay Features

<!-- TODO: Add a GIF of the overlay in action -->
<!-- ![Overlay Demo](./assets/screenshots/overlay_demo.gif) -->

- **CRT Scanline Effect** — Authentic retro terminal aesthetic.
- **Matrix Decode Animation** — Donor addresses scramble before revealing.
- **Text Glow & Flicker** — Pulsating green neon glow on all text.
- **Web Speech TTS** — Donations are spoken aloud via the browser's speech engine.
- **Strict Numeral-Only Goals** — No descriptive text. Only raw pulsating numerals (e.g., `1240.50 / 1500.00`).

---

## 💳 Universal Payment Gateway

The `/pay/[streamer_id]` page provides two modes:

| Mode | Use Case | How it Works |
|------|----------|--------------|
| **Web3 Native** | MetaMask, WalletConnect, Phantom | One-click connect + sign via Wagmi v2 |
| **CEX / Manual** | Binance, Coinbase, Exchange Apps | Scan QR code, copy address, long-poll detection |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend API** | Node.js, Express, JWT |
| **Database** | PostgreSQL 15 |
| **Cache / Pub-Sub** | Redis 7 |
| **Real-Time** | WebSockets (ws) |
| **Frontend** | Next.js 16, React 19, Tailwind CSS v4 |
| **Web3** | Wagmi v2, Viem, Web3Modal, SIWE |
| **Smart Contracts** | Solidity 0.8.19, Hardhat 3 |
| **Infrastructure** | Docker Compose |

---

## 📄 Environment Variables

Create a `.env` file in `backend/`:

```env
PORT=8080
POSTGRES_USER=postgres
POSTGRES_HOST=localhost
POSTGRES_DB=livecrypto
POSTGRES_PASSWORD=password
POSTGRES_PORT=5432
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key
FRONTEND_URL=http://localhost:3000
WEBHOOK_SECRET=your-webhook-hmac-secret
```

---

## 📜 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Built with 💚 by the Live Crypto Team
</p>
