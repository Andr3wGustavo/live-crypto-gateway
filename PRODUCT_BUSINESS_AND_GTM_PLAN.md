# Live Crypto Gateway: Product, Business, and Go-to-Market Plan

**Document status:** working strategy, reviewed on 25 September 2026. Pricing, jurisdictions, and targets below are hypotheses to validate, not public promises or financial advice.

## 1. Honest Completion Estimate

A single percentage is misleading because a local product, a closed testnet beta, and a global payments business have different definitions of complete.

| Milestone | Estimate | Meaning | Main gap to close |
|---|---:|---|---|
| Product prototype | 75% | Local UI, wallet login, checkout, ledger, and OBS flow are implemented | Real-device usability and end-to-end testnet evidence |
| Controlled testnet beta | 55% | Core code and deployment artifacts exist; payments remain disabled | Persistent infrastructure tests, real wallets, real testnet transfers, and staging operation |
| Revenue-ready SaaS | 30% | A possible revenue model is defined, but no commercial operation is proven | Mainnet security review, legal/tax decisions, billing, support, analytics, pricing validation, and reliability evidence |
| Global mainnet launch | 15% | Architecture can be extended to host globally | Audited contracts, regional strategy, compliance, resilience, monitoring, backup recovery, pilot traction, and operating capacity |

**Planning headline:** treat the project as approximately **55% toward a controlled testnet beta** and **30% toward a revenue-ready SaaS**. Raising the number by shipping more UI would not reduce the financial, operational, or commercial risk.

## 2. Product Positioning

### Problem

Creators who want crypto donations need a direct, understandable, stream-native workflow. Existing donation tools often add custody, manual reconciliation, weak crypto checkout, or alerts that are not reliable enough for a live broadcast.

### Initial promise to validate

> A creator receives a verified, non-custodial testnet donation directly to a configured wallet, with a transparent fee and a replayable OBS alert.

Do not claim instant settlement, universal wallet support, chargeback elimination, global availability, or support for every chain. Network finality, wallet behavior, local regulations, and OBS connectivity set the real boundary.

### Ideal first customer profile

| Segment | Why start here | Qualification signal | Do not target first |
|---|---|---|---|
| Crypto-native streamers with 1k-50k followers | They already have wallets and explain crypto to their audience | Streams weekly, uses OBS, has an active community, accepts testnet testing | Large creators requiring SLAs, legal review, or agency integrations |
| Web3 game and creator communities | Donation behavior and wallet education are already present | Community manager can recruit a small cohort | Broad general-audience gaming before the flow is validated |
| Latin American and English-speaking early adopters | Existing PT-BR, EN, and ES product coverage | Creator can provide feedback in a supported language | Markets that need unsupported language, tax, or payment methods |

### Product principles

1. Verified payment state is more important than visual animation.
2. Funds always move directly to the creator wallet; the platform never holds a balance.
3. A payment record, an alert publication, and an OBS display acknowledgement are separate states.
4. Each enabled payment rail has an explicit, testable verifier.
5. Product claims must match measured evidence, not the intended roadmap.

## 3. Revenue Model

### Recommended sequencing

| Stage | Revenue action | Rationale | Exit criterion |
|---|---|---|---|
| Closed testnet alpha | No billing and no mainnet fee collection | Learn activation and reliability without financial incentives | 10-20 active testers complete the acceptance scenarios |
| Mainnet pilot | One transparent routing fee, configured in the audited router | Simplest model; aligns revenue with verified successful donations | Fee disclosure, legal review, reconciliation, support process, and pilot reliability evidence |
| Product-market-fit test | Add optional subscription tiers only after core donation retention is measured | Avoid building costly premium features before creators value the core workflow | Cohort retention and willingness-to-pay interviews support a price test |
| Scaled service | Transaction fee plus optional Pro/Studio plans | Covers predictable platform costs and gives higher-volume creators a choice | Margin, churn, support load, and compliance monitoring are stable |

### Pricing hypotheses to test, not publish yet

| Offer | Draft price | Draft routing fee | Intended value | Validation question |
|---|---:|---:|---|---|
| Creator beta | Free, invite-only | 0% on testnet | Setup assistance and feedback access | Can creators install OBS and complete a donation without support? |
| Core | $0/month | 1.5%-2.0% per verified donation | Reliable overlay, direct wallet payout, basic history | Is the fee understood and acceptable relative to creator value? |
| Pro | $12-$19/month | 0.75%-1.0% | Branded scenes, stored assets, advanced moderation, deeper analytics, higher usage limits | Do active creators prefer predictable monthly value? |
| Studio | $39-$79/month | 0.5%-0.75% | Team controls, multiple scenes, priority support, exports, and defined support response targets | Do agencies or larger creators need a separate workspace? |

Network gas is paid by the donor wallet and must always be shown separately. Never charge fees outside a transaction path the backend can verify. Never promise a fee level until contract configuration, terms, and local legal/tax review are complete.

### Unit economics model

Track the following before committing to a price:

