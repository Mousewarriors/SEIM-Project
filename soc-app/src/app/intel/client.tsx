'use client';

import { useState, useMemo } from 'react';
import { Search, Globe, Shield, ExternalLink, Activity, FileText, Hash, Clock, Monitor, AlertTriangle } from 'lucide-react';
import { EventLog } from '@/lib/data';
import { format } from 'date-fns';
import LogViewer from '@/components/LogViewer';

export default function ThreatIntelClient({ initialEvents }: { initialEvents: EventLog[] }) {
    const [query, setQuery] = useState('');

    const iocType = useMemo(() => {
        if (!query) return null;
        if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(query)) return 'IP Address';
        if (/^[a-fA-F0-9]{32}$/.test(query) || /^[a-fA-F0-9]{40}$/.test(query) || /^[a-fA-F0-9]{64}$/.test(query)) return 'Hash';
        if (query.includes('.') && !query.includes(' ')) return 'Domain/URL';
        return 'Keyword';
    }, [query]);

    const relatedEvents = useMemo(() => {
        if (!query || query.length < 3) return [];
        const q = query.toLowerCase();
        return initialEvents.filter(e => JSON.stringify(e).toLowerCase().includes(q));
    }, [initialEvents, query]);

    const stats = useMemo(() => {
        if (relatedEvents.length === 0) return null;
        const hosts = new Set(relatedEvents.map(e => e.host?.name).filter(Boolean));
        const firstSeen = relatedEvents[0]['@timestamp'];
        const lastSeen = relatedEvents[relatedEvents.length - 1]['@timestamp'];
        return { seenCount: relatedEvents.length, hostCount: hosts.size, firstSeen, lastSeen, hosts: Array.from(hosts) };
    }, [relatedEvents]);

    const vtLink = useMemo(() => {
        if (!query) return '#';
        if (iocType === 'IP Address') return `https://www.virustotal.com/gui/ip-address/${query}`;
        if (iocType === 'Hash') return `https://www.virustotal.com/gui/file/${query}`;
        if (iocType === 'Domain/URL') return `https://www.virustotal.com/gui/domain/${query}`;
        return `https://www.virustotal.com/gui/search/${encodeURIComponent(query)}`;
    }, [query, iocType]);

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
                    <div style={{
                        width: '44px', height: '44px', borderRadius: '8px',
                        background: 'rgba(239,68,68,0.1)', color: 'var(--red)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Globe size={22} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 2px 0' }}>Threat Intelligence</h1>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>IOC Lookup & Correlation across all event data</p>
                    </div>
                </div>

                {/* Search Bar */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1, maxWidth: '600px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Enter IP, Domain, Hash, or URL to investigate..."
                            className="input"
                            style={{ paddingLeft: '42px', fontSize: '14px', height: '44px' }}
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                        />
                        {iocType && query.length > 3 && (
                            <span style={{
                                position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                                fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                                padding: '3px 8px', borderRadius: '4px',
                                background: 'var(--bg-tertiary)', color: 'var(--text-muted)',
                            }}>
                                {iocType}
                            </span>
                        )}
                    </div>
                    {query.length > 3 && (
                        <a href={vtLink} target="_blank" rel="noreferrer" style={{
                            display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px',
                            background: 'var(--cyan)', color: '#000', borderRadius: '6px',
                            fontWeight: 600, fontSize: '13px', textDecoration: 'none', transition: 'opacity 0.15s',
                        }}>
                            <ExternalLink size={15} />
                            VirusTotal
                        </a>
                    )}
                </div>
            </div>

            {/* Results */}
            {query.length < 3 ? (
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    padding: '80px 20px', color: 'var(--text-muted)', opacity: 0.5,
                }}>
                    <Shield size={56} style={{ marginBottom: '16px' }} />
                    <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>Ready to Hunt</div>
                    <p style={{ fontSize: '13px', margin: 0 }}>Enter an indicator of compromise to search across all events.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Stats Cards */}
                    {stats ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
                            <IntelStat icon={<Activity size={18} />} label="Total Sightings" value={String(stats.seenCount)} />
                            <IntelStat icon={<Monitor size={18} />} label="Affected Hosts" value={String(stats.hostCount)} subtext={stats.hosts.join(', ')} />
                            <IntelStat icon={<Clock size={18} />} label="First Seen" value={format(new Date(stats.firstSeen), 'MM/dd HH:mm')} />
                            <IntelStat icon={<Clock size={18} />} label="Last Seen" value={format(new Date(stats.lastSeen), 'MM/dd HH:mm')} />
                        </div>
                    ) : (
                        <div style={{
                            padding: '40px', textAlign: 'center', color: 'var(--text-muted)',
                            border: '1px dashed var(--border)', borderRadius: '8px', fontSize: '13px',
                        }}>
                            <AlertTriangle size={24} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.5 }} />
                            No internal sightings found for this IOC.
                        </div>
                    )}

                    {/* Timeline */}
                    {relatedEvents.length > 0 && (
                        <div>
                            <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FileText size={18} style={{ color: 'var(--red)' }} />
                                Sighting Timeline
                            </h2>
                            <div className="card" style={{ overflow: 'hidden' }}>
                                <LogViewer initialEvents={relatedEvents} title="" />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function IntelStat({ icon, label, value, subtext }: { icon: React.ReactNode; label: string; value: string; subtext?: string }) {
    return (
        <div style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '18px 20px',
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
                <span style={{ color: 'var(--text-muted)' }}>{icon}</span>
            </div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>{value}</div>
            {subtext && <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={subtext}>{subtext}</div>}
        </div>
    );
}
