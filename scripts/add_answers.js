/**
 * add_answers.js
 * 
 * Adds answer sections to all light scenario YAML files.
 * Run: node scripts/add_answers.js
 */

const fs = require('fs');
const path = require('path');

// Scenario answer definitions keyed by scenario ID
const answers = {
    'SCN-101': {
        verdict: 'false_positive',
        severity: 'low',
        summary: 'The firewall correctly blocked an outbound connection to a known malicious IP. No data was exfiltrated and no compromise occurred. The block rule functioned as intended. Close as benign — the control worked.',
        key_findings: [
            'Connection was blocked by firewall — no data left the network',
            'Destination IP is on threat intel blocklist',
            'No follow-up suspicious activity from the host',
        ],
        recommended_action: 'close',
    },
    'SCN-102': {
        verdict: 'true_positive',
        severity: 'high',
        summary: 'Multiple failed MFA attempts followed by a successful login suggests MFA fatigue/push bombing attack. The user may have eventually approved a fraudulent push notification. Investigate the login session and verify with the user.',
        key_findings: [
            'Multiple rapid MFA failures followed by sudden success',
            'Pattern consistent with MFA fatigue / push bombing',
            'Need to verify with user whether they approved the MFA prompt',
        ],
        recommended_action: 'escalate',
    },
    'SCN-103': {
        verdict: 'false_positive',
        severity: 'low',
        summary: 'DNS query to a newly registered domain was for a legitimate new SaaS tool being onboarded by IT. The domain registration date triggered the alert but the activity is authorized.',
        key_findings: [
            'Domain is newly registered, triggering the detection rule',
            'Domain belongs to a legitimate SaaS vendor',
            'IT team confirmed the tool onboarding',
        ],
        recommended_action: 'close',
    },
    'SCN-104': {
        verdict: 'true_positive',
        severity: 'medium',
        summary: 'A user account logged in from two geographically impossible locations within a short time window. This indicates credential compromise — the legitimate user logged in from one location while an attacker used stolen credentials from another.',
        key_findings: [
            'Login from two distant locations within impossible travel time',
            'Second login originated from a suspicious VPN/proxy IP',
            'Account credentials are likely compromised',
        ],
        recommended_action: 'escalate',
    },
    'SCN-105': {
        verdict: 'false_positive',
        severity: 'low',
        summary: 'Scheduled task creation was part of an authorized IT maintenance script. The task was created by a known admin account during a scheduled maintenance window.',
        key_findings: [
            'Scheduled task created by authorized admin account',
            'Activity occurred during planned maintenance window',
            'Task purpose aligns with documented IT operations',
        ],
        recommended_action: 'close',
    },
    'SCN-106': {
        verdict: 'true_positive',
        severity: 'medium',
        summary: 'Antivirus detected and quarantined a known trojan. While the malware was contained, the delivery vector (likely email or web download) should be investigated to prevent recurrence.',
        key_findings: [
            'Malware was detected and quarantined by AV',
            'File hash matches known trojan variant',
            'Delivery vector should be investigated',
        ],
        recommended_action: 'close',
    },
    'SCN-107': {
        verdict: 'true_positive',
        severity: 'high',
        summary: 'An account was locked out after numerous failed password attempts. The pattern suggests a brute-force password attack targeting this specific user account. Source IP should be blocked and credentials rotated.',
        key_findings: [
            'High volume of failed password attempts in short window',
            'Pattern consistent with brute-force attack',
            'Account was locked out as a protective measure',
        ],
        recommended_action: 'escalate',
    },
    'SCN-108': {
        verdict: 'false_positive',
        severity: 'low',
        summary: 'The USB device insertion was a known authorized peripheral (keyboard/mouse). The endpoint DLP policy flagged all USB insertions, but this was a standard input device, not a storage device.',
        key_findings: [
            'USB device is a standard HID input device (keyboard/mouse)',
            'No mass storage capability — no data exfiltration risk',
            'Device is on the corporate approved peripherals list',
        ],
        recommended_action: 'close',
    },
    'SCN-109': {
        verdict: 'true_positive',
        severity: 'high',
        summary: 'A new email forwarding rule was created that sends copies of all incoming mail to an external address. This is a common BEC persistence technique. The rule should be removed and the account investigated for compromise.',
        key_findings: [
            'Mail forwarding rule sends all email to external address',
            'Rule was created programmatically, not via user UI',
            'Common persistence technique in business email compromise',
        ],
        recommended_action: 'escalate',
    },
    'SCN-110': {
        verdict: 'false_positive',
        severity: 'low',
        summary: 'Firewall rule update was an authorized change made by the network team during a scheduled change window. The change ticket was approved and documented.',
        key_findings: [
            'Change was made during approved maintenance window',
            'Network admin performed authorized rule modification',
            'Change is documented in the change management system',
        ],
        recommended_action: 'close',
    },
    'SCN-111': {
        verdict: 'true_positive',
        severity: 'medium',
        summary: 'A new local administrator account was created outside of normal provisioning processes. This could indicate an attacker establishing persistence or an insider threat. The account should be disabled and investigated.',
        key_findings: [
            'New local admin account created outside standard HR/IT flow',
            'Account was not requested through normal provisioning',
            'Potential persistence mechanism or insider threat',
        ],
        recommended_action: 'escalate',
    },
    'SCN-112': {
        verdict: 'false_positive',
        severity: 'low',
        summary: 'Large outbound data transfer was a scheduled cloud backup to the corporate Azure Blob storage. The volume and destination are consistent with the nightly backup job.',
        key_findings: [
            'Transfer destination is corporate Azure storage account',
            'Volume matches expected nightly backup size',
            'Transfer occurred during scheduled backup window',
        ],
        recommended_action: 'close',
    },
    'SCN-113': {
        verdict: 'true_positive',
        severity: 'medium',
        summary: 'PowerShell execution policy was bypassed using -ExecutionPolicy Bypass flag. While this can be legitimate, the script content and context suggest suspicious activity that needs further investigation.',
        key_findings: [
            'ExecutionPolicy bypass flag used to run unsigned script',
            'Script was downloaded from an external source',
            'Activity does not match known admin patterns',
        ],
        recommended_action: 'escalate',
    },
    'SCN-114': {
        verdict: 'false_positive',
        severity: 'low',
        summary: 'The VPN connection from an unusual location was a legitimate employee working remotely while traveling. User confirmed the login and location matches their travel itinerary.',
        key_findings: [
            'VPN login from unusual geography triggered the alert',
            'User confirmed they are traveling to that location',
            'No other suspicious activity associated with the session',
        ],
        recommended_action: 'close',
    },
    'SCN-115': {
        verdict: 'true_positive',
        severity: 'high',
        summary: 'Windows Defender was disabled via registry modification. This is a common attacker technique to prepare for malware deployment. The host should be isolated and scanned with an alternative AV tool.',
        key_findings: [
            'Windows Defender real-time protection was disabled',
            'Disabled via registry key modification, not GPO',
            'Defense evasion technique — investigate for follow-up malware',
        ],
        recommended_action: 'escalate',
    },
    'SCN-116': {
        verdict: 'false_positive',
        severity: 'low',
        summary: 'Multiple authentication failures were caused by a misconfigured service account. The service was recently migrated and the old credentials were not updated in the service configuration.',
        key_findings: [
            'Failures originated from a known service account',
            'Service was recently migrated with stale credentials',
            'IT team confirmed and updated the configuration',
        ],
        recommended_action: 'close',
    },
    'SCN-117': {
        verdict: 'true_positive',
        severity: 'high',
        summary: 'Suspicious DLL was side-loaded into a legitimate application process. The DLL hash is unknown and the file was recently dropped to disk. This is a common technique for code execution while evading detection.',
        key_findings: [
            'Unknown DLL loaded by legitimate application',
            'DLL was recently written to disk',
            'DLL side-loading is a known defense evasion technique',
        ],
        recommended_action: 'escalate',
    },
    'SCN-118': {
        verdict: 'false_positive',
        severity: 'low',
        summary: 'Software installation was an authorized deployment pushed by the IT team via SCCM. The package is from a trusted vendor and was pre-approved.',
        key_findings: [
            'Installation was pushed via corporate SCCM/MDM',
            'Software is from an approved vendor list',
            'Deployment matches scheduled software rollout',
        ],
        recommended_action: 'close',
    },
    'SCN-119': {
        verdict: 'true_positive',
        severity: 'medium',
        summary: 'DNS tunneling indicators detected — high volume of DNS queries with unusually long subdomain labels to the same domain. This is consistent with data exfiltration or C2 communication via DNS.',
        key_findings: [
            'Abnormally long DNS subdomain labels detected',
            'High query volume to single domain',
            'Pattern consistent with DNS tunneling for C2 or exfil',
        ],
        recommended_action: 'escalate',
    },
    'SCN-120': {
        verdict: 'false_positive',
        severity: 'low',
        summary: 'The process injection alert was triggered by a legitimate anti-malware solution performing its normal scanning operations. The source process is the AV engine itself.',
        key_findings: [
            'Process injection originated from legitimate AV engine',
            'This is normal behavior for the security product',
            'No malicious intent — detection rule needs tuning',
        ],
        recommended_action: 'close',
    },
    'SCN-121': {
        verdict: 'true_positive',
        severity: 'medium',
        summary: 'Credential dumping tool (mimikatz-like) was detected in memory. Even though it may not have successfully extracted credentials, the presence of this tool indicates a compromised host requiring immediate response.',
        key_findings: [
            'Credential dumping tool signatures detected in memory',
            'Tool matches known mimikatz variant',
            'Host is likely compromised — credentials may be exposed',
        ],
        recommended_action: 'escalate',
    },
    'SCN-122': {
        verdict: 'false_positive',
        severity: 'low',
        summary: 'RDP connection from an unusual source was an IT administrator using a new jump box. The connection was authenticated with proper credentials and MFA, and activity is consistent with admin tasks.',
        key_findings: [
            'RDP originated from newly provisioned admin jump box',
            'Authenticated with proper credentials and MFA',
            'Admin confirmed the session and tasks performed',
        ],
        recommended_action: 'close',
    },
    'SCN-123': {
        verdict: 'true_positive',
        severity: 'high',
        summary: 'Browser extension was found injecting code into banking and webmail pages. The extension was not from the corporate approved list and was likely installed via social engineering. Data may have been exfiltrated.',
        key_findings: [
            'Unapproved browser extension installed',
            'Extension injects JavaScript into sensitive pages',
            'Possible credential theft from banking/webmail sites',
        ],
        recommended_action: 'escalate',
    },
    'SCN-124': {
        verdict: 'false_positive',
        severity: 'low',
        summary: 'The suspicious network scan was a scheduled vulnerability assessment run by the security team. The scan originated from the authorized vulnerability scanner appliance.',
        key_findings: [
            'Scan originated from authorized VA scanner appliance',
            'Scan occurred during scheduled assessment window',
            'Security team confirmed the assessment activity',
        ],
        recommended_action: 'close',
    },
    'SCN-125': {
        verdict: 'true_positive',
        severity: 'medium',
        summary: 'Unauthorized cloud storage sync client detected running on an endpoint. The application is syncing corporate files to a personal cloud storage account, posing a data leakage risk.',
        key_findings: [
            'Unauthorized cloud sync application running',
            'Syncing corporate documents to personal cloud account',
            'Data leakage risk — corporate data leaving the network',
        ],
        recommended_action: 'escalate',
    },
};

// Read all light scenario YAML files and add answers
const lightDir = path.join(__dirname, '..', 'scenarios', 'light');
const files = fs.readdirSync(lightDir).filter(f => f.endsWith('.yaml'));

for (const file of files) {
    const filePath = path.join(lightDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    const scenarioId = file.replace('.yaml', '');
    const answer = answers[scenarioId];

    if (!answer) {
        console.log(`No answer defined for ${scenarioId}, skipping.`);
        continue;
    }

    // Check if answer already exists
    if (content.includes('answer:')) {
        console.log(`${scenarioId} already has an answer, skipping.`);
        continue;
    }

    // Insert answer section before the scoring section
    const answerYaml = [
        'answer:',
        `  verdict: ${answer.verdict}`,
        `  severity: ${answer.severity}`,
        `  summary: >`,
        `    ${answer.summary}`,
        `  key_findings:`,
        ...answer.key_findings.map(f => `  - ${f}`),
        `  recommended_action: ${answer.recommended_action}`,
    ].join('\n');

    // Insert before scoring:
    content = content.replace('scoring:', answerYaml + '\nscoring:');

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${scenarioId} with answer.`);
}

console.log('\nDone! All light scenarios updated with answers.');
