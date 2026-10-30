# Project Overview — MedGrid Sentinel

## 1. The problem (root cause, not symptom)

Nigerian hospitals operate on a grid that failed nationally 12+ times in 2024 (industry/media counts; NERC's official count is lower — both cited in [DATA_SOURCES.md](DATA_SOURCES.md)). The standard response is diesel: a generator sized to carry the whole facility, burning fuel that cost Lagos buyers ≈ ₦1,560/L in early 2026 — roughly 7× the Band A grid tariff of ≈ ₦210/kWh. Some facilities add solar. What none of them have is a way to **answer design and operations questions before money and outages answer them**:

- Will this PV+battery design actually hold the operating theatres through a 12-hour feeder outage — and if not, which hour fails and why?
- How many litres of diesel does the design displace, per naira of CapEx, at *this* facility's outage pattern?
- At 22:00 during an outage, how long can storage hold critical loads, and when must the generator be ready?

That is a **decision-quality** gap, not a hardware gap — and it is the root cause our solution addresses.

## 2. The product

**MedGrid Sentinel** = deterministic hospital-microgrid digital twin + predictive intelligence + honest economics.

1. **Digital twin** — a 15-minute-step simulation of PV, battery, inverter, grid, genset and 16 tiered hospital loads, with an interactive one-line diagram and full event log.
2. **Scenario lab** — ten deterministic stress scenarios (12-hour line outage, 24-hour blackout, generator failure, power-quality trips, undersized system…) with side-by-side continuity and diesel comparisons.
3. **Financial engine** — CapEx, payback, NPV/IRR, EaaS fee vs operating savings with a computed breakeven financing rate, 8-row sensitivity, and a sizing optimizer that ranks designs by total annualized cost subject to *both* brief metrics.
4. **Predictive intelligence** — demand forecasting with reported MAE/RMSE, battery-depletion projection, leave-one-out anomaly screening, rule-based recommendations whose inputs are printed next to each insight.

## 3. The evidence (brief scenario B — 12.5 h line outage, reproducible via `npm run results`)

| Metric | Sentinel system | Diesel-only baseline |
|---|---|---|
| Critical-service hours (T1+T2) | **12.50 / 12.50 h (100%)** | 12.50 h (but at 7× the energy cost) |
| Unserved Tier-1 energy | **0.00 kWh** | 0.00 kWh |
| Diesel litres (3-day run) | **763 L** | 1,295 L (−41%) |
| Operating cost (3-day run) | ₦4.10M | ₦5.39M (−24%) |
| Annualized diesel avoided | **23,910 L/yr** | — |
| Annualized CO₂ avoided | **64.1 t/yr** | — |
| Annual operating savings | **₦111.8M/yr** | — |

Economics, stated honestly: CapEx ₦760.4M ($491k) → simple payback **7.9 yr**, IRR **4.6%**, NPV **negative** (−₦326M) at an 18% commercial discount rate — and EaaS closes below **4.6% financing**. Sentinel's value includes telling hospitals *this* before they buy: the sizing optimizer shows, for example, that daytime outages are best served PV-first (400 kWp, no battery is optimal for the tested pattern) while evening outages flip the answer to storage-heavy designs. Decision quality includes knowing when *not* to buy batteries.

## 4. Engineering credibility

- 58 automated tests with hand-calculated expected values (physics, dispatch, constraints, finance, forecasting); deterministic replay verified.
- Production Next.js build verified; core engine has zero UI/network dependencies (runs headless via `tsx`).
- Power balance held at every step (tested to 1e-6 kW); battery floors, genset start-delay bridging, tiered shedding and reserve policy all unit-tested.
- Tier-1 deficits are **reported, never hidden** (tested) — the product's honesty is part of its engineering value.

## 5. What is deliberately NOT claimed

- No measured facility data (all profiles illustrative and labelled); no standards certification; no real-world control; no fabricated partners, pilots or accuracy claims. Full register: [ASSUMPTIONS_AND_LIMITATIONS.md](ASSUMPTIONS_AND_LIMITATIONS.md), [RESEARCH_LIMITATIONS.md](RESEARCH_LIMITATIONS.md).

## 6. Team-side orientation (handbook §14 roles)

Solo-entry friendly. Recommended complementary roles and coach-request questions: [COACH_PREP.md](COACH_PREP.md).
