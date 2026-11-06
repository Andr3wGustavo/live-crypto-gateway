import type { Locale } from './locale';

/**
 * Documentation content lives beside the UI catalogs so every locale shares the
 * same structure. The `Record<Locale, DocsContent>` annotation is the parity
 * check: adding a section or block to one language fails type-checking until the
 * other two languages catch up.
 */
export type DocsBlock =
  | { kind: 'body'; text: string }
  | { kind: 'list'; items: string[] }
  | { kind: 'steps'; items: { title: string; text: string }[] }
  | { kind: 'flow'; items: { label: string; title: string; text: string }[] }
  | { kind: 'table'; head: string[]; rows: string[][] }
  | { kind: 'code'; label: string; lines: string[] }
  | { kind: 'note'; tone: 'info' | 'warn' | 'pending'; title: string; text: string }
  | { kind: 'media'; aspect: 'video' | 'image'; label: string; title: string; text: string };

export type DocsSection = {
  id: string;
  nav: string;
  eyebrow: string;
  title: string;
  blocks: DocsBlock[];
};

export type DocsGroup = { label: string; sections: string[] };

export type DocsContent = {
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  title: string;
  intro: string;
  updated: string;
  badge: string;
  back: string;
  onThisPage: string;
  flowLabel: string;
  sidebarLabel: string;
  articleLabel: string;
  groups: DocsGroup[];
  sections: DocsSection[];
  footer: { title: string; text: string; cta: string; note: string };
};

