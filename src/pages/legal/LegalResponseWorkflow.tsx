import { useMemo, useState } from "react";
import { Plus, Minus, Maximize2, X, FolderSearch } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Stream = "LEGAL" | "TECHNICAL" | "LITIGATION" | "ADMIN";

interface NodeDef {
  id: string;
  title: string;
  stream: Stream;
  phase: string;
  time: string;
  col: number;
  row: number;
  description: string;
  parties: { name: string; role: string; email: string }[];
}

interface Edge {
  from: string;
  to: string;
  label?: string;
}

const STREAM_COLOR: Record<Stream, { border: string; pillBg: string; pillText: string }> = {
  LEGAL: { border: "#E8B4B4", pillBg: "#FBE9E9", pillText: "#8B1A1A" },
  TECHNICAL: { border: "#B4C8E8", pillBg: "#E6EEFB", pillText: "#1A3D7A" },
  LITIGATION: { border: "#D4B4E8", pillBg: "#F1E6FB", pillText: "#5A1A8B" },
  ADMIN: { border: "#E8E4DC", pillBg: "#F5F2EC", pillText: "#6B6560" },
};

// Layout grid: col (1..7), row (1..5). Cell size below.
const COL_W = 200;
const ROW_H = 130;
const NODE_W = 150;
const NODE_H = 88;
const PAD_X = 48;
const PAD_Y = 48;

