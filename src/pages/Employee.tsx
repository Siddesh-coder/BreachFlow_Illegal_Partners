import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUp, AlertTriangle, ShieldAlert } from "lucide-react";
import { Wordmark } from "@/components/Wordmark";
import { useApp } from "@/state/AppContext";
import { AUTHORITY_BY_COUNTRY, calcSeverity, generateRefId } from "@/lib/risk";
import type { DataType, EUCountry, Incident, Severity } from "@/types/incident";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type StepId =
  | "q1_discovery"
  | "q2_incidentTime"
  | "q3_whatHappened"
  | "q4_systems"
  | "q5_dataTypes"
  | "q6_count"
  | "q7_actions"
  | "q8_exfiltration"
  | "q9_ongoing"
  | "q10_awareness"
  | "review"
  | "done";

interface FlowAnswers {
  // Q1
  discoveredAt?: string;          // ISO
  howNoticed?: string;
  // Q2
  incidentTimeMode?: "specific" | "same" | "unknown";
  incidentTime?: string;          // ISO when mode === "specific"
  // Q3
  whatHappened?: string;
  whatHappenedHint?: string;
  // Q4
  systemsAffected?: string[];     // chips
  systemsNote?: string;           // free text
  systemsUnknown?: boolean;
  // Q5
  dataCategories?: DataCategoryKey[];
  // Q6
  affectedRange?: AffectedRangeKey;
  // Q7
  actionsTaken?: ActionKey[];
  actionsNote?: string;
  // Q8
  exfiltration?: "yes" | "possibly" | "no";
  // Q9
  ongoing?: boolean;
  // Q10
  whoKnows?: AwarenessKey[];
  whoKnowsNote?: string;
}

type ChatTurn =
  | { id: string; kind: "aria"; content: string }
  | { id: string; kind: "user"; content: string };

/* ------------------------------------------------------------------ */
/* Option dictionaries                                                 */
/* ------------------------------------------------------------------ */

const WHAT_HAPPENED_HINTS = [
  "Phishing link clicked",
  "Unauthorised login",
  "File sent to wrong person",
  "Ransomware on screen",
  "Lost/stolen device",
  "Other",
] as const;

const SYSTEMS_OPTIONS = [
  "Email system",
  "Customer database",
  "HR system",
  "File storage",
  "Laptop/device",
  "Cloud storage",
  "Other",
] as const;

type DataCategoryKey =
  | "names_emails"
  | "employee_records"
  | "health"
  | "payment"
  | "credentials"
  | "biometric"
  | "special"
  | "unsure";

const DATA_CATEGORIES: {
  key: DataCategoryKey;
  label: string;
  high: boolean;
  // mapping into the canonical DataType[] used elsewhere in the app
  dataType?: DataType;
}[] = [
  { key: "names_emails",     label: "Customer names and emails",                                       high: false, dataType: "Personal Identifiers" },
  { key: "employee_records", label: "Employee records",                                                high: false, dataType: "Personal Identifiers" },
  { key: "health",           label: "Health / medical data",                                           high: true,  dataType: "Health/Medical Records" },
  { key: "payment",          label: "Payment / financial data",                                        high: true,  dataType: "Financial Data" },
  { key: "credentials",      label: "Passwords / login credentials",                                   high: true,  dataType: "Login Credentials" },
  { key: "biometric",        label: "Biometric data",                                                  high: true,  dataType: "Biometric Data" },
  { key: "special",          label: "Special category data (race, religion, political, sexual orient.)", high: true,  dataType: "Special Category Data" },
  { key: "unsure",           label: "I'm not sure",                                                    high: false },
];

type AffectedRangeKey = "<10" | "10-100" | "100-1000" | "1000-10000" | ">10000" | "unknown";

const AFFECTED_RANGES: { key: AffectedRangeKey; label: string; midpoint: number | null }[] = [
  { key: "<10",         label: "Fewer than 10",   midpoint: 5 },
  { key: "10-100",      label: "10 – 100",        midpoint: 50 },
  { key: "100-1000",    label: "100 – 1,000",     midpoint: 500 },
  { key: "1000-10000",  label: "1,000 – 10,000",  midpoint: 5000 },
  { key: ">10000",      label: "More than 10,000", midpoint: 25000 },
  { key: "unknown",     label: "I don't know",    midpoint: null },
];

type ActionKey =
  | "passwords"
  | "disconnected"
  | "deleted"
  | "notified_internal"
  | "notified_external"
  | "nothing";

const ACTION_OPTIONS: { key: ActionKey; label: string }[] = [
  { key: "passwords",         label: "Changed passwords" },
  { key: "disconnected",      label: "Disconnected a device" },
  { key: "deleted",           label: "Deleted files" },
  { key: "notified_internal", label: "Notified someone internally" },
  { key: "notified_external", label: "Notified someone externally" },
  { key: "nothing",           label: "Nothing yet" },
];

type AwarenessKey =
  | "manager"
  | "it_infosec"
  | "colleagues"
  | "external"
  | "nobody";

const AWARENESS_OPTIONS: { key: AwarenessKey; label: string }[] = [
  { key: "manager",     label: "My direct manager" },
  { key: "it_infosec",  label: "IT / InfoSec team" },
  { key: "colleagues",  label: "Other colleagues" },
  { key: "external",    label: "External parties" },
  { key: "nobody",      label: "Nobody else yet" },
];

const STEP_ORDER: StepId[] = [
  "q1_discovery",
  "q2_incidentTime",
  "q3_whatHappened",
  "q4_systems",
  "q5_dataTypes",
  "q6_count",
  "q7_actions",
  "q8_exfiltration",
  "q9_ongoing",
  "q10_awareness",
  "review",
];

/* ------------------------------------------------------------------ */
/* ARIA scripted prompts                                               */
/* ------------------------------------------------------------------ */

const ARIA_PROMPTS: Record<Exclude<StepId, "done">, string> = {
  q1_discovery:
    "When did you first notice something was wrong, and how did you notice it?",
  q2_incidentTime:
    "Do you know when the incident actually occurred or began — even if that's earlier than when you discovered it?",
  q3_whatHappened: "What happened, as best you can describe it?",
  q4_systems:
    "Which systems, applications, or devices are involved or potentially affected?",
  q5_dataTypes: "What type of data do you think was involved?",
  q6_count:
    "Roughly how many people's data may be affected, even as a ballpark?",
  q7_actions: "Have you or anyone else already done anything in response?",
  q8_exfiltration:
    "Is there any indication that data has left the organisation — downloaded, forwarded externally, or accessed by someone who shouldn't have access?",
  q9_ongoing:
    "Is the incident still ongoing — do you believe the threat is still active or unauthorised access is still possible?",
  q10_awareness:
    "Who else already knows about this, inside or outside the organisation?",
  review:
    "Thank you. Here is a summary of what you've told me. Please review before I send this to your Data Protection Officer.",
};

