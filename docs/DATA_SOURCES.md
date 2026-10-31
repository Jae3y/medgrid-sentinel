# Data Sources Register

Each material external input is listed with its source, access date (all 2026-10-31 unless noted), how it is used and a confidence rating. Search snippets were treated as leads, and primary pages or documents were opened where possible.

| # | Source | What we took | Used for | Confidence |
|---|---|---|---|---|
| 1 | NASA Langley POWER Project, hourly API (community RE): https://power.larc.nasa.gov/ | Hourly ALLSKY_SFC_SW_DWN and T2M, LST, for Maiduguri (11.83°N, 13.15°E) 2022, 2023, 2024; Lagos, Abuja, Kano, Port Harcourt, Accra, Nairobi, Houston 2024. Raw JSON in `data/raw/nasa-power/` | PV yield, replay weather, Monte Carlo weather, forecaster train/test, fleet | **High**: satellite-derived reanalysis, not ground pyranometer data |
| 2 | Marqusee, Ericson & Jenket, *Emergency Diesel Generator Reliability and Installation Energy Security*, NREL/TP-5C00-76553 (Apr 2020): https://docs.nlr.gov/docs/fy20osti/76553.pdf | Table 3 MTTF (Fehr 1,662 h; NRC 636 h; Hong Kong 61 h); Table 4 FTS (0.13%; 0.66%; 1.65%); Table 5 OA (99.98% / 99.84%); MTTR incl. logistics 37 h; R(t) = OA(1−FTS)e^(−t/MTTF); "well-maintained ≈ 80% at two weeks" | Reliability classes; unit test | **High** (U.S./nuclear/HK data; transfer to Nigeria is an assumption) |
| 3 | Channels TV / VON / The Cable / Arise (TCN statements), Oct 2024 | Tower 372 on the Gombe–Damaturu–Maiduguri 330 kV line vandalised 22 Sep 2024; Damaturu–Maiduguri restored 31 Oct 2024; Maiduguri partly fed by the Maiduguri Emergency Power Plant | Replay window; residual-supply slider | **High** for dates (multiple outlets quoting TCN) |
| 4 | Malay Mail / AFP, 28 Mar 2021 | Maiduguri restored "for the first time in two months" after ISWAP sabotage | Recurrence argument | Medium-high |
| 5 | ICIR, "Zulum donates Govt House diesel to hospitals in darkness during unannounced visit", 3 Dec 2022 | Umaru Shehu Ultra Modern Hospital and Fatima Ali Sheriff Maternity Hospital without power for days; generators functional, no diesel | Root-cause framing (fuel, not kW) | **High** (primary report) |
| 6 | WHO, World Bank, IRENA, SEforALL, *Energizing Health* (Jan 2023): https://www.who.int/news/item/14-01-2023-... | ~1 billion people served by facilities without reliable electricity; only 50% of hospitals in sub-Saharan Africa report reliable access | Problem slide | **High** |
| 7 | World Bank Enterprise Surveys, Nigeria 2014 (via IndexMundi IC.ELC.OUTG) | 32.8 power outages in a typical month | Feeder regime frequency (1.08/day) | Medium (older survey; duration assumed) |
| 8 | NERC tariff order, effective 6 May 2024 (BusinessDay, Nairametrics) | Band A ₦206.80/kWh | Grid tariff (₦207) | Medium-high (no later Band A order found; verify at pilot) |
| 9 | Legit.ng / Finelib, Oct 2026 | Dangote gantry AGO ₦1,800/L from 10 Oct 2026; retail ₦1,900–2,020/L | Diesel ₦1,950/L, ±30% sensitivity | Medium (aggregators; volatile) |
| 10 | Nairametrics / WithinNigeria, Oct 2026 | NFEM ≈ ₦1,331–1,334/$ | FX ₦1,335/$, +20% sensitivity | High |
| 11 | BNEF Battery Price Survey / ESS Cost Survey 2025 (via Energy-Storage.news, ESS News) | Stationary pack $70/kWh; global turnkey BESS $117/kWh | Storage cost benchmark (we use $260/kWh installed in Nigeria) | Medium (secondary coverage) |
| 12 | EM-ONE Energy, "EM-ONE and RIPLE partner…", 12 Mar 2025: https://www.emone.energy/news/emone-riple | NSIA-LUTH Cancer Centre: 300 kWp PV + 1.1 MWh storage, EaaS under a PPA with a flat monthly fee; ~1 GWh/yr demand; 61.5% renewable; −88.8% diesel (projected) | EaaS precedent; "NSIA-LUTH-class" hardware preset | **High** (company announcement; performance projected, not measured) |
| 13 | IEC / IEEE / NFPA standards catalogues | Titles and scopes only | [STANDARDS_AND_REGULATORY_CONTEXT.md](STANDARDS_AND_REGULATORY_CONTEXT.md) | High (no compliance claimed) |
| 14 | Stationary diesel emission factor | 2.68 kg CO₂/L | CO₂ accounting | High |

## Illustrative / synthetic (clearly labelled)
- **Hospital loads:** a 250-bed referral profile with 16 circuits, built from typical equipment classes. It is not measured data from any named hospital.
- **Demand history** for the demand-forecast demo: synthetic (seeded) until pilot metering.
- **Fuel logistics** (10,000 L tank, deliveries every 3.5 days, 30% late, 10% missing) and **repair logistics** (72 h mean): assumptions, exposed as sliders.

## Verification status
Inputs rated Medium are flagged where they are used and each has a sensitivity case. None of the engine physics depends on them.
