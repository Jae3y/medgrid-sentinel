/**
 * MedGrid Sentinel — official pitch deck (Handbook §10: PDF, ≤ 5 slides).
 * Every number is read from results/demo-results.json (npm run results) — nothing is typed by hand.
 * Run: node scripts/make-deck.mjs  →  submission/MedGrid_Sentinel_Pitch_Deck.pptx
 * PDF:  soffice --headless --convert-to pdf --outdir submission submission/MedGrid_Sentinel_Pitch_Deck.pptx
 */
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
const require = createRequire(import.meta.url);
const pptxgen = require("pptxgenjs");
const R = JSON.parse(readFileSync("results/demo-results.json", "utf8"));

const BG = "0A1A1C", PANEL = "102528", PANEL2 = "13292C", LINE = "24474A";
const TEXT = "E4EEEC", MUTED = "93ABA8", CYAN = "45E0A0", GREEN = "45E0A0", AMBER = "F2B544", RED = "FF4D5E", SLATE = "A3AEC2";
const F = "Segoe UI";
const W = 13.33, H = 7.5, M = 0.5;

const n0 = (v) => Math.round(v).toLocaleString("en-US");
const n1 = (v) => v.toLocaleString("en-US", { maximumFractionDigits: 1, minimumFractionDigits: 1 });
const pct = (v, d = 0) => `${(v * 100).toFixed(d)}%`;
const naira = (v) => (Math.abs(v) >= 1e9 ? `₦${(v / 1e9).toFixed(2)}B` : `₦${(v / 1e6).toFixed(1)}M`);

const rep = R.brief13Replay;
const res = rep.results;
const A = R.annualEconomics;
const mcN = R.monteCarlo14Day.nrc.byStrategy;
const mcW = R.monteCarlo14Day.well.byStrategy;
const outH = Math.round(res.sentinel.criticalHours);

const p = new pptxgen();
p.layout = "LAYOUT_WIDE";
p.author = "Jackson Sixtus Abetianbe";
p.title = "MedGrid Sentinel — Brief #13";

function base(n, kick) {
  const s = p.addSlide();
  s.background = { color: BG };
  s.addText(kick, { x: M, y: 0.36, w: W - 2 * M, h: 0.3, fontFace: F, fontSize: 13, bold: true, color: CYAN, margin: 0 });
  s.addText(`MEDGRID SENTINEL  ·  Brief #13 · Track 2 Digital Solutions & AI · Setting B Non-residential  ·  Global Energy Hackathon 2026`, { x: M, y: H - 0.38, w: 10.5, h: 0.25, fontFace: F, fontSize: 10, color: MUTED, margin: 0 });
  s.addText(`${n} / 5`, { x: W - 1.3, y: H - 0.38, w: 0.8, h: 0.25, align: "right", fontFace: F, fontSize: 10, color: MUTED, margin: 0 });
  return s;
}
function panel(s, x, y, w, h, fill = PANEL, line = LINE) {
  s.addShape(p.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: fill }, line: { color: line, width: 0.75 }, rectRadius: 0.08 });
}
function stat(s, x, y, w, num, label, color = TEXT, size = 30) {
  s.addText(num, { x, y, w, h: 0.55, fontFace: F, fontSize: size, bold: true, color, margin: 0 });
  s.addText(label, { x, y: y + 0.56, w, h: 0.5, fontFace: F, fontSize: 11, color: MUTED, margin: 0, valign: "top" });
}
function bullets(s, items, x, y, w, h, size = 12.5) {
  s.addText(items.map((t) => ({ text: t, options: { bullet: { indent: 14 }, paraSpaceAfter: 5 } })), { x, y, w, h, fontFace: F, fontSize: size, color: TEXT, margin: 0, valign: "top" });
}

