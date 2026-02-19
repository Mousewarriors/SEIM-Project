
import LiveMonitorClient from './client';

export const metadata = {
    title: 'Live SIEM Monitor | MouseWarriors',
    description: 'Real-time observation of ingested logs.',
};

export default function LivePage() {
    return (
        <div style={{ height: 'calc(100vh - 120px)', width: '100%', overflow: 'hidden' }}>
            <LiveMonitorClient />
        </div>
    );
}
