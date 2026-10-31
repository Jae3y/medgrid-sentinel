# AI, Forecasting & Probabilistic Methods

Principle: **nothing safety-critical is a black box.** Dispatch is deterministic and explainable. Learned models only produce *forecasts* and *probabilities* that the deterministic governor consumes with calibrated caution.

| Layer | Method | Data | Validation |
|---|---|---|---|
| Solar day-ahead forecast | Statistical ML: OLS blend of 3-day mean + climatology | NASA POWER Maiduguri, train 2022–23, test 2024 | Held-out MAE/RMSE/skill |
| Governor solar confidence | Empirical calibration | Held-out 2024 residuals | Coverage of k × forecast |
| Resilience probabilities | Monte Carlo | NREL generator statistics × 3 measured weather years × supply shocks | Determinism, monotone survival, NREL closed-form reference |
| Demand forecast & anomalies | Statistical (hybrid prior; leave-one-out z-scores) | **Synthetic** until pilot metering | Labelled synthetic everywhere |
| Generative AI / LLM | **Not used in the product** | — | No message on screen or by SMS is LLM-written; all are generated from engine state |

## 1. Solar forecaster (`forecast.ts: evaluateSolarForecast`)
- Target: next-day insolation (kWh/m²/day). Features: the 3-day persistence mean p₃ and the climatology c (the same ±7-day window averaged over the training years).
- Model: ŷ = a·p₃ + b·c + e, fitted by least squares on **2022–2023 only**: a = 0.192, b = 0.830, e = −0.131.
- Held-out 2024 (363 scored days, mean 5.75 kWh/m²/day):

| Model | MAE | RMSE | Skill vs climatology |
|---|---:|---:|---:|
| Persistence (tomorrow = today) | 0.730 | 1.131 | −24.1% |
| 3-day persistence mean | 0.644 | 0.950 | −4.3% |
| Climatology | 0.632 | 0.911 | 0 |
| **Learned blend** | **0.612** | **0.886** | **+2.8%** |

The honest reading: the blend clearly beats naive persistence (−22% RMSE) and modestly beats climatology. Sahel day-to-day solar variability is low outside the rainy season, so climatology is strong.

## 2. Calibration of the governor
The governor counts only k × forecast solar. On held-out 2024 the share of days with actual ≥ k × (3-day forecast) was: k = 0.5 → 98.1%, 0.6 → 96.4%, **0.7 → 94.5%**, 0.8 → 91.7%, 0.9 → 81.8%, 1.0 → 54.8%. **k = 0.7** therefore gives about a 1-in-18-day shortfall risk on the solar term alone, and the 24 h delivery margin plus the 10% restore hysteresis absorb that. The live governor uses the 3-day mean, which is causal and needs no climatology table for new sites. Wiring the learned blend in is a roadmap item, worth about 7% RMSE.

## 3. Monte Carlo resilience (`resilience.ts`)
Per trial: dataset ∈ {2022, 2023, 2024}, uniform start day and hour; FTS ~ Bernoulli(p_FTS); run-hours to failure ~ cumulative Exp(MTTF); repair ~ LogNormal(mean 72 h, σ 0.6); initial tank ~ U(30%, 100%); each delivery missed with p = 0.10, otherwise late with p = 0.30 by U(0, 96] h. The same sample is replayed for every controller (common random numbers). Outputs: survival S(h) = P(no sustained Tier-1 interruption before hour h), the distribution of critical hours (p10/p50/p90), mean diesel and run-hours. A sanity reference is NREL's closed form R(t) = OA·(1−FTS)·e^(−t/MTTF), plotted alongside.

## 4. Demand forecast & anomaly detection (synthetic)
These are kept from the Day-1 build and clearly labelled: a hybrid forecast (50% recent history + 50% schedule prior) is scored on a held-out *synthetic* day, and anomaly screening uses leave-one-out z ≥ 3. They stay labelled as synthetic until circuit-level metering exists (pilot months 1–3), when they are retrained on real data.

## 5. What would make the AI stronger (roadmap, not claimed)
Real AMI data → gradient-boosted demand forecasting; outage-hazard models from TCN/DisCo logs; the blend forecaster in the governor; a probabilistic (chance-constrained) governor using the full residual distribution instead of a single k.
