# ⚡ Live Crypto — Non-Custodial Web3 Donation SaaS for Streamers
## Senior Developer Architectural Blueprint & Comprehensive Guide

---

## 1. Executive Summary & Project Status Audit

### Where We Stand
| Component | Status | Implementation Details |
|---|---|---|
| **Frontend Architecture** | **Operational** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Wagmi v3, Reown AppKit (EVM + Solana adapters), QRCode generator. |
| **Backend Core** | **Operational** | Node.js / Express, WebSockets for sub-second OBS dispatch, SIWE (Sign-In with Ethereum) authentication, multipart upload engine for custom alert audio/GIFs, rate limiters, memory fallback engine for standalone local execution. |
| **Data & Cache Layer** | **Hybrid / Resilient** | PostgreSQL schema + Redis Pub/Sub with automatic in-memory fallback when external services are not active locally. |
| **Smart Contracts** | **Designed & Prototyped** | Solidity `LiveCryptoRouter.sol` with 2% fee split and 98% instant payout; Solana transfer instructions; SUI transfer protocols. |
| **OBS Integration** | **Zero-Friction Browser Source** | WebSockets connection to `/overlay/[obs_token]` with Web Speech API TTS, animated glassmorphism alert cards, dynamic donation goals, and audio playback. |
| **Design System** | **Upgraded** | Solid black `#000000` base, frosted glassmorphism, transparent glass buttons, punchy typography (Outfit + Space Grotesk), rich media showcases from `imgs/` assets, and live CoinGecko crypto quotation feeds. |

---

## 2. OBS Integration: How It Works Under the Hood

### Does the Streamer Need to Install a Plugin?
**No plugin installation is required for 99% of streaming use cases.**

Live Crypto utilizes the universal **OBS Browser Source** standard (identical to how Streamlabs, StreamElements, and LivePix operate):

```
+------------------+         +-----------------------+         +---------------------+
|   Donor Browser  |         |   Live Crypto Backend |         |     OBS Studio      |
|  (Web3 Checkout) |         |   (Express + Redis WS)|         |   (Browser Source)  |
+--------+---------+         +-----------+-----------+         +----------+----------+
         |                               |                                |
         | 1. Sign Tx / Send Crypto      |                                |
         +------------------------------>|                                |
         |                               | 2. Detect Tx On-Chain / Webhook|
         |                               |    & Publish to Redis Channel  |
         |                               +------------------------------->|
         |                               |                                | 3. Receive WebSocket
         |                               |                                |    Event in < 400ms
         |                               |                                | 4. Play Audio Alert
         |                               |                                | 5. Render Animated Glass Card
         |                               |                                | 6. Synthesize TTS Voice
```

### Step-by-Step Flow:
1. **Streamer Setup (10 seconds)**:
   - Streamer logs in to `Live Crypto` with their Web3 wallet (MetaMask, Phantom, Rabby, etc.).
   - Dashboard generates a persistent, cryptographically secure URL:
     `https://app.livecrypto.io/overlay/obs_tok_9f8a7c6b5e...`
   - In OBS Studio, the streamer clicks **"+" (Add Source) -> "Browser"**, pastes the URL, and sets dimensions to `1920x1080` (or `800x600`).
   - Checks **"Shutdown source when not visible"** = unchecked, **"Refresh browser when scene becomes active"** = checked.

2. **Donor Interaction**:
   - Viewer scans on-stream QR code or visits `https://app.livecrypto.io/pay/streamer_username`.
   - Selects token (SOL, SUI, POL, ETH, USDT, USDC, BTC Lightning).
   - Types their name, donation amount, and live message.
   - Approves transaction via Web3 wallet (1-Click) or scans QR code using Binance/Phantom/TrustWallet mobile app.

3. **Sub-Second Real-Time Notification**:
   - Backend RPC / Indexer verifies the payment.
   - Event is published to Redis channel `streamer:<id>:events`.
   - The OBS Browser Source receives the event over WebSocket in `< 400ms`:
     ```json
     {
       "event": "DONATION",
       "amount": 25.0,
       "currency": "SOL",
       "fiatValue": 4750.00,
       "sender": "cryptoking.sol",
       "message": "Epic gameplay! Here is some SOL for your new GPU 🚀",
       "audio_url": "https://...",
       "tts": true
     }
     ```
   - The overlay triggers a smooth CSS entry animation, plays a custom sound chime, displays the donor's avatar and message, and invokes the browser `window.speechSynthesis` engine to read the message aloud on stream.

