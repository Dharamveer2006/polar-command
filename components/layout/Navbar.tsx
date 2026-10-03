'use client';

import React, { useState, useRef, useEffect } from 'react';
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
  AlertTriangle,
  Sparkles,
  ChevronDown,
  RotateCcw,
  Snowflake,
  Wind,
  ZapOff,
  CalendarClock,
  Play,
  Pause,
  Wifi,
  WifiOff,
  Flame
} from 'lucide-react';
import { ActiveScenarios, ConnectivityStatus } from '@/types';

export default function Navbar() {
  const pathname = usePathname();
  const { 
    currentStationId, 
    setCurrentStationId, 
    currentUser, 
    setCurrentUser, 
    allUsers, 
    stationState,
    activeInjectedEvents,
    toggleInjectedEvent,
    triggerFullCascade,
    resetAllEvents,
    isRealtimeActive,
    setIsRealtimeActive,
    connectivity,
    setConnectivity,
    derived
  } = useStation();

  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const demoRef = useRef<HTMLDivElement>(null);

  // Close demo popover on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (demoRef.current && !demoRef.current.contains(event.target as Node)) {
        setIsDemoOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { href: '/overview', label: 'Aspects' },
    { href: '/dashboard', label: 'Command' },
    { href: '/digital-twin', label: 'Spatial Twin' },
    { href: '/environment', label: 'Environment' },
    { href: '/energy', label: 'Energy' },
    { href: '/infrastructure', label: 'Infrastructure' },
    { href: '/logistics', label: 'Logistics' },
    { href: '/simulator', label: 'What-If' },
    { 
      href: '/alerts', 
      label: 'Alerts', 
      badge: stationState.activeAlerts.length 
    },
    { href: '/reports', label: 'Reports' },
  ];

  const criticalCount = stationState.activeAlerts.filter(a => a.severity === 'critical').length;
  const warningCount = stationState.activeAlerts.filter(a => a.severity === 'warning').length;

  const activeScenariosCount = Object.values(activeInjectedEvents).filter(Boolean).length;
  const healthValue = derived?.overallHealthScore ?? stationState.healthScore.overall;

  return (
    <header className="sticky top-0 z-50 bg-polar-950/95 backdrop-blur-md border-b border-polar-border shadow-md">
      {/* Primary Compact Command Header Bar */}
      <div className="px-4 py-2 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
        {/* Left Side: Brand & Station Switcher */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 flex items-center justify-center">
              <Compass className="w-4 h-4 text-cyan-300 group-hover:rotate-45 transition-transform duration-300" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-black text-sm tracking-wider text-white">POLAR COMMAND</span>
              <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
                SIH26060
              </span>
            </div>
          </Link>

          {/* Station Switcher (Maitri / Bharati) */}
          <div className="flex items-center bg-polar-900 border border-polar-border rounded-lg p-0.5">
            <button
              onClick={() => setCurrentStationId('maitri')}
              className={`px-2.5 py-1 text-[11px] rounded transition-all flex items-center gap-1.5 ${
                currentStationId === 'maitri'
                  ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/40 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Radio className={`w-3 h-3 ${currentStationId === 'maitri' ? 'animate-pulse text-cyan-400' : 'text-slate-500'}`} />
              MAITRI
            </button>
            <button
              onClick={() => setCurrentStationId('bharati')}
              className={`px-2.5 py-1 text-[11px] rounded transition-all flex items-center gap-1.5 ${
                currentStationId === 'bharati'
                  ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/40 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Radio className={`w-3 h-3 ${currentStationId === 'bharati' ? 'animate-pulse text-cyan-400' : 'text-slate-500'}`} />
              BHARATI
            </button>
          </div>
        </div>

        {/* Center: Visually Light Navigation Links */}
        <nav className="hidden xl:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-polar-800 text-cyan-300 border border-cyan-500/40 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-polar-900'
                }`}
              >
                <span>{link.label}</span>
                {typeof link.badge === 'number' && link.badge > 0 && (
                  <span className={`px-1 py-0.2 rounded-full text-[9px] font-bold ${
                    criticalCount > 0 ? 'bg-rose-600 text-white animate-pulse' : 'bg-amber-600 text-white'
                  }`}>
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Side: Health, Alerts, Compact Demo Controller, Role */}
        <div className="flex items-center gap-2.5">
          {/* Station Health Glance */}
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-polar-900 border border-polar-border">
            <span className="text-slate-400 text-[10px] uppercase font-bold">Health:</span>
            <span className={`font-bold ${
              healthValue >= 80 ? 'text-emerald-400' :
              healthValue >= 60 ? 'text-amber-400' : 'text-rose-400'
            }`}>
              {healthValue}%
            </span>
            <span className="text-slate-600">|</span>
            {criticalCount > 0 ? (
              <span className="text-rose-400 text-[10px] font-bold animate-pulse">
                {criticalCount} CRIT
              </span>
            ) : warningCount > 0 ? (
              <span className="text-amber-400 text-[10px] font-bold">
                {warningCount} WARN
              </span>
            ) : (
              <span className="text-emerald-400 text-[10px] flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Nominal
              </span>
            )}
          </div>

          {/* ============================================================== */}
          {/* COMPACT DEMO CONTROLLER POPOVER (#3 IN USER SPEC)               */}
          {/* ============================================================== */}
          <div className="relative" ref={demoRef}>
            <button
              onClick={() => setIsDemoOpen(!isDemoOpen)}
              className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all border ${
                activeScenariosCount > 0
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm animate-pulse'
                  : 'bg-polar-900 hover:bg-polar-800 text-cyan-300 border-polar-border'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-current" />
              <span>DEMO MODE</span>
              {activeScenariosCount > 0 && (
                <span className="px-1.5 py-0.2 rounded bg-amber-500 text-polar-950 font-black text-[9px]">
                  {activeScenariosCount}
                </span>
              )}
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {/* Compact Popover Menu */}
            {isDemoOpen && (
              <div className="absolute right-0 mt-2 w-80 p-3 bg-polar-950 border border-polar-border rounded-xl shadow-2xl z-50 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="font-bold text-white uppercase text-[11px] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    Inject Stress Scenarios
                  </span>
                  <button
                    onClick={resetAllEvents}
                    className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1"
                    title="Reset all to nominal"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset
                  </button>
                </div>

                {/* 4 Composable Scenario Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Cold Snap */}
                  <button
                    onClick={() => toggleInjectedEvent('extremeCold')}
                    className={`p-2 rounded-lg border text-left flex flex-col justify-between transition-all ${
                      activeInjectedEvents.extremeCold
                        ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200'
                        : 'bg-polar-900 border-polar-border text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[10px] uppercase">Cold Snap</span>
                      <Snowflake className="w-3 h-3 text-cyan-400" />
                    </div>
                    <span className="text-[9px] text-slate-400 mt-1">-12°C HVAC draw</span>
                  </button>

                  {/* Blizzard */}
                  <button
                    onClick={() => toggleInjectedEvent('highWind')}
                    className={`p-2 rounded-lg border text-left flex flex-col justify-between transition-all ${
                      activeInjectedEvents.highWind
                        ? 'bg-sky-950/80 border-sky-400 text-sky-200'
                        : 'bg-polar-900 border-polar-border text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[10px] uppercase">Blizzard</span>
                      <Wind className="w-3 h-3 text-sky-400" />
                    </div>
                    <span className="text-[9px] text-slate-400 mt-1">+45 km/h Katabatic</span>
                  </button>

                  {/* Generator 2 Failure */}
                  <button
                    onClick={() => toggleInjectedEvent('generator2Failure')}
                    className={`p-2 rounded-lg border text-left flex flex-col justify-between transition-all ${
                      activeInjectedEvents.generator2Failure
                        ? 'bg-rose-950/80 border-rose-400 text-rose-200'
                        : 'bg-polar-900 border-polar-border text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[10px] uppercase">Gen #2 Trip</span>
                      <ZapOff className="w-3 h-3 text-rose-400" />
                    </div>
                    <span className="text-[9px] text-slate-400 mt-1">-190kW microgrid</span>
                  </button>

                  {/* Resupply Delay */}
                  <button
                    onClick={() => toggleInjectedEvent('resupplyDelay')}
                    className={`p-2 rounded-lg border text-left flex flex-col justify-between transition-all ${
                      activeInjectedEvents.resupplyDelay
                        ? 'bg-amber-950/80 border-amber-400 text-amber-200'
                        : 'bg-polar-900 border-polar-border text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[10px] uppercase">Resupply Delay</span>
                      <CalendarClock className="w-3 h-3 text-amber-400" />
                    </div>
                    <span className="text-[9px] text-slate-400 mt-1">+12d sea-ice lock</span>
                  </button>
                </div>

                {/* Macro Actions: Full Cascade & Reset */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/10">
                  <button
                    onClick={triggerFullCascade}
                    className="py-1.5 px-2 rounded bg-rose-600/30 hover:bg-rose-600/40 text-rose-200 border border-rose-500/50 font-bold text-[10px] flex items-center justify-center gap-1"
                  >
                    <Flame className="w-3 h-3 text-rose-400" /> Full Cascade
                  </button>
                  <button
                    onClick={resetAllEvents}
                    className="py-1.5 px-2 rounded bg-polar-900 hover:bg-polar-800 text-slate-300 border border-polar-border font-bold text-[10px] flex items-center justify-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3 text-slate-400" /> Reset Nominal
                  </button>
                </div>

                {/* Telemetry Drift & Link Simulation Controls */}
                <div className="pt-2 border-t border-white/10 space-y-2 text-[10px]">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Coupled Realtime Drift:</span>
                    <button
                      onClick={() => setIsRealtimeActive(!isRealtimeActive)}
                      className={`px-2 py-0.5 rounded font-bold flex items-center gap-1 ${
                        isRealtimeActive ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-polar-900 text-slate-400'
                      }`}
                    >
                      {isRealtimeActive ? <Play className="w-2.5 h-2.5 fill-current" /> : <Pause className="w-2.5 h-2.5 fill-current" />}
                      {isRealtimeActive ? 'STREAMING' : 'PAUSED'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-slate-400">
                    <span>Satellite Link:</span>
                    <div className="flex gap-1">
                      {(['CONNECTED', 'INTERMITTENT', 'DISCONNECTED'] as ConnectivityStatus[]).map(status => (
                        <button
                          key={status}
                          onClick={() => setConnectivity(status)}
                          className={`px-1.5 py-0.5 rounded font-bold text-[9px] ${
                            connectivity === status
                              ? status === 'CONNECTED' ? 'bg-emerald-600 text-white' :
                                status === 'INTERMITTENT' ? 'bg-amber-600 text-white' : 'bg-rose-600 text-white'
                              : 'bg-polar-900 text-slate-400 hover:text-white'
                          }`}
                        >
                          {status === 'CONNECTED' ? 'ONLINE' : status === 'INTERMITTENT' ? 'INT' : 'OFF'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Role Switcher (RBAC) */}
          <div className="flex items-center gap-1.5 bg-polar-900 border border-polar-border px-2.5 py-1 rounded-lg">
            <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400 text-[10px] hidden md:inline">ROLE:</span>
            <select
              value={currentUser.id}
              onChange={(e) => {
                const user = allUsers.find(u => u.id === e.target.value);
                if (user) setCurrentUser(user);
              }}
              className="bg-transparent text-white font-mono text-xs focus:outline-none cursor-pointer font-medium"
            >
              {allUsers.map(user => (
                <option key={user.id} value={user.id} className="bg-polar-950 text-white">
                  {user.role}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Lightweight Secondary Navigation Bar for mobile / smaller screens */}
      <div className="xl:hidden px-4 py-1 flex items-center gap-1 overflow-x-auto border-t border-white/5 scrollbar-none font-mono text-[11px]">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`px-2 py-0.5 rounded whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-polar-800 text-cyan-300 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {link.label}
              {typeof link.badge === 'number' && link.badge > 0 && ` (${link.badge})`}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
