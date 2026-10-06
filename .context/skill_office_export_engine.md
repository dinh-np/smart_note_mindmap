# SKILL: MULTI-FORMAT OFFICE & MEDIA EXPORT ENGINE

## 1. Microsoft PowerPoint (.pptx) — `pptxgenjs`
- **Theme Palette:** Corporate Light (Primary: `#0066AB`, Background: `#ffffff`, Text: `#0f172a`)[cite: 9, 11].
- **Typography:** Titles in `'Georgia'`, body text in `'Noto Sans'` (Fallbacks: `Calibri, Arial`)[cite: 1, 9].
- **Slide Deck Structure:**
  - **Slide 1 (Cover Card):** Centered title (`rootData.topic`), `#0066AB` accent block, subtitle with author and export timestamp[cite: 9, 11].
  - **Slides 2+ (Level 1 Decks):** Each Level 1 branch forms an individual slide:
    - Slide Title: Level 1 node topic[cite: 9, 11].
    - Slide Body: Hierarchical nested bullet points for Level 2 and Level 3 nodes (`indent` levels applied)[cite: 9, 11].
    - Speaker Notes: Populated from `node.presentation.speakerNotes` or `node.description`[cite: 9, 11].

## 2. Microsoft Word (.docx) — `docx`
- **Heading Hierarchy:**
  - `rootData.topic` -> Title Heading (Georgia, 26pt, Bold, `#0066AB`)[cite: 1, 9].
  - Level 1 Branches -> Heading 1 (Noto Sans, 18pt, Bold, `#004B7D`, page break before)[cite: 1, 9].
  - Level 2 Branches -> Heading 2 (Noto Sans, 14pt, Semi-Bold, `#0f172a`)[cite: 1, 9].
  - Level 3+ Branches -> Nested bullet points with formatted metadata badges (Status, Assignee, Due Date)[cite: 1, 9].
- **Table Insertion:** Automatically appends a WBS summary table and RACI matrix at the end of the document[cite: 9].

## 3. Microsoft Excel (.xlsx - WBS, Schedule & RACI) — `exceljs`
- **Sheet 1: "Work Breakdown Structure (WBS)"**[cite: 9, 11]
  - Columns: `WBS Code` (`1`, `1.1`, `1.1.1`), `Task Name`, `Assignee`, `Start Date`, `End Date`, `Duration (Days)`, `Progress (%)`, `Priority`, `Status`[cite: 9, 11].
  - Styling: Header row filled with `#0066AB` (white text), progress column formatted with native Excel In-Cell Data Bars[cite: 9, 11].
- **Sheet 2: "RACI Responsibility Matrix"**[cite: 9]
  - 2D Grid: Tasks (Rows) against Stakeholders/Team members (Columns)[cite: 9].
  - Cells populated with color-coded badges: `[R]` Responsible, `[A]` Accountable, `[C]` Consulted, `[I]` Informed[cite: 9].
- **Sheet 3: "Risk Management Heatmap"**[cite: 9]
  - Itemized register: Risk description, Probability (1-5), Impact (1-5), Risk Score ($P \times I$), and Mitigation Strategy[cite: 9].

## 4. Microsoft Project (.xml - MSPDI Format) — `fast-xml-parser`
- Generates Microsoft Project Data Interchange (MSPDI) compliant XML for import into MS Project 2013-2026 Desktop[cite: 1, 11].
- Each node maps to a `<Task>` element:
  - `<UID>`: Sequential integer identifier[cite: 1, 9].
  - `<ID>`: Sequential display order[cite: 1, 9].
  - `<Name>`: `node.topic`[cite: 1, 9].
  - `<OutlineLevel>`: Tree depth ($1, 2, 3 \dots$)[cite: 1, 9].
  - `<OutlineNumber>`: Canonical WBS number (`1.1.2`)[cite: 1, 9].
  - `<Start>`, `<Finish>`, `<Duration>`: Calculated from task attributes (duration formatted as `PT#H#M#S`)[cite: 1, 9].
  - `<PredecessorLink>`: Retains node dependencies to automate Critical Path calculations[cite: 9].

## 5. High-Resolution PDF & PNG Exporter — `html-to-image` + `jspdf`
- **Memory Clamping (RAM Safeguard):**
  - Limit capture resolution to a maximum dimension of 4096px to prevent iOS Safari and low-spec Android devices from running Out-Of-Memory (OOM crash)[cite: 1, 9].
- **PDF Layout:**
  - Auto-calculated A4 Landscape orientation (`[297, 210] mm`), centered, with 10mm padding[cite: 9, 11].
  