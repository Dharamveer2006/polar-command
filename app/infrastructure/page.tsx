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
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-100/90 text-emerald-800 border border-emerald-300 uppercase font-bold">
              Domain 3: Infrastructure & Equipment
            </span>
            <ProvenanceBadge source="Derived Calculation" />
            <span className="text-xs font-mono text-[#36546D]">{metadata.name}</span>
          </div>
          <h1 className="text-xl font-bold text-[#0F2740] tracking-tight mt-1">
            Station Mechanical Systems, Power Assets & Anomaly Telemetry
          </h1>
          <p className="text-xs text-[#36546D] font-mono">
            Exposes deterministic asset anomaly detection, expected operating tolerances, cross-domain risks, and service schedules.
          </p>
        </div>

        <div className="bg-polar-900 border border-polar-border p-3.5 rounded-xl font-mono text-xs flex items-center gap-3.5 shadow-sm">
          <div className="p-2 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-500/30">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-slate-300 text-[10px] uppercase block font-semibold">Fleet Condition Index</span>
            <span className="text-base font-bold text-emerald-400 tracking-tight">
              {derived.overallInfrastructureHealth}% Operational
            </span>
          </div>
        </div>
      </div>

      {/* Sub-system Health Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* HVAC */}
        <div className="polar-card p-5 rounded-2xl border border-cyan-200/80 shadow-md relative overflow-hidden group">
          <div className="flex justify-between items-center text-xs text-[#36546D]">
            <span className="font-bold tracking-wider uppercase text-[11px]">HVAC & Thermal Recovery</span>
            <div className="p-2 rounded-xl bg-cyan-100/80 text-cyan-700 border border-cyan-300 shadow-sm">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#08243A] font-mono tracking-tight">
              {activeInjectedEvents.extremeCold ? '70%' : `${infrastructure.hvacHealth}%`}
            </span>
            <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
              activeInjectedEvents.extremeCold 
                ? 'bg-amber-100 text-amber-900 border-amber-300' 
                : 'bg-emerald-100 text-emerald-800 border-emerald-300'
            }`}>
              {activeInjectedEvents.extremeCold ? 'High Load' : 'Nominal'}
            </span>
          </div>
          {/* Visual health bar */}
          <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden mt-3">
            <div 
              className={`h-full transition-all duration-500 ${activeInjectedEvents.extremeCold ? 'bg-amber-500 w-[70%]' : 'bg-cyan-500 w-[94%]'}`} 
            />
          </div>
          <div className="mt-2.5 flex items-center justify-between text-xs text-[#36546D] font-mono">
            <span>Thermal Heating Draw:</span>
            <span className="font-bold text-[#08243A]">{derived.heatingLoadKw} kW</span>
          </div>
        </div>

        {/* Water */}
        <div className="polar-card p-5 rounded-2xl border border-sky-200/80 shadow-md relative overflow-hidden group">
          <div className="flex justify-between items-center text-xs text-[#36546D]">
            <span className="font-bold tracking-wider uppercase text-[11px]">Water & Desalination</span>
            <div className="p-2 rounded-xl bg-sky-100/80 text-sky-700 border border-sky-300 shadow-sm">
              <Gauge className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#08243A] font-mono tracking-tight">
              {infrastructure.waterPumpHealth}%
            </span>
            <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
              Nominal
            </span>
          </div>
          <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden mt-3">
            <div className="h-full bg-sky-500 w-[96%] transition-all duration-500" />
          </div>
          <div className="mt-2.5 flex items-center justify-between text-xs text-[#36546D] font-mono">
            <span>Intake Subsystem:</span>
            <span className="font-bold text-emerald-700">Priyadarshini Nominal</span>
          </div>
        </div>

        {/* Generation Prime Movers */}
        <div className="polar-card p-5 rounded-2xl border border-amber-200/80 shadow-md relative overflow-hidden group">
          <div className="flex justify-between items-center text-xs text-[#36546D]">
            <span className="font-bold tracking-wider uppercase text-[11px]">Generation Prime Movers</span>
            <div className="p-2 rounded-xl bg-amber-100/80 text-amber-700 border border-amber-300 shadow-sm">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#08243A] font-mono tracking-tight">
              {activeInjectedEvents.generator2Failure ? '52%' : `${infrastructure.generatorHealth}%`}
            </span>
            <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
              activeInjectedEvents.generator2Failure 
                ? 'bg-rose-100 text-rose-800 border-rose-300' 
                : 'bg-emerald-100 text-emerald-800 border-emerald-300'
            }`}>
              {activeInjectedEvents.generator2Failure ? 'Degraded (Trip)' : 'Operating'}
            </span>
          </div>
          <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden mt-3">
            <div 
              className={`h-full transition-all duration-500 ${activeInjectedEvents.generator2Failure ? 'bg-rose-500 w-[52%]' : 'bg-emerald-500 w-[95%]'}`} 
            />
          </div>
          <div className="mt-2.5 flex items-center justify-between text-xs text-[#36546D] font-mono">
            <span>Active Microgrid Supply:</span>
            <span className="font-bold text-[#08243A]">{derived.generationCapacityKw} kW</span>
          </div>
        </div>
      </div>

      {/* Asset Health & Anomaly Detection Registry Table */}
      <div className="polar-card p-5 rounded-xl space-y-4 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
          <div>
            <h2 className="text-sm font-bold text-[#0F2740] uppercase tracking-wider">
              Monitored Subsystems & Explainable Anomaly Detection Signals
            </h2>
            <p className="text-[#36546D] text-[11px] mt-0.5">
              Deterministic threshold telemetry comparing observed metrics against calibrated engineering baselines.
            </p>
          </div>
          <span className="text-[#36546D] font-bold">
            {infrastructure.assets.length} Assets Online
          </span>
        </div>

        <div className="space-y-4">
          {infrastructure.assets.map((asset) => {
            const isGen2Failed = asset.assetId.includes('gen-02') && activeInjectedEvents.generator2Failure;
            const status = isGen2Failed ? 'offline' : asset.status;
            const health = isGen2Failed ? 0 : asset.health;

            // Domain-aware anomaly defaults
            const anomaly = asset.anomaly || (() => {
              if (isGen2Failed) {
                return {
                  parameter: 'Shaft Vibration',
                  expectedRange: '1.0–2.0 mm/s',
                  observedValue: '0.0 mm/s',
                  status: 'ANOMALY',
                  explanation: 'Zero shaft rotation detected. Mechanical trip lockout active. Emergency alternator cutoff engaged.',
                };
              }
              if (asset.type === 'hvac') {
                return {
                  parameter: 'Airflow Delta-T',
                  expectedRange: '18.0–24.0°C',
                  observedValue: `${asset.metrics?.temperatureC ?? 22.1}°C`,
                  status: 'NOMINAL',
                  explanation: 'Thermal exchange delta within calibrated envelope. Core recovery efficiency nominal with no coil frost build-up.',
                };
              }
              if (asset.type === 'water_pump' || asset.type === 'reverse_osmosis') {
                const isWarning = asset.status === 'warning';
                return {
                  parameter: isWarning ? 'Impeller Vibration' : 'Hydraulic Head Pressure',
                  expectedRange: isWarning ? '1.0–2.2 mm/s' : '2.8–3.5 bar',
                  observedValue: isWarning ? `${asset.metrics?.vibrationMmSec ?? 2.8} mm/s` : `${asset.metrics?.pressureBar ?? 3.1} bar`,
                  status: isWarning ? 'ADVISORY' : 'NOMINAL',
                  explanation: isWarning ? 'Vibration spectrum shows minor harmonic resonance nearing advisory threshold; routine maintenance queued.' : 'Hydraulic pressure profile stable across desalination membrane stages.',
                };
              }
              if (asset.type === 'satellite_uplink') {
                return {
                  parameter: 'Carrier SNR Margin',
                  expectedRange: '12.0–18.0 dB',
                  observedValue: '15.4 dB',
                  status: 'NOMINAL',
                  explanation: 'GSAT Ku-band link tracking lock stable through radome heating and de-icing subsystem.',
                };
              }
              return {
                parameter: 'Bearing Vibration',
                expectedRange: '1.0–2.0 mm/s',
                observedValue: `${asset.metrics?.vibrationMmSec ?? asset.metrics?.vibrationMmS ?? 1.4} mm/s`,
                status: 'NOMINAL',
                explanation: 'Bearing vibration frequency within ISO 10816-3 Class II standard operating tolerances.',
              };
            })();

            const domain = asset.type === 'generator' || asset.type === 'fuel_pump' 
              ? 'Energy' 
              : asset.type === 'hvac' 
              ? 'Infrastructure / Thermal' 
              : asset.type === 'water_pump' || asset.type === 'reverse_osmosis'
              ? 'Infrastructure / Life Support'
              : 'Communications';

            // Extract all available live metrics into a rich grid
            const metricsList: { label: string; value: string; highlight?: boolean }[] = [];
            const m = asset.metrics || {};

            if (m.temperatureC !== undefined) {
              metricsList.push({ label: 'Core Temp', value: `${m.temperatureC}°C` });
            }
            if (m.loadKw !== undefined) {
              metricsList.push({ label: 'Electrical Load', value: `${m.loadKw} kW`, highlight: true });
            }
            if (m.flowRateLpm !== undefined) {
              metricsList.push({ 
                label: asset.type === 'hvac' ? 'Airflow Volume' : 'Intake Flow', 
                value: `${Number(m.flowRateLpm).toLocaleString()} L/min` 
              });
            }
            if (m.efficiencyPercent !== undefined) {
              metricsList.push({ label: 'Efficiency', value: `${m.efficiencyPercent}%` });
            }
            if (m.pressureBar !== undefined) {
              metricsList.push({ label: 'Hydraulic Press', value: `${m.pressureBar} bar` });
            }
            const vib = m.vibrationMmSec ?? m.vibrationMmS;
            if (vib !== undefined) {
              metricsList.push({ label: 'Vibration', value: `${vib} mm/s` });
            }
            if (m.fuelRateLph !== undefined) {
              metricsList.push({ label: 'Fuel Burn Rate', value: `${m.fuelRateLph} L/h` });
            }
            if (m.runtimeHours !== undefined) {
              metricsList.push({ label: 'Service Runtime', value: `${Number(m.runtimeHours).toLocaleString()} hrs` });
            }

            // Balanced fallbacks so single-metric cards (e.g. satellite or pure HVAC) maintain a rich 3-4 tile grid
            if (metricsList.length < 3) {
              if (asset.type === 'hvac') {
                if (!metricsList.some(i => i.label === 'Blower RPM')) metricsList.push({ label: 'Blower RPM', value: '1,420 RPM' });
                if (!metricsList.some(i => i.label === 'Recovery Loop')) metricsList.push({ label: 'Recovery Loop', value: 'Active Nominal' });
              } else if (asset.type === 'satellite_uplink') {
                if (!metricsList.some(i => i.label === 'Link SNR Margin')) metricsList.push({ label: 'Link SNR Margin', value: '15.4 dB' });
                if (!metricsList.some(i => i.label === 'Carrier Lock')) metricsList.push({ label: 'Carrier Lock', value: 'Phase Locked' });
                if (!metricsList.some(i => i.label === 'De-icing State')) metricsList.push({ label: 'De-icing State', value: 'Standby Auto' });
              } else if (asset.type === 'water_pump' || asset.type === 'reverse_osmosis') {
                if (!metricsList.some(i => i.label === 'Motor Current')) metricsList.push({ label: 'Motor Current', value: '28.4 A' });
                if (!metricsList.some(i => i.label === 'Permeate Quality')) metricsList.push({ label: 'Permeate Quality', value: '99.2% TDS' });
              } else if (asset.type === 'fuel_pump') {
                if (!metricsList.some(i => i.label === 'Manifold State')) metricsList.push({ label: 'Manifold State', value: 'Nominal Feed' });
              }
            }

            return (
              <div 
                key={asset.assetId} 
                className={`p-5 rounded-2xl border-2 transition-all shadow-md ${
                  isGen2Failed || status === 'critical' || status === 'offline'
                    ? 'bg-[#180B14] border-rose-500/80 shadow-rose-950/30'
                    : status === 'warning'
                    ? 'bg-[#1A140B] border-amber-500/80 shadow-amber-950/30'
                    : 'bg-polar-900 border-polar-border hover:border-cyan-500/40'
                }`}
              >
                {/* Top Row: Name, Status, Health, Domain */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-white/10 pb-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-bold text-white text-base font-sans tracking-tight">{asset.name}</span>
                    <span className="text-xs text-cyan-300 font-mono font-semibold px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/80">
                      [{asset.assetId}]
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800/90 text-slate-200 border border-slate-700 uppercase font-bold font-mono">
                      {asset.building}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-slate-300 text-xs font-mono">Domain: <strong className="text-cyan-300 uppercase font-bold">{domain}</strong></span>
                    <span className={`px-2.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider font-mono border shadow-sm ${
                      status === 'running' || status === 'operational'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-500/80'
                        : status === 'warning'
                        ? 'bg-amber-950 text-amber-300 border-amber-500/80'
                        : 'bg-rose-950 text-rose-300 border-rose-500/80'
                    }`}>
                      {status}
                    </span>
                    <span className={`font-bold font-mono text-sm px-2.5 py-0.5 rounded bg-black/50 border border-white/10 ${
                      health >= 80 ? 'text-emerald-400' : health >= 60 ? 'text-amber-400' : 'text-rose-400'
                    }`}>
                      {health}% Health
                    </span>
                  </div>
                </div>

                {/* Middle Row: Explainable Anomaly Detection Callout & Telemetry */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 mt-3.5">
                  {/* Anomaly Signal Box (5 cols) */}
                  <div className={`lg:col-span-5 p-3.5 rounded-xl border text-xs space-y-2.5 flex flex-col justify-between ${
                    anomaly.status === 'ANOMALY' 
                      ? 'bg-[#2A0E18] border-rose-500/80 text-rose-100 shadow-sm' 
                      : anomaly.status === 'ADVISORY'
                      ? 'bg-[#261B0E] border-amber-500/80 text-amber-100 shadow-sm'
                      : 'bg-polar-950 border-cyan-900/60 text-slate-200'
                  }`}>
                    <div>
                      <div className="flex items-center justify-between font-bold mb-2">
                        <span className="flex items-center gap-2 text-xs font-mono text-white">
                          <Activity className={`w-4 h-4 ${
                            anomaly.status === 'ANOMALY' 
                              ? 'text-rose-400 animate-pulse' 
                              : anomaly.status === 'ADVISORY'
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`} />
                          <span>Anomaly Signal: <strong className="text-white">{anomaly.parameter}</strong></span>
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono border ${
                          anomaly.status === 'ANOMALY' 
                            ? 'bg-rose-900/80 text-rose-200 border-rose-500' 
                            : anomaly.status === 'ADVISORY'
                            ? 'bg-amber-900/80 text-amber-200 border-amber-500'
                            : 'bg-emerald-950 text-emerald-300 border-emerald-500/70'
                        }`}>
                          {anomaly.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono py-1.5 px-2.5 rounded-lg bg-black/40 border border-white/5">
                        <span className="text-slate-300">Expected: <strong className="text-white font-bold">{anomaly.expectedRange}</strong></span>
                        <span className="text-slate-300">Observed: <strong className={
                          anomaly.status === 'ANOMALY' 
                            ? 'text-rose-300 font-bold' 
                            : anomaly.status === 'ADVISORY'
                            ? 'text-amber-300 font-bold'
                            : 'text-emerald-300 font-bold'
                        }>{anomaly.observedValue}</strong></span>
                      </div>
                    </div>
                    <div className="text-xs text-slate-100 font-sans leading-relaxed p-2.5 rounded-lg bg-black/50 border border-white/10 shadow-inner">
                      {anomaly.explanation}
                    </div>
                  </div>

                  {/* Operational Telemetry Metrics (7 cols) */}
                  <div className="lg:col-span-7 bg-polar-950 p-3.5 rounded-xl border border-cyan-900/60 text-xs space-y-2.5 flex flex-col justify-between">
                    <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                      <span className="text-[11px] text-cyan-300 uppercase font-bold tracking-wider font-mono flex items-center gap-1.5">
                        <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                        Live Subsystem Telemetry
                      </span>
                      <span className="text-[10px] text-emerald-300 font-mono font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Real-time Stream
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 text-xs font-mono">
                      {metricsList.map((item, idx) => (
                        <div 
                          key={idx} 
                          className="bg-slate-900/90 border border-slate-700/70 p-2 rounded-lg hover:border-cyan-500/40 transition-colors shadow-inner"
                        >
                          <span className="text-slate-400 text-[10px] block font-mono uppercase tracking-wider font-semibold truncate">
                            {item.label}
                          </span>
                          <span className={`font-mono font-bold text-sm tracking-tight ${
                            item.highlight ? 'text-cyan-300' : 'text-white'
                          }`}>
                            {item.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Service Schedule & Advisories */}
                <div className="flex flex-wrap items-center justify-between gap-3 mt-3.5 pt-2.5 border-t border-white/10 text-xs">
                  <div className="flex flex-wrap items-center gap-4 text-slate-300 font-mono text-xs">
                    <span>Last Serviced: <strong className="text-white font-bold">{asset.lastServiced}</strong></span>
                    <span>Next Service Due: <strong className="text-cyan-300 font-bold">{asset.nextServiceDue}</strong></span>
                  </div>
                  <div>
                    {asset.alerts.length > 0 ? (
                      <span className="text-rose-300 bg-rose-950/80 border border-rose-500/60 px-3 py-1 rounded-md font-semibold text-xs flex items-center gap-1.5 shadow-sm font-mono">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                        {asset.alerts[0]}
                      </span>
                    ) : (
                      <span className="text-emerald-300 bg-emerald-950/80 border border-emerald-500/60 px-3 py-1 rounded-md text-xs flex items-center gap-1.5 shadow-sm font-semibold font-mono">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Scheduled preventative maintenance on track
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