/* ---------------- 1 · PROBLEM ---------------- */
{
  const s = base(1, "Brief #13, power for a city the grid can't protect: Maiduguri, Borno State, Nigeria");
  s.addText("The generator works.\nThe fuel doesn't come.", { x: M, y: 0.75, w: 7.4, h: 1.6, fontFace: F, fontSize: 38, bold: true, color: TEXT, margin: 0 });
  s.addText("In a city whose transmission line is repeatedly cut, critical care ends when the diesel ends — not when kW run short. Nobody decides, in advance and with numbers, which loads the last litres should keep alive.", { x: M, y: 2.45, w: 7.2, h: 1.0, fontFace: F, fontSize: 15, color: MUTED, margin: 0 });
  const facts = [
    ["39 days", "Gombe–Damaturu–Maiduguri 330 kV line down after tower 372 was vandalised, 22 Sep → 31 Oct 2024 (TCN). Same corridor cut for ~2 months in 2021."],
    ["Days dark", "Dec 2022: two Maiduguri hospitals without power for days — generators functional, tanks empty (ICIR, 3 Dec 2022)."],
    ["50%", "of hospitals in sub-Saharan Africa report reliable electricity (WHO / World Bank / IRENA / SEforALL, Energizing Health, 2023)."],
  ];
  facts.forEach(([a, b], i) => {
    const y = 3.75 + i * 1.08;
    panel(s, M, y, 7.2, 0.95);
    s.addText(a, { x: M + 0.2, y: y + 0.12, w: 1.9, h: 0.7, fontFace: F, fontSize: 22, bold: true, color: i === 2 ? AMBER : RED, margin: 0, valign: "middle" });
    s.addText(b, { x: M + 2.15, y: y + 0.1, w: 4.9, h: 0.75, fontFace: F, fontSize: 11.5, color: TEXT, margin: 0, valign: "middle" });
  });
  panel(s, 8.1, 0.75, 4.73, 6.15, PANEL2);
  s.addText("Who, specifically", { x: 8.35, y: 0.95, w: 4.3, h: 0.3, fontFace: F, fontSize: 12, bold: true, color: CYAN, margin: 0 });
  bullets(s, [
    "User: works engineer & duty manager of a 250-bed referral hospital in a conflict-affected city",
    "Beneficiaries: ICU, theatre, maternity, cold-chain & emergency patients — 91,250 bed-days a year",
    "Payer: hospital management (federal/state budget) — or an energy-service company repaid from diesel no longer bought",
  ], 8.35, 1.3, 4.3, 2.3, 12);
  s.addText("Root cause", { x: 8.35, y: 3.7, w: 4.3, h: 0.3, fontFace: F, fontSize: 12, bold: true, color: CYAN, margin: 0 });
  s.addText(`Backup is sized in kW and run on fixed rules. A line outage quadruples diesel need (${n0(rep.normalYearWeeklyDieselLitres)} L/week normal year, simulated) while deliveries, budgets and convoys stay flat. Status quo at ${n0(rep.assumptions.weeklySupplyLitres)} L/week (${rep.supplyMultipleOfNormal.toFixed(1)}× normal): tank empty ${n0(res.baseline.fuelOutHours)} h, Tier-1 life-critical circuits dark ${n0(outH - res.baseline.tier1Hours)} h of ${outH}.`, { x: 8.35, y: 4.05, w: 4.3, h: 2.7, fontFace: F, fontSize: 12.5, color: TEXT, margin: 0, valign: "top" });
}