### Advanced Option: OBS WebSocket Plugin (Optional)
If a streamer wants the donation alert to **physically change scenes in OBS**, activate a strobe filter, or toggle studio lights, Live Crypto can connect to the local OBS WebSocket Server (`ws://localhost:4455`). However, for 99% of streamers, the **Browser Source** is the gold standard because it requires zero local setup.

---

## 3. Technology Stack Evaluation: Next.js vs Astro

### Why Next.js (App Router) is Superior for this Web3 SaaS:
| Feature | Next.js (React 19) | Astro | Verdict |
|---|---|---|---|
| **Web3 Wallet Adapters** | Native hooks (`wagmi`, `@reown/appkit`, `@solana/wallet-adapter-react`) built specifically for continuous React state. | Requires wrapping every Web3 button in React Island (`client:only="react"`). | **Next.js wins** |
| **Real-time WebSockets & OBS Overlay** | Persistent React state machines for live alert queuing, audio playback, and TTS synthesis. | Islands can manage this, but offers no memory advantage for full-screen single-page overlays. | **Next.js wins** |
| **Dynamic Streamer Dashboards** | Rich dashboard UI with live forms, drag-and-drop themes, analytics charts, and instantaneous optimistic updates. | Astro is designed for content-driven sites; dashboards in Astro end up being 100% React anyway. | **Next.js wins** |
| **Marketing Landing Page** | Excellent performance with Server Components and static asset prefetching. | Slightly smaller JS bundle for purely static text pages. | **Astro slight edge for blogs/docs only** |

**Senior Dev Verdict**: For a Web3 SaaS containing live wallet signing, multi-chain modals, real-time WebSocket overlays, and an authenticated creator dashboard, **Next.js with React 19** is the industry standard. If we build a high-traffic SEO documentation/blog in the future, we can easily deploy an Astro site under `/docs` or `blog.livecrypto.io`.

---

## 4. Multi-Chain Non-Custodial Architecture

Live Crypto operates on a **100% Non-Custodial** principle:
- Streamers keep their own private keys.
- Donations route directly to streamer payout addresses.
- Optional platform monetization:
  1. **0% Free Tier with Voluntary Donor Tip** (High adoption).
  2. **Smart Contract Fee Split** (e.g. 1-2% atomic on-chain split on EVM/Solana contracts).
  3. **Pro Streamer Subscription** ($9.99/mo for 0% fees, 4K animated overlays, AI voice TTS).

### Supported Payment Rails:
1. **Solana (SOL, USDC-SPL)**: Ultra-fast (<400ms confirmation), negligible gas fee ($0.00025).
2. **SUI Protocol (SUI, USDC-SUI)**: Instant finality, Slush & Sui Wallet support.
3. **Polygon & Base & Arbitrum (POL, ETH, USDT, USDC)**: Low-gas EVM L2s.
4. **Ethereum Mainnet (ETH, USDT, DAI)**: High-value whale donations.
5. **Bitcoin Lightning Network (BTC LN-URL)**: Micro-payments and sovereign Bitcoiners.

---

## 5. UI/UX Design System: Modern Cyberpunk & Frosted Glass

1. **Color Palette**:
   - Canvas: Solid Deep Black (`#000000` / `#050505`).
   - Surfaces: Transparent Frosted Glass (`rgba(15, 23, 42, 0.65)` + `backdrop-blur-xl`).
   - Accents: Electric Cyan (`#06b6d4`), Neon Purple (`#a855f7`), Emerald Glow (`#10b981`).
2. **Buttons & Controls**:
   - Transparent glass buttons with reflective borders and tactile hover transformations.
3. **Typography**:
   - Headings: `Outfit` (punchy, modern, tech-cartoon feel).
   - Monospace / Numbers / Badges: `Space Grotesk`.
4. **Media Showcase**:
   - High-definition video banner (`animation.mp4` / `consegue_fazer_um_video_de_um.mp4`).
   - Visual concept showcases from `imgs/` folder.
   - CoinGecko live price feed ticker.

---

## 6. Production Deployment & Scalability Checklist

- [x] Universal English Internationalization (i18n ready for IP-based geo-detection).
- [x] Unified Web3 AppKit Modal + Direct Wallet Connectors.
- [x] Live CoinGecko Quotations API Integration.
- [x] Deep Solid Black `#000000` aesthetic with frosted glass buttons.
- [x] Zero-Friction OBS Overlay Engine (Browser Source + WebSockets + Web Speech TTS).
- [x] In-Memory Fallback Engine for instantaneous offline/local development.
- [ ] Production PostgreSQL & Redis cluster on Railway/AWS/Supabase.
- [ ] On-Chain Blockchain Indexer (Helius for Solana, Alchemy/QuickNode for EVM, SUI RPC).
- [ ] ElevenLabs AI Voice synthesis integration for premium TTS voices.
