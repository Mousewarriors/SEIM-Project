import { getHosts } from '@/lib/hosts';
import EndpointList from './endpoint-list';

export default async function EndpointPage() {
    const hosts = await getHosts();

    // Serialize only what the client needs (no events)
    const hostSummaries = hosts.map(h => ({
        name: h.name,
        ip: h.ip,
        user: h.user,
        lastSeen: h.lastSeen,
    }));

    return <EndpointList hosts={hostSummaries} />;
}