| Metric | Formula | Decision use |
|---|---|---|
| Gross payment volume (GPV) | Sum of gross verified donations | Measures creator/donor activity, not platform revenue |
| Take-rate revenue | GPV x configured platform fee | Core revenue forecast |
| Net revenue | Take-rate revenue + subscriptions - refunds/credits | Commercial performance |
| Variable cost per active creator | RPC + storage + TTS + support + payment/billing cost | Sets minimum viable pricing |
| Contribution margin | Net revenue - variable costs | Determines whether acquisition can scale |
| CAC | Sales and marketing spend / newly activated creators | Sets acquisition budget |
| Payback period | CAC / monthly contribution margin per retained creator | Controls channel scaling |
| Creator retention | Active creators retained in a cohort / creators activated in that cohort | Better signal than sign-ups |

Do not count token price appreciation, unverified transactions, or virtual USD estimates as revenue.

## 4. Funnel and Marketing Strategy

### Funnel definition

| Stage | Definition | Primary metric | Early target to validate |
|---|---|---|---|
| Reach | A qualified creator sees a relevant message | Qualified landing visits | 100 qualified visits per week from selected communities |
| Interest | Visitor requests access or starts setup | Visit-to-waitlist conversion | 8%-15% |
| Activation | Creator signs in, registers a wallet, connects an OBS overlay, and receives a test alert | Activated creators / sign-ups | 40%+ with guided onboarding |
| First value | A verified testnet donation is reconciled and acknowledged by OBS | Time to first verified alert | Under one guided session initially |
| Retention | Creator returns and uses the overlay in a subsequent stream | Week-4 retained activated creators | Establish baseline before setting a promise |
| Referral | Creator or community partner introduces another qualified creator | Qualified referrals / active creators | Track before incentives |

These are planning targets, not forecasts. Replace them with cohort data after the first 20-50 creators.

### Channel priority

| Priority | Channel | First experiment | Success signal | Guardrail |
|---:|---|---|---|---|
| 1 | Founder-led outreach | Recruit 20 crypto-native streamers with a short personal demo | 10 accept an onboarding call; 5 complete setup | No paid traffic before activation friction is understood |
| 2 | Community partnerships | Offer a private testnet cohort to Web3 gaming/creator Discords | Community manager recruits 5 qualified creators | No fee share, token, or promotion promise without written terms |
| 3 | Educational content | Publish setup and verification walkthroughs in PT-BR, EN, and ES | Organic qualified visits and setup completion | Do not publish claims that exceed testnet evidence |
| 4 | Creator proof | With written consent, document one successful pilot journey | Visitors cite the proof during signup | Never expose wallet, OBS token, or donor information |
| 5 | SEO | Build pages around OBS crypto donation setup, direct-wallet donation, and localized onboarding | Search impressions leading to qualified activation | Avoid generic, low-quality AI content or unsupported-chain pages |
| 6 | Paid acquisition | Small, tightly measured experiments only after retention baseline | CAC has a plausible payback model | Stop immediately if activation/support costs erase margin |

### Content system

Create one durable asset per week during alpha:

1. A five-minute creator setup video.
2. A testnet donation verification walkthrough explaining pending, confirmed, and displayed states.
3. An OBS troubleshooting guide.
4. A transparent pricing and non-custody explainer, once commercial terms are approved.
5. A creator pilot case study with consent.

Every asset needs one call to action: join the controlled beta, book setup, or read the technical guide. Do not optimize for follower count before measuring qualified creator activation.

## 5. Traffic, Analytics, and Privacy

### Measurement plan

Use a privacy-conscious analytics provider only after documenting data processing, consent requirements, retention, and access controls. Do not send raw wallet addresses, signatures, OBS tokens, payment intent access tokens, private overlay URLs, transaction payloads, or message content to analytics.

| Event | Properties allowed | Purpose |
|---|---|---|
| `landing_viewed` | locale, referrer class, campaign tag | Channel attribution |
| `waitlist_started` | locale, campaign tag | Interest measurement |
| `wallet_login_completed` | wallet family category, locale | Onboarding funnel only |
| `payout_configured` | chain, locale | Setup completion |
| `overlay_connected` | locale, connection outcome | OBS activation friction |
| `test_alert_acknowledged` | chain, elapsed bucket | First-value measurement |
| `payment_intent_created` | chain, amount bucket, locale | Checkout funnel, never financial reporting |
| `payment_confirmed` | chain, amount bucket, elapsed bucket | Reliability measurement |
| `payment_displayed` | chain, elapsed bucket | End-to-end alert delivery measurement |

Use server-side aggregates for financial operations. Keep product analytics logically separate from the payment ledger. Establish a deletion, export, and retention policy before collecting identifiable information.

### Dashboard metrics

| Cadence | Metrics | Owner decision |
|---|---|---|
| Daily during pilot | API error rate, RPC failures, pending intent age, outbox age, OBS ACK rate, active incidents | Pause a rail or fix reliability |
| Weekly | Activation, time to first alert, creator support requests, cohort retention, channel quality | Improve onboarding or stop weak channels |
| Monthly after monetization | GPV, net revenue, contribution margin, churn, CAC, payback, disputes/support cost | Change pricing, usage limits, or growth spend |

