# Protocol / Matrix — shared product design

Current implementation: November 2026. The cinematic layer, the site-wide "Act II" motion system and the "Act III" design pass were reviewed in Chromium headless at 1440×900, 1024×800 and 390×844 against the production bundle. Real wallet/OBS journeys remain pending.

## Direction

- Logo-inspired deep blue, cyan and green, with **violet secondary surfaces**, retained at the owner's request.
- Retro terminal details, geometric panels, a readable Space Grotesk body/display and JetBrains Mono controls. Fonts are self-hosted by Next.js after build.
- Shared `Brand` and `matrix-theme.css` across landing, login, Creator Studio and checkout.
- Supplied brand image/video assets from `public/brand` remain in use. OBS transparency is still controlled separately.
- Cinematic pacing and scroll-based storytelling are design references; movement explains the product rather than representing live financial activity.

## Animation implementation

`BlockchainScene.tsx` renders an SVG wallet → block assembly → verification → OBS visualization. It uses requestAnimationFrame to update SVG attributes, stops offscreen or in a hidden tab, and avoids a WebGL renderer or an added animation dependency.

- Automatic playback is available on all viewport sizes when motion is permitted.
- The full scene has pause/enable, automatic, scroll, replay and range controls.
- Reduced-motion preferences disable automatic playback initially. An explicit user action can enable the demonstration.
- The hero also contains a compact scene; both share the motion preference through `LandingMotion`.
- The supplied ambient video loads only when visible and motion is enabled. Autoplay failure leaves the poster visible.
- The scene is labeled as a simulation. Its timing and verification graphic do not indicate an actual transaction or blockchain settlement time.

The preceding implementation used a static block layout on mobile/short viewports and disabled the motion button for reduced-motion users. Those behaviors motivated the explicit controls in this revision. Actual playback must still pass the browser acceptance checklist.

## Cinematic motion layer

The owner asked for a Rockstar/GTA-style sense of pacing without leaving the Matrix identity. The layer is decorative, client-only and additive: it never replaces the server-rendered product content.

| Component | Role |
|---|---|
| `CinematicIntro.tsx` | Skippable boot sequence: logo, four status lines and a progress bar. Dwells 2.2 s, dismisses on click, wheel, touch or Escape, and stores `lc-cinematic-intro-v1` in `sessionStorage` so it appears once per tab. Renders `null` on the server, so crawlers and no-JavaScript visitors see the page immediately. |
| `CryptoField.tsx` | Canvas network of drifting nodes, proximity links and travelling pulses. The pointer attracts nearby nodes and adds a soft glow. DPR is capped at 1.75, node count scales 26/40/62 by width, animation pauses off-screen and in hidden tabs, and reduced motion paints one static frame. |
| `CinematicFX.tsx` | Scroll progress bar, cursor aura, hero spotlight, reveal-on-scroll via `IntersectionObserver`, parallax offsets and pointer-driven 3D tilt on cards. |
| `LiveNetworkTicker.tsx` | Simulated block/throughput/finality/node strip. Explicitly labelled `SIMULATION` / illustrative data and exposed as a single labelled image to assistive technology; it is not live chain data. |

Supporting CSS in `landing.css` adds the hero aurora, scanlines, floating token markers, kinetic marquee, hover glows and a `data-motion` switch. The marquee, aurora, tokens and ticker are `aria-hidden` where they carry no information. The hero headline lines animate independently, and section content reveals once it enters the viewport.

Reduced-motion behavior is deliberate: the intro is suppressed, canvas animation stops, reveals and parallax are not applied, and the page is fully readable. The existing `Ativar animação` control still lets the visitor opt in explicitly. Motion is only applied after hydration; the server-rendered page is complete without it.

The dev-server review recorded no console errors and no horizontal page overflow. Reveal counts progressed from 0 at the hero to 2, 5, 11 and 17 as sections were visited; a continuous human scroll reveals the remaining items. Tilt, spotlight and the intro skip path were exercised programmatically.

## Act II — site-wide motion system

Act II extends the same visual language to the whole product instead of adding a second, independent animation layer. Motion preference is now one contract shared by the landing and the app shell.

| Piece | Role |
|---|---|
| `useMotionPreference.ts` | Reads the OS `prefers-reduced-motion` value, stores an explicit override in `lc-motion-preference`, and broadcasts changes through a custom event so every consumer agrees. |
| `SiteMotion.tsx` | Route curtain, ambient orbs/grid/scan/grain, scroll progress, cursor glow, pointer panel light, reveal choreography and the product motion toggle. Decorative layers are `aria-hidden`. |
| `AnimatedValue.tsx` | Counts a real metric from its previous value to its new value. The accessible label is always the final value; with motion off it renders immediately. |
| `SectionRail.tsx` | Landing chapter rail. Active chapter is the last section whose top passed a 40% viewport reading line, so one chapter stays active through the interlude and between sections. |

