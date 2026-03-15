# 🛡️ MouseWarriors SOC — SIEM & SOC Analyst Training Platform

A fully interactive **Security Operations Center (SOC)** training environment built as a Next.js web application. Designed to simulate real-world SOC analyst workflows including alert triage, incident investigation, endpoint forensics, email gateway analysis, and threat intelligence — all powered by realistic synthetic telemetry and an AI-powered investigation assistant.

> **Built by Simon Wood using antigravity** as part of a cybersecurity portfolio project to demonstrate SOC operations, incident response methodology, and full-stack development skills.

---

## 🖥️ Screenshots

| Dashboard — Mission Control | Investigation View |
|---|---|
| Alert triage with sortable priority/date columns, inline expansion for alert details, severity badges, and real-time status tracking. | Event log analysis with dataset filtering, playbook progress tracking, IOC reference, and AI-assisted investigation. |

| Email Gateway | Threat Intelligence |
|---|---|
| Clickable email table with detail panel, filter tabs (All/Allow/Block), and sender/recipient metadata inspection. | IOC lookup with auto-detection (IP/Hash/Domain), VirusTotal integration, sighting timeline, and affected host correlation. |

| Endpoint Security | AI Assistant & Notepad |
|---|---|
| Host inventory with system info, tabbed log viewers (Processes, Network, Terminal, Browser) with proper padding and spacing. | Global AI assistant (Ollama-powered) and investigation notepad that persist across all pages via header toggle switches. |

---

## ✨ Key Features

### 🎯 Mission Control Dashboard
- **Alert Queue** with sortable columns (Priority, Created Date) and visual sort indicators
- **Inline alert expansion** — click any alert to see trigger reason, playbook steps, and command-line arguments directly beneath the row
- **Severity badges** with colour-coded indicators (Critical, High, Medium, Low)
- **One-click investigation** — "Investigate" button launches the full investigation workflow

### 🔍 Investigation Workflow
- **Event Log Viewer** — filterable by dataset (Network, Endpoint, Email, Terminal) with full text search
- **Expandable events** — click any event to view the full raw JSON payload
- **Playbook Progress Tracker** — checklist-style steps with completion percentage bar
- **IOC Reference Panel** — known indicators of compromise (IPs, domains, hashes) displayed as automated evidence.

### 🤖 AI-Powered Investigation Assistant
- **Ollama integration** via API proxy (`/api/ai-chat`) using the `qwen2.5:14b` model
- **Context-aware** — the AI receives incident context (alert title, severity, IOCs, host info) in its system prompt
- **Global persistence** — toggle the AI panel from the header and it follows you across every page
- **Chat history preserved** in localStorage via Zustand state management
- **Loading indicators** with animated dots while waiting for responses
- **Graceful fallback** if Ollama is unavailable

### 📝 Investigation Notepad
- **Global notepad** togglable from the header, persists across all pages
- **Monospaced font** optimised for copying IPs, timestamps, hashes, and MITRE technique IDs
- **Auto-saved** to localStorage — never lose your notes

### ✉️ Email Gateway
- **Professional email table** with sticky headers and proper padding
- **Clickable emails** — opens a detail panel with subject, from/to, timestamps, source/destination IPs, status badge, and raw event JSON
- **Filter tabs** — All, Allowed, Blocked
- **Summary statistics** — total, allowed, and blocked counts at a glance

### 🌐 Threat Intelligence
- **IOC search** with automatic type detection (IP Address, Hash, Domain/URL, Keyword)
- **VirusTotal integration** — one-click lookup button for any IOC
- **Correlation engine** — searches across all event telemetry for IOC sightings
- **Stats dashboard** — Total Sightings, Affected Hosts, First/Last Seen timestamps
- **Sighting Timeline** — chronological event viewer for matched indicators

