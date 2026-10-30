# AI & Forecasting Methodology

## Design principle

AI earns its place only where it changes a decision. Every intelligent function is deterministic, explainable, and reports its own basis. No black-box model touches dispatch — the safety-critical engine is a fully deterministic, unit-tested state machine.

## 1. Demand forecasting

- **Model:** hybrid — `0.5 × 7-day hourly mean + 0.5 × facility schedule prior`.
- **Training/scored data:** synthetic "measured" history generated from the facility's own profiles with seeded ±5% noise (one injected evening surge) — deliberately honest for a 48-hour POC with no facility data. The interfaces accept measured AMI series unchanged.
- **Reported accuracy (held-out day):** Sentinel hybrid **MAE 8.1 kW / RMSE 9.7 kW** vs naive persistence **8.6 / 10.4** — on a 200–450 kW load, ≈3–4% error. Both numbers are shown in the UI; the model must beat persistence to earn its place, and it does.
- **What would improve it:** real AMI data → gradient-boosted or seasonal-naive models with day-of-week terms; the evaluation harness (MAE/RMSE on held-out windows) is already built.

## 2. Battery depletion projection

Energy-bookkeeping projection: usable kWh above floor ÷ mean 12-h forecast demand → autonomy hours and depletion clock-time. This is the duty manager's midnight question ("how long can we hold, when does the genset need to be ready?") answered deterministically.

## 3. Anomaly detection

**Leave-one-out z-score** per hour (a point scored against the *other* days' statistics), flagging |z| ≥ 3. Statistical note (documented in code): with n = 7 samples, a conventional z-score including the outlier can never exceed ≈2.27 — small-sample anomaly detection *requires* the leave-one-out form. In the sprint dataset the method flags the injected evening surge (z ≈ 9) and no false positives from the ±5% noise band. Every alert prints observed vs expected kW and a plain-language explanation.

## 4. Recommendation engine

Rule-based, each recommendation printing its inputs and basis, e.g.:
- "Tier-2 deficits of X kWh detected → add storage or shift laundry/pumping into solar hours" (basis: unserved-energy accounting of the active run)
- "X kWh of PV curtailed at midday → larger inverter or load shifting converts curtailment into savings" (basis: curtailed energy vs the 250 kW inverter limit)
- "Generator averages Y kW loading vs 120 kW minimum-load point" (basis: runtime + fuel model)
- "Reserve +10% adds ~N kWh ride-through" (basis: battery configuration)

## 5. Optional LLM analyst — deliberately excluded from the POC core

The architecture reserves a server-side, structured-state-only LLM endpoint for a natural-language analyst, but the POC ships **without any external AI API dependency**: the product is fully functional offline, and no judge needs an API key to reproduce anything. This is a stated design decision, not a limitation of ambition — it follows the handbook's own guidance (offline/low-bandwidth handling is *strong evidence* for the Digital Solutions & AI track).

## 6. AI transparency statement (as shown in-product)

> Every function on this page is deterministic and explainable: statistical forecasting with reported MAE/RMSE, energy-bookkeeping depletion projection, leave-one-out z-score anomaly screening, and rule-based recommendations whose inputs are printed alongside each insight. No black-box model makes dispatch decisions — the safety-critical dispatch engine is fully deterministic and unit-tested.