const NODES: NodeDef[] = [
  {
    id: "incident",
    title: "Incident Reported",
    stream: "ADMIN",
    phase: "Phase 0",
    time: "0–30 min",
    col: 1,
    row: 3,
    description: "Initial intake of the incident through the employee reporting form or automated detection. Facts captured before any classification.",
    parties: [{ name: "Employee / Detector", role: "REPORTER", email: "report@aurora-health.de" }],
  },
  {
    id: "triage",
    title: "DPO Triage",
    stream: "ADMIN",
    phase: "Phase 0",
    time: "0–30 min",
    col: 2,
    row: 3,
    description: "DPO performs initial triage: severity assessment, data type identification, sector applicability.",
    parties: [{ name: "Maria Bergmann", role: "DATA PROTECTION OFFICER", email: "dpo@aurora-health.de" }],
  },
  {
    id: "p3",
    title: "P3: Engage IR Team",
    stream: "TECHNICAL",
    phase: "Phase 0",
    time: "0–1h",
    col: 3,
    row: 2,
    description: "Activate the incident response team, internal InfoSec lead and external IR provider on standby.",
    parties: [
      { name: "Stefan Vogel", role: "INFOSEC LEAD", email: "infosec@aurora-health.de" },
      { name: "External IR Provider", role: "INCIDENT RESPONSE", email: "ir@vendor.example" },
    ],
  },
  {
    id: "p4",
    title: "P4: Preserve Evidence",
    stream: "TECHNICAL",
    phase: "Phase 1",
    time: "0–6h",
    col: 3,
    row: 4,
    description: "Forensic snapshots, log preservation, chain of custody. Required before any containment that could destroy evidence.",
    parties: [{ name: "Stefan Vogel", role: "INFOSEC LEAD", email: "infosec@aurora-health.de" }],
  },
  {
    id: "p6",
    title: "P6: Inform Management",
    stream: "LEGAL",
    phase: "Phase 0",
    time: "0–1h",
    col: 4,
    row: 2,
    description: "Brief executive management on the incident scope, regulatory exposure, and immediate decisions required.",
    parties: [
      { name: "Maria Bergmann", role: "DATA PROTECTION OFFICER", email: "dpo@aurora-health.de" },
      { name: "Thomas Müller", role: "CEO", email: "ceo@aurora-health.de" },
    ],
  },
  {
    id: "p5",
    title: "P5: Contain the Breach",
    stream: "TECHNICAL",
    phase: "Phase 1",
    time: "1–6h",
    col: 4,
    row: 4,
    description: "Isolate affected systems, revoke credentials, block attacker pathways. Gated on evidence snapshot completion.",
    parties: [{ name: "Stefan Vogel", role: "INFOSEC LEAD", email: "infosec@aurora-health.de" }],
  },
  {
    id: "classification",
    title: "Legal Classification",
    stream: "LEGAL",
    phase: "Phase 2",
    time: "6–24h",
    col: 5,
    row: 2,
    description: "Legal Counsel determines notifiability under GDPR, NIS2, sectoral law. Reserved decision — system presents indicators only.",
    parties: [
      { name: "Maria Bergmann", role: "DATA PROTECTION OFFICER", email: "dpo@aurora-health.de" },
      { name: "Dr. Klaus Weber", role: "LEGAL COUNSEL", email: "legal@aurora-health.de" },
    ],
  },
  {
    id: "p7",
    title: "P7: Root Cause Analysis",
    stream: "TECHNICAL",
    phase: "Phase 3",
    time: "24–72h",
    col: 5,
    row: 4,
    description: "Determine root cause, contributing factors, and remediation plan. Feeds the final report.",
    parties: [{ name: "Stefan Vogel", role: "INFOSEC LEAD", email: "infosec@aurora-health.de" }],
  },
  {
    id: "p9",
    title: "P9: Notify Third Parties",
    stream: "LEGAL",
    phase: "Phase 2",
    time: "6–24h",
    col: 6,
    row: 1,
    description: "Notify processors, joint controllers, and contractually required third parties.",
    parties: [{ name: "Dr. Klaus Weber", role: "LEGAL COUNSEL", email: "legal@aurora-health.de" }],
  },
  {
    id: "p1",
    title: "P1: Authority Notification",
    stream: "LEGAL",
    phase: "Phase 3",
    time: "24–72h",
    col: 6,
    row: 2,
    description: "GDPR Art. 33 / NIS2 notification to competent supervisory authority. Released by Legal Counsel.",
    parties: [{ name: "Dr. Klaus Weber", role: "LEGAL COUNSEL", email: "legal@aurora-health.de" }],
  },
  {
    id: "p8",
    title: "P8: Notify Individuals",
    stream: "LEGAL",
    phase: "Phase 4",
    time: "72h+",
    col: 6,
    row: 3,
    description: "GDPR Art. 34 communication to data subjects when high risk to rights and freedoms.",
    parties: [{ name: "Dr. Klaus Weber", role: "LEGAL COUNSEL", email: "legal@aurora-health.de" }],
  },
  {
    id: "p2",
    title: "P2: Notify Insurance",
    stream: "LITIGATION",
    phase: "Phase 1",
    time: "1–6h",
    col: 6,
    row: 4,
    description: "Notify cyber insurance carrier within policy timeframe to preserve coverage.",
    parties: [{ name: "Dr. Klaus Weber", role: "LEGAL COUNSEL", email: "legal@aurora-health.de" }],
  },
  {
    id: "p10",
    title: "P10: Legal Hold & Privilege",
    stream: "LITIGATION",
    phase: "Phase 1",
    time: "1–6h",
    col: 6,
    row: 5,
    description: "Issue legal hold notices and apply privilege tags to protect sensitive communications.",
    parties: [{ name: "Dr. Klaus Weber", role: "LEGAL COUNSEL", email: "legal@aurora-health.de" }],
  },
  {
    id: "closure",
    title: "Incident Closure",
    stream: "ADMIN",
    phase: "Phase 5",
    time: "Closure",
    col: 7,
    row: 3,
    description: "Final report filed, lessons learned recorded, register entry archived.",
    parties: [{ name: "Maria Bergmann", role: "DATA PROTECTION OFFICER", email: "dpo@aurora-health.de" }],
  },
];

