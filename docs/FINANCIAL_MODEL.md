# Financial Model — with Computed Results

All figures below are engine outputs (`results/demo-results.json`, reproducible via `npm run results`); equations in [TECHNICAL_METHODOLOGY.md](TECHNICAL_METHODOLOGY.md) §9.

## 1. System costed (default design)

300 kWp PV · 600 kWh LFP storage · 250 kW inverter · existing 400 kW genset retained (intelligent dispatch layered on) — for the 250-bed reference hospital (~6,770 kWh/day).

## 2. CapEx

| Item | USD | Rate |
|---|---|---|
| Solar PV | $240,000 | $800/kWp |
| Battery storage | $168,000 | $280/kWh |
| Inverter | $30,000 | $120/kW |
| Installation & BOS | $52,560 | 12% |
| **Total** | **$490,560** | **₦760.4M @ ₦1,550/$** |

## 3. Annual operations (mix: 320 normal + 45 outage days of 12.5 islanded hours — editable, with 20/70-day sensitivity)

| | Baseline (grid + diesel only) | Sentinel-managed |
|---|---|---|
| Grid energy | ~2,225 MWh | ~1,898 MWh |
| Diesel | 58,255 L | 34,345 L |
| **Annual opex** | **₦569.6M** | **₦457.8M** |
| Blended energy cost | ₦231/kWh | ₦190/kWh |

**Operating savings: ₦111.8M/yr** · diesel avoided **23,910 L/yr** · CO₂ avoided **64.1 t/yr**.

## 4. Investment decision — stated honestly

| Metric | Value | Reading |
|---|---|---|
| Simple payback | **7.9 yr** | Within the 20–25 yr life of the PV asset — "pays for itself over its life" is true; fast money it is not |
| IRR | **4.6%** | Below Nigerian commercial hurdle rates |
| NPV (10 yr @ 18%) | **−₦326M** | **Negative** at commercial discount rates |
| LCOE (discounted) | ₦75/kWh | Well below diesel's ~₦480/kWh; above Band A grid ₦210 as a *grid-displacement* play alone |
| EaaS fee @14% financing | **₦161.0M/yr** (₦328/kWh on asset-delivered energy) | Exceeds the ₦111.8M operating savings at commercial rates |
| **EaaS breakeven financing rate** | **4.6%** | The service closes with concessional/DFI capital — exactly how the real NSIA-LUTH-class projects are financed |
| Service cost | ₦1,764/bed-day (~$1.14) | Communicable unit for hospital administrators |

**The strategic reading (this IS the product):** at Band A tariffs, grid-displacement alone does not justify merchant capital; the value case is **resilience (the brief's metric 1) + diesel displacement (metric 2) + concessional financing**. Sentinel computes the exact subsidy gap (₦161M fee vs ₦112M savings → gap closes below 4.6% financing) instead of hiding it — which is precisely what REA-type programmes, DFIs and hospital boards need to see. A tool that only ever said "yes" would be worth less than this one.

## 5. Sensitivity (one-at-a-time, from the engine)

| Variable | Change | Payback | NPV | EaaS fee ₦/kWh (asset) |
|---|---|---|---|---|
| Diesel price | −30% | 8.9 yr | −₦376M | 328 |
| Diesel price | +30% | **7.1 yr** | −₦276M | 328 |
| Equipment CapEx | +20% | 9.8 yr | −₦492M | ~394 |
| Equipment CapEx | −20% | **6.1 yr** | −₦161M | ~263 |
| Solar yield (PR) | −10% | 9.0 yr | −₦379M | 328 |
| Grid tariff | −20% | 9.3 yr | −₦393M | 328 |
| Outage frequency | 20 days/yr | 10.0 yr | −₦419M | ~388 |
| Outage frequency | 70 days/yr | **6.5 yr** | −₦234M | ~312 |

Direction checks are unit-tested (e.g. costlier diesel must improve NPV). Combinations compound: diesel +30% **and** CapEx −20% approach ~5-year payback; diesel +30% **and** 70 outage days are the stress-case upside.

## 6. What the sizing optimizer adds

Ranked by **total annualized cost** (opex + CapEx × CRF(14%,10)) subject to *both* brief metrics (continuity ≥ 11.4 h of 12.5; diesel avoided ≥ 30%):

- **Daytime outage pattern (the brief scenario):** PV-first wins — 400 kWp with **no battery** is optimal (TAC ₦532M; continuity 12.25 h; −43% diesel). The default 300/600 design buys night-time and evening-event resilience the daytime pattern doesn't need.
- **Evening outage pattern (17:00–23:00, verified run):** the optimum flips to storage-heavy — every top-feasible design includes 800 kWh (best 400 kWp + 800 kWh, TAC ₦600M, continuity 96.9% of islanded hours).

**The right design depends on *when* your feeders fail. Sentinel computes it per feeder instead of guessing — that is the decision-quality story, and it includes telling a hospital when *not* to buy batteries.**

## 7. Commercial structures modelled

1. **Hospital ownership** — full CapEx, full savings, payback 7.9 yr.
2. **EaaS** — provider-owned; fee ₦161M/yr; closes with concessional capital ≤ 4.6% financing.
3. **Blended** — concessional or grant capital (REA-type/DFI) lowers the cost base; the engine quantifies exactly how much subsidy closes the gap; **no grant is ever assumed to exist**.

Who pays, who owns, who maintains is explicit in every structure (Financials tab; [BUSINESS_MODEL.md](BUSINESS_MODEL.md)).