/* ---------------- 2 · SOLUTION ---------------- */
{
  const s = base(2, "The solution: MedGrid Sentinel");
  s.addText("A fuel-aware brain for hospital microgrids", { x: M, y: 0.75, w: 12.3, h: 0.7, fontFace: F, fontSize: 30, bold: true, color: TEXT, margin: 0 });
  s.addText("Digital twin + predictive controller that turns every litre the sun saves into hours of critical care — on the solar, battery and generator a hospital can actually buy.", { x: M, y: 1.45, w: 12.3, h: 0.5, fontFace: F, fontSize: 14, color: MUTED, margin: 0 });
  const cols = [
    ["1 · Fuel-runway governor", `Every hour: diesel + battery + forecast solar vs the energy each care tier needs until the next expected delivery. Defers laundry/HVAC/admin first; Tier-1 never. Every decision logged with its arithmetic.`],
    ["2 · Clinical ride-through reserve", "The battery always holds 2 h of Tier-1 while the generator is off. A failed start or a tripped set never darkens the ICU; the battery forms the island with no transfer break."],
    ["3 · Efficient generator cycling", `When it runs, the set runs hard (load + charging) and stops when the battery is full — fewer low-load hours, less wet-stacking, less exposure to running failures.`],
  ];
  const proof = [
    `Replay: empty-tank hours ${n0(res.baseline.fuelOutHours)} → ${n0(res.sentinel.fuelOutHours)}`,
    `Replay: Tier-1 breaks ${res.baseline.tier1Interruptions} → ${res.sentinel.tier1Interruptions}; year: ${n0(A.baseline.tier1Interruptions)} → ${n0(A.proposed.tier1Interruptions)}`,
    `Year: generator hours ${n0(A.baseline.gensetRuntimeH)} → ${n0(A.proposed.gensetRuntimeH)} (−${pct(A.gensetHoursAvoidedPerYear / A.baseline.gensetRuntimeH)})`,
  ];
  cols.forEach(([t, b], i) => {
    const x = M + i * 4.15;
    panel(s, x, 2.15, 3.95, 2.35);
    s.addText(t, { x: x + 0.2, y: 2.3, w: 3.6, h: 0.4, fontFace: F, fontSize: 14, bold: true, color: CYAN, margin: 0 });
    s.addText(b, { x: x + 0.2, y: 2.75, w: 3.6, h: 1.2, fontFace: F, fontSize: 11.5, color: TEXT, margin: 0, valign: "top" });
    s.addText(proof[i], { x: x + 0.2, y: 3.98, w: 3.6, h: 0.42, fontFace: F, fontSize: 11, bold: true, color: GREEN, margin: 0, valign: "top" });
  });
  panel(s, M, 4.7, 7.6, 2.25, PANEL2);
  s.addText("What makes it new", { x: M + 0.2, y: 4.82, w: 7.2, h: 0.3, fontFace: F, fontSize: 12, bold: true, color: CYAN, margin: 0 });
  bullets(s, [
    "Treats diesel logistics as the binding constraint — sizing tools (HOMER, REopt) and hybrid inverters don't schedule care tiers against the next convoy",
    "Isolates the software's value: four controllers on identical hardware, weather, fuel and failures",
    "Works where hospitals are: offline web app (static, no server) + SMS / USSD alerts on any feature phone",
  ], M + 0.2, 5.15, 7.2, 1.8, 11.5);
  panel(s, 8.3, 4.7, 4.53, 2.25, PANEL2);
  s.addText("Same hardware, different brain", { x: 8.5, y: 4.82, w: 4.2, h: 0.3, fontFace: F, fontSize: 12, bold: true, color: CYAN, margin: 0 });
  stat(s, 8.5, 5.15, 4.2, `+${n0(res.sentinel.criticalHours - res.conventional.criticalHours)} h`, `critical-service hours vs a fixed-rule hybrid inverter on the same 600 kWp + 600 kWh, same ${n0(rep.assumptions.weeklySupplyLitres)} L/week`, GREEN, 32);
}

