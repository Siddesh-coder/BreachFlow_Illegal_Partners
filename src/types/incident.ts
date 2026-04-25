export type Severity = "low" | "medium" | "high";
export type IncidentStatus = "new" | "in_progress" | "completed";

export type DataType =
  | "Personal Identifiers"
  | "Financial Data"
  | "Health/Medical Records"
  | "Login Credentials"
  | "Biometric Data"
  | "Special Category Data";

export type EUCountry =
  | "Germany"
  | "France"
  | "Italy"
  | "Spain"
  | "Netherlands"
  | "Ireland"
  | "Sweden"
  | "Poland"
  | "Other EU";

export interface ActionStep {
  id: string;
  title: string;
  description: string;
  status: "not_started" | "in_progress" | "done";
  draftEmail?: string;
  emailSent?: boolean;
}

export type IndicatorStatus = "matched" | "open" | "unclear";

export interface IndicatorCriterion {
  id: string;
  label: string;
  status: IndicatorStatus;
  source?: string;          // e.g. "EDPB Guidelines 9/2022"
  detail?: string;          // optional supporting fact text
}

export interface IndicatorOverride {
  // key: regimeId + ":" + criterionId
  [key: string]: IndicatorStatus;
}

export type Nis2Sector =
  | "Healthcare"
  | "Energy"
  | "Banking"
  | "Digital Infrastructure"
  | "Transport"
  | "Water"
  | "Public Administration"
  | "Not Applicable";

export interface Incident {
  id: string;                       // BR-2026-XXXX
  reportedAt: string;               // ISO
  discoveredAt: string;             // ISO (Q1)
  reporterName: string | null;      // null = anonymous
  isAnonymous: boolean;
  dataTypes: DataType[];
  affectedCount: number | null;
  whatHappened: string;
  incidentCategory: string;         // dropdown hint
  countries: EUCountry[];
  contained: boolean | null;
  additionalNotes: string;
  severity: Severity;
  status: IncidentStatus;
  aiSummary: string;
  notifiability: {
    // legacy verdict fields kept for back-compat with seed/AI output, but UI no longer renders them
    verdict: "likely" | "possibly" | "not";
    reasoning: string[];
    authority: string;
  } | null;
  // NIS2 sector — drives whether NIS2 deadlines / indicators are active
  nis2Sector?: Nis2Sector;
  // Whether the org carries cyber insurance — drives insurance deadline
  cyberInsurance?: boolean;
  // Per-criterion overrides set by Legal Counsel (in-memory)
  indicatorOverrides?: IndicatorOverride;
  recommendations: ActionStep[];
}

export interface AuditEvent {
  id: string;
  incidentId: string;
  ts: string;                       // ISO
  actor: "Employee" | "ARIA" | "DPO";
  action: string;
}

export interface Notification {
  id: string;
  incidentId: string;
  type: "Internal" | "Authority" | "Individual";
  status: "Draft" | "Sent";
  date: string;
  subject: string;
  body: string;
}
