// ARIA SKILL DOCUMENT — GDPR Compliance Expert
// Source: gdpr-compliance.skill / SKILL.md
// This defines ARIA's behavior, question logic, and legal boundaries

export const ariaSkillDocument = {
  name: "gdpr-compliance",
  coreRules: [
    "Always cite GDPR articles when making any compliance statement",
    "Never say 'you must notify' or 'this is notifiable' — say 'criteria present' or 'indicators matched'",
    "Never replace Legal Counsel — always flag decisions requiring human legal review",
    "Ask one question at a time. Push back once on vague answers before accepting.",
    "If user says 'I don't know' — log as 'open' confidence, mark as gap, move on",
    "Adapt tone: plain language for employees, legal-precise for DPO/Legal Counsel"
  ],
  intakeQuestions: [
    {
      id: "discovery_time",
      question: "When did you or your team first become aware of this incident?",
      type: "datetime",
      mandatory: true,
      gdprArticle: "Art. 33(1) — 72h runs from time of becoming aware",
      pushBack: "The exact discovery time is critical — it starts the 72-hour GDPR clock. Can you give an approximate time even if not exact?"
    },
    {
      id: "data_types",
      question: "What type of data was involved?",
      type: "multiselect",
      options: [
        "Personal Identifiers (name, email, address)",
        "Financial Data (bank details, credit card)",
        "Health/Medical Records",
        "Login Credentials (passwords, tokens)",
        "Biometric Data",
        "Special Category Data (racial/ethnic origin, political opinions, religion, sexual orientation)",
        "Children's Data",
        "Criminal Conviction Data"
      ],
      mandatory: true,
      gdprArticle: "Art. 9 — special category data triggers higher risk indicators",
      pushBack: "Knowing the data type is essential for assessing risk. Please select all that apply, even if uncertain."
    },
    {
      id: "affected_count",
      question: "Approximately how many individuals are affected?",
      type: "number",
      allowUnknown: true,
      mandatory: false,
      gdprArticle: "Art. 33(3)(c) — number of individuals is a required notification field",
      pushBack: "An estimate or range is fine — for example, 'fewer than 100' or 'around 1,000'. This affects the risk assessment."
    },
    {
      id: "incident_description",
      question: "What do you believe happened?",
      type: "freetext",
      hints: ["Unauthorized Access", "Ransomware", "Lost/Stolen Device", "Accidental Disclosure", "Phishing", "Other"],
      mandatory: true,
      gdprArticle: "Art. 33(3)(a) — nature of breach required in notification",
      pushBack: "Can you describe what you observed, even briefly? For example: was data accessed, copied, lost, or encrypted?"
    },
    {
      id: "countries_affected",
      question: "Which EU member states are affected?",
      type: "multiselect",
      options: ["Germany", "France", "Italy", "Spain", "Netherlands", "Ireland", "Sweden", "Poland", "Austria", "Belgium", "Other EU"],
      mandatory: true,
      gdprArticle: "Art. 56 — cross-border processing determines lead supervisory authority"
    },
    {
      id: "contained",
      question: "Has the breach been contained, or is it still ongoing?",
      type: "boolean",
      options: ["Yes, contained", "No, still ongoing"],
      mandatory: true,
      gdprArticle: "Art. 33(3)(d) — measures taken must be reported"
    },
    {
      id: "sector",
      question: "What sector does your organization operate in?",
      type: "select",
      options: ["Healthcare", "Energy", "Banking/Finance", "Digital Infrastructure", "Transport", "Public Administration", "Other"],
      mandatory: false,
      gdprArticle: "NIS2 Art. 23 — sector determines if NIS2 track applies"
    },
    {
      id: "additional_info",
      question: "Is there anything else you think we should know?",
      type: "freetext",
      mandatory: false,
      allowSkip: true
    },
    {
      id: "nis2_employees",
      question: "How many employees does your organization have?",
      type: "select",
      options: ["Fewer than 50", "50–249", "250 or more"],
      mandatory: false,
      condition: "only ask if sector is NIS2-relevant (healthcare, energy, transport, banking, digital infrastructure)",
      gdprArticle: "NIS2 Art. 3 — size threshold determines Essential vs Important entity classification"
    },
    {
      id: "nis2_turnover",
      question: "What is your organization's approximate annual turnover?",
      type: "select",
      options: ["Under €10M", "€10M–€50M", "Over €50M"],
      mandatory: false,
      condition: "only ask if sector is NIS2-relevant",
      gdprArticle: "NIS2 Art. 3 — size threshold for entity classification"
    },
    {
      id: "nis2_bsi_registered",
      question: "Has your organization registered with BSI under NIS2? (Germany only)",
      type: "boolean",
      options: ["Yes", "No", "Not applicable"],
      mandatory: false,
      condition: "only ask if Germany selected as affected country",
      gdprArticle: "§ 32 BSIG-neu — BSI registration required since 6 March 2026"
    }
  ],
  indicatorCriteria: {
    gdpr33: [
      { id: "personal_data_involved", label: "Personal data involved", article: "Art. 4(1)" },
      { id: "special_category", label: "Special category data (Art. 9) present", article: "Art. 9(1)" },
      { id: "affected_count_significant", label: "Significant number of individuals affected", article: "Art. 33(3)(c)" },
      { id: "encryption_absent", label: "Data not encrypted or rendered unintelligible", article: "Art. 32(1)(a)" },
      { id: "cross_border", label: "Cross-border EU exposure", article: "Art. 56" }
    ],
    gdpr34: [
      { id: "high_risk_to_individuals", label: "High risk to rights and freedoms of individuals", article: "Art. 34(1)" },
      { id: "identity_theft_risk", label: "Identity theft or fraud enablers present", article: "EDPB Guidelines 9/2022" },
      { id: "financial_loss_risk", label: "Financial loss risk to affected individuals", article: "EDPB Guidelines 9/2022" },
      { id: "discrimination_risk", label: "Risk of discrimination or reputational harm", article: "EDPB Guidelines 9/2022" },
      { id: "exemption_34_3", label: "Art. 34(3) exemption indicators present (encryption, mitigation)", article: "Art. 34(3)" }
    ],
    nis2: [
      { id: "nis2_sector", label: "Organization operates in NIS2 essential/important sector", article: "NIS2 Art. 3" },
      { id: "nis2_size", label: "Organization meets NIS2 size threshold", article: "NIS2 Art. 3" },
      { id: "nis2_significant", label: "Significant incident indicators present", article: "NIS2 Art. 23" },
      { id: "nis2_24h", label: "24-hour early warning window active", article: "NIS2 Art. 23(1)(a)" }
    ]
  },
  supervisoryAuthorities: {
    "Germany": { name: "BfDI", fullName: "Bundesbeauftragte für den Datenschutz und die Informationsfreiheit", url: "https://www.bfdi.bund.de" },
    "France": { name: "CNIL", fullName: "Commission Nationale de l'Informatique et des Libertés", url: "https://www.cnil.fr" },
    "Italy": { name: "Garante", fullName: "Garante per la protezione dei dati personali", url: "https://www.garanteprivacy.it" },
    "Spain": { name: "AEPD", fullName: "Agencia Española de Protección de Datos", url: "https://www.aepd.es" },
    "Netherlands": { name: "AP", fullName: "Autoriteit Persoonsgegevens", url: "https://www.autoriteitpersoonsgegevens.nl" },
    "Ireland": { name: "DPC", fullName: "Data Protection Commission", url: "https://www.dataprotection.ie" },
    "Sweden": { name: "IMY", fullName: "Integritetsskyddsmyndigheten", url: "https://www.imy.se" },
    "Poland": { name: "UODO", fullName: "Urząd Ochrony Danych Osobowych", url: "https://uodo.gov.pl" },
    "Austria": { name: "DSB", fullName: "Datenschutzbehörde", url: "https://www.dsb.gv.at" },
    "Belgium": { name: "APD/GBA", fullName: "Autorité de protection des données", url: "https://www.autoriteprotectiondonnees.be" }
  },
  legalDisclaimer: "Legal classification is reserved for Legal Counsel. This tool gathers facts and presents indicators only — it does not provide legal advice or determine notification obligations.",
  escalationTriggers: [
    "Special category data (Art. 9) involved",
    "Children's data involved (Art. 8)",
    "More than 10,000 individuals affected",
    "Cross-border enforcement scenario",
    "NIS2 sector match",
    "Ongoing breach — not yet contained"
  ]
};
