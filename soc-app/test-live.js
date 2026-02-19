
const http = require('http');

// Configuration
const API_URL = 'http://localhost:3000/api/ingest';
const INTERVAL_MS = 1500; // Send an event every 1.5 seconds

// Mock Data Templates
const HOSTS = ['WKSTN-01', 'WKSTN-02', 'SRV-DB-01', 'SRV-WEB-01', 'HR-LAPTOP-04'];
const USERS = ['jdoe', 'asmith', 'mturner', 'admin', 'service_acct'];
const ACTIONS = ['login_success', 'login_failed', 'process_start', 'file_access', 'network_connection'];

function getRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateEvent() {
    const action = getRandom(ACTIONS);
    const host = getRandom(HOSTS);
    const user = getRandom(USERS);

    let original = '';
    let category = [];

    if (action.includes('login')) {
        original = `Authentication ${action.split('_')[1]} for user ${user} on ${host}`;
        category = ['authentication'];
    } else if (action === 'process_start') {
        const proc = getRandom(['powershell.exe', 'cmd.exe', 'chrome.exe', 'svchost.exe']);
        original = `Process started: ${proc} (PID: ${Math.floor(Math.random() * 9000)})`;
        category = ['process'];
    } else {
        original = `Outbound connection to 192.168.1.${Math.floor(Math.random() * 255)}:443`;
        category = ['network'];
    }

    return {
        "@timestamp": new Date().toISOString(),
        "event": {
            "dataset": "mock_generator",
            "action": action,
            "kind": "event",
            "category": category,
            "original": original
        },
        "host": { "name": host },
        "user": { "name": user },
        "source": { "ip": `10.0.0.${Math.floor(Math.random() * 255)}` }
    };
}

function sendEvent(event) {
    const data = JSON.stringify(event);
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/ingest',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };

    const req = http.request(options, (res) => {
        if (res.statusCode === 200) {
            console.log(`[SENT] ${event.event.action} -> ${event.host.name}`);
        } else {
            console.error(`[ERROR] Status: ${res.statusCode}`);
        }
    });

    req.on('error', (error) => {
        console.error(`[FAIL] ensure the Next.js app is running on localhost:3000`);
    });

    req.write(data);
    req.end();
}

console.log('--- SOC LIVE TEST GENERATOR ---');
console.log('Generating dummy events... Press Ctrl+C to stop.');

setInterval(() => {
    sendEvent(generateEvent());
}, INTERVAL_MS);