const EDGES: Edge[] = [
  { from: "incident", to: "triage" },
  { from: "triage", to: "p3" },
  { from: "triage", to: "p4" },
  { from: "p3", to: "p6" },
  { from: "p4", to: "p5", label: "snapshot" },
  { from: "p6", to: "classification" },
  { from: "p5", to: "p7" },
  { from: "classification", to: "p9" },
  { from: "classification", to: "p1" },
  { from: "classification", to: "p8" },
  { from: "p5", to: "p2" },
  { from: "p5", to: "p10" },
  { from: "p7", to: "closure" },
  { from: "p1", to: "closure" },
  { from: "p8", to: "closure" },
];

function nodePos(n: NodeDef) {
  const x = PAD_X + (n.col - 1) * COL_W;
  const y = PAD_Y + (n.row - 1) * ROW_H;
  return { x, y, cx: x + NODE_W / 2, cy: y + NODE_H / 2 };
}

const TOTAL_W = PAD_X * 2 + 6 * COL_W + NODE_W;
const TOTAL_H = PAD_Y * 2 + 4 * ROW_H + NODE_H;

const ResponseWorkflow = () => {
  const [zoom, setZoom] = useState(1);
  const [selected, setSelected] = useState<NodeDef | null>(null);
  const [fullscreen, setFullscreen] = useState(false);

  const positions = useMemo(() => {
    const map: Record<string, ReturnType<typeof nodePos>> = {};
    NODES.forEach((n) => (map[n.id] = nodePos(n)));
    return map;
  }, []);

  return (
    <div className="px-10 py-10 max-w-[1400px] mx-auto animate-fade-in">
      <h1 className="font-serif text-[36px] leading-tight">Response Workflow</h1>
      <p className="text-sm text-muted-foreground mt-2">
        Complete incident response process. Click any node for involved parties and stream details.
      </p>

      <div
        className={cn(
          "mt-6 relative bg-card border border-border shadow-card rounded-sm overflow-hidden",
          fullscreen && "fixed inset-4 z-40 max-w-none",
        )}
      >
        <div
          className="overflow-auto"
          style={{ height: fullscreen ? "calc(100vh - 2rem)" : 640 }}
        >
          <div
            style={{
              width: TOTAL_W * zoom,
              height: TOTAL_H * zoom,
              position: "relative",
            }}
          >
            <div
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: "top left",
                width: TOTAL_W,
                height: TOTAL_H,
                position: "relative",
              }}
            >
              {/* Edges */}
              <svg
                width={TOTAL_W}
                height={TOTAL_H}
                style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
              >
                <defs>
                  <marker
                    id="arrow"
                    viewBox="0 0 10 10"
                    refX="8"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#9A958C" />
                  </marker>
                </defs>
                {EDGES.map((e, i) => {
                  const a = positions[e.from];
                  const b = positions[e.to];
                  if (!a || !b) return null;
                  const x1 = a.x + NODE_W;
                  const y1 = a.cy;
                  const x2 = b.x;
                  const y2 = b.cy;
                  const midX = (x1 + x2) / 2;
                  const path = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
                  return (
                    <g key={i}>
                      <path
                        d={path}
                        stroke="#9A958C"
                        strokeWidth={1.2}
                        fill="none"
                        markerEnd="url(#arrow)"
                      />
                      {e.label && (
                        <g>
                          <rect
                            x={midX - 28}
                            y={(y1 + y2) / 2 - 9}
                            width={56}
                            height={16}
                            rx={3}
                            fill="#FFF5F5"
                            stroke="#F5C6C6"
                          />
                          <text
                            x={midX}
                            y={(y1 + y2) / 2 + 2}
                            textAnchor="middle"
                            fontSize={10}
                            fill="#8B1A1A"
                            fontFamily="monospace"
                          >
                            {e.label}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* Nodes */}
              {NODES.map((n) => {
                const p = positions[n.id];
                const c = STREAM_COLOR[n.stream];
                return (
                  <button
                    key={n.id}
                    onClick={() => setSelected(n)}
                    className="absolute text-left bg-card hover:bg-accent transition-colors shadow-card"
                    style={{
                      left: p.x,
                      top: p.y,
                      width: NODE_W,
                      height: NODE_H,
                      border: `1.5px solid ${c.border}`,
                      borderRadius: 4,
                      padding: "8px 10px",
                    }}
                  >
                    <div
                      className="text-[9px] uppercase tracking-[0.16em] font-semibold"
                      style={{ color: c.pillText }}
                    >
                      {n.stream}
                    </div>
                    <div className="text-[12px] font-semibold leading-tight mt-1 text-foreground">
                      {n.title}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1">
                      {n.phase} · {n.time}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Zoom controls */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-card border border-border rounded-sm shadow-card">
          <button
            onClick={() => setZoom((z) => Math.min(2, +(z + 0.1).toFixed(2)))}
            className="p-2 hover:bg-accent transition-colors"
            title="Zoom in"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(0.4, +(z - 0.1).toFixed(2)))}
            className="p-2 hover:bg-accent transition-colors"
            title="Zoom out"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setFullscreen((f) => !f)}
            className="p-2 hover:bg-accent transition-colors"
            title="Fullscreen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <span className="px-2 text-[10px] font-mono text-muted-foreground">
            {Math.round(zoom * 100)}%
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-between flex-wrap gap-3 text-[11px]">
        <div className="flex items-center gap-4 flex-wrap">
          <LegendDot color={STREAM_COLOR.LEGAL.border} label="Legal stream" />
          <LegendDot color={STREAM_COLOR.TECHNICAL.border} label="Technical stream" />
          <LegendDot color={STREAM_COLOR.LITIGATION.border} label="Litigation stream" />
          <LegendDot color={STREAM_COLOR.ADMIN.border} label="Admin stream" />
        </div>
        <span className="uppercase tracking-[0.18em] text-muted-foreground">
          Click any node for details
        </span>
      </div>

      {selected && <NodeModal node={selected} onClose={() => setSelected(null)} />}
    </div>
  );
};

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="inline-block w-3 h-3 rounded-sm"
        style={{ backgroundColor: color, border: "1px solid rgba(0,0,0,0.05)" }}
      />
      <span className="text-muted-foreground">{label}</span>
    </span>
  );
}

function NodeModal({ node, onClose }: { node: NodeDef; onClose: () => void }) {
  const c = STREAM_COLOR[node.stream];
  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-sm shadow-card max-w-[560px] w-full max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-border flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-serif text-[24px] leading-tight">{node.title}</h2>
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span
                className="text-[10px] uppercase tracking-[0.16em] font-semibold rounded-full px-2.5 py-1"
                style={{ backgroundColor: c.pillBg, color: c.pillText }}
              >
                {node.stream} STREAM
              </span>
              <span className="text-[10px] uppercase tracking-[0.16em] rounded-full px-2.5 py-1 bg-muted text-muted-foreground">
                {node.phase} · {node.time}
              </span>
              <span className="text-[10px] uppercase tracking-[0.16em] rounded-full px-2.5 py-1 bg-warning/10 text-warning">
                Active
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <p className="text-sm leading-relaxed text-foreground">{node.description}</p>

          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-2">
              Involved Parties
            </div>
            <div className="divide-y divide-border border-y border-border">
              {node.parties.map((p) => (
                <div key={p.email} className="py-2.5">
                  <div className="text-sm font-semibold">{p.name}</div>
                  <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mt-0.5">
                    {p.role}
                  </div>
                  <div className="text-xs font-mono text-muted-foreground mt-0.5">{p.email}</div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() =>
              toast({
                title: "Opening iManage",
                description: `Launching workspace for "${node.title}".`,
              })
            }
            className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] border border-border rounded-sm px-3 py-2 hover:bg-accent transition-colors"
          >
            <FolderSearch className="w-3.5 h-3.5" />
            View documents in iManage
          </button>

          <p className="text-[11px] italic text-muted-foreground">
            Legal classification reserved for Legal Counsel. This node represents a legal decision gate — the system presents indicators, not conclusions.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ResponseWorkflow;
