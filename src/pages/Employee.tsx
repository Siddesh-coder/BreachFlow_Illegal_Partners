import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { ArrowUp } from "lucide-react";
import { Wordmark } from "@/components/Wordmark";
import { useApp } from "@/state/AppContext";
import {
  chatCompletion,
  getAriaSystemPrompt,
  streamChatCompletion,
  type ChatMessage as AiMessage,
} from "@/services/openai";
import { queryLegalHub } from "@/services/legalDataHub";
import { calcSeverity, AUTHORITY_BY_COUNTRY, generateRefId } from "@/lib/risk";
import type { DataType, EUCountry, Incident } from "@/types/incident";
import { cn } from "@/lib/utils";

interface ChatTurn {
  id: string;
  role: "aria" | "user";
  content: string;
}

const DATA_TYPE_OPTIONS: DataType[] = [
  "Personal Identifiers",
  "Financial Data",
  "Health/Medical Records",
  "Login Credentials",
  "Biometric Data",
  "Special Category Data",
];

const COUNTRY_OPTIONS: EUCountry[] = [
  "Germany", "France", "Italy", "Spain", "Netherlands",
  "Ireland", "Sweden", "Poland", "Other EU",
];

const COMPLETION_MARKER = "<<<INTAKE_COMPLETE>>>";

