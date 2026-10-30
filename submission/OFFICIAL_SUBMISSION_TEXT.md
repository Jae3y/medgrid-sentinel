# OFFICIAL SUBMISSION TEXT — portal-ready draft

Paste-ready text for the submission portal. Short and long variants are provided where field limits are unknown. Every number traces to `results/demo-results.json`.

---

## Project title

```
MedGrid Sentinel — Intelligent Hospital Microgrids
```

## Short description (≤ 280 chars)

```
A digital twin that designs and dispatches hospital microgrids for grid-failure resilience. For Brief #13: 100% critical-service continuity through a 12.5h line outage and 41% less diesel, computed by a deterministic, unit-tested simulation engine.
```

## Long description

```
MedGrid Sentinel is an intelligent hospital microgrid digital twin and energy resilience platform, built for Anneru IAS Global Energy Hackathon 2026 Brief #13 — Power for a city the grid can't protect (Track 2: Digital Solutions & AI; Setting B: non-residential healthcare).

THE PROBLEM. Nigeria's national grid failed 12+ times in 2024 (industry/media counts; NERC's official count is lower — both cited). Hospitals fall back on diesel at roughly 7× the Band A grid tariff (≈₦1,560/L vs ≈₦210/kWh, early-2026 Lagos/NBS levels). Facilities are buying solar and storage, but no tool tells them — before they spend — whether a design will hold operating theatres, ICU and the vaccine cold chain through the next 12-hour feeder collapse, or what it will truly cost. That decision-quality gap is the root cause we address.

THE SOLUTION. A deterministic 15-minute-step simulation of the full hospital energy system — solar PV, battery storage, grid, diesel genset and 16 tiered clinical loads (life-critical / clinical-priority / deferrable) — with priority dispatch, outage islanding, genset start-bridging and honest deficit reporting. On top: a ten-scenario stress lab, an Energy-as-a-Service financial engine, a dual-metric sizing optimizer, and predictive intelligence (demand forecasting with reported MAE/RMSE, battery-depletion projection, leave-one-out anomaly screening, rule-based recommendations). All AI is deterministic and explainable; no black box touches dispatch.

EVIDENCE (brief scenario — 12.5 h line outage, diesel-only baseline, reproducible via `npm run results`):
• Critical-service continuity: 12.50 / 12.50 hours — 100%, with 0.00 kWh unserved Tier-1 energy.
• Diesel: 763 L vs 1,295 L — 532 L avoided (−41%) in the 3-day run.
• Annualized (320 normal + 45 outage days): 23,910 L/yr diesel avoided, 64.1 t CO₂/yr avoided, ₦111.8M/yr operating savings, 563 critical-service hours maintained per year.
• Failure honesty: with the generator deliberately failed, the platform shows the exact pre-dawn hours solar+storage cannot cover.

FEASIBILITY. 58 automated unit tests with hand-calculated expected values (physics, dispatch, finance, forecasting); power balance verified at every step; deterministic replay; production Next.js build verified; the engine runs headless with zero UI/API dependencies. All facility profiles are illustrative and labelled as such — the engine accepts measured AMI data unchanged, and the 6–18-month roadmap is deliberately metering-first.

COST & AFFORDABILITY. Reference design (300 kWp PV + 600 kWh LFP + intelligent dispatch on the existing genset): ≈₦760.4M ($491k) CapEx; payback 7.9 yr; IRR 4.6%; NPV negative at an 18% commercial discount rate — stated plainly. The EaaS service model closes below a computed 4.6% financing rate, which is precisely how real Nigerian hospital solar (e.g., the NSIA-LUTH Cancer Centre 300 kWp/1.1 MWh microgrid, 2025) is financed. The platform computes the exact subsidy gap per hospital instead of assuming grants exist.

SCALABILITY. One configuration file per facility; tariffs, outage patterns, prices and climate are inputs. The sizing optimizer already demonstrates the core value: for daytime outages the optimal design is PV-first (no battery); for evening outages it flips to storage-heavy. The same engine runs a rural clinic today; the method extends to other African health systems and, with different economics, to US hospitals.

PRIOR WORK. All product features were built during the 48-hour sprint (see disclosure statement). No partners, pilots or measured facility data are claimed.
```

