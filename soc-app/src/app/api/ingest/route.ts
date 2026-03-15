import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';

const DATA_DIR = (() => {
  const candidate = path.join(process.cwd(), 'data');
  const parentCandidate = path.join(process.cwd(), '..', 'data');
  return fs.existsSync(parentCandidate) ? parentCandidate : candidate;
})();

const LIVE_LOG_FILE = path.join(DATA_DIR, 'live.events.jsonl');

const MAX_BODY_BYTES = 256 * 1024; // 256 KB
const MAX_EVENTS_PER_REQUEST = 50;
const MAX_LOG_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_LOG_TAIL_LINES = 2_000;

const ingestApiKey = process.env.INGEST_API_KEY?.trim();
if (!ingestApiKey) {
  console.warn('[ingest] INGEST_API_KEY is unset. Ingest endpoint will reject all requests until it is configured.');
}

const hostSchema = z
  .object({
    name: z.string().optional(),
    ip: z.union([z.string(), z.array(z.string())]).optional(),
  })
  .passthrough();

const eventDetailSchema = z
  .object({
    dataset: z.string().optional(),
    action: z.string().optional(),
    kind: z.string().optional(),
    category: z.union([z.string(), z.array(z.string())]).optional(),
    outcome: z.string().optional(),
  })
  .passthrough();

const ingestEventSchema = z
  .object({
    '@timestamp': z.string().optional(),
    event: eventDetailSchema.optional(),
    host: hostSchema.optional(),
  })
  .passthrough();

type IngestEvent = z.infer<typeof ingestEventSchema>;

function normalizeEvent(event: IngestEvent): IngestEvent {
  const normalizedEventDetails = {
    dataset: event.event?.dataset ?? 'ingest',
    action: event.event?.action ?? 'received',
    ...(event.event ?? {}),
  };

  const normalizedHost = {
    name: event.host?.name ?? 'unknown-host',
    ...(event.host ?? {}),
  };

  return {
    ...event,
    '@timestamp': event['@timestamp'] ?? new Date().toISOString(),
    event: normalizedEventDetails,
    host: normalizedHost,
  };
}

function rotateLogFile(filePath: string) {
  try {
    const stats = fs.statSync(filePath);
    if (stats.size <= MAX_LOG_SIZE_BYTES) {
      return;
    }

    const payload = fs.readFileSync(filePath, 'utf-8').trim();
    const lines = payload ? payload.split('\n') : [];
    const tail = lines.slice(-MAX_LOG_TAIL_LINES);
    const truncated = tail.join('\n');
    fs.writeFileSync(filePath, truncated ? `${truncated}\n` : '', 'utf-8');
    console.info(
      `[ingest] Rotated live log (${stats.size} B) down to ${tail.length} lines (${filePath}).`
    );
  } catch (error) {
    console.error('[ingest] Failed to rotate log file', error);
  }
}

function getClientKey(req: NextRequest) {
  const headerKey = req.headers.get('x-api-key');
  if (headerKey) return headerKey;
  const authorization = req.headers.get('authorization');
  if (authorization?.toLowerCase().startsWith('bearer ')) {
    return authorization.slice(7).trim();
  }
  return null;
}

async function parsePayload(req: NextRequest) {
  const contentLength = Number(req.headers.get('content-length') ?? 0);
  if (contentLength && contentLength > MAX_BODY_BYTES) {
    throw new Error('Payload exceeds maximum allowed size.');
  }

  const payload = await req.json();
  const serialized = JSON.stringify(payload);
  if (Buffer.byteLength(serialized, 'utf-8') > MAX_BODY_BYTES) {
    throw new Error('Payload exceeds maximum allowed size.');
  }

  const events = Array.isArray(payload) ? payload : [payload];
  if (events.length > MAX_EVENTS_PER_REQUEST) {
    throw new Error(`Batch size exceeds limit of ${MAX_EVENTS_PER_REQUEST} events.`);
  }

  if (events.some((item) => typeof item !== 'object' || item === null)) {
    throw new Error('Each event must be an object.');
  }

  return events as unknown[];
}

export async function POST(req: NextRequest) {
  try {
    if (!ingestApiKey) {
      return NextResponse.json(
        { error: 'Ingest API is misconfigured. Set INGEST_API_KEY env var.' },
        { status: 500 }
      );
    }

    const clientKey = getClientKey(req);
    if (clientKey !== ingestApiKey) {
      return NextResponse.json(
        { error: 'Missing or invalid ingest API key.' },
        { status: 401 }
      );
    }

    const events = await parsePayload(req);

    if (events.length === 0) {
      return NextResponse.json({ success: true, count: 0 });
    }

    const normalized = events.map((event, index) => {
      const parseResult = ingestEventSchema.safeParse(event);
      if (!parseResult.success) {
        throw new Error(`Event ${index + 1} failed validation: ${parseResult.error.message}`);
      }
      return normalizeEvent(parseResult.data);
    });

    const lines = normalized.map((event) => JSON.stringify(event)).join('\n') + '\n';

    fs.appendFileSync(LIVE_LOG_FILE, lines, 'utf-8');
    rotateLogFile(LIVE_LOG_FILE);

    return NextResponse.json({
      success: true,
      count: normalized.length,
      path: LIVE_LOG_FILE,
    });
  } catch (error) {
    console.error('[ingest] Ingest error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message ?? 'Failed to process logs.' },
      { status: 500 }
    );
  }
}
