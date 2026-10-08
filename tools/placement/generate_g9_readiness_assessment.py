#!/usr/bin/env python3
"""Generate the short student-facing GIIS Grade 9 readiness screen.

The staff scoring guide is local-only outside this public repository. This
script emits only the student booklet.
"""

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    BaseDocTemplate, Frame, HRFlowable, PageBreak, PageTemplate, Paragraph,
    Spacer, Table, TableStyle,
)


ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "public" / "admissions-materials" / "giis-grade-9-readiness-assessment.pdf"
NAVY = colors.HexColor("#17233D")
GOLD = colors.HexColor("#C89A2B")
INK = colors.HexColor("#222A35")
MUTED = colors.HexColor("#5D6674")
PALE = colors.HexColor("#F4F6F9")
LINE = colors.HexColor("#C9CED7")


def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(LINE)
    canvas.line(0.65 * inch, 0.52 * inch, 7.85 * inch, 0.52 * inch)
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(MUTED)
    canvas.drawString(0.65 * inch, 0.33 * inch, "GIIS Grade 9 Readiness Screen - Student Booklet")
    canvas.drawRightString(7.85 * inch, 0.33 * inch, f"Page {doc.page}")
    canvas.restoreState()


def styles():
    base = getSampleStyleSheet()
    return {
        "CoverSchool": ParagraphStyle("CoverSchool", parent=base["Normal"], fontName="Helvetica-Bold", fontSize=11, leading=14, textColor=GOLD, alignment=TA_CENTER, spaceAfter=16),
        "CoverTitle": ParagraphStyle("CoverTitle", parent=base["Title"], fontName="Helvetica-Bold", fontSize=29, leading=34, textColor=NAVY, alignment=TA_CENTER, spaceAfter=12),
        "CoverSub": ParagraphStyle("CoverSub", parent=base["Normal"], fontName="Helvetica", fontSize=12, leading=18, textColor=MUTED, alignment=TA_CENTER, spaceAfter=18),
        "Kicker": ParagraphStyle("Kicker", parent=base["Normal"], fontName="Helvetica-Bold", fontSize=8, leading=11, tracking=1.2, textColor=GOLD, spaceAfter=4),
        "Section": ParagraphStyle("Section", parent=base["Heading1"], fontName="Helvetica-Bold", fontSize=20, leading=24, textColor=NAVY, spaceAfter=4),
        "H2": ParagraphStyle("H2", parent=base["Heading2"], fontName="Helvetica-Bold", fontSize=13, leading=17, textColor=NAVY, spaceBefore=9, spaceAfter=6),
        "Meta": ParagraphStyle("Meta", parent=base["Normal"], fontName="Helvetica", fontSize=9, leading=13, textColor=MUTED),
        "Body": ParagraphStyle("Body", parent=base["BodyText"], fontName="Helvetica", fontSize=9.8, leading=14.2, textColor=INK, spaceAfter=8),
        "Passage": ParagraphStyle("Passage", parent=base["BodyText"], fontName="Times-Roman", fontSize=10.4, leading=15.4, textColor=INK, firstLineIndent=16, spaceAfter=8),
        "Question": ParagraphStyle("Question", parent=base["BodyText"], fontName="Helvetica", fontSize=9.7, leading=13.8, textColor=INK, spaceAfter=5),
        "Small": ParagraphStyle("Small", parent=base["Normal"], fontName="Helvetica", fontSize=8.5, leading=12, textColor=MUTED, spaceAfter=5),
        "Callout": ParagraphStyle("Callout", parent=base["BodyText"], fontName="Helvetica-Bold", fontSize=10, leading=14, textColor=NAVY, leftIndent=10, rightIndent=10, spaceBefore=6, spaceAfter=6),
        "Center": ParagraphStyle("Center", parent=base["Normal"], fontName="Helvetica", fontSize=10, leading=15, textColor=INK, alignment=TA_CENTER),
    }


def answer_lines(count, width=7.0):
    table = Table([[""] for _ in range(count)], colWidths=[width * inch], rowHeights=[0.28 * inch] * count)
    table.setStyle(TableStyle([("LINEBELOW", (0, 0), (-1, -1), 0.45, LINE)]))
    return table


def q(story, s, number, prompt, points, lines=3):
    story.append(Paragraph(f"<b>{number}.</b> {prompt} <font color='#7A611C'>[{points} points]</font>", s["Question"]))
    if lines:
        story.append(answer_lines(lines))
    story.append(Spacer(1, 0.12 * inch))


