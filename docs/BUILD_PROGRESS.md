# Build Progress Log

**Sprint:** Oct 30 – Nov 1, 2026 (Anneru IAS Global Energy Hackathon). All times local WAT (UTC+1) unless noted. Deadline: Sun Nov 1, 12:00 PM ET = **6:00 PM WAT** (post-DST). Internal upload target: **4:00 PM WAT**.

## Completed (sprint hours are nominal — work executed in a single concentrated session)

| Phase | Output | Verification |
|---|---|---|
| P0 Workspace audit | Empty repo confirmed; Node 24/npm 11/Python 3.12 available | `ls`, `git log` |
| P0 Requirements audit | Full 34-page handbook mapped; compliance doc written | `docs/OFFICIAL_HANDBOOK_COMPLIANCE.md` |
| P0 Brief selection | **Brief #13 locked**; decision matrix; metric definitions; discrepancy log | `docs/BRIEF_SELECTION_AND_STRATEGY.md` |
| P1 Research | NSIA-LUTH verified; grid-collapse counts (with official-vs-media discrepancy); Band A tariff; diesel prices | `docs/DATA_SOURCES.md` |
| P1 Engine | types/weather/facility/pv/battery/genset/dispatch/simulate/metrics | Power balance tested at every step |
| P1 Tests | **58 tests, all passing** (physics, dispatch, scenarios, finance, forecast, sizing) | `npm test` |
| P2 Financial/forecast/sizing | EaaS with breakeven financing rate; sensitivity; dual-metric sizing optimizer | Unit-tested; results snapshot |
| P2 Product UI | 7 views: Dashboard, Digital Twin, Scenario Lab, Financials, Intelligence, Brief & Metrics, Data & Sources | Production build + server smoke test (HTTP 200) |
| P2 Results snapshot | `results/demo-results.json` — canonical numbers | `npm run results` |
| P3 Docs | 25 documents (strategy, engineering, research, business, roadmap, risks, QA, scripts) | This directory |
| P3 Submission artifacts | Deck (pptx+pdf), one-pager (pdf+source), disclosure (txt+pdf), portal text, video prep pack (6 files) | `submission/` |
| P4 Self-assessment | Evidence-based rubric scoring (Impact 4 · Innovation 4 · Sustainability 4 · Feasibility 5 · Scalability 4) | `docs/OFFICIAL_RUBRIC_SELF_ASSESSMENT.md` |
| P4 Git | Coherent commits: engine/product → docs/submission | `git log` |

## Deliberately NOT done (per plan)

- **Demo and pitch videos** — recording reserved for the team (scripts, storyboard, runbook and checklist prepared; see `submission/video/`).
- No external portal upload (requires team authorization).
- No fabricated partners, pilots, team members or measured data.

## Engineering decisions worth remembering

1. **Day-scoped outage windows** — initial daily-repeat semantics tripled outage hours; fixed with a `day` field and tests updated to 12.5 h (12 h + 0.5 h reconnect delay).
2. **Leave-one-out z-scores** — conventional z can never flag a single outlier in n=7; switched method, documented in code.
3. **Sizing ranked by total annualized cost** (opex + CapEx×CRF) under dual-metric feasibility — diesel-only ranking always picked the biggest system.
4. **EaaS honesty fix** — fee compared against savings (not against blended energy cost, which was misleading); breakeven financing rate computed (4.6%).
5. **NPV negative at 18%** — kept and foregrounded; the pitch argues the resilience + concessional-capital case the model actually supports.

## Remaining user actions (require the team)

1. ~~Confirm team name/members~~ — DONE: solo entry, Jackson Sixtus Abetianbe (filled into summary, disclosure, portal text, deck).
2. **Kick-off (Thu Oct 29 8 PM ET / Fri 1 AM WAT):** obtain full Brief #13 text → reconcile `docs/BRIEF_SELECTION_AND_STRATEGY.md` §2 definitions.
3. **Review the product** (`npm run dev`), especially the Brief & Metrics and Financials tabs.
4. **Record the two videos** per `submission/video/` runbook; run `Final_Video_Checklist.md`.
5. **Upload all six deliverables** to the portal before **4:00 PM WAT Sunday** (deadline 6:00 PM WAT / 12:00 PM ET).
6. ~~Push the repository~~ — DONE: https://github.com/Jae3y/medgrid-sentinel (public).
7. Optional: request a coach in the Track-2 Slack channel using `docs/COACH_PREP.md`.
