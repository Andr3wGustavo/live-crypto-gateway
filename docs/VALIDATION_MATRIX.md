# Matrix UI acceptance checklist

Status: **pending browser execution for the October 2026 revision**. The owner authorized publication of the implementation with this limitation recorded. Static checks are not a substitute for these scenarios.

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
| Reduced motion | No automatic video/scene playback; explicit enable starts the scene | OS preference and result |
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
