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
  X,
  Activity,
  Shield,
  Signal,
  SignalLow,
  SignalZero,
  Cpu
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
    { href: '/dashboard', label: 'Command', icon: Compass },
    { href: '/digital-twin', label: 'Spatial Twin', icon: Layers },
    { href: '/environment', label: 'Environment', icon: CloudSun },
    { href: '/energy', label: 'Energy', icon: Zap },
    { href: '/infrastructure', label: 'Infrastructure', icon: Wrench },
    { href: '/logistics', label: 'Logistics', icon: Package },
    { href: '/simulator', label: 'What-If', icon: SlidersHorizontal },
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

  const activeScenariosCount = Object.values(activeInjectedEvents).filter(Boolean).length;
  const healthValue = derived?.overallHealthScore ?? stationState.healthScore.overall;

  return (
    <header className="sticky top-0 z-50 bg-[rgba(248,252,255,0.85)] dark:bg-[rgba(8,36,58,0.88)] backdrop-blur-xl border-b border-white/70 shadow-[0_4px_24px_rgba(8,36,58,0.06)] transition-all duration-300 text-[#0F2740]">
      {/* Top Accent Tech Bar */}
      <div className="h-[2px] w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-400 opacity-80" />

      {/* Primary Command Navigation Bar */}
      <div className="max-w-[1920px] mx-auto px-3 sm:px-5 py-2 flex items-center justify-between gap-3 font-mono">
        
        {/* ============================================================== */}
        {/* LEFT SECTION: Brand Logo & Station Switcher                    */}
        {/* ============================================================== */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {/* Logo & Platform Badge */}
          <Link 
            href="/dashboard" 
            className="group flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-white/80 transition-all duration-200"
            title="POLAR COMMAND - Antarctic Digital Twin Platform"
          >
            <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 text-[#007A9E] border border-cyan-400/50 flex items-center justify-center shadow-xs group-hover:shadow-[0_0_16px_rgba(0,184,230,0.45)] group-hover:border-cyan-400 transition-all duration-300">
              <Compass className="w-4 h-4 text-[#007A9E] group-hover:rotate-90 transition-transform duration-500" />
              <div className="absolute inset-0 rounded-xl border border-cyan-400/30 animate-pulse pointer-events-none" />
            </div>
            
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-sans font-black text-sm tracking-wider text-[#0F2740] group-hover:text-cyan-800 transition-colors">
                  POLAR COMMAND
                </span>
                <span className="text-[9px] uppercase px-1.5 py-0.5 rounded-md bg-gradient-to-r from-cyan-100 to-sky-100 text-[#006A8C] border border-cyan-300/80 font-bold tracking-tight shadow-xs">
                  SIH26060
                </span>
              </div>
              <span className="text-[9px] text-[#475569] font-mono tracking-tight hidden sm:inline-block">
                ANTARCTIC DIGITAL TWIN
              </span>
            </div>
          </Link>

          {/* Station Selector Segmented Capsule */}
          <div className="flex items-center p-1 bg-white/80 border border-slate-300/80 rounded-xl shadow-xs gap-1">
            <button
              onClick={() => setCurrentStationId('maitri')}
              aria-label="Switch to Maitri Station"
              title="Switch to Maitri Station (70°45′57″S, 11°44′09″E - Schirmacher Oasis)"
              className={`px-3 py-1 text-xs rounded-lg transition-all duration-200 flex items-center gap-1.5 font-bold ${
                currentStationId === 'maitri'
                  ? 'bg-gradient-to-r from-cyan-500/20 to-sky-500/25 text-[#005B77] border border-cyan-400/60 shadow-xs scale-[1.02]'
                  : 'text-[#475569] hover:text-[#0F2740] hover:bg-slate-100/70'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${currentStationId === 'maitri' ? 'bg-cyan-500 animate-pulse shadow-[0_0_8px_#00b8e6]' : 'bg-slate-300'}`} />
              <span>MAITRI</span>
              <span className="text-[9px] font-normal opacity-70 hidden md:inline">MTR</span>
            </button>

            <button
              onClick={() => setCurrentStationId('bharati')}
              aria-label="Switch to Bharati Station"
              title="Switch to Bharati Station (69°24′28″S, 76°11′14″E - Larsemann Hills)"
              className={`px-3 py-1 text-xs rounded-lg transition-all duration-200 flex items-center gap-1.5 font-bold ${
                currentStationId === 'bharati'
                  ? 'bg-gradient-to-r from-cyan-500/20 to-sky-500/25 text-[#005B77] border border-cyan-400/60 shadow-xs scale-[1.02]'
                  : 'text-[#475569] hover:text-[#0F2740] hover:bg-slate-100/70'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${currentStationId === 'bharati' ? 'bg-cyan-500 animate-pulse shadow-[0_0_8px_#00b8e6]' : 'bg-slate-300'}`} />
              <span>BHARATI</span>
              <span className="text-[9px] font-normal opacity-70 hidden md:inline">BHR</span>
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* CENTER SECTION: Primary Desktop Navigation Links (>= 1536px)    */}
        {/* ============================================================== */}
        <nav className="hidden 2xl:flex items-center gap-1.5">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`group px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center gap-2 relative ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 via-sky-500/15 to-blue-500/20 text-[#005B77] border border-cyan-400/60 shadow-xs font-bold'
                    : 'text-[#36546D] hover:text-[#0F2740] hover:bg-white/90 hover:border-slate-300/80 border border-transparent hover:-translate-y-0.5 hover:shadow-xs'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-115 ${
                  isActive ? 'text-[#007A9E]' : 'text-slate-400 group-hover:text-cyan-600'
                }`} />
                <span>{link.label}</span>
                
                {typeof link.badge === 'number' && link.badge > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold shadow-xs ${
                    criticalCount > 0 
                      ? 'bg-rose-600 text-white animate-pulse shadow-[0_0_10px_rgba(229,57,53,0.5)]' 
                      : 'bg-amber-600 text-white'
                  }`}>
                    {link.badge}
                  </span>
                )}

                {/* Subtle active tab under-glow dot */}
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-0.5 rounded-full bg-cyan-500 shadow-[0_0_6px_#00b8e6]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* ============================================================== */}
        {/* RIGHT SECTION: Mission Telemetry, Demo Trigger, RBAC Role       */}
        {/* ============================================================== */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          
          {/* Station Health & Warnings Header Segment */}
          <div className="hidden sm:flex items-center gap-1.5 p-1 rounded-xl bg-white/85 border border-slate-300/85 shadow-xs text-[#0F2740]">
            {/* Health Overview Pill - Clickable to Dashboard */}
            <Link
              href="/dashboard"
              title={`Station Health: ${healthValue}% • Click to view Command Overview`}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-slate-100/90 text-[#0F2740] transition-all cursor-pointer group/health"
            >
              <Activity className="w-3.5 h-3.5 text-cyan-600 group-hover/health:scale-110 transition-transform" />
              <div className="flex items-center gap-1 text-xs">
                <span className="text-[#475569] text-[10px] font-semibold uppercase">Health:</span>
                <span className={`font-bold font-mono ${
                  healthValue >= 80 ? 'text-emerald-700' :
                  healthValue >= 60 ? 'text-amber-700' : 'text-rose-700'
                }`}>
                  {healthValue}%
                </span>
              </div>
            </Link>
            
            <span className="text-slate-300 select-none">|</span>
            
            {/* WARNING SECTION - Clickable to redirect directly to Warning Section */}
            {criticalCount > 0 ? (
              <Link
                href="/alerts?severity=critical#warning-alerts"
                title={`${criticalCount} Critical Incidents • Click to redirect to Critical Incidents section`}
                aria-label={`${criticalCount} Critical Incidents. Click to redirect to Critical Incidents section.`}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-100/90 hover:bg-rose-200 border border-rose-300 text-rose-800 text-[10px] font-bold font-mono transition-all duration-200 cursor-pointer shadow-xs hover:shadow-[0_0_10px_rgba(225,29,72,0.3)] hover:scale-105 active:scale-95 animate-pulse"
              >
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                <span>{criticalCount} CRIT</span>
              </Link>
            ) : warningCount > 0 ? (
              <Link
                href="/alerts?severity=warning#warning-alerts"
                title={`${warningCount} Active Warnings • Click to redirect to Warning section`}
                aria-label={`${warningCount} Active Warnings. Click to redirect to Warning section.`}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-900 text-[10px] font-bold font-mono transition-all duration-200 cursor-pointer shadow-xs hover:shadow-[0_0_10px_rgba(245,158,11,0.35)] hover:scale-105 active:scale-95"
              >
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shadow-[0_0_6px_#f59e0b]" />
                <span>{warningCount} WARN</span>
              </Link>
            ) : (
              <Link
                href="/alerts"
                title="All Subsystems Nominal • Click to view Alerts"
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-emerald-700 hover:bg-emerald-50 text-[10px] font-semibold transition-all cursor-pointer font-mono"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Nominal</span>
              </Link>
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
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all duration-200 border text-xs ${
                activeScenariosCount > 0
                  ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-900 border-amber-500/60 shadow-xs animate-pulse'
                  : 'bg-white/85 hover:bg-white text-[#0F2740] border-slate-300/85 hover:border-cyan-400 hover:shadow-[0_0_12px_rgba(0,184,230,0.2)] hover:-translate-y-0.5'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-600 animate-spin-slow" />
              <span className="hidden sm:inline">DEMO MODE</span>
              <span className="sm:hidden">DEMO</span>
              {activeScenariosCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-md bg-amber-500 text-white font-black text-[9px] shadow-xs">
                  {activeScenariosCount}
                </span>
              )}
              <ChevronDown className={`w-3 h-3 text-[#36546D] transition-transform duration-200 ${isDemoOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Compact Popover Menu with Solid Opaque Background & Rich Cards */}
            {isDemoOpen && (
              <>
                {/* Backdrop dismiss layer */}
                <div 
                  className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px] z-40 transition-opacity"
                  onClick={() => setIsDemoOpen(false)}
                />

                <div 
                  className="absolute right-0 mt-2.5 w-[360px] max-w-[calc(100vw-1.5rem)] p-4 bg-white border border-slate-200/90 rounded-2xl shadow-2xl z-50 space-y-3.5 font-mono text-xs text-[#0F2740] transition-all"
                  style={{ backgroundColor: '#ffffff', opacity: 1 }}
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <span className="font-bold text-[#0F2740] uppercase text-xs flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-cyan-600" />
                      Inject Stress Scenarios
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={resetAllEvents}
                        className="text-[10px] text-[#36546D] hover:text-[#0F2740] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center gap-1 font-semibold transition-colors shadow-xs"
                        title="Reset all scenarios to nominal"
                      >
                        <RotateCcw className="w-3 h-3" /> Reset
                      </button>
                      <button
                        onClick={() => setIsDemoOpen(false)}
                        className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                        title="Close popover"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* 4 Composable Scenario Buttons (Clean Box / Flex Styling) */}
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Cold Snap */}
                    <button
                      onClick={() => toggleInjectedEvent('extremeCold')}
                      className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 ${
                        activeInjectedEvents.extremeCold
                          ? 'bg-cyan-600 border-cyan-700 text-white shadow-md font-bold'
                          : 'bg-slate-50 hover:bg-white border-slate-200 text-[#36546D] hover:border-cyan-400 hover:text-[#0F2740] hover:shadow-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[10px] uppercase">Cold Snap</span>
                        <Snowflake className={`w-3.5 h-3.5 ${activeInjectedEvents.extremeCold ? 'text-white' : 'text-cyan-600'}`} />
                      </div>
                      <span className={`text-[9px] mt-1.5 ${activeInjectedEvents.extremeCold ? 'text-cyan-100' : 'text-slate-500'}`}>-12°C HVAC draw</span>
                    </button>

                    {/* Blizzard */}
                    <button
                      onClick={() => toggleInjectedEvent('highWind')}
                      className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 ${
                        activeInjectedEvents.highWind
                          ? 'bg-sky-600 border-sky-700 text-white shadow-md font-bold'
                          : 'bg-slate-50 hover:bg-white border-slate-200 text-[#36546D] hover:border-sky-400 hover:text-[#0F2740] hover:shadow-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[10px] uppercase">Blizzard</span>
                        <Wind className={`w-3.5 h-3.5 ${activeInjectedEvents.highWind ? 'text-white' : 'text-sky-600'}`} />
                      </div>
                      <span className={`text-[9px] mt-1.5 ${activeInjectedEvents.highWind ? 'text-sky-100' : 'text-slate-500'}`}>+45 km/h Katabatic</span>
                    </button>

                    {/* Generator 2 Failure */}
                    <button
                      onClick={() => toggleInjectedEvent('generator2Failure')}
                      className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 ${
                        activeInjectedEvents.generator2Failure
                          ? 'bg-rose-600 border-rose-700 text-white shadow-md font-bold animate-pulse'
                          : 'bg-slate-50 hover:bg-white border-slate-200 text-[#36546D] hover:border-rose-400 hover:text-[#0F2740] hover:shadow-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[10px] uppercase">Gen #2 Trip</span>
                        <ZapOff className={`w-3.5 h-3.5 ${activeInjectedEvents.generator2Failure ? 'text-white' : 'text-rose-600'}`} />
                      </div>
                      <span className={`text-[9px] mt-1.5 ${activeInjectedEvents.generator2Failure ? 'text-rose-100' : 'text-slate-500'}`}>-190kW microgrid</span>
                    </button>

                    {/* Resupply Delay */}
                    <button
                      onClick={() => toggleInjectedEvent('resupplyDelay')}
                      className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 ${
                        activeInjectedEvents.resupplyDelay
                          ? 'bg-amber-600 border-amber-700 text-white shadow-md font-bold'
                          : 'bg-slate-50 hover:bg-white border-slate-200 text-[#36546D] hover:border-amber-400 hover:text-[#0F2740] hover:shadow-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[10px] uppercase">Resupply Delay</span>
                        <CalendarClock className={`w-3.5 h-3.5 ${activeInjectedEvents.resupplyDelay ? 'text-white' : 'text-amber-600'}`} />
                      </div>
                      <span className={`text-[9px] mt-1.5 ${activeInjectedEvents.resupplyDelay ? 'text-amber-100' : 'text-slate-500'}`}>+12d sea-ice lock</span>
                    </button>
                  </div>

                  {/* Macro Actions: Full Cascade & Reset */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                    <button
                      onClick={triggerFullCascade}
                      className="py-2 px-3 rounded-xl bg-gradient-to-r from-rose-50 to-orange-50 hover:from-rose-100 hover:to-orange-100 text-rose-800 border border-rose-200 font-bold text-[10px] flex items-center justify-center gap-1.5 shadow-xs transition-all hover:scale-[1.02]"
                    >
                      <Flame className="w-3.5 h-3.5 text-rose-600" /> Full Cascade
                    </button>
                    <button
                      onClick={resetAllEvents}
                      className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0F2740] border border-slate-300 font-bold text-[10px] flex items-center justify-center gap-1.5 shadow-xs transition-all hover:scale-[1.02]"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-slate-500" /> Reset Nominal
                    </button>
                  </div>

                  {/* Telemetry Drift & Link Simulation Controls */}
                  <div className="pt-2 border-t border-slate-100 space-y-2.5 text-[10px]">
                    <div className="flex items-center justify-between text-[#36546D]">
                      <span className="font-semibold flex items-center gap-1">
                        <Activity className="w-3 h-3 text-cyan-600" />
                        Coupled Realtime Drift:
                      </span>
                      <button
                        onClick={() => setIsRealtimeActive(!isRealtimeActive)}
                        aria-label={isRealtimeActive ? "Pause Realtime Telemetry Drift" : "Resume Realtime Telemetry Drift"}
                        title={isRealtimeActive ? "Pause Realtime Telemetry Drift" : "Resume Realtime Telemetry Drift"}
                        className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all shadow-xs ${
                          isRealtimeActive 
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-300' 
                            : 'bg-slate-100 text-[#36546D] border border-slate-200'
                        }`}
                      >
                        {isRealtimeActive ? <Play className="w-2.5 h-2.5 fill-current text-emerald-600" /> : <Pause className="w-2.5 h-2.5 fill-current text-slate-500" />}
                        {isRealtimeActive ? 'STREAMING' : 'PAUSED'}
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[#36546D]">
                      <span className="font-semibold flex items-center gap-1">
                        <Signal className="w-3 h-3 text-cyan-600" />
                        Satellite Link:
                      </span>
                      <div className="flex gap-1">
                        {(['CONNECTED', 'INTERMITTENT', 'DISCONNECTED'] as ConnectivityStatus[]).map(status => (
                          <button
                            key={status}
                            onClick={() => setConnectivity(status)}
                            className={`px-2 py-0.5 rounded-md font-bold text-[9px] transition-all ${
                              connectivity === status
                                ? status === 'CONNECTED' ? 'bg-emerald-600 text-white shadow-xs' :
                                  status === 'INTERMITTENT' ? 'bg-amber-600 text-white shadow-xs' : 'bg-rose-600 text-white shadow-xs'
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
          <div className="flex items-center gap-1.5 bg-white/80 border border-slate-300/80 px-2.5 py-1.5 rounded-xl shadow-xs text-[#0F2740] transition-all hover:bg-white hover:border-cyan-400">
            <UserCheck className="w-3.5 h-3.5 text-cyan-600" />
            <span className="text-[#475569] text-[10px] hidden md:inline font-semibold">ROLE:</span>
            <select
              value={currentUser.id}
              onChange={(e) => {
                const user = allUsers.find(u => u.id === e.target.value);
                if (user) setCurrentUser(user);
              }}
              className="bg-transparent text-[#0F2740] font-mono text-xs focus:outline-none cursor-pointer font-bold pr-1"
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
      <div className="2xl:hidden px-3 sm:px-4 py-1.5 flex items-center gap-1 overflow-x-auto border-t border-slate-200/80 scrollbar-none font-mono text-[11px] bg-white/40">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/20 to-sky-500/20 text-[#005B77] border border-cyan-400/50 font-bold shadow-xs'
                  : 'text-[#36546D] hover:text-[#0F2740] hover:bg-white/80'
              }`}
            >
              <Icon className={`w-3 h-3 ${isActive ? 'text-[#007A9E]' : 'text-slate-400'}`} />
              <span>{link.label}</span>
              {typeof link.badge === 'number' && link.badge > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                  criticalCount > 0 ? 'bg-rose-600 text-white' : 'bg-amber-600 text-white'
                }`}>
                  {link.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
