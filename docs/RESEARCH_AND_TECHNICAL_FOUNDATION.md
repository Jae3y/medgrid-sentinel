# Research & Technical Foundation

## 1. The city the grid can't protect
- **Maiduguri, Borno State.** Tower 372 on the Gombe–Damaturu–Maiduguri 330 kV line was vandalised on 22 Sep 2024. TCN restored Gombe–Damaturu on 30 Oct and Damaturu–Maiduguri on 31 Oct 2024. Meanwhile the town was partly fed by the Maiduguri Emergency Power Plant. The same corridor was cut in 2021, when power returned "for the first time in two months" (AFP).
- **Hospitals in that city.** On 3 Dec 2022 the governor found Umaru Shehu Ultra Modern Hospital and Fatima Ali Sheriff Maternity Hospital without power for days. Their generators were functional; there was no diesel (ICIR).
- **Implication for engineering:** the resilience limit is litres on site and in the supply chain, not generator kW. That is the design premise of the fuel-runway governor.

## 2. Health-facility electricity in Africa
WHO/World Bank/IRENA/SEforALL (2023): about 1 billion people are served by facilities without reliable electricity, and only 50% of sub-Saharan African hospitals report reliable access. The NSIA-LUTH Cancer Centre (Lagos) got a 300 kWp + 1.1 MWh EaaS microgrid in 2025 (EM-ONE/RIPLE). That is the Nigerian precedent for our commercial model.

## 3. Generators are less reliable than assumed
NREL/TP-5C00-76553: a single well-maintained emergency diesel generator is only ~80% reliable over two weeks (FTS 0.13%, MTTF 1,662 h). An average (NRC-class) unit is ~59% (FTS 0.66%, MTTF 636 h), and a poorly maintained one (MTTF 61 h) is almost certain to fail within a week. Repairs including logistics average 37 h in the U.S. We assume 72 h in NE Nigeria.

## 4. Solar resource
NASA POWER, Maiduguri: 2,104–2,140 kWh/m²/yr GHI (2022–24). With a temperature derate and PR 0.82, the simulated yield is 1,545 kWh/kWp·yr on the bus. Day-to-day variability is low in the dry season and higher in the rainy season (Jun–Sep). The replay period (late Sep – Oct) spans the end of the rains.

## 5. Grid reliability context
World Bank Enterprise Survey (Nigeria): 32.8 outages per firm per month. National grid disturbance counts in 2024 vary between official (NERC) and industry/media figures. We avoid relying on either and use a feeder-level regime with sensitivity.

## 6. Hospital electrical practice
IEC 60364-7-710 classifies medical locations (group 2: ICU, theatres) and safety-supply changeover times. That's the basis for the Tier-1 definition and for counting generator transfer breaks. U.S. equivalents are NFPA 99/110 and NEC 517 (10-second transfer).

## 7. How each source informed the product
| Finding | Product decision |
|---|---|
| Fuel, not kW, is the binding constraint | Fuel tank + resupply model; fuel-runway governor; supply-curve chart |
| Generators fail during long runs | Monte Carlo with NREL classes; clinical ride-through reserve |
| Transfer breaks matter in group-2 locations | Battery-formed island; interruption counting |
| EaaS precedent in Nigeria | Commercial model and provider-IRR calculation |
| Measured weather available | Real-data replay, forecaster, fleet screen |
