# LiveCrypto — implementation and verification status

**Updated: 1 November 2026.** See [the resumption roadmap](docs/RETOMADA_E_ROADMAP.md) for priorities, dependencies and publication policy.

## Current delivery

The Matrix/Protocol design combines the logo's blue/cyan/green with violet accents. Shared branding and guides are integrated into landing, login, Creator Studio and checkout. The SVG blockchain scene provides automatic playback, scroll, pause/replay and manual exploration. Reduced-motion users can explicitly opt in.

The landing now carries a cinematic motion layer: a skippable boot intro, an interactive canvas crypto network, cursor spotlight, scroll progress, reveal-on-scroll, parallax, pointer-driven card tilt, a simulated network ticker, a kinetic marquee and floating token markers. The canvas and ambient video pause off-screen or in a hidden tab, and reduced-motion visitors receive the static page until they explicitly enable motion. The ticker is labelled as illustrative data, never as live chain telemetry.

Act II extends that language to the whole product: a shared motion preference, a persistent atmosphere, route curtain, scroll progress and pointer light, plus real-state motion in Creator Studio (counters, goal meter, alert flash, staggered ledger), login (wallet orbit and four real steps) and checkout (live fee split, testnet badge, always-visible payment timeline). A landing chapter rail and a protocol interlude complete the narrative. Reveals follow DOM mutations, so panels mounted after an API response still animate, and a 2.4 s pre-hydration failsafe prevents an animation from ever holding content invisible. Every effect is decorative and reads from real page state.

Act III refines that foundation rather than adding another motion system. The landing hero now carries protocol status chips and a three-node command-deck strip; the how-it-works chapters share a scroll-synced spine with a single current step; Creator Studio gains scroll-spy navigation, a 14-day confirmed-donation chart, a goal dial and loading skeletons; checkout gains quick-amount chips; login gains a real step ring and error shake. The chart is a visual duplicate of the UTC ledger and stays `aria-hidden`, so the accessible source of truth remains the donation history table.

Creator Studio now explains authentication, receiving destinations, payment availability, OBS Browser Source setup and the difference between public checkout and private overlay links. UI status uses the profile/network configuration, not an assumed successful payment or OBS connection.

The backend work accumulated before this resumption includes revocable cookie sessions, persistent creator-bound payment intents, RPC discovery/reconciliation, exact-value settlement and durable OBS replay/ACK. Mainnet acceptance remains pending.

## Evidence from this resumption

The latest backend review fixes logout during Redis failure, concurrent account insertion, partial alert settings, upload/provider failure handling, exact analytics, production file logging and WebSocket backpressure. See [the review report](docs/BACKEND_REVIEW.md) and [manual test instructions](docs/COMO_TESTAR.md). The client now distinguishes a saved setting from failed live synchronization.

| Check | Result | Scope |
|---|---|---|
| Frontend TypeScript (`--noEmit --incremental false`) | Passed | Application types after the cinematic layer; not browser interaction |
| Targeted frontend ESLint | Passed | Product routes, cinematic components, animation/guide components and localization |
| Locale/catalog tests | 6 passed | Negotiation, route handling, exact decimal display and translation parity, including the new `fx` and `login.steps` / `pay.timeline` catalog entries |
| Backend tests without PostgreSQL | 42 passed; 3 skipped; 0 failed | Default suite; PostgreSQL-only cases skip by design |
| Backend tests with `TEST_DATABASE_URL` (7 October) | 45 passed; 0 failed; 0 skipped | Historical PostgreSQL run; Redis test stores and RPC/provider fixtures remain simulated |
| Backend production dependency audit (6 October) | No vulnerabilities reported | Axios updated to 1.20.0; audit is a dependency check, not a complete security review |
| Launcher regression tests (historical) | 5 passed | Memory diagnostics, readiness, timeout and storage-mode checks |
| Solana cluster constants (historical) | Corrected and regression-tested | Full genesis hashes confirmed against public Devnet/mainnet `getGenesisHash` responses; no funds moved |
| Site-wide Act II browser review (31 October) | Passed against the production bundle on port 3001 | Chromium headless at 1440×900, 1024×800 and 390×844: `scrollWidth` equals viewport on every screen; hero 3D tilt 1.10°/2.25°; chapter rail followed to `#pricing`; all login reveals visible after async mount; 98%/2% fee split measured at 504/10 px with 3 idle timeline steps; dashboard revealed late-mounted panels on scroll; fallback class forced opacity 1; mobile checkout settled with opacity 0.99; reduced-motion page static with a working explicit opt-in; 0 console errors |
| Act III browser review (1 November) | Passed against the production bundle on port 3001 | Chromium headless at 1440×900 and 390×844: hero shows 3 protocol chips and a 3-cell command deck with no clipped cells; chapter spine reports `--chapter-progress: 0.333` with one `aria-current="step"`; dashboard skeleton rendered 3 metric + 2 panel placeholders with `aria-busy`; activity chart rendered 14 UTC buckets (6 with confirmed data), stayed `aria-hidden` and exposed axis labels; goal dial dash followed the 42% goal; sticky nav moved its active link from `#studio-setup` to `#studio-ledger` with one `aria-current`; quick amount switched the input to 0.25 and updated the fee split; login core ring resolved `core-spin` for the signing state; reduced motion reported `animation-name: none` and a working explicit opt-in; `scrollWidth` equals viewport; 0 console errors |
| Current production build (1 November) | Passed | Next.js 16.3.6 (Turbopack): compiled in 109 s, TypeScript in 23 s, 14 static pages generated; includes the Act III design pass |
| Cinematic landing browser review (30 October) | Passed against `next dev` | Chromium headless at 1440×900, 1024×800 and 390×844: `scrollWidth` equals viewport, no horizontal page overflow; intro reached 4/4 lines and skip/reload suppression worked; reveals progressed with scroll; tilt reported 1.25°/1.80°; spotlight and aura updated; reduced-motion run showed no animations and no intro; 0 console errors |
| Production-bundle browser spot check (30 October) | Passed | Production build served on port 3001: hydration around 620 ms, intro rendered with four lines, 1440×900 and 390×844 heroes, reduced-motion page static, 0 console errors; not a full acceptance pass, wallet journey or OBS check |
| Current production build (31 October) | Passed | Next.js 16.3.6 (Turbopack): compiled in 74 s, TypeScript in 25 s, 14 static pages generated; includes the Act II motion system |
| Local Docker / PostgreSQL / Redis (30 October) | Stopped | Docker Desktop was not running during this session; earlier Compose services were healthy |
| Production Docker images | Pending | Local database containers do not validate application images or VPS deployment |
| Full `.bat` startup (30 October) | Blocked by available memory | Preflight reported 976 MB free against a 1024 MB requirement on a machine with 8 GiB installed; the guard was not bypassed |
| GitHub Actions | Workflow included; result not verified here | `gh` CLI is unavailable in this environment |

