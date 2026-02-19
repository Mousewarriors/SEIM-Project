'use client';

import Link from 'next/link';
import { Server, Laptop, Clock, User, Cpu } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface HostSummary {
    name: string;
    ip: string[];
    user?: string;
    lastSeen: string;
}

export default function EndpointList({ hosts }: { hosts: HostSummary[] }) {
    return (
        <div>
            {/* Page Header */}
            <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                    width: '44px', height: '44px', borderRadius: '8px',
                    background: 'var(--cyan-dim)', color: 'var(--cyan)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <Server size={22} />
                </div>
                <div>
                    <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 2px 0' }}>
                        Endpoint Security
                    </h1>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                        Monitor and investigate organization assets.
                    </p>
                </div>
            </div>

            {/* Host Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {hosts.map(host => (
                    <Link
                        href={`/endpoint/${host.name}`}
                        key={host.name}
                        style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                        <HostCard host={host} />
                    </Link>
                ))}
            </div>
        </div>
    );
}

function HostCard({ host }: { host: HostSummary }) {
    return (
        <div
            className="card"
            style={{
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                cursor: 'pointer',
                transition: 'border-color 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--cyan)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 0 20px rgba(6,182,212,0.08)';
            }}
            onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                (e.currentTarget as HTMLElement).style.boxShadow = 'none';
            }}
        >
            {/* Top row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div style={{
                    padding: '10px', borderRadius: '8px',
                    background: 'var(--bg-tertiary)', color: 'var(--text-secondary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <Laptop size={22} />
                </div>
                <span style={{
                    padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                    background: 'rgba(34,197,94,0.1)', color: 'var(--green)',
                }}>
                    Online
                </span>
            </div>

            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
                {host.name}
            </h3>
            <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '16px' }}>
                {host.ip[0] || 'Unknown IP'}
            </div>

            <div style={{ marginTop: 'auto', paddingTop: '14px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <InfoRow label="OS" value="Windows 10" icon={<Cpu size={12} />} />
                <InfoRow label="User" value={host.user || 'SYSTEM'} icon={<User size={12} />} />
                <InfoRow label="Last Seen" value={`${formatDistanceToNow(new Date(host.lastSeen))} ago`} icon={<Clock size={12} />} />
            </div>
        </div>
    );
}

function InfoRow({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
            <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {icon}
                {label}
            </span>
            <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>{value}</span>
        </div>
    );
}
