# BreachFlow — AI-Supported EU Data Breach Response Assistant
### Munich Hacking Legal 2026 — ELTEMATE Challenge

---

## Overview

BreachFlow is a web-based AI-supported EU data breach response platform built for the 
Munich Hacking Legal 2026 hackathon, responding to the ELTEMATE challenge.

The platform supports organizations during the critical first hours of a data breach by 
gathering information exhaustively, structuring it, and orchestrating three parallel 
response streams: legal, technical, and litigation. Legal classification is always 
performed by the customer's Legal Counsel — never by the system itself.

> "In the time it takes a person to read the initial report, Sentinel has already gathered 
> facts from multiple sources, computed all the indicators, and drafted the relevant 
> notifications. Legal Counsel arrives at the workspace with a complete case file — and 
> reaches a defensible classification in minutes, not hours."

---

## The Problem

Across the EU, organizations struggle to handle data breaches efficiently and consistently. 
The moment an incident is discovered, information is often incomplete, scattered across 
teams, or locked in emails and spreadsheets. Legal Counsel, Data Protection Officers (DPOs), 
and InfoSec teams frequently operate in silos, making it difficult to:

- Gather reliable incident details during early discovery
- Determine whether an incident is notifiable under GDPR, NIS2, or local supervisory authority rules
- Meet strict notification deadlines such as the GDPR 72-hour requirement
- Coordinate technical, legal, and communication responses
- Maintain clear documentation and an auditable timeline

---

## Solution

BreachFlow guides organizations from breach discovery to regulatory notification through 
five core capabilities:

1. **Structured Incident Intake** — ARIA guides employees through a structured 10-question 
   intake flow covering discovery timing, data types, affected count, containment status, 
   and actions already taken.

2. **Indicator Engine** — Maps gathered facts against statutory criteria (GDPR Art. 33/34, 
   NIS2 Art. 23) and produces a scoreboard. Descriptive, never prescriptive. Never says 
   "you must notify" — always says "4 of 5 criteria matched in available facts."

3. **Role-Specific Dashboards** — Five dedicated dashboards for Employee, DPO, Legal 
   Counsel, InfoSec, and Executive Management — each tuned for its role.

4. **Multi-Deadline Countdown** — Tracks GDPR 72h, NIS2 24h early warning, NIS2 72h 
   notification, NIS2 1-month final report, insurance, and DPA deadlines in parallel.

5. **AI-Drafted Communications** — Pre-fills notification templates for supervisory 
   authorities, affected individuals, internal teams, insurers, and third parties — 
   released only after Legal Counsel review and Executive Management approval.

---

## Regulatory Boundary

BreachFlow is deliberately designed to fall outside the German Legal Services Act (RDG) 
and equivalent EU regimes:

| Activity | System | Legal Counsel |
|---|---|---|
| Fact gathering | ✅ Yes | — |
| Indicator check vs. statutory criteria | ✅ Yes | — |
| Norm referencing & authority routing facts | ✅ Yes | — |
| Notifiability classification | ❌ Never | ✅ Always |
| Exemption assessment | ❌ Never | ✅ Always |
| Draft generation | ✅ Yes | Reviews & releases |
| Submission to authorities | ✅ Technical | ✅ Releases |

Every screen touching a legal threshold carries a visible reminder:
**"Legal classification reserved for Legal Counsel."**

---

## Three Parallel Streams

From the moment an incident is reported, three streams run concurrently:

| Stream | Goal | Lead Role |
|---|---|---|
| 🔴 Legal | Notification obligations and authority filings | Legal Counsel |
| 🔵 Technical | Evidence preservation, containment, recovery | InfoSec / IR Team |
| 🟣 Litigation | Legal hold, privilege, evidence for court proceedings | Legal Counsel + External Counsel |

---

## Five Role-Specific Dashboards

### 1. Employee Portal (`/employee`)
- Guided 10-question intake flow with ARIA
- Anonymous or authenticated reporting
- Live incident summary card updating in real-time
- Risk indicator (LOW / MEDIUM / HIGH) updating as answers provided
- Thank you screen with reference ID on submission

### 2. DPO Dashboard (`/dpo`)
- Severity speedometer gauge showing monthly incident distribution
- Incident list sorted high → low priority
- Per-incident: full summary, indicator scoreboard, multi-deadline countdown, process engine
- 10-process response engine (P0 Critical → P4 Follow-up) across three streams
- Hand-off control: "Mark case file ready for Legal Counsel review"

