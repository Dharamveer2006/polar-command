'use client';

import React from 'react';
import { useStation } from '@/context/StationContext';
import { 
  Snowflake, 
  Wind, 
  ZapOff, 
  CalendarClock, 
  RotateCcw, 
  Play, 
  Pause, 
  Signal, 
  SignalLow, 
  SignalZero,
  Sparkles
} from 'lucide-react';

export default function DemoScenarioToolbar() {
  const { 
    activeInjectedEvents, 
    toggleInjectedEvent, 
    resetAllEvents, 
    isRealtimeActive, 
    setIsRealtimeActive,
    connectivity,
    setConnectivity,
    stationState
  } = useStation();

  return (
    <div className="bg-polar-900/90 border-b border-polar-border/60 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-polar-ice/10 text-polar-ice border border-polar-ice/20 font-mono font-medium">
          <Sparkles className="w-3.5 h-3.5" />
          5-Min Demo Controller:
        </span>

        {/* Extreme Cold Injection */}
        <button
          onClick={() => toggleInjectedEvent('extremeCold')}
          className={`px-2.5 py-1 rounded flex items-center gap-1.5 font-mono transition-all border ${
            activeInjectedEvents.extremeCold
              ? 'bg-sky-600 text-white border-sky-400 shadow-md shadow-sky-600/30 font-bold'
              : 'bg-polar-800/80 hover:bg-polar-700/80 text-slate-300 border-slate-700'
          }`}
          title="Drop temperature by 12 C, escalating HVAC and energy demand"
        >
          <Snowflake className="w-3.5 h-3.5" />
          Cold Snap (-12°C)
        </button>

        {/* High Wind / Blizzard Injection */}
        <button
          onClick={() => toggleInjectedEvent('highWind')}
          className={`px-2.5 py-1 rounded flex items-center gap-1.5 font-mono transition-all border ${
            activeInjectedEvents.highWind
              ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30 font-bold'
              : 'bg-polar-800/80 hover:bg-polar-700/80 text-slate-300 border-slate-700'
          }`}
          title="Boost wind to 85+ km/h, reducing visibility and triggering Katabatic alert"
        >
          <Wind className="w-3.5 h-3.5" />
          Blizzard (+45 km/h)
        </button>

        {/* Generator 2 Failure Injection */}
        <button
          onClick={() => toggleInjectedEvent('generator2Failure')}
          className={`px-2.5 py-1 rounded flex items-center gap-1.5 font-mono transition-all border ${
            activeInjectedEvents.generator2Failure
              ? 'bg-rose-600 text-white border-rose-400 shadow-md shadow-rose-600/30 font-bold'
              : 'bg-polar-800/80 hover:bg-polar-700/80 text-slate-300 border-slate-700'
          }`}
          title="Trip Generator #2, causing immediate 190kW deficit and battery discharge"
        >
          <ZapOff className="w-3.5 h-3.5" />
          Trip Gen #2
        </button>

        {/* Resupply Delay Injection */}
        <button
          onClick={() => toggleInjectedEvent('resupplyDelay')}
          className={`px-2.5 py-1 rounded flex items-center gap-1.5 font-mono transition-all border ${
            activeInjectedEvents.resupplyDelay
              ? 'bg-amber-600 text-white border-amber-400 shadow-md shadow-amber-600/30 font-bold'
              : 'bg-polar-800/80 hover:bg-polar-700/80 text-slate-300 border-slate-700'
          }`}
          title="Delay MV Vasiliy Golovnin by 12 days, reducing fuel reserve buffer"
        >
          <CalendarClock className="w-3.5 h-3.5" />
          Resupply Delay (+12d)
        </button>

        {/* Reset */}
        <button
          onClick={resetAllEvents}
          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 flex items-center gap-1 font-mono transition-all"
          title="Reset station to baseline nominal state"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Nominal
        </button>
      </div>

      <div className="flex items-center gap-3">
        {/* Realtime Stream Toggle */}
        <button
          onClick={() => setIsRealtimeActive(!isRealtimeActive)}
          className={`px-2 py-1 rounded flex items-center gap-1 font-mono text-[11px] border ${
            isRealtimeActive
              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
              : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}
          title="Toggle automatic telemetry streaming"
        >
          {isRealtimeActive ? <Play className="w-3 h-3 text-emerald-400" /> : <Pause className="w-3 h-3" />}
          {isRealtimeActive ? 'Telemetry LIVE' : 'Telemetry PAUSED'}
        </button>

        {/* Satellite Connection Selector */}
        <div className="flex items-center gap-1 bg-polar-950/70 p-0.5 rounded border border-polar-border/40 font-mono text-[11px]">
          <button
            onClick={() => setConnectivity('CONNECTED')}
            className={`px-2 py-0.5 rounded flex items-center gap-1 ${
              connectivity === 'CONNECTED' ? 'bg-emerald-600 text-white font-medium' : 'text-slate-400 hover:text-white'
            }`}
            title="Connected via GSAT Satellite Ku-Band"
          >
            <Signal className="w-3 h-3" />
            Online
          </button>
          <button
            onClick={() => setConnectivity('INTERMITTENT')}
            className={`px-2 py-0.5 rounded flex items-center gap-1 ${
              connectivity === 'INTERMITTENT' ? 'bg-amber-600 text-white font-medium' : 'text-slate-400 hover:text-white'
            }`}
            title="Intermittent / High Latency link"
          >
            <SignalLow className="w-3 h-3" />
            Intermittent
          </button>
          <button
            onClick={() => setConnectivity('DISCONNECTED')}
            className={`px-2 py-0.5 rounded flex items-center gap-1 ${
              connectivity === 'DISCONNECTED' ? 'bg-rose-600 text-white font-medium' : 'text-slate-400 hover:text-white'
            }`}
            title="Full offline edge mode"
          >
            <SignalZero className="w-3 h-3" />
            Edge Offline
          </button>
        </div>
      </div>
    </div>
  );
}
