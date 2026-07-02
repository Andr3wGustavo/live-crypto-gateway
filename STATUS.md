# 📍 Status do Projeto — Onde Paramos

> Última atualização: 02/07/2026, 01:28 (BRT)

---

## ✅ Sprints Concluídos

### Sprint 1 — Backend API & Schema Inicial
| Item | Status |
|------|--------|
| `docker-compose.yml` (PostgreSQL 15 + Redis 7) | ✅ Feito |
| `db/init.sql` (DDL com Streamers, Wallets, Alert_Configs, Transactions) | ✅ Feito |
| Backend Node.js + Express inicializado | ✅ Feito |
| PostgreSQL connection pool (`src/db/index.js`) | ✅ Feito |
| Redis Pub/Sub clients (`src/redis/index.js`) | ✅ Feito |
| WebSocket server para OBS (`src/ws/index.js`) | ✅ Feito |
| Rotas de Auth mockadas (`src/routes/auth.js`) | ✅ Feito (depois atualizado para SIWE) |
| Rotas de Dashboard (`src/routes/dashboard.js`) | ✅ Feito |
| Rotas de Webhooks (`src/routes/webhooks.js`) | ✅ Feito (depois atualizado com HMAC) |
| Smart Contract `LiveCryptoRouter.sol` | ✅ Feito |
| Frontend Next.js inicializado | ✅ Feito |
| Dashboard UI (Green on Black) | ✅ Feito |
| OBS Overlay UI | ✅ Feito (depois atualizado com CRT FX) |
| Payment dApp UI | ✅ Feito (depois atualizado com Dual Mode) |

---

### Sprint 2 — Web3 Auth & Universal Gateway
| Item | Status |
|------|--------|
| Schema atualizado: `username` → `public_address` | ✅ Feito |
| Backend SIWE: `GET /api/auth/nonce` (Redis-backed, 5min TTL) | ✅ Feito |
| Backend SIWE: `POST /api/auth/verify` (verifica assinatura + JWT) | ✅ Feito |
| Wagmi v2 + Web3Modal configurados (`Web3Provider.tsx`) | ✅ Feito |
| `layout.tsx` wrapeado com `<Web3Provider>` | ✅ Feito |
| Login Page (`/login`) com fluxo SIWE completo | ✅ Feito |
| dApp Dual Mode A — Web3 Native (Wagmi `useSendTransaction`) | ✅ Feito |
| dApp Dual Mode B — CEX/Manual (QR Code + copy-to-clipboard + long-poll) | ✅ Feito |

---

### Sprint 3 — Security, Smart Contracts & Premium UI
| Item | Status |
|------|--------|
| `express-rate-limit` instalado e configurado (3 tiers) | ✅ Feito |
| HMAC webhook validation (`crypto.timingSafeEqual`) | ✅ Feito |
| Fallback Polling Service (`services/polling.js`, cron 2min) | ✅ Feito |
| Token Rotation endpoint (`POST /rotate-token`) | ✅ Feito |
| Hardhat 3 inicializado e configurado (ESM) | ✅ Feito |
| `LiveCryptoRouter.sol` compilado com sucesso (solc 0.8.19) | ✅ Feito |
| ABI exportada para `frontend/src/abi/LiveCryptoRouter.json` | ✅ Feito |
| CSS: CRT Scanlines, Text Flicker, Matrix Decode, Numeral Pulse | ✅ Feito |
| OBS Overlay: Matrix decode em nomes de doadores | ✅ Feito |
| OBS Overlay: Web Speech API (TTS) para doações | ✅ Feito |
| Goal Overlay: Numerais pulsantes SEM texto descritivo | ✅ Feito |

---

## ❌ O Que NÃO Foi Implementado Ainda

### Alta Prioridade
| Item | Detalhes |
|------|----------|
| **Migrar para Reown AppKit** | `@web3modal/wagmi` está deprecated. Precisa migrar. |
| **Solana Wallet Adapter** | `@solana/wallet-adapter` não foi instalado nem integrado. |
| **Deploy do Smart Contract** | Contrato compila mas não foi deployado em nenhuma rede. |
| **Webhook real (Alchemy/Helius)** | HMAC valida mas o parsing do payload é mockado. |
| **Confirmação de blocos** | Transações são marcadas CONFIRMED sem verificar on-chain. |
| **Upload de mídia (S3/IPFS)** | `media_url` e `audio_url` existem na tabela mas sem upload. |

### Média Prioridade
| Item | Detalhes |
|------|----------|
| **Paginação de transações** | Retorna só as últimas 50 sem filtros. |
| **Múltiplos temas de overlay** | Só existe o Green-on-Black. |
| **Notificações Telegram/Discord** | Não implementado. |

### Baixa Prioridade
| Item | Detalhes |
|------|----------|
| **ERC-20 / SPL token support** | Contrato só aceita moeda nativa. |
| **Analytics Dashboard** | Sem gráficos. |
| **Testes automatizados** | Zero testes (Jest, Hardhat, Cypress). |
| **CI/CD pipeline** | Sem GitHub Actions. |

---

## 🗂️ Estrutura Atual de Arquivos

```
live-crypto/
├── backend/
│   ├── .env
│   ├── package.json
│   └── src/
│       ├── server.js              ← Entry point com rate limiting
│       ├── db/index.js            ← Pool PostgreSQL
│       ├── redis/index.js         ← Pub/Sub Redis
│       ├── ws/index.js            ← WebSocket server
│       ├── routes/
│       │   ├── auth.js            ← SIWE (nonce + verify)
│       │   ├── dashboard.js       ← CRUD + rotate-token
│       │   └── webhooks.js        ← HMAC validated
│       └── services/
│           └── polling.js         ← Cron fallback
│
├── frontend/
│   ├── package.json
│   └── src/
│       ├── abi/
│       │   └── LiveCryptoRouter.json  ← ABI compilada
│       ├── components/
│       │   └── Web3Provider.tsx       ← Wagmi + Web3Modal
│       └── app/
│           ├── globals.css            ← CRT FX + Terminal theme
│           ├── layout.tsx             ← Root layout com Web3Provider
│           ├── login/page.tsx         ← SIWE login
│           ├── dashboard/page.tsx     ← Streamer dashboard
│           ├── pay/[streamer_id]/page.tsx     ← Dual-Mode dApp
│           └── overlay/[obs_token]/page.tsx   ← OBS overlay + TTS
│
├── contracts/
│   ├── hardhat.config.js
│   ├── package.json
│   ├── src/
│   │   └── LiveCryptoRouter.sol
│   └── artifacts/                 ← Hardhat compiled output
│
├── db/
│   └── init.sql                   ← DDL schema
│
├── docker-compose.yml
├── README.md
└── SUGGESTIONS.md
```

---

## 🎯 Próximo Passo Recomendado

O item mais impactante para avançar agora seria:

1. **Deploy do Smart Contract** em uma testnet (Polygon Amoy ou Base Sepolia)
2. **Conectar o dApp ao contrato real** usando o Wagmi `useWriteContract` com a ABI já exportada
3. **Registrar webhook no Alchemy** para o endereço do contrato deployado

Isso fecharia o ciclo completo: **Donor → dApp → Smart Contract → Webhook → Backend → Redis → WebSocket → OBS Overlay**.

---

> 📝 Este documento foi gerado automaticamente para facilitar o handoff do projeto.
