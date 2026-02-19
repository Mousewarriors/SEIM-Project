
import { getHosts } from '@/lib/hosts';
import { notFound } from 'next/navigation';
import HostClient from './client';

export default async function EndpointDetailPage(props: { params: Promise<{ hostname: string }> }) {
    const params = await props.params;
    const decodedHostname = decodeURIComponent(params.hostname);

    const hosts = await getHosts();
    const host = hosts.find(h => h.name?.toLowerCase() === decodedHostname.toLowerCase());

    if (!host) {
        notFound();
    }

    return <HostClient host={host} />;
}