/* ------------------------------------------------------------------ */
/* Risk model — per spec                                               */
/* ------------------------------------------------------------------ */

type RiskLevel = "low" | "medium" | "high";

function computeRisk(a: FlowAnswers): { level: RiskLevel; reasons: string[] } {
  const reasons: string[] = [];
  const cats = a.dataCategories ?? [];
  const isHigh =
    cats.includes("special") ||
    cats.includes("health") ||
    a.affectedRange === ">10000" ||
    a.affectedRange === "1000-10000" ||
    a.ongoing === true ||
    a.exfiltration === "yes";
  if (cats.includes("special")) reasons.push("Special category data involved");
  if (cats.includes("health")) reasons.push("Health/medical data involved");
  if (a.affectedRange === ">10000" || a.affectedRange === "1000-10000")
    reasons.push("More than 1,000 individuals potentially affected");
  if (a.ongoing === true) reasons.push("Incident still ongoing");
  if (a.exfiltration === "yes") reasons.push("Data likely left the organisation");

  if (isHigh) return { level: "high", reasons };

  const isMedium =
    cats.includes("payment") ||
    cats.includes("credentials") ||
    a.affectedRange === "100-1000" ||
    a.exfiltration === "possibly";
  if (cats.includes("payment")) reasons.push("Financial data involved");
  if (cats.includes("credentials")) reasons.push("Login credentials involved");
  if (a.affectedRange === "100-1000") reasons.push("100–1,000 individuals affected");
  if (a.exfiltration === "possibly") reasons.push("Possible data exfiltration");
  if (isMedium) return { level: "medium", reasons };

  return { level: "low", reasons };
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

const Employee = () => {
  const navigate = useNavigate();
  const { user, isAnonymous, addIncident, addAudit } = useApp();

  const [step, setStep] = useState<StepId>("q1_discovery");
  const [answers, setAnswers] = useState<FlowAnswers>({});
  const [chat, setChat] = useState<ChatTurn[]>([]);
  const [done, setDone] = useState<{ ref: string } | null>(null);

  const chatScrollRef = useRef<HTMLDivElement>(null);
  const initialised = useRef(false);

  /* --- Auth gate --- */
  useEffect(() => {
    if (!user && !isAnonymous) navigate("/auth");
  }, [user, isAnonymous, navigate]);

  /* --- Greeting --- */
  useEffect(() => {
    if (initialised.current) return;
    if (!user && !isAnonymous) return;
    initialised.current = true;
    const name = user?.name ? `, ${user.name.split(" ")[0]}` : "";
    pushAria(
      `Hello${name}. I'm **ARIA**, your breach intake agent. I'll ask a short series of questions so your DPO has the facts they need. You can answer with the controls below each question — there's no need to type unless you want to add detail.`,
    );
    pushAria(ARIA_PROMPTS.q1_discovery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isAnonymous]);

  /* --- Auto-scroll --- */
  useEffect(() => {
    chatScrollRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [chat, step]);

  /* --- Helpers --- */
  function pushAria(content: string) {
    setChat((prev) => [
      ...prev,
      { id: `a-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, kind: "aria", content },
    ]);
  }
  function pushUser(content: string) {
    setChat((prev) => [
      ...prev,
      { id: `u-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, kind: "user", content },
    ]);
  }

  function advanceTo(next: StepId) {
    setStep(next);
    if (next !== "done" && next in ARIA_PROMPTS) {
      // small visual delay feel — but we keep it instant since flow is synchronous
      setTimeout(() => pushAria(ARIA_PROMPTS[next as Exclude<StepId, "done">]), 120);
    }
  }

  function nextStep(current: StepId): StepId {
    const idx = STEP_ORDER.indexOf(current);
    return STEP_ORDER[Math.min(idx + 1, STEP_ORDER.length - 1)];
  }

  /* ------------------------------------------------------------------ */
  /* Submit — build Incident                                             */
  /* ------------------------------------------------------------------ */

  function submitIncident() {
    const dataTypes: DataType[] = Array.from(
      new Set(
        (answers.dataCategories ?? [])
          .map((k) => DATA_CATEGORIES.find((d) => d.key === k)?.dataType)
          .filter((d): d is DataType => Boolean(d)),
      ),
    );
    const affectedCount =
      AFFECTED_RANGES.find((r) => r.key === answers.affectedRange)?.midpoint ?? null;

    const discoveredAt = answers.discoveredAt ?? new Date().toISOString();
    const sev: Severity = (() => {
      const r = computeRisk(answers).level;
      return r === "high" ? "high" : r === "medium" ? "medium" : calcSeverity(dataTypes, affectedCount);
    })();
    const ref = generateRefId();
    const primaryCountry: EUCountry = "Other EU";
    const authority = AUTHORITY_BY_COUNTRY[primaryCountry];

    const incidentCategory =
      WHAT_HAPPENED_HINTS.find((h) => h === answers.whatHappenedHint) ?? "Other";

    const additionalParts: string[] = [];
    if (answers.howNoticed) additionalParts.push(`How noticed: ${answers.howNoticed}`);
    if (answers.incidentTimeMode === "specific" && answers.incidentTime)
      additionalParts.push(`Incident time: ${formatDateTime(answers.incidentTime)}`);
    if (answers.incidentTimeMode === "same") additionalParts.push("Incident time: same as discovery");
    if (answers.systemsAffected?.length)
      additionalParts.push(`Systems affected: ${answers.systemsAffected.join(", ")}`);
    if (answers.systemsNote) additionalParts.push(`Systems detail: ${answers.systemsNote}`);
    if (answers.actionsTaken?.length)
      additionalParts.push(
        `Actions already taken: ${answers.actionsTaken.map((k) => ACTION_OPTIONS.find((a) => a.key === k)?.label).join(", ")}`,
      );
    if (answers.actionsNote) additionalParts.push(`Actions detail: ${answers.actionsNote}`);
    if (answers.exfiltration)
      additionalParts.push(
        `Data exfiltration: ${
          { yes: "yes — likely left organisation", possibly: "possibly", no: "no" }[answers.exfiltration]
        }`,
      );
    if (answers.whoKnows?.length)
      additionalParts.push(
        `Awareness: ${answers.whoKnows.map((k) => AWARENESS_OPTIONS.find((a) => a.key === k)?.label).join(", ")}`,
      );
    if (answers.whoKnowsNote) additionalParts.push(`Awareness detail: ${answers.whoKnowsNote}`);

    const reasoning: string[] = [];
    const cats = answers.dataCategories ?? [];
    if (cats.includes("special") || cats.includes("health"))
      reasoning.push("Sensitive personal data indicators present (GDPR Art. 9).");
    if ((affectedCount ?? 0) > 1000)
      reasoning.push("Large scale of affected individuals (GDPR Art. 33(3)(c)).");
    if (answers.exfiltration === "yes")
      reasoning.push("Likely confidentiality breach — data left organisation (GDPR Art. 32).");
    if (answers.ongoing) reasoning.push("Incident not yet contained — Art. 33(1) clock active.");
    if (!reasoning.length) reasoning.push("Indicators captured during intake; full assessment pending DPO review.");

    const incident: Incident = {
      id: ref,
      reportedAt: new Date().toISOString(),
      discoveredAt,
      reporterName: isAnonymous ? null : user?.name ?? null,
      isAnonymous,
      dataTypes,
      affectedCount,
      whatHappened: answers.whatHappened ?? "",
      incidentCategory,
      countries: [primaryCountry],
      contained: typeof answers.ongoing === "boolean" ? !answers.ongoing : null,
      additionalNotes: additionalParts.join("\n"),
      severity: sev,
      status: "new",
      aiSummary:
        `${dataTypes.join(", ") || "Personal data"} incident affecting ${
          affectedCount ?? "an unknown number of"
        } people. Category: ${incidentCategory}.`,
      notifiability: {
        verdict: sev === "high" ? "likely" : sev === "medium" ? "possibly" : "not",
        reasoning,
        authority,
      },
      recommendations: [
        { id: "s1", title: "Step 1 — Notify IT Security Team", description: "Engage InfoSec to confirm containment and preserve evidence.", status: "not_started" },
        { id: "s2", title: "Step 2 — Notify Legal Department", description: "Brief in-house counsel on Art. 33/34 obligations.", status: "not_started" },
        { id: "s3", title: "Step 3 — Risk Assessment", description: "Determine likelihood and severity of impact on data subjects.", status: "not_started" },
        { id: "s4", title: "Step 4 — Document in Audit Trail", description: "Capture decisions, communications, and timestamps.", status: "not_started" },
      ],
    };

    addIncident(incident);
    addAudit({ incidentId: ref, actor: "Employee", action: "Breach discovered", ts: discoveredAt });
    addAudit({ incidentId: ref, actor: "Employee", action: "Report submitted via ARIA guided intake" });
    addAudit({ incidentId: ref, actor: "ARIA", action: "Structured intake captured (10-question scripted flow)" });

    setStep("done");
    setDone({ ref });
  }

  /* ------------------------------------------------------------------ */
  /* Done screen                                                         */
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

  /* ------------------------------------------------------------------ */
  /* Render                                                              */
  /* ------------------------------------------------------------------ */

  const risk = computeRisk(answers);
  const progressIdx = Math.min(STEP_ORDER.indexOf(step), 10);

  return (
    <div className="app-light-shell min-h-screen bg-background flex flex-col">
      <header className="flex items-center justify-between px-10 py-4 border-b border-border sticky top-0 bg-background z-10">
        <Wordmark size={20} />
        <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Employee Portal</span>
      </header>

      <div className="flex-1 w-full max-w-[1180px] mx-auto px-6 pt-5 pb-10 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-8">
        {/* ============ LEFT — chat / question flow ============ */}
        <div className="flex flex-col" style={{ height: "calc(100vh - 140px)" }}>
          <div className="flex items-end justify-between mb-4 shrink-0">
            <div>
              <div className="font-serif text-xl leading-none">ARIA</div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mt-1.5">
                AI Breach Response Agent · Guided Intake
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

          {/* progress strip */}
          <div className="flex items-center gap-1 mb-3 shrink-0">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-[3px] flex-1 rounded-full transition-colors",
                  i < progressIdx ? "bg-primary" : i === progressIdx ? "bg-primary/40" : "bg-border",
                )}
              />
            ))}
            <span className="ml-3 text-[10px] uppercase tracking-[0.16em] text-muted-foreground tabular-nums">
              {Math.min(progressIdx + 1, 10)} / 10
            </span>
          </div>

          {/* Chat history */}
          <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1">
            {chat.map((t) =>
              t.kind === "aria" ? (
                <AriaBubble key={t.id} content={t.content} />
              ) : (
                <UserBubble key={t.id} content={t.content} />
              ),
            )}

            {/* Active answer card */}
            <div className="pt-1">
              <AnswerCard
                step={step}
                answers={answers}
                setAnswers={setAnswers}
                onAnswered={(summary, next) => {
                  pushUser(summary);
                  if (next === "done") {
                    submitIncident();
                  } else if (next === "review") {
                    advanceTo("review");
                  } else {
                    advanceTo(next);
                  }
                }}
                onSubmit={submitIncident}
                onEdit={(target) => {
                  setStep(target);
                  pushAria("Of course — let's revisit that. " + ARIA_PROMPTS[target as Exclude<StepId, "done">]);
                }}
              />
            </div>

            <div ref={chatScrollRef} />
          </div>
        </div>

        {/* ============ RIGHT — live summary panel ============ */}
        <aside className="hidden lg:block">
          <div className="sticky top-[88px]">
            <SummaryPanel answers={answers} risk={risk} />
          </div>
        </aside>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Chat bubbles                                                        */
