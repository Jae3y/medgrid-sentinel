/**
 * MedGrid Sentinel — official 5-slide pitch deck (Handbook §10: PDF, ≤5 slides).
 * Run: node scripts/make-deck.mjs  →  submission/MedGrid_Sentinel_Pitch_Deck.pptx
 * Design: dark navy premium, cyan accent, Segoe UI, oversized-number motif, no stripes/underlines.
 */
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const pptxgen = require("pptxgenjs");

const BG = "081426";        // deep navy background (dominant)
const PANEL = "10263F";     // panel tint
const PANEL2 = "16304F";    // raised panel
const TEXT = "F1F5F9";
const MUTED = "8FA3BD";
const CYAN = "22D3EE";      // accent (5-10%)
const CYAN_SOFT = "7DE9F7";
const GREEN = "34D399";
const AMBER = "F59E0B";
const RED = "EF4444";
const F = "Segoe UI";

const W = 13.33, H = 7.5, M = 0.5;

const p = new pptxgen();
p.layout = "LAYOUT_WIDE";
p.author = "MedGrid Sentinel";
p.title = "MedGrid Sentinel — Intelligent Hospital Microgrids";

function footer(slide, n) {
  slide.addText("MEDGRID SENTINEL  ·  Brief #13 · Track 2 Digital Solutions & AI  ·  Global Energy Hackathon 2026 (Anneru IAS)", {
    x: M, y: H - 0.42, w: 9.5, h: 0.3, fontFace: F, fontSize: 12, color: MUTED, margin: 0,
  });
  slide.addText(String(n), { x: W - 1.0, y: H - 0.42, w: 0.5, h: 0.3, align: "right", fontFace: F, fontSize: 12, color: MUTED, margin: 0 });
}

function kicker(slide, txt, y = 0.42) {
  slide.addText(txt, { x: M, y, w: W - 2 * M, h: 0.32, fontFace: F, fontSize: 13, bold: true, color: CYAN, charSpacing: 3, margin: 0 });
}

function stat(slide, x, y, w, num, label, numColor = TEXT, numSize = 38) {
  slide.addText(num, { x, y, w, h: 0.62, fontFace: F, fontSize: numSize, bold: true, color: numColor, margin: 0 });
  slide.addText(label, { x, y: y + 0.66, w, h: 0.5, fontFace: F, fontSize: 12.5, color: MUTED, margin: 0 });
}

function hairline(slide, x, y, w) {
  slide.addShape(p.shapes.LINE, { x, y, w, h: 0, line: { color: "24466E", width: 1 } });
}

/* ------------------------------- SLIDE 1 — THE PROBLEM ------------------------------- */
{
  const s = p.addSlide();
  s.background = { color: BG };
  kicker(s, "BRIEF #13 · POWER FOR A CITY THE GRID CAN'T PROTECT");
  s.addText("When the grid fails, the hospital runs on diesel.", {
    x: M, y: 0.82, w: 8.6, h: 1.5, fontFace: F, fontSize: 40, bold: true, color: TEXT, margin: 0,
  });
  s.addText("Design and dispatch decisions are made blind — before the outage, before the money. Sentinel makes them computable.", {
    x: M, y: 2.28, w: 7.9, h: 0.8, fontFace: F, fontSize: 17, color: MUTED, margin: 0,
  });

  // Focal: 7x
  s.addText("7×", { x: 9.2, y: 0.75, w: 3.6, h: 2.0, fontFace: F, fontSize: 120, bold: true, color: CYAN, align: "right", margin: 0 });
  s.addText("diesel cost per kWh vs Band A grid power — the economics every hospital director knows", {
    x: 8.7, y: 2.85, w: 4.13, h: 0.7, fontFace: F, fontSize: 13, color: MUTED, align: "right", margin: 0,
  });

  stat(s, M, 3.25, 4.6, "12+", "national grid collapses in 2024 (industry counts; NERC official count lower)");
  hairline(s, M, 4.42, 7.6);
  stat(s, M, 4.55, 4.6, "₦1,560/L", "automotive gas oil, Lagos early 2026 (NBS price tracker)");
  hairline(s, M, 5.72, 7.6);
  stat(s, M, 5.85, 4.6, "1,295 L", "diesel burned by the typical backup in ONE 12-hour outage (engine baseline)", AMBER, 34);

  s.addText("Sources: ICIR / APGC industry counts 2024–25 · NBS diesel price watch · Sentinel deterministic baseline simulation (12.5 h islanded window, 250-bed reference hospital).", {
    x: 8.7, y: 3.75, w: 4.13, h: 1.4, fontFace: F, fontSize: 12, color: MUTED, margin: 0,
  });
  footer(s, 1);
}

