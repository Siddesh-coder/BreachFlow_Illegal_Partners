// Sentinel intake schema — Blocks 0–12.
// Maps to dashboard criteria (c11..c43). Used by the Legal Classification view
// to display the structured fact record collected per incident.

import type { Incident } from "@/types/incident";

export type Confidence = "verified" | "extracted" | "estimated" | "open";

export interface ClassificationField {
  id: string; // e.g. "Q1.2"
  label: string;
  required: boolean;
  criterion?: string; // e.g. "c22"
  sourceNote?: string; // RDG / EDSA / GDPR reference
  answer: string | string[] | null;
  confidence: Confidence;
}

export interface ClassificationBlock {
  id: string; // "block-0"
  title: string;
  subtitle?: string;
  fields: ClassificationField[];
}

// ---------- Per-incident mock answers ----------
// Hardcoded answers for each seed incident, mapped onto the schema.

type IncidentAnswers = Record<string, { value: string | string[]; conf: Confidence }>;

const ANSWERS_BY_INCIDENT: Record<string, IncidentAnswers> = {
  "BR-2026-0042": {
    "Q0.1": { value: "12 Mar 2026, 04:12 (UTC)", conf: "verified" },
    "Q0.2": { value: "11 Mar 2026, ~10:00 (UTC) — based on access logs", conf: "extracted" },
    "Q0.3": { value: "Reporting on behalf of the organisation", conf: "verified" },
    "Q0.4": { value: "InfoSec Engineer", conf: "verified" },
    "Q0.5": { value: "INC-2026-0042", conf: "verified" },
    "Q1.1": {
      value:
        "A misconfigured backup server exposed patient records to the public internet for ~18h before being detected by an external researcher.",
      conf: "verified",
    },
    "Q1.2": { value: ["Data accidentally made publicly accessible"], conf: "verified" },
    "Q1.3": { value: ["Confidentiality"], conf: "extracted" },
    "Q1.4": { value: "Yes — access evidenced (researcher disclosure + access logs)", conf: "verified" },
    "Q2.1": { value: ["Health data (Art. 9)", "Patient/client data", "Name / contact data"], conf: "verified" },
    "Q2.2": { value: "Directly identifying (full names, dates of birth)", conf: "verified" },
    "Q2.3": { value: "n/a — no passwords involved", conf: "verified" },
    "Q2.4": { value: "≈ 1,840 records", conf: "estimated" },
    "Q3.1": { value: "1,000 – 10,000", conf: "estimated" },
    "Q3.2": { value: ["Patients / medical context"], conf: "verified" },
    "Q3.3": { value: "Healthcare", conf: "verified" },
    "Q4.1": {
      value: ["Loss of control over personal data", "Reputational damage", "Breach of professional secrecy"],
      conf: "extracted",
    },
    "Q4.2": { value: "Plausible", conf: "estimated" },
    "Q4.3": { value: "Partially — affected individuals can stay alert but cannot recall the exposure", conf: "extracted" },
    "Q5.1": { value: "No — backup was unencrypted at rest on the exposed server", conf: "verified" },
    "Q5.2": { value: "n/a", conf: "verified" },
    "Q5.3": { value: "Yes — current backup, restorable", conf: "verified" },
    "Q5.4": { value: "Access controls were misconfigured; no compensating TOMs effective", conf: "verified" },
    "Q6.1": {
      value: ["System isolated / taken offline", "Forensics engaged", "Insurance notified"],
      conf: "verified",
    },
    "Q6.2": { value: "n/a — exposure was public, not a misdirected recipient", conf: "verified" },
    "Q6.3": { value: "n/a", conf: "verified" },
    "Q7.1": { value: "Yes — all affected patients identifiable from the patient register", conf: "verified" },
    "Q7.2": { value: "No — individual notification feasible", conf: "verified" },
    "Q7.3": { value: "German", conf: "verified" },
    "Q8.1": { value: "No processor involved — backup operated in-house", conf: "verified" },
    "Q8.2": { value: "n/a", conf: "verified" },
    "Q8.3": { value: "n/a", conf: "verified" },
    "Q8.4": { value: "No — controller", conf: "verified" },
    "Q8.5": { value: "No joint controller arrangement", conf: "verified" },
    "Q9.1": { value: "Germany (Berlin)", conf: "verified" },
    "Q9.2": { value: "No — affected individuals are German residents only", conf: "verified" },
    "Q9.3": { value: "n/a (no cross-border processing in this incident)", conf: "verified" },
    "Q9.4": { value: "n/a", conf: "verified" },
    "Q9.5": { value: "No third-country transfers identified", conf: "verified" },
    "Q10.1": { value: "Yes — Healthcare sector, NIS2 essential entity (24h early warning applies)", conf: "verified" },
    "Q10.2": { value: "n/a — not listed", conf: "verified" },
    "Q10.3": { value: "Yes — cyber policy (carrier notified within 48h)", conf: "verified" },
    "Q10.4": { value: "Sector-specific reporting under §32 BSIG-neu under review", conf: "open" },
    "Q10.5": { value: "Patient contracts include duty-of-care information obligations", conf: "extracted" },
    "Q11.1": { value: "Plausible — patient claims under Art. 82 GDPR possible", conf: "estimated" },
    "Q11.2": { value: "Yes — external counsel mandated 12 Mar 2026", conf: "verified" },
    "Q11.3": { value: "Yes — privilege tagging activated for counsel communications", conf: "verified" },
    "Q11.4": { value: "Not yet filed", conf: "verified" },
    "Q11.5": { value: "No supervisory directive received", conf: "verified" },
    "Q12.1": { value: ["Logfiles", "Forensic report (preliminary)", "Email correspondence"], conf: "verified" },
    "Q12.2": { value: "Yes — hashed and sealed (sealed_at recorded)", conf: "verified" },
    "Q12.3": { value: "Yes — entry created in internal incident register", conf: "verified" },
    "Q12.4": { value: "Final forensic scope, exact affected count, root cause", conf: "open" },
  },

  "BR-2026-0039": {
    "Q0.1": { value: "Discovery via SIEM alert, ~30h ago", conf: "verified" },
    "Q0.2": { value: "Earliest credential capture ~6h before discovery", conf: "extracted" },
    "Q0.3": { value: "Anonymous report (HinSchG channel)", conf: "verified" },
    "Q0.4": { value: "Not disclosed (anonymous)", conf: "verified" },
    "Q0.5": { value: "—", conf: "open" },
    "Q1.1": {
      value:
        "Phishing campaign harvested employee SSO credentials. Two accounts confirmed compromised before MFA enforcement triggered.",
      conf: "verified",
    },
    "Q1.2": { value: ["Phishing / social engineering", "Hacker attack / unauthorised access"], conf: "verified" },
    "Q1.3": { value: ["Confidentiality"], conf: "extracted" },
    "Q1.4": { value: "Yes — login from unknown IP confirmed in logs (2 accounts)", conf: "verified" },
    "Q2.1": { value: ["Login credentials / passwords", "Name / contact data"], conf: "verified" },
    "Q2.2": { value: "Directly identifying (employee accounts)", conf: "verified" },
    "Q2.3": { value: "Yes — passwords salted + bcrypt; salt not compromised", conf: "verified" },
    "Q2.4": { value: "≈ 320 credentials", conf: "estimated" },
    "Q3.1": { value: "100 – 1,000", conf: "estimated" },
    "Q3.2": { value: ["Employees / applicants"], conf: "verified" },
    "Q3.3": { value: "None of the listed sectors", conf: "verified" },
    "Q4.1": { value: ["Loss of control over personal data", "Restriction of rights"], conf: "extracted" },
    "Q4.2": { value: "Abstractly possible but unlikely (MFA blocked escalation)", conf: "estimated" },
    "Q4.3": { value: "Yes — password reset and account monitoring", conf: "verified" },
    "Q5.1": { value: "n/a — credentials, not stored data", conf: "verified" },
    "Q5.2": { value: "n/a", conf: "verified" },
    "Q5.3": { value: "n/a", conf: "verified" },
    "Q5.4": { value: "MFA enforcement; conditional access; SSO log monitoring", conf: "verified" },
    "Q6.1": {
      value: ["Credentials revoked / reset", "System isolated / taken offline"],
      conf: "verified",
    },
    "Q6.2": { value: "n/a", conf: "verified" },
    "Q6.3": { value: "n/a", conf: "verified" },
    "Q7.1": { value: "Yes — all affected employees identified in IAM", conf: "verified" },
    "Q7.2": { value: "No", conf: "verified" },
    "Q7.3": { value: "German, French", conf: "verified" },
    "Q8.1": { value: "Yes — SSO provider (Okta)", conf: "verified" },
    "Q8.2": { value: "Detected internally; processor confirmed within 4h", conf: "verified" },
    "Q8.3": { value: "DPA: notification within 24h, written form, escalation to processor CISO", conf: "verified" },
    "Q8.4": { value: "No — controller", conf: "verified" },
    "Q8.5": { value: "No", conf: "verified" },
    "Q9.1": { value: "Germany (Berlin)", conf: "verified" },
    "Q9.2": { value: "Yes — France and Germany", conf: "verified" },
    "Q9.3": { value: "Lead authority: BfDI (main establishment in DE)", conf: "extracted" },
    "Q9.4": { value: "n/a (controller seated in EU)", conf: "verified" },
    "Q9.5": { value: "No third-country exposure", conf: "verified" },
    "Q10.1": { value: "Not in scope of NIS2", conf: "verified" },
    "Q10.2": { value: "n/a", conf: "verified" },
    "Q10.3": { value: "No active cyber policy", conf: "verified" },
    "Q10.4": { value: "n/a", conf: "verified" },
    "Q10.5": { value: "None identified", conf: "verified" },
    "Q11.1": { value: "Unlikely — no successful exfiltration evidenced", conf: "estimated" },
    "Q11.2": { value: "Not yet — internal counsel handling", conf: "verified" },
    "Q11.3": { value: "Pending decision", conf: "open" },
    "Q11.4": { value: "Not filed", conf: "verified" },
    "Q11.5": { value: "None", conf: "verified" },
    "Q12.1": { value: ["Logfiles", "Email correspondence (phishing samples)"], conf: "verified" },
    "Q12.2": { value: "Yes — SIEM evidence vault", conf: "verified" },
    "Q12.3": { value: "Yes", conf: "verified" },
    "Q12.4": { value: "Final account-by-account compromise list", conf: "open" },
  },

  "BR-2026-0037": {
    "Q0.1": { value: "Reported by sender ~55h ago", conf: "verified" },
    "Q0.2": { value: "Same as discovery — email sent and reported within minutes", conf: "verified" },
    "Q0.3": { value: "Reporting on behalf of the organisation", conf: "verified" },
    "Q0.4": { value: "Sales employee", conf: "verified" },
    "Q0.5": { value: "—", conf: "open" },
    "Q1.1": {
      value: "An employee accidentally emailed a customer list to the wrong external recipient.",
      conf: "verified",
    },
    "Q1.2": { value: ["Email / letter sent to wrong recipient"], conf: "verified" },
    "Q1.3": { value: ["Confidentiality"], conf: "extracted" },
    "Q1.4": { value: "Yes — recipient confirmed receipt and deletion", conf: "verified" },
    "Q2.1": { value: ["Name / contact data"], conf: "verified" },
    "Q2.2": { value: "Directly identifying (names only)", conf: "verified" },
    "Q2.3": { value: "n/a", conf: "verified" },
    "Q2.4": { value: "14 records", conf: "verified" },
    "Q3.1": { value: "< 10", conf: "verified" },
    "Q3.2": { value: ["Customers / general public", "B2B business partners"], conf: "verified" },
    "Q3.3": { value: "None of the listed sectors", conf: "verified" },
    "Q4.1": { value: ["No identifiable consequences"], conf: "extracted" },
    "Q4.2": { value: "Abstractly possible but unlikely", conf: "estimated" },
    "Q4.3": { value: "Not applicable — no harmful exposure", conf: "verified" },
    "Q5.1": { value: "n/a — email content, not encrypted in transit beyond TLS", conf: "verified" },
    "Q5.2": { value: "n/a", conf: "verified" },
    "Q5.3": { value: "n/a", conf: "verified" },
    "Q5.4": { value: "Internal DLP did not flag the recipient domain", conf: "verified" },
    "Q6.1": { value: ["Data recall / deletion confirmation from recipient"], conf: "verified" },
    "Q6.2": { value: "Known business partner", conf: "verified" },
    "Q6.3": { value: "Yes — written deletion confirmation received", conf: "verified" },
    "Q7.1": { value: "Yes — all 14 affected customers known", conf: "verified" },
    "Q7.2": { value: "No", conf: "verified" },
    "Q7.3": { value: "Italian", conf: "verified" },
    "Q8.1": { value: "No", conf: "verified" },
    "Q8.2": { value: "n/a", conf: "verified" },
    "Q8.3": { value: "n/a", conf: "verified" },
    "Q8.4": { value: "No", conf: "verified" },
    "Q8.5": { value: "No", conf: "verified" },
    "Q9.1": { value: "Italy (Milan)", conf: "verified" },
    "Q9.2": { value: "No", conf: "verified" },
    "Q9.3": { value: "n/a", conf: "verified" },
    "Q9.4": { value: "n/a", conf: "verified" },
    "Q9.5": { value: "None", conf: "verified" },
    "Q10.1": { value: "Not in scope", conf: "verified" },
    "Q10.2": { value: "n/a", conf: "verified" },
    "Q10.3": { value: "No", conf: "verified" },
    "Q10.4": { value: "n/a", conf: "verified" },
    "Q10.5": { value: "None", conf: "verified" },
    "Q11.1": { value: "Very unlikely", conf: "estimated" },
    "Q11.2": { value: "No", conf: "verified" },
    "Q11.3": { value: "No", conf: "verified" },
    "Q11.4": { value: "No", conf: "verified" },
    "Q11.5": { value: "None", conf: "verified" },
    "Q12.1": { value: ["Email correspondence", "Recipient deletion confirmation"], conf: "verified" },
    "Q12.2": { value: "Yes — archived in mail journaling", conf: "verified" },
    "Q12.3": { value: "Yes — Art. 33(5) internal record only", conf: "verified" },
    "Q12.4": { value: "None — case closed", conf: "verified" },
  },

  "BR-2026-0034": {
    "Q0.1": { value: "Detected by EDR ~82h ago", conf: "verified" },
    "Q0.2": { value: "Initial access ~6–12h prior to detection", conf: "estimated" },
    "Q0.3": { value: "Anonymous report (HinSchG channel)", conf: "verified" },
    "Q0.4": { value: "Not disclosed", conf: "verified" },
    "Q0.5": { value: "—", conf: "open" },
    "Q1.1": {
      value: "Ransomware encrypted a finance file share. No exfiltration confirmed but cannot be ruled out.",
      conf: "verified",
    },
    "Q1.2": { value: ["Malware / ransomware", "Hacker attack / unauthorised access"], conf: "verified" },
    "Q1.3": { value: ["Confidentiality", "Availability", "Unclear"], conf: "extracted" },
    "Q1.4": { value: "Unclear — investigation ongoing", conf: "open" },
    "Q2.1": { value: ["Bank / credit card / financial data", "Name / contact data"], conf: "verified" },
    "Q2.2": { value: "Directly identifying", conf: "verified" },
    "Q2.3": { value: "n/a", conf: "verified" },
    "Q2.4": { value: "≈ 2,200 records", conf: "estimated" },
    "Q3.1": { value: "1,000 – 10,000", conf: "estimated" },
    "Q3.2": { value: ["Customers / general public"], conf: "verified" },
    "Q3.3": { value: "Finance / banking / insurance", conf: "verified" },
    "Q4.1": {
      value: ["Identity theft / fraud", "Financial loss", "Loss of control over personal data"],
      conf: "extracted",
    },
    "Q4.2": { value: "Probable", conf: "estimated" },
    "Q4.3": { value: "Yes — card cancellation, account monitoring", conf: "verified" },
    "Q5.1": { value: "Partially — share-level encryption only; files unencrypted at rest", conf: "verified" },
    "Q5.2": { value: "Unclear — under forensic review", conf: "open" },
    "Q5.3": { value: "Yes — restorable but recovery > 72h", conf: "verified" },
    "Q5.4": { value: "MFA on admin accounts; segmentation partially effective", conf: "verified" },
    "Q6.1": {
      value: ["System isolated / taken offline", "Forensics engaged", "Insurance notified"],
      conf: "verified",
    },
    "Q6.2": { value: "n/a", conf: "verified" },
    "Q6.3": { value: "n/a", conf: "verified" },
    "Q7.1": { value: "Partially — customer base known, some contact details outdated", conf: "verified" },
    "Q7.2": { value: "Possibly — ~10% of records have stale contact data", conf: "estimated" },
    "Q7.3": { value: "Spanish, Dutch, English", conf: "verified" },
    "Q8.1": { value: "Yes — managed file-share provider", conf: "verified" },
    "Q8.2": { value: "Self-detected; processor confirmed", conf: "verified" },
    "Q8.3": { value: "DPA: notification without undue delay (≤24h), written form", conf: "verified" },
    "Q8.4": { value: "No — controller", conf: "verified" },
    "Q8.5": { value: "No", conf: "verified" },
    "Q9.1": { value: "Spain (Madrid)", conf: "verified" },
    "Q9.2": { value: "Yes — Spain and Netherlands", conf: "verified" },
    "Q9.3": { value: "Lead authority: AEPD (main establishment ES)", conf: "extracted" },
    "Q9.4": { value: "n/a (controller seated in EU)", conf: "verified" },
    "Q9.5": { value: "Backup vendor based in UK — UK GDPR notification under review", conf: "open" },
    "Q10.1": { value: "Yes — financial sector, NIS2 important entity", conf: "verified" },
    "Q10.2": { value: "Listed entity — MAR Art. 17 ad-hoc disclosure under review", conf: "open" },
    "Q10.3": { value: "Yes — cyber policy (notification deadline 24h, met)", conf: "verified" },
    "Q10.4": { value: "Yes — BaFin notification triggered (sector-specific)", conf: "verified" },
    "Q10.5": { value: "Customer contracts include incident notification clauses", conf: "extracted" },
    "Q11.1": { value: "Probable — class action exposure", conf: "estimated" },
    "Q11.2": { value: "Yes — external counsel mandated", conf: "verified" },
    "Q11.3": { value: "Yes — privilege tagging activated", conf: "verified" },
    "Q11.4": { value: "Filed (Spanish national police)", conf: "verified" },
    "Q11.5": { value: "None yet", conf: "verified" },
    "Q12.1": { value: ["Logfiles", "Forensic report (interim)", "Screenshots of ransom note"], conf: "verified" },
    "Q12.2": { value: "Yes — write-once forensic vault", conf: "verified" },
    "Q12.3": { value: "Yes", conf: "verified" },
    "Q12.4": { value: "Exfiltration confirmation, full affected count, root cause", conf: "open" },
  },

  "BR-2026-0029": {
    "Q0.1": { value: "Reported ~142h ago", conf: "verified" },
    "Q0.2": { value: "Theft occurred overnight before discovery", conf: "extracted" },
    "Q0.3": { value: "Reporting on behalf of the organisation", conf: "verified" },
    "Q0.4": { value: "Field employee", conf: "verified" },
    "Q0.5": { value: "—", conf: "open" },
    "Q1.1": {
      value: "A laptop was stolen from an employee's car. Disk was encrypted at rest.",
      conf: "verified",
    },
    "Q1.2": { value: ["Lost or stolen device / media"], conf: "verified" },
    "Q1.3": { value: ["Availability"], conf: "extracted" },
    "Q1.4": { value: "No — full-disk encryption blocks access; no evidence of decryption", conf: "verified" },
    "Q2.1": { value: ["Name / contact data"], conf: "verified" },
    "Q2.2": { value: "Directly identifying", conf: "verified" },
    "Q2.3": { value: "n/a", conf: "verified" },
    "Q2.4": { value: "3 records", conf: "verified" },
    "Q3.1": { value: "< 10", conf: "verified" },
    "Q3.2": { value: ["B2B business partners"], conf: "verified" },
    "Q3.3": { value: "None of the listed sectors", conf: "verified" },
    "Q4.1": { value: ["No identifiable consequences"], conf: "extracted" },
    "Q4.2": { value: "Abstractly possible but unlikely", conf: "estimated" },
    "Q4.3": { value: "n/a — no realistic risk", conf: "verified" },
    "Q5.1": { value: "Yes — AES-256 full-disk encryption (state of the art)", conf: "verified" },
    "Q5.2": { value: "Securely held by controller; not compromised", conf: "verified" },
    "Q5.3": { value: "Yes — current backup", conf: "verified" },
    "Q5.4": { value: "Remote-wipe issued; device reported in MDM", conf: "verified" },
    "Q6.1": { value: ["Credentials revoked / reset", "Police report filed"], conf: "verified" },
    "Q6.2": { value: "n/a", conf: "verified" },
    "Q6.3": { value: "n/a", conf: "verified" },
    "Q7.1": { value: "Yes — all 3 affected contacts known", conf: "verified" },
    "Q7.2": { value: "No", conf: "verified" },
    "Q7.3": { value: "French", conf: "verified" },
    "Q8.1": { value: "No", conf: "verified" },
    "Q8.2": { value: "n/a", conf: "verified" },
    "Q8.3": { value: "n/a", conf: "verified" },
    "Q8.4": { value: "No", conf: "verified" },
    "Q8.5": { value: "No", conf: "verified" },
    "Q9.1": { value: "France (Paris)", conf: "verified" },
    "Q9.2": { value: "No", conf: "verified" },
    "Q9.3": { value: "n/a", conf: "verified" },
    "Q9.4": { value: "n/a", conf: "verified" },
    "Q9.5": { value: "None", conf: "verified" },
    "Q10.1": { value: "Not in scope", conf: "verified" },
    "Q10.2": { value: "n/a", conf: "verified" },
    "Q10.3": { value: "No", conf: "verified" },
    "Q10.4": { value: "n/a", conf: "verified" },
    "Q10.5": { value: "None", conf: "verified" },
    "Q11.1": { value: "Very unlikely", conf: "estimated" },
    "Q11.2": { value: "No", conf: "verified" },
    "Q11.3": { value: "No", conf: "verified" },
    "Q11.4": { value: "Yes — police report filed", conf: "verified" },
    "Q11.5": { value: "None", conf: "verified" },
    "Q12.1": { value: ["Police report", "MDM remote-wipe log"], conf: "verified" },
    "Q12.2": { value: "Yes", conf: "verified" },
    "Q12.3": { value: "Yes — Art. 33(5) only", conf: "verified" },
    "Q12.4": { value: "None — case closed", conf: "verified" },
  },

  "BR-2026-0024": {
    "Q0.1": { value: "Discovered ~205h ago", conf: "verified" },
    "Q0.2": { value: "Bucket misconfigured for ~6 weeks before discovery", conf: "extracted" },
    "Q0.3": { value: "Reporting on behalf of the organisation", conf: "verified" },
    "Q0.4": { value: "DPO", conf: "verified" },
    "Q0.5": { value: "—", conf: "open" },
    "Q1.1": {
      value: "Vendor exposed biometric attendance data via an unsecured S3 bucket.",
      conf: "verified",
    },
    "Q1.2": { value: ["Data accidentally made publicly accessible"], conf: "verified" },
    "Q1.3": { value: ["Confidentiality"], conf: "extracted" },
    "Q1.4": { value: "Yes — bucket access logs show external scans", conf: "verified" },
    "Q2.1": { value: ["Biometric data (Art. 9)", "Name / contact data", "Employee data"], conf: "verified" },
    "Q2.2": { value: "Directly identifying (biometric template + employee ID)", conf: "verified" },
    "Q2.3": { value: "n/a", conf: "verified" },
    "Q2.4": { value: "≈ 460 templates", conf: "verified" },
    "Q3.1": { value: "100 – 1,000", conf: "verified" },
    "Q3.2": { value: ["Employees / applicants"], conf: "verified" },
    "Q3.3": { value: "None of the listed sectors", conf: "verified" },
    "Q4.1": {
      value: ["Loss of control over personal data", "Reversal of pseudonymisation", "Discrimination"],
      conf: "extracted",
    },
    "Q4.2": { value: "Plausible", conf: "estimated" },
    "Q4.3": { value: "No — biometric templates cannot be re-issued", conf: "verified" },
    "Q5.1": { value: "No — bucket contents unencrypted at rest", conf: "verified" },
    "Q5.2": { value: "n/a", conf: "verified" },
    "Q5.3": { value: "Yes — vendor maintains backup", conf: "verified" },
    "Q5.4": { value: "None effective — bucket public", conf: "verified" },
    "Q6.1": { value: ["System isolated / taken offline", "Forensics engaged"], conf: "verified" },
    "Q6.2": { value: "n/a — public exposure, not misdirected", conf: "verified" },
    "Q6.3": { value: "n/a", conf: "verified" },
    "Q7.1": { value: "Yes — all employees known", conf: "verified" },
    "Q7.2": { value: "No", conf: "verified" },
    "Q7.3": { value: "English", conf: "verified" },
    "Q8.1": { value: "Yes — attendance vendor (processor)", conf: "verified" },
    "Q8.2": { value: "Vendor reported (Art. 33(2))", conf: "verified" },
    "Q8.3": { value: "DPA: notification within 24h, written form", conf: "verified" },
    "Q8.4": { value: "No — controller", conf: "verified" },
    "Q8.5": { value: "No", conf: "verified" },
    "Q9.1": { value: "Ireland (Dublin)", conf: "verified" },
    "Q9.2": { value: "No — Irish employees only", conf: "verified" },
    "Q9.3": { value: "n/a (no cross-border)", conf: "verified" },
    "Q9.4": { value: "n/a", conf: "verified" },
    "Q9.5": { value: "Vendor based in US — SCCs in place", conf: "verified" },
    "Q10.1": { value: "Not in scope", conf: "verified" },
    "Q10.2": { value: "n/a", conf: "verified" },
    "Q10.3": { value: "No", conf: "verified" },
    "Q10.4": { value: "n/a", conf: "verified" },
    "Q10.5": { value: "Vendor contract obligation triggered", conf: "verified" },
    "Q11.1": { value: "Plausible — works council involvement", conf: "estimated" },
    "Q11.2": { value: "Yes — external counsel mandated", conf: "verified" },
    "Q11.3": { value: "Yes — privilege tagging activated", conf: "verified" },
    "Q11.4": { value: "No", conf: "verified" },
    "Q11.5": { value: "None", conf: "verified" },
    "Q12.1": { value: ["S3 access logs", "Vendor incident report"], conf: "verified" },
    "Q12.2": { value: "Yes — exported and hashed", conf: "verified" },
    "Q12.3": { value: "Yes", conf: "verified" },
    "Q12.4": { value: "None — DPC notification filed, case closed", conf: "verified" },
  },
};

