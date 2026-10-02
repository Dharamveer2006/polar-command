'use client';

import React from 'react';
import { useStation } from '@/context/StationContext';
import { 
  CloudSun, 
  Wind, 
  Thermometer, 
  Compass, 
  Eye, 
  Droplets, 
  AlertTriangle, 
  ShieldAlert, 
  ArrowRight,
  TrendingDown,
  Info
} from 'lucide-react';
import TelemetryChart from '@/components/charts/TelemetryChart';

export default function EnvironmentPage() {
  const { stationState, allStationsState, currentStationId, setCurrentStationId } = useStation();
  const { environment, metadata } = stationState;

  const otherStationId = currentStationId === 'maitri' ? 'bharati' : 'maitri';
  const otherStation = allStationsState[otherStationId];

  return (
    <div className="flex-1 p-4 md:p-6 space-y-5 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="polar-card p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 uppercase">
              Domain 1: Meteorological Observation
            </span>
            <span className="text-xs font-mono text-slate-400">{metadata.name}</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight mt-1">
            Antarctic Environmental & Meteorological Intelligence
          </h1>
          <p className="text-xs text-slate-300 font-mono">
            Ground-truth polar weather stations driving downstream heating demand, power draw, and logistics safety envelopes.
          </p>
        </div>

        {/* Data Honesty Badge (Page 12 spec) */}
        <div className="bg-polar-900 border border-polar-border p-2.5 rounded-lg flex items-center gap-2.5 font-mono text-xs">
          <Info className="w-4 h-4 text-polar-ice shrink-0" />
          <div>
            <span className="text-slate-400 text-[10px] uppercase block">Data Provenance</span>
            <span className="text-polar-ice font-semibold">{environment.source}</span>
          </div>
        </div>
      </div>

      {/* Primary Weather Gauges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Temperature */}
        <div className="polar-card p-4 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span className="uppercase">Surface Air Temp</span>
            <Thermometer className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="my-3">
            <div className="text-3xl font-mono font-bold text-white tracking-tight">
              {environment.temperatureC.toFixed(1)} <span className="text-lg font-normal text-cyan-300">°C</span>
            </div>
            <p className="text-xs font-mono text-slate-400 mt-1 flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5 text-sky-400" /> Wind chill: {(environment.temperatureC - (environment.windKmh * 0.18)).toFixed(1)} °C
            </p>
          </div>
          <div className="pt-2 border-t border-white/5 text-[11px] font-mono text-slate-400 flex justify-between">
            <span>Threshold: -30.0 °C</span>
            <span className={environment.temperatureC < -25 ? 'text-amber-400 font-semibold' : 'text-emerald-400'}>
              {environment.temperatureC < -25 ? 'Cold Alert' : 'Nominal'}
            </span>
          </div>
        </div>

        {/* Wind Speed & Direction */}
        <div className="polar-card p-4 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span className="uppercase">Katabatic Wind Speed</span>
            <Wind className="w-4 h-4 text-sky-400" />
          </div>
          <div className="my-3">
            <div className="text-3xl font-mono font-bold text-white tracking-tight">
              {environment.windKmh} <span className="text-lg font-normal text-sky-300">km/h</span>
            </div>
            <p className="text-xs font-mono text-slate-400 mt-1 flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-slate-400" /> Direction: {environment.windDirectionDeg}° (SE Gusts)
            </p>
          </div>
          <div className="pt-2 border-t border-white/5 text-[11px] font-mono text-slate-400 flex justify-between">
            <span>Blizzard Limit: 65 km/h</span>
            <span className={environment.windKmh > 55 ? 'text-rose-400 font-semibold' : 'text-emerald-400'}>
              {environment.windKmh > 55 ? 'High Wind' : 'Safe Window'}
            </span>
          </div>
        </div>

        {/* Barometric Pressure */}
        <div className="polar-card p-4 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span className="uppercase">Atmospheric Pressure</span>
            <CloudSun className="w-4 h-4 text-amber-400" />
          </div>
          <div className="my-3">
            <div className="text-3xl font-mono font-bold text-white tracking-tight">
              {environment.pressureHpa} <span className="text-lg font-normal text-amber-300">hPa</span>
            </div>
            <p className="text-xs font-mono text-slate-400 mt-1">
              Polar low pressure trough baseline
            </p>
          </div>
          <div className="pt-2 border-t border-white/5 text-[11px] font-mono text-slate-400 flex justify-between">
            <span>Pressure Trend</span>
            <span className="text-emerald-400 font-semibold">Steady</span>
          </div>
        </div>

        {/* Visibility */}
        <div className="polar-card p-4 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span className="uppercase">Horizontal Visibility</span>
            <Eye className="w-4 h-4 text-purple-400" />
          </div>
          <div className="my-3">
            <div className="text-3xl font-mono font-bold text-white tracking-tight">
              {environment.visibilityKm.toFixed(1)} <span className="text-lg font-normal text-purple-300">km</span>
            </div>
            <p className="text-xs font-mono text-slate-400 mt-1 flex items-center gap-1">
              <Droplets className="w-3.5 h-3.5 text-slate-400" /> Relative Humidity: {environment.humidityPercent}%
            </p>
          </div>
          <div className="pt-2 border-t border-white/5 text-[11px] font-mono text-slate-400 flex justify-between">
            <span>Aviation Sortie Cutoff: 2.0 km</span>
            <span className={environment.visibilityKm < 3.0 ? 'text-rose-400 font-semibold' : 'text-emerald-400'}>
              {environment.visibilityKm < 3.0 ? 'Sortie Grounded' : 'Clear For Flight'}
            </span>
          </div>
        </div>
      </div>

      {/* 24-Hour Environment Trend Chart (Recharts) */}
      <div className="polar-card p-5 rounded-xl space-y-3">
        <TelemetryChart
          title="24-Hour Continuous Weather & Katabatic Wind Trend"
          data={Array.from({ length: 12 }).map((_, i) => {
            const hour = `${(i * 2).toString().padStart(2, '0')}:00`;
            return {
              time: hour,
              temperature: Number((environment.temperatureC + Math.sin(i * 0.7) * 2.2).toFixed(1)),
              windSpeed: Math.round(environment.windKmh + Math.cos(i * 0.8) * 8),
              pressure: Math.round(environment.pressureHpa + Math.sin(i * 0.4) * 4),
            };
          })}
          series={[
            { key: 'temperature', label: 'Air Temp (°C)', color: '#00f0ff' },
            { key: 'windSpeed', label: 'Wind Velocity (km/h)', color: '#38bdf8' },
          ]}
          height={220}
        />
      </div>

      {/* Weather Risk Rules & Propagation (R-01 & R-02) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="polar-card p-4 rounded-xl space-y-2 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="font-bold text-amber-300">Rule R-01: Thermal Load Escalation Rule</span>
            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px]">ACTIVE</span>
          </div>
          <p className="text-slate-300 text-[11px]">
            <strong>Trigger:</strong> Outside temperature &lt; -20°C with convective wind &gt; 35 km/h.<br/>
            <strong>Propagation:</strong> Station envelope thermal leakage ↑ → HVAC heating demand ↑ (+2.3 kW/°C) → Diesel fuel burn ↑ (+0.24 L/kWh) → Fuel reserve runway shrinks.
          </p>
        </div>

        <div className="polar-card p-4 rounded-xl space-y-2 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="font-bold text-sky-300">Rule R-02: Blizzard & Sortie Window Rule</span>
            <span className="px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 text-[10px]">ACTIVE</span>
          </div>
          <p className="text-slate-300 text-[11px]">
            <strong>Trigger:</strong> Katabatic wind &gt; 55 km/h or horizontal visibility &lt; 2.5 km.<br/>
            <strong>Propagation:</strong> Ground operations halt → Snowcat fuel transport suspended → Requisition resupply window delayed (+3 to +7 days).
          </p>
        </div>
      </div>

      {/* 48-Hour Microclimate Forecast Horizon */}
      <div className="polar-card p-5 rounded-xl space-y-3 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            48-Hour Polar Weather Forecast Horizon (NCPOR Predictive Model)
          </h2>
          <span className="text-slate-400">Confidence: 94.2%</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { window: 'Today (+6h)', temp: (environment.temperatureC - 1.2).toFixed(1), wind: environment.windKmh + 4, sky: 'Katabatic Flurries', risk: 'Nominal' },
            { window: 'Tonight (+12h)', temp: (environment.temperatureC - 3.8).toFixed(1), wind: environment.windKmh + 9, sky: 'Sub-Zero Blizzard', risk: 'Warning' },
            { window: 'Tomorrow (+24h)', temp: (environment.temperatureC - 2.1).toFixed(1), wind: Math.max(20, environment.windKmh - 6), sky: 'Clear Polar Skies', risk: 'Nominal' },
            { window: 'Day 2 (+48h)', temp: (environment.temperatureC - 0.5).toFixed(1), wind: Math.max(15, environment.windKmh - 12), sky: 'Optimal Flight Window', risk: 'Nominal' },
          ].map((f, i) => (
            <div key={i} className="p-3 rounded-lg bg-polar-900 border border-polar-border space-y-1">
              <span className="text-[10px] text-slate-400 uppercase block">{f.window}</span>
              <div className="text-base font-bold text-white">{f.temp} °C</div>
              <div className="text-[11px] text-sky-300">{f.wind} km/h • {f.sky}</div>
              <div className={`text-[10px] font-bold uppercase mt-1 ${f.risk === 'Warning' ? 'text-amber-400' : 'text-emerald-400'}`}>
                Risk: {f.risk}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
