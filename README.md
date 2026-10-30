# MEDGRID SENTINEL

**Intelligent Hospital Microgrids. Predictive Energy Resilience. Uninterrupted Critical Care.**

MedGrid Sentinel is an intelligent hospital microgrid digital twin and energy resilience platform. It lets healthcare facilities and energy-service providers model, simulate and optimize hybrid power systems — solar PV, battery storage, grid supply and diesel generation — against the loads that actually matter in a hospital: operating theatres, intensive care, medical cold chain and emergency services.

Built for the **Anneru IAS Global Energy Hackathon 2026** (October 30 – November 1, 2026).

- **Official problem brief:** #13 — *Power for a city the grid can't protect*
- **Challenge track:** 2 — Digital Solutions & AI
- **Setting:** B — Non-residential (healthcare)
- **Success metrics (Handbook Appendix B):** hours of critical service maintained during a line outage · diesel litres avoided

## What it does

| Capability | Where |
|---|---|
| Executive energy dashboard with live power flows, alerts and 15-minute resolution charts | Dashboard tab |
| Configurable hospital microgrid digital twin (PV, battery, inverter, genset, grid, 16 tiered loads) | Digital Twin tab |
| Ten deterministic stress scenarios including the brief's line-outage scenario | Scenario Lab tab |
| Energy-as-a-Service financial engine: CapEx, payback, NPV/IRR, EaaS fee vs savings, sensitivity, sizing optimizer | Financials tab |
| Demand forecasting (MAE/RMSE reported), battery depletion projection, anomaly screening, rule-based recommendations | Intelligence tab |
| The locked brief, its verbatim metrics and baseline-vs-Sentinel comparison | Brief & Metrics tab |
| References, assumptions and limitations, stated plainly | Data & Sources tab |

## Headline results (brief scenario — 12.5 h line outage, all values from the simulation engine)

- **Critical-service continuity: 12.50 / 12.50 h (100%)** with **0.00 kWh unserved Tier-1 energy**
- **Diesel: 763 L vs 1,295 L diesel-only baseline (−41%)** over the 3-day run
- **Annualized:** ₦111.8M/yr operating savings, 23,910 L/yr diesel avoided, 64.1 t CO₂/yr avoided
- **CapEx ≈ ₦760M ($491k)** → simple payback **7.9 yr**, IRR 4.6% at commercial Nigerian rates; EaaS closes below **4.6% financing** — computed honestly, shown to the naira

These numbers are **reproducible**: `npm run results` regenerates `results/demo-results.json` from the engine.

## Quick start

```bash
npm install        # Node ≥ 18.17
npm test           # 58 engine tests (vitest) — physics, dispatch, finance, forecasting
npm run results    # regenerate the official results snapshot
npm run dev        # http://localhost:3000
npm run build && npm start   # production build (verified)
```

## Architecture

```
src/engine/     Deterministic simulation core (no UI, no network, fully unit-tested)
  types.ts        Configuration & result contracts (kW / kWh, 15-min steps)
  weather.ts      Synthetic, clearly-labelled irradiance scenarios (seeded PRNG)
  facility.ts     Illustrative 250-bed hospital load library (16 tiered circuits)
  pv.ts battery.ts genset.ts   Physics primitives
  dispatch.ts     Priority dispatch: PV → grid → battery → genset → tiered shedding
  simulate.ts     Orchestrator + diesel-only baseline builder
  financial.ts    CapEx, annualization, NPV/IRR, EaaS, sensitivity
  forecast.ts     Demand forecast, depletion projection, leave-one-out anomaly z-scores
  sizing.ts       Grid-search optimizer (dual-metric feasibility, ranked by annualized cost)
  scenarios.ts    Default design + 10 named scenarios
src/app + src/components/   Next.js 15 / React 19 / Tailwind / Recharts UI (7 tabs)
src/lib/        Zustand store, formatting, deadline utilities
scripts/        generate-results.ts — official numbers snapshot
docs/           Full engineering, research, compliance and submission documentation
submission/     Pitch deck, one-page summary, disclosure, portal text, video prep pack
```

## Honest-use statement

This is a **decision-support simulation**, not a control system. It must never be connected to real hospital protection circuits. Facility loads, tariffs and prices are illustrative defaults, labelled as such and fully editable; the engine itself is data-agnostic and accepts measured facility data unchanged. Complete limitations: [docs/ASSUMPTIONS_AND_LIMITATIONS.md](docs/ASSUMPTIONS_AND_LIMITATIONS.md).

## Documentation index

See [docs/README.md](docs/README.md) for the full register; [submission/](submission/) for the official deliverables (deck, one-page summary, disclosure, portal text and the video preparation pack — the videos themselves are recorded by the team, per plan).
