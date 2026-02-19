
import { getAllEvents } from '@/lib/data';
import ThreatIntelClient from './client';

export default async function Page() {
    const events = await getAllEvents();
    return <ThreatIntelClient initialEvents={events} />;
}
