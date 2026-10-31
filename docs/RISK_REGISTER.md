# Risk Register

| # | Risk | Likelihood | Impact | Early test / mitigation | Owner |
|---|---|---|---|---|---|
| 1 | **Real loads, tiers or generator condition differ from the model** (biggest risk) | High | High | Months 1–3: circuit-level metering and Sentinel in shadow mode. Proceed to CapEx only if daily-energy prediction error ≤ ±15% and the tier map is signed off by the hospital's works engineer | Sentinel + hospital |
| 2 | Theft or vandalism of panels in an insecure city | Medium | High | On-campus or rooftop siting inside the hospital perimeter; insurance priced in the EaaS fee; anti-theft mounting | ESCO |
| 3 | Public-hospital payment delays | Medium | High | Fee below measured savings; escrow / direct deduction from federal allocation (PPA precedent); monthly verified-savings report | ESCO + hospital |
| 4 | FX shock (USD equipment, naira savings) | Medium | Medium | +20% depreciation case still pays back in 4.0 yr; local currency EaaS indexed annually | ESCO |
| 5 | Diesel price falls | Low–Med | Medium | −30% case pays back in 4.0 yr, NPV still positive | — |
| 6 | Supervisory control errs in a clinical setting | Low | Very high | Shadow mode first; Tier-1 never shed by policy; clinical reserve; hard limits enforced by certified inverter/ATS; hospital override; every decision logged | Sentinel |
| 7 | Comms outage stops monitoring | Medium | Low | Edge controller runs locally and offline; SMS/USSD over GSM; static web app works offline | Sentinel |
| 8 | Permitting / inspection delays (NEMSA) | Medium | Medium | Engage a licensed EPC with NEMSA track record in month 4; design to IEC 62446/62109/62619 | EPC |
| 9 | Brief #13 full text defines "critical service" differently | Medium | Low | Tier mapping is configuration; the engine computes the metric generically | Team |
| 10 | Solo team capacity | High | Medium | Coach request; partners for EPC and clinical engineering named in the ask | Team |
