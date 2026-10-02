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
    <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-sky-100 text-sky-800 border border-sky-200 font-mono font-bold">
          <Sparkles className="w-3.5 h-3.5 text-sky-600" />
          5-Min Demo Controller:
        </span>

        {/* Extreme Cold Injection */}
        <button
          onClick={() => toggleInjectedEvent('extremeCold')}
          className={`px-2.5 py-1 rounded flex items-center gap-1.5 font-mono transition-all border ${
            activeInjectedEvents.extremeCold
              ? 'bg-sky-600 text-white border-sky-700 shadow-sm font-bold'
              : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
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
              ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm font-bold'
              : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
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
              ? 'bg-rose-600 text-white border-rose-700 shadow-sm font-bold'
              : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
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
              ? 'bg-amber-600 text-white border-amber-700 shadow-sm font-bold'
              : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
          }`}
          title="Delay MV Vasiliy Golovnin by 12 days, reducing safety stock buffer"
        >
          <CalendarClock className="w-3.5 h-3.5" />
          Resupply Delay (+12d)
        </button>

        {/* Reset Nominal */}
        <button
          onClick={resetAllEvents}
          className="px-2.5 py-1 rounded bg-white hover:bg-slate-100 text-slate-600 border border-slate-300 flex items-center gap-1 font-mono transition-all"
          title="Clear all injected anomalies and return to baseline steady state"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Nominal
        </button>
      </div>

      {/* Real-time Ticker Toggle & Network Connectivity Simulator */}
      <div className="flex items-center gap-3 font-mono text-xs">
        {/* Play/Pause Telemetry Stream */}
        <button
          onClick={() => setIsRealtimeActive(!isRealtimeActive)}
          className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition-all border ${
            isRealtimeActive
              ? 'bg-white border-emerald-300 text-emerald-700 hover:bg-emerald-50'
              : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'
          }`}
        >
          {isRealtimeActive ? (
            <>
              <Play className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
              <span>Telemetry LIVE</span>
            </>
          ) : (
            <>
              <Pause className="w-3.5 h-3.5 text-slate-500 fill-slate-500" />
              <span>Paused</span>
            </>
          )}
        </button>

        {/* Network Degrade Simulator */}
        <div className="flex items-center bg-white border border-slate-300 rounded-lg p-0.5 text-[11px]">
          <button
            onClick={() => setConnectivity('CONNECTED')}
            className={`px-2 py-0.5 rounded flex items-center gap-1 transition-all ${
              connectivity === 'CONNECTED' ? 'bg-emerald-100 text-emerald-800 font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Signal className="w-3 h-3 text-emerald-600" /> Online
          </button>
          <button
            onClick={() => setConnectivity('INTERMITTENT')}
            className={`px-2 py-0.5 rounded flex items-center gap-1 transition-all ${
              connectivity === 'INTERMITTENT' ? 'bg-amber-100 text-amber-800 font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <SignalLow className="w-3 h-3 text-amber-600" /> Intermittent
          </button>
          <button
            onClick={() => setConnectivity('DISCONNECTED')}
            className={`px-2 py-0.5 rounded flex items-center gap-1 transition-all ${
              connectivity === 'DISCONNECTED' ? 'bg-rose-100 text-rose-800 font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <SignalZero className="w-3 h-3 text-rose-600" /> Edge Offline
          </button>
        </div>
      </div>
    </div>
  );
}
