import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { alertDescription } = body;

        if (!alertDescription) {
            return NextResponse.json({ error: 'Alert description is required' }, { status: 400 });
        }

        // Forward to the local python server
        const response = await fetch('http://localhost:8888/query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                alert_description: alertDescription,
                n_results: 5
            })
        });

        if (!response.ok) {
            throw new Error(`MITRE Server responded with ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error: any) {
        console.error('MITRE API Error:', error);
        return NextResponse.json(
            { error: 'Failed to contact MITRE Analyzer. Is the python server running on port 8888?' },
            { status: 500 }
        );
    }
}