### 🖥️ Endpoint Security
- **Host inventory grid** with OS, user, and last-seen metadata
- **Tabbed log viewer** — Processes, Network, Terminal, Browser, and Host Info tabs
- **System & User Information panels** with clean field layouts
- **Hover effects** with cyan accent borders

### 📋 Log Hunter
- **Full event search** across all datasets
- **Dataset filtering** with search-within-results
- **Paginated results** with "Load More" functionality

---

## 🏗️ Architecture

```
SIEM SOC Training/
├── soc-app/                    # Next.js 16 application
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx              # Dashboard (Mission Control)
│   │   │   ├── dashboard-client.tsx  # Interactive dashboard with sorting & expansion
│   │   │   ├── investigate/[id]/     # Dynamic investigation pages
│   │   │   ├── email/                # Email Gateway
│   │   │   ├── endpoint/             # Endpoint Security (list + detail)
│   │   │   ├── intel/                # Threat Intelligence
│   │   │   ├── logs/                 # Log Hunter
│   │   │   ├── api/ai-chat/          # Ollama proxy API route
│   │   │   ├── layout.tsx            # Root layout with AppShell
│   │   │   └── globals.css           # Design system & component styles
│   │   ├── components/
│   │   │   ├── Sidebar.tsx           # Navigation sidebar
│   │   │   ├── Header.tsx            # Header with AI/Notepad toggle switches
│   │   │   ├── AppShell.tsx          # Client wrapper for global panel
│   │   │   ├── GlobalPanel.tsx       # AI Assistant + Notepad (global)
│   │   │   └── LogViewer.tsx         # Reusable log event viewer
│   │   └── lib/
│   │       ├── data.ts               # Data layer (scenario + event loading)
│   │       ├── hosts.ts              # Host/endpoint data
│   │       └── store.ts              # Zustand state (alerts, AI chat, notepad)
│   └── package.json
├── scenarios/
│   ├── deep/                   # 35 deep investigation scenarios (SCN-001..SCN-025 + ASN-401..ASN-410)
│   └── light/                  # 25 light triage scenarios (SCN-101..125)
├── data/
│   ├── *.events.jsonl          # Per-scenario event telemetry (ECS-like JSON)
│   ├── *.events.csv            # Flattened CSV exports
│   ├── all.events.jsonl        # Combined dataset
│   └── ioc_library_seed.csv    # Offline IOC reference
├── opensearch/
│   ├── index-mapping.json      # OpenSearch/Elasticsearch index mapping
│   └── bulk.ndjson             # Bulk import for OpenSearch
└── scripts/
    ├── scoring_engine_reference.py  # Reference scoring logic
    └── ioc_fetcher.py               # Real IOC fetcher (URLhaus, MalwareBazaar)
```

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| **Next.js 16** | React framework with App Router, server components, dynamic routes |
| **React 19** | UI component library |
| **TypeScript** | Type safety across the entire codebase |
| **Zustand** | Lightweight state management with localStorage persistence |
| **Ollama** | Local LLM inference for the AI investigation assistant |
| **Lucide React** | Consistent icon set throughout the UI |
| **date-fns** | Date formatting and relative time calculations |
| **Recharts** | Dashboard chart visualisations |
| **CSS Custom Properties** | Design system with dark theme variables |

---

## 📊 Scenario Content

### Deep Scenarios (35)
Full investigation scenarios with rich telemetry, multiple event types, and comprehensive playbooks. Each includes 50–200+ correlated events across network, endpoint, email, and terminal datasets.
- **Hybrid deep scenarios (25)** — SCN-001 through SCN-025 cover the on-premises/hybrid use cases.
- **Cloud-native deep scenarios (10)** — ASN-401 through ASN-410 focus on modern cloud tooling.

### Light Scenarios (25)
Quick triage scenarios for practising alert assessment, priority classification, and basic IOC extraction. Each includes 10–50 events focused on a single attack vector.

