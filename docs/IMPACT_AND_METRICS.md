# Impact & Metrics

All values come from `results/demo-results.json` (regenerate with `npm run results`). They are simulation outputs, not field measurements.

## 1. Brief #13 metric — Maiduguri 39-day line-outage replay

Inputs: NASA POWER measured weather (20 Sep – 1 Nov 2024); an illustrative 250-bed referral hospital (6,770 kWh/day; average Tier-1 86 kW, Tier-2 104 kW, Tier-3 93 kW); 6,000 L/week delivered in two drops (1.8× the simulated normal-year use of 3,360 L/week); a 10,000 L tank starting 60% full; diesel at ₦1,950/L.

| Metric | Status quo | + rationing | Fixed-rule hybrid | **Sentinel** |
|---|---:|---:|---:|---:|
| Critical-service hours maintained (of 936.5) | 449 | 638 | 757 | **937** |
| Tier-1 hours maintained | 451 | 639 | 798 | **937** |
| Diesel burned (L) | 39,000 | 39,000 | 39,000 | **36,159** |
| Diesel avoided vs status quo (L) | — | 0 | 0 | **2,841** |
| Litres per critical-service hour | 86.8 | 61.2 | 51.5 | **38.6** |
| Hours with an empty tank | 489 | 300 | 232 | **0** |
| Tier-1 interruption episodes | 12 | 11 | 21 | **0** |
| Load deliberately deferred (MWh) | 0 | 86.6 | 0 | 49.5 (Tier 3 only) |
| Generator run-hours | 451 | 639 | 588 | 383 |

The status quo and hybrid strategies burn *all* delivered fuel (39,000 L) and still go dark. Sentinel delivers twice the service on less fuel.

**With a generator trip at 150 run-hours (72 h repair):** Sentinel keeps 873 critical / 912 Tier-1 hours; the status quo keeps 451 / 452.

### Supply curve (critical hours / Tier-1 hours)

| L/week | Status quo | Rationing | Fixed-rule hybrid | Sentinel |
|---:|---|---|---|---|
| 0 | 69 / 69 | 99 / 99 | 315 / 426 | 169 / **762** |
| 2,000 | 192 / 195 | 276 / 276 | 459 / 551 | 303 / **937** |
| 4,000 | 322 / 324 | 455 / 456 | 610 / 675 | 500 / **937** |
| **6,000** | 449 / 451 | 638 / 639 | 757 / 798 | **937 / 937** |
| 8,000 | 577 / 579 | 813 / 814 | 898 / 908 | 937 / 937 |
| 10,000 | 703 / 704 | 937 / 937 | 937 / 937 | 937 / 937 |
| ≥ 14,000 | 937 / 937 | 937 / 937 | 937 / 937 | 937 / 937 |

Reading it honestly:
- **With ample fuel every option converges on service.** The value is then diesel: at ≥ 14,000 L/week the outage burns 80,676 L status quo, 52,109 L fixed-rule hybrid and 50,661 L Sentinel (−37%). Most of the saving is the solar and storage hardware; Sentinel's control adds a further 1,448 L and fewer generator hours.
- **Below ~5,000 L/week Sentinel deliberately trades Tier-2 hours to keep Tier-1 powered.** Its critical (T1+T2) hours are lower than the hybrid's, and its Tier-1 hours are 937 vs 551–675. That is a clinical prioritisation the product makes explicit. The tier mapping is configurable by the hospital.

## 2. The next outage — Monte Carlo (14 days, 300 trials, common random numbers)

Each trial samples the start time across Maiduguri 2022–24 weather, generator failure-to-start and time-to-failure (NREL/TP-5C00-76553), log-normal repair (mean 72 h), starting tank 30–100%, and deliveries with 30% late (≤ 96 h) and 10% missing.

| Generator class | NREL closed-form R(336 h), unlimited fuel | P(Tier-1 kept 14 days): status quo · hybrid · **Sentinel** | Mean Tier-1 h of 336 |
|---|---:|---|---|
| Well-maintained (FTS 0.13%, MTTF 1,662 h) | 81.6% | 0% · 4% · **91%** | 168 · 285 · **334** |
| Average, NRC data (0.66%, 636 h) | 58.6% | 0% · 3% · **78%** | 165 · 280 · **331** |
| Poorly maintained (1.65%, 61 h) | 0.4% | 0% · 0% · **11%** | 142 · 242 · **305** |

Even a poorly maintained generator leaves Sentinel's Tier-1 powered for 305 of 336 hours on average. The status quo manages 142.

## 3. Full measured year (Maiduguri 2024; feeder interruptions at WBES frequency + 39-day line outage; unconstrained fuel)

| | Status quo | Sentinel | Change |
|---|---:|---:|---:|
| Grid-outage hours | 2,667 | 2,667 | — |
| Diesel (L/yr) | 230,844 | 139,190 | **−91,654 (−39.7%)** |
| CO₂ (t/yr, 2.68 kg/L) | 619 | 373 | **−246** |
| Generator run-hours | 2,667 | 1,381 | −1,286 (−48%) |
| Tier-1 transfer breaks (~15 s each) | 259 | **0** | −259 |
| Grid import (MWh) | 1,721 | 1,103 | −618 |
| Solar to the bus (MWh) | 0 | 927 | — |
| Energy opex | ₦815.8M | ₦504.6M | −₦311.2M |

## 4. People and services reached

- One 250-bed referral hospital is about **91,250 bed-days a year** (250 × 365). Every ICU, theatre, maternity and cold-chain patient is on Tier-1 circuits that Sentinel keeps powered in the replay.
- **Affordability for the lowest-income users:** under EaaS, energy cost per bed-day *falls* from ₦8,940 to ₦8,258 while resilience rises, so nothing is passed on to patients.
- **Fleet** (10 site-years): diesel avoided per site runs from 6,942 L/yr (80-bed, Lagos) to 91,654 L/yr (250-bed, Maiduguri).

## 5. What is not claimed

No measured hospital data; no partner, pilot or clinical-outcome claim. Equipment failures avoided (Brief #12's metric) are not quantified; transfer breaks are counted as the closest computable proxy.
