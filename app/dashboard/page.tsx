'use client';

import React, { useState } from 'react';
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
  CheckCircle2, 
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
  ChevronRight,
  ShieldAlert,
  Compass,
  CheckCircle,
  HelpCircle,
  Gauge,
  X
} from 'lucide-react';
import ProvenanceBadge from '@/components/common/ProvenanceBadge';
import StationTwin2D from '@/components/twin/StationTwin2D';
import { StationId } from '@/types';

export default function DashboardPage() {
  const { 
    stationState, 
    allStationsState,
    currentStationId, 
    setCurrentStationId, 
    acknowledgeAlert,
    activeInjectedEvents,
    derived 
  } = useStation();

  const [selectedAssetId, setSelectedAssetId] = useState<string>('bhr-gen-2');
  const [showExplainModal, setShowExplainModal] = useState<boolean>(false);
  const [activeExplainAlert, setActiveExplainAlert] = useState<any>(null);

  const { metadata, environment, energy, infrastructure, logistics, healthScore, activeAlerts } = stationState;

  const maitriState = allStationsState['maitri'];
  const bharatiState = allStationsState['bharati'];

  const criticalCount = activeAlerts.filter(a => a.severity === 'critical').length;
  const warningCount = activeAlerts.filter(a => a.severity === 'warning').length;

  // Question 2: What is current operational status? (Never say "STABLE" when alerts exist)
  const stationStatusLabel = criticalCount > 0 
    ? 'CRITICAL ANOMALY'
    : warningCount > 0 || derived.powerSurplusDeficitKw < 0
    ? 'ELEVATED RISK'
    : 'MONITORING';

  const stationStatusColor = criticalCount > 0
    ? 'bg-rose-500/20 text-rose-300 border-rose-500/60 animate-pulse'
    : warningCount > 0 || derived.powerSurplusDeficitKw < 0
    ? 'bg-amber-500/20 text-amber-300 border-amber-500/60'
    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60';

  // Section 5: Prominent Power Balance
  const netPowerKw = derived.powerSurplusDeficitKw;
  const isDeficit = netPowerKw < 0;

  // Section 9: Operational Impact Strip (5 Domains)
  const impactStrip = {
    energy: isDeficit ? (Math.abs(netPowerKw) > 50 ? 'CRITICAL' : 'WARNING') : activeInjectedEvents.extremeCold ? 'WATCH' : 'NORMAL',
    water: infrastructure.waterPumpHealth < 75 ? 'WARNING' : 'NORMAL',
    lifeSupport: activeInjectedEvents.extremeCold && isDeficit ? 'CRITICAL' : activeInjectedEvents.extremeCold ? 'WARNING' : 'NORMAL',
    communications: activeInjectedEvents.highWind ? 'WARNING' : metadata.connectivityState === 'DISCONNECTED' ? 'CRITICAL' : metadata.connectivityState === 'INTERMITTENT' ? 'WATCH' : 'NORMAL',
    logistics: derived.fuelRunwayDays < 15 ? 'CRITICAL' : derived.fuelRunwayDays < 22 || activeInjectedEvents.resupplyDelay ? 'WARNING' : 'NORMAL',
  };

  const getImpactBadgeClass = (status: string) => {
    switch (status) {
      case 'CRITICAL':
        return 'bg-rose-600 text-white font-bold animate-pulse';
      case 'WARNING':
        return 'bg-amber-500/25 text-amber-300 border border-amber-500/50 font-bold';
      case 'WATCH':
        return 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-semibold';
      case 'NORMAL':
      default:
        return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40';
    }
  };

  // Section 11: Next 24 Hours Compact Timeline
  const next24hTimeline = [
    {
      label: 'NOW',
      time: 'T+0H',
      weather: `${derived.effectiveTempC.toFixed(1)}°C, ${derived.effectiveWindKmh}km/h`,
      demand: `${derived.totalDemandKw} kW`,
      battery: `${derived.batterySocPercent}%`,
      fuelRunway: `${derived.fuelRunwayDays.toFixed(1)}d`,
      maintRisk: activeAlerts.length > 0 ? 'HIGH' : 'LOW',
      logRisk: derived.fuelRunwayDays < 15 ? 'CRITICAL' : 'SAFE',
    },
    {
      label: '+6H',
      time: 'T+6H',
      weather: `${(derived.effectiveTempC - 0.8).toFixed(1)}°C, ${derived.effectiveWindKmh + 2}km/h`,
      demand: `${derived.totalDemandKw + 8} kW`,
      battery: isDeficit ? `${Math.max(0, derived.batterySocPercent - 28)}%` : `${derived.batterySocPercent}%`,
      fuelRunway: `${Math.max(0, derived.fuelRunwayDays - 0.3).toFixed(1)}d`,
      maintRisk: isDeficit ? 'CRITICAL' : 'LOW',
      logRisk: derived.fuelRunwayDays < 15 ? 'CRITICAL' : 'SAFE',
    },
    {
      label: '+12H',
      time: 'T+12H',
      weather: `${(derived.effectiveTempC - 1.4).toFixed(1)}°C, ${derived.effectiveWindKmh + 5}km/h`,
      demand: `${derived.totalDemandKw + 14} kW`,
      battery: isDeficit ? `${Math.max(0, derived.batterySocPercent - 55)}%` : `${derived.batterySocPercent}%`,
      fuelRunway: `${Math.max(0, derived.fuelRunwayDays - 0.6).toFixed(1)}d`,
      maintRisk: isDeficit ? 'CRITICAL' : 'LOW',
      logRisk: derived.fuelRunwayDays < 18 ? 'WARNING' : 'SAFE',
    },
    {
      label: '+24H',
      time: 'T+24H',
      weather: `${(derived.effectiveTempC - 2.1).toFixed(1)}°C, ${derived.effectiveWindKmh + 8}km/h`,
      demand: `${derived.totalDemandKw + 22} kW`,
      battery: isDeficit ? '0% (DEPLETED)' : `${derived.batterySocPercent}%`,
      fuelRunway: `${Math.max(0, derived.fuelRunwayDays - 1.2).toFixed(1)}d`,
      maintRisk: isDeficit ? 'CRITICAL' : 'LOW',
      logRisk: derived.fuelRunwayDays < 15 ? 'CRITICAL' : 'PROJECTED SHORTAGE',
    },
  ];

  // Asset Dependency Graph mapping
  const assetDependencyMap: Record<string, { system: string; cascade: string[]; risk: string }> = {
    'bhr-gen-2': {
      system: 'Auxiliary Diesel Genset #2 (220kW)',
      cascade: ['Generator #2 Trip', 'Microgrid Deficit (-190kW)', 'Battery Discharging', 'HVAC Load Priority', 'Fuel Reserves Draw', 'Life Support Risk'],
      risk: activeInjectedEvents.generator2Failure ? 'CRITICAL DEFICIT' : 'STANDBY NOMINAL',
    },
    'bhr-gen-1': {
      system: 'Primary Diesel Genset #1 (220kW)',
      cascade: ['Primary Generator', 'Microgrid Backbone', 'Station Baseload', 'Fuel Tank Manifold', 'Thermal Cogeneration Loop'],
      risk: 'NOMINAL ONLINE',
    },
    'bhr-hvac-1': {
      system: 'Central HVAC & Air Balancing Exchangers',
      cascade: ['Exterior Heat Convection', 'Indoor 21°C Setpoint', 'HVAC Electrical Draw', 'Microgrid Demand Surge', 'Fuel Burn Acceleration'],
      risk: activeInjectedEvents.extremeCold ? 'THERMAL OVERDRIVE' : 'NOMINAL BALANCED',
    },
    'bhr-fuel-1': {
      system: 'Cryogenic Fuel Storage & Manifold Tanks',
      cascade: ['Fuel Storage (9,400 L)', 'Daily Burn Rate', 'Resupply Vessel Buffer', 'Icebreaker ETA Window', 'Autonomous Station Runway'],
      risk: derived.fuelRunwayDays < 15 ? 'CRITICAL RUNWAY' : 'BUFFER NOMINAL',
    },
    'bhr-water-1': {
      system: 'Water RO Desalination & Intake Loop',
      cascade: ['Lake/Seawater Intake', 'Trace Heating Cable', 'RO High Pressure Pump', 'Potable Water Tank', 'Galley Life Support'],
      risk: 'NOMINAL PURIFYING',
    },
    'bhr-comms-1': {
      system: 'SATCOM Radome & Ku/Ka Array',
      cascade: ['Tracking Radome', 'Satellite Up/Downlink', 'NCPOR Mission Control Sync', 'Edge Queue Synchronization', 'Emergency Telemetry'],
      risk: activeInjectedEvents.highWind ? 'KATABATIC GUST WARNING' : 'ONLINE LINKED',
    },
  };

  const selectedDependency = assetDependencyMap[selectedAssetId] || assetDependencyMap['bhr-gen-2'];

  const fuelItem = logistics.inventory.find(i => i.category === 'fuel');
  const foodItem = logistics.inventory.find(i => i.category === 'food');
  const medItem = logistics.inventory.find(i => i.category === 'medical');

  return (
    <div className="flex-1 p-4 md:p-6 space-y-5 max-w-7xl mx-auto w-full font-mono text-xs">
      {/* ============================================================== */}
      {/* 1. DUAL STATION COMMAND BAR & PROMINENT STATUS BLOCK           */}
      {/* (Answers: Which station? Current operational status? What's wrong?) */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Station Selector & Prominent Identity Card */}
        <div className="lg:col-span-2 polar-card p-4 rounded-xl border border-polar-border flex flex-col justify-between space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 flex items-center justify-center font-bold text-sm">
                {metadata.stationId === 'maitri' ? 'MTR' : 'BHR'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold text-white tracking-tight uppercase">
                    {metadata.name} Research Station
                  </h1>
                  <span className="text-xs text-slate-400">({metadata.hindiName})</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {metadata.region} • GPS: {metadata.coordinates.lat}°, {metadata.coordinates.lng}° • Elev: {metadata.coordinates.elevationM}m • Personnel: {metadata.currentPersonnel}
                </p>
              </div>
            </div>

            {/* Station Switcher Pills */}
            <div className="flex items-center gap-1.5 bg-polar-900 border border-polar-border rounded-lg p-1">
              <button
                onClick={() => setCurrentStationId('maitri')}
                className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                  currentStationId === 'maitri'
                    ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                MAITRI
              </button>
              <button
                onClick={() => setCurrentStationId('bharati')}
                className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                  currentStationId === 'bharati'
                    ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                BHARATI
              </button>
            </div>
          </div>

          {/* Prominent Station Status Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            {/* Health Score */}
            <div className="p-3 bg-polar-950 rounded-lg border border-polar-border flex flex-col justify-between">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Station Health</span>
              <div className={`text-2xl font-bold mt-0.5 ${
                derived.overallHealthScore >= 80 ? 'text-emerald-400' :
                derived.overallHealthScore >= 60 ? 'text-amber-400' : 'text-rose-400'
              }`}>
                {derived.overallHealthScore}%
              </div>
              <span className="text-[9px] text-slate-400">Multi-domain index</span>
            </div>

            {/* Operational Status (Never says "STABLE" if alerts exist) */}
            <div className="p-3 bg-polar-950 rounded-lg border border-polar-border flex flex-col justify-between">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Operational Status</span>
              <div className="my-1">
                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${stationStatusColor}`}>
                  {stationStatusLabel}
                </span>
              </div>
              <span className="text-[9px] text-slate-400">{metadata.stationId.toUpperCase()} Core</span>
            </div>

            {/* Active Alerts Count */}
            <div className="p-3 bg-polar-950 rounded-lg border border-polar-border flex flex-col justify-between">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Unresolved Alerts</span>
              <div className="text-sm font-bold mt-1 flex items-center justify-center gap-1.5">
                <span className={criticalCount > 0 ? 'text-rose-400' : 'text-slate-400'}>
                  {criticalCount} CRITICAL
                </span>
                <span className="text-slate-600">/</span>
                <span className={warningCount > 0 ? 'text-amber-400' : 'text-slate-400'}>
                  {warningCount} WARN
                </span>
              </div>
              <span className="text-[9px] text-slate-400">Realtime threshold violations</span>
            </div>

            {/* Satellite Link */}
            <div className="p-3 bg-polar-950 rounded-lg border border-polar-border flex flex-col justify-between">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Edge Telemetry Link</span>
              <div className={`text-sm font-bold mt-1 uppercase ${
                metadata.connectivityState === 'CONNECTED' ? 'text-emerald-400' :
                metadata.connectivityState === 'INTERMITTENT' ? 'text-amber-400' : 'text-rose-400'
              }`}>
                {metadata.connectivityState === 'CONNECTED' ? 'ONLINE (100%)' : metadata.connectivityState}
              </div>
              <span className="text-[9px] text-slate-400">Sync: {new Date(stationState.metadata.lastSync || Date.now()).toLocaleTimeString()}</span>
            </div>
          </div>
        </div>

        {/* Right: Section 5 - Unambiguous Power Balance Box */}
        <div className={`polar-card p-4 rounded-xl border flex flex-col justify-between space-y-2 ${
          isDeficit 
            ? 'border-rose-500/70 bg-rose-950/30' 
            : 'border-emerald-500/60 bg-emerald-950/20'
        }`}>
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-[10px] uppercase font-bold text-slate-300">Station Microgrid Balance</span>
            <ProvenanceBadge source="Derived Calculation" compact />
          </div>

          <div className="py-2 text-center">
            <div className={`text-3xl font-black ${isDeficit ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
              {isDeficit ? `${netPowerKw} kW` : `+${netPowerKw} kW`}
            </div>
            <div className={`text-xs font-bold uppercase tracking-wider mt-0.5 ${isDeficit ? 'text-rose-300' : 'text-emerald-300'}`}>
              {isDeficit ? 'POWER DEFICIT' : 'POWER RESERVE'}
            </div>
          </div>

          <div className="p-2.5 rounded bg-polar-950 border border-polar-border grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-slate-400 block text-[9px] uppercase">Generation Capacity</span>
              <span className="font-bold text-white">{derived.generationCapacityKw} kW</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block text-[9px] uppercase">Total Demand Draw</span>
              <span className="font-bold text-cyan-300">{derived.totalDemandKw} kW</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
            <span>BESS Battery: <strong className={derived.batterySocPercent < 40 ? 'text-rose-400' : 'text-emerald-400'}>{derived.batterySocPercent}%</strong> ({derived.batteryStatus})</span>
            <span>Fuel Burn: <strong className="text-amber-300">{derived.dailyFuelBurnLitres} L/d</strong></span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. OPERATIONAL IMPACT STRIP (5 Subsystems: Energy, Water, ...) */}
      {/* ============================================================== */}
      <div className="polar-card p-3 rounded-xl border border-polar-border">
        <div className="flex items-center justify-between mb-2 px-1 text-[10px] text-slate-400 uppercase font-bold">
          <span>Subsystem Operational Health Strip:</span>
          <span>Automatic Digital Twin Telemetry Feed</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {/* Energy */}
          <div className="p-2.5 rounded-lg bg-polar-950 border border-polar-border flex items-center justify-between">
            <span className="font-bold text-white text-xs">Energy</span>
            <span className={`px-2 py-0.5 rounded text-[9px] ${getImpactBadgeClass(impactStrip.energy)}`}>
              {impactStrip.energy}
            </span>
          </div>

          {/* Water */}
          <div className="p-2.5 rounded-lg bg-polar-950 border border-polar-border flex items-center justify-between">
            <span className="font-bold text-white text-xs">Water</span>
            <span className={`px-2 py-0.5 rounded text-[9px] ${getImpactBadgeClass(impactStrip.water)}`}>
              {impactStrip.water}
            </span>
          </div>

          {/* Life Support */}
          <div className="p-2.5 rounded-lg bg-polar-950 border border-polar-border flex items-center justify-between">
            <span className="font-bold text-white text-xs">Life Support</span>
            <span className={`px-2 py-0.5 rounded text-[9px] ${getImpactBadgeClass(impactStrip.lifeSupport)}`}>
              {impactStrip.lifeSupport}
            </span>
          </div>

          {/* Communications */}
          <div className="p-2.5 rounded-lg bg-polar-950 border border-polar-border flex items-center justify-between">
            <span className="font-bold text-white text-xs">Communications</span>
            <span className={`px-2 py-0.5 rounded text-[9px] ${getImpactBadgeClass(impactStrip.communications)}`}>
              {impactStrip.communications}
            </span>
          </div>

          {/* Logistics */}
          <div className="p-2.5 rounded-lg bg-polar-950 border border-polar-border flex items-center justify-between">
            <span className="font-bold text-white text-xs">Logistics</span>
            <span className={`px-2 py-0.5 rounded text-[9px] ${getImpactBadgeClass(impactStrip.logistics)}`}>
              {impactStrip.logistics}
            </span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. PRIMARY CROSS-DOMAIN RISK ENGINE (WHAT → WHY → IMPACT → ACT)*/}
      {/* ============================================================== */}
      <div className="polar-card p-5 rounded-xl border border-polar-border space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <AlertOctagon className={`w-5 h-5 ${
              derived.crossDomainRisk === 'critical' ? 'text-rose-400 animate-pulse' :
              derived.crossDomainRisk === 'warning' ? 'text-amber-400' : 'text-emerald-400'
            }`} />
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                Operational Incident Assessment:
              </span>
              <span className="font-bold text-white text-sm sm:text-base leading-tight">
                {derived.activeIncident}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ProvenanceBadge source="Derived Calculation" />
            <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase border ${
              derived.crossDomainRisk === 'critical' ? 'bg-rose-500/20 text-rose-300 border-rose-500/50' :
              derived.crossDomainRisk === 'warning' ? 'bg-amber-500/20 text-amber-300 border-amber-500/50' :
              'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
            }`}>
              Risk: {derived.crossDomainRisk}
            </span>
          </div>
        </div>

        {/* WHAT → WHY → AFFECTED → IMPACT → ACTION 5-Box Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* Box 1: WHAT (Event & Severity) */}
          <div className="p-3 bg-polar-950 rounded-lg border border-polar-border flex flex-col justify-between space-y-2">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">1. Event / What</span>
              <p className="text-white font-semibold text-[11px] leading-snug">
                {activeAlerts[0]?.title || 'Nominal operations across primary and auxiliary systems.'}
              </p>
            </div>
            <div className="text-[10px] text-slate-400 pt-1 border-t border-white/5">
              Severity: <strong className={criticalCount > 0 ? 'text-rose-400' : 'text-emerald-400'}>{criticalCount > 0 ? 'CRITICAL' : 'NOMINAL'}</strong>
            </div>
          </div>

          {/* Box 2: WHY (Root Cause & Sensor Telemetry) */}
          <div className="p-3 bg-polar-950 rounded-lg border border-polar-border flex flex-col justify-between space-y-2">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">2. Why It Happened</span>
              <p className="text-slate-300 text-[11px] leading-snug">
                {derived.rootCause}
              </p>
            </div>
            <div className="text-[10px] text-cyan-300 pt-1 border-t border-white/5">
              Temp: {derived.effectiveTempC.toFixed(1)}°C • HVAC: {derived.heatingLoadKw}kW
            </div>
          </div>

          {/* Box 3: AFFECTED (Connected Systems Cascade) */}
          <div className="p-3 bg-polar-950 rounded-lg border border-polar-border flex flex-col justify-between space-y-2">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">3. Affected Systems</span>
              <p className="text-amber-300 text-[11px] leading-snug">
                {activeInjectedEvents.generator2Failure 
                  ? 'Genset #2 → Microgrid → Battery BESS → Fuel Reserves' 
                  : activeInjectedEvents.extremeCold 
                  ? 'Ambient Boundary → HVAC Loop → Thermal Draw' 
                  : activeInjectedEvents.resupplyDelay 
                  ? 'Prydz Bay Sea Ice → Vessel Cargo → Station Fuel Buffer' 
                  : 'All primary subsystems operating in equilibrium'}
              </p>
            </div>
            <div className="text-[10px] text-slate-400 pt-1 border-t border-white/5">
              Domain: Cross-Domain Coupling
            </div>
          </div>

          {/* Box 4: IMPACT (What Happens Next) */}
          <div className="p-3 bg-polar-950 rounded-lg border border-polar-border flex flex-col justify-between space-y-2">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">4. Expected Impact</span>
              <p className="text-slate-300 text-[11px] leading-snug">
                {derived.forecastedImpact}
              </p>
            </div>
            <div className="text-[10px] text-rose-300 pt-1 border-t border-white/5">
              Horizon: T+0h to T+24h Trajectory
            </div>
          </div>

          {/* Box 5: ACTION & Direct Simulator CTA */}
          <div className="p-3 bg-cyan-950/40 rounded-lg border border-cyan-800/60 flex flex-col justify-between space-y-2">
            <div>
              <span className="text-[10px] text-cyan-300 uppercase font-bold block mb-1">5. Operator Action</span>
              <p className="text-slate-200 text-[11px] leading-snug font-medium">
                {derived.recommendedResponse}
              </p>
            </div>
            <div className="flex flex-col gap-1.5 pt-1 border-t border-white/10">
              <button
                onClick={() => {
                  setActiveExplainAlert(activeAlerts[0] || null);
                  setShowExplainModal(true);
                }}
                className="py-1 px-2 rounded bg-polar-900 hover:bg-polar-800 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold text-center transition-colors flex items-center justify-center gap-1"
              >
                <HelpCircle className="w-3 h-3" /> [EXPLAIN RISK]
              </button>
              <Link
                href="/simulator"
                className="py-1 px-2 rounded bg-cyan-400 hover:bg-cyan-300 text-polar-950 text-[10px] font-bold text-center transition-colors shadow-sm flex items-center justify-center gap-1"
              >
                <SlidersHorizontal className="w-3 h-3" /> [SIMULATE IMPACT]
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. DIGITAL TWIN (2D) & OPERATIONAL DEPENDENCY GRAPH             */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Columns: 2D Spatial Schematic */}
        <div className="lg:col-span-2 space-y-3">
          <StationTwin2D
            stationId={metadata.stationId}
            assets={infrastructure.assets}
            selectedAssetId={selectedAssetId}
            onSelectAsset={(id) => setSelectedAssetId(id)}
          />

          {/* Dependency Graph Strip Under Twin */}
          <div className="p-3 rounded-xl bg-polar-900 border border-polar-border space-y-2">
            <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-bold">
              <span>Operational Dependency Graph for Selected Asset:</span>
              <span className="text-cyan-400">{selectedDependency.system}</span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              {selectedDependency.cascade.map((node, idx) => (
                <React.Fragment key={idx}>
                  <span className={`px-2 py-0.5 rounded border ${
                    idx === 0 
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50 font-bold'
                      : idx === selectedDependency.cascade.length - 1
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 font-bold'
                      : 'bg-polar-950 text-slate-300 border-polar-border'
                  }`}>
                    {node}
                  </span>
                  {idx < selectedDependency.cascade.length - 1 && (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Column: Next 24 Hours Compact Predictive Timeline */}
        <div className="polar-card p-4 rounded-xl border border-polar-border flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span className="font-bold text-white uppercase text-xs">Next 24 Hours Predictive Timeline</span>
            </div>
            <ProvenanceBadge source="Prototype Forecast" compact />
          </div>

          <p className="text-[10px] text-slate-400">
            Deterministic forward projection of microgrid demand, battery drainage, and fuel burn:
          </p>

          <div className="space-y-2 flex-1">
            {next24hTimeline.map((step) => (
              <div key={step.label} className="p-2.5 rounded-lg bg-polar-950 border border-polar-border text-[11px] space-y-1">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-cyan-300">{step.label} ({step.time})</span>
                  <span className={`px-1.5 py-0.2 rounded text-[9px] ${
                    step.maintRisk === 'CRITICAL' ? 'bg-rose-500 text-white font-bold' : 'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    {step.maintRisk}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-300">
                  <div>Weather: {step.weather}</div>
                  <div>Demand: <strong className="text-white">{step.demand}</strong></div>
                  <div>Battery: <strong className={step.battery.includes('0%') ? 'text-rose-400' : 'text-emerald-400'}>{step.battery}</strong></div>
                  <div>Fuel Runway: <strong className="text-amber-300">{step.fuelRunway}</strong></div>
                </div>
              </div>
            ))}
          </div>

          <Link
            href="/simulator"
            className="w-full py-1.5 px-3 rounded bg-polar-900 hover:bg-polar-800 text-cyan-300 border border-polar-border text-xs font-bold text-center transition-colors flex items-center justify-center gap-1.5"
          >
            Open Multi-Day Simulator (T+96h) <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 5. FOUR DOMAIN CARDS (ENVIRONMENT, ENERGY, INFRA, LOGISTICS)  */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Domain 1: Environment */}
        <Link href="/environment" className="polar-card p-4 rounded-xl border border-polar-border hover:border-cyan-400 transition-all group space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-cyan-400" />
              <h3 className="font-bold text-white uppercase text-xs">1. Environment</h3>
            </div>
            <ProvenanceBadge source="Public Observation" compact />
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Ambient Temp:</span>
              <span className="font-bold text-white">{derived.effectiveTempC.toFixed(1)} °C</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Wind Velocity:</span>
              <span className="font-bold text-white">{derived.effectiveWindKmh.toFixed(0)} km/h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Weather Risk:</span>
              <span className={`font-bold uppercase ${environment.blizzardRisk === 'critical' ? 'text-rose-400' : 'text-emerald-400'}`}>
                {environment.blizzardRisk}
              </span>
            </div>
            <div className="flex justify-between pt-1 border-t border-white/5 text-[11px]">
              <span className="text-cyan-300 font-semibold">Impact on HVAC:</span>
              <span className="font-bold text-white">+{derived.heatingLoadKw} kW Draw</span>
            </div>
          </div>
        </Link>

        {/* Domain 2: Energy */}
        <Link href="/energy" className="polar-card p-4 rounded-xl border border-polar-border hover:border-amber-400 transition-all group space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-white uppercase text-xs">2. Energy</h3>
            </div>
            <ProvenanceBadge source="Synthetic Telemetry" compact />
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Generation:</span>
              <span className="font-bold text-white">{derived.generationCapacityKw} kW</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Demand:</span>
              <span className="font-bold text-cyan-300">{derived.totalDemandKw} kW</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Net Power:</span>
              <span className={`font-bold ${isDeficit ? 'text-rose-400' : 'text-emerald-400'}`}>
                {isDeficit ? `${netPowerKw} kW Deficit` : `+${netPowerKw} kW Reserve`}
              </span>
            </div>
            <div className="flex justify-between pt-1 border-t border-white/5 text-[11px]">
              <span className="text-amber-300 font-semibold">Battery / Fuel:</span>
              <span className="font-bold text-white">{derived.batterySocPercent}% / {derived.fuelRunwayDays.toFixed(1)}d</span>
            </div>
          </div>
        </Link>

        {/* Domain 3: Infrastructure */}
        <Link href="/infrastructure" className="polar-card p-4 rounded-xl border border-polar-border hover:border-emerald-400 transition-all group space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-white uppercase text-xs">3. Infrastructure</h3>
            </div>
            <ProvenanceBadge source="Derived Calculation" compact />
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">System Health:</span>
              <span className="font-bold text-emerald-400">{derived.overallInfrastructureHealth}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Active Anomalies:</span>
              <span className={`font-bold ${activeInjectedEvents.generator2Failure ? 'text-rose-400' : 'text-emerald-400'}`}>
                {activeInjectedEvents.generator2Failure ? 'Gen #2 Lockout' : '0 Anomalies'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Next Service:</span>
              <span className="text-slate-200">2026-10-18</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-white/5 text-[11px]">
              <span className="text-emerald-300 font-semibold">Fleet Condition:</span>
              <span className="font-bold text-white">{infrastructure.assets.filter(a => a.status === 'running' || a.status === 'operational').length} / {infrastructure.assets.length} Online</span>
            </div>
          </div>
        </Link>

        {/* Domain 4: Logistics */}
        <Link href="/logistics" className="polar-card p-4 rounded-xl border border-polar-border hover:border-purple-400 transition-all group space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-purple-400" />
              <h3 className="font-bold text-white uppercase text-xs">4. Logistics</h3>
            </div>
            <ProvenanceBadge source="Prototype Forecast" compact />
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Fuel Runway:</span>
              <span className={`font-bold ${derived.fuelRunwayDays < 15 ? 'text-rose-400' : 'text-amber-300'}`}>
                {derived.fuelRunwayDays.toFixed(1)} days
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Food / Med:</span>
              <span className="text-slate-200">{foodItem?.daysRemaining.toFixed(0)}d / {medItem?.daysRemaining.toFixed(0)}d</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Resupply ETA:</span>
              <span className="text-slate-200">{activeInjectedEvents.resupplyDelay ? 'Nov 3 (Delayed)' : 'Oct 22 (Nominal)'}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-white/5 text-[11px]">
              <span className="text-purple-300 font-semibold">Shortage Window:</span>
              <span className="font-bold text-white">{fuelItem?.projectedShortageDate || '2026-10-22'}</span>
            </div>
          </div>
        </Link>
      </div>

      {/* ============================================================== */}
      {/* 6. EXPLAIN RISK MODAL / DRAWER (#8 IN USER SPEC)               */}
      {/* Telemetry ↓ Anomaly ↓ Asset Degradation ↓ Subsystem ↓ Risk     */}
      {/* ============================================================== */}
      {showExplainModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="polar-card-highlight p-6 rounded-2xl max-w-2xl w-full space-y-4 border border-rose-500/50 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-rose-400" />
                <h3 className="font-bold text-white text-base">Explain Risk — Causal Propagation Chain</h3>
              </div>
              <button
                onClick={() => setShowExplainModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-slate-300 text-xs leading-relaxed">
              Polar Command uses physics-based deterministic coupling to evaluate how telemetry threshold deviations cascade across station microgrid, life support, and logistics runways:
            </p>

            {/* 5-Step Causal Chain */}
            <div className="space-y-2">
              {[
                { 
                  level: '1. Telemetry Deviation', 
                  detail: `Ambient ground sensor: ${derived.effectiveTempC.toFixed(1)}°C (Katabatic wind: ${derived.effectiveWindKmh} km/h). External convective heat loss verified.`,
                  provenance: 'Public Observation',
                  color: 'border-cyan-500/40 text-cyan-300 bg-cyan-950/30'
                },
                { 
                  level: '2. Subsystem Anomaly Signal', 
                  detail: activeInjectedEvents.generator2Failure 
                    ? 'Generator #2 mechanical lockout signal triggered (zero output detected against 451 kW station demand).'
                    : `HVAC thermal balancing loop draw climbed to ${derived.heatingLoadKw} kW to sustain life support envelope.`,
                  provenance: 'Synthetic Telemetry',
                  color: 'border-amber-500/40 text-amber-300 bg-amber-950/30'
                },
                { 
                  level: '3. Asset Degradation', 
                  detail: isDeficit 
                    ? `Primary Genset #1 running near 100% rated capacity. BESS battery forced into continuous emergency discharge.` 
                    : `Fuel pump delivery rate accelerated to ${derived.dailyFuelBurnLitres} Litres/day.`,
                  provenance: 'Derived Calculation',
                  color: 'border-orange-500/40 text-orange-300 bg-orange-950/30'
                },
                { 
                  level: '4. Subsystem Impact', 
                  detail: isDeficit 
                    ? `Station Microgrid deficit of ${Math.abs(netPowerKw)} kW cannot sustain tier-3 science laboratories and non-critical quarters.`
                    : `Fuel reserves buffer contracting faster than nominal maritime replenishment schedule.`,
                  provenance: 'Derived Calculation',
                  color: 'border-rose-500/40 text-rose-300 bg-rose-950/30'
                },
                { 
                  level: '5. Operational Risk Verdict', 
                  detail: `${derived.activeIncident}. Mandated response: ${derived.recommendedResponse}`,
                  provenance: 'Prototype Forecast',
                  color: 'border-red-600 text-red-200 bg-red-950/50 font-bold'
                },
              ].map((step, idx) => (
                <div key={idx} className={`p-3 rounded-lg border ${step.color} flex items-start gap-2.5`}>
                  <span className="w-5 h-5 rounded-full bg-black/50 border border-current flex items-center justify-center text-[10px] font-bold shrink-0">
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">{step.level}</span>
                      <ProvenanceBadge source={step.provenance} compact />
                    </div>
                    <p className="text-[11px] opacity-90 mt-0.5">{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-lg bg-polar-900 border border-polar-border text-[11px] text-slate-300 flex justify-between items-center">
              <span>Operational Risk Severity: <strong className="text-rose-400 uppercase">{derived.crossDomainRisk}</strong></span>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowExplainModal(false)}
                  className="px-3 py-1.5 rounded bg-polar-800 hover:bg-polar-700 text-white font-bold"
                >
                  Close
                </button>
                <Link
                  href="/simulator"
                  className="px-3 py-1.5 rounded bg-cyan-400 hover:bg-cyan-300 text-polar-950 font-bold flex items-center gap-1"
                >
                  Simulate in What-If Twin →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