// ---------- Schema definition (Block 0–12) ----------

const SCHEMA: Omit<ClassificationBlock, "fields"> &
  { fields: Omit<ClassificationField, "answer" | "confidence">[] }[] extends never ? never : never = null as never;

interface SchemaField {
  id: string;
  label: string;
  required: boolean;
  criterion?: string;
  sourceNote?: string;
}
interface SchemaBlock {
  id: string;
  title: string;
  subtitle?: string;
  fields: SchemaField[];
}

const BLOCKS: SchemaBlock[] = [
  {
    id: "block-0",
    title: "Block 0 — Contact & timestamps",
    fields: [
      { id: "Q0.1", label: "When was the incident first noticed?", required: true, sourceNote: "Starts the 72h clock under Art. 33(1) GDPR." },
      { id: "Q0.2", label: "When did the incident actually occur (best estimate)?", required: true },
      { id: "Q0.3", label: "Are you reporting for yourself, on behalf of the organisation, or anonymously?", required: true, sourceNote: "Routing reporter / DPO / whistleblower (HinSchG)." },
      { id: "Q0.4", label: "Your role in the organisation", required: false },
      { id: "Q0.5", label: "Ticket / case number from your internal system", required: false },
    ],
  },
  {
    id: "block-1",
    title: "Block 1 — What happened",
    subtitle: "Maps to criteria c11 (security breach) & c12 (breach success)",
    fields: [
      { id: "Q1.1", label: "Description of what happened (free text)", required: true, criterion: "c11" },
      { id: "Q1.2", label: "Nearest matching incident type(s)", required: true, criterion: "c11" },
      { id: "Q1.3", label: "Which protection goals were affected? (Confidentiality / Integrity / Availability)", required: true, criterion: "c21", sourceNote: "EDPB three-objective model." },
      { id: "Q1.4", label: "Is there concrete evidence of access — or only a vulnerability?", required: true, criterion: "c12", sourceNote: "EDPB: no access evidence ⇒ no notification trigger." },
    ],
  },
  {
    id: "block-2",
    title: "Block 2 — Data affected",
    subtitle: "Maps to criteria c22 & c23",
    fields: [
      { id: "Q2.1", label: "Categories of data affected", required: true, criterion: "c22" },
      { id: "Q2.2", label: "Identifiability (direct / pseudonymised / anonymised)", required: true, criterion: "c23" },
      { id: "Q2.3", label: "Are passwords hashed and salted to current standards?", required: false, criterion: "c23", sourceNote: "EDPB Case 6 — intact salt = no risk." },
      { id: "Q2.4", label: "Approximate number of records affected", required: false },
    ],
  },
  {
    id: "block-3",
    title: "Block 3 — Number of people affected",
    subtitle: "Maps to criteria c24 & c25",
    fields: [
      { id: "Q3.1", label: "How many natural persons are affected?", required: true, criterion: "c24" },
      { id: "Q3.2", label: "Vulnerable groups involved?", required: true, criterion: "c25" },
      { id: "Q3.3", label: "Special-sector processing?", required: true, criterion: "c25" },
    ],
  },
  {
    id: "block-4",
    title: "Block 4 — Possible consequences",
    subtitle: "Maps to criteria c26, c31, c32, c33",
    fields: [
      { id: "Q4.1", label: "Possible consequences for affected individuals (Recital 85)", required: true, criterion: "c26" },
      { id: "Q4.2", label: "Likelihood that those consequences materialise", required: true, criterion: "c31" },
      { id: "Q4.3", label: "Can affected individuals protect themselves once informed?", required: true, criterion: "c33", sourceNote: "Recital 86 + EDPB Case 7." },
    ],
  },
  {
    id: "block-5",
    title: "Block 5 — Protective measures (Art. 34(3)(a))",
    subtitle: "Maps to criterion c41",
    fields: [
      { id: "Q5.1", label: "Was the affected data encrypted?", required: true, criterion: "c41" },
      { id: "Q5.2", label: "Where is the encryption key held?", required: false, criterion: "c41" },
      { id: "Q5.3", label: "Backup availability", required: false },
      { id: "Q5.4", label: "Other technical/organisational measures that took effect", required: false },
    ],
  },
  {
    id: "block-6",
    title: "Block 6 — Follow-up actions (Art. 34(3)(b))",
    subtitle: "Maps to criterion c42",
    fields: [
      { id: "Q6.1", label: "Immediate actions already taken", required: true, criterion: "c42" },
      { id: "Q6.2", label: "If a wrong recipient was involved — who?", required: false, criterion: "c42", sourceNote: "EDPB Case 9 — professional confidant ⇒ no risk." },
      { id: "Q6.3", label: "Has the recipient confirmed deletion?", required: false, criterion: "c42" },
    ],
  },
  {
    id: "block-7",
    title: "Block 7 — Addressability of affected persons (Art. 34(3)(c))",
    subtitle: "Maps to criterion c43",
    fields: [
      { id: "Q7.1", label: "Can affected persons be identified individually?", required: true, criterion: "c43" },
      { id: "Q7.2", label: "Would individual notification be disproportionate effort?", required: false, criterion: "c43" },
      { id: "Q7.3", label: "Languages required for notification", required: false },
    ],
  },
  {
    id: "block-8",
    title: "Block 8 — Processor & supply-chain context",
    fields: [
      { id: "Q8.1", label: "Was a processor involved?", required: true },
      { id: "Q8.2", label: "Did the processor report it, or did you detect it?", required: false, sourceNote: "Art. 33(2) processor duty." },
      { id: "Q8.3", label: "Contractual notification clauses in the DPA", required: false },
      { id: "Q8.4", label: "Are you acting as processor for someone else?", required: true },
      { id: "Q8.5", label: "Joint controller arrangement (Art. 26)?", required: false },
    ],
  },
  {
    id: "block-9",
    title: "Block 9 — Cross-border (One-Stop-Shop)",
    fields: [
      { id: "Q9.1", label: "Where is your organisation seated?", required: true },
      { id: "Q9.2", label: "Are affected individuals in multiple EU member states?", required: true },
      { id: "Q9.3", label: "Lead supervisory authority (Art. 56)", required: false },
      { id: "Q9.4", label: "Art. 27 representative (if seat outside EU)", required: false },
      { id: "Q9.5", label: "Third-country exposure (UK GDPR, Swiss revFADP, US states)", required: false },
    ],
  },
  {
    id: "block-10",
    title: "Block 10 — Parallel regulatory regimes",
    fields: [
      { id: "Q10.1", label: "Is the organisation in scope of NIS2?", required: true, sourceNote: "§32 BSIG-neu — 24h early warning." },
      { id: "Q10.2", label: "Inside information under Art. 7 MAR (if listed)?", required: false },
      { id: "Q10.3", label: "Cyber insurance — notification deadline?", required: true },
      { id: "Q10.4", label: "Sector-specific reporting obligations", required: false },
      { id: "Q10.5", label: "Contractual information duties to partners / customers", required: false },
    ],
  },
  {
    id: "block-11",
    title: "Block 11 — Litigation & evidence preservation",
    fields: [
      { id: "Q11.1", label: "Likelihood of later civil claims (Art. 82)?", required: true },
      { id: "Q11.2", label: "External counsel mandated?", required: true },
      { id: "Q11.3", label: "Mark content as privileged from now on?", required: true, sourceNote: "§43a BRAO, §203 StGB." },
      { id: "Q11.4", label: "Criminal complaint filed?", required: false },
      { id: "Q11.5", label: "Supervisory directive on evidence preservation?", required: false },
    ],
  },
  {
    id: "block-12",
    title: "Block 12 — Documentation status",
    fields: [
      { id: "Q12.1", label: "Available evidence", required: true },
      { id: "Q12.2", label: "Is the evidence tamper-proof (hashed, sealed)?", required: true },
      { id: "Q12.3", label: "Recorded in the internal incident register (Art. 33(5))?", required: true },
      { id: "Q12.4", label: "Open fields still to be supplied", required: true, sourceNote: "Art. 33(4) staged notification." },
    ],
  },
];

export function getClassificationForIncident(
  incident: Pick<Incident, "id">,
): ClassificationBlock[] {
  const answers = ANSWERS_BY_INCIDENT[incident.id] ?? {};
  return BLOCKS.map((b) => ({
    id: b.id,
    title: b.title,
    subtitle: b.subtitle,
    fields: b.fields.map((f) => {
      const a = answers[f.id];
      return {
        id: f.id,
        label: f.label,
        required: f.required,
        criterion: f.criterion,
        sourceNote: f.sourceNote,
        answer: a?.value ?? null,
        confidence: a?.conf ?? "open",
      };
    }),
  }));
}

export const CLASSIFICATION_BLOCKS_META = BLOCKS;