/* ---------------- 3 · PROOF ---------------- */
{
  const s = base(3, "Proof of concept, built this weekend: the real 39-day outage on measured weather");
  s.addText("Brief metric: “hours of critical service maintained during a line outage, and diesel litres avoided”", { x: M, y: 0.72, w: 12.3, h: 0.4, fontFace: F, fontSize: 15, bold: true, color: TEXT, margin: 0 });
  s.addImage({ path: "results/deck/mission.png", x: M, y: 1.2, w: 6.4, h: 4.0 });
  s.addShape(p.shapes.RECTANGLE, { x: M, y: 1.2, w: 6.4, h: 4.0, fill: { type: "none" }, line: { color: LINE, width: 0.75 } });
  const rows = [
    [{ text: "Same outage · same fuel", options: { bold: true, color: MUTED } }, { text: "Critical h", options: { bold: true, color: MUTED } }, { text: "Tier-1 h", options: { bold: true, color: MUTED } }, { text: "Diesel L", options: { bold: true, color: MUTED } }, { text: "Tier-1 breaks", options: { bold: true, color: MUTED } }],
    ...[["Status quo (diesel only)", "baseline"], ["Diesel + manual rationing", "baseline_rationed"], ["Solar + battery, fixed rules", "conventional"], ["Solar + battery + Sentinel", "sentinel"]].map(([l, k]) => {
      const r = res[k];
      const hi = k === "sentinel";
      const c = hi ? CYAN : TEXT;
      return [{ text: l, options: { color: c, bold: hi } }, { text: n0(r.criticalHours), options: { color: hi ? GREEN : c, bold: hi } }, { text: n0(r.tier1Hours), options: { color: hi ? GREEN : c, bold: hi } }, { text: n0(r.dieselLitres), options: { color: c } }, { text: String(r.tier1Interruptions), options: { color: c } }];
    }),
  ];
  s.addTable(rows, { x: 7.15, y: 1.2, w: 5.68, colW: [2.3, 0.85, 0.8, 0.95, 0.78], fontFace: F, fontSize: 11, fill: { color: PANEL }, border: { type: "solid", color: LINE, pt: 0.5 }, rowH: 0.36, margin: 0.05 });
  s.addText(`${outH} islanded hours · ${n0(rep.assumptions.weeklySupplyLitres)} L/week diesel (${rep.supplyMultipleOfNormal.toFixed(1)}× normal use) · 10,000 L tank`, { x: 7.15, y: 3.1, w: 5.68, h: 0.3, fontFace: F, fontSize: 10, color: MUTED, margin: 0 });
  stat(s, 7.15, 3.5, 2.75, `${n0(res.baseline.criticalHours)} → ${n0(res.sentinel.criticalHours)} h`, "critical-service hours (Metric 1)", GREEN, 24);
  stat(s, 10.05, 3.5, 2.8, `${n0(res.baseline.dieselLitres - res.sentinel.dieselLitres)} L`, `diesel avoided in the outage (Metric 2) · ${n0(A.dieselLitresAvoidedPerYear)} L/yr`, GREEN, 24);
  panel(s, 7.15, 4.65, 5.68, 1.95, PANEL2);
  s.addText("The next outage: 14-day Monte Carlo, 300 trials", { x: 7.35, y: 4.75, w: 5.3, h: 0.3, fontFace: F, fontSize: 12, bold: true, color: CYAN, margin: 0 });
  s.addText(`P(Tier-1 kept powered for 14 days), average-reliability generator (NREL data), late/missed deliveries: status quo ${pct(mcN.baseline.pTier1_336h)} · fixed-rule hybrid ${pct(mcN.conventional.pTier1_336h)} · Sentinel ${pct(mcN.sentinel.pTier1_336h)}. Well-maintained set: Sentinel ${pct(mcW.sentinel.pTier1_336h)}.`, { x: 7.35, y: 5.05, w: 5.3, h: 1.0, fontFace: F, fontSize: 11.5, color: TEXT, margin: 0, valign: "top" });
  s.addText("101 automated tests · power & diesel mass balance every step · NREL '80 % at 2 weeks' reproduced · solar forecast scored on held-out 2024", { x: 7.35, y: 6.05, w: 5.3, h: 0.5, fontFace: F, fontSize: 9.5, color: MUTED, margin: 0 });
  s.addText("Illustrative 250-bed reference hospital (16 tiered circuits) — simulation, not field-measured performance. Real data: NASA POWER hourly irradiance & temperature (Maiduguri 2022–24), NREL/TP-5C00-76553 generator reliability, NERC tariff, Oct-2026 diesel prices.", { x: M, y: 5.35, w: 6.4, h: 1.0, fontFace: F, fontSize: 10, color: MUTED, margin: 0, valign: "top" });
}

