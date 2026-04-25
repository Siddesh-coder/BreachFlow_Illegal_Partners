import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { ChevronDown, ChevronUp, Copy, Send } from "lucide-react";
import { useApp } from "@/state/AppContext";
import { SeverityBadge } from "@/components/SeverityBadge";
import { IndicatorScoreboard } from "@/components/IndicatorScoreboard";
import { DeadlinePanel } from "@/components/DeadlinePanel";
import { cn } from "@/lib/utils";
import type { ActionStep, IncidentStatus } from "@/types/incident";

const DpoIncidentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { incidents, setIncidentStatus, updateStep, addAudit, addNotification } = useApp();
  const incident = useMemo(() => incidents.find((i) => i.id === id), [incidents, id]);

  if (!incident) {
    return (
      <div className="px-12 py-10">
        <p className="text-sm text-muted-foreground">Incident not found.</p>
        <button onClick={() => navigate("/dpo/incidents")} className="mt-4 underline text-sm">Back to incidents</button>
      </div>
    );
  }

  const totalSteps = incident.recommendations.length;
  const doneSteps = incident.recommendations.filter((s) => s.status === "done").length;
  const pct = totalSteps ? Math.round((doneSteps / totalSteps) * 100) : 0;

  return (
    <div className="px-12 py-10 max-w-[1100px] mx-auto animate-fade-in">
      {/* Top */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <button onClick={() => navigate("/dpo/incidents")} className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground">
            ← All incidents
          </button>
          <h1 className="font-serif text-[36px] leading-tight mt-2">#{incident.id}</h1>
          <div className="mt-2 flex items-center gap-3">
            <SeverityBadge severity={incident.severity} />
            <span className="text-xs text-muted-foreground">
              Reported {format(new Date(incident.reportedAt), "d LLL yyyy, HH:mm")}
            </span>
            <span className="text-xs text-muted-foreground">
              · Reporter: {incident.isAnonymous ? "Anonymous — identity not recorded" : incident.reporterName}
            </span>
          </div>
        </div>
        <select
          value={incident.status}
          onChange={(e) => {
            const next = e.target.value as IncidentStatus;
            setIncidentStatus(incident.id, next);
            addAudit({ incidentId: incident.id, actor: "DPO", action: `Status changed to ${labelStatus(next)}` });
          }}
          className="border border-border bg-card px-4 py-2 text-xs uppercase tracking-[0.18em] rounded-sm outline-none"
        >
          <option value="new">New</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Section 1 — Summary */}
      <section className="mt-10 bg-card border border-border shadow-card p-8 rounded-sm">
        <h2 className="font-serif text-xl mb-6">Incident summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-5">
          <Field label="Discovered at" value={format(new Date(incident.discoveredAt), "PPP 'at' p")} />
          <Field label="Affected" value={incident.affectedCount != null ? `${incident.affectedCount} people` : "Not known"} />
          <Field label="Data types" value={incident.dataTypes.join(", ")} />
          <Field label="Category" value={incident.incidentCategory} />
          <Field label="Countries" value={incident.countries.join(", ")} />
          <Field label="Contained" value={incident.contained === null ? "Not known" : incident.contained ? "Yes" : "No"} />
          <Field label="What happened" value={incident.whatHappened || "—"} full />
          {incident.additionalNotes && <Field label="Additional notes" value={incident.additionalNotes} full />}
        </div>
      </section>

      {/* Section 2 — Deadline panel */}
      <section className="mt-10">
        <DeadlinePanel incident={incident} />
      </section>

      {/* Section 3 — Indicator scoreboards (replaces verdict UI) */}
      <section className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <IndicatorScoreboard incident={incident} regime="gdpr_33" showSources />
        <IndicatorScoreboard incident={incident} regime="gdpr_34" showSources />
        {incident.nis2Sector && incident.nis2Sector !== "Not Applicable" && (
          <IndicatorScoreboard
            incident={incident}
            regime="nis2_23"
            showSources
            className="lg:col-span-2"
          />
        )}
      </section>

      {/* Section 4 — Recommendations */}
      <section className="mt-10">
        <div className="flex items-end justify-between mb-3">
          <h2 className="font-serif text-2xl">Recommended Actions</h2>
          <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            {doneSteps} of {totalSteps} complete
          </span>
        </div>
        <div className="h-1 bg-muted rounded-sm overflow-hidden mb-6">
          <div className="h-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>

        <div className="space-y-4">
          {incident.recommendations.map((step, idx) => (
            <StepCard
              key={step.id}
              step={step}
              index={idx}
              onUpdate={(patch) => {
                updateStep(incident.id, step.id, patch);
                if (patch.status) addAudit({ incidentId: incident.id, actor: "DPO", action: `Step "${step.title}" → ${patch.status}` });
              }}
              onSend={() => {
                updateStep(incident.id, step.id, { emailSent: true, status: "done" });
                addAudit({ incidentId: incident.id, actor: "DPO", action: `Email sent: ${step.title}` });
                addNotification({
                  incidentId: incident.id,
                  type: step.title.toLowerCase().includes("authority") ? "Authority" : step.title.toLowerCase().includes("individual") ? "Individual" : "Internal",
                  status: "Sent",
                  date: new Date().toISOString(),
                  subject: step.title,
                  body: step.draftEmail ?? "",
                });
              }}
            />
          ))}
        </div>
      </section>
    </div>
  );
};

