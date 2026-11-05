# Matrix UI acceptance checklist

Status: **partially executed for the October–November 2026 revision.** The cinematic landing layer, the site-wide Act II motion system, the Act III design pass, the Act V gaming/hybrid redesign, the Act VI cyan campaign with its side rail and glass surfaces, and the Act VII forced-motion/hover-rail polish were reviewed in Chromium headless at 1440×900, 1024×768 and 390×844 (Act I–III also at 1024×800) against the production bundle served on port 3001. The P0 Sui verifier and payout rules have automated cryptographic coverage (4 November), but the real Slush/Sui Wallet and Solflare/Backpack journeys are still pending. Static checks are not a substitute for these scenarios.

## Setup

1. Start with sufficient free memory using the root `start-dev.bat`; preview keeps payments disabled.
2. Open `/pt-BR`, then repeat key navigation in `/en` and `/es`.
3. For persistent scenarios, use `start-dev.bat --full` with Docker available and migrations applied.
4. Use dedicated test wallets and testnet assets. Never capture private overlay tokens or wallet secrets in screenshots.

## Browser scenarios

| Scenario | Expected result | Evidence to record |
|---|---|---|
| Hero scene, desktop | Blocks/packet change position while visible; simulation label remains clear | Short recording, browser/viewport |
| Full scene: Auto → scroll → replay | Automatic playback advances, scroll mode follows the viewport, replay restarts from zero; there is no pause control | Recording including controls |
| Scroll mode | Native scrolling changes animation progress; wheel and touch scrolling remain native | Desktop and touch-sized viewport |
| Range control | Mouse and keyboard can explore start, middle and end states | Keyboard check |
| Forced motion | With the OS set to `prefers-reduced-motion: reduce`, the intro, aurora, marquee, headline, videos and scene still animate; no notice or opt-in appears | Emulated `prefers-reduced-motion` check and computed animation names |
| Cinematic intro | Four status lines animate; skip button, click, wheel, touch and Escape dismiss; returning in the same tab does not replay it | Desktop and touch-sized recording |
| Reveal, parallax and tilt | Sections fade in as they enter; hero/network parallax stays subtle; cards tilt with the pointer without hiding text | Desktop pointer recording |
| Simulated ticker | Numbers advance while visible and the strip is labelled as illustrative, not live chain data | Screenshot and DOM check |
| Chapter rail | The rail stays visible on desktop, follows scroll and always keeps one chapter active, including the interlude; hidden below 1100 px | Screenshots at two scroll positions |
| No motion control | No pause, enable or opt-in control exists on the landing, product shell or blockchain scene; `data-site-motion` and `data-motion` stay `"on"`; `lc-motion-preference` is not read | DOM and storage check |
| Async reveals | Metrics and panels mounted after the API response still reveal; the 2.4 s failsafe shows the page if hydration is slow | DOM opacity and screenshot |
| Chapter spine | Exactly one how-it-works chapter is current at a time, carries `aria-current="step"`, and the spine height follows the reading position | DOM check at two scroll positions |
| Studio loading skeleton | Placeholders expose `aria-busy` and are replaced by real values; no placeholder number is announced as data | Throttled-network screenshot and DOM check |
| Studio activity chart | Fourteen UTC buckets match confirmed ledger rows; the chart is `aria-hidden` and the ledger remains the accessible source | DOM comparison of counts |
| Studio scroll spy | The sticky nav highlights the section at the reading line, with exactly one `aria-current` link | Scroll check |
| Quick amounts | A chip sets the amount, updates the live fee split and is disabled during signing; keyboard focus remains visible | Screenshot and DOM check |
| Brand film band | Both loops autoplay when visible, keep their 16:9 ratio and report `AUTO LOOP`; the hero cube and mesh band remain blended layers with no player chrome or poster card | Screenshot and `currentTime` check |
| Rail hover and focus | Passing the pointer over the desktop rail expands it and leaving collapses it; keyboard focus inside also expands it; no toggle button is visible on desktop | Pointer recording and computed width |
| Forced-motion CSS audit | No `prefers-reduced-motion` rule suppresses animation and no `[data-motion="off"]` rule changes playback | Stylesheet search and computed styles |
| Unified cyan surface | Landing, login, studio, checkout and overlay all render on the `#04090d` steel surface with cyan accents and Anton display type; no violet/purple rule remains | Screenshots of every route |
| Hero film and watermark | The cube loop enters as a graded, mask-faded layer, the outlined wordmark and token glyphs sit behind the copy, and the header logo stays legible over the film | Screenshot at 1440 and 390 px plus DOM opacity/mask check |
| Headline lock-in | Each glyph animates once from a blurred offset into place; the `h1` accessible name is the complete sentence | DOM check and two-frame capture |
| Side navigation, desktop | The glass rail expands to 268 px on hover/focus and collapses to 84 px on leave; the page is pushed, never covered; icons, labels, brand mark and CTA stay usable; no desktop toggle | Screenshots open/collapsed plus DOM width and padding check |
| Side navigation, mobile | Under 980 px a hamburger opens an opaque full-height drawer over a scrim; the button becomes an X; focus is trapped, the page behind is inert, links close the drawer, Escape closes it and focus returns to the hamburger; body scroll is locked while open | 390 px screenshots and keyboard check |
| Glass cards and buttons | Cards render as rounded glass surfaces (16–22 px) with a soft inner highlight; every button is a filled capsule in Inter Tight, with cyan gradient primary and dark glass secondary | Computed radius/font/background at 1440 and 390 px |
| Hero film integrity | The entrance film keeps a 16:9 ratio at every width, with no stretch or crop of the source, and the headline does not overflow in EN/PT-BR/ES | Ratio and `scrollWidth` check at three widths |
| Metric counters | Real values count up; assistive technology reads the final value once | DOM check |
| Checkout fee split | Creator/fee bar matches the live fee basis points and amount; the timeline is visible in idle state and advances only with real payment state | Amount change and screenshot |
| Hidden/offscreen scene | Animation pauses; returning resumes without a large time jump | Browser performance check |
| 320/390 px and short desktop | Controls/text fit; blockchain can still be played; no horizontal page overflow | Screenshots |
| Demo alert | Themes match swatches; sound only plays after opt-in; demo never records funds | Screenshot and audio check |
| Login | Connection and signature steps clear; missing wallet/rejected signature show errors | Extension/browser versions |
| Sui sign-in (Slush/Sui Wallet) | The Sui tab lists Wallet Standard wallets; connecting returns an address; `signPersonalMessage` produces a base64 envelope accepted by the backend; a tampered message or address mismatch returns 401 and consumes no nonce | Real extension version, network response and address (no signature secret) |
| Sui payout | A `0x` + 64-hex address is stored in lowercase for the configured `sui-*` network; short aliases, zero, the treasury and malformed values are rejected; a returning login does not overwrite a chosen destination | Dashboard screenshot with the address visible |
| Sui checkout guard | Selecting the Sui network shows an explicit unavailable notice and the payment button stays disabled; no EVM transaction is requested for a Sui network | Checkout screenshot and disabled-button state |
| Solana multi-wallet | Phantom, Solflare and Backpack are detected independently, the picker chooses the active provider and the checkout uses the same selected wallet | Extension versions and selected provider |
| SIWE chain binding | A message signed for another `chainId` returns 401 without consuming the nonce; the same nonce succeeds on the configured chain | Network response and nonce retry |
| Authenticated studio | Guide targets navigate to existing sections; wallet state matches profile | Test-account screenshot with private URLs hidden |
| Public/private URLs | Public checkout can be copied; OBS URL is explained as private | Manual copy/navigation check |
| OBS guide | Instructions match actual Browser Source setup; test command is not presented as proof of display | OBS screenshot/video |
| Logout/session expiry | Dashboard redirects to login; session no longer authorizes API mutations | Browser/network result |
| Locale switching | Route, guide text and security copy switch together | EN/PT-BR/ES check |
| Overlay transparency | No product background leaks into the OBS browser source | OBS preview |

## Commands

From `frontend`: `npm run test:i18n`, `npm run lint:product`, `node node_modules/typescript/bin/tsc --noEmit --incremental false`, `npm run build`.

From the repository root: `node --test tests/startup-checks.test.js` and `start-dev.bat --check`.

Record failures and fixes in `STATUS.md` and `docs/RETOMADA_E_ROADMAP.md`. Only replace a pending status with passed after executing that scenario on the revision being released.
