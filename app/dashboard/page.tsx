'use client';

import React from 'react';
import { useStation } from '@/context/StationContext';
import Link from 'next/link';
import { 
  Activity, 
  Zap, 
  Wind, 
  Thermometer, 
  Package, 
  AlertTriangle, 
  ShieldCheck, 
  CheckCircle, 
  ArrowUpRight, 
  SlidersHorizontal, 
  FilePlus, 
  Layers, 
  Radio,
  Fuel,
  BatteryCharging,
  GitBranch,
  Settings2,
  Clock,
  ArrowRight,
  Flame,
  AlertOctagon,
  ChevronRight
} from 'lucide-react';
import ProvenanceBadge from '@/components/common/ProvenanceBadge';
import { StationId } from '@/types';

export default function DashboardPage() {
  const { 
    stationState, 
    allStationsState,
    currentStationId, 
    setCurrentStationId, 
    acknowledgeAlert,
    activeInjectedEvents 
  } = useStation();

  const [showWeightsModal, setShowWeightsModal] = React.useState(false);
  const [weights, setWeights] = React.useState({
    environment: 0.20,
    energy: 0.30,
    infrastructure: 0.25,
    logistics: 0.25,
  });

  const { metadata, environment, energy, infrastructure, logistics, healthScore, activeAlerts, derived } = stationState;

  const fuelItem = logistics.inventory.find(i => i.category === 'fuel');
  const foodItem = logistics.inventory.find(i => i.category === 'food');
  const medItem = logistics.inventory.find(i => i.category === 'medical');

  const healthyAssets = infrastructure.assets.filter(a => a.status === 'running' || a.status === 'operational').length;
  const totalAssets = infrastructure.assets.length;

  const maitriState = allStationsState['maitri'];
  const bharatiState = allStationsState['bharati'];

  const stationsSummary: Array<{ id: StationId; label: string; hindi: string; state: typeof stationState }> = [
    { id: 'maitri', label: 'MAITRI', hindi: 'मैत्री', state: maitriState },
    { id: 'bharati', label: 'BHARATI', hindi: 'भारती', state: bharatiState },
  ];

  return (
    <div className="flex-1 p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* ============================================================== */}
      {/* PHASE 6: TOP DUAL STATION COMMAND BAR (MAITRI & BHARATI)       */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stationsSummary.map(({ id, label, hindi, state }) => {
          const isSelected = currentStationId === id;
          const sDerived = state.derived;
          const sHealth = sDerived?.overallHealthScore ?? state.healthScore.overall;
          const sCritAlerts = state.activeAlerts.filter(a => a.severity === 'critical').length;
          const sFuelDays = sDerived?.fuelRunwayDays ?? state.energy.fuelRunwayDays;
          const sSurplus = sDerived?.powerSurplusDeficitKw ?? (state.energy.generationKw - state.energy.demandKw);
          const sConn = state.metadata.connectivityState;
          const isAtRisk = sHealth < 75 || sCritAlerts > 0 || sSurplus < 0;

          return (
            <button
              key={id}
              onClick={() => setCurrentStationId(id)}
              className={`text-left p-4 rounded-xl border transition-all relative overflow-hidden group ${
                isSelected
                  ? 'bg-polar-900 border-cyan-400 ring-1 ring-cyan-400/40 shadow-lg shadow-cyan-950/40'
                  : 'bg-polar-950/70 border-polar-border hover:border-slate-600 hover:bg-polar-900/50'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${
                    isSelected ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-polar-800 text-slate-400'
                  }`}>
                    {id === 'maitri' ? 'MTR' : 'BHR'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-base tracking-tight">{label}</span>
                      <span className="text-xs font-mono text-slate-400">({hindi})</span>
                      {isSelected && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase font-semibold">
                          Active Twin
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">{state.metadata.region}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isAtRisk ? (
                    <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold animate-pulse">
                      <AlertTriangle className="w-3 h-3" /> AT RISK
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      <CheckCircle className="w-3 h-3" /> NOMINAL
                    </span>
                  )}
                </div>
              </div>

              {/* Station metrics grid */}
              <div className="grid grid-cols-5 gap-2 font-mono text-center pt-2 border-t border-white/5">
                {/* Health */}
                <div className="bg-polar-900/60 p-2 rounded border border-white/5">
                  <div className="text-[10px] text-slate-400 uppercase">Health</div>
                  <div className={`text-base font-bold mt-0.5 ${
                    sHealth >= 80 ? 'text-emerald-400' : sHealth >= 60 ? 'text-amber-400' : 'text-rose-400'
                  }`}>
                    {sHealth}%
                  </div>
                </div>

                {/* Critical alerts */}
                <div className="bg-polar-900/60 p-2 rounded border border-white/5">
                  <div className="text-[10px] text-slate-400 uppercase">Crit Alerts</div>
                  <div className={`text-base font-bold mt-0.5 ${sCritAlerts > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                    {sCritAlerts}
                  </div>
                </div>

                {/* Fuel Runway */}
                <div className="bg-polar-900/60 p-2 rounded border border-white/5">
                  <div className="text-[10px] text-slate-400 uppercase">Fuel Runway</div>
                  <div className={`text-base font-bold mt-0.5 ${sFuelDays < 15 ? 'text-rose-400' : sFuelDays < 30 ? 'text-amber-400' : 'text-slate-200'}`}>
                    {sFuelDays.toFixed(1)}d
                  </div>
                </div>

                {/* Power Balance */}
                <div className="bg-polar-900/60 p-2 rounded border border-white/5">
                  <div className="text-[10px] text-slate-400 uppercase">Power Bal</div>
                  <div className={`text-base font-bold mt-0.5 ${sSurplus >= 0 ? 'text-cyan-300' : 'text-rose-400'}`}>
                    {sSurplus >= 0 ? `+${sSurplus}` : sSurplus} kW
                  </div>
                </div>

                {/* Connectivity */}
                <div className="bg-polar-900/60 p-2 rounded border border-white/5">
                  <div className="text-[10px] text-slate-400 uppercase">Link</div>
                  <div className={`text-xs font-bold mt-1 uppercase ${
                    sConn === 'CONNECTED' ? 'text-emerald-400' : sConn === 'INTERMITTENT' ? 'text-amber-400' : 'text-rose-400'
                  }`}>
                    {sConn === 'CONNECTED' ? 'ONLINE' : sConn}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* ============================================================== */}
      {/* 30-SECOND DEMO / OPERATIONAL INCIDENT COMMAND RAILS             */}
      {/* (ACTIVE INCIDENT, ROOT CAUSE, CAUSAL CHAIN, FORECAST, ACTION)   */}
      {/* ============================================================== */}
      <div className="polar-card p-5 rounded-xl border border-polar-border space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <AlertOctagon className={`w-5 h-5 ${
              derived.crossDomainRisk === 'critical' ? 'text-rose-400 animate-pulse' :
              derived.crossDomainRisk === 'warning' ? 'text-amber-400' : 'text-emerald-400'
            }`} />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-slate-400 uppercase tracking-wider font-semibold">Active Operational Stance:</span>
                <span className="font-bold text-white text-base">{derived.activeIncident}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ProvenanceBadge source="Derived Calculation" />
            <span className={`font-mono text-xs uppercase px-2.5 py-1 rounded font-bold border ${
              derived.crossDomainRisk === 'critical' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
              derived.crossDomainRisk === 'warning' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
              'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
            }`}>
              Risk: {derived.crossDomainRisk}
            </span>
          </div>
        </div>

        {/* Causal Analysis & Forecast 4-Box Flow */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
          {/* Box 1: Root Cause */}
          <div className="bg-polar-950/80 border border-slate-800 p-3.5 rounded-lg flex flex-col justify-between space-y-2">
            <div>
              <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">
                <span>1. Root Cause</span>
                <ProvenanceBadge source="Synthetic Telemetry" compact />
              </div>
              <p className="text-slate-200 text-xs leading-relaxed font-sans mt-1">
                {derived.rootCause}
              </p>
            </div>
            <div className="text-[10px] text-cyan-400/80 border-t border-white/5 pt-1.5">
              Target Station: {metadata.name.toUpperCase()}
            </div>
          </div>

          {/* Box 2: Causal Propagation Chain */}
          <div className="bg-polar-950/80 border border-slate-800 p-3.5 rounded-lg flex flex-col justify-between space-y-2">
            <div>
              <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">
                <span>2. Causal Chain</span>
                <span className="text-[10px] text-cyan-400">{derived.causalChain.length} steps</span>
              </div>
              <div className="space-y-1 mt-1">
                {derived.causalChain.slice(0, 3).map((step, idx) => (
                  <div key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-300 leading-tight">
                    <span className="text-cyan-400 font-bold shrink-0">{idx + 1}.</span>
                    <span className="line-clamp-2">{step}</span>
                  </div>
                ))}
              </div>
            </div>
            <button 
              onClick={() => setShowWeightsModal(true)}
              className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 border-t border-white/5 pt-1.5"
            >
              <GitBranch className="w-3 h-3 text-rose-400" /> View Propagation Details
            </button>
          </div>

          {/* Box 3: Forecasted Impact */}
          <div className="bg-polar-950/80 border border-slate-800 p-3.5 rounded-lg flex flex-col justify-between space-y-2">
            <div>
              <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">
                <span>3. Forecasted Impact</span>
                <ProvenanceBadge source="Prototype Forecast" compact />
              </div>
              <p className="text-slate-200 text-xs leading-relaxed font-sans mt-1">
                {derived.forecastedImpact}
              </p>
            </div>
            <div className="text-[10px] text-amber-300/80 border-t border-white/5 pt-1.5">
              Trajectory: T+0h to T+96h
            </div>
          </div>

          {/* Box 4: Recommended Response & Simulator CTA */}
          <div className="bg-cyan-950/30 border border-cyan-800/60 p-3.5 rounded-lg flex flex-col justify-between space-y-2">
            <div>
              <div className="flex items-center justify-between text-cyan-300 text-[10px] uppercase font-bold tracking-wider mb-1">
                <span>4. Recommended Action</span>
                <span className="text-[10px] bg-cyan-500/20 text-cyan-200 px-1.5 rounded">Actionable</span>
              </div>
              <p className="text-slate-200 text-xs leading-relaxed font-sans mt-1 font-medium">
                {derived.recommendedResponse}
              </p>
            </div>
            <Link
              href="/simulator"
              className="mt-2 py-1.5 px-3 rounded bg-cyan-400 hover:bg-cyan-300 text-polar-950 text-xs font-bold font-mono flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Simulate in What-If Twin <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MAIN COMMAND INTERFACE: SPATIAL TWIN & ACTIVE ALERT RAIL      */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: 2D Spatial Twin Preview (2 Columns) */}
        <div className="lg:col-span-2 polar-card p-4 rounded-xl flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-white">
                Spatial Digital Twin • {metadata.name}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <ProvenanceBadge source="Derived Calculation" />
              <Link
                href="/digital-twin"
                className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1"
              >
                Inspect Twin Layers <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Interactive Schematic Diagram */}
          <div className="relative bg-polar-950 rounded-lg border border-polar-border p-4 h-72 flex flex-col justify-between overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:1.5rem_1.5rem] opacity-40 pointer-events-none" />

            <div className="relative z-10 flex items-center justify-between text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1.5 font-semibold text-slate-200">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                2D Spatial Twin Layout • Thermal & Electrical Coupling
              </span>
              <span>GPS: {metadata.coordinates.lat}°, {metadata.coordinates.lng}°</span>
            </div>

            {/* Asset Nodes */}
            <div className="relative z-10 grid grid-cols-3 gap-3 my-auto">
              {infrastructure.assets.slice(0, 6).map((asset) => {
                const isWarning = asset.status === 'warning';
                const isCritical = asset.status === 'critical' || asset.status === 'offline';
                const isGen2Failed = asset.assetId.includes('gen-02') && activeInjectedEvents.generator2Failure;

                return (
                  <Link
                    key={asset.assetId}
                    href={`/digital-twin`}
                    className={`p-2.5 rounded-lg border transition-all text-xs font-mono flex flex-col justify-between ${
                      isGen2Failed || isCritical
                        ? 'bg-rose-950/80 border-rose-500/80 hover:bg-rose-900/60 ring-1 ring-rose-500/50'
                        : isWarning
                        ? 'bg-amber-950/70 border-amber-500/60 hover:bg-amber-900/50'
                        : 'bg-polar-900/90 border-polar-border hover:border-cyan-400/60 hover:bg-polar-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 uppercase font-bold truncate">{asset.building}</span>
                      <span className={`w-2 h-2 rounded-full ${
                        isGen2Failed || isCritical ? 'bg-rose-500 animate-pulse' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                      }`} />
                    </div>
                    <span className="font-bold text-white mt-1 truncate">{asset.name}</span>
                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-white/5 text-[10px] text-slate-400">
                      <span>Health:</span>
                      <span className={`font-semibold ${
                        asset.health >= 80 ? 'text-emerald-400' : asset.health >= 60 ? 'text-amber-400' : 'text-rose-400'
                      }`}>
                        {isGen2Failed ? '0%' : `${asset.health}%`}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Schematic Footer Details */}
            <div className="relative z-10 flex items-center justify-between text-xs font-mono pt-2 border-t border-polar-border text-slate-400">
              <span>Nominal Assets: {healthyAssets}/{totalAssets}</span>
              <span className="text-slate-400">Heating Load: {derived.heatingLoadKw} kW</span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-3 gap-3 pt-1">
            <Link
              href="/simulator"
              className="py-2 px-3 rounded-lg bg-polar-900 hover:bg-polar-800 border border-polar-border text-xs font-mono text-center text-slate-200 font-semibold flex items-center justify-center gap-1.5 transition-all"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
              [ What-If Timeline ]
            </Link>
            <Link
              href="/alerts"
              className="py-2 px-3 rounded-lg bg-polar-900 hover:bg-polar-800 border border-polar-border text-xs font-mono text-center text-slate-200 font-semibold flex items-center justify-center gap-1.5 transition-all"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              [ Active Alerts ({activeAlerts.length}) ]
            </Link>
            <Link
              href="/logistics"
              className="py-2 px-3 rounded-lg bg-polar-900 hover:bg-polar-800 border border-polar-border text-xs font-mono text-center text-slate-200 font-semibold flex items-center justify-center gap-1.5 transition-all"
            >
              <FilePlus className="w-3.5 h-3.5 text-purple-400" />
              [ Resupply Runway ]
            </Link>
          </div>
        </div>

        {/* Right Rail: Alert & Risk Feed */}
        <div className="polar-card p-4 rounded-xl flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-rose-400" />
              <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-white">
                Live Alert Feed
              </h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-polar-800 text-slate-300 border border-polar-border">
              {activeAlerts.length} Active
            </span>
          </div>

          {/* Alert Cards */}
          <div className="space-y-3 flex-1 overflow-y-auto max-h-80 pr-1">
            {activeAlerts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 font-mono text-xs">
                <CheckCircle className="w-8 h-8 text-emerald-400 mb-2" />
                <p className="font-semibold text-slate-200">Station Telemetry Nominal</p>
                <p className="text-[11px] mt-1 text-slate-400">
                  Zero threshold violations active. Inject a stress scenario via the top Demo Controller to evaluate causal propagation.
                </p>
              </div>
            ) : (
              activeAlerts.map((alert) => (
                <div
                  key={alert.alertId}
                  className={`p-3 rounded-lg border text-xs font-mono space-y-2 ${
                    alert.severity === 'critical'
                      ? 'bg-rose-950/70 border-rose-500/50'
                      : 'bg-amber-950/60 border-amber-500/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-white leading-tight">{alert.title}</span>
                    <span className={`px-1.5 py-0.2 rounded text-[10px] uppercase font-bold shrink-0 ${
                      alert.severity === 'critical' ? 'bg-rose-500 text-white' : 'bg-amber-500 text-polar-950'
                    }`}>
                      {alert.severity}
                    </span>
                  </div>

                  {/* Causal Chain */}
                  <div className="bg-black/40 p-2 rounded text-[11px] space-y-1 text-slate-300">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Causal Trigger:</span>
                    {alert.cause.map((c, i) => (
                      <p key={i} className="text-slate-200 leading-snug">• {c}</p>
                    ))}
                  </div>

                  {/* Action recommendation */}
                  <div className="text-[11px] text-cyan-300">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Action: </span>
                    {alert.recommendations[0]}
                  </div>

                  <div className="flex justify-between items-center pt-1 border-t border-white/10 text-[10px]">
                    <span className="text-slate-400">{new Date(alert.createdAt).toLocaleTimeString()}</span>
                    {!alert.acknowledged ? (
                      <button
                        onClick={() => acknowledgeAlert(alert.alertId)}
                        className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors"
                      >
                        Acknowledge
                      </button>
                    ) : (
                      <span className="text-emerald-400 flex items-center gap-1 font-bold">
                        <CheckCircle className="w-3 h-3" /> Acknowledged
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Quick Stance Summary */}
          <div className="p-2.5 rounded bg-polar-900 border border-polar-border text-xs font-mono space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase">
              <span>Operational Stance</span>
              <span>{metadata.stationId.toUpperCase()}</span>
            </div>
            <p className="text-slate-200 text-xs">
              {derived.recommendedResponse}
            </p>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* FOUR SIH26060 DOMAINS (ENVIRONMENT, ENERGY, INFRA, LOGISTICS) */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Domain 1: Environment */}
        <Link href="/environment" className="polar-card p-4 rounded-xl hover:border-cyan-400 transition-all group">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-cyan-400" />
              <h3 className="font-mono text-xs font-bold text-white uppercase">1. Environment</h3>
            </div>
            <ProvenanceBadge source="Public Observation" compact />
          </div>

          <div className="space-y-2 mt-3 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Effective Temp:</span>
              <span className="font-bold text-white">{derived.effectiveTempC.toFixed(1)} °C</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Effective Wind:</span>
              <span className="font-bold text-white">{derived.effectiveWindKmh.toFixed(0)} km/h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Barometer:</span>
              <span className="text-slate-300">{environment.pressureHpa} hPa</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Blizzard Risk:</span>
              <span className={`font-bold uppercase ${
                environment.blizzardRisk === 'critical' ? 'text-rose-400' : 'text-emerald-400'
              }`}>
                {environment.blizzardRisk}
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-white/5 text-[10px] font-mono text-slate-400 flex items-center justify-between">
            <span>Thermal Load: {derived.heatingLoadKw} kW</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
          </div>
        </Link>

        {/* Domain 2: Energy */}
        <Link href="/energy" className="polar-card p-4 rounded-xl hover:border-amber-400 transition-all group">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <h3 className="font-mono text-xs font-bold text-white uppercase">2. Energy</h3>
            </div>
            <ProvenanceBadge source="Synthetic Telemetry" compact />
          </div>

          <div className="space-y-2 mt-3 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Total Demand:</span>
              <span className="font-bold text-cyan-300">{derived.totalDemandKw} kW</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Generation:</span>
              <span className="font-bold text-white">{derived.generationCapacityKw} kW</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Power Balance:</span>
              <span className={`font-bold ${derived.powerSurplusDeficitKw >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {derived.powerSurplusDeficitKw >= 0 ? `+${derived.powerSurplusDeficitKw}` : derived.powerSurplusDeficitKw} kW
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Battery SoC:</span>
              <span className={`font-bold ${derived.batterySocPercent < 50 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {derived.batterySocPercent}% ({derived.batteryStatus})
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-white/5 text-[10px] font-mono text-slate-400 flex items-center justify-between">
            <span>Burn: {derived.dailyFuelBurnLitres} L/day</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 transition-colors" />
          </div>
        </Link>

        {/* Domain 3: Infrastructure */}
        <Link href="/infrastructure" className="polar-card p-4 rounded-xl hover:border-emerald-400 transition-all group">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="font-mono text-xs font-bold text-white uppercase">3. Infrastructure</h3>
            </div>
            <ProvenanceBadge source="Derived Calculation" compact />
          </div>

          <div className="space-y-2 mt-3 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">System Health:</span>
              <span className="font-bold text-emerald-400">{derived.overallInfrastructureHealth}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">HVAC Health:</span>
              <span className="text-slate-200">{infrastructure.hvacHealth}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Pumps Health:</span>
              <span className="text-slate-200">{infrastructure.waterPumpHealth}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Asset Ratio:</span>
              <span className="text-slate-200">{healthyAssets} / {totalAssets} Nominal</span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-white/5 text-[10px] font-mono text-slate-400 flex items-center justify-between">
            <span>Gensets: {activeInjectedEvents.generator2Failure ? 'GEN-02 Offline' : 'All Online'}</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
          </div>
        </Link>

        {/* Domain 4: Logistics */}
        <Link href="/logistics" className="polar-card p-4 rounded-xl hover:border-purple-400 transition-all group">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-purple-400" />
              <h3 className="font-mono text-xs font-bold text-white uppercase">4. Logistics</h3>
            </div>
            <ProvenanceBadge source="Prototype Forecast" compact />
          </div>

          <div className="space-y-2 mt-3 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Fuel Runway:</span>
              <span className={`font-bold ${derived.fuelRunwayDays < 15 ? 'text-rose-400' : 'text-amber-300'}`}>
                {derived.fuelRunwayDays.toFixed(1)} days
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Food Rations:</span>
              <span className="text-slate-200">{foodItem?.daysRemaining.toFixed(1)} days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Medical Kits:</span>
              <span className="text-slate-200">{medItem?.daysRemaining.toFixed(1)} days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Resupply Vessel:</span>
              <span className="font-semibold text-slate-300">
                {activeInjectedEvents.resupplyDelay ? 'Delayed (ETA Nov 12)' : 'Nominal (ETA Oct 22)'}
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-white/5 text-[10px] font-mono text-slate-400 flex items-center justify-between">
            <span>Requisitions: {logistics.requisitions.length} logged</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-purple-400 transition-colors" />
          </div>
        </Link>
      </div>

      {/* Health Score Weights Modal */}
      {showWeightsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="polar-card-highlight p-6 rounded-2xl max-w-lg w-full space-y-4 font-mono text-xs border border-cyan-500/40">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-white text-base">Station Evaluation Weights</h3>
              </div>
              <button
                onClick={() => setShowWeightsModal(false)}
                className="text-slate-400 hover:text-white text-base"
              >
                ✕
              </button>
            </div>

            <p className="text-slate-300 text-[11px]">
              Deterministic cross-domain evaluation weights:
              <br />
              <code className="text-cyan-300">health = w_env*Env + w_eng*Energy + w_inf*Infra + w_log*Logistics</code>
            </p>

            <div className="space-y-3 pt-1">
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Environment Domain Weight:</span>
                  <span className="font-bold text-cyan-300">{Math.round(weights.environment * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={50}
                  value={Math.round(weights.environment * 100)}
                  onChange={(e) => setWeights({ ...weights, environment: Number(e.target.value) / 100 })}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Energy Domain Weight:</span>
                  <span className="font-bold text-amber-300">{Math.round(weights.energy * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={50}
                  value={Math.round(weights.energy * 100)}
                  onChange={(e) => setWeights({ ...weights, energy: Number(e.target.value) / 100 })}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Infrastructure Domain Weight:</span>
                  <span className="font-bold text-emerald-400">{Math.round(weights.infrastructure * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={50}
                  value={Math.round(weights.infrastructure * 100)}
                  onChange={(e) => setWeights({ ...weights, infrastructure: Number(e.target.value) / 100 })}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Logistics Domain Weight:</span>
                  <span className="font-bold text-purple-400">{Math.round(weights.logistics * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={50}
                  value={Math.round(weights.logistics * 100)}
                  onChange={(e) => setWeights({ ...weights, logistics: Number(e.target.value) / 100 })}
                  className="w-full accent-purple-400 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
              <button
                onClick={() => {
                  setWeights({ environment: 0.20, energy: 0.30, infrastructure: 0.25, logistics: 0.25 });
                }}
                className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Reset Defaults
              </button>
              <button
                onClick={() => setShowWeightsModal(false)}
                className="px-4 py-1.5 rounded bg-cyan-400 hover:bg-cyan-300 text-polar-950 font-bold"
              >
                Apply Weights
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
