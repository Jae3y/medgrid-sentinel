# Research Limitations

Stated plainly, per the project's honesty requirements.

1. **No facility measurements.** No hospital load data, fuel logs, outage logs or invoices were collected. All facility profiles are illustrative and labelled; the entire model accepts measured data unchanged (same interfaces).
2. **Full official brief text unavailable at build time.** The handbook releases complete briefs at the Kick-off. Selection and metric definitions rely on the published Appendix B summaries (p. 34). Reconciliation is a required user action (BUILD_PROGRESS.md).
3. **Grid-collapse statistics are contested.** Industry/media counts (12+ in 2024) differ from NERC's official quarterly reports. We cite the range and the discrepancy; the annualization mix (45 outage-days/yr) is an editable assumption with its own sensitivity row — not a buried "fact."
4. **Announced vs measured performance.** The NSIA-LUTH microgrid is an announcement; no independently measured operational results are published. Used only as a design-scale/financing precedent.
5. **No installation-level REA programme data** was reviewed within the sprint window; the REA/World Bank healthcare electrification context is qualitative.
6. **Price data are volatile.** Diesel (₦1,400–1,860/L band) and FX move weekly; defaults carry ±20–30% sensitivity and a verification action.
7. **No standards documents were purchased/quoted verbatim.** IEEE/IEC usage is at the level of public summaries and standard structure; nothing in the engine claims compliance.
8. **No academic literature search was performed to publication standard** (no database access, no citation manager, no snowballing). Domain equations (PV baseline model, two-term genset fuel curve, CRF finance) are standard engineering forms documented in TECHNICAL_METHODOLOGY.md with their assumptions.
9. **English-only sources** were consulted; Nigerian-language community sources were not.
10. **Single web-research pass** was conducted under sprint time constraints; findings were cross-checked only where they materially affected design decisions.

Each limitation maps to a mitigation in [ASSUMPTIONS_AND_LIMITATIONS.md](ASSUMPTIONS_AND_LIMITATIONS.md) or an action in [DEPLOYMENT_ROADMAP.md](DEPLOYMENT_ROADMAP.md) (months 1–3 are metering-first for exactly this reason).
