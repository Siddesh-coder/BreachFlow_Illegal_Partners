// NIS2 KNOWLEDGE BASE
// Source: NIS2 Navigator by Oliver Schmidt-Prietz (Lawvable)
// Used by: Indicator Engine, ARIA NIS2 questions, DPO Process Engine

export const nis2Knowledge = {

  disclaimer: "NIS2 compliance guidance only. Does not constitute legal advice. Final decisions require qualified legal counsel and your CISO.",

  scopeClassification: {
    description: "Determines if organization falls under NIS2 and classifies as Essential or Important entity",
    sizeThresholds: {
      medium: { employees: 50, turnoverM: 10, balanceSheetM: 10 },
      large: { employees: 250, turnoverM: 50, balanceSheetM: 43 }
    },
    essentialEntityCriteria: [
      "Annex I sector + large enterprise",
      "Qualified trust service provider",
      "TLD registry or DNS provider",
      "Public electronic communications network provider",
      "Central public administration",
      "KRITIS operator (Germany)"
    ],
    importantEntityCriteria: [
      "Annex I sector + medium enterprise",
      "Annex II sector + medium or large enterprise"
    ],
    doraExclusion: "Financial entities regulated under DORA are excluded from NIS2 Art. 21 and Art. 23 — DORA acts as lex specialis",
    cirFlag: "Digital infrastructure entities face additional requirements under CIR 2024/2690 beyond Art. 21"
  },

  annexISectors: [
    "Energy (electricity, oil, gas, hydrogen)",
    "Transport (air, rail, water, road)",
    "Banking",
    "Financial market infrastructure",
    "Health (hospitals, labs, pharma, medical devices)",
    "Drinking water",
    "Waste water",
    "Digital infrastructure (IXPs, DNS, TLD, cloud, datacentre, CDN, trust services, comms networks)",
    "ICT service management (MSPs, MSSPs)",
    "Public administration",
    "Space"
  ],

  annexIISectors: [
    "Postal and courier services",
    "Waste management",
    "Manufacture of chemicals",
    "Food production and distribution",
    "Manufacturing (medical devices, computers, machinery, motor vehicles, transport equipment)",
    "Digital providers (online marketplaces, search engines, social networks)",
    "Research"
  ],

  art21Measures: [
    {
      id: "a",
      label: "Risk analysis and information security policies",
      article: "Art. 21(2)(a)",
      iso27001: "A.5.1, A.5.2",
      question: "Do you have a documented information security risk analysis process and security policies reviewed in the last 12 months?",
      maturityDescriptions: {
        0: "No risk analysis or security policies exist",
        1: "Informal, person-dependent risk awareness",
        2: "Documented but inconsistently applied",
        3: "Consistently implemented, monitored, reviewed",
        4: "Continuously improved, integrated into enterprise risk management"
      }
    },
    {
      id: "b",
      label: "Incident handling",
      article: "Art. 21(2)(b)",
      iso27001: "A.5.24, A.5.25, A.5.26",
      question: "Do you have a documented incident response plan with defined roles, tested in the last 12 months?",
      incidentReporting: {
        earlyWarning: "24 hours — from becoming aware of significant incident",
        notification: "72 hours — from becoming aware",
        finalReport: "1 month — comprehensive report"
      }
    },
    {
      id: "c",
      label: "Business continuity and crisis management",
      article: "Art. 21(2)(c)",
      iso27001: "A.5.29, A.5.30",
      question: "Do you have tested business continuity and disaster recovery plans covering your NIS2-relevant services?"
    },
    {
      id: "d",
      label: "Supply chain security",
      article: "Art. 21(2)(d)",
      iso27001: "A.5.19, A.5.20, A.5.21",
      question: "Do you assess cybersecurity risks from suppliers and service providers, with contractual security clauses?"
    },
    {
      id: "e",
      label: "Network and IS acquisition, development, maintenance",
      article: "Art. 21(2)(e)",
      iso27001: "A.8.25, A.8.26, A.8.27, A.8.28",
      question: "Do you have secure development practices, vulnerability management, and patch management processes?"
    },
    {
      id: "f",
      label: "Effectiveness assessment of cybersecurity measures",
      article: "Art. 21(2)(f)",
      iso27001: "A.5.35, A.5.36",
      question: "Do you conduct regular audits, penetration tests, or vulnerability assessments of your security measures?"
    },
    {
      id: "g",
      label: "Cyber hygiene and cybersecurity training",
      article: "Art. 21(2)(g)",
      iso27001: "A.6.3, A.8.8",
      question: "Do all staff receive regular cybersecurity awareness training, including management?"
    },
    {
      id: "h",
      label: "Cryptography and encryption",
      article: "Art. 21(2)(h)",
      iso27001: "A.8.24",
      question: "Do you have encryption policies covering data at rest and in transit for your critical systems?"
    },
    {
      id: "i",
      label: "HR security, access control, asset management",
      article: "Art. 21(2)(i)",
      iso27001: "A.6.1, A.6.2, A.5.9, A.5.10",
      question: "Do you have least-privilege access controls, joiners/movers/leavers processes, and asset inventory?"
    },
    {
      id: "j",
      label: "Multi-factor authentication and secure communications",
      article: "Art. 21(2)(j)",
      iso27001: "A.8.5",
      question: "Is MFA enforced for all remote access, privileged accounts, and critical system access?"
    }
  ],

  germanySpecific: {
    law: "NIS2UmsuCG (BSIG-neu)",
    bsiRegistration: {
      required: "Essential and important entities must register with BSI",
      deadline: "Overdue since 6 March 2026",
      url: "betroffenheitspruefung-nis-2.bsi.de"
    },
    keyParagraphs: {
      "§ 30": "Risk management measures — equivalent to Art. 21",
      "§ 32": "Incident reporting to BSI — 24h early warning, 72h notification",
      "§ 38": "Management body obligations — personal liability for non-compliance",
      "§ 38(2)": "Personal liability of management for damages from non-compliance"
    },
    nachweispflicht: "Proof of compliance deadline: December 2028",
    managementLiability: "German law creates personal liability for management body members under § 38(2) BSIG — not delegable"
  },

  significantIncidentIndicators: [
    "Service disruption affecting more than [threshold] users",
    "Financial loss exceeding €[threshold]",
    "Reputational damage of significant scale",
    "Data loss affecting critical infrastructure operations",
    "Incident causing physical damage"
  ],

  incidentReportingDeadlines: {
    earlyWarning: { hours: 24, label: "NIS2 Early Warning", article: "Art. 23(1)(a)", recipient: "BSI (Germany)" },
    notification: { hours: 72, label: "NIS2 Incident Notification", article: "Art. 23(1)(b)", recipient: "BSI (Germany)" },
    finalReport: { days: 30, label: "NIS2 Final Report", article: "Art. 23(1)(c)", recipient: "BSI (Germany)" }
  },

  maturityScoring: {
    0: { label: "Non-existent", color: "#8B1A1A" },
    1: { label: "Ad hoc", color: "#7A5C1A" },
    2: { label: "Defined", color: "#7A5C1A" },
    3: { label: "Managed", color: "#1A4A2E" },
    4: { label: "Optimized", color: "#1A4A2E" }
  },

  prioritizationMatrix: {
    essential: { maturity0: "P1-Immediate", maturity1: "P1-Immediate", maturity2: "P2-Short-term" },
    important: { maturity0: "P1-Immediate", maturity1: "P2-Short-term", maturity2: "P3-Medium-term" }
  }
};