### Product-surface treatment

- **Reveals are data-aware.** `SiteMotion` scans with a `MutationObserver` plus a `WeakSet`, so panels that mount after an API response still animate. A 2.4 s pre-hydration failsafe (`site-motion-fallback`) reveals the page if JavaScript is slow; content is never held invisible by an animation.
- **Creator Studio.** Real revenue, donation count and goal metrics count up, the goal meter animates from the configured amount, panels glow under the pointer, the demo canvas flashes only after the API accepted a test alert, and ledger rows stagger.
- **Login.** A decorative wallet orbit surrounds the logo, while a four-step indicator reflects the real states: connect, sign, verify, studio. Success styling appears only after signature verification.
- **Checkout.** The creator/platform split bar is computed from the live fee basis points and amount, the network badge distinguishes testnet, and the three-stage timeline is always visible in neutral `is-idle` state so it explains the flow before the donor signs.
- **Landing.** The hero network tilts in 3D with the pointer, the aurora has depth, the chapter rail tracks reading position, and a protocol interlude carries the non-custodial/testnet-first message.

All values shown by these animations come from real page state. The effects are additive: with motion disabled, every screen remains complete and readable.

## Act III — command deck and real-data density

Act III is a design refinement on top of Act II, not a second motion layer. The goal was to make the product surfaces feel like one instrument panel: denser information, a clear reading path and motion that responds to what the user is doing.

| Piece | Role |
|---|---|
| `ScrollChapters.tsx` | Replaces the static how-it-works list. A 55% viewport reading line marks one chapter as current and drives a CSS progress spine; the current item receives `aria-current="step"`. |
| `ActivityChart.tsx` | Fourteen UTC day buckets built from the same confirmed transactions as the ledger. It is `aria-hidden`: the ledger table remains the accessible source of truth. The day anchor is captured after mount so renders stay deterministic. |
| Goal dial | SVG ring in the goal metric, driven by the configured goal percentage and hidden from assistive technology because the progress bar already exposes the value. |
| Quick amounts | Checkout chips that set the amount field and update the live fee split. They are disabled while a payment is in flight. |

### Interaction details

- **Landing hero.** Protocol chips summarize the non-custodial, wallet-signed and OBS-ready claims. A three-cell command-deck strip repeats the wallet → blockchain → OBS flow without covering the interactive scene; its scan line is decorative.
- **Studio navigation.** The section nav sticks below the toolbar and follows scroll with a 40% reading line. Only one link is active and only that link carries `aria-current`.
- **Loading skeleton.** The studio renders three metric placeholders and two panel placeholders with `aria-busy="true"` while the API resolves. The visible copy is reserved for assistive technology; the skeleton is not a fake data state.
- **Login ring.** The core gains a rotating ring for preparing, signing and verifying, a static success ring, and a shake plus alert ring when an error is set. Errors still come from real wallet or API failures.
- **Focus and buttons.** Product-wide `:focus-visible` rings and a hover/focus sheen on buttons keep keyboard and pointer feedback consistent with the landing.

## Act IV — motion you can see and control

The Act I–III build already animated, but the movement was easy to miss: the ambient film sat at 0.2 opacity behind heavy gradients, and the only motion switch was a floating pill in the corner. Act IV makes the layer obvious and keeps the user in control.

| Piece | Role |
|---|---|
| Header switch (`MotionToggle`) | The landing motion switch now lives in the header, always visible, with `aria-pressed` and a live dot when motion is on. It replaces the floating corner pill. |
| Reduced-motion notice (`MotionHint`) | When the operating system asks for reduced motion, the hero explains why the page is static and offers an enable button. The notice renders only after hydration, so animating visitors never see a flash. |
| Brand reels | A new `01.5 / In motion` band loops the two existing brand videos (identity cube and network mesh) in framed 16:9 panels, with real posters extracted from the clips and captions labelled as illustrative footage. |
| Reel state tag (`MotionReelTag`) | Reads `AUTO LOOP` while the clip plays and `PAUSED` when motion is off, so the label never claims motion that is not happening. |
| Hero film | Raised from 0.2 to 0.38 opacity with a 30 s drift. The existing wash still protects text contrast on the left. |

The same rules as Act II apply: the videos are `aria-hidden`, start only when they intersect the viewport, pause when the tab is hidden or motion is off, and never autoplay for a reduced-motion visitor. The reel posters are real frames of the clips, so the section stays complete with motion disabled.

## Creator journey

| Screen | Guidance |
|---|---|
| Landing | Product flow, interactive simulation, OBS demonstration, receiving and security explanations |
| Login | Installed wallet selection, connection versus signed authentication, no transfer needed for login |
| Creator Studio | Four-step setup, configured destination state, payment availability, separate public link, private OBS source URL and installation instructions |
| Checkout | Network, destination and fees plus shared security guidance |

