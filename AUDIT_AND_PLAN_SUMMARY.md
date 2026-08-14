# 📋 Resumo da Auditoria e Plano de Ação

Este documento consolida as descobertas da auditoria detalhada realizada no sistema **Live Crypto Gateway** e descreve os próximos passos necessários para a conclusão do projeto.

---

## 🔍 1. O Que Foi Identificado (Auditoria)

### 🔒 Segurança & Vulnerabilidades Críticas
1. **Bypass no Webhook Manual (`POST /api/webhooks/manual`)**:
   * **Problema**: O endpoint está público e aceita qualquer payload. Ele marca a transação diretamente como `CONFIRMED` e dispara o alerta no OBS sem nenhuma verificação real na blockchain. Qualquer pessoa pode simular doações falsas no stream.
   * **Solução**: Implementar verificação on-chain no backend usando RPCs.
2. **Validação de Assinatura HMAC Quebrada**:
   * **Problema**: A verificação usa `JSON.stringify(req.body)` para reconstruir o payload original. Mudanças de espaçamento/ordenação de chaves feitas pelo parser do Express fazem com que a assinatura HMAC calculada divirja da enviada por Alchemy/Helius.
   * **Solução**: Configurar o middleware para armazenar o buffer bruto do body (`req.rawBody`) e validar a assinatura diretamente nele.
3. **Armazenamento de JWT inseguro**:
   * **Problema**: Armazenado em `localStorage` no frontend, suscetível a ataques XSS.
   * **Solução**: Migrar futuramente para cookies com flag `HttpOnly`.

### 🏗️ Arquitetura & Código
1. **Bug do WebSocket no Redis (Vazamento de Inscrição)**:
   * **Problema**: Cada nova conexão assina individualmente o canal do Redis. Se o streamer abrir o OBS em duas abas e fechar uma delas, o backend chama `unsubscribe()`, desligando os alertas para *todas* as conexões ativas desse streamer.
   * **Solução**: Criar um gerenciador de conexões WebSocket com controle de referência (`Set` por streamer).
2. **Contrato Solidity Incompleto**:
   * **Problema**: O frontend espera uma função `donateERC20` no contrato EVM, mas ela não existe no arquivo [LiveCryptoRouter.sol](file:///a:/Dropbox/DEV-AI/Projectios/live-crypto/live-crypto-gateway/contracts/LiveCryptoRouter.sol). Além disso, a assinatura do evento `DonationRouted` está diferente entre o Solidity e a ABI do frontend.
   * **Solução**: Implementar a lógica de divisão de tokens ERC-20 (taxa da plataforma + valor do streamer) e alinhar os eventos.
3. **Serviço de Polling Falso**:
   * **Problema**: O script `polling.js` apenas checa a tabela no banco, mas não consulta os blocos reais da blockchain para atualizar transações `PENDING` para `CONFIRMED`.
   * **Solução**: Conectar com providers via `ethers` e `@solana/web3.js` para atualizar o status real de confirmação.

### 🎨 Visual & Design
1. **Paleta de Cores Desalinhada (Login & Dashboard)**:
   * **Problema**: A landing page tem um estilo moderno com gradientes e tons escuros, mas as páginas de login e painel forçam um visual preto com texto verde Matrix extremamente simples e cansativo de usar.
   * **Solução**: Atualizar o design do app administrativo para um visual escuro premium (Zinc-950 escovado com transparências glassmorphism e ciano neon), mantendo o tema Matrix opcional apenas no overlay do OBS.
2. **Uploader IPFS Básico**:
   * **Problema**: Inputs HTML puros e feios para arquivos.
   * **Solução**: Implementar área interativa de drag-and-drop.
3. **Falta de Gráficos (Analytics)**:
   * **Problema**: O painel só exibe uma tabela de transações crua.
   * **Solução**: Integrar gráficos interativos do Recharts para receitas e tokens.

---

## 🛠️ 2. Plano de Ação (Próximos Passos)

1. **Correção de Assinaturas e APIs**: Ajustar o parsing raw-body do backend e o HMAC.
2. **Verificação Real de Transações**: Criar as rotinas de leitura de transações on-chain (Polygon e Solana Devnet) para proteger o webhook manual.
3. **Contrato Inteligente EVM**: Atualizar e adicionar o suporte a ERC-20 no contrato Solidity `LiveCryptoRouter.sol`.
4. **WebSocket Manager**: Refatorar o arquivo `ws/index.js` para corrigir o bug de desconexão.
5. **Polimento UI/UX**:
   * Atualizar `globals.css` e os layouts das páginas de login e dashboard para usarem o tema escuro premium unificado.
   * Criar a área drag-and-drop para o uploader de arquivos IPFS.
   * Desenhar os gráficos de analytics.

---

## ❓ 3. Perguntas em Aberto

* **Provedores RPC**: Utilizaremos por padrão provedores públicos e gratuitos (Polygon Amoy, Solana Devnet) para validar as transações on-chain. Deseja que a gente insira chaves dedicadas no arquivo `.env`?
* **Fluxo Solana**: A transação Solana atual na página do doador é direta (carteira a carteira). Quer que a gente mantenha assim (mais simples e sem taxas no contrato) ou que faça a integração com o programa Anchor (fee-split em Rust) que você já começou?
* **Aprovação**: Podemos prosseguir com as alterações conforme detalhado?
