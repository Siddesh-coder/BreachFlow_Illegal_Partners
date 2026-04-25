// OpenAI client (browser-side).
// NOTE: A default OpenAI key is bundled for ARIA. User-provided keys in
// localStorage take precedence so individual users can override.

import { ariaSkillDocument } from "@/data/ariaSkillDocument";
import { legalKnowledge } from "@/data/legalKnowledge";
import { nis2Knowledge } from "@/data/nis2Knowledge";

export const DEFAULT_OPENAI_KEY =
  "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";

export const ARIA_DEFAULT_MODEL = "gpt-4o-mini";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

function getKey(): string {
  return localStorage.getItem("OPENAI_API_KEY") || DEFAULT_OPENAI_KEY;
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
/* Non-streaming completion (kept for legacy / structured extraction) */
/* ------------------------------------------------------------------ */

export async function chatCompletion(
  messages: ChatMessage[],
  model = ARIA_DEFAULT_MODEL,
  opts?: { jsonMode?: boolean; temperature?: number },
): Promise<string | null> {
  const key = getKey();
  if (!key) return null;
  try {
    const body: any = {
      model,
      messages,
      temperature: opts?.temperature ?? 0.4,
    };
    if (opts?.jsonMode) body.response_format = { type: "json_object" };

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.warn("[OpenAI] error", res.status, await res.text());
      return null;
    }
    const data = await res.json();
    return data?.choices?.[0]?.message?.content ?? null;
  } catch (err) {
    console.warn("[OpenAI] chatCompletion failed", err);
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Streaming chat completion                                           */
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

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: opts.model ?? ARIA_DEFAULT_MODEL,
      messages,
      temperature: opts.temperature ?? 0.4,
      stream: true,
    }),
    signal: opts.signal,
  });

  if (!res.ok || !res.body) {
    const errText = await res.text().catch(() => "");
    console.warn("[OpenAI] stream error", res.status, errText);
    throw new Error(`OpenAI error ${res.status}: ${errText.slice(0, 200)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";
  let done = false;

  while (!done) {
    const { done: streamDone, value } = await reader.read();
    if (streamDone) break;
    buffer += decoder.decode(value, { stream: true });

    let nl: number;
    while ((nl = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, nl);
      buffer = buffer.slice(nl + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line.startsWith("data: ")) continue;

      const payload = line.slice(6).trim();
      if (payload === "[DONE]") { done = true; break; }

      try {
        const parsed = JSON.parse(payload);
        const delta = parsed?.choices?.[0]?.delta?.content;
        if (typeof delta === "string" && delta.length > 0) {
          full += delta;
          opts.onDelta(delta);
        }
      } catch {
        // partial JSON — re-buffer and wait for more
        buffer = line + "\n" + buffer;
        break;
      }
    }
  }

  opts.onDone?.(full);
  return full;
}
