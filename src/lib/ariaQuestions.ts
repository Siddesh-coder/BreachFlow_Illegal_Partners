import type { DataType, EUCountry } from "@/types/incident";

export type QuestionId = "discoveredAt" | "dataTypes" | "affectedCount" | "whatHappened" | "countries" | "contained" | "additionalNotes";

export type QuestionKind = "datetime" | "checkboxes" | "number" | "text-with-hints" | "multi-select" | "yes-no" | "text-optional";

export interface Question {
  id: QuestionId;
  prompt: string;
  kind: QuestionKind;
  options?: string[];
  optional?: boolean;
}

export const QUESTIONS: Question[] = [
  { id: "discoveredAt", prompt: "When did you or your team first become aware of this incident?", kind: "datetime" },
  {
    id: "dataTypes",
    prompt: "What type of data was involved?",
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
  { id: "affectedCount", prompt: "Approximately how many people are affected?", kind: "number" },
  {
    id: "whatHappened",
    prompt: "What do you believe happened?",
    kind: "text-with-hints",
    options: ["Unauthorized Access", "Ransomware", "Lost/Stolen Device", "Accidental Disclosure", "Phishing", "Other"],
  },
  {
    id: "countries",
    prompt: "Which EU countries are affected?",
    kind: "multi-select",
    options: ["Germany", "France", "Italy", "Spain", "Netherlands", "Ireland", "Sweden", "Poland", "Other EU"] satisfies EUCountry[],
  },
  { id: "contained", prompt: "Has this breach been contained?", kind: "yes-no" },
  { id: "additionalNotes", prompt: "Is there anything else you think we should know?", kind: "text-optional", optional: true },
];
