# One-Page Summary PDF (Handbook §10 deliverable 4 — exactly one page, Appendix A fields)
# Run: python scripts/make-onepager.py
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable,
)

NAVY = HexColor("#0B1F3A")
NAVY2 = HexColor("#12294B")
CYAN = HexColor("#0E7490")
CYAN_TXT = HexColor("#155E75")
TEXT = HexColor("#111827")
MUTED = HexColor("#5B6B7C")
LINE = HexColor("#D7DEE8")
PANEL = HexColor("#F2F6FA")
AMBER = HexColor("#92610A")

W, Hh = A4
M = 14 * mm

styles = {
    "title": ParagraphStyle("title", fontName="Helvetica-Bold", fontSize=18, leading=21, textColor=NAVY),
    "tag": ParagraphStyle("tag", fontName="Helvetica", fontSize=9.5, leading=13, textColor=CYAN_TXT),
    "h": ParagraphStyle("h", fontName="Helvetica-Bold", fontSize=9.6, leading=12, textColor=NAVY, spaceBefore=4.2, spaceAfter=1.2),
    "b": ParagraphStyle("b", fontName="Helvetica", fontSize=9.0, leading=11.6, textColor=TEXT, alignment=TA_LEFT),
    "m": ParagraphStyle("m", fontName="Helvetica", fontSize=8.2, leading=10.5, textColor=MUTED),
    "k": ParagraphStyle("k", fontName="Helvetica-Bold", fontSize=9.3, leading=12.3, textColor=TEXT),
}

doc = SimpleDocTemplate(
    "submission/MedGrid_Sentinel_One_Page_Summary.pdf", pagesize=A4,
    leftMargin=M, rightMargin=M, topMargin=9 * mm, bottomMargin=8 * mm,
    title="MedGrid Sentinel — One-Page Summary",
    author="MedGrid Sentinel", subject="Anneru IAS Global Energy Hackathon 2026 — Brief #13",
    creator="MedGrid Sentinel",
)

E = []
E.append(Paragraph("MEDGRID SENTINEL", ParagraphStyle("t0", parent=styles["title"], fontSize=20, leading=23)))
E.append(Paragraph("Intelligent Hospital Microgrids · Predictive Energy Resilience · Uninterrupted Critical Care", styles["tag"]))
E.append(Spacer(1, 2))
E.append(HRFlowable(width="100%", thickness=1.4, color=NAVY, spaceAfter=3))
E.append(Paragraph(
    "One-page summary · Anneru IAS Global Energy Hackathon 2026 (Oct 30 – Nov 1) · <b>Brief #13 — Power for a city the grid can't protect</b> · "
    "<b>Track 2</b> Digital Solutions &amp; AI · <b>Setting B</b> Non-residential (healthcare) · Team: [CONFIRM AT SUBMISSION]", styles["m"]))
E.append(Spacer(1, 2))

def sec(title, body):
    E.append(Paragraph(title, styles["h"]))
    E.append(Paragraph(body, styles["b"]))

sec("Community & target user — who, specifically, and who pays",
    "Urban Nigerian hospitals on feeders that fail with the national grid (250-bed reference hospital, illustrative). "
    "User: the facility/works engineer and duty manager. Payer: the hospital, or an energy-service provider under "
    "Energy-as-a-Service — the structure of the real NSIA-LUTH cancer-centre microgrid (300 kWp/1.1 MWh, 2025).")

sec("The problem — what fails today, and why",
    "Nigeria's grid failed 12+ times in 2024 (industry counts; NERC official count lower). Each collapse drops hospitals onto "
    "diesel at ≈7× grid cost (≈₦1,560/L vs ≈₦210/kWh) and threatens operating theatres, ICU and the vaccine cold chain. Solar+storage "
    "is bought blind: no tool shows whether a design holds critical loads through a real outage, or what each avoided diesel litre costs. "
    "Root cause: decision quality, not hardware.")

sec("Proposed solution — what we built and how it works",
    "A deterministic hospital-microgrid digital twin: a 15-minute-step simulation of PV, battery, grid and genset dispatching around "
    "tiered clinical loads (life-critical / clinical-priority / deferrable), with outage islanding and honest deficit reporting — plus a "
    "ten-scenario stress lab, an EaaS financial engine, a dual-metric sizing optimizer and explainable predictive intelligence. No black box "
    "touches dispatch; the core runs offline with no external APIs.")

sec("Proof of Concept for the 48 hours",
    "The full application built during the sprint: deterministic engine (power balance verified every step), 58 unit tests with "
    "hand-calculated values, production build verified, results reproducible via <font face='Courier-Bold' size='8'>npm run results</font>.")