def section(story, s, kicker, title, meta):
    story.extend([
        Paragraph(kicker.upper(), s["Kicker"]),
        Paragraph(title, s["Section"]),
        Paragraph(meta, s["Meta"]),
        HRFlowable(width="100%", thickness=2, color=GOLD, spaceBefore=6, spaceAfter=14),
    ])


def styled_table(rows, widths, font_size=8.8):
    table = Table(rows, colWidths=[w * inch for w in widths])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), font_size),
        ("GRID", (0, 0), (-1, -1), 0.5, LINE),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, PALE]),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (1, 1), (-1, -1), "CENTER"),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    return table


def build_pdf():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    s = styles()
    doc = BaseDocTemplate(
        str(OUTPUT), pagesize=letter, leftMargin=0.7 * inch, rightMargin=0.7 * inch,
        topMargin=0.65 * inch, bottomMargin=0.72 * inch,
        title="GIIS Grade 9 Readiness Screen", author="Genesis of Ideas International School",
        subject="Short provisional Grade 9 placement screen",
    )
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="normal")
    doc.addPageTemplates([PageTemplate(id="screen", frames=[frame], onPage=footer)])
    story = []

    # 1 - Cover
    story.extend([
        Spacer(1, 0.65 * inch),
        Paragraph("GENESIS OF IDEAS INTERNATIONAL SCHOOL", s["CoverSchool"]),
        Paragraph("Grade 9 Readiness Screen", s["CoverTitle"]),
        Paragraph("Student Booklet - Version 2.0", s["CoverSub"]),
        HRFlowable(width="58%", thickness=3, color=GOLD, spaceBefore=4, spaceAfter=24, hAlign="CENTER"),
    ])
    info = Table([
        ["Student name", ""], ["Date of birth", ""], ["Assessment date", ""],
        ["Parent/guardian", ""], ["Current city and country", ""],
    ], colWidths=[1.65 * inch, 4.95 * inch], rowHeights=[0.42 * inch] * 5)
    info.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"), ("FONTSIZE", (0, 0), (-1, -1), 9.5),
        ("TEXTCOLOR", (0, 0), (-1, -1), INK), ("BACKGROUND", (0, 0), (0, -1), PALE),
        ("GRID", (0, 0), (-1, -1), 0.55, LINE), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 9),
    ]))
    story.extend([
        info, Spacer(1, 0.3 * inch),
        Paragraph("This short screen helps GIIS identify a responsible starting point. It does not by itself award credit, guarantee Grade 9 placement, or create a transcript grade.", s["Callout"]),
        Spacer(1, 0.18 * inch),
        Paragraph("Return completed pages to: admissions@genesisideas.school", s["Center"]),
        PageBreak(),
    ])

    # 2 - Instructions
    section(story, s, "Before you begin", "Family and Student Instructions", "About 90 minutes total. It may be completed in one sitting or two shorter sessions.")
    items = [
        ("Print", "Print the full booklet at 100% scale. One-sided printing is recommended."),
        ("Work independently", "A parent may explain procedural directions, but may not translate passages, suggest methods, check answers, or edit the work."),
        ("Use only allowed tools", "English: no dictionary, translator, AI, or internet. Math Questions 1-6: no calculator. Math Questions 7-12 and Science: a basic calculator is allowed."),
        ("Write and show work", "Write by hand on the booklet. Attach labeled extra paper if needed. If you do not know an answer, write 'I do not know' and continue."),
        ("Return clear pages", "Scan everything into one PDF if possible. Clear, flat, well-lit photos are also acceptable."),
    ]
    rows = [[Paragraph(f"<b>{i}</b>", s["Body"]), Paragraph(f"<b>{title}</b><br/>{body}", s["Body"])] for i, (title, body) in enumerate(items, 1)]
    table = Table(rows, colWidths=[0.35 * inch, 6.55 * inch])
    table.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("BOTTOMPADDING", (0, 0), (-1, -1), 10), ("TEXTCOLOR", (0, 0), (0, -1), GOLD)]))
    story.extend([table, Paragraph("Suggested timing", s["H2"])])
    story.append(styled_table([
        ["Section", "Time", "Focus"],
        ["English", "35 min", "Reading and short writing"],
        ["Mathematics", "35 min", "Core Grade 8-to-9 prerequisites"],
        ["Science reasoning", "20 min", "Data, evidence, and investigation"],
        ["Learning check", "Untimed", "Planning and independent work habits"],
    ], [2.0, 1.2, 3.7]))
    story.extend([Spacer(1, 0.16 * inch), Paragraph("The goal is an honest snapshot, not a perfect score. Take a short break between sections if needed.", s["Callout"]), PageBreak()])

    # 3 - English passage and reading
    section(story, s, "Section 1", "English", "30 points | 35 minutes | No dictionary, translator, AI, or internet")
    story.append(Paragraph("A Cooler Route to School", s["H2"]))
    passage = [
        "On warm afternoons, students walking home through Riverton's East Ward often waited for buses on blocks with little shade. A student group wanted the city to plant trees, but they first needed evidence that the hottest locations were also places students regularly used.",
        "The group selected six bus stops and recorded surface temperature, air temperature, shade, and the number of waiting passengers at the same time on four clear days. The pavement at the least shaded stops was consistently hotter. Two of those stops also had the highest passenger counts.",
        "The students proposed planting trees at all six stops. A city planner supported the goal but explained that young trees require water and care for years before they provide much shade. Without a maintenance plan, some trees might die before helping anyone.",
        "The students revised their proposal. They focused on the two busy, high-temperature stops and found community groups willing to water the trees. They also recommended temporary shade structures while the trees grew. The revised plan covered fewer locations, but it connected each recommendation to evidence and a realistic maintenance partner.",
        "The project did not prove that trees solve every danger caused by heat. It did show how measurements and feedback can turn a broad concern into a practical first step.",
    ]
    for p in passage:
        story.append(Paragraph(p, s["Passage"]))
    q(story, s, 1, "State the central idea. Give two details from the passage that support it.", 6, 5)
    q(story, s, 2, "Why does the author include the city planner's concern? Explain how it changes the students' proposal.", 4, 4)
    story.append(PageBreak())

    # 4 - English data and writing
    section(story, s, "English continued", "Data and Short Writing", "Use the table and passage. You may use extra paper.")
    story.append(styled_table([
        ["Bus stop", "Average pavement temperature", "Average waiting passengers"],
        ["A - full shade", "91 F", "8"],
        ["B - partial shade", "102 F", "11"],
        ["C - little shade", "112 F", "19"],
    ], [1.7, 2.6, 2.6]))
    q(story, s, 3, "Which stop should be the first priority? Use two numbers from the table and one idea from the passage.", 6, 5)
    q(story, s, 4, "Write 150-220 words: Should the city approve the revised plan? State a clear claim, use evidence from the passage and table, acknowledge one limitation or concern, and give a conclusion.", 14, 13)
    story.append(PageBreak())

    # 5 - Math A
    section(story, s, "Section 2A", "Mathematics - No Calculator", "18 points | About 17 minutes | Show work")
    math_a = [
        (1, "Evaluate: -5 + 3(4 - 7).", 2, 2),
        (2, "Compute and simplify: 3/4 + 5/8.", 3, 3),
        (3, "A $64 jacket is discounted 25%. What is the sale price?", 3, 3),
        (4, "A recipe uses 5 cups of flour for 12 servings. How many cups are needed for 30 servings?", 3, 3),
        (5, "Identify the two consecutive integers between which the square root of 50 lies. Explain.", 3, 3),
        (6, "Solve and check: 3(2x - 5) = 4x + 7.", 4, 4),
    ]
    for n, prompt, points, lines in math_a:
        q(story, s, n, prompt, points, lines)
    story.append(PageBreak())

    # 6 - Math B
    section(story, s, "Section 2B", "Mathematics - Basic Calculator Allowed", "18 points | About 18 minutes | Show equations, reasoning, and units")
    q(story, s, 7, "A line passes through (1, 4) and (5, 10). Find its slope.", 3, 2)
    story.append(Paragraph("Use the table for Questions 8-9.", s["H2"]))
    story.append(styled_table([["x", "-1", "0", "1", "2"], ["y", "7", "4", "1", "-2"]], [1.2, 1.4, 1.4, 1.4, 1.4]))
    q(story, s, 8, "Is the relationship linear? Write an equation for y in terms of x.", 4, 2)
    q(story, s, 9, "Compare the signed rate of change in the table with g(x) = 2x - 1. Which function increases as x increases, and which decreases?", 3, 2)
    q(story, s, 10, "A right triangle has legs 9 cm and 12 cm. Find the hypotenuse and name the theorem used.", 3, 2)
    q(story, s, 11, "Plan A costs $12 plus $2 per movie. Plan B costs $24 plus $0.50 per movie. Write an equation for each plan and find when the costs are equal.", 3, 3)
    q(story, s, 12, "A student says the only solution to 2(x + 4) = 2x + 8 is x = 0. Is the student correct? Explain.", 2, 2)
    story.append(PageBreak())

    # 7 - Science
    section(story, s, "Section 3", "Science Reasoning", "24 points | 20 minutes | Basic calculator allowed | Use evidence")
    story.append(Paragraph("Investigation 1 - Rolling Cart", s["H2"]))
    story.append(styled_table([
        ["Surface", "Trial 1 distance", "Trial 2 distance", "Trial 3 distance"],
        ["Smooth floor", "2.3 m", "2.5 m", "2.4 m"],
        ["Carpet", "0.8 m", "1.0 m", "0.9 m"],
    ], [1.8, 1.7, 1.7, 1.7]))
    q(story, s, 1, "The same cart was released from the same ramp onto each surface. Which surface produced more friction? Calculate the average distance on each surface, use the data as evidence, and name one other variable that should be controlled.", 8, 4)
    story.append(Paragraph("Investigation 2 - Plant Growth", s["H2"]))
    story.append(styled_table([
        ["Group", "Light/day", "Fertilizer", "Average growth"],
        ["A", "8 hours", "None", "6.2 cm"], ["B", "8 hours", "5 g/week", "9.1 cm"],
        ["C", "4 hours", "5 g/week", "4.8 cm"], ["D", "4 hours", "None", "3.9 cm"],
    ], [0.8, 1.6, 1.7, 2.8]))
    q(story, s, 2, "Use two comparisons from the table to explain how light and fertilizer affected growth. Give one reason this study cannot prove the same result for every plant species.", 8, 4)
    story.append(PageBreak())

    # 8 - Science and learning check
    section(story, s, "Science continued", "Evidence and Design", "Complete Question 3, then the unscored learning check.")
    story.append(styled_table([
        ["Design", "Keeps water below 12 C", "Cost", "Reusable"],
        ["A", "Yes", "$18", "Yes"], ["B", "No", "$10", "Yes"], ["C", "Yes", "$14", "No"],
    ], [1.0, 2.6, 1.5, 1.5]))
    q(story, s, 3, "The required criteria are: keeps water below 12 C, costs no more than $15, and is reusable. Does any design meet all criteria? If not, recommend one specific revision and explain its tradeoff.", 8, 6)
    story.append(Paragraph("Independent Learning Check - not scored", s["H2"]))
    checks = [
        "I can follow a multi-step assignment and identify what to submit.",
        "I can work independently for 30-45 minutes before asking for help.",
        "I can name and attach the correct file.",
        "I can explain which step is confusing when I need help.",
        "I can follow a weekly schedule and report early if I fall behind.",
    ]
    for i, text in enumerate(checks, 1):
        story.append(Paragraph(f"{i}. [ ] Usually &nbsp;&nbsp; [ ] Sometimes &nbsp;&nbsp; [ ] Not yet &nbsp;&nbsp; {text}", s["Body"]))
    story.extend([Paragraph("Which subject felt strongest? Which skill needs the most practice?", s["Question"]), answer_lines(4), PageBreak()])

    # 9 - submission
    section(story, s, "Final page", "Family Verification and Submission", "Please return every completed page, including extra work.")
    story.append(Paragraph("By signing below, we confirm that the student completed the academic sections independently using only the tools listed in the instructions. Any interruption, translation, or assistance is disclosed below.", s["Body"]))
    sign = Table([
        ["Student signature", "", "Date", ""],
        ["Parent/guardian signature", "", "Date", ""],
    ], colWidths=[1.55 * inch, 2.55 * inch, 0.65 * inch, 1.65 * inch], rowHeights=[0.44 * inch] * 2)
    sign.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.5, LINE), ("BACKGROUND", (0, 0), (0, -1), PALE),
        ("BACKGROUND", (2, 0), (2, -1), PALE), ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 8.5), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    story.extend([
        sign, Spacer(1, 0.18 * inch),
        Paragraph("Interruptions or assistance to disclose:", s["Question"]), answer_lines(4),
        Spacer(1, 0.22 * inch), Paragraph("Return checklist", s["H2"]),
        Paragraph("[ ] All booklet pages &nbsp;&nbsp; [ ] Extra work pages &nbsp;&nbsp; [ ] Two recent independent work samples &nbsp;&nbsp; [ ] Khan Academy/IXL evidence, if available", s["Body"]),
        Paragraph("Email to <b>admissions@genesisideas.school</b><br/>Suggested subject: <b>Grade 9 Readiness Assessment - [Student Full Name]</b>", s["Callout"]),
        Paragraph("GIIS reviews the work by skill area and may request a short oral walkthrough. The Principal then provides a written placement decision: Ready for a conditional Grade 9 start, Ready with a named bridge plan, or Not Yet with a preparation recommendation. If required records or circumstances are unclear, the case remains Pending Clarification rather than receiving an academic result.", s["Small"]),
    ])

    doc.build(story)
    print(OUTPUT)


if __name__ == "__main__":
    build_pdf()
