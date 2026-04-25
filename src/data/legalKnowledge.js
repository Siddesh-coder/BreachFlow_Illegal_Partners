// LEGAL KNOWLEDGE BASE
// Source: gdpr-compliance.skill reference files
// Used by: Legal Counsel workspace, DPO dashboard, draft generation

export const legalKnowledge = {
  keyArticles: {
    "Art. 33": "Controller must notify supervisory authority within 72 hours of becoming aware of a breach, unless unlikely to result in risk to individuals.",
    "Art. 34": "Controller must notify affected individuals without undue delay if breach is likely to result in high risk to their rights and freedoms.",
    "Art. 9": "Special category data includes health, biometric, racial/ethnic origin, political opinions, religious beliefs, sexual orientation.",
    "Art. 28": "Processors must be bound by a Data Processing Agreement covering all Art. 28(3) mandatory terms.",
    "Art. 32": "Controller and processor must implement appropriate technical and organisational security measures.",
    "Art. 35": "DPIA required when processing likely results in high risk to individuals."
  },
  dpaTemplate: {
    breachNotificationClause: "Processor shall notify Controller of any personal data breach without undue delay and within 48 hours of becoming aware, providing information per Art. 33(3) to the extent available.",
    mandatoryClauses: ["Art. 28(3)(a) — instructions only", "Art. 28(3)(b) — confidentiality", "Art. 28(3)(c) — security", "Art. 28(3)(d) — sub-processors", "Art. 28(3)(e) — data subject rights assistance", "Art. 28(3)(f) — breach notification assistance", "Art. 28(3)(g) — deletion or return", "Art. 28(3)(h) — audit rights"]
  },
  dataSubjectRights: {
    responseTime: "1 calendar month (Art. 12(3)), extendable by 2 months for complex requests",
    rights: ["Access (Art. 15)", "Rectification (Art. 16)", "Erasure (Art. 17)", "Restriction (Art. 18)", "Portability (Art. 20)", "Object (Art. 21)", "No automated decisions (Art. 22)"]
  },
  retentionGuidance: {
    auditLogs: "Retain incident records for minimum 3 years for compliance evidence",
    breachNotifications: "Retain all breach documentation for supervisory authority inspection"
  },
  disclaimer: "This knowledge base is informational. It does not constitute legal advice. For high-stakes decisions, consult qualified data protection counsel."
};
