// OpenAI client (browser-side, key from localStorage).
// NOTE: This calls OpenAI directly per spec. Keys live in localStorage only.

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

const ARIA_SYSTEM_PROMPT = `You are ARIA, an EU GDPR data breach response AI agent for BreachGuard.
You guide employees through reporting a data breach step by step.
Ask ONE question at a time. Be calm, professional, and clear.
Use plain language — assume the reporter is not a legal expert.
If an answer is vague or incomplete, politely push back once and ask for clarification.
If user says "I don't know", acknowledge it, mark it as unknown, and move on.
Never alarm the user. Never give legal advice directly.
Your goal is to collect enough information for the DPO to act.

// SKILL_DOCUMENT_PLACEHOLDER
// This file will contain detailed guidelines on:
// - Exact questions to ask
// - Question boundaries and limits
// - Follow-up logic
// - Push-back rules for unsatisfactory answers
// Replace this placeholder with the actual skill document content.`;

export function getAriaSystemPrompt() {
  return ARIA_SYSTEM_PROMPT;
}

export async function chatCompletion(
  messages: ChatMessage[],
  model = "gpt-4o",
): Promise<string | null> {
  const key = localStorage.getItem("OPENAI_API_KEY");
  if (!key) {
    console.warn("[OpenAI] missing API key");
    return null;
  }
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.4,
      }),
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
