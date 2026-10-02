'use client';

import React from 'react';
import { useStation } from '@/context/StationContext';
import { 
  Wrench, 
  ShieldCheck, 
  AlertTriangle, 
  Activity, 
  Calendar, 
  CheckCircle, 
  Clock, 
  Cpu, 
  Gauge, 
  Sliders 
} from 'lucide-react';

export default function InfrastructurePage() {
  const { stationState } = useStation();
  const { infrastructure, metadata } = stationState;

  return (
    <div className="flex-1 p-4 md:p-6 space-y-5 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="polar-card p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 uppercase">
              Domain 3: Infrastructure & Equipment
            </span>
            <span className="text-xs font-mono text-slate-400">{metadata.name}</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight mt-1">
            Station Mechanical Systems, HVAC & Life-Support Health
          </h1>
          <p className="text-xs text-slate-300 font-mono">
            Vibration signature analysis, thermodynamic efficiency, preventative maintenance forecasts, and pump health.
          </p>
        </div>

        <div className="bg-polar-900 border border-polar-border p-3 rounded-lg font-mono text-xs flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <div>
            <span className="text-slate-400 text-[10px] uppercase block">Fleet Condition Index</span>
            <span className="text-sm font-bold text-emerald-400">{infrastructure.overallHealth}% Operational</span>
          </div>
        </div>
      </div>

      {/* Sub-system Health Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="polar-card p-4 rounded-xl">
          <div className="flex justify-between items-center text-xs font-mono text-slate-400">
            <span>HVAC & THERMAL RECOVERY</span>
            <Cpu className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-2xl font-mono font-bold text-white">
            {infrastructure.hvacHealth}% <span className="text-xs font-normal text-slate-400">Health</span>
          </div>
          <p className="mt-1 text-[11px] font-mono text-slate-400">Heat recovery exchanger air balancing</p>
        </div>

        <div className="polar-card p-4 rounded-xl">
          <div className="flex justify-between items-center text-xs font-mono text-slate-400">
            <span>WATER & DESALINATION</span>
            <Gauge className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-2 text-2xl font-mono font-bold text-white">
            {infrastructure.waterPumpHealth}% <span className="text-xs font-normal text-slate-400">Health</span>
          </div>
          <p className="mt-1 text-[11px] font-mono text-slate-400">Intake line trace-heating and filtration</p>
        </div>

        <div className="polar-card p-4 rounded-xl">
          <div className="flex justify-between items-center text-xs font-mono text-slate-400">
            <span>GENERATION PRIME MOVERS</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-mono font-bold text-white">
            {infrastructure.generatorHealth}% <span className="text-xs font-normal text-slate-400">Health</span>
          </div>
          <p className="mt-1 text-[11px] font-mono text-slate-400">Cylinder compression & harmonic balance</p>
        </div>
      </div>

      {/* Asset Health Registry Table */}
      <div className="polar-card p-5 rounded-xl space-y-3">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
            Critical Infrastructure Asset Registry & Maintenance Timelines
          </h2>
          <span className="text-xs font-mono text-slate-400">
            {infrastructure.assets.length} monitored assets
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-white/5">
                <th className="py-2.5">EQUIPMENT NAME</th>
                <th className="py-2.5">BUILDING / LOCATION</th>
                <th className="py-2.5">TYPE</th>
                <th className="py-2.5">STATUS</th>
                <th className="py-2.5">HEALTH SCORE</th>
                <th className="py-2.5">LAST SERVICED</th>
                <th className="py-2.5">NEXT SERVICE DUE</th>
                <th className="py-2.5">ADVISORIES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-200">
              {infrastructure.assets.map((asset) => (
                <tr key={asset.assetId} className="hover:bg-white/5 transition-colors">
                  <td className="py-3 font-semibold text-white">
                    {asset.name}
                    <span className="block text-[10px] text-slate-500 font-normal">{asset.assetId}</span>
                  </td>
                  <td className="py-3 text-slate-400">{asset.building}</td>
                  <td className="py-3 uppercase text-[10px] text-slate-400">{asset.type.replace('_', ' ')}</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                      asset.status === 'running' || asset.status === 'operational'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : asset.status === 'warning'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}>
                      {asset.status}
                    </span>
                  </td>
                  <td className="py-3 font-bold">
                    <span className={asset.health >= 80 ? 'text-emerald-400' : 'text-amber-400'}>
                      {asset.health}%
                    </span>
                  </td>
                  <td className="py-3 text-slate-400">{asset.lastServiced}</td>
                  <td className="py-3 text-slate-300 font-medium">{asset.nextServiceDue}</td>
                  <td className="py-3">
                    {asset.alerts.length === 0 ? (
                      <span className="text-slate-500 text-[11px]">—</span>
                    ) : (
                      <span className="text-amber-300 text-[11px] flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        {asset.alerts[0]}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
