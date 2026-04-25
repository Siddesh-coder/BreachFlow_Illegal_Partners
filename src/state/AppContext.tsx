import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type {
  ActionStep,
  AuditEvent,
  Classification,
  Incident,
  IncidentStatus,
  IndicatorStatus,
  Notification,
  ProcessStageId,
} from "@/types/incident";
import type { SignedInUser } from "@/services/auth";
import { SEED_AUDIT, SEED_INCIDENTS, SEED_NOTIFICATIONS } from "@/data/seedIncidents";

const DEFAULT_LDH_TOKEN = "sFf4KDTWTAVUKsL6lfdkN7WWlkqoZW0O1fHE6F4I-5k";

// Seed default LDH token so the legal data hub works out of the box.
// The Gemini API key must be supplied by the user via the setup modal.
if (!localStorage.getItem("LDH_TOKEN")) localStorage.setItem("LDH_TOKEN", DEFAULT_LDH_TOKEN);

interface AppState {
  user: SignedInUser | null;
  isAnonymous: boolean;
  signInUser: (u: SignedInUser) => void;
  signInAnonymously: () => void;
  signOutUser: () => void;

  hasApiKeys: boolean;
  saveApiKeys: (openai: string, ldh: string) => void;

  incidents: Incident[];
  addIncident: (i: Incident) => void;
  updateIncident: (id: string, patch: Partial<Incident>) => void;
  updateStep: (incidentId: string, stepId: string, patch: Partial<ActionStep>) => void;
  setIncidentStatus: (id: string, status: IncidentStatus) => void;
  setIndicatorOverride: (incidentId: string, key: string, status: IndicatorStatus) => void;
  addClassification: (c: Omit<Classification, "id" | "ts" | "version">) => Classification;
  advanceProcessStage: (incidentId: string, to: ProcessStageId, opts?: { actor?: string; overrideReasons?: string[] }) => void;

  audit: AuditEvent[];
  addAudit: (e: Omit<AuditEvent, "id" | "ts"> & { ts?: string }) => void;

  notifications: Notification[];
  addNotification: (n: Omit<Notification, "id">) => void;
  updateNotification: (id: string, patch: Partial<Notification>) => void;
}

const AppCtx = createContext<AppState | null>(null);

const LS_USER = "BG_USER";
const LS_ANON = "BG_ANON";

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SignedInUser | null>(() => {
    const raw = localStorage.getItem(LS_USER);
    return raw ? JSON.parse(raw) : null;
  });
  const [isAnonymous, setIsAnonymous] = useState<boolean>(() => localStorage.getItem(LS_ANON) === "1");
  const [hasApiKeys, setHasApiKeys] = useState<boolean>(() => Boolean(localStorage.getItem("GEMINI_API_KEY") && localStorage.getItem("LDH_TOKEN")));

  const [incidents, setIncidents] = useState<Incident[]>(SEED_INCIDENTS);
  const [audit, setAudit] = useState<AuditEvent[]>(SEED_AUDIT);
  const [notifications, setNotifications] = useState<Notification[]>(SEED_NOTIFICATIONS);

  useEffect(() => {
    if (user) localStorage.setItem(LS_USER, JSON.stringify(user));
    else localStorage.removeItem(LS_USER);
  }, [user]);

  useEffect(() => {
    localStorage.setItem(LS_ANON, isAnonymous ? "1" : "0");
  }, [isAnonymous]);

  const value: AppState = useMemo(() => ({
    user,
    isAnonymous,
    signInUser: (u) => {
      setUser(u);
      setIsAnonymous(false);
    },
    signInAnonymously: () => {
      setUser(null);
      setIsAnonymous(true);
    },
    signOutUser: () => {
      setUser(null);
      setIsAnonymous(false);
    },

    hasApiKeys,
    saveApiKeys: (gemini, ldh) => {
      if (gemini) localStorage.setItem("GEMINI_API_KEY", gemini);
      if (ldh) localStorage.setItem("LDH_TOKEN", ldh);
      setHasApiKeys(Boolean(localStorage.getItem("GEMINI_API_KEY") && localStorage.getItem("LDH_TOKEN")));
    },

    incidents,
    addIncident: (i) => setIncidents((prev) => [i, ...prev]),
    updateIncident: (id, patch) =>
      setIncidents((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it))),
    updateStep: (incidentId, stepId, patch) =>
      setIncidents((prev) =>
        prev.map((it) =>
          it.id === incidentId
            ? { ...it, recommendations: it.recommendations.map((s) => (s.id === stepId ? { ...s, ...patch } : s)) }
            : it,
        ),
      ),
    setIncidentStatus: (id, status) =>
      setIncidents((prev) => prev.map((it) => (it.id === id ? { ...it, status } : it))),
    setIndicatorOverride: (incidentId, key, status) =>
      setIncidents((prev) =>
        prev.map((it) =>
          it.id === incidentId
            ? { ...it, indicatorOverrides: { ...(it.indicatorOverrides ?? {}), [key]: status } }
            : it,
        ),
      ),
    addClassification: (c) => {
      const created: Classification = {
        ...c,
        id: crypto.randomUUID(),
        ts: new Date().toISOString(),
        version: 1, // computed below from current state
      };
      setIncidents((prev) =>
        prev.map((it) => {
          if (it.id !== c.incidentId) return it;
          const existing = it.classifications ?? [];
          created.version = existing.length + 1;
          return { ...it, classifications: [created, ...existing] };
        }),
      );
      return created;
    },
    advanceProcessStage: (incidentId, to, opts) => {
      const ts = new Date().toISOString();
      const order: ProcessStageId[] = ["P0", "P1", "P2", "P3", "P4"];
      setIncidents((prev) =>
        prev.map((it) => {
          if (it.id !== incidentId) return it;
          const existing = it.process?.stages ?? order.map((id) => ({ id, status: "pending" as const }));
          const toIdx = order.indexOf(to);
          const stages = existing.map((s) => {
            const sIdx = order.indexOf(s.id);
            if (sIdx < toIdx) {
              return s.status === "complete"
                ? s
                : { ...s, status: "complete" as const, completedAt: s.completedAt ?? ts, completedBy: s.completedBy ?? opts?.actor };
            }
            if (sIdx === toIdx) {
              return { ...s, status: "in_progress" as const, enteredAt: s.enteredAt ?? ts, overrideReasons: opts?.overrideReasons };
            }
            return { ...s, status: "pending" as const };
          });
          return { ...it, process: { currentStage: to, stages } };
        }),
      );
    },

    audit,
    addAudit: (e) =>
      setAudit((prev) => [
        { id: crypto.randomUUID(), ts: e.ts ?? new Date().toISOString(), incidentId: e.incidentId, actor: e.actor, action: e.action },
        ...prev,
      ]),

    notifications,
    addNotification: (n) =>
      setNotifications((prev) => [{ id: crypto.randomUUID(), ...n }, ...prev]),
    updateNotification: (id, patch) =>
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } : n))),
  }), [user, isAnonymous, hasApiKeys, incidents, audit, notifications]);

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
