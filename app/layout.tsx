import type { Metadata } from 'next';
import './globals.css';
import { StationProvider } from '@/context/StationContext';
import Navbar from '@/components/layout/Navbar';
import OfflineBanner from '@/components/layout/OfflineBanner';
import DemoScenarioToolbar from '@/components/layout/DemoScenarioToolbar';

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
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col bg-polar-950 text-slate-100 antialiased selection:bg-polar-ice/20 selection:text-polar-ice">
        <StationProvider>
          <OfflineBanner />
          <Navbar />
          <DemoScenarioToolbar />
          <main className="flex-1 flex flex-col">
            {children}
          </main>
        </StationProvider>
      </body>
    </html>
  );
}
