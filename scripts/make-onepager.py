# One-Page Summary PDF (Handbook s10 deliverable 4: exactly one page, Appendix A fields).
# Every number is read from results/demo-results.json (npm run results).
# Run: python scripts/make-onepager.py
import json
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable

R = json.load(open("results/demo-results.json", encoding="utf-8"))
rep = R["brief13Replay"]
res = rep["results"]
A = R["annualEconomics"]
mc = R["monteCarlo14Day"]["nrc"]["byStrategy"]

def n0(v): return f"{int(v + 0.5) if v >= 0 else -int(-v + 0.5):,}"  # half-up, matches JS Math.round
from decimal import Decimal, ROUND_HALF_UP
def f1(v): return str(Decimal(str(v)).quantize(Decimal("0.1"), rounding=ROUND_HALF_UP))  # matches JS toFixed(1) on stored values
def pct(v, d=0): return f"{v*100:.{d}f}%"
def naira(v): return f"N{v/1e9:.2f}B" if abs(v) >= 1e9 else f"N{v/1e6:.1f}M"

NAVY = HexColor("#0B1F3A"); NAVY2 = HexColor("#12294B"); CYAN_TXT = HexColor("#155E75")
TEXT = HexColor("#111827"); MUTED = HexColor("#5B6B7C"); LINE = HexColor("#D7DEE8"); PANEL = HexColor("#F2F6FA")
W, Hh = A4
M = 12 * mm
S = {
    "title": ParagraphStyle("title", fontName="Helvetica-Bold", fontSize=18, leading=21, textColor=NAVY),
    "tag": ParagraphStyle("tag", fontName="Helvetica", fontSize=9, leading=12, textColor=CYAN_TXT),
    "h": ParagraphStyle("h", fontName="Helvetica-Bold", fontSize=8.9, leading=11, textColor=NAVY, spaceBefore=3.2, spaceAfter=0.8),
    "b": ParagraphStyle("b", fontName="Helvetica", fontSize=8.15, leading=10.25, textColor=TEXT),
    "m": ParagraphStyle("m", fontName="Helvetica", fontSize=7.6, leading=9.6, textColor=MUTED),
    "k": ParagraphStyle("k", fontName="Helvetica-Bold", fontSize=8.1, leading=10, textColor=TEXT),
}

doc = SimpleDocTemplate("submission/MedGrid_Sentinel_One_Page_Summary.pdf", pagesize=A4, leftMargin=M, rightMargin=M,
                        topMargin=8 * mm, bottomMargin=7 * mm, title="MedGrid Sentinel - One-Page Summary",
                        author="Jackson Sixtus Abetianbe", subject="Global Energy Hackathon 2026 - Brief #13")
E = []
E.append(Paragraph("MEDGRID SENTINEL", S["title"]))
E.append(Paragraph("The generator works. The fuel doesn't come. A fuel-aware brain for hospital microgrids that turns every litre the sun saves into hours of critical care.", S["tag"]))
E.append(HRFlowable(width="100%", thickness=1.3, color=NAVY, spaceBefore=2, spaceAfter=2))
E.append(Paragraph("<b>Team:</b> Jackson Sixtus Abetianbe (solo entry, permitted by Handbook s8) &nbsp;·&nbsp; <b>Brief #13</b> Power for a city the grid can't protect &nbsp;·&nbsp; "
                   "<b>Track 2</b> Digital Solutions &amp; AI &nbsp;·&nbsp; <b>Setting B</b> Non-residential (healthcare) &nbsp;·&nbsp; Anneru IAS Global Energy Hackathon, 30 Oct - 1 Nov 2026", S["m"]))

MD = []
def sec(t, b):
    E.append(Paragraph(t, S["h"]))
    E.append(Paragraph(b, S["b"]))
    MD.append((t, b))

sec("Community & target user - who, and who pays",
    "Referral hospitals in cities whose transmission line is repeatedly cut - instantiated on <b>Maiduguri, Borno State</b> (Gombe-Damaturu-Maiduguri 330 kV line "
    "down 22 Sep - 31 Oct 2024; ~2 months in 2021). <b>User:</b> the works engineer and duty manager. <b>Beneficiaries:</b> ICU, theatre, maternity, cold-chain and "
    "emergency patients (250 beds = 91,250 bed-days/yr). <b>Payer:</b> hospital management, or an energy-service company (ESCO) repaid from diesel no longer bought.")
sec("The problem - what fails today, and why",
    f"Backup is sized in kW, but a line outage is an energy-logistics crisis: diesel need rises ~4x ({n0(rep['normalYearWeeklyDieselLitres'])} L/week in a normal year, simulated) "
    "while deliveries and budgets stay flat. In Dec 2022 two Maiduguri hospitals sat dark for days with working generators and empty tanks (ICIR). Only 50% of "
    "hospitals in sub-Saharan Africa report reliable electricity (WHO et al., 2023). <b>Root cause:</b> no one decides, in advance and quantitatively, which loads the remaining litres protect.")