## 6. Execution Roadmap

| Priority | Work item | Why it matters | Evidence required | Dependency |
|---:|---|---|---|---|
| P0 | Start PostgreSQL and Redis; rerun durable integration tests | Confirms payment, outbox, and OBS behavior on persistent storage | All backend tests pass with `TEST_DATABASE_URL` | Docker Desktop or a disposable PostgreSQL instance |
| P0 | Build and smoke-test the production Compose stack in staging | Verifies images, migrations, Caddy, health checks, and restart behavior | HTTPS/WSS staging checklist completed | Domain, Linux host, Docker, secrets |
| P0 | Replace legacy Solana client SDK | Removes current moderate dependency findings safely | Checkout migration, tests, build, and real-wallet test pass | SDK selection and migration work |
| P0 | Perform real-wallet and testnet acceptance tests | Proves the path a donor and creator actually use | Signed test evidence for every acceptance scenario | Test wallets, deployed router, dedicated RPCs |
| P0 | Add monitoring, backup, restore, and incident procedures | Prevents silent payment/alert loss | Restore drill and alert routing evidence | Infrastructure provider and operations owner |
| P1 | Define terms, privacy, tax, sanctions/AML, support, and jurisdiction policy | Required before taking fees or marketing a payment service | Counsel and business-owner approval | Legal/tax professionals |
| P1 | Run closed creator alpha | Validates onboarding, product language, and reliability | 10-20 creators, interview notes, activation/retention cohorts | P0 testnet gate |
| P1 | Instrument privacy-safe funnel metrics | Replaces assumptions with data | Event dictionary, consent/review, dashboard | Legal/privacy decision |
| P1 | Publish onboarding and troubleshooting content | Creates repeatable acquisition material | Content published and tracked | Real setup evidence |
| P2 | Test pricing and packaging | Validates revenue without overbuilding | Interview and price-test results | Active/retained pilot users |
| P2 | Add Pro/Studio features selectively | Converts demonstrated creator needs into paid value | Usage and willingness-to-pay evidence | Pricing test |
| P2 | Evaluate additional rails/tokens | Expands only after reliable core rails | Independent verifier, tests, legal review | Stable primary rails |

## 7. Release Gates

| Gate | Owner | Required result | Status |
|---|---|---|---|
| Local persistent integration | Engineering | PostgreSQL/Redis suite passes; migrations work on clean and upgraded databases | Pending environment availability |
| Staging deployment | Engineering/Operations | Compose images, TLS, WSS, migration, health, logs, restart, and rollback verified | Pending host and domain |
| Testnet payment | Engineering/Product | EVM and SOL scenarios in `PRODUCTION_GLOBAL_LAUNCH.md` evidenced | Pending real wallets, router, RPC, and OBS |
| Security | Engineering/Security | Dependency remediation, secret controls, threat model, contract review plan | In progress |
| Operations | Operations | Backup restore, alerting, on-call ownership, payment pause runbook | Not started |
| Legal/commercial | Founder/Legal | Jurisdictions, terms, privacy, tax, sanctions/AML, fee disclosures | Not started |
| Closed alpha | Product/Growth | 10-20 qualified creators, activation and reliability evidence | Not started |
| Paid pilot | Founder/Product | Approved mainnet scope, pricing disclosure, support capacity, rollback tested | Not started |

## 8. Decision Log Template

Use this table for material product, payment, pricing, and compliance decisions. It prevents undocumented assumptions from becoming production behavior.

| Date | Decision | Owner | Alternatives considered | Evidence | Revisit date |
|---|---|---|---|---|---|
| YYYY-MM-DD | Example: enable a specific testnet rail | Name | Keep disabled; choose another rail | Acceptance test record | YYYY-MM-DD |

## 9. First Two Weeks After Infrastructure Is Available

1. Run the P0 local persistent suite and fix any failures before inviting creators.
2. Deploy an isolated staging environment with payments disabled and validate TLS/WSS/restart/health.
3. Configure only one EVM testnet rail first; validate its router, treasury, RPC, and two test wallets.
4. Add Solana Devnet only after the EVM journey is repeatable.
5. Recruit five creators for guided setup calls; record friction, time-to-first-alert, and support questions.
6. Publish one truthful onboarding guide based on the tested workflow.
7. Review the data and decide whether to expand the alpha, fix onboarding, or pause the rail.

## 10. Explicit Non-Goals for This Phase

- Advertising a global mainnet launch.
- Enabling unsupported chains, fiat rails, or token types to increase perceived coverage.
- Spending materially on paid acquisition before activation and retention data exist.
- Promising zero risk, instant alerts, universal wallet support, or regulatory coverage.
- Charging subscriptions or routing fees before product reliability, disclosures, legal review, and support capacity are established.

Related documents: [STATUS.md](STATUS.md), [PRODUCTION_GLOBAL_LAUNCH.md](PRODUCTION_GLOBAL_LAUNCH.md), and [OPERATIONS_AND_LAUNCH.md](OPERATIONS_AND_LAUNCH.md).