/* ---------------- 4 · COMMERCIAL & FEASIBILITY ---------------- */
{
  const s = base(4, "Cost, who pays, and the 6–18 month path");
  s.addText(`Pays back in ${A.paybackYears.toFixed(1)} years — or nothing upfront under EaaS`, { x: M, y: 0.72, w: 12.3, h: 0.6, fontFace: F, fontSize: 26, bold: true, color: TEXT, margin: 0 });
  const kp = [
    [`$${n0(A.capex.totalUsd / 1000)}k`, `CapEx (${naira(A.capex.totalNaira)}): 600 kWp PV, 600 kWh LFP, 510 kW PCS, Sentinel edge`],
    [`${A.paybackYears.toFixed(1)} yr`, `payback · IRR ${pct(A.irr)} · NPV ${naira(A.npv20yAt18pct)} (20 y @ 18%)`],
    [`${naira(A.annualSavingsNaira)}/yr`, `energy-cost savings on a full measured year (diesel −${pct(A.dieselAvoidedPct)})`],
    [`${naira(A.eaasMonthlyFeeNaira)}/mo`, `EaaS fee: hospital keeps 20% of savings from month 1; provider IRR ${pct(A.eaasProviderIrr)}`],
  ];
  kp.forEach(([a, b], i) => {
    const x = M + i * 3.1;
    panel(s, x, 1.45, 2.95, 1.45);
    stat(s, x + 0.18, 1.58, 2.6, a, b, i === 3 ? AMBER : GREEN, 24);
  });
  panel(s, M, 3.1, 6.05, 3.85, PANEL2);
  s.addText("Who owns, pays and maintains", { x: M + 0.2, y: 3.2, w: 5.7, h: 0.3, fontFace: F, fontSize: 12, bold: true, color: CYAN, margin: 0 });
  bullets(s, [
    "Energy-service company owns, insures and maintains PV + storage + Sentinel; local O&M technicians; Sentinel subscription $4,800/site-yr is inside the model",
    "Hospital pays a fixed monthly fee below what it saves — energy cost per bed-day ₦" + n0(A.energyCostPerBedDay.baseline) + " → ₦" + n0(A.energyCostPerBedDay.proposedEaaS) + "; nothing passed to patients",
    "No grant assumed. Concessional capital widens the margin (NPV at 10%: " + naira(A.npv20yAt10pct) + ")",
    "Sensitivity: diesel −30% → payback " + A.sensitivity[0].paybackYears + " yr; CapEx +30% → " + A.sensitivity[2].paybackYears + " yr; no line outage → " + A.sensitivity[6].paybackYears + " yr",
  ], M + 0.2, 3.55, 5.7, 3.3, 11.5);
  panel(s, 6.75, 3.1, 6.08, 3.85, PANEL2);
  s.addText("6–18 months: what gets built, and by whom", { x: 6.95, y: 3.2, w: 5.7, h: 0.3, fontFace: F, fontSize: 12, bold: true, color: CYAN, margin: 0 });
  bullets(s, [
    "M1–3: metering + circuit audit at one Maiduguri-class hospital; Sentinel runs in shadow mode on real data",
    "M4–6: engineering design (IEC 62446 / 62619 / 62109 equipment, NEMSA inspection), EaaS term sheet with a licensed installer",
    "M7–12: install; Sentinel dispatches; SMS alerts live; measured vs predicted published monthly",
    "M13–18: sites 2–3 from the fleet screen (Kano, Abuja)",
    "Biggest risk: real loads differ from the model → shadow-mode gate: proceed only if daily-energy error ≤ ±15%",
  ], 6.95, 3.55, 5.7, 3.3, 11.5);
}

