# How to Add New Scenarios & Alerts

The SOC Training App is designed to be easily extensible. All data is loaded from the `scenarios` and `data` folders in the project root (the parent folder of `soc-app`).

## 1. Define the Scenario (YAML)
Create a new YAML file in `scenarios/light/` (or `scenarios/deep/`).
Filename format: `SCN-[ID].yaml`.

**Example:**
```yaml
scenario:
  id: SCN-101
  name: Suspicious Login Attempt
  difficulty: beginner
  estimated_time_minutes: 15
alert:
  id: ALT-101
  title: Brute Force Attempt
  severity: medium
  # ... metadata
playbook:
  steps:
    - Verify source IP reputation
    - Check user login history
events_ref:
  events_file_jsonl: data/SCN-101.events.jsonl
```

## 2. Add Event Data (JSONL)
Create a JSONL file in the `data/` folder.
Filename must match the `events_file_jsonl` reference in your YAML.

Each line in the file is a JSON object representing a log.
**Required Fields:**
- `@timestamp`: ISO8601 string
- `event.dataset`: One of `network`, `endpoint`, `email`, `terminal`
- `event.action`: e.g., `process_start`, `flow`, `dns`
- `event.original`: (Optional) Raw log string for display

## 3. Test It
1. Run the app:
   ```bash
   cd soc-app
   npm run dev
   ```
2. Refresh the browser. Your new scenario should appear in the Incident Queue.
