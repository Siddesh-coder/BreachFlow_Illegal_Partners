import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { CalendarIcon, Minus, Plus } from "lucide-react";
import { Wordmark } from "@/components/Wordmark";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useApp } from "@/state/AppContext";
import { QUESTIONS, type Question } from "@/lib/ariaQuestions";
import { calcSeverity, AUTHORITY_BY_COUNTRY, generateRefId } from "@/lib/risk";
import type { DataType, EUCountry, Incident } from "@/types/incident";
import { chatCompletion, getAriaSystemPrompt } from "@/services/openai";
import { queryLegalHub } from "@/services/legalDataHub";
import { cn } from "@/lib/utils";

interface ChatTurn {
  id: string;
  role: "aria" | "user";
  content: string;
}

interface AnswersDraft {
  discoveredAt?: Date;
  dataTypes?: DataType[];
  affectedCount?: number | null;        // null = "I don't know"
  whatHappened?: string;
  incidentCategory?: string;
  countries?: EUCountry[];
  contained?: boolean;
  additionalNotes?: string;
  unknownFields?: string[];
}

const Employee = () => {
  const navigate = useNavigate();
  const { user, isAnonymous, addIncident, addAudit } = useApp();
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswersDraft>({ unknownFields: [] });
  const [chat, setChat] = useState<ChatTurn[]>([
    {
      id: "intro",
      role: "aria",
      content: `Hello${user ? `, ${user.name.split(" ")[0]}` : ""}. I'm ARIA, your breach response assistant. I'll guide you through a few questions so your DPO has what they need to act. Take your time.`,
    },
  ]);
  const [pushedBack, setPushedBack] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ ref: string } | null>(null);
  const [ariaThinking, setAriaThinking] = useState(false);

  const question: Question | undefined = QUESTIONS[qIndex];
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Redirect if neither signed in nor anonymous
  useEffect(() => {
    if (!user && !isAnonymous) navigate("/auth");
  }, [user, isAnonymous, navigate]);

  // After answer streams in, auto-scroll
  useEffect(() => {
    chatScrollRef.current?.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: "smooth" });
  }, [chat, ariaThinking]);

  // Add the current question to chat the first time it appears
  useEffect(() => {
    if (!question) return;
    setChat((prev) => {
      const id = `q-${question.id}`;
      if (prev.find((t) => t.id === id)) return prev;
      return [...prev, { id, role: "aria", content: question.prompt }];
    });
  }, [question]);

  const severity = calcSeverity(answers.dataTypes ?? [], answers.affectedCount ?? null);

  const handleAnswer = async (display: string, patch: Partial<AnswersDraft>, isUnknown = false) => {
    if (!question) return;
    setChat((prev) => [...prev, { id: `a-${question.id}-${Date.now()}`, role: "user", content: display }]);
    setAnswers((prev) => ({
      ...prev,
      ...patch,
      unknownFields: isUnknown ? [...(prev.unknownFields ?? []), question.id] : prev.unknownFields,
    }));

    // Push-back for vague answers (once per question)
    const needsPushback = shouldPushBack(question, patch, isUnknown) && !pushedBack.has(question.id);
    if (needsPushback) {
      setPushedBack((s) => new Set(s).add(question.id));
      setAriaThinking(true);
      await sleep(700);
      setChat((prev) => [
        ...prev,
        {
          id: `pb-${question.id}-${Date.now()}`,
          role: "aria",
          content: pushBackMessage(question),
        },
      ]);
      setAriaThinking(false);
      return; // stay on same question
    }

    // Acknowledge unknown but move on
    if (isUnknown) {
      setAriaThinking(true);
      await sleep(500);
      setChat((prev) => [
        ...prev,
        { id: `ack-${question.id}-${Date.now()}`, role: "aria", content: "Understood — I'll mark that as not yet known and your DPO can follow up." },
      ]);
      setAriaThinking(false);
    }

    // Move to next question or submit
    if (qIndex + 1 >= QUESTIONS.length) {
      await submitReport({ ...answers, ...patch });
    } else {
      setQIndex((i) => i + 1);
    }
  };

  const submitReport = async (final: AnswersDraft) => {
    if (!question) return;
    setSubmitting(true);
    setAriaThinking(true);

    const ref = generateRefId();
    const dataTypes = (final.dataTypes ?? []) as DataType[];
    const countries = (final.countries ?? []) as EUCountry[];
    const sev = calcSeverity(dataTypes, final.affectedCount ?? null);
    const primaryCountry = countries[0] ?? "Other EU";
    const authority = AUTHORITY_BY_COUNTRY[primaryCountry];

    // German query to Otto Schmidt
    const summaryDe = `Datenschutzvorfall: ${final.whatHappened ?? "unbekannt"}. Datenarten: ${dataTypes.join(", ")}. Betroffene: ${final.affectedCount ?? "unbekannt"}. Länder: ${countries.join(", ")}. Eingedämmt: ${final.contained ? "ja" : "nein"}.`;
    const legalQuestion = `Welche DSGVO-Meldepflichten und Maßnahmen gelten bei folgendem Datenschutzvorfall: ${summaryDe}?`;
    const legal = await queryLegalHub(legalQuestion);

    // Use OpenAI to enrich summary + reasoning, falling back if no key
    const ai = await chatCompletion([
      { role: "system", content: getAriaSystemPrompt() },
      {
        role: "user",
        content: `Generate (a) a one-sentence English summary of this breach, (b) a notifiability verdict (likely | possibly | not), and (c) up to 3 bullet point legal reasoning lines, then (d) up to 5 concrete recommended action steps for the DPO. Return as JSON with keys: summary, verdict, reasoning (array of strings), steps (array of {title, description}).\n\nIncident:\n${summaryDe}\n\nLegal context (Otto Schmidt):\n${legal ? JSON.stringify(legal).slice(0, 2000) : "n/a"}`,
      },
    ]);

    const parsed = safeParseJson(ai);
    const baseSteps = parsed?.steps?.length
      ? parsed.steps
      : defaultSteps(sev, dataTypes, authority);

    const incident: Incident = {
      id: ref,
      reportedAt: new Date().toISOString(),
      discoveredAt: (final.discoveredAt ?? new Date()).toISOString(),
      reporterName: isAnonymous ? null : user?.name ?? null,
      isAnonymous,
      dataTypes,
      affectedCount: final.affectedCount ?? null,
      whatHappened: final.whatHappened ?? "",
      incidentCategory: final.incidentCategory ?? "Other",
      countries,
      contained: final.contained ?? null,
      additionalNotes: final.additionalNotes ?? "",
      severity: sev,
      status: "new",
      aiSummary: parsed?.summary ?? `${dataTypes.join(", ") || "Personal data"} incident affecting ${final.affectedCount ?? "an unknown number of"} people in ${countries.join(", ") || "EU"}.`,
      notifiability: {
        verdict: (parsed?.verdict as any) ?? (sev === "high" ? "likely" : sev === "medium" ? "possibly" : "not"),
        reasoning: parsed?.reasoning ?? defaultReasoning(sev, dataTypes),
        authority,
      },
      recommendations: baseSteps.map((s: any, i: number) => ({
        id: `s${i + 1}`,
        title: s.title.startsWith("Step") ? s.title : `Step ${i + 1} — ${s.title}`,
        description: s.description,
        status: "not_started" as const,
      })),
    };

    addIncident(incident);
    addAudit({ incidentId: ref, actor: "Employee", action: "Breach discovered", ts: incident.discoveredAt });
    addAudit({ incidentId: ref, actor: "Employee", action: "Report submitted via ARIA" });
    addAudit({ incidentId: ref, actor: "ARIA", action: "AI notifiability assessment generated" });
    addAudit({ incidentId: ref, actor: "ARIA", action: "Recommendation steps created" });

    setAriaThinking(false);
    setSubmitting(false);
    setDone({ ref });
  };

  if (done) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
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
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center justify-between px-10 py-6 border-b border-border">
        <Wordmark size={20} />
        <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Employee Portal</span>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[760px] mx-auto px-6 py-10 space-y-10">
          {/* Chat header */}
          <div className="flex items-end justify-between">
            <div>
              <div className="font-serif text-2xl leading-none">ARIA</div>
              <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground mt-2">AI Breach Response Agent</div>
            </div>
            <div className="text-[11px]">
              {isAnonymous ? (
                <span className="text-warning">Reporting anonymously</span>
              ) : user ? (
                <span className="text-muted-foreground">Reporting as: <span className="text-foreground">{user.name}</span></span>
              ) : null}
            </div>
          </div>

          {/* Chat history */}
          <div ref={chatScrollRef} className="space-y-4 min-h-[240px]">
            {chat.map((t) => (
              <ChatBubble key={t.id} role={t.role}>{t.content}</ChatBubble>
            ))}
            {ariaThinking && (
              <div className="flex items-center gap-1 text-muted-foreground text-xs px-1">
                <span className="typing-dot inline-block w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                <span className="typing-dot inline-block w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                <span className="typing-dot inline-block w-1.5 h-1.5 rounded-full bg-muted-foreground" />
              </div>
            )}
          </div>

          {/* Centered input area */}
          {!submitting && question && (
            <div className="bg-card border border-border rounded-sm px-8 py-8 animate-fade-in">
              <div className="font-serif text-xl leading-snug mb-6 text-center">{question.prompt}</div>
              <QuestionInput
                question={question}
                draft={answers}
                onAnswer={handleAnswer}
              />
            </div>
          )}

          {/* Incident summary — below the chat */}
          <div className="pt-2">
            <SummaryCard answers={answers} severity={severity} />
          </div>
        </div>
      </main>
    </div>
  );
};

