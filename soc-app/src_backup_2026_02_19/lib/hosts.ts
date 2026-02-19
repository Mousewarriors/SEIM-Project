
import { getAllEvents, EventLog } from './data';

export interface Host {
    name: string;
    ip: string[];
    os: string;
    lastSeen: string;
    user?: string;
    events: EventLog[];
}

export async function getHosts(): Promise<Host[]> {
    const events = await getAllEvents();
    const hostsMap = new Map<string, Host>();

    events.forEach(event => {
        if (event.host && event.host.name) {
            const hostname = event.host.name;
            if (!hostsMap.has(hostname)) {
                hostsMap.set(hostname, {
                    name: hostname,
                    ip: event.host.ip || [],
                    os: hostname.toUpperCase().startsWith('SRV') || hostname.toUpperCase().includes('DC') ? 'Windows Server 2019' : 'Windows 10',
                    lastSeen: event['@timestamp'],
                    user: event.user?.name,
                    events: []
                });
            }

            const host = hostsMap.get(hostname)!;
            host.events.push(event);

            // Update metadata if newer or missing
            if (new Date(event['@timestamp']) > new Date(host.lastSeen)) {
                host.lastSeen = event['@timestamp'];
            }
            if (!host.ip.length && event.host.ip) host.ip = event.host.ip;
            if (!host.user && event.user?.name) host.user = event.user?.name;
        }
    });

    return Array.from(hostsMap.values());
}

export async function getHostByName(name: string): Promise<Host | null> {
    const hosts = await getHosts();
    const host = hosts.find(h => h.name.toLowerCase() === name.toLowerCase());
    return host || null;
}
