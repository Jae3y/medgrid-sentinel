# Brief Selection & Competition Strategy

**Status: LOCKED** — Brief **#13 "Power for a city the grid can't protect"** · Track **2 — Digital Solutions & AI** · Setting **B — Non-residential (healthcare)**.

---

## 1. The decision, and why

The handbook's healthcare-relevant briefs (Appendix B, p. 34) were scored in a decision matrix against the five official judging criteria (Impact 25%, Innovation 25%, Sustainability 25%, Feasibility 15%, Scalability 10%) plus internal criteria (data availability, 48-hour demonstrability, originality).

| Criterion (weighted) | #1 Off-grid cold storage for clinics | #12 Relocatable solar, hospital on the move | **#13 Power for a city the grid can't protect** |
|---|---|---|---|
| Impact (25%) | Strong (doses protected is crisp) | Strong (theatre hours) | **Strong (critical-service hours, whole-facility scope)** |
| Innovation (25%) | Medium — crowded cold-chain space | Medium — relocatable hardware is the core ask, not our strength | **Strong — predictive dispatch + honest economics for critical facilities is the gap** |
| Sustainability (25%) | Strong | Medium (logistics burden) | **Strong (diesel displacement + EaaS financing lens)** |
| Feasibility (15%) | Strong (small system) | Weak-medium — brief owner expects relocatable hardware; we build software | **Strong — exact metric is computable in our deterministic engine** |
| Scalability (10%) | Medium | Medium | **Strong — configurable twin replicates across facilities/countries** |
| Fit to MedGrid Sentinel identity | Narrow (refrigeration slice) | Partial (hardware brief) | **Direct (microgrid resilience = our core)** |

**Verdict:** #13 wins on the combination that matters. Its metrics — *hours of critical service maintained during a line outage* and *diesel litres avoided* — are precisely what a hospital microgrid digital twin computes, they are demonstrable with deterministic evidence in 48 hours, and the brief's framing (grid failures threatening critical services) matches Nigeria's documented reality (12+ national grid disturbances in 2024 by industry/media counts; [DATA_SOURCES.md](DATA_SOURCES.md)).

Briefs #1 and #12 remain documented fallbacks: the engine already computes cold-chain uptime (Tier-1 refrigeration is a first-class load) and theatre-hours metrics; re-scoping to #12 would touch the brief-selection documents and demo script, not the engine.

## 2. The locked definitions

Extracted verbatim from Innovator Handbook Appendix B (p. 34):

> **#13 — Power for a city the grid can't protect.** Success metric judges look for: **Hours of critical service maintained during a line outage, and diesel litres avoided.**

| Item | Locked definition |
|---|---|
| Community | Hospitals and clinics in Nigerian urban centres served by feeders that fail during national grid disturbances |
| User | Hospital facility/works engineer and duty manager |
| Payer | Hospital management (ownership) or an energy-service provider under EaaS (both modelled) |
| "Critical service" | Tier-1 (life-critical: OT, ICU, cold chain, oxygen, ED) + Tier-2 (clinical priority: wards, lab, pharmacy, IT, kitchen, water) |
| Metric 1 computation | Energy-weighted hours where served critical demand ≥ 99% of demanded critical demand, summed over all islanded hours (includes the 0.5 h simulated reconnection delay) |
| Metric 2 computation | Diesel litres consumed by the Sentinel-managed system vs a diesel-only backup baseline (grid + genset, generator sized to carry full load) over identical loads and outage schedules |
| Baseline | The typical current installation: Band A grid supply when available + 450 kW-class diesel generator during outages. No PV, no storage. |
| Intervention | 300 kWp PV + 600 kWh LFP storage + 250 kW inverter + intelligent dispatch layered on the existing 400 kW genset |

Headline computed results (brief scenario B — 12.5 h islanded window; full table in [IMPACT_AND_METRICS.md](IMPACT_AND_METRICS.md)):

- **Metric 1: 12.50 / 12.50 h maintained (100%), 0.00 kWh unserved Tier-1 energy**
- **Metric 2: 763 L vs 1,295 L baseline = 532 L avoided (−41%)** in the 3-day run; **23,910 L/yr avoided** annualized

## 3. Why this wins on the rubric (strategy note)

- **Impact:** the metric is the brief's own metric, computed from a deterministic engine and shown live — not asserted.
- **Innovation:** the root cause existing solutions miss is *decision quality*: hospitals buy hardware (diesel, or solar on a brochure) but have no way to know how the system will behave at 06:00 on the day the feeder fails, or what it will actually cost. Sentinel makes design and dispatch decisions computable — including the uncomfortable results (negative NPV at commercial rates; storage unnecessary for daytime outages).
- **Sustainability:** diesel displacement (−41% outage-day, −23,910 L/yr), maintainable locally (LiFePO4 + standard genset + software), payback 7.9 yr — pays for itself over its 20+ year life; EaaS structure closes with concessional capital (breakeven 4.6% financing) which is exactly how Nigerian healthcare solar is actually financed (NSIA-LUTH precedent).
- **Feasibility:** 58 unit tests, production build verified, deterministic replay, every number reproducible via `npm run results`.
- **Scalability:** one configuration object per facility; the sizing engine already demonstrates that the optimal design changes with outage timing (PV-first for daytime outages, storage-heavy for evening outages).

## 4. Discrepancies and clarifications log

Per the master instructions, where other material differs from the handbook, the handbook governs and the discrepancy is logged:

1. **Full brief text.** The handbook states full briefs are released *during the Kick-off call* (FAQ, p. 26). We built against the published Appendix B summaries and metrics. **Action required from the team: reconcile against the full Brief #13 text at kick-off; if the partner's definition of "critical service" or the payer differs, only the definitions section above and the demo narrative change — the engine already computes both metrics generically.**
2. **Deadline conversion.** Handbook deadline: Sunday Nov 1, 12:00 PM ET. U.S. DST ends Sun Nov 1 at 02:00 ET, so the deadline is in EST (UTC−5) = **6:00 PM WAT** (the sprint *begins* Oct 30 12:00 PM EDT = 5:00 PM WAT). Internal target: all six deliverables uploaded by **4:00 PM WAT Sunday** for margin.
3. **File naming.** Handbook FAQ suggests `TeamName_Brief##_Demo.mp4` — we adopt `MedGridSentinel_Brief13_Demo.mp4` / `MedGridSentinel_Brief13_Pitch.mp4` in the recording runbook.
4. **Team size.** Handbook recommends 3–5 members; solo entries are permitted. Registration details are the team's to confirm (see `docs/BUILD_PROGRESS.md` § Remaining user actions).
