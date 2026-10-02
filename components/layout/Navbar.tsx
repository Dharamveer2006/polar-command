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
    { href: '/digital-twin', label: 'Digital Twin (2D)', icon: Layers },
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
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      {/* Top Banner Bar */}
      <div className="px-4 py-2 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-sky-600 p-0.5 shadow-sm flex items-center justify-center">
              <Compass className="w-5 h-5 text-white group-hover:rotate-45 transition-transform duration-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-sm tracking-wider text-slate-900">POLAR COMMAND</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-200 font-bold">
                  SIH26060
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-sans tracking-tight">
                NCPOR • India Antarctic Research Stations Twin
              </p>
            </div>
          </Link>

          {/* Station Switcher (Maitri / Bharati) */}
          <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg p-0.5">
            <button
              onClick={() => setCurrentStationId('maitri')}
              className={`px-3 py-1 text-xs font-mono rounded-md transition-all flex items-center gap-1.5 ${
                currentStationId === 'maitri'
                  ? 'bg-sky-600 text-white font-bold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${currentStationId === 'maitri' ? 'animate-pulse text-white' : 'text-slate-400'}`} />
              MAITRI
              <span className="text-[10px] opacity-80 font-normal">70°S 11°E</span>
            </button>
            <button
              onClick={() => setCurrentStationId('bharati')}
              className={`px-3 py-1 text-xs font-mono rounded-md transition-all flex items-center gap-1.5 ${
                currentStationId === 'bharati'
                  ? 'bg-sky-600 text-white font-bold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${currentStationId === 'bharati' ? 'animate-pulse text-white' : 'text-slate-400'}`} />
              BHARATI
              <span className="text-[10px] opacity-80 font-normal">69°S 76°E</span>
            </button>
          </div>
        </div>

        {/* Station Telemetry Status & Role Switcher */}
        <div className="flex items-center gap-4 text-xs font-mono">
          {/* Health quick glance */}
          <div className="hidden md:flex items-center gap-3 px-3 py-1 rounded-lg bg-slate-100 border border-slate-200">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 text-[11px] font-semibold">HEALTH:</span>
              <span className={`font-bold ${
                stationState.healthScore.overall >= 80 ? 'text-emerald-700' :
                stationState.healthScore.overall >= 60 ? 'text-amber-700' : 'text-rose-700'
              }`}>
                {stationState.healthScore.overall}%
              </span>
            </div>
            <div className="h-3 w-px bg-slate-300" />
            <div className="flex items-center gap-2">
              {criticalCount > 0 && (
                <span className="px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 border border-rose-300 text-[10px] font-bold">
                  {criticalCount} CRIT
                </span>
              )}
              {warningCount > 0 && (
                <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-bold">
                  {warningCount} WARN
                </span>
              )}
              {criticalCount === 0 && warningCount === 0 && (
                <span className="text-emerald-700 text-[11px] font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Nominal
                </span>
              )}
            </div>
          </div>

          {/* Role Switcher (RBAC) */}
          <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">
            <UserCheck className="w-3.5 h-3.5 text-sky-600" />
            <span className="text-slate-500 text-[11px] font-semibold">ROLE:</span>
            <select
              value={currentUser.id}
              onChange={(e) => {
                const user = allUsers.find(u => u.id === e.target.value);
                if (user) setCurrentUser(user);
              }}
              className="bg-transparent text-slate-900 font-mono text-xs focus:outline-none cursor-pointer font-medium"
            >
              {allUsers.map(user => (
                <option key={user.id} value={user.id} className="bg-white text-slate-900">
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
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-sky-50 text-sky-700 border border-sky-200 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-sky-600' : 'text-slate-400'}`} />
              <span>{link.label}</span>
              {typeof link.badge === 'number' && link.badge > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  criticalCount > 0 ? 'bg-rose-600 text-white animate-pulse' : 'bg-amber-500 text-white'
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