const Employee = () => {
  const navigate = useNavigate();
  const { user, isAnonymous, addIncident, addAudit } = useApp();

  const [chat, setChat] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ ref: string } | null>(null);

  const chatScrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const initialised = useRef(false);

  // Redirect if not signed in / anonymous
  useEffect(() => {
    if (!user && !isAnonymous) navigate("/auth");
  }, [user, isAnonymous, navigate]);

  // Build the seed system prompt
  const systemPrompt = useMemo(() => {
    const intro = user
      ? `\n\n## Reporter context\nName: ${user.name}\nEmail: ${user.email}\nReporting anonymously: no.`
      : `\n\n## Reporter context\nReporting anonymously: yes (do not ask for the reporter's name).`;
    return getAriaSystemPrompt() + intro;
  }, [user]);

  // Kick off the conversation with a streamed greeting from GPT
  useEffect(() => {
    if (initialised.current) return;
    if (!user && !isAnonymous) return;
    initialised.current = true;

    const greetingPrompt: AiMessage[] = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content:
          "[SYSTEM] Begin the intake. Greet the reporter briefly (one short paragraph), explain what you'll do, then ask your first question (when did they discover the incident?). Do not list all the questions up front.",
      },
    ];
    void streamAria(greetingPrompt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [systemPrompt, user, isAnonymous]);

  // Auto-scroll chat
  useEffect(() => {
    chatScrollRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [chat, streaming]);

  /* ------------------------------------------------------------------ */
  /* Conversation engine                                                 */
  /* ------------------------------------------------------------------ */

  const buildHistoryForApi = (extraUser?: string): AiMessage[] => {
    const history: AiMessage[] = chat.map((t) => ({
      role: t.role === "aria" ? "assistant" : "user",
      content: t.content,
    }));
    if (extraUser) history.push({ role: "user", content: extraUser });
    return [{ role: "system", content: systemPrompt }, ...history];
  };

  const streamAria = async (messages: AiMessage[]) => {
    setStreaming(true);
    const turnId = `aria-${Date.now()}`;
    setChat((prev) => [...prev, { id: turnId, role: "aria", content: "" }]);

    let acc = "";
    try {
      acc = await streamChatCompletion(messages, {
        onDelta: (chunk) => {
          acc += chunk;
          // strip the marker from anything we render
          const visible = acc.replace(COMPLETION_MARKER, "").trimEnd();
          setChat((prev) =>
            prev.map((t) => (t.id === turnId ? { ...t, content: visible } : t)),
          );
        },
      });
    } catch (err: any) {
      const fallback =
        "Sorry — I couldn't reach the AI service. Please check the API key in Settings and try again.";
      setChat((prev) =>
        prev.map((t) => (t.id === turnId ? { ...t, content: fallback } : t)),
      );
      console.warn("[ARIA] stream failed", err);
      setStreaming(false);
      return;
    }

    setStreaming(false);

    // Detect completion marker → finalize and submit
    if (acc.includes(COMPLETION_MARKER)) {
      // remove the empty bubble if GPT only emitted the marker
      const visible = acc.replace(COMPLETION_MARKER, "").trim();
      setChat((prev) =>
        prev
          .map((t) =>
            t.id === turnId
              ? {
                  ...t,
                  content:
                    visible ||
                    "Thank you. I have everything I need — preparing the report for your DPO now…",
                }
              : t,
          ),
      );
      await finalizeAndSubmit();
    }
  };

  const sendUser = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || streaming || submitting) return;
    const userTurn: ChatTurn = {
      id: `u-${Date.now()}`,
      role: "user",
      content: trimmed,
    };
    setChat((prev) => [...prev, userTurn]);
    setInput("");
    const apiMessages = buildHistoryForApi(trimmed);
    await streamAria(apiMessages);
  };

  /* ------------------------------------------------------------------ */
  /* Final structured extraction → create Incident                       */
  /* ------------------------------------------------------------------ */

  const finalizeAndSubmit = async () => {
    setSubmitting(true);

    // Build full transcript for extraction
    const transcript = chat
      .map((t) => `${t.role === "aria" ? "ARIA" : "REPORTER"}: ${t.content}`)
      .join("\n");

    const extractionSystem = `You convert a breach intake conversation into structured JSON.
Extract ONLY what was actually stated. Use null/empty arrays for unknowns. Never invent.

Return JSON with EXACTLY this shape:
{
  "discoveredAt": "ISO 8601 string or null",
  "dataTypes": ["one or more of: ${DATA_TYPE_OPTIONS.join(", ")}"],
  "affectedCount": number | null,
  "whatHappened": "one-paragraph factual description",
  "incidentCategory": "Unauthorized Access | Ransomware | Lost/Stolen Device | Accidental Disclosure | Phishing | Other",
  "countries": ["EU country names from: ${COUNTRY_OPTIONS.join(", ")}"],
  "contained": true | false | null,
  "additionalNotes": "string, may be empty",
  "summary": "one-sentence English summary of the incident",
  "verdict": "likely | possibly | not",
  "reasoning": ["up to 3 short legal-reasoning bullets citing GDPR articles"],
  "steps": [{ "title": "short action title", "description": "what the DPO should do" }]
}`;

    let parsed: any = null;
    try {
      const raw = await chatCompletion(
        [
          { role: "system", content: extractionSystem },
          {
            role: "user",
            content: `Transcript:\n\n${transcript}\n\nReturn JSON only.`,
          },
        ],
        "gemini-1.5-flash",
        { jsonMode: true, temperature: 0.1 },
      );
      if (raw) parsed = JSON.parse(raw);
    } catch (err) {
      console.warn("[ARIA] extraction failed", err);
    }

    // Sensible fallbacks if extraction fails
    parsed = parsed ?? {};
    const dataTypes: DataType[] = (parsed.dataTypes ?? []).filter((d: string) =>
      DATA_TYPE_OPTIONS.includes(d as DataType),
    ) as DataType[];
    const countries: EUCountry[] = (parsed.countries ?? []).filter((c: string) =>
      COUNTRY_OPTIONS.includes(c as EUCountry),
    ) as EUCountry[];
    const affectedCount =
      typeof parsed.affectedCount === "number" ? parsed.affectedCount : null;
    const discoveredAt = parsed.discoveredAt
      ? new Date(parsed.discoveredAt).toISOString()
      : new Date().toISOString();
    const sev = calcSeverity(dataTypes, affectedCount);
    const primaryCountry = countries[0] ?? "Other EU";
    const authority = AUTHORITY_BY_COUNTRY[primaryCountry];
    const ref = generateRefId();

    // Otto Schmidt query (best effort, not blocking)
    const summaryDe = `Datenschutzvorfall: ${parsed.whatHappened ?? "unbekannt"}. Datenarten: ${dataTypes.join(", ")}. Betroffene: ${affectedCount ?? "unbekannt"}. Länder: ${countries.join(", ")}.`;
    void queryLegalHub(`Welche DSGVO-Meldepflichten gelten bei: ${summaryDe}?`);

    const steps = Array.isArray(parsed.steps) && parsed.steps.length
      ? parsed.steps
      : [
          { title: "Notify IT Security Team", description: "Engage InfoSec to confirm containment and preserve evidence." },
          { title: "Notify Legal Department", description: "Brief in-house counsel on Art. 33/34 obligations." },
          { title: "Risk Assessment", description: "Determine likelihood and severity of impact on data subjects." },
          { title: "Document in Audit Trail", description: "Capture decisions, communications, and timestamps." },
        ];

    const incident: Incident = {
      id: ref,
      reportedAt: new Date().toISOString(),
      discoveredAt,
      reporterName: isAnonymous ? null : user?.name ?? null,
      isAnonymous,
      dataTypes,
      affectedCount,
      whatHappened: parsed.whatHappened ?? "",
      incidentCategory: parsed.incidentCategory ?? "Other",
      countries,
      contained: typeof parsed.contained === "boolean" ? parsed.contained : null,
      additionalNotes: parsed.additionalNotes ?? "",
      severity: sev,
      status: "new",
      aiSummary:
        parsed.summary ??
        `${dataTypes.join(", ") || "Personal data"} incident affecting ${affectedCount ?? "an unknown number of"} people in ${countries.join(", ") || "EU"}.`,
      notifiability: {
        verdict:
          (parsed.verdict as any) ??
          (sev === "high" ? "likely" : sev === "medium" ? "possibly" : "not"),
        reasoning: Array.isArray(parsed.reasoning) && parsed.reasoning.length
          ? parsed.reasoning
          : ["Indicators captured during intake; full assessment pending DPO review."],
        authority,
      },
      recommendations: steps.map((s: any, i: number) => ({
        id: `s${i + 1}`,
        title: s.title?.startsWith?.("Step") ? s.title : `Step ${i + 1} — ${s.title ?? "Action"}`,
        description: s.description ?? "",
        status: "not_started" as const,
      })),
    };

    addIncident(incident);
    addAudit({ incidentId: ref, actor: "Employee", action: "Breach discovered", ts: discoveredAt });
    addAudit({ incidentId: ref, actor: "Employee", action: "Report submitted via ARIA chat" });
    addAudit({ incidentId: ref, actor: "ARIA", action: "AI conversation transcript captured" });
    addAudit({ incidentId: ref, actor: "ARIA", action: "Structured intake extracted via GPT" });

    setSubmitting(false);
    setDone({ ref });
  };

  /* ------------------------------------------------------------------ */
  /* Render                                                              */
  /* ------------------------------------------------------------------ */

  if (done) {
    return (
      <div className="app-light-shell min-h-screen bg-background flex flex-col">
        <header className="flex items-center justify-between px-10 py-8">
          <Wordmark size={20} />
          <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Confidential intake</span>
        </header>
        <main className="flex-1 flex items-center justify-center px-6 animate-fade-in-slow">
          <div className="text-center max-w-[640px]">
            <h1 className="font-serif text-[44px] sm:text-[48px] leading-tight">Report Submitted.</h1>
            <p className="mt-6 text-base text-muted-foreground">
              Your Data Protection Officer has been notified. Reference: <span className="text-foreground">#{done.ref}</span>
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              {isAnonymous ? "Your report has been received anonymously." : `Thank you, ${user?.name ?? ""}.`}
            </p>
            <p className="mt-12 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              You may close this window.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-light-shell min-h-screen bg-background flex flex-col">
      <header className="flex items-center justify-between px-10 py-4 border-b border-border sticky top-0 bg-background z-10">
        <Wordmark size={20} />
        <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Employee Portal</span>
      </header>

      <div className="flex flex-col items-center">
        <div className="w-full max-w-[760px] px-6 pt-5 pb-10">
          <div className="flex flex-col" style={{ height: "calc(100vh - 140px)" }}>
            {/* Header */}
            <div className="flex items-end justify-between mb-4 shrink-0">
              <div>
                <div className="font-serif text-xl leading-none">ARIA</div>
                <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mt-1.5">
                  AI Breach Response Agent · Gemini 1.5 Flash
                </div>
              </div>
              <div className="text-[11px]">
                {isAnonymous ? (
                  <span className="text-warning">Reporting anonymously</span>
                ) : user ? (
                  <span className="text-muted-foreground">
                    Reporting as: <span className="text-foreground">{user.name}</span>
                  </span>
                ) : null}
              </div>
            </div>

            {/* Chat history */}
            <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1">
              {chat.map((t) => (
                <ChatBubble key={t.id} role={t.role} content={t.content} />
              ))}
              {streaming && chat[chat.length - 1]?.content === "" && (
                <div className="flex items-center gap-1 text-muted-foreground text-xs px-1">
                  <span className="typing-dot inline-block w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                  <span className="typing-dot inline-block w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                  <span className="typing-dot inline-block w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                </div>
              )}
              {submitting && (
                <div className="text-xs text-muted-foreground px-1 italic">
                  Compiling structured report for the DPO…
                </div>
              )}
              <div ref={chatScrollRef} />
            </div>

            {/* Free-text composer */}
            <div className="bg-card border border-border rounded-sm px-4 py-3 mt-4 shrink-0">
              <div className="flex items-end gap-3">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void sendUser(input);
                    }
                  }}
                  rows={2}
                  disabled={streaming || submitting}
                  placeholder={
                    streaming
                      ? "ARIA is typing…"
                      : submitting
                      ? "Submitting…"
                      : "Type your answer. Shift+Enter for a new line."
                  }
                  className="flex-1 bg-transparent border-0 outline-none resize-none text-sm placeholder:text-muted-foreground/60 disabled:opacity-50"
                />
                <button
                  onClick={() => void sendUser(input)}
                  disabled={!input.trim() || streaming || submitting}
                  className="bg-primary text-primary-foreground w-9 h-9 flex items-center justify-center rounded-sm disabled:opacity-30 hover:bg-primary/90 transition-colors shrink-0"
                  aria-label="Send"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  ARIA collects facts only · she does not give legal advice
                </span>
                <button
                  onClick={() => void sendUser("I don't know.")}
                  disabled={streaming || submitting}
                  className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  I don't know
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function ChatBubble({ role, content }: { role: "aria" | "user"; content: string }) {
  if (role === "aria") {
    return (
      <div className="flex">
        <div className="max-w-[85%] bg-muted text-foreground text-[15px] leading-relaxed px-4 py-3 rounded-sm animate-fade-in prose prose-sm dark:prose-invert prose-p:my-2 prose-ul:my-2 prose-li:my-0 max-w-none">
          <ReactMarkdown>{content || " "}</ReactMarkdown>
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-end">
      <div className={cn(
        "max-w-[85%] bg-primary text-primary-foreground text-[14px] leading-relaxed px-4 py-3 rounded-sm animate-fade-in whitespace-pre-wrap",
      )}>
        {content}
      </div>
    </div>
  );
}

export default Employee;