const en: DocsContent = {
  metaTitle: 'Docs — LiveCrypto',
  metaDescription: 'How LiveCrypto works: multi-chain wallets, Creator Studio, OBS Browser Source, payments, security and local setup.',
  eyebrow: 'LIVECRYPTO / DOCS',
  title: 'From wallet signature to the alert on screen.',
  intro: 'A practical guide to the product, the wallets it accepts, the Creator Studio, OBS and the payment path. Written for creators and operators, with the current limits stated plainly.',
  updated: 'Updated 5 November 2026',
  badge: 'DEVELOPMENT PREVIEW',
  back: 'Back to site',
  onThisPage: 'On this page',
  flowLabel: 'Donation stages',
  sidebarLabel: 'Documentation',
  articleLabel: 'Documentation content',
  groups: [
    { label: 'Start here', sections: ['overview'] },
    { label: 'The product', sections: ['wallets', 'donations', 'studio', 'obs', 'alerts'] },
    { label: 'Money and trust', sections: ['payments', 'qr', 'security'] },
    { label: 'Run it yourself', sections: ['local', 'status'] },
  ],
  sections: [
    {
      id: 'overview', nav: 'Overview', eyebrow: 'START HERE', title: 'What LiveCrypto is, and what it is not.',
      blocks: [
        { kind: 'body', text: 'LiveCrypto is a donation layer for live creators. A viewer opens your public checkout, reviews the network, amount, fee and destination, and signs a transaction in their own wallet. The money moves from the viewer to the wallet you registered. LiveCrypto does not hold a balance for you to withdraw.' },
        { kind: 'body', text: 'The backend creates a payment intent before the wallet prompt, verifies the on-chain result against that intent, records the donation and queues an alert. The alert reaches OBS through a Browser Source. Every step is designed to be visible rather than magical.' },
        { kind: 'steps', items: [
          { title: 'Sign in with a wallet', text: 'An EVM, Solana or Sui wallet signs a human-readable message. Signing in proves account control; it does not move funds.' },
          { title: 'Register a destination', text: 'Save the address that should receive donations on that exact network. Sign-in and payout are separate on purpose.' },
          { title: 'Share the checkout link', text: 'The public link opens the donation page. Keep the overlay link private: it authorizes access to your alerts.' },
          { title: 'Connect OBS', text: 'Add a Browser Source, paste the private overlay URL and send a test alert before going live.' },
        ] },
        { kind: 'note', tone: 'warn', title: 'Preview, not production', text: 'This repository is a development preview. Payments start disabled, Sui checkout is gated, and no mainnet or audited deployment is claimed. Treat every amount in the interface as a test value unless an operator has explicitly enabled a validated rail.' },
        { kind: 'media', aspect: 'video', label: 'OWNER VIDEO SLOT', title: 'Two-minute product tour', text: 'Reserved for an owner-recorded walkthrough: landing, wallet sign-in, destination, checkout and OBS alert. Replace this block with the final embed; simulated footage must never be presented as a live transaction.' },
        { kind: 'media', aspect: 'image', label: 'SCREENSHOT SLOT', title: 'Creator Studio overview', text: 'Reserved for a real, current screenshot of the studio using a clearly labelled test profile.' },
      ],
    },
    {
      id: 'wallets', nav: 'Wallets and chains', eyebrow: 'IDENTITY', title: 'Three wallet families, one account model.',
      blocks: [
        { kind: 'body', text: 'A creator account can be opened with an EVM, Solana or Sui wallet. The interface discovers wallets in the browser and asks only for a signature. There is no password, email confirmation or seed phrase.' },
        { kind: 'table', head: ['Family', 'Detected today', 'Sign-in', 'Payout address'], rows: [
          ['EVM', 'MetaMask, Rabby and other injected wallets announced through EIP-6963', 'EIP-4361 (SIWE) message bound to EVM_CHAIN_ID', '0x followed by 40 hexadecimal characters'],
          ['Solana', 'Phantom, Solflare and Backpack, detected independently', 'Signed challenge with a single-use nonce', 'Base58 public key'],
          ['Sui', 'Slush, Sui Wallet and other Wallet Standard wallets', 'Sui personal-message signature (ed25519 or secp256k1)', '0x followed by 64 lowercase hexadecimal characters'],
        ] },
        { kind: 'list', items: [
          'A sign-in signature proves control of the account. It does not authorize a transfer.',
          'The backend derives the Sui address from the public key and verifies the personal-message digest; the frontend sends the wallet’s exact signed text.',
          'EVM sign-in is rejected when the wallet is on a different chain from EVM_CHAIN_ID, which closes a cross-chain replay gap.',
          'Sign-in and payout are independent: you may authenticate with one wallet and receive on another.',
        ] },
        { kind: 'note', tone: 'warn', title: 'Extension validation is still manual', text: 'All three protocol paths are covered by automated tests and a simulated Wallet Standard browser journey. Real MetaMask, Slush, Solflare and Backpack installations still need an operator-run matrix before launch. Detection logic is not proof that every extension version will work.' },
      ],
    },
    {
      id: 'donations', nav: 'Donation flow', eyebrow: 'THE CORE FLOW', title: 'A donation from click to alert.',
      blocks: [
        { kind: 'body', text: 'A donation is not a single wallet signature. It is an intent, a transaction, a verification and an alert. Each stage has an owner and a visible state, so neither the donor nor the creator has to guess what happened.' },
        { kind: 'flow', items: [
          { label: '01 / AMOUNT', title: 'The donor chooses an amount', text: 'The checkout shows the network, asset, creator destination, platform fee and network fee. Nothing is signed at this stage.' },
          { label: '02 / INTENT', title: 'The backend creates an intent', text: 'The intent snapshots creator, chain, destination, sender, amount, fee, memo and monitoring cursor. It expires; an old intent cannot settle a new payment.' },
          { label: '03 / SIGNATURE', title: 'The wallet authorizes the transfer', text: 'The donor reviews the prompt. Signing in proves identity; this separate signature is the only action that can move funds.' },
          { label: '04 / BROADCAST', title: 'The transaction reaches the chain', text: 'The wallet submits it. A browser-provided hash speeds reconciliation but is never accepted as proof by itself.' },
          { label: '05 / VERIFICATION', title: 'The backend reconciles', text: 'The verifier checks the exact event or finalized transfer, destination, amount, memo and confirmations against the stored intent.' },
          { label: '06 / ALERT', title: 'Ledger and OBS update', text: 'A confirmed donation is written to the ledger and the outbox in one transaction. The overlay plays it and sends an ACK.' },
        ] },
        { kind: 'table', head: ['Checkout state', 'What it means', 'What resolves it'], rows: [
          ['Pending', 'A transaction was submitted but is not confirmed', 'Required confirmations or a verifier timeout'],
          ['Confirmed', 'Every intent field matched the on-chain result', 'The ledger entry and the OBS alert'],
          ['Expired', 'The intent window closed before settlement', 'A new checkout and a new intent'],
          ['Rejected', 'Amount, destination, memo or chain did not match', 'No ledger entry and no alert'],
        ] },
        { kind: 'note', tone: 'warn', title: 'A test donation is still a transaction', text: 'Even on a testnet, review the network and destination. A confirmed testnet transfer cannot be undone by LiveCrypto. Payments stay disabled unless an operator enabled the configured rail.' },
      ],
    },
    {
      id: 'studio', nav: 'Creator Studio', eyebrow: 'THE WORKSPACE', title: 'Your profile, destinations and alert controls.',
      blocks: [
        { kind: 'body', text: 'Creator Studio is the signed-in workspace. It is not a wallet and it does not hold funds. It stores your profile, receiving destinations, alert settings and the token used by OBS.' },
        { kind: 'steps', items: [
          { title: 'Sign in', text: 'Choose a wallet, connect and sign the message. Connecting alone does not open a session.' },
          { title: 'Save a destination', text: 'Pick the network and enter the receiving address. Reserved router, treasury, zero and system addresses are rejected.' },
          { title: 'Configure the alert', text: 'Choose theme, position, sound, optional media and voice. Settings are scoped to your profile.' },
          { title: 'Copy the private overlay URL', text: 'Use it only inside OBS. The public checkout link is the one you share with your community.' },
        ] },
        { kind: 'table', head: ['Link', 'Where it appears', 'Who can use it'], rows: [
          ['Public checkout', '/pay/{creator} on your site, bio or chat', 'Anyone you share it with'],
          ['Private overlay', '/overlay/{token}, copied from Creator Studio', 'Only your OBS Browser Source; keep it secret'],
        ] },
        { kind: 'note', tone: 'info', title: 'Status is honest by design', text: 'The studio reports configuration and API state. A saved setting is not a delivered alert; a pending transaction is not a donation. The real proof is an on-chain confirmation followed by an OBS acknowledgement.' },
      ],
    },
    {
      id: 'obs', nav: 'OBS setup', eyebrow: 'ON SCREEN', title: 'One Browser Source. No plugin.',
      blocks: [
        { kind: 'body', text: 'OBS Studio renders LiveCrypto as a normal web page inside a Browser Source. OBS keeps the page open, the WebSocket connection delivers one alert at a time, and the overlay acknowledges each alert after playing it.' },
        { kind: 'steps', items: [
          { title: 'Create a Browser Source', text: 'In your scene, open Sources, click + and choose Browser.' },
          { title: 'Paste the private URL', text: 'Copy the overlay link from Creator Studio. Do not use the public checkout link here.' },
          { title: 'Match the canvas', text: 'Use 1920 × 1080, or the exact resolution of your stream canvas, so the overlay is not cropped.' },
          { title: 'Send a test alert', text: 'Trigger the test in Creator Studio and watch the scene. A queued command alone does not prove display.' },
        ] },
        { kind: 'code', label: 'BROWSER SOURCE / REFERENCE VALUES', lines: [
          'URL      https://your-domain/{locale}/overlay/{private-token}',
          'Width    1920',
          'Height   1080',
          'FPS      30',
          'Audio    Control audio via OBS (optional)',
        ] },
        { kind: 'note', tone: 'info', title: 'The overlay URL is a credential', text: 'Anyone with the link can receive your alerts. Do not put it in a public bio, screenshot or support ticket. Rotate the token immediately if it leaks.' },
      ],
    },
    {
      id: 'alerts', nav: 'Alerts', eyebrow: 'DELIVERY', title: 'Queued, delivered, acknowledged.',
      blocks: [
        { kind: 'body', text: 'A verified donation is written to the financial ledger and to an outbox in the same database transaction. Redis publishes a wake-up signal; it does not replace the durable queue. If OBS disconnects, alerts remain queued and replay when the source reconnects.' },
        { kind: 'table', head: ['State', 'What it means', 'What proves it'], rows: [
          ['Queued', 'The donation is recorded and the alert is waiting', 'A row in the outbox'],
          ['Delivered', 'The OBS source received the alert', 'The WebSocket send completed'],
          ['Acknowledged', 'The overlay finished playing it', 'An ACK from the overlay'],
        ] },
        { kind: 'list', items: [
          'Alerts are delivered one at a time; a second alert waits instead of overlapping the first.',
          'Sound, media and voice are configured per profile in Creator Studio.',
          'After OBS starts, keep the source visible long enough for the overlay to load and connect.',
          'A missing alert is diagnosed from the outbox state, not from assumptions about the scene.',
        ] },
        { kind: 'note', tone: 'info', title: 'Publishing is not displaying', text: 'A successful Redis publish only wakes the socket layer. Only the ACK moves an alert to acknowledged, which is why the studio does not pretend an alert appeared.' },
      ],
    },
    {
      id: 'payments', nav: 'Payments', eyebrow: 'MONEY PATH', title: 'Non-custodial by design, gated by evidence.',
      blocks: [
        { kind: 'body', text: 'LiveCrypto is non-custodial. The checkout creates a payment intent that snapshots the creator, chain, destination, sender, amount, fee, memo and monitoring cursor. A transaction settles only when every field matches.' },
        { kind: 'table', head: ['Rail', 'Current state', 'Gate'], rows: [
          ['EVM', 'Testnet code path; router and treasury must be configured', 'DONATIONS_ENABLED=true, deployed router, confirmed DonationRouted event'],
          ['Solana', 'Devnet code path; finalized native split transfer', 'DONATIONS_ENABLED=true, treasury and cluster genesis hash match'],
          ['Sui identity', 'Sign-in and payout registration available', 'SUI_NETWORK configured; no Move router required'],
          ['Sui checkout', 'Explicitly unavailable in the interface', 'Deployed and reconciled Move package on testnet'],
        ] },
        { kind: 'list', items: [
          'The proposed platform fee is 2% (PLATFORM_FEE_BPS=200), displayed separately from the network fee.',
          'The creator portion goes to the registered destination; the fee goes to the configured treasury.',
          'The donor’s wallet shows the network fee before signing. LiveCrypto cannot refund an on-chain transfer.',
          'The browser only receives public RPC endpoints; URLs that contain provider keys stay on the server.',
        ] },
        { kind: 'note', tone: 'pending', title: 'Sui checkout is intentionally blocked', text: 'The backend advertises the Sui rail only when DONATIONS_ENABLED, a valid SUI_TREASURY_ADDRESS and a valid SUI_PACKAGE_ID are present. Even then, the checkout marks Sui unavailable and refuses to submit until the Move router is validated on testnet. This is a safety gate, not a missing button.' },
      ],
    },
    {
      id: 'qr', nav: 'QR and mobile', eyebrow: 'MOBILE ENTRY', title: 'QR codes will open the checkout, not a wallet.',
      blocks: [
        { kind: 'body', text: 'Typing an address on a phone is error-prone. The planned mobile entry is a QR code that encodes the public checkout URL for the creator. Opening it loads the same checkout as the shared link, with network, amount, fee and destination visible before anything is signed.' },
        { kind: 'body', text: 'A QR containing only a raw wallet address would skip the payment intent, the fee disclosure and the alert attribution. LiveCrypto does not use a bare-address QR for donations; the checkout remains the source of truth.' },
        { kind: 'list', items: [
          'Creator side: Creator Studio will expose a share/download action for the QR of the public checkout (planned).',
          'Donor side: the phone camera opens the checkout; a wallet-capable browser or wallet app signs the prompted transaction.',
          'Server side: the same intent and verifier run; the QR adds no trust and no shortcut.',
          'Amount or memo parameters are only accepted after the checkout validates them server-side.',
        ] },
        { kind: 'code', label: 'PLANNED QR PAYLOAD / CHECKOUT URL ONLY', lines: [
          'https://your-domain/{locale}/pay/{creator}',
          '',
          'Never encode: private keys, seed phrases, overlay tokens,',
          'or a bare address that skips amount, fee and destination review.',
        ] },
        { kind: 'note', tone: 'pending', title: 'No QR pairing in this build', text: 'The current checkout is a web page and mobile requires a wallet-capable browser. Dynamic QR generation, scan-to-pay pairing and CEX deep links are not implemented. Do not advertise them until the generator, validation and a real device test are complete.' },
      ],
    },
    {
      id: 'security', nav: 'Security', eyebrow: 'TRUST', title: 'What we protect, and what you must verify.',
      blocks: [
        { kind: 'body', text: 'Security starts by keeping secrets out of the browser. Sessions are HttpOnly, SameSite=Strict cookies rather than tokens in localStorage. Nonces are single-use, auth and payment routes are rate limited, and private RPC URLs never leave the server.' },
        { kind: 'list', items: [
          'Sign in only on the domain you expect, and read the origin in the wallet prompt.',
          'Never enter a seed phrase or private key. LiveCrypto never asks for either.',
          'Review the payout destination on the exact network before saving it.',
          'Treat the overlay token as a password and rotate it after sharing a screenshot.',
        ] },
        { kind: 'list', items: [
          'As a donor, read the network, destination, amount and fee before signing.',
          'Confirm whether you are on the intended testnet or mainnet; chain IDs are not interchangeable.',
          'Blockchain transfers are generally irreversible. There is no platform balance to reverse.',
        ] },
        { kind: 'note', tone: 'warn', title: 'No independent audit yet', text: 'The repository has automated tests, a backend review and a dependency audit, but no third-party security audit or mainnet penetration test. Do not describe this deployment as audited or production-ready.' },
      ],
    },
    {
      id: 'local', nav: 'Local setup', eyebrow: 'RUN IT', title: 'Two Node processes, four local services.',
      blocks: [
        { kind: 'body', text: 'The repository runs an Express API and a Next.js web app. PostgreSQL and Redis are optional in preview mode and required for persistent accounts, sessions and the durable alert queue. Node.js 24 and npm are the only mandatory prerequisites.' },
        { kind: 'code', label: 'POWERSHELL / FROM THE REPOSITORY ROOT', lines: [
          '.\\start-dev.bat          # preview: temporary data, payments off',
          '.\\start-dev.bat --full   # Docker PostgreSQL + Redis, persistent data',
          '.\\start-dev.bat --check  # localized pages, API and assets, then stop',
        ] },
        { kind: 'table', head: ['Service', 'Default URL', 'Notes'], rows: [
          ['Web app', 'http://localhost:3000', 'Next.js; 17 static pages in the production build'],
          ['API', 'http://localhost:8080', 'Express; health, auth and payment endpoints'],
          ['PostgreSQL', 'localhost:5432', 'Persistent mode only'],
          ['Redis', 'localhost:6379', 'Sessions and alert wake-ups'],
        ] },
        { kind: 'code', label: 'VERIFY BEFORE YOU TRUST A BUILD', lines: [
          'cd backend ; npm test',
          'cd frontend ; npm run test:i18n ; npm run lint:product ; npm run build',
          'cd contracts ; npm test',
        ] },
        { kind: 'note', tone: 'info', title: 'Memory and cold starts', text: 'Cold builds on Windows need roughly 2 GB of free RAM; the launcher refuses to start below its safety floor. The first page can take several minutes right after a reboot. A Next.js “Ready” line alone does not mean the page compiled.' },
      ],
    },
    {
      id: 'status', nav: 'Current status', eyebrow: 'EVIDENCE', title: 'What is proven, and what is still pending.',
      blocks: [
        { kind: 'body', text: 'The honest status on 5 November 2026: the protocol paths are implemented and tested, the production build passes, and the browser journey has been exercised with simulated wallets. Real wallets, a real OBS scene, a real testnet donation, TLS, backups and an independent audit are still pending.' },
        { kind: 'table', head: ['Area', 'State', 'Evidence'], rows: [
          ['Sui identity', 'Verified in code and tests', 'ed25519 and secp256k1 signatures, digest, address derivation and tamper rejection'],
          ['Multi-wallet UI', 'Implemented; simulated browser journey', 'Wallet Standard test wallet over CDP; the Solana picker lists three brands'],
          ['EVM / Solana checkout', 'Testnet code paths; real funds not exercised', 'Backend verifier tests and RPC fixtures'],
          ['Sui checkout', 'Blocked by design', 'No validated Move router, package ID or reconciliation'],
          ['OBS end-to-end', 'Pending', 'No real OBS scene has been run in this environment'],
          ['Production deployment', 'Not validated here', 'Compose stack defined; no VPS or TLS run recorded'],
          ['Security audit', 'Pending', 'Automated tests and internal review only'],
        ] },
        { kind: 'note', tone: 'pending', title: 'What to say in public', text: 'Say “development preview”, name the exact testnet, and state that payments are disabled unless an operator enabled a validated rail. Do not claim mainnet support, instant settlement, audited contracts or production readiness without evidence.' },
        { kind: 'media', aspect: 'video', label: 'OWNER VIDEO SLOT', title: 'Validation walkthrough', text: 'Reserved for a recorded end-to-end run: testnet checkout, confirmation, ledger entry and OBS acknowledgement. The recording should show the network and the testnet badge at all times.' },
      ],
    },
  ],
  footer: {
    title: 'Ready to connect OBS?',
    text: 'Sign in with the wallet you use for the destination, copy the private overlay URL and run a test alert before your next stream.',
    cta: 'Open Creator Studio',
    note: 'Development preview · payments disabled by default · no mainnet claim',
  },
};

