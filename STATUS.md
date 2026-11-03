# LiveCrypto — implementation and verification status

**Updated: 2 November 2026.** See [the resumption roadmap](docs/RETOMADA_E_ROADMAP.md) for priorities, dependencies and publication policy.

## Current delivery

The Act VI cyan campaign is the current visual layer. Landing, login, Creator Studio, checkout and the overlay share one near-black steel surface, electric cyan accents, Anton display type, Inter Tight body copy and JetBrains Mono telemetry. Purple/violet tones, the light hybrid surface and the framed stream card were removed. Shared branding and guides remain integrated across every route. The SVG blockchain scene provides automatic playback, scroll, pause/replay and manual exploration. Reduced-motion users can explicitly opt in.

The landing now carries a cinematic motion layer: a skippable boot intro, an interactive canvas crypto network, cursor spotlight, scroll progress, reveal-on-scroll, parallax, pointer-driven card tilt, a simulated network ticker, a kinetic marquee and floating token markers. The canvas and ambient video pause off-screen or in a hidden tab, and reduced-motion visitors receive the static page until they explicitly enable motion. The ticker is labelled as illustrative data, never as live chain telemetry.

Act II extends that language to the whole product: a shared motion preference, a persistent atmosphere, route curtain, scroll progress and pointer light, plus real-state motion in Creator Studio (counters, goal meter, alert flash, staggered ledger), login (wallet orbit and four real steps) and checkout (live fee split, testnet badge, always-visible payment timeline). A landing chapter rail and a protocol interlude complete the narrative. Reveals follow DOM mutations, so panels mounted after an API response still animate, and a 2.4 s pre-hydration failsafe prevents an animation from ever holding content invisible. Every effect is decorative and reads from real page state.

Act III refines that foundation rather than adding another motion system. The landing hero now carries protocol status chips and a three-node command-deck strip; the how-it-works chapters share a scroll-synced spine with a single current step; Creator Studio gains scroll-spy navigation, a 14-day confirmed-donation chart, a goal dial and loading skeletons; checkout gains quick-amount chips; login gains a real step ring and error shake. The chart is a visual duplicate of the UTC ledger and stays `aria-hidden`, so the accessible source of truth remains the donation history table.

Act IV makes motion visible and recoverable. The hero film now plays at 0.38 opacity with a slow drift instead of a barely perceptible 0.2, a new "in motion" band loops the two brand videos (identity cube and network mesh) with real posters and an `AUTO LOOP`/`PAUSED` state tag, and the motion switch moved from a floating corner pill into the landing header so it is always one click away. When the operating system requests reduced motion, the hero shows an explicit notice and an enable button; motion still stays off until the visitor chooses it. Measured on the production bundle, 25.4% of sampled pixels change over 1.3 s in the reel band, against 10.5% on the previous hero.

Act V replaces the visual direction after an owner review rejected the dark-only look. The requested direction is a **gaming vibrant (Twitch/Kick) hybrid**: marketing pages now run on a light `#f7f3ff` surface with violet headlines, white cards and hard offset shadows, while login, Creator Studio, checkout and the overlay keep their dark `#07040f` surface. Both share the logo palette (violet `#6d3bff`, cyan `#00c2ff`, green `#00e57d`, pink `#ff2e93`); on white, body copy stays ink and only violet carries text accents. The hero's full-bleed film, canvas, code rain, scanlines and token markers were removed; the brand loop now lives inside a dark 16:9 "stream card" with `PREVIEW` / simulated labels, a `LIVE` chip, a simulated donation alert and the wallet → blockchain → OBS strip. The whole landing layer is scoped to `.matrix-landing.gaming` in `landing-gaming.css`, and the shared product refresh lives in `gaming-system.css`, so the previous direction remains in git history and the change is reversible. Motion, reduced-motion and i18n contracts are unchanged.

