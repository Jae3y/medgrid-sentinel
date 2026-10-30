# System Architecture

## 1. High-level

```mermaid
flowchart LR
  subgraph UI["Next.js 15 · React 19 · Tailwind · Recharts"]
    D[Dashboard] T[Digital Twin] S[Scenario Lab] F[Financials] I[Intelligence] B[Brief & Metrics] R[Data & Sources]
  end
  ST[(Zustand store — config, sim results, economics)]
  subgraph ENGINE["Deterministic simulation core — zero UI/network deps"]
    SC[scenarios / configs] --> SIM[simulate.ts orchestrator]
    SIM --> DSP[dispatch.ts — 15-min state machine]
    DSP --> PV[pv.ts] & BAT[battery.ts] & GEN[genset.ts] & GRID[grid + PQ rules]
    SIM --> MET[metrics aggregation]
    FIN[financial.ts] --> SIM
    FCS[forecast.ts] --> MET
    SZ[sizing.ts] --> SIM & FIN
  end
  UI --> ST --> ENGINE
  RES[("results/demo-results.json")] <-- npm run results / tsx
```

The engine is a pure TypeScript library: no React, no network, no external AI API. It runs identically in the browser (UI) and headless under `tsx` (results snapshot, tests) — which is what makes every number in the documentation reproducible.

## 2. Module boundaries

| Module | Responsibility | Key exports |
|---|---|---|
| `types.ts` | All contracts: configs, step results, metrics | `SystemConfig`, `StepResult`, `SimResult` |
| `weather.ts` | Synthetic labelled irradiance + seeded PRNG | `dailyIrradiance`, `mulberry32` |
| `facility.ts` | Illustrative load library, tier demand | `REFERENCE_HOSPITAL`, `tierDemandAt` |
| `pv.ts` | PV DC→AC model with inverter cap | `pvPowerAc` |
| `battery.ts` | SOC bookkeeping, power limits, floors | `applyCharge/Discharge`, `maxCharge/DischargePowerNow` |
| `genset.ts` | Two-term fuel model | `fuelLph` |
| `dispatch.ts` | One-step state machine (grid/island/genset/shedding/costs/events) | `stepSim`, `initialRuntime` |
| `simulate.ts` | Multi-step orchestration, metrics, per-day rollup, baseline builder | `runSimulation`, `buildBaselineConfig`, `compareAgainstBaseline` |
| `financial.ts` | CapEx, annualization, NPV/IRR, EaaS + breakeven, sensitivity | `evaluateEconomics`, `sensitivity` |
| `forecast.ts` | Demand forecast evaluation, depletion projection, anomalies | `evaluateForecast`, `forecastDepletion` |
| `sizing.ts` | Dual-metric grid-search optimizer | `searchSizing` |
| `scenarios.ts` | Default design + 10 named scenarios | `defaultConfig`, `SCENARIOS` |

## 3. Data flow (one user interaction)

1. User edits an input (e.g. battery kWh) on the Digital Twin tab.
2. `store.updateConfig` clones the config, applies the mutation, then synchronously:
   - `runSimulation(config)` → 288 steps (3 days × 96)
   - `runSimulation(buildBaselineConfig(config))` → diesel-only baseline
   - `evaluateEconomics(config, fin)` → annualized economics
3. All seven tabs re-render from the new results; the playback scrubber steps through the same `StepResult[]`.
4. Nothing is stored server-side; no credentials exist; the app is fully static after build.

## 4. Determinism & reproducibility

- Single seeded PRNG (`mulberry32`) for synthetic noise; energy math has no randomness at all.
- `runSimulation` twice on the same config → byte-identical step arrays (unit-tested).
- `npm run results` regenerates `results/demo-results.json` — the canonical numbers file the docs and deck quote.

## 5. Security & safety boundaries

- No backend, no secrets, no patient data, no external APIs in the POC.
- The engine is decision-support only; no control interfaces exist by design.
- Next.js runs with strict TypeScript; inputs are clamped at the UI and validated by construction in the engine.

## 6. Deployment

Vercel-compatible static build (`next build` verified, static prerender). Repository + `results/` JSON constitute the build-files deliverable.
