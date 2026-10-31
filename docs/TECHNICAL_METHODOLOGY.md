# Technical Methodology

This is the overview; the equations are in [POWER_SYSTEM_MODEL.md](POWER_SYSTEM_MODEL.md), the statistics in [AI_AND_FORECASTING_METHODOLOGY.md](AI_AND_FORECASTING_METHODOLOGY.md), and the finance in [FINANCIAL_MODEL.md](FINANCIAL_MODEL.md).

## 1. Question being answered
*During a long transmission-line outage with a constrained diesel supply, how many hours of critical hospital service does each control strategy maintain, and how many litres does it burn?* That is Brief #13's metric. The secondary question: *what will the next outage look like, probabilistically, and what does the system cost and earn?*

## 2. Experimental design (fairness first)
- **One physics engine, four controllers.** The status quo, status quo + rationing, the fixed-rule hybrid and Sentinel share every equation. They differ only in decisions, which isolates the control software's contribution (Track 2).
- **Identical inputs** within each comparison: loads, weather (NASA POWER), outage windows, fuel tank, deliveries, delays, failures and seeds. The Monte Carlo uses common random numbers: each trial sample is drawn once and replayed for every controller.
- **The status quo is not a strawman.** Its generator is sized to the full peak (450 kW, larger than the hybrid's 400 kW) and gets the same fuel. A manual-rationing variant represents a competent hospital response without Sentinel.
- **Honest convergence test:** with unlimited fuel every strategy maintains 100% critical service. That's asserted in tests, so the claimed benefit only appears where the real constraint binds.

## 3. Real data
| Input | Source | Use |
|---|---|---|
| Hourly irradiance + temperature | NASA POWER (Maiduguri 2022–24; Lagos, Abuja, Kano, Port Harcourt, Accra, Nairobi, Houston 2024) | PV yield, replay weather, Monte Carlo weather, forecaster training/testing |
| Generator FTS / MTTF / repair | NREL/TP-5C00-76553, Tables 3–5 | Monte Carlo reliability classes; unit-test reproduction of the report's headline |
| Outage frequency | World Bank Enterprise Survey, Nigeria (32.8 outages/month) | Feeder regime calibration (1.08/day) |
| Outage event | TCN / press: Gombe–Damaturu–Maiduguri 330 kV, 22 Sep – 31 Oct 2024 | Replay window |
| Prices | NERC Band A ₦206.80/kWh; diesel ₦1,950/L (Oct 2026 retail); FX ₦1,335/$ (NFEM Oct 2026); BNEF 2025 storage benchmark | Economics |

## 4. Validation
- 89 automated tests (`npm test`): component equations against hand calculations; power balance for every strategy; diesel mass balance; transfer-gap physics; governor behaviour; NREL reproduction; Monte Carlo determinism, monotonicity and dominance; forecaster train/test separation; financial identities (NPV/IRR sign agreement, cumulative cash flow, year-12 replacement, re-pricing equals re-simulation).
- **Reproducibility:** `npm run results` regenerates every published number. The deck and one-pager scripts read only that file.
- **E2E:** a headless-Chrome walkthrough of every tab, with zero console errors.

## 5. Optimisation
Sizing is a transparent grid search (PV {150, 300, 450, 600} × storage {300, 600, 900, 1,200}). A design is feasible if Tier-1 holds for 100% and Tier 1+2 for ≥ 99% of replay hours at 6,000 L/week; feasible designs are ranked by 20-year NPV. Best NPV: 600 kWp + 300 kWh. The reference design keeps 600 kWh because the Monte Carlo shows the extra storage carries Tier-1 through generator repairs. This is a declared resilience preference, and the search is a heuristic, not a proven global optimum.

## 6. Known modelling limits
See [ASSUMPTIONS_AND_LIMITATIONS.md](ASSUMPTIONS_AND_LIMITATIONS.md). The main ones: an illustrative load profile; GHI used as POA; lumped battery efficiency without degradation dynamics (replacement in year 12 instead); a generator fuel curve from a typical two-term model, not a specific datasheet; no protection-coordination or transient (sub-second) modelling.
