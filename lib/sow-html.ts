import type {
  ParsedSow,
} from "./types";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

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

function paragraphsToHtml(text: string): string {
  if (!text) return "<p></p>";
  return text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .map((p) => `<p>${escapeHtml(p)}</p>`)
    .join("\n");
}

export function renderSowHtml(sow: ParsedSow): string {
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

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(sow.title)}</title>
<style>
  @page {
    size: A4;
    margin: 2.5cm 2cm;
    @bottom-center {
      content: "Page " counter(page) " of " counter(pages);
      font-size: 9pt;
      color: #666;
    }
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: "Georgia", "Times New Roman", Times, serif;
    font-size: 11pt;
    line-height: 1.6;
    color: #1a1a1a;
    background: #fff;
  }

  .page-break { page-break-before: always; }

  /* Cover Page */
  .cover-page {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    min-height: 90vh;
    text-align: center;
    page-break-after: always;
  }
  .cover-page .document-type {
    font-size: 14pt;
    text-transform: uppercase;
    letter-spacing: 4px;
    color: #2c5282;
    margin-bottom: 2rem;
    font-family: "Helvetica Neue", Arial, sans-serif;
  }
  .cover-page h1 {
    font-size: 28pt;
    color: #1a365d;
    margin-bottom: 0.5rem;
    line-height: 1.2;
  }
  .cover-page .project-code {
    font-size: 12pt;
    color: #4a5568;
    margin-bottom: 3rem;
  }
  .cover-page .cover-divider {
    width: 80px;
    height: 3px;
    background: #2c5282;
    margin: 0 auto 3rem;
  }
  .cover-page .parties {
    display: flex;
    justify-content: center;
    gap: 4rem;
    margin-bottom: 3rem;
    font-size: 11pt;
  }
  .cover-page .party h3 {
    font-size: 10pt;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: #718096;
    margin-bottom: 0.5rem;
    font-family: "Helvetica Neue", Arial, sans-serif;
  }
  .cover-page .party p {
    color: #2d3748;
    font-size: 12pt;
  }
  .cover-page .cover-date {
    font-size: 11pt;
    color: #4a5568;
    margin-bottom: 2rem;
  }
  .cover-page .confidential {
    font-size: 9pt;
    color: #a0aec0;
    text-transform: uppercase;
    letter-spacing: 2px;
    border: 1px solid #e2e8f0;
    padding: 8px 24px;
    font-family: "Helvetica Neue", Arial, sans-serif;
  }

  /* Section headings */
  h2 {
    font-size: 18pt;
    color: #1a365d;
    border-bottom: 2px solid #2c5282;
    padding-bottom: 6px;
    margin: 2rem 0 1rem;
    font-family: "Helvetica Neue", Arial, sans-serif;
    font-weight: 600;
  }
  h3 {
    font-size: 14pt;
    color: #2d3748;
    margin: 1.5rem 0 0.75rem;
    font-family: "Helvetica Neue", Arial, sans-serif;
    font-weight: 600;
  }
  h4 {
    font-size: 12pt;
    color: #4a5568;
    margin: 1rem 0 0.5rem;
    font-family: "Helvetica Neue", Arial, sans-serif;
    font-weight: 600;
  }

  p { margin-bottom: 0.75rem; text-align: justify; }

  /* Tables */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 1rem 0 1.5rem;
    font-size: 10pt;
  }
  th, td {
    border: 1px solid #cbd5e0;
    padding: 8px 12px;
    text-align: left;
    vertical-align: top;
  }
  th {
    background: #1a365d;
    color: #fff;
    font-family: "Helvetica Neue", Arial, sans-serif;
    font-weight: 600;
    font-size: 9.5pt;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  tr:nth-child(even) { background: #f7fafc; }
  tr:hover { background: #edf2f7; }
  .total-row {
    font-weight: bold;
    background: #ebf4ff !important;
    border-top: 2px solid #2c5282;
  }
  td.amount, th.amount { text-align: right; }

  /* Lists */
  ul, ol {
    margin: 0.5rem 0 1rem 1.5rem;
  }
  li {
    margin-bottom: 0.4rem;
  }

  /* Section numbering */
  .section-number {
    color: #2c5282;
    font-weight: 700;
    margin-right: 0.5rem;
  }

  .section { margin-bottom: 1.5rem; }

  /* Footer for print */
  @media print {
    body { font-size: 10pt; }
    .cover-page { min-height: 100vh; }
    .no-print { display: none; }
  }
</style>
</head>
<body>

<!-- SECTION 1: COVER PAGE -->
<div class="cover-page">
  <div class="document-type">Statement of Work</div>
  <h1>${escapeHtml(ci.project_name)}</h1>
  <p class="project-code">${escapeHtml(ci.project_code)}</p>
  <div class="cover-divider"></div>
  <div class="parties">
    <div class="party">
      <h3>Prepared For</h3>
      <p>${escapeHtml(ci.company_name)}</p>
      <p>${escapeHtml(ci.contact_name)}</p>
      <p>${escapeHtml(ci.contact_title)}</p>
    </div>
    <div class="party">
      <h3>Prepared By</h3>
      <p>${escapeHtml(ci.prepared_by)}</p>
    </div>
  </div>
  <p class="cover-date">${formatDate(ci.prepared_date)}</p>
  <div class="confidential">Confidential &mdash; For Authorized Use Only</div>
</div>

<!-- SECTION 2: DOCUMENT CONTROL -->
<div class="section page-break">
  <h2><span class="section-number">1.</span>Document Control</h2>
  <table>
    <tr><th>Attribute</th><th>Details</th></tr>
    <tr><td>Document Title</td><td>${escapeHtml(sow.title)}</td></tr>
    <tr><td>Project Code</td><td>${escapeHtml(ci.project_code)}</td></tr>
    <tr><td>Version</td><td>${sow.currentVersion}.0</td></tr>
    <tr><td>Status</td><td>${escapeHtml(sow.status.charAt(0).toUpperCase() + sow.status.slice(1))}</td></tr>
    <tr><td>Prepared By</td><td>${escapeHtml(ci.prepared_by)}</td></tr>
    <tr><td>Prepared Date</td><td>${formatDate(ci.prepared_date)}</td></tr>
    <tr><td>Client Contact</td><td>${escapeHtml(ci.contact_name)} (${escapeHtml(ci.contact_email)})</td></tr>
  </table>

  <h3>Version History</h3>
  <table>
    <tr><th>Version</th><th>Date</th><th>Author</th><th>Description</th></tr>
    <tr><td>${sow.currentVersion}.0</td><td>${formatDate(new Date(sow._creationTime).toISOString())}</td><td>${escapeHtml(ci.prepared_by)}</td><td>Current version</td></tr>
  </table>
</div>

<!-- SECTION 3: EXECUTIVE SUMMARY -->
<div class="section page-break">
  <h2><span class="section-number">2.</span>Executive Summary</h2>
  ${gc.executive_summary ? paragraphsToHtml(gc.executive_summary) : "<p><em>Content pending generation.</em></p>"}
</div>

<!-- SECTION 4: PROJECT OVERVIEW & OBJECTIVES -->
<div class="section">
  <h2><span class="section-number">3.</span>Project Overview &amp; Objectives</h2>
  <p>${escapeHtml(ci.company_name)} has engaged consulting services to design, develop, and implement an integration solution using the ${escapeHtml(id.platform)} platform (version ${escapeHtml(id.platform_version)}). The project encompasses ${id.integrations.length} integration process${id.integrations.length !== 1 ? "es" : ""} connecting ${id.source_systems.length} source system${id.source_systems.length !== 1 ? "s" : ""} with ${id.target_systems.length} target system${id.target_systems.length !== 1 ? "s" : ""}.</p>

  <h3>Project Objectives</h3>
  <ul>
    <li>Establish reliable, automated data synchronization between ${id.source_systems.map((s) => escapeHtml(s.name)).join(", ")} and ${id.target_systems.map((s) => escapeHtml(s.name)).join(", ")}</li>
    <li>Implement ${id.integrations.length} integration process${id.integrations.length !== 1 ? "es" : ""} on the ${escapeHtml(id.platform)} platform</li>
    <li>Deliver the complete solution within ${totalWeeks} weeks (${formatDate(ci.start_date)} through ${formatDate(ci.end_date)})</li>
    <li>Provide comprehensive documentation and knowledge transfer to enable ongoing operations</li>
    <li>Establish error handling, monitoring, and alerting to ensure operational reliability</li>
  </ul>

  <h3>Systems Involved</h3>
  <table>
    <tr><th>System</th><th>Type</th><th>Version</th><th>Environment</th><th>Role</th></tr>
    ${id.source_systems
      .map(
        (s) =>
          `<tr><td>${escapeHtml(s.name)}</td><td>${escapeHtml(s.type)}</td><td>${escapeHtml(s.version)}</td><td>${escapeHtml(s.environment)}</td><td>Source</td></tr>`
      )
      .join("\n    ")}
    ${id.target_systems
      .map(
        (s) =>
          `<tr><td>${escapeHtml(s.name)}</td><td>${escapeHtml(s.type)}</td><td>${escapeHtml(s.version)}</td><td>${escapeHtml(s.environment)}</td><td>Target</td></tr>`
      )
      .join("\n    ")}
  </table>

  <h3>Integration Processes</h3>
  <table>
    <tr><th>Process</th><th>Source</th><th>Target</th><th>Direction</th><th>Frequency</th><th>Trigger</th></tr>
    ${id.integrations
      .map(
        (i) =>
          `<tr><td>${escapeHtml(i.name)}</td><td>${escapeHtml(i.source)}</td><td>${escapeHtml(i.target)}</td><td>${escapeHtml(i.direction.replace("_", " "))}</td><td>${escapeHtml(i.frequency.replace("_", " "))}</td><td>${escapeHtml(i.trigger_type)}</td></tr>`
      )
      .join("\n    ")}
  </table>
</div>

<!-- SECTION 5: SCOPE OF WORK -->
<div class="section page-break">
  <h2><span class="section-number">4.</span>Scope of Work</h2>
  ${
    gc.scope_narratives && Object.keys(gc.scope_narratives).length > 0
      ? Object.entries(gc.scope_narratives)
          .map(
            ([name, narrative]) =>
              `<h3>${escapeHtml(name)}</h3>\n  ${paragraphsToHtml(narrative)}`
          )
          .join("\n  ")
      : id.integrations
          .map(
            (i) =>
              `<h3>${escapeHtml(i.name)}</h3>\n  <p>${escapeHtml(i.description)}</p>\n  <p><strong>Data Objects:</strong> ${escapeHtml(i.data_objects.join(", "))}</p>\n  <p><strong>Estimated Volume:</strong> ${escapeHtml(i.estimated_records)}</p>`
          )
          .join("\n  ")
  }
</div>

<!-- SECTION 6: INTEGRATION ARCHITECTURE -->
<div class="section page-break">
  <h2><span class="section-number">5.</span>Integration Architecture</h2>
  ${gc.architecture_description ? paragraphsToHtml(gc.architecture_description) : "<p><em>Content pending generation.</em></p>"}
</div>

<!-- SECTION 7: DELIVERABLES -->
<div class="section page-break">
  <h2><span class="section-number">6.</span>Deliverables</h2>
  ${gc.deliverables_prose ? paragraphsToHtml(gc.deliverables_prose) : ""}

  <h3>Deliverables by Phase</h3>
  ${sd.phases
    .map(
      (p) =>
        `<h4>${escapeHtml(p.name)}</h4>
  <p>${escapeHtml(p.description)}</p>
  <ul>
    ${p.deliverables.map((d) => `<li>${escapeHtml(d)}</li>`).join("\n    ")}
  </ul>`
    )
    .join("\n  ")}
</div>

<!-- SECTION 8: PROJECT PHASES & TIMELINE -->
<div class="section page-break">
  <h2><span class="section-number">7.</span>Project Phases &amp; Timeline</h2>
  <table>
    <tr><th>Phase</th><th>Description</th><th>Duration (Weeks)</th><th>Deliverables</th></tr>
    ${sd.phases
      .map(
        (p) =>
          `<tr><td>${escapeHtml(p.name)}</td><td>${escapeHtml(p.description)}</td><td style="text-align:center">${p.duration_weeks}</td><td>${p.deliverables.map((d) => escapeHtml(d)).join("<br>")}</td></tr>`
      )
      .join("\n    ")}
    <tr class="total-row"><td colspan="2">Total Duration</td><td style="text-align:center">${totalWeeks}</td><td></td></tr>
  </table>

  <h3>Key Milestones</h3>
  <table>
    <tr><th>Milestone</th><th>Target Date</th><th>Payment Trigger</th></tr>
    ${sd.milestones
      .map(
        (m) =>
          `<tr><td>${escapeHtml(m.name)}</td><td>${formatDate(m.date)}</td><td>${m.payment_trigger ? "Yes" : "No"}</td></tr>`
      )
      .join("\n    ")}
  </table>
</div>

<!-- SECTION 9: ASSUMPTIONS -->
<div class="section">
  <h2><span class="section-number">8.</span>Assumptions</h2>
  <p>This Statement of Work is based on the following assumptions. Should any of these assumptions prove incorrect, a change order may be required to adjust scope, timeline, or pricing.</p>
  <ul>
    ${sd.assumptions.map((a) => `<li>${escapeHtml(a)}</li>`).join("\n    ")}
  </ul>
</div>

<!-- SECTION 10: EXCLUSIONS -->
<div class="section">
  <h2><span class="section-number">9.</span>Exclusions</h2>
  <p>The following items are explicitly excluded from the scope of this engagement. Any work related to these items would require a separate Statement of Work or change order.</p>
  <ul>
    ${sd.exclusions.map((e) => `<li>${escapeHtml(e)}</li>`).join("\n    ")}
  </ul>
</div>

<!-- SECTION 11: ROLES & RESPONSIBILITIES -->
<div class="section page-break">
  <h2><span class="section-number">10.</span>Roles &amp; Responsibilities</h2>
  <h3>Consultant Responsibilities</h3>
  <table>
    <tr><th>Role</th><th>Responsibility</th></tr>
    ${sd.roles
      .filter((r) => r.party === "consultant")
      .map(
        (r) =>
          `<tr><td>${escapeHtml(r.role)}</td><td>${escapeHtml(r.responsibility)}</td></tr>`
      )
      .join("\n    ")}
  </table>

  <h3>Client Responsibilities</h3>
  <table>
    <tr><th>Role</th><th>Responsibility</th></tr>
    ${sd.roles
      .filter((r) => r.party === "client")
      .map(
        (r) =>
          `<tr><td>${escapeHtml(r.role)}</td><td>${escapeHtml(r.responsibility)}</td></tr>`
      )
      .join("\n    ")}
  </table>
</div>

<!-- SECTION 12: ACCEPTANCE CRITERIA -->
<div class="section">
  <h2><span class="section-number">11.</span>Acceptance Criteria</h2>
  <p>Each deliverable shall be reviewed and accepted based on the following criteria. The Client shall have five (5) business days from delivery to review and provide written acceptance or rejection with specific deficiencies noted.</p>
  <ul>
    ${sd.acceptance_criteria.map((a) => `<li>${escapeHtml(a)}</li>`).join("\n    ")}
  </ul>
</div>

<!-- SECTION 13: PRICING & FEES -->
<div class="section page-break">
  <h2><span class="section-number">12.</span>Pricing &amp; Fees</h2>
  <p><strong>Billing Type:</strong> ${escapeHtml(pt.billing_type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()))}</p>
  <p><strong>Total Project Investment:</strong> ${formatCurrency(pt.total_amount, pt.currency)}</p>

  <h3>Rate Schedule</h3>
  <table>
    <tr><th>Role</th><th class="amount">Rate (${escapeHtml(pt.currency)})</th><th>Unit</th></tr>
    ${pt.rates
      .map(
        (r) =>
          `<tr><td>${escapeHtml(r.role)}</td><td class="amount">${formatCurrency(r.rate, pt.currency)}</td><td>${escapeHtml(r.unit)}</td></tr>`
      )
      .join("\n    ")}
  </table>

  <h3>Phase Pricing</h3>
  <table>
    <tr><th>Phase</th><th class="amount">Hours</th><th class="amount">Amount (${escapeHtml(pt.currency)})</th></tr>
    ${pt.phases_pricing
      .map(
        (p) =>
          `<tr><td>${escapeHtml(p.phase)}</td><td class="amount">${p.hours}</td><td class="amount">${formatCurrency(p.amount, pt.currency)}</td></tr>`
      )
      .join("\n    ")}
    <tr class="total-row"><td>Total</td><td class="amount">${pt.phases_pricing.reduce((s, p) => s + p.hours, 0)}</td><td class="amount">${formatCurrency(pt.total_amount, pt.currency)}</td></tr>
  </table>

  ${pt.travel_expenses_included ? `<p><strong>Travel &amp; Expenses:</strong> Included, capped at ${formatCurrency(pt.travel_cap, pt.currency)}.</p>` : `<p><strong>Travel &amp; Expenses:</strong> Not included in the project pricing. Travel will be billed separately if required.</p>`}
  <p><strong>Change Order Rate:</strong> ${formatCurrency(pt.change_order_rate, pt.currency)} per hour for work outside the defined scope.</p>
</div>

<!-- SECTION 14: PAYMENT SCHEDULE -->
<div class="section">
  <h2><span class="section-number">13.</span>Payment Schedule</h2>
  <p>Payments are due within ${pt.payment_terms_days} days of invoice date. Invoices will be issued upon achievement of the following milestones:</p>
  <table>
    <tr><th>Milestone</th><th class="amount">Percentage</th><th class="amount">Amount (${escapeHtml(pt.currency)})</th><th>Due Date</th></tr>
    ${pt.payment_schedule
      .map(
        (p) =>
          `<tr><td>${escapeHtml(p.milestone)}</td><td class="amount">${p.percentage}%</td><td class="amount">${formatCurrency(p.amount, pt.currency)}</td><td>${formatDate(p.due)}</td></tr>`
      )
      .join("\n    ")}
    <tr class="total-row"><td>Total</td><td class="amount">${pt.payment_schedule.reduce((s, p) => s + p.percentage, 0)}%</td><td class="amount">${formatCurrency(pt.total_amount, pt.currency)}</td><td></td></tr>
  </table>
</div>

<!-- SECTION 15: CHANGE MANAGEMENT -->
<div class="section page-break">
  <h2><span class="section-number">14.</span>Change Management</h2>
  <p>Changes to the scope, schedule, or cost of this project must be managed through a formal change order process. Either party may initiate a change request at any time during the engagement.</p>

  <h3>Change Order Process</h3>
  <ol>
    <li><strong>Request Submission:</strong> The requesting party shall submit a written Change Request describing the proposed change, its rationale, and the expected impact on scope, schedule, and cost.</li>
    <li><strong>Impact Assessment:</strong> The Consultant shall assess the change request and provide a written impact analysis within five (5) business days, including revised estimates for effort, timeline, and cost.</li>
    <li><strong>Approval:</strong> Both parties must provide written approval of the Change Order before any work begins. The Change Order shall reference this SOW and become an amendment to it.</li>
    <li><strong>Implementation:</strong> Upon approval, the Consultant shall incorporate the change into the project plan and proceed with implementation.</li>
  </ol>

  <p>Work performed under change orders shall be billed at the change order rate of ${formatCurrency(pt.change_order_rate, pt.currency)} per hour unless otherwise specified in the approved Change Order.</p>
</div>

<!-- SECTION 16: TERMS & CONDITIONS -->
<div class="section">
  <h2><span class="section-number">15.</span>Terms &amp; Conditions</h2>
  ${pt.terms_and_conditions ? paragraphsToHtml(pt.terms_and_conditions) : `
  <h3>Confidentiality</h3>
  <p>Both parties agree to maintain the confidentiality of all proprietary information disclosed during the course of this engagement. Confidential information shall not be disclosed to third parties without prior written consent.</p>

  <h3>Intellectual Property</h3>
  <p>All deliverables produced under this Statement of Work shall become the property of the Client upon full payment. The Consultant retains the right to reuse general methodologies, frameworks, and tools that are not specific to the Client's proprietary business processes.</p>

  <h3>Limitation of Liability</h3>
  <p>The Consultant's total aggregate liability under this Statement of Work shall not exceed the total fees paid by the Client. Neither party shall be liable for indirect, incidental, consequential, special, or exemplary damages.</p>

  <h3>Termination</h3>
  <p>Either party may terminate this engagement with thirty (30) days' written notice. In the event of termination, the Client shall pay for all work completed through the effective date of termination.</p>

  <h3>Warranty</h3>
  <p>The Consultant warrants that all services shall be performed in a professional and workmanlike manner consistent with industry standards. A thirty (30) day warranty period shall apply to all deliverables from the date of acceptance, during which the Consultant shall correct any defects at no additional cost.</p>
  `}
</div>

<!-- SECTION 17: APPENDICES -->
<div class="section page-break">
  <h2><span class="section-number">16.</span>Appendices</h2>

  <h3>Appendix A: Glossary of Terms</h3>
  <table>
    <tr><th>Term</th><th>Definition</th></tr>
    <tr><td>SOW</td><td>Statement of Work - this document</td></tr>
    <tr><td>${escapeHtml(id.platform)}</td><td>The integration platform used to build and manage the integration processes</td></tr>
    ${id.source_systems.map((s) => `<tr><td>${escapeHtml(s.name)}</td><td>${escapeHtml(s.type)} system (version ${escapeHtml(s.version)}) serving as a source system</td></tr>`).join("\n    ")}
    ${id.target_systems.map((s) => `<tr><td>${escapeHtml(s.name)}</td><td>${escapeHtml(s.type)} system (version ${escapeHtml(s.version)}) serving as a target system</td></tr>`).join("\n    ")}
    <tr><td>Change Order</td><td>A formal document modifying the scope, timeline, or cost of this SOW</td></tr>
    <tr><td>UAT</td><td>User Acceptance Testing</td></tr>
  </table>

  <h3>Appendix B: Contact Information</h3>
  <table>
    <tr><th>Role</th><th>Name</th><th>Email</th><th>Phone</th></tr>
    <tr><td>Client Contact</td><td>${escapeHtml(ci.contact_name)}</td><td>${escapeHtml(ci.contact_email)}</td><td>${escapeHtml(ci.contact_phone)}</td></tr>
    <tr><td>Consultant Lead</td><td>${escapeHtml(ci.prepared_by)}</td><td></td><td></td></tr>
  </table>

  <h3>Appendix C: Integration Data Objects</h3>
  ${id.integrations
    .map(
      (i) =>
        `<h4>${escapeHtml(i.name)}</h4>
  <table>
    <tr><th>Data Object</th><th>Estimated Records</th></tr>
    ${i.data_objects.map((d) => `<tr><td>${escapeHtml(d)}</td><td>${escapeHtml(i.estimated_records)}</td></tr>`).join("\n    ")}
  </table>`
    )
    .join("\n  ")}
</div>

<!-- SIGNATURE BLOCK -->
<div class="section page-break">
  <h2>Signatures</h2>
  <p>By signing below, both parties agree to the terms and conditions set forth in this Statement of Work.</p>

  <div style="margin-top: 3rem; display: flex; justify-content: space-between;">
    <div style="width: 45%;">
      <p><strong>For ${escapeHtml(ci.company_name)}</strong></p>
      <div style="border-bottom: 1px solid #1a1a1a; height: 40px; margin: 1rem 0 0.5rem;"></div>
      <p>Name: ${escapeHtml(ci.contact_name)}</p>
      <p>Title: ${escapeHtml(ci.contact_title)}</p>
      <p>Date: ____________________</p>
    </div>
    <div style="width: 45%;">
      <p><strong>For Consultant</strong></p>
      <div style="border-bottom: 1px solid #1a1a1a; height: 40px; margin: 1rem 0 0.5rem;"></div>
      <p>Name: ${escapeHtml(ci.prepared_by)}</p>
      <p>Title: ____________________</p>
      <p>Date: ____________________</p>
    </div>
  </div>
</div>

</body>
</html>`;
}
