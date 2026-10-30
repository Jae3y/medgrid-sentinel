# Judge Q&A — 32 Hard Questions, Evidence-Based Answers

Every answer traces to the engine (`results/demo-results.json`), the docs, or is an explicit "we don't know yet." No invented claims.

## Problem & fit

**Q1. Why Brief #13 and not #12 (hospitals explicitly) or #1 (cold chain)?**
We scored all three on the official rubric (matrix in `docs/BRIEF_SELECTION_AND_STRATEGY.md`). #13's metrics — critical-service hours and diesel litres avoided — are exactly what our engine computes, for whole facilities rather than one load class. #12's core ask is relocatable hardware; #1 narrows to refrigeration. The engine already models both fallbacks (theatre schedules, 2–8 °C refrigeration as Tier-1 loads) if the full kick-off brief points there.

**Q2. The full brief text wasn't available. What if your reading is wrong?**
The Appendix B summary governs what was published; full briefs release at kick-off. Our two metric definitions are documented and generic — if the partner defines "critical service" differently, we re-point the metric computation, not the product. Logged as risk R1 with a required reconciliation action.

**Q3. Who exactly is your user, and who pays?**
User: the hospital facility/works engineer and duty manager. Payer: hospital management (ownership) or an energy-service provider under EaaS — both modelled because the real Nigerian precedent (NSIA-LUTH) uses the provider structure. User ≠ payer, and the product serves both.

**Q4. What fails today, at root cause?**
Decision quality, not hardware: hospitals buy diesel by default and solar by brochure, with no way to test a design against a real outage before spending. That's what a 48-hour sprint with mixed teams can attack.

## Engineering

**Q5. Is this real engineering or a dashboard?**
A deterministic 15-minute-step power-balance engine with 58 unit tests using hand-calculated expected values (PV formula, battery energy transfer with efficiencies, two-term fuel curve, CRF, NPV, IRR). Power balance is tested to 1e-6 kW at every step. The engine runs headless, UI-free.

**Q6. Show me the power balance holds.**
Identity: `pv + grid + genset − batt = served(T1+T2+T3)` — tested at every step of a 3-day run and during genset-carrying islands (`dispatch.test.ts`). Energy conservation: served + unserved = demand within rounding.

**Q7. Your battery never over-discharges?**
Floor policy: islanded → 15% SOC; grid-connected → 80% reserve. Both unit-tested (peak-shave case included). Below the floor, discharge power goes to zero and the generator must carry the deficit — visible in the event log.

**Q8. What happens in the first 15 minutes of an outage?**
The battery assumes the bus instantly; the genset start command fires with a 1-step (15-min) delay — unit-tested (outage step 0: genset off; step 1: on). That's the UPS bridging role.

**Q9. Why 15-minute steps?**
The standard interval for energy-system dispatch studies; matches tariff/AMI granularity. Sub-hourly smoothing is a documented limitation (L8) until measured data upgrades it.

**Q10. Is 0.31 L/kWh realistic for a diesel set?**
It's the standard two-term curve (10 L/h fixed + 0.27 L/kWh marginal) for a well-loaded medium-speed set — consistent with manufacturer datasheet ranges. It's an editable input with the fuel price ±30% in sensitivity.

**Q11. Why does the PV model not show a separate inverter efficiency?**
PR (0.78) already includes inverter, temperature, soiling and cabling losses per the IEC-61724 framing — applying an inverter factor again would double-count. Documented in the methodology.

**Q12. What about power quality — harmonics, THD?**
Deliberately omitted: THD needs a defined waveform model, and faking it would violate our honesty rules. PQ *events* (sags, swells, frequency excursions) are scenario-driven with protective islanding, using IEEE-1159 vocabulary, clearly labelled simulated telemetry.

**Q13. Does this connect to real hospital systems?**
No — decision-support only, by design. No control interfaces exist. It must never touch hospital protection circuits.

**Q14. Determinism — why does it matter?**
Judges and engineers can replay every number: identical inputs give byte-identical results (unit-tested), and `npm run results` regenerates the canonical figures. No screenshots-only evidence.

## AI

**Q15. What does the AI actually do?**
Four jobs, all deterministic: demand forecasting (hybrid model, MAE 8.1 kW vs persistence 8.6 on a held-out synthetic day), battery-depletion projection, leave-one-out z-score anomaly screening, and rule-based recommendations that print their inputs.

**Q16. Trained on what data?**
Synthetic "measured" history derived from the facility's own profiles with seeded noise — deliberately honest for 48 hours with no facility data. The evaluation harness accepts real AMI series unchanged. We report MAE/RMSE precisely because we can't claim field accuracy.

