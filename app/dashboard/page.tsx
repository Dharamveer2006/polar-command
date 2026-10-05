'use client';

import React, { useState, useEffect } from 'react';
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
  ArrowDown
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
    toggleInjectedEvent,
    triggerFullCascade,
    resetAllEvents,
    derived,
    stationMode,
    setStationMode,
    missionTimeline 
  } = useStation();

  const [selectedAssetId, setSelectedAssetId] = useState<string>('bhr-gen-2');
  const [showExplainModal, setShowExplainModal] = useState<boolean>(false);
  const [activeExplainAlert, setActiveExplainAlert] = useState<any>(null);
  const [stationTime, setStationTime] = useState<string | null>(null);

  useEffect(() => {
    const updateTime = () => {
      setStationTime(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const { metadata, environment, energy, infrastructure, logistics, healthScore, activeAlerts } = stationState;

  const maitriState = allStationsState['maitri'];
  const bharatiState = allStationsState['bharati'];

  const criticalCount = activeAlerts.filter(a => a.severity === 'critical').length;
  const warningCount = activeAlerts.filter(a => a.severity === 'warning').length;

  // Section 2: Fix Operational Status Consistency
  // Never show "Nominal Operations Across All Systems" when health is reduced, warning exists, or logistics is critical
  const isHealthReduced = derived.overallHealthScore < 85;
  const isLogisticsCritical = derived.fuelRunwayDays < 14 || activeInjectedEvents.resupplyDelay;
  const isPowerDeficit = derived.powerSurplusDeficitKw < 0;

  const activeWeatherEvents = environment.activeWeatherEvents || [];
  const primaryWeatherEvent = activeWeatherEvents[0];
  const hasWeatherCritical = activeWeatherEvents.some(e => e.severity === 'critical');
  const hasWeatherWarning = activeWeatherEvents.some(e => e.severity === 'warning');

  const operationalStatus: 'NOMINAL' | 'WATCH' | 'WARNING' | 'CRITICAL' = criticalCount > 0 || isPowerDeficit || hasWeatherCritical
    ? 'CRITICAL'
    : warningCount > 0 || isHealthReduced || isLogisticsCritical || hasWeatherWarning
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

  // Subsystem States for Operational Status Block (Section 2 & 13)
  const subsystemStates = {
    energy: isPowerDeficit ? (Math.abs(derived.powerSurplusDeficitKw) > 50 ? 'CRITICAL' : 'WARNING') : 'NOMINAL',
    water: infrastructure.waterPumpHealth < 75 ? 'WARNING' : 'NOMINAL',
    lifeSupport: activeInjectedEvents.extremeCold && isPowerDeficit ? 'CRITICAL' : activeInjectedEvents.extremeCold ? 'WATCH' : 'NOMINAL',
    comms: activeInjectedEvents.highWind ? 'WARNING' : metadata.connectivityState === 'DISCONNECTED' ? 'CRITICAL' : 'NOMINAL',
    logistics: derived.fuelRunwayDays < 10 ? 'CRITICAL' : (derived.fuelRunwayDays < 14 || activeInjectedEvents.resupplyDelay) ? 'CRITICAL' : 'NOMINAL',
    environment: hasWeatherCritical ? 'CRITICAL' : hasWeatherWarning ? 'WARNING' : 'NOMINAL',
  };

  // Section 3: Cross-Domain Insight (Power vs Long-term Autonomy)
  const currentPowerStatus = isPowerDeficit ? 'DEFICIT' : 'NOMINAL';
  const longTermAutonomyStatus = derived.fuelRunwayDays < 14 || activeInjectedEvents.resupplyDelay ? 'CONSTRAINED' : 'SECURE';
  const autonomyReason = derived.fuelRunwayDays < 14 || activeInjectedEvents.resupplyDelay
    ? `Fuel reserve (${derived.fuelRunwayDays.toFixed(1)}d) is below mandatory 14-day polar buffer. Projected shortage before resupply vessel arrival.`
    : isPowerDeficit
    ? `Microgrid generation deficit (${Math.abs(derived.powerSurplusDeficitKw)} kW) discharging battery reserves.`
    : `Microgrid equilibrium maintained with ${derived.fuelRunwayDays.toFixed(1)} days of fuel autonomy.`;

  // Section 4: Primary & Secondary Health Drivers
  const primaryHealthDriver = activeInjectedEvents.generator2Failure 
    ? 'Generator #2 Mechanical Lockout & Microgrid Deficit'
    : (derived.fuelRunwayDays < 14 || activeInjectedEvents.resupplyDelay)
    ? 'Fuel Runway Contraction Below Operational Reserve'
    : activeInjectedEvents.extremeCold
    ? 'Sub-Zero HVAC Thermodynamic Overdrive'
    : 'All Subsystems Operating Within Polar Thresholds';

  const secondaryHealthDriver = activeInjectedEvents.resupplyDelay && activeInjectedEvents.generator2Failure
    ? 'Pack-Ice Resupply Vessel Delay (+12 Days)'
    : activeInjectedEvents.extremeCold
    ? 'Katabatic Wind Convective Heat Loss'
    : derived.fuelRunwayDays < 18
    ? 'Reserve Buffer Window Narrowing'
    : 'Thermal Loop Equilibrium';

  // Section 5: Risk Engine Active Incident
  const riskSeverity: 'nominal' | 'warning' | 'critical' = criticalCount > 0 || isPowerDeficit || activeInjectedEvents.generator2Failure
    ? 'critical'
    : warningCount > 0 || isLogisticsCritical || activeInjectedEvents.extremeCold || activeInjectedEvents.resupplyDelay
    ? 'warning'
    : 'nominal';

  const riskEventTitle = activeInjectedEvents.generator2Failure && activeInjectedEvents.extremeCold
    ? 'COMPOUND ANOMALY: Microgrid Deficit during Severe Cold Snap'
    : activeInjectedEvents.generator2Failure
    ? 'CRITICAL DEFICIT: Generator #2 Lockout (-190 kW)'
    : activeInjectedEvents.extremeCold
    ? 'WEATHER ADVISORY: Extreme Polar Cold Snap (-12°C Offset)'
    : activeInjectedEvents.resupplyDelay
    ? 'LOGISTICS ALERT: Pack-Ice Navigation Delay (+12 Days)'
    : isLogisticsCritical
    ? `LOGISTICS ALERT: Fuel Runway Constrained (${derived.fuelRunwayDays.toFixed(1)}d)`
    : 'Nominal Watchkeeping: Microgrid & Station In Balance';

  const riskWhy = activeInjectedEvents.generator2Failure
    ? `Emergency trip removed 190 kW generation capacity while station demand is ${derived.totalDemandKw} kW.`
    : activeInjectedEvents.extremeCold
    ? `Ambient temperature dropped to ${derived.effectiveTempC.toFixed(1)}°C, surging HVAC heating draw to ${derived.heatingLoadKw} kW.`
    : activeInjectedEvents.resupplyDelay
    ? 'Multi-year pack ice obstruction at coastal approach pushed vessel arrival +12 days beyond safety buffer.'
    : isLogisticsCritical
    ? `Current daily fuel burn (${derived.dailyFuelBurnLitres} L/d) depletes stock to 0 before scheduled replenishment.`
    : 'Continuous sensor telemetry reporting within nominal operational thresholds.';

  const riskAffected = activeInjectedEvents.generator2Failure
    ? ['Microgrid', 'Battery (BESS)', 'Station HVAC', 'Life Support']
    : activeInjectedEvents.extremeCold
    ? ['Environment', 'HVAC Thermal Grid', 'Microgrid Demand', 'Fuel Reserves']
    : activeInjectedEvents.resupplyDelay
    ? ['Logistics', 'Fuel Farm', 'Winter Buffer', 'Operational Risk']
    : ['All Systems Nominal'];

  const riskImpact = activeInjectedEvents.generator2Failure
    ? `Station battery discharging at current net deficit (${Math.abs(derived.powerSurplusDeficitKw)} kW). Battery will deplete in < 6 hours without intervention.`
    : activeInjectedEvents.extremeCold
    ? 'Accelerated thermal leakage increases daily fuel consumption by +18%, shrinking winter fuel autonomy.'
    : activeInjectedEvents.resupplyDelay
    ? `Fuel runway margin (${derived.fuelRunwayDays.toFixed(1)}d) drops inside the 30-day resupply window, causing projected fuel exhaustion.`
    : 'Station maintains positive power reserve and uninterrupted life support stability.';

  const riskAction = activeInjectedEvents.generator2Failure
    ? 'Activate cold-reserve Genset #3 immediately; shed Tier-3 research laboratory load (-45 kW).'
    : activeInjectedEvents.extremeCold
    ? 'Deploy perimeter thermal storm shutters; engage secondary glycol heat recovery exchangers.'
    : activeInjectedEvents.resupplyDelay
    ? 'Enact Tier-2 station energy conservation protocol; submit ski-plane air-drop fuel requisition.'
    : 'Maintain standard watchkeeping routine; log synoptic weather observations.';

  // Section 6: Live Causal Flow State
  const causalFlow = [
    { label: 'Temperature', value: `${derived.effectiveTempC.toFixed(1)}°C`, active: activeInjectedEvents.extremeCold },
    { label: 'HVAC Load', value: `${derived.heatingLoadKw} kW`, active: activeInjectedEvents.extremeCold },
    { label: 'Energy Demand', value: `${derived.totalDemandKw} kW`, active: activeInjectedEvents.extremeCold || activeInjectedEvents.generator2Failure },
    { label: 'Generator Load', value: `${derived.generationCapacityKw} kW`, active: activeInjectedEvents.generator2Failure },
    { label: 'Fuel Burn', value: `${derived.dailyFuelBurnLitres} L/d`, active: activeInjectedEvents.extremeCold || activeInjectedEvents.generator2Failure },
    { label: 'Fuel Runway', value: `${derived.fuelRunwayDays.toFixed(1)}d`, active: derived.fuelRunwayDays < 14 || activeInjectedEvents.resupplyDelay },
    { label: 'Logistics Risk', value: isLogisticsCritical ? 'CRITICAL' : 'NOMINAL', active: isLogisticsCritical },
  ];

  // Section 7: Next 24 Hours Timeline
  const next24hTimeline = [
    {
      label: 'NOW',
      time: 'T+0H',
      weather: `${derived.effectiveTempC.toFixed(1)}°C, ${derived.effectiveWindKmh} km/h`,
      demand: `${derived.totalDemandKw} kW`,
      battery: `${derived.batterySocPercent}%`,
      fuel: `${derived.fuelRunwayDays.toFixed(1)}d`,
      infra: `${derived.overallInfrastructureHealth}%`,
      logistics: isLogisticsCritical ? 'CRITICAL' : 'NOMINAL',
    },
    {
      label: '+6H',
      time: 'T+6H',
      weather: `${(derived.effectiveTempC - 0.8).toFixed(1)}°C, ${derived.effectiveWindKmh + 2} km/h`,
      demand: `${derived.totalDemandKw + 8} kW`,
      battery: isPowerDeficit ? `${Math.max(0, derived.batterySocPercent - 28)}%` : `${derived.batterySocPercent}%`,
      fuel: `${Math.max(0, derived.fuelRunwayDays - 0.3).toFixed(1)}d`,
      infra: isPowerDeficit ? '78%' : `${derived.overallInfrastructureHealth}%`,
      logistics: isLogisticsCritical ? 'CRITICAL' : 'NOMINAL',
    },
    {
      label: '+12H',
      time: 'T+12H',
      weather: `${(derived.effectiveTempC - 1.4).toFixed(1)}°C, ${derived.effectiveWindKmh + 5} km/h`,
      demand: `${derived.totalDemandKw + 14} kW`,
      battery: isPowerDeficit ? `${Math.max(0, derived.batterySocPercent - 55)}%` : `${derived.batterySocPercent}%`,
      fuel: `${Math.max(0, derived.fuelRunwayDays - 0.6).toFixed(1)}d`,
      infra: isPowerDeficit ? '72%' : `${derived.overallInfrastructureHealth}%`,
      logistics: derived.fuelRunwayDays < 18 ? 'WARNING' : 'NOMINAL',
    },
    {
      label: '+24H',
      time: 'T+24H',
      weather: `${(derived.effectiveTempC - 2.1).toFixed(1)}°C, ${derived.effectiveWindKmh + 8} km/h`,
      demand: `${derived.totalDemandKw + 22} kW`,
      battery: isPowerDeficit ? '0% (DEPLETED)' : `${derived.batterySocPercent}%`,
      fuel: `${Math.max(0, derived.fuelRunwayDays - 1.2).toFixed(1)}d`,
      infra: isPowerDeficit ? '65%' : `${derived.overallInfrastructureHealth}%`,
      logistics: derived.fuelRunwayDays < 15 ? 'CRITICAL' : 'WARNING',
    },
  ];

  // Asset Dependency Mapping
  const assetDependencyMap: Record<string, { system: string; cascade: string[]; risk: string; action: string }> = {
    'bhr-gen-2': {
      system: 'Auxiliary Diesel Generator #2 (220 kW)',
      cascade: ['Generator #2 Lockout', 'Microgrid Deficit (-190 kW)', 'BESS Battery Discharge', 'HVAC Load Priority', 'Fuel Runway Contraction', 'Station Risk'],
      risk: activeInjectedEvents.generator2Failure ? 'CRITICAL LOCKOUT' : 'STANDBY NOMINAL',
      action: activeInjectedEvents.generator2Failure ? 'Execute emergency start on reserve Genset #3; shed non-critical research lab loads.' : 'Inspect oil filter and check coolant level.',
    },
    'bharati-gen-02': {
      system: 'Main Cogeneration Generator #2 (220 kW)',
      cascade: ['Generator #2 Lockout', 'Microgrid Deficit (-190 kW)', 'BESS Battery Discharge', 'HVAC Load Priority', 'Fuel Runway Contraction', 'Station Risk'],
      risk: activeInjectedEvents.generator2Failure ? 'CRITICAL LOCKOUT' : 'STANDBY NOMINAL',
      action: activeInjectedEvents.generator2Failure ? 'Execute emergency start on reserve Genset #3; shed non-critical research lab loads.' : 'Inspect oil filter and check coolant level.',
    },
    'bhr-gen-1': {
      system: 'Primary Base Generator #1 (220 kW)',
      cascade: ['Primary Generator', 'Microgrid Backbone', 'Station Baseload', 'Fuel Manifold Injection', 'Cogeneration Heat Exchanger'],
      risk: 'ONLINE NOMINAL',
      action: 'Verify rotational frequency and continuous lube oil pressure.',
    },
    'bharati-gen-01': {
      system: 'Primary Base Generator #1 (220 kW)',
      cascade: ['Primary Generator', 'Microgrid Backbone', 'Station Baseload', 'Fuel Manifold Injection', 'Cogeneration Heat Exchanger'],
      risk: 'ONLINE NOMINAL',
      action: 'Verify rotational frequency and continuous lube oil pressure.',
    },
    'bhr-battery-1': {
      system: 'BESS Battery Storage Bank (450 kWh)',
      cascade: ['Microgrid Deficit', 'Battery Discharge Loop', 'Inverter Bus (415V)', 'HVAC Power Conservation', 'Station Risk'],
      risk: derived.powerSurplusDeficitKw < 0 ? 'ACTIVE DISCHARGE' : 'FLOAT CHARGED',
      action: derived.powerSurplusDeficitKw < 0 ? 'Shed non-critical scientific loads (-45 kW) to prevent deep battery depletion.' : 'Maintain float charge voltage at 415V.',
    },
    'bharati-battery-01': {
      system: 'BESS Battery Storage Bank (450 kWh)',
      cascade: ['Microgrid Deficit', 'Battery Discharge Loop', 'Inverter Bus (415V)', 'HVAC Power Conservation', 'Station Risk'],
      risk: derived.powerSurplusDeficitKw < 0 ? 'ACTIVE DISCHARGE' : 'FLOAT CHARGED',
      action: derived.powerSurplusDeficitKw < 0 ? 'Shed non-critical scientific loads (-45 kW) to prevent deep battery depletion.' : 'Maintain float charge voltage at 415V.',
    },
    'bhr-hvac-1': {
      system: 'Central HVAC & Thermal Balancing Exchangers',
      cascade: ['Exterior Chill Factor', 'Indoor 21°C Thermal Setpoint', 'HVAC Heater Grid Draw', 'Microgrid Demand Surge', 'Fuel Burn Acceleration'],
      risk: activeInjectedEvents.extremeCold ? 'THERMAL OVERDRIVE' : 'BALANCED NOMINAL',
      action: activeInjectedEvents.extremeCold ? 'Deploy perimeter thermal storm shutters and activate auxiliary glycol loops.' : 'Routine heat exchanger duct inspection.',
    },
    'bharati-hvac-01': {
      system: 'Zonal Air Heat Exchanger & Recovery',
      cascade: ['Exterior Chill Factor', 'Indoor 21°C Thermal Setpoint', 'HVAC Heater Grid Draw', 'Microgrid Demand Surge', 'Fuel Burn Acceleration'],
      risk: activeInjectedEvents.extremeCold ? 'THERMAL OVERDRIVE' : 'BALANCED NOMINAL',
      action: activeInjectedEvents.extremeCold ? 'Deploy perimeter thermal storm shutters and activate auxiliary glycol loops.' : 'Routine heat exchanger duct inspection.',
    },
    'bhr-fuel-1': {
      system: 'Cryogenic Bulk Fuel Farm & Manifold Pump',
      cascade: ['Bulk Fuel Storage', 'Daily Burn Rate (2,246 L/d)', 'Vessel Resupply Arrival Window', 'Autonomous Station Runway', 'Emergency Fuel Reserve'],
      risk: derived.fuelRunwayDays < 14 ? 'CRITICAL RUNWAY' : 'NOMINAL BUFFER',
      action: derived.fuelRunwayDays < 14 ? 'Dispatch priority ski-plane airlift requisition to NCPOR Command.' : 'Verify tank anti-waxing heating jackets.',
    },
    'bharati-fuel-01': {
      system: 'Main Fuel Manifold & Pre-Heater Pump',
      cascade: ['Bulk Fuel Storage', 'Daily Burn Rate (2,246 L/d)', 'Vessel Resupply Arrival Window', 'Autonomous Station Runway', 'Emergency Fuel Reserve'],
      risk: derived.fuelRunwayDays < 14 ? 'CRITICAL RUNWAY' : 'NOMINAL BUFFER',
      action: derived.fuelRunwayDays < 14 ? 'Dispatch priority ski-plane airlift requisition to NCPOR Command.' : 'Verify tank anti-waxing heating jackets.',
    },
    'bhr-water-1': {
      system: 'Water RO Desalination & Melt Tank System',
      cascade: ['Seawater/Lake Intake Pump', 'Electrical Trace Heating Cable', 'RO High Pressure Membrane', 'Potable Reservoir', 'Galley Life Support'],
      risk: 'OPERATIONAL NOMINAL',
      action: 'Check heat-trace current draw on sub-surface water intake line.',
    },
    'bharati-pump-02': {
      system: 'Seawater Intake Pump #2',
      cascade: ['Seawater/Lake Intake Pump', 'Electrical Trace Heating Cable', 'RO High Pressure Membrane', 'Potable Reservoir', 'Galley Life Support'],
      risk: 'VIBRATION ADVISORY',
      action: 'Check heat-trace current draw and lubricate outer pump seal.',
    },
    'bhr-comms-1': {
      system: 'SATCOM Radome & Ku/Ka Deep-Space Array',
      cascade: ['Steerable Dish Gimbal', 'Geostationary Satellite Link', 'NCPOR Mission Control Sync', 'Edge Queue Telemetry Flush', 'Emergency HF Net'],
      risk: activeInjectedEvents.highWind ? 'KATABATIC GUST WARNING' : 'ONLINE LINKED',
      action: activeInjectedEvents.highWind ? 'Park and stow satellite dish azimuth to reduce wind-load torsion.' : 'Nominal telemetry sync.',
    },
    'bharati-sat-01': {
      system: 'SATCOM Radome & Deep-Space Array',
      cascade: ['Steerable Dish Gimbal', 'Geostationary Satellite Link', 'NCPOR Mission Control Sync', 'Edge Queue Telemetry Flush', 'Emergency HF Net'],
      risk: activeInjectedEvents.highWind ? 'KATABATIC GUST WARNING' : 'ONLINE LINKED',
      action: activeInjectedEvents.highWind ? 'Park and stow satellite dish azimuth to reduce wind-load torsion.' : 'Nominal telemetry sync.',
    },
  };

  const selectedDependency = assetDependencyMap[selectedAssetId] || 
    (selectedAssetId.includes('battery') ? assetDependencyMap['bhr-battery-1'] :
     selectedAssetId.includes('gen') ? assetDependencyMap['bhr-gen-2'] :
     selectedAssetId.includes('hvac') ? assetDependencyMap['bhr-hvac-1'] :
     selectedAssetId.includes('fuel') ? assetDependencyMap['bhr-fuel-1'] :
     selectedAssetId.includes('water') || selectedAssetId.includes('pump') || selectedAssetId.includes('ro') ? assetDependencyMap['bhr-water-1'] :
     selectedAssetId.includes('comms') || selectedAssetId.includes('sat') ? assetDependencyMap['bhr-comms-1'] :
     assetDependencyMap['bhr-gen-2']);

  const fuelItem = logistics.inventory.find(i => i.category === 'fuel');
  const foodItem = logistics.inventory.find(i => i.category === 'food');
  const medItem = logistics.inventory.find(i => i.category === 'medical');

  return (
    <div className="flex-1 p-4 md:p-6 space-y-5 max-w-7xl mx-auto w-full font-sans text-[#0F2740]">
      
      {/* ============================================================== */}
      {/* 1. TOP HEADER: STATION IDENTITY, MODES & ANTARCTIC SWITCHER    */}
      {/* ============================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-3.5 rounded-xl polar-glass">
        {/* Antarctic Station Switcher */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#36546D]">
            <Globe2 className="w-4 h-4 text-[#007A9E]" />
            <span className="uppercase tracking-wider">Antarctic Command:</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentStationId('maitri')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                currentStationId === 'maitri'
                  ? 'bg-cyan-500/20 border border-cyan-400/50 text-[#006A8C] font-bold shadow-xs'
                  : 'bg-white/80 border border-slate-300/80 text-[#36546D] hover:text-[#0F2740] shadow-xs'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${
                maitriState?.healthScore?.overall >= 80 ? 'bg-emerald-600' : 'bg-amber-600'
              }`} />
              <span>MAITRI</span>
              <span className="font-mono text-[11px] text-[#08243A] font-bold">{maitriState?.healthScore?.overall || 91}%</span>
            </button>

            <button
              onClick={() => setCurrentStationId('bharati')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                currentStationId === 'bharati'
                  ? 'bg-cyan-500/20 border border-cyan-400/50 text-[#006A8C] font-bold shadow-xs'
                  : 'bg-white/80 border border-slate-300/80 text-[#36546D] hover:text-[#0F2740] shadow-xs'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${
                derived.overallHealthScore >= 80 ? 'bg-emerald-600' : 'bg-critical-red animate-pulse'
              }`} />
              <span>BHARATI</span>
              <span className="font-mono text-[11px] text-[#08243A] font-bold">{derived.overallHealthScore}%</span>
            </button>
          </div>
        </div>

        {/* Station Operational Mode Selector (Section 9) */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#36546D] uppercase">Operational Stance:</span>
          <div className="flex items-center gap-1 bg-white/70 p-1 rounded-lg border border-slate-300/80 shadow-xs">
            {(['NORMAL', 'SCIENCE OPERATIONS', 'WEATHER ALERT', 'POWER CONSERVATION', 'EMERGENCY'] as StationMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setStationMode(mode)}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                  stationMode === mode
                    ? mode === 'EMERGENCY'
                      ? 'bg-critical-red text-white font-bold'
                      : mode === 'POWER CONSERVATION'
                      ? 'bg-warning-amber text-slate-950 font-bold'
                      : 'bg-[#0F2740] text-white font-bold shadow-xs'
                    : 'text-[#36546D] hover:text-[#0F2740]'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Station Coordinates & Telemetry Status Bar */}
      <div className="polar-glass p-4 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/15 text-[#007A9E] border border-cyan-400/40 flex items-center justify-center font-mono font-bold text-base shrink-0 shadow-xs">
            {metadata.stationId === 'maitri' ? 'MTR' : 'BHR'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#0F2740] uppercase">
                {metadata.name} Antarctic Research Station
              </h1>
              <span className="text-[#36546D] font-medium">({metadata.hindiName})</span>
            </div>
            <p className="text-[#36546D] mt-0.5 flex flex-wrap items-center gap-x-2.5 text-[13px]">
              <span>{metadata.region}</span>
              <span className="text-slate-400">•</span>
              <span className="font-mono text-[#08243A] font-semibold">{metadata.coordinates.lat}°S, {metadata.coordinates.lng}°E</span>
              <span className="text-slate-400">•</span>
              <span>Elevation: <strong className="font-mono text-[#08243A]">{metadata.coordinates.elevationM}m</strong></span>
              <span className="text-slate-400">•</span>
              <span>Personnel: <strong className="font-mono text-[#08243A]">{metadata.currentPersonnel}</strong></span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-right">
          {/* WEATHER STATUS (Section 16: Command Center Compact Weather Status) */}
          <Link 
            href="/environment" 
            title="Open Polar Weather Monitor"
            className="text-left bg-white/80 px-3.5 py-1.5 rounded-lg border border-slate-300/80 hover:border-cyan-500 shadow-xs transition-all"
          >
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-[#0F2740] uppercase">
                {metadata.stationId === 'maitri' ? 'MAITRI' : 'BHARATI'}
              </span>
              <span className="font-mono text-xs text-[#007A9E] font-bold">
                {environment.temperatureC.toFixed(1)}°C
              </span>
              <span className="font-mono text-xs text-amber-800 font-semibold">
                {environment.pressureHpa.toFixed(1)} hPa
              </span>
              <span className="font-mono text-xs text-sky-700 font-semibold">
                {environment.windKmh} km/h
              </span>
              <span className={`flex items-center gap-1 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                environment.weatherState === 'LIVE'
                  ? 'text-emerald-800 bg-emerald-100 border-emerald-300'
                  : 'text-amber-800 bg-amber-100 border-amber-300'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${environment.weatherState === 'LIVE' ? 'bg-emerald-600 animate-pulse' : 'bg-amber-600'}`} />
                {environment.weatherState === 'LIVE' ? '● NCPOR LIVE' : `● NCPOR ${environment.weatherState || 'STALE'}`}
              </span>
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 font-mono text-[10px]">
              <span className="text-[#36546D]">Weather Event:</span>
              {primaryWeatherEvent ? (
                <span className={`font-bold px-1.5 py-0.2 rounded uppercase ${
                  primaryWeatherEvent.severity === 'critical' 
                    ? 'bg-rose-100 text-rose-800 border border-rose-300' 
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}>
                  {primaryWeatherEvent.title} ({primaryWeatherEvent.severity.toUpperCase()})
                </span>
              ) : (
                <span className="text-emerald-700 font-semibold">
                  NOMINAL (NO ANOMALY)
                </span>
              )}
            </div>
          </Link>

          <div>
            <span className="text-[#36546D] block text-[11px] font-semibold">Station Time</span>
            <span suppressHydrationWarning className="font-mono text-sm font-bold text-[#08243A]">
              {stationTime ?? new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} UTC+5
            </span>
          </div>
          <div className="border-l border-slate-300/80 pl-4">
            <span className="text-[#36546D] block text-[11px] font-semibold">Telemetry Uplink</span>
            <span className="font-mono text-sm font-bold text-emerald-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              {metadata.connectivityState === 'CONNECTED' ? 'CONNECTED (100%)' : metadata.connectivityState}
            </span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* ANTARCTIC SCENARIO INJECTOR (SIH26060 CRITICAL DEMO CONTROLLER) */}
      {/* Section 15: Trip Gen #2 → Cold Snap → Resupply Delay → Reset   */}
      {/* ============================================================== */}
      <div className="p-3 rounded-xl polar-glass flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-[#007A9E]" />
          <span className="font-bold text-[#0F2740] uppercase tracking-wider">Antarctic Stress Injector:</span>
          <span className="text-[#36546D] hidden sm:inline">(Trigger connected cross-domain cascades)</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => toggleInjectedEvent('generator2Failure')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
              activeInjectedEvents.generator2Failure
                ? 'bg-critical-red text-white shadow-lg shadow-critical-red/30 animate-pulse'
                : 'bg-white/80 border border-slate-300/80 text-[#36546D] hover:text-[#0F2740] hover:border-slate-500 shadow-xs'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>TRIP GEN #2 (-190kW)</span>
          </button>

          <button
            onClick={() => toggleInjectedEvent('extremeCold')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
              activeInjectedEvents.extremeCold
                ? 'bg-cyan-600 text-white font-bold shadow-lg shadow-cyan-600/30'
                : 'bg-white/80 border border-slate-300/80 text-[#36546D] hover:text-[#0F2740] hover:border-slate-500 shadow-xs'
            }`}
          >
            <Thermometer className="w-3.5 h-3.5" />
            <span>COLD SNAP (-12°C)</span>
          </button>

          <button
            onClick={() => toggleInjectedEvent('resupplyDelay')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
              activeInjectedEvents.resupplyDelay
                ? 'bg-amber-600 text-white font-bold shadow-lg shadow-amber-600/30'
                : 'bg-white/80 border border-slate-300/80 text-[#36546D] hover:text-[#0F2740] hover:border-slate-500 shadow-xs'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>RESUPPLY DELAY (+12d)</span>
          </button>

          <button
            onClick={triggerFullCascade}
            className="px-3 py-1.5 rounded-lg font-semibold bg-rose-100 border border-rose-300 text-rose-800 hover:bg-rose-200 transition-all flex items-center gap-1.5 shadow-xs"
          >
            <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
            <span>FULL CRISIS</span>
          </button>

          <button
            onClick={resetAllEvents}
            className="px-3 py-1.5 rounded-lg font-semibold bg-white/80 border border-slate-300/80 text-[#36546D] hover:text-[#0F2740] transition-all shadow-xs"
          >
            RESET BASELINE
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. OPERATIONAL STATUS, HEALTH EXPLAINABILITY & CROSS-DOMAIN KPI */}
      {/* (Section 2, 3 & 4)                                             */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Tile 1: Station Health & Explainability (Section 4) */}
        <div className="polar-glass p-4 rounded-xl flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
            <span className="text-xs uppercase font-bold text-[#36546D]">Station Health</span>
            <span className="text-[11px] text-[#007A9E] font-bold font-mono">WHY {derived.overallHealthScore}%?</span>
          </div>
          <div className="flex items-baseline gap-3 my-0.5">
            <span className={`text-4xl font-black font-mono ${
              derived.overallHealthScore >= 80 ? 'text-emerald-700' :
              derived.overallHealthScore >= 60 ? 'text-amber-700' : 'text-rose-700 animate-pulse'
            }`}>
              {derived.overallHealthScore}%
            </span>
            <span className="text-xs font-mono text-[#36546D]">
              {derived.healthPointDelta > 0 ? `↓ ${derived.healthPointDelta} pts from nominal` : 'Nominal baseline'}
            </span>
          </div>

          {/* Domain Contribution Breakdown (Section 4) */}
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10.5px] text-[#36546D] pt-1 border-t border-slate-200 font-mono">
            <div className="flex justify-between">
              <span className="text-[#36546D] font-sans">Env (20%):</span>
              <span className="text-[#08243A] font-bold">{Math.round(((healthScore?.environmentScore ?? 95) / 100) * 20)}/20</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#36546D] font-sans">Energy (30%):</span>
              <span className={isPowerDeficit ? 'text-rose-700 font-bold' : 'text-[#08243A] font-bold'}>
                {Math.round(((healthScore?.energyScore ?? 90) / 100) * 30)}/30
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#36546D] font-sans">Infra (25%):</span>
              <span className="text-[#08243A] font-bold">{Math.round(((healthScore?.infrastructureScore ?? 92) / 100) * 25)}/25</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#36546D] font-sans">Logistics (25%):</span>
              <span className={isLogisticsCritical ? 'text-rose-700 font-bold' : 'text-[#08243A] font-bold'}>
                {Math.round(((healthScore?.logisticsScore ?? 80) / 100) * 25)}/25
              </span>
            </div>
          </div>

          <div className="space-y-0.5 text-[11px] text-[#36546D] pt-1 border-t border-slate-200">
            <div className="flex justify-between">
              <span className="text-[#36546D]">Primary Driver:</span>
              <strong className="text-[#0F2740] truncate max-w-[170px] text-right">{primaryHealthDriver}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#36546D]">Secondary:</span>
              <span className="text-[#0F2740] truncate max-w-[170px] text-right">{secondaryHealthDriver}</span>
            </div>
          </div>
        </div>

        {/* Tile 2: Operational Status & Subsystems (Section 2) */}
        <div className="polar-glass p-4 rounded-xl flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
            <span className="text-xs uppercase font-bold text-[#36546D]">Operational Status</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
              operationalStatus === 'CRITICAL' ? 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse' :
              operationalStatus === 'WARNING' ? 'bg-amber-100 text-amber-800 border-amber-300' :
              operationalStatus === 'WATCH' ? 'bg-sky-100 text-sky-800 border-sky-300' :
              'bg-emerald-100 text-emerald-800 border-emerald-300'
            }`}>
              {operationalStatus === 'CRITICAL' ? 'CRITICAL RISK' : operationalStatus === 'WARNING' ? 'ELEVATED RISK' : operationalStatus}
            </span>
          </div>
          <div className="text-xs text-[#36546D] my-0.5 font-medium flex items-center gap-1.5 flex-wrap">
            <span>Active Alerts:</span>
            <Link
              href="/alerts?severity=critical#warning-alerts"
              title="Click to view Critical Alerts"
              className={criticalCount > 0 ? 'text-rose-700 font-mono font-bold hover:underline' : 'text-[#08243A] font-mono hover:underline'}
            >
              {criticalCount} CRITICAL
            </Link>
            <span>•</span>
            <Link
              href="/alerts?severity=warning#warning-alerts"
              title="Click to redirect to Warning section"
              className={warningCount > 0 ? 'text-amber-700 font-mono font-bold hover:underline' : 'text-[#08243A] font-mono hover:underline'}
            >
              {warningCount} WARNING
            </Link>
          </div>
          <div className="space-y-0.5 text-[10.5px] pt-1 border-t border-slate-200 font-mono">
            <div className="flex justify-between">
              <span className="text-[#36546D] font-sans">Energy:</span>
              <span className={subsystemStates.energy === 'CRITICAL' ? 'text-rose-700 font-bold' : 'text-emerald-700 font-bold'}>{subsystemStates.energy}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#36546D] font-sans">Water:</span>
              <span className="text-emerald-700 font-bold">{subsystemStates.water}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#36546D] font-sans">Life Support:</span>
              <span className={subsystemStates.lifeSupport === 'CRITICAL' ? 'text-rose-700 font-bold' : 'text-emerald-700 font-bold'}>{subsystemStates.lifeSupport}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#36546D] font-sans">Comms:</span>
              <span className="text-emerald-700 font-bold">{subsystemStates.comms}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#36546D] font-sans">Logistics:</span>
              <span className={subsystemStates.logistics === 'CRITICAL' ? 'text-rose-700 font-bold animate-pulse' : 'text-emerald-700 font-bold'}>{subsystemStates.logistics}</span>
            </div>
          </div>
        </div>

        {/* Tile 3: Microgrid Net Power Hero (Section 11) */}
        <div className={`polar-glass p-4 rounded-xl flex flex-col justify-between space-y-2 ${
          isPowerDeficit ? 'border-rose-300 bg-rose-50/70' : 'border-emerald-300 bg-emerald-50/70'
        }`}>
          <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
            <span className="text-xs uppercase font-bold text-[#36546D]">Microgrid Power Balance</span>
            <ProvenanceBadge source="Derived Calculation" compact />
          </div>
          <div className="flex items-baseline justify-between my-0.5">
            <div className={`text-3xl font-black font-mono ${isPowerDeficit ? 'text-rose-700 animate-pulse' : 'text-emerald-700'}`}>
              {isPowerDeficit ? `${derived.powerSurplusDeficitKw} kW` : `+${derived.powerSurplusDeficitKw} kW`}
            </div>
            <span className={`text-xs font-bold uppercase tracking-wider ${isPowerDeficit ? 'text-rose-800' : 'text-emerald-800'}`}>
              {isPowerDeficit ? 'POWER DEFICIT' : 'POWER RESERVE'}
            </span>
          </div>
          <div className="flex justify-between text-[11px] text-[#36546D] pt-1 border-t border-slate-200">
            <span>Gen: <strong className="font-mono text-[#08243A]">{derived.generationCapacityKw} kW</strong></span>
            <span>Demand: <strong className="font-mono text-[#007A9E]">{derived.totalDemandKw} kW</strong></span>
            <span>Battery: <strong className="font-mono text-[#08243A]">{derived.batterySocPercent}%</strong></span>
          </div>
        </div>

        {/* Tile 4: Cross-Domain Insight (Section 3) */}
        <div className="polar-glass p-4 rounded-xl flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
            <span className="text-xs uppercase font-bold text-[#007A9E]">Cross-Domain Intelligence</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              longTermAutonomyStatus === 'CONSTRAINED' ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
            }`}>
              {longTermAutonomyStatus}
            </span>
          </div>
          <div className="text-[12px] text-[#36546D] leading-snug space-y-1">
            <div className="flex justify-between font-mono text-[11px]">
              <span className="text-[#36546D]">CURRENT POWER:</span>
              <strong className={isPowerDeficit ? 'text-rose-700 font-bold' : 'text-emerald-700 font-bold'}>
                {currentPowerStatus}
              </strong>
            </div>
            <div className="flex justify-between font-mono text-[11px]">
              <span className="text-[#36546D]">LONG-TERM AUTONOMY:</span>
              <strong className={longTermAutonomyStatus === 'CONSTRAINED' ? 'text-amber-700 font-bold' : 'text-emerald-700 font-bold'}>
                {longTermAutonomyStatus}
              </strong>
            </div>
            <p className="text-[11px] text-[#36546D] pt-1 border-t border-slate-200">
              <strong className="text-[#0F2740]">Reason: </strong>{autonomyReason}
            </p>
          </div>
          <div className="text-[10px] text-[#36546D] pt-1 border-t border-slate-200 font-mono flex justify-between">
            <span>Fuel: <strong className="text-[#08243A]">{derived.fuelRunwayDays.toFixed(1)}d runway</strong></span>
            <span>Buffer: 14d safe</span>
          </div>
        </div>

      </div>

      {/* ============================================================== */}
      {/* 3. VISUAL CENTER ABOVE THE FOLD: LEFT 65% + RIGHT 35%          */}
      {/* (Section 1: Digital Twin + Section 5: Risk Engine)             */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* LEFT 65%: Operational Spatial Digital Twin (Section 1) */}
        <div className="lg:col-span-8 polar-glass p-5 rounded-xl space-y-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider text-[#36546D] font-semibold block">
                  Core Visual Operational Twin
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/15 text-[#007A9E] border border-cyan-400/40 font-bold">
                  CONNECTED SYSTEM TOPOLOGY
                </span>
              </div>
              <h2 className="text-xl font-bold text-[#0F2740] mt-0.5">
                Spatial Relationship & Asset Dependency Graph
              </h2>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#36546D] hidden sm:inline">Select asset to highlight relationships:</span>
              <Link
                href="/digital-twin"
                className="text-xs text-[#007A9E] hover:underline font-semibold flex items-center gap-1"
              >
                <span>Full Blueprint</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Connected Spatial 2D Digital Twin SVG */}
          <div className="rounded-xl overflow-hidden border border-slate-300/80 bg-polar-950 shadow-md">
            <StationTwin2D
              stationId={currentStationId}
              assets={infrastructure.assets}
              selectedAssetId={selectedAssetId}
              onSelectAsset={(id) => setSelectedAssetId(id)}
            />
          </div>

          {/* Connected Operational Path Highlight Strip (Section 1) */}
          <div className="p-3.5 rounded-xl polar-glass-dark border border-cyan-800/40 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-200 font-semibold">
                Connected Systems for <strong className="text-white font-sans">{selectedDependency.system}</strong>:
              </span>
              <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-polar-900 border border-polar-border text-cyan-300">
                {selectedDependency.risk}
              </span>
            </div>

            {/* Visual connected path breadcrumb */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {selectedDependency.cascade.map((node, i) => (
                <React.Fragment key={node}>
                  <span className={`px-2.5 py-1 rounded text-xs font-semibold ${
                    i === 0 
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 font-bold'
                      : i === selectedDependency.cascade.length - 1
                      ? 'bg-critical-red/20 text-critical-red border border-critical-red/40 font-bold'
                      : 'bg-polar-900 border border-polar-border text-slate-300'
                  }`}>
                    {node}
                  </span>
                  {i < selectedDependency.cascade.length - 1 && (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  )}
                </React.Fragment>
              ))}
            </div>

            <div className="text-[12px] text-slate-200 pt-1">
              <strong className="text-slate-300">Mitigation SOP: </strong>
              <span>{selectedDependency.action}</span>
            </div>
          </div>
        </div>

        {/* RIGHT 35%: Dominant Cross-Domain Risk Engine (Section 5) */}
        <div className={`lg:col-span-4 polar-glass p-5 rounded-xl space-y-4 shadow-sm flex flex-col justify-between ${
          riskSeverity === 'critical' ? 'border-rose-400 bg-rose-50/80 shadow-rose-500/10' :
          riskSeverity === 'warning' ? 'border-amber-400 bg-amber-50/80 shadow-amber-500/10' :
          'border-emerald-300 bg-emerald-50/70'
        }`}>
          <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertOctagon className={`w-5 h-5 ${
                riskSeverity === 'critical' ? 'text-critical-red animate-pulse' :
                riskSeverity === 'warning' ? 'text-warning-amber' : 'text-emerald-600'
              }`} />
              <h3 className="text-lg font-bold text-[#0F2740] uppercase tracking-wider">
                Cross-Domain Risk Engine
              </h3>
            </div>
            <span className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
              riskSeverity === 'critical' ? 'bg-critical-red text-white' :
              riskSeverity === 'warning' ? 'bg-warning-amber text-slate-950 font-bold' : 'bg-emerald-600 text-white'
            }`}>
              {riskSeverity}
            </span>
          </div>

          <div className="space-y-3.5 text-xs">
            {/* EVENT */}
            <div className="p-3 rounded-lg bg-white/90 border border-slate-200/90 shadow-xs space-y-1">
              <span className="text-[#36546D] uppercase text-[11px] font-bold block">Active Event:</span>
              <p className="font-bold text-[#0F2740] text-sm leading-tight">{riskEventTitle}</p>
            </div>

            {/* WHY IT HAPPENED */}
            <div className="p-3 rounded-lg bg-white/90 border border-slate-200/90 shadow-xs space-y-1">
              <span className="text-[#36546D] uppercase text-[11px] font-bold block">Why It Happened:</span>
              <p className="text-[#36546D] leading-relaxed font-medium">{riskWhy}</p>
            </div>

            {/* AFFECTED SYSTEMS */}
            <div className="p-3 rounded-lg bg-white/90 border border-slate-200/90 shadow-xs space-y-1.5">
              <span className="text-[#36546D] uppercase text-[11px] font-bold block">Affected Connected Systems:</span>
              <div className="flex flex-wrap gap-1.5">
                {riskAffected.map((sys) => (
                  <span key={sys} className="px-2 py-0.5 rounded bg-slate-100 border border-slate-300 text-[#0F2740] font-semibold text-[11px]">
                    {sys}
                  </span>
                ))}
              </div>
            </div>

            {/* EXPECTED IMPACT */}
            <div className="p-3 rounded-lg bg-white/90 border border-slate-200/90 shadow-xs space-y-1">
              <span className="text-[#36546D] uppercase text-[11px] font-bold block">Expected Impact:</span>
              <p className="text-[#36546D] leading-relaxed font-medium">{riskImpact}</p>
            </div>

            {/* OPERATOR ACTION */}
            <div className="p-3.5 rounded-lg bg-cyan-50/90 border border-cyan-300 shadow-xs space-y-1">
              <span className="text-[#006685] uppercase text-[11px] font-bold block">Recommended Operator Action:</span>
              <p className="text-[#0F2740] font-semibold leading-relaxed">{riskAction}</p>
            </div>
          </div>

          {/* Action Buttons: [ EXPLAIN RISK ] & [ SIMULATE IMPACT ] */}
          <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={() => {
                setActiveExplainAlert({
                  title: riskEventTitle,
                  severity: riskSeverity,
                  why: riskWhy,
                  causalChain: derived.causalChain,
                  impact: riskImpact,
                  action: [riskAction],
                });
                setShowExplainModal(true);
              }}
              className="flex-1 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
            >
              [ EXPLAIN RISK ]
            </button>

            <Link
              href="/simulator"
              className="flex-1 py-2.5 rounded-lg bg-[#0F2740] hover:bg-[#1A3D60] text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
            >
              [ SIMULATE IMPACT ]
            </Link>
          </div>
        </div>

      </div>

      {/* ============================================================== */}
      {/* 4. LIVE CAUSAL FLOW COMPONENT (Section 6)                      */}
      {/* ============================================================== */}
      <div className="polar-glass p-4 rounded-xl space-y-3 shadow-sm">
        <div className="flex items-center justify-between text-xs border-b border-slate-200 pb-2">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#007A9E]" />
            <h3 className="font-bold text-[#0F2740] uppercase tracking-wider text-xs">
              Live Cross-Domain Physical Causal Flow
            </h3>
          </div>
          <span className="text-[#36546D] text-[11px] font-mono">Dynamic Physical Propagation</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {causalFlow.map((node, i) => (
            <div 
              key={node.label}
              className={`p-3 rounded-lg border text-center transition-all ${
                node.active 
                  ? 'bg-rose-100 border-critical-red text-rose-800 shadow-md shadow-critical-red/20 animate-pulse font-bold'
                  : 'bg-white/80 border-slate-200/90 text-[#36546D] shadow-xs'
              }`}
            >
              <div className="text-[10px] text-[#36546D] uppercase font-semibold mb-1 truncate">{node.label}</div>
              <div className={`font-mono font-bold text-sm ${node.active ? 'text-critical-red' : 'text-[#007A9E]'}`}>
                {node.value}
              </div>
              <div className="mt-1 flex justify-center">
                {i < causalFlow.length - 1 && (
                  <span className="text-slate-400 text-xs hidden lg:inline">↓</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 5. PREDICTIVE TIMELINE, LOGISTICS INTELLIGENCE & MISSION LOG   */}
      {/* (Section 7, 8 & 10)                                            */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Next 24 Hours Timeline (Section 7) */}
        <div className="polar-glass p-5 rounded-xl space-y-3 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#007A9E]" />
              <h3 className="font-bold text-[#0F2740] text-xs uppercase tracking-wider">
                Next 24 Hours Projections
              </h3>
            </div>
            <ProvenanceBadge source="Prototype Forecast" compact />
          </div>

          <div className="space-y-2.5">
            {next24hTimeline.map((item) => (
              <div 
                key={item.label}
                className="p-2.5 rounded-lg bg-white/80 border border-slate-200/90 flex items-center justify-between text-xs shadow-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold font-mono text-[#0F2740] text-sm">{item.label}</span>
                    <span className="text-[10px] text-[#36546D] font-mono">({item.time})</span>
                  </div>
                  <span className="text-[11px] text-[#36546D] block font-mono mt-0.5">{item.weather}</span>
                </div>
                <div className="text-right text-[11px] space-y-0.5 font-mono">
                  <div>Demand: <strong className="text-[#007A9E]">{item.demand}</strong></div>
                  <div>Battery: <strong className={item.battery.includes('0%') ? 'text-critical-red font-bold' : 'text-[#08243A]'}>{item.battery}</strong></div>
                  <div>Logistics: <strong className={item.logistics === 'CRITICAL' ? 'text-critical-red font-bold' : 'text-emerald-700'}>{item.logistics}</strong></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Logistics Intelligence Card (Section 10) */}
        <div className="polar-glass p-5 rounded-xl space-y-3 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-amber-600" />
              <h3 className="font-bold text-[#0F2740] text-xs uppercase tracking-wider">
                Logistics Runway & Reserves
              </h3>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              isLogisticsCritical ? 'bg-critical-red text-white' : 'bg-emerald-600 text-white'
            }`}>
              {isLogisticsCritical ? 'CRITICAL AUTONOMY' : 'BUFFER NOMINAL'}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-lg bg-white/80 border border-slate-200/90 space-y-1 shadow-xs">
              <div className="flex justify-between">
                <span className="text-[#36546D]">Fuel Stock Runway:</span>
                <strong className={`font-mono text-sm ${derived.fuelRunwayDays < 14 ? 'text-critical-red font-bold' : 'text-[#08243A]'}`}>
                  {derived.fuelRunwayDays.toFixed(1)} Days Remaining
                </strong>
              </div>
              <div className="flex justify-between text-[11px] text-[#36546D]">
                <span>Mandatory Winter Safety Buffer:</span>
                <span className="font-mono text-[#08243A] font-semibold">14.0 Days</span>
              </div>
              <div className="flex justify-between text-[11px] text-[#36546D]">
                <span>Resupply Vessel Arrival:</span>
                <span className="font-mono text-[#08243A] font-semibold">{activeInjectedEvents.resupplyDelay ? '30 Days (+12d ICE)' : '18 Days'}</span>
              </div>
              {isLogisticsCritical && (
                <p className="text-[11px] text-critical-red font-semibold pt-1 border-t border-slate-200">
                  Reason: Fuel runway is below operational reserve buffer. Shortage projected before vessel approach.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded bg-white/80 border border-slate-200/90 shadow-xs">
                <span className="text-[#36546D] block text-[11px]">Rations Runway:</span>
                <span className="font-mono font-bold text-[#08243A] text-sm">{foodItem?.daysRemaining || 120} Days</span>
              </div>
              <div className="p-2.5 rounded bg-white/80 border border-slate-200/90 shadow-xs">
                <span className="text-[#36546D] block text-[11px]">Medical Supplies:</span>
                <span className="font-mono font-bold text-[#08243A] text-sm">{medItem?.daysRemaining || 210} Days</span>
              </div>
            </div>

            <Link
              href="/logistics"
              className="text-xs text-[#007A9E] hover:underline font-semibold flex items-center justify-between pt-1"
            >
              <span>Manage Supply Requisitions</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Mission Event Timeline (Section 8) */}
        <div className="polar-glass p-5 rounded-xl space-y-3 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#007A9E]" />
              <h3 className="font-bold text-[#0F2740] text-xs uppercase tracking-wider">
                Mission Execution Timeline
              </h3>
            </div>
            <span className="text-[10px] text-[#36546D] font-mono">Observe → Act</span>
          </div>

          <div className="space-y-2.5 overflow-y-auto max-h-[300px] pr-1 text-xs">
            {missionTimeline.map((item) => {
              const categoryBadgeMap: Record<string, string> = {
                TELEMETRY: 'bg-cyan-100 text-[#006A8C] border-cyan-300',
                ALERT: 'bg-rose-100 text-rose-800 border-rose-300 font-bold',
                ANALYSIS: 'bg-blue-100 text-blue-800 border-blue-300',
                'HUMAN ACTION': 'bg-emerald-100 text-emerald-800 border-emerald-300',
                'FOLLOW-UP': 'bg-amber-100 text-amber-800 border-amber-300',
              };
              const categoryBadge = categoryBadgeMap[item.category] || 'bg-slate-100 text-[#36546D] border-slate-300';

              return (
                <div key={item.id} className="relative pl-4 border-l-2 border-slate-300 pb-2 last:pb-0">
                  <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-cyan-600" />
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-mono font-bold text-[#08243A] text-[11px]">{item.time} UTC</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold border ${categoryBadge}`}>
                      {item.category}
                    </span>
                  </div>
                  <h4 className="font-bold text-[#0F2740] text-xs leading-snug">{item.title}</h4>
                  <p className="text-[11px] text-[#36546D] mt-0.5 leading-snug">{item.details}</p>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* ============================================================== */}
      {/* 6. EXPLAIN RISK MODAL / DRAWER (Section 5)                     */}
      {/* ============================================================== */}
      {showExplainModal && activeExplainAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="polar-glass border border-white/80 rounded-2xl p-6 max-w-2xl w-full space-y-5 shadow-2xl text-[#0F2740]">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-5 h-5 text-critical-red" />
                <h3 className="text-lg font-bold text-[#0F2740]">
                  Why This Operational Risk Exists (Causal Chain)
                </h3>
              </div>
              <button
                onClick={() => setShowExplainModal(false)}
                className="p-1 rounded-lg hover:bg-slate-200 text-[#36546D] hover:text-[#0F2740] transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-white/90 border border-slate-200 shadow-xs">
                <span className="text-xs text-[#36546D] font-semibold uppercase block mb-1">Incident Headline:</span>
                <p className="font-bold text-[#0F2740] text-sm">{activeExplainAlert.title}</p>
                <p className="text-xs text-[#36546D] mt-1 leading-relaxed">{activeExplainAlert.why}</p>
              </div>

              {/* Deterministic Propagation Sequence */}
              <div className="space-y-2">
                <span className="text-xs text-[#36546D] font-semibold uppercase block">
                  Deterministic Propagation Sequence:
                </span>
                {derived.causalChain.map((step, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-white/90 border border-slate-200 flex items-start gap-3 text-xs shadow-xs">
                    <span className="w-5 h-5 rounded-full bg-cyan-100 text-[#006A8C] border border-cyan-300 font-mono font-bold flex items-center justify-center shrink-0 text-[11px]">
                      {idx + 1}
                    </span>
                    <span className="text-[#36546D] leading-snug pt-0.5">{step}</span>
                  </div>
                ))}
              </div>

              {/* Data Provenance Confirmation */}
              <div className="p-3.5 rounded-xl bg-white/90 border border-slate-200 space-y-2 text-xs shadow-xs">
                <span className="text-[#36546D] font-semibold uppercase block">
                  Verifiable Data Provenance:
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="text-[#36546D]">Public Observation: ECMWF ERA5 & IMD Synoptic</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="text-[#36546D]">Synthetic Telemetry: Station Edge Sensors</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="text-[#36546D]">Derived Calculation: Microgrid & Thermal Equations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="text-[#36546D]">Prototype Forecast: Deterministic Timeline Engine</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-200">
              <button
                onClick={() => setShowExplainModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#36546D] text-xs font-semibold"
              >
                Close
              </button>
              <Link
                href="/simulator"
                onClick={() => setShowExplainModal(false)}
                className="px-4 py-2 rounded-lg bg-[#0F2740] hover:bg-[#1A3D60] text-white text-xs font-bold transition-all shadow-md"
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
