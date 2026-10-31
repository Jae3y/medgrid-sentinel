# Power-System Model (engine v2)

Units: power in kW (AC, main bus), energy in kWh, fuel in litres, time in hours. Δt = 0.25 h (15 min); 96 steps per day. The engine (`src/engine/`) is deterministic: identical inputs and seeds always give identical outputs, and tests assert this.

## 1. Loads (`facility.ts`)
16 circuits in three tiers, each with a rated kW and a 24-hour utilisation profile: P_tier(h) = Σ ratedKw_i × profile_i(h) × loadScale. The illustrative 250-bed reference averages 6,770 kWh/day (Tier-1 86 kW, Tier-2 104 kW, Tier-3 93 kW) with a 430 kW peak. Tiering is decision support, not a medical-equipment standard; the hospital's engineers assign circuits.

## 2. Solar PV (`dispatch.ts`)
P_PV,dc(t) = kWp × G(t)/1000 × PR × f_T(t), and P_PV,ac = min(P_PV,dc, P_inverter).
- G(t): **measured** NASA POWER hourly all-sky GHI (W/m²), held constant over the hour's four steps, which preserves hourly energy exactly. GHI stands in for plane-of-array irradiance at a ~12° latitude/low tilt; this is a documented approximation.
- Temperature: T_cell = T_amb + (NOCT − 20)/800 × G (NOCT 45 °C), and f_T = 1 + γ(T_cell − 25) with γ = −0.0035/°C. T_amb is NASA POWER T2M.
- PR = 0.82 excluding temperature (inverter, soiling under Sahel dust, mismatch, cabling). Legacy synthetic scenarios use PR 0.78 including temperature, with no double counting.
- Result: Maiduguri yield 1,545 kWh/kWp·yr on the bus (GHI 2,104 kWh/m²·yr).

## 3. Battery (`battery.ts`)
SOC(t+Δt) = SOC(t) + η_ch P_ch Δt − P_dis Δt / η_dis, with η_ch = η_dis = 0.95 (AC-coupled, lumped), and min/max SOC 15% / 100% of nominal.
- Power limits: P_ch ≤ min(P_ch,max, (SOC_max − SOC)/(η_ch Δt)) and P_dis ≤ min(P_dis,max, (SOC − floor) η_dis / Δt).
- Floors: grid-connected = max(minSOC, 80% outage reserve). Islanded = minSOC, or for Sentinel the **clinical reserve** while the generator is available: floor = minSOC + P_T1 × 2 h / η_dis.
- A mid-step loss of headroom rescales charge flows so that displayed power always equals the energy booked.

## 4. Generator (`genset.ts`, `dispatch.ts`)
Fuel: L/h = F₀ + F₁ × P with F₀ = 10 L/h and F₁ = 0.27 L/kWh (≈ 0.31 L/kWh at 250 kW for a 400 kW-class set). Rated 400 kW (hybrid strategies) or max(450, 1.15 × peak) kW (status quo).
- **Start-to-transfer break:** startupSeconds = 15 s (ATS class). This is a *time* gap: in the first running step the set delivers min(need, rated) × (1 − 15/900). Without storage the whole bus is dark for 15 s, so every tier loses the same fraction (`isTransferGap`). With Sentinel the battery forms the island and covers the gap.
- **Fuel limit:** if a step needs more litres than remain, charging is cut first, then load; P_max = (L_left/Δt − F₀)/F₁. Below one quarter-hour of no-load burn (F₀Δt + 0.5 L) the tank counts as empty.
- **Failures:** fail-to-start on outage *n*; failure after cumulative run-hours *h*; repair for *R* hours. Values are injected deterministically (scenarios) or sampled (Monte Carlo).

## 5. Fuel logistics (`types.ts: FuelConfig`)
Tank capacity, initial litres, deliveries of D litres every *k* days at a set hour. Each delivery is capped by free tank space, and per-delivery delays or misses can be applied. Mass balance is asserted by tests: initial + delivered − burned = final.

## 6. Grid & islanding
Outage windows (explicit, or expanded from a seeded feeder regime: Poisson count with mean 1.08/day, log-normal duration with median 4 h and σ 0.8) and breaker-tripping power-quality events open the tie. Reconnection waits 2 steps (30 min) of healthy grid (hysteresis). Grid import is capped at 500 kW, with optional peak-shaving and off-peak charging to restore the outage reserve.

## 7. Dispatch strategies (identical physics, different decisions)
| Strategy | Islanded decisions |
|---|---|
| `baseline` | Generator load-follows the whole facility |
| `baseline_rationed` | Same, with Tier 3 switched off while islanded |
| `conventional` | Battery first. Generator auto-starts at floor+5% SOC or when the battery's power is insufficient, then load-follows (top-up charging only to reach minimum load). Stops when PV covers the load. |
| `sentinel` | (a) **Fuel-runway governor** sets the service level. (b) **Clinical reserve** floor. (c) **Cycling**: the set starts when SOC ≤ reserve or the battery can't carry the load; it runs at load + charging up to 90% SOC, with a minimum 1 h run; it stops when SOC ≥ 90% and the battery can carry the load, or when there is PV surplus. (d) **Opportunistic solar**: PV that would be curtailed serves deferred Tier-2, then Tier-3. |

### Fuel-runway governor (evaluated hourly and on every islanding or availability change)
- Horizon H = clamp(hours to next *scheduled* delivery + 24 h margin, 24 h, 168 h); 24 h when no fuel schedule exists. The governor does not know future delays.
- Supply S = L_tank × (kWh/L at max(minLoad, 75% rated)) + (SOC − floor_min) × η_dis + 0.7 × PV_forecast(H). Fuel counts only if the generator is usable.
- PV_forecast = mean of the last three days' PV potential × H/24. The 0.7 factor is calibrated on held-out data: the sun met ≥ 70% of the forecast on 94.5% of 2024 days (`forecast.ts`).
- Need for each level ℓ ∈ {3: all, 2: T1+T2, 1: T1 + ½T2, 0: T1} is the scheduled demand over H × 1.04 losses. The governor chooses the highest ℓ with Need ≤ S; stepping *up* needs a 10% margin (hysteresis). Every change is logged with the numbers.

## 8. Allocation, shedding and metrics
- Served power is allocated Tier 1 → 2 → 3, except during a transfer gap, when the loss is proportional across tiers. *Unserved* (a supply deficit) is reported separately from *deferred* (policy).
- **Maintained hours** (strict) count islanded steps where served ≥ 99.5% of demand (Tier 1, and Tier 1+2). A ≤ 90 s transfer break counts as an interruption episode but keeps the step.
- The energy-weighted `criticalServiceHours` is kept for the legacy 3-day scenarios.
- **Power balance** holds at every step: P_PV + P_grid + P_gen − P_batt = Σ served, with residual < 1e-6 kW. It is tested for all four strategies, including fuel-limited and failure steps.

## 9. Simulated telemetry
Voltage and frequency (230 V / 50 Hz with small seeded variation; PQ-event values during disturbances) are clearly labelled as simulated, never measured. No harmonic/THD claims are made; there is no waveform model.
