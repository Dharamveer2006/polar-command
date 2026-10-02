'use client';

import React from 'react';
import { useStation } from '@/context/StationContext';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Activity, 
  Cpu, 
  Gauge, 
  CheckCircle2,
  AlertOctagon,
  Clock,
  Layers
} from 'lucide-react';
import ProvenanceBadge from '@/components/common/ProvenanceBadge';

export default function InfrastructurePage() {
  const { stationState, activeInjectedEvents } = useStation();
  const { infrastructure, metadata, derived } = stationState;

  return (
    <div className="flex-1 p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="polar-card p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 uppercase font-bold">
              Domain 3: Infrastructure & Equipment
            </span>
            <ProvenanceBadge source="Derived Calculation" />
            <span className="text-xs font-mono text-slate-400">{metadata.name}</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight mt-1">
            Station Mechanical Systems, Power Assets & Anomaly Telemetry
          </h1>
          <p className="text-xs text-slate-300 font-mono">
            Exposes deterministic asset anomaly detection, expected operating tolerances, cross-domain risks, and service schedules.
          </p>
        </div>

        <div className="bg-polar-900 border border-polar-border p-3 rounded-lg font-mono text-xs flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <div>
            <span className="text-slate-400 text-[10px] uppercase block">Fleet Condition Index</span>
            <span className="text-sm font-bold text-emerald-400">
              {derived.overallInfrastructureHealth}% Operational
            </span>
          </div>
        </div>
      </div>

      {/* Sub-system Health Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="polar-card p-4 rounded-xl font-mono">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>HVAC & THERMAL RECOVERY</span>
            <Cpu className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">
            {activeInjectedEvents.extremeCold ? '70%' : `${infrastructure.hvacHealth}%`} <span className="text-xs font-normal text-slate-400">Health</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Heating Load: {derived.heatingLoadKw} kW
          </p>
        </div>

        <div className="polar-card p-4 rounded-xl font-mono">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>WATER & DESALINATION</span>
            <Gauge className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">
            {infrastructure.waterPumpHealth}% <span className="text-xs font-normal text-slate-400">Health</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Priyadarshini Lake intake heating nominal</p>
        </div>

        <div className="polar-card p-4 rounded-xl font-mono">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>GENERATION PRIME MOVERS</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">
            {activeInjectedEvents.generator2Failure ? '52%' : `${infrastructure.generatorHealth}%`} <span className="text-xs font-normal text-slate-400">Health</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Active Generation: {derived.generationCapacityKw} kW
          </p>
        </div>
      </div>

      {/* Asset Health & Anomaly Detection Registry Table */}
      <div className="polar-card p-5 rounded-xl space-y-4 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Monitored Subsystems & Explainable Anomaly Detection Signals
            </h2>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Deterministic threshold telemetry comparing observed metrics against calibrated engineering baselines.
            </p>
          </div>
          <span className="text-slate-400">
            {infrastructure.assets.length} Assets Online
          </span>
        </div>

        <div className="space-y-3">
          {infrastructure.assets.map((asset) => {
            const isGen2Failed = asset.assetId.includes('gen-02') && activeInjectedEvents.generator2Failure;
            const status = isGen2Failed ? 'offline' : asset.status;
            const health = isGen2Failed ? 0 : asset.health;
            const anomaly = asset.anomaly || {
              parameter: 'Vibration',
              expectedRange: '1.0–2.0 mm/s',
              observedValue: isGen2Failed ? '0.0 mm/s' : '1.4 mm/s',
              status: isGen2Failed ? 'ANOMALY' : 'NOMINAL',
              explanation: isGen2Failed ? 'Zero rotation detected. Mechanical trip lockout active.' : 'Bearing vibration within ISO standard tolerances.',
            };
            const domain = asset.type === 'generator' || asset.type === 'fuel_pump' 
              ? 'Energy' 
              : asset.type === 'hvac' 
              ? 'Infrastructure / Thermal' 
              : asset.type === 'water_pump' || asset.type === 'reverse_osmosis'
              ? 'Infrastructure / Life Support'
              : 'Communications';

            return (
              <div 
                key={asset.assetId} 
                className={`p-4 rounded-xl border transition-all ${
                  isGen2Failed || status === 'critical' || status === 'offline'
                    ? 'bg-rose-950/40 border-rose-500/60'
                    : status === 'warning'
                    ? 'bg-amber-950/30 border-amber-500/50'
                    : 'bg-polar-900 border-polar-border'
                }`}
              >
                {/* Top Row: Name, Status, Health, Domain */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-white text-sm">{asset.name}</span>
                    <span className="text-[10px] text-slate-400">({asset.assetId})</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-polar-800 text-slate-300 border border-polar-border">
                      {asset.building}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 text-[11px]">Domain: <strong className="text-cyan-300">{domain}</strong></span>
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${
                      status === 'running' || status === 'operational'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : status === 'warning'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                    }`}>
                      {status}
                    </span>
                    <span className={`font-bold text-sm ${health >= 80 ? 'text-emerald-400' : health >= 60 ? 'text-amber-400' : 'text-rose-400'}`}>
                      {health}% Health
                    </span>
                  </div>
                </div>

                {/* Middle Row: Explainable Anomaly Detection Callout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  {/* Anomaly Signal Box */}
                  <div className={`p-2.5 rounded-lg border text-[11px] ${
                    anomaly.status === 'ANOMALY' 
                      ? 'bg-rose-950/60 border-rose-500/60 text-rose-200' 
                      : 'bg-polar-950 border-polar-border text-slate-300'
                  }`}>
                    <div className="flex items-center justify-between font-bold mb-1">
                      <span className="flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-current" />
                        Anomaly Signal: {anomaly.parameter}
                      </span>
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                        anomaly.status === 'ANOMALY' ? 'bg-rose-500 text-white' : 'bg-emerald-500/20 text-emerald-300'
                      }`}>
                        {anomaly.status}
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px] opacity-90">
                      <span>Expected: <strong>{anomaly.expectedRange}</strong></span>
                      <span>Observed: <strong>{anomaly.observedValue}</strong></span>
                    </div>
                    <p className="text-[10px] opacity-80 mt-1">{anomaly.explanation}</p>
                  </div>

                  {/* Operational Telemetry Metrics */}
                  <div className="bg-polar-950 p-2.5 rounded-lg border border-polar-border text-[11px] space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Live Subsystem Telemetry</span>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      {asset.metrics.temperatureC !== undefined && (
                        <div>Temp: <span className="text-white font-bold">{asset.metrics.temperatureC}°C</span></div>
                      )}
                      {asset.metrics.loadKw !== undefined && (
                        <div>Load: <span className="text-cyan-300 font-bold">{asset.metrics.loadKw} kW</span></div>
                      )}
                      {asset.metrics.pressureBar !== undefined && (
                        <div>Pressure: <span className="text-white font-bold">{asset.metrics.pressureBar} bar</span></div>
                      )}
                      {asset.metrics.vibrationMmS !== undefined && (
                        <div>Vibration: <span className="text-white font-bold">{asset.metrics.vibrationMmS} mm/s</span></div>
                      )}
                      {asset.metrics.runtimeHours !== undefined && (
                        <div>Runtime: <span className="text-slate-300">{asset.metrics.runtimeHours} hrs</span></div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Service Schedule & Advisories */}
                <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2 border-t border-white/5 text-[11px] text-slate-400">
                  <div className="flex items-center gap-4">
                    <span>Last Serviced: <strong className="text-slate-200">{asset.lastServiced}</strong></span>
                    <span>Next Service Due: <strong className="text-cyan-300">{asset.nextServiceDue}</strong></span>
                  </div>
                  <div>
                    {asset.alerts.length > 0 ? (
                      <span className="text-rose-400 font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {asset.alerts[0]}
                      </span>
                    ) : (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Scheduled preventative maintenance on track
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
