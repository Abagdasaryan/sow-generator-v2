import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  PageBreak,
  Header,
  Footer,
  PageNumber,
  WidthType,
  ShadingType,
  TableLayoutType,
  LevelFormat,
} from "docx";
import type { ParsedSow } from "./types";

const FONT = "Times New Roman";
const HEADING_FONT = "Arial";
const PRIMARY_COLOR = "1a365d";
const ACCENT_COLOR = "2c5282";
const HEADER_BG = "1a365d";
const EVEN_ROW_BG = "f7fafc";

function formatCurrency(amount: number, currency: string): string {
  return `${currency} ${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function textRun(text: string, opts?: { bold?: boolean; size?: number; font?: string; color?: string; italics?: boolean; break?: number }): TextRun {
  return new TextRun({
    text,
    bold: opts?.bold,
    size: (opts?.size ?? 22),
    font: opts?.font ?? FONT,
    color: opts?.color,
    italics: opts?.italics,
    break: opts?.break,
  });
}

function bodyParagraph(text: string, opts?: { spacing?: { after?: number }; break_before?: boolean }): Paragraph {
  const children: (TextRun | PageBreak)[] = [];
  if (opts?.break_before) {
    children.push(new PageBreak());
  }
  children.push(textRun(text, { size: 22 }));
  return new Paragraph({
    children,
    spacing: { after: opts?.spacing?.after ?? 200, line: 360 },
    alignment: AlignmentType.JUSTIFIED,
  });
}

function sectionHeading(number: string, title: string, level: typeof HeadingLevel[keyof typeof HeadingLevel] = HeadingLevel.HEADING_1): Paragraph {
  return new Paragraph({
    children: [
      textRun(`${number} `, { bold: true, size: 36, font: HEADING_FONT, color: ACCENT_COLOR }),
      textRun(title, { bold: true, size: 36, font: HEADING_FONT, color: PRIMARY_COLOR }),
    ],
    heading: level,
    spacing: { before: 400, after: 200 },
  });
}

function subHeading(title: string): Paragraph {
  return new Paragraph({
    children: [
      textRun(title, { bold: true, size: 28, font: HEADING_FONT, color: PRIMARY_COLOR }),
    ],
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 150 },
  });
}

function bulletItem(text: string): Paragraph {
  return new Paragraph({
    children: [textRun(text, { size: 22 })],
    bullet: { level: 0 },
    spacing: { after: 100, line: 360 },
  });
}

function numberedItem(text: string, _level: number = 0): Paragraph {
  return new Paragraph({
    children: [textRun(text, { size: 22 })],
    numbering: { reference: "ordered-list", level: _level },
    spacing: { after: 100, line: 360 },
  });
}

const tableBorders = {
  top: { style: BorderStyle.SINGLE, size: 1, color: "cbd5e0" },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: "cbd5e0" },
  left: { style: BorderStyle.SINGLE, size: 1, color: "cbd5e0" },
  right: { style: BorderStyle.SINGLE, size: 1, color: "cbd5e0" },
};

function headerCell(text: string, width?: number): TableCell {
  return new TableCell({
    children: [
      new Paragraph({
        children: [textRun(text, { bold: true, size: 18, font: HEADING_FONT, color: "ffffff" })],
        spacing: { after: 0 },
      }),
    ],
    shading: { fill: HEADER_BG, type: ShadingType.CLEAR, color: "auto" },
    borders: tableBorders,
    width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
  });
}

function dataCell(text: string, opts?: { bold?: boolean; shading?: string; alignment?: typeof AlignmentType[keyof typeof AlignmentType] }): TableCell {
  return new TableCell({
    children: [
      new Paragraph({
        children: [textRun(text, { bold: opts?.bold, size: 20 })],
        spacing: { after: 0 },
        alignment: opts?.alignment,
      }),
    ],
    shading: opts?.shading ? { fill: opts.shading, type: ShadingType.CLEAR, color: "auto" } : undefined,
    borders: tableBorders,
  });
}

function createTable(headers: string[], rows: string[][], colWidths?: number[]): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: [
      new TableRow({
        children: headers.map((h, i) => headerCell(h, colWidths?.[i])),
        tableHeader: true,
      }),
      ...rows.map(
        (row, rowIdx) =>
          new TableRow({
            children: row.map((cell) =>
              dataCell(cell, {
                shading: rowIdx % 2 === 1 ? EVEN_ROW_BG : undefined,
              })
            ),
          })
      ),
    ],
  });
}

function textParagraphs(text: string): Paragraph[] {
  if (!text) return [bodyParagraph("")];
  return text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .map((p) => bodyParagraph(p));
}

export async function generateDocx(sow: ParsedSow): Promise<Buffer> {
  const ci = sow.clientInfo;
  const id = sow.integrationDetails;
  const sd = sow.scopeDeliverables;
  const pt = sow.pricingTerms;
  const gc = sow.generatedContent ?? {
    executive_summary: "",
    scope_narratives: {},
    architecture_description: "",
    deliverables_prose: "",
  };
  const totalWeeks = sd.phases.reduce((sum, p) => sum + p.duration_weeks, 0);

  const sections: (Paragraph | Table)[] = [];

  // --- COVER PAGE ---
  sections.push(
    new Paragraph({ spacing: { before: 4000 } }),
    new Paragraph({
      children: [textRun("STATEMENT OF WORK", { bold: true, size: 28, font: HEADING_FONT, color: ACCENT_COLOR })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
    new Paragraph({
      children: [textRun(ci.project_name, { bold: true, size: 56, font: HEADING_FONT, color: PRIMARY_COLOR })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [textRun(ci.project_code, { size: 24, color: "4a5568" })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 800 },
    }),
    new Paragraph({
      children: [textRun("Prepared For", { bold: true, size: 20, font: HEADING_FONT, color: "718096" })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [textRun(ci.company_name, { size: 28, color: PRIMARY_COLOR })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 50 },
    }),
    new Paragraph({
      children: [textRun(`${ci.contact_name}, ${ci.contact_title}`, { size: 22, color: "4a5568" })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
    }),
    new Paragraph({
      children: [textRun("Prepared By", { bold: true, size: 20, font: HEADING_FONT, color: "718096" })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [textRun(ci.prepared_by, { size: 28, color: PRIMARY_COLOR })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
    }),
    new Paragraph({
      children: [textRun(formatDate(ci.prepared_date), { size: 22, color: "4a5568" })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
    new Paragraph({
      children: [textRun("CONFIDENTIAL \u2014 For Authorized Use Only", { size: 18, font: HEADING_FONT, color: "a0aec0" })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({ children: [new PageBreak()] })
  );

  // --- SECTION 1: DOCUMENT CONTROL ---
  sections.push(
    sectionHeading("1.", "Document Control"),
    createTable(
      ["Attribute", "Details"],
      [
        ["Document Title", sow.title],
        ["Project Code", ci.project_code],
        ["Version", `${sow.currentVersion}.0`],
        ["Status", sow.status.charAt(0).toUpperCase() + sow.status.slice(1)],
        ["Prepared By", ci.prepared_by],
        ["Prepared Date", formatDate(ci.prepared_date)],
        ["Client Contact", `${ci.contact_name} (${ci.contact_email})`],
      ]
    ),
    subHeading("Version History"),
    createTable(
      ["Version", "Date", "Author", "Description"],
      [
        [`${sow.currentVersion}.0`, formatDate(new Date(sow._creationTime).toISOString()), ci.prepared_by, "Current version"],
      ]
    ),
    new Paragraph({ children: [new PageBreak()] })
  );

  // --- SECTION 2: EXECUTIVE SUMMARY ---
  sections.push(sectionHeading("2.", "Executive Summary"));
  if (gc.executive_summary) {
    sections.push(...textParagraphs(gc.executive_summary));
  } else {
    sections.push(bodyParagraph("Content pending generation."));
  }
  sections.push(new Paragraph({ children: [new PageBreak()] }));

  // --- SECTION 3: PROJECT OVERVIEW & OBJECTIVES ---
  sections.push(
    sectionHeading("3.", "Project Overview & Objectives"),
    bodyParagraph(
      `${ci.company_name} has engaged consulting services to design, develop, and implement an integration solution using the ${id.platform} platform (version ${id.platform_version}). The project encompasses ${id.integrations.length} integration process${id.integrations.length !== 1 ? "es" : ""} connecting ${id.source_systems.length} source system${id.source_systems.length !== 1 ? "s" : ""} with ${id.target_systems.length} target system${id.target_systems.length !== 1 ? "s" : ""}.`
    ),
    subHeading("Project Objectives"),
    bulletItem(`Establish reliable, automated data synchronization between ${id.source_systems.map((s) => s.name).join(", ")} and ${id.target_systems.map((s) => s.name).join(", ")}`),
    bulletItem(`Implement ${id.integrations.length} integration process${id.integrations.length !== 1 ? "es" : ""} on the ${id.platform} platform`),
    bulletItem(`Deliver the complete solution within ${totalWeeks} weeks (${formatDate(ci.start_date)} through ${formatDate(ci.end_date)})`),
    bulletItem("Provide comprehensive documentation and knowledge transfer to enable ongoing operations"),
    bulletItem("Establish error handling, monitoring, and alerting to ensure operational reliability"),
    subHeading("Systems Involved"),
    createTable(
      ["System", "Type", "Version", "Environment", "Role"],
      [
        ...id.source_systems.map((s) => [s.name, s.type, s.version, s.environment, "Source"]),
        ...id.target_systems.map((s) => [s.name, s.type, s.version, s.environment, "Target"]),
      ]
    ),
    subHeading("Integration Processes"),
    createTable(
      ["Process", "Source", "Target", "Direction", "Frequency", "Trigger"],
      id.integrations.map((i) => [
        i.name,
        i.source,
        i.target,
        i.direction.replace("_", " "),
        i.frequency.replace("_", " "),
        i.trigger_type,
      ])
    ),
    new Paragraph({ children: [new PageBreak()] })
  );

  // --- SECTION 4: SCOPE OF WORK ---
  sections.push(sectionHeading("4.", "Scope of Work"));
  if (gc.scope_narratives && Object.keys(gc.scope_narratives).length > 0) {
    for (const [name, narrative] of Object.entries(gc.scope_narratives)) {
      sections.push(subHeading(name), ...textParagraphs(narrative));
    }
  } else {
    for (const i of id.integrations) {
      sections.push(
        subHeading(i.name),
        bodyParagraph(i.description),
        bodyParagraph(`Data Objects: ${i.data_objects.join(", ")}`),
        bodyParagraph(`Estimated Volume: ${i.estimated_records}`)
      );
    }
  }
  sections.push(new Paragraph({ children: [new PageBreak()] }));

  // --- SECTION 5: INTEGRATION ARCHITECTURE ---
  sections.push(sectionHeading("5.", "Integration Architecture"));
  if (gc.architecture_description) {
    sections.push(...textParagraphs(gc.architecture_description));
  } else {
    sections.push(bodyParagraph("Content pending generation."));
  }
  sections.push(new Paragraph({ children: [new PageBreak()] }));

  // --- SECTION 6: DELIVERABLES ---
  sections.push(sectionHeading("6.", "Deliverables"));
  if (gc.deliverables_prose) {
    sections.push(...textParagraphs(gc.deliverables_prose));
  }
  sections.push(subHeading("Deliverables by Phase"));
  for (const p of sd.phases) {
    sections.push(
      new Paragraph({
        children: [textRun(p.name, { bold: true, size: 24, font: HEADING_FONT, color: "4a5568" })],
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 200, after: 100 },
      }),
      bodyParagraph(p.description),
      ...p.deliverables.map((d) => bulletItem(d))
    );
  }
  sections.push(new Paragraph({ children: [new PageBreak()] }));

  // --- SECTION 7: PROJECT PHASES & TIMELINE ---
  sections.push(
    sectionHeading("7.", "Project Phases & Timeline"),
    createTable(
      ["Phase", "Description", "Duration (Weeks)", "Deliverables"],
      [
        ...sd.phases.map((p) => [
          p.name,
          p.description,
          String(p.duration_weeks),
          p.deliverables.join("; "),
        ]),
        ["Total Duration", "", String(totalWeeks), ""],
      ]
    ),
    subHeading("Key Milestones"),
    createTable(
      ["Milestone", "Target Date", "Payment Trigger"],
      sd.milestones.map((m) => [m.name, formatDate(m.date), m.payment_trigger ? "Yes" : "No"])
    ),
    new Paragraph({ children: [new PageBreak()] })
  );

  // --- SECTION 8: ASSUMPTIONS ---
  sections.push(
    sectionHeading("8.", "Assumptions"),
    bodyParagraph("This Statement of Work is based on the following assumptions. Should any of these assumptions prove incorrect, a change order may be required to adjust scope, timeline, or pricing."),
    ...sd.assumptions.map((a) => bulletItem(a))
  );

  // --- SECTION 9: EXCLUSIONS ---
  sections.push(
    sectionHeading("9.", "Exclusions"),
    bodyParagraph("The following items are explicitly excluded from the scope of this engagement. Any work related to these items would require a separate Statement of Work or change order."),
    ...sd.exclusions.map((e) => bulletItem(e))
  );

  // --- SECTION 10: ROLES & RESPONSIBILITIES ---
  sections.push(
    new Paragraph({ children: [new PageBreak()] }),
    sectionHeading("10.", "Roles & Responsibilities"),
    subHeading("Consultant Responsibilities"),
    createTable(
      ["Role", "Responsibility"],
      sd.roles.filter((r) => r.party === "consultant").map((r) => [r.role, r.responsibility])
    ),
    subHeading("Client Responsibilities"),
    createTable(
      ["Role", "Responsibility"],
      sd.roles.filter((r) => r.party === "client").map((r) => [r.role, r.responsibility])
    )
  );

  // --- SECTION 11: ACCEPTANCE CRITERIA ---
  sections.push(
    sectionHeading("11.", "Acceptance Criteria"),
    bodyParagraph("Each deliverable shall be reviewed and accepted based on the following criteria. The Client shall have five (5) business days from delivery to review and provide written acceptance or rejection with specific deficiencies noted."),
    ...sd.acceptance_criteria.map((a) => bulletItem(a))
  );

  // --- SECTION 12: PRICING & FEES ---
  sections.push(
    new Paragraph({ children: [new PageBreak()] }),
    sectionHeading("12.", "Pricing & Fees"),
    bodyParagraph(`Billing Type: ${pt.billing_type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}`),
    bodyParagraph(`Total Project Investment: ${formatCurrency(pt.total_amount, pt.currency)}`),
    subHeading("Rate Schedule"),
    createTable(
      ["Role", `Rate (${pt.currency})`, "Unit"],
      pt.rates.map((r) => [r.role, formatCurrency(r.rate, pt.currency), r.unit])
    ),
    subHeading("Phase Pricing"),
    createTable(
      ["Phase", "Hours", `Amount (${pt.currency})`],
      [
        ...pt.phases_pricing.map((p) => [p.phase, String(p.hours), formatCurrency(p.amount, pt.currency)]),
        ["Total", String(pt.phases_pricing.reduce((s, p) => s + p.hours, 0)), formatCurrency(pt.total_amount, pt.currency)],
      ]
    ),
    bodyParagraph(
      pt.travel_expenses_included
        ? `Travel & Expenses: Included, capped at ${formatCurrency(pt.travel_cap, pt.currency)}.`
        : "Travel & Expenses: Not included in the project pricing. Travel will be billed separately if required."
    ),
    bodyParagraph(`Change Order Rate: ${formatCurrency(pt.change_order_rate, pt.currency)} per hour for work outside the defined scope.`)
  );

  // --- SECTION 13: PAYMENT SCHEDULE ---
  sections.push(
    sectionHeading("13.", "Payment Schedule"),
    bodyParagraph(`Payments are due within ${pt.payment_terms_days} days of invoice date. Invoices will be issued upon achievement of the following milestones:`),
    createTable(
      ["Milestone", "Percentage", `Amount (${pt.currency})`, "Due Date"],
      [
        ...pt.payment_schedule.map((p) => [p.milestone, `${p.percentage}%`, formatCurrency(p.amount, pt.currency), formatDate(p.due)]),
        ["Total", `${pt.payment_schedule.reduce((s, p) => s + p.percentage, 0)}%`, formatCurrency(pt.total_amount, pt.currency), ""],
      ]
    )
  );

  // --- SECTION 14: CHANGE MANAGEMENT ---
  sections.push(
    new Paragraph({ children: [new PageBreak()] }),
    sectionHeading("14.", "Change Management"),
    bodyParagraph("Changes to the scope, schedule, or cost of this project must be managed through a formal change order process. Either party may initiate a change request at any time during the engagement."),
    subHeading("Change Order Process"),
    numberedItem("Request Submission: The requesting party shall submit a written Change Request describing the proposed change, its rationale, and the expected impact on scope, schedule, and cost."),
    numberedItem("Impact Assessment: The Consultant shall assess the change request and provide a written impact analysis within five (5) business days, including revised estimates for effort, timeline, and cost."),
    numberedItem("Approval: Both parties must provide written approval of the Change Order before any work begins. The Change Order shall reference this SOW and become an amendment to it."),
    numberedItem("Implementation: Upon approval, the Consultant shall incorporate the change into the project plan and proceed with implementation."),
    bodyParagraph(`Work performed under change orders shall be billed at the change order rate of ${formatCurrency(pt.change_order_rate, pt.currency)} per hour unless otherwise specified in the approved Change Order.`)
  );

  // --- SECTION 15: TERMS & CONDITIONS ---
  sections.push(sectionHeading("15.", "Terms & Conditions"));
  if (pt.terms_and_conditions) {
    sections.push(...textParagraphs(pt.terms_and_conditions));
  } else {
    sections.push(
      subHeading("Confidentiality"),
      bodyParagraph("Both parties agree to maintain the confidentiality of all proprietary information disclosed during the course of this engagement. Confidential information shall not be disclosed to third parties without prior written consent."),
      subHeading("Intellectual Property"),
      bodyParagraph("All deliverables produced under this Statement of Work shall become the property of the Client upon full payment. The Consultant retains the right to reuse general methodologies, frameworks, and tools that are not specific to the Client's proprietary business processes."),
      subHeading("Limitation of Liability"),
      bodyParagraph("The Consultant's total aggregate liability under this Statement of Work shall not exceed the total fees paid by the Client. Neither party shall be liable for indirect, incidental, consequential, special, or exemplary damages."),
      subHeading("Termination"),
      bodyParagraph("Either party may terminate this engagement with thirty (30) days' written notice. In the event of termination, the Client shall pay for all work completed through the effective date of termination."),
      subHeading("Warranty"),
      bodyParagraph("The Consultant warrants that all services shall be performed in a professional and workmanlike manner consistent with industry standards. A thirty (30) day warranty period shall apply to all deliverables from the date of acceptance, during which the Consultant shall correct any defects at no additional cost.")
    );
  }

  // --- SECTION 16: APPENDICES ---
  sections.push(
    new Paragraph({ children: [new PageBreak()] }),
    sectionHeading("16.", "Appendices"),
    subHeading("Appendix A: Glossary of Terms"),
    createTable(
      ["Term", "Definition"],
      [
        ["SOW", "Statement of Work - this document"],
        [id.platform, "The integration platform used to build and manage the integration processes"],
        ...id.source_systems.map((s) => [s.name, `${s.type} system (version ${s.version}) serving as a source system`]),
        ...id.target_systems.map((s) => [s.name, `${s.type} system (version ${s.version}) serving as a target system`]),
        ["Change Order", "A formal document modifying the scope, timeline, or cost of this SOW"],
        ["UAT", "User Acceptance Testing"],
      ]
    ),
    subHeading("Appendix B: Contact Information"),
    createTable(
      ["Role", "Name", "Email", "Phone"],
      [
        ["Client Contact", ci.contact_name, ci.contact_email, ci.contact_phone],
        ["Consultant Lead", ci.prepared_by, "", ""],
      ]
    ),
    subHeading("Appendix C: Integration Data Objects")
  );

  for (const i of id.integrations) {
    sections.push(
      new Paragraph({
        children: [textRun(i.name, { bold: true, size: 24, font: HEADING_FONT, color: "4a5568" })],
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 200, after: 100 },
      }),
      createTable(
        ["Data Object", "Estimated Records"],
        i.data_objects.map((d) => [d, i.estimated_records])
      )
    );
  }

  // --- SIGNATURE BLOCK ---
  sections.push(
    new Paragraph({ children: [new PageBreak()] }),
    sectionHeading("", "Signatures"),
    bodyParagraph("By signing below, both parties agree to the terms and conditions set forth in this Statement of Work."),
    new Paragraph({ spacing: { before: 600 } }),
    new Paragraph({
      children: [textRun(`For ${ci.company_name}`, { bold: true, size: 24, font: HEADING_FONT })],
      spacing: { after: 600 },
    }),
    new Paragraph({
      children: [textRun("________________________________________", { size: 22 })],
      spacing: { after: 100 },
    }),
    bodyParagraph(`Name: ${ci.contact_name}`),
    bodyParagraph(`Title: ${ci.contact_title}`),
    bodyParagraph("Date: ____________________"),
    new Paragraph({ spacing: { before: 600 } }),
    new Paragraph({
      children: [textRun("For Consultant", { bold: true, size: 24, font: HEADING_FONT })],
      spacing: { after: 600 },
    }),
    new Paragraph({
      children: [textRun("________________________________________", { size: 22 })],
      spacing: { after: 100 },
    }),
    bodyParagraph(`Name: ${ci.prepared_by}`),
    bodyParagraph("Title: ____________________"),
    bodyParagraph("Date: ____________________")
  );

  const doc = new Document({
    numbering: {
      config: [
        {
          reference: "ordered-list",
          levels: [
            {
              level: 0,
              format: LevelFormat.DECIMAL,
              text: "%1.",
              alignment: AlignmentType.START,
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: {
              width: 12240,
              height: 15840,
            },
            margin: {
              top: 1440,
              bottom: 1440,
              left: 1152,
              right: 1152,
            },
            pageNumbers: { start: 1 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  textRun(ci.project_name, { size: 16, font: HEADING_FONT, color: "a0aec0" }),
                  textRun("  |  ", { size: 16, color: "cbd5e0" }),
                  textRun(ci.project_code, { size: 16, font: HEADING_FONT, color: "a0aec0" }),
                ],
                alignment: AlignmentType.RIGHT,
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  textRun("Confidential", { size: 16, font: HEADING_FONT, color: "a0aec0" }),
                  textRun("  |  Page ", { size: 16, color: "a0aec0" }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 16,
                    font: HEADING_FONT,
                    color: "a0aec0",
                  }),
                  textRun(" of ", { size: 16, color: "a0aec0" }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: 16,
                    font: HEADING_FONT,
                    color: "a0aec0",
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        },
        children: sections,
      },
    ],
  });

  return await Packer.toBuffer(doc) as unknown as Buffer;
}
