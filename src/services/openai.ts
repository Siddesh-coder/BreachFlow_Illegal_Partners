// AI client (browser-side).
// Calls our `ai-proxy` edge function, which forwards the request to Google's
// Gemini API server-side. The Gemini API key lives in Supabase secrets and is
// never exposed to the browser. Function names and message shapes are kept
// stable so the rest of the app does not need to change.

import { supabase } from "@/integrations/supabase/client";
import { ariaSkillDocument } from "@/data/ariaSkillDocument";
import { legalKnowledge } from "@/data/legalKnowledge";
import { nis2Knowledge } from "@/data/nis2Knowledge";

export const ARIA_DEFAULT_MODEL = "gemini-1.5-flash";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
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

function toGeminiPayload(
  messages: ChatMessage[],
  opts?: { jsonMode?: boolean; temperature?: number; model?: string },
) {
  const systemText = messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .join("\n\n");

  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  const payload: any = {
    model: opts?.model ?? ARIA_DEFAULT_MODEL,
    contents,
    generationConfig: {
      temperature: opts?.temperature ?? 0.4,
    },
  };
  if (systemText) {
    payload.systemInstruction = { parts: [{ text: systemText }] };
  }
  if (opts?.jsonMode) {
    payload.generationConfig.responseMimeType = "application/json";
  }
  return payload;
}

async function invokeProxy(payload: any): Promise<any | null> {
  const { data, error } = await supabase.functions.invoke("ai-proxy", {
    body: payload,
  });
  if (error) {
    console.warn("[ai-proxy] error", error);
    return null;
  }
  return data;
}

/* ------------------------------------------------------------------ */
/* Non-streaming completion                                            */
/* ------------------------------------------------------------------ */

export async function chatCompletion(
  messages: ChatMessage[],
  model = ARIA_DEFAULT_MODEL,
  opts?: { jsonMode?: boolean; temperature?: number },
): Promise<string | null> {
  const data = await invokeProxy(toGeminiPayload(messages, { ...opts, model }));
  if (!data) return null;
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
}

/* ------------------------------------------------------------------ */
/* "Streaming" — single delta surfaced from a non-streaming call      */
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
  const data = await invokeProxy(
    toGeminiPayload(messages, { temperature: opts.temperature, model: opts.model }),
  );
  const full: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  if (full) opts.onDelta(full);
  opts.onDone?.(full);
  return full;
}
