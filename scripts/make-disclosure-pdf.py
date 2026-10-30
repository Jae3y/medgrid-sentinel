# Disclosure statement PDF from the canonical txt (simple clean layout)
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable

NAVY = HexColor("#0B1F3A"); CYAN_TXT = HexColor("#155E75"); TEXT = HexColor("#1F2937")
MUTED = HexColor("#5B6B7C")

src = open("submission/DISCLOSURE_STATEMENT.txt", encoding="utf-8").read()
title, _, body = src.partition("\n\n")

doc = SimpleDocTemplate(
    "submission/DISCLOSURE_STATEMENT.pdf", pagesize=A4,
    leftMargin=18 * mm, rightMargin=18 * mm, topMargin=14 * mm, bottomMargin=14 * mm,
    title="MedGrid Sentinel — Disclosure Statement", author="MedGrid Sentinel",
    subject="Anneru IAS Global Energy Hackathon 2026 — Disclosure", creator="MedGrid Sentinel",
)

h = ParagraphStyle("h", fontName="Helvetica-Bold", fontSize=15, leading=19, textColor=NAVY)
sub = ParagraphStyle("sub", fontName="Helvetica", fontSize=9, leading=12, textColor=CYAN_TXT)
b = ParagraphStyle("b", fontName="Helvetica", fontSize=9.5, leading=13, textColor=TEXT, spaceAfter=4)
bv = ParagraphStyle("bv", fontName="Helvetica", fontSize=9, leading=12, textColor=MUTED)

E = [Paragraph(title.split("\n")[0], h)]
E.append(Paragraph(" ".join(title.split("\n")[1:]), sub))
E.append(Spacer(1, 4))
E.append(HRFlowable(width="100%", thickness=1.2, color=NAVY, spaceAfter=8))
for para in body.strip().split("\n\n"):
    first, _, rest = para.partition("\n")
    head = first.strip()
    if head.rstrip().endswith(")") or head.startswith(("1.","2.","3.","4.","5.","6.","7.","8.","9.","Declaration")):
        E.append(Paragraph(f"<b>{head}</b>", b))
    else:
        E.append(Paragraph(head, b))
    if rest.strip():
        E.append(Paragraph(rest.strip().replace("\n", "<br/>"), bv))
doc.build(E)
from pypdf import PdfReader
print("disclosure pdf written —", len(PdfReader("submission/DISCLOSURE_STATEMENT.pdf").pages), "page(s)")
