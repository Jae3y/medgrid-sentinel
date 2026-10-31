# Build Progress & Deadline Countdown

**Deadline:** Sun 1 Nov 2026, 12:00 PM ET = **17:00 UTC = 18:00 WAT** (US DST ends 02:00 ET that morning). **Internal upload target: 16:00 WAT.**
**Hour-32 feature freeze:** Sat 31 Oct ~8:00 PM ET = Sun 1 Nov 01:00 WAT.

## Timeline (git history is the source of truth)
| When (WAT) | Hour | Work |
|---|---|---|
| Fri 30 Oct 17:46 | ~0.8 | Initial commit (sprint opened 17:00 WAT) |
| Fri 30 Oct 19:31 – Sat 06:57 | 2–14 | **Day 1 (ZCode):** 3-day deterministic engine, 58 tests, Next.js UI, financial/sizing/forecast modules, docs, first deck/one-pager/disclosure, E2E walkthrough, design pass |
| Sat 31 Oct 13:38 | ~20.6 | **Day 2 (Claude Code) — Engine v2:** NASA POWER measured weather, fuel logistics, 4 strategies on identical hardware, fuel-runway governor, transfer-break physics, Maiduguri 39-day replay, Monte Carlo with NREL reliability, held-out solar forecaster, full-year 20-yr economics, sizing, 89 tests |
| Sat 31 Oct 14:30 | ~21.5 | Product v2 UI: Line Outage, Resilience Lab, Fleet, full-year Financials, SMS/USSD, offline PWA static export, E2E |
| Sat 31 Oct afternoon | ~22–24 | Redesign: night-shift design system, Archivo type, grouped navigation, live 3D microgrid (react-three-fiber) bound to engine state; deck, one-pager, disclosure regenerated from `results/demo-results.json` |
| Sat 31 Oct evening | 24–32 | Documentation suite, judge Q&A, rubric, portal text, video scripts and runbook; final verification |

## Verification status (latest)
- `npm test`: **89/89 passing**
- `npm run build`: static export OK (≈ 454 kB first load; 3D lazy-loaded)
- `npm run e2e`: every tab driven in headless Chrome, **0 console errors**, 0 px mobile overflow; 3D status-quo vs Sentinel captured
- `npm run results`: regenerates every published number

## Engineering decisions worth remembering
1. **Isolate the software's value:** one physics engine, four controllers, identical inputs. Convergence with ample fuel is asserted in a test.
2. **Transfer break as a time gap:** the first version let an oversized generator "absorb" the 15 s start. That was wrong and favoured us, and it was fixed (all tiers dark for 15 s).
3. **Annual economics assume a serviceable generator:** an early run priced scenario G (generator failed), so the baseline burned 0 L. Fixed: failures belong to resilience, not to the cost baseline.
4. **Opportunistic solar:** a governor bug left wards dark at noon with a full battery when the generator was down. Fixed: surplus PV now always serves deferred loads.
5. **Real FX:** switched ₦1,500 → ₦1,335/$ (NFEM Oct 2026) once verified.

## Remaining user actions
1. Review the app (`npm run build && npm run serve`, then http://localhost:3003).
2. Record the demo and pitch videos per `submission/video/`.
3. Push the latest commits (`git push`); optionally publish a live link.
4. Upload all six deliverables before 16:00 WAT.
