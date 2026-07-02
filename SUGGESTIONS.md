# 💡 Sugestões de Melhorias — Live Crypto

Este documento contém sugestões técnicas e de produto para levar o Live Crypto ao próximo nível.

---

## 🔥 Alta Prioridade (Production-Critical)

### 1. Migrar Web3Modal para Reown AppKit
O `@web3modal/wagmi` está **deprecated** — a biblioteca foi renomeada para **Reown AppKit**. A migração é simples mas necessária antes do deploy em produção.
- Docs: https://docs.reown.com/appkit/upgrade/from-w3m-to-reown
- **Impacto**: Sem essa migração, não receberemos atualizações de segurança.

### 2. Implementar Solana Wallet Adapter
O Sprint Backlog menciona suporte a Solana, mas ainda não foi implementado. Devemos:
- Instalar `@solana/wallet-adapter-react` e `@solana/web3.js`
- Criar instruções SPL Token com fee-splitting atômico (múltiplos destinos na mesma tx)
- Adicionar uma terceira aba "Solana" no dApp de pagamento

### 3. Integração Real com Alchemy/Helius Webhooks
Os webhooks estão validando HMAC mas o payload ainda é mockado. Precisamos:
- Registrar um webhook real no Alchemy Dashboard monitorando o endereço do Router Contract
- Parsear os logs do evento `DonationRouted` para extrair `sender`, `streamer`, `amount` e `fee`
- Implementar confirmação de blocos (aguardar N confirmações antes de marcar como CONFIRMED)

### 4. Deploy do Smart Contract em Testnet
O `LiveCryptoRouter.sol` compila mas ainda não foi deployado. Próximos passos:
- Criar um script de deploy Hardhat (`scripts/deploy.js`)
- Deployar em Polygon Amoy (testnet) ou Base Sepolia
- Salvar o endereço do contrato deployado em uma variável de ambiente
- Atualizar o frontend para usar `useWriteContract` do Wagmi apontando para o contrato real

---

## 🎯 Média Prioridade (Product Enhancement)

### 5. Upload de Mídia (S3/IPFS) para Alertas
O `Alert_Configs` tem campos `media_url` e `audio_url` mas não há sistema de upload.
- **Opção A**: AWS S3 com pre-signed URLs (mais simples, centralizado)
- **Opção B**: IPFS via Pinata/nft.storage (descentralizado, mais alinhado com Web3)
- Criar um endpoint `POST /api/dashboard/upload` que retorna a URL do arquivo

### 6. Histórico de Doações com Filtros e Exportação
A rota `/api/dashboard/transactions` retorna as últimas 50 transações sem filtros.
- Adicionar paginação (cursor-based)
- Filtrar por `currency`, `date range`, `min_amount`
- Exportar CSV para contabilidade

### 7. Múltiplos Temas de Overlay
Atualmente temos apenas o tema "Green on Black". Podemos oferecer:
- **Cyberpunk** (neon roxo/rosa)
- **Minimal White** (clean, sem CRT)
- **Fire** (gradiente laranja/vermelho)
- O streamer escolhe o tema no Dashboard e o overlay aplica dinamicamente

### 8. Notificações Push via Telegram/Discord Bot
Além do WebSocket para OBS, enviar notificações de doação para:
- Telegram Bot (usando a API do Telegram)
- Discord Webhook (POST simples)
- Configurável no Dashboard

---

## 🧪 Baixa Prioridade (Nice-to-Have)

### 9. Analytics Dashboard
Gráficos de doações por dia/semana/mês, top doadores, moedas mais usadas.
- Usar Chart.js ou Recharts
- Calcular métricas no backend com queries agregadas

### 10. Sistema de Referral / Afiliados
Streamers convidam outros streamers e ganham uma % das fees por um período.
- Nova tabela `Referrals` (referrer_id, referred_id, commission_rate, expires_at)
- Lógica no smart contract ou off-chain

### 11. Suporte a ERC-20 / SPL Tokens
Atualmente o contrato só aceita moeda nativa (ETH/MATIC). Para aceitar USDT, USDC, etc:
- Implementar `donateERC20(address token, address streamer, uint256 amount)` no contrato
- Usar `transferFrom` com aprovação prévia do donor
- Exibir seletor de token no dApp

### 12. Testes Automatizados
- **Backend**: Jest + Supertest para rotas de API
- **Smart Contracts**: Hardhat test suite com Chai
- **Frontend**: Cypress ou Playwright para e2e
- **CI/CD**: GitHub Actions rodando testes em cada PR

### 13. Sistema de Goals Configurável
Permitir que streamers criem metas de doação personalizadas:
- Meta diária, semanal, ou por campanha
- Barra de progresso no overlay (já temos o CSS `bar-glow`)
- Endpoint `POST /api/dashboard/goal` para CRUD de metas

---

## 🏗️ Sugestões de Infraestrutura

### 14. Kubernetes / Docker Swarm
Para produção, separar o backend, WebSocket server, e polling service em containers independentes com auto-scaling.

### 15. CDN para Overlay Assets
Servir os arquivos de mídia (GIFs, áudios) via CloudFront ou Cloudflare R2 para minimizar latência no OBS.

### 16. Monitoramento (Grafana + Prometheus)
Dashboards de métricas: latência de API, conexões WebSocket ativas, taxa de transações confirmadas, erros de webhook.

---

> 💬 **Nota**: Estas sugestões estão ordenadas por impacto no produto. As de alta prioridade são bloqueadores para um lançamento seguro em produção. As demais agregam valor mas podem ser implementadas incrementalmente.
