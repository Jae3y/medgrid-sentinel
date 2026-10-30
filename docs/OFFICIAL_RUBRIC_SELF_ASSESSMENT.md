# Official Rubric Self-Assessment

Official formula (Handbook p. 17): `Total = 20 × (0.25·Impact + 0.25·Innovation + 0.25·Sustainability + 0.15·Feasibility + 0.10·Scalability)`, each criterion scored 1–5. A 5 means "delivered the brief's success metric" / the exceptional definition. This is an evidence-based self-check for internal improvement — not a prediction of judge scores.

**Self-assessed: 4.0 / 100-point scale → 80.** Breakdown below; every score states evidence, what's demonstrated vs hypothetical, and what would raise it.

---

## Impact — 25% → **4**

**Exceptional (5) definition:** large, quantified benefit to the people in the brief, backed by real data and the brief's impact metric.

- **Evidence for 4:** both brief metrics computed by a tested engine: 12.50/12.50 h critical-service continuity (100%), 0.00 kWh unserved Tier-1; diesel −41% in-scenario, 23,910 L/yr, 64.1 t CO₂/yr, ₦111.8M/yr; annualization and sensitivity explicit; honest failure case (G) included.
- **What keeps it from 5:** facility data is illustrative, not measured; no real community member has validated the tiering or the metrics' materiality.
- **To raise:** one metered pilot feeder replacing the illustrative profile (roadmap M1–3); community validation of the tier definitions.

## Innovation — 25% → **4**

**Exceptional (5) definition:** genuinely new approach addressing a root cause existing solutions miss.

- **Evidence for 4:** the root cause addressed is *decision quality under failure conditions* — outage-pattern-aware sizing (demonstrated flip: daytime → PV-first, evening → storage-heavy), tiered clinical dispatch with honest deficit reporting, and a computed concessional-financing breakeven instead of hand-waved EaaS. Compared honestly with existing tools (sizing calculators, monitoring dashboards) in `docs/PROJECT_OVERVIEW.md` §1.
- **What keeps it from 5:** the underlying components (simulation, dispatch heuristics, CRF finance) are known engineering — the combination and the clinical tiering are the novelty, not new physics; no patent-level or literature-verified gap analysis was performed in 48 h.
- **To raise:** a prior-art scan (existing hospital-microgrid design tools) with documented differentiation; user validation that the decision gap is real and un-served.

## Sustainability (incl. affordability) — 25% → **4**

**Exceptional (5) definition:** pays for itself over its life, affordable to the lowest-income users, maintainable locally, lowers environmental impact.

- **Evidence for 4:** payback 7.9 yr against 20–25 yr asset life; −23,910 L/yr diesel and 64.1 t CO₂/yr; LFP + standard gensets keep maintenance local; affordability quantified (₦1,764/bed-day; EaaS breakeven 4.6% financing); no grant assumed anywhere.
- **What keeps it from 5:** "affordable to the lowest-income users" is only addressed at the institutional level (the hospital), not the household level — the brief's payer is an institution, but a 5 requires showing the affordability chain down to the community; measured performance absent.
- **To raise:** pilot evidence; a tariff/fee structure analysis showing the service is affordable for a poorly-funded public hospital (not just a private one).

## Feasibility — 15% → **5**

**Exceptional (5) definition:** working prototype on real or realistic data; complies with relevant standards and rules; clear path to a pilot.

- **Evidence:** working POC — production build verified, 58/58 tests, deterministic replay, reproducible results snapshot; realistic inputs (verified NSIA-LUTH precedent, NBS/NERC-sourced prices, labelled synthetic profiles); standards context documented with explicit non-claims; pilot pathway concrete (metering-first, named phases, dependencies); risks registered. The handbook's 48-hour lens explicitly rewards "a convincing working prototype and a credible plan, not a finished product."
- **Honest caveat:** "complies with relevant standards" is satisfied as *structured around* IEEE/IEC practice with certification explicitly not claimed — the strongest true statement available to a simulation.

## Scalability — 10% → **4**

**Exceptional (5) definition:** clear plan to replicate across sites/utilities/countries with costs that fall at scale.

- **Evidence for 4:** configuration-driven engine demonstrated on two facility profiles and two outage patterns; country-adaptation table; provider-licensing pathway; per-facility onboarding plan.
- **What keeps it from 5:** no second facility piloted; platform-marginal-cost claims (SaaS pricing) intentionally not quantified until pilot; multi-tenant architecture not built (single-tenant POC).
- **To raise:** replicate to a real second facility; publish per-facility onboarding cost from the pilot.

---

## Self-check against the anti-inflation rules

- No 5 awarded without evidence against the official exceptional definition — Feasibility is the only 5, and it is evidenced artifact-by-artifact.
- No predicted judge totals presented as precise outcomes; 80/100 is an internal improvement target, not a forecast.
- Every number cited here is reproducible (`npm run results`) and consistent across app, docs, deck and one-pager.

## Post-submission improvement list (if time remains before the deadline)

1. Add the cold-chain uptime view (2–8 °C days) — strengthens the fallback to Brief #1 and shows Tier-1 load-level metrics. *(Optional — feature freeze discipline applies.)*
2. Export the one-page summary from the live app state (currently generated from the snapshot).
3. Second-pass UI accessibility audit (contrast, focus order).
