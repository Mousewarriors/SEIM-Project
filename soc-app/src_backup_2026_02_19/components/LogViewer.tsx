'use client';

import { useState, useMemo } from 'react';
import { Search, ChevronRight, ChevronDown, Files } from 'lucide-react';
import { format } from 'date-fns';
import { EventLog } from '@/lib/data';

interface LogViewerProps {
    initialEvents: EventLog[];
    title: string;
    filterDataset?: string;
}

export default function LogViewer({ initialEvents, title, filterDataset }: LogViewerProps) {
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(1);
    const PER_PAGE = 50;

    const filteredEvents = useMemo(() => {
        let events = initialEvents;
        if (filterDataset) {
            events = events.filter(e => e.event.dataset === filterDataset);
        }
        if (query) {
            const q = query.toLowerCase();
            events = events.filter(e => JSON.stringify(e).toLowerCase().includes(q));
        }
        return events;
    }, [initialEvents, query, filterDataset]);

    const paginatedEvents = filteredEvents.slice(0, page * PER_PAGE);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-primary)' }}>
            {/* Header */}
            <div style={{
                padding: '20px 24px',
                background: 'var(--bg-secondary)',
                borderBottom: '1px solid var(--border)',
                flexShrink: 0,
            }}>
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 12px 0' }}>
                    {title}
                </h2>
                <div style={{ position: 'relative', marginBottom: '8px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Search logs..."
                        className="input"
                        style={{ paddingLeft: '36px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                    />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Showing {paginatedEvents.length} of {filteredEvents.length} events
                    </div>
                    <button
                        onClick={() => {
                            const text = filteredEvents.map(e => JSON.stringify(e, null, 2)).join('\n');
                            navigator.clipboard.writeText(text);
                            const btn = document.getElementById('log-copy-btn');
                            if (btn) {
                                const originalText = btn.innerHTML;
                                btn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Copied';
                                setTimeout(() => {
                                    btn.innerHTML = originalText;
                                }, 2000);
                            }
                        }}
                        id="log-copy-btn"
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            background: 'transparent', border: '1px solid var(--border)',
                            borderRadius: '4px', padding: '4px 8px', fontSize: '11px',
                            color: 'var(--text-muted)', cursor: 'pointer'
                        }}
                    >
                        <Files size={12} /> Copy All
                    </button>
                </div>
            </div>

            {/* Event List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {paginatedEvents.length === 0 ? (
                        <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                            No events found.
                        </div>
                    ) : (
                        paginatedEvents.map((event, idx) => (
                            <LogRow key={idx} event={event} />
                        ))
                    )}

                    {paginatedEvents.length < filteredEvents.length && (
                        <button
                            onClick={() => setPage(p => p + 1)}
                            style={{
                                padding: '10px',
                                textAlign: 'center',
                                fontSize: '12px',
                                fontWeight: 500,
                                color: 'var(--cyan)',
                                background: 'transparent',
                                border: '1px dashed var(--border)',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                marginTop: '4px',
                            }}
                        >
                            Load More ({filteredEvents.length - paginatedEvents.length} remaining)
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

function LogRow({ event }: { event: EventLog }) {
    const [expanded, setExpanded] = useState(false);

    const borderColors: Record<string, string> = {
        network: '#3b82f6',
        endpoint: '#22c55e',
        terminal: '#f59e0b',
        email: '#a855f7',
    };
    const borderColor = borderColors[event.event.dataset] || '#64748b';

    return (
        <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            overflow: 'hidden',
            transition: 'border-color 0.1s',
        }}>
            {/* Row Header */}
            <div
                onClick={() => {
                    const selection = window.getSelection();
                    if (!selection || selection.toString().length === 0) {
                        setExpanded(!expanded);
                    }
                }}
                style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '16px',
                    padding: '14px 18px',
                    cursor: 'pointer',
                    borderLeft: `3px solid ${borderColor}`,
                    transition: 'background 0.1s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-tertiary)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
                {/* Timestamp */}
                <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    width: '120px',
                    flexShrink: 0,
                    paddingTop: '2px',
                }}>
                    {format(new Date(event['@timestamp']), 'MM/dd HH:mm:ss')}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Tags Row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                        <span style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            padding: '2px 8px',
                            borderRadius: '3px',
                            background: 'var(--bg-tertiary)',
                            color: 'var(--text-secondary)',
                        }}>
                            {event.event.dataset}
                        </span>
                        <span style={{
                            fontSize: '12px',
                            fontWeight: 600,
                            color: 'var(--cyan)',
                        }}>
                            {event.event.action}
                        </span>
                        {event.process?.name && (
                            <span style={{
                                fontSize: '11px',
                                fontFamily: 'var(--font-mono)',
                                color: 'var(--amber)',
                            }}>
                                {event.process.name}
                            </span>
                        )}
                        {event.source && event.destination && (
                            <span style={{
                                fontSize: '11px',
                                fontFamily: 'var(--font-mono)',
                                color: 'var(--text-muted)',
                            }}>
                                {event.source.ip} → {event.destination.ip}
                            </span>
                        )}
                    </div>

                    {/* Log Content */}
                    <div style={{
                        fontSize: '12px',
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.5,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: expanded ? 999 : 2,
                        WebkitBoxOrient: 'vertical',
                        wordBreak: 'break-all',
                    }}>
                        {event.event.original || JSON.stringify(event)}
                    </div>
                </div>

                {/* Chevron */}
                <div style={{ color: 'var(--text-muted)', flexShrink: 0, paddingTop: '2px' }}>
                    {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
            </div>

            {/* Expanded JSON */}
            {expanded && (
                <div style={{
                    padding: '16px 20px',
                    background: 'var(--bg-primary)',
                    borderTop: '1px solid var(--border)',
                }}>
                    <pre style={{
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--text-secondary)',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        padding: '14px 16px',
                        margin: 0,
                        overflow: 'auto',
                        maxHeight: '350px',
                        lineHeight: 1.6,
                    }}>
                        {JSON.stringify(event, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
}
