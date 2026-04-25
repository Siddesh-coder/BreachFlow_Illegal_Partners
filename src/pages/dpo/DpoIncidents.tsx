import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { useApp } from "@/state/AppContext";
import { SeverityBadge } from "@/components/SeverityBadge";
import { StatusBadge } from "@/components/StatusBadge";
import type { Severity } from "@/types/incident";
import { cn } from "@/lib/utils";

const DpoIncidents = () => {
  const { incidents } = useApp();
  const [sort, setSort] = useState<"severity" | "date" | "status">("severity");
  const [filter, setFilter] = useState<Severity | "all">("all");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    let list = [...incidents];
    if (filter !== "all") list = list.filter((i) => i.severity === filter);
    if (q.trim()) {
      const needle = q.toLowerCase();
      list = list.filter((i) =>
        i.id.toLowerCase().includes(needle) ||
        i.aiSummary.toLowerCase().includes(needle) ||
        i.whatHappened.toLowerCase().includes(needle),
      );
    }
    if (sort === "severity") list.sort((a, b) => rank(b.severity) - rank(a.severity));
    if (sort === "date") list.sort((a, b) => +new Date(b.reportedAt) - +new Date(a.reportedAt));
    if (sort === "status") list.sort((a, b) => statusRank(a.status) - statusRank(b.status));
    return list;
  }, [incidents, filter, q, sort]);

  return (
    <div className="px-12 py-10 max-w-[1200px] mx-auto animate-fade-in">
      <h1 className="font-serif text-[36px] leading-tight">Incidents</h1>
      <p className="text-sm text-muted-foreground mt-2">All reports. Sorted high → low severity by default.</p>

      <div className="mt-8 flex flex-wrap items-center gap-6 border-y border-border py-4">
        <ToolbarGroup label="Sort">
          {(["severity", "date", "status"] as const).map((s) => (
            <ToolbarBtn key={s} active={sort === s} onClick={() => setSort(s)}>{s}</ToolbarBtn>
          ))}
        </ToolbarGroup>
        <ToolbarGroup label="Filter">
          {(["all", "high", "medium", "low"] as const).map((f) => (
            <ToolbarBtn key={f} active={filter === f} onClick={() => setFilter(f)}>{f}</ToolbarBtn>
          ))}
        </ToolbarGroup>
        <div className="ml-auto">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by reference or keyword…"
            className="border border-border bg-card px-3 py-2 text-sm w-72 rounded-sm outline-none focus:border-primary"
          />
        </div>
      </div>

      <div className="mt-2 divide-y divide-border">
        {filtered.map((i) => (
          <Link
            key={i.id}
            to={`/dpo/incidents/${i.id}`}
            className="grid grid-cols-[120px_120px_140px_1fr_120px_120px] gap-4 items-center py-5 px-2 hover:bg-accent transition-colors"
          >
            <span className="text-xs font-mono text-muted-foreground">#{i.id}</span>
            <SeverityBadge severity={i.severity} />
            <span className="text-xs text-muted-foreground">{format(new Date(i.reportedAt), "d LLL, HH:mm")}</span>
            <span className="text-sm line-clamp-2 pr-4">{i.aiSummary}</span>
            <StatusBadge status={i.status} />
            <span className="text-xs text-muted-foreground text-right">
              {i.isAnonymous ? "Anonymous" : i.reporterName}
            </span>
          </Link>
        ))}
        {filtered.length === 0 && (
          <div className="py-16 text-center text-sm text-muted-foreground">No incidents match your filters.</div>
        )}
      </div>
    </div>
  );
};

function ToolbarGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      <div className="flex gap-1">{children}</div>
    </div>
  );
}

function ToolbarBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
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

function rank(s: Severity) { return s === "high" ? 3 : s === "medium" ? 2 : 1; }
function statusRank(s: "new" | "in_progress" | "completed") {
  return s === "new" ? 0 : s === "in_progress" ? 1 : 2;
}

export default DpoIncidents;
