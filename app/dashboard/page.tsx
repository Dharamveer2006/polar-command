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
  Radio,
  Fuel,
  BatteryCharging,
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
  X,
  Layers,
  Globe2,
  HardHat,
  HeartPulse,
  Share2,
  Server
} from 'lucide-react';
import ProvenanceBadge from '@/components/common/ProvenanceBadge';
import StationTwin2D from '@/components/twin/StationTwin2D';
import { StationId, StationMode } from '@/types';

export default function DashboardPage() {
  const { 
    stationState, 
    allStationsState,
    currentStationId, 
    setCurrentStationId, 
    acknowledgeAlert,
    activeInjectedEvents,
    derived,
    stationMode,
    setStationMode,
    missionTimeline 
  } = useStation();

  const [selectedAssetId, setSelectedAssetId] = useState<string>('bhr-gen-2');
  const [showExplainModal, setShowExplainModal] = useState<boolean>(false);
  const [activeExplainAlert, setActiveExplainAlert] = useState<any>(null);

  const { metadata, environment, energy, infrastructure, logistics, healthScore, activeAlerts } = stationState;

  const maitriState = allStationsState['maitri'];
  const bharatiState = allStationsState['bharati'];

  const criticalCount = activeAlerts.filter(a => a.severity === 'critical').length;
  const warningCount = activeAlerts.filter(a => a.severity === 'warning').length;

  // Section 10: Operational Status (Only: NOMINAL, WATCH, WARNING, CRITICAL)
  // Never display "STATION STABLE" when active unresolved alerts imply otherwise
  const operationalStatus: 'NOMINAL' | 'WATCH' | 'WARNING' | 'CRITICAL' = criticalCount > 0 
    ? 'CRITICAL'
    : (warningCount > 0 || derived.powerSurplusDeficitKw < 0)
    ? 'WARNING'
    : activeInjectedEvents.resupplyDelay || activeInjectedEvents.extremeCold
    ? 'WATCH'
    : 'NOMINAL';

  const statusColorMap = {
    CRITICAL: 'bg-[#E53935]/20 text-[#E53935] border-[#E53935] animate-pulse',
    WARNING: 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]',
    WATCH: 'bg-[#1976D2]/20 text-[#00B8E6] border-[#00B8E6]',
    NOMINAL: 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]',
  };

  // Section 11: Microgrid Hero KPI (Net Power)
  const netPowerKw = derived.powerSurplusDeficitKw;
  const isDeficit = netPowerKw < 0;

  // Section 24: Subsystem Operational Impact Strip (5 Subsystems)
  const impactStrip = {
    energy: isDeficit ? (Math.abs(netPowerKw) > 50 ? 'CRITICAL' : 'WARNING') : activeInjectedEvents.extremeCold ? 'WATCH' : 'NOMINAL',
    water: infrastructure.waterPumpHealth < 75 ? 'WARNING' : 'NOMINAL',
    lifeSupport: activeInjectedEvents.extremeCold && isDeficit ? 'CRITICAL' : activeInjectedEvents.extremeCold ? 'WARNING' : 'NOMINAL',
    communications: activeInjectedEvents.highWind ? 'WARNING' : metadata.connectivityState === 'DISCONNECTED' ? 'CRITICAL' : metadata.connectivityState === 'INTERMITTENT' ? 'WATCH' : 'NOMINAL',
    logistics: derived.fuelRunwayDays < 15 ? 'CRITICAL' : (derived.fuelRunwayDays < 22 || activeInjectedEvents.resupplyDelay) ? 'WARNING' : 'NOMINAL',
  };

  const getImpactBadgeClass = (status: string) => {
    switch (status) {
      case 'CRITICAL':
        return 'bg-[#E53935] text-white font-bold animate-pulse';
      case 'WARNING':
        return 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B] font-bold';
      case 'WATCH':
        return 'bg-[#1976D2]/20 text-[#00B8E6] border border-[#00B8E6] font-semibold';
      case 'NOMINAL':
      default:
        return 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]';
    }
  };

  // Section 25: Next 24 Hours Predictive Timeline
  const next24hTimeline = [
    {
      label: 'NOW',
      time: 'T+0H',
      weather: `${derived.effectiveTempC.toFixed(1)}°C, ${derived.effectiveWindKmh} km/h`,
      demand: `${derived.totalDemandKw} kW`,
      battery: `${derived.batterySocPercent}%`,
      fuelRunway: `${derived.fuelRunwayDays.toFixed(1)}d`,
      maintRisk: activeAlerts.length > 0 ? 'WARNING' : 'NOMINAL',
      logRisk: derived.fuelRunwayDays < 15 ? 'CRITICAL' : 'NOMINAL',
    },
    {
      label: '+6H',
      time: 'T+6H',
      weather: `${(derived.effectiveTempC - 0.8).toFixed(1)}°C, ${derived.effectiveWindKmh + 2} km/h`,
      demand: `${derived.totalDemandKw + 8} kW`,
      battery: isDeficit ? `${Math.max(0, derived.batterySocPercent - 28)}%` : `${derived.batterySocPercent}%`,
      fuelRunway: `${Math.max(0, derived.fuelRunwayDays - 0.3).toFixed(1)}d`,
      maintRisk: isDeficit ? 'CRITICAL' : 'NOMINAL',
      logRisk: derived.fuelRunwayDays < 15 ? 'CRITICAL' : 'NOMINAL',
    },
    {
      label: '+12H',
      time: 'T+12H',
      weather: `${(derived.effectiveTempC - 1.4).toFixed(1)}°C, ${derived.effectiveWindKmh + 5} km/h`,
      demand: `${derived.totalDemandKw + 14} kW`,
      battery: isDeficit ? `${Math.max(0, derived.batterySocPercent - 55)}%` : `${derived.batterySocPercent}%`,
      fuelRunway: `${Math.max(0, derived.fuelRunwayDays - 0.6).toFixed(1)}d`,
      maintRisk: isDeficit ? 'CRITICAL' : 'NOMINAL',
      logRisk: derived.fuelRunwayDays < 18 ? 'WARNING' : 'NOMINAL',
    },
    {
      label: '+24H',
      time: 'T+24H',
      weather: `${(derived.effectiveTempC - 2.1).toFixed(1)}°C, ${derived.effectiveWindKmh + 8} km/h`,
      demand: `${derived.totalDemandKw + 22} kW`,
      battery: isDeficit ? '0% (DEPLETED)' : `${derived.batterySocPercent}%`,
      fuelRunway: `${Math.max(0, derived.fuelRunwayDays - 1.2).toFixed(1)}d`,
      maintRisk: isDeficit ? 'CRITICAL' : 'NOMINAL',
      logRisk: derived.fuelRunwayDays < 15 ? 'CRITICAL' : 'WARNING',
    },
  ];

  // Section 12: Asset Dependency Graph Mapping
  const assetDependencyMap: Record<string, { system: string; cascade: string[]; risk: string; action: string }> = {
    'bhr-gen-2': {
      system: 'Auxiliary Diesel Generator #2 (220 kW)',
      cascade: ['Generator #2 Lockout', 'Microgrid Deficit (-190 kW)', 'BESS Battery Discharge', 'HVAC Electrical Priority', 'Fuel Runway Contraction', 'Overall Station Risk Escalation'],
      risk: activeInjectedEvents.generator2Failure ? 'CRITICAL LOCKOUT' : 'STANDBY NOMINAL',
      action: activeInjectedEvents.generator2Failure ? 'Execute emergency start on reserve Genset #3; load shed science labs.' : 'Inspect oil filter and check coolant level.',
    },
    'bhr-gen-1': {
      system: 'Primary Base Generator #1 (220 kW)',
      cascade: ['Primary Generator', 'Microgrid Backbone', 'Station Baseload', 'Fuel Manifold Injection', 'Cogeneration Heat Exchanger'],
      risk: 'ONLINE NOMINAL',
      action: 'Verify rotational frequency and continuous lube oil pressure.',
    },
    'bhr-hvac-1': {
      system: 'Central HVAC & Thermal Balancing Exchangers',
      cascade: ['Exterior Chill Factor', 'Indoor 21°C Thermal Setpoint', 'HVAC Heater Grid Draw', 'Microgrid Demand Surge', 'Fuel Burn Acceleration'],
      risk: activeInjectedEvents.extremeCold ? 'THERMAL OVERDRIVE' : 'BALANCED NOMINAL',
      action: activeInjectedEvents.extremeCold ? 'Deploy perimeter thermal storm dampers and activate glycol heat loops.' : 'Routine heat exchanger duct inspection.',
    },
    'bhr-fuel-1': {
      system: 'Cryogenic Bulk Fuel Farm & Manifold Pump',
      cascade: ['Fuel Tank Volume', 'Daily Burn Rate (2,246 L/d)', 'Vessel Resupply Arrival Window', 'Autonomous Station Runway', 'Emergency Fuel Reserve'],
      risk: derived.fuelRunwayDays < 15 ? 'CRITICAL RUNWAY' : 'NOMINAL BUFFER',
      action: derived.fuelRunwayDays < 15 ? 'Dispatch priority ski-plane airlift requisition to NCPOR Command.' : 'Verify tank anti-waxing heating jackets.',
    },
    'bhr-water-1': {
      system: 'Water RO Desalination & Melt Tank System',
      cascade: ['Seawater/Lake Intake Pump', 'Electrical Trace Heating Cable', 'RO High Pressure Membrane', 'Potable Reservoir', 'Galley Life Support'],
      risk: 'OPERATIONAL NOMINAL',
      action: 'Check heat-trace current draw on sub-surface water intake line.',
    },
    'bhr-comms-1': {
      system: 'SATCOM Radome & Ku/Ka Deep-Space Array',
      cascade: ['Steerable Dish Gimbal', 'Geostationary Satellite Link', 'NCPOR Mission Control Sync', 'Edge Queue Telemetry Flush', 'Emergency HF Sortie Net'],
      risk: activeInjectedEvents.highWind ? 'KATABATIC GUST WARNING' : 'ONLINE LINKED',
      action: activeInjectedEvents.highWind ? 'Park and stow satellite dish azimuth to reduce wind-load torsion.' : 'Nominal telemetry sync.',
    },
  };

  const selectedDependency = assetDependencyMap[selectedAssetId] || assetDependencyMap['bhr-gen-2'];

  const fuelItem = logistics.inventory.find(i => i.category === 'fuel');
  const foodItem = logistics.inventory.find(i => i.category === 'food');
  const medItem = logistics.inventory.find(i => i.category === 'medical');

  return (
    <div className="flex-1 p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full font-sans text-slate-100">
      
      {/* ============================================================== */}
      {/* 1. TOP BAR: ANTARCTIC STATIONS OVERVIEW & OPERATIONAL MODE     */}
      {/* (Section 28 & Section 29)                                      */}
      {/* ============================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-xl bg-polar-900 border border-polar-border">
        {/* Antarctic Station Nodes Switcher */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
            <Globe2 className="w-4 h-4 text-polar-cyan" />
            <span>ANTARCTIC STATIONS:</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentStationId('maitri')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                currentStationId === 'maitri'
                  ? 'bg-polar-navy border border-polar-cyan text-white shadow-md'
                  : 'bg-polar-950/60 border border-polar-border text-slate-300 hover:text-white'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${
                maitriState?.healthScore?.overall >= 80 ? 'bg-operational-green' : 'bg-warning-amber'
              }`} />
              <span>MAITRI</span>
              <span className="font-mono text-[11px] text-slate-400 font-bold">{maitriState?.healthScore?.overall || 91}%</span>
            </button>

            <button
              onClick={() => setCurrentStationId('bharati')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                currentStationId === 'bharati'
                  ? 'bg-polar-navy border border-polar-cyan text-white shadow-md'
                  : 'bg-polar-950/60 border border-polar-border text-slate-300 hover:text-white'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${
                derived.overallHealthScore >= 80 ? 'bg-operational-green' : 'bg-critical-red animate-pulse'
              }`} />
              <span>BHARATI</span>
              <span className="font-mono text-[11px] text-slate-400 font-bold">{derived.overallHealthScore}%</span>
            </button>
          </div>
        </div>

        {/* Station Mode Control (Section 29) */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase">Station Stance:</span>
          <div className="flex items-center gap-1 bg-polar-950 p-1 rounded-lg border border-polar-border">
            {(['NORMAL', 'SCIENCE OPERATIONS', 'WEATHER ALERT', 'POWER CONSERVATION', 'EMERGENCY'] as StationMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setStationMode(mode)}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                  stationMode === mode
                    ? mode === 'EMERGENCY'
                      ? 'bg-critical-red text-white'
                      : mode === 'POWER CONSERVATION'
                      ? 'bg-warning-amber text-slate-900 font-bold'
                      : 'bg-polar-blue text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. STATION HEADER (Section 8)                                  */}
      {/* ============================================================== */}
      <div className="polar-card p-5 rounded-xl border border-polar-border">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-polar-cyan/15 text-polar-cyan border border-polar-cyan/40 flex items-center justify-center font-mono font-black text-xl shrink-0">
              {metadata.stationId === 'maitri' ? 'MTR' : 'BHR'}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white uppercase">
                  {metadata.name}
                </h1>
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-polar-glacier/10 text-polar-cyan border border-polar-cyan/30">
                  Antarctic Research Station
                </span>
                <span className="text-sm text-slate-400 font-medium">({metadata.hindiName})</span>
              </div>
              <p className="text-sm text-slate-300 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>{metadata.region}</span>
                <span className="text-slate-500">•</span>
                <span className="font-mono text-xs">{metadata.coordinates.lat}°S, {metadata.coordinates.lng}°E</span>
                <span className="text-slate-500">•</span>
                <span>Elev: <strong className="font-mono text-white">{metadata.coordinates.elevationM}m</strong></span>
                <span className="text-slate-500">•</span>
                <span>Complement: <strong className="font-mono text-white">{metadata.currentPersonnel} Personnel</strong></span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t md:border-t-0 md:border-l border-polar-border/60 pt-3 md:pt-0 md:pl-5">
            <div className="text-left md:text-right">
              <span className="text-xs text-slate-400 block font-medium">Station Time</span>
              <span className="font-mono text-sm font-bold text-white">
                {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} UTC+5
              </span>
            </div>
            <div className="text-left md:text-right">
              <span className="text-xs text-slate-400 block font-medium">Telemetry Uplink</span>
              <span className={`inline-flex items-center gap-1.5 text-xs font-bold font-mono ${
                metadata.connectivityState === 'CONNECTED' ? 'text-operational-green' :
                metadata.connectivityState === 'INTERMITTENT' ? 'text-warning-amber' : 'text-critical-red'
              }`}>
                <span className="w-2 h-2 rounded-full bg-current" />
                {metadata.connectivityState === 'CONNECTED' ? 'CONNECTED (100%)' : metadata.connectivityState}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. HERO ROW: STATION HEALTH & MICROGRID NET POWER BALANCE      */}
      {/* (Section 9, Section 10 & Section 11)                           */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Left 2 Cols: Station Health & Operational Status */}
        <div className="lg:col-span-2 polar-card p-5 rounded-xl border border-polar-border flex flex-col justify-between space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div>
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block">
                Derived Health & Operational Stance
              </span>
              <span className="text-base font-bold text-white">
                Deterministic Cross-Domain State Index
              </span>
            </div>

            {/* Operational Status Pill (Section 10) */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold uppercase">Operational Status:</span>
              <span className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider border ${statusColorMap[operationalStatus]}`}>
                {operationalStatus}
              </span>
            </div>
          </div>

          {/* Health Large KPI & Contributing Domains */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
            {/* Health Score KPI */}
            <div className="p-4 rounded-xl bg-polar-950 border border-polar-border text-center">
              <span className="text-xs text-slate-400 uppercase font-semibold block">Station Health</span>
              <div className={`text-4xl md:text-5xl font-black font-mono my-1 ${
                derived.overallHealthScore >= 80 ? 'text-operational-green' :
                derived.overallHealthScore >= 60 ? 'text-warning-amber' : 'text-critical-red animate-pulse'
              }`}>
                {derived.overallHealthScore}
              </div>
              <span className="text-xs font-mono font-medium text-slate-400">
                {derived.healthPointDelta > 0 ? `↓ ${derived.healthPointDelta} pts from nominal` : 'Nominal baseline (100%)'}
              </span>
            </div>

            {/* Domain Contribution Breakdown (Section 9) */}
            <div className="sm:col-span-2 space-y-2 p-3 rounded-xl bg-polar-950/70 border border-polar-border">
              <span className="text-xs text-slate-300 font-semibold uppercase block">
                Domain Health Breakdown:
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded bg-polar-900 border border-polar-border flex justify-between items-center">
                  <span className="text-slate-400">Environment (20%):</span>
                  <span className="font-mono font-bold text-white">{healthScore.environmentScore}%</span>
                </div>
                <div className="p-2 rounded bg-polar-900 border border-polar-border flex justify-between items-center">
                  <span className="text-slate-400">Microgrid (30%):</span>
                  <span className={`font-mono font-bold ${healthScore.energyScore < 75 ? 'text-critical-red' : 'text-white'}`}>
                    {healthScore.energyScore}%
                  </span>
                </div>
                <div className="p-2 rounded bg-polar-900 border border-polar-border flex justify-between items-center">
                  <span className="text-slate-400">Infrastructure (25%):</span>
                  <span className="font-mono font-bold text-white">{healthScore.infrastructureScore}%</span>
                </div>
                <div className="p-2 rounded bg-polar-900 border border-polar-border flex justify-between items-center">
                  <span className="text-slate-400">Logistics (25%):</span>
                  <span className={`font-mono font-bold ${healthScore.logisticsScore < 70 ? 'text-warning-amber' : 'text-white'}`}>
                    {healthScore.logisticsScore}%
                  </span>
                </div>
              </div>
              {/* Primary Drivers Explanation */}
              <div className="text-xs text-slate-300 pt-1">
                <strong className="text-slate-400 font-semibold">Primary Health Drivers: </strong>
                <span>{derived.primaryDrivers.join(' • ')}</span>
              </div>
            </div>
          </div>

          {/* Active Alerts Count & Status Bar */}
          <div className="flex flex-wrap items-center justify-between text-xs text-slate-300 pt-1 border-t border-white/5">
            <div>
              <span>Unresolved Threshold Alerts: </span>
              <strong className={criticalCount > 0 ? 'text-critical-red font-mono' : 'text-slate-300 font-mono'}>
                {criticalCount} CRITICAL
              </strong>
              <span className="text-slate-500 mx-1.5">•</span>
              <strong className={warningCount > 0 ? 'text-warning-amber font-mono' : 'text-slate-300 font-mono'}>
                {warningCount} WARNING
              </strong>
            </div>
            <Link 
              href="/alerts" 
              className="text-polar-cyan hover:underline font-semibold flex items-center gap-1"
            >
              <span>View Alert Center</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Right Col: Section 11 - Microgrid Hero KPI (Net Power) */}
        <div className={`polar-card p-5 rounded-xl border flex flex-col justify-between space-y-3 ${
          isDeficit 
            ? 'border-critical-red/70 bg-critical-red/10' 
            : 'border-operational-green/60 bg-operational-green/10'
        }`}>
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-300">
              Microgrid Power Balance
            </span>
            <ProvenanceBadge source="Derived Calculation" compact />
          </div>

          {/* Dominant Net Power KPI */}
          <div className="py-2 text-center">
            <div className={`text-4xl md:text-5xl font-black font-mono tracking-tight ${
              isDeficit ? 'text-critical-red animate-pulse' : 'text-operational-green'
            }`}>
              {isDeficit ? `${netPowerKw} kW` : `+${netPowerKw} kW`}
            </div>
            <div className={`text-sm font-bold uppercase tracking-wider mt-1 ${
              isDeficit ? 'text-critical-red' : 'text-operational-green'
            }`}>
              {isDeficit ? 'POWER DEFICIT' : 'POWER RESERVE'}
            </div>
          </div>

          {/* Generation & Demand Details */}
          <div className="p-3 rounded-lg bg-polar-950 border border-polar-border grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px] uppercase font-medium">Generation</span>
              <span className="font-mono text-base font-bold text-white">{derived.generationCapacityKw} kW</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block text-[11px] uppercase font-medium">Demand</span>
              <span className="font-mono text-base font-bold text-polar-cyan">{derived.totalDemandKw} kW</span>
            </div>
          </div>

          <div className="space-y-1.5 text-xs text-slate-300 pt-1">
            <div className="flex justify-between">
              <span>BESS Battery:</span>
              <strong className={`font-mono ${derived.batterySocPercent < 40 ? 'text-critical-red' : 'text-operational-green'}`}>
                {derived.batterySocPercent}% ({derived.batteryStatus.toUpperCase()})
              </strong>
            </div>
            <div className="flex justify-between">
              <span>Daily Fuel Burn:</span>
              <strong className="font-mono text-warning-amber">{derived.dailyFuelBurnLitres.toLocaleString()} L/day</strong>
            </div>
            <div className="flex justify-between">
              <span>Fuel Runway:</span>
              <strong className={`font-mono ${derived.fuelRunwayDays < 15 ? 'text-critical-red' : 'text-white'}`}>
                {derived.fuelRunwayDays.toFixed(1)} Days
              </strong>
            </div>
          </div>
        </div>

      </div>

      {/* ============================================================== */}
      {/* 4. SUBSYSTEM OPERATIONAL IMPACT STRIP (Section 24)             */}
      {/* ============================================================== */}
      <div className="polar-card p-4 rounded-xl border border-polar-border">
        <div className="flex items-center justify-between mb-3 text-xs text-slate-400 uppercase font-bold tracking-wider">
          <span>Subsystem Operational Health Strip</span>
          <span className="font-mono text-[11px]">Coupled Physical Digital Twin Feed</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { name: 'Energy', status: impactStrip.energy, icon: Zap },
            { name: 'Water', status: impactStrip.water, icon: Activity },
            { name: 'Life Support', status: impactStrip.lifeSupport, icon: HeartPulse },
            { name: 'Communications', status: impactStrip.communications, icon: Radio },
            { name: 'Logistics', status: impactStrip.logistics, icon: Package },
          ].map((subsystem) => {
            const Icon = subsystem.icon;
            return (
              <div 
                key={subsystem.name}
                className="p-3 rounded-lg bg-polar-950 border border-polar-border flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-polar-cyan" />
                  <span className="font-semibold text-white text-sm">{subsystem.name}</span>
                </div>
                <span className={`px-2.5 py-0.5 rounded text-xs ${getImpactBadgeClass(subsystem.status)}`}>
                  {subsystem.status}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 5. PRIMARY CROSS-DOMAIN RISK ENGINE (Section 17)               */}
      {/* WHAT → WHY → AFFECTED → IMPACT → ACTION                        */}
      {/* ============================================================== */}
      <div className="polar-card p-5 rounded-xl border border-polar-border space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <AlertOctagon className={`w-6 h-6 shrink-0 ${
              derived.crossDomainRisk === 'critical' ? 'text-critical-red animate-pulse' :
              derived.crossDomainRisk === 'warning' ? 'text-warning-amber' : 'text-operational-green'
            }`} />
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider block font-semibold">
                Operational Incident Assessment
              </span>
              <span className="font-bold text-white text-base md:text-lg">
                {derived.activeIncident}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ProvenanceBadge source="Derived Calculation" />
            <button
              onClick={() => {
                setActiveExplainAlert({
                  title: derived.activeIncident,
                  severity: derived.crossDomainRisk,
                  why: derived.rootCause,
                  causalChain: derived.causalChain,
                  impact: derived.forecastedImpact,
                  action: derived.recommendedResponses,
                });
                setShowExplainModal(true);
              }}
              className="px-3.5 py-1.5 rounded-lg bg-polar-cyan/20 hover:bg-polar-cyan/30 text-polar-cyan border border-polar-cyan/40 text-xs font-bold transition-all"
            >
              [ EXPLAIN RISK ]
            </button>
            <Link
              href="/simulator"
              className="px-3.5 py-1.5 rounded-lg bg-polar-blue hover:bg-polar-blue/80 text-white text-xs font-bold transition-all shadow-sm"
            >
              [ SIMULATE IMPACT ]
            </Link>
          </div>
        </div>

        {/* 5-Step Operational Reasoning Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
          {/* 1. SEVERITY & EVENT */}
          <div className="p-3.5 rounded-lg bg-polar-950 border border-polar-border space-y-1">
            <span className="text-slate-400 uppercase font-semibold text-[11px] block">1. Event & Severity</span>
            <div className="my-1">
              <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                derived.crossDomainRisk === 'critical' ? 'bg-critical-red text-white' :
                derived.crossDomainRisk === 'warning' ? 'bg-warning-amber text-slate-900' : 'bg-operational-green text-white'
              }`}>
                {derived.crossDomainRisk.toUpperCase()}
              </span>
            </div>
            <p className="text-slate-200 font-medium">{derived.activeIncidentTitle}</p>
          </div>

          {/* 2. WHY IT HAPPENED */}
          <div className="p-3.5 rounded-lg bg-polar-950 border border-polar-border space-y-1">
            <span className="text-slate-400 uppercase font-semibold text-[11px] block">2. Why It Happened</span>
            <p className="text-slate-200 leading-relaxed font-medium">
              {derived.rootCause}
            </p>
          </div>

          {/* 3. AFFECTED SYSTEMS */}
          <div className="p-3.5 rounded-lg bg-polar-950 border border-polar-border space-y-1">
            <span className="text-slate-400 uppercase font-semibold text-[11px] block">3. Affected Systems</span>
            <div className="space-y-1 text-slate-200 font-medium">
              {activeInjectedEvents.generator2Failure ? (
                <span>Microgrid → Battery → HVAC</span>
              ) : activeInjectedEvents.resupplyDelay ? (
                <span>Logistics → Fuel Reserves → Resupply Buffer</span>
              ) : activeInjectedEvents.extremeCold ? (
                <span>Environment → HVAC Thermal Grid → Fuel Burn</span>
              ) : (
                <span>All Station Core Systems Nominal</span>
              )}
            </div>
          </div>

          {/* 4. EXPECTED IMPACT */}
          <div className="p-3.5 rounded-lg bg-polar-950 border border-polar-border space-y-1">
            <span className="text-slate-400 uppercase font-semibold text-[11px] block">4. Expected Impact</span>
            <p className="text-slate-200 leading-relaxed font-medium">
              {derived.forecastedImpact}
            </p>
          </div>

          {/* 5. RECOMMENDED ACTION */}
          <div className="p-3.5 rounded-lg bg-polar-950 border border-polar-border space-y-1">
            <span className="text-slate-400 uppercase font-semibold text-[11px] block">5. Operator Action</span>
            <p className="text-polar-cyan leading-relaxed font-semibold">
              {derived.recommendedResponses[0] || 'Maintain nominal watchkeeping routine.'}
            </p>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 6. 2D SPATIAL DIGITAL TWIN & DEPENDENCY GRAPH (Section 12)     */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 polar-card p-5 rounded-xl border border-polar-border space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div>
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block">
                Spatial Operations Twin
              </span>
              <h2 className="text-lg md:text-xl font-bold text-white">
                2D Operational Dependency Blueprint ({metadata.name})
              </h2>
            </div>
            <Link 
              href="/digital-twin"
              className="text-xs text-polar-cyan hover:underline font-semibold flex items-center gap-1"
            >
              <span>Full Twin Explorer</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Interactive 2D Blueprint SVG */}
          <div className="rounded-xl overflow-hidden border border-polar-border bg-polar-950 p-2">
            <StationTwin2D
              stationId={currentStationId}
              assets={infrastructure.assets}
              selectedAssetId={selectedAssetId}
              onSelectAsset={(id) => setSelectedAssetId(id)}
            />
          </div>

          {/* Operational Dependency Chain Highlight */}
          <div className="p-3.5 rounded-xl bg-polar-950 border border-polar-border space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-semibold uppercase">
                Selected Asset Operational Cascade: <strong className="text-white font-sans">{selectedDependency.system}</strong>
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-polar-900 border border-polar-border text-polar-cyan">
                {selectedDependency.risk}
              </span>
            </div>

            {/* Propagation Chain Breadcrumb */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {selectedDependency.cascade.map((node, i) => (
                <React.Fragment key={node}>
                  <span className={`px-2.5 py-1 rounded text-xs font-semibold ${
                    i === 0 
                      ? 'bg-polar-cyan/20 text-polar-cyan border border-polar-cyan/40 font-bold'
                      : i === selectedDependency.cascade.length - 1
                      ? 'bg-critical-red/20 text-critical-red border border-critical-red/40 font-bold'
                      : 'bg-polar-900 border border-polar-border text-slate-300'
                  }`}>
                    {node}
                  </span>
                  {i < selectedDependency.cascade.length - 1 && (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  )}
                </React.Fragment>
              ))}
            </div>

            <div className="text-xs text-slate-300 pt-1">
              <strong className="text-slate-400">Action Protocol: </strong>
              <span>{selectedDependency.action}</span>
            </div>
          </div>
        </div>

        {/* Right Col: Mission Operational Event Timeline (Section 26) */}
        <div className="polar-card p-5 rounded-xl border border-polar-border flex flex-col justify-between space-y-4">
          <div className="border-b border-white/10 pb-3 flex items-center justify-between">
            <div>
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block">
                Mission Execution
              </span>
              <h2 className="text-lg font-bold text-white">
                Operational Event Timeline
              </h2>
            </div>
            <Clock className="w-5 h-5 text-polar-cyan" />
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[440px] pr-1">
            {missionTimeline.map((item) => {
              const categoryBadgeMap: Record<string, string> = {
                TELEMETRY: 'bg-polar-cyan/20 text-polar-cyan border-polar-cyan/30',
                ALERT: 'bg-critical-red/20 text-critical-red border-critical-red/40',
                ANALYSIS: 'bg-polar-blue/20 text-polar-cyan border-polar-blue/40',
                'HUMAN ACTION': 'bg-operational-green/20 text-operational-green border-operational-green/40',
                'FOLLOW-UP': 'bg-warning-amber/20 text-warning-amber border-warning-amber/40',
              };
              const categoryBadge = categoryBadgeMap[item.category] || 'bg-polar-900 text-slate-300 border-polar-border';

              return (
                <div key={item.id} className="relative pl-5 border-l-2 border-polar-border/60 pb-3 last:pb-0">
                  <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-polar-cyan" />
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-mono font-bold text-white">{item.time} UTC</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${categoryBadge}`}>
                      {item.category}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white">{item.title}</h4>
                  <p className="text-[12px] text-slate-300 mt-0.5 leading-snug">{item.details}</p>
                </div>
              );
            })}
          </div>

          <div className="p-3 rounded-lg bg-polar-950 border border-polar-border text-xs text-slate-300">
            <span className="text-[11px] text-slate-400 font-semibold uppercase block mb-1">Causal Verification:</span>
            <div className="font-mono text-[11px] text-polar-cyan">
              TELEMETRY → ALERT → ANALYSIS → ACTION → FOLLOW-UP
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 7. FOUR DOMAIN MODULE CARDS (Section 10)                        */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Domain 1: Environment */}
        <div className="polar-card p-4 rounded-xl border border-polar-border space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-xs font-bold text-slate-300 uppercase">1. Environment</span>
            <Thermometer className="w-4 h-4 text-polar-cyan" />
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Ambient Temp:</span>
              <strong className="font-mono text-white">{derived.effectiveTempC.toFixed(1)}°C</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Katabatic Wind:</span>
              <strong className="font-mono text-white">{derived.effectiveWindKmh} km/h</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Blizzard Risk:</span>
              <strong className={`font-mono uppercase ${derived.effectiveWindKmh > 70 ? 'text-critical-red' : 'text-operational-green'}`}>
                {derived.effectiveWindKmh > 70 ? 'HIGH' : 'NOMINAL'}
              </strong>
            </div>
            <div className="flex justify-between pt-1 border-t border-white/5">
              <span className="text-slate-400">HVAC Heating Draw:</span>
              <strong className="font-mono text-polar-cyan">{derived.heatingLoadKw} kW</strong>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            Colder exterior temperatures directly inflate heating load draw on the microgrid.
          </p>
        </div>

        {/* Domain 2: Energy */}
        <div className="polar-card p-4 rounded-xl border border-polar-border space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-xs font-bold text-slate-300 uppercase">2. Energy</span>
            <Zap className="w-4 h-4 text-warning-amber" />
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Active Gen:</span>
              <strong className="font-mono text-white">{derived.generationCapacityKw} kW</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Station Demand:</span>
              <strong className="font-mono text-white">{derived.totalDemandKw} kW</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Net Power:</span>
              <strong className={`font-mono ${isDeficit ? 'text-critical-red' : 'text-operational-green'}`}>
                {isDeficit ? `${netPowerKw} kW` : `+${netPowerKw} kW`}
              </strong>
            </div>
            <div className="flex justify-between pt-1 border-t border-white/5">
              <span className="text-slate-400">Battery Buffer:</span>
              <strong className="font-mono text-white">{derived.batterySocPercent}%</strong>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            Microgrid deficits trigger BESS discharge to buffer critical station life support.
          </p>
        </div>

        {/* Domain 3: Infrastructure */}
        <div className="polar-card p-4 rounded-xl border border-polar-border space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-xs font-bold text-slate-300 uppercase">3. Infrastructure</span>
            <HardHat className="w-4 h-4 text-polar-blue" />
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Asset Health Avg:</span>
              <strong className="font-mono text-white">{derived.overallInfrastructureHealth}%</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Genset #2 Health:</span>
              <strong className={`font-mono ${activeInjectedEvents.generator2Failure ? 'text-critical-red' : 'text-white'}`}>
                {activeInjectedEvents.generator2Failure ? '22% (TRIPPED)' : '94%'}
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Water Plant:</span>
              <strong className="font-mono text-white">{infrastructure.waterPumpHealth}%</strong>
            </div>
            <div className="flex justify-between pt-1 border-t border-white/5">
              <span className="text-slate-400">Next Service Window:</span>
              <strong className="font-mono text-white">48 Hours</strong>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            Mechanical degradation directly shifts load requirements to redundant backup assets.
          </p>
        </div>

        {/* Domain 4: Logistics */}
        <div className="polar-card p-4 rounded-xl border border-polar-border space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-xs font-bold text-slate-300 uppercase">4. Logistics</span>
            <Package className="w-4 h-4 text-operational-green" />
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Fuel Runway:</span>
              <strong className={`font-mono ${derived.fuelRunwayDays < 15 ? 'text-critical-red' : 'text-white'}`}>
                {derived.fuelRunwayDays.toFixed(1)} Days
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Rations Runway:</span>
              <strong className="font-mono text-white">{foodItem?.daysRemaining || 120} Days</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Medical Runway:</span>
              <strong className="font-mono text-white">{medItem?.daysRemaining || 210} Days</strong>
            </div>
            <div className="flex justify-between pt-1 border-t border-white/5">
              <span className="text-slate-400">Resupply Vessel ETA:</span>
              <strong className={`font-mono ${activeInjectedEvents.resupplyDelay ? 'text-warning-amber' : 'text-white'}`}>
                {activeInjectedEvents.resupplyDelay ? '30 Days (+12d ICE)' : '18 Days'}
              </strong>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            If fuel runway contracts below resupply ETA, logistics risk escalates to CRITICAL.
          </p>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 8. NEXT 24 HOURS PREDICTIVE TIMELINE (Section 25)              */}
      {/* ============================================================== */}
      <div className="polar-card p-5 rounded-xl border border-polar-border space-y-3">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-polar-cyan" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Next 24 Hours Operational Forecast
            </h3>
          </div>
          <ProvenanceBadge source="Prototype Forecast" compact />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {next24hTimeline.map((item) => (
            <div 
              key={item.label}
              className="p-3.5 rounded-lg bg-polar-950 border border-polar-border space-y-2 text-xs"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                <span className="font-bold text-white text-sm font-mono">{item.label}</span>
                <span className="font-mono text-[11px] text-slate-400">{item.time}</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Weather:</span>
                  <span className="font-mono text-slate-200">{item.weather}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Demand:</span>
                  <span className="font-mono text-polar-cyan font-bold">{item.demand}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">BESS Battery:</span>
                  <span className={`font-mono font-bold ${item.battery.includes('DEPLETED') || item.battery.includes('0%') ? 'text-critical-red' : 'text-slate-200'}`}>
                    {item.battery}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Fuel Runway:</span>
                  <span className="font-mono text-slate-200">{item.fuelRunway}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-white/5">
                  <span className="text-slate-400">Logistics Margin:</span>
                  <span className={`font-mono font-bold ${item.logRisk === 'CRITICAL' ? 'text-critical-red' : item.logRisk === 'WARNING' ? 'text-warning-amber' : 'text-operational-green'}`}>
                    {item.logRisk}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 9. EXPLAIN RISK MODAL / DRAWER (Section 18)                    */}
      {/* ============================================================== */}
      {showExplainModal && activeExplainAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="polar-card border border-polar-cyan/50 rounded-2xl p-6 max-w-2xl w-full space-y-5 shadow-2xl bg-polar-navy text-slate-100">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-5 h-5 text-critical-red" />
                <h3 className="text-lg font-bold text-white">
                  Why This Operational Risk Exists (Causal Chain)
                </h3>
              </div>
              <button
                onClick={() => setShowExplainModal(false)}
                className="p-1 rounded-lg hover:bg-polar-900 text-slate-400 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Plain language explanation */}
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-polar-950 border border-polar-border">
                <span className="text-xs text-slate-400 font-semibold uppercase block mb-1">Incident Headline:</span>
                <p className="font-bold text-white text-sm">{activeExplainAlert.title}</p>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">{activeExplainAlert.why}</p>
              </div>

              {/* Causal Chain Steps */}
              <div className="space-y-2">
                <span className="text-xs text-slate-400 font-semibold uppercase block">
                  Deterministic Propagation Sequence:
                </span>
                {derived.causalChain.map((step, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-polar-950 border border-polar-border flex items-start gap-3 text-xs">
                    <span className="w-5 h-5 rounded-full bg-polar-cyan/20 text-polar-cyan border border-polar-cyan/40 font-mono font-bold flex items-center justify-center shrink-0 text-[11px]">
                      {idx + 1}
                    </span>
                    <span className="text-slate-200 leading-snug pt-0.5">{step}</span>
                  </div>
                ))}
              </div>

              {/* Data Provenance Confirmation (Section 18 & 32) */}
              <div className="p-3.5 rounded-xl bg-polar-950 border border-polar-border space-y-2 text-xs">
                <span className="text-slate-400 font-semibold uppercase block">
                  Verifiable Data Provenance (Section 32 Data Honesty):
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-operational-green shrink-0" />
                    <span>Public Observation: ECMWF ERA5 & IMD Synoptic</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-operational-green shrink-0" />
                    <span>Synthetic Telemetry: Station Edge Sensors</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-operational-green shrink-0" />
                    <span>Derived Calculation: Microgrid & Thermal Equations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-operational-green shrink-0" />
                    <span>Prototype Forecast: Deterministic Timeline Engine</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-white/10">
              <button
                onClick={() => setShowExplainModal(false)}
                className="px-4 py-2 rounded-lg bg-polar-900 hover:bg-polar-800 text-slate-300 text-xs font-semibold"
              >
                Close
              </button>
              <Link
                href="/simulator"
                onClick={() => setShowExplainModal(false)}
                className="px-4 py-2 rounded-lg bg-polar-blue hover:bg-polar-blue/80 text-white text-xs font-bold transition-all shadow-md"
              >
                Open What-If Simulator
              </Link>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
