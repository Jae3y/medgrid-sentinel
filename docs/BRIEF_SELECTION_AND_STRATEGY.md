# Brief Selection & Competition Strategy

**Status: LOCKED.** The choices are **Brief #13 "Power for a city the grid can't protect"**, **Track 2 Digital Solutions & AI**, and **Setting B Non-residential (healthcare)**.

## 1. Decision matrix (official weights; Handbook §11)

Scores are 1–5 against the official definitions. Internal criteria (data availability, 48-h demonstrability) are noted separately and are not part of the rubric.

| Criterion (weight) | #1 Off-grid cold storage for clinics | #12 Relocatable solar, hospital on the move | **#13 Power for a city the grid can't protect** |
|---|---|---|---|
| Impact (25%) | 4: doses protected is crisp, but scope is one fridge | 4: theatre hours | **5: whole-hospital critical-service hours during a multi-week line outage — the brief's metric can be computed directly on a documented real event (Maiduguri 2024)** |
| Innovation (25%) | 3: crowded cold-chain market | 3: brief expects relocatable hardware | **5: diesel *logistics* as the binding constraint, a tiered fuel-runway governor, and software value isolated on identical hardware** |
| Sustainability (25%) | 4 | 3: logistics burden | **5: 3.3-yr payback, EaaS with zero hospital CapEx, −40% diesel** |
| Feasibility (15%) | 5 | 2: a software team against a hardware brief | **4–5: working engine on real weather and published reliability data; shadow-mode pilot path** |
| Scalability (10%) | 3 | 3 | **4–5: configuration-only replication; 10 site-year fleet screen** |
| Internal: real data in 48 h | Medium | Low | **High (NASA POWER, NREL, TCN/ICIR reporting)** |

**Verdict: #13.** Its metrics ("hours of critical service maintained during a line outage, and diesel litres avoided") are exactly what a hospital microgrid twin computes. Its title describes a documented, recurring reality: Maiduguri's 330 kV line was vandalised on 22 Sep 2024 and restored on 31 Oct 2024, after an outage of about two months in 2021. Briefs #1 and #12 remain fallbacks: the engine already treats cold chain and theatres as Tier-1 loads.

## 2. Locked definitions

| Item | Definition |
|---|---|
| Brief metric (verbatim) | "Hours of critical service maintained during a line outage, and diesel litres avoided." |
| Community | Referral hospitals in cities whose transmission supply is repeatedly cut by vandalism or insurgency. The instance is Maiduguri, Borno State, Nigeria. |
| User | Hospital works engineer and duty manager |
| Beneficiaries | Patients on Tier-1 (ICU, theatres, blood bank and vaccine cold chain, oxygen plant, ED, critical lighting) and Tier-2 (wards, lab and imaging, pharmacy/CSSD, clinical IT, kitchen, water) circuits |
| Payer | Hospital management (federal/state budget or own revenue), or an energy-service company under EaaS, repaid from diesel the hospital no longer buys |
| "Critical service" | Tier 1 + Tier 2, both served at ≥ 99.5% of demand in that quarter-hour. Tier 1 is also reported on its own. |
| Metric 1 | Islanded hours with critical service maintained. A ≤ 90 s generator transfer break is counted as a Tier-1 *interruption* but does not erase the quarter-hour. |
| Metric 2 | Status-quo diesel litres − Sentinel litres over the same window (replay), and per year (full measured year) |
| Baseline (status quo) | Grid when available + a diesel generator sized to the full facility peak (450 kW), no PV or storage, the same tank and deliveries |
| Intervention | 600 kWp PV + 600 kWh LFP + 510 kW PCS + MedGrid Sentinel controller, keeping a 400 kW generator |
| Replay | 20 Sep – 1 Nov 2024, outage 22 Sep 00:00 → 31 Oct 00:30 (936.5 islanded h incl. reconnection delay), NASA POWER weather, 6,000 L/week in two drops, 10,000 L tank starting 60% full |

## 3. Headline (results/demo-results.json)

- Metric 1: **449 → 937 h**. Tier-1: 451 → 937 h. Tier-1 breaks: 12 → 0. Empty-tank hours: 489 → 0.
- Metric 2: **2,841 L avoided** in the outage, and **91,654 L/yr** over a full measured year (−39.7%).
- vs fixed-rule hybrid on the same hardware: **+179 critical hours**.
- 14-day Monte Carlo (NRC-class generator): P(Tier-1 kept powered for 14 days) **0% → 78%**.

## 4. Why this wins on the rubric

- **Impact (25%):** the brief's own metric, computed on a documented outage in a named city, with the size of the benefit (+487 h) shown against three alternatives.
- **Innovation (25%):** the root cause others miss is fuel logistics, not kW. A governor schedules care tiers against the next convoy, and its value is isolated on identical hardware.
- **Sustainability (25%):** pays back in 3.3 years. EaaS needs no grant and no hospital CapEx; −40% diesel and −246 t CO₂/yr; maintainable with LFP + standard generator + local O&M.
- **Feasibility (15%):** a working prototype on real data, 101 tests, relevant standards mapped, and a shadow-mode pilot gate.
- **Scalability (10%):** replication by configuration only; the 10 site-year fleet screen shows where it pays and where it doesn't.

## 5. Discrepancy log

1. **Full brief text** is released at kick-off (Handbook FAQ, p. 26). We built against the published Appendix B title and metric. If the partner's definition of "critical service" or the target city differs, only the tier mapping and the replay dates change. See [BRIEF13_RECONCILIATION_CHECKLIST.md](BRIEF13_RECONCILIATION_CHECKLIST.md).
2. **Deadline:** Sun 1 Nov 12:00 PM ET. US DST ends at 02:00 that day, so it is 17:00 UTC = **18:00 WAT**. Internal target: everything uploaded by 16:00 WAT.
3. **Pitch video length:** Handbook §10 says "up to 3–5 minutes" and the FAQ says "up to 5 minutes". We target ≤ 4:45.
4. **Team size:** solo entry is permitted (§8); this is declared in every artifact.