/* ------------------------------------------------------------------ */

function AriaBubble({ content }: { content: string }) {
  return (
    <div className="flex">
      <div className="max-w-[85%] bg-muted text-foreground text-[15px] leading-relaxed px-4 py-3 rounded-sm animate-fade-in">
        <RenderInlineMarkdown text={content} />
      </div>
    </div>
  );
}

function UserBubble({ content }: { content: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] bg-primary text-primary-foreground text-[14px] leading-relaxed px-4 py-3 rounded-sm animate-fade-in whitespace-pre-wrap">
        {content}
      </div>
    </div>
  );
}

/** Tiny inline markdown — bold (**text**) only. Keeps bundle lean. */
function RenderInlineMarkdown({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <p className="m-0">
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**") ? (
          <strong key={i}>{p.slice(2, -2)}</strong>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </p>
  );
}

/* ------------------------------------------------------------------ */
/* AnswerCard — renders the right input UI for the current step        */
/* ------------------------------------------------------------------ */

interface AnswerCardProps {
  step: StepId;
  answers: FlowAnswers;
  setAnswers: React.Dispatch<React.SetStateAction<FlowAnswers>>;
  onAnswered: (userSummary: string, next: StepId) => void;
  onSubmit: () => void;
  onEdit: (target: StepId) => void;
}

