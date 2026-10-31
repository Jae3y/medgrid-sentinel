# Brief #13 Reconciliation Checklist — 2-minute team action

**Why this exists:** the Innovator Handbook publishes only one-line summaries and success metrics for the 16 briefs (Appendix B, p. 34). The **full brief text** — the partner's description, intended user/payer, and any extra requirements — was released at the Kick-off call (Thu Oct 29, 8 PM ET) and lives in channels only the team can access: the **submission portal, the Slack workspace (track/brief channels), the WhatsApp group, and email**. The build agent has no access to private channels, so this verification is the team's single remaining content action.

**Current status:** built against the published Appendix B summary. Engine and metrics are generic — reconciliation changes *definitions and narrative*, never the core product.

## Where to look (in order of likelihood)

1. Slack → the brief/track announcement channels (posted around the Kick-off)
2. The submission portal → briefs section
3. Kick-off call recording (Zoom, linked from the event site)
4. Email/newsletter from `hackathon@anneru.com`

## The 2-minute check — paste the Brief #13 text into the agent chat, or answer these three questions

| # | Question in the full brief | Our current definition | If it differs |
|---|---|---|---|
| 1 | **How does the partner define "critical service"?** (Only hospitals? Also water/telecom? Tier-1 only, or Tier-1+Tier-2?) | Critical service = Tier-1 (life-critical: OT, ICU, cold chain, oxygen, ED) + Tier-2 (clinical priority) at healthcare facilities | Metric computation is one constant away (`metrics` critical tier set); docs/demo wording updated by the agent in minutes |
| 2 | **Who does the partner name as user & payer?** | User: facility engineer / duty manager. Payer: hospital or EaaS provider | Business-model narrative and deck slide 4 re-pointed; engine unchanged |
| 3 | **Which city / what kind of line outage?** | Instantiated on Maiduguri (330 kV line vandalised 22 Sep – 31 Oct 2024) | Replay dates and site are configuration (`MAIDUGURI_EVENT`, NASA POWER dataset); the fleet already covers Kano, Abuja, Lagos, Port Harcourt |
| 4 | **Any extra constraints?** (e.g., community ownership, a specific technology) | None assumed | Scope note added; sizing/scenario knobs cover most variants |

## After the check

- If everything matches: delete this file's open question by writing "RECONCILED — <date>" below.
- If anything differs: paste the full text into the agent chat and say "reconcile Brief #13" — the agent updates `docs/BRIEF_SELECTION_AND_STRATEGY.md` §2, the demo/pitch scripts, the deck and the one-pager, and re-verifies the metric computation.

**RECONCILED:** ☐ (date + initials)