Act VI replaces Act V after the owner asked for a Rockstar-inspired cyan campaign with more crypto/web3 texture. The light surface, violet accents, pills and framed stream card were retired. Every route now shares a near-black `#04090d` steel base, electric cyan `#22e6ff`, deep blue `#0891b2`/`#2b9dff` and ice `#d7f7ff`; the display face is Anton, body is Inter Tight and telemetry is JetBrains Mono. Both brand loops are now embedded layers rather than players: the identity cube is the hero entrance film, colour-graded, screen-blended and mask-faded with a slower 46 s drift, while the mesh loop is a full-bleed background band behind the `#in-motion` copy. The hero headline locks in glyph by glyph with wider tracking, an outlined `LIVECRYPTO` watermark and drifting `Ξ ◎ ₿ ◈ ⬡` glyphs add web3 texture, and the network cards use `Ξ ◎ ₿`. Cards are rounded glass/liquid-glass surfaces (16–22 px), not uniform squares. Every button shares one filled glass capsule pattern in Inter Tight 600 — cyan gradient primary, dark glass secondary, with the closing section intentionally inverting to dark-on-cyan. A floating retractable glass side rail (`SideNav.tsx`) replaces the top header: 84 px collapsed / 268 px expanded on desktop, a full-height drawer under 980 px, icons plus labels, an always-visible brand mark, an icon-only globe language control and the motion switch. The expanded desktop rail pushes the page instead of covering it. `campaign-system.css` and `landing-campaign.css` replace `gaming-system.css` and `landing-gaming.css`; the old files were deleted and the earlier direction remains in git history.

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
| Act IV motion review (1 November) | Passed against the production bundle on port 3001 | Chromium headless at 1440×900 and 390×844: header switch reads "Pause animation" with `aria-pressed="true"`; hero film played at 0.38 opacity; both brand reels autoplayed (1280×720, `currentTime` advancing) and reported `AUTO LOOP`; pausing set `lc-motion-preference=off`, stopped the video and zeroed running animations; resuming restarted both; with `prefers-reduced-motion: reduce` the page reported 0 running animations, no reel `src`, `PAUSADO` tags, the hero notice with its enable button, and opting in from that notice started the reels; reel band pixel delta 25.4% over 1.3 s; `scrollWidth` equals viewport on both sizes; 0 console errors |
| Act V redesign review (1 November) | Passed against the production bundle on port 3001 | Chromium headless at 1440×900 and 390×844: header `position: fixed` at top 0, 85 px tall, 98.5% light surface; landing background `rgb(247,243,255)`; hero `h1` ink `rgb(18,8,43)` at 80.64 px; stream card 591×494 with the brand video playing at 1280×720 and `PRÉVIA VISUAL` / `SIMULADO · NÃO É DADO REAL` labels; ticker band `rgb(10,6,24)`; violet marquee gradient; every section reported `scrollWidth` equal to the viewport; mobile hero buttons stacked at 351 px with no header overflow; reduced motion reported `motion=off`, 0 running animations, no stream `src`, the real poster and a working in-hero opt-in; login re-checked with a `rgb(7,4,15)` body and green→cyan pill primary; 0 console errors |
| Act VI cyan campaign review (2 November) | Passed against the production bundle on port 3001 | Chromium headless at 1440×900, 1024×768 and 390×844: no horizontal overflow at any width; hero film measured 1143×643 at ratio 1.778 with no crop or stretch; `h1` letter-spacing 1.58 px, no glyph overflow in EN/PT-BR/ES; side rail 268 px open / 84 px collapsed with content pushed to 300/116 px and no overlap; mobile drawer opaque and scrim-backed, hamburger becomes an X, Escape closes; primary buttons 14 px radius in Inter Tight, glass cards 22 px; language icon-only; globe, interlude and closing cyan bands restored; reduced motion reported `data-motion="off"`, videos paused with no `src`; 0 console errors |
| Current production build (2 November) | Passed | Next.js 16.3.6 (Turbopack): compiled in 54 s, TypeScript in 28.5 s, 14 static pages generated; includes the Act VI side rail, glass surfaces and closing-band contrast fix |
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
