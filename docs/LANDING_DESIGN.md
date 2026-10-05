# Protocol / Matrix — shared product design

Current implementation: October 2026. Browser acceptance and production build of this revision are pending; the earlier Afterglow screenshots/tests do not validate these changes.

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
| `frontend/src/components/LandingMotion.tsx` | Motion preference and video lifecycle |
| `frontend/src/components/BlockchainScene.tsx` | SVG simulation and controls |
| `frontend/src/components/CreatorGuide.tsx` | Setup, login, OBS, receiving and security explanations |
| `frontend/src/i18n/messages.ts` | EN, PT-BR and ES copy |

## Current evidence

TypeScript, targeted product lint and six locale/catalog tests passed during this resumption. Browser review, full build and new screenshots were deferred after the owner chose to continue without visual testing on the memory-constrained machine. See `STATUS.md` and [VALIDATION_MATRIX.md](VALIDATION_MATRIX.md) for the next acceptance pass.
