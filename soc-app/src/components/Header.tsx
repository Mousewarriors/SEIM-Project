'use client';

import { useState } from 'react';
import { Bell, ChevronDown, LogOut, User, Settings, Bot, StickyNote } from 'lucide-react';
import { useAlertStore } from '@/lib/store';

export default function Header() {
    const [profileOpen, setProfileOpen] = useState(false);
    const { aiPanelOpen, toggleAiPanel, notepadOpen, toggleNotepad } = useAlertStore();

    return (
        <header
            style={{
                height: '56px',
                background: 'var(--bg-secondary)',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 24px',
                flexShrink: 0,
                zIndex: 30,
            }}
        >
            {/* Left: Page context */}
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0, whiteSpace: 'nowrap' }}>
                    SOC Operations
                </h2>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>•</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Threat Investigation Platform</span>
            </div>

            {/* Right: Actions */}
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '6px' }}>
                {/* AI Assistant Toggle */}
                <ToggleSwitch
                    icon={<Bot size={15} />}
                    label="AI"
                    active={aiPanelOpen}
                    onClick={toggleAiPanel}
                    activeColor="var(--cyan)"
                />

                {/* Notepad Toggle */}
                <ToggleSwitch
                    icon={<StickyNote size={15} />}
                    label="Notes"
                    active={notepadOpen}
                    onClick={toggleNotepad}
                    activeColor="var(--amber)"
                />

                <div style={{ width: '1px', height: '24px', background: 'var(--border)', margin: '0 6px' }} />

                {/* Bell */}
                <button
                    style={{
                        position: 'relative',
                        padding: '8px',
                        borderRadius: '6px',
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-tertiary)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                    <Bell size={18} />
                    <span style={{
                        position: 'absolute',
                        top: '6px',
                        right: '6px',
                        width: '7px',
                        height: '7px',
                        background: 'var(--red)',
                        borderRadius: '50%',
                    }} />
                </button>

                {/* Profile Dropdown */}
                <div style={{ position: 'relative' }}>
                    <button
                        onClick={() => setProfileOpen(!profileOpen)}
                        style={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            color: 'var(--text-secondary)',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-tertiary)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                    >
                        <div style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: 'var(--bg-tertiary)',
                            border: '1px solid var(--border)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '11px',
                            fontWeight: 700,
                            color: 'var(--text-secondary)',
                        }}>SW</div>
                        <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Simon</span>
                        <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
                    </button>

                    {profileOpen && (
                        <>
                            <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setProfileOpen(false)} />
                            <div style={{
                                position: 'absolute',
                                right: 0,
                                top: '100%',
                                marginTop: '8px',
                                width: '220px',
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border)',
                                borderRadius: '8px',
                                boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
                                zIndex: 50,
                                padding: '4px 0',
                            }}>
                                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Simon Wood</div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>SOC Analyst</div>
                                </div>
                                <DropdownItem icon={<User size={15} />} label="Profile" onClick={() => setProfileOpen(false)} />
                                <DropdownItem icon={<Settings size={15} />} label="Settings" onClick={() => setProfileOpen(false)} />
                                <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0' }} />
                                <DropdownItem
                                    icon={<LogOut size={15} />}
                                    label="Sign Out"
                                    danger
                                    onClick={() => { setProfileOpen(false); alert('Logged out successfully.'); }}
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}

function ToggleSwitch({ icon, label, active, onClick, activeColor }: {
    icon: React.ReactNode; label: string; active: boolean; onClick: () => void; activeColor: string;
}) {
    return (
        <button
            onClick={onClick}
            title={`${active ? 'Hide' : 'Show'} ${label}`}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                border: `1px solid ${active ? activeColor : 'var(--border)'}`,
                background: active ? `${activeColor}15` : 'transparent',
                color: active ? activeColor : 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600,
                transition: 'all 0.15s',
            }}
        >
            {icon}
            <span>{label}</span>
            {/* Toggle indicator */}
            <div style={{
                width: '28px',
                height: '16px',
                borderRadius: '8px',
                background: active ? activeColor : 'var(--bg-tertiary)',
                position: 'relative',
                transition: 'background 0.2s',
                marginLeft: '2px',
            }}>
                <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: active ? '#fff' : 'var(--text-muted)',
                    position: 'absolute',
                    top: '2px',
                    left: active ? '14px' : '2px',
                    transition: 'left 0.2s',
                }} />
            </div>
        </button>
    );
}

function DropdownItem({ icon, label, onClick, danger = false }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
    return (
        <button
            onClick={onClick}
            style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 16px',
                fontSize: '13px',
                color: danger ? '#f87171' : 'var(--text-secondary)',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = danger ? 'rgba(239,68,68,0.08)' : 'var(--bg-tertiary)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        >
            {icon}
            {label}
        </button>
    );
}