### 3. Legal Counsel Workspace (`/legal`)
- Tabs: Overview | Indicators | Knowledge | Drafts | Response Workflow | ARIA Reports
- Active deadline strip at top
- Legal classification form with versioned decisions and rationale
- Interactive node graph of complete response workflow — clickable nodes with details
- Knowledge panel: GDPR Art. 33/34, NIS2 Art. 23, EDPB Guidelines 9/2022
- Draft review with inline editing, redaction, and legal release

### 4. InfoSec Dashboard (`/infosec`)
- Technical stream view: forensic snapshot status, containment actions, evidence vault
- Hard gate indicator: "Forensic snapshot complete — containment authorized"
- IR team coordination and insurance interlock

### 5. Executive Management Dashboard (`/em`)
- One-page situation briefing card
- Business approval queue for all external actions
- Cross-stream traffic light: Legal / Technical / Litigation
- Decision log with hash signatures

---

## 10-Process Response Engine

| Code | Level | Time | Process | Stream |
|---|---|---|---|---|
| P3 | P0 Critical | 0-1h | Engage External IR Team | Technical |
| P6 | P0 Critical | 0-1h | Inform Management | Legal |
| P4 | P0 Critical | 0-1h | Preserve Data — Forensics | Technical |
| P5 | P1 High | 1-6h | Close the Data Leak | Technical |
| P2 | P1 High | 1-6h | Notify Insurance | Litigation |
| P10 | P1 High | 1-6h | Prepare for Litigation | Litigation |
| P9 | P2 Medium | 6-24h | Notify Third Parties | Legal |
| P1 | P3 Regular | 24-72h | Notify Authorities | Legal |
| P7 | P3 Regular | 24-72h | Find Origin of Leak | Technical |
| P8 | P4 Follow-up | 72h+ | Notify Affected Individuals | Legal |

Hard gate: P5 containment may only begin after P4 forensic snapshot is complete.

---

## Multi-Deadline Countdown

| Deadline | Trigger | Time | Source |
|---|---|---|---|
| GDPR Art. 33 | Becoming aware | 72h | GDPR Art. 33(1) |
| NIS2 Early Warning | Significant incident | 24h | NIS2 Art. 23 |
| NIS2 Incident Notification | Becoming aware | 72h | NIS2 Art. 23 |
| NIS2 Final Report | Becoming aware | 1 month | NIS2 Art. 23 |
| Cyber Insurance | Becoming aware | 24-48h | Policy-specific |
| DPA Notification | Processor detects | Contract-specific | Art. 28(3)(f) |

---

## Knowledge Sources

BreachFlow's legal intelligence is grounded in three sources:

1. **Otto Schmidt Legal Data Hub (LDA)** — Live API integration for GDPR and EU legal 
   content. Used for indicator reasoning, notifiability assessment context, and draft 
   template enrichment. Queries in German for best results.

2. **NIS2 Navigator by Oliver Schmidt-Prietz (Lawvable)** — Hardcoded NIS2 knowledge 
   base covering scope classification (Annex I/II), Art. 21 gap analysis across 10 
   risk management measures, German BSIG-neu specifics (BSI registration, § 30/32/38), 
   and jurisdiction profiles for Germany, France, Italy, Netherlands, Austria, Spain.

3. **GDPR Compliance Skill** — Structured GDPR expertise covering all four workflows: 
   code/system audit, document drafting, compliance Q&A, and data flow review. Feeds 
   ARIA's question logic and boundaries.

---

## EU Supervisory Authorities Directory

| Country | Authority | Full Name |
|---|---|---|
| Germany | BfDI | Bundesbeauftragte für den Datenschutz |
| France | CNIL | Commission Nationale de l'Informatique et des Libertés |
| Italy | Garante | Garante per la protezione dei dati personali |
| Spain | AEPD | Agencia Española de Protección de Datos |
| Netherlands | AP | Autoriteit Persoonsgegevens |
| Ireland | DPC | Data Protection Commission |
| Sweden | IMY | Integritetsskyddsmyndigheten |
| Poland | UODO | Urząd Ochrony Danych Osobowych |
| Austria | DSB | Datenschutzbehörde |
| Belgium | APD/GBA | Autorité de protection des données |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Tailwind CSS |
| Routing | React Router |
| Fonts | Lora (headings) + Poppins Light (body) |
| AI Agent | Gemini 1.5 Flash via Supabase Edge Function proxy |
| Legal API | Otto Schmidt Legal Data Hub (Bearer token auth) |
| Auth | Firebase Authentication (placeholder — Supabase for now) |
| Database | Firestore / Supabase (planned) |
| Hosting | Lovable (development) |
| State | React useState + localStorage |
| Audit | Hash-chained event log |

