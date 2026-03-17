import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
} from "docx";
import type { ParsedSow } from "./types";

/**
 * Generates a DOCX buffer from a parsed SOW object.
 */
export async function generateDocx(sow: ParsedSow): Promise<Buffer> {
  const { clientInfo, integrationDetails, scopeDeliverables, pricingTerms, generatedContent } = sow;

  const children: Paragraph[] = [];

  // Title
  children.push(
    new Paragraph({
      text: sow.title,
      heading: HeadingLevel.TITLE,
      spacing: { after: 200 },
    })
  );

  // Meta info
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: `Prepared for: ${clientInfo.company_name}`, size: 20, color: "666666" }),
      ],
      spacing: { after: 100 },
    })
  );
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Project: ${clientInfo.project_name} (${clientInfo.project_code}) | ${clientInfo.start_date} – ${clientInfo.end_date}`,
          size: 20,
          color: "666666",
        }),
      ],
      spacing: { after: 300 },
    })
  );

  // Executive Summary
  children.push(
    new Paragraph({ text: "1. Executive Summary", heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 } })
  );
  if (generatedContent.executive_summary) {
    for (const para of generatedContent.executive_summary.split("\n\n")) {
      children.push(new Paragraph({ text: para.trim(), spacing: { after: 150 } }));
    }
  }

  // Architecture
  children.push(
    new Paragraph({ text: "2. Integration Architecture", heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 } })
  );
  if (generatedContent.architecture_description) {
    for (const para of generatedContent.architecture_description.split("\n\n")) {
      children.push(new Paragraph({ text: para.trim(), spacing: { after: 150 } }));
    }
  }

  // Scope Narratives
  children.push(
    new Paragraph({ text: "3. Scope Narratives", heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 } })
  );
  for (const [name, text] of Object.entries(generatedContent.scope_narratives || {})) {
    children.push(
      new Paragraph({ text: name, heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } })
    );
    children.push(new Paragraph({ text: text as string, spacing: { after: 150 } }));
  }

  // Deliverables
  children.push(
    new Paragraph({ text: "4. Deliverables", heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 } })
  );
  if (generatedContent.deliverables_prose) {
    for (const para of generatedContent.deliverables_prose.split("\n\n")) {
      children.push(new Paragraph({ text: para.trim(), spacing: { after: 150 } }));
    }
  }

  // Phases table
  if (scopeDeliverables.phases.length > 0) {
    const cellBorders = {
      top: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" },
    } as const;

    const headerRow = new TableRow({
      children: ["Phase", "Description", "Duration", "Deliverables"].map(
        (text) =>
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 20 })] })],
            borders: cellBorders,
            shading: { fill: "edf2f7" },
          })
      ),
    });

    const dataRows = scopeDeliverables.phases.map(
      (p) =>
        new TableRow({
          children: [
            p.name,
            p.description,
            `${p.duration_weeks} weeks`,
            p.deliverables.join("; "),
          ].map(
            (text) =>
              new TableCell({
                children: [new Paragraph({ text, spacing: { after: 50 } })],
                borders: cellBorders,
              })
          ),
        })
    );

    children.push(
      new Paragraph({ text: "" }) // spacer
    );

    const table = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [headerRow, ...dataRows],
    });

    // Tables need to be added to the document section directly
    // We'll handle this by building the doc with mixed content below
  }

  // Milestones
  children.push(
    new Paragraph({ text: "5. Milestones", heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 } })
  );
  for (const m of scopeDeliverables.milestones) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: `${m.name}`, bold: true }),
          new TextRun({ text: ` — ${m.date}${m.payment_trigger ? " (Payment Trigger)" : ""}` }),
        ],
        spacing: { after: 100 },
      })
    );
  }

  // Pricing
  children.push(
    new Paragraph({ text: "6. Pricing", heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 } })
  );
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: "Billing Type: ", bold: true }),
        new TextRun({ text: pricingTerms.billing_type.replace(/_/g, " ") }),
      ],
      spacing: { after: 100 },
    })
  );
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: "Total Amount: ", bold: true }),
        new TextRun({ text: `${pricingTerms.currency} ${pricingTerms.total_amount.toLocaleString()}` }),
      ],
      spacing: { after: 100 },
    })
  );
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: "Payment Terms: ", bold: true }),
        new TextRun({ text: `Net ${pricingTerms.payment_terms_days} days` }),
      ],
      spacing: { after: 100 },
    })
  );

  // Assumptions & Exclusions
  if (scopeDeliverables.assumptions.length > 0) {
    children.push(
      new Paragraph({ text: "7. Assumptions", heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 } })
    );
    for (const a of scopeDeliverables.assumptions) {
      children.push(
        new Paragraph({
          text: a,
          bullet: { level: 0 },
          spacing: { after: 50 },
        })
      );
    }
  }

  if (scopeDeliverables.exclusions.length > 0) {
    children.push(
      new Paragraph({ text: "8. Exclusions", heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 } })
    );
    for (const e of scopeDeliverables.exclusions) {
      children.push(
        new Paragraph({
          text: e,
          bullet: { level: 0 },
          spacing: { after: 50 },
        })
      );
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return Buffer.from(buffer);
}
