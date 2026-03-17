import type {
  ClientInfo,
  IntegrationDetails,
  ScopeDeliverables,
  PricingTerms,
  GeneratedContent,
} from "./types";

export const defaultClientInfo: ClientInfo = {
  company_name: "",
  contact_name: "",
  contact_title: "",
  contact_email: "",
  contact_phone: "",
  address: "",
  project_name: "",
  project_code: "",
  start_date: "",
  end_date: "",
  prepared_by: "",
  prepared_date: "",
};

export const defaultIntegrationDetails: IntegrationDetails = {
  platform: "boomi",
  platform_version: "",
  source_systems: [],
  target_systems: [],
  integrations: [],
};

export const defaultScopeDeliverables: ScopeDeliverables = {
  phases: [
    {
      name: "Discovery & Requirements",
      description:
        "Gather and document business requirements, technical specifications, and integration mapping.",
      duration_weeks: 2,
      deliverables: [
        "Business Requirements Document (BRD)",
        "Integration Requirements Matrix",
        "Data Mapping Specifications",
      ],
    },
    {
      name: "Solution Design",
      description:
        "Design integration architecture, data flows, error handling, and monitoring strategy.",
      duration_weeks: 2,
      deliverables: [
        "Solution Design Document (SDD)",
        "Integration Architecture Diagram",
        "Error Handling Framework",
        "Data Transformation Rules",
      ],
    },
    {
      name: "Build & Configuration",
      description:
        "Develop and configure integration processes, transformations, and connectors.",
      duration_weeks: 4,
      deliverables: [
        "Configured Integration Processes",
        "Custom Scripting / Transformations",
        "Connection Configurations",
        "Unit Test Results",
      ],
    },
    {
      name: "Testing & QA",
      description:
        "Execute system integration testing, end-to-end testing, and performance validation.",
      duration_weeks: 2,
      deliverables: [
        "Test Plan & Test Cases",
        "System Integration Test Results",
        "Performance Test Results",
        "Defect Log & Resolution Report",
      ],
    },
    {
      name: "User Acceptance Testing",
      description:
        "Support client UAT execution, defect resolution, and sign-off process.",
      duration_weeks: 2,
      deliverables: [
        "UAT Test Scripts",
        "UAT Execution Support",
        "Defect Resolution",
        "UAT Sign-Off Document",
      ],
    },
    {
      name: "Go-Live & Deployment",
      description:
        "Execute production deployment, cutover activities, and go-live validation.",
      duration_weeks: 1,
      deliverables: [
        "Deployment Runbook",
        "Production Migration Scripts",
        "Go-Live Checklist",
        "Production Validation Report",
      ],
    },
    {
      name: "Hypercare & Knowledge Transfer",
      description:
        "Provide post-go-live support, monitoring, and knowledge transfer to client team.",
      duration_weeks: 2,
      deliverables: [
        "Operations & Support Guide",
        "Knowledge Transfer Sessions",
        "Monitoring Dashboard Setup",
        "Hypercare Support Log",
      ],
    },
  ],
  milestones: [],
  assumptions: [
    "Client will provide timely access to all source and target systems, including sandbox/test environments.",
    "Client subject matter experts (SMEs) will be available for requirements gathering and UAT support.",
    "All third-party API credentials and licenses will be provided by the client prior to the Build phase.",
    "Data quality in source systems is sufficient for integration; data cleansing is out of scope unless specified.",
    "Change requests outside the agreed scope will follow the change order process and may impact timeline and cost.",
    "Client will provide VPN or secure access to on-premise systems if required.",
    "Project communication and status updates will occur via weekly status meetings and email.",
  ],
  exclusions: [
    "Custom application development or UI modifications in source/target systems.",
    "Data migration or historical data loading beyond integration transaction processing.",
    "Source or target system administration, upgrades, or patch management.",
    "Training on source or target systems (integration platform training only).",
    "Network infrastructure changes, firewall rules, or SSL certificate provisioning.",
    "Performance optimization of source or target system APIs or databases.",
    "Ongoing production support beyond the defined hypercare period.",
  ],
  acceptance_criteria: [],
  roles: [],
};

export const defaultPricingTerms: PricingTerms = {
  billing_type: "time_and_materials",
  rates: [],
  phases_pricing: [],
  total_amount: 0,
  currency: "USD",
  payment_schedule: [],
  payment_terms_days: 30,
  change_order_rate: 0,
  travel_expenses_included: false,
  travel_cap: 0,
  terms_and_conditions: "",
};

export const defaultGeneratedContent: GeneratedContent = {
  executive_summary: "",
  scope_narratives: {},
  architecture_description: "",
  deliverables_prose: "",
};