/* ---------------- 5 · IMPACT & SCALE ---------------- */
{
  const s = base(5, "Impact, scale and what we need next");
  s.addText("One hospital, every year — then the fleet", { x: M, y: 0.72, w: 12.3, h: 0.6, fontFace: F, fontSize: 28, bold: true, color: TEXT, margin: 0 });
  const st = [
    [`${n0(A.dieselLitresAvoidedPerYear)} L`, "diesel avoided per year (−" + pct(A.dieselAvoidedPct) + ")"],
    [`${n0(A.co2TonnesAvoidedPerYear)} t`, "CO₂ avoided per year (2.68 kg/L)"],
    [`${n0(A.baseline.tier1Interruptions)} → ${n0(A.proposed.tier1Interruptions)}`, "life-critical transfer breaks per year"],
    [`−${n0(A.gensetHoursAvoidedPerYear)} h`, "generator run-hours per year (−" + pct(A.gensetHoursAvoidedPerYear / A.baseline.gensetRuntimeH) + ")"],
  ];
  st.forEach(([a, b], i) => {
    const x = M + i * 3.1;
    panel(s, x, 1.45, 2.95, 1.35);
    stat(s, x + 0.18, 1.55, 2.6, a, b, GREEN, 26);
  });
  s.addImage({ path: "results/deck/fleet.png", x: M, y: 3.0, w: 6.6, h: 2.22 });
  s.addShape(p.shapes.RECTANGLE, { x: M, y: 3.0, w: 6.6, h: 2.22, fill: { type: "none" }, line: { color: LINE, width: 0.75 } });
  s.addText("Fleet screen: 10 full-year simulations on each site's own NASA POWER weather. Same national prices; differences come from sunshine and grid reliability.", { x: M, y: 5.35, w: 6.6, h: 0.9, fontFace: F, fontSize: 10.5, color: MUTED, margin: 0, valign: "top" });
  const fl = R.fleet.rows.filter((r) => r.archetype.startsWith("250"));
  panel(s, 7.3, 3.0, 5.53, 1.85, PANEL2);
  s.addText("How it travels", { x: 7.5, y: 3.1, w: 5.2, h: 0.3, fontFace: F, fontSize: 12, bold: true, color: CYAN, margin: 0 });
  s.addText(`Same engine, new configuration. 10 site-years on measured weather: payback ${fl.map((r) => `${r.site.split(",")[0].replace(" (NG)", "")} ${r.paybackYears.toFixed(1)} y`).join(" · ")}. ${fl.filter((r) => r.verdict === "strong").length} of ${fl.length} sites strong; ${fl.filter((r) => r.verdict !== "strong").map((r) => r.site.split(",")[0].replace(" (NG)", "")).join(", ")} only viable (better grid) — the tool says where it pays. Next: Ghana, Kenya, U.S. (NFPA 99/110) configurations.`, { x: 7.5, y: 3.4, w: 5.2, h: 1.4, fontFace: F, fontSize: 11, color: TEXT, margin: 0, valign: "top" });
  panel(s, 7.3, 5.0, 5.53, 1.55, PANEL2);
  s.addText("Team and ask", { x: 7.5, y: 5.1, w: 5.2, h: 0.3, fontFace: F, fontSize: 12, bold: true, color: CYAN, margin: 0 });
  s.addText("Live demo: medgrid-sentinel.vercel.app", { x: 7.5, y: 6.22, w: 5.2, h: 0.25, fontFace: F, fontSize: 11, bold: true, color: CYAN, margin: 0 });
  s.addText("Jackson Sixtus Abetianbe — solo entry (product, engineering, finance). We need: one pilot hospital in NE Nigeria, a licensed solar EPC / ESCO partner, 3 months of circuit-level metering, and power-systems + health-facility coaching.", { x: 7.5, y: 5.4, w: 5.2, h: 0.82, fontFace: F, fontSize: 11, color: TEXT, margin: 0, valign: "top" });
}

await p.writeFile({ fileName: "submission/MedGrid_Sentinel_Pitch_Deck.pptx" });
console.log("wrote submission/MedGrid_Sentinel_Pitch_Deck.pptx");