The Solana configuration previously contained shortened chain identifiers where the verifier required full genesis hashes. Both configured-cluster acceptance cases now pass alongside the wrong-cluster rejection test.

### Local startup attempts

**7 October.** Docker Desktop's start command was interrupted by the harness, but a follow-up check confirmed Desktop running and engine version 29.6.2. `docker compose up -d --wait` brought PostgreSQL and Redis to healthy state. `npm run migrate` completed against the existing local database; `npm test` with `TEST_DATABASE_URL` then passed all 45 tests. Isolated test schemas were cleaned up by the tests.

`start-dev.bat --full --no-browser --check` was attempted with donations disabled for the process. It stopped at the memory preflight, before starting either application server. The final check still showed about 205 MB free RAM and no listeners on 3000/8080. Database containers were left running. The application is **not currently available at localhost:3000** as a result of this attempt; free memory before retrying the launcher.

**30 October.** The machine reports 8 GiB installed and 7.999 GiB visible; the earlier “4 GB usable” reading was stale. Available physical memory was about 1.0–1.1 GB, and `start-dev.bat --check` stopped at the preflight with `976 MB free` against a 1024 MB requirement. No listener was left on 3000/8080. The motion work was therefore reviewed by starting `next dev --webpack` directly and running the backend in `DEV_MEMORY_MODE=true`; this bypasses the launcher's guard and is not a launcher validation. Docker Desktop was stopped, so the PostgreSQL-backed suite was not rerun in this session.

## Historical evidence

Before the Matrix rewrite, the Afterglow landing passed production build and headless browser checks. The Windows launcher also passed five HTTP scenarios covering fifteen localized pages after memory/startup corrections. Eight Solidity contract tests passed in a previous review. These are historical results, not a fresh approval of this release.

## Remaining gates

1. Run the [Matrix browser acceptance checklist](docs/VALIDATION_MATRIX.md) against the production build and complete the actual wallet-extension journey. The Act II/III motion system passed a Chromium headless review of the production bundle; the full checklist, real MetaMask/Rabby/Phantom interaction and OBS rendering remain pending.
2. Complete real Redis outage/recovery, production-image startup, migration upgrade scenarios and backup restoration drills. The PostgreSQL-backed suite now passes; process-local Redis substitutes in that suite do not validate real Redis recovery.
3. Refresh dependency auditing. The previous frontend audit reported moderate transitive findings through the legacy Solana SDK; no forced downgrade has been applied.
4. Validate EVM and Solana testnet donations end to end with the exact router, treasury, fee, RPC and real OBS source, including outage and duplicate scenarios.
5. Build/start the production Compose stack on staging; verify DNS, TLS/WSS, health checks, migrations, rollback and externally stored backup restoration.
6. Complete monitoring, operational ownership and a small creator pilot.
7. Before mainnet, complete independent contract/security review and the business's legal, tax, privacy, fee and support decisions.

## Product boundaries

- Payments default to disabled. Only configured native EVM and SOL rails can create intents.
- Ledger/outbox durability requires PostgreSQL. Demo mode is temporary and does not accept payments.
- Wallet keys and funds remain outside platform custody. A test alert is not payment proof.
- USD estimates are unavailable. Goals are manually configured; automatic fiat conversion and minimum-amount filtering remain inactive.
- Token checkout, additional networks, fiat rails, public paid TTS quotas, subscriptions and billing are future work.
- A Git push is not a VPS deployment. No remote production service or mainnet acceptance is claimed.

## Documentation

- [Design and animation](docs/LANDING_DESIGN.md)
- [Backend review and remaining findings](docs/BACKEND_REVIEW.md)
- [How to test and what changed visually](docs/COMO_TESTAR.md)
- [Resumption roadmap and publication log](docs/RETOMADA_E_ROADMAP.md)
- [VPS/staging runbook](PRODUCTION_GLOBAL_LAUNCH.md)
- [Business, pricing and acquisition hypotheses](PRODUCT_BUSINESS_AND_GTM_PLAN.md)

Earlier checklist files are historical planning context. This status distinguishes implemented code, executed tests, deferred checks and deployment.
