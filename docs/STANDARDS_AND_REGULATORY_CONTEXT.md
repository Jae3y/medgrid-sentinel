# Standards & Regulatory Context

**No compliance or certification is claimed.** This page maps which standards govern a real deployment and where the prototype already follows their vocabulary or logic.

| Standard / rule | Scope | Relevance to Sentinel | Status in the POC |
|---|---|---|---|
| **IEC 60364-7-710** | Electrical installations in medical locations (group 0/1/2 rooms, safety power supply changeover times) | The Tier-1 mapping mirrors the "group 2" concept (ICU and theatres). Changeover classes (≤ 0.5 s, ≤ 15 s) motivate counting the 15 s generator transfer break as an interruption and battery-formed islanding as break-free | Modelled conceptually; real design by a licensed engineer |
| NFPA 99 / NFPA 110 / NEC Art. 517 (U.S.) | Health-care essential electrical systems; emergency power (Type 10 = 10 s transfer) | For the U.S. fleet configuration (Houston); same 10–15 s transfer logic | Referenced for scalability |
| IEEE 1547-2018 / IEC 62116 | DER interconnection, anti-islanding, ride-through | Islanding/reconnection with a 30-min stability delay; PQ ride-through vs trip events | Simplified state machine, simulated |
| IEEE 1159 | Power-quality event vocabulary (sag, swell, frequency events) | PQ scenario H and labels | Synthetic events only |
| IEEE 519 | Harmonics | Not modelled (no waveform model): stated | — |
| IEC 61724-1 | PV performance monitoring | PR definition and the measured-vs-predicted reporting in the pilot | PR used as an input; monitoring in pilot |
| IEC 62446-1 | PV system documentation, commissioning, testing | Pilot months 4–12 | Roadmap |
| IEC 62109-1/-2 | Safety of power converters (inverters/PCS) | Equipment selection | Roadmap |
| IEC 62619 / IEC 62933 | Safety of industrial lithium cells; BESS safety | LFP container selection | Roadmap |
| Nigeria: NEMSA (Nigerian Electricity Management Services Agency) | Inspection and certification of electrical installations | Pilot gate in months 4–6 | Roadmap |
| Nigeria: NERC regulations (mini-grid, embedded generation) | Behind-the-meter supply under EaaS/PPA; tariffs | EaaS structure is behind the meter (no sale to third parties) | Business model |
| Nigeria Data Protection Act 2023 | Personal data | No patient or personal data is collected; facility energy data is owned by the hospital | By design |

**Safety boundary:** Sentinel is supervisory. Protection, ATS changeover and inverter grid-forming stay with certified equipment. Sentinel's dispatch commands go through those devices' certified interfaces, after shadow-mode validation.
