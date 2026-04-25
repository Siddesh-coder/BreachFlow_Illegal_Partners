import type { Severity } from "@/types/incident";
import { cn } from "@/lib/utils";

const STYLES: Record<Severity, { dot: string; label: string; cls: string }> = {
  high: { dot: "bg-destructive", label: "HIGH", cls: "text-destructive border-destructive/40 bg-destructive/5" },
  medium: { dot: "bg-warning", label: "MEDIUM", cls: "text-warning border-warning/40 bg-warning/5" },
  low: { dot: "bg-success", label: "LOW", cls: "text-success border-success/40 bg-success/5" },
};

export function SeverityBadge({ severity, className }: { severity: Severity; className?: string }) {
  const s = STYLES[severity];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] rounded-sm",
        s.cls,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}