const ptBR: DocsContent = {
  metaTitle: 'Documentação — LiveCrypto',
  metaDescription: 'Como o LiveCrypto funciona: carteiras multichain, Creator Studio, OBS Browser Source, pagamentos, segurança e ambiente local.',
  eyebrow: 'LIVECRYPTO / DOCS',
  title: 'Da assinatura na carteira ao alerta na tela.',
  intro: 'Um guia prático do produto, das carteiras aceitas, do Creator Studio, do OBS e do caminho do pagamento. Escrito para criadores e operadores, com os limites atuais declarados sem rodeios.',
  updated: 'Atualizado em 5 de novembro de 2026',
  badge: 'PRÉVIA DE DESENVOLVIMENTO',
  back: 'Voltar ao site',
  onThisPage: 'Nesta página',
  flowLabel: 'Etapas da doação',
  sidebarLabel: 'Documentação',
  articleLabel: 'Conteúdo da documentação',
  groups: [
    { label: 'Comece aqui', sections: ['overview'] },
    { label: 'O produto', sections: ['wallets', 'donations', 'studio', 'obs', 'alerts'] },
    { label: 'Dinheiro e confiança', sections: ['payments', 'qr', 'security'] },
    { label: 'Rode você mesmo', sections: ['local', 'status'] },
  ],
  sections: [
    {
      id: 'overview', nav: 'Visão geral', eyebrow: 'COMECE AQUI', title: 'O que o LiveCrypto é — e o que ele não é.',
      blocks: [
        { kind: 'body', text: 'O LiveCrypto é uma camada de doações para criadores ao vivo. O espectador abre seu checkout público, confere a rede, o valor, a taxa e o destino, e assina uma transação na própria carteira. O dinheiro vai do espectador para a carteira que você cadastrou. O LiveCrypto não mantém saldo para você sacar.' },
        { kind: 'body', text: 'O backend cria uma intenção de pagamento antes do pedido de assinatura, verifica o resultado on-chain contra essa intenção, registra a doação e enfileira um alerta. O alerta chega ao OBS por um Browser Source. Cada etapa foi desenhada para ser visível, não mágica.' },
        { kind: 'steps', items: [
          { title: 'Entre com uma carteira', text: 'Uma carteira EVM, Solana ou Sui assina uma mensagem legível. Entrar prova o controle da conta; não move fundos.' },
          { title: 'Cadastre um destino', text: 'Salve o endereço que deve receber doações naquela rede exata. Login e recebimento são separados de propósito.' },
          { title: 'Compartilhe o checkout', text: 'O link público abre a página de doação. Mantenha o link de overlay privado: ele autoriza o acesso aos seus alertas.' },
          { title: 'Conecte o OBS', text: 'Adicione um Browser Source, cole a URL privada do overlay e envie um alerta de teste antes de entrar ao vivo.' },
        ] },
        { kind: 'note', tone: 'warn', title: 'Prévia, não produção', text: 'Este repositório é uma prévia de desenvolvimento. Os pagamentos começam desativados, o checkout Sui tem bloqueio e não há alegação de mainnet ou de implantação auditada. Trate qualquer valor na interface como teste, a menos que um operador tenha habilitado uma via validada.' },
        { kind: 'media', aspect: 'video', label: 'ESPAÇO PARA VÍDEO DO DONO', title: 'Tour de dois minutos pelo produto', text: 'Reservado para um walkthrough gravado pelo dono: landing, login, destino, checkout e alerta no OBS. Substitua este bloco pelo embed final; gravações simuladas nunca devem ser apresentadas como transação real.' },
        { kind: 'media', aspect: 'image', label: 'ESPAÇO PARA CAPTURA', title: 'Visão geral do Creator Studio', text: 'Reservado para uma captura real e atual do estúdio usando um perfil de teste claramente identificado.' },
      ],
    },
    {
      id: 'wallets', nav: 'Carteiras e redes', eyebrow: 'IDENTIDADE', title: 'Três famílias de carteira, um modelo de conta.',
      blocks: [
        { kind: 'body', text: 'Uma conta de criador pode ser aberta com carteira EVM, Solana ou Sui. A interface descobre as carteiras no navegador e pede apenas uma assinatura. Não há senha, confirmação por e-mail nem frase-semente.' },
        { kind: 'table', head: ['Família', 'Detectado hoje', 'Login', 'Endereço de recebimento'], rows: [
          ['EVM', 'MetaMask, Rabby e outras carteiras injetadas anunciadas via EIP-6963', 'Mensagem EIP-4361 (SIWE) vinculada ao EVM_CHAIN_ID', '0x seguido de 40 caracteres hexadecimais'],
          ['Solana', 'Phantom, Solflare e Backpack, detectadas de forma independente', 'Desafio assinado com nonce de uso único', 'Chave pública Base58'],
          ['Sui', 'Slush, Sui Wallet e outras carteiras Wallet Standard', 'Assinatura de mensagem pessoal Sui (ed25519 ou secp256k1)', '0x seguido de 64 caracteres hexadecimais minúsculos'],
        ] },
        { kind: 'list', items: [
          'A assinatura de login prova o controle da conta. Ela não autoriza uma transferência.',
          'O backend deriva o endereço Sui da chave pública e verifica o digest da mensagem pessoal; o frontend envia o texto assinado exato da carteira.',
          'O login EVM é rejeitado quando a carteira está em uma rede diferente do EVM_CHAIN_ID, fechando uma brecha de replay entre redes.',
          'Login e recebimento são independentes: você pode autenticar com uma carteira e receber em outra.',
        ] },
        { kind: 'note', tone: 'warn', title: 'A validação com extensões reais ainda é manual', text: 'Os três caminhos de protocolo têm testes automatizados e uma jornada de navegador com carteira Wallet Standard simulada. MetaMask, Slush, Solflare e Backpack reais ainda precisam de uma matriz executada por um operador antes do lançamento. Lógica de detecção não prova que toda versão de extensão funcionará.' },
      ],
    },
    {
      id: 'donations', nav: 'Fluxo da doação', eyebrow: 'O FLUXO PRINCIPAL', title: 'Uma doação do clique ao alerta.',
      blocks: [
        { kind: 'body', text: 'Uma doação não é uma única assinatura na carteira. É uma intenção, uma transação, uma verificação e um alerta. Cada etapa tem um responsável e um estado visível, para que nem o doador nem o criador precisem adivinhar o que aconteceu.' },
        { kind: 'flow', items: [
          { label: '01 / VALOR', title: 'O doador escolhe o valor', text: 'O checkout mostra a rede, o ativo, o destino do criador, a taxa da plataforma e a taxa de rede. Nada é assinado nesta etapa.' },
          { label: '02 / INTENÇÃO', title: 'O backend cria a intenção', text: 'A intenção fotografa criador, rede, destino, remetente, valor, taxa, memo e cursor de monitoramento. Ela expira; uma intenção antiga não liquida um pagamento novo.' },
          { label: '03 / ASSINATURA', title: 'A carteira autoriza a transferência', text: 'O doador revisa o pedido. Entrar prova identidade; esta assinatura separada é a única ação que pode mover fundos.' },
          { label: '04 / TRANSMISSÃO', title: 'A transação chega à rede', text: 'A carteira envia a transação. O hash informado pelo navegador acelera a reconciliação, mas nunca é aceito como prova por si só.' },
          { label: '05 / VERIFICAÇÃO', title: 'O backend reconcilia', text: 'O verificador confere o evento exato ou a transferência finalizada, destino, valor, memo e confirmações contra a intenção armazenada.' },
          { label: '06 / ALERTA', title: 'Livro e OBS atualizam', text: 'Uma doação confirmada é gravada no livro e na outbox na mesma transação. O overlay exibe o alerta e envia um ACK.' },
        ] },
        { kind: 'table', head: ['Estado do checkout', 'O que significa', 'O que resolve'], rows: [
          ['Pendente', 'A transação foi enviada, mas não confirmou', 'As confirmações exigidas ou o timeout do verificador'],
          ['Confirmado', 'Todos os campos da intenção coincidiram com o resultado on-chain', 'O lançamento no livro e o alerta no OBS'],
          ['Expirado', 'A janela da intenção fechou antes da liquidação', 'Um novo checkout e uma nova intenção'],
          ['Rejeitado', 'Valor, destino, memo ou rede não coincidiram', 'Nenhum lançamento e nenhum alerta'],
        ] },
        { kind: 'note', tone: 'warn', title: 'Uma doação de teste ainda é uma transação', text: 'Mesmo em testnet, confira a rede e o destino. Uma transferência de teste confirmada não pode ser desfeita pelo LiveCrypto. Os pagamentos continuam desativados a menos que um operador habilite a via configurada.' },
      ],
    },
    {
      id: 'studio', nav: 'Creator Studio', eyebrow: 'O ESPAÇO DE TRABALHO', title: 'Seu perfil, destinos e controles de alerta.',
      blocks: [
        { kind: 'body', text: 'O Creator Studio é o espaço autenticado. Ele não é uma carteira e não guarda fundos. Ele armazena seu perfil, destinos de recebimento, preferências de alerta e o token usado pelo OBS.' },
        { kind: 'steps', items: [
          { title: 'Entre', text: 'Escolha uma carteira, conecte e assine a mensagem. Apenas conectar não abre uma sessão.' },
          { title: 'Salve um destino', text: 'Escolha a rede e informe o endereço de recebimento. Endereços reservados de router, tesouraria, zero e sistema são rejeitados.' },
          { title: 'Configure o alerta', text: 'Escolha tema, posição, som, mídia opcional e voz. As configurações pertencem ao seu perfil.' },
          { title: 'Copie a URL privada do overlay', text: 'Use-a somente dentro do OBS. O link público de checkout é o que você compartilha com a comunidade.' },
        ] },
        { kind: 'table', head: ['Link', 'Onde aparece', 'Quem pode usar'], rows: [
          ['Checkout público', '/pay/{creator} no seu site, bio ou chat', 'Qualquer pessoa com quem você compartilhar'],
          ['Overlay privado', '/overlay/{token}, copiado do Creator Studio', 'Somente seu Browser Source no OBS; mantenha em segredo'],
        ] },
        { kind: 'note', tone: 'info', title: 'O status é honesto por princípio', text: 'O estúdio informa configuração e estado da API. Uma preferência salva não é um alerta entregue; uma transação pendente não é uma doação. A prova real é a confirmação on-chain seguida do ACK do OBS.' },
      ],
    },
    {
      id: 'obs', nav: 'Configurar OBS', eyebrow: 'NA TELA', title: 'Um Browser Source. Nenhum plugin.',
      blocks: [
        { kind: 'body', text: 'O OBS Studio renderiza o LiveCrypto como uma página web normal dentro de um Browser Source. O OBS mantém a página aberta, a conexão WebSocket entrega um alerta por vez e o overlay confirma cada alerta depois de exibi-lo.' },
        { kind: 'steps', items: [
          { title: 'Crie um Browser Source', text: 'Na sua cena, abra Fontes, clique em + e escolha Navegador.' },
          { title: 'Cole a URL privada', text: 'Copie o link do overlay no Creator Studio. Não use o link público de checkout aqui.' },
          { title: 'Combine com a tela', text: 'Use 1920 × 1080, ou a resolução exata da sua tela de transmissão, para o overlay não ser cortado.' },
          { title: 'Envie um alerta de teste', text: 'Dispare o teste no Creator Studio e observe a cena. Um comando enfileirado não prova que ele apareceu.' },
        ] },
        { kind: 'code', label: 'BROWSER SOURCE / VALORES DE REFERÊNCIA', lines: [
          'URL      https://seu-dominio/{locale}/overlay/{token-privado}',
          'Largura  1920',
          'Altura   1080',
          'FPS      30',
          'Áudio    Controlar áudio pelo OBS (opcional)',
        ] },
        { kind: 'note', tone: 'info', title: 'A URL do overlay é uma credencial', text: 'Qualquer pessoa com o link pode receber seus alertas. Não coloque a URL em bio pública, captura de tela ou ticket de suporte. Gere um novo token imediatamente se ela vazar.' },
      ],
    },
    {
      id: 'alerts', nav: 'Alertas', eyebrow: 'ENTREGA', title: 'Enfileirado, entregue, confirmado.',
      blocks: [
        { kind: 'body', text: 'Uma doação verificada é gravada no livro financeiro e em uma outbox na mesma transação de banco. O Redis publica um sinal de despertar; ele não substitui a fila durável. Se o OBS desconectar, os alertas continuam enfileirados e são reproduzidos quando a fonte reconectar.' },
        { kind: 'table', head: ['Estado', 'O que significa', 'O que prova'], rows: [
          ['Na fila', 'A doação foi registrada e o alerta está esperando', 'Uma linha na outbox'],
          ['Entregue', 'A fonte OBS recebeu o alerta', 'O envio WebSocket foi concluído'],
          ['Confirmado', 'O overlay terminou de exibir o alerta', 'Um ACK enviado pelo overlay'],
        ] },
        { kind: 'list', items: [
          'Os alertas são entregues um por vez; o segundo espera em vez de sobrepor o primeiro.',
          'Som, mídia e voz são configurados por perfil no Creator Studio.',
          'Depois de abrir o OBS, mantenha a fonte visível o suficiente para o overlay carregar e conectar.',
          'Um alerta ausente é diagnosticado pelo estado da outbox, não por suposições sobre a cena.',
        ] },
        { kind: 'note', tone: 'info', title: 'Publicar não é exibir', text: 'Uma publicação bem-sucedida no Redis apenas acorda a camada de sockets. Somente o ACK move um alerta para confirmado — por isso o estúdio não finge que o alerta apareceu.' },
      ],
    },
    {
      id: 'payments', nav: 'Pagamentos', eyebrow: 'CAMINHO DO DINHEIRO', title: 'Não custodial por princípio, bloqueado por evidência.',
      blocks: [
        { kind: 'body', text: 'O LiveCrypto é não custodial. O checkout cria uma intenção de pagamento que fotografa criador, rede, destino, remetente, valor, taxa, memo e cursor de monitoramento. Uma transação só liquida quando todos os campos conferem.' },
        { kind: 'table', head: ['Via', 'Estado atual', 'Condição'], rows: [
          ['EVM', 'Caminho de código em testnet; router e tesouraria precisam estar configurados', 'DONATIONS_ENABLED=true, router implantado, evento DonationRouted confirmado'],
          ['Solana', 'Caminho de código em Devnet; transferência nativa dividida e finalizada', 'DONATIONS_ENABLED=true, tesouraria e genesis hash da cluster coincidem'],
          ['Identidade Sui', 'Login e cadastro de recebimento disponíveis', 'SUI_NETWORK configurado; nenhum router Move necessário'],
          ['Checkout Sui', 'Indisponível de forma explícita na interface', 'Pacote Move implantado e reconciliado em testnet'],
        ] },
        { kind: 'list', items: [
          'A taxa proposta da plataforma é 2% (PLATFORM_FEE_BPS=200), exibida separadamente da taxa de rede.',
          'A parte do criador vai para o destino cadastrado; a taxa vai para a tesouraria configurada.',
          'A carteira do doador mostra a taxa de rede antes da assinatura. O LiveCrypto não pode reembolsar uma transferência on-chain.',
          'O navegador recebe apenas endpoints RPC públicos; URLs com chaves de provedor ficam no servidor.',
        ] },
        { kind: 'note', tone: 'pending', title: 'O checkout Sui está bloqueado de propósito', text: 'O backend anuncia a via Sui somente quando DONATIONS_ENABLED, um SUI_TREASURY_ADDRESS válido e um SUI_PACKAGE_ID válido estão presentes. Mesmo assim, o checkout marca Sui como indisponível e recusa o envio até o router Move ser validado em testnet. É uma trava de segurança, não um botão faltando.' },
      ],
    },
    {
      id: 'qr', nav: 'QR e mobile', eyebrow: 'ENTRADA MÓVEL', title: 'O QR code abrirá o checkout, não uma carteira.',
      blocks: [
        { kind: 'body', text: 'Digitar um endereço no celular é propenso a erro. A entrada móvel planejada é um QR code que codifica a URL pública do checkout do criador. Ao abrir, ele carrega o mesmo checkout do link compartilhado, com rede, valor, taxa e destino visíveis antes de qualquer assinatura.' },
        { kind: 'body', text: 'Um QR contendo apenas um endereço de carteira pularia a intenção de pagamento, a divulgação da taxa e a atribuição do alerta. O LiveCrypto não usa QR de endereço puro para doações; o checkout continua sendo a fonte da verdade.' },
        { kind: 'list', items: [
          'Lado do criador: o Creator Studio terá uma ação de compartilhar/baixar o QR do checkout público (planejado).',
          'Lado do doador: a câmera do celular abre o checkout; um navegador com carteira ou o app da carteira assina a transação exibida.',
          'Lado do servidor: a mesma intenção e o mesmo verificador rodam; o QR não adiciona confiança nem atalho.',
          'Parâmetros de valor ou memo só serão aceitos depois que o checkout os validar no servidor.',
        ] },
        { kind: 'code', label: 'PAYLOAD PLANEJADO DO QR / SOMENTE URL DO CHECKOUT', lines: [
          'https://seu-dominio/{locale}/pay/{creator}',
          '',
          'Nunca codifique: chaves privadas, frases-semente, tokens de overlay',
          'ou um endereço puro que pule a revisão de valor, taxa e destino.',
        ] },
        { kind: 'note', tone: 'pending', title: 'Não há pareamento por QR neste build', text: 'O checkout atual é uma página web e o celular precisa de um navegador compatível com carteira. Geração dinâmica de QR, pareamento por leitura e deep links de CEX não estão implementados. Não divulgue esses recursos até o gerador, a validação e um teste em dispositivo real estarem concluídos.' },
      ],
    },
    {
      id: 'security', nav: 'Segurança', eyebrow: 'CONFIANÇA', title: 'O que protegemos e o que você precisa verificar.',
      blocks: [
        { kind: 'body', text: 'Segurança começa mantendo segredos fora do navegador. As sessões são cookies HttpOnly com SameSite=Strict, não tokens em localStorage. Nonces são de uso único, rotas de autenticação e pagamento têm limite de requisições, e URLs RPC privadas nunca saem do servidor.' },
        { kind: 'list', items: [
          'Entre apenas no domínio que você espera e leia a origem no pedido da carteira.',
          'Nunca informe frase-semente ou chave privada. O LiveCrypto nunca pede nenhuma das duas.',
          'Confira o destino de recebimento na rede exata antes de salvar.',
          'Trate o token do overlay como senha e gere outro depois de compartilhar uma captura.',
        ] },
        { kind: 'list', items: [
          'Como doador, leia rede, destino, valor e taxa antes de assinar.',
          'Confirme se está na testnet ou mainnet pretendida; chain IDs não são intercambiáveis.',
          'Transferências blockchain são geralmente irreversíveis. Não existe saldo da plataforma para reverter.',
        ] },
        { kind: 'note', tone: 'warn', title: 'Ainda não há auditoria independente', text: 'O repositório tem testes automatizados, uma revisão de backend e uma auditoria de dependências, mas não tem auditoria de segurança de terceiros nem teste de intrusão em mainnet. Não descreva esta implantação como auditada ou pronta para produção.' },
      ],
    },
    {
      id: 'local', nav: 'Ambiente local', eyebrow: 'RODE VOCÊ MESMO', title: 'Dois processos Node, quatro serviços locais.',
      blocks: [
        { kind: 'body', text: 'O repositório executa uma API Express e um app Next.js. PostgreSQL e Redis são opcionais no modo de prévia e obrigatórios para contas persistentes, sessões e a fila durável de alertas. Node.js 24 e npm são os únicos pré-requisitos obrigatórios.' },
        { kind: 'code', label: 'POWERSHELL / A PARTIR DA RAIZ DO REPOSITÓRIO', lines: [
          '.\\start-dev.bat          # prévia: dados temporários, pagamentos desligados',
          '.\\start-dev.bat --full   # PostgreSQL + Redis no Docker, dados persistentes',
          '.\\start-dev.bat --check  # páginas localizadas, API e assets, depois encerra',
        ] },
        { kind: 'table', head: ['Serviço', 'URL padrão', 'Observações'], rows: [
          ['Web app', 'http://localhost:3000', 'Next.js; 17 páginas estáticas no build de produção'],
          ['API', 'http://localhost:8080', 'Express; endpoints de saúde, autenticação e pagamento'],
          ['PostgreSQL', 'localhost:5432', 'Somente no modo persistente'],
          ['Redis', 'localhost:6379', 'Sessões e sinais de alerta'],
        ] },
        { kind: 'code', label: 'VERIFIQUE ANTES DE CONFIAR NO BUILD', lines: [
          'cd backend ; npm test',
          'cd frontend ; npm run test:i18n ; npm run lint:product ; npm run build',
          'cd contracts ; npm test',
        ] },
        { kind: 'note', tone: 'info', title: 'Memória e partidas frias', text: 'Builds frios no Windows precisam de cerca de 2 GB de RAM livre; o launcher se recusa a iniciar abaixo do piso de segurança. A primeira página pode levar vários minutos logo após reiniciar. Uma linha “Ready” do Next.js não significa que a página compilou.' },
      ],
    },
    {
      id: 'status', nav: 'Estado atual', eyebrow: 'EVIDÊNCIA', title: 'O que está provado e o que ainda está pendente.',
      blocks: [
        { kind: 'body', text: 'O estado honesto em 5 de novembro de 2026: os caminhos de protocolo estão implementados e testados, o build de produção passa e a jornada de navegador foi exercitada com carteiras simuladas. Carteiras reais, uma cena real de OBS, uma doação real em testnet, TLS, backups e auditoria independente ainda estão pendentes.' },
        { kind: 'table', head: ['Área', 'Estado', 'Evidência'], rows: [
          ['Identidade Sui', 'Verificada em código e testes', 'Assinaturas ed25519 e secp256k1, digest, derivação de endereço e rejeição de adulteração'],
          ['UI multi-carteira', 'Implementada; jornada de navegador simulada', 'Carteira de teste Wallet Standard via CDP; seletor Solana lista três marcas'],
          ['Checkout EVM / Solana', 'Caminhos de testnet; fundos reais não exercitados', 'Testes do verificador e fixtures de RPC'],
          ['Checkout Sui', 'Bloqueado por princípio', 'Sem router Move validado, package ID ou reconciliação'],
          ['OBS ponta a ponta', 'Pendente', 'Nenhuma cena real de OBS foi executada neste ambiente'],
          ['Implantação de produção', 'Não validada aqui', 'Stack Compose definida; nenhuma execução em VPS ou TLS registrada'],
          ['Auditoria de segurança', 'Pendente', 'Somente testes automatizados e revisão interna'],
        ] },
        { kind: 'note', tone: 'pending', title: 'O que dizer em público', text: 'Diga “prévia de desenvolvimento”, nomeie a testnet exata e afirme que os pagamentos estão desativados a menos que um operador tenha habilitado uma via validada. Não alegue suporte a mainnet, liquidação instantânea, contratos auditados ou prontidão de produção sem evidência.' },
        { kind: 'media', aspect: 'video', label: 'ESPAÇO PARA VÍDEO DO DONO', title: 'Walkthrough de validação', text: 'Reservado para uma execução ponta a ponta gravada: checkout em testnet, confirmação, lançamento no livro e ACK no OBS. A gravação deve mostrar a rede e o selo de testnet o tempo todo.' },
      ],
    },
  ],
  footer: {
    title: 'Pronto para conectar o OBS?',
    text: 'Entre com a carteira que você usa para o destino, copie a URL privada do overlay e rode um alerta de teste antes da próxima live.',
    cta: 'Abrir Creator Studio',
    note: 'Prévia de desenvolvimento · pagamentos desativados por padrão · sem alegação de mainnet',
  },
};

