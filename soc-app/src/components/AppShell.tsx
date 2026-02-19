'use client';

import React from 'react';
import GlobalPanel from './GlobalPanel';
import { usePathname } from 'next/navigation';

export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isFullWidth = pathname === '/' || pathname?.startsWith('/investigate/') || pathname?.startsWith('/endpoint/');

    return (
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
            {/* Main content area */}
            <main className="app-content" style={{ flex: 1, minWidth: 0, padding: isFullWidth ? 0 : undefined }}>
                {children}
            </main>

            {/* Global AI + Notepad panel */}
            <GlobalPanel />
        </div>
    );
}
