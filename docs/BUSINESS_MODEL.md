# Business Model

## 1. Who, specifically

| Role | Who |
|---|---|
| **User** | Hospital facility/works engineer & duty manager (runs the twin, reads the depletion forecast, acts on alerts) |
| **Buyer/Payer — pathway A** | Hospital management (ownership of the physical system) |
| **Buyer/Payer — pathway B (primary)** | Energy-service provider / developer (owns the assets; hospital pays the EaaS fee) — the structure used by the real NSIA-LUTH-class deployments |
| **Beneficiary** | Patients: uninterrupted theatres, ICU, cold chain; hospital finance: −₦112M/yr operating cost |
| **Financing partners** | REA-type programmes, DFIs, climate finance — engaged with the computed subsidy gap (EaaS breakeven 4.6% financing), never with an assumed grant |
| **Maintenance** | Provider's local technicians (pathway B) or hospital-contracted O&M (pathway A); LiFePO4 + standard genset keep the skill requirement local |

## 2. Revenue model (pathway B)

- **EaaS service fee** sized from the asset base: ₦161M/yr for the reference design (₦328/kWh on asset-delivered energy at 14% financing; ₦1,764/bed-day).
- Fee vs operating savings computed per facility **before** contract: Sentinel is the pricing tool.
- With concessional capital (≤4.6% financing) the fee drops below the ₦112M savings and the hospital is cash-positive from year 1 — how that spread splits between provider and hospital is a commercial negotiation the platform informs.
- **Platform licensing (scale-up):** per-facility SaaS to energy-service providers (their sizing/pricing/monitoring workbench) and to hospital groups; pricing intentionally not invented now (decided at pilot, months 13–18).

## 3. Cost structure

- Platform development & maintenance (the software this sprint began).
- Per-facility onboarding: load audit, circuit tiering, metering (months 1–3 of the roadmap).
- The heavy CapEx (₦760M reference) sits with the **provider/financiers** in pathway B — the platform itself is asset-light.

## 4. Why customers would pay

1. **Before CapEx:** "will this design hold my theatres through a 12-hour outage — and what's the cheapest design that does?" (sizing optimizer; including "you don't need that battery" answers).
2. **Before contracts:** "what EaaS fee is defensible for this feeder's outage pattern?" (fee-vs-savings breakeven).
3. **During operations:** "how long can storage hold critical loads right now, and when must the generator be ready?" (depletion forecast), plus anomaly screening.
4. **For financing:** "here is the exact continuity and diesel-avoidance evidence pack a DFI programme asks for" (the metrics are computed, not asserted).

## 5. How it travels (international adaptation)

| What transfers unchanged | What adapts by country |
|---|---|
| The engine, tiered-load model, dispatch logic, metric definitions, financial method | Tariffs (MYTO vs US utility rates), diesel/FX prices, outage statistics, equipment standards (UL/IEC), permitting, financing rates (DFI vs commercial), climate (irradiance profiles) |

- **Nigeria → other African markets:** parameter change + data collection; the reference designs re-optimize automatically.
- **US angle (handbook's dual geography):** energy-resilience economics for US hospitals (outage risk, demand charges) is a different value stack — plausible follow-on, not claimed in this POC.
- **Rural clinics:** the load library already includes an 80-bed profile; the same engine runs it unchanged.

## 6. Go-to-market (first 6–18 months)

1. **Months 1–3:** one pilot facility; metering-first audit (the honest answer to "simulated data" criticism); identify the feeder's real outage pattern.
2. **Months 4–6:** engineering design + agreements with an energy-service partner; permitting path.
3. **Months 7–12:** pilot deployment; **compare measured vs predicted** performance — this comparison is the product's credibility engine.
4. **Months 13–18:** replicate to additional facilities; publish the measured-vs-predicted evidence; price the SaaS tier.

No partner, pilot or LOI is claimed to exist — these are the plan's dependencies, with the risks registered in [RISK_REGISTER.md](RISK_REGISTER.md).
