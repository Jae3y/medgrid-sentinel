# Assumptions & Limitations Register

Every assumption worth a judge's attention, with its mitigation. Cross-references: [RESEARCH_LIMITATIONS.md](RESEARCH_LIMITATIONS.md), [TECHNICAL_METHODOLOGY.md](TECHNICAL_METHODOLOGY.md) §12.

## Modelling assumptions

| # | Assumption | Value | Why / mitigation |
|---|---|---|---|
| A1 | Facility loads | 250-bed hospital, 16 circuits, 6,770 kWh/day, tiered 120/165/165 kW | Illustrative reference profile, labelled everywhere; fully editable; metering-first pilot replaces it with measured data (roadmap M1–3) |
| A2 | Irradiance | Synthetic bell-curve, sunny ≈ 5.9 kWh/m²/day, ±4% seeded noise | Clearly labelled synthetic scenarios, not weather data; TMY (NASA POWER/Solargis) is a drop-in at pilot |
| A3 | PV performance ratio | 0.78 (includes inverter, soiling, temperature) | Standard planning value; ±10% sensitivity row; IEC 61724 framing |
| A4 | Battery efficiencies | 0.95 charge / 0.95 discharge, lumped one-way (AC-coupled) | Conservative vs LFP datasheets; no within-run degradation modelled |
| A5 | Genset fuel curve | 10 L/h + 0.27 L/kWh (≈0.31 L/kWh @ 250 kW) | Standard two-term form; matches medium-speed diesel ranges; editable |
| A6 | Reconnection delay | 0.5 h stability delay before tie re-closes | Conservative; IEEE-1547-inspired hysteresis |
| A7 | No grid export | PV surplus beyond load+storage is curtailed | Nigerian interconnection reality for most facilities; curtailment is counted and shown |
| A8 | Annualization mix | 320 normal + 45 outage days (12.5 islanded h each) | Explicit, editable, dedicated sensitivity rows (20/70 days) — not a buried constant |
| A9 | Prices | Grid ₦210/kWh · diesel ₦1,550/L · FX ₦1,550/$ | 2025-26 indicative; ±20–30% sensitivity; re-verify MYTO order & NBS tracker at pilot |
| A10 | CapEx rates | $800/kWp · $280/kWh · $120/kW · 12% install | 2025-26 indicative; ±20% sensitivity |
| A11 | CO₂ factor | 2.68 kg CO₂/L diesel | DEFRA-class stationary combustion factor |
| A12 | Discount/financing | 18% discount, 14% EaaS financing, 10-yr analysis | Nigerian commercial reality; breakeven financing (4.6%) computed rather than assumed |

## Known limitations (stated, with status)

| # | Limitation | Consequence | Status / roadmap |
|---|---|---|---|
| L1 | All facility data is synthetic/illustrative | Results are engineering projections, not measurements | **Mitigated by design**: engine is data-agnostic; pilot is metering-first |
| L2 | Decision-support only — no real-world control | Cannot cause or prevent any physical event | Permanent boundary; no control interfaces exist |
| L3 | No within-run battery degradation | Multi-year duty not modelled physically | Financial model handles replacement; physics model roadmap item |
| L4 | PQ telemetry is simulated | Voltage/frequency values are scenario-driven model outputs | Labelled in-product; IEEE-1159 vocabulary only |
| L5 | No harmonics/THD | Cannot speak to waveform-level power quality | Deliberately omitted (no waveform model); roadmap item |
| L6 | No national-grid dynamics | Grid is an availability/PQ scenario, not a dynamic model | Out of scope by design; stated |
| L7 | No facility-level network power flow | Single-bus model; feeder detail absent | Arrives with measured circuit data |
| L8 | Hourly load profiles (piecewise-constant within hour) | Sub-hourly peaks smoothed | 15-min simulation resolution retained; AMI data upgrades granularity |
| L9 | Full official brief text pending kick-off | Metric definitions could shift | Reconciliation action logged; engine computes metrics generically |
| L10 | No US-hospital data | US value stack unverified | Documented as adaptation hypothesis only |
| L11 | Solo/small team entry (confirm at registration) | Fewer hands for the video/portal steps | Recording runbook minimizes effort; handbook permits solo |

## Integrity rules observed throughout

No fabricated datasets, partnerships, pilots, team members, accuracy claims, test results or deployment claims. Every illustrative value is labelled at the point of use. Every external claim carries a confidence level ([DATA_SOURCES.md](DATA_SOURCES.md)).
