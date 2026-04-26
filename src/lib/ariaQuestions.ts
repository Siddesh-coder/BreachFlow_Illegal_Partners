import type { DataType, EUCountry } from "@/types/incident";

export type QuestionId =
  | "discoveredAt"
  | "incidentTime"
  | "whatHappened"
  | "systemsAffected"
  | "dataTypes"
  | "affectedCount"
  | "actionsTaken"
  | "dataExfiltration"
  | "ongoing"
  | "whoKnows";

export type QuestionKind =
  | "datetime"
  | "text"
  | "text-with-hints"
  | "checkboxes"
  | "number"
  | "yes-no"
  | "text-optional";

export interface Question {
  id: QuestionId;
  prompt: string;
  rationale: string;
  kind: QuestionKind;
  options?: string[];
  optional?: boolean;
}

/**
 * ARIA scripted intake — 10 questions, fixed order.
 * Grouped by theme: Discovery & Timing → What Happened → Data Affected →
 * Actions Taken → Exposure & Containment → People & Accountability.
 */
export const QUESTIONS: Question[] = [
  // DISCOVERY & TIMING
  {
    id: "discoveredAt",
    prompt: "When did you first notice something was wrong, and how did you notice it?",
    rationale: "Sets the discovery timestamp — the clock for all regulatory deadlines starts here.",
    kind: "datetime",
  },
  {
    id: "incidentTime",
    prompt:
      "Do you know when the incident actually occurred — or began — even if that's earlier than when you discovered it?",
    rationale:
      "Distinguishes discovery time from incident time; relevant for scope and forensics.",
    kind: "text",
  },

  // WHAT HAPPENED
  {
    id: "whatHappened",
    prompt:
      "What happened, as best you can describe it? (e.g. phishing link clicked, unauthorised login, file sent to the wrong person, ransomware message on screen)",
    rationale:
      "Free-text incident description; drives initial indicator computation and process selection.",
    kind: "text-with-hints",
    options: [
      "Phishing",
      "Unauthorized Access",
      "Ransomware",
      "Lost/Stolen Device",
      "Accidental Disclosure",
      "Other",
    ],
  },
  {
    id: "systemsAffected",
    prompt: "Which systems, applications, or devices are involved or potentially affected?",
    rationale: "Feeds asset inventory cross-check and helps scope the forensic snapshot.",
    kind: "text",
  },

  // DATA AFFECTED
  {
    id: "dataTypes",
    prompt:
      "What type of data do you think was involved? (e.g. customer names and emails, employee records, health data, payment data, passwords)",
    rationale:
      "Data category drives Art. 9 / high-risk indicators — the most consequential legal input.",
    kind: "checkboxes",
    options: [
      "Personal Identifiers",
      "Financial Data",
      "Health/Medical Records",
      "Login Credentials",
      "Biometric Data",
      "Special Category Data",
    ] satisfies DataType[],
  },
  {
    id: "affectedCount",
    prompt: "Roughly how many people's data may be affected, even as a ballpark?",
    rationale:
      "Volume is a key Art. 33/34 indicator; even a rough estimate is better than 'unknown'.",
    kind: "number",
  },

  // ACTIONS ALREADY TAKEN
  {
    id: "actionsTaken",
    prompt:
      "Have you or anyone else already done anything in response — changed passwords, disconnected a device, deleted files, notified anyone?",
    rationale:
      "Critical for evidence preservation: actions taken before forensic snapshot can destroy evidence.",
    kind: "text",
  },

  // EXPOSURE & CONTAINMENT
  {
    id: "dataExfiltration",
    prompt:
      "Is there any indication that data has left the organisation — downloaded, forwarded externally, or accessed by someone who should not have access?",
    rationale:
      "Determines confidentiality breach vs. availability/integrity only; shapes notification threshold.",
    kind: "text",
  },
  {
    id: "ongoing",
    prompt:
      "Is the incident still ongoing — do you believe the threat is still active or the unauthorised access is still possible?",
    rationale:
      "Determines urgency of containment and whether the forensic snapshot window is already closing.",
    kind: "yes-no",
  },

  // PEOPLE & ACCOUNTABILITY
  {
    id: "whoKnows",
    prompt: "Who else already knows about this, inside or outside the organisation?",
    rationale:
      "Maps awareness, flags potential disclosure leaks, and identifies who may need to be contacted or cautioned.",
    kind: "text",
  },
];

// Convenience: numbered list for system prompt embedding.
export const QUESTIONS_AS_NUMBERED_LIST = QUESTIONS.map(
  (q, i) => `${i + 1}. ${q.prompt}`,
).join("\n");
