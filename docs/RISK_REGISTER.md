# Risk Register

| # | Risk | Likelihood | Impact | Mitigation | Owner |
|---|---|---|---|---|---|
| R1 | Full Brief #13 text (released at kick-off) redefines "critical service" or the payer | Medium | Medium | Engine computes metrics generically; only definitions/demo narrative would change; reconciliation is a logged user action | Team (kick-off) |
| R2 | Simulated-vs-measured credibility gap with judges | High (expected question) | Medium | Every value labelled; 58-test suite; reproducible snapshot; metering-first roadmap explicitly answers it | Product |
| R3 | Diesel price falls (CNG transition, naira appreciation) eroding the savings case | Medium | Medium | Sensitivity row shows −30% diesel → 8.9-yr payback; platform re-computes per facility so the *decision quality* value persists | Commercial |
| R4 | Band A tariff volatility (MYTO reviews) | Medium | Medium | Tariff is an editable input; sensitivity row; re-verification action logged | Commercial |
| R5 | FX depreciation inflating CapEx in naira | High | Medium | FX editable; CapEx quoted in USD for procurement; sensitivity ±20% | Finance |
| R6 | Sizing recommendation misleads if outage pattern is wrong | Medium | High | The optimizer is scenario-driven: feeding it the wrong outage pattern yields the wrong design — which is why the roadmap is metering-first and the platform exposes the pattern as an input, not a hidden assumption | Engineering |
| R7 | Pilot hospital not secured in months 1–3 | Medium | High | No partner is claimed; outreach plan in BUSINESS_MODEL §6; platform value is demonstrable without a pilot (decision support pre-CapEx) | Team |
| R8 | Local maintenance capability gaps for hybrid systems | Medium | Medium | LiFePO4 + standard gensets keep skills local; O&M ownership explicit per commercial structure | Ops |
| R9 | Regulatory/permitting delays (months 4–6) | Medium | Medium | Permitting sits with the energy-service partner; roadmap assigns it explicitly, not to the hospital | Partner |
| R10 | Data privacy concerns at pilot facilities | Low | High | Platform processes energy telemetry only — no patient data, by design (documented) | Product |
| R11 | Cybersecurity of future connected deployments | Low (POC offline) | High | POC has no network surface; roadmap: authenticated access, encrypted telemetry, on-prem option before any field connection | Engineering |
| R12 | Video production quality issues (team-recorded) | Medium | Low | Judges score content, not production (handbook p. 16); runbook + checklist minimize risk | Team |
| R13 | Overclaiming in pitch materials | Low | High | Every number traces to `results/demo-results.json`; rubric self-assessment refuses unevidenced 5s | Product |
| R14 | Deadline mis-conversion (DST transition during sprint) | Low | Critical | Deadline fixed at 12:00 PM ET Sun Nov 1 = **6:00 PM WAT** (post-DST EST); internal upload target 4:00 PM WAT; countdown shown in-app | Team |

## Top three by exposure

1. **R6** — the honest answer to "what if your outage pattern is wrong" is that the platform turns the pattern into an explicit, editable input and shows how the optimal design flips (daytime → PV-first; evening → storage-heavy). That transparency *is* the mitigation.
2. **R2** — met head-on rather than papered over: labelled synthetic data + test suite + reproducibility.
3. **R14** — solved already: countdown chip in the app header and the runbook.
