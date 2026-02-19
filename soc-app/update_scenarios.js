const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

let scenariosRoot = path.join(__dirname, 'scenarios');
const parentScenarios = path.join(__dirname, '..', 'scenarios');

if (fs.existsSync(parentScenarios)) {
    console.log(`Using parent scenarios directory: ${parentScenarios}`);
    scenariosRoot = parentScenarios;
} else {
    console.log(`Using local scenarios directory: ${scenariosRoot}`);
}

const scenarioDirs = [
    path.join(scenariosRoot, 'deep'),
    path.join(scenariosRoot, 'light')
];

function toReadable(action) {
    if (!action) return 'Unknown Action';
    return action.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

scenarioDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        console.log(`Directory not found: ${dir}`);
        return;
    }
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.yaml'));
    console.log(`Found ${files.length} files in ${dir}`);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        let data;
        try {
            data = yaml.load(content);
        } catch (e) {
            console.error(`Error parsing ${file}:`, e);
            return;
        }

        // console.log(`Processing ${file} (hasAnswer: ${!!data.answer})`);

        let modified = false;

        // 1. Generate Answer if missing
        if (!data.answer) {
            console.log(`Generating answer for ${file}...`);
            let findings = [];
            if (data.scoring && data.scoring.required_actions) {
                findings = data.scoring.required_actions.map(action => toReadable(action));
            }

            if (findings.length === 0 && data.playbook && data.playbook.steps) {
                findings = data.playbook.steps.slice(0, 3).map(s => "Confirmed: " + s);
            }

            // Check for containment keywords
            let containmentRequired = false;
            if (data.playbook && data.playbook.steps) {
                const stepsText = data.playbook.steps.join(' ').toLowerCase();
                if (stepsText.includes('isolate') || stepsText.includes('contain') || stepsText.includes('block') || stepsText.includes('disable account')) {
                    containmentRequired = true;
                }
            }

            const severity = data.alert && data.alert.severity ? data.alert.severity : 'high';
            const action = (severity === 'critical' || severity === 'high') ? 'escalate' : 'close';

            const summary = `Investigation confirms the alert '${data.alert ? data.alert.title : 'Unknown'}'. Analysis reveals suspicious activity.`;

            data.answer = {
                verdict: 'true_positive',
                severity: severity,
                summary: summary,
                key_findings: findings,
                recommended_action: action,
                containment_required: containmentRequired
            };
            modified = true;
        }

        // 2. Check for missing containment_required if answer exists
        if (data.answer && data.answer.containment_required === undefined) {
            let containmentRequired = false;
            if (data.playbook && data.playbook.steps) {
                const stepsText = data.playbook.steps.join(' ').toLowerCase();
                if (stepsText.includes('isolate') || stepsText.includes('contain') || stepsText.includes('block') || stepsText.includes('disable account')) {
                    containmentRequired = true;
                }
            }

            if (containmentRequired) {
                console.log(`Adding containment_required to ${file}...`);
                data.answer.containment_required = true;
                modified = true;
            }
        }

        if (modified) {
            const newContent = yaml.dump(data);
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log(`Saved updates to ${file}`);
        }
    });
});