function AnswerCard({ step, answers, setAnswers, onAnswered, onSubmit, onEdit }: AnswerCardProps) {
  switch (step) {
    case "q1_discovery":
      return <Q1Discovery answers={answers} setAnswers={setAnswers} onAnswered={onAnswered} />;
    case "q2_incidentTime":
      return <Q2IncidentTime answers={answers} setAnswers={setAnswers} onAnswered={onAnswered} />;
    case "q3_whatHappened":
      return <Q3WhatHappened answers={answers} setAnswers={setAnswers} onAnswered={onAnswered} />;
    case "q4_systems":
      return <Q4Systems answers={answers} setAnswers={setAnswers} onAnswered={onAnswered} />;
    case "q5_dataTypes":
      return <Q5DataTypes answers={answers} setAnswers={setAnswers} onAnswered={onAnswered} />;
    case "q6_count":
      return <Q6Count answers={answers} setAnswers={setAnswers} onAnswered={onAnswered} />;
    case "q7_actions":
      return <Q7Actions answers={answers} setAnswers={setAnswers} onAnswered={onAnswered} />;
    case "q8_exfiltration":
      return <Q8Exfiltration setAnswers={setAnswers} onAnswered={onAnswered} />;
    case "q9_ongoing":
      return <Q9Ongoing setAnswers={setAnswers} onAnswered={onAnswered} />;
    case "q10_awareness":
      return <Q10Awareness answers={answers} setAnswers={setAnswers} onAnswered={onAnswered} />;
    case "review":
      return <ReviewCard answers={answers} onSubmit={onSubmit} onEdit={onEdit} />;
    default:
      return null;
  }
}

/* ------------------------------------------------------------------ */
/* Shared input shell                                                  */
/* ------------------------------------------------------------------ */

function AnswerShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-sm p-4 mt-2 animate-fade-in">
      {children}
    </div>
  );
}

function PrimaryAction({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="bg-primary text-primary-foreground text-[13px] uppercase tracking-[0.16em] px-4 h-9 inline-flex items-center gap-2 rounded-sm hover:bg-primary/90 disabled:opacity-30 transition-colors"
    >
      {children}
      <ArrowUp className="w-3.5 h-3.5 rotate-90" />
    </button>
  );
}

function GhostAction({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground"
    >
      {children}
    </button>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-3 h-8 text-[12px] rounded-full border transition-colors",
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-background border-border text-foreground hover:border-foreground/40",
      )}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Q1 — Discovery                                                      */
/* ------------------------------------------------------------------ */

function Q1Discovery({
  answers,
  setAnswers,
  onAnswered,
}: {
  answers: FlowAnswers;
  setAnswers: React.Dispatch<React.SetStateAction<FlowAnswers>>;
  onAnswered: (s: string, next: StepId) => void;
}) {
  const [pushedBack, setPushedBack] = useState(false);
  const [localDt, setLocalDt] = useState<string>(toLocalInputValue(answers.discoveredAt));
  const [howNoticed, setHowNoticed] = useState(answers.howNoticed ?? "");

  function submit() {
    if (!localDt) return;
    const iso = new Date(localDt).toISOString();
    setAnswers((a) => ({ ...a, discoveredAt: iso, howNoticed }));
    onAnswered(
      `Noticed at ${formatDateTime(iso)}${howNoticed ? ` — ${howNoticed}` : ""}.`,
      "q2_incidentTime",
    );
  }

  function unknown() {
    if (!pushedBack) {
      setPushedBack(true);
      return;
    }
    // Accept after one pushback
    const iso = new Date().toISOString();
    setAnswers((a) => ({ ...a, discoveredAt: iso, howNoticed: howNoticed || "Discovery time unknown" }));
    onAnswered("I don't know exactly when.", "q2_incidentTime");
  }

  return (
    <AnswerShell>
      {pushedBack && (
        <div className="text-[12px] text-muted-foreground border-l-2 border-warning pl-3 mb-3">
          Understood. Even an approximate time helps — the regulatory deadline clock starts from discovery. Can you estimate?
        </div>
      )}
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">When</span>
          <input
            type="datetime-local"
            value={localDt}
            onChange={(e) => setLocalDt(e.target.value)}
            className="mt-1 w-full bg-background border border-border rounded-sm px-3 h-10 text-sm outline-none focus:border-foreground/40"
          />
        </label>
        <label className="block">
          <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">How did you notice?</span>
          <input
            type="text"
            value={howNoticed}
            onChange={(e) => setHowNoticed(e.target.value)}
            placeholder="e.g. unusual login alert, message from colleague…"
            className="mt-1 w-full bg-background border border-border rounded-sm px-3 h-10 text-sm outline-none focus:border-foreground/40"
          />
        </label>
      </div>
      <div className="flex items-center justify-between mt-4">
        <GhostAction onClick={unknown}>I don't know</GhostAction>
        <PrimaryAction onClick={submit} disabled={!localDt}>Continue</PrimaryAction>
      </div>
    </AnswerShell>
  );
}

/* ------------------------------------------------------------------ */
/* Q2 — Incident Time                                                  */
/* ------------------------------------------------------------------ */

