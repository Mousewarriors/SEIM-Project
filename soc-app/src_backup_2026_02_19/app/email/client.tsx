'use client';

import { useState, useMemo } from 'react';
import { Search, Mail, ShieldCheck, ShieldAlert, X, Paperclip, Clock, User, ArrowRight, ExternalLink, ChevronDown, Files } from 'lucide-react';
import { format } from 'date-fns';
import { EventLog } from '@/lib/data';

export default function EmailSecurityClient({ initialEvents }: { initialEvents: EventLog[] }) {
    const [query, setQuery] = useState('');
    const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
    const [filterAction, setFilterAction] = useState<'all' | 'allow' | 'block'>('all');

    const filteredEvents = useMemo(() => {
        return initialEvents.filter(e => {
            // Action filter
            if (filterAction === 'block' && e.event?.action !== 'block') return false;
            if (filterAction === 'allow' && e.event?.action === 'block') return false;

            if (!query) return true;
            const q = query.toLowerCase();
            return (
                e.email?.subject?.toLowerCase().includes(q) ||
                e.email?.from?.address?.toLowerCase().includes(q) ||
                (Array.isArray(e.email?.to) && e.email?.to.some(t => t.address?.toLowerCase().includes(q))) ||
                ((e.email?.to as any)?.address?.toLowerCase().includes(q)) ||
                false
            );
        });
    }, [initialEvents, query, filterAction]);

    const selectedEvent = selectedIdx !== null ? filteredEvents[selectedIdx] : null;

    // Stats
    const totalBlocked = initialEvents.filter(e => e.event?.action === 'block').length;
    const totalAllowed = initialEvents.filter(e => e.event?.action !== 'block').length;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', margin: '-32px -40px', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{
                padding: '20px 28px',
                background: 'var(--bg-secondary)',
                borderBottom: '1px solid var(--border)',
                flexShrink: 0,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{
                            width: '44px', height: '44px', borderRadius: '8px',
                            background: 'var(--cyan-dim)', color: 'var(--cyan)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Mail size={22} />
                        </div>
                        <div>
                            <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 2px 0' }}>Email Gateway</h1>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>Gateway traffic analysis and email inspection</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <MiniStat label="Total" value={initialEvents.length} />
                        <MiniStat label="Allowed" value={totalAllowed} color="var(--green)" />
                        <MiniStat label="Blocked" value={totalBlocked} color="var(--red)" />
                    </div>
                </div>

                {/* Search + Filter */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1, maxWidth: '450px' }}>
                        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input type="text" className="input" placeholder="Search sender, recipient, or subject..."
                            style={{ paddingLeft: '36px', fontSize: '12px' }}
                            value={query} onChange={e => setQuery(e.target.value)} />
                    </div>
                    <div style={{ display: 'flex', gap: '2px', background: 'var(--bg-tertiary)', borderRadius: '6px', padding: '3px', border: '1px solid var(--border)' }}>
                        {(['all', 'allow', 'block'] as const).map(f => (
                            <button key={f} onClick={() => setFilterAction(f)} style={{
                                padding: '5px 14px', borderRadius: '4px', fontSize: '12px', fontWeight: 500, border: 'none', cursor: 'pointer',
                                background: filterAction === f ? 'var(--cyan)' : 'transparent',
                                color: filterAction === f ? '#000' : 'var(--text-muted)', transition: 'all 0.15s',
                            }}>
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{filteredEvents.length} emails</span>
                    <button
                        onClick={() => {
                            const text = filteredEvents.map(e => JSON.stringify(e, null, 2)).join('\n');
                            navigator.clipboard.writeText(text);
                            const btn = document.getElementById('email-copy-btn');
                            if (btn) {
                                const originalText = btn.innerHTML;
                                btn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Copied';
                                setTimeout(() => {
                                    btn.innerHTML = originalText;
                                }, 2000);
                            }
                        }}
                        id="email-copy-btn"
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            background: 'transparent', border: '1px solid var(--border)',
                            borderRadius: '4px', padding: '4px 8px', fontSize: '11px',
                            color: 'var(--text-muted)', cursor: 'pointer', marginLeft: '12px'
                        }}
                    >
                        <Files size={12} /> Copy All
                    </button>
                </div>
            </div>

            {/* Content: Table + Detail Panel */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                {/* Email Table */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th style={{ width: 80 }}>Status</th>
                                <th style={{ width: 160 }}>Date</th>
                                <th style={{ width: 220 }}>Sender</th>
                                <th>Subject</th>
                                <th style={{ width: 200 }}>Recipient</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEvents.length === 0 ? (
                                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--text-muted)' }}>No emails match your filters.</td></tr>
                            ) : (
                                filteredEvents.map((event, idx) => {
                                    const isBlocked = event.event?.action === 'block';
                                    const isSelected = selectedIdx === idx;
                                    const recipients = Array.isArray(event.email?.to)
                                        ? event.email?.to.map(t => t.address).join(', ')
                                        : (event.email?.to as any)?.address || event.destination?.ip || 'Unknown';

                                    return (
                                        <tr key={idx} onClick={() => {
                                            const selection = window.getSelection();
                                            if (!selection || selection.toString().length === 0) {
                                                setSelectedIdx(isSelected ? null : idx);
                                            }
                                        }}
                                            style={{
                                                cursor: 'pointer',
                                                background: isSelected ? 'rgba(6,182,212,0.06)' : undefined,
                                                borderLeft: isSelected ? '3px solid var(--cyan)' : '3px solid transparent',
                                            }}>
                                            <td>
                                                <span style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                    padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700,
                                                    textTransform: 'uppercase', letterSpacing: '0.04em',
                                                    background: isBlocked ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
                                                    color: isBlocked ? 'var(--red)' : 'var(--green)',
                                                }}>
                                                    {isBlocked ? <ShieldAlert size={11} /> : <ShieldCheck size={11} />}
                                                    {isBlocked ? 'Blocked' : 'Allowed'}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                                                {format(new Date(event['@timestamp']), 'MMM dd, HH:mm')}
                                            </td>
                                            <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                                {event.email?.from?.address || event.source?.ip || 'Unknown'}
                                            </td>
                                            <td style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
                                                {event.email?.subject || '(No Subject)'}
                                            </td>
                                            <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{recipients}</td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Detail Panel */}
                {selectedEvent && (
                    <div style={{
                        width: '420px', borderLeft: '1px solid var(--border)', background: 'var(--bg-secondary)',
                        display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto',
                    }}>
                        <div style={{
                            padding: '16px 20px', borderBottom: '1px solid var(--border)',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
                        }}>
                            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>Email Details</span>
                            <button onClick={() => setSelectedIdx(null)} style={{
                                background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px',
                            }}><X size={16} /></button>
                        </div>

                        <div style={{ padding: '20px' }}>
                            {/* Subject */}
                            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px 0', lineHeight: 1.4 }}>
                                {selectedEvent.email?.subject || '(No Subject)'}
                            </h2>

                            {/* Status badge */}
                            <div style={{ marginBottom: '20px' }}>
                                {selectedEvent.event?.action === 'block' ? (
                                    <span style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px',
                                        fontSize: '12px', fontWeight: 700, background: 'rgba(239,68,68,0.1)', color: 'var(--red)',
                                    }}><ShieldAlert size={14} /> Blocked by Gateway</span>
                                ) : (
                                    <span style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px',
                                        fontSize: '12px', fontWeight: 700, background: 'rgba(34,197,94,0.1)', color: 'var(--green)',
                                    }}><ShieldCheck size={14} /> Delivered</span>
                                )}
                            </div>

                            {/* Metadata */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
                                <DetailField icon={<User size={14} />} label="From" value={selectedEvent.email?.from?.address || selectedEvent.source?.ip || 'Unknown'} />
                                <DetailField icon={<ArrowRight size={14} />} label="To" value={
                                    Array.isArray(selectedEvent.email?.to)
                                        ? selectedEvent.email?.to.map(t => t.address).join(', ')
                                        : (selectedEvent.email?.to as any)?.address || selectedEvent.destination?.ip || 'Unknown'
                                } />
                                <DetailField icon={<Clock size={14} />} label="Received" value={format(new Date(selectedEvent['@timestamp']), 'PPpp')} />
                                {selectedEvent.source?.ip && <DetailField icon={<Mail size={14} />} label="Source IP" value={selectedEvent.source.ip} mono />}
                                {selectedEvent.destination?.ip && <DetailField icon={<Mail size={14} />} label="Dest IP" value={selectedEvent.destination.ip} mono />}
                            </div>

                            {/* Artifacts */}
                            {((selectedEvent.email as any)?.urls?.length > 0 || selectedEvent.file) && (
                                <div style={{ borderTop: '1px solid var(--border)', padding: '16px 0', marginBottom: '4px' }}>
                                    <h3 style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px 0' }}>
                                        Message Artifacts
                                    </h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {/* URLs */}
                                        {Array.isArray((selectedEvent.email as any)?.urls) && (selectedEvent.email as any).urls.map((url: string, i: number) => (
                                            <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'center', background: 'var(--bg-tertiary)', padding: '8px 10px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                                                <ExternalLink size={14} style={{ color: 'var(--cyan)' }} />
                                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                                    <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '1px' }}>LINK</div>
                                                    <div style={{ fontSize: '12px', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{url}</div>
                                                </div>
                                            </div>
                                        ))}
                                        {/* Attachments */}
                                        {selectedEvent.file && (
                                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', background: 'var(--bg-tertiary)', padding: '8px 10px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                                                <Paperclip size={14} style={{ color: 'var(--orange)' }} />
                                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                                    <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '1px' }}>ATTACHMENT</div>
                                                    <div style={{ fontSize: '12px', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {(selectedEvent.file as any).name || selectedEvent.file.path?.split('\\').pop() || 'Unknown File'}
                                                    </div>
                                                    {selectedEvent.file.hash?.sha256 && (
                                                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                                                            SHA256: {selectedEvent.file.hash.sha256.substring(0, 16)}...
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Raw Event */}
                            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                                <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                                    Raw Event Data
                                </div>
                                <pre style={{
                                    fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)',
                                    background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '6px',
                                    padding: '14px 16px', margin: 0, overflow: 'auto', maxHeight: '400px', lineHeight: 1.6,
                                }}>
                                    {JSON.stringify(selectedEvent, null, 2)}
                                </pre>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function MiniStat({ label, value, color }: { label: string; value: number; color?: string }) {
    return (
        <div style={{ textAlign: 'center', padding: '6px 14px', background: 'var(--bg-tertiary)', borderRadius: '6px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '16px', fontWeight: 700, color: color || 'var(--text-primary)' }}>{value}</div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
        </div>
    );
}

function DetailField({ icon, label, value, mono }: { icon: React.ReactNode; label: string; value: string; mono?: boolean }) {
    return (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <div style={{ color: 'var(--text-muted)', marginTop: '1px', flexShrink: 0 }}>{icon}</div>
            <div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>{label}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontFamily: mono ? 'var(--font-mono)' : 'inherit', wordBreak: 'break-all' }}>{value}</div>
            </div>
        </div>
    );
}
