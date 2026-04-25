import type {
  Incident,
  IndicatorCriterion,
  IndicatorStatus,
} from "@/types/incident";

export type RegimeId = "gdpr_33" | "gdpr_34" | "nis2_23";

export interface IndicatorRegime {
  id: RegimeId;
  title: string;          // e.g. "GDPR Art. 33 — Indicator Check"
  shortTitle: string;     // e.g. "GDPR Art. 33"
  criteria: IndicatorCriterion[];
}

const SPECIAL_CATEGORY: ReadonlySet<string> = new Set([
  "Health/Medical Records",
  "Biometric Data",
  "Special Category Data",
]);

/**
 * Derive indicator criteria for a given regime from the incident facts.
 * Each criterion is "matched" / "open" / "unclear" — never a verdict.
 * Override map can flip status per criterion (Legal Counsel decision).
 */
export function deriveRegime(
  incident: Incident,
  regime: RegimeId,
): IndicatorRegime {
  const overrides = incident.indicatorOverrides ?? {};
  const apply = (c: IndicatorCriterion): IndicatorCriterion => {
    const k = `${regime}:${c.id}`;
    return overrides[k] ? { ...c, status: overrides[k] } : c;
  };

  if (regime === "gdpr_33") {
    const personal = incident.dataTypes.length > 0;
    const special = incident.dataTypes.some((d) => SPECIAL_CATEGORY.has(d));
    const affected = incident.affectedCount;
    const encryptionMentioned = /encrypt|encryption/i.test(
      `${incident.whatHappened} ${incident.additionalNotes}`,
    );
    const crossBorder = incident.countries.length > 1;

    const criteria: IndicatorCriterion[] = [
      {
        id: "personal_data",
        label: "Personal data involved",
        status: personal ? "matched" : "open",
        source: "GDPR Art. 4(1)",
      },
      {
        id: "special_category",
        label: special
          ? "Special category data (Art. 9)"
          : "Special category data (Art. 9) not indicated",
        status: special ? "matched" : "unclear",
        source: "GDPR Art. 9",
      },
      {
        id: "affected_count",
        label:
          affected != null
            ? `Estimated affected: ${affected.toLocaleString()}`
            : "Estimated affected: not provided",
        status: affected != null ? "matched" : "open",
        source: "Intake Q3",
      },
      {
        id: "encryption",
        label: "Encryption rendering data unintelligible",
        status: encryptionMentioned ? "matched" : "open",
        source: "EDPB Guidelines 9/2022",
      },
      {
        id: "cross_border",
        label: crossBorder
          ? "Cross-border EU exposure"
          : "Cross-border EU exposure",
        status: crossBorder ? "matched" : "unclear",
        source: "GDPR Art. 56 (one-stop-shop)",
      },
    ];
    return {
      id: "gdpr_33",
      title: "GDPR Art. 33 — Indicator Check",
      shortTitle: "GDPR Art. 33",
      criteria: criteria.map(apply),
    };
  }

  if (regime === "gdpr_34") {
    const special = incident.dataTypes.some((d) => SPECIAL_CATEGORY.has(d));
    const credentials = incident.dataTypes.includes("Login Credentials");
    const financial = incident.dataTypes.includes("Financial Data");
    const contained = incident.contained === true;
    const largeScale = (incident.affectedCount ?? 0) >= 500;

    const criteria: IndicatorCriterion[] = [
      {
        id: "high_risk_categories",
        label: "High-risk data categories (special / credentials / financial)",
        status: special || credentials || financial ? "matched" : "open",
        source: "GDPR Art. 34(1)",
      },
      {
        id: "large_scale",
        label: largeScale
          ? "Large-scale impact indicated (≥500 affected)"
          : "Large-scale impact not indicated",
        status: largeScale ? "matched" : "unclear",
        source: "EDPB WP250",
      },
      {
        id: "mitigation",
        label: contained
          ? "Mitigation in place (incident contained)"
          : "Mitigation in place (incident contained)",
        status: contained ? "matched" : "open",
        source: "GDPR Art. 34(3)(b)",
      },
    ];
    return {
      id: "gdpr_34",
      title: "GDPR Art. 34 — Indicator Check",
      shortTitle: "GDPR Art. 34",
      criteria: criteria.map(apply),
    };
  }

  // nis2_23
  const sector = incident.nis2Sector;
  const sectorActive = !!sector && sector !== "Not Applicable";
  const significantSignals =
    (incident.severity === "high" ? 2 : incident.severity === "medium" ? 1 : 0) +
    (incident.contained === false ? 1 : 0) +
    (incident.countries.length > 1 ? 1 : 0);
  const sizeKnown = incident.affectedCount != null;

  const criteria: IndicatorCriterion[] = [
    {
      id: "sector_threshold",
      label: sectorActive
        ? `Sector threshold matched (${sector})`
        : "Sector threshold (NIS2 essential/important entity)",
      status: sectorActive ? "matched" : "open",
      source: "NIS2 Annex I/II",
    },
    {
      id: "significant_indicators",
      label: `Significant incident indicators: ${significantSignals}/4`,
      status: significantSignals >= 2 ? "matched" : "open",
      source: "NIS2 Art. 23(3)",
    },
    {
      id: "size_threshold",
      label: sizeKnown
        ? `Size threshold confirmed (${incident.affectedCount?.toLocaleString()} affected)`
        : "Size threshold confirmed",
      status: sizeKnown ? "matched" : "open",
      source: "NIS2 Art. 2",
    },
  ];

  return {
    id: "nis2_23",
    title: "NIS2 Art. 23 — Indicator Check",
    shortTitle: "NIS2 Art. 23",
    criteria: criteria.map(apply),
  };
}

export function countMatched(criteria: IndicatorCriterion[]): {
  matched: number;
  total: number;
} {
  return {
    matched: criteria.filter((c) => c.status === "matched").length,
    total: criteria.length,
  };
}

export function nextOverride(current: IndicatorStatus): IndicatorStatus {
  // cycle: matched → open → unclear → matched
  return current === "matched" ? "open" : current === "open" ? "unclear" : "matched";
}
