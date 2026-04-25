import { useMemo, useState } from "react";
import { format } from "date-fns";
import { useApp } from "@/state/AppContext";
import { ApprovalCard } from "@/components/ApprovalCard";
import { cn } from "@/lib/utils";

const DpoNotifications = () => {
  const { notifications } = useApp();
  const [status, setStatus] = useState<"all" | "Draft" | "Sent">("all");
  const [type, setType] = useState<"all" | "Internal" | "Authority" | "Individual">("all");
  const [open, setOpen] = useState<string | null>(null);

  const list = useMemo(() => {
    return notifications
      .filter((n) => (status === "all" || n.status === status) && (type === "all" || n.type === type))
      .sort((a, b) => +new Date(b.date) - +new Date(a.date));
  }, [notifications, status, type]);

  return (
    <div className="px-12 py-10 max-w-[1100px] mx-auto animate-fade-in">
      <h1 className="font-serif text-[36px] leading-tight">Notifications</h1>
      <p className="text-sm text-muted-foreground mt-2">All outgoing communications, drafts and sent.</p>

      <div className="mt-8 flex flex-wrap items-center gap-6 border-y border-border py-4">
        <Group label="Status">
          {(["all", "Draft", "Sent"] as const).map((s) => (
            <Btn key={s} active={status === s} onClick={() => setStatus(s)}>{s}</Btn>
          ))}
        </Group>
        <Group label="Type">
          {(["all", "Internal", "Authority", "Individual"] as const).map((t) => (
            <Btn key={t} active={type === t} onClick={() => setType(t)}>{t}</Btn>
          ))}
        </Group>
      </div>

      <div className="mt-2 divide-y divide-border">
        {list.map((n) => (
          <div key={n.id} className="py-5">
            <button
              onClick={() => setOpen(open === n.id ? null : n.id)}
              className="w-full text-left grid grid-cols-[120px_120px_1fr_140px_100px] gap-4 items-center hover:bg-accent transition-colors p-2"
            >
              <span className={cn(
                "text-[10px] uppercase tracking-[0.18em] border px-2 py-1 rounded-sm w-fit",
                n.status === "Sent" ? "border-success text-success bg-success/5" : "border-border text-muted-foreground",
              )}>{n.status}</span>
              <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{n.type}</span>
              <span className="text-sm truncate">{n.subject}</span>
              <span className="text-xs text-muted-foreground">{format(new Date(n.date), "d LLL yyyy, HH:mm")}</span>
              <span className="text-xs font-mono text-muted-foreground text-right">#{n.incidentId}</span>
            </button>
            {open === n.id && (
              <div className="mt-3 ml-2 mr-2 space-y-4 animate-fade-in">
                <div className="border border-border bg-card p-5 text-sm whitespace-pre-wrap leading-relaxed rounded-sm">
                  {n.body}
                </div>
                {n.status === "Draft" && <ApprovalCard notification={n} />}
              </div>
            )}
          </div>
        ))}
        {list.length === 0 && (
          <div className="py-16 text-center text-sm text-muted-foreground">No notifications match.</div>
        )}
      </div>
    </div>
  );
};

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      <div className="flex gap-1">{children}</div>
    </div>
  );
}
function Btn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "text-[11px] uppercase tracking-[0.16em] px-3 py-1.5 border rounded-sm transition-colors",
        active ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-accent",
      )}
    >
      {children}
    </button>
  );
}

export default DpoNotifications;
