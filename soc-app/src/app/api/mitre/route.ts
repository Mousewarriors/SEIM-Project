import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_MITRE_URL = 'http://localhost:8888/query';
const MITRE_ANALYZER_URL =
  process.env.MITRE_ANALYZER_URL?.trim() || DEFAULT_MITRE_URL;

if (!/^https?:\/\//i.test(MITRE_ANALYZER_URL)) {
  console.warn(
    `[mitre] MITRE_ANALYZER_URL (${MITRE_ANALYZER_URL}) does not look like a valid http(s) URL.`
  );
}

console.info(`[mitre] Forwarding MITRE queries to ${MITRE_ANALYZER_URL}`);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const alertDescription =
      typeof body?.alertDescription === 'string'
        ? body.alertDescription.trim()
        : '';

    if (!alertDescription) {
      return NextResponse.json(
        { error: 'Alert description is required' },
        { status: 400 }
      );
    }

    const response = await fetch(MITRE_ANALYZER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        alert_description: alertDescription,
        n_results: 5,
      }),
    });

    if (!response.ok) {
      throw new Error(`MITRE Server responded with ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('MITRE API Error:', error);
    return NextResponse.json(
      {
        error:
          'Failed to contact MITRE Analyzer. Verify MITRE_ANALYZER_URL and that the python server is running.',
      },
      { status: 500 }
    );
  }
}
