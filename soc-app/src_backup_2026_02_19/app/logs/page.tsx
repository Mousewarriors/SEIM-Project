
import { getAllEvents } from '@/lib/data';
import LogViewer from '@/components/LogViewer';

export default async function Page() {
    const events = await getAllEvents();
    return <LogViewer initialEvents={events} title="Log Management" />;
}
