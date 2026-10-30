# Deployment Roadmap — 6 to 18 Months

The handbook treats this horizon as a real constraint ("what could be standing, running, and paid for within that window"), so each phase names its exit criteria and dependencies. No partner or pilot is claimed to exist.

## Months 1–3 — Validation (metering first)

**Do:** select one pilot facility; install temporary metering on feeders/critical circuits; collect 4–8 weeks of real load, outage and fuel-purchase data; tier the actual circuits with the facility engineer; extract the feeder's real outage pattern; re-run the sizing optimizer on measured inputs.

**Exit criteria:** measured load profile + outage log + tiered circuit register in the platform; re-optimized design proposal.
**Dependencies:** one willing facility; safe access for metering.
**Honest risk:** this phase exists *because* all current data is illustrative (L1).

## Months 4–6 — Engineering preparation

**Do:** final engineering design on measured data (Sentinel output as the design dossier); equipment selection & procurement quotes (verify against the ±20% CapEx sensitivity); electrical safety & protection study by licensed engineers (Sentinel informs, never certifies); permitting path with the Discos/utility; financing structure closed (ownership vs EaaS vs blended — using the computed breakeven); service/maintenance agreements.

**Exit criteria:** signed design + financing + O&M agreements; permits in process.
**Dependencies:** energy-service partner (pathway B) or hospital capital (pathway A).

## Months 7–12 — Pilot deployment

**Do:** install PV + storage + monitoring per design; commission the platform against live telemetry; **compare measured vs predicted** performance monthly (continuity, diesel litres, solar yield, SOC behaviour); refine dispatch parameters (reserve policy, peak-shave); document operational reliability and economics.

**Exit criteria:** ≥ 6 months of measured-vs-predicted evidence; pilot facility sign-off.
**This comparison is the product's credibility engine** — it converts "simulated" into "validated" honestly.

## Months 13–18 — Replication & commercialization

**Do:** fold field results back into the models (real degradation, real outage patterns); standardize the deployment playbook (design dossier → permitting → install → commission → monitor); onboard 2–5 additional facilities (possibly one rural clinic profile); price the SaaS tier for energy-service providers; publish the evidence pack for DFI/REA-type programmes.

**Exit criteria:** ≥ 3 facilities on measured data; repeatable deployment playbook; first provider-level licensing conversation grounded in real performance.

## International replication (what changes by country)

| Parameter | Nigeria (base) | Other African markets | US hospitals (follow-on) |
|---|---|---|---|
| Grid tariff | Band A ≈ ₦210/kWh | Local utility/mini-grid tariffs | Utility rates + demand charges |
| Diesel | ₦1,550/L, volatile | Local price | Restricted (emissions codes) |
| Outage pattern | Feeder trips + national disturbances | Varies by grid | Rare but high-consequence |
| Standards | IEC-based practice | IEC | UL/NF99-healthcare codes |
| Financing | DFI/concessional-led | DFI, carbon finance | Municipal bonds, ESCO |
| Climate | Tropical irradiance profile | Similar | Lower insolation, snow loads |

The engine takes all of these as parameters; the *method* is the export.

## What is deliberately not promised

- No procurement, no installations, no partner signatures — the platform is decision support; physical deployment belongs to licensed partners.
- No revenue numbers beyond the modelled reference facility until measured data exists.
