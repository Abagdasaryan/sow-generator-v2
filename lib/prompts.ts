import type {
  ClientInfo,
  IntegrationDetails,
  ScopeDeliverables,
  PricingTerms,
} from "./types";

export function buildExecutiveSummaryPrompt(
  clientInfo: ClientInfo,
  integrationDetails: IntegrationDetails,
  scopeDeliverables: ScopeDeliverables,
  pricingTerms: PricingTerms
): string {
  const integrationList = integrationDetails.integrations
    .map(
      (i) =>
        `- ${i.name}: ${i.source} → ${i.target} (${i.direction.replace("_", " ")}, ${i.frequency.replace("_", " ")})`
    )
    .join("\n");

  const sourceSystemList = integrationDetails.source_systems
    .map((s) => `${s.name} (${s.type} ${s.version})`)
    .join(", ");

  const targetSystemList = integrationDetails.target_systems
    .map((s) => `${s.name} (${s.type} ${s.version})`)
    .join(", ");

  const phasesSummary = scopeDeliverables.phases
    .map((p) => `- ${p.name}: ${p.duration_weeks} weeks - ${p.description}`)
    .join("\n");

  return `Write an executive summary (2-3 paragraphs) for a Statement of Work document.

CLIENT INFORMATION:
- Company: ${clientInfo.company_name}
- Project Name: ${clientInfo.project_name}
- Project Code: ${clientInfo.project_code}
- Prepared By: ${clientInfo.prepared_by}
- Start Date: ${clientInfo.start_date}
- End Date: ${clientInfo.end_date}

INTEGRATION PLATFORM: ${integrationDetails.platform} (${integrationDetails.platform_version})

SOURCE SYSTEMS: ${sourceSystemList}
TARGET SYSTEMS: ${targetSystemList}

INTEGRATIONS:
${integrationList}

PROJECT PHASES:
${phasesSummary}

TOTAL PROJECT VALUE: ${pricingTerms.currency} ${pricingTerms.total_amount.toLocaleString()}
BILLING TYPE: ${pricingTerms.billing_type.replace("_", " ")}

The executive summary should cover:
1. The business context and why this integration project is being undertaken
2. The high-level approach and platform being used
3. Expected outcomes and timeline

Write in third person, formal but clear tone. Do not use bullet points. Output only the executive summary text, no headings.`;
}

export function buildScopeNarrativesPrompt(
  integrationDetails: IntegrationDetails
): string {
  const integrationBlocks = integrationDetails.integrations
    .map(
      (i) => `
INTEGRATION: ${i.name}
- Description: ${i.description}
- Source System: ${i.source}
- Target System: ${i.target}
- Direction: ${i.direction.replace("_", " ")}
- Frequency: ${i.frequency.replace("_", " ")}
- Trigger: ${i.trigger_type}
- Data Objects: ${i.data_objects.join(", ")}
- Estimated Record Volume: ${i.estimated_records}`
    )
    .join("\n");

  return `Write detailed scope narratives for each integration process in this project. For each integration, write 1-2 paragraphs describing the data flow, direction, frequency, trigger mechanism, and key data objects involved.

INTEGRATION PLATFORM: ${integrationDetails.platform} (${integrationDetails.platform_version})

SOURCE SYSTEMS: ${integrationDetails.source_systems.map((s) => `${s.name} (${s.type} ${s.version})`).join(", ")}
TARGET SYSTEMS: ${integrationDetails.target_systems.map((s) => `${s.name} (${s.type} ${s.version})`).join(", ")}

${integrationBlocks}

Return a JSON object where each key is the integration name and each value is the narrative text. Example format:
{
  "Integration Name": "narrative text here..."
}

Output ONLY the JSON object, no markdown code fences or other text.`;
}

export function buildArchitecturePrompt(
  integrationDetails: IntegrationDetails
): string {
  const sourceList = integrationDetails.source_systems
    .map(
      (s) =>
        `- ${s.name}: ${s.type} ${s.version} (${s.environment})`
    )
    .join("\n");

  const targetList = integrationDetails.target_systems
    .map(
      (s) =>
        `- ${s.name}: ${s.type} ${s.version} (${s.environment})`
    )
    .join("\n");

  const integrationList = integrationDetails.integrations
    .map(
      (i) =>
        `- ${i.name}: ${i.source} → ${i.target}, ${i.direction.replace("_", " ")}, ${i.frequency.replace("_", " ")}, trigger: ${i.trigger_type}, objects: ${i.data_objects.join(", ")}`
    )
    .join("\n");

  return `Write an integration architecture description for a Statement of Work. This should be 3-4 paragraphs covering:

1. Platform overview - describe the ${integrationDetails.platform} platform (version ${integrationDetails.platform_version}) and its role as the integration middleware
2. Source and target systems - describe each system and its role
3. Connectors and communication protocols - describe how systems will connect
4. Error handling and monitoring approach - describe the error handling strategy

PLATFORM: ${integrationDetails.platform} (${integrationDetails.platform_version})

SOURCE SYSTEMS:
${sourceList}

TARGET SYSTEMS:
${targetList}

INTEGRATION PROCESSES:
${integrationList}

Write in third person, formal but clear tone. Be specific about the technologies mentioned. Output only the architecture description text, no headings.`;
}

export function buildDeliverablesPrompt(
  scopeDeliverables: ScopeDeliverables
): string {
  const phaseBlocks = scopeDeliverables.phases
    .map(
      (p) => `
PHASE: ${p.name}
- Description: ${p.description}
- Duration: ${p.duration_weeks} weeks
- Deliverables: ${p.deliverables.join("; ")}`
    )
    .join("\n");

  const milestones = scopeDeliverables.milestones
    .map(
      (m) =>
        `- ${m.name} (${m.date})${m.payment_trigger ? " [Payment Trigger]" : ""}`
    )
    .join("\n");

  return `Write detailed descriptions of the deliverables for each project phase. For each phase, write 1-2 paragraphs expanding on the deliverables listed, explaining what each deliverable includes and its purpose.

${phaseBlocks}

KEY MILESTONES:
${milestones}

Write in third person, formal but clear tone. Organize by phase with the phase name as a clear label. Output only the deliverables text.`;
}
