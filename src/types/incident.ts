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

// ─── Process Engine (P0–P4) ────────────────────────────────────────────────
export type ProcessStageId = "P0" | "P1" | "P2" | "P3" | "P4";
export type ProcessStageStatus = "pending" | "in_progress" | "complete" | "skipped";

export interface ProcessStage {
  id: ProcessStageId;
  status: ProcessStageStatus;
  enteredAt?: string;     // ISO when stage became in_progress
  completedAt?: string;   // ISO when stage marked complete
  completedBy?: string;
  // soft-gate audit: items the stage required that were not done
  overrideReasons?: string[];
}

export const PROCESS_STAGE_DEFS: { id: ProcessStageId; title: string; subtitle: string }[] = [
  { id: "P0", title: "Intake & Triage", subtitle: "Capture facts, assign DPO, set severity" },
  { id: "P1", title: "Containment", subtitle: "Isolate, preserve evidence, brief Legal" },
  { id: "P2", title: "Assessment", subtitle: "Indicators reviewed, deadlines tracked" },
  { id: "P3", title: "Notification", subtitle: "Drafts prepared, Legal release, EM approval" },
  { id: "P4", title: "Closure", subtitle: "Lessons learned, register entry, archive" },
];

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
  // Versioned legal classifications (newest first). Created by Legal Counsel.
  classifications?: Classification[];
  // Process Engine state (in-memory). Defaults derived if missing.
  process?: {
    currentStage: ProcessStageId;
    stages: ProcessStage[];
  };
}

export type ClassificationVerdict = "notifiable" | "not_notifiable" | "exempt";
export type Art34Verdict = "required" | "not_required" | "exempt";
export type Nis2Verdict = "yes_24h" | "no" | "under_review";

export interface Classification {
  id: string;
  incidentId: string;
  ts: string;                          // ISO
  authorEmail: string;                 // Legal Counsel
  authorName: string;
  version: number;                     // 1, 2, 3 ...
  art33: ClassificationVerdict;
  competentAuthority: string;
  art34: Art34Verdict;
  nis2: Nis2Verdict;
  rationale: string;
  openQuestionsForDpo?: string;
}

export type AuditActor =
  | "Employee"
  | "ARIA"
  | "DPO"
  | "Legal Counsel"
  | "Executive Management"
  | "System";

export interface AuditEvent {
  id: string;
  incidentId: string;
  ts: string;                       // ISO
  actor: AuditActor;
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
  // Phase 2 (Legal Counsel)
  releasedByLegal?: boolean;        // Legal Counsel released for EM approval
  releasedAt?: string;              // ISO
  releasedBy?: string;              // Legal Counsel name/email
  privileged?: boolean;             // visible to Legal + external counsel only
  privilegedBy?: string;
  privilegedAt?: string;
  // Two-stage approval (DPO requests → Legal releases → EM approves dispatch)
  dpoRequestedReleaseAt?: string;
  dpoRequestedBy?: string;
  emApprovedAt?: string;
  emApprovedBy?: string;
}
