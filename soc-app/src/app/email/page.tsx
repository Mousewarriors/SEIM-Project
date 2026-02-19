
import { getAllEvents } from '@/lib/data';
import EmailSecurityClient from './client';

export default async function Page() {
    const events = await getAllEvents();
    // Filter for email dataset
    const filtered = events.filter(e => e.event.dataset === 'email');
    return <EmailSecurityClient initialEvents={filtered} />;
}
