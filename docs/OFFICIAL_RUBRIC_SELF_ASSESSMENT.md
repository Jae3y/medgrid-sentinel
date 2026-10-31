# Official Rubric Self-Assessment (Handbook §11)

Total = 20 × (0.25·Impact + 0.25·Innovation + 0.25·Sustainability + 0.15·Feasibility + 0.10·Scalability). A 5 means "delivered the success metric in its brief". These are our honest estimates, not predictions of judges' scores.

| Criterion | Weight | Self-score | Evidence | What remains hypothetical | What would raise it |
|---|---:|:-:|---|---|---|
| **Impact** | 25% | 4–5 | Brief metric computed on a documented 39-day outage in a named city, on measured weather: critical hours 449 → 937 (+487), Tier-1 451 → 937, 2,841 L avoided in the outage, 91,654 L/yr avoided; 14-day P(Tier-1 kept) 0% → 78% | Loads are illustrative; no measured hospital data | Shadow-mode data from one real hospital |
| **Innovation** | 25% | 5 | Root cause others miss: fuel logistics, not kW. A governor schedules care tiers against the next delivery; the software's value is isolated on identical hardware (+179 h); clinical ride-through reserve; feature-phone channel | Controller not yet field-tested | Pilot comparison of Sentinel vs the incumbent inverter logic |
| **Sustainability (incl. affordability)** | 25% | 4–5 | Pays for itself: 3.3-yr payback, IRR 30%, NPV +₦553M at 18% after replacements; every sensitivity is positive. EaaS: zero CapEx, hospital saves 20% from month one, provider IRR 23.6%; patients pay nothing extra (cost per bed-day falls). Locally maintainable (LFP + standard generator + local O&M). −246 t CO₂/yr | Installed costs are planning estimates; collections risk | Two EPC quotes; signed EaaS term sheet |
| **Feasibility** | 15% | 4 | Working prototype on real data (NASA POWER, NREL), 101 tests, E2E-verified offline app; standards mapped (IEC 60364-7-710, 62446, 62109, 62619, NEMSA); clear pilot path with gates | No physical integration yet; no partner signed | Hospital MoU and metering in month 1 |
| **Scalability** | 10% | 4–5 | Replication by configuration; 10 site-year fleet screen with honest verdicts; cross-country transfer (Ghana, Kenya, U.S. NFPA); fleet cost-decline hypothesis | Cost decline unvalidated | Quotes for 3+ sites |

**Indicative weighted range:** 20 × (0.25·4 + 0.25·5 + 0.25·4 + 0.15·4 + 0.10·4) = **85** at the low end; ≈ **95** if Impact and Sustainability are read as 5. The biggest lever is real facility data, which no 48-hour team can have.
