'use client';

import { useAlertStore } from '@/lib/store';
import { Scenario } from '@/lib/data';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import { Search, Monitor, PlayCircle, RotateCcw, UserPlus, Eye, AlertTriangle, Shield, Clock, ChevronDown, ChevronRight, CheckCircle2, ChevronUp, ArrowUpDown } from 'lucide-react';
import { format } from 'date-fns';

type SortField = 'severity' | 'created';
type SortDir = 'asc' | 'desc';

export default function DashboardClient({ scenarios }: { scenarios: Scenario[] }) {
    const { status, setAlertStatus, resetAll } = useAlertStore();
    const [activeTab, setActiveTab] = useState<'threats' | 'investigating' | 'closed'>('threats');
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [sortField, setSortField] = useState<SortField>('created');
    const [sortDir, setSortDir] = useState<SortDir>('desc');

    // Counts
    const counts = useMemo(() => {
        let threats = 0, investigating = 0, closed = 0;
        scenarios.forEach(s => {
            const st = status[s.scenario.id] || 'open';
            if (st === 'open') threats++;
            else if (st === 'investigating') investigating++;
            else if (st === 'closed') closed++;
        });
        return { threats, investigating, closed };
    }, [scenarios, status]);

    // Filter & Sort
    const filtered = useMemo(() => {
        let result = scenarios.filter(s => {
            const st = status[s.scenario.id] || 'open';

            // Channel Filter
            if (activeTab === 'threats' && st !== 'open') return false;
            if (activeTab === 'investigating' && st !== 'investigating') return false;
            if (activeTab === 'closed' && st !== 'closed') return false;

            // Search
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                return s.alert.title.toLowerCase().includes(q) ||
                    s.alert.host?.toLowerCase().includes(q) ||
                    s.alert.id.toLowerCase().includes(q);
            }
            return true;
        });

        // Sorting
        result.sort((a, b) => {
            let diff = 0;
            if (sortField === 'severity') {
                const sevScore: Record<string, number> = { critical: 3, high: 2, medium: 1, low: 0 };
                diff = sevScore[b.alert.severity] - sevScore[a.alert.severity];
            } else if (sortField === 'created') {
                diff = new Date(b.alert.created_at).getTime() - new Date(a.alert.created_at).getTime();
            }
            return sortDir === 'asc' ? -diff : diff;
        });

        return result;
    }, [scenarios, status, activeTab, searchQuery, sortField, sortDir]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDir(d => d === 'desc' ? 'asc' : 'desc');
        } else {
            setSortField(field);
            setSortDir('desc');
        }
    };

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return <ArrowUpDown size={12} style={{ opacity: 0.3, marginLeft: '4px' }} />;
        return sortDir === 'desc' ? <ChevronDown size={12} style={{ marginLeft: '4px' }} /> : <ChevronUp size={12} style={{ marginLeft: '4px' }} />;
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '32px 40px', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ marginBottom: '24px', flexShrink: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <div>
                    <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>Security Operations</h1>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>Incident Response Console</p>
                </div>
                <button onClick={resetAll} className="btn btn-ghost" style={{ fontSize: '12px' }}>
                    <RotateCcw size={14} />
                    Reset
                </button>
            </div>

            {/* Stat Cards (Channel Selectors) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px', flexShrink: 0 }}>
                <StatCard
                    label="Threat Alerts"
                    value={counts.threats}
                    active={activeTab === 'threats'}
                    onClick={() => setActiveTab('threats')}
                    color="var(--red)"
                />
                <StatCard
                    label="Under Investigation"
                    value={counts.investigating}
                    active={activeTab === 'investigating'}
                    onClick={() => setActiveTab('investigating')}
                    color="var(--amber)"
                />
                <StatCard
                    label="Closed Alerts"
                    value={counts.closed}
                    active={activeTab === 'closed'}
                    onClick={() => setActiveTab('closed')}
                    color="var(--green)"
                />
            </div>

            {/* Toolbar (Search) */}
            <div style={{ padding: '0 0 16px 0', display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
                <div style={{ position: 'relative', width: '300px' }}>
                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        className="input"
                        placeholder="Search incidents..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        style={{ paddingLeft: '32px', fontSize: '12px', paddingTop: '8px', paddingBottom: '8px' }}
                    />
                </div>
            </div>

            {/* Main Content (Table/List) */}
            <div className="card" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {/* Table Header */}
                <div style={{
                    minWidth: '600px', // Force scroll on small screens
                    display: 'grid',
                    gridTemplateColumns: '40px 90px 120px 1fr 110px',
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border)',
                    background: 'var(--bg-tertiary)',
                    fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em',
                    gap: '12px', alignItems: 'center'
                }}>
                    <div></div>
                    <div
                        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', userSelect: 'none' }}
                        onClick={() => handleSort('severity')}
                    >
                        Severity <SortIcon field="severity" />
                    </div>
                    <div>Type</div>
                    <div>Incident Name</div>
                    <div
                        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', userSelect: 'none' }}
                        onClick={() => handleSort('created')}
                    >
                        Time Received <SortIcon field="created" />
                    </div>
                </div>

                {/* Table Body */}
                <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
                    {filtered.length === 0 ? (
                        <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                            No incidents in this channel.
                        </div>
                    ) : (
                        filtered.map(s => (
                            <AlertRow
                                key={s.scenario.id}
                                scenario={s}
                                status={status[s.scenario.id] || 'open'}
                                isExpanded={expandedId === s.scenario.id}
                                toggleExpanded={() => setExpandedId(expandedId === s.scenario.id ? null : s.scenario.id)}
                                setStatus={setAlertStatus}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, active, onClick, color }: any) {
    return (
        <div
            onClick={onClick}
            className={`stat-card ${active ? 'active' : ''}`}
            style={{
                cursor: 'pointer',
                borderLeft: active ? `3px solid ${color}` : '1px solid var(--border)',
                background: active ? 'rgba(6,182,212,0.04)' : 'var(--bg-elevated)'
            }}
        >
            <div className="stat-value" style={{ color: active ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{value}</div>
            <div className="stat-label" style={{ color: active ? color : 'var(--text-muted)' }}>{label}</div>
        </div>
    );
}

function AlertRow({ scenario: s, status, isExpanded, toggleExpanded, setStatus }: any) {
    const severityColor = s.alert.severity === 'critical' ? 'var(--red)' :
        s.alert.severity === 'high' ? 'var(--amber)' :
            s.alert.severity === 'medium' ? '#facc15' : 'var(--green)';

    // Date formatting (using native Date since date-fns format might be strictly relative if not customized)
    // Actually I can use standard Intl.DateTimeFormat
    const dateStr = new Date(s.alert.created_at).toLocaleString('en-GB', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    });

    // Format Type (Category)
    const typeLabel = (s.alert.category || 'Unknown')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());

    return (
        <div style={{ borderBottom: '1px solid var(--border)', minWidth: '600px' }}>
            {/* Main Row */}
            <div
                onClick={toggleExpanded}
                style={{
                    display: 'grid',
                    gridTemplateColumns: '40px 90px 120px 1fr 110px',
                    padding: '12px 16px',
                    gap: '12px', alignItems: 'center',
                    cursor: 'pointer',
                    background: isExpanded ? 'rgba(6,182,212,0.04)' : 'transparent',
                    borderLeft: `3px solid ${isExpanded ? 'var(--cyan)' : 'transparent'}`,
                    transition: 'background 0.1s'
                }}
            >
                {/* Expand Icon */}
                <div style={{ color: 'var(--text-muted)' }}>
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>

                {/* Severity */}
                <div>
                    <span style={{
                        display: 'inline-block', padding: '3px 8px', borderRadius: '4px',
                        fontSize: '10px', fontWeight: 700, border: `1px solid ${severityColor}`,
                        color: severityColor, background: `${severityColor}10`
                    }}>
                        {s.alert.severity.toUpperCase()}
                    </span>
                </div>

                {/* Type */}
                <div style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 500 }}>
                    {typeLabel}
                </div>

                {/* Title */}
                <div style={{
                    color: 'var(--text-primary)',
                    fontWeight: 500,
                    fontSize: '13px',
                    display: '-webkit-box',
                    WebkitLineClamp: 4,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    lineHeight: '1.5'
                }}>
                    {s.alert.title}
                </div>

                {/* Time */}
                <div style={{
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-mono)',
                    lineHeight: '1.4',
                    whiteSpace: 'normal',
                    wordBreak: 'break-word'
                }}>
                    {dateStr}
                </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
                <div style={{ background: 'var(--bg-primary)', padding: '16px 20px 16px 68px', borderTop: '1px solid var(--border)' }}>
                    <div style={{ marginBottom: '16px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px' }}>Source</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Monitor size={14} /> {s.alert.host || 'Unknown'}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        {status === 'open' && (
                            <button
                                onClick={(e) => { e.stopPropagation(); setStatus(s.scenario.id, 'investigating'); }}
                                className="btn btn-primary"
                            >
                                <UserPlus size={14} /> Assign & Start Investigation
                            </button>
                        )}
                        {status === 'investigating' && (
                            <>
                                <Link
                                    href={`/investigate/${s.scenario.id}`}
                                    className="btn btn-primary"
                                    onClick={e => e.stopPropagation()}
                                    style={{ textDecoration: 'none' }}
                                >
                                    <PlayCircle size={14} /> Open Investigation Board
                                </Link>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setStatus(s.scenario.id, 'closed'); }}
                                    className="btn btn-ghost"
                                >
                                    Close Case
                                </button>
                            </>
                        )}
                        {status === 'closed' && (
                            <button
                                onClick={(e) => { e.stopPropagation(); setStatus(s.scenario.id, 'open'); }}
                                className="btn btn-ghost"
                            >
                                <RotateCcw size={14} /> Reopen Case
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
