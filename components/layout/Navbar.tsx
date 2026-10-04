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
  Flame,
  X
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
    <header className="sticky top-0 z-50 bg-[rgba(245,252,255,0.78)] backdrop-blur-[18px] border-b border-white/60 shadow-sm transition-colors text-[#0F2740]">
      {/* Primary Compact Command Header Bar */}
      <div className="px-4 py-2 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
        {/* Left Side: Brand & Station Switcher */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-[#007A9E] border border-cyan-400/40 flex items-center justify-center">
              <Compass className="w-4 h-4 text-[#007A9E] group-hover:rotate-45 transition-transform duration-300" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-black text-sm tracking-wider text-[#0F2740]">POLAR COMMAND</span>
              <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-cyan-100 text-[#006A8C] border border-cyan-300 font-bold">
                SIH26060
              </span>
            </div>
          </Link>

          {/* Station Switcher (Maitri / Bharati) */}
          <div className="flex items-center bg-white/70 border border-slate-300/80 rounded-lg p-0.5 shadow-xs">
            <button
              onClick={() => setCurrentStationId('maitri')}
              aria-label="Switch to Maitri Station"
              title="Switch to Maitri Station (Schirmacher Oasis)"
              className={`px-2.5 py-1 text-[11px] rounded transition-all flex items-center gap-1.5 ${
                currentStationId === 'maitri'
                  ? 'bg-cyan-500/20 text-[#006A8C] border border-cyan-400/50 font-bold shadow-xs'
                  : 'text-[#36546D] hover:text-[#0F2740]'
              }`}
            >
              <Radio className={`w-3 h-3 ${currentStationId === 'maitri' ? 'animate-pulse text-[#008BB5]' : 'text-slate-400'}`} />
              MAITRI
            </button>
            <button
              onClick={() => setCurrentStationId('bharati')}
              aria-label="Switch to Bharati Station"
              title="Switch to Bharati Station (Larsemann Hills)"
              className={`px-2.5 py-1 text-[11px] rounded transition-all flex items-center gap-1.5 ${
                currentStationId === 'bharati'
                  ? 'bg-cyan-500/20 text-[#006A8C] border border-cyan-400/50 font-bold shadow-xs'
                  : 'text-[#36546D] hover:text-[#0F2740]'
              }`}
            >
              <Radio className={`w-3 h-3 ${currentStationId === 'bharati' ? 'animate-pulse text-[#008BB5]' : 'text-slate-400'}`} />
              BHARATI
            </button>
          </div>
        </div>

        {/* Center: Visually Light Navigation Links (>=1536 Desktop Full Nav) */}
        <nav className="hidden 2xl:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-cyan-500/20 text-[#006A8C] border border-cyan-400/50 font-bold shadow-xs'
                    : 'text-[#36546D] hover:text-[#0F2740] hover:bg-white/60'
                }`}
              >
                <span>{link.label}</span>
                {typeof link.badge === 'number' && link.badge > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
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
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white/70 border border-slate-300/80 shadow-xs text-[#0F2740]">
            <span className="text-[#36546D] text-[10px] uppercase font-bold">Health:</span>
            <span className={`font-bold ${
              healthValue >= 80 ? 'text-emerald-700' :
              healthValue >= 60 ? 'text-amber-700' : 'text-rose-700'
            }`}>
              {healthValue}%
            </span>
            <span className="text-slate-300">|</span>
            {criticalCount > 0 ? (
              <span className="text-rose-700 text-[10px] font-bold animate-pulse">
                {criticalCount} CRIT
              </span>
            ) : warningCount > 0 ? (
              <span className="text-amber-700 text-[10px] font-bold">
                {warningCount} WARN
              </span>
            ) : (
              <span className="text-emerald-700 text-[10px] flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Nominal
              </span>
            )}
          </div>

          {/* ============================================================== */}
          {/* COMPACT DEMO CONTROLLER POPOVER (#3 IN USER SPEC)               */}
          {/* ============================================================== */}
          <div className="relative" ref={demoRef}>
            <button
              onClick={() => setIsDemoOpen(!isDemoOpen)}
              aria-label="Open Demo Scenarios & Stress Testing Menu"
              title="Open Demo Scenarios & Stress Testing Menu"
              className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all border ${
                activeScenariosCount > 0
                  ? 'bg-amber-500/20 text-amber-900 border-amber-500/50 shadow-xs animate-pulse'
                  : 'bg-white/80 hover:bg-white text-[#0F2740] border-slate-300/80 shadow-xs'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
              <span>DEMO MODE</span>
              {activeScenariosCount > 0 && (
                <span className="px-1.5 py-0.2 rounded bg-amber-500 text-white font-black text-[9px]">
                  {activeScenariosCount}
                </span>
              )}
              <ChevronDown className="w-3 h-3 text-[#36546D]" />
            </button>

            {/* Compact Popover Menu with Solid Opaque Background */}
            {isDemoOpen && (
              <>
                {/* Backdrop dismiss layer to prevent click collisions and focus user attention */}
                <div 
                  className="fixed inset-0 bg-slate-900/25 z-40"
                  onClick={() => setIsDemoOpen(false)}
                />

                <div 
                  className="absolute right-0 mt-2 w-[350px] max-w-[calc(100vw-1.5rem)] p-3.5 bg-white border-2 border-slate-300 rounded-xl shadow-2xl z-50 space-y-3 font-mono text-xs text-[#0F2740]"
                  style={{ backgroundColor: '#ffffff', opacity: 1 }}
                >
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-bold text-[#0F2740] uppercase text-[11px] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
                      Inject Stress Scenarios
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={resetAllEvents}
                        className="text-[10px] text-[#36546D] hover:text-[#0F2740] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 flex items-center gap-1 font-semibold transition-colors"
                        title="Reset all scenarios to nominal"
                      >
                        <RotateCcw className="w-3 h-3" /> Reset
                      </button>
                      <button
                        onClick={() => setIsDemoOpen(false)}
                        className="text-slate-400 hover:text-slate-700 p-0.5 rounded hover:bg-slate-100 transition-colors"
                        title="Close popover"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* 4 Composable Scenario Buttons (100% Opaque Solid Surfaces) */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* Cold Snap */}
                    <button
                      onClick={() => toggleInjectedEvent('extremeCold')}
                      className={`p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all ${
                        activeInjectedEvents.extremeCold
                          ? 'bg-cyan-600 border-cyan-700 text-white shadow-xs font-bold'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-[#36546D] hover:border-slate-400 hover:text-[#0F2740]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[10px] uppercase">Cold Snap</span>
                        <Snowflake className={`w-3 h-3 ${activeInjectedEvents.extremeCold ? 'text-white' : 'text-cyan-600'}`} />
                      </div>
                      <span className={`text-[9px] mt-1 ${activeInjectedEvents.extremeCold ? 'text-cyan-100' : 'text-slate-500'}`}>-12°C HVAC draw</span>
                    </button>

                    {/* Blizzard */}
                    <button
                      onClick={() => toggleInjectedEvent('highWind')}
                      className={`p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all ${
                        activeInjectedEvents.highWind
                          ? 'bg-sky-600 border-sky-700 text-white shadow-xs font-bold'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-[#36546D] hover:border-slate-400 hover:text-[#0F2740]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[10px] uppercase">Blizzard</span>
                        <Wind className={`w-3 h-3 ${activeInjectedEvents.highWind ? 'text-white' : 'text-sky-600'}`} />
                      </div>
                      <span className={`text-[9px] mt-1 ${activeInjectedEvents.highWind ? 'text-sky-100' : 'text-slate-500'}`}>+45 km/h Katabatic</span>
                    </button>

                    {/* Generator 2 Failure */}
                    <button
                      onClick={() => toggleInjectedEvent('generator2Failure')}
                      className={`p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all ${
                        activeInjectedEvents.generator2Failure
                          ? 'bg-rose-600 border-rose-700 text-white shadow-xs font-bold animate-pulse'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-[#36546D] hover:border-slate-400 hover:text-[#0F2740]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[10px] uppercase">Gen #2 Trip</span>
                        <ZapOff className={`w-3 h-3 ${activeInjectedEvents.generator2Failure ? 'text-white' : 'text-rose-600'}`} />
                      </div>
                      <span className={`text-[9px] mt-1 ${activeInjectedEvents.generator2Failure ? 'text-rose-100' : 'text-slate-500'}`}>-190kW microgrid</span>
                    </button>

                    {/* Resupply Delay */}
                    <button
                      onClick={() => toggleInjectedEvent('resupplyDelay')}
                      className={`p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all ${
                        activeInjectedEvents.resupplyDelay
                          ? 'bg-amber-600 border-amber-700 text-white shadow-xs font-bold'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-[#36546D] hover:border-slate-400 hover:text-[#0F2740]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[10px] uppercase">Resupply Delay</span>
                        <CalendarClock className={`w-3 h-3 ${activeInjectedEvents.resupplyDelay ? 'text-white' : 'text-amber-600'}`} />
                      </div>
                      <span className={`text-[9px] mt-1 ${activeInjectedEvents.resupplyDelay ? 'text-amber-100' : 'text-slate-500'}`}>+12d sea-ice lock</span>
                    </button>
                  </div>

                  {/* Macro Actions: Full Cascade & Reset */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200">
                    <button
                      onClick={triggerFullCascade}
                      className="py-2 px-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 font-bold text-[10px] flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                    >
                      <Flame className="w-3 h-3 text-rose-600" /> Full Cascade
                    </button>
                    <button
                      onClick={resetAllEvents}
                      className="py-2 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#0F2740] border border-slate-300 font-bold text-[10px] flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                    >
                      <RotateCcw className="w-3 h-3 text-slate-500" /> Reset Nominal
                    </button>
                  </div>

                  {/* Telemetry Drift & Link Simulation Controls */}
                  <div className="pt-2 border-t border-slate-200 space-y-2 text-[10px]">
                    <div className="flex items-center justify-between text-[#36546D]">
                      <span className="font-semibold">Coupled Realtime Drift:</span>
                      <button
                        onClick={() => setIsRealtimeActive(!isRealtimeActive)}
                        aria-label={isRealtimeActive ? "Pause Realtime Telemetry Drift" : "Resume Realtime Telemetry Drift"}
                        title={isRealtimeActive ? "Pause Realtime Telemetry Drift" : "Resume Realtime Telemetry Drift"}
                        className={`px-2 py-0.5 rounded font-bold flex items-center gap-1 ${
                          isRealtimeActive ? 'bg-cyan-100 text-[#006A8C] border border-cyan-300' : 'bg-slate-100 text-[#36546D]'
                        }`}
                      >
                        {isRealtimeActive ? <Play className="w-2.5 h-2.5 fill-current" /> : <Pause className="w-2.5 h-2.5 fill-current" />}
                        {isRealtimeActive ? 'STREAMING' : 'PAUSED'}
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[#36546D]">
                      <span className="font-semibold">Satellite Link:</span>
                      <div className="flex gap-1">
                        {(['CONNECTED', 'INTERMITTENT', 'DISCONNECTED'] as ConnectivityStatus[]).map(status => (
                          <button
                            key={status}
                            onClick={() => setConnectivity(status)}
                            className={`px-2 py-0.5 rounded font-bold text-[9px] transition-colors ${
                              connectivity === status
                                ? status === 'CONNECTED' ? 'bg-emerald-600 text-white' :
                                  status === 'INTERMITTENT' ? 'bg-amber-600 text-white' : 'bg-rose-600 text-white'
                                : 'bg-slate-100 text-[#36546D] hover:bg-slate-200'
                            }`}
                          >
                            {status === 'CONNECTED' ? 'ONLINE' : status === 'INTERMITTENT' ? 'INT' : 'OFF'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Role Switcher (RBAC) */}
          <div className="flex items-center gap-1.5 bg-white/70 border border-slate-300/80 px-2.5 py-1 rounded-lg shadow-xs text-[#0F2740]">
            <UserCheck className="w-3.5 h-3.5 text-cyan-600" />
            <span className="text-[#36546D] text-[10px] hidden md:inline font-semibold">ROLE:</span>
            <select
              value={currentUser.id}
              onChange={(e) => {
                const user = allUsers.find(u => u.id === e.target.value);
                if (user) setCurrentUser(user);
              }}
              className="bg-transparent text-[#0F2740] font-mono text-xs focus:outline-none cursor-pointer font-bold"
            >
              {allUsers.map(user => (
                <option key={user.id} value={user.id} className="bg-white text-[#0F2740]">
                  {user.role}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Lightweight Secondary Navigation Bar for mobile / smaller screens (< 1536px) */}
      <div className="2xl:hidden px-4 py-1 flex items-center gap-1 overflow-x-auto border-t border-slate-200/80 scrollbar-none font-mono text-[11px]">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`px-2 py-0.5 rounded whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-cyan-500/20 text-[#006A8C] font-bold'
                  : 'text-[#36546D] hover:text-[#0F2740]'
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