function ChatBubble({ role, children }: { role: "aria" | "user"; children: React.ReactNode }) {
  if (role === "aria") {
    return (
      <div className="flex">
        <div className="max-w-[85%] bg-muted text-foreground text-[15px] leading-relaxed px-4 py-3 rounded-sm animate-fade-in">
          {children}
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] bg-primary text-primary-foreground text-[14px] leading-relaxed px-4 py-3 rounded-sm animate-fade-in">
        {children}
      </div>
    </div>
  );
}

function QuestionInput({
  question, draft, onAnswer,
}: {
  question: Question;
  draft: AnswersDraft;
  onAnswer: (display: string, patch: Partial<AnswersDraft>, unknown?: boolean) => void;
}) {
  // Local state per kind
  const [date, setDate] = useState<Date | undefined>(draft.discoveredAt);
  const [time, setTime] = useState<string>("09:00");
  const [selectedTypes, setSelectedTypes] = useState<DataType[]>(draft.dataTypes ?? []);
  const [count, setCount] = useState<number>(draft.affectedCount ?? 0);
  const [text, setText] = useState<string>(draft.whatHappened ?? "");
  const [hint, setHint] = useState<string>(draft.incidentCategory ?? "");
  const [countries, setCountries] = useState<EUCountry[]>(draft.countries ?? []);
  const [notes, setNotes] = useState<string>(draft.additionalNotes ?? "");

  const idk = (
    <button
      onClick={() => onAnswer("I don't know", {}, true)}
      className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground border border-border px-3 py-1.5 rounded-sm hover:bg-accent transition-colors"
    >
      I don't know
    </button>
  );

  const next = (display: string, patch: Partial<AnswersDraft>) => onAnswer(display, patch);

  switch (question.kind) {
    case "datetime": {
      const combined = date ? combineDateTime(date, time) : undefined;
      return (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3 items-center">
            <Popover>
              <PopoverTrigger asChild>
                <button className="inline-flex items-center gap-2 border border-border px-4 py-2.5 text-sm rounded-sm hover:bg-accent transition-colors">
                  <CalendarIcon className="h-4 w-4" />
                  {date ? format(date, "PPP") : "Pick a date"}
                </button>
              </PopoverTrigger>
              <PopoverContent side="top" align="start" className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="border border-border px-3 py-2.5 text-sm rounded-sm bg-card focus:border-primary outline-none"
            />
          </div>
          <div className="flex justify-between items-center">
            {idk}
            <button
              disabled={!combined}
              onClick={() => combined && next(format(combined, "PPP 'at' p"), { discoveredAt: combined })}
              className="bg-primary text-primary-foreground px-6 py-2.5 text-xs uppercase tracking-[0.18em] rounded-sm disabled:opacity-40 hover:bg-primary/90 transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      );
    }
    case "checkboxes": {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {question.options!.map((opt) => {
              const active = selectedTypes.includes(opt as DataType);
              return (
                <button
                  key={opt}
                  onClick={() =>
                    setSelectedTypes((prev) =>
                      active ? prev.filter((p) => p !== opt) : [...prev, opt as DataType],
                    )
                  }
                  className={cn(
                    "border px-4 py-3 text-sm rounded-sm text-left transition-colors",
                    active ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-accent",
                  )}
                >
                  {opt}
                </button>
              );
            })}
          </div>
          <div className="flex justify-between items-center">
            {idk}
            <button
              disabled={selectedTypes.length === 0}
              onClick={() => next(selectedTypes.join(", "), { dataTypes: selectedTypes })}
              className="bg-primary text-primary-foreground px-6 py-2.5 text-xs uppercase tracking-[0.18em] rounded-sm disabled:opacity-40 hover:bg-primary/90 transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      );
    }
    case "number": {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCount((c) => Math.max(0, c - 10))}
              className="border border-border w-11 h-11 flex items-center justify-center rounded-sm hover:bg-accent"
            >
              <Minus className="w-4 h-4" />
            </button>
            <input
              type="number"
              value={count}
              onChange={(e) => setCount(Math.max(0, Number(e.target.value)))}
              className="border border-border px-4 py-2.5 text-2xl font-serif w-40 text-center rounded-sm bg-card outline-none focus:border-primary"
            />
            <button
              onClick={() => setCount((c) => c + 10)}
              className="border border-border w-11 h-11 flex items-center justify-center rounded-sm hover:bg-accent"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="flex justify-between items-center">
            {idk}
            <button
              onClick={() => next(`${count} people`, { affectedCount: count })}
              className="bg-primary text-primary-foreground px-6 py-2.5 text-xs uppercase tracking-[0.18em] rounded-sm hover:bg-primary/90 transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      );
    }
    case "text-with-hints": {
      return (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {question.options!.map((opt) => (
              <button
                key={opt}
                onClick={() => setHint(opt)}
                className={cn(
                  "border text-xs uppercase tracking-[0.14em] px-3 py-1.5 rounded-sm transition-colors",
                  hint === opt ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-accent",
                )}
              >
                {opt}
              </button>
            ))}
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Describe what happened in your own words…"
            rows={4}
            className="w-full border border-border bg-card px-4 py-3 text-sm rounded-sm outline-none focus:border-primary resize-none"
          />
          <div className="flex justify-between items-center">
            {idk}
            <button
              disabled={!text.trim() && !hint}
              onClick={() => next(text || hint, { whatHappened: text, incidentCategory: hint || "Other" })}
              className="bg-primary text-primary-foreground px-6 py-2.5 text-xs uppercase tracking-[0.18em] rounded-sm disabled:opacity-40 hover:bg-primary/90 transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      );
    }
    case "multi-select": {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {question.options!.map((opt) => {
              const active = countries.includes(opt as EUCountry);
              return (
                <button
                  key={opt}
                  onClick={() =>
                    setCountries((prev) =>
                      active ? prev.filter((p) => p !== opt) : [...prev, opt as EUCountry],
                    )
                  }
                  className={cn(
                    "border px-3 py-2 text-sm rounded-sm transition-colors",
                    active ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-accent",
                  )}
                >
                  {opt}
                </button>
              );
            })}
          </div>
          <div className="flex justify-between items-center">
            {idk}
            <button
              disabled={countries.length === 0}
              onClick={() => next(countries.join(", "), { countries })}
              className="bg-primary text-primary-foreground px-6 py-2.5 text-xs uppercase tracking-[0.18em] rounded-sm disabled:opacity-40 hover:bg-primary/90 transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      );
    }
    case "yes-no": {
      return (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => next("Yes, contained", { contained: true })}
            className="border border-border hover:border-primary hover:bg-primary hover:text-primary-foreground py-6 rounded-sm transition-colors text-sm"
          >
            <div className="font-serif text-lg">Yes</div>
            <div className="text-xs mt-1 opacity-80">Contained</div>
          </button>
          <button
            onClick={() => next("No, still ongoing", { contained: false })}
            className="border border-border hover:border-primary hover:bg-primary hover:text-primary-foreground py-6 rounded-sm transition-colors text-sm"
          >
            <div className="font-serif text-lg">No</div>
            <div className="text-xs mt-1 opacity-80">Still ongoing</div>
          </button>
        </div>
      );
    }
    case "text-optional": {
      return (
        <div className="space-y-4">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional context, links, attachments referenced elsewhere…"
            rows={4}
            className="w-full border border-border bg-card px-4 py-3 text-sm rounded-sm outline-none focus:border-primary resize-none"
          />
          <div className="flex justify-between items-center">
            <button
              onClick={() => next("(skipped)", { additionalNotes: "" })}
              className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground border border-border px-3 py-1.5 rounded-sm hover:bg-accent transition-colors"
            >
              Skip
            </button>
            <button
              onClick={() => next(notes || "(none)", { additionalNotes: notes })}
              className="bg-primary text-primary-foreground px-6 py-2.5 text-xs uppercase tracking-[0.18em] rounded-sm hover:bg-primary/90 transition-colors"
            >
              Submit Report
            </button>
          </div>
        </div>
      );
    }
  }
}

