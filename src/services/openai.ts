// Gemini client (browser-side).
// Despite the filename, this module now wraps Google's Gemini API
// (gemini-1.5-flash). Function names and message shapes are kept stable
// so the rest of the app (Employee.tsx etc.) does not need to change.

import { ariaSkillDocument } from "@/data/ariaSkillDocument";
import { legalKnowledge } from "@/data/legalKnowledge";
import { nis2Knowledge } from "@/data/nis2Knowledge";

export const ARIA_DEFAULT_MODEL = "gemini-1.5-flash";

const GEMINI_ENDPOINT = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${localStorage.getItem("GEMINI_API_KEY") ?? ""}`;

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

function getKey(): string {
  return localStorage.getItem("GEMINI_API_KEY") || "";
}

/* ------------------------------------------------------------------ */
/* SYSTEM PROMPT — built from skill document + legal knowledge bases  */
/* ------------------------------------------------------------------ */

export function getAriaSystemPrompt(): string {
  const skill: any = ariaSkillDocument;
  const legal: any = legalKnowledge;
  const nis2: any = nis2Knowledge;

  const coreRules = (skill?.coreRules ?? []).map((r: string) => `- ${r}`).join("\n");
  const intake = JSON.stringify(skill?.intakeQuestions ?? [], null, 0);
  const indicatorCriteria = JSON.stringify(skill?.indicatorCriteria ?? {}, null, 0);
  const articles = JSON.stringify(legal?.keyArticles ?? {}, null, 0);
  const nis2Scope = JSON.stringify(nis2?.scopeClassification ?? {}, null, 0);

  return `You are ARIA, an EU GDPR + NIS2 data breach intake assistant for BreachGuard.
Your job is to interview an employee who has just discovered a possible incident, gather the facts a DPO needs, and stay strictly factual — never give legal advice.

## Behavior rules
- Ask ONE question at a time. Wait for the answer before continuing.
- Be calm, professional, plain-language. Assume the reporter is not a lawyer.
- If an answer is vague, push back once politely, then move on.
- If the user says "I don't know" or similar, acknowledge it, mark the field as unknown, and continue.
- Never alarm the user. Never say "you must notify" — that is the DPO/Legal Counsel's call.
- When citing law, cite the article (e.g. "GDPR Art. 33") but do not interpret it.
- Use short messages. Markdown is fine (bold, lists). No code blocks unless quoting data.

## Core skill rules
${coreRules}

## Intake questions (use as a checklist — adapt order based on conversation)
${intake}

## Indicator criteria you are listening for
${indicatorCriteria}

## Reference: GDPR articles (for citation only)
${articles}

## Reference: NIS2 scope
${nis2Scope}

## Completion protocol — VERY IMPORTANT
When you have collected enough information across these required fields:
  discoveredAt, dataTypes, affectedCount, whatHappened, countries, contained
…ask the user one final confirming question ("Is there anything else I should know?"), then on the NEXT turn output EXACTLY this marker on its own line followed by nothing else from you in that turn:

<<<INTAKE_COMPLETE>>>

Do not explain the marker. Do not output JSON yourself — the system will extract structured data from the conversation. Just stop the interview cleanly with that marker.`;
}

/* ------------------------------------------------------------------ */
/* Helpers — convert OpenAI-style messages → Gemini request body      */
/* ------------------------------------------------------------------ */

function toGeminiBody(messages: ChatMessage[], opts?: { jsonMode?: boolean; temperature?: number }) {
  // Merge all system messages into a single systemInstruction
  const systemText = messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .join("\n\n");

  // Map remaining turns; Gemini uses 'user' and 'model'
  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  const body: any = {
    contents,
    generationConfig: {
      temperature: opts?.temperature ?? 0.4,
    },
  };
  if (systemText) {
    body.systemInstruction = { parts: [{ text: systemText }] };
  }
  if (opts?.jsonMode) {
    body.generationConfig.responseMimeType = "application/json";
  }
  return body;
}

/* ------------------------------------------------------------------ */
/* Non-streaming completion                                            */
/* ------------------------------------------------------------------ */

export async function chatCompletion(
  messages: ChatMessage[],
  model = ARIA_DEFAULT_MODEL,
  opts?: { jsonMode?: boolean; temperature?: number },
): Promise<string | null> {
  const key = getKey();
  if (!key) return null;
  try {
    const res = await fetch(GEMINI_ENDPOINT(model), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toGeminiBody(messages, opts)),
    });
    if (!res.ok) {
      console.warn("[Gemini] error", res.status, await res.text());
      return null;
    }
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
  } catch (err) {
    console.warn("[Gemini] chatCompletion failed", err);
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* "Streaming" — Gemini non-streaming call surfaced as a single delta */
/* ------------------------------------------------------------------ */

export async function streamChatCompletion(
  messages: ChatMessage[],
  opts: {
    model?: string;
    temperature?: number;
    onDelta: (chunk: string) => void;
    onDone?: (full: string) => void;
    signal?: AbortSignal;
  },
): Promise<string> {
  const key = getKey();
  if (!key) {
    opts.onDone?.("");
    return "";
  }

  const res = await fetch(GEMINI_ENDPOINT(opts.model ?? ARIA_DEFAULT_MODEL), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toGeminiBody(messages, { temperature: opts.temperature })),
    signal: opts.signal,
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.warn("[Gemini] error", res.status, errText);
    throw new Error(`Gemini error ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  const full: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  if (full) opts.onDelta(full);
  opts.onDone?.(full);
  return full;
}
