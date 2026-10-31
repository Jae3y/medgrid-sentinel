# Judge Q&A — 36 hard questions, evidence-based answers

All numbers come from `results/demo-results.json` unless stated.

## Problem & brief fit
**1. Why Brief #13 and not #12 (hospital) or #1 (clinics)?** Brief #13's metric (critical-service hours during a line outage, and diesel litres avoided) is exactly what a hospital microgrid twin computes. Its title also describes a documented recurring event: Maiduguri's 330 kV line was vandalised on 22 Sep 2024 and restored on 31 Oct 2024, after about two months dark in 2021. #12 asks for relocatable hardware; #1 covers only the cold chain, which is one of our Tier-1 loads.

**2. Isn't the real problem that hospitals can't afford generators?** In Dec 2022 two Maiduguri hospitals sat dark for days with *working* generators and empty tanks (ICIR). The binding constraint in a long line outage is fuel logistics: our hospital needs about 4× its normal diesel while deliveries and budgets stay flat.

**3. Why Maiduguri — isn't that cherry-picking a worst case?** It is the brief's scenario: "a city the grid can't protect." The fleet screen also runs ordinary feeders (Kano, Abuja, Port Harcourt) and a Band-A city (Lagos) with no line outage, and reports that Lagos is only "viable" (5.9-yr payback).

**4. Who exactly pays?** Hospital management (federal/state budget or own revenue), or, as recommended, an ESCO under EaaS repaid from diesel the hospital no longer buys. This is the structure of the NSIA-LUTH cancer-centre microgrid (EM-ONE/RIPLE, 2025, flat monthly fee under a PPA).

## Engineering & data
**5. Is any of this real data?** Weather, yes: NASA POWER hourly irradiance and temperature for Maiduguri on the exact outage dates, plus two training years. Generator reliability is NREL's published statistics. The outage dates come from TCN statements. Loads are an illustrative reference hospital, clearly labelled; metering replaces them in pilot month 1.

**6. Your baseline loses because it runs out of fuel — isn't that rigged?** It gets the same fuel as everyone, plus a *bigger* generator (450 kW vs 400 kW). With ample fuel (≥ 14,000 L/week) all four controllers deliver 100% critical service. That's shown on the supply curve and asserted in a unit test. We only claim a benefit where the real constraint binds.

**7. Couldn't a hospital just ration manually?** We modelled that: status quo + manual rationing keeps 638 critical hours vs Sentinel's 937 on the same fuel. Rationing switches Tier 3 off for the whole outage; Sentinel defers it only when the runway requires, and uses solar and storage.

**8. How much is the software vs the hardware?** On identical PV + battery + generator and identical fuel, Sentinel keeps 937 critical hours and the fixed-rule hybrid 757, so the software alone adds +179 hours. In the 14-day Monte Carlo, P(Tier-1 kept 14 days) is 78% vs 3%.

**9. Does the power balance actually hold?** Yes: at every 15-minute step for all four strategies, including fuel-limited and generator-failure steps (residual < 1e-6 kW). Diesel mass is also conserved: initial + delivered − burned = final. Both are tested.

**10. 15-minute steps can't see a 15-second generator transfer.** Correct, and we don't hide it. The break is modelled as a time gap that blacks out every tier for startupSeconds/900 of the step and is counted as an interruption: 259 per year for the status quo, 0 for Sentinel, where the battery forms the island. Sub-second protection is out of scope and stays with certified equipment.

**11. What if the generator fails?** Built in two ways. The replay toggle trips it at 150 run-hours with a 72 h repair: Sentinel keeps 912 of 937 Tier-1 hours, the status quo 452. The Monte Carlo samples fail-to-start and time-to-failure from NREL classes. Even with a poorly maintained set, Sentinel's Tier-1 averages 305 of 336 hours vs 142.

**12. Your NREL numbers are from U.S. bases. Nigeria is worse.** Agreed. That's why we show the "poorly maintained" class (MTTF 61 h). Sentinel's advantage *grows* as generator reliability falls, because the battery and solar carry Tier-1 through repairs.

**13. What does the governor actually do?** Every hour it compares diesel + battery + 70% of forecast solar against the energy each service level needs until the next *scheduled* delivery (+24 h margin). It picks the highest level the runway sustains: Tier-3 is deferred first, Tier-1 never. Solar that would be curtailed always goes back to deferred loads. Every decision is logged with its arithmetic.

**14. Why 70% of forecast solar?** It's calibrated on held-out 2024 data: actual insolation met ≥ 70% of the 3-day forecast on 94.5% of days.

**15. Doesn't Sentinel sometimes do worse?** Yes. Below about 5,000 L/week it keeps fewer Tier 1+2 hours than the fixed-rule hybrid, because it sacrifices Tier-2 to keep Tier-1 (ICU, theatres, cold chain) on for all 937 hours. The trade-off is shown in the UI and docs, and the tier map is set by the hospital.