function SummaryCard({ answers, severity }: { answers: AnswersDraft; severity: "low" | "medium" | "high" }) {
  const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div>
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
      <div className="mt-1.5 text-sm text-foreground">
        {value || <span className="text-muted-foreground/50">——</span>}
      </div>
    </div>
  );

  return (
    <div className="max-w-[560px] mx-auto animate-fade-in">
      <h2 className="font-serif text-2xl">Incident Summary</h2>
      <p className="text-xs text-muted-foreground mt-1">Updated live as ARIA collects information.</p>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 bg-card border border-border p-6 shadow-card rounded-sm">
        <Field label="Discovered at" value={answers.discoveredAt ? format(answers.discoveredAt, "PPP 'at' p") : null} />
        <Field label="Affected" value={answers.affectedCount != null ? `${answers.affectedCount} people` : null} />
        <Field label="Data types" value={answers.dataTypes?.length ? answers.dataTypes.join(", ") : null} />
        <Field label="Category" value={answers.incidentCategory} />
        <Field label="What happened" value={answers.whatHappened} />
        <Field label="Countries" value={answers.countries?.length ? answers.countries.join(", ") : null} />
        <Field label="Contained" value={answers.contained === undefined ? null : answers.contained ? "Yes" : "No"} />
        <Field label="Notes" value={answers.additionalNotes} />
      </div>

      {/* Risk indicator */}
      <div className="mt-10">
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-3">Preliminary risk</div>
        <div className="grid grid-cols-3 gap-2">
          {(["low", "medium", "high"] as const).map((s) => {
            const active = severity === s;
            const colorMap = {
              low: "bg-success text-success-foreground border-success",
              medium: "bg-warning text-warning-foreground border-warning",
              high: "bg-destructive text-destructive-foreground border-destructive",
            };
            return (
              <div
                key={s}
                className={cn(
                  "border py-3 text-center text-[11px] uppercase tracking-[0.18em] rounded-sm transition-all",
                  active ? colorMap[s] : "border-border bg-card text-muted-foreground/60",
                )}
              >
                {s}
              </div>
            );
          })}
        </div>
        <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
          Risk is recalculated as you answer. Special category or health data raises severity to HIGH automatically.
        </p>
      </div>
    </div>
  );
}

