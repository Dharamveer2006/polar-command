'use client';

import React, { useState } from 'react';
import { useStation } from '@/context/StationContext';
import { 
  Wind, 
  Thermometer, 
  Compass, 
  Eye, 
  Droplets, 
  CloudSun, 
  AlertTriangle, 
  ShieldAlert, 
  ArrowRight,
  TrendingDown,
  Info,
  Layers,
  RefreshCw,
  Radio,
  Globe2,
  Zap,
  Fuel,
  Activity,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Sliders,
  RotateCcw,
  Compass as CompassIcon,
  CloudSnow,
  Flame
} from 'lucide-react';
import TelemetryChart from '@/components/charts/TelemetryChart';
import { SatelliteLayerId, StationId } from '@/types';
import { calculateEffectiveWeather } from '@/lib/weatherEngine';

export default function EnvironmentPage() {
  const { 
    stationState, 
    allStationsState, 
    currentStationId, 
    setCurrentStationId,
    liveWeather,
    normalizedWeather,
    weatherHistory,
    isWeatherLoading,
    lastWeatherSync,
    nextWeatherSync,
    updateLiveWeather,
    activeWeatherEvents,
    satelliteMetadata,
    activeSatelliteLayer,
    setActiveSatelliteLayer,
    stationForecast,
    refreshWeather,
    connectivity,
    activeInjectedEvents,
    derived
  } = useStation();

  const [activeTab, setActiveTab] = useState<'OBSERVATION' | 'SATELLITE' | 'FORECAST'>('OBSERVATION');
  const [historyHorizon, setHistoryHorizon] = useState<'24H' | '7D'>('24H');
  const [testTempInput, setTestTempInput] = useState<number>(-21.0);
  const [testWindInput, setTestWindInput] = useState<number>(10.8); // in m/s

  const { metadata, environment } = stationState;
  const currentObs = liveWeather[currentStationId] || environment;
  const currentNorm = normalizedWeather[currentStationId];
  const stationHistory = weatherHistory[currentStationId] || [];

  // Real weather + active scenario separation (Section 9 & 11)
  const separation = calculateEffectiveWeather(currentObs, activeInjectedEvents);

  // Status mapping
  const weatherState = connectivity === 'DISCONNECTED' ? 'STALE' : (currentNorm?.status || currentObs.weatherState || 'LIVE');

  const stateBadgeMap = {
    LIVE: { bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/40', dot: 'bg-emerald-400 animate-pulse' },
    STALE: { bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-500/40', dot: 'bg-amber-400' },
    FALLBACK: { bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/40', dot: 'bg-purple-400' },
    ERROR: { bg: 'bg-rose-500/20', text: 'text-rose-300', border: 'border-rose-500/40', dot: 'bg-rose-400' }
  };

  const currentBadge = stateBadgeMap[weatherState as keyof typeof stateBadgeMap] || stateBadgeMap.LIVE;
  const activeSatMeta = satelliteMetadata[activeSatelliteLayer];

  // Handler for Section 14 test case injection (-21.0°C, 10.8 m/s)
  const handleApplySection14Test = () => {
    updateLiveWeather(currentStationId, {
      temperatureC: -21.0,
      windMs: 10.8,
      windKmh: Math.round(10.8 * 3.6),
      source: 'Observed'
    });
  };

  const handleResetToBaseline = () => {
    if (currentStationId === 'bharati') {
      updateLiveWeather('bharati', {
        temperatureC: -17.5,
        windMs: 5.2,
        windKmh: 18.7,
        source: 'Observed'
      });
    } else {
      updateLiveWeather('maitri', {
        temperatureC: -24.6,
        windMs: 10.5,
        windKmh: 37.8,
        source: 'Observed'
      });
    }
  };

  return (
    <div className="flex-1 p-4 md:p-6 space-y-5 max-w-7xl mx-auto w-full font-sans text-[#0F2740]">
      
      {/* ============================================================== */}
      {/* 1. TOP HEADER & MULTI-SOURCE PROVENANCE BAR                    */}
      {/* ============================================================== */}
      <div className="polar-card p-4 rounded-xl border border-polar-border flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-800 border border-cyan-400/30 uppercase font-bold">
              SIH26060 • POLAR WEATHER ENGINE
            </span>
            <span className="text-xs font-mono text-[#36546D]">
              Station Ground-Truth Ingestion Layer
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-[#0F2740] tracking-tight mt-1 flex items-center gap-2.5">
            POLAR WEATHER MONITOR
            <span className="text-sm font-mono px-2 py-0.5 rounded bg-cyan-50 border border-cyan-200 text-[#0F2740]">
              {metadata.name} ({currentStationId === 'bharati' ? '69°24\'S, 76°11\'E' : '70°46\'S, 11°44\'E'})
            </span>
          </h1>
          <p className="text-xs text-[#36546D] mt-1 max-w-3xl font-medium">
            Real-time multi-source weather ingestion driving the Antarctic Digital Twin. Feeds thermodynamic envelope loss, HVAC heating demand, microgrid load, and logistics resupply windows.
          </p>
        </div>

        {/* Station Switcher & Manual Refresh */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 bg-polar-950 p-1 rounded-lg border border-polar-border">
            <button
              onClick={() => setCurrentStationId('bharati')}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                currentStationId === 'bharati'
                  ? 'bg-polar-blue text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              BHARATI (69°S)
            </button>
            <button
              onClick={() => setCurrentStationId('maitri')}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                currentStationId === 'maitri'
                  ? 'bg-polar-blue text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              MAITRI (70°S)
            </button>
          </div>

          <button
            onClick={refreshWeather}
            title="Refresh weather feeds (resets 3-min countdown without high-frequency polling)"
            className="p-2 rounded-lg bg-polar-950 border border-polar-border text-slate-300 hover:text-white hover:border-polar-cyan transition-all flex items-center gap-1.5 text-xs font-mono"
          >
            <RefreshCw className="w-4 h-4 text-polar-cyan" />
            <span className="hidden sm:inline">Refresh Feeds</span>
          </button>
        </div>
      </div>

      {/* Provenance & Telemetry Metadata Banner (Sections 4, 5, 6) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono text-xs">
        {/* 1. SOURCE */}
        <div className="polar-card p-3 rounded-lg border border-polar-border">
          <span className="text-[10px] text-[#36546D] uppercase block font-semibold">SOURCE</span>
          <span className="text-sm font-bold text-cyan-800 block mt-0.5 truncate">
            {currentNorm?.source || (connectivity === 'DISCONNECTED' ? 'SYNTHETIC FALLBACK' : 'NCPOR')}
          </span>
          <span className="text-[10px] text-[#36546D] truncate block">Public AWS Ingestion</span>
        </div>

        {/* 2. STATUS */}
        <div className="polar-card p-3 rounded-lg border border-polar-border">
          <span className="text-[10px] text-[#36546D] uppercase block font-semibold">STATUS</span>
          <span className={`text-xs px-2 py-0.5 mt-1 inline-flex items-center gap-1.5 rounded border uppercase font-bold ${currentBadge.bg} ${currentBadge.text} ${currentBadge.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${currentBadge.dot}`} />
            {currentNorm?.status || weatherState}
          </span>
          <span className="text-[10px] text-[#36546D] block mt-1">Freshness Engine</span>
        </div>

        {/* 3. OBSERVED */}
        <div className="polar-card p-3 rounded-lg border border-polar-border">
          <span className="text-[10px] text-[#36546D] uppercase block font-semibold">OBSERVED</span>
          <span suppressHydrationWarning className="text-xs font-bold text-[#08243A] block mt-0.5 truncate" title={currentNorm?.observedAt || currentObs.observedAt || currentObs.lastUpdated}>
            {currentNorm?.observedAt 
              ? new Date(currentNorm.observedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' UTC'
              : currentObs.lastUpdated ? new Date(currentObs.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' UTC' : 'Recent'}
          </span>
          <span className="text-[10px] text-[#36546D] block">Antarctic Sensor Mast</span>
        </div>

        {/* 4. LAST SYNCED */}
        <div className="polar-card p-3 rounded-lg border border-polar-border">
          <span className="text-[10px] text-[#36546D] uppercase block font-semibold">LAST SYNCED</span>
          <span suppressHydrationWarning className="text-xs font-bold text-emerald-700 block mt-0.5 truncate">
            {lastWeatherSync ? new Date(lastWeatherSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Synchronized'}
          </span>
          <span className="text-[10px] text-[#36546D] block">Server Ingestion</span>
        </div>

        {/* 5. NEXT CHECK */}
        <div className="polar-card p-3 rounded-lg border border-polar-border">
          <span className="text-[10px] text-[#36546D] uppercase block font-semibold">NEXT CHECK</span>
          <span suppressHydrationWarning className="text-xs font-bold text-purple-700 block mt-0.5 truncate">
            {nextWeatherSync ? new Date(nextWeatherSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'in ~3 min'}
          </span>
          <span className="text-[10px] text-[#36546D] block">Auto-Poll (3m)</span>
        </div>

        {/* 6. LATENCY */}
        <div className="polar-card p-3 rounded-lg border border-polar-border">
          <span className="text-[10px] text-[#36546D] uppercase block font-semibold">LATENCY</span>
          <span className="text-sm font-bold text-amber-700 block mt-0.5">
            {currentNorm?.latencySeconds !== undefined ? `${currentNorm.latencySeconds}s` : (currentObs.sourceLatencySec ? `${currentObs.sourceLatencySec}s` : '42s')}
          </span>
          <span className="text-[10px] text-[#36546D] block">rcv - obs delta</span>
        </div>
      </div>

      {/* Offline / Edge Disconnection Alert (Section 12) */}
      {connectivity === 'DISCONNECTED' && (
        <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <span className="font-bold text-amber-300 uppercase block">EDGE OFFLINE MODE: LAST KNOWN OBSERVATION RETAINED</span>
              <span className="text-slate-300 text-[11px]">
                Upstream satellite and NCPOR telecommunication links severed. No synthetic readings invented. Local Digital Twin edge simulation running autonomously on station hardware.
              </span>
            </div>
          </div>
          <span className="px-2 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold shrink-0">
            STALE (T-HOLD)
          </span>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. TAB CONTROLLER: OBSERVATION | SATELLITE | FORECAST          */}
      {/* ============================================================== */}
      <div className="flex border-b border-polar-border">
        <button
          onClick={() => setActiveTab('OBSERVATION')}
          className={`px-5 py-2.5 text-xs md:text-sm font-bold uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 ${
            activeTab === 'OBSERVATION'
              ? 'border-cyan-600 text-cyan-900 bg-cyan-500/15'
              : 'border-transparent text-[#36546D] hover:text-[#0F2740]'
          }`}
        >
          <Thermometer className="w-4 h-4" />
          <span>OBSERVATION</span>
          {activeWeatherEvents.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('SATELLITE')}
          className={`px-5 py-2.5 text-xs md:text-sm font-bold uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 ${
            activeTab === 'SATELLITE'
              ? 'border-cyan-600 text-cyan-900 bg-cyan-500/15'
              : 'border-transparent text-[#36546D] hover:text-[#0F2740]'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>SATELLITE</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-800 font-bold">
            NRT
          </span>
        </button>

        <button
          onClick={() => setActiveTab('FORECAST')}
          className={`px-5 py-2.5 text-xs md:text-sm font-bold uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 ${
            activeTab === 'FORECAST'
              ? 'border-cyan-600 text-cyan-900 bg-cyan-500/15'
              : 'border-transparent text-[#36546D] hover:text-[#0F2740]'
          }`}
        >
          <CloudSun className="w-4 h-4" />
          <span>FORECAST</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-800 font-bold">
            +96H
          </span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: OBSERVATION (Ground-Truth Met Station)                 */}
      {/* ============================================================== */}
      {activeTab === 'OBSERVATION' && (
        <div className="space-y-5">
          
          {/* Active Weather Event Detection Banner (Section 7) */}
          {activeWeatherEvents.length > 0 ? (
            <div className="space-y-2">
              {activeWeatherEvents.map((evt, idx) => (
                <div 
                  key={idx}
                  className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs ${
                    evt.severity === 'critical'
                      ? 'bg-rose-50/90 border-rose-300 text-rose-950'
                      : 'bg-amber-50/90 border-amber-300 text-amber-950'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <ShieldAlert className={`w-5 h-5 shrink-0 mt-0.5 ${evt.severity === 'critical' ? 'text-rose-600' : 'text-amber-600'}`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                          evt.severity === 'critical' ? 'bg-rose-100 text-rose-900 border-rose-400' : 'bg-amber-100 text-amber-900 border-amber-400'
                        }`}>
                          WEATHER EVENT: {evt.type.replace('_', ' ')}
                        </span>
                        <span className={`text-xs font-mono font-bold uppercase ${evt.severity === 'critical' ? 'text-rose-700' : 'text-amber-700'}`}>
                          {evt.severity === 'critical' ? 'CRITICAL ALERT' : 'WARNING'}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-[#0F2740] mt-1">{evt.title}</h3>
                      <p className="text-xs text-[#36546D] mt-0.5">{evt.description}</p>
                      <p className="text-xs font-mono text-cyan-800 mt-1">
                        <strong>Operational Impact:</strong> {evt.operationalImpact}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 font-mono text-xs">
                    <span className="text-[#36546D] block text-[10px] font-semibold">RATE OF CHANGE</span>
                    <span className="font-bold text-[#08243A]">{evt.rateOfChange}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-emerald-50/90 border border-emerald-300/80 flex items-center justify-between text-xs font-mono text-emerald-900 shadow-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-bold">DETERMINISTIC EVENT DETECTOR: NO ACTIVE METEOROLOGICAL ANOMALIES DETECTED</span>
              </div>
              <span className="text-[11px] text-emerald-800/80 font-medium">Monitoring: Rapid Cooling, High Wind, Low Visibility, Pressure Drop, Blizzard Risk</span>
            </div>
          )}

          {/* Primary Weather Gauges Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* 1. Surface Air Temperature */}
            <div className="polar-card p-4 rounded-xl flex flex-col justify-between border border-polar-border shadow-xs">
              <div className="flex items-center justify-between text-[#36546D] text-xs font-mono">
                <span className="uppercase font-bold tracking-wide">Surface Air Temp</span>
                <Thermometer className="w-4 h-4 text-cyan-600" />
              </div>
              <div className="my-3">
                <div className="text-3xl font-mono font-bold text-[#08243A] tracking-tight">
                  {currentObs.temperatureC.toFixed(1)} <span className="text-lg font-normal text-cyan-700">°C</span>
                </div>
                <p className="text-xs font-mono text-[#36546D] mt-1 flex items-center gap-1">
                  <TrendingDown className="w-3.5 h-3.5 text-sky-600" /> 
                  Wind Chill: <strong className="text-[#0F2740]">{(currentObs.temperatureC - (currentObs.windKmh * 0.18)).toFixed(1)} °C</strong>
                </p>
              </div>
              <div className="pt-2 border-t border-slate-200/80 text-[11px] font-mono text-[#36546D] flex justify-between">
                <span>Threshold: -30.0 °C</span>
                <span className={currentObs.temperatureC < -25 ? 'text-amber-700 font-bold' : 'text-emerald-700 font-bold'}>
                  {currentObs.temperatureC < -25 ? 'Cold Alert' : 'Nominal'}
                </span>
              </div>
            </div>

            {/* 2. Katabatic Wind Speed (knots, km/h, and m/s per Section 3 & 6) */}
            <div className="polar-card p-4 rounded-xl flex flex-col justify-between border border-polar-border shadow-xs">
              <div className="flex items-center justify-between text-[#36546D] text-xs font-mono">
                <span className="uppercase font-bold tracking-wide">Katabatic Wind Speed</span>
                <Wind className="w-4 h-4 text-sky-600" />
              </div>
              <div className="my-3">
                <div className="text-2xl lg:text-3xl font-mono font-bold text-[#08243A] tracking-tight flex flex-wrap items-baseline gap-2">
                  <span>{currentObs.windKmh} <span className="text-base font-normal text-sky-700">km/h</span></span>
                  <span className="text-lg font-semibold text-[#36546D]">({currentNorm?.windKnots !== undefined ? currentNorm.windKnots : (currentObs.windKnots || Number((currentObs.windKmh / 1.852).toFixed(1)))} kts)</span>
                  <span className="text-xs font-normal text-[#475569]">({(currentObs.windKmh / 3.6).toFixed(1)} m/s)</span>
                </div>
                <p className="text-xs font-mono text-[#36546D] mt-1 flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5 text-[#36546D]" /> 
                  Bearing: <strong className="text-[#0F2740]">{currentObs.windDirectionDeg}° ({currentObs.windDirectionDeg > 180 ? 'SSW' : 'SE'} Gusts)</strong>
                </p>
              </div>
              <div className="pt-2 border-t border-slate-200/80 text-[11px] font-mono text-[#36546D] flex justify-between">
                <span>Gale Cutoff: 55 km/h (29.7 kts)</span>
                <span className={currentObs.windKmh >= 55 ? 'text-rose-700 font-bold' : 'text-emerald-700 font-bold'}>
                  {currentObs.windKmh >= 55 ? 'High Wind Alert' : 'Safe Window'}
                </span>
              </div>
            </div>

            {/* 3. Barometric Pressure */}
            <div className="polar-card p-4 rounded-xl flex flex-col justify-between border border-polar-border shadow-xs">
              <div className="flex items-center justify-between text-[#36546D] text-xs font-mono">
                <span className="uppercase font-bold tracking-wide">Atmospheric Pressure</span>
                <CloudSun className="w-4 h-4 text-amber-600" />
              </div>
              <div className="my-3">
                <div className="text-3xl font-mono font-bold text-[#08243A] tracking-tight">
                  {currentObs.pressureHpa.toFixed(1)} <span className="text-lg font-normal text-amber-700">hPa</span>
                </div>
                <p className="text-xs font-mono text-[#36546D] mt-1">
                  Polar trough baseline • Barometer steady
                </p>
              </div>
              <div className="pt-2 border-t border-slate-200/80 text-[11px] font-mono text-[#36546D] flex justify-between">
                <span>Cyclonic Drop Limit: -4 hPa</span>
                <span className="text-emerald-700 font-bold">Nominal</span>
              </div>
            </div>

            {/* 4. Optical Visibility & Humidity */}
            <div className="polar-card p-4 rounded-xl flex flex-col justify-between border border-polar-border shadow-xs">
              <div className="flex items-center justify-between text-[#36546D] text-xs font-mono">
                <span className="uppercase font-bold tracking-wide">Optical Visibility</span>
                <Eye className="w-4 h-4 text-purple-600" />
              </div>
              <div className="my-3">
                <div className="text-3xl font-mono font-bold text-[#08243A] tracking-tight">
                  {currentObs.visibilityKm.toFixed(1)} <span className="text-lg font-normal text-purple-700">km</span>
                </div>
                <p className="text-xs font-mono text-[#36546D] mt-1 flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5 text-[#36546D]" /> Humidity: <strong className="text-[#0F2740]">{currentObs.humidityPercent}%</strong>
                </p>
              </div>
              <div className="pt-2 border-t border-slate-200/80 text-[11px] font-mono text-[#36546D] flex justify-between">
                <span>Sortie Cutoff: 2.0 km</span>
                <span className={currentObs.visibilityKm <= 2.0 ? 'text-rose-700 font-bold' : 'text-emerald-700 font-bold'}>
                  {currentObs.visibilityKm <= 2.0 ? 'Aviation Grounded' : 'Clear Horizon'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 9: Real Weather + Active Scenario Separation Card */}
          <div className="p-4 rounded-xl bg-polar-900 border border-polar-border space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
              <div>
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-polar-cyan" />
                  REAL WEATHER + ACTIVE DEMO SCENARIO SEPARATION (SECTION 9)
                </span>
                <span className="text-[11px] font-mono text-slate-300">
                  Live observation baseline remains immutable. Active demo faults inject non-destructive offsets into the simulated twin.
                </span>
              </div>
              <span className="px-2 py-0.5 rounded bg-polar-cyan/20 text-polar-cyan text-[10px] font-mono border border-polar-cyan/30 font-semibold">
                DATA PROVENANCE SEPARATED
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
              {/* 1. Live Observation */}
              <div className="p-3 rounded-lg bg-polar-950 border border-polar-border space-y-1">
                <span className="text-[10px] text-emerald-400 uppercase font-bold block flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  1. LIVE OBSERVATION (BASELINE)
                </span>
                <div className="text-base font-bold text-white mt-1">
                  {currentObs.temperatureC.toFixed(1)}°C • {(currentObs.windKmh / 3.6).toFixed(1)} m/s
                </div>
                <div className="text-[11px] text-slate-300">
                  Wind: {currentObs.windKmh} km/h • Vis: {currentObs.visibilityKm.toFixed(1)} km
                </div>
                <div className="text-[10px] text-slate-300 pt-1 border-t border-white/10">
                  Source: <strong className="text-white">{currentObs.primarySource}</strong>
                </div>
              </div>

              {/* 2. Active Demo Scenario Offset */}
              <div className="p-3 rounded-lg bg-polar-950 border border-polar-border space-y-1">
                <span className="text-[10px] text-amber-400 uppercase font-bold block flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  2. ACTIVE DEMO SCENARIO OFFSET
                </span>
                <div className="text-base font-bold text-amber-300 mt-1">
                  {separation.activeScenarioOffset.tempOffsetC !== 0 ? `${separation.activeScenarioOffset.tempOffsetC}°C` : '0°C'} • {separation.activeScenarioOffset.windOffsetKmh > 0 ? `+${separation.activeScenarioOffset.windOffsetKmh} km/h` : '0 km/h'}
                </div>
                <div className="text-[11px] text-slate-300">
                  {activeInjectedEvents.extremeCold ? 'Cold Snap Active (-12°C)' : 'No Thermal Offset'} • {activeInjectedEvents.highWind ? 'High Wind Active (+45 km/h)' : 'Nominal Wind'}
                </div>
                <div className="text-[10px] text-slate-300 pt-1 border-t border-white/10">
                  Mode: <strong className="text-white">RUNTIME OVERLAY (BASELINE UNTOUCHED)</strong>
                </div>
              </div>

              {/* 3. Derived State */}
              <div className="p-3 rounded-lg bg-polar-950 border border-polar-border space-y-1">
                <span className="text-[10px] text-polar-cyan uppercase font-bold block flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-polar-cyan" />
                  3. DERIVED SIMULATED STATE
                </span>
                <div className="text-base font-bold text-cyan-300 mt-1">
                  {separation.effectiveWeather.temperatureC.toFixed(1)}°C • {separation.effectiveWeather.windMs} m/s
                </div>
                <div className="text-[11px] text-slate-300">
                  Effective Wind: {separation.effectiveWeather.windKmh} km/h • Wind Chill: {separation.effectiveWeather.windChillC}°C
                </div>
                <div className="text-[10px] text-slate-300 pt-1 border-t border-white/10">
                  Fed To: <strong className="text-white">DIGITAL TWIN HVAC & MICROGRID ENGINE</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Section 14: Interactive Test Case Observation Controller */}
          <div className="p-4 rounded-xl bg-polar-900 border border-polar-border space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
              <div>
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-sky-400" />
                  SECTION 14 TEST BENCH — INGEST NEW POLAR OBSERVATION & PROPAGATION
                </span>
                <span className="text-[11px] font-mono text-slate-300">
                  Verify Section 14 test case: Live baseline (-17.5°C, 5.2 m/s) → New observation (-21.0°C, 10.8 m/s) → HVAC ↑ → Demand ↑ → Fuel Burn ↑ → Fuel Runway ↓ → Risk ↑
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleApplySection14Test}
                  className="px-3 py-1.5 rounded-lg bg-polar-blue hover:bg-sky-500 text-white font-mono text-xs font-bold transition-all shadow"
                >
                  Apply Test: -21.0°C, 10.8 m/s
                </button>
                <button
                  onClick={handleResetToBaseline}
                  className="px-3 py-1.5 rounded-lg bg-polar-950 border border-polar-border hover:text-white text-slate-300 font-mono text-xs transition-all flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset Baseline
                </button>
              </div>
            </div>

            {/* Custom Observation Adjuster */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
              <div className="p-3 rounded-lg bg-polar-950 border border-polar-border space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-300 font-semibold">TEST AIR TEMPERATURE (°C):</span>
                  <span className="font-bold text-cyan-300">{testTempInput.toFixed(1)} °C</span>
                </div>
                <input
                  type="range"
                  min="-45"
                  max="-5"
                  step="0.5"
                  value={testTempInput}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setTestTempInput(val);
                    updateLiveWeather(currentStationId, { temperatureC: val });
                  }}
                  className="w-full accent-cyan-400 bg-polar-800 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-300">
                  <span>-45.0°C (Extreme Polar)</span>
                  <span>-5.0°C (Summer)</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-polar-950 border border-polar-border space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-300 font-semibold">TEST KATABATIC WIND (m/s):</span>
                  <span className="font-bold text-sky-300">{testWindInput.toFixed(1)} m/s ({(testWindInput * 3.6).toFixed(1)} km/h)</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="35"
                  step="0.5"
                  value={testWindInput}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setTestWindInput(val);
                    updateLiveWeather(currentStationId, { 
                      windMs: val,
                      windKmh: Math.round(val * 3.6)
                    });
                  }}
                  className="w-full accent-sky-400 bg-polar-800 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-300">
                  <span>2.0 m/s (Calm)</span>
                  <span>35.0 m/s (Category 3 Blizzard)</span>
                </div>
              </div>
            </div>

            {/* Downstream Propagation Live Impact Display (Section 8 & 14) */}
            <div className="p-3 rounded-lg bg-polar-950 border border-polar-border font-mono text-xs space-y-2">
              <span className="text-[10px] text-slate-300 uppercase font-bold block">
                DOWNSTREAM DIGITAL TWIN RE-EVALUATION CASCADE (REAL-TIME PROPAGATION):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-center">
                <div className="p-2 rounded bg-polar-900 border border-polar-border">
                  <span className="text-[10px] text-slate-300 block font-medium">OBSERVED TEMP</span>
                  <span className="text-sm font-bold text-cyan-300">{currentObs.temperatureC.toFixed(1)}°C</span>
                </div>
                <div className="p-2 rounded bg-polar-900 border border-polar-border">
                  <span className="text-[10px] text-slate-300 block font-medium">HVAC HEAT LOAD</span>
                  <span className="text-sm font-bold text-amber-300">{derived.heatingLoadKw} kW</span>
                </div>
                <div className="p-2 rounded bg-polar-900 border border-polar-border">
                  <span className="text-[10px] text-slate-300 block font-medium">TOTAL DEMAND</span>
                  <span className="text-sm font-bold text-white">{derived.totalDemandKw} kW</span>
                </div>
                <div className="p-2 rounded bg-polar-900 border border-polar-border">
                  <span className="text-[10px] text-slate-300 block font-medium">DAILY FUEL BURN</span>
                  <span className="text-sm font-bold text-sky-300">{derived.dailyFuelBurnLitres} L/d</span>
                </div>
                <div className="p-2 rounded bg-polar-900 border border-polar-border">
                  <span className="text-[10px] text-slate-300 block font-medium">FUEL RUNWAY</span>
                  <span className={`text-sm font-bold ${derived.fuelRunwayDays < 14 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {derived.fuelRunwayDays.toFixed(1)} days
                  </span>
                </div>
                <div className="p-2 rounded bg-polar-900 border border-polar-border">
                  <span className="text-[10px] text-slate-300 block font-medium">CROSS-DOMAIN RISK</span>
                  <span className={`text-sm font-bold uppercase ${
                    derived.crossDomainRisk === 'critical' ? 'text-rose-400' :
                    derived.crossDomainRisk === 'warning' ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {derived.crossDomainRisk}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Continuous Historical Met Trend Chart (Section 13) */}
          <div className="polar-card p-5 rounded-xl space-y-3 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
              <span className="text-xs font-mono font-bold text-[#0F2740] uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-700" />
                HISTORICAL OBSERVATIONS TREND ({historyHorizon} HORIZON)
              </span>
              <div className="flex items-center gap-1 bg-polar-950 p-1 rounded-lg border border-polar-border font-mono text-xs">
                <button
                  onClick={() => setHistoryHorizon('24H')}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                    historyHorizon === '24H'
                      ? 'bg-polar-blue text-white shadow'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  24H Trend
                </button>
                <button
                  onClick={() => setHistoryHorizon('7D')}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                    historyHorizon === '7D'
                      ? 'bg-polar-blue text-white shadow'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  7D Trend
                </button>
              </div>
            </div>

            <TelemetryChart
              title={`${historyHorizon} Synoptic Meteorological Trend • ${metadata.name}`}
              data={stationHistory.length > 0 ? (
                historyHorizon === '24H'
                  ? stationHistory.slice(0, 24).reverse().map(h => ({
                      time: new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                      temperature: h.temperatureC,
                      windSpeed: h.windKmh,
                      pressure: h.pressureHpa,
                    }))
                  : stationHistory.slice(0, 48).reverse().map(h => ({
                      time: new Date(h.timestamp).toLocaleDateString([], { weekday: 'short', hour: '2-digit' }),
                      temperature: h.temperatureC,
                      windSpeed: h.windKmh,
                      pressure: h.pressureHpa,
                    }))
              ) : []}
              series={[
                { key: 'temperature', label: 'Air Temp (°C)', color: '#00f0ff' },
                { key: 'windSpeed', label: 'Wind Velocity (km/h)', color: '#38bdf8' },
              ]}
              height={220}
            />
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: SATELLITE (Antarctic Map & Multi-Spectral Imagery)     */}
      {/* ============================================================== */}
      {activeTab === 'SATELLITE' && (
        <div className="space-y-5">
          
          {/* Layer Selector Bar */}
          <div className="polar-card p-4 rounded-xl border border-polar-border flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-700" />
              <div>
                <h3 className="text-sm font-bold text-[#0F2740] uppercase tracking-wider">
                  ANTARCTIC NEAR-REAL-TIME SATELLITE IMAGERY
                </h3>
                <p className="text-xs text-[#36546D]">
                  Switch multispectral satellite raster layers. Station markers represent Indian Antarctic Research Bases.
                </p>
              </div>
            </div>

            {/* Layer Switcher Buttons */}
            <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
              {(Object.keys(satelliteMetadata) as SatelliteLayerId[]).map((layerKey) => {
                const meta = satelliteMetadata[layerKey];
                const isActive = activeSatelliteLayer === layerKey;
                return (
                  <button
                    key={layerKey}
                    onClick={() => setActiveSatelliteLayer(layerKey)}
                    className={`px-3 py-1.5 rounded-lg border font-semibold transition-all ${
                      isActive
                        ? 'bg-polar-navy border-polar-cyan text-white shadow-md'
                        : 'bg-polar-950 border-polar-border text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>{meta.layerName.split('(')[0]}</span>
                    {isActive && <span className="ml-1 text-[10px] text-polar-cyan">●</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Antarctic Polar Stereographic Map Canvas */}
          <div className="polar-card p-5 rounded-xl border border-polar-border relative overflow-hidden min-h-[480px] flex flex-col justify-between">
            
            {/* Map Canvas Background with Dynamic Imagery Shader */}
            <div className="absolute inset-0 bg-[#040d1a] flex items-center justify-center overflow-hidden">
              
              {/* Polar Grid (Meridians & Parallels) */}
              <svg className="w-full h-full opacity-30 pointer-events-none" viewBox="0 0 800 600">
                <circle cx="400" cy="300" r="260" fill="none" stroke="#00f0ff" strokeWidth="0.5" strokeDasharray="3,3" />
                <circle cx="400" cy="300" r="180" fill="none" stroke="#00f0ff" strokeWidth="0.75" />
                <circle cx="400" cy="300" r="100" fill="none" stroke="#00f0ff" strokeWidth="0.5" strokeDasharray="3,3" />
                <circle cx="400" cy="300" r="20" fill="#00f0ff" fillOpacity="0.2" stroke="#00f0ff" strokeWidth="1" />
                
                {/* Longitude spokes */}
                <line x1="400" y1="40" x2="400" y2="560" stroke="#00f0ff" strokeWidth="0.4" strokeDasharray="2,4" />
                <line x1="140" y1="300" x2="660" y2="300" stroke="#00f0ff" strokeWidth="0.4" strokeDasharray="2,4" />
                <line x1="216" y1="116" x2="584" y2="484" stroke="#00f0ff" strokeWidth="0.4" strokeDasharray="2,4" />
                <line x1="216" y1="484" x2="584" y2="116" stroke="#00f0ff" strokeWidth="0.4" strokeDasharray="2,4" />

                {/* Antarctic Continent Path (EPSG:3031 Polar Stereographic outline) */}
                <path 
                  d="M 370 120 
                     C 420 125, 490 145, 540 180 
                     C 590 220, 620 270, 615 330 
                     C 610 390, 560 440, 510 470 
                     C 460 500, 400 510, 350 490 
                     C 310 475, 270 450, 240 400 
                     C 210 350, 220 280, 250 220 
                     C 280 170, 330 115, 370 120 Z" 
                  fill={
                    activeSatelliteLayer === 'true-color' ? '#0f2942' :
                    activeSatelliteLayer === 'infrared' ? '#21123b' :
                    activeSatelliteLayer === 'clouds' ? '#143350' : '#0b314a'
                  }
                  stroke={
                    activeSatelliteLayer === 'true-color' ? '#38bdf8' :
                    activeSatelliteLayer === 'infrared' ? '#f43f5e' :
                    activeSatelliteLayer === 'clouds' ? '#c084fc' : '#22d3ee'
                  }
                  strokeWidth="1.5"
                  className="transition-colors duration-700"
                />

                {/* Ronne-Filchner Ice Shelf Inset */}
                <path d="M 280 200 C 310 220, 320 260, 310 280 Z" fill="#1b4d75" opacity="0.6" />
                {/* Ross Ice Shelf Inset */}
                <path d="M 450 420 C 420 400, 440 360, 480 370 Z" fill="#1b4d75" opacity="0.6" />
                {/* Amery Ice Shelf Inset (near Bharati) */}
                <path d="M 520 240 C 510 260, 490 270, 480 250 Z" fill="#1b4d75" opacity="0.7" />

                {/* Layer Specific Graphic Effects */}
                {activeSatelliteLayer === 'infrared' && (
                  <g opacity="0.5">
                    <circle cx="490" cy="220" r="35" fill="url(#ir-gradient)" />
                    <circle cx="360" cy="180" r="45" fill="url(#ir-gradient)" />
                    <defs>
                      <radialGradient id="ir-gradient">
                        <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.8" />
                        <stop offset="60%" stopColor="#8b5cf6" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                      </radialGradient>
                    </defs>
                  </g>
                )}

                {activeSatelliteLayer === 'clouds' && (
                  <g opacity="0.4">
                    <path d="M 180 180 Q 300 120 420 160 T 600 240" stroke="#ffffff" strokeWidth="24" strokeLinecap="round" opacity="0.3" fill="none" filter="blur(8px)" />
                    <path d="M 220 380 Q 380 460 520 360" stroke="#ffffff" strokeWidth="32" strokeLinecap="round" opacity="0.25" fill="none" filter="blur(12px)" />
                  </g>
                )}
              </svg>

              {/* Station Markers on Antarctic Coordinates */}
              
              {/* MAITRI STATION (Queen Maud Land: 70°46'S, 11°44'E) */}
              <div 
                onClick={() => setCurrentStationId('maitri')}
                className="absolute top-[28%] left-[45%] -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20"
              >
                <div className="relative flex items-center justify-center">
                  <span className="w-8 h-8 rounded-full bg-cyan-400/20 animate-ping absolute" />
                  <span className="w-4 h-4 rounded-full bg-polar-cyan border-2 border-white shadow-[0_0_12px_#00f0ff] relative z-10" />
                </div>
                
                {/* Station Tag */}
                <div className={`mt-2 px-2.5 py-1 rounded-lg backdrop-blur-md border text-center transition-all ${
                  currentStationId === 'maitri'
                    ? 'bg-polar-navy/95 border-polar-cyan text-white shadow-lg'
                    : 'bg-polar-950/80 border-polar-border text-slate-300 group-hover:border-polar-cyan'
                }`}>
                  <span className="text-xs font-bold block">MAITRI (70°S)</span>
                  <span className="text-[10px] font-mono text-cyan-300">
                    {liveWeather.maitri?.temperatureC.toFixed(1)}°C • {liveWeather.maitri?.windKmh} km/h
                  </span>
                  <span className="text-[9px] font-mono text-slate-400 block">70°46&apos;S, 11°44&apos;E</span>
                </div>
              </div>

              {/* BHARATI STATION (Larsemann Hills: 69°24'S, 76°11'E) */}
              <div 
                onClick={() => setCurrentStationId('bharati')}
                className="absolute top-[38%] left-[64%] -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20"
              >
                <div className="relative flex items-center justify-center">
                  <span className="w-8 h-8 rounded-full bg-sky-400/20 animate-ping absolute" />
                  <span className="w-4 h-4 rounded-full bg-sky-400 border-2 border-white shadow-[0_0_12px_#38bdf8] relative z-10" />
                </div>
                
                {/* Station Tag */}
                <div className={`mt-2 px-2.5 py-1 rounded-lg backdrop-blur-md border text-center transition-all ${
                  currentStationId === 'bharati'
                    ? 'bg-polar-navy/95 border-polar-cyan text-white shadow-lg'
                    : 'bg-polar-950/80 border-polar-border text-slate-300 group-hover:border-polar-cyan'
                }`}>
                  <span className="text-xs font-bold block">BHARATI (69°S)</span>
                  <span className="text-[10px] font-mono text-sky-300">
                    {liveWeather.bharati?.temperatureC.toFixed(1)}°C • {liveWeather.bharati?.windKmh} km/h
                  </span>
                  <span className="text-[9px] font-mono text-slate-400 block">69°24&apos;S, 76°11&apos;E</span>
                </div>
              </div>

              {/* South Pole (Amundsen-Scott Reference) */}
              <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-60 text-center font-mono">
                <span className="w-2 h-2 rounded-full bg-white/60 mx-auto block" />
                <span className="text-[9px] text-slate-400 mt-1 block">SOUTH POLE 90°S</span>
              </div>
            </div>

            {/* Overlaid Satellite Header Info */}
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg bg-polar-950/80 backdrop-blur-md border border-polar-border text-xs font-mono">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-polar-cyan animate-pulse" />
                <span className="font-bold text-white uppercase">
                  {activeSatMeta.satelliteName} — {activeSatMeta.layerName}
                </span>
              </div>
              <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                <span>Status: <strong className="text-emerald-400">{activeSatMeta.status}</strong></span>
                <span>•</span>
                <span>Latency: <strong className="text-white">{activeSatMeta.latency}</strong></span>
                <span>•</span>
                <span>Projection: <strong className="text-white">EPSG:3031</strong></span>
              </div>
            </div>

            {/* Overlaid Bottom Legend & Attribution */}
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg bg-polar-950/80 backdrop-blur-md border border-polar-border text-[11px] font-mono mt-auto">
              <div className="flex items-center gap-2 text-slate-400">
                <Info className="w-3.5 h-3.5 text-sky-400" />
                <span>Source: <strong>{activeSatMeta.source}</strong> • Resolution: {activeSatMeta.resolution}</span>
              </div>
              <div className="text-slate-400">
                Orbital Swath: Daily Revisit • EPSG:3031 Polar Stereographic
              </div>
            </div>
          </div>

          {/* Satellite Technical Specifications Table */}
          <div className="polar-card p-4 rounded-xl border border-polar-border font-mono text-xs space-y-2 shadow-xs">
            <span className="text-[10px] text-[#36546D] uppercase font-bold block">
              ORBITAL SATELLITE MULTI-SPECTRAL SENSOR INGESTION SPECIFICATIONS:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-polar-900 border border-polar-border">
                <span className="text-polar-cyan font-bold block">Terra & Aqua MODIS</span>
                <span className="text-[11px] text-slate-400 block mt-1">True-color RGB surface reflectance. Monitors sea ice fracturing, pack ice drift, and coastal polynya openings around Prydz Bay.</span>
              </div>
              <div className="p-3 rounded-lg bg-polar-900 border border-polar-border">
                <span className="text-rose-400 font-bold block">NOAA-21 VIIRS (Band M15)</span>
                <span className="text-[11px] text-slate-400 block mt-1">Thermal Infrared (10.7µm). Provides continuous night-time brightness temperature across the 6-month Antarctic polar night.</span>
              </div>
              <div className="p-3 rounded-lg bg-polar-900 border border-polar-border">
                <span className="text-purple-400 font-bold block">Suomi NPP VIIRS</span>
                <span className="text-[11px] text-slate-400 block mt-1">Cloud Top Pressure & Moisture. Tracks frontal cyclonic polar lows propagating inland from the Southern Ocean.</span>
              </div>
              <div className="p-3 rounded-lg bg-polar-900 border border-polar-border">
                <span className="text-sky-400 font-bold block">DMSP SSMIS & AMSR2 (NISE)</span>
                <span className="text-[11px] text-slate-400 block mt-1">Passive Microwave Sea Ice concentration. Determines navigable ice channels for Indian expedition resupply vessels.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: FORECAST (ECMWF Multi-Horizon + Microgrid Coupling)     */}
      {/* ============================================================== */}
      {activeTab === 'FORECAST' && (
        <div className="space-y-5">
          
          {/* Forecast Header & Model Provenance Banner */}
          <div className="polar-card p-4 rounded-xl border border-polar-border flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-purple-100 text-purple-900 border border-purple-300 uppercase font-bold">
                  ECMWF HRES 0.1° INTEGRATED FORECASTING SYSTEM
                </span>
                <span className="text-xs font-mono text-[#36546D]">00Z Global Cycle</span>
              </div>
              <h2 className="text-lg font-bold text-[#0F2740] mt-1">
                Polar Microclimate Forecast Horizons (+6H to +96H)
              </h2>
              <p className="text-xs text-[#36546D] font-mono mt-0.5">
                Deterministic atmospheric forecast driving predictive heating demand calculations and logistics window validation.
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-polar-900 border border-polar-border font-mono text-xs text-right">
              <span className="text-[10px] text-slate-300 block">MODEL PROVENANCE</span>
              <span className="text-purple-300 font-bold">ECMWF IFS Cycle 48r1</span>
              <span className="text-[10px] text-slate-300 block">Calibrated Physical Model (No arbitrary confidence %)</span>
            </div>
          </div>

          {/* Multi-Horizon Cards Grid (+6H, +12H, +24H, +48H, +72H, +96H) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 font-mono text-xs">
            {stationForecast.map((f, i) => (
              <div key={i} className="polar-card p-4 rounded-xl border border-polar-border flex flex-col justify-between space-y-3 shadow-xs">
                
                {/* Horizon Header */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-purple-900 bg-purple-100 px-2 py-0.5 rounded border border-purple-300">
                      {f.horizon}
                    </span>
                    <span className="text-[11px] text-[#36546D]">
                      {new Date(f.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} UTC
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                    f.blizzardProbability > 50 ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                    f.blizzardProbability > 20 ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                    'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  }`}>
                    Blizzard: {f.blizzardProbability}%
                  </span>
                </div>

                {/* Weather Metrics */}
                <div className="grid grid-cols-2 gap-2 my-1">
                  <div>
                    <span className="text-[10px] text-[#36546D] block uppercase font-semibold">Temperature</span>
                    <span className="text-xl font-bold text-cyan-800 font-mono">{f.temperatureC.toFixed(1)} °C</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#36546D] block uppercase font-semibold">Katabatic Wind</span>
                    <span className="text-xl font-bold text-sky-800 font-mono">{f.windKmh} km/h</span>
                    <span className="text-[10px] text-[#475569] block font-mono">({f.windMs} m/s)</span>
                  </div>
                </div>

                <div className="text-[11px] text-[#0F2740] bg-cyan-50/80 p-2 rounded border border-cyan-200">
                  <span className="text-[#36546D] text-[10px] uppercase block font-semibold">Condition</span>
                  <span className="font-bold text-[#08243A]">{f.condition}</span>
                </div>

                {/* DIGITAL TWIN PHYSICAL COUPLING LINK */}
                <div className="pt-2 border-t border-slate-200 space-y-1">
                  <span className="text-[10px] text-amber-800 uppercase font-bold block flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-600" />
                    PROJECTED DIGITAL TWIN LOAD:
                  </span>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#36546D]">HVAC Heating Draw:</span>
                    <strong className="text-[#08243A]">{f.projectedHeatingLoadKw} kW</strong>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#36546D]">Fuel Burn Impact:</span>
                    <strong className="text-sky-800 font-bold">+{Math.round((f.projectedHeatingLoadKw - 135) * 0.24 * 24)} L/day</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Forecast Physical Propagation Rule Card */}
          <div className="p-4 rounded-xl bg-polar-900 border border-polar-border font-mono text-xs space-y-2">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">
              ATMOSPHERIC PREDICTION → STATION AUTONOMY PROPAGATION RULES:
            </span>
            <p className="text-slate-300 text-[11px]">
              Every 1.0°C decrease in ambient temperature below -15°C escalates station envelope conductive thermal leakage by <strong>+2.3 kW</strong>. 
              Katabatic gusts above 55 km/h accelerate exterior convective stripping, requiring pre-heating of fuel lines and engaging secondary glycol heat exchangers. 
              Forecast horizons allow station engineers to adjust diesel generator scheduling up to 48 hours prior to blizzard onset.
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
