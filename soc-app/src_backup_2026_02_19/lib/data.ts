
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

export interface Alert {
    id: string;
    title: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    category: string;
    status: string;
    created_at: string;
    host?: string;
    user?: string;
    description: string;
}

export interface ScenarioAnswer {
    verdict: 'true_positive' | 'false_positive' | 'benign';
    severity: 'low' | 'medium' | 'high' | 'critical';
    summary: string;
    key_findings: string[];
    recommended_action: 'close' | 'escalate' | 'monitor';
    containment_required?: boolean;
}

export interface Scenario {
    scenario: {
        id: string;
        name: string;
        difficulty: string;
        estimated_time_minutes: number;
        deep_scenario?: boolean;
    };
    alert: Alert;
    iocs: {
        ips?: string[];
        domains?: string[];
        urls?: string[];
        hashes?: string[];
    };
    playbook: {
        name: string;
        steps: string[];
    };
    answer?: ScenarioAnswer;
    scoring: any;
    events_ref: {
        events_file_jsonl: string;
        events_file_csv: string;
    };
}

export interface EventLog {
    '@timestamp': string;
    event: {
        dataset: string;
        action: string;
        kind?: string;
        category?: string[];
        original?: string;
    };
    organization?: { name: string };
    host?: { name: string; ip?: string[] };
    user?: { name: string; email?: string | null };
    source?: { ip?: string; port?: number };
    destination?: { ip?: string; port?: number };
    network?: { protocol?: string; transport?: string; bytes?: number; bytes_in?: number; bytes_out?: number };
    http?: { request?: { method?: string }; response?: { status_code?: number } };
    url?: { full?: string };
    dns?: { question?: { name?: string }; answers?: { data?: string; ttl?: number }[] };
    process?: { name?: string; pid?: number; command_line?: string; parent?: { name?: string; pid?: number } };
    file?: { path?: string; hash?: { sha256?: string } };
    email?: { subject?: string; from?: { address?: string }; to?: { address?: string }[] };
    terminal?: { command?: string; output?: string };
    [key: string]: any;
}


// Paths relative to soc-app/
// Prioritize external data folder (so user can edit files in root without rebuilding app)
let SCENARIOS_DIR = path.join(process.cwd(), 'scenarios');
let DATA_DIR = path.join(process.cwd(), 'data');

// Check if we are in a nested app folder and data is in parent
const parentScenarios = path.join(process.cwd(), '..', 'scenarios');
const parentData = path.join(process.cwd(), '..', 'data');

if (fs.existsSync(parentScenarios) && fs.existsSync(parentData)) {
    SCENARIOS_DIR = parentScenarios;
    DATA_DIR = parentData;
}

export async function getScenarios(): Promise<Scenario[]> {
    const deepDir = path.join(SCENARIOS_DIR, 'deep');
    const lightDir = path.join(SCENARIOS_DIR, 'light');

    const scenarios: Scenario[] = [];

    const loadFromDir = (dir: string) => {
        if (!fs.existsSync(dir)) return;
        const files = fs.readdirSync(dir).filter(f => f.endsWith('.yaml'));
        for (const file of files) {
            const content = fs.readFileSync(path.join(dir, file), 'utf8');
            try {
                const data = yaml.load(content) as Scenario;
                // Ensure ID is set
                if (!data.scenario.id) {
                    data.scenario.id = file.replace('.yaml', '');
                }
                scenarios.push(data);
            } catch (e) {
                console.error(`Error loading scenario ${file}:`, e);
            }
        }
    };

    loadFromDir(deepDir);
    loadFromDir(lightDir);

    return scenarios.sort((a, b) => new Date(b.alert.created_at).getTime() - new Date(a.alert.created_at).getTime());
}

export async function getScenarioById(id: string): Promise<Scenario | null> {
    const scenarios = await getScenarios();
    return scenarios.find(s => s.scenario.id === id) || null;
}

export async function getEventsForScenario(scenarioId: string): Promise<EventLog[]> {
    const scenario = await getScenarioById(scenarioId);
    if (!scenario) return [];

    // Determine the file path
    // The YAML says "data/SCN-001.events.jsonl", which is relative to the root?
    // We copied data to soc-app/data.
    // So referencing logic: yaml path "data/..." needs to be remapped to DATA_DIR/filename

    const jsonlPathRel = scenario.events_ref.events_file_jsonl;
    const filename = path.basename(jsonlPathRel);
    const fullPath = path.join(DATA_DIR, filename);

    if (!fs.existsSync(fullPath)) {
        console.warn(`Events file not found: ${fullPath}`);
        return [];
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim() !== '');

    const events: EventLog[] = lines.map(line => {
        try {
            return JSON.parse(line);
        } catch (e) {
            return null;
        }
    }).filter(e => e !== null) as EventLog[];

    // Sort by timestamp
    return events.sort((a, b) => new Date(a['@timestamp']).getTime() - new Date(b['@timestamp']).getTime());
}

export async function getAllEvents(): Promise<EventLog[]> {
    // Dynamically aggregate events from ALL individual scenario JSONL files
    // Exclude live.events.jsonl to keep training data pure
    const individualFiles = fs.readdirSync(DATA_DIR)
        .filter(f => f.match(/^SCN-\d+\.events\.jsonl$/));

    if (individualFiles.length > 0) {
        const allEvents: EventLog[] = [];

        for (const file of individualFiles) {
            const fullPath = path.join(DATA_DIR, file);
            try {
                const content = fs.readFileSync(fullPath, 'utf8');
                const lines = content.split('\n').filter(line => line.trim() !== '');
                for (const line of lines) {
                    try {
                        allEvents.push(JSON.parse(line));
                    } catch (e) { /* skip malformed lines */ }
                }
            } catch (e) {
                console.warn(`Error reading ${file}:`, e);
            }
        }

        return allEvents.sort((a, b) => new Date(a['@timestamp']).getTime() - new Date(b['@timestamp']).getTime());
    }

    // Fallback to all.events.jsonl if no individual files found
    const fullPath = path.join(DATA_DIR, 'all.events.jsonl');

    if (!fs.existsSync(fullPath)) {
        return [];
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim() !== '');

    const events: EventLog[] = lines.map(line => {
        try {
            return JSON.parse(line);
        } catch (e) {
            return null;
        }
    }).filter(e => e !== null) as EventLog[];

    return events.sort((a, b) => new Date(a['@timestamp']).getTime() - new Date(b['@timestamp']).getTime());
}

export async function getLiveEvents(): Promise<EventLog[]> {
    const liveFile = path.join(DATA_DIR, 'live.events.jsonl');
    if (!fs.existsSync(liveFile)) return [];

    try {
        const content = fs.readFileSync(liveFile, 'utf8');
        const lines = content.split('\n').filter(line => line.trim() !== '');
        return lines.map(line => {
            try { return JSON.parse(line); } catch (e) { return null; }
        }).filter(e => e !== null) as EventLog[];
    } catch (e) {
        console.error('Error reading live events:', e);
        return [];
    }
}

