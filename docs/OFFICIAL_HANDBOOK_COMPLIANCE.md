# Official Handbook Compliance

Mapping of the Innovator Handbook (`GEH_Innovator_Handbook.pdf`, 34 pp.) to this project. The handbook is the source of truth; where the master execution prompt or external research differed, the handbook was followed and the discrepancy logged in [BRIEF_SELECTION_AND_STRATEGY.md](BRIEF_SELECTION_AND_STRATEGY.md) §4.

## Section 5 — Problem Statement, Briefs & Tracks

| Requirement | Status |
|---|---|
| One problem brief of the 16 | ✅ Brief #13 (locked; decision matrix documented) |
| One challenge track of 5 | ✅ Track 2 — Digital Solutions & AI |
| One setting (A/B) | ✅ B — Non-residential (healthcare) |
| Success metrics read by judges first | ✅ Verbatim metric extracted; every feature mapped to it; metric definition documented |
| Solutions realistic within 6–18 months, adaptable across contexts | ✅ [DEPLOYMENT_ROADMAP.md](DEPLOYMENT_ROADMAP.md); [BUSINESS_MODEL.md](BUSINESS_MODEL.md) § international adaptation |

## Section 6 — Framing Your Response (questions every submission must answer on screen)

| Question | Where answered |
|---|---|
| Who, specifically? (user ≠ payer) | Brief & Metrics tab; [BUSINESS_MODEL.md](BUSINESS_MODEL.md) §1 |
| What fails today, and why? (root cause) | Brief & Metrics tab; [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) §1 |
| What changes in 6–18 months? | [DEPLOYMENT_ROADMAP.md](DEPLOYMENT_ROADMAP.md); pitch deck slide 4 |
| What does it cost? (unit cost + payment path) | Financials tab; ₦760.4M CapEx; EaaS fee ₦161M/yr; ₦1,764/bed-day; deck slide 4 |
| How does it travel? | [BUSINESS_MODEL.md](BUSINESS_MODEL.md) §5; deck slide 5 |
| What could go wrong? | [RISK_REGISTER.md](RISK_REGISTER.md); deck slide 5; one-pager risk line |
| What did you build this weekend? | [BUILD_PROGRESS.md](BUILD_PROGRESS.md); disclosure statement; pitch closing |

## Section 7 — 48-hour sprint plan

Features freeze honoured by construction: the scope shipped at hour ~4 of the sprint is the P0/P1 set defined in the master prompt; no speculative features were added after freeze planning. Simulation-first order followed (engine before dashboard, per §7 Day-1 guidance). Determinism and coach-checkpoint material prepared in [COACH_PREP.md](COACH_PREP.md).

## Section 8 — Eligibility & process

- 18+, one team, English submissions, no fees — team-level confirmations (see BUILD_PROGRESS § user actions).
- Solo entry permitted; handbook-recommended cross-disciplinary roles mapped in [COACH_PREP.md](COACH_PREP.md) § roles.

## Section 10 — Deliverables & submission (six deliverables)

| # | Deliverable | Requirement | Artifact | Status |
|---|---|---|---|---|
| 1 | Demo video | MP4/link, 3–5 min, shows the actual POC | `submission/video/Demo_Video_Script.md` + runbook | 📝 prepared — **recording reserved for the team** |
| 2 | Pitch video | MP4/link, ≤ 5 min, problem/value/demonstration | `submission/video/Pitch_Video_Script.md` + runbook | 📝 prepared — **recording reserved for the team** |
| 3 | Pitch deck | PDF, ≤ 5 slides | `submission/MedGrid_Sentinel_Pitch_Deck.pptx` + `.pdf` | ✅ generated |
| 4 | One-page summary | PDF, exactly 1 page, Appendix A fields | `submission/MedGrid_Sentinel_One_Page_Summary.pdf` (+ editable source) | ✅ generated |
| 5 | Build files | Link (GitHub/Drive) | this repository; `docs/`, `results/demo-results.json` | ✅ ready to push/upload |
| 6 | Disclosure statement | Short form in portal | `submission/DISCLOSURE_STATEMENT.txt` / `.pdf` | ✅ drafted |

Videos: MP4 or link, 1080p or lower, < 500 MB, links open without sign-in, English — encoded in `submission/video/Screen_Recording_Runbook.md` and `Final_Video_Checklist.md`.

Judging-review order honoured (brief → demo → pitch → summary → disclosure → build files): all six artifacts tell one consistent story sourced from `results/demo-results.json`.

## Section 11 — Judging criteria

Official formula respected: `Total = 20 × (0.25·Impact + 0.25·Innovation + 0.25·Sustainability + 0.15·Feasibility + 0.10·Scalability)`. Evidence-based self-assessment (never self-awarded 5s without evidence): [OFFICIAL_RUBRIC_SELF_ASSESSMENT.md](OFFICIAL_RUBRIC_SELF_ASSESSMENT.md).

Track-specific strong evidence (p. 18, Digital Solutions & AI): working demo ✅ · real or realistic data (clearly-labelled synthetic; engine accepts measured data) ✅ · offline/low-bandwidth handling (no external API dependency in core) ✅ · feature-phone/USSD reach — ❌ out of POC scope, roadmap item (documented honestly).

## Section 13 — Tools, AI, disclosure

AI tools, open-source code and public datasets are permitted with licenses and disclosure ✅ — complete disclosure drafted; AI usage disclosed per-function ([AI_AND_FORECASTING_METHODOLOGY.md](AI_AND_FORECASTING_METHODOLOGY.md) § transparency).

## Section 14 — Conduct

No fabricated data, partners, pilots or team members anywhere in this package. Synthetic/illustrative values are labelled as such everywhere they appear. No personal data processed.

## Appendix A — Solution outline template

Filled from the live model on the Brief & Metrics tab and in the one-page summary.

## Appendix B — Problem briefs

Brief #13 metrics govern; full brief text pending kick-off release (logged).
