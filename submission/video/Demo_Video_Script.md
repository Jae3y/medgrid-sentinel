# Demo Video Script — 3–5 minutes (target 4:00)

**File name:** `MedGridSentinel_Brief13_Demo.mp4` · 1080p or lower · < 500 MB · English · screen recording + voice-over (face optional)
**Golden rule:** every number below is produced by the running application — if a number on screen differs, STOP and re-run the app; do not narrate a different number.

## Setup (before recording)

1. `npm run build && npm start` → open `http://localhost:3000`.
2. Browser at 1920×1080, 100% zoom, dark theme as built. Close other tabs. Do-not-disturb on.
3. Scenario Lab → click **Scenario J · Brief #13 — city feeder collapse** (the active scenario chip in the sidebar must read "Scenario J").
4. Microphone test: 5-second recording, playback.

## Shot list with narration (read verbatim; timings are targets)

### 0:00–0:25 — What you're looking at (Dashboard)
- **Screen:** Dashboard tab, playback slider at ~08:00 on Day 2 (outage day). Press **Play** briefly so flows animate.
- **Say:** "This is MedGrid Sentinel — a digital twin of a 250-bed hospital microgrid: solar, battery, the grid and a diesel generator, dispatching around the loads that keep patients alive. Everything you'll see is computed live by a deterministic 15-minute simulation engine — the same engine that passes 58 automated unit tests."

### 0:25–1:00 — The brief, and the outage hits (Scenario Lab → run)
- **Screen:** Scenario Lab. Click **Run scenario** on J. Then open the event log.
- **Say:** "We compete on Handbook Brief #13 — power for a city the grid can't protect. Its metrics: hours of critical service maintained during a line outage, and diesel litres avoided. Here's the brief scenario: at 06:00 the city feeder collapses. Watch the event log: the tie opens, the battery assumes the bus instantly, and the generator comes online fifteen minutes later — the battery bridged the start. Critical load tiers: theatres, ICU, cold chain first. Deferrable loads shed first."

### 1:00–1:45 — Inside the engine's decisions (Dashboard charts)
- **Screen:** Dashboard, Day 2 view. Point at the demand-vs-supply chart: solar area, battery discharge, generator slice; then the SOC chart.
- **Say:** "Through the morning the battery carries the site down from its reserve. As the sun climbs, solar takes over and recharges storage. The generator only runs when the maths says it must — and it runs in its efficient band, not wet-stacking. By 18:00 the grid returns; Sentinel waits out a half-hour stability window before re-closing the tie — anti-islanding behaviour, not wishful switching."

### 1:45–2:45 — The honest numbers (Brief & Metrics tab)
- **Screen:** Brief & Metrics tab. Read the comparison rows aloud while pointing.
- **Say:** "The results, straight from the engine: critical service maintained — twelve point five zero of twelve point five islanded hours, one hundred percent, zero unserved life-critical energy. Diesel: 763 litres against the diesel-only baseline's 1,295 — 41 percent avoided in this window. Annualized: nearly 24 thousand litres and 64 tonnes of CO₂ a year, and 112 million naira in operating savings. And note scenario G in the lab: take the generator away and Sentinel shows you exactly where solar-plus-storage gives way — the pre-dawn hours. We report deficits; we don't hide them."

### 2:45–3:30 — It's a design tool, not a slideshow (Digital Twin → live change)
- **Screen:** Digital Twin. Change **Battery capacity** from 600 to 300 kWh. Show KPIs/charts update; then set it back. Then Financials tab: point at payback 7.9 years and the EaaS breakeven 4.6%.
- **Say:** "This isn't a fixed demo. Change any input — halve the battery — and the twin, the continuity metrics and the economics all recompute. That matters: for daytime outages our optimizer says buy solar, not batteries; for evening outages it flips. Sentinel tells a hospital what NOT to buy, too. The financial engine is equally blunt: payback 7.9 years, and the service model only closes below 4.6 percent financing — which is exactly the concessional-capital conversation real Nigerian hospital solar needs."

### 3:30–4:00 — Close
- **Screen:** Brief & Metrics tab or Dashboard.
- **Say:** "MedGrid Sentinel: hospital microgrids made predictable, before the money is spent and before the feeder fails. Built this weekend — engine, twin, scenario lab, financials and intelligence — with every number reproducible from the repository. The full method, assumptions and limitations ship with the submission."

## Recording checklist (quick)

- [ ] One continuous take per section; 4–6 total takes acceptable
- [ ] Cursor movements slow and deliberate; pause 1 s before each click
- [ ] Numbers on screen match script **exactly** (763 L / 1,295 L / −41% / 12.50 h / 100% / 0.00 kWh / 23,910 L/yr / 64.1 t / ₦111.8M / 7.9 yr / 4.6%)
- [ ] Audio level consistent; no keyboard noise; ≤ 500 MB; 1080p
- [ ] First 10 seconds re-watched before accepting the take
