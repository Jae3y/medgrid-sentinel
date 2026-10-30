# Pitch Video Script — up to 5 minutes (target 4:30)

**File name:** `MedGridSentinel_Brief13_Pitch.mp4` · 1080p or lower · < 500 MB · English
**Structure (handbook §10 recommended):** problem → solution → demo/evidence → feasibility & cost → scale → community fit → team & next steps. One presenter is sufficient (handbook FAQ); voice-over over the product is permitted.

## Script (read verbatim; screen cues in brackets)

### 1. The problem (0:00–0:45)
[Screen: Dashboard showing an islanded bus]
"In 2024 Nigeria's national grid failed more than twelve times. When it does, a hospital drops onto diesel — a fuel that cost Lagos buyers around fifteen hundred and fifty naira a litre in early 2026, roughly seven times the grid tariff. Keeping an operating theatre alive through one twelve-hour outage burns over a thousand litres. Hospitals are buying solar and batteries — but nobody can tell them, before they spend, whether the design will actually hold the theatres through the next feeder collapse. That's a decision-quality gap. That's what we built against."

### 2. The brief and the community (0:45–1:15)
[Brief & Metrics tab]
"We're answering Handbook Brief #13 — power for a city the grid can't protect. Our community: urban Nigerian hospitals on feeders that fail with the national grid. Our user: the facility engineer. Our payer: the hospital, or an energy-service provider under an Energy-as-a-Service contract. The brief's metrics are ours to move: hours of critical service maintained during a line outage, and diesel litres avoided."

### 3. The solution (1:15–1:50)
[Digital Twin — one-line diagram]
"MedGrid Sentinel is a digital twin of the hospital microgrid — solar, storage, grid and generator dispatching around tiered clinical loads: theatres, ICU and cold chain first. Underneath it, a deterministic fifteen-minute simulation engine — no black boxes. On top: a scenario lab, a financial engine, and predictive intelligence that forecasts demand and tells the duty manager exactly how long the batteries can hold."

### 4. Evidence (1:50–2:50)
[Scenario Lab run of Scenario J; then Brief & Metrics]
"Here's the brief scenario — the feeder collapses at six a.m. Watch the event log: islanding, battery bridging the generator start, tiered shedding of deferrable load. Results from the engine: twelve point five zero of twelve point five islanded hours of critical service — one hundred percent continuity, zero unserved life-critical energy. Diesel: 763 litres against the baseline's 1,295 — forty-one percent avoided. Annualized: 23,910 litres and 64 tonnes of CO₂ a year, 112 million naira saved. And when we fail the system on purpose — generator gone — Sentinel shows the exact hours it gives way. We show deficits. That's the point."

### 5. Feasibility & cost (2:50–3:40)
[Financials tab]
"Feasibility: the engine passes 58 unit tests with hand-checked physics; the build is verified; every number is reproducible from the repository with one command. Cost: about 760 million naira — 490 thousand dollars — for the reference design; payback 7.9 years. And here's the honest part: at commercial Nigerian interest rates the project doesn't clear — the Energy-as-a-Service version closes only below 4.6 percent financing. That's not a weakness in the slide — it's the exact subsidy question that real programmes like the NSIA-LUTH cancer-centre microgrid exist to answer. Our tool computes that gap per hospital instead of hiding it. It will even tell you not to buy batteries: for daytime outages, solar-first is optimal; for evening outages, it flips."

### 6. Scale (3:40–4:05)
[README or architecture view]
"The engine is configuration-driven: one file per facility. The same model runs a rural clinic today and a teaching hospital tomorrow — tariffs, outage patterns and prices are inputs. Nigeria first, African health systems next, and the same resilience method travels to US hospitals where the economics differ."

### 7. Team & next steps (4:05–4:30)
[Deployment roadmap]
"Everything you've seen was built during this sprint. Next: a metering-first pilot with one facility in months one to three, an energy-service partnership by month six, and a live, measured-versus-predicted deployment within the year. We're asking for the pathway — the cohort — to put this in front of one hospital and prove it. MedGrid Sentinel: uninterrupted critical care, priced and engineered before the lights go out."

## Delivery notes

- 140–150 wpm; total ≈ 640 words → ~4:25 at pitch pace. If over 5:00, cut §6 first (scale is also on deck slide 5).
- Show the product for at least 60% of runtime; slides optional (deck is submitted separately).
- Numbers on screen must match narration exactly; the checklist file verifies this.