function Q2IncidentTime({
  answers,
  setAnswers,
  onAnswered,
}: {
  answers: FlowAnswers;
  setAnswers: React.Dispatch<React.SetStateAction<FlowAnswers>>;
  onAnswered: (s: string, next: StepId) => void;
}) {
  const [localDt, setLocalDt] = useState<string>(toLocalInputValue(answers.incidentTime));

  function submit() {
    if (!localDt) return;
    const iso = new Date(localDt).toISOString();
    setAnswers((a) => ({ ...a, incidentTimeMode: "specific", incidentTime: iso }));
    onAnswered(`Incident began around ${formatDateTime(iso)}.`, "q3_whatHappened");
  }
  function sameAsDiscovery() {
    setAnswers((a) => ({ ...a, incidentTimeMode: "same", incidentTime: undefined }));
    onAnswered("Same as discovery time.", "q3_whatHappened");
  }
  function unknown() {
    setAnswers((a) => ({ ...a, incidentTimeMode: "unknown", incidentTime: undefined }));
    onAnswered("I don't know when it actually started.", "q3_whatHappened");
  }

  return (
    <AnswerShell>
      <label className="block">
        <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Approximate start time</span>
        <input
          type="datetime-local"
          value={localDt}
          onChange={(e) => setLocalDt(e.target.value)}
          className="mt-1 w-full bg-background border border-border rounded-sm px-3 h-10 text-sm outline-none focus:border-foreground/40"
        />
      </label>
      <div className="flex flex-wrap items-center justify-between gap-2 mt-4">
        <div className="flex items-center gap-3">
          <GhostAction onClick={sameAsDiscovery}>Same as discovery</GhostAction>
          <span className="text-border">·</span>
          <GhostAction onClick={unknown}>I don't know</GhostAction>
        </div>
        <PrimaryAction onClick={submit} disabled={!localDt}>Continue</PrimaryAction>
      </div>
    </AnswerShell>
  );
}

/* ------------------------------------------------------------------ */
/* Q3 — What Happened                                                  */
/* ------------------------------------------------------------------ */

function Q3WhatHappened({
  answers,
  setAnswers,
  onAnswered,
}: {
  answers: FlowAnswers;
  setAnswers: React.Dispatch<React.SetStateAction<FlowAnswers>>;
  onAnswered: (s: string, next: StepId) => void;
}) {
  const [text, setText] = useState(answers.whatHappened ?? "");
  const [hint, setHint] = useState<string | undefined>(answers.whatHappenedHint);
  const [pushedBack, setPushedBack] = useState(false);

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

  function submit() {
    if (wordCount < 10 && !pushedBack) {
      setPushedBack(true);
      return;
    }
    setAnswers((a) => ({ ...a, whatHappened: text, whatHappenedHint: hint }));
    onAnswered(
      hint && !text ? hint : text || hint || "(no description provided)",
      "q4_systems",
    );
  }

  return (
    <AnswerShell>
      {pushedBack && wordCount < 10 && (
        <div className="text-[12px] text-muted-foreground border-l-2 border-warning pl-3 mb-3">
          Could you describe it in a bit more detail? Even a rough description helps us assess the situation.
        </div>
      )}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        placeholder="Describe what happened in your own words…"
        className="w-full bg-background border border-border rounded-sm px-3 py-2 text-sm outline-none focus:border-foreground/40 resize-y min-h-[96px]"
      />
      <div className="flex flex-wrap gap-2 mt-3">
        {WHAT_HAPPENED_HINTS.map((h) => (
          <Chip key={h} active={hint === h} onClick={() => setHint(hint === h ? undefined : h)}>
            {h}
          </Chip>
        ))}
      </div>
      <div className="flex items-center justify-between mt-4">
        <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          {wordCount} word{wordCount === 1 ? "" : "s"}
        </span>
        <PrimaryAction onClick={submit} disabled={!text.trim() && !hint}>Continue</PrimaryAction>
      </div>
    </AnswerShell>
  );
}

/* ------------------------------------------------------------------ */
/* Q4 — Systems Affected                                               */
/* ------------------------------------------------------------------ */

function Q4Systems({
  answers,
  setAnswers,
  onAnswered,
}: {
  answers: FlowAnswers;
  setAnswers: React.Dispatch<React.SetStateAction<FlowAnswers>>;
  onAnswered: (s: string, next: StepId) => void;
}) {
  const [selected, setSelected] = useState<string[]>(answers.systemsAffected ?? []);
  const [note, setNote] = useState(answers.systemsNote ?? "");

  function toggle(opt: string) {
    setSelected((s) => (s.includes(opt) ? s.filter((x) => x !== opt) : [...s, opt]));
  }

  function submit() {
    setAnswers((a) => ({ ...a, systemsAffected: selected, systemsNote: note, systemsUnknown: false }));
    const summary = selected.length
      ? `Systems affected: ${selected.join(", ")}${note ? ` — ${note}` : ""}.`
      : note
      ? note
      : "(no systems specified)";
    onAnswered(summary, "q5_dataTypes");
  }

  function unknown() {
    setAnswers((a) => ({ ...a, systemsAffected: [], systemsNote: "", systemsUnknown: true }));
    onAnswered("I don't know which systems are affected.", "q5_dataTypes");
  }

  return (
    <AnswerShell>
      <div className="flex flex-wrap gap-2">
        {SYSTEMS_OPTIONS.map((opt) => (
          <Chip key={opt} active={selected.includes(opt)} onClick={() => toggle(opt)}>
            {opt}
          </Chip>
        ))}
      </div>
      <input
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Add detail (optional)…"
        className="mt-3 w-full bg-background border border-border rounded-sm px-3 h-10 text-sm outline-none focus:border-foreground/40"
      />
      <div className="flex items-center justify-between mt-4">
        <GhostAction onClick={unknown}>I don't know</GhostAction>
        <PrimaryAction onClick={submit} disabled={!selected.length && !note.trim()}>Continue</PrimaryAction>
      </div>
    </AnswerShell>
  );
}

/* ------------------------------------------------------------------ */
/* Q5 — Data Types                                                     */
/* ------------------------------------------------------------------ */