### Event Telemetry Format
All events follow an ECS-like (Elastic Common Schema) JSON structure:
```json
{
  "@timestamp": "2025-03-15T14:32:01.000Z",
  "event": { "dataset": "endpoint", "action": "process_started" },
  "host": { "name": "WKS-PC01", "ip": ["10.10.0.45"] },
  "process": { "name": "powershell.exe", "command_line": "powershell -enc ..." },
  "user": { "name": "jdoe" }
}
```

---

## 🎨 Design System

The application uses a custom dark-theme design system built with CSS custom properties:

- **Backgrounds**: `--bg-primary` (darkest) → `--bg-secondary` → `--bg-tertiary` → `--bg-elevated`
- **Text**: `--text-primary` → `--text-secondary` → `--text-muted` → `--text-accent`
- **Accents**: `--cyan` (primary actions), `--amber` (warnings), `--red` (critical), `--green` (success)
- **Mono font**: JetBrains Mono / system monospace for log data, IOCs, and timestamps
- **Typography**: Inter font family loaded via Google Fonts

---

## 📈 Skills Demonstrated

This project demonstrates proficiency in:

- **SOC Operations**: Alert triage, incident investigation workflows, IOC analysis, MITRE ATT&CK mapping
- **Security Tooling**: SIEM concepts, log analysis, endpoint forensics, email security, threat intelligence
- **Full-Stack Development**: Next.js, React, TypeScript, API routes, state management
- **AI/ML Integration**: LLM-powered investigation assistant with context-aware prompting
- **UI/UX Design**: Professional dark-theme design system, responsive layouts, micro-animations
- **Data Engineering**: ECS-compliant telemetry generation, OpenSearch integration, bulk data pipelines

---

## 📝 Important Notes

- This project contains **no malware binaries** — only indicators and simulated telemetry
- IOC data includes references to real threat intelligence feeds (URLhaus, MalwareBazaar) for realism
- The AI assistant requires a locally running Ollama instance and is entirely offline/private
- All state is stored client-side in localStorage — no external databases or authentication required

---

## 📄 Licence

This project is part of a cybersecurity portfolio. Feel free to use it as inspiration for your own SOC training environments.

---

## 🔒 Security Hardening

This project has been hardened with the following security measures:

1.  **Environment Variables**: Sensitive configuration (Ollama URL, model) is loaded from `.env.local` instead of being hardcoded.
2.  **Input Validation**: Strict type checking and sanitization on all API inputs (AI Chat).
3.  **Security Headers**: Implementation of HTTP security headers including:
    -   `X-DNS-Prefetch-Control`
    -   `Strict-Transport-Security` (HSTS)
    -   `X-Frame-Options` (Clickjacking protection)
    -   `X-Content-Type-Options` (MIME sniffing protection)
    -   `Referrer-Policy`
    -   `Permissions-Policy`
4.  **"Powered By" Disclosure**: Disabled `X-Powered-By: Next.js` header to reduce information leakage.
5.  **Secure Dependencies**: Regular dependency updates recommended.
6.  **Ingest Hardening**: `/api/ingest` now enforces `INGEST_API_KEY`, schema validation, payload size/event count limits, and defensive rotation of `live.events.jsonl`.
7.  **MITRE Forwarding**: The ATT&CK analyzer proxy now delegates to `MITRE_ANALYZER_URL`, keeping the local Python service configurable per environment.

### Configuration
Create a `.env.local` file in the root directory:

```env
OLLAMA_API_URL=http://localhost:11434/api/chat
OLLAMA_MODEL=qwen2.5:14b
MITRE_ANALYZER_URL=http://localhost:8888/query
INGEST_API_KEY=local-ingest-key
```

`/api/ingest` now expects `x-api-key: <INGEST_API_KEY>` (or
`Authorization: Bearer <INGEST_API_KEY>`) and the MITRE forwarder delegates to
`MITRE_ANALYZER_URL`.

---

*Built with ☕ and 🛡️ by Simon Wood*
