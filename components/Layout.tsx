import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { useThemeInstall } from '../hooks/useThemeInstall';
import { AmbientNetwork } from './AmbientNetwork';

interface LayoutProps {
  // Fix: Make children optional to address TypeScript error.
  children?: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  useThemeInstall();
  
  return (
    <div style={{ background: "var(--color-surface)", color: "var(--color-muted)" }}>
      <div className="fixed inset-0 z-0 pointer-events-none">
        <AmbientNetwork />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_60%,_var(--color-surface)_95%)]" />
      </div>
      
      <div className="relative z-10 h-screen flex flex-col" style={{ scrollBehavior: "smooth" }}>
        <Header />
        <main id="app-scroll-container" className="flex-1 overflow-auto">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
}
