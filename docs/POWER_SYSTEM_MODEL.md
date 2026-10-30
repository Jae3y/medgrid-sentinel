# Power System Model — Engine Deep-Dive

Companion to [TECHNICAL_METHODOLOGY.md](TECHNICAL_METHODOLOGY.md) (equations) — this document explains *behaviour*: what the engine does in each operating mode and why.

## 1. Operating modes

### GRID-CONNECTED (normal)
1. PV serves load first (free energy first).
2. Grid covers the remainder, capped by the import limit (500 kW) and, if configured, a peak-shave target.
3. The battery discharges **only above the reserve floor** (80% SOC) — it exists to protect outages, not to arbitrage.
4. Overnight (00:00–06:00) the battery may grid-charge to restore the reserve after an outage — cheap Band A power at ~₦210/kWh vs diesel ~₦480/kWh.
5. PV surplus beyond load charges the battery; whatever still remains is **curtailed and counted** (visible in the UI as an optimization opportunity).

### GRID OUTAGE (islanded)
1. Loss of supply → the tie opens; the battery assumes the bus **instantly** (UPS role).
2. The genset start command fires; after the 1-step (15-min) delay it closes onto the island — the battery bridged the gap (tested: outage step 0 genset off, step 1 on).
3. Battery discharges toward its **15% floor**; the genset covers deficits and, when load is below its 120 kW minimum-load point, tops the battery up instead of wet-stacking (inefficient under-loading is logged as a warning event).
4. Grid-connected peak support by the genset is a configuration flag, off by default.
5. On supply return, the tie stays open for the 0.5 h stability delay, then re-closes (tested).

### POWER-QUALITY TRIP (simulated)
Scenario-defined sags/swells/frequency excursions beyond thresholds → protective islanding, same islanded machinery, event-logged with the measured (simulated) value. Within-band disturbances log a warning and ride through.

### FAILURE MODES (honest)
- **Generator fault (scenario G):** solar + storage alone carry the site; the pre-dawn window that they cannot cover appears as **unserved energy and a sub-100% continuity figure** — visible, event-logged, never smoothed over.
- **Undersized design (scenario I):** continuity holds only because the generator picks up the slack — the report shows the diesel penalty (1.2–1.4× the brief design's fuel) rather than a failure.
- **Tier-1 deficit:** if generation truly cannot cover life-critical load, the step logs a CRITICAL event and the metric reports the deficit. (Tested.)

## 2. Why these dispatch choices

- **PV before grid before battery before genset** minimizes both cost (₦0 → ₦210 → reserve-limited → ~₦480/kWh) and emissions, in that strict order.
- **Reserve policy** is the resilience lever: the UI exposes it and the recommendations engine quantifies the trade-off (+10% reserve = +10% of nameplate as ride-through, at the cost of one solar cycle).
- **Genset min-load management** reflects real diesel practice (wet stacking below ~30% load); the model charges the battery to keep the set in its efficient band and flags violations.
- **Reconnection hysteresis** prevents chattering reconnection on a sickly grid — cheap to model, operationally important.

## 3. Validation performed

| Property | Method | Result |
|---|---|---|
| Power balance | Identity tested at every step of a 3-day run and during genset-carrying islands | ≤ 1e-6 kW residual |
| Energy conservation | served + unserved ≈ demand over full runs | within rounding |
| Battery floors | min SOC over islanded runs ≥ 15% (never below floor) | pass |
| Reserve policy | grid-connected discharge never dips below 80% (peak-shave test) | pass |
| Genset start bridging | outage step 0 battery-served, step 1 genset | pass |
| Tiered shedding | capacity-limited island: T1+T2 served, T3 sheds | pass |
| Honest failure | genset-fault scenario reports unserved T1 | pass |
| Determinism | identical configs → identical step arrays | pass |
| Hand-calculated physics | PV formula, battery charge/discharge energies, fuel curve, CRF, NPV, IRR | all match hand math |

**Test suite: 58 tests, all passing** (`npm test`). Production build verified.

## 4. Deliberate exclusions

Grid dynamics (frequency response of the national system), facility-level network power flow, harmonics/THD, storage degradation physics within a run, export-to-grid revenue. Each is listed with its reason and roadmap status in [ASSUMPTIONS_AND_LIMITATIONS.md](ASSUMPTIONS_AND_LIMITATIONS.md).
