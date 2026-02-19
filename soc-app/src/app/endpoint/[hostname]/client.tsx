'use client';

import { useState } from 'react';
import { Host } from '@/lib/hosts';
import { Globe, Shield, Terminal, HardDrive, Clock, User, Cpu, Monitor, ArrowLeft, Lock, FileText, Database, ShieldCheck } from 'lucide-react';
import LogViewer from '@/components/LogViewer';
import Link from 'next/link';
import { format } from 'date-fns';
import { useAlertStore } from '@/lib/store';

export default function HostClient({ host }: { host: Host }) {
    const [activeTab, setActiveTab] = useState('info');
    const { activePlaybook, toggleContainment } = useAlertStore();
    const isContained = activePlaybook?.containedHosts?.includes(host.name);

    const getAllLogs = () => host.events;
    const getProcessLogs = () => host.events.filter(e => (e.event.dataset === 'endpoint' && e.event.category?.includes('process')) || e.event.dataset === 'process');
    const getNetworkLogs = () => host.events.filter(e => e.event.dataset === 'network' || e.event.action === 'flow' || e.event.action === 'dns' || e.event.action === 'http');
    const getTerminalLogs = () => host.events.filter(e => e.event.dataset === 'terminal');
    const getBrowserLogs = () => host.events.filter(e => e.event.category?.includes('web') || e.event.dataset === 'http');
    const getAuthLogs = () => host.events.filter(e => e.event.category?.includes('authentication') || e.event.dataset === 'windows_security' || e.event.dataset === 'identity');
    const getDatabaseLogs = () => host.events.filter(e => e.event.dataset === 'sql_audit' || e.event.category?.includes('database'));

    const tabs = [
        { id: 'info', label: 'Host Info', icon: HardDrive },
        { id: 'all', label: 'Timeline', icon: FileText },
    ];

    if (getAuthLogs().length > 0) tabs.push({ id: 'auth', label: 'Auth', icon: ShieldCheck });
    tabs.push({ id: 'processes', label: 'Processes', icon: Cpu });
    if (getDatabaseLogs().length > 0) tabs.push({ id: 'database', label: 'Database', icon: Database });
    tabs.push({ id: 'network', label: 'Network', icon: Globe });
    tabs.push({ id: 'terminal', label: 'Terminal', icon: Terminal });
    tabs.push({ id: 'browser', label: 'Browser', icon: Globe });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{
                padding: '0 24px',
                height: '60px',
                background: 'var(--bg-secondary)',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <Link href="/endpoint" style={{ color: 'var(--text-muted)', display: 'flex', textDecoration: 'none', padding: '6px', borderRadius: '4px' }}>
                        <ArrowLeft size={18} />
                    </Link>
                    <div style={{
                        width: '36px', height: '36px', borderRadius: '8px',
                        background: 'var(--cyan-dim)', color: 'var(--cyan)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Monitor size={18} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{host.name}</h1>
                        <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{host.ip[0]}</div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '20px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><User size={13} /> {host.user || 'Unknown'}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Cpu size={13} /> Windows 10 Pro</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={13} /> {format(new Date(host.lastSeen), 'PP HH:mm')}</span>
                </div>
            </div>

            {/* Tab Bar */}
            <div style={{
                display: 'flex',
                gap: '2px',
                padding: '0 24px',
                background: 'var(--bg-secondary)',
                borderBottom: '1px solid var(--border)',
                flexShrink: 0,
            }}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '7px',
                            padding: '10px 16px',
                            fontSize: '12px',
                            fontWeight: 500,
                            border: 'none',
                            borderBottom: `2px solid ${activeTab === tab.id ? 'var(--cyan)' : 'transparent'}`,
                            background: activeTab === tab.id ? 'rgba(6,182,212,0.05)' : 'transparent',
                            color: activeTab === tab.id ? 'var(--cyan)' : 'var(--text-muted)',
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                        }}
                    >
                        <tab.icon size={14} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
                {activeTab === 'all' && <LogViewer initialEvents={getAllLogs()} title="Full Event Timeline" />}
                {activeTab === 'auth' && <LogViewer initialEvents={getAuthLogs()} title="Authentication & Security" />}
                {activeTab === 'database' && <LogViewer initialEvents={getDatabaseLogs()} title="Database Activity" />}
                {activeTab === 'processes' && <LogViewer initialEvents={getProcessLogs()} title="Process Activity" />}
                {activeTab === 'network' && <LogViewer initialEvents={getNetworkLogs()} title="Network Communications" />}
                {activeTab === 'terminal' && <LogViewer initialEvents={getTerminalLogs()} title="Terminal Commands" />}
                {activeTab === 'browser' && <LogViewer initialEvents={getBrowserLogs()} title="Web Activity" />}
                {activeTab === 'info' && (
                    <div style={{ padding: '32px', maxWidth: '900px', margin: '0 auto', overflowY: 'auto', height: '100%' }}>
                        {/* System Information */}
                        <div style={{
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            padding: '24px',
                            marginBottom: '20px',
                        }}>
                            <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <HardDrive size={18} style={{ color: 'var(--cyan)' }} />
                                System Information
                            </h2>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <InfoField label="Hostname" value={host.name} />
                                <InfoField label="Operating System" value="Windows 10 Pro 22H2" />
                                <InfoField label="IP Address" value={host.ip.join(', ')} />
                                <InfoField label="MAC Address" value="00:1A:2B:3C:4D:5E" />
                                <InfoField label="Domain" value="EXAMPLECORP.LOC" />
                                <InfoField label="Last Reboot" value="2024-10-30 08:00:00" />
                            </div>
                        </div>

                        {/* User Information */}
                        <div style={{
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            padding: '24px',
                        }}>
                            <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <User size={18} style={{ color: 'var(--cyan)' }} />
                                User Information
                            </h2>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                                <InfoField label="Current User" value={host.user || 'Unknown'} />
                                <InfoField label="Groups" value="Domain Users, Administrators" />
                                <InfoField label="Last Login" value={format(new Date(host.lastSeen), 'PP HH:mm')} />
                            </div>

                            {/* Containment Switch */}
                            <div style={{
                                gridColumn: '1 / -1',
                                background: 'rgba(245,158,11,0.05)',
                                border: '1px solid rgba(245,158,11,0.2)',
                                borderRadius: '8px',
                                padding: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{
                                        padding: '8px', borderRadius: '6px',
                                        background: isContained ? 'var(--amber)' : 'var(--bg-tertiary)',
                                        color: isContained ? '#000' : 'var(--text-muted)'
                                    }}>
                                        <Lock size={18} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>Endpoint Containment</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                            {isContained ? 'Host is isolated from the network.' : 'Host has full network access.'}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        if (activePlaybook) toggleContainment(host.name);
                                    }}
                                    style={{
                                        position: 'relative',
                                        width: '48px', height: '26px',
                                        background: isContained ? 'var(--amber)' : 'var(--bg-tertiary)',
                                        borderRadius: '99px',
                                        border: '1px solid var(--border)',
                                        cursor: activePlaybook ? 'pointer' : 'not-allowed',
                                        opacity: activePlaybook ? 1 : 0.6,
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    <div style={{
                                        position: 'absolute',
                                        top: '3px',
                                        left: isContained ? '25px' : '3px',
                                        width: '18px', height: '18px',
                                        background: '#fff',
                                        borderRadius: '50%',
                                        transition: 'left 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                                    }} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function InfoField({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <div style={{
                fontSize: '10px',
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '6px',
            }}>
                {label}
            </div>
            <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '13px',
                color: 'var(--text-secondary)',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                padding: '8px 12px',
                borderRadius: '6px',
            }}>
                {value}
            </div>
        </div>
    );
}
