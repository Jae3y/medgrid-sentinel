# Data Sources Register

Every material external claim in this project, with source organization, location, access date, finding, and confidence. Search-result snippets were treated as leads, never as citations.

| # | Organization | Document / location | URL | Access date | Finding used | Confidence | Where used |
|---|---|---|---|---|---|---|---|
| 1 | EM-ONE Energy (with RIPLE) | "EM-ONE and RIPLE partner to power healthcare" — NSIA-LUTH Cancer Centre 300 kWp + 1.1 MWh BESS | https://www.emone.energy/news/emone-riple | 2026-10-30 | Announced microgrid for Lagos cancer centre; precedent for design scale & financing | **High** (company announcement; performance data unpublished) | RESEARCH doc, deck slide 1, business model |
| 2 | ESMO | NSIA-LUTH Cancer Centre designated-centre profile | https://www.esmo.org/designated-centres/nsia-luth-cancer-centre | 2026-10-30 | Facility context (largest oncology centre in West Africa; commissioned 2019) | High | RESEARCH doc |
| 3 | ICIR (industry reporting) / APGC | Nigeria grid-disturbance counts 2024 ("at least 12"; 162 since 2013 per APGC) | https://www.icirnigeria.org/ | 2026-10-30 | Scale of national grid unreliability | **Medium** (media/industry counts; NERC official count lower — discrepancy stated, not resolved) | PROJECT_OVERVIEW, assumptions, annualization mix |
| 4 | NERC | Quarterly reports (Q1/Q2 2025: no *total* collapse officially recorded); Band A tariff orders | https://nerc.gov.ng/ | 2026-10-30 | Official vs observed outage gap; Band A ≈ ₦209.5/kWh (Jul 2024, held 2025) | Medium (figures must be re-verified against the current MYTO order at pilot) | Grid tariff default; RISK_REGISTER |
| 5 | NBS Nigeria | Diesel (AGO) price watch — national ₦1,400–1,860/L through 2025-26; Lagos ≈ ₦1,560/L early 2026 | https://nigerianstat.gov.ng/ | 2026-10-30 | Diesel price default ₦1,550/L ±30% | Medium (volatile; tracker ranges cited) | Fuel default, sensitivity |
| 6 | SEforALL / IEA / IRENA (published literature) | Healthcare electricity reliability in Sub-Saharan Africa | https://www.seforall.org/ | 2026-10-30 | Background context only — no specific numeric claim depends on it | Medium | Context framing |
| 7 | IEEE / IEC | IEEE 1547, IEEE 519, IEEE 1159, IEC 61724, IEC 62109, IEC 62619 | https://standards.ieee.org/ | 2026-10-30 | Framework vocabulary and model structure | High | STANDARDS doc |
| 8 | DEFRA-class emission factors | Stationary diesel combustion ≈ 2.68 kg CO₂/L | (standard factor) | — | CO₂ accounting | High | CO₂ metric |

## Datasets

- **Synthetic (generated in-repo):** irradiance profiles (`src/engine/weather.ts`, seeded PRNG, clearly labelled), facility load profiles (`src/engine/facility.ts`, illustrative), "measured" forecast history (`src/engine/forecast.ts`, seeded noise around the facility's own profiles).
- **No external datasets were ingested.** No personal data is processed anywhere in the project.

## Verification status

Claims marked **Medium** are decision-relevant but were not traceable to a primary document within the sprint window; each is (a) flagged in-line where used, (b) given a sensitivity or verification action, and (c) listed in [RESEARCH_LIMITATIONS.md](RESEARCH_LIMITATIONS.md). None of the engine's physics depends on them.
