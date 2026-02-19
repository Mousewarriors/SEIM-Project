
import { NextResponse } from 'next/server';
import { getLiveEvents } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const events = await getLiveEvents();
        // Return latest 100 events
        const recent = events.slice(-100);
        return NextResponse.json({ events: recent });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
