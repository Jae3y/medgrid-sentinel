# Technical Methodology — Equations, Units, Constraints

All units: **power kW (AC at the main bus) · energy kWh · time h · one step Δt = 0.25 h (15 min) · currency ₦ (with $ where noted)**.

## 1. Load model

Each circuit *i*: `P_i(t) = ratedKw_i × profile_i[hour(t)]`, hourly-utilization fractions 0..1.
Tier demand: `D_T(t) = Σ_{i∈T} P_i(t)` for T ∈ {1 life-critical, 2 clinical-priority, 3 deferrable}.
Facility: 250-bed reference hospital, 16 circuits, ≈ **6,770 kWh/day**, tier installed bases 120/165/165 kW.

## 2. Solar PV

```
P_PV,dc(t) = kWp × G(t)/1000 × PR           [kW]
P_PV,ac(t) = min(P_PV,dc(t), Inverter_kW)   [kW]  (excess = curtailed)
```
`PR = 0.78` includes inverter, temperature, soiling, cabling — **no second inverter-efficiency factor** (avoids double counting). `G(t)`: synthetic bell-curve irradiance (sunrise 06:12, sunset 18:42), day types sunny 920 / partly 640 / overcast 300 / harmattan 480 W/m² peak, ±4% seeded noise. Insolation of a sunny day ≈ 5.9 kWh/m². **Explicitly synthetic, labelled; not meteorological data.**

## 3. Battery

```
SOC(t+1) = SOC(t) + η_ch·P_ch·Δt − P_dis·Δt/η_dis     [kWh]
η_ch = η_dis = 0.95 (lumped one-way, AC-coupled incl. inverter)
```
Constraints: `minSOC = 15%`, `maxSOC = 100%`, `P_ch ≤ 200 kW`, `P_dis ≤ 200 kW` (further limited by headroom/floor each step). **Floor policy:** islanded → `minSOC`; grid-connected → `max(minSOC, reserve=80%)` so outages start with a full reserve. Off-peak grid charging (00:00–06:00) restores the reserve. Default 600 kWh nominal.

## 4. Diesel generator

```
L/h = fuelFixedLph + fuelLinearLperKwh × P_out        (10 + 0.27·P → ≈0.31 L/kWh @250 kW)
```
`ratedKw = 400 kW`, `minLoadKw = 120 kW` (below this the set tops up the battery instead of wet-stacking), start delay = 1 step (battery bridges it), maintenance ₦3,500/h while running, fuel ₦1,550/L. Baseline uses a 450+ kW set sized to `1.15 × peak facility load`.

## 5. Grid & power quality

Band A tariff ₦210/kWh, import limit 500 kW, optional peak-shave target. Outage windows are day-scoped `[day, start, end)`. After supply returns, the tie re-closes after a **0.5 h stability delay** (hysteresis, IEEE-1547-inspired). PQ events (simulated telemetry): sags/swells/frequency excursions with ride-through or protective islanding per severity.

## 6. Dispatch (deterministic priority at the bus)

```
1. PV serves load                 pvToLoad = min(P_PV,ac, D_total)
2. Grid serves the remainder      gridToLoad = min(importLimit or peakShave, D_rem)   [if grid closed]
3. Battery serves the remainder   floor = islanded ? minSOC : max(minSOC, reserve)
4. Genset serves the remainder    output ≥ minLoad via battery top-up; startup delay bridged by battery
5. Shedding                       tier 3 → tier 2 → tier 1; Tier-1 deficits logged as CRITICAL events
Charging order: PV surplus → genset min-load top-up → off-peak grid (to reserve)
```

**Power balance identity (tested at every step, ≤1e-6 kW):**
```
pvKw + gridKw + gensetKw − battKw = served(1) + served(2) + served(3)
```

## 7. Metrics

- `criticalServiceHours = Σ_{islanded steps} min(1, served(T1+T2)/demand(T1+T2)) × Δt`
- `outageHours` = all islanded hours (includes the reconnection delay)
- `renewableShare = pvUsed / totalServed`; `CO₂ = litres × 2.68 kg`
- `opex = gridCost + dieselCost + gensetMaintenance` (per run or per day)

## 8. Annualization (explicit, editable mix)

320 normal days + 45 outage days (12.5 islanded h each) from a 3-day representative simulation (sunny normal / outage / partly-cloudy normal). All annual figures in this package = that mix; the mix has its own sensitivity rows (20/70 days) and is editable in the UI.

## 9. Financial equations

```
CapEx = kWp·800 + kWh·280 + invKw·120 + 12% install        (USD → ₦ @1,550)
CRF(r,n) = r(1+r)ⁿ / ((1+r)ⁿ − 1)                          r=14%, n=10 (EaaS); discount 18%
EaaS fee/yr = CapExₙ × CRF(14%,10) + O&M (2% CapEx)
EaaS breakeven financing rate: solve CRF(r,10)·CapEx + O&M = annualSavings   (bisection)
NPV = −CapEx + Σ_{y=1..10} (savings − O&M)/(1.18)^y
LCOE = (CapEx + Σ O&M discounted) / (Σ served kWh discounted)
Payback = CapEx / (savings − O&M)
```

## 10. Forecasting statistics

- Hybrid forecast = 0.5 × (7-day hourly mean) + 0.5 × schedule prior; scored vs a held-out synthetic day: **MAE 8.1 kW / RMSE 9.7 kW vs persistence 8.6 / 10.4** (kW on a 200–450 kW load — ≈3–4% error, honestly labelled synthetic).
- Anomalies: **leave-one-out z-score** per hour (a point scored against the other days' statistics), flag |z| ≥ 3 — with n=7 a conventional z can never exceed ≈2.27 for a single outlier, so leave-one-out is the correct small-sample method (documented in code).
- Depletion projection: usable energy above floor ÷ mean 12-h forecast demand.

## 11. Sizing optimizer

Exhaustive grid: PV ∈ {0…400 kWp} × battery ∈ {0…1,000 kWh}. Feasibility = continuity ≥ target **AND** diesel avoided ≥ 30%. Ranking = **total annualized cost** (opex + CapEx × CRF(14%,10)). Heuristic by construction; the grid, objective and constraints are all displayed in the UI.

## 12. Known modelling simplifications

No network-level power flow inside the facility; no storage degradation within a run; no grid dynamics beyond availability/PQ scenarios; no export-to-grid model (curtailment instead); hourly load profiles are piecewise-constant within the hour. All listed in [ASSUMPTIONS_AND_LIMITATIONS.md](ASSUMPTIONS_AND_LIMITATIONS.md).