sec("Proposed solution - what we built and how it works",
    "A hospital-microgrid digital twin (15-min steps, 16 tiered circuits, PV, LFP storage, generator, diesel tank and resupply chain) with a <b>predictive controller</b>: "
    "(1) a fuel-runway governor that compares diesel + battery + forecast solar with each care tier's energy need until the next expected delivery and defers the least "
    "critical loads first; (2) a clinical ride-through reserve so a failed generator never darkens the ICU; (3) efficient generator cycling. Offline web app + SMS/USSD alerts.")
sec("Proof of Concept built in the 48 hours",
    f"Replay of the real 39-day outage on NASA POWER measured weather, four controllers on identical hardware/fuel; 300-trial Monte Carlo with NREL generator-failure data; "
    f"full-year economics; solar forecast scored on held-out 2024; 101 automated tests; reproducible with <font face='Courier'>npm run results</font>.")

rows = [
    [Paragraph("<font color='#FFFFFF'><b>Brief metric (39-day outage, %s L/week diesel)</b></font>" % n0(rep['assumptions']['weeklySupplyLitres']), S["k"]),
     Paragraph("<font color='#FFFFFF'><b>Status quo (diesel)</b></font>", S["k"]),
     Paragraph("<font color='#FFFFFF'><b>Same PV+battery, fixed rules</b></font>", S["k"]),
     Paragraph("<font color='#FFFFFF'><b>MedGrid Sentinel</b></font>", S["k"])],
    [Paragraph("Critical-service hours maintained (Tier 1+2)", S["b"]), Paragraph(n0(res["baseline"]["criticalHours"]) + " h", S["b"]),
     Paragraph(n0(res["conventional"]["criticalHours"]) + " h", S["b"]), Paragraph("<b>%s / %s h</b>" % (n0(res["sentinel"]["criticalHours"]), n0(rep["results"]["sentinel"]["criticalHours"])), S["b"])],
    [Paragraph("Diesel litres (litres avoided)", S["b"]), Paragraph(n0(res["baseline"]["dieselLitres"]) + " L", S["b"]),
     Paragraph(n0(res["conventional"]["dieselLitres"]) + " L", S["b"]), Paragraph("<b>%s L (-%s L)</b>" % (n0(res["sentinel"]["dieselLitres"]), n0(res["baseline"]["dieselLitres"] - res["sentinel"]["dieselLitres"])), S["b"])],
    [Paragraph("Life-critical Tier-1 breaks · empty-tank hours", S["b"]), Paragraph("%d · %s h" % (res["baseline"]["tier1Interruptions"], n0(res["baseline"]["fuelOutHours"])), S["b"]),
     Paragraph("%d · %s h" % (res["conventional"]["tier1Interruptions"], n0(res["conventional"]["fuelOutHours"])), S["b"]), Paragraph("<b>%d · %s h</b>" % (res["sentinel"]["tier1Interruptions"], n0(res["sentinel"]["fuelOutHours"])), S["b"])],
    [Paragraph("P(Tier-1 powered 14 days), Monte Carlo", S["b"]), Paragraph(pct(mc["baseline"]["pTier1_336h"]), S["b"]),
     Paragraph(pct(mc["conventional"]["pTier1_336h"]), S["b"]), Paragraph("<b>%s</b>" % pct(mc["sentinel"]["pTier1_336h"]), S["b"])],
    [Paragraph("Full measured year: diesel · CO2 · Tier-1 transfer breaks", S["b"]), Paragraph("%s L · %s t · %s" % (n0(A["baseline"]["dieselLitres"]), n0(A["baseline"]["dieselLitres"] * 2.68 / 1000), n0(A["baseline"]["tier1Interruptions"])), S["b"]),
     Paragraph("-", S["b"]), Paragraph("<b>-%s L (-%s) · -%s t · %s</b>" % (n0(A["dieselLitresAvoidedPerYear"]), pct(A["dieselAvoidedPct"]), n0(A["co2TonnesAvoidedPerYear"]), n0(A["proposed"]["tier1Interruptions"])), S["b"])],
]
cw = W - 2 * M
t = Table(rows, colWidths=[cw * 0.34, cw * 0.18, cw * 0.2, cw * 0.28])
t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), NAVY2), ("ROWBACKGROUNDS", (0, 1), (-1, -1), [PANEL, HexColor("#FFFFFF")]),
                       ("GRID", (0, 0), (-1, -1), 0.5, LINE), ("LEFTPADDING", (0, 0), (-1, -1), 3.5), ("RIGHTPADDING", (0, 0), (-1, -1), 3.5),
                       ("TOPPADDING", (0, 0), (-1, -1), 2), ("BOTTOMPADDING", (0, 0), (-1, -1), 2), ("VALIGN", (0, 0), (-1, -1), "MIDDLE")]))
E.append(Spacer(1, 3))
E.append(t)
E.append(Paragraph("Illustrative 250-bed reference hospital; simulation, not field-measured performance. Real data: NASA POWER, NREL/TP-5C00-76553, NERC Band A tariff, Oct-2026 diesel N1,950/L.", S["m"]))