/* ------------------------------- SLIDE 2 — THE SOLUTION ------------------------------ */
{
  const s = p.addSlide();
  s.background = { color: BG };
  kicker(s, "THE SOLUTION · TRACK 2 — DIGITAL SOLUTIONS & AI · SETTING B (NON-RESIDENTIAL)");
  s.addText("The hospital microgrid, made predictable.", {
    x: M, y: 0.82, w: 11.8, h: 0.68, fontFace: F, fontSize: 33, bold: true, color: TEXT, margin: 0,
  });
  s.addText("MedGrid Sentinel — a digital twin that designs, dispatches and prices the microgrid around the loads that keep patients alive, computed by a deterministic, unit-tested engine.", {
    x: M, y: 1.58, w: 11.8, h: 0.62, fontFace: F, fontSize: 15, color: MUTED, margin: 0,
  });

  // --- one-line diagram (left) ---
  const dx = M, dy = 2.5, dw = 7.6, dh = 4.0;
  s.addShape(p.shapes.ROUNDED_RECTANGLE, { x: dx, y: dy, w: dw, h: dh, fill: { color: PANEL }, rectRadius: 0.08, line: { color: "24466E", width: 1 } });
  const node = (x, y, w, h, title, val, color) => {
    s.addShape(p.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: PANEL2 }, rectRadius: 0.05, line: { color, width: 1.5 } });
    s.addText(title, { x, y: y + 0.06, w, h: 0.3, align: "center", fontFace: F, fontSize: 11.5, bold: true, color, margin: 0 });
    s.addText(val, { x, y: y + 0.34, w, h: 0.3, align: "center", fontFace: F, fontSize: 11, color: MUTED, margin: 0 });
  };
  const arrow = (x1, y1, x2, y2, color = CYAN_SOFT) =>
    s.addShape(p.shapes.LINE, { x: x1, y: y1, w: x2 - x1, h: y2 - y1, line: { color, width: 2, endArrowType: "triangle" } });

  node(dx + 0.3, dy + 0.35, 1.9, 0.75, "SOLAR PV", "300 kWp", CYAN);
  node(dx + 0.3, dy + 2.9, 1.9, 0.75, "BATTERY", "600 kWh LFP", CYAN_SOFT);
  node(dx + 5.4, dy + 0.35, 1.9, 0.75, "GRID", "Band A · fails", GREEN);
  node(dx + 5.4, dy + 2.9, 1.9, 0.75, "DIESEL GENSET", "400 kW · backup", AMBER);
  // bus
  s.addShape(p.shapes.RECTANGLE, { x: dx + 2.95, y: dy + 1.75, w: 1.7, h: 0.5, fill: { color: "1B3A63" }, line: { color: "24466E", width: 1 } });
  s.addText("AC BUS", { x: dx + 2.95, y: dy + 1.75, w: 1.7, h: 0.5, align: "center", valign: "middle", fontFace: F, fontSize: 11, bold: true, color: TEXT, margin: 0 });
  arrow(dx + 2.2, dy + 0.75, dx + 3.35, dy + 1.75);
  arrow(dx + 2.2, dy + 2.9, dx + 3.35, dy + 2.25);
  arrow(dx + 5.4, dy + 0.75, dx + 4.65, dy + 1.75);
  arrow(dx + 5.4, dy + 2.9, dx + 4.65, dy + 2.25);
  // loads
  s.addShape(p.shapes.ROUNDED_RECTANGLE, { x: dx + 2.6, y: dy + 3.05, w: 2.4, h: 0.75, fill: { color: PANEL2 }, rectRadius: 0.05, line: { color: RED, width: 1.5 } });
  s.addText("TIERED HOSPITAL LOADS", { x: dx + 2.6, y: dy + 3.09, w: 2.4, h: 0.28, align: "center", fontFace: F, fontSize: 11, bold: true, color: RED, margin: 0 });
  s.addText("T1 life-critical · T2 clinical · T3 deferrable", { x: dx + 2.6, y: dy + 3.4, w: 2.4, h: 0.3, align: "center", fontFace: F, fontSize: 9.5, color: MUTED, margin: 0 });
  arrow(dx + 3.8, dy + 2.25, dx + 3.8, dy + 3.05, RED);
  s.addText("Priority dispatch: PV → grid → battery → genset → tiered shedding. 15-min steps, deterministic.", {
    x: dx + 0.3, y: dy + 1.42, w: 2.25, h: 0.85, fontFace: F, fontSize: 10, color: MUTED, margin: 0,
  });

  // --- capability rows (right) ---
  const rx = 8.5, rw = W - M - rx;
  const cap = [
    ["Deterministic core", "15-min power-balance engine; 58 unit tests with hand-checked values; byte-identical replays"],
    ["Scenario lab", "Ten stress scenarios incl. the brief's line outage, generator failure and power-quality trips"],
    ["Honest economics", "EaaS fee vs savings with a computed breakeven financing rate — never an assumed grant"],
    ["Deficits reported", "When a design fails, Sentinel shows the failing hour — that is the product's value"],
  ];
  cap.forEach(([t, d], i) => {
    const y = 2.5 + i * 1.05;
    s.addShape(p.shapes.RECTANGLE, { x: rx, y: y + 0.09, w: 0.14, h: 0.14, fill: { color: CYAN } });
    s.addText(t, { x: rx + 0.3, y, w: rw - 0.3, h: 0.3, fontFace: F, fontSize: 15, bold: true, color: TEXT, margin: 0 });
    s.addText(d, { x: rx + 0.3, y: y + 0.3, w: rw - 0.3, h: 0.62, fontFace: F, fontSize: 12, color: MUTED, margin: 0 });
  });
  s.addText("Safety-critical dispatch is deterministic — no black box decides when the theatres keep power.", {
    x: rx, y: 6.55, w: rw, h: 0.45, fontFace: F, fontSize: 11.5, italic: true, color: CYAN_SOFT, margin: 0,
  });
  footer(s, 2);
}