function Field({ label, value, full }: { label: string; value: string; full?: boolean }) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
      <div className="mt-1.5 text-sm leading-relaxed">{value}</div>
    </div>
  );
}

function StepCard({
  step, index, onUpdate, onSend,
}: { step: ActionStep; index: number; onUpdate: (p: Partial<ActionStep>) => void; onSend: () => void }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(step.draftEmail ?? "");

  const stateBadge = (
    <button
      onClick={() => {
        const next = step.status === "not_started" ? "in_progress" : step.status === "in_progress" ? "done" : "not_started";
        onUpdate({ status: next });
      }}
      className={cn(
        "text-[10px] uppercase tracking-[0.18em] border rounded-sm px-2 py-1 transition-colors",
        step.status === "done" ? "border-success text-success bg-success/5"
        : step.status === "in_progress" ? "border-warning text-warning bg-warning/5"
        : "border-border text-muted-foreground hover:bg-accent",
      )}
    >
      {step.status === "done" ? "Done" : step.status === "in_progress" ? "In progress" : "Not started"}
    </button>
  );

  return (
    <div className="bg-card border border-border shadow-card rounded-sm">
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Step {index + 1}</div>
            <div className="font-serif text-lg mt-1">{step.title.replace(/^Step\s+\d+\s+—\s+/, "")}</div>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-[680px]">{step.description}</p>
          </div>
          {stateBadge}
        </div>

        {step.draftEmail !== undefined && (
          <button
            onClick={() => setOpen((o) => !o)}
            className="mt-5 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground"
          >
            {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            Draft communication
            {step.emailSent && <span className="text-success ml-2">· Sent</span>}
          </button>
        )}
      </div>

      {open && step.draftEmail !== undefined && (
        <div className="border-t border-border p-6 bg-background animate-fade-in">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => onUpdate({ draftEmail: draft })}
            rows={8}
            className="w-full bg-card border border-border p-4 text-sm font-mono leading-relaxed rounded-sm outline-none focus:border-primary resize-none"
          />
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={() => navigator.clipboard.writeText(draft)}
              className="inline-flex items-center gap-2 border border-border px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] rounded-sm hover:bg-accent transition-colors"
            >
              <Copy className="w-3 h-3" /> Copy
            </button>
            <button
              onClick={onSend}
              disabled={step.emailSent}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] rounded-sm hover:bg-primary/90 transition-colors disabled:opacity-40"
            >
              <Send className="w-3 h-3" /> {step.emailSent ? "Sent" : "Mark as sent"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function labelStatus(s: IncidentStatus) {
  return s === "new" ? "New" : s === "in_progress" ? "In Progress" : "Completed";
}

export default DpoIncidentDetail;
