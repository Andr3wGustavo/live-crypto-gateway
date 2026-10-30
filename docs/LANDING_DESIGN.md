# Protocol / Matrix — shared product design

Current implementation: October 2026. The cinematic motion layer passed a Chromium headless review against the dev server at 1440×900, 1024×800 and 390×844, and a production-bundle spot check on port 3001. Real wallet/OBS journeys remain pending.

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
| `frontend/src/app/[locale]/landing.css` | Landing composition, terminal scene and responsive rules |
| `frontend/src/components/Brand.tsx` | Shared logo/header |
| `frontend/src/components/LandingMotion.tsx` | Motion preference, explicit toggle and video lifecycle |
| `frontend/src/components/CinematicIntro.tsx` | Skippable boot sequence |
| `frontend/src/components/CryptoField.tsx` | Interactive canvas crypto network |
| `frontend/src/components/CinematicFX.tsx` | Scroll progress, spotlight, reveal, parallax and tilt |
| `frontend/src/components/LiveNetworkTicker.tsx` | Labelled simulated network telemetry |
| `frontend/src/components/BlockchainScene.tsx` | SVG simulation and controls |
| `frontend/src/components/CreatorGuide.tsx` | Setup, login, OBS, receiving and security explanations |
| `frontend/src/i18n/messages.ts` | EN, PT-BR and ES copy |

## Current evidence

TypeScript, targeted product lint and six locale/catalog tests passed after the cinematic layer was added. A Chromium headless review at 1440×900, 1024×800 and 390×844 found no horizontal page overflow, no console errors, a working intro skip and once-per-session suppression, progressive reveals, pointer spotlight, tilt and a fully static reduced-motion page. The production build passed (Next.js 16.3.6, 14 static pages) and a spot check of that bundle on port 3001 rendered the intro, desktop/mobile heroes and the reduced-motion page with no console errors. The review does not validate real wallet extensions or OBS. See [VALIDATION_MATRIX.md](VALIDATION_MATRIX.md) for the remaining acceptance pass.
