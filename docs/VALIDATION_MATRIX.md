# Matrix UI acceptance checklist

Status: **partially executed for the October–November 2026 revision.** The cinematic landing layer, the site-wide Act II motion system, the Act III design pass, the Act V gaming/hybrid redesign and the Act VI cyan campaign with its side rail and glass surfaces were reviewed in Chromium headless at 1440×900, 1024×768 and 390×844 (Act I–III also at 1024×800) against the production bundle served on port 3001. The remaining scenarios and real wallet/OBS journeys are still pending. Static checks are not a substitute for these scenarios.

## Setup

1. Start with sufficient free memory using the root `start-dev.bat`; preview keeps payments disabled.
2. Open `/pt-BR`, then repeat key navigation in `/en` and `/es`.
3. For persistent scenarios, use `start-dev.bat --full` with Docker available and migrations applied.
4. Use dedicated test wallets and testnet assets. Never capture private overlay tokens or wallet secrets in screenshots.

## Browser scenarios

| Scenario | Expected result | Evidence to record |
|---|---|---|
| Hero scene, desktop | Blocks/packet change position while visible; simulation label remains clear | Short recording, browser/viewport |
| Full scene: Auto → pause → replay | Animation advances, freezes, then restarts | Recording including controls |
| Scroll mode | Native scrolling changes animation progress; wheel and touch scrolling remain native | Desktop and touch-sized viewport |
| Range control | Mouse and keyboard can explore start, middle and end states | Keyboard check |
| Reduced motion | No automatic video/scene playback; no intro, aurora, marquee or reveal animation; explicit enable starts the motion layer | OS preference and result |
| Cinematic intro | Four status lines animate; skip button, click, wheel, touch and Escape dismiss; returning in the same tab does not replay it | Desktop and touch-sized recording |
| Reveal, parallax and tilt | Sections fade in as they enter; hero/network parallax stays subtle; cards tilt with the pointer without hiding text | Desktop pointer recording |
| Simulated ticker | Numbers advance only while motion is enabled and the strip is labelled as illustrative, not live chain data | Screenshot and DOM check |
| Chapter rail | The rail stays visible on desktop, follows scroll and always keeps one chapter active, including the interlude; hidden below 1100 px | Screenshots at two scroll positions |
| Site motion toggle | Toggling in the landing or product shell updates `lc-motion-preference`, persists across reload and is shared by both surfaces | DOM/storage check |
| Async reveals | Metrics and panels mounted after the API response still reveal; the 2.4 s failsafe shows the page if hydration is slow | DOM opacity and screenshot |
| Chapter spine | Exactly one how-it-works chapter is current at a time, carries `aria-current="step"`, and the spine height follows the reading position | DOM check at two scroll positions |
| Studio loading skeleton | Placeholders expose `aria-busy` and are replaced by real values; no placeholder number is announced as data | Throttled-network screenshot and DOM check |
| Studio activity chart | Fourteen UTC buckets match confirmed ledger rows; the chart is `aria-hidden` and the ledger remains the accessible source | DOM comparison of counts |
| Studio scroll spy | The sticky nav highlights the section at the reading line, with exactly one `aria-current` link | Scroll check |
| Quick amounts | A chip sets the amount, updates the live fee split and is disabled during signing; keyboard focus remains visible | Screenshot and DOM check |
| Landing motion switch | The header control reports the true state through `aria-pressed`; pausing stops every video and CSS animation, stores the choice and survives reload; resuming restarts them | DOM check plus two-frame capture |
| Brand film band | Both loops autoplay only when visible and with motion on; the `AUTO LOOP` / `PAUSED` tag is truthful; the hero cube and mesh band remain blended layers with no player chrome or poster card | Screenshot and `currentTime` check |
| Reduced-motion notice | With the OS preference set, the page stays static, the hero explains why and its enable button starts motion; no notice appears for visitors who animate | Emulated `prefers-reduced-motion` check |
| Unified cyan surface | Landing, login, studio, checkout and overlay all render on the `#04090d` steel surface with cyan accents and Anton display type; no violet/purple rule remains | Screenshots of every route |
| Hero film and watermark | The cube loop enters as a graded, mask-faded layer, the outlined wordmark and token glyphs sit behind the copy, and the header logo stays legible over the film | Screenshot at 1440 and 390 px plus DOM opacity/mask check |
| Headline lock-in | Each glyph animates once from a blurred offset into place; the `h1` accessible name is the complete sentence; with motion off the headline is immediately final | DOM check and two-frame capture |
| Side navigation, desktop | The glass rail opens to 268 px and collapses to 84 px; the page is pushed, never covered; icons, labels, brand mark and CTA stay usable; the choice survives reload through `lc-sidenav-open` | Screenshots open/collapsed plus DOM width and padding check |
| Side navigation, mobile | Under 980 px a hamburger opens an opaque full-height drawer over a scrim; the button becomes an X; links close the drawer; Escape closes it and body scroll is locked while open | 390 px screenshots and keyboard check |
| Glass cards and buttons | Cards render as rounded glass surfaces (16–22 px) with a soft inner highlight; every button is a filled capsule in Inter Tight, with cyan gradient primary and dark glass secondary | Computed radius/font/background at 1440 and 390 px |
| Hero film integrity | The entrance film keeps a 16:9 ratio at every width, with no stretch or crop of the source, and the headline does not overflow in EN/PT-BR/ES | Ratio and `scrollWidth` check at three widths |
| Metric counters | Real values count up; assistive technology reads the final value once; with motion off the final value renders immediately | DOM check |
| Checkout fee split | Creator/fee bar matches the live fee basis points and amount; the timeline is visible in idle state and advances only with real payment state | Amount change and screenshot |
| Hidden/offscreen scene | Animation pauses; returning resumes without a large time jump | Browser performance check |
| 320/390 px and short desktop | Controls/text fit; blockchain can still be played; no horizontal page overflow | Screenshots |
| Demo alert | Themes match swatches; sound only plays after opt-in; demo never records funds | Screenshot and audio check |
| Login | Connection and signature steps clear; missing wallet/rejected signature show errors | Extension/browser versions |
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