/* ---------------------------- SLIDE 3 — PROOF OF CONCEPT ----------------------------- */
{
  const s = p.addSlide();
  s.background = { color: BG };
  kicker(s, "PROOF OF CONCEPT · BRIEF SCENARIO — 12.5-HOUR CITY LINE OUTAGE");
  s.addText("Continuity held. Diesel cut 41%. Every number reproducible.", {
    x: M, y: 0.82, w: 11.8, h: 0.75, fontFace: F, fontSize: 33, bold: true, color: TEXT, margin: 0,
  });

  const cards = [
    ["12.50 / 12.50 h", "critical-service continuity (T1+T2) maintained through the outage — 100%", GREEN],
    ["0.00 kWh", "unserved Tier-1 life-critical energy — deficits reported, never hidden", TEXT],
    ["−41%", "diesel vs the diesel-only baseline in the 3-day window (763 L vs 1,295 L)", CYAN],
    ["58 / 58", "engine unit tests passing — physics, dispatch, finance, forecasting, verified build", TEXT],
  ];
  cards.forEach(([num, label, c], i) => {
    const x = M + (i % 2) * 3.57, y = 1.85 + Math.floor(i / 2) * 1.95;
    s.addShape(p.shapes.ROUNDED_RECTANGLE, { x, y, w: 3.35, h: 1.75, fill: { color: PANEL }, rectRadius: 0.06, line: { color: "24466E", width: 1 } });
    s.addText(num, { x: x + 0.22, y: y + 0.15, w: 2.95, h: 0.65, fontFace: F, fontSize: 26, bold: true, color: c, margin: 0 });
    s.addText(label, { x: x + 0.22, y: y + 0.82, w: 2.95, h: 0.85, fontFace: F, fontSize: 11, color: MUTED, margin: 0 });
  });

  // Real product screenshot (captured from the running application — results/ui/dashboard-hero.png)
  const sx = 7.72, sw = 5.11, sh = sw * 9 / 16;
  s.addShape(p.shapes.ROUNDED_RECTANGLE, { x: sx - 0.05, y: 1.8, w: sw + 0.1, h: sh + 0.1, fill: { color: PANEL2 }, rectRadius: 0.05, line: { color: CYAN, width: 1.25 } });
  s.addImage({ path: "results/ui/dashboard-hero.png", x: sx, y: 1.85, w: sw, h: sh });
  s.addText("The running application: islanded bus at 10:00 during the outage — generator carrying 197 kW after the battery bridge, event log showing the islanding sequence, zero synthetic alarms.", {
    x: sx, y: 1.92 + sh, w: sw, h: 0.8, fontFace: F, fontSize: 11, color: MUTED, margin: 0,
  });

  s.addText("Annualized (320 normal + 45 outage days):  23,910 L/yr diesel avoided  ·  64.1 t CO₂/yr  ·  ₦111.8M/yr operating savings", {
    x: sx, y: 2.82 + sh + 0.72, w: sw, h: 0.9, fontFace: F, fontSize: 12.5, bold: true, color: TEXT, margin: 0,
  });

  s.addText("Source: Sentinel deterministic engine — regenerate with `npm run results` (results/demo-results.json). Illustrative facility profile; failure case (generator fault) reported at 98.2% continuity rather than hidden.", {
    x: M, y: 5.95, w: 7.0, h: 0.85, fontFace: F, fontSize: 12, color: MUTED, margin: 0,
  });
  footer(s, 3);
}

