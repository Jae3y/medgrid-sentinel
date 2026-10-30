# Research & Technical Foundation

Research conducted during the sprint from primary/official sources where accessible; each finding lists its design implication. Full source register with URLs and confidence: [DATA_SOURCES.md](DATA_SOURCES.md).

## 1. Nigerian healthcare energy infrastructure

### 1.1 NSIA-LUTH Cancer Centre microgrid (verified anchor case)

- **Finding:** EM-ONE Energy, in partnership with RIPLE, announced (March 2025) a **300 kWp solar PV + 1.1 MWh battery** microgrid for the NSIA-LUTH Cancer Centre, Lagos — West Africa's largest oncology facility, where radiotherapy is highly outage-sensitive. *(Source: emone.energy/news/emone-riple, accessed Oct 30, 2026.)*
- **Caveat honoured:** this is an announced deployment; independently measured operational performance is not published. We cite it as a *precedent for architecture and financing structure*, not as measured performance data.
- **Design implications:**
  - Our default design scale (300 kWp PV) matches a real, currently-deployed Nigerian critical-care microgrid — the reference hospital design is realistic, not invented.
  - The financing narrative follows the real precedent: specialist clinical facilities adopt solar+storage through provider/developer structures (EaaS-style), not cash CapEx — hence the financial engine models ownership **and** EaaS **and** blended structures side by side.

### 1.2 Rural Electrification Agency (REA) healthcare electrification

- **Finding:** REA and World Bank-supported programmes have deployed solar-hybrid systems across Nigerian clinics and hospitals under Performance-Based Grant and Energizing Healthcare-style approaches. *Accessed via public programme summaries during the sprint; a systematic document review with installation-level data was out of the 48-hour scope (see RESEARCH_LIMITATIONS.md).*
- **Design implication:** the platform's blended-financing structure exists because real deployments combine concessional capital with service fees. The financial engine computes the **subsidy gap** explicitly (EaaS breakeven financing rate = 4.6%) instead of assuming a grant exists.

### 1.3 Grid reliability context

- **Finding:** 12+ national grid disturbances/collapses recorded in 2024 by industry and media counts (ICIR; APGC citing 162 since 2013); NERC quarterly reports officially recorded fewer (no total collapse in Q1–Q2 2025) — a documented discrepancy between official and observed events, which we surface rather than resolve.
- **Design implication:** the annualization mix (45 outage-days/yr) is a *conservative composite* of national disturbances plus local feeder trips, and it is an editable assumption with a dedicated sensitivity row (20 vs 70 days/yr).

## 2. Energy systems research embodied in the engine

| Topic | What the engine implements | Key assumptions (documented in TECHNICAL_METHODOLOGY.md) |
|---|---|---|
| Hospital load profiles | 16 circuits, 3 criticality tiers, hourly profiles, ~6,770 kWh/day for a 250-bed referral hospital | Illustrative reference profile, labelled; user-editable |
| PV generation | P = kWp × G/1000 × PR (PR 0.78 includes inverter; no double counting) | Synthetic bell-curve irradiance, explicitly labelled, seeded noise |
| Battery storage | Energy-based SOC with one-way lumped efficiencies (0.95/0.95), floor/reserve policy | LFP-typical limits; no within-run degradation |
| Diesel genset | Two-term fuel curve: 10 L/h + 0.27 L/kWh → ≈0.31 L/kWh at 250 kW | Matches medium-speed diesel datasheet ranges; min-load point 120 kW |
| Hybrid dispatch | Deterministic priority: PV → grid (peak-shave aware) → battery (reserve-aware) → genset (min-load top-up) → tiered shedding | 15-min steps; 1-step genset start bridged by battery |
| Grid outages | Day-scoped outage windows, reconnection stability delay (0.5 h) | No national-grid dynamics (out of scope, stated) |
| Power quality | Scenario-driven sags/swells/frequency events with protective islanding (IEEE 1159 *vocabulary*, simulated telemetry) | No harmonics/THD — deliberately omitted without a waveform model |
| EaaS economics | CRF-based service fee, fee-vs-savings breakeven financing rate, LCOE, NPV/IRR, sensitivity | Rates: 14% commercial financing, 18% discount, ₦1,550/$ |

## 3. Verified market prices (defaults, with sensitivity)

- **Grid tariff:** Band A ≈ ₦209.5/kWh (July 2024 order, held through 2025 per Discos) → default ₦210. **Verify current MYTO order at pilot.**
- **Diesel:** national ₦1,400–1,860/L through 2025-26 (NBS watch); Lagos ≈ ₦1,560/L early 2026 → default ₦1,550/L with ±30% sensitivity. Diesel ≈ 7× grid per kWh — the economic engine of the product.
- **CapEx:** $800/kWp PV, $280/kWh LFP storage, $120/kW inverter, 12% install/BOS → ±20% sensitivity.

## 4. What the research changed in the design

1. The NSIA-LUTH precedent moved the EaaS structure from "nice extra" to the **primary commercial pathway**, and forced the honest fee-vs-savings framing (breakeven 4.6% financing) rather than a hand-waved "EaaS makes it cheaper."
2. The official-vs-media grid-collapse discrepancy forced the annualization mix to be an **explicit editable assumption with its own sensitivity row**, not a buried constant.
3. Diesel price volatility forced sensitivity to be a first-class UI element, not a static table in a slide.
