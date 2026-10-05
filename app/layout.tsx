import type { Metadata } from 'next';
import './globals.css';
import { StationProvider } from '@/context/StationContext';
import Navbar from '@/components/layout/Navbar';
import OfflineBanner from '@/components/layout/OfflineBanner';
import { ShieldCheck, Radio, Globe, Activity, Compass, Cpu } from 'lucide-react';

export const metadata: Metadata = {
  title: 'POLAR COMMAND | Antarctic Digital Twin Platform (SIH26060)',
  description: 'Digital Twin platform for remote operations, risk prediction, and logistics at Maitri and Bharati stations, Antarctica.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="min-h-screen flex flex-col antialiased selection:bg-cyan-500/30 selection:text-cyan-950 font-sans bg-[#F0F7FB] text-[#0F2740]">
        <StationProvider>
          {/* Edge / Connectivity Offline Notification Bar */}
          <OfflineBanner />

          {/* Enhanced Mission-Control Navigation Bar */}
          <Navbar />

          {/* Main Workspace Viewport */}
          <main className="flex-1 flex flex-col w-full relative z-10">
            {children}
          </main>

          {/* Professional Polar Command Operational Footer */}
          <footer className="w-full border-t border-slate-200/80 bg-white/75 backdrop-blur-md text-[#36546D] font-mono text-xs py-3 px-4 transition-colors">
            <div className="max-w-[1920px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
              
              {/* Left: Station Telemetry Identifiers */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-center sm:text-left">
                <div className="flex items-center gap-1.5 font-bold text-[#0F2740]">
                  <Compass className="w-3.5 h-3.5 text-cyan-600 animate-spin-slow" />
                  <span>POLAR COMMAND • SIH26060</span>
                </div>
                <span className="hidden sm:inline text-slate-300">|</span>
                <span className="text-[#475569]">
                  Maitri: <strong className="text-[#0F2740]">70°45′57″S 11°44′09″E</strong>
                </span>
                <span className="hidden sm:inline text-slate-300">•</span>
                <span className="text-[#475569]">
                  Bharati: <strong className="text-[#0F2740]">69°24′28″S 76°11′14″E</strong>
                </span>
              </div>

              {/* Right: Operational Status & Provenance */}
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-[#475569]">
                <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 font-semibold text-[10px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Telemetry Engine Sync Active
                </span>
                <span className="hidden md:inline text-slate-300">|</span>
                <span className="text-[10px] text-slate-500 hidden md:inline">
                  National Centre for Polar and Ocean Research (NCPOR)
                </span>
              </div>

            </div>
          </footer>
        </StationProvider>
      </body>
    </html>
  );
}