c = A["capex"]
sec("Estimated cost & who pays - can the lowest-income users afford it?",
    f"Reference design (optimizer-selected) 600 kWp PV + 600 kWh LFP + 510 kW PCS + Sentinel edge: <b>${n0(c['totalUsd'])} ({naira(c['totalNaira'])})</b>. Savings {naira(A['annualSavingsNaira'])}/yr "
    f"-> payback <b>{f1(A['paybackYears'])} yr</b>, IRR {pct(A['irr'])}, 20-yr NPV {naira(A['npv20yAt18pct'])} at 18%. <b>Who pays:</b> under EaaS the ESCO owns and maintains; the hospital pays "
    f"{naira(A['eaasMonthlyFeeNaira'])}/month (80% of measured savings), zero CapEx, and keeps 20% from month one (provider IRR {pct(A['eaasProviderIrr'])}). Energy cost per bed-day falls "
    f"N{n0(A['energyCostPerBedDay']['baseline'])} -> N{n0(A['energyCostPerBedDay']['proposedEaaS'])}; nothing is passed to patients. No grant assumed.")
sec("6-18-month deployment path - what gets built, by whom",
    "M1-3 metering and circuit audit at one Maiduguri-class hospital; Sentinel in shadow mode on real data. M4-6 engineering design (IEC 62446/62619/62109 equipment, NEMSA inspection) "
    "and EaaS term sheet with a licensed installer. M7-12 install; Sentinel dispatches; SMS alerts live; measured-vs-predicted reported monthly. M13-18 sites 2-3 (Kano, Abuja).")
fl = R["fleet"]["rows"]
strong = sorted({r["site"].split(",")[0].replace(" (NG)", "") for r in fl if r["verdict"] == "strong"})
other = sorted({r["site"].split(",")[0].replace(" (NG)", "") for r in fl if r["verdict"] != "strong"})
pbs = [r["paybackYears"] for r in fl if r["verdict"] == "strong"]
pbo = [r["paybackYears"] for r in fl if r["verdict"] != "strong"]
sec("How it scales - what changes in a second community or country",
    "Only configuration: measured weather (same NASA POWER pipeline), load profile, tariff, feeder regime, standards. Fleet screen of %d site-years (250- and 80-bed hospitals): "
    "payback %s-%s yr in %s; %s-%s yr in %s (better grid, weaker sun) - the tool says where it pays. Fleet procurement + standard design: assumed 6%% cost drop per doubling (hypothesis)."
    % (len(fl), f1(min(pbs)), f1(max(pbs)), ", ".join(strong), f1(min(pbo)), f1(max(pbo)), ", ".join(other)))
sec("Biggest risk & how we will test it early",
    "Modelled loads and generator condition may differ from the real hospital. Test: 3 months of shadow-mode operation on circuit-level metering before any capital; proceed only if "
    "daily-energy prediction error is within +/-15%. Secondary: theft/vandalism of panels - on-campus siting and insurance priced into the EaaS fee.")
sec("Prior-work disclosure",
    "Nothing existed before 30 Oct 2026 12:00 PM ET. Day 1 (30 Oct) first version built with the ZCode AI coding agent; Day 2 (31 Oct) engine and product rebuilt with Claude Code (Anthropic). "
    "Open-source: Next.js, React, Recharts, Zustand, Vitest, pptxgenjs, ReportLab. Data: NASA POWER. Full statement: DISCLOSURE_STATEMENT.pdf; git history is public.")
E.append(Spacer(1, 3))
E.append(Paragraph("<b>Live demo:</b> https://jae3y.github.io/medgrid-sentinel/ &nbsp;·&nbsp; <b>Code &amp; data:</b> github.com/Jae3y/medgrid-sentinel", S["b"]))
doc.build(E)

# Editable source mirror (same strings as the PDF)
import re as _re
def _plain(x): return _re.sub(r"<[^>]+>", "", x).replace("&amp;", "&").replace("&nbsp;", " ")
md = ["# MedGrid Sentinel - One-Page Summary (editable source)", "",
      "> Generated by scripts/make-onepager.py together with the PDF; numbers come from results/demo-results.json.", "",
      "**Team:** Jackson Sixtus Abetianbe (solo) | **Brief #13** Power for a city the grid can't protect | **Track 2** Digital Solutions & AI | **Setting B** Non-residential (healthcare)", ""]
tbl = [[_plain(c.text) if hasattr(c, "text") else str(c) for c in row] for row in rows]
inserted = False
for t, b in MD:
    md += [f"## {t}", "", _plain(b), ""]
    if t.startswith("Proof of Concept") and not inserted:
        md += ["| " + " | ".join(tbl[0]) + " |", "|" + "---|" * len(tbl[0])] + ["| " + " | ".join(r) + " |" for r in tbl[1:]] + [""]
        inserted = True
open("submission/MedGrid_Sentinel_One_Page_Summary_source.md", "w", encoding="utf-8", newline=chr(10)).write(chr(10).join(md))

from pypdf import PdfReader
n = len(PdfReader("submission/MedGrid_Sentinel_One_Page_Summary.pdf").pages)
print(f"one-pager written - {n} page(s)")
assert n == 1, "MUST be exactly one page"
