import { useMemo } from "react";
import { format } from "date-fns";
import { Lock, Eye } from "lucide-react";
import { useApp } from "@/state/AppContext";
import { cn } from "@/lib/utils";

const LegalPrivilegeLog = () => {
  const { notifications, updateNotification, addAudit, user } = useApp();

  const privileged = useMemo(
    () =>
      notifications
        .filter((n) => n.privileged)
        .sort(
          (a, b) =>
            +new Date(b.privilegedAt ?? b.date) -
            +new Date(a.privilegedAt ?? a.date),
        ),
    [notifications],
  );

  return (
    <div className="px-10 py-10 max-w-[1200px] mx-auto animate-fade-in">
      <h1 className="font-serif text-[36px] leading-tight">Privilege Log</h1>
      <p className="text-sm text-muted-foreground mt-2">
        Items tagged as privileged. Visibility: Legal Counsel + External Counsel only.
      </p>

      <div className="mt-8 space-y-3">
        {privileged.map((n) => (
          <div
            key={n.id}
            className="bg-card border border-border shadow-card rounded-sm p-5"
          >
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] text-destructive border border-destructive/40 bg-destructive/5 rounded-sm px-2 py-1">
                    <Lock className="w-3 h-3" /> privileged
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    {n.type}
                  </span>
                  <span className="text-xs font-mono text-muted-foreground">
                    #{n.incidentId}
                  </span>
                </div>
                <div className="mt-2 font-serif text-[16px]">{n.subject}</div>
                <div
                  className={cn(
                    "mt-1 text-sm text-muted-foreground italic select-none",
                    "blur-[3px] hover:blur-none transition-[filter] cursor-pointer",
                  )}
                  title="Hover to reveal"
                >
                  {n.body.slice(0, 240)}
                  {n.body.length > 240 ? "…" : ""}
                </div>
                <div className="mt-3 text-[11px] text-muted-foreground">
                  Tagged by {n.privilegedBy ?? "—"}{" "}
                  {n.privilegedAt &&
                    `on ${format(new Date(n.privilegedAt), "d LLL yyyy, HH:mm")}`}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  <Eye className="w-3 h-3" /> Legal + External Counsel
                </span>
                <button
                  onClick={() => {
                    updateNotification(n.id, {
                      privileged: false,
                      privilegedBy: undefined,
                      privilegedAt: undefined,
                    });
                    addAudit({
                      incidentId: n.incidentId,
                      actor: "Legal Counsel",
                      action: `Privilege tag removed: ${n.subject} (by ${
                        user?.name ?? "Legal Counsel"
                      })`,
                    });
                  }}
                  className="border border-border rounded-sm px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] hover:bg-accent transition-colors"
                >
                  Remove Privilege Tag
                </button>
              </div>
            </div>
          </div>
        ))}
        {privileged.length === 0 && (
          <div className="py-16 text-center text-sm text-muted-foreground">
            No privileged items. Tag a draft as privileged from the Draft Review tab.
          </div>
        )}
      </div>
    </div>
  );
};

export default LegalPrivilegeLog;
