
'use client';

import { useState, useEffect, useRef } from 'react';
import { EventLog } from '@/lib/data';
import { useAlertStore, LiveAlertRule } from '@/lib/store';
import {
    List, Monitor, Pause, Play, RefreshCw, Activity, ArrowDownCircle, Network,
    AlertTriangle, Settings, Plus, Trash2, CheckCircle2, XCircle, ShieldAlert
} from 'lucide-react';

export default function LiveMonitorClient() {
    // Store
    const { liveRules, liveAlerts, addLiveAlert, addLiveRule, deleteLiveRule, clearLiveAlerts } = useAlertStore();

    // Local State
    const [events, setEvents] = useState<EventLog[]>([]);
    const [isLive, setIsLive] = useState(true);
    const [lastFetch, setLastFetch] = useState(Date.now());
    const [autoScroll, setAutoScroll] = useState(true);
    const [activeTab, setActiveTab] = useState<'alerts' | 'rules'>('alerts');

    // Rule Form State
    const [showRuleForm, setShowRuleForm] = useState(false);
    const [newRule, setNewRule] = useState<Partial<LiveAlertRule>>({
        name: '', description: '', severity: 'medium', field: 'event.action', operator: 'contains', value: '', enabled: true
    });

    const scrollRef = useRef<HTMLDivElement>(null);
    const processedEventIds = useRef<Set<string>>(new Set());

    // Evaluate Rules against new events
    const evaluateRules = (newEvents: EventLog[]) => {
        newEvents.forEach(evt => {
            // Generate a pseudo-ID for the event to prevent re-processing
            const evtId = `${evt['@timestamp']}-${evt.host?.name}-${evt.event?.action}`;
            if (processedEventIds.current.has(evtId)) return;
            processedEventIds.current.add(evtId);

            liveRules.filter(r => r.enabled).forEach(rule => {
                let match = false;

                // Get field value (support nested 'event.action')
                const fieldParts = rule.field.split('.');
                let val: any = evt;
                for (const part of fieldParts) {
                    val = val?.[part];
                }

                if (val !== undefined) {
                    const strVal = String(val).toLowerCase();
                    const ruleVal = rule.value.toLowerCase();

                    if (rule.operator === 'equals' && strVal === ruleVal) match = true;
                    if (rule.operator === 'contains' && strVal.includes(ruleVal)) match = true;
                    if (rule.operator === 'not_equals' && strVal !== ruleVal) match = true;
                }

                if (match) {
                    addLiveAlert({
                        id: crypto.randomUUID(),
                        ruleId: rule.id,
                        title: rule.name,
                        severity: rule.severity,
                        timestamp: new Date().toISOString(),
                        sourceEvent: evt
                    });
                }
            });
        });

        // Cleanup old IDs to prevent memory leak
        if (processedEventIds.current.size > 1000) {
            const arr = Array.from(processedEventIds.current);
            processedEventIds.current = new Set(arr.slice(arr.length - 500));
        }
    };

    useEffect(() => {
        let interval: NodeJS.Timeout;

        const fetchData = async () => {
            if (!isLive) return;
            try {
                const res = await fetch('/api/live-events');
                if (res.ok) {
                    const data = await res.json();
                    if (data.events && Array.isArray(data.events)) {
                        const incoming = data.events;

                        // Check if we have new events
                        if (JSON.stringify(incoming) !== JSON.stringify(events)) {
                            setEvents(incoming);
                            // Evaluate rules on incoming batch
                            evaluateRules(incoming);
                        }
                    }
                }
                setLastFetch(Date.now());
            } catch (err) {
                console.error('Fetch error:', err);
            }
        };

        fetchData();
        interval = setInterval(fetchData, 3000);
        return () => clearInterval(interval);
    }, [isLive, events, liveRules]); // Re-run if rules change? No, only on fetch cycle really.

    // Auto-scroll logic
    useEffect(() => {
        if (autoScroll && scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [events, autoScroll]);

    const handleAddRule = () => {
        if (!newRule.name || !newRule.value) return;
        addLiveRule({
            id: crypto.randomUUID(),
            name: newRule.name!,
            description: newRule.description || '',
            severity: newRule.severity as any,
            field: newRule.field!,
            operator: newRule.operator as any,
            value: newRule.value!,
            enabled: true
        });
        setShowRuleForm(false);
        setNewRule({ name: '', description: '', severity: 'medium', field: 'event.action', operator: 'contains', value: '', enabled: true });
    };

    return (
        <div style={{ display: 'flex', height: '100%', overflow: 'hidden', background: '#030508' }}>

            {/* LEFT: Live Stream (65%) */}
            <div style={{ flex: '65%', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)' }}>
                {/* Control Bar */}
                <div style={{
                    padding: '12px 20px',
                    borderBottom: '1px solid var(--border)',
                    background: 'var(--bg-secondary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    flexShrink: 0
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Activity size={18} className="text-accent" />
                        <h1 style={{ fontSize: '14px', margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Live Event Stream</h1>
                        <span style={{ fontSize: '11px', color: isLive ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
                            {isLive ? '● ONLINE' : '○ PAUSED'}
                        </span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => setIsLive(!isLive)} className="btn btn-sm btn-ghost" title={isLive ? "Pause Stream" : "Resume Stream"}>
                            {isLive ? <Pause size={14} /> : <Play size={14} />}
                        </button>
                        <button onClick={() => setAutoScroll(!autoScroll)} className="btn btn-sm btn-ghost" style={{ color: autoScroll ? 'var(--cyan)' : 'var(--text-muted)' }} title="Toggle Auto-Scroll">
                            <ArrowDownCircle size={14} />
                        </button>
                    </div>
                </div>

                {/* Terminal */}
                <div
                    ref={scrollRef}
                    className="live-terminal"
                    style={{
                        flex: 1,
                        padding: '16px',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '12px',
                        overflowY: 'auto',
                        position: 'relative'
                    }}
                >
                    {/* Grid Overlay */}
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundImage: 'linear-gradient(rgba(0, 243, 255, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 243, 255, 0.02) 1px, transparent 1px)',
                        backgroundSize: '40px 40px',
                        pointerEvents: 'none',
                        zIndex: 0
                    }} />

                    {events.length === 0 ? (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '10px', color: 'var(--text-muted)', opacity: 0.6 }}>
                            <Network size={40} />
                            <div>Waiting for events...</div>
                        </div>
                    ) : (
                        events.map((evt, i) => {
                            const isFail = evt.event?.action?.includes('fail') || evt.event?.action === 'block'; // Simple heuristic
                            return (
                                <div key={i} style={{
                                    display: 'flex', gap: '12px', padding: '4px 8px', marginBottom: '2px',
                                    background: isFail ? 'rgba(239, 68, 68, 0.05)' : 'transparent',
                                    borderLeft: isFail ? '2px solid var(--red)' : '2px solid transparent',
                                    position: 'relative', zIndex: 1
                                }}>
                                    <span style={{ color: 'var(--text-muted)', minWidth: '70px' }}>
                                        {new Date(evt['@timestamp']).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </span>
                                    <span style={{ color: 'var(--cyan)', minWidth: '100px', fontWeight: 600 }}>{evt.host?.name || 'unknown'}</span>
                                    <span style={{
                                        color: isFail ? 'var(--red)' : 'var(--green)',
                                        minWidth: '90px', textTransform: 'uppercase', fontSize: '11px', fontWeight: 700
                                    }}>
                                        {evt.event?.action}
                                    </span>
                                    <span style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {evt.event?.original || JSON.stringify(evt.event)}
                                    </span>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* RIGHT: Alerts & Rules (35%) */}
            <div style={{ flex: '35%', display: 'flex', flexDirection: 'column', background: 'var(--bg-secondary)' }}>
                {/* Right Header */}
                <div style={{
                    display: 'flex', borderBottom: '1px solid var(--border)'
                }}>
                    <button
                        onClick={() => setActiveTab('alerts')}
                        style={{
                            flex: 1, padding: '12px', background: activeTab === 'alerts' ? 'var(--bg-tertiary)' : 'transparent',
                            border: 'none', borderBottom: activeTab === 'alerts' ? '2px solid var(--cyan)' : '2px solid transparent',
                            color: activeTab === 'alerts' ? 'var(--text-primary)' : 'var(--text-muted)',
                            fontWeight: 600, fontSize: '13px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                        }}
                    >
                        <ShieldAlert size={14} /> ALERTS ({liveAlerts.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('rules')}
                        style={{
                            flex: 1, padding: '12px', background: activeTab === 'rules' ? 'var(--bg-tertiary)' : 'transparent',
                            border: 'none', borderBottom: activeTab === 'rules' ? '2px solid var(--cyan)' : '2px solid transparent',
                            color: activeTab === 'rules' ? 'var(--text-primary)' : 'var(--text-muted)',
                            fontWeight: 600, fontSize: '13px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                        }}
                    >
                        <Settings size={14} /> RULES ({liveRules.length})
                    </button>
                </div>

                {/* Content Area */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>

                    {/* ALERTS TAB */}
                    {activeTab === 'alerts' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {liveAlerts.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '12px' }}>
                                    <CheckCircle2 size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                                    <div>No active alerts triggered</div>
                                </div>
                            ) : (
                                <>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                        <button onClick={clearLiveAlerts} className="btn-text" style={{ fontSize: '11px' }}>Clear All</button>
                                    </div>
                                    {liveAlerts.map(alert => (
                                        <div key={alert.id} style={{
                                            padding: '12px', borderRadius: '4px', border: '1px solid var(--border)',
                                            background: 'var(--bg-elevated)', borderLeft: `3px solid ${alert.severity === 'critical' ? 'var(--red)' :
                                                    alert.severity === 'high' ? 'var(--orange)' :
                                                        alert.severity === 'medium' ? 'var(--amber)' : '#3b82f6'
                                                }`
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>{alert.title}</span>
                                                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                                            </div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                                                {alert.sourceEvent.event?.original || JSON.stringify(alert.sourceEvent.event)}
                                            </div>
                                            <div style={{ marginTop: '8px', display: 'flex', gap: '8px', fontSize: '10px' }}>
                                                <span style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '2px' }}>
                                                    HOST: {alert.sourceEvent.host?.name}
                                                </span>
                                                <span style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '2px' }}>
                                                    {String(alert.severity).toUpperCase()}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    )}

                    {/* RULES TAB */}
                    {activeTab === 'rules' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {showRuleForm ? (
                                <div style={{ padding: '16px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px' }}>
                                    <h3 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 12px 0' }}>New Detection Rule</h3>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <input
                                            placeholder="Rule Name (e.g. Failed SSH Login)"
                                            className="input"
                                            value={newRule.name}
                                            onChange={e => setNewRule({ ...newRule, name: e.target.value })}
                                        />
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <select className="input" value={newRule.severity} onChange={e => setNewRule({ ...newRule, severity: e.target.value as any })} style={{ flex: 1 }}>
                                                <option value="low">Low</option>
                                                <option value="medium">Medium</option>
                                                <option value="high">High</option>
                                                <option value="critical">Critical</option>
                                            </select>
                                            <select className="input" value={newRule.operator} onChange={e => setNewRule({ ...newRule, operator: e.target.value as any })} style={{ flex: 1 }}>
                                                <option value="contains">Contains</option>
                                                <option value="equals">Equals</option>
                                                <option value="not_equals">Not Equals</option>
                                            </select>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <input
                                                placeholder="Field (e.g. event.action)"
                                                className="input"
                                                value={newRule.field}
                                                onChange={e => setNewRule({ ...newRule, field: e.target.value })}
                                                style={{ flex: 1 }}
                                            />
                                            <input
                                                placeholder="Value (e.g. fail)"
                                                className="input"
                                                value={newRule.value}
                                                onChange={e => setNewRule({ ...newRule, value: e.target.value })}
                                                style={{ flex: 1 }}
                                            />
                                        </div>

                                        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                            <button onClick={handleAddRule} className="btn btn-primary" style={{ flex: 1 }}>Add Rule</button>
                                            <button onClick={() => setShowRuleForm(false)} className="btn btn-ghost">Cancel</button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <button onClick={() => setShowRuleForm(true)} className="btn btn-outline" style={{ borderStyle: 'dashed' }}>
                                    <Plus size={14} /> Create New Rule
                                </button>
                            )}

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {liveRules.map(rule => (
                                    <div key={rule.id} style={{
                                        padding: '12px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-tertiary)',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                    }}>
                                        <div>
                                            <div style={{ fontSize: '13px', fontWeight: 600 }}>{rule.name}</div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                                                {rule.field} {rule.operator} "{rule.value}"
                                            </div>
                                        </div>
                                        <button onClick={() => deleteLiveRule(rule.id)} className="btn-icon" style={{ color: 'var(--red)' }}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
