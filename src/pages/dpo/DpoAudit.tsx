import { useMemo } from "react";
import { format } from "date-fns";
import { useApp } from "@/state/AppContext";
import { cn } from "@/lib/utils";

const DpoAudit = () => {
  const { audit } = useApp();
  const sorted = useMemo(() => [...audit].sort((a, b) => +new Date(b.ts) - +new Date(a.ts)), [audit]);

  const exportPdf = () => {
    // Placeholder export — open print dialog scoped to audit
    window.print();
  };

  return (
    <div className="px-12 py-10 max-w-[1000px] mx-auto animate-fade-in">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="font-serif text-[36px] leading-tight">Audit Trail</h1>
          <p className="text-sm text-muted-foreground mt-2">Every action, timestamped and attributed.</p>
        </div>
        <button
          onClick={exportPdf}
          className="border border-primary text-primary px-4 py-2 text-[11px] uppercase tracking-[0.16em] rounded-sm hover:bg-primary hover:text-primary-foreground transition-colors"
        >
          Export as PDF
        </button>
      </div>

      <div className="border-l border-border pl-8 space-y-6">
        {sorted.map((e) => (
          <div key={e.id} className="relative">
            <span className={cn(
              "absolute -left-[37px] top-1.5 w-2.5 h-2.5 rounded-full",
              e.actor === "Employee" ? "bg-foreground" : e.actor === "ARIA" ? "bg-warning" : "bg-success",
            )} />
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {format(new Date(e.ts), "d LLL yyyy, HH:mm:ss")} · {e.actor} · #{e.incidentId}
            </div>
            <div className="text-sm mt-1">{e.action}</div>
          </div>
        ))}
        {sorted.length === 0 && <div className="text-sm text-muted-foreground">No events yet.</div>}
      </div>
    </div>
  );
};

export default DpoAudit;
