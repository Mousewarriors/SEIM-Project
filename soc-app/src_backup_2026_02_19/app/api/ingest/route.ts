
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

let DATA_DIR = path.join(process.cwd(), 'data');
const parentData = path.join(process.cwd(), '..', 'data');

if (fs.existsSync(parentData)) {
    DATA_DIR = parentData;
}

const LIVE_LOG_FILE = path.join(DATA_DIR, 'live.events.jsonl');

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Handle single or array of events
        const events = Array.isArray(body) ? body : [body];

        const lines = events.map((event: any) => {
            // Normalize fields
            if (!event['@timestamp']) {
                event['@timestamp'] = new Date().toISOString();
            }
            if (!event.event) {
                event.event = { dataset: 'ingest', action: 'received' };
            }
            // Ensure essential schema fields exist for UI
            if (!event.host) event.host = { name: 'unknown-host' };

            return JSON.stringify(event);
        }).join('\n') + '\n';

        // Append to the live log file
        fs.appendFileSync(LIVE_LOG_FILE, lines);

        return NextResponse.json({
            success: true,
            count: events.length,
            file: LIVE_LOG_FILE
        });

    } catch (error) {
        console.error('Ingest error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to process logs' },
            { status: 500 }
        );
    }
}
