import { format } from "date-fns";
import { CheckCircle2, Clock, Send } from "lucide-react";
import { useApp } from "@/state/AppContext";
import { cn } from "@/lib/utils";
import type { Notification } from "@/types/incident";

interface Props {
  notification: Notification;
}

/**
 * Two-stage approval gate displayed alongside any notification draft.
 * Stage A — DPO requests legal release.
 * Stage B — Legal Counsel releases (handled in /legal/draft-review).
 * Stage C — Executive Management approves dispatch.
 *
 * No "must notify / we recommend" wording — purely procedural.
 */
export function ApprovalCard({ notification: n }: Props) {
  const { updateNotification, addAudit, user } = useApp();

  const stage: "request" | "legal" | "em" | "ready" = !n.dpoRequestedReleaseAt
    ? "request"
    : !n.releasedByLegal
    ? "legal"
    : !n.emApprovedAt
    ? "em"
    : "ready";

  function requestRelease() {
    const ts = new Date().toISOString();
    updateNotification(n.id, {
      dpoRequestedReleaseAt: ts,
      dpoRequestedBy: user?.name ?? "DPO",
    });
    addAudit({
      incidentId: n.incidentId,
      actor: "DPO",
      action: `Release requested from Legal Counsel: ${n.subject}`,
    });
  }

  function emApprove() {
    const ts = new Date().toISOString();
    updateNotification(n.id, {
      emApprovedAt: ts,
      emApprovedBy: user?.name ?? "Executive Management",
    });
    addAudit({
      incidentId: n.incidentId,
      actor: "Executive Management",
      action: `Dispatch approved: ${n.subject}`,
    });
  }

  function dispatch() {
    updateNotification(n.id, {
      status: "Sent",
      date: new Date().toISOString(),
    });
    addAudit({
      incidentId: n.incidentId,
      actor: "DPO",
      action: `Notification dispatched after EM approval: ${n.subject}`,
    });
  }

  const isLegalUser = (user?.role as string | undefined) === "legal";
  const isEmUser = (user?.role as string | undefined) === "em" || (user?.email ?? "").toLowerCase().includes("exec");

  return (
    <div className="bg-card border border-border shadow-card rounded-sm">
      <div className="px-5 py-3 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="font-serif text-[16px]">Two-stage approval</h3>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mt-0.5">
            DPO request → Legal release → EM approval
          </div>
        </div>
        <span
          className={cn(
            "text-[10px] uppercase tracking-[0.18em] border rounded-sm px-2 py-1",
            stage === "ready"
              ? "border-success/40 text-success bg-success/5"
              : "border-border text-muted-foreground",
          )}
        >
          {stage === "request"
            ? "Awaiting DPO request"
            : stage === "legal"
            ? "Awaiting Legal Counsel"
            : stage === "em"
            ? "Awaiting EM approval"
            : "Ready to dispatch"}
        </span>
      </div>

      <ol className="p-5 space-y-3">
        <Step
          done={!!n.dpoRequestedReleaseAt}
          active={stage === "request"}
          title="DPO requests Legal release"
          meta={
            n.dpoRequestedReleaseAt &&
            `${n.dpoRequestedBy ?? "DPO"} · ${format(new Date(n.dpoRequestedReleaseAt), "d LLL HH:mm")}`
          }
          action={
            stage === "request" && (
              <button
                onClick={requestRelease}
                className="text-[11px] uppercase tracking-[0.16em] bg-primary text-primary-foreground px-3 py-1.5 rounded-sm hover:bg-primary/90"
              >
                Request release
              </button>
            )
          }
        />
        <Step
          done={!!n.releasedByLegal}
          active={stage === "legal"}
          title="Legal Counsel releases draft"
          meta={
            n.releasedByLegal && n.releasedAt &&
            `${n.releasedBy ?? "Legal Counsel"} · ${format(new Date(n.releasedAt), "d LLL HH:mm")}`
          }
          action={
            stage === "legal" && (
              <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Released in <span className="text-foreground">/legal/draft-review</span>
                {isLegalUser && " (you)"}
              </span>
            )
          }
        />
        <Step
          done={!!n.emApprovedAt}
          active={stage === "em"}
          title="Executive Management approves dispatch"
          meta={
            n.emApprovedAt &&
            `${n.emApprovedBy ?? "Executive Management"} · ${format(new Date(n.emApprovedAt), "d LLL HH:mm")}`
          }
          action={
            stage === "em" && (
              <button
                onClick={emApprove}
                className={cn(
                  "text-[11px] uppercase tracking-[0.16em] px-3 py-1.5 rounded-sm border transition-colors",
                  isEmUser
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 border-primary"
                    : "border-border hover:bg-accent",
                )}
                title={isEmUser ? "Approve" : "Demo: any signed-in user can approve"}
              >
                <CheckCircle2 className="w-3 h-3 inline -mt-0.5 mr-1" /> Approve dispatch
              </button>
            )
          }
        />
      </ol>

      {stage === "ready" && n.status !== "Sent" && (
        <div className="px-5 pb-5">
          <button
            onClick={dispatch}
            className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 text-[11px] uppercase tracking-[0.16em] rounded-sm hover:bg-primary/90 transition-colors"
          >
            <Send className="w-3 h-3" /> Dispatch notification
          </button>
        </div>
      )}

      {n.status === "Sent" && (
        <div className="px-5 pb-5 text-[11px] text-success bg-success/5 border-t border-success/20 pt-3">
          Dispatched {n.date && format(new Date(n.date), "d LLL yyyy, HH:mm")}.
        </div>
      )}

      <div className="px-5 pb-4 text-[10px] text-muted-foreground border-t border-border pt-3">
        Procedural gate only — no legal classification implied. Legal classification reserved for Legal
        Counsel.
      </div>
    </div>
  );
}

function Step({
  done,
  active,
  title,
  meta,
  action,
}: {
  done: boolean;
  active: boolean;
  title: string;
  meta?: string | false | null;
  action?: React.ReactNode;
}) {
  return (
    <li
      className={cn(
        "flex items-center gap-3 border rounded-sm px-3 py-2.5",
        done
          ? "border-success/30 bg-success/5"
          : active
          ? "border-primary/40 bg-primary/5"
          : "border-border bg-background",
      )}
    >
      <span
        className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center shrink-0",
          done ? "bg-success text-background" : active ? "bg-primary text-primary-foreground" : "bg-muted",
        )}
      >
        {done ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm">{title}</div>
        {meta && <div className="text-[10px] text-muted-foreground mt-0.5">{meta}</div>}
      </div>
      {action}
    </li>
  );
}
