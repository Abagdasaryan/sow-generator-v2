import type { ParsedSow } from "./types";

/**
 * Renders a complete SOW as a print-optimized HTML document.
 * Stub implementation — will be replaced by another agent with full template.
 */
export function renderSowHtml(sow: ParsedSow): string {
  const { clientInfo, integrationDetails, scopeDeliverables, pricingTerms, generatedContent } = sow;

  const scopeNarrativesHtml = Object.entries(generatedContent.scope_narratives || {})
    .map(([name, text]) => `<h3>${escapeHtml(name)}</h3><p>${escapeHtml(text)}</p>`)
    .join("\n");

  const phasesHtml = scopeDeliverables.phases
    .map(
      (p) => `
      <tr>
        <td>${escapeHtml(p.name)}</td>
        <td>${escapeHtml(p.description)}</td>
        <td>${p.duration_weeks} weeks</td>
        <td>${p.deliverables.map(escapeHtml).join("; ")}</td>
      </tr>`
    )
    .join("\n");

  const milestonesHtml = scopeDeliverables.milestones
    .map(
      (m) =>
        `<tr><td>${escapeHtml(m.name)}</td><td>${escapeHtml(m.date)}</td><td>${m.payment_trigger ? "Yes" : "No"}</td></tr>`
    )
    .join("\n");

  const integrationsHtml = integrationDetails.integrations
    .map(
      (i) =>
        `<tr><td>${escapeHtml(i.name)}</td><td>${escapeHtml(i.source)}</td><td>${escapeHtml(i.target)}</td><td>${i.direction.replace("_", " ")}</td><td>${i.frequency.replace("_", " ")}</td></tr>`
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(sow.title)} — Statement of Work</title>
  <style>
    @page { size: letter; margin: 1in; }
    @media print { body { -webkit-print-color-adjust: exact; } }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 8.5in; margin: 0 auto; padding: 1in; }
    h1 { color: #1a365d; border-bottom: 2px solid #2b6cb0; padding-bottom: 0.5rem; }
    h2 { color: #2b6cb0; margin-top: 2rem; }
    h3 { color: #4a5568; }
    table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
    th, td { border: 1px solid #e2e8f0; padding: 0.5rem 0.75rem; text-align: left; }
    th { background-color: #edf2f7; font-weight: 600; }
    .meta { color: #718096; font-size: 0.9rem; }
  </style>
</head>
<body>
  <h1>${escapeHtml(sow.title)}</h1>
  <p class="meta">Prepared for: ${escapeHtml(clientInfo.company_name)} | Project: ${escapeHtml(clientInfo.project_name)} (${escapeHtml(clientInfo.project_code)})</p>
  <p class="meta">Prepared by: ${escapeHtml(clientInfo.prepared_by)} | Date: ${escapeHtml(clientInfo.prepared_date)} | Duration: ${escapeHtml(clientInfo.start_date)} – ${escapeHtml(clientInfo.end_date)}</p>

  <h2>1. Executive Summary</h2>
  <p>${escapeHtml(generatedContent.executive_summary || "")}</p>

  <h2>2. Integration Architecture</h2>
  <p>${escapeHtml(generatedContent.architecture_description || "")}</p>

  <h2>3. Integration Processes</h2>
  <table>
    <thead><tr><th>Name</th><th>Source</th><th>Target</th><th>Direction</th><th>Frequency</th></tr></thead>
    <tbody>${integrationsHtml}</tbody>
  </table>

  <h2>4. Scope Narratives</h2>
  ${scopeNarrativesHtml}

  <h2>5. Deliverables</h2>
  <p>${escapeHtml(generatedContent.deliverables_prose || "")}</p>
  <table>
    <thead><tr><th>Phase</th><th>Description</th><th>Duration</th><th>Deliverables</th></tr></thead>
    <tbody>${phasesHtml}</tbody>
  </table>

  <h2>6. Milestones</h2>
  <table>
    <thead><tr><th>Milestone</th><th>Date</th><th>Payment Trigger</th></tr></thead>
    <tbody>${milestonesHtml}</tbody>
  </table>

  <h2>7. Pricing</h2>
  <p><strong>Billing Type:</strong> ${pricingTerms.billing_type.replace("_", " ")}</p>
  <p><strong>Total Amount:</strong> ${pricingTerms.currency} ${pricingTerms.total_amount.toLocaleString()}</p>
  <p><strong>Payment Terms:</strong> Net ${pricingTerms.payment_terms_days} days</p>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
