'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Scenario } from '@/lib/data';
import { useAlertStore } from '@/lib/store';
import clsx from 'clsx';
import { useMemo } from 'react';

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6']; // Green, Red, Orange, Blue

function CustomTooltip({ active, payload }: any) {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl backdrop-blur-md">
                <p className="text-slate-200 font-bold mb-1">{payload[0].name}</p>
                <p className="text-cyan-400 font-mono text-sm">
                    {payload[0].value} Alerts ({((payload[0].percent || 0) * 100).toFixed(0)}%)
                </p>
            </div>
        );
    }
    return null;
}

export default function StatsCharts({ scenarios }: { scenarios: Scenario[] }) {
    const { status } = useAlertStore();

    const data = useMemo(() => {
        const counts = {
            Open: 0,
            Investigating: 0,
            Closed: 0
        };

        scenarios.forEach(s => {
            const sStatus = status[s.scenario.id] || 'open';
            if (sStatus === 'open') counts.Open++;
            else if (sStatus === 'investigating') counts.Investigating++;
            else if (sStatus === 'closed') counts.Closed++;
        });

        return [
            { name: 'Open', value: counts.Open, color: '#ef4444' }, // Red for open/danger
            { name: 'Investigating', value: counts.Investigating, color: '#f59e0b' }, // Orange for investigating
            { name: 'Closed', value: counts.Closed, color: '#10b981' }, // Green for closed/safe
        ].filter(d => d.value > 0);
    }, [scenarios, status]);

    const severityData = useMemo(() => {
        const counts = {
            Critical: 0,
            High: 0,
            Medium: 0,
            Low: 0
        };

        scenarios.forEach(s => {
            if (s.alert.severity === 'critical') counts.Critical++;
            else if (s.alert.severity === 'high') counts.High++;
            else if (s.alert.severity === 'medium') counts.Medium++;
            else if (s.alert.severity === 'low') counts.Low++;
        });

        return [
            { name: 'Critical', value: counts.Critical, color: '#ef4444' },
            { name: 'High', value: counts.High, color: '#f97316' },
            { name: 'Medium', value: counts.Medium, color: '#eab308' },
            { name: 'Low', value: counts.Low, color: '#22c55e' },
        ].filter(d => d.value > 0);
    }, [scenarios]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="card bg-slate-900/50 border border-slate-800 p-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                    <div className="w-32 h-32 rounded-full border-4 border-slate-600/30"></div>
                </div>
                <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Alert Status Distribution</h3>
                <div className="h-64 relative z-10">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                                stroke="none"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend
                                verticalAlign="bottom"
                                height={36}
                                iconType="circle"
                                formatter={(value) => <span className="text-slate-400 text-xs font-bold uppercase ml-1">{value}</span>}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="card bg-slate-900/50 border border-slate-800 p-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                    <div className="w-32 h-32 rounded-full border-4 border-slate-600/30 border-dashed"></div>
                </div>
                <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Severity Breakdown</h3>
                <div className="h-64 relative z-10">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={severityData}
                                cx="50%"
                                cy="50%"
                                startAngle={180}
                                endAngle={0}
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                                stroke="none"
                            >
                                {severityData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend
                                verticalAlign="bottom"
                                height={36}
                                iconType="circle"
                                formatter={(value) => <span className="text-slate-400 text-xs font-bold uppercase ml-1">{value}</span>}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
