# Financial Model

Code: `src/engine/financial.ts`. The outputs below come from `results/demo-results.json`. Prices are explicit inputs with sources in [DATA_SOURCES.md](DATA_SOURCES.md).

## 1. Method
1. **Operating year, simulated rather than extrapolated.** A full 366-day, 35,136-step simulation of Maiduguri 2024 using NASA POWER measured weather. The grid has stochastic feeder interruptions (1.08/day Poisson, log-normal duration with a 4 h median; frequency matched to the World Bank Enterprise Survey's 32.8 outages per month) plus the documented 39-day line outage. The status quo (diesel only) and the proposed system (PV + storage + Sentinel) see identical conditions. Fuel is unconstrained here so both deliver the same service, which makes this a pure cost comparison. The generator is always serviceable, because failures belong to the resilience analysis.
2. **Pricing.** Grid at Band A ₦206.80/kWh (NERC, May 2024; ₦207 used); diesel ₦1,950/L; generator O&M ₦3,500 per run-hour. Physics is cached, so a price change re-prices without re-simulating; a test asserts the two give equal results.
3. **Lifecycle (20 years).** O&M at 1.5% of hardware CapEx per year; Sentinel subscription $4,800/site-yr; PV degradation 0.5%/yr, conservatively applied to *all* savings; battery replacement in year 12 at 60% of today's storage cost, and PCS replacement in year 12 at 70%.
4. **Ownership.** NPV and IRR on −CapEx followed by net annual flows; payback from cumulative cash.
5. **EaaS.** A provider owns PV + storage + Sentinel and bears O&M, the subscription and replacements. The hospital pays a fixed fee equal to 80% of its measured savings, so it keeps 20% from month one. The provider's IRR is computed on the same flows. A breakeven financing rate (CRF-based fee equal to savings) is also reported.

## 2. CapEx (reference design)
| Item | Basis | USD |
|---|---|---:|
| PV 600 kWp | $650/kWp installed | 390,000 |
| LFP storage 600 kWh | $260/kWh ≈ 2.2× BNEF 2025 global turnkey average ($117/kWh), for import duty, logistics and security premia | 156,000 |
| PCS / hybrid inverters 510 kW | $110/kW | 56,100 |
| EPC & balance of system | 15% of the above | 90,315 |
| Sentinel edge controller, metering, comms | per site | 12,000 |
| **Total** | at ₦1,335/$ (NFEM, Oct 2026) | **704,415 = ₦940.4M** |

## 3. Results
| Metric | Value |
|---|---:|
| Status-quo energy opex | ₦815.8M/yr (diesel ₦450.1M, grid ₦356.3M, generator O&M ₦9.3M) |
| Sentinel energy opex | ₦504.6M/yr |
| Year-1 savings | **₦311.2M/yr** |
| Net after O&M + subscription | ₦290.9M/yr |
| Payback | **3.3 yr** (3.25) |
| IRR (20 yr) | **30.0%** |
| NPV at 18% | **₦553.2M** |
| NPV at 10% (concessional) | ₦1.40B |
| Discounted cost of energy | ₦329 → ₦285 /kWh |
| Diesel avoided | 91,654 L/yr (−39.7%); 246 t CO₂/yr |
| EaaS fee | ₦248.9M/yr = **₦20.7M/month** |
| EaaS provider IRR | **23.6%** |
| Breakeven financing rate (CRF fee = savings, 10 yr) | 28.4% |
| Energy cost per bed-day (EaaS) | ₦8,940 → ₦8,258 |

## 4. Sensitivity (one at a time; every case keeps NPV positive)
| Variable | Change | Payback | NPV @18% | IRR |
|---|---|---:|---:|---:|
| Diesel price | −30% | 4.0 yr | ₦272.9M | 24.0% |
| Diesel price | +30% | 2.7 yr | ₦833.4M | 35.9% |
| Equipment CapEx | +30% | 4.3 yr | ₦246.3M | 22.2% |
| Equipment CapEx | −20% | 2.6 yr | ₦757.8M | 38.1% |
| Naira depreciation | +20% ₦/$ | 4.0 yr | ₦338.5M | 24.2% |
| Solar yield (PR) | −10% | 3.7 yr | ₦383.2M | 26.4% |
| Line outage | none that year | 3.6 yr | ₦414.5M | 27.1% |
| Feeder interruptions | halved | 3.6 yr | ₦390.9M | 26.6% |
| Discount rate | 18% → 10% | 3.3 yr | ₦1.40B | 30.0% |

## 5. Where it does *not* pay as well (honest)
The fleet screen at national prices: the Lagos 250-bed case (Band-A-like feeder, weaker sun) pays back in 5.9 years with NPV −₦121.8M at 18%. It is viable but not strong, and would close with concessional capital or a local diesel premium. The tool reports this rather than hiding it.

## 6. Not monetised (upside left out on purpose)
Resilience value (critical hours protected under constrained fuel), avoided equipment damage from 259 transfer breaks per year, avoided generator overhaul deferral, carbon revenue. None of these are in the cash flows.
