// --- JSON column types ---

export interface ClientInfo {
  company_name: string;
  contact_name: string;
  contact_title: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  project_name: string;
  project_code: string;
  start_date: string;
  end_date: string;
  prepared_by: string;
  prepared_date: string;
}

export interface SourceTargetSystem {
  name: string;
  type: string;
  version: string;
  environment: "sandbox" | "production";
}

export interface IntegrationProcess {
  name: string;
  description: string;
  source: string;
  target: string;
  direction: "source_to_target" | "bidirectional";
  frequency: "real_time" | "scheduled" | "event_driven";
  trigger_type: string;
  data_objects: string[];
  estimated_records: string;
}

export interface IntegrationDetails {
  platform: "boomi" | "celigo" | "other";
  platform_version: string;
  source_systems: SourceTargetSystem[];
  target_systems: SourceTargetSystem[];
  integrations: IntegrationProcess[];
}

export interface Phase {
  name: string;
  description: string;
  duration_weeks: number;
  deliverables: string[];
}

export interface Milestone {
  name: string;
  date: string;
  payment_trigger: boolean;
}

export interface Role {
  role: string;
  responsibility: string;
  party: "consultant" | "client";
}

export interface ScopeDeliverables {
  phases: Phase[];
  milestones: Milestone[];
  assumptions: string[];
  exclusions: string[];
  acceptance_criteria: string[];
  roles: Role[];
}

export interface RateEntry {
  role: string;
  rate: number;
  unit: "hourly" | "daily";
}

export interface PhasePricing {
  phase: string;
  hours: number;
  amount: number;
}

export interface PaymentScheduleEntry {
  milestone: string;
  percentage: number;
  amount: number;
  due: string;
}

export interface PricingTerms {
  billing_type: "fixed" | "time_and_materials" | "hybrid";
  rates: RateEntry[];
  phases_pricing: PhasePricing[];
  total_amount: number;
  currency: string;
  payment_schedule: PaymentScheduleEntry[];
  payment_terms_days: number;
  change_order_rate: number;
  travel_expenses_included: boolean;
  travel_cap: number;
  terms_and_conditions: string;
}

export interface GeneratedContent {
  executive_summary: string;
  scope_narratives: Record<string, string>;
  architecture_description: string;
  deliverables_prose: string;
}

// --- Status type ---

export type SowStatus = "draft" | "in_review" | "approved" | "final" | "archived";

// --- Frontend types (Convex conventions) ---

export interface Sow {
  _id: string;
  _creationTime: number;
  user_id: string;
  status: SowStatus;
  title: string;
  current_version: number;
  client_info: ClientInfo;
  integration_details: IntegrationDetails;
  scope_deliverables: ScopeDeliverables;
  pricing_terms: PricingTerms;
  generated_content: GeneratedContent;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "editor";
}

export interface SowVersion {
  id: string;
  sow_id: string;
  version_number: number;
  snapshot: string;
  change_summary: string | null;
  created_by: string;
  created_at: string;
}

export interface SowComment {
  id: string;
  sow_id: string;
  section: string;
  user_id: string;
  user_name: string;
  content: string;
  resolved: boolean;
  created_at: string;
}

export interface SowApproval {
  id: string;
  sow_id: string;
  requested_by: string;
  assigned_to: string;
  status: "pending" | "approved" | "rejected" | "changes_requested";
  comments: string | null;
  decided_at: string | null;
  created_at: string;
}

export interface Template {
  id: string;
  name: string;
  description: string | null;
  client_info: ClientInfo;
  integration_details: IntegrationDetails;
  scope_deliverables: ScopeDeliverables;
  pricing_terms: PricingTerms;
  created_by: string;
  is_default: boolean;
  created_at: string;
}

/**
 * SOW as returned by Convex queries (camelCase field names).
 * Used by API routes that interact with the Convex backend.
 */
export interface ParsedSow {
  _id: string;
  _creationTime: number;
  userId: string;
  status: SowStatus;
  title: string;
  currentVersion: number;
  clientInfo: ClientInfo;
  integrationDetails: IntegrationDetails;
  scopeDeliverables: ScopeDeliverables;
  pricingTerms: PricingTerms;
  generatedContent: GeneratedContent;
  templateId?: string;
  duplicatedFrom?: string;
}
