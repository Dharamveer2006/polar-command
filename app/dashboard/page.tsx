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
  Server,
  ArrowDown,
  Info
} from 'lucide-react';
import ProvenanceBadge from '@/components/common/ProvenanceBadge';
import StationTwin2D from '@/components/twin/StationTwin2D';
import { StationId, StationMode, RiskSeverity } from '@/types';

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

  // ==============================================================
  // 11. SINGLE SOURCE OF TRUTH (effectiveStationState)
  // All cards consume currentState, riskState, forecastState & recommendedActions
  // ==============================================================
  const { metadata, environment, energy, infrastructure, logistics, healthScore, activeAlerts } = stationState;

  const maitriState = allStationsState['maitri'];
  const bharatiState = allStationsState['bharati'];

  const criticalCount = activeAlerts.filter(a => a.severity === 'critical').length;
  const warningCount = activeAlerts.filter(a => a.severity === 'warning').length;

  const isPowerDeficit = derived.powerSurplusDeficitKw < 0;
  const isHealthReduced = derived.overallHealthScore < 85;
  const isLogisticsCritical = derived.fuelRunwayDays < 14 || activeInjectedEvents.resupplyDelay;

  // 2. SEPARATE OPERATING MODE FROM OPERATIONAL STATUS
  // Operating Mode: NORMAL, SCIENCE OPERATIONS, WEATHER ALERT, POWER CONSERVATION, EMERGENCY
  // Operational Status: NOMINAL, WATCH, WARNING, CRITICAL
  const operationalStatus: 'NOMINAL' | 'WATCH' | 'WARNING' | 'CRITICAL' = 
    criticalCount > 0 || isPowerDeficit || activeInjectedEvents.generator2Failure
      ? 'CRITICAL'
      : warningCount > 0 || isHealthReduced || isLogisticsCritical
      ? 'WARNING'
      : activeInjectedEvents.extremeCold || activeInjectedEvents.highWind
      ? 'WATCH'
      : 'NOMINAL';

  const statusColorMap = {
    CRITICAL: 'bg-[#E53935]/20 text-[#E53935] border-[#E53935] animate-pulse',
    WARNING: 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]',
    WATCH: 'bg-[#1976D2]/20 text-[#00B8E6] border-[#00B8E6]',
    NOMINAL: 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]',
  };

  // Subsystem States for Operational Status Block
  const subsystemStates = {
    energy: isPowerDeficit ? 'CRITICAL' : activeInjectedEvents.generator2Failure ? 'WARNING' : 'NOMINAL',
    water: infrastructure.waterPumpHealth < 75 ? 'WARNING' : 'NOMINAL',
    lifeSupport: activeInjectedEvents.extremeCold && isPowerDeficit ? 'CRITICAL' : activeInjectedEvents.extremeCold ? 'WATCH' : 'NOMINAL',
    comms: activeInjectedEvents.highWind ? 'WARNING' : metadata.connectivityState === 'DISCONNECTED' ? 'CRITICAL' : 'NOMINAL',
    logistics: derived.fuelRunwayDays < 10 ? 'CRITICAL' : isLogisticsCritical ? 'CRITICAL' : 'NOMINAL',
  };

  // 3. HEALTH EXPLANATION BREAKDOWN & DRIVER ATTRIBUTION
  // Exact domain values: Environment, Microgrid, Infrastructure, Logistics
  const envScore = healthScore?.environmentScore || 95;
  const energyScore = healthScore?.energyScore || (isPowerDeficit ? 45 : activeInjectedEvents.generator2Failure ? 60 : 92);
  const infraScore = healthScore?.infrastructureScore || (activeInjectedEvents.extremeCold ? 74 : 91);
  const logScore = healthScore?.logisticsScore || (isLogisticsCritical ? (derived.fuelRunwayDays < 10 ? 42 : 68) : 88);

  const primaryDriverText = activeInjectedEvents.generator2Failure
    ? 'Generator #2 mechanical trip & microgrid deficit'
    : isLogisticsCritical
    ? 'Fuel autonomy below 14-day polar reserve threshold'
    : activeInjectedEvents.extremeCold
    ? 'Sub-zero HVAC thermodynamic overdrive'
    : 'All subsystems operating within nominal limits';

  const primaryDriverImpact = activeInjectedEvents.generator2Failure
    ? '-18 pts'
    : isLogisticsCritical
    ? '-8 pts'
    : activeInjectedEvents.extremeCold
    ? '-9 pts'
    : '0 pts';

  const secondaryDriverText = activeInjectedEvents.resupplyDelay && activeInjectedEvents.generator2Failure
    ? 'Pack-ice resupply delay (+12 days)'
    : activeInjectedEvents.generator2Failure
    ? 'Microgrid reserve margin & BESS discharge'
    : activeInjectedEvents.extremeCold
    ? 'Katabatic wind convective heat loss'
    : derived.fuelRunwayDays < 18
    ? 'Reserve buffer window narrowing'
    : 'Microgrid reserve margin';

  const secondaryDriverImpact = activeInjectedEvents.resupplyDelay && activeInjectedEvents.generator2Failure
    ? '-10 pts'
    : activeInjectedEvents.generator2Failure
    ? '-5 pts'
    : activeInjectedEvents.extremeCold
    ? '-4 pts'
    : derived.fuelRunwayDays < 18
    ? '-3 pts'
    : '0 pts';

  // 4. POWER + AUTONOMY DETAILS
  const currentPowerCondition = isPowerDeficit ? 'DEFICIT' : 'SUFFICIENT';
  const longTermAutonomyCondition = isLogisticsCritical ? 'CONSTRAINED' : 'SECURE';

  // 5. AUTONOMY & SYSTEM IMPACT: WHY THIS MATTERS
  const whyThisMattersText = isPowerDeficit
    ? 'Critical power deficit active. Generation is 190 kW below station baseload. BESS battery is currently discharging to cover life support, but will exhaust in < 6 hours unless auxiliary generation is activated or load shedding is engaged.'
    : activeInjectedEvents.extremeCold && isLogisticsCritical
    ? 'Thermodynamic load surge from the cold snap has increased daily fuel consumption by 18%. Combined with sea-ice resupply delays, station fuel runway will breach reserve limits before arrival.'
    : isLogisticsCritical
    ? 'Current generation is sufficient for present station demand. However, fuel autonomy is below the operational reserve threshold. No immediate power failure is indicated, but continued operation requires logistics attention.'
    : activeInjectedEvents.extremeCold
    ? 'Severe exterior cold has escalated HVAC heating draw by +35 kW. Current generator capacity accommodates the load, but fuel burn rate has accelerated, narrowing polar winter autonomy.'
    : 'Current generation is sufficient for present station demand and fuel reserves exceed the 14-day winter safety buffer. Nominal polar watchkeeping equilibrium is maintained.';

  // 8. RISK ENGINE ITEMS (WHAT, WHY, AFFECTED, IMPACT, ACTION)
  const riskWhat = activeInjectedEvents.generator2Failure && activeInjectedEvents.extremeCold
    ? 'CRITICAL DEFICIT: Microgrid Deficit during Severe Polar Cold Snap'
    : activeInjectedEvents.generator2Failure
    ? 'CRITICAL DEFICIT: Generator #2 Lockout & Microgrid Deficit'
    : isLogisticsCritical
    ? 'WARNING: Fuel Runway Constrained Below Operational Reserve'
    : activeInjectedEvents.extremeCold
    ? 'ADVISORY: Extreme Polar Cold Snap (-12°C Offset)'
    : 'NOMINAL: All Systems Operating in Balance';

  const riskWhy = activeInjectedEvents.generator2Failure
    ? `Emergency trip removed 190 kW generation capacity while station demand is ${derived.totalDemandKw} kW.`
    : isLogisticsCritical
    ? `Current fuel autonomy is ${derived.fuelRunwayDays.toFixed(1)} days, below the mandatory 14-day polar winter safety buffer.`
    : activeInjectedEvents.extremeCold
    ? `Outside ambient temperature dropped to ${derived.effectiveTempC.toFixed(1)}°C, escalating HVAC heating draw to ${derived.heatingLoadKw} kW.`
    : 'Continuous sensor telemetry reporting within nominal operational thresholds.';

  const riskAffectedSystems = activeInjectedEvents.generator2Failure
    ? ['Energy', 'Microgrid', 'Battery (BESS)', 'Logistics']
    : isLogisticsCritical
    ? ['Energy', 'Logistics', 'Fuel Farm']
    : activeInjectedEvents.extremeCold
    ? ['Environment', 'HVAC Thermal Loop', 'Energy Demand']
    : ['All Systems Nominal'];

  const riskExpectedImpact = activeInjectedEvents.generator2Failure
    ? `Battery discharging at current net deficit (${Math.abs(derived.powerSurplusDeficitKw)} kW). Battery will deplete in < 6 hours without intervention.`
    : isLogisticsCritical
    ? 'Long-duration station autonomy constrained. Projected shortage before resupply vessel arrival.'
    : activeInjectedEvents.extremeCold
    ? 'Accelerated thermal leakage increases daily fuel consumption by +18%, shrinking winter fuel runway.'
    : 'Station maintains positive power reserve and uninterrupted life support stability.';

  const riskOperatorAction = activeInjectedEvents.generator2Failure
    ? 'Activate cold-reserve Genset #3 immediately; shed Tier-3 research laboratory loads (-45 kW).'
    : isLogisticsCritical
    ? 'Review resupply schedule and engage Power Conservation mode to reduce daily burn rate.'
    : activeInjectedEvents.extremeCold
    ? 'Deploy perimeter thermal storm shutters; engage secondary glycol heat recovery exchangers.'
    : 'Maintain standard watchkeeping routine; log synoptic weather observations.';

  const riskSeverity: RiskSeverity = operationalStatus === 'CRITICAL' ? 'critical' : operationalStatus === 'WARNING' ? 'warning' : 'nominal';

  // 7. LIVE CAUSAL FLOW
  // WEATHER -> HVAC LOAD -> ENERGY DEMAND -> POWER BALANCE -> BATTERY -> FUEL RUNWAY -> LOGISTICS RISK
  const causalFlowItems = [
    { 
      label: 'WEATHER', 
      value: `${derived.effectiveTempC.toFixed(1)}°C`, 
      sub: `${derived.effectiveWindKmh} km/h`,
      active: activeInjectedEvents.extremeCold || activeInjectedEvents.highWind 
    },
    { 
      label: 'HVAC LOAD', 
      value: `${derived.heatingLoadKw} kW`, 
      sub: activeInjectedEvents.extremeCold ? '+35 kW' : 'Normal',
      active: activeInjectedEvents.extremeCold 
    },
    { 
      label: 'ENERGY DEMAND', 
      value: `${derived.totalDemandKw} kW`, 
      sub: 'Microgrid',
      active: activeInjectedEvents.extremeCold || activeInjectedEvents.generator2Failure 
    },
    { 
      label: 'POWER BALANCE', 
      value: isPowerDeficit ? `${derived.powerSurplusDeficitKw} kW` : `+${derived.powerSurplusDeficitKw} kW`, 
      sub: isPowerDeficit ? 'DEFICIT' : 'RESERVE',
      active: isPowerDeficit 
    },
    { 
      label: 'BATTERY', 
      value: `${derived.batterySocPercent}%`, 
      sub: derived.batteryStatus.toUpperCase(),
      active: derived.batteryStatus === 'discharging' 
    },
    { 
      label: 'FUEL RUNWAY', 
      value: `${derived.fuelRunwayDays.toFixed(1)}d`, 
      sub: `${derived.dailyFuelBurnLitres} L/d`,
      active: isLogisticsCritical 
    },
    { 
      label: 'LOGISTICS RISK', 
      value: isLogisticsCritical ? 'CRITICAL' : 'NOMINAL', 
      sub: activeInjectedEvents.resupplyDelay ? '+12d ICE' : 'On Track',
      active: isLogisticsCritical 
    },
  ];

  // 10. NEXT 24 HOURS TIMELINE (NOW, +6H, +12H, +24H)
  const next24hTimeline = [
    {
      label: 'NOW',
      time: 'T+0H',
      demand: `${derived.totalDemandKw} kW`,
      battery: `${derived.batterySocPercent}% (${derived.batteryStatus})`,
      fuel: `${derived.fuelRunwayDays.toFixed(1)}d`,
      infra: `${derived.overallInfrastructureHealth}%`,
      logistics: isLogisticsCritical ? 'CRITICAL' : 'NOMINAL',
      risk: operationalStatus,
    },
    {
      label: '+6H',
      time: 'T+6H',
      demand: `${derived.totalDemandKw + 8} kW`,
      battery: isPowerDeficit ? `${Math.max(0, derived.batterySocPercent - 28)}% (DRAIN)` : `${derived.batterySocPercent}% (STABLE)`,
      fuel: `${Math.max(0, derived.fuelRunwayDays - 0.3).toFixed(1)}d`,
      infra: isPowerDeficit ? '78%' : `${derived.overallInfrastructureHealth}%`,
      logistics: isLogisticsCritical ? 'CRITICAL' : 'NOMINAL',
      risk: isPowerDeficit ? 'CRITICAL' : operationalStatus,
    },
    {
      label: '+12H',
      time: 'T+12H',
      demand: `${derived.totalDemandKw + 14} kW`,
      battery: isPowerDeficit ? `${Math.max(0, derived.batterySocPercent - 55)}% (CRIT)` : `${derived.batterySocPercent}% (STABLE)`,
      fuel: `${Math.max(0, derived.fuelRunwayDays - 0.6).toFixed(1)}d`,
      infra: isPowerDeficit ? '72%' : `${derived.overallInfrastructureHealth}%`,
      logistics: derived.fuelRunwayDays < 18 ? 'WARNING' : 'NOMINAL',
      risk: isPowerDeficit ? 'CRITICAL' : isLogisticsCritical ? 'WARNING' : 'NOMINAL',
    },
    {
      label: '+24H',
      time: 'T+24H',
      demand: `${derived.totalDemandKw + 22} kW`,
      battery: isPowerDeficit ? '0% (DEPLETED)' : `${derived.batterySocPercent}% (STABLE)`,
      fuel: `${Math.max(0, derived.fuelRunwayDays - 1.2).toFixed(1)}d`,
      infra: isPowerDeficit ? '65%' : `${derived.overallInfrastructureHealth}%`,
      logistics: derived.fuelRunwayDays < 15 ? 'CRITICAL' : 'WARNING',
      risk: isPowerDeficit ? 'CRITICAL' : isLogisticsCritical ? 'CRITICAL' : 'NOMINAL',
    },
  ];

  // 6. ASSET DEPENDENCY MAPPING WITH IMPACT VALUES BESIDE AFFECTED NODES
  const assetDependencyMap: Record<string, { system: string; cascade: string[]; risk: string; action: string; impactNodes: string[] }> = {
    'bhr-gen-2': {
      system: 'Auxiliary Diesel Generator #2 (220 kW)',
      cascade: [
        'Generator #2 (0 kW OFFLINE)',
        'Microgrid (-190 kW DEFICIT)',
        'Battery (-32 kW DISCHARGING)',
        'Fuel (2,652 L/d)',
        'Logistics (4.3d RUNWAY)',
        'Risk (CRITICAL)'
      ],
      risk: activeInjectedEvents.generator2Failure ? 'CRITICAL LOCKOUT' : 'STANDBY NOMINAL',
      action: activeInjectedEvents.generator2Failure ? 'Execute emergency start on reserve Genset #3; shed non-critical research lab loads (-45 kW).' : 'Inspect oil filter and check coolant level.',
      impactNodes: ['Gen #2: 0 kW (OFFLINE)', 'Microgrid: -190 kW (DEFICIT)', 'BESS: -32 kW (DISCHARGING)', 'Logistics: 4.3d (CRITICAL)'],
    },
    'bhr-gen-1': {
      system: 'Primary Base Generator #1 (220 kW)',
      cascade: [
        'Generator #1 (220 kW ONLINE)',
        'Microgrid Bus (451 kW DEMAND)',
        'Station Baseload (180 kW)',
        'Fuel Manifold (98 L/h)',
        'Cogeneration Heat Exchanger'
      ],
      risk: 'ONLINE NOMINAL',
      action: 'Verify rotational frequency and continuous lube oil pressure.',
      impactNodes: ['Gen #1: 220 kW (ONLINE)', 'Fuel: 98 L/h', 'CHP: 65 kW Thermal'],
    },
    'bhr-hvac-1': {
      system: 'Central HVAC & Thermal Balancing Exchangers',
      cascade: [
        `Environment (${derived.effectiveTempC.toFixed(1)}°C)`,
        `HVAC Load (${derived.heatingLoadKw} kW)`,
        `Microgrid Demand (${derived.totalDemandKw} kW)`,
        `Fuel Burn (${derived.dailyFuelBurnLitres} L/d)`,
        'Autonomy Impact'
      ],
      risk: activeInjectedEvents.extremeCold ? 'THERMAL OVERDRIVE' : 'BALANCED NOMINAL',
      action: activeInjectedEvents.extremeCold ? 'Deploy perimeter thermal storm shutters and activate auxiliary glycol loops.' : 'Routine heat exchanger duct inspection.',
      impactNodes: [`Outside: ${derived.effectiveTempC.toFixed(1)}°C`, `HVAC: ${derived.heatingLoadKw} kW`, `Fuel Burn: ${derived.dailyFuelBurnLitres} L/d`],
    },
    'bhr-fuel-1': {
      system: 'Cryogenic Bulk Fuel Farm & Manifold Pump',
      cascade: [
        'Bulk Fuel Farm (9,400 L)',
        `Daily Burn (${derived.dailyFuelBurnLitres} L/d)`,
        `Runway (${derived.fuelRunwayDays.toFixed(1)} Days)`,
        'Resupply Arrival (18-30 Days)',
        'Station Autonomy Gap'
      ],
      risk: isLogisticsCritical ? 'CRITICAL RUNWAY' : 'NOMINAL BUFFER',
      action: isLogisticsCritical ? 'Review resupply schedule and engage Power Conservation mode immediately.' : 'Verify tank anti-waxing heating jackets.',
      impactNodes: [`Stock: 9,400 L`, `Burn: ${derived.dailyFuelBurnLitres} L/d`, `Runway: ${derived.fuelRunwayDays.toFixed(1)}d`],
    },
    'bhr-water-1': {
      system: 'Water RO Desalination & Melt Tank System',
      cascade: [
        'Seawater Intake Pump',
        'Electrical Trace Heating',
        'RO High Pressure Membrane',
        'Potable Reservoir (4,200 L)',
        'Galley Life Support'
      ],
      risk: 'OPERATIONAL NOMINAL',
      action: 'Check heat-trace current draw on sub-surface water intake line.',
      impactNodes: ['RO Intake: 18.2 L/min', 'Potable: 4,200 L', 'Trace Heat: 8.5 kW'],
    },
    'bhr-comms-1': {
      system: 'SATCOM Radome & Ku/Ka Deep-Space Array',
      cascade: [
        'Steerable Dish Gimbal',
        'Geostationary Satellite Link',
        'NCPOR Mission Control Sync',
        'Edge Queue Flush',
        'Emergency HF Net'
      ],
      risk: activeInjectedEvents.highWind ? 'KATABATIC GUST WARNING' : 'ONLINE LINKED',
      action: activeInjectedEvents.highWind ? 'Park and stow satellite dish azimuth to reduce wind-load torsion.' : 'Nominal telemetry sync.',
      impactNodes: ['Azimuth: 142° Tracking', 'Uplink: 100% Locked', 'Radome Heater: 4.2 kW'],
    },
  };

  const selectedDependency = assetDependencyMap[selectedAssetId] || assetDependencyMap['bhr-gen-2'];

  const fuelItem = logistics.inventory.find(i => i.category === 'fuel');
  const foodItem = logistics.inventory.find(i => i.category === 'food');
  const medItem = logistics.inventory.find(i => i.category === 'medical');

  return (
    <div className="flex-1 p-4 md:p-6 space-y-5 max-w-7xl mx-auto w-full font-sans text-slate-100">
      
      {/* ============================================================== */}
      {/* 1. TOP HEADER: FIXED STATION IDENTITY (NO DUPLICATE WORDING)   */}
      {/* ============================================================== */}
      <div className="polar-card p-4 rounded-xl border border-polar-border flex flex-wrap items-center justify-between gap-4">
        
        {/* Exact Header Specification from Requirement 1 */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-polar-cyan/15 text-polar-cyan border border-polar-cyan/30 flex items-center justify-center font-mono font-black text-lg shrink-0">
            {metadata.stationId === 'maitri' ? 'MAI' : 'BHR'}
          </div>
          <div>
            <div className="flex items-baseline gap-2.5">
              <h1 className="text-2xl font-black tracking-tight text-white uppercase font-sans">
                {metadata.stationId === 'maitri' ? 'MAITRI' : 'BHARATI'}
              </h1>
              <span className="text-sm font-semibold text-slate-400">Antarctic Research Station</span>
              <span className="text-xs text-slate-500 font-medium hidden sm:inline">({metadata.hindiName})</span>
            </div>
            <p className="text-slate-300 mt-0.5 flex flex-wrap items-center gap-x-2 text-[13px]">
              <span className="font-medium text-slate-200">
                {metadata.stationId === 'maitri' ? 'Schirmacher Oasis, Queen Maud Land' : 'Larsemann Hills, Princess Elizabeth Land'}
              </span>
              <span className="text-slate-500">·</span>
              <span className="font-mono text-slate-300">
                {metadata.stationId === 'maitri' ? '70.767°S · 11.733°E' : '69.407°S · 76.19°E'}
              </span>
              <span className="text-slate-500">·</span>
              <span>Elevation <strong className="font-mono text-white">{metadata.coordinates.elevationM}m</strong></span>
              <span className="text-slate-500">·</span>
              <span>Personnel <strong className="font-mono text-white">{metadata.currentPersonnel}</strong></span>
            </p>
          </div>
        </div>

        {/* Station Switcher (Maitri vs Bharati) */}
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

      {/* ============================================================== */}
      {/* 2. SEPARATE OPERATING MODE FROM OPERATIONAL STATUS             */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Operating Mode Block */}
        <div className="polar-card p-3.5 rounded-xl border border-polar-border flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-polar-cyan" />
            <div>
              <span className="text-xs uppercase font-bold text-slate-300 block">Operating Mode:</span>
              <span className="text-[11px] text-slate-400">Station operational stance set by command</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1 bg-polar-950 p-1 rounded-lg border border-polar-border">
            {(['NORMAL', 'SCIENCE OPERATIONS', 'WEATHER ALERT', 'POWER CONSERVATION', 'EMERGENCY'] as StationMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setStationMode(mode)}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                  stationMode === mode
                    ? mode === 'EMERGENCY'
                      ? 'bg-critical-red text-white font-bold'
                      : mode === 'POWER CONSERVATION'
                      ? 'bg-warning-amber text-slate-900 font-bold'
                      : 'bg-polar-blue text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Operational Status Block */}
        <div className="polar-card p-3.5 rounded-xl border border-polar-border flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-polar-cyan" />
            <div>
              <span className="text-xs uppercase font-bold text-slate-300 block">Operational Status:</span>
              <span className="text-[11px] text-slate-400">Real-time condition evaluated by digital twin</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider border ${statusColorMap[operationalStatus]}`}>
              {operationalStatus}
            </span>
            <div className="text-[11px] text-slate-300 font-mono">
              Alerts: <strong className={criticalCount > 0 ? 'text-critical-red' : 'text-slate-200'}>{criticalCount} Crit</strong> · <strong className={warningCount > 0 ? 'text-warning-amber' : 'text-slate-200'}>{warningCount} Warn</strong>
            </div>
          </div>
        </div>

      </div>

      {/* ============================================================== */}
      {/* 3, 4 & 5. HEALTH EXPLANATION, POWER + AUTONOMY & AUTONOMY IMPACT*/}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Tile 1: 3. HEALTH EXPLANATION */}
        <div className="polar-card p-4 rounded-xl border border-polar-border flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
            <span className="text-xs uppercase font-bold text-slate-300">Station Health</span>
            <span className="text-[11px] text-polar-cyan font-bold font-mono">WHY {derived.overallHealthScore}%?</span>
          </div>

          <div>
            <div className="flex items-baseline gap-2.5 my-0.5">
              <span className={`text-4xl md:text-5xl font-black font-mono ${
                derived.overallHealthScore >= 80 ? 'text-operational-green' :
                derived.overallHealthScore >= 60 ? 'text-warning-amber' : 'text-critical-red animate-pulse'
              }`}>
                {derived.overallHealthScore}
              </span>
              <div className="text-xs">
                <span className="text-slate-400 block font-semibold uppercase text-[10px]">STATION HEALTH</span>
                <span className="font-mono text-slate-300 text-[11px]">
                  {derived.healthPointDelta > 0 ? `↓ ${derived.healthPointDelta} points from nominal` : 'At nominal baseline'}
                </span>
              </div>
            </div>

            {/* Breakdown across the 4 domains */}
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] font-mono pt-1.5 border-t border-white/5">
              <div className="flex justify-between">
                <span className="text-slate-400">Environment:</span>
                <strong className={envScore < 80 ? 'text-warning-amber' : 'text-white'}>{envScore}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Microgrid:</span>
                <strong className={energyScore < 70 ? 'text-critical-red' : energyScore < 85 ? 'text-warning-amber' : 'text-white'}>{energyScore}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Infrastructure:</span>
                <strong className={infraScore < 75 ? 'text-warning-amber' : 'text-white'}>{infraScore}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Logistics:</span>
                <strong className={logScore < 75 ? 'text-critical-red' : 'text-white'}>{logScore}</strong>
              </div>
            </div>
          </div>

          {/* Primary & Secondary Driver Attribution with Point Contributions */}
          <div className="space-y-1 text-[11px] pt-1.5 border-t border-white/5">
            <div className="flex items-start justify-between gap-1">
              <span className="text-slate-400 uppercase text-[10px] font-bold shrink-0">Primary:</span>
              <span className="text-right text-slate-200 truncate">
                <strong className="text-white">{primaryDriverText}</strong> <span className="font-mono text-warning-amber">({primaryDriverImpact})</span>
              </span>
            </div>
            <div className="flex items-start justify-between gap-1">
              <span className="text-slate-400 uppercase text-[10px] font-bold shrink-0">Secondary:</span>
              <span className="text-right text-slate-300 truncate">
                {secondaryDriverText} <span className="font-mono text-slate-400">({secondaryDriverImpact})</span>
              </span>
            </div>
          </div>
        </div>

        {/* Tile 2: 4. POWER + AUTONOMY (Microgrid Card showing 2 Concepts) */}
        <div className={`polar-card p-4 rounded-xl border flex flex-col justify-between space-y-2 ${
          isPowerDeficit ? 'border-critical-red/60 bg-critical-red/10' : 'border-operational-green/50 bg-operational-green/10'
        }`}>
          <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
            <span className="text-xs uppercase font-bold text-slate-300">Microgrid & Autonomy</span>
            <ProvenanceBadge source="Derived Calculation" compact />
          </div>

          {/* CURRENT POWER */}
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Current Power</span>
              <span className={`text-[10px] font-bold uppercase font-mono ${isPowerDeficit ? 'text-critical-red' : 'text-operational-green'}`}>
                {isPowerDeficit ? 'POWER DEFICIT' : 'POWER RESERVE'}
              </span>
            </div>
            <div className="flex items-baseline justify-between my-0.5">
              <span className={`text-3xl font-black font-mono ${isPowerDeficit ? 'text-critical-red animate-pulse' : 'text-operational-green'}`}>
                {isPowerDeficit ? `${derived.powerSurplusDeficitKw} kW` : `+${derived.powerSurplusDeficitKw} kW`}
              </span>
              <span className="text-[11px] font-mono text-slate-300">
                Gen: <strong>{derived.generationCapacityKw} kW</strong> · Dem: <strong>{derived.totalDemandKw} kW</strong>
              </span>
            </div>
          </div>

          {/* LONG-TERM AUTONOMY */}
          <div className="pt-1.5 border-t border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Long-Term Autonomy</span>
              <span className={`text-[10px] font-bold uppercase font-mono ${isLogisticsCritical ? 'text-warning-amber' : 'text-operational-green'}`}>
                {isLogisticsCritical ? 'Warning: Below 14d Reserve' : 'Buffer Secure'}
              </span>
            </div>
            <div className="flex items-baseline justify-between my-0.5">
              <span className={`text-2xl font-black font-mono ${isLogisticsCritical ? 'text-warning-amber' : 'text-white'}`}>
                {derived.fuelRunwayDays.toFixed(1)} DAYS
              </span>
              <span className="text-[11px] font-mono text-slate-300">
                FUEL AUTONOMY
              </span>
            </div>
            <div className="text-[10px] font-semibold text-slate-300 mt-0.5 flex justify-between font-mono">
              <span>Current power = <strong className={isPowerDeficit ? 'text-critical-red' : 'text-operational-green'}>{currentPowerCondition.toLowerCase()}</strong></span>
              <span>Autonomy = <strong className={isLogisticsCritical ? 'text-warning-amber' : 'text-operational-green'}>{longTermAutonomyCondition.toLowerCase()}</strong></span>
            </div>
          </div>
        </div>

        {/* Tile 3: 5. AUTONOMY & SYSTEM IMPACT */}
        <div className="polar-card p-4 rounded-xl border border-polar-border flex flex-col justify-between space-y-2 bg-polar-navy/90">
          <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
            <span className="text-xs uppercase font-bold text-polar-cyan font-sans">Autonomy & System Impact</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
              isLogisticsCritical ? 'bg-warning-amber text-slate-900' : 'bg-operational-green text-white'
            }`}>
              {longTermAutonomyCondition}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded bg-polar-950 border border-polar-border">
              <span className="text-[10px] text-slate-400 uppercase block font-semibold">Power</span>
              <strong className={`font-mono text-sm ${isPowerDeficit ? 'text-critical-red' : 'text-operational-green'}`}>
                {isPowerDeficit ? 'DEFICIT' : 'NOMINAL'}
              </strong>
            </div>
            <div className="p-2 rounded bg-polar-950 border border-polar-border">
              <span className="text-[10px] text-slate-400 uppercase block font-semibold">Autonomy</span>
              <strong className={`font-mono text-sm ${isLogisticsCritical ? 'text-warning-amber' : 'text-operational-green'}`}>
                {longTermAutonomyCondition}
              </strong>
            </div>
          </div>

          <div className="space-y-1 text-[11px] text-slate-300 pt-1 border-t border-white/5">
            <div className="flex justify-between">
              <span className="text-slate-400">CAUSE:</span>
              <strong className="text-white truncate max-w-[170px] text-right">
                {isLogisticsCritical ? 'Fuel runway below reserve' : 'Microgrid balanced'}
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">IMPACT:</span>
              <span className="text-slate-200 truncate max-w-[170px] text-right">
                {isLogisticsCritical ? 'Resupply margin at risk' : 'Buffer maintained'}
              </span>
            </div>
          </div>

          {/* 9. WHY THIS MATTERS (Plain Language Operational Meaning) */}
          <div className="p-2 rounded bg-polar-950/80 border border-polar-border text-[11px] text-slate-300 leading-snug">
            <span className="text-polar-cyan font-bold block text-[10px] uppercase mb-0.5 flex items-center gap-1">
              <Info className="w-3 h-3" /> Why This Matters:
            </span>
            <p className="line-clamp-3 text-slate-300">{whyThisMattersText}</p>
          </div>
        </div>

        {/* Tile 4: Operational Subsystems Status Grid */}
        <div className="polar-card p-4 rounded-xl border border-polar-border flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
            <span className="text-xs uppercase font-bold text-slate-300">Subsystem Readiness</span>
            <span className="text-[10px] text-slate-400 font-mono">5 Domains Monitored</span>
          </div>

          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex items-center justify-between p-1.5 rounded bg-polar-950 border border-polar-border">
              <span className="text-slate-400 font-sans">Microgrid Energy</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                subsystemStates.energy === 'CRITICAL' ? 'bg-critical-red text-white' : 'text-operational-green'
              }`}>{subsystemStates.energy}</span>
            </div>
            <div className="flex items-center justify-between p-1.5 rounded bg-polar-950 border border-polar-border">
              <span className="text-slate-400 font-sans">Water Desalination</span>
              <span className="text-operational-green font-bold text-[10px]">{subsystemStates.water}</span>
            </div>
            <div className="flex items-center justify-between p-1.5 rounded bg-polar-950 border border-polar-border">
              <span className="text-slate-400 font-sans">Life Support / HVAC</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                subsystemStates.lifeSupport === 'CRITICAL' ? 'bg-critical-red text-white' : 'text-operational-green'
              }`}>{subsystemStates.lifeSupport}</span>
            </div>
            <div className="flex items-center justify-between p-1.5 rounded bg-polar-950 border border-polar-border">
              <span className="text-slate-400 font-sans">SATCOM Array</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                subsystemStates.comms === 'WARNING' ? 'text-warning-amber' : 'text-operational-green'
              }`}>{subsystemStates.comms}</span>
            </div>
            <div className="flex items-center justify-between p-1.5 rounded bg-polar-950 border border-polar-border">
              <span className="text-slate-400 font-sans">Logistics Runway</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                subsystemStates.logistics === 'CRITICAL' ? 'bg-critical-red text-white animate-pulse' : 'text-operational-green'
              }`}>{subsystemStates.logistics}</span>
            </div>
          </div>
        </div>

      </div>

      {/* ============================================================== */}
      {/* 6. DIGITAL TWIN (LEFT 65%) + 8. RISK ENGINE (RIGHT 35%)         */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* LEFT 65%: 6. DIGITAL TWIN */}
        <div className="lg:col-span-8 polar-card p-5 rounded-xl border border-polar-border space-y-4 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block">
                  Interactive Operational Model
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-polar-cyan/20 text-polar-cyan border border-polar-cyan/40 font-bold">
                  DIRECTIONAL ASSET DEPENDENCIES
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mt-0.5">
                Spatial Relationship & Asset Dependency Graph
              </h2>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 hidden sm:inline">Select asset to trace upstream/downstream impact:</span>
              <Link
                href="/digital-twin"
                className="text-xs text-polar-cyan hover:underline font-semibold flex items-center gap-1"
              >
                <span>Full Blueprint</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Connected Spatial 2D Digital Twin SVG */}
          <div className="rounded-xl overflow-hidden border border-polar-border bg-polar-950">
            <StationTwin2D
              stationId={currentStationId}
              assets={infrastructure.assets}
              selectedAssetId={selectedAssetId}
              onSelectAsset={(id) => setSelectedAssetId(id)}
            />
          </div>

          {/* Connected Operational Path Highlight Strip */}
          <div className="p-3.5 rounded-xl bg-polar-950 border border-polar-border space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-semibold">
                Coupled Downstream Dependencies for <strong className="text-white font-sans">{selectedDependency.system}</strong>:
              </span>
              <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-polar-900 border border-polar-border text-polar-cyan">
                {selectedDependency.risk}
              </span>
            </div>

            {/* Directional Flow Breadcrumb with Impact Values */}
            <div className="flex flex-wrap items-center gap-2 pt-1 font-mono">
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

            {/* Mitigating SOP */}
            <div className="text-[12px] text-slate-300 pt-1 border-t border-white/5">
              <strong className="text-slate-400">Recommended SOP: </strong>
              <span>{selectedDependency.action}</span>
            </div>
          </div>
        </div>

        {/* RIGHT 35%: 8. RISK ENGINE */}
        <div className="lg:col-span-4 polar-card p-5 rounded-xl border border-polar-border space-y-4 shadow-xl flex flex-col justify-between">
          <div className="border-b border-white/10 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertOctagon className={`w-5 h-5 ${
                riskSeverity === 'critical' ? 'text-critical-red animate-pulse' :
                riskSeverity === 'warning' ? 'text-warning-amber' : 'text-operational-green'
              }`} />
              <h3 className="text-lg font-bold text-white uppercase tracking-wider font-sans">
                Cross-Domain Risk Engine
              </h3>
            </div>
            <span className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
              riskSeverity === 'critical' ? 'bg-critical-red text-white' :
              riskSeverity === 'warning' ? 'bg-warning-amber text-slate-900' : 'bg-operational-green text-white'
            }`}>
              {riskSeverity}
            </span>
          </div>

          <div className="space-y-3.5 text-xs">
            {/* WHAT */}
            <div className="p-3 rounded-lg bg-polar-950 border border-polar-border space-y-1">
              <span className="text-slate-400 uppercase text-[10px] font-bold block tracking-wider">WHAT:</span>
              <p className="font-bold text-white text-sm leading-tight">{riskWhat}</p>
            </div>

            {/* WHY */}
            <div className="p-3 rounded-lg bg-polar-950 border border-polar-border space-y-1">
              <span className="text-slate-400 uppercase text-[10px] font-bold block tracking-wider">WHY:</span>
              <p className="text-slate-200 leading-relaxed font-medium">{riskWhy}</p>
            </div>

            {/* AFFECTED SYSTEMS */}
            <div className="p-3 rounded-lg bg-polar-950 border border-polar-border space-y-1.5">
              <span className="text-slate-400 uppercase text-[10px] font-bold block tracking-wider">AFFECTED SYSTEMS:</span>
              <div className="flex flex-wrap gap-1.5">
                {riskAffectedSystems.map((sys) => (
                  <span key={sys} className="px-2 py-0.5 rounded bg-polar-900 border border-polar-border text-slate-200 font-semibold text-[11px]">
                    {sys}
                  </span>
                ))}
              </div>
            </div>

            {/* EXPECTED IMPACT */}
            <div className="p-3 rounded-lg bg-polar-950 border border-polar-border space-y-1">
              <span className="text-slate-400 uppercase text-[10px] font-bold block tracking-wider">EXPECTED IMPACT:</span>
              <p className="text-slate-200 leading-relaxed font-medium">{riskExpectedImpact}</p>
            </div>

            {/* OPERATOR ACTION */}
            <div className="p-3.5 rounded-lg bg-polar-cyan/10 border border-polar-cyan/30 space-y-1">
              <span className="text-polar-cyan uppercase text-[10px] font-bold block tracking-wider">OPERATOR ACTION:</span>
              <p className="text-white font-semibold leading-relaxed">{riskOperatorAction}</p>
            </div>
          </div>

          {/* Action Buttons: [ EXPLAIN RISK ] & [ SIMULATE IMPACT ] */}
          <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={() => {
                setActiveExplainAlert({
                  title: riskWhat,
                  severity: riskSeverity,
                  why: riskWhy,
                  causalChain: derived.causalChain,
                  impact: riskExpectedImpact,
                  action: [riskOperatorAction],
                });
                setShowExplainModal(true);
              }}
              className="flex-1 py-2.5 rounded-lg bg-polar-cyan/20 hover:bg-polar-cyan/30 text-polar-cyan border border-polar-cyan/50 text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
            >
              [ EXPLAIN RISK ]
            </button>

            <Link
              href="/simulator"
              className="flex-1 py-2.5 rounded-lg bg-polar-blue hover:bg-polar-blue/80 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
            >
              [ SIMULATE IMPACT ]
            </Link>
          </div>
        </div>

      </div>

      {/* ============================================================== */}
      {/* 7. LIVE CAUSAL FLOW COMPONENT                                  */}
      {/* WEATHER -> HVAC LOAD -> ENERGY DEMAND -> POWER BALANCE ->      */}
      {/* BATTERY -> FUEL RUNWAY -> LOGISTICS RISK                       */}
      {/* ============================================================== */}
      <div className="polar-card p-4 rounded-xl border border-polar-border space-y-3">
        <div className="flex items-center justify-between text-xs border-b border-white/10 pb-2">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-polar-cyan" />
            <h3 className="font-bold text-white uppercase tracking-wider text-xs font-sans">
              Live Causal Flow: Physical Cross-Domain Propagation
            </h3>
          </div>
          <span className="text-slate-400 text-[11px] font-mono">Dynamic Physical Propagation</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {causalFlowItems.map((node, i) => (
            <div 
              key={node.label}
              className={`p-3 rounded-lg border text-center transition-all ${
                node.active 
                  ? 'bg-critical-red/20 border-critical-red text-white shadow-md shadow-critical-red/20 animate-pulse'
                  : 'bg-polar-950 border-polar-border text-slate-300'
              }`}
            >
              <div className="text-[10px] text-slate-400 uppercase font-bold mb-1 truncate">{node.label}</div>
              <div className={`font-mono font-bold text-sm ${node.active ? 'text-critical-red' : 'text-polar-cyan'}`}>
                {node.value}
              </div>
              <div className="text-[9px] text-slate-400 font-mono mt-0.5 truncate">
                {node.sub}
              </div>
              <div className="mt-1 flex justify-center">
                {i < causalFlowItems.length - 1 && (
                  <span className="text-slate-500 text-xs hidden lg:inline">→</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 10. PREDICTIVE TIMELINE, LOGISTICS INTELLIGENCE & MISSION LOG  */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Next 24 Hours Timeline */}
        <div className="polar-card p-5 rounded-xl border border-polar-border space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-polar-cyan" />
              <h3 className="font-bold text-white text-xs uppercase tracking-wider font-sans">
                Next 24 Hours Projections
              </h3>
            </div>
            <ProvenanceBadge source="Prototype Forecast" compact />
          </div>

          <div className="space-y-2.5">
            {next24hTimeline.map((item) => (
              <div 
                key={item.label}
                className="p-2.5 rounded-lg bg-polar-950 border border-polar-border flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold font-mono text-white text-sm">{item.label}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({item.time})</span>
                  </div>
                  <span className="text-[11px] text-slate-400 block font-mono mt-0.5">
                    Demand: <strong className="text-polar-cyan">{item.demand}</strong>
                  </span>
                </div>
                <div className="text-right text-[11px] space-y-0.5 font-mono">
                  <div>Battery: <strong className={item.battery.includes('0%') || item.battery.includes('CRIT') ? 'text-critical-red' : 'text-slate-200'}>{item.battery}</strong></div>
                  <div>Fuel: <strong className="text-slate-200">{item.fuel}</strong></div>
                  <div>Risk: <strong className={item.risk === 'CRITICAL' ? 'text-critical-red' : item.risk === 'WARNING' ? 'text-warning-amber' : 'text-operational-green'}>{item.risk}</strong></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Logistics Intelligence Card */}
        <div className="polar-card p-5 rounded-xl border border-polar-border space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-warning-amber" />
              <h3 className="font-bold text-white text-xs uppercase tracking-wider font-sans">
                Logistics Runway & Reserves
              </h3>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
              isLogisticsCritical ? 'bg-critical-red text-white' : 'bg-operational-green text-white'
            }`}>
              {isLogisticsCritical ? 'CRITICAL AUTONOMY' : 'BUFFER NOMINAL'}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-lg bg-polar-950 border border-polar-border space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Fuel Stock Runway:</span>
                <strong className={`font-mono text-sm ${derived.fuelRunwayDays < 14 ? 'text-critical-red font-bold' : 'text-white'}`}>
                  {derived.fuelRunwayDays.toFixed(1)} Days Remaining
                </strong>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Mandatory Winter Safety Buffer:</span>
                <span className="font-mono text-slate-200">14.0 Days</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Resupply Vessel Arrival:</span>
                <span className="font-mono text-slate-200">{activeInjectedEvents.resupplyDelay ? '30 Days (+12d ICE)' : '18 Days'}</span>
              </div>
              {isLogisticsCritical && (
                <p className="text-[11px] text-critical-red font-semibold pt-1 border-t border-white/5">
                  Reason: Fuel runway is below operational reserve buffer. Shortage projected before vessel approach.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded bg-polar-950 border border-polar-border">
                <span className="text-slate-400 block text-[11px]">Rations Runway:</span>
                <span className="font-mono font-bold text-white text-sm">{foodItem?.daysRemaining || 120} Days</span>
              </div>
              <div className="p-2.5 rounded bg-polar-950 border border-polar-border">
                <span className="text-slate-400 block text-[11px]">Medical Supplies:</span>
                <span className="font-mono font-bold text-white text-sm">{medItem?.daysRemaining || 210} Days</span>
              </div>
            </div>

            <Link
              href="/logistics"
              className="text-xs text-polar-cyan hover:underline font-semibold flex items-center justify-between pt-1"
            >
              <span>Manage Supply Requisitions</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Mission Event Timeline */}
        <div className="polar-card p-5 rounded-xl border border-polar-border space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-polar-cyan" />
              <h3 className="font-bold text-white text-xs uppercase tracking-wider font-sans">
                Mission Execution Timeline
              </h3>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Observe → Act</span>
          </div>

          <div className="space-y-2.5 overflow-y-auto max-h-[300px] pr-1 text-xs">
            {missionTimeline.map((item) => {
              const categoryBadgeMap: Record<string, string> = {
                TELEMETRY: 'bg-polar-cyan/20 text-polar-cyan border-polar-cyan/30',
                ALERT: 'bg-critical-red/20 text-critical-red border-critical-red/40',
                ANALYSIS: 'bg-polar-blue/20 text-polar-cyan border-polar-blue/40',
                ANOMALY: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
                RISK: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
                ACTION: 'bg-operational-green/20 text-operational-green border-operational-green/40',
                SIMULATION: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40',
                'HUMAN ACTION': 'bg-operational-green/20 text-operational-green border-operational-green/40',
                'FOLLOW-UP': 'bg-warning-amber/20 text-warning-amber border-warning-amber/40',
              };
              const categoryBadge = categoryBadgeMap[item.category] || 'bg-polar-900 text-slate-300 border-polar-border';

              return (
                <div key={item.id} className="relative pl-4 border-l-2 border-polar-border/60 pb-2 last:pb-0">
                  <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-polar-cyan" />
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-mono font-bold text-white text-[11px]">{item.time} UTC</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold border ${categoryBadge}`}>
                      {item.category}
                    </span>
                  </div>
                  <h4 className="font-bold text-white text-xs leading-snug">{item.title}</h4>
                  <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">{item.details}</p>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* ============================================================== */}
      {/* EXPLAIN RISK MODAL                                             */}
      {/* ============================================================== */}
      {showExplainModal && activeExplainAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="polar-card border border-polar-cyan/50 rounded-2xl p-6 max-w-2xl w-full space-y-5 shadow-2xl bg-polar-navy text-slate-100">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-5 h-5 text-critical-red" />
                <h3 className="text-lg font-bold text-white font-sans">
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

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-polar-950 border border-polar-border">
                <span className="text-xs text-slate-400 font-semibold uppercase block mb-1">Incident Headline:</span>
                <p className="font-bold text-white text-sm">{activeExplainAlert.title}</p>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">{activeExplainAlert.why}</p>
              </div>

              {/* Deterministic Propagation Sequence */}
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

              {/* Data Provenance Confirmation */}
              <div className="p-3.5 rounded-xl bg-polar-950 border border-polar-border space-y-2 text-xs">
                <span className="text-slate-400 font-semibold uppercase block">
                  Verifiable Data Provenance:
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
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
