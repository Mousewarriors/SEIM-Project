'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Monitor, FileText, Server, ShieldAlert, Globe, Activity } from 'lucide-react';

const NAV_ITEMS = [
    { href: '/', icon: Monitor, label: 'Mission Control' },
    { href: '/logs', icon: FileText, label: 'Log Hunter' },
    { href: '/endpoint', icon: Server, label: 'Endpoint Security' },
    { href: '/email', icon: ShieldAlert, label: 'Email Gateway' },
    { href: '/intel', icon: Globe, label: 'Threat Intel' },
    { href: '/live', icon: Activity, label: 'Live Monitor' },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="app-sidebar">
            {/* Logo */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '0 20px',
                    height: '56px',
                    borderBottom: '1px solid var(--border)',
                    flexShrink: 0,
                }}
            >
                <div
                    style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '6px',
                        background: 'var(--cyan)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <ShieldAlert size={16} color="#000" />
                </div>
                <span
                    style={{
                        fontWeight: 700,
                        fontSize: '15px',
                        color: 'var(--text-primary)',
                        letterSpacing: '-0.01em',
                    }}
                >
                    MouseWarriors
                </span>
            </div>

            {/* Navigation */}
            <nav
                style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    padding: '16px 12px',
                    overflowY: 'auto',
                }}
            >
                {NAV_ITEMS.map(item => {
                    const isActive =
                        item.href === '/'
                            ? pathname === '/'
                            : pathname?.startsWith(item.href);

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '10px 14px',
                                borderRadius: '6px',
                                fontSize: '13px',
                                fontWeight: isActive ? 600 : 500,
                                color: isActive ? 'var(--cyan)' : 'var(--text-secondary)',
                                background: isActive ? 'var(--cyan-dim)' : 'transparent',
                                textDecoration: 'none',
                                transition: 'all 0.15s ease',
                                position: 'relative',
                                borderLeft: isActive ? '3px solid var(--cyan)' : '3px solid transparent',
                            }}
                            onMouseEnter={e => {
                                if (!isActive) {
                                    (e.currentTarget as HTMLElement).style.background = 'var(--bg-tertiary)';
                                    (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
                                }
                            }}
                            onMouseLeave={e => {
                                if (!isActive) {
                                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                                    (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
                                }
                            }}
                        >
                            <item.icon size={18} style={{ color: isActive ? 'var(--cyan)' : 'var(--text-muted)', flexShrink: 0 }} />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Status Bar */}
            <div
                style={{
                    padding: '12px 20px',
                    borderTop: '1px solid var(--border)',
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                }}
            >
                <span
                    style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: 'var(--green)',
                        display: 'inline-block',
                    }}
                />
                System Online
            </div>
        </aside>
    );
}