**16. Why 600 kWp?** The sizing optimizer, under brief-metric feasibility and ranked by NPV, picks 600 kWp. NPV-best storage is 300 kWh; we keep 600 kWh because the Monte Carlo shows it carries Tier-1 through generator repairs, a resilience choice we state openly. 600 kWp needs about 3,600 m² of roof or carport space; this is confirmed in the month-4 design.

## AI
**17. Where is the AI?** In forecasts and probabilities, not in safety decisions. The solar forecaster (least-squares blend) is trained on 2022–23 and tested on held-out 2024: RMSE 0.886 kWh/m²/day, 22% better than persistence and +2.8% skill over climatology. It calibrates the governor. The Monte Carlo quantifies resilience. There is no LLM in the product.

**18. +2.8% skill over climatology is small.** Yes, and we say so. Sahel solar is predictable outside the rainy season. The forecaster's real job is calibration: knowing how much forecast solar to count on.

**19. Why not deep learning?** No real hospital load data exists yet. A model trained on synthetic data would be theatre. Real AMI data in pilot months 1–3 enables gradient-boosted demand forecasting.

## Safety
**20. Is it safe to let software shed hospital loads?** Tier-1 is never in a shed group. The pilot runs in shadow mode first, and dispatch goes only through certified inverter/ATS interfaces with hard limits and hospital override. Protection is never replaced.

**21. What if comms fail?** The edge controller runs the same engine locally and offline. Alerts go by SMS/USSD over GSM. The web app is a static offline PWA.

## Economics & sustainability
**22. What does it cost?** $704,415 (₦940M) for 600 kWp + 600 kWh + 510 kW PCS + EPC + the Sentinel edge. That includes our own platform cost and subscription.

**23. Does it pay for itself?** On a full measured year: savings ₦311M/yr, payback 3.3 yr, IRR 30%, NPV ₦553M at 18% over 20 years, *after* battery and PCS replacement in year 12 and O&M.

**24. And if diesel gets cheaper?** −30% diesel: payback 4.0 yr, NPV still +₦273M. Every one-at-a-time sensitivity case keeps NPV positive; the worst case is CapEx +30% at 4.3 yr.

**25. Can the lowest-income users afford it?** Patients pay nothing extra. Under EaaS the hospital pays ₦20.7M/month with zero CapEx, keeps 20% of savings from month one, and energy cost per bed-day falls from ₦8,940 to ₦8,258.

**26. Is EaaS financeable?** Provider IRR is 23.6% after O&M, subscription and replacements, in naira, without grants.

**27. Environmental impact?** −91,654 L diesel/yr (−40%) and −246 t CO₂/yr per 250-bed hospital, plus 1,286 fewer generator hours (less local air pollution at the hospital).

**28. Who maintains it?** The ESCO, under the EaaS contract, using local O&M technicians: LFP containers, standard inverters, standard generator. Sentinel provides remote monitoring and monthly measured-vs-predicted reports.

## Feasibility & deployment
**29. What happens in 6–18 months?** M1–3 metering + shadow mode; M4–6 design, NEMSA plan, EaaS term sheet; M7–12 install and operate; M13–18 two more sites. Each phase has an exit gate (see the roadmap).

**30. Biggest risk and early test?** Real loads or generator condition differ from the model. The test: three months of shadow mode on circuit-level metering, proceeding only if daily-energy error ≤ ±15%.

**31. Standards?** The IEC 60364-7-710 medical-location concept drives the tiering and the transfer-break accounting. IEC 62446/62109/62619 cover equipment, NEMSA covers inspection, and NFPA 99/110 covers U.S. configurations. No compliance is claimed.

**32. Do you have a hospital partner?** No, and we don't claim one. The ask is a pilot hospital in NE Nigeria, a licensed EPC/ESCO, and three months of metering.

## Scalability & team
**33. How does it travel?** By configuration only: measured weather (same NASA pipeline), loads, tariff, feeder regime, standards. 10 site-years: payback 2.9–4.9 yr in Maiduguri, Kano, Abuja and Port Harcourt; 5.9–6.2 yr in Lagos.

**34. Do costs fall at scale?** Hypothesis: about 6% per fleet doubling from standard design and pooled procurement, floored at −25% (vs ~20%+ module learning rates). It will be validated against the first five quotes.

**35. What was built during the sprint?** Everything. Nothing existed before 30 Oct 12:00 PM ET. Day 1 was a first version built with the ZCode agent; Day 2 was the engine/product rebuild with Claude Code. Public, timestamped git history.

**36. You're a solo entrant. Can you deliver?** The pilot plan relies on partners for installation (EPC/ESCO) and clinical engineering (hospital works department). Sentinel's role is the software and analytics, which this POC demonstrates. The coach ask is power-systems and health-facility expertise.
