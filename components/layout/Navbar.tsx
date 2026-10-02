'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useStation } from '@/context/StationContext';
import { 
  Compass, 
  Layers, 
  CloudSun, 
  Zap, 
  Wrench, 
  Package, 
  SlidersHorizontal, 
  Bell, 
  FileText, 
  UserCheck, 
  Radio, 
  CheckCircle2, 
  AlertCircle
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { 
    currentStationId, 
    setCurrentStationId, 
    currentUser, 
    setCurrentUser, 
    allUsers, 
    stationState, 
    lastSyncTime 
  } = useStation();

  const navLinks = [
    { href: '/dashboard', label: 'Command Center', icon: Compass },
    { href: '/digital-twin', label: 'Digital Twin', icon: Layers },
    { href: '/environment', label: 'Environment', icon: CloudSun },
    { href: '/energy', label: 'Energy', icon: Zap },
    { href: '/infrastructure', label: 'Infrastructure', icon: Wrench },
    { href: '/logistics', label: 'Logistics', icon: Package },
    { href: '/simulator', label: 'What-If Simulator', icon: SlidersHorizontal },
    { 
      href: '/alerts', 
      label: 'Alerts', 
      icon: Bell, 
      badge: stationState.activeAlerts.length 
    },
    { href: '/reports', label: 'Reports', icon: FileText },
  ];

  const criticalCount = stationState.activeAlerts.filter(a => a.severity === 'critical').length;
  const warningCount = stationState.activeAlerts.filter(a => a.severity === 'warning').length;

  return (
    <header className="sticky top-0 z-50 bg-polar-950/95 backdrop-blur-md border-b border-polar-border">
      {/* Top Banner Bar */}
      <div className="px-4 py-2.5 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-sky-400 p-0.5 shadow-lg shadow-cyan-500/20">
              <div className="w-full h-full bg-polar-950 rounded-[7px] flex items-center justify-center">
                <Compass className="w-5 h-5 text-polar-ice group-hover:rotate-45 transition-transform duration-300" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-sm tracking-wider text-white">POLAR COMMAND</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  SIH26060
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-sans tracking-tight">
                NCPOR • India Antarctic Research Stations Twin
              </p>
            </div>
          </Link>

          {/* Station Switcher (Maitri / Bharati) */}
          <div className="flex items-center bg-polar-900 border border-polar-border rounded-lg p-1">
            <button
              onClick={() => setCurrentStationId('maitri')}
              className={`px-3 py-1 text-xs font-mono rounded-md transition-all flex items-center gap-1.5 ${
                currentStationId === 'maitri'
                  ? 'bg-polar-accent text-polar-950 font-bold shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-polar-800'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${currentStationId === 'maitri' ? 'animate-pulse text-polar-950' : 'text-slate-400'}`} />
              MAITRI
              <span className="text-[10px] opacity-75 font-normal">70°S 11°E</span>
            </button>
            <button
              onClick={() => setCurrentStationId('bharati')}
              className={`px-3 py-1 text-xs font-mono rounded-md transition-all flex items-center gap-1.5 ${
                currentStationId === 'bharati'
                  ? 'bg-polar-accent text-polar-950 font-bold shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-polar-800'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${currentStationId === 'bharati' ? 'animate-pulse text-polar-950' : 'text-slate-400'}`} />
              BHARATI
              <span className="text-[10px] opacity-75 font-normal">69°S 76°E</span>
            </button>
          </div>
        </div>

        {/* Station Telemetry Status & Role Switcher */}
        <div className="flex items-center gap-4 text-xs font-mono">
          {/* Health quick glance */}
          <div className="hidden md:flex items-center gap-3 px-3 py-1 rounded bg-polar-900/80 border border-polar-border/40">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-[11px]">HEALTH:</span>
              <span className={`font-bold ${
                stationState.healthScore.overall >= 80 ? 'text-emerald-400' :
                stationState.healthScore.overall >= 60 ? 'text-amber-400' : 'text-rose-400'
              }`}>
                {stationState.healthScore.overall}%
              </span>
            </div>
            <div className="h-3 w-px bg-slate-700" />
            <div className="flex items-center gap-2">
              {criticalCount > 0 && (
                <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px]">
                  {criticalCount} CRIT
                </span>
              )}
              {warningCount > 0 && (
                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px]">
                  {warningCount} WARN
                </span>
              )}
              {criticalCount === 0 && warningCount === 0 && (
                <span className="text-emerald-400 text-[11px] flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Nominal
                </span>
              )}
            </div>
          </div>

          {/* Role Switcher (RBAC) */}
          <div className="flex items-center gap-1.5 bg-polar-900 border border-polar-border px-2.5 py-1 rounded-lg">
            <UserCheck className="w-3.5 h-3.5 text-polar-ice" />
            <span className="text-slate-400 text-[11px]">ROLE:</span>
            <select
              value={currentUser.id}
              onChange={(e) => {
                const user = allUsers.find(u => u.id === e.target.value);
                if (user) setCurrentUser(user);
              }}
              className="bg-transparent text-white font-mono text-xs focus:outline-none cursor-pointer"
            >
              {allUsers.map(user => (
                <option key={user.id} value={user.id} className="bg-polar-900 text-white">
                  {user.role} ({user.name.split(' ')[0]})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Navigation Sub-bar */}
      <nav className="px-4 flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-polar-700/80 text-polar-ice border border-polar-ice/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-polar-800/60'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-polar-ice' : 'text-slate-500'}`} />
              <span>{link.label}</span>
              {typeof link.badge === 'number' && link.badge > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  criticalCount > 0 ? 'bg-rose-500 text-white animate-pulse' : 'bg-amber-500 text-polar-950'
                }`}>
                  {link.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
