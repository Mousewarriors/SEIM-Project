# Adding New Scenarios

This is how scenarios work in the SOC Training SIEM app. Follow these steps to add a new scenario.

## Folder Structure

```
├── scenarios/
│   ├── _TEMPLATE.yaml          ← Copy this to start a new scenario
│   ├── deep/                   ← Complex scenarios with rich telemetry (30-60 min)
│   │   ├── SCN-001.yaml
│   │   └── ...
│   └── light/                  ← Quick triage scenarios (5-15 min)
│       ├── SCN-101.yaml
│       └── ...
├── data/
│   ├── SCN-001.events.jsonl    ← Event logs for each scenario
│   ├── SCN-001.events.csv      ← (optional) CSV version
│   └── ...
```

## How to Add a New Scenario

### Step 1: Create the YAML file

1. Copy `scenarios/_TEMPLATE.yaml`
2. Rename it to your scenario ID (e.g., `SCN-201.yaml`)
3. Place it in `scenarios/deep/` or `scenarios/light/`
4. Fill in all the fields — especially the `answer` section which grades the analyst

### Step 2: Create the Event Log File

Create a JSONL file (one JSON object per line) in the `data/` folder:

**Filename:** `data/SCN-201.events.jsonl`

Each line should be a JSON object following this schema:

```json
{
  "@timestamp": "2024-12-01T09:00:00Z",
  "event": {
    "dataset": "network",
    "action": "connection",
    "kind": "event",
    "category": ["network"],
    "original": "Human-readable description of this event"
  },
  "host": { "name": "WKSTN-001", "ip": ["10.10.1.5"] },
  "user": { "name": "jsmith", "email": "jsmith@example.com" },
  "source": { "ip": "10.10.1.5", "port": 54321 },
  "destination": { "ip": "1.2.3.4", "port": 443 },
  "network": { "transport": "tcp", "bytes": 1024 }
}
```

### Supported Event Datasets

The SIEM UI recognizes these `event.dataset` values and gives them distinct colors/icons:

| Dataset     | Color  | Description |
|-------------|--------|-------------|
| `network`   | Blue   | Network flows, DNS, proxy, firewall logs |
| `endpoint`  | Green  | Process execution, file changes, registry |
| `email`     | Purple | Email delivery, phishing indicators |
| `terminal`  | Amber  | Command-line / shell activity |

### Step 3: Done!

That's it. The app automatically:
- ✅ Loads your new scenario YAML from the `scenarios/` folder
- ✅ Shows it on the dashboard as a new alert
- ✅ Loads its events when you investigate it
- ✅ Includes its events in the global Logs page
- ✅ Grades the analyst using your `answer` section

No build step, no database, no merging files. Just drop and go.

## Answer Section Reference

The `answer` section in your YAML is what the analyst is graded against:

```yaml
answer:
  verdict: true_positive          # true_positive | false_positive | benign
  severity: medium                # low | medium | high | critical  
  summary: >                     # Detailed explanation of the correct analysis
    This scenario represents a...
  key_findings:                   # List of things the analyst should discover
  - Finding 1
  - Finding 2
  recommended_action: escalate    # close | escalate | monitor
```

### Verdict Types

| Verdict | When to Use |
|---------|-------------|
| `true_positive` | The alert represents a genuine security incident |
| `false_positive` | The alert fired but the activity is not malicious |
| `benign` | The activity is expected/authorized behavior |

### Recommended Actions

| Action | When to Use |
|--------|-------------|
| `close` | No further action needed (FP, benign, or contained) |
| `escalate` | Requires IR team involvement, containment |
| `monitor` | Suspicious but not confirmed — keep watching |

## Tips for Good Scenarios

1. **Mix true and false positives** — don't make every alert a real incident
2. **Include enough events** — at least 2-3 events so there's something to investigate
3. **Write clear summaries** — the answer explanation is a learning tool
4. **Use realistic timestamps** — events should be chronologically coherent
5. **Set appropriate difficulty** — match the complexity of the telemetry to the difficulty level