**Q17. Why leave-one-out z-scores?**
With n=7 samples, a conventional z-score including the outlier can never exceed ≈2.27 — small-sample anomaly detection requires scoring a point against the *other* points. Our method flags the injected surge (z≈9) with zero false positives from the noise band.

**Q18. Where's the LLM chatbot?**
Deliberately absent. The core must work offline and every intelligent function must be auditable; an LLM analyst is a server-side, structured-state-only extension, not a POC dependency. The handbook lists offline handling as strong evidence for our track.

## Sustainability & economics

**Q19. Payback is 7.9 years and NPV is negative at 18% — why is this a good investment?**
Because at Band A tariffs the value case is resilience + diesel displacement + concessional capital, not grid arbitrage — and we compute that honestly: EaaS closes below 4.6% financing, which is exactly how NSIA-LUTH-class projects are financed. The platform's value includes telling a hospital *before* CapEx that a merchant-rate purchase doesn't clear.

**Q20. You're assuming 45 outage-days/year. Why?**
A conservative composite of national disturbances (12+ in 2024) plus local feeder trips, with dedicated sensitivity rows (20 and 70 days) and an editable input. At 20 days/yr payback is 10.0 yr; at 70, 6.5 yr — the model is honest in both directions.

**Q21. What if diesel disappears (CNG, grid improvement)?**
Sensitivity: diesel −30% → 8.9-yr payback. The product survives because decision quality persists: sizing, continuity verification and outage-preparedness remain valuable. But we don't pretend the savings case is fuel-price-invariant.

**Q22. Is ₦760M affordable for a Nigerian hospital?**
That's exactly why pathway B exists: the provider/financier carries CapEx; the hospital pays a service fee (₦1,764/bed-day) that drops below its current blended energy cost with concessional capital. The blended-financing structure computes the required subsidy instead of assuming it.

**Q23. Who maintains it, realistically?**
LiFePO4 batteries, standard gensets, and a software layer — local technician skill sets. O&M ownership is explicit per structure (provider under EaaS; hospital-contracted under ownership). The handbook's "no O&M owner" red flag is addressed by design.

**Q24. Grant dependency?**
No grant is assumed to exist anywhere in the model. The EaaS breakeven (4.6%) quantifies the gap so programmes can fund it deliberately — the opposite of grant-dependent thinking.

## Deployment & scale

**Q25. What can be standing, running and paid for in 6–18 months?**
Months 1–3: metered pilot facility (audit, tiered circuits, real outage log). Months 4–6: signed design + financing + O&M agreements, permits in process. Months 7–12: a deployed pilot with measured-vs-predicted evidence. Months 13–18: 3–5 facilities and a provider playbook. Physical installation is done by licensed partners, not us.

**Q26. What's your biggest deployment risk?**
That the pilot facility's real outage pattern differs from assumptions — which is why the optimizer is scenario-driven and the roadmap is metering-first. R6 in the risk register; the platform turns the pattern into an explicit input.

**Q27. How does it travel to another country?**
Tariffs, prices, outage patterns, standards and climate are configuration inputs; the method (tiered loads, dual-metric sizing, EaaS breakeven) is what exports. The rural-clinic profile already runs on the same engine.

**Q28. US hospitals?**
Plausible follow-on with a different value stack (outage risk, demand charges, NF99 codes) — documented as an adaptation hypothesis, not a claim.

## Evidence & integrity

**Q29. What did you build this weekend vs before?**
Everything — the repository starts at the sprint's opening commit. Disclosed in `submission/DISCLOSURE_STATEMENT.txt` with the tool list (including the AI coding agent used as the development instrument).

**Q30. Which numbers would you verify first with real data?**
In order: the feeder's outage pattern (drives sizing most), genset fuel curve (drives diesel savings), then tariff and load profile. All four are inputs, and the pilot is metering-first for exactly this reason.

**Q31. Your continuity says 100% — isn't that suspicious?**
Only because the baseline design (300 kWp + 600 kWh + working genset) is dimensioned for the tested scenario. We ship the counter-evidence in the same lab: scenario G (generator fault) drops continuity to 98.2% with a visible pre-dawn deficit; scenario E (degraded battery) to 99.7%. The product reports deficits; the suite tests that it does.

**Q32. What would move Impact from 4 to 5?**
Per our self-assessment: measured facility data from the first pilot replacing the illustrative profile — one sprint with a metered feeder, showing predicted-vs-measured continuity and diesel on real hardware. That's the roadmap's explicit first phase.
