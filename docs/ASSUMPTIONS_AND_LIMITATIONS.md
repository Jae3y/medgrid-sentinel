# Assumptions & Limitations

The product computes; it does not claim. Each item below lists the assumption, why it matters, and how it is handled.

## Data
| Assumption | Effect | Handling |
|---|---|---|
| Hospital loads are an **illustrative** 250-bed profile (6,770 kWh/day; T1 86 kW, T2 104 kW, T3 93 kW avg) | Absolute hours and litres depend on it | Fully editable in the Digital Twin; replaced by circuit-level metering in pilot months 1–3 (shadow-mode gate ±15%) |
| Tier mapping (which circuit is life-critical) | Defines "critical service" | Configurable by the hospital's engineers; reconciled to the full Brief #13 text |
| NASA POWER is satellite-derived, not an on-site pyranometer | ~5–10% daily irradiance error is typical for reanalysis | PR −10% sensitivity still pays back in 3.7 yr; pilot adds an on-site sensor |
| GHI used as plane-of-array irradiance (12° N, low tilt) | Small yield bias | Documented; conservative PR 0.82 and explicit temperature derate |

## The replay
| Assumption | Handling |
|---|---|
| The hospital feeder is dark for the full 22 Sep – 31 Oct window. In reality Maiduguri town was partly fed by the emergency gas plant. | "Grid hours/day during outage" slider (0–12 h) |
| Fuel supply: 6,000 L/week in two drops, 10,000 L tank, 60% full at start | Supply-curve chart over 0–16,000 L/week; the convergence point is shown |
| Outage starts 00:00 on 22 Sep (exact hour not public) | Monte Carlo randomises start hour and day |
| Status-quo generator sized to the full peak (450 kW) | Deliberately generous to the baseline |

## Engineering model
- **15-minute resolution.** Sub-second transients, protection coordination, inrush and motor starting are not modelled. The 15 s transfer break is represented as an energy gap and counted as an interruption.
- **Battery:** lumped AC efficiency (0.95 each way); no temperature or ageing dynamics within the replay. Lifecycle replacement in year 12 instead.
- **Generator:** a two-term fuel curve (10 L/h + 0.27 L/kWh), not a specific datasheet. Reliability is from U.S./nuclear/Hong Kong fleets (NREL); Nigerian maintenance practice may be closer to the "poor" class, which is shown.
- **Voltage and frequency** are simulated telemetry only. There are no harmonic/THD claims.
- **The governor** knows the *scheduled* delivery calendar but not future delays. That is realistic, and it is why the 24 h margin exists.

## Economics
- Prices are for October 2026 (diesel ₦1,950/L, FX ₦1,335/$, Band A ₦207/kWh); all are volatile, so a sensitivity table is provided.
- The installed costs ($650/kWp, $260/kWh, $110/kW, +15% EPC) are planning estimates. Quotes from two licensed EPCs replace them in month 4–6.
- Annual savings degrade with PV yield (conservative). No diesel price escalation is assumed.
- Resilience value is **not monetised**.

## Product / safety boundary
MedGrid Sentinel is decision support plus a **supervisory** dispatch design. It never replaces protection relays, ATS logic or certified hospital essential-electrical-system design. In the pilot it runs in **shadow mode** (recommend and log, not actuate) until measured-vs-predicted performance passes the gate. Then it dispatches only through the inverter/generator controller's certified interfaces. This is not a certified medical or electrical-safety product.

## What is not claimed
No measured hospital performance, no partner, no pilot, no clinical outcomes, no compliance certification.
