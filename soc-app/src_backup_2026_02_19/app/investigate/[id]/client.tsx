'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAlertStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import {
    Search, Filter, Clipboard, Check,
    Terminal, Globe, Shield, Mail, ChevronRight, ChevronDown,
    CheckCircle2, XCircle, AlertTriangle, ArrowRight, Trophy, Target, X,
} from 'lucide-react';
import { format } from 'date-fns';

interface EventLog {
    '@timestamp': string;
    event: { dataset: string; action: string; original?: string };
    [key: string]: any;
}

interface ScenarioAnswer {
    verdict: 'true_positive' | 'false_positive' | 'benign';
    severity: string;
    summary: string;
    key_findings: string[];
    recommended_action: 'close' | 'escalate' | 'monitor';
    containment_required?: boolean;
}

function filterEvents(events: EventLog[], query: string, dataset: string) {
    return events.filter(e => {
        if (dataset !== 'all' && e.event.dataset !== dataset) return false;
        if (!query) return true;
        return JSON.stringify(e).toLowerCase().includes(query.toLowerCase());
    });
}

export default function InvestigationClient({ scenario, initialEvents }: { scenario: any; initialEvents: EventLog[] }) {
    const [query, setQuery] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    // REMOVED completedSteps local state
    const { setAlertStatus, setPlaybook, setVerdictCorrectness, activePlaybook } = useAlertStore();
    const router = useRouter();

    const scenarioId = scenario.scenario.id;
    const answer: ScenarioAnswer | undefined = scenario.answer;

    // Sync playbook to global store
    useEffect(() => {
        if (scenario.playbook) {
            setPlaybook({
                id: scenarioId,
                title: scenario.alert.title,
                steps: scenario.playbook.steps,
                host: scenario.alert.host, // Pass host for containment actions
            });
        }
    }, [scenario, scenarioId, setPlaybook, scenario.alert.title, scenario.alert.host]);

    // Submit Report state
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [userVerdict, setUserVerdict] = useState<string>('');
    const [userAction, setUserAction] = useState<string>('');
    const [userFindings, setUserFindings] = useState<string>('');
    const [submitted, setSubmitted] = useState(false);

    const filteredEvents = useMemo(() =>
        filterEvents(initialEvents, query, activeTab),
        [initialEvents, query, activeTab]
    );

    const handleCloseCase = () => {
        setAlertStatus(scenarioId, 'closed');
        router.push('/');
    };

    const handleSubmitReport = () => {
        setSubmitted(true);
        // Calculate correctness immediately on submission
        if (answer) {
            const vCorrect = userVerdict === answer.verdict;
            setVerdictCorrectness(vCorrect);
        }
    };

    const [copied, setCopied] = useState(false);
    const handleCopyLogs = () => {
        const text = filteredEvents.map(e => JSON.stringify(e, null, 2)).join('\n');

        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const datasets = ['all', ...Array.from(new Set(initialEvents.map(e => e.event.dataset)))];
    const datasetIcons: Record<string, any> = { all: Filter, network: Globe, endpoint: Shield, email: Mail, terminal: Terminal };

    // Scoring logic
    const verdictCorrect = answer ? userVerdict === answer.verdict : false;
    const actionCorrect = answer ? userAction === answer.recommended_action : false;

    // Containment logic
    const isHostContained = activePlaybook?.containedHosts?.includes(scenario.alert.host) || false;
    const containmentCheckNeeded = answer?.containment_required !== undefined;
    const containmentCorrect = containmentCheckNeeded ? isHostContained === answer?.containment_required : true;

    let score = 0;
    if (containmentCheckNeeded) {
        if (verdictCorrect && actionCorrect && containmentCorrect) {
            score = 100;
        } else {
            score = (verdictCorrect ? 40 : 0) + (actionCorrect ? 30 : 0) + (containmentCorrect ? 30 : 0);
        }
    } else {
        score = verdictCorrect && actionCorrect ? 100 : verdictCorrect ? 60 : actionCorrect ? 30 : 0;
    }

    return (
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            {/* ── Main Workspace ── */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
                {/* Investigation Header with IOCs */}
                <div style={{
                    padding: '12px 20px',
                    borderBottom: '1px solid var(--border)',
                    background: 'var(--bg-secondary)',
                    display: 'flex', flexDirection: 'column', gap: '10px',
                    flexShrink: 0,
                }}>
                    {/* Top Row: Title & Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <h1 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{scenario.alert.title}</h1>
                            <span className={`badge ${scenario.alert.severity === 'critical' ? 'badge-critical' : scenario.alert.severity === 'high' ? 'badge-high' : 'badge-medium'}`}>
                                {scenario.alert.severity}
                            </span>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{scenario.alert.id}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={handleCloseCase} className="btn btn-ghost" style={{ fontSize: '12px' }}>Close Case</button>
                            <button
                                onClick={() => setShowSubmitModal(true)}
                                className="btn btn-primary"
                                style={{ fontSize: '12px' }}
                            >
                                <Target size={14} />
                                Submit Report
                            </button>
                        </div>
                    </div>

                    {/* Bottom Row: IOCs */}
                    {(scenario.iocs?.ips?.length > 0 || scenario.iocs?.domains?.length > 0 || scenario.iocs?.hashes?.length > 0) && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Known IOCs:</span>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                {scenario.iocs?.ips?.map((ip: string) => <IOCPill key={ip} type="IP" value={ip} />)}
                                {scenario.iocs?.domains?.map((d: string) => <IOCPill key={d} type="DNS" value={d} />)}
                                {scenario.iocs?.hashes?.map((h: string) => <IOCPill key={h} type="HASH" value={h.substring(0, 12) + '...'} full={h} />)}
                            </div>
                        </div>
                    )}
                </div>

                {/* Search + Dataset Tabs */}
                <div style={{
                    padding: '10px 20px', borderBottom: '1px solid var(--border)',
                    background: 'var(--bg-primary)', display: 'flex', gap: '12px', alignItems: 'center', flexShrink: 0,
                }}>
                    <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                        <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input type="text" placeholder="Search logs..." className="input"
                            style={{ paddingLeft: '34px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}
                            value={query} onChange={e => setQuery(e.target.value)} />
                    </div>
                    <div style={{ display: 'flex', gap: '2px', background: 'var(--bg-secondary)', borderRadius: '6px', padding: '3px', border: '1px solid var(--border)' }}>
                        {datasets.map(ds => {
                            const Icon = datasetIcons[ds] || Filter;
                            return (
                                <button key={ds} onClick={() => setActiveTab(ds)} style={{
                                    display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '4px',
                                    fontSize: '12px', fontWeight: 500, border: 'none', cursor: 'pointer',
                                    background: activeTab === ds ? 'var(--cyan)' : 'transparent',
                                    color: activeTab === ds ? '#000' : 'var(--text-muted)', transition: 'all 0.15s',
                                }}>
                                    <Icon size={13} />
                                    {ds.charAt(0).toUpperCase() + ds.slice(1)}
                                </button>
                            );
                        })}
                    </div>

                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button onClick={handleCopyLogs} className="btn-ghost" style={{
                            fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px',
                            color: copied ? 'var(--green)' : 'var(--text-muted)', border: '1px solid var(--border)', padding: '4px 8px', borderRadius: '4px',
                            background: 'transparent', // ensure transparent background
                            cursor: 'pointer'
                        }}>
                            {copied ? <Check size={12} /> : <Clipboard size={12} />}
                            {copied ? 'Copied' : 'Copy Logs'}
                        </button>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{filteredEvents.length} events</span>
                    </div>
                </div>

                {/* Event Log List */}
                <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-primary)' }}>
                    {filteredEvents.length === 0 ? (
                        <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>No events match your criteria.</div>
                    ) : filteredEvents.map((event, idx) => <EventRow key={idx} event={event} />)}
                </div>
            </div>



            {/* ── Submit Report Modal ── */}
            {showSubmitModal && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 1000,
                    background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }} onClick={() => { if (!submitted) setShowSubmitModal(false); }}>
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{
                            width: submitted ? '640px' : '480px',
                            maxHeight: '90vh',
                            overflowY: 'auto',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border)',
                            borderRadius: '12px',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                            animation: 'fadeIn 0.2s ease-out',
                        }}
                    >
                        {!submitted ? (
                            /* ── Step 1: User submits their verdict ── */
                            <div>
                                <div style={{
                                    padding: '20px 24px 16px',
                                    borderBottom: '1px solid var(--border)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                }}>
                                    <div>
                                        <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Submit Investigation Report</h2>
                                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>What is your assessment of this alert?</p>
                                    </div>
                                    <button onClick={() => setShowSubmitModal(false)} style={{
                                        background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px',
                                    }}>
                                        <X size={18} />
                                    </button>
                                </div>

                                <div style={{ padding: '20px 24px' }}>
                                    {/* Verdict Selection */}
                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '10px' }}>
                                            Your Verdict
                                        </label>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            {[
                                                { value: 'true_positive', label: 'True Positive', icon: AlertTriangle, color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)' },
                                                { value: 'false_positive', label: 'False Positive', icon: XCircle, color: '#22c55e', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)' },
                                                { value: 'benign', label: 'Benign', icon: CheckCircle2, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.3)' },
                                            ].map(opt => {
                                                const Icon = opt.icon;
                                                const isSelected = userVerdict === opt.value;
                                                return (
                                                    <button
                                                        key={opt.value}
                                                        onClick={() => setUserVerdict(opt.value)}
                                                        style={{
                                                            flex: 1,
                                                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                                                            padding: '16px 12px',
                                                            borderRadius: '8px',
                                                            border: `2px solid ${isSelected ? opt.color : 'var(--border)'}`,
                                                            background: isSelected ? opt.bg : 'var(--bg-primary)',
                                                            color: isSelected ? opt.color : 'var(--text-secondary)',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.15s',
                                                            fontWeight: 600,
                                                            fontSize: '12px',
                                                        }}
                                                    >
                                                        <Icon size={20} />
                                                        {opt.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '10px' }}>
                                            Key Findings & Analysis
                                        </label>
                                        <textarea
                                            className="input"
                                            rows={5}
                                            placeholder="Describe your investigation findings, evidence, and conclusion..."
                                            value={userFindings}
                                            onChange={e => setUserFindings(e.target.value)}
                                            style={{ fontSize: '12px', lineHeight: 1.5, resize: 'vertical' }}
                                        />
                                    </div>

                                    {/* Recommended Action */}
                                    <div style={{ marginBottom: '24px' }}>
                                        <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '10px' }}>
                                            Recommended Action
                                        </label>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            {[
                                                { value: 'close', label: 'Close Alert', color: '#22c55e' },
                                                { value: 'escalate', label: 'Escalate', color: '#ef4444' },
                                                { value: 'monitor', label: 'Monitor', color: '#f59e0b' },
                                            ].map(opt => {
                                                const isSelected = userAction === opt.value;
                                                return (
                                                    <button
                                                        key={opt.value}
                                                        onClick={() => setUserAction(opt.value)}
                                                        style={{
                                                            flex: 1,
                                                            padding: '10px 12px',
                                                            borderRadius: '6px',
                                                            border: `2px solid ${isSelected ? opt.color : 'var(--border)'}`,
                                                            background: isSelected ? `${opt.color}15` : 'var(--bg-primary)',
                                                            color: isSelected ? opt.color : 'var(--text-secondary)',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.15s',
                                                            fontWeight: 600,
                                                            fontSize: '12px',
                                                        }}
                                                    >
                                                        {opt.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Submit */}
                                    <button
                                        onClick={handleSubmitReport}
                                        disabled={!userVerdict || !userAction}
                                        className="btn btn-primary"
                                        style={{ width: '100%', fontSize: '13px', padding: '12px', gap: '8px' }}
                                    >
                                        <ArrowRight size={16} />
                                        Submit & See Results
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* ── Step 2: Show results ── */
                            <div>
                                {/* Score Header */}
                                <div style={{
                                    padding: '24px',
                                    background: score >= 80
                                        ? 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(6,182,212,0.1))'
                                        : score >= 50
                                            ? 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(6,182,212,0.1))'
                                            : 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(245,158,11,0.1))',
                                    borderBottom: '1px solid var(--border)',
                                    textAlign: 'center',
                                }}>
                                    <Trophy size={32} style={{
                                        color: score >= 80 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444',
                                        marginBottom: '8px',
                                    }} />
                                    <div style={{
                                        fontSize: '36px', fontWeight: 800, fontFamily: 'var(--font-mono)',
                                        color: score >= 80 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444',
                                        lineHeight: 1,
                                    }}>
                                        {score}/100
                                    </div>
                                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '6px' }}>
                                        {score >= 80 ? '🎯 Excellent Analysis!' : score >= 50 ? '⚡ Partial Credit' : '❌ Needs Improvement'}
                                    </div>
                                </div>

                                <div style={{ padding: '20px 24px' }}>
                                    {/* Verdict Comparison */}
                                    <div style={{ marginBottom: '16px' }}>
                                        <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                                            Verdict Comparison
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                            <ResultCard
                                                label="Your Verdict"
                                                value={formatVerdict(userVerdict)}
                                                correct={verdictCorrect}
                                            />
                                            <ResultCard
                                                label="Correct Verdict"
                                                value={formatVerdict(answer?.verdict || '')}
                                                isAnswer
                                            />
                                        </div>
                                    </div>

                                    {/* Action Comparison */}
                                    <div style={{ marginBottom: '16px' }}>
                                        <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                                            Action Comparison
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                            <ResultCard
                                                label="Your Action"
                                                value={formatAction(userAction)}
                                                correct={actionCorrect}
                                            />
                                            <ResultCard
                                                label="Correct Action"
                                                value={formatAction(answer?.recommended_action || '')}
                                                isAnswer
                                            />
                                        </div>
                                    </div>

                                    {/* Containment Analysis */}
                                    {containmentCheckNeeded && (
                                        <div style={{ marginBottom: '16px' }}>
                                            <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                                                Containment Analysis
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                                <ResultCard
                                                    label="Your Response"
                                                    value={isHostContained ? 'System Isolated' : 'System Active'}
                                                    correct={containmentCorrect}
                                                />
                                                <ResultCard
                                                    label="Expected Response"
                                                    value={answer?.containment_required ? 'System Isolated' : 'System Active'}
                                                    isAnswer
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Findings Analysis */}
                                    <div style={{ marginBottom: '16px' }}>
                                        <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                                            Findings Analysis
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                            <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '14px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                                <strong style={{ display: 'block', marginBottom: '8px', color: 'var(--text-primary)' }}>Your Findings</strong>
                                                <div style={{ whiteSpace: 'pre-wrap' }}>{userFindings || 'No findings submitted.'}</div>
                                            </div>
                                            <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '14px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                                <strong style={{ display: 'block', marginBottom: '8px', color: 'var(--text-primary)' }}>Official Analysis</strong>
                                                {answer?.summary || 'No official analysis available.'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Explanation */}
                                    {answer && (
                                        <div style={{ marginBottom: '16px' }}>
                                            <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                                                Explanation
                                            </div>
                                            <div style={{
                                                background: 'var(--bg-primary)',
                                                border: '1px solid var(--border)',
                                                borderRadius: '8px',
                                                padding: '14px 16px',
                                                fontSize: '12px',
                                                color: 'var(--text-secondary)',
                                                lineHeight: 1.7,
                                            }}>
                                                {answer.summary}
                                            </div>
                                        </div>
                                    )}

                                    {/* Key Findings */}
                                    {answer?.key_findings && answer.key_findings.length > 0 && (
                                        <div style={{ marginBottom: '20px' }}>
                                            <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                                                Key Findings You Should Have Identified
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                {answer.key_findings.map((finding: string, idx: number) => (
                                                    <div key={idx} style={{
                                                        display: 'flex', alignItems: 'flex-start', gap: '10px',
                                                        padding: '10px 14px',
                                                        background: 'var(--bg-primary)',
                                                        border: '1px solid var(--border)',
                                                        borderRadius: '6px',
                                                        fontSize: '12px',
                                                        color: 'var(--text-secondary)',
                                                        lineHeight: 1.5,
                                                    }}>
                                                        <CheckCircle2 size={14} style={{ color: 'var(--cyan)', flexShrink: 0, marginTop: '2px' }} />
                                                        <span>{finding}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            onClick={() => {
                                                setAlertStatus(scenarioId, 'closed');
                                                router.push('/');
                                            }}
                                            className="btn btn-primary"
                                            style={{ flex: 1, fontSize: '12px' }}
                                        >
                                            Close Case & Return
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSubmitted(false);
                                                setShowSubmitModal(false);
                                            }}
                                            className="btn btn-ghost"
                                            style={{ flex: 1, fontSize: '12px' }}
                                        >
                                            Continue Investigating
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

/* ── Helper Functions ── */

function formatVerdict(v: string): string {
    if (v === 'true_positive') return 'True Positive';
    if (v === 'false_positive') return 'False Positive';
    if (v === 'benign') return 'Benign';
    return v;
}

function formatAction(a: string): string {
    if (a === 'close') return 'Close Alert';
    if (a === 'escalate') return 'Escalate';
    if (a === 'monitor') return 'Monitor';
    return a;
}

/* ── Sub Components ── */

function ResultCard({ label, value, correct, isAnswer }: { label: string; value: string; correct?: boolean; isAnswer?: boolean }) {
    const borderColor = isAnswer
        ? 'var(--cyan)'
        : correct
            ? '#22c55e'
            : '#ef4444';
    const bgColor = isAnswer
        ? 'rgba(6,182,212,0.08)'
        : correct
            ? 'rgba(34,197,94,0.08)'
            : 'rgba(239,68,68,0.08)';
    const icon = isAnswer
        ? <Target size={14} style={{ color: 'var(--cyan)' }} />
        : correct
            ? <CheckCircle2 size={14} style={{ color: '#22c55e' }} />
            : <XCircle size={14} style={{ color: '#ef4444' }} />;

    return (
        <div style={{
            padding: '12px 14px',
            borderRadius: '8px',
            border: `1px solid ${borderColor}`,
            background: bgColor,
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                {icon}
                <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {label}
                </span>
            </div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {value}
            </div>
        </div>
    );
}

function EventRow({ event }: { event: any }) {
    const [expanded, setExpanded] = useState(false);
    const borderColors: Record<string, string> = { network: '#3b82f6', endpoint: '#22c55e', terminal: '#f59e0b', email: '#a855f7' };
    const borderColor = borderColors[event.event.dataset] || '#64748b';

    return (
        <div style={{ borderBottom: '1px solid var(--border)' }}>
            <div
                onClick={() => {
                    const selection = window.getSelection();
                    if (!selection || selection.toString().length === 0) {
                        setExpanded(!expanded);
                    }
                }}
                style={{
                    display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '12px 20px',
                    cursor: 'pointer', borderLeft: `3px solid ${borderColor}`, transition: 'background 0.1s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-secondary)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', width: '100px', flexShrink: 0 }}>
                    {format(new Date(event['@timestamp']), 'HH:mm:ss.SSS')}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '2px 8px', borderRadius: '3px', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                            {event.event.dataset}
                        </span>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--cyan)' }}>{event.event.action}</span>
                        {event.process?.name && <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--amber)' }}>{event.process.name}</span>}
                    </div>
                    <div style={{
                        fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', lineHeight: 1.5,
                        overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', wordBreak: 'break-all',
                    }}>
                        {event.event.original || JSON.stringify(event)}
                    </div>
                </div>
                <div style={{ color: 'var(--text-muted)', flexShrink: 0, paddingTop: '2px' }}>
                    {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
            </div>
            {expanded && (
                <div style={{ padding: '14px 20px 14px 40px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)' }}>
                    <pre style={{
                        fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)',
                        background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '6px',
                        padding: '14px 16px', margin: 0, overflow: 'auto', maxHeight: '300px', lineHeight: 1.6,
                    }}>{JSON.stringify(event, null, 2)}</pre>
                </div>
            )}
        </div>
    );
}

function IOCPill({ type, value, full }: { type: string; value: string; full?: string }) {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '3px 8px',
            borderRadius: '4px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', fontSize: '10px',
        }}>
            <span style={{ fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{type}</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }} title={full || value}>{value}</span>
        </div>
    );
}
