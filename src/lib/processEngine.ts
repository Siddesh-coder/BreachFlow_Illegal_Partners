import type { Incident, Notification, ProcessStage, ProcessStageId } from "@/types/incident";
import { PROCESS_STAGE_DEFS } from "@/types/incident";

export const STAGE_ORDER: ProcessStageId[] = ["P0", "P1", "P2", "P3", "P4"];

export interface StageRequirement {
  id: string;
  label: string;
  done: boolean;
}

/** Default stages if incident has no process state yet — derive an initial one. */
export function ensureProcess(incident: Incident): { currentStage: ProcessStageId; stages: ProcessStage[] } {
  if (incident.process) return incident.process;
  const stages: ProcessStage[] = STAGE_ORDER.map((id) => ({
    id,
    status: id === "P0" ? "in_progress" : "pending",
    enteredAt: id === "P0" ? incident.reportedAt : undefined,
  }));
  return { currentStage: "P0", stages };
}

/** Soft-gate requirements per stage, derived from incident state. */
export function getStageRequirements(
  stage: ProcessStageId,
  incident: Incident,
  notifications: Notification[],
): StageRequirement[] {
  const incidentNotifs = notifications.filter((n) => n.incidentId === incident.id);
  switch (stage) {
    case "P0":
      return [
        { id: "facts", label: "Core facts captured (what happened)", done: !!incident.whatHappened?.trim() },
        { id: "data", label: "Data types identified", done: incident.dataTypes.length > 0 },
        { id: "severity", label: "Severity assigned", done: !!incident.severity },
      ];
    case "P1":
      return [
        { id: "contained", label: "Containment status recorded", done: incident.contained !== null },
        { id: "legal_brief", label: "Legal Counsel briefed", done: incidentNotifs.some((n) => n.type === "Internal") },
      ];
    case "P2":
      return [
        { id: "indicators", label: "Indicator scoreboards reviewed", done: !!incident.indicatorOverrides && Object.keys(incident.indicatorOverrides).length > 0 },
        { id: "classification", label: "Legal classification recorded", done: (incident.classifications?.length ?? 0) > 0 },
      ];
    case "P3":
      return [
        { id: "drafts", label: "Notification drafts prepared", done: incidentNotifs.length > 0 },
        { id: "legal_release", label: "At least one draft legally released", done: incidentNotifs.some((n) => n.releasedByLegal) },
        { id: "em_approval", label: "Executive Management approved dispatch", done: incidentNotifs.some((n) => n.emApprovedAt) },
      ];
    case "P4":
      return [
        { id: "completed", label: "Incident marked completed", done: incident.status === "completed" },
      ];
  }
}

export function stageDef(id: ProcessStageId) {
  return PROCESS_STAGE_DEFS.find((s) => s.id === id)!;
}
