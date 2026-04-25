import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Check, ChevronRight, AlertTriangle } from "lucide-react";
import { useApp } from "@/state/AppContext";
import { cn } from "@/lib/utils";
import type { Incident, ProcessStageId } from "@/types/incident";
import { ensureProcess, getStageRequirements, stageDef, STAGE_ORDER } from "@/lib/processEngine";

interface Props {
  incident: Incident;
}

export function ProcessPanel({ incident }: Props) {
  const { notifications, advanceProcessStage, addAudit, user } = useApp();
  const proc = useMemo(() => ensureProcess(incident), [incident]);
  const [pendingTarget, setPendingTarget] = useState<ProcessStageId | null>(null);
  const [overrideReason, setOverrideReason] = useState("");

  const currentIdx = STAGE_ORDER.indexOf(proc.currentStage);
  const currentReqs = getStageRequirements(proc.currentStage, incident, notifications);
  const currentDone = currentReqs.every((r) => r.done);

  function handleAdvance(to: ProcessStageId) {
    const toIdx = STAGE_ORDER.indexOf(to);
    if (toIdx <= currentIdx) {
      // backwards or same — allow without prompt
      advanceProcessStage(incident.id, to, { actor: user?.name ?? "DPO" });
      addAudit({
        incidentId: incident.id,
        actor: "DPO",
        action: `Process moved to ${to} — ${stageDef(to).title}`,
      });
      return;
    }
    if (!currentDone) {
      // soft gate: require an override reason
      setPendingTarget(to);
      return;
    }
    advanceProcessStage(incident.id, to, { actor: user?.name ?? "DPO" });
    addAudit({
      incidentId: incident.id,
      actor: "DPO",
      action: `Process advanced to ${to} — ${stageDef(to).title}`,
    });
  }

  function confirmOverride() {
    if (!pendingTarget) return;
    const reasons = currentReqs.filter((r) => !r.done).map((r) => r.label);
    advanceProcessStage(incident.id, pendingTarget, {
      actor: user?.name ?? "DPO",
      overrideReasons: reasons,
    });
    addAudit({
      incidentId: incident.id,
      actor: "DPO",
      action: `Process advanced to ${pendingTarget} with override — reason: ${overrideReason || "(unspecified)"}; incomplete: ${reasons.join("; ")}`,
    });
    setPendingTarget(null);
    setOverrideReason("");
  }

  return (
    <div className="bg-card border border-border shadow-card rounded-sm">
      <div className="px-6 py-5 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="font-serif text-xl">Process Engine</h2>
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mt-1">
            P0 → P4 incident lifecycle
          </p>
        </div>
        <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Soft-gated · overrides logged to audit
        </span>
      </div>

      {/* Stepper */}
      <div className="px-6 pt-6">
        <div className="flex items-stretch gap-2">
          {proc.stages.map((s, idx) => {
            const def = stageDef(s.id);
            const isCurrent = s.id === proc.currentStage;
            const isComplete = s.status === "complete";
            return (
              <div key={s.id} className="flex-1 min-w-0">
                <button
                  onClick={() => handleAdvance(s.id)}
                  className={cn(
                    "w-full text-left p-3 rounded-sm border transition-colors",
                    isCurrent
                      ? "border-primary bg-primary/5"
                      : isComplete
                      ? "border-success/40 bg-success/5 hover:bg-success/10"
                      : "border-border bg-background hover:bg-accent",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono",
                        isComplete
                          ? "bg-success text-background"
                          : isCurrent
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {isComplete ? <Check className="w-3 h-3" /> : s.id}
                    </span>
                    <span className="text-[11px] uppercase tracking-[0.16em] truncate">{def.title}</span>
                  </div>
                  <div className="mt-1.5 text-[10px] text-muted-foreground truncate">{def.subtitle}</div>
                  {s.overrideReasons && s.overrideReasons.length > 0 && (
                    <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-warning">
                      <AlertTriangle className="w-3 h-3" /> entered with override
                    </div>
                  )}
                </button>
                {idx < proc.stages.length - 1 && (
                  <div className="flex justify-center mt-1">
                    <ChevronRight className="w-3 h-3 text-muted-foreground" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Current stage requirements */}
      <div className="px-6 pb-6 mt-6">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-3">
          Current stage — {stageDef(proc.currentStage).title}
        </div>
        <ul className="space-y-2">
          {currentReqs.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between text-sm border border-border rounded-sm px-3 py-2 bg-background"
            >
              <span className="leading-tight">{r.label}</span>
              <span
                className={cn(
                  "text-[10px] uppercase tracking-[0.18em] px-2 py-0.5 rounded-sm border",
                  r.done
                    ? "border-success/40 text-success bg-success/5"
                    : "border-border text-muted-foreground",
                )}
              >
                {r.done ? "Done" : "Open"}
              </span>
            </li>
          ))}
        </ul>

        {currentIdx < STAGE_ORDER.length - 1 && (
          <button
            onClick={() => handleAdvance(STAGE_ORDER[currentIdx + 1])}
            className={cn(
              "mt-4 inline-flex items-center gap-2 px-4 py-2 text-[11px] uppercase tracking-[0.16em] rounded-sm transition-colors",
              currentDone
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-warning/10 text-warning border border-warning/40 hover:bg-warning/20",
            )}
          >
            Advance to {STAGE_ORDER[currentIdx + 1]} — {stageDef(STAGE_ORDER[currentIdx + 1]).title}
            {!currentDone && <AlertTriangle className="w-3 h-3" />}
          </button>
        )}

        <p className="mt-3 text-[10px] text-muted-foreground">
          Stage advancement is informational and audit-logged. Legal classification reserved for Legal Counsel.
        </p>
      </div>

      {/* Override modal */}
      {pendingTarget && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-card border border-border shadow-elegant rounded-sm w-full max-w-lg p-6">
            <div className="flex items-center gap-2 text-warning">
              <AlertTriangle className="w-4 h-4" />
              <h3 className="font-serif text-lg">Advance with incomplete stage?</h3>
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              Stage <strong>{stageDef(proc.currentStage).title}</strong> still has open items. Advancing
              to <strong>{stageDef(pendingTarget).title}</strong> will be logged with your reason and the
              list of incomplete items.
            </p>
            <ul className="mt-3 space-y-1">
              {currentReqs
                .filter((r) => !r.done)
                .map((r) => (
                  <li key={r.id} className="text-xs text-muted-foreground">
                    · {r.label}
                  </li>
                ))}
            </ul>
            <div className="mt-4">
              <label className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Reason for override
              </label>
              <textarea
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                rows={3}
                placeholder="e.g. parallel track — Legal will brief retroactively"
                className="mt-1.5 w-full bg-background border border-border rounded-sm px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setPendingTarget(null);
                  setOverrideReason("");
                }}
                className="text-[11px] uppercase tracking-[0.16em] px-3 py-2 border border-border rounded-sm hover:bg-accent"
              >
                Cancel
              </button>
              <button
                onClick={confirmOverride}
                className="text-[11px] uppercase tracking-[0.16em] px-3 py-2 rounded-sm bg-warning text-background hover:bg-warning/90"
              >
                Advance with override
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stage history */}
      <div className="px-6 pb-6 border-t border-border pt-4">
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-2">
          Stage history
        </div>
        <ul className="space-y-1 text-xs text-muted-foreground">
          {proc.stages
            .filter((s) => s.enteredAt || s.completedAt)
            .map((s) => (
              <li key={s.id} className="flex items-center gap-3">
                <span className="font-mono">{s.id}</span>
                <span>{stageDef(s.id).title}</span>
                {s.enteredAt && <span>· entered {format(new Date(s.enteredAt), "d LLL HH:mm")}</span>}
                {s.completedAt && <span>· completed {format(new Date(s.completedAt), "d LLL HH:mm")}</span>}
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}
