# Standards & Regulatory Context

## What this POC uses standards for

The platform is a **decision-support simulation**. Standards inform model structure, vocabulary and thresholds; **no claim of certification, compliance or certified protection is made anywhere in this package.**

| Standard | Role in this project |
|---|---|
| **IEEE 1547** (distributed energy interconnection) | Conceptual basis for the grid-tie state machine: islanding on loss of grid, reconnection only after a stability delay with hysteresis (default 0.5 h). The model implements the *concept* of anti-islanding behaviour in simulation. |
| **IEEE 1159** (power-quality monitoring) | Vocabulary and thresholds for the PQ module: sag/swell classification and ride-through vs trip behaviour. Simulated telemetry only — no measurements. |
| **IEEE 519** (harmonics) | **Deliberately not implemented** — THD requires a defined waveform model; faking it would violate the project's honesty rules. Listed as a roadmap item. |
| **IEC 61724** (PV system performance) | The PV model's performance-ratio framing (PR includes inverter + soiling + temperature + cabling; no double-counted inverter efficiency). |
| **IEC 62109 / IEC 62619** (inverter & battery safety) | Inform the *assumption set* (LFP chemistry, BMS-managed SOC floors). No hardware is designed or certified here. |
| **NERC (Nigeria) MYTO tariff framework** | Grid tariff default (Band A ≈ ₦210/kWh) sourced from published orders; flagged for re-verification against the current order at pilot time. |
| **Nigerian electrical installation practice** | The twin models a facility's *energy flows*, not its wiring design; installation/permitting requirements appear in the deployment roadmap (months 4–6) as partner obligations, not claims. |

## Explicit non-claims

1. Sentinel does **not** control any real breaker, relay or medical equipment, and must never be connected to hospital protection systems.
2. Simulated voltage/frequency values are model telemetry, not measurements at any facility bus.
3. "Compliant with IEEE/IEC" is **not** claimed; "structured around" is the strongest true statement.
4. No medical-device, electrical-contractor or engineering-certification representation is made or implied.
