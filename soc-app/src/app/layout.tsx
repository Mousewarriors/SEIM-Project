import './globals.css';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import AppShell from '@/components/AppShell';
import React from 'react';

export const metadata = {
  title: 'MouseWarriors SOC',
  description: 'Advanced Threat Investigation Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&family=Orbitron:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="app-shell">
          <Sidebar />
          <div className="app-body">
            <Header />
            <AppShell>{children}</AppShell>
          </div>
        </div>
      </body>
    </html>
  );
}