Studio guidance is derived from the authenticated profile and configured networks. A saved wallet does not imply payments are enabled. The interface does not claim OBS is connected merely because a test command was sent. USD goals remain manual; minimum-amount filtering and automatic fiat conversions are not active.

## Main files

| File | Role |
|---|---|
| `frontend/src/app/matrix-theme.css` | Shared identity and product layouts |
| `frontend/src/app/cinematic-app.css` | Act II/III product motion: ambience, curtain, reveals, meters, skeletons, activity chart, goal dial, login/checkout motion and responsive rules |
| `frontend/src/app/[locale]/landing.css` | Landing composition, terminal scene, command deck, chapter spine, interlude and responsive rules |
| `frontend/src/components/Brand.tsx` | Shared logo/header |
| `frontend/src/components/useMotionPreference.ts` | Shared motion preference, storage and cross-component event |
| `frontend/src/components/LandingMotion.tsx` | Landing motion provider and video lifecycle |
| `frontend/src/components/MotionToggle.tsx` | Header motion switch and the reduced-motion notice |
| `frontend/src/components/MotionReelTag.tsx` | `AUTO LOOP` / `PAUSED` state label for the brand reels |
| `frontend/src/components/SiteMotion.tsx` | Site-wide Act II controller: reveals, ambience, pointer light and toggle |
| `frontend/src/components/AnimatedValue.tsx` | Accessible metric counter |
| `frontend/src/components/SectionRail.tsx` | Landing chapter rail with scroll-position tracking |
| `frontend/src/components/ScrollChapters.tsx` | How-it-works chapter list with reading-line current state and progress spine |
| `frontend/src/components/ActivityChart.tsx` | Accessible-hidden 14-day chart of confirmed donations from the ledger |
| `frontend/src/components/CinematicIntro.tsx` | Skippable boot sequence |
| `frontend/src/components/CryptoField.tsx` | Interactive canvas crypto network |
| `frontend/src/components/CinematicFX.tsx` | Scroll progress, spotlight, reveal, parallax and tilt |
| `frontend/src/components/LiveNetworkTicker.tsx` | Labelled simulated network telemetry |
| `frontend/src/components/BlockchainScene.tsx` | SVG simulation and controls |
| `frontend/src/components/CreatorGuide.tsx` | Setup, login, OBS, receiving and security explanations |
| `frontend/src/i18n/messages.ts` | EN, PT-BR and ES copy |

## Current evidence

TypeScript, targeted product lint and six locale/catalog tests passed after Act II. A Chromium headless review of the production bundle at 1440×900, 1024×800 and 390×844 found no horizontal page overflow and no console errors. The review confirmed: hero 3D tilt (1.10°/2.25°), a persistent chapter rail that follows to `#pricing`, all login reveals after async mount, a real 98%/2% checkout split with an always-visible idle timeline, Creator Studio reveals for late-mounted panels, the 2.4 s hydration failsafe, and a fully static reduced-motion page with a working explicit opt-in. The production build passed (Next.js 16.3.6, 14 static pages). The review does not validate real wallet extensions or OBS. See [VALIDATION_MATRIX.md](VALIDATION_MATRIX.md) for the remaining acceptance pass.

Act III passed the same static gates (TypeScript, targeted lint, six locale tests) and a second Chromium headless review of the production bundle. At 1440×900, the hero rendered three protocol chips and three command-deck cells with no clipped cell; the chapter list reported `--chapter-progress: 0.333` with one `aria-current="step"`; the dashboard rendered a five-placeholder skeleton before resolving, then 14 activity buckets (6 with confirmed data), a 42% goal dial and a sticky nav that moved from `#studio-setup` to `#studio-ledger`; the checkout quick amount switched the input to 0.25 and updated the fee split; the login core resolved the signing ring. At 390×844 the same screens reported no horizontal page overflow. Reduced motion stayed static and the explicit opt-in still worked. No console errors were recorded. This remains a design/interaction review, not a payment or OBS acceptance pass.

Act IV was reviewed on the production bundle with motion enabled and with `prefers-reduced-motion: reduce`. With motion allowed, the header switch reported `aria-pressed="true"`, the hero film played at 0.38 opacity, both brand reels autoplayed at 1280×720 with advancing `currentTime` and showed `AUTO LOOP`, and a frame diff measured 25.4% changed pixels over 1.3 s across the reel band. Pausing stored `lc-motion-preference=off`, stopped every video and reduced running animations to zero; resuming restarted both reels. Under reduced motion the page reported zero running animations, no reel `src`, `PAUSADO` tags on the posters, and the hero notice with an enable button that started playback when clicked. The fixed chapter rail no longer overlaps the reel grid, and `scrollWidth` still equals the viewport at 1440×900 and 390×844.