# results table
res = [
    [Paragraph("<b>Brief metric</b>", styles["k"]), Paragraph("<b>Diesel-only baseline</b>", styles["k"]), Paragraph("<b>Sentinel-managed</b>", styles["k"])],
    [Paragraph("Critical-service hours (12.5 h islanded window)", styles["b"]), Paragraph("12.50 h (diesel-carried)", styles["b"]), Paragraph("<b>12.50 h — 100%, 0.00 kWh unserved Tier-1</b>", styles["b"])],
    [Paragraph("Diesel litres (3-day scenario window)", styles["b"]), Paragraph("1,295 L", styles["b"]), Paragraph("<b>763 L — 532 L avoided (−41%)</b>", styles["b"])],
    [Paragraph("Annualized (320 normal + 45 outage days)", styles["b"]), Paragraph("58,255 L/yr · ₦569.6M/yr opex", styles["b"]), Paragraph("<b>34,345 L/yr · ₦457.8M/yr · −₦111.8M/yr · −64.1 t CO₂/yr</b>", styles["b"])],
]
t = Table(res, colWidths=[(W - 2 * M) * 0.34, (W - 2 * M) * 0.27, (W - 2 * M) * 0.39])
t.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), NAVY2),
    ("TEXTCOLOR", (0, 0), (-1, 0), HexColor("#FFFFFF")),
    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [PANEL, HexColor("#FFFFFF")]),
    ("GRID", (0, 0), (-1, -1), 0.5, LINE),
    ("LEFTPADDING", (0, 0), (-1, -1), 4), ("RIGHTPADDING", (0, 0), (-1, -1), 4),
    ("TOPPADDING", (0, 0), (-1, -1), 2.5), ("BOTTOMPADDING", (0, 0), (-1, -1), 2.5),
]))
# white header text needs white paragraph style
res[0] = [
    Paragraph("<b><font color='#FFFFFF'>Brief metric</font></b>", styles["k"]),
    Paragraph("<b><font color='#FFFFFF'>Diesel-only baseline</font></b>", styles["k"]),
    Paragraph("<b><font color='#FFFFFF'>Sentinel-managed</font></b>", styles["k"]),
]
t = Table(res, colWidths=[(W - 2 * M) * 0.34, (W - 2 * M) * 0.27, (W - 2 * M) * 0.39])
t.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), NAVY2),
    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [PANEL, HexColor("#FFFFFF")]),
    ("GRID", (0, 0), (-1, -1), 0.5, LINE),
    ("LEFTPADDING", (0, 0), (-1, -1), 4), ("RIGHTPADDING", (0, 0), (-1, -1), 4),
    ("TOPPADDING", (0, 0), (-1, -1), 2.5), ("BOTTOMPADDING", (0, 0), (-1, -1), 2.5),
]))
E.append(Paragraph("Brief success metrics — baseline vs Sentinel (from results/demo-results.json, reproducible)", styles["h"]))
E.append(t)

sec("Estimated cost & who pays — can the lowest-income users afford it?",
    "Reference design CapEx ≈ <b>₦760.4M ($491k)</b>: payback <b>7.9 yr</b>, IRR 4.6%, NPV negative at an 18% commercial discount rate — stated plainly. "
    "EaaS fee ≈ ₦161M/yr vs ₦112M/yr operating savings: closes below a computed <b>4.6% financing rate</b> — exactly the gap REA-type/DFI programmes exist "
    "to fill; service cost ≈ <b>₦1,764/bed-day</b>. No grant is assumed to exist anywhere in the model.")

sec("6–18-month deployment path — what gets built, by whom",
    "M1–3: metering-first pilot on one real feeder (replace illustrative data). M4–6: engineering design, permits, financing &amp; O&M agreements with an "
    "energy-service partner. M7–12: pilot deployed; measured-vs-predicted evidence. M13–18: replicate to 3–5 facilities; provider playbook. "
    "Installation is performed by licensed partners — Sentinel is decision support, never a control system.")

sec("How it scales",
    "One facility = one configuration object (loads, tariffs, outage pattern, climate); the rural-clinic profile runs on the same engine today. "
    "The sizing optimizer proves designs must match outage timing: daytime outages → PV-first (no battery optimal); evening outages → storage-heavy. "
    "Country adaptation = parameter changes (tariffs, diesel/FX, standards, financing), not code changes.")

sec("Biggest risk & how we test it",
    "Simulated facility data could mislead the sizing recommendation. Mitigation is structural: every input is labelled, the engine accepts measured "
    "AMI data unchanged, and the roadmap is metering-first — month 1 delivers the feeder's real outage pattern before any CapEx decision. "
    "Secondary risk: brief definitions pending full kick-off text (logged for reconciliation; metrics computed generically).")

sec("Prior-work disclosure",
    "Everything was built during the 48-hour sprint (repository starts at the sprint's opening commit). Tools: AI coding agent as development instrument "
    "(disclosed), standard open-source libraries, no external datasets or APIs. Full statement: submission/DISCLOSURE_STATEMENT.txt.")

doc.build(E)

# verify exactly one page
from pypdf import PdfReader
n = len(PdfReader("submission/MedGrid_Sentinel_One_Page_Summary.pdf").pages)
print(f"one-pager written — {n} page(s)")
assert n == 1, "MUST be exactly one page"