function Q5DataTypes({
  answers,
  setAnswers,
  onAnswered,
}: {
  answers: FlowAnswers;
  setAnswers: React.Dispatch<React.SetStateAction<FlowAnswers>>;
  onAnswered: (s: string, next: StepId) => void;
}) {
  const [selected, setSelected] = useState<DataCategoryKey[]>(answers.dataCategories ?? []);
  const [pushedBack, setPushedBack] = useState(false);

  function toggle(k: DataCategoryKey) {
    setSelected((s) => (s.includes(k) ? s.filter((x) => x !== k) : [...s, k]));
  }
  function submit() {
    if (!selected.length) {
      setPushedBack(true);
      return;
    }
    setAnswers((a) => ({ ...a, dataCategories: selected }));
    const labels = selected.map((k) => DATA_CATEGORIES.find((d) => d.key === k)?.label).filter(Boolean);
    onAnswered(`Data involved: ${labels.join(", ")}.`, "q6_count");
  }

  return (
    <AnswerShell>
      {pushedBack && !selected.length && (
        <div className="text-[12px] text-muted-foreground border-l-2 border-warning pl-3 mb-3">
          Please select at least one option — even "I'm not sure" helps us flag the right indicators.
        </div>
      )}
      <div className="grid sm:grid-cols-2 gap-2">
        {DATA_CATEGORIES.map((d) => {
          const active = selected.includes(d.key);
          return (
            <button
              key={d.key}
              type="button"
              onClick={() => toggle(d.key)}
              className={cn(
                "flex items-start gap-3 text-left p-3 rounded-sm border transition-colors",
                active
                  ? "bg-primary/5 border-primary"
                  : "bg-background border-border hover:border-foreground/40",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 w-4 h-4 rounded-sm border flex items-center justify-center shrink-0",
                  active ? "bg-primary border-primary" : "border-border",
                )}
              >
                {active && (
                  <svg className="w-3 h-3 text-primary-foreground" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M16.7 5.3a1 1 0 010 1.4l-7.4 7.4a1 1 0 01-1.4 0L3.3 9.5a1 1 0 011.4-1.4l3.2 3.2 6.7-6.7a1 1 0 011.4 0z" />
                  </svg>
                )}
              </span>
              <span className="text-sm leading-snug flex-1">
                {d.label}
                {d.high && (
                  <span className="ml-2 inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.12em] text-warning">
                    <AlertTriangle className="w-3 h-3" /> High sensitivity
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
      <div className="flex justify-end mt-4">
        <PrimaryAction onClick={submit}>Continue</PrimaryAction>
      </div>
    </AnswerShell>
  );
}

/* ------------------------------------------------------------------ */
/* Q6 — Affected Count                                                 */
/* ------------------------------------------------------------------ */

function Q6Count({
  answers,
  setAnswers,
  onAnswered,
}: {
  answers: FlowAnswers;
  setAnswers: React.Dispatch<React.SetStateAction<FlowAnswers>>;
  onAnswered: (s: string, next: StepId) => void;
}) {
  const [selected, setSelected] = useState<AffectedRangeKey | undefined>(answers.affectedRange);
  const [pushedBack, setPushedBack] = useState(false);

  function pick(k: AffectedRangeKey) {
    setSelected(k);
    if (k === "unknown" && !pushedBack) {
      setPushedBack(true);
      return;
    }
    setAnswers((a) => ({ ...a, affectedRange: k }));
    const label = AFFECTED_RANGES.find((r) => r.key === k)?.label ?? "";
    onAnswered(`Approximately: ${label}.`, "q7_actions");
  }

  return (
    <AnswerShell>
      {pushedBack && selected === "unknown" && (
        <div className="text-[12px] text-muted-foreground border-l-2 border-warning pl-3 mb-3">
          Even a rough order of magnitude helps — are we talking about tens, hundreds, or thousands of people?
        </div>
      )}
      <div className="grid sm:grid-cols-2 gap-2">
        {AFFECTED_RANGES.map((r) => (
          <button
            key={r.key}
            type="button"
            onClick={() => pick(r.key)}
            className={cn(
              "px-3 h-10 text-sm rounded-sm border text-left transition-colors",
              selected === r.key
                ? "bg-primary/5 border-primary"
                : "bg-background border-border hover:border-foreground/40",
            )}
          >
            {r.label}
          </button>
        ))}
      </div>
    </AnswerShell>
  );
}

/* ------------------------------------------------------------------ */
/* Q7 — Actions Taken                                                  */
/* ------------------------------------------------------------------ */

function Q7Actions({
  answers,
  setAnswers,
  onAnswered,
}: {
  answers: FlowAnswers;
  setAnswers: React.Dispatch<React.SetStateAction<FlowAnswers>>;
  onAnswered: (s: string, next: StepId) => void;
}) {
  const [selected, setSelected] = useState<ActionKey[]>(answers.actionsTaken ?? []);
  const [note, setNote] = useState(answers.actionsNote ?? "");

  function toggle(k: ActionKey) {
    setSelected((s) => {
      if (k === "nothing") return s.includes("nothing") ? [] : ["nothing"];
      const without = s.filter((x) => x !== "nothing");
      return without.includes(k) ? without.filter((x) => x !== k) : [...without, k];
    });
  }

  function submit() {
    setAnswers((a) => ({ ...a, actionsTaken: selected, actionsNote: note }));
    const labels = selected.map((k) => ACTION_OPTIONS.find((a) => a.key === k)?.label).filter(Boolean);
    onAnswered(
      labels.length ? `Actions: ${labels.join(", ")}${note ? ` — ${note}` : ""}.` : note || "No actions yet.",
      "q8_exfiltration",
    );
  }

  const showDeletedWarning = selected.includes("deleted");

  return (
    <AnswerShell>
      <div className="flex flex-wrap gap-2">
        {ACTION_OPTIONS.map((opt) => (
          <Chip key={opt.key} active={selected.includes(opt.key)} onClick={() => toggle(opt.key)}>
            {opt.label}
          </Chip>
        ))}
      </div>
      {showDeletedWarning && (
        <div className="mt-3 flex items-start gap-2 bg-warning/10 border border-warning/40 rounded-sm p-3 text-[12px] text-foreground">
          <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
          <span>
            <strong>Important:</strong> Deleting files before a forensic snapshot may affect evidence preservation. Your DPO will be informed.
          </span>
        </div>
      )}
      <input
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Any other details?"
        className="mt-3 w-full bg-background border border-border rounded-sm px-3 h-10 text-sm outline-none focus:border-foreground/40"
      />
      <div className="flex justify-end mt-4">
        <PrimaryAction onClick={submit} disabled={!selected.length && !note.trim()}>Continue</PrimaryAction>
      </div>
    </AnswerShell>
  );
}

/* ------------------------------------------------------------------ */
/* Q8 — Exfiltration                                                   */
/* ------------------------------------------------------------------ */

function Q8Exfiltration({
  setAnswers,
  onAnswered,
}: {
  setAnswers: React.Dispatch<React.SetStateAction<FlowAnswers>>;
  onAnswered: (s: string, next: StepId) => void;
}) {
  function pick(v: "yes" | "possibly" | "no", label: string) {
    setAnswers((a) => ({ ...a, exfiltration: v }));
    onAnswered(label, "q9_ongoing");
  }
  return (
    <AnswerShell>
      <div className="grid sm:grid-cols-3 gap-2">
        <BigChoice
          label="Yes"
          sublabel="Data likely left the organisation"
          tone="danger"
          onClick={() => pick("yes", "Yes — data likely left the organisation.")}
        />
        <BigChoice
          label="Possibly"
          sublabel="I'm not sure"
          tone="warning"
          onClick={() => pick("possibly", "Possibly — I'm not sure.")}
        />
        <BigChoice
          label="No"
          sublabel="I don't think so"
          tone="default"
          onClick={() => pick("no", "No — I don't think data left.")}
        />
      </div>
    </AnswerShell>
  );
}

/* ------------------------------------------------------------------ */
/* Q9 — Ongoing                                                        */
/* ------------------------------------------------------------------ */

function Q9Ongoing({
  setAnswers,
  onAnswered,
}: {
  setAnswers: React.Dispatch<React.SetStateAction<FlowAnswers>>;
  onAnswered: (s: string, next: StepId) => void;
}) {
  const [picked, setPicked] = useState<boolean | null>(null);

  function pick(v: boolean) {
    setPicked(v);
    setAnswers((a) => ({ ...a, ongoing: v }));
    // Show urgent banner briefly before advancing if "yes"
    setTimeout(
      () => onAnswered(v ? "Yes — still ongoing." : "No — I believe it's contained.", "q10_awareness"),
      v ? 900 : 200,
    );
  }

  return (
    <AnswerShell>
      <div className="grid sm:grid-cols-2 gap-2">
        <BigChoice
          label="Yes"
          sublabel="Still ongoing"
          tone="danger"
          onClick={() => pick(true)}
        />
        <BigChoice
          label="No"
          sublabel="I believe it's contained"
          tone="default"
          onClick={() => pick(false)}
        />
      </div>
      {picked === true && (
        <div className="mt-3 flex items-start gap-2 bg-destructive/10 border border-destructive/40 rounded-sm p-3 text-[12px] text-foreground animate-fade-in">
          <ShieldAlert className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
          <span>
            <strong className="text-destructive">Active threat detected.</strong> Your DPO will be notified immediately with high priority.
          </span>
        </div>
      )}
    </AnswerShell>
  );
}

/* ------------------------------------------------------------------ */
/* Q10 — Awareness                                                     */
/* ------------------------------------------------------------------ */

function Q10Awareness({
  answers,
  setAnswers,
  onAnswered,
}: {
  answers: FlowAnswers;
  setAnswers: React.Dispatch<React.SetStateAction<FlowAnswers>>;
  onAnswered: (s: string, next: StepId) => void;
}) {
  const [selected, setSelected] = useState<AwarenessKey[]>(answers.whoKnows ?? []);
  const [note, setNote] = useState(answers.whoKnowsNote ?? "");

  function toggle(k: AwarenessKey) {
    setSelected((s) => {
      if (k === "nobody") return s.includes("nobody") ? [] : ["nobody"];
      const without = s.filter((x) => x !== "nobody");
      return without.includes(k) ? without.filter((x) => x !== k) : [...without, k];
    });
  }

  function submit() {
    setAnswers((a) => ({ ...a, whoKnows: selected, whoKnowsNote: note }));
    const labels = selected.map((k) => AWARENESS_OPTIONS.find((a) => a.key === k)?.label).filter(Boolean);
    onAnswered(
      labels.length ? `Aware: ${labels.join(", ")}${note ? ` — ${note}` : ""}.` : note || "(no awareness info)",
      "review",
    );
  }

  return (
    <AnswerShell>
      <div className="flex flex-wrap gap-2">
        {AWARENESS_OPTIONS.map((opt) => (
          <Chip key={opt.key} active={selected.includes(opt.key)} onClick={() => toggle(opt.key)}>
            {opt.label}
          </Chip>
        ))}
      </div>
      <input
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Any names or roles?"
        className="mt-3 w-full bg-background border border-border rounded-sm px-3 h-10 text-sm outline-none focus:border-foreground/40"
      />
      <div className="flex justify-end mt-4">
        <PrimaryAction onClick={submit} disabled={!selected.length && !note.trim()}>Continue</PrimaryAction>
      </div>
    </AnswerShell>
  );
}

/* ------------------------------------------------------------------ */
/* Big choice card                                                     */
/* ------------------------------------------------------------------ */

function BigChoice({
  label,
  sublabel,
  tone,
  onClick,
}: {
  label: string;
  sublabel: string;
  tone: "danger" | "warning" | "default";
  onClick: () => void;
}) {
  const toneCls =
    tone === "danger"
      ? "hover:border-destructive hover:bg-destructive/5"
      : tone === "warning"
      ? "hover:border-warning hover:bg-warning/5"
      : "hover:border-foreground/40";
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "text-left p-4 rounded-sm border border-border bg-background transition-colors",
        toneCls,
      )}
    >
      <div className="font-serif text-lg leading-tight">{label}</div>
      <div className="text-[12px] text-muted-foreground mt-1">{sublabel}</div>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Review screen                                                       */
/* ------------------------------------------------------------------ */

function ReviewCard({
  answers,
  onSubmit,
  onEdit,
}: {
  answers: FlowAnswers;
  onSubmit: () => void;
  onEdit: (target: StepId) => void;
}) {
  const rows: { label: string; value: React.ReactNode; step: StepId }[] = [
    {
      label: "Discovery",
      value: answers.discoveredAt
        ? `${formatDateTime(answers.discoveredAt)}${answers.howNoticed ? ` — ${answers.howNoticed}` : ""}`
        : "—",
      step: "q1_discovery",
    },
    {
      label: "Incident time",
      value:
        answers.incidentTimeMode === "specific" && answers.incidentTime
          ? formatDateTime(answers.incidentTime)
          : answers.incidentTimeMode === "same"
          ? "Same as discovery"
          : "Unknown",
      step: "q2_incidentTime",
    },
    {
      label: "What happened",
      value:
        (answers.whatHappenedHint ? `[${answers.whatHappenedHint}] ` : "") +
        (answers.whatHappened || "—"),
      step: "q3_whatHappened",
    },
    {
      label: "Systems affected",
      value: answers.systemsAffected?.length
        ? answers.systemsAffected.join(", ") + (answers.systemsNote ? ` — ${answers.systemsNote}` : "")
        : answers.systemsUnknown
        ? "Unknown"
        : "—",
      step: "q4_systems",
    },
    {
      label: "Data involved",
      value:
        answers.dataCategories
          ?.map((k) => DATA_CATEGORIES.find((d) => d.key === k)?.label)
          .filter(Boolean)
          .join(", ") || "—",
      step: "q5_dataTypes",
    },
    {
      label: "Affected count",
      value:
        AFFECTED_RANGES.find((r) => r.key === answers.affectedRange)?.label ?? "—",
      step: "q6_count",
    },
    {
      label: "Actions taken",
      value:
        (answers.actionsTaken
          ?.map((k) => ACTION_OPTIONS.find((a) => a.key === k)?.label)
          .filter(Boolean)
          .join(", ") || "—") +
        (answers.actionsNote ? ` — ${answers.actionsNote}` : ""),
      step: "q7_actions",
    },
    {
      label: "Data exfiltration",
      value:
        answers.exfiltration === "yes"
          ? "Yes — likely left organisation"
          : answers.exfiltration === "possibly"
          ? "Possibly"
          : answers.exfiltration === "no"
          ? "No"
          : "—",
      step: "q8_exfiltration",
    },
    {
      label: "Still ongoing",
      value: answers.ongoing === true ? "Yes — active" : answers.ongoing === false ? "No — contained" : "—",
      step: "q9_ongoing",
    },
    {
      label: "Awareness",
      value:
        (answers.whoKnows
          ?.map((k) => AWARENESS_OPTIONS.find((a) => a.key === k)?.label)
          .filter(Boolean)
          .join(", ") || "—") +
        (answers.whoKnowsNote ? ` — ${answers.whoKnowsNote}` : ""),
      step: "q10_awareness",
    },
  ];

  return (
    <AnswerShell>
      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
        {rows.map((r) => (
          <div key={r.label} className="flex flex-col">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{r.label}</span>
              <button
                onClick={() => onEdit(r.step)}
                className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground"
              >
                Edit
              </button>
            </div>
            <div className="text-sm mt-1 break-words">{r.value}</div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-5 pt-4 border-t border-border">
        <GhostAction onClick={() => onEdit("q1_discovery")}>Edit answers</GhostAction>
        <PrimaryAction onClick={onSubmit}>Submit to DPO</PrimaryAction>
      </div>
    </AnswerShell>
  );
}

/* ------------------------------------------------------------------ */
/* Live summary panel (right)                                          */
/* ------------------------------------------------------------------ */

function SummaryPanel({
  answers,
  risk,
}: {
  answers: FlowAnswers;
  risk: { level: RiskLevel; reasons: string[] };
}) {
  const riskMeta = {
    high:   { dot: "bg-destructive", label: "High",   text: "text-destructive" },
    medium: { dot: "bg-warning",     label: "Medium", text: "text-warning"     },
    low:    { dot: "bg-success",     label: "Low",    text: "text-success"     },
  }[risk.level];

  const dataLabels =
    answers.dataCategories
      ?.map((k) => DATA_CATEGORIES.find((d) => d.key === k)?.label)
      .filter(Boolean) ?? [];

  return (
    <div className="bg-card border border-border rounded-sm p-4">
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Live Intake Summary</div>

      {/* Risk indicator */}
      <div className="mt-4 flex items-center gap-3">
        <span className={cn("inline-block w-2.5 h-2.5 rounded-full", riskMeta.dot)} />
        <div>
          <div className={cn("font-serif text-lg leading-none", riskMeta.text)}>Risk: {riskMeta.label}</div>
          {answers.ongoing && (
            <div className="mt-1 text-[10px] uppercase tracking-[0.16em] text-destructive">
              ⚡ Urgent · active incident
            </div>
          )}
        </div>
      </div>

      {risk.reasons.length > 0 && (
        <ul className="mt-3 space-y-1">
          {risk.reasons.slice(0, 4).map((r, i) => (
            <li key={i} className="text-[12px] text-muted-foreground leading-snug pl-3 relative">
              <span className="absolute left-0 top-1.5 w-1 h-1 rounded-full bg-muted-foreground/60" />
              {r}
            </li>
          ))}
        </ul>
      )}

      <div className="h-px bg-border my-4" />

      <SummaryRow label="Discovery" value={answers.discoveredAt ? formatDateTime(answers.discoveredAt) : "—"} />
      <SummaryRow
        label="Incident start"
        value={
          answers.incidentTimeMode === "specific" && answers.incidentTime
            ? formatDateTime(answers.incidentTime)
            : answers.incidentTimeMode === "same"
            ? "Same as discovery"
            : answers.incidentTimeMode === "unknown"
            ? "Unknown"
            : "—"
        }
      />
      <SummaryRow label="Category" value={answers.whatHappenedHint ?? (answers.whatHappened ? "Described" : "—")} />
      <SummaryRow
        label="Systems"
        value={
          answers.systemsAffected?.length ? answers.systemsAffected.join(", ") : answers.systemsUnknown ? "Unknown" : "—"
        }
      />
      <SummaryRow
        label="Data involved"
        value={dataLabels.length ? dataLabels.join(", ") : "—"}
      />
      <SummaryRow
        label="Affected"
        value={AFFECTED_RANGES.find((r) => r.key === answers.affectedRange)?.label ?? "—"}
      />
      <SummaryRow
        label="Exfiltration"
        value={
          answers.exfiltration === "yes"
            ? "Yes"
            : answers.exfiltration === "possibly"
            ? "Possibly"
            : answers.exfiltration === "no"
            ? "No"
            : "—"
        }
      />
      <SummaryRow
        label="Status"
        value={answers.ongoing === true ? "Ongoing" : answers.ongoing === false ? "Contained" : "—"}
      />

      <div className="mt-4 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        ARIA collects facts only · she does not give legal advice
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[90px_minmax(0,1fr)] gap-3 py-1.5">
      <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground pt-0.5">{label}</div>
      <div className="text-[12px] text-foreground break-words">{value}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* utils                                                               */
/* ------------------------------------------------------------------ */

function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function toLocalInputValue(iso?: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return "";
  }
}

export default Employee;
