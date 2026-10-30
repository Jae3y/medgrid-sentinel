# Impact & Metrics

Quantified against the locked brief's success metrics. All values from `results/demo-results.json` (reproducible: `npm run results`); definitions in [BRIEF_SELECTION_AND_STRATEGY.md](BRIEF_SELECTION_AND_STRATEGY.md) §2.

## Brief metric 1 — Hours of critical service maintained during a line outage

**Definition used:** energy-weighted hours where Tier-1 (life-critical) + Tier-2 (clinical priority) demand is ≥ 99% served, across all islanded hours (12.5 h window = 12 h outage + 0.5 h reconnection stability delay).

| Scenario (deterministic) | Islanded h | Critical-service h | Continuity | Unserved T1 |
|---|---|---|---|---|
| **B — 12-h line outage (brief headline)** | 12.5 | **12.50** | **100%** | 0.00 kWh |
| A — normal ops, two short trips | 2.5 | 2.50 | 100% | 0.00 |
| C — 24-h blackout | 24.5 | 24.50 | 100% | 0.00 |
| D — low solar week + outage | 12.5 | 12.50 | 100% | 0.00 |
| E — degraded battery (70%) | 12.5 | 12.47 | 99.7% | 0.00 |
| F — demand surge +30% | 12.5 | 12.50 | 100% | 0.00 |
| **G — generator failure** | 12.5 | 12.28 | 98.2% | shown honestly (pre-dawn deficit) |
| H — PQ disturbance trips | 1.5+ | full | 100% | 0.00 |
| I — undersized system | 12.5 | >12 (diesel-carrying) | high | 0.00 (diesel penalty instead) |
| J — brief scenario (city feeder collapse) | 12.5 | 12.50 | 100% | 0.00 |

**Annualized (45 outage days): 563 critical-service hours maintained per year.**
Interpretation for judges: the *baseline also holds continuity* — with a generator and fuel. The differentiators are (a) continuity that survives **generator failure or fuel-supply gaps** (scenario G shows exactly where solar+storage alone gives way), and (b) what the continuity costs, which is metric 2.

## Brief metric 2 — Diesel litres avoided

| Window | Baseline (diesel-only backup) | Sentinel-managed | Avoided |
|---|---|---|---|
| 3-day brief scenario | 1,295 L | **763 L** | **532 L (−41%)** |
| Annualized (320+45 mix) | 58,255 L | 34,345 L | **23,910 L/yr** |

Annualized consequences: **64.1 t CO₂/yr avoided** (2.68 kg CO₂/L) · **₦111.8M/yr operating savings** · fuel-logistics exposure reduced by ~41% on outage days.

## Secondary impact metrics (computed)

- Renewable share of served energy (brief scenario): **20.6%** over 3 days (sunny + outage + partly-cloudy mix)
- Generator runtime reduced on outage days (smaller deficits → shorter, better-loaded genset runs)
- Unserved Tier-1 energy: **0.00 kWh** across all non-failure scenarios — reported, not assumed
- Decision-quality impact (the sizing engine): for the tested daytime pattern the optimizer shows a PV-first design achieves the same continuity for **₦138M less CapEx** than storage-heavy alternatives; for evening outages it flips to storage. Preventing one wrong battery purchase (≈₦284M at $280/kWh × 600 kWh... per the CapEx table) can exceed a year of operating savings.

## Who feels the impact

- **Patients:** operating theatres, ICU, blood/vaccine cold chain and emergency lighting ride through grid failures (the tiered-load model makes this explicit, circuit by circuit).
- **Hospital finance:** −₦112M/yr opex; fuel-price exposure cut ~41% on outage days.
- **Facility engineers:** a duty-tool (depletion forecast, event log) instead of a spreadsheet guess.
- **Financiers/DFIs:** a computed subsidy gap (EaaS closes ≤ 4.6% financing) — fundable, auditable evidence.

## Honesty guardrails on these numbers

- All facility data is illustrative (labelled); the *engine* is validated, the *inputs* are references.
- Baseline is the realistic current practice (grid + right-sized diesel), not a strawman: the baseline also achieves continuity, and we say so.
- Failure scenarios are included in the evidence precisely because they show where the system gives way (G: pre-dawn window is the honest weak spot).
