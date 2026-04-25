import { useMemo } from "react";
import { Link } from "react-router-dom";
import { format, addMonths, startOfMonth } from "date-fns";
import { useApp } from "@/state/AppContext";
import { SeverityBadge } from "@/components/SeverityBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { Speedometer } from "@/components/Speedometer";

const DpoDashboard = () => {
  const { incidents } = useApp();

  const monthIncidents = useMemo(() => {
    const start = startOfMonth(new Date());
    return incidents.filter((i) => new Date(i.reportedAt) >= start);
  }, [incidents]);

  const counts = useMemo(() => {
    const c = { high: 0, medium: 0, low: 0 };
    monthIncidents.forEach((i) => c[i.severity]++);
    return c;
  }, [monthIncidents]);

  const monthTotal = monthIncidents.length;

  const statusCounts = useMemo(() => {
    const c = { new: 0, in_progress: 0, completed: 0 };
    incidents.forEach((i) => c[i.status]++);
    return c;
  }, [incidents]);
  const statusTotal = Math.max(1, incidents.length);

  const recent = useMemo(
    () =>
      [...incidents]
        .sort((a, b) => severityRank(b.severity) - severityRank(a.severity) || +new Date(b.reportedAt) - +new Date(a.reportedAt))
        .slice(0, 3),
    [incidents],
  );

  const nextResetLabel = format(addMonths(startOfMonth(new Date()), 1), "d LLLL");

  return (
    <div className="px-12 py-10 max-w-[1200px] mx-auto animate-fade-in">
      <div className="flex items-end justify-between mb-10">
        <h1 className="font-serif text-[36px] leading-tight">Dashboard</h1>
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Data for {format(new Date(), "LLLL yyyy")}. Resets {nextResetLabel}.
        </div>
      </div>

      {/* Severity gauges */}
      <section className="bg-card border border-border shadow-card p-10 rounded-sm">
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-2">Severity breakdown</div>
            <h2 className="font-serif text-xl">Incidents this month</h2>
          </div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {monthTotal} total
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GaugeCard tone="danger" label="High" count={counts.high} total={monthTotal} />
          <GaugeCard tone="warning" label="Medium" count={counts.medium} total={monthTotal} />
          <GaugeCard tone="success" label="Low" count={counts.low} total={monthTotal} />
        </div>

        <div className="mt-8 flex items-center justify-between">
          <p className="text-[11px] text-muted-foreground">
            Distribution of incidents reported this month by severity.
          </p>
          <a className="text-[11px] uppercase tracking-[0.16em] hover:underline" href="#">View lifetime data →</a>
        </div>
      </section>

      {/* Status bars */}
      <section className="mt-10 bg-card border border-border shadow-card p-10 rounded-sm">
        <h2 className="font-serif text-xl mb-6">Incident pipeline</h2>
        <div className="space-y-5">
          <Bar label="New / Unreviewed" count={statusCounts.new} total={statusTotal} />
          <Bar label="In Progress" count={statusCounts.in_progress} total={statusTotal} />
          <Bar label="Completed" count={statusCounts.completed} total={statusTotal} />
        </div>
      </section>

      {/* Recent */}
      <section className="mt-10">
        <div className="flex items-end justify-between mb-4">
          <h2 className="font-serif text-xl">Recent incidents</h2>
          <Link to="/dpo/incidents" className="text-[11px] uppercase tracking-[0.16em] hover:underline">
            View all incidents →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recent.map((i) => (
            <Link
              key={i.id}
              to={`/dpo/incidents/${i.id}`}
              className="bg-card border border-border shadow-card p-5 rounded-sm hover:bg-accent transition-colors block"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-muted-foreground">#{i.id}</span>
                <SeverityBadge severity={i.severity} />
              </div>
              <p className="mt-3 text-sm leading-relaxed line-clamp-3">{i.aiSummary}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">{format(new Date(i.reportedAt), "d LLL, HH:mm")}</span>
                <StatusBadge status={i.status} />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

function GaugeCard({ tone, label, count, total }: { tone: "danger" | "warning" | "success"; label: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="border border-border p-6 rounded-sm flex flex-col items-center">
      <Speedometer tone={tone} label={label} count={count} total={total} />
      <div className="mt-2 text-[11px] text-muted-foreground">
        {pct}% of this month
      </div>
    </div>
  );
}

function Bar({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = Math.round((count / total) * 100);
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm">{label}</span>
        <span className="text-xs text-muted-foreground">{count}</span>
      </div>
      <div className="h-1.5 bg-muted rounded-sm overflow-hidden">
        <div className="h-full bg-primary transition-all duration-500" style={{ width: `${Math.max(2, pct)}%` }} />
      </div>
    </div>
  );
}

function severityRank(s: "high" | "medium" | "low") {
  return s === "high" ? 3 : s === "medium" ? 2 : 1;
}

export default DpoDashboard;