/* ----------------------- SLIDE 4 — COMMERCIAL MODEL & FEASIBILITY -------------------- */
{
  const s = p.addSlide();
  s.background = { color: BG };
  kicker(s, "COMMERCIAL MODEL & FEASIBILITY · 6–18-MONTH PATHWAY");
  s.addText("Honest economics, computed to the naira.", {
    x: M, y: 0.82, w: 11.8, h: 0.75, fontFace: F, fontSize: 33, bold: true, color: TEXT, margin: 0,
  });

  const row = [
    ["₦760.4M", "CapEx — $491k for 300 kWp PV + 600 kWh LFP + dispatch on the existing genset", TEXT],
    ["7.9 yr", "simple payback against a 20–25 yr asset life; IRR 4.6%", TEXT],
    ["₦161M vs ₦112M", "annual EaaS fee vs operating savings at 14% financing", TEXT],
    ["4.6%", "financing rate at which the service closes — the computed concessional-capital gap", CYAN],
  ];
  row.forEach(([num, label, c], i) => {
    const x = M + i * 3.14;
    s.addText(num, { x, y: 1.8, w: 3.0, h: 0.7, fontFace: F, fontSize: i === 2 ? 22 : 30, bold: true, color: c, margin: 0, valign: "bottom" });
    s.addText(label, { x, y: 2.55, w: 2.85, h: 0.95, fontFace: F, fontSize: 11.5, color: MUTED, margin: 0 });
  });
  hairline(s, M, 3.62, W - 2 * M);
  s.addText([
    { text: "Stated plainly: ", options: { bold: true, color: AMBER } },
    { text: "at an 18% commercial discount rate the project NPV is negative (−₦326M). The value case is resilience + diesel displacement + concessional capital — the structure real deployments like the NSIA-LUTH cancer-centre microgrid (300 kWp / 1.1 MWh, 2025) already use. No grant is assumed to exist anywhere in the model.", options: { color: MUTED } },
  ], { x: M, y: 3.78, w: W - 2 * M, h: 0.85, fontFace: F, fontSize: 12.5, margin: 0 });

  // timeline chevrons
  const steps = [
    ["M 1–3", "Metering-first pilot: real load + outage data on one feeder"],
    ["M 4–6", "Engineering design, permits, financing & O&M agreements"],
    ["M 7–12", "Pilot deployment; measured-vs-predicted evidence"],
    ["M 13–18", "Replicate to 3–5 facilities; provider playbook"],
  ];
  steps.forEach(([t, d], i) => {
    const x = M + i * 3.14, y = 4.95, w = 2.9, h = 1.35;
    s.addShape(p.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: PANEL }, rectRadius: 0.06, line: { color: "24466E", width: 1 } });
    s.addText(t, { x: x + 0.2, y: y + 0.12, w: w - 0.4, h: 0.32, fontFace: F, fontSize: 15, bold: true, color: CYAN, margin: 0 });
    s.addText(d, { x: x + 0.2, y: y + 0.46, w: w - 0.4, h: 0.8, fontFace: F, fontSize: 11, color: MUTED, margin: 0 });
    if (i < 3) arrowless(s, x + w, y + h / 2);
  });

  s.addText("Payer: the hospital (ownership) or an energy-service provider under EaaS · Maintainer: provider's local technicians · Sensitivity: diesel ±30%, CapEx ±20%, outage frequency 20–70 days/yr.", {
    x: M, y: 6.55, w: W - 2 * M, h: 0.6, fontFace: F, fontSize: 12, color: MUTED, margin: 0,
  });
  footer(s, 4);
}
function arrowless(s, x, y) {
  s.addShape(p.shapes.LINE, { x, y, w: 0.24, h: 0, line: { color: "24466E", width: 2, endArrowType: "triangle" } });
}

