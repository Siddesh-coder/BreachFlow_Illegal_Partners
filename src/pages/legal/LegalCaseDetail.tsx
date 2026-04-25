import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { AlertTriangle, BookOpen, FileText, Search } from "lucide-react";
import { useApp } from "@/state/AppContext";
import { SeverityBadge } from "@/components/SeverityBadge";
import { IndicatorScoreboard } from "@/components/IndicatorScoreboard";
import { DeadlinePanel } from "@/components/DeadlinePanel";
import { cn } from "@/lib/utils";
import type {
  Art34Verdict,
  ClassificationVerdict,
  Nis2Verdict,
} from "@/types/incident";

const ART33_OPTIONS: { value: ClassificationVerdict; label: string }[] = [
  { value: "notifiable", label: "Notifiable" },
  { value: "not_notifiable", label: "Not notifiable" },
  { value: "exempt", label: "Exempt" },
];
const ART34_OPTIONS: { value: Art34Verdict; label: string }[] = [
  { value: "required", label: "Required" },
  { value: "not_required", label: "Not required" },
  { value: "exempt", label: "Exempt" },
];
const NIS2_OPTIONS: { value: Nis2Verdict; label: string }[] = [
  { value: "yes_24h", label: "Yes — 24h early warning required" },
  { value: "no", label: "No" },
  { value: "under_review", label: "Under review" },
];

interface FactRow {
  label: string;
  value: string;
  source: "intake" | "IT system" | "contract" | "forensics";
  confidence: "verified" | "extracted" | "estimated" | "open";
}

const LegalCaseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    incidents,
    user,
    addClassification,
    addAudit,
    setIndicatorOverride,
    addNotification,
  } = useApp();
  const incident = useMemo(() => incidents.find((i) => i.id === id), [incidents, id]);

  // form state
  const latest = incident?.classifications?.[0];
  const [art33, setArt33] = useState<ClassificationVerdict | "">(latest?.art33 ?? "");
  const [authority, setAuthority] = useState<string>(
    latest?.competentAuthority ?? incident?.notifiability?.authority ?? "",
  );
  const [art34, setArt34] = useState<Art34Verdict | "">(latest?.art34 ?? "");
  const [nis2, setNis2] = useState<Nis2Verdict | "">(latest?.nis2 ?? "");
  const [rationale, setRationale] = useState<string>(latest?.rationale ?? "");
  const [openQ, setOpenQ] = useState<string>(latest?.openQuestionsForDpo ?? "");

  if (!incident) {
    return (
      <div className="px-10 py-10">
        <p className="text-sm text-muted-foreground">Case not found.</p>
        <Link to="/legal" className="mt-4 inline-block underline text-sm">
          Back to case files
        </Link>
      </div>
    );
  }

  const facts: FactRow[] = [
    {
      label: "Discovered at",
      value: format(new Date(incident.discoveredAt), "PPP 'at' p"),
      source: "intake",
      confidence: "verified",
    },
    {
      label: "What happened",
      value: incident.whatHappened,
      source: "intake",
      confidence: "extracted",
    },
    {
      label: "Data types",
      value: incident.dataTypes.join(", ") || "—",
      source: "intake",
      confidence: "extracted",
    },
    {
      label: "Affected count",
      value:
        incident.affectedCount != null
          ? `${incident.affectedCount.toLocaleString()} individuals`
          : "Not provided",
      source: "intake",
      confidence: incident.affectedCount != null ? "estimated" : "open",
    },
    {
      label: "Countries",
      value: incident.countries.join(", ") || "—",
      source: "intake",
      confidence: "verified",
    },
    {
      label: "Containment",
      value: incident.contained === null ? "Not known" : incident.contained ? "Contained" : "Not contained",
      source: "IT system",
      confidence: incident.contained === null ? "open" : "verified",
    },
    {
      label: "NIS2 sector",
      value: incident.nis2Sector ?? "Not declared",
      source: "intake",
      confidence: incident.nis2Sector ? "verified" : "open",
    },
    {
      label: "Cyber insurance",
      value: incident.cyberInsurance ? "Active policy on file" : "Not declared",
      source: "contract",
      confidence: incident.cyberInsurance ? "verified" : "open",
    },
  ];

  const hasOpenFacts = facts.some((f) => f.confidence === "open");

  function flagFactToDpo(label: string) {
    addAudit({
      incidentId: incident!.id,
      actor: "Legal Counsel",
      action: `Re-assessment triggered: fact "${label}" requires verification`,
    });
    addNotification({
      incidentId: incident!.id,
      type: "Internal",
      status: "Draft",
      date: new Date().toISOString(),
      subject: `Verification request — ${label}`,
      body:
        `Legal Counsel has flagged the following fact as requiring verification by the DPO:\n\n` +
        `· ${label}\n\nPlease confirm or update intake data and re-submit.`,
    });
  }

  function handleSaveDraft() {
    if (!incident) return;
    addAudit({
      incidentId: incident.id,
      actor: "Legal Counsel",
      action: `Classification draft saved`,
    });
  }

  function handleRelease() {
    if (!incident) return;
    if (!rationale.trim()) {
      alert("Legal rationale is mandatory before releasing a classification.");
      return;
    }
    if (!art33 || !art34 || !nis2) {
      alert("All three classification fields must be set.");
      return;
    }
    const created = addClassification({
      incidentId: incident.id,
      authorEmail: user?.email ?? "legal@demo.com",
      authorName: user?.name ?? "Legal Counsel",
      art33: art33 as ClassificationVerdict,
      competentAuthority: authority,
      art34: art34 as Art34Verdict,
      nis2: nis2 as Nis2Verdict,
      rationale,
      openQuestionsForDpo: openQ || undefined,
    });
    addAudit({
      incidentId: incident.id,
      actor: "Legal Counsel",
      action:
        `Legal classification recorded (v${created.version}) — ` +
        `Art. 33: ${created.art33}, Art. 34: ${created.art34}, NIS2: ${created.nis2}`,
    });
  }

  return (
    <div className="px-10 py-10 max-w-[1400px] mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <button
            onClick={() => navigate("/legal")}
            className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
          >
            ← All case files
          </button>
          <h1 className="font-serif text-[32px] leading-tight mt-2">
            Case File · #{incident.id}
          </h1>
          <div className="mt-2 flex items-center gap-3 flex-wrap">
            <SeverityBadge severity={incident.severity} />
            <span className="text-xs text-muted-foreground">
              Reported {format(new Date(incident.reportedAt), "d LLL yyyy, HH:mm")}
            </span>
            {incident.classifications && incident.classifications.length > 0 && (
              <span className="text-[10px] uppercase tracking-[0.18em] border border-success/40 text-success bg-success/5 rounded-sm px-2 py-1">
                Classified · v{incident.classifications[0].version}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Deadline panel */}
      <section className="mt-8">
        <DeadlinePanel incident={incident} />
      </section>

      {/* 4-panel grid */}
      <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel 1 — Incident Facts */}
        <section className="bg-card border border-border shadow-card rounded-sm">
          <div className="px-6 pt-5 pb-3 border-b border-border flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-serif text-[18px]">Incident Facts</h2>
          </div>
          <ul className="px-6 py-5 space-y-3">
            {facts.map((f) => (
              <li
                key={f.label}
                className={cn(
                  "grid grid-cols-[140px_1fr_auto] gap-3 items-start text-sm",
                  f.confidence === "open" && "text-warning",
                )}
              >
                <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground pt-1">
                  {f.label}
                </span>
                <span className="leading-relaxed">{f.value}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] uppercase tracking-[0.16em] border border-border rounded-sm px-1.5 py-0.5">
                    {f.source}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] uppercase tracking-[0.16em] border rounded-sm px-1.5 py-0.5",
                      f.confidence === "verified" && "border-success/40 text-success",
                      f.confidence === "extracted" && "border-border text-muted-foreground",
                      f.confidence === "estimated" && "border-warning/40 text-warning",
                      f.confidence === "open" && "border-warning text-warning bg-warning/5",
                    )}
                  >
                    {f.confidence}
                  </span>
                  {f.confidence === "open" && (
                    <button
                      onClick={() => flagFactToDpo(f.label)}
                      className="text-[10px] uppercase tracking-[0.16em] border border-border rounded-sm px-1.5 py-0.5 hover:bg-accent"
                      title="Mark as requires verification — routes back to DPO"
                    >
                      → DPO
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
          {hasOpenFacts && (
            <div className="px-6 py-3 border-t border-border text-[11px] text-warning bg-warning/5">
              <AlertTriangle className="w-3 h-3 inline-block mr-1.5 -mt-0.5" />
              One or more facts are open. Click "→ DPO" to request verification.
            </div>
          )}
        </section>

        {/* Panel 2 — Indicator Scoreboards */}
        <section className="space-y-4">
          <IndicatorScoreboard
            incident={incident}
            regime="gdpr_33"
            showSources
            showIndicatorOnlyLabel
            onOverride={(criterionId, next) => {
              setIndicatorOverride(incident.id, `gdpr_33:${criterionId}`, next);
              addAudit({
                incidentId: incident.id,
                actor: "Legal Counsel",
                action: `Indicator overridden — gdpr_33:${criterionId} → ${next}`,
              });
            }}
          />
          <IndicatorScoreboard
            incident={incident}
            regime="gdpr_34"
            showSources
            showIndicatorOnlyLabel
            onOverride={(criterionId, next) => {
              setIndicatorOverride(incident.id, `gdpr_34:${criterionId}`, next);
              addAudit({
                incidentId: incident.id,
                actor: "Legal Counsel",
                action: `Indicator overridden — gdpr_34:${criterionId} → ${next}`,
              });
            }}
          />
          {incident.nis2Sector && incident.nis2Sector !== "Not Applicable" && (
            <IndicatorScoreboard
              incident={incident}
              regime="nis2_23"
              showSources
              showIndicatorOnlyLabel
              onOverride={(criterionId, next) => {
                setIndicatorOverride(incident.id, `nis2_23:${criterionId}`, next);
                addAudit({
                  incidentId: incident.id,
                  actor: "Legal Counsel",
                  action: `Indicator overridden — nis2_23:${criterionId} → ${next}`,
                });
              }}
            />
          )}
          <div className="text-[11px] text-muted-foreground bg-warning/5 border border-warning/20 rounded-sm px-3 py-2">
            Estimates above are subject to verification by Legal Counsel.
          </div>
        </section>

        {/* Panel 3 — Knowledge Panel */}
        <section className="bg-card border border-border shadow-card rounded-sm">
          <div className="px-6 pt-5 pb-3 border-b border-border flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-serif text-[18px]">Knowledge Panel</h2>
          </div>
          <div className="px-6 py-5 space-y-5 text-sm">
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-1.5">
                Applicable provisions
              </div>
              <ul className="space-y-2 text-sm leading-relaxed">
                <li>
                  <span className="font-serif">GDPR Art. 33</span> — Notification
                  to the supervisory authority of a personal data breach without
                  undue delay and, where feasible, no later than 72 hours after
                  becoming aware.
                </li>
                <li>
                  <span className="font-serif">GDPR Art. 34</span> — Communication
                  of a personal data breach to the data subject when the breach
                  is likely to result in a high risk to rights and freedoms.
                </li>
                <li>
                  <span className="font-serif">NIS2 Art. 23</span> — Significant
                  incident reporting: 24h early warning, 72h incident
                  notification, 1-month final report.
                </li>
                <li className="text-muted-foreground">
                  Reference: EDPB Guidelines 9/2022 on personal data breach
                  notification.
                </li>
              </ul>
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-1.5">
                Authority routing facts
              </div>
              <ul className="space-y-1.5 text-sm leading-relaxed">
                <li>
                  Countries on file:{" "}
                  <span className="font-serif">{incident.countries.join(", ") || "—"}</span> →
                  competent DPA per objective rule (one-stop-shop where applicable).
                </li>
                {incident.nis2Sector && incident.nis2Sector !== "Not Applicable" && (
                  <li>
                    Sector: <span className="font-serif">{incident.nis2Sector}</span> → NIS2 track active.
                  </li>
                )}
              </ul>
              <div className="mt-2 text-[11px] text-muted-foreground italic">
                Authority selection is Legal Counsel's decision based on these facts.
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                addAudit({
                  incidentId: incident.id,
                  actor: "Legal Counsel",
                  action: `Otto Schmidt legal database queried`,
                })
              }
              className="inline-flex items-center gap-2 border border-border bg-secondary px-3 py-2 text-[11px] uppercase tracking-[0.16em] rounded-sm hover:bg-accent transition-colors"
            >
              <Search className="w-3 h-3" /> Query Legal Database (Otto Schmidt)
            </button>
            <div className="text-[10px] text-muted-foreground">
              Powered by Otto Schmidt API.
            </div>
          </div>
        </section>

        {/* Panel 4 — Classification */}
        <section className="bg-card border border-border shadow-card rounded-sm">
          <div className="px-6 pt-5 pb-3 border-b border-border">
            <h2 className="font-serif text-[18px]">
              Legal Classification — #{incident.id}
            </h2>
            {incident.classifications && incident.classifications.length > 0 && (
              <div className="text-[11px] text-muted-foreground mt-1">
                Latest version v{incident.classifications[0].version} ·{" "}
                {format(new Date(incident.classifications[0].ts), "d LLL yyyy, HH:mm")}{" "}
                · {incident.classifications[0].authorName}
              </div>
            )}
          </div>

          <div className="px-6 py-5 space-y-5">
            <RadioGroup
              label="GDPR Art. 33 notification"
              value={art33}
              onChange={(v) => setArt33(v as ClassificationVerdict)}
              options={ART33_OPTIONS}
            />

            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-1.5">
                Competent authority
              </div>
              <input
                value={authority}
                onChange={(e) => setAuthority(e.target.value)}
                placeholder="e.g. BfDI, CNIL, AEPD…"
                className="w-full bg-background border border-border rounded-sm px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>

            <RadioGroup
              label="GDPR Art. 34 notification"
              value={art34}
              onChange={(v) => setArt34(v as Art34Verdict)}
              options={ART34_OPTIONS}
            />
            <RadioGroup
              label="NIS2 applicable"
              value={nis2}
              onChange={(v) => setNis2(v as Nis2Verdict)}
              options={NIS2_OPTIONS}
            />

            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-1.5">
                Legal rationale <span className="text-warning">(mandatory)</span>
              </div>
              <textarea
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
                rows={5}
                placeholder="State the legal reasoning grounding this classification."
                className="w-full bg-background border border-border rounded-sm px-3 py-2 text-sm leading-relaxed outline-none focus:border-primary resize-y"
              />
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-1.5">
                Open questions back to DPO
              </div>
              <textarea
                value={openQ}
                onChange={(e) => setOpenQ(e.target.value)}
                rows={3}
                placeholder="Optional — questions or follow-ups for the DPO."
                className="w-full bg-background border border-border rounded-sm px-3 py-2 text-sm leading-relaxed outline-none focus:border-primary resize-y"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleSaveDraft}
                className="border border-border px-4 py-2 text-[11px] uppercase tracking-[0.16em] rounded-sm hover:bg-accent transition-colors"
              >
                Save Draft
              </button>
              <button
                onClick={handleRelease}
                className="bg-primary text-primary-foreground px-4 py-2 text-[11px] uppercase tracking-[0.16em] rounded-sm hover:bg-primary/90 transition-colors"
              >
                Release Classification →
              </button>
            </div>
          </div>

          {incident.classifications && incident.classifications.length > 0 && (
            <div className="border-t border-border px-6 py-4">
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-2">
                Version history
              </div>
              <ul className="space-y-1.5 text-[11px] text-muted-foreground">
                {incident.classifications.map((c) => (
                  <li key={c.id}>
                    v{c.version} · {format(new Date(c.ts), "d LLL yyyy, HH:mm")} ·{" "}
                    {c.authorName} — Art. 33: {c.art33}, Art. 34: {c.art34}, NIS2: {c.nis2}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

function RadioGroup<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T | "";
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-1.5">
        {label}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const active = value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onChange(o.value)}
              className={cn(
                "text-[11px] uppercase tracking-[0.16em] border rounded-sm px-3 py-1.5 transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:bg-accent",
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default LegalCaseDetail;