const es: DocsContent = {
  metaTitle: 'Documentación — LiveCrypto',
  metaDescription: 'Cómo funciona LiveCrypto: carteras multicadena, Creator Studio, OBS Browser Source, pagos, seguridad y entorno local.',
  eyebrow: 'LIVECRYPTO / DOCS',
  title: 'De la firma en la cartera a la alerta en pantalla.',
  intro: 'Una guía práctica del producto, las carteras aceptadas, el Creator Studio, OBS y el camino del pago. Escrita para creadores y operadores, con los límites actuales declarados sin rodeos.',
  updated: 'Actualizado el 5 de noviembre de 2026',
  badge: 'VISTA PREVIA DE DESARROLLO',
  back: 'Volver al sitio',
  onThisPage: 'En esta página',
  flowLabel: 'Etapas de la donación',
  sidebarLabel: 'Documentación',
  articleLabel: 'Contenido de la documentación',
  groups: [
    { label: 'Empieza aquí', sections: ['overview'] },
    { label: 'El producto', sections: ['wallets', 'donations', 'studio', 'obs', 'alerts'] },
    { label: 'Dinero y confianza', sections: ['payments', 'qr', 'security'] },
    { label: 'Ejecútalo tú mismo', sections: ['local', 'status'] },
  ],
  sections: [
    {
      id: 'overview', nav: 'Visión general', eyebrow: 'EMPIEZA AQUÍ', title: 'Qué es LiveCrypto y qué no es.',
      blocks: [
        { kind: 'body', text: 'LiveCrypto es una capa de donaciones para creadores en vivo. El espectador abre tu checkout público, revisa la red, el importe, la comisión y el destino, y firma una transacción en su propia cartera. El dinero va del espectador a la cartera que registraste. LiveCrypto no guarda un saldo para que lo retires.' },
        { kind: 'body', text: 'El backend crea una intención de pago antes de la firma, verifica el resultado on-chain contra esa intención, registra la donación y encola una alerta. La alerta llega a OBS mediante un Browser Source. Cada paso está diseñado para ser visible, no mágico.' },
        { kind: 'steps', items: [
          { title: 'Inicia sesión con una cartera', text: 'Una cartera EVM, Solana o Sui firma un mensaje legible. Iniciar sesión demuestra el control de la cuenta; no mueve fondos.' },
          { title: 'Registra un destino', text: 'Guarda la dirección que debe recibir donaciones en esa red exacta. El inicio de sesión y el cobro son independientes a propósito.' },
          { title: 'Comparte el checkout', text: 'El enlace público abre la página de donación. Mantén privado el enlace del overlay: autoriza el acceso a tus alertas.' },
          { title: 'Conecta OBS', text: 'Añade un Browser Source, pega la URL privada del overlay y envía una alerta de prueba antes de emitir.' },
        ] },
        { kind: 'note', tone: 'warn', title: 'Vista previa, no producción', text: 'Este repositorio es una vista previa de desarrollo. Los pagos empiezan desactivados, el checkout Sui está bloqueado y no se afirma mainnet ni una implantación auditada. Trata cualquier importe de la interfaz como prueba, salvo que un operador haya habilitado una vía validada.' },
        { kind: 'media', aspect: 'video', label: 'ESPACIO PARA VÍDEO DEL DUEÑO', title: 'Tour de dos minutos por el producto', text: 'Reservado para un recorrido grabado por el dueño: landing, inicio de sesión, destino, checkout y alerta en OBS. Sustituye este bloque por el vídeo final; una grabación simulada nunca debe presentarse como transacción real.' },
        { kind: 'media', aspect: 'image', label: 'ESPACIO PARA CAPTURA', title: 'Vista general del Creator Studio', text: 'Reservado para una captura real y actual del estudio con un perfil de prueba claramente identificado.' },
      ],
    },
    {
      id: 'wallets', nav: 'Carteras y redes', eyebrow: 'IDENTIDAD', title: 'Tres familias de cartera, un modelo de cuenta.',
      blocks: [
        { kind: 'body', text: 'Una cuenta de creador puede abrirse con una cartera EVM, Solana o Sui. La interfaz descubre las carteras en el navegador y solo pide una firma. No hay contraseña, confirmación por correo ni frase semilla.' },
        { kind: 'table', head: ['Familia', 'Detectado hoy', 'Inicio de sesión', 'Dirección de cobro'], rows: [
          ['EVM', 'MetaMask, Rabby y otras carteras inyectadas anunciadas por EIP-6963', 'Mensaje EIP-4361 (SIWE) vinculado a EVM_CHAIN_ID', '0x seguido de 40 caracteres hexadecimales'],
          ['Solana', 'Phantom, Solflare y Backpack, detectadas de forma independiente', 'Desafío firmado con nonce de un solo uso', 'Clave pública Base58'],
          ['Sui', 'Slush, Sui Wallet y otras carteras Wallet Standard', 'Firma de mensaje personal Sui (ed25519 o secp256k1)', '0x seguido de 64 caracteres hexadecimales en minúscula'],
        ] },
        { kind: 'list', items: [
          'La firma de inicio de sesión demuestra el control de la cuenta. No autoriza una transferencia.',
          'El backend deriva la dirección Sui de la clave pública y verifica el digest del mensaje personal; el frontend envía el texto firmado exacto de la cartera.',
          'El inicio de sesión EVM se rechaza cuando la cartera está en una red distinta de EVM_CHAIN_ID, cerrando una brecha de replay entre redes.',
          'Inicio de sesión y cobro son independientes: puedes autenticarte con una cartera y recibir en otra.',
        ] },
        { kind: 'note', tone: 'warn', title: 'La validación con extensiones reales sigue siendo manual', text: 'Las tres rutas de protocolo están cubiertas por pruebas automatizadas y un recorrido de navegador con una cartera Wallet Standard simulada. MetaMask, Slush, Solflare y Backpack reales aún necesitan una matriz ejecutada por un operador antes del lanzamiento. La lógica de detección no prueba que funcione toda versión de extensión.' },
      ],
    },
    {
      id: 'donations', nav: 'Flujo de donación', eyebrow: 'EL FLUJO PRINCIPAL', title: 'Una donación del clic a la alerta.',
      blocks: [
        { kind: 'body', text: 'Una donación no es una sola firma en la cartera. Es una intención, una transacción, una verificación y una alerta. Cada etapa tiene un responsable y un estado visible, para que ni el donante ni el creador tengan que adivinar qué ocurrió.' },
        { kind: 'flow', items: [
          { label: '01 / IMPORTE', title: 'El donante elige el importe', text: 'El checkout muestra la red, el activo, el destino del creador, la comisión de la plataforma y la comisión de red. Nada se firma en esta etapa.' },
          { label: '02 / INTENCIÓN', title: 'El backend crea la intención', text: 'La intención fotografía creador, red, destino, remitente, importe, comisión, memo y cursor de monitorización. Caduca; una intención antigua no liquida un pago nuevo.' },
          { label: '03 / FIRMA', title: 'La cartera autoriza la transferencia', text: 'El donante revisa el aviso. Iniciar sesión demuestra identidad; esta firma separada es la única acción que puede mover fondos.' },
          { label: '04 / TRANSMISIÓN', title: 'La transacción llega a la red', text: 'La cartera la envía. El hash que aporta el navegador acelera la reconciliación, pero nunca se acepta como prueba por sí solo.' },
          { label: '05 / VERIFICACIÓN', title: 'El backend reconcilia', text: 'El verificador comprueba el evento exacto o la transferencia finalizada, destino, importe, memo y confirmaciones contra la intención guardada.' },
          { label: '06 / ALERTA', title: 'Libro y OBS se actualizan', text: 'Una donación confirmada se escribe en el libro y en la outbox en la misma transacción. El overlay la muestra y envía un ACK.' },
        ] },
        { kind: 'table', head: ['Estado del checkout', 'Qué significa', 'Qué lo resuelve'], rows: [
          ['Pendiente', 'La transacción se envió, pero no está confirmada', 'Las confirmaciones exigidas o el timeout del verificador'],
          ['Confirmado', 'Todos los campos de la intención coincidieron con el resultado on-chain', 'El registro en el libro y la alerta en OBS'],
          ['Caducado', 'La ventana de la intención cerró antes de liquidar', 'Un checkout nuevo y una intención nueva'],
          ['Rechazado', 'Importe, destino, memo o red no coincidieron', 'Ningún registro y ninguna alerta'],
        ] },
        { kind: 'note', tone: 'warn', title: 'Una donación de prueba sigue siendo una transacción', text: 'Incluso en testnet, revisa la red y el destino. Una transferencia de prueba confirmada no puede deshacerse desde LiveCrypto. Los pagos siguen desactivados salvo que un operador habilite la vía configurada.' },
      ],
    },
    {
      id: 'studio', nav: 'Creator Studio', eyebrow: 'EL ESPACIO DE TRABAJO', title: 'Tu perfil, destinos y controles de alerta.',
      blocks: [
        { kind: 'body', text: 'Creator Studio es el espacio autenticado. No es una cartera ni guarda fondos. Almacena tu perfil, destinos de cobro, preferencias de alerta y el token que usa OBS.' },
        { kind: 'steps', items: [
          { title: 'Inicia sesión', text: 'Elige una cartera, conéctala y firma el mensaje. Conectar por sí solo no abre una sesión.' },
          { title: 'Guarda un destino', text: 'Elige la red e introduce la dirección de cobro. Las direcciones reservadas de router, tesorería, cero y sistema se rechazan.' },
          { title: 'Configura la alerta', text: 'Elige tema, posición, sonido, medios opcionales y voz. La configuración pertenece a tu perfil.' },
          { title: 'Copia la URL privada del overlay', text: 'Úsala solo dentro de OBS. El enlace público de checkout es el que compartes con tu comunidad.' },
        ] },
        { kind: 'table', head: ['Enlace', 'Dónde aparece', 'Quién puede usarlo'], rows: [
          ['Checkout público', '/pay/{creator} en tu sitio, bio o chat', 'Cualquiera con quien lo compartas'],
          ['Overlay privado', '/overlay/{token}, copiado desde Creator Studio', 'Solo tu Browser Source de OBS; mantenlo en secreto'],
        ] },
        { kind: 'note', tone: 'info', title: 'El estado es honesto por diseño', text: 'El estudio informa la configuración y el estado de la API. Una preferencia guardada no es una alerta entregada; una transacción pendiente no es una donación. La prueba real es la confirmación on-chain seguida del ACK de OBS.' },
      ],
    },
    {
      id: 'obs', nav: 'Configurar OBS', eyebrow: 'EN PANTALLA', title: 'Un Browser Source. Ningún plugin.',
      blocks: [
        { kind: 'body', text: 'OBS Studio renderiza LiveCrypto como una página web normal dentro de un Browser Source. OBS mantiene la página abierta, la conexión WebSocket entrega una alerta a la vez y el overlay confirma cada alerta después de mostrarla.' },
        { kind: 'steps', items: [
          { title: 'Crea un Browser Source', text: 'En tu escena, abre Fuentes, pulsa + y elige Navegador.' },
          { title: 'Pega la URL privada', text: 'Copia el enlace del overlay desde Creator Studio. No uses aquí el enlace público de checkout.' },
          { title: 'Ajusta el lienzo', text: 'Usa 1920 × 1080, o la resolución exacta de tu lienzo de emisión, para que el overlay no se recorte.' },
          { title: 'Envía una alerta de prueba', text: 'Dispara la prueba en Creator Studio y observa la escena. Un comando encolado no prueba que se mostró.' },
        ] },
        { kind: 'code', label: 'BROWSER SOURCE / VALORES DE REFERENCIA', lines: [
          'URL      https://tu-dominio/{locale}/overlay/{token-privado}',
          'Ancho    1920',
          'Alto     1080',
          'FPS      30',
          'Audio    Controlar audio desde OBS (opcional)',
        ] },
        { kind: 'note', tone: 'info', title: 'La URL del overlay es una credencial', text: 'Cualquiera con el enlace puede recibir tus alertas. No la pongas en una bio pública, captura o ticket de soporte. Genera otro token de inmediato si se filtra.' },
      ],
    },
    {
      id: 'alerts', nav: 'Alertas', eyebrow: 'ENTREGA', title: 'En cola, entregada, confirmada.',
      blocks: [
        { kind: 'body', text: 'Una donación verificada se escribe en el libro financiero y en una outbox en la misma transacción de base de datos. Redis publica una señal de activación; no sustituye a la cola duradera. Si OBS se desconecta, las alertas siguen en cola y se reproducen cuando la fuente vuelve.' },
        { kind: 'table', head: ['Estado', 'Qué significa', 'Qué lo prueba'], rows: [
          ['En cola', 'La donación está registrada y la alerta espera', 'Una fila en la outbox'],
          ['Entregada', 'La fuente OBS recibió la alerta', 'El envío WebSocket se completó'],
          ['Confirmada', 'El overlay terminó de mostrarla', 'Un ACK del overlay'],
        ] },
        { kind: 'list', items: [
          'Las alertas se entregan de una en una; la segunda espera en lugar de superponerse.',
          'Sonido, medios y voz se configuran por perfil en Creator Studio.',
          'Después de abrir OBS, mantén la fuente visible el tiempo suficiente para que el overlay cargue y conecte.',
          'Una alerta ausente se diagnostica por el estado de la outbox, no por suposiciones sobre la escena.',
        ] },
        { kind: 'note', tone: 'info', title: 'Publicar no es mostrar', text: 'Una publicación correcta en Redis solo despierta la capa de sockets. Solo el ACK mueve una alerta a confirmada; por eso el estudio no finge que la alerta apareció.' },
      ],
    },
    {
      id: 'payments', nav: 'Pagos', eyebrow: 'CAMINO DEL DINERO', title: 'No custodial por diseño, bloqueado por evidencia.',
      blocks: [
        { kind: 'body', text: 'LiveCrypto no es custodial. El checkout crea una intención de pago que fotografía creador, red, destino, remitente, importe, comisión, memo y cursor de monitorización. Una transacción solo liquida cuando todos los campos coinciden.' },
        { kind: 'table', head: ['Vía', 'Estado actual', 'Condición'], rows: [
          ['EVM', 'Ruta de código en testnet; router y tesorería deben estar configurados', 'DONATIONS_ENABLED=true, router desplegado, evento DonationRouted confirmado'],
          ['Solana', 'Ruta de código en Devnet; transferencia nativa dividida y finalizada', 'DONATIONS_ENABLED=true, tesorería y genesis hash del clúster coinciden'],
          ['Identidad Sui', 'Inicio de sesión y registro de cobro disponibles', 'SUI_NETWORK configurado; no se requiere router Move'],
          ['Checkout Sui', 'No disponible de forma explícita en la interfaz', 'Paquete Move desplegado y reconciliado en testnet'],
        ] },
        { kind: 'list', items: [
          'La comisión propuesta de la plataforma es del 2% (PLATFORM_FEE_BPS=200), mostrada aparte de la comisión de red.',
          'La parte del creador va al destino registrado; la comisión va a la tesorería configurada.',
          'La cartera del donante muestra la comisión de red antes de firmar. LiveCrypto no puede reembolsar una transferencia on-chain.',
          'El navegador solo recibe endpoints RPC públicos; las URL con claves de proveedor se quedan en el servidor.',
        ] },
        { kind: 'note', tone: 'pending', title: 'El checkout Sui está bloqueado a propósito', text: 'El backend anuncia la vía Sui solo cuando DONATIONS_ENABLED, un SUI_TREASURY_ADDRESS válido y un SUI_PACKAGE_ID válido están presentes. Aun así, el checkout marca Sui como no disponible y rechaza el envío hasta que el router Move se valide en testnet. Es una barrera de seguridad, no un botón que falta.' },
      ],
    },
    {
      id: 'qr', nav: 'QR y móvil', eyebrow: 'ENTRADA MÓVIL', title: 'El QR abrirá el checkout, no una cartera.',
      blocks: [
        { kind: 'body', text: 'Escribir una dirección en el teléfono es propenso a errores. La entrada móvil prevista es un código QR que codifica la URL pública del checkout del creador. Al abrirlo se carga el mismo checkout del enlace compartido, con red, importe, comisión y destino visibles antes de firmar nada.' },
        { kind: 'body', text: 'Un QR que solo contenga una dirección de cartera se saltaría la intención de pago, la divulgación de la comisión y la atribución de la alerta. LiveCrypto no usa un QR de dirección pura para donaciones; el checkout sigue siendo la fuente de verdad.' },
        { kind: 'list', items: [
          'Lado del creador: Creator Studio ofrecerá una acción para compartir/descargar el QR del checkout público (previsto).',
          'Lado del donante: la cámara del teléfono abre el checkout; un navegador con cartera o la app de la cartera firma la transacción mostrada.',
          'Lado del servidor: se ejecutan la misma intención y el mismo verificador; el QR no añade confianza ni atajos.',
          'Los parámetros de importe o memo solo se aceptarán después de que el checkout los valide en el servidor.',
        ] },
        { kind: 'code', label: 'PAYLOAD PREVISTO DEL QR / SOLO URL DEL CHECKOUT', lines: [
          'https://tu-dominio/{locale}/pay/{creator}',
          '',
          'Nunca codifiques: claves privadas, frases semilla, tokens de overlay',
          'ni una dirección pura que omita la revisión de importe, comisión y destino.',
        ] },
        { kind: 'note', tone: 'pending', title: 'No hay emparejamiento por QR en este build', text: 'El checkout actual es una página web y el teléfono necesita un navegador compatible con cartera. La generación dinámica de QR, el emparejamiento por escaneo y los deep links de CEX no están implementados. No los anuncios hasta completar el generador, la validación y una prueba en un dispositivo real.' },
      ],
    },
    {
      id: 'security', nav: 'Seguridad', eyebrow: 'CONFIANZA', title: 'Qué protegemos y qué debes verificar.',
      blocks: [
        { kind: 'body', text: 'La seguridad empieza manteniendo los secretos fuera del navegador. Las sesiones son cookies HttpOnly con SameSite=Strict, no tokens en localStorage. Los nonces son de un solo uso, las rutas de autenticación y pago tienen límite de peticiones, y las URL RPC privadas nunca salen del servidor.' },
        { kind: 'list', items: [
          'Inicia sesión solo en el dominio que esperas y lee el origen en el aviso de la cartera.',
          'Nunca introduzcas una frase semilla o clave privada. LiveCrypto nunca pide ninguna de las dos.',
          'Revisa el destino de cobro en la red exacta antes de guardarlo.',
          'Trata el token del overlay como una contraseña y genera otro tras compartir una captura.',
        ] },
        { kind: 'list', items: [
          'Como donante, lee red, destino, importe y comisión antes de firmar.',
          'Confirma si estás en la testnet o mainnet prevista; los chain IDs no son intercambiables.',
          'Las transferencias blockchain suelen ser irreversibles. No hay saldo de la plataforma que revertir.',
        ] },
        { kind: 'note', tone: 'warn', title: 'Todavía no hay auditoría independiente', text: 'El repositorio tiene pruebas automatizadas, una revisión de backend y una auditoría de dependencias, pero no una auditoría de seguridad de terceros ni una prueba de intrusión en mainnet. No describas esta implantación como auditada o lista para producción.' },
      ],
    },
    {
      id: 'local', nav: 'Entorno local', eyebrow: 'EJECÚTALO TÚ MISMO', title: 'Dos procesos Node, cuatro servicios locales.',
      blocks: [
        { kind: 'body', text: 'El repositorio ejecuta una API Express y una app Next.js. PostgreSQL y Redis son opcionales en modo vista previa y obligatorios para cuentas persistentes, sesiones y la cola duradera de alertas. Node.js 24 y npm son los únicos requisitos obligatorios.' },
        { kind: 'code', label: 'POWERSHELL / DESDE LA RAÍZ DEL REPOSITORIO', lines: [
          '.\\start-dev.bat          # vista previa: datos temporales, pagos desactivados',
          '.\\start-dev.bat --full   # PostgreSQL + Redis en Docker, datos persistentes',
          '.\\start-dev.bat --check  # páginas localizadas, API y assets, luego detiene',
        ] },
        { kind: 'table', head: ['Servicio', 'URL por defecto', 'Notas'], rows: [
          ['Web app', 'http://localhost:3000', 'Next.js; 17 páginas estáticas en el build de producción'],
          ['API', 'http://localhost:8080', 'Express; endpoints de salud, autenticación y pago'],
          ['PostgreSQL', 'localhost:5432', 'Solo en modo persistente'],
          ['Redis', 'localhost:6379', 'Sesiones y señales de alerta'],
        ] },
        { kind: 'code', label: 'VERIFICA ANTES DE CONFIAR EN EL BUILD', lines: [
          'cd backend ; npm test',
          'cd frontend ; npm run test:i18n ; npm run lint:product ; npm run build',
          'cd contracts ; npm test',
        ] },
        { kind: 'note', tone: 'info', title: 'Memoria y arranques en frío', text: 'Los builds en frío en Windows necesitan unos 2 GB de RAM libre; el launcher se niega a iniciar por debajo de su límite de seguridad. La primera página puede tardar varios minutos justo después de reiniciar. Una línea “Ready” de Next.js no significa que la página compiló.' },
      ],
    },
    {
      id: 'status', nav: 'Estado actual', eyebrow: 'EVIDENCIA', title: 'Qué está probado y qué sigue pendiente.',
      blocks: [
        { kind: 'body', text: 'El estado honesto el 5 de noviembre de 2026: las rutas de protocolo están implementadas y probadas, el build de producción pasa y el recorrido de navegador se ha ejercitado con carteras simuladas. Carteras reales, una escena real de OBS, una donación real en testnet, TLS, copias de seguridad y una auditoría independiente siguen pendientes.' },
        { kind: 'table', head: ['Área', 'Estado', 'Evidencia'], rows: [
          ['Identidad Sui', 'Verificada en código y pruebas', 'Firmas ed25519 y secp256k1, digest, derivación de dirección y rechazo de manipulación'],
          ['UI multicartera', 'Implementada; recorrido de navegador simulado', 'Cartera de prueba Wallet Standard vía CDP; el selector Solana lista tres marcas'],
          ['Checkout EVM / Solana', 'Rutas de testnet; fondos reales no ejercitados', 'Pruebas del verificador y fixtures de RPC'],
          ['Checkout Sui', 'Bloqueado por diseño', 'Sin router Move validado, package ID ni reconciliación'],
          ['OBS de extremo a extremo', 'Pendiente', 'Ninguna escena real de OBS se ha ejecutado en este entorno'],
          ['Despliegue de producción', 'No validado aquí', 'Stack Compose definido; ninguna ejecución en VPS o TLS registrada'],
          ['Auditoría de seguridad', 'Pendiente', 'Solo pruebas automatizadas y revisión interna'],
        ] },
        { kind: 'note', tone: 'pending', title: 'Qué decir en público', text: 'Di “vista previa de desarrollo”, nombra la testnet exacta y afirma que los pagos están desactivados salvo que un operador haya habilitado una vía validada. No afirmes soporte de mainnet, liquidación instantánea, contratos auditados o preparación para producción sin evidencia.' },
        { kind: 'media', aspect: 'video', label: 'ESPACIO PARA VÍDEO DEL DUEÑO', title: 'Recorrido de validación', text: 'Reservado para una ejecución de extremo a extremo grabada: checkout en testnet, confirmación, registro en el libro y ACK en OBS. La grabación debe mostrar la red y la insignia de testnet en todo momento.' },
      ],
    },
  ],
  footer: {
    title: '¿Listo para conectar OBS?',
    text: 'Inicia sesión con la cartera que usas para el destino, copia la URL privada del overlay y ejecuta una alerta de prueba antes de tu próxima emisión.',
    cta: 'Abrir Creator Studio',
    note: 'Vista previa de desarrollo · pagos desactivados por defecto · sin afirmación de mainnet',
  },
};

export const docs: Record<Locale, DocsContent> = { en, 'pt-BR': ptBR, es };