## Problem statement

```
Hospitals in cities the grid can't protect lose reliable power with every national grid disturbance and feeder collapse, falling back on diesel that costs ~7× grid electricity and threatens continuity of surgery, intensive care and the vaccine cold chain. Solar+battery systems are being bought without any way to verify, in advance, whether they will hold critical loads through a real outage — or at what cost per litre of diesel avoided.
```

## Solution

```
A hospital microgrid digital twin: a deterministic 15-minute simulation of PV, battery, grid, genset and tiered clinical loads, with a ten-scenario stress lab, an EaaS financial engine, a dual-metric sizing optimizer and explainable predictive intelligence — computing Brief #13's two metrics (critical-service hours maintained; diesel litres avoided) before money is spent and while the lights are on.
```

## Innovation

```
Existing tools size solar with averages; existing dashboards show the present. Sentinel's contribution is decision quality under failure conditions: tiered clinical-load dispatch with honest deficit reporting, outage-pattern-aware sizing (daytime outages → PV-first; evening outages → storage-heavy — the optimizer proves both), and an economics engine that computes the concessional-financing breakeven (4.6%) rather than hand-waving EaaS. Every claim is reproducible from a tested, deterministic engine.
```

## Impact

```
Brief metric 1: 12.50/12.50 hours of critical-service continuity (100%) through the brief's line-outage scenario; 563 such hours maintained per year annualized. Brief metric 2: −41% diesel in the scenario window; 23,910 L/yr avoided; 64.1 t CO₂/yr; ₦111.8M/yr operating savings for the reference hospital. Zero unserved Tier-1 energy in every non-failure scenario, with failures (generator fault) shown honestly.
```

## Sustainability & affordability

```
Diesel displacement (−41% outage-day, −23,910 L/yr), maintainable locally (LFP storage + standard gensets + software), and a lifetime-cost case: payback 7.9 yr against a 20–25 yr PV life. Affordability is quantified, not asserted: ₦1,764/bed-day service cost; EaaS closes only below 4.6% financing — the computed gap that REA-type/DFI programmes exist to fill; sensitivity to diesel ±30%, CapEx ±20%, outage frequency 20–70 days/yr included.
```

## Feasibility

```
Working POC: Next.js application + TypeScript engine, 58 passing unit tests with hand-checked values, verified production build, deterministic replay, results snapshot reproducible via `npm run results`. Realistic inputs (labelled synthetic profiles, verified market precedents, documented standards context). Risks named in a register; the pilot pathway is metering-first by design.
```

## Scalability

```
Configuration-driven: one facility = one config object (loads, tariffs, prices, outage pattern, climate). Demonstrated: rural-clinic profile and evening-vs-daytime outage optimization run on the same engine unchanged. Country adaptation = parameter changes + data collection; the method (tiered loads, dual-metric sizing, EaaS breakeven) is the export.
```

## Limitations (honest)

```
All facility data is illustrative and labelled (engine accepts measured data unchanged); simulated PQ telemetry; no harmonics/THD; no within-run storage degradation; single-bus electrical model; decision-support only — no real-world control; full official brief text pending kick-off release (definitions logged for reconciliation).
```

## Demo video

`MedGridSentinel_Brief13_Demo.mp4` (3–5 min) — screen demo of the brief scenario, engine decisions, honest-failure case, live reconfiguration and economics.

## Pitch video

`MedGridSentinel_Brief13_Pitch.mp4` (≤5 min) — problem → solution → evidence → cost & feasibility → scale → team & ask.

## Team

```
[TEAM NAME] — [members and roles to confirm at submission; solo entry permitted per handbook §8]
```

## Build files

```
Repository (GitHub link) — src/engine (deterministic core + 58 tests), src/app (product UI), docs/ (24 documents), results/demo-results.json (canonical numbers, reproducible via `npm run results`), submission/ (all artifacts).
```

## Disclosure statement

See `submission/DISCLOSURE_STATEMENT.txt` (also entered in the portal's short form).