/* --------------------------- SLIDE 5 — IMPACT, SCALE, ASK ---------------------------- */
{
  const s = p.addSlide();
  s.background = { color: BG };
  kicker(s, "IMPACT · SCALABILITY · THE ASK");
  s.addText("Built this weekend. Ready for a feeder near you.", {
    x: M, y: 0.82, w: 11.8, h: 0.75, fontFace: F, fontSize: 33, bold: true, color: TEXT, margin: 0,
  });

  stat(s, M, 1.9, 3.5, "23,910 L", "diesel avoided per year (−41% outage-day; 45-day annualization)", GREEN);
  stat(s, 4.4, 1.9, 3.5, "64.1 t", "CO₂ avoided per year — 2.68 kg CO₂ per litre, engine-computed", GREEN);
  stat(s, 8.3, 1.9, 4.4, "563 h", "critical-service hours maintained per year across outage days", CYAN);
  hairline(s, M, 3.62, W - 2 * M);

  s.addText([
    { text: "Scales by configuration, not by code changes.", options: { bold: true, color: TEXT, breakLine: true } },
    { text: "One facility = one config object: loads, tariffs, outage pattern, climate. The rural-clinic profile runs on the same engine today; the sizing optimizer already proves the design flips with outage timing (daytime → PV-first, evening → storage-heavy). Country adaptation = parameter change: tariffs, diesel/FX, standards, financing.", options: { color: MUTED, breakLine: true } },
  ], { x: M, y: 3.85, w: 7.2, h: 1.75, fontFace: F, fontSize: 13, paraSpaceAfter: 8, margin: 0 });
  s.addText([
    { text: "What we are not claiming: ", options: { bold: true, color: AMBER } },
    { text: "no measured facility data yet (inputs are labelled illustrative), no partners or pilots, no certifications — the 6–18-month plan is deliberately metering-first.", options: { color: MUTED } },
  ], { x: M, y: 5.6, w: 7.2, h: 0.95, fontFace: F, fontSize: 12, margin: 0 });

  // ask panel
  s.addShape(p.shapes.ROUNDED_RECTANGLE, { x: 8.1, y: 3.85, w: 4.73, h: 2.7, fill: { color: PANEL2 }, rectRadius: 0.08, line: { color: CYAN, width: 1.5 } });
  s.addText("THE ASK", { x: 8.4, y: 4.05, w: 4.1, h: 0.35, fontFace: F, fontSize: 14, bold: true, color: CYAN, charSpacing: 3, margin: 0 });
  s.addText("The 2027 Global Energy Cohort pathway: one pilot hospital, metered data, and a measured-vs-predicted proof pack within a year.", {
    x: 8.4, y: 4.45, w: 4.1, h: 1.1, fontFace: F, fontSize: 13, color: TEXT, margin: 0,
  });
  s.addText("Team: Jackson Sixtus Abetianbe (solo entry) · all product features built during the 48-hour sprint · 58 tests · reproducible results.", {
    x: 8.4, y: 5.65, w: 4.1, h: 0.75, fontFace: F, fontSize: 11.5, color: MUTED, margin: 0,
  });

  s.addText("MEDGRID SENTINEL — Intelligent Hospital Microgrids. Predictive Energy Resilience. Uninterrupted Critical Care.", {
    x: M, y: 6.85, w: 9.5, h: 0.35, fontFace: F, fontSize: 12.5, bold: true, color: CYAN_SOFT, margin: 0,
  });
  s.addText("5", { x: W - 1.0, y: H - 0.42, w: 0.5, h: 0.3, align: "right", fontFace: F, fontSize: 12, color: MUTED, margin: 0 });
}

p.writeFile({ fileName: "submission/MedGrid_Sentinel_Pitch_Deck.pptx" }).then(() => console.log("deck written"));
