'use client';

import React from 'react';
import { useStation } from '@/context/StationContext';
import { 
  Zap, 
  Fuel, 
  AlertTriangle, 
  Activity, 
  Globe2, 
  Wifi, 
  ShieldCheck,
  ShieldAlert,
  SlidersHorizontal
} from 'lucide-react';
import Link from 'next/link';

export default function GlobalStationStatusRail() {
  const { effectiveStationState, currentStationId, setCurrentStationId } = useStation();
  const { station, health, energy, risk, operationalStance, alerts, derived } = effectiveStationState;

  const isPowerDeficit = risk.isPowerDeficit;
  const isAutonomyConstrained = risk.isAutonomyConstrained;
  const critCount = alerts.filter(a => a.severity === 'critical').length;
  const warnCount = alerts.filter(a => a.severity === 'warning').length;

  const statusColorMap = {
    CRITICAL: 'bg-[#E53935]/20 text-[#E53935] border-[#E53935]',
    WARNING: 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]',
    WATCH: 'bg-[#1976D2]/20 text-[#00B8E6] border-[#00B8E6]',
    NOMINAL: 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]',
  };

  return (
    <div className="w-full bg-polar-900/95 border-b border-polar-border px-4 py-2 font-mono text-xs select-none sticky top-14 z-30 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-slate-300">
        
        {/* Left: Station Node Identifier & Coordinates */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${
              risk.operationalStatus === 'CRITICAL' ? 'bg-critical-red animate-pulse' :
              risk.operationalStatus === 'WARNING' ? 'bg-warning-amber' : 'bg-operational-green'
            }`} />
            <span className="font-bold text-white uppercase font-sans tracking-wide">
              {station.name.split(' ')[0]}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
            ({station.coordinates.lat}°S, {station.coordinates.lng}°E)
          </span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${statusColorMap[risk.operationalStatus]}`}>
            {risk.operationalStatus}
          </span>
        </div>

        {/* Middle: Uniform Real-Time Metrics (Single Source of Truth) */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
          
          {/* Health Index */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px]">Health:</span>
            <strong className={`font-bold ${
              health.overall >= 80 ? 'text-operational-green' :
              health.overall >= 60 ? 'text-warning-amber' : 'text-critical-red animate-pulse'
            }`}>
              {health.overall}%
            </strong>
          </div>

          {/* Power Balance */}
          <div className="flex items-center gap-1.5 border-l border-white/10 pl-3">
            <Zap className={`w-3.5 h-3.5 ${isPowerDeficit ? 'text-critical-red' : 'text-operational-green'}`} />
            <span className="text-slate-400 text-[11px]">Net Power:</span>
            <strong className={isPowerDeficit ? 'text-critical-red font-bold' : 'text-operational-green font-bold'}>
              {isPowerDeficit ? `${derived.powerSurplusDeficitKw} kW` : `+${derived.powerSurplusDeficitKw} kW`}
            </strong>
          </div>

          {/* Fuel Autonomy */}
          <div className="flex items-center gap-1.5 border-l border-white/10 pl-3">
            <Fuel className={`w-3.5 h-3.5 ${isAutonomyConstrained ? 'text-warning-amber' : 'text-polar-cyan'}`} />
            <span className="text-slate-400 text-[11px]">Fuel Autonomy:</span>
            <strong className={isAutonomyConstrained ? 'text-warning-amber font-bold' : 'text-slate-200 font-bold'}>
              {derived.fuelRunwayDays.toFixed(1)}d
            </strong>
          </div>

          {/* Active Alerts */}
          <Link href="/alerts" className="flex items-center gap-1.5 border-l border-white/10 pl-3 hover:text-white transition-colors">
            <AlertTriangle className={`w-3.5 h-3.5 ${critCount > 0 ? 'text-critical-red animate-bounce' : warnCount > 0 ? 'text-warning-amber' : 'text-slate-400'}`} />
            <span className="text-slate-400 text-[11px]">Alerts:</span>
            <span className="font-bold">
              {critCount > 0 ? (
                <span className="text-critical-red">{critCount} Crit</span>
              ) : warnCount > 0 ? (
                <span className="text-warning-amber">{warnCount} Warn</span>
              ) : (
                <span className="text-operational-green">0</span>
              )}
            </span>
          </Link>
        </div>

        {/* Right: Operational Stance & Uplink State */}
        <div className="flex items-center gap-3 text-[11px]">
          <div className="flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-polar-cyan" />
            <span className="text-slate-400">Stance:</span>
            <span className="font-bold text-white px-1.5 py-0.5 rounded bg-polar-950 border border-polar-border">
              {operationalStance}
            </span>
          </div>

          <div className="flex items-center gap-1.5 border-l border-white/10 pl-3">
            <span className="w-2 h-2 rounded-full bg-operational-green" />
            <span className="text-slate-300 font-mono hidden md:inline">Uplink:</span>
            <span className="text-operational-green font-bold">100%</span>
          </div>
        </div>

      </div>
    </div>
  );
}
