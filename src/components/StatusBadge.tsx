import type { IncidentStatus } from "@/types/incident";
import { cn } from "@/lib/utils";

const LABEL: Record<IncidentStatus, string> = {
  new: "New",
  in_progress: "In Progress",
  completed: "Completed",
};

export function StatusBadge({ status, className }: { status: IncidentStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center border border-border bg-secondary px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] rounded-sm text-foreground/80",
        className,
      )}
    >
      {LABEL[status]}
    </span>
  );
}