---

## Design Philosophy

BreachFlow is designed to feel like a tool a law firm would trust — not a startup toy.

- **Luxury minimal** — warm white `#FAFAF7`, Lora serif headings, Poppins Light body
- **Purple identity** — `#9A91FC` accent throughout, animated 3D morphing blob on landing
- **No advisory voice** — indicator-style language only: "criteria matched", "available facts"
- **Two-signature gates** — every external action requires Legal Counsel release + EM approval
- **Privilege-aware** — items tagged privileged visible only to Legal Counsel and external counsel
- **Audit by construction** — every interaction logged with hash chain

---

## Sentinel AI Specification

The AI agent powering BreachFlow is named **Sentinel**:

**Identity:** Always-on response analyst. Calm under time pressure, methodical, exhaustive 
about facts, deferential to humans on judgment calls.

**12 Operating Rules:**
1. Information abundance over information curation
2. Provenance for every claim
3. Confidence bands, not false precision (verified / extracted / estimated / open)
4. Open questions are first-class citizens
5. Patient iteration — never give up on a fact silently
6. Indicator-style language only
7. Hand off, do not decide
8. Parallelize aggressively, sequence only where necessary
9. Re-assess on new facts; never overwrite silently
10. Privilege awareness end-to-end
11. Document the reasoning, not just the result
12. Stop when uncertain in a way that matters

**Hard boundaries:**
- Never performs legal classification
- Never selects competent authority
- Never assesses exemptions
- Never invents facts
- Never collapses borderline cases into confident verdicts

---

## Project Structure

src/
├── pages/
│   ├── Landing.jsx          # Landing page with animated 3D blob
│   ├── Auth.jsx             # Sign in / anonymous flow
│   ├── Employee.jsx         # ARIA intake portal
│   ├── DPO.jsx              # DPO operational dashboard
│   ├── Legal.jsx            # Legal Counsel workspace
│   ├── InfoSec.jsx          # Technical stream dashboard
│   └── Executive.jsx        # EM approval dashboard
├── components/
│   ├── ARIAChat.jsx         # 10-question guided intake
│   ├── IndicatorScoreboard  # GDPR/NIS2 criteria display
│   ├── DeadlinePanel        # Multi-deadline countdown
│   ├── ProcessEngine        # 10-process kanban
│   ├── WorkflowGraph        # Interactive node diagram
│   └── DraftPanel           # AI draft review + release
├── data/
│   ├── ariaSkillDocument.js # ARIA question guidelines
│   ├── legalKnowledge.js    # GDPR knowledge base
│   └── nis2Knowledge.js     # NIS2 Navigator knowledge base
├── services/
│   ├── legalDataHub.js      # Otto Schmidt API integration
│   ├── sentinelAgent.js     # AI agent logic
│   └── auth.js              # Firebase auth placeholder
supabase/
└── functions/
└── ai-proxy/
└── index.ts         # Gemini API proxy edge function

---

## Setup

```bash
# Clone repository
git clone https://github.com/Siddesh-coder/BreachFlow_Illegal_Partners.git

# Install dependencies
npm install

# Run locally
npm run dev
```

On first load, enter your API keys in the setup modal:
- **Gemini API Key** — from aistudio.google.com
- **Otto Schmidt API Token** — from Legal Data Hub

---

## Scope

**V1 (Hackathon Demo):**
- EU scope: GDPR + NIS2 + German BSIG-neu
- DE authority structure as initial buildout
- One demo tenant

**Out of Scope V1:**
- US state breach notification laws
- UK GDPR / DPA 2018
- Switzerland revFADP
- SEC Cybersecurity Disclosure Rules
- Direct SIEM integration
- Firebase auth (placeholder only)

**V2 Roadmap:**
- Multi-jurisdiction (UK, CH, US states)
- SIEM/EDR connectors
- Tabletop exercise mode
- Insurer API integrations
- Law firm partner mode

---

## Legal Disclaimer

This platform is a hackathon prototype and does not constitute legal advice. Prior to 
productive use, review by specialized data-protection counsel is mandatory — in particular 
regarding the regulatory boundary set by the German Legal Services Act (RDG), the wording 
of indicator outputs, and the current status of the German NIS2 transposition act.

---

## Team

Built in 24 hours at **Munich Hacking Legal 2026** — ELTEMATE Challenge.

---

## License

MIT License — see LICENSE file for details
