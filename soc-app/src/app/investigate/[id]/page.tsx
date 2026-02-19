import { getScenarioById, getEventsForScenario } from '@/lib/data';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';
import InvestigationClient from './client';

export default async function InvestigationPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const scenario = await getScenarioById(params.id);

    if (!scenario) {
        notFound();
    }

    const events = await getEventsForScenario(params.id);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden'
        }}>
            {/* Back Button Bar */}
            <div style={{
                height: '48px',
                borderBottom: '1px solid var(--border)',
                background: 'var(--bg-secondary)',
                padding: '0 20px',
                display: 'flex',
                alignItems: 'center',
                flexShrink: 0,
            }}>
                <Link
                    href="/"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '13px',
                        fontWeight: 500,
                        color: 'var(--text-muted)',
                        textDecoration: 'none',
                        padding: '4px 10px',
                        borderRadius: '4px',
                    }}
                >
                    <ArrowLeft size={16} />
                    Back to Dashboard
                </Link>
            </div>

            <InvestigationClient scenario={scenario} initialEvents={events} />
        </div>
    );
}
