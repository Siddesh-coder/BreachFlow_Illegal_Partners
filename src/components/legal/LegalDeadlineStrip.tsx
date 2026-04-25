import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/state/AppContext";
import type { Incident } from "@/types/incident";

interface DeadlineDef {
  key: string;
  label: string;
  hours: number;
  applies: (i: Incident) => boolean;
}

const DEADLINES: DeadlineDef[] = [
  { key: "nis2_24h", label: "NIS2 24h", hours: 24, applies: (i) => !!i.nis2Sector && i.nis2Sector !== "Not Applicable" },
  { key: "insurance_1d", label: "Insurance 1d", hours: 24, applies: (i) => !!i.cyberInsurance },
  { key: "gdpr_72h", label: "GDPR 72h", hours: 72, applies: () => true },
  { key: "nis2_72h", label: "NIS2 72h", hours: 72, applies: (i) => !!i.nis2Sector && i.nis2Sector !== "Not Applicable" },
  { key: "nis2_1mo", label: "NIS2 1mo", hours: 24 * 30, applies: (i) => !!i.nis2Sector && i.nis2Sector !== "Not Applicable" },
];

function pickMostUrgent(incidents: Incident[]): Incident | null {
  const active = incidents.filter((i) => i.status !== "completed");
  const pool = active.length ? active : incidents;
  if (!pool.length) return null;
  return [...pool].sort((a, b) => +new Date(a.discoveredAt) - +new Date(b.discoveredAt))[0];
}

function fmtRemaining(ms: number): string {
  const expired = ms <= 0;
  const abs = Math.abs(ms);
  const d = Math.floor(abs / 86400000);
  const h = Math.floor((abs % 86400000) / 3600000);
  const m = Math.floor((abs % 3600000) / 60000);
  const s = Math.floor((abs % 60000) / 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  let core: string;
  if (d > 0) core = `${d}d ${pad(h)}:${pad(m)}:${pad(s)}`;
  else core = `${pad(h)}:${pad(m)}:${pad(s)}`;
  return expired ? `−${core}` : core;
}

export function LegalDeadlineStrip() {
  const { incidents } = useApp();
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const incident = useMemo(() => pickMostUrgent(incidents), [incidents]);

  const items = useMemo(() => {
    if (!incident) return [];
    return DEADLINES.filter((d) => d.applies(incident)).map((d) => {
      const due = new Date(incident.discoveredAt).getTime() + d.hours * 3600 * 1000;
      const remaining = due - Date.now();
      return { ...d, remaining };
    });
  }, [incident]);

  return (
    <div className="sticky top-0 z-30">
      {/* Strip */}
      <div className="bg-background border-b border-border">
        <div className="px-6 py-2 flex items-center gap-5 overflow-x-auto">
          <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground whitespace-nowrap">
            ⏱ Active Deadlines
          </span>
          <div className="h-3 w-px bg-border shrink-0" />
          {items.length === 0 && (
            <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground/70">
              No active incidents
            </span>
          )}
          {items.map((d) => {
            const expired = d.remaining <= 0;
            return (
              <div key={d.key} className="flex items-center gap-2 whitespace-nowrap">
                <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{d.label}</span>
                <span
                  className={`text-[11px] tabular-nums font-mono ${
                    expired
                      ? "text-destructive"
                      : d.remaining < 6 * 3600 * 1000
                      ? "text-destructive"
                      : d.remaining < 24 * 3600 * 1000
                      ? "text-warning"
                      : "text-foreground"
                  }`}
                >
                  {fmtRemaining(d.remaining)}
                </span>
              </div>
            );
          })}
          <span className="ml-auto text-[11px] uppercase tracking-[0.18em] text-muted-foreground/70 whitespace-nowrap">
            Legal Classification Reserved for Legal Counsel
          </span>
        </div>
      </div>

      {/* Red warning banner */}
      <div
        className="border-b"
        style={{ backgroundColor: "#FFF5F5", borderColor: "#F5C6C6" }}
      >
        <div className="px-6 py-2.5 flex items-start gap-2.5">
          <span className="text-[14px] leading-none mt-0.5">⚖️</span>
          <p
            className="text-[13px] leading-snug"
            style={{ color: "#8B1A1A", fontFamily: "var(--font-sans)" }}
          >
            Legal classification — notifiability, competent authority, exemption assessment — is reserved for Legal Counsel. This system presents indicators and available facts only.
          </p>
        </div>
      </div>
    </div>
  );
}
