import { useMemo } from "react";
import { FileDown, FolderOpen, FolderSearch, ArrowRight } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { format } from "date-fns";
import { LegalDeadlineStrip } from "@/components/legal/LegalDeadlineStrip";
import { DeadlinePanel } from "@/components/DeadlinePanel";
import { useApp } from "@/state/AppContext";
import type { Incident } from "@/types/incident";
import { toast } from "@/hooks/use-toast";

type Owner = "DPO" | "InfoSec" | "Legal Counsel";

interface WorkflowStep {
  id: string;
  phase: string;
  title: string;
  owner: Owner;
  imanagePath: string;
}

const WORKFLOW: WorkflowStep[] = [
  { id: "intake", phase: "Phase 0", title: "Incident Intake & Triage", owner: "DPO", imanagePath: "/Aurora/Incidents/{id}/01-Intake" },
  { id: "evidence", phase: "Phase 1", title: "Evidence Preservation", owner: "InfoSec", imanagePath: "/Aurora/Incidents/{id}/02-Evidence" },
  { id: "containment", phase: "Phase 1", title: "Containment & Mgmt Brief", owner: "InfoSec", imanagePath: "/Aurora/Incidents/{id}/03-Containment" },
  { id: "classification", phase: "Phase 2", title: "Legal Classification", owner: "Legal Counsel", imanagePath: "/Aurora/Incidents/{id}/04-Classification" },
  { id: "notifications", phase: "Phase 3", title: "Authority & Subject Notifications", owner: "Legal Counsel", imanagePath: "/Aurora/Incidents/{id}/05-Notifications" },
  { id: "insurance", phase: "Phase 1", title: "Insurance & Third-Party Notice", owner: "Legal Counsel", imanagePath: "/Aurora/Incidents/{id}/06-Insurance" },
  { id: "hold", phase: "Phase 1", title: "Legal Hold & Privilege", owner: "Legal Counsel", imanagePath: "/Aurora/Incidents/{id}/07-Privilege" },
  { id: "closure", phase: "Phase 5", title: "Root Cause & Closure", owner: "DPO", imanagePath: "/Aurora/Incidents/{id}/08-Closure" },
];

const OWNER_STYLE: Record<Owner, string> = {
  DPO: "bg-muted text-muted-foreground border-border",
  InfoSec: "border-[#B4C8E8] bg-[#E6EEFB] text-[#1A3D7A]",
  "Legal Counsel": "border-[#E8B4B4] bg-[#FBE9E9] text-[#8B1A1A]",
};

function pickFocusIncident(incidents: Incident[]): Incident | null {
  const active = incidents.filter((i) => i.status !== "completed");
  const pool = active.length ? active : incidents;
  if (!pool.length) return null;
  return [...pool].sort(
    (a, b) => +new Date(a.discoveredAt) - +new Date(b.discoveredAt),
  )[0];
}

const LegalOverview = () => {
  const { incidents } = useApp();
  const { id } = useParams<{ id: string }>();
  const focus = useMemo(() => {
    if (id) return incidents.find((i) => i.id === id) ?? null;
    return pickFocusIncident(incidents);
  }, [incidents, id]);

  const handleExport = () => {
    toast({
      title: "Export started",
      description: focus
        ? `Generating PDF summary for incident #${focus.id}.`
        : "No active incident to export.",
    });
  };

  const handleOpenFolder = (path?: string) => {
    toast({
      title: "Opening iManage",
      description: path
        ? `Launching iManage workspace at ${path}.`
        : "Launching iManage workspace.",
    });
  };

  return (
    <div className="animate-fade-in">
      <LegalDeadlineStrip />

      <div className="px-10 py-10 max-w-[1300px] mx-auto space-y-10">
        {/* Header */}
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Legal Counsel Dashboard
          </div>
          <h1 className="font-serif text-[36px] leading-tight mt-1">
            {focus ? `Incident #${focus.id}` : "No active incident"}
          </h1>
          {focus && (
            <p className="text-sm text-muted-foreground mt-2 max-w-3xl">
              {focus.aiSummary}
            </p>
          )}
          {focus && (
            <div className="mt-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Discovered {format(new Date(focus.discoveredAt), "d LLL yyyy, HH:mm")}
            </div>
          )}
        </div>

        {/* Front-and-center action bar */}
        <div className="bg-card border border-border shadow-card rounded-sm p-6 flex flex-col md:flex-row md:items-center justify-center gap-4">
          <button
            onClick={handleExport}
            className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 bg-foreground text-background rounded-sm hover:opacity-90 transition-opacity text-[12px] uppercase tracking-[0.18em] font-semibold"
          >
            <FileDown className="w-4 h-4" />
            Export PDF Summary
          </button>
          <button
            onClick={() => handleOpenFolder(focus ? `/Aurora/Incidents/${focus.id}` : undefined)}
            className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 bg-card border border-foreground text-foreground rounded-sm hover:bg-accent transition-colors text-[12px] uppercase tracking-[0.18em] font-semibold"
          >
            <FolderOpen className="w-4 h-4" />
            View iManage Folder
          </button>
        </div>

        {/* Deadlines */}
        {focus && <DeadlinePanel incident={focus} />}

        {/* Response Workflow — ownership focused */}
        <section>
          <div className="flex items-end justify-between mb-4">
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Response workflow
              </div>
              <h2 className="font-serif text-xl mt-1">Ownership & document trail</h2>
            </div>
            <Link
              to="/legal/response-workflow"
              className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              Open full workflow <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="bg-card border border-border shadow-card rounded-sm divide-y divide-border">
            {WORKFLOW.map((s) => {
              const path = focus
                ? s.imanagePath.replace("{id}", focus.id)
                : s.imanagePath.replace("{id}", "—");
              return (
                <div
                  key={s.id}
                  className="px-5 py-4 grid grid-cols-1 md:grid-cols-[80px_1fr_140px_auto] gap-4 items-center"
                >
                  <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-mono">
                    {s.phase}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-foreground leading-snug">
                      {s.title}
                    </div>
                    <div className="text-[11px] text-muted-foreground font-mono mt-0.5 truncate">
                      {path}
                    </div>
                  </div>
                  <span
                    className={`text-[10px] uppercase tracking-[0.16em] border rounded-full px-2.5 py-1 w-fit whitespace-nowrap ${OWNER_STYLE[s.owner]}`}
                  >
                    {s.owner}
                  </span>
                  <button
                    onClick={() => handleOpenFolder(path)}
                    className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] border border-border rounded-sm px-3 py-2 hover:bg-accent transition-colors whitespace-nowrap"
                  >
                    <FolderSearch className="w-3.5 h-3.5" />
                    View documents in iManage
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};

export default LegalOverview;