// ----- helpers -----

function combineDateTime(d: Date, time: string): Date {
  const [h, m] = time.split(":").map(Number);
  const out = new Date(d);
  out.setHours(h || 0, m || 0, 0, 0);
  return out;
}

function shouldPushBack(q: Question, patch: Partial<AnswersDraft>, unknown: boolean): boolean {
  if (unknown) return false;
  if (q.id === "affectedCount") {
    // Vague: stayed at default 0
    return patch.affectedCount === 0;
  }
  if (q.id === "whatHappened") {
    const t = (patch.whatHappened ?? "").trim();
    return t.length > 0 && t.length < 12;
  }
  return false;
}

function pushBackMessage(q: Question): string {
  switch (q.id) {
    case "affectedCount":
      return "Even a rough estimate helps — 10? 100? Several thousand? You can also tap \"I don't know\".";
    case "whatHappened":
      return "Could you give me a little more detail? A sentence or two on what was discovered is enough.";
    default:
      return "Could you clarify a little further?";
  }
}

function safeParseJson(s: string | null): any | null {
  if (!s) return null;
  try {
    const match = s.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : null;
  } catch {
    return null;
  }
}

function defaultReasoning(sev: "low" | "medium" | "high", types: DataType[]): string[] {
  if (sev === "high") {
    return [
      "Sensitive or special-category data is involved (Art. 9 GDPR).",
      "High likelihood of risk to rights and freedoms — Art. 33 notification within 72h is likely required.",
      "Affected individuals may need to be informed under Art. 34.",
    ];
  }
  if (sev === "medium") {
    return [
      `Sensitive data category(ies) involved: ${types.join(", ")}.`,
      "A risk assessment is required to determine Art. 33 threshold.",
    ];
  }
  return [
    "Limited scope and data category — unlikely to result in a risk to rights and freedoms.",
    "Internal documentation under Art. 33(5) is sufficient.",
  ];
}

function defaultSteps(sev: "low" | "medium" | "high", _types: DataType[], authority: string) {
  const steps = [
    { title: "Notify IT Security Team", description: "Engage InfoSec to confirm containment and preserve forensic evidence." },
    { title: "Notify Legal Department", description: "Brief in-house counsel on Art. 33/34 obligations and lead authority." },
    { title: "Risk Assessment", description: "Determine likelihood and severity of impact on data subjects." },
  ];
  if (sev !== "low") {
    steps.push({ title: `Notify Supervisory Authority (${authority})`, description: "File Art. 33 notification within 72 hours of discovery." });
  }
  if (sev === "high") {
    steps.push({ title: "Notify Affected Individuals", description: "Communicate clearly to data subjects per Art. 34 due to high risk." });
  }
  steps.push({ title: "Document in Audit Trail", description: "Capture all decisions, communications, and timestamps for accountability." });
  return steps;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export default Employee;
