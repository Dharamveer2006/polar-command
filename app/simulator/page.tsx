'use client';

import React, { useState } from 'react';
import { useStation } from '@/context/StationContext';
import GlobalStationStatusRail from '@/components/layout/GlobalStationStatusRail';
import { 
  SlidersHorizontal, 
  Play, 
  ArrowRight, 
  AlertTriangle, 
  ShieldAlert, 
  BatteryCharging, 
  Fuel, 
  Zap, 
  Thermometer, 
  Wind,
  CheckCircle2,
  HelpCircle,
  Clock,
  Layers,
  Activity,
  ArrowDown,
  AlertOctagon,
  Scale
} from 'lucide-react';
import { SimulationInputs, SimulationTimelinePoint } from '@/types';
import ProvenanceBadge from '@/components/common/ProvenanceBadge';

export default function SimulatorPage() {
  const { currentStationId, runSimulation, lastSimulationResult } = useStation();

  // Scenario form parameters
  const [temperatureAdjustmentC, setTemperatureAdjustmentC] = useState<number>(-12);
  const [windAdjustmentKmh, setWindAdjustmentKmh] = useState<number>(35);
  const [generator2Offline, setGenerator2Offline] = useState<boolean>(true);
  const [resupplyDelayDays, setResupplyDelayDays] = useState<number>(8);
  const [selectedTimelinePoint, setSelectedTimelinePoint] = useState<string>('T+24h');

  const handleRun = React.useCallback(() => {
    const inputs: SimulationInputs = {
      stationId: currentStationId,
      temperatureAdjustmentC,
      windAdjustmentKmh,
      generator2Offline,
      resupplyDelayDays,
    };
    runSimulation(inputs);
  }, [currentStationId, temperatureAdjustmentC, windAdjustmentKmh, generator2Offline, resupplyDelayDays, runSimulation]);

  // Run initial simulation on mount
  React.useEffect(() => {
    if (!lastSimulationResult) {
      handleRun();
    }
  }, [lastSimulationResult, handleRun]);

  const res = lastSimulationResult;
  const activePoint = res?.timeline?.find(p => p.timeHorizon === selectedTimelinePoint) || res?.timeline?.[3] || null;
  const isBatteryDepleted = (activePoint && activePoint.batterySoc === 0) || (res && res.simulated.batterySocAfter24h === 0);

  return (
    <div className="flex-1 p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* Global Shared Station Status Rail */}
      <GlobalStationStatusRail />

      {/* Header */}
      <div className="polar-card p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 uppercase font-bold">
              Predictive Decision Support
            </span>
            <ProvenanceBadge source="Prototype Forecast" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight mt-1">
            Timeline-Based What-If Station Stress Simulator
          </h1>
          <p className="text-xs text-slate-300 font-mono">
            Simulate compounded extreme weather, generator trips, and icebreaker resupply delays across T+0h to T+96h timeline horizons.
          </p>
        </div>

        <button
          onClick={handleRun}
          className="px-5 py-2.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-polar-950 font-bold text-xs font-mono flex items-center gap-2 transition-all shadow-lg shadow-cyan-500/20"
        >
          <Play className="w-4 h-4 fill-current" />
          [ RUN SIMULATION ]
        </button>
      </div>

      {/* Simulator Inputs & Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Input Parameter Controls */}
        <div className="polar-card p-5 rounded-xl space-y-5 font-mono text-xs">
          <div className="border-b border-white/10 pb-3 flex items-center justify-between">
            <span className="text-white font-bold uppercase tracking-wider">Scenario Stress Inputs</span>
            <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
          </div>

          {/* Temperature Adjustment */}
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Thermometer className="w-3.5 h-3.5 text-cyan-400" /> Temperature Delta:
              </span>
              <span className="font-bold text-cyan-300">{temperatureAdjustmentC} °C</span>
            </div>
            <input
              type="range"
              min={-30}
              max={5}
              step={1}
              value={temperatureAdjustmentC}
              onChange={(e) => setTemperatureAdjustmentC(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>-30°C (Antarctic Polar Snap)</span>
              <span>0°C (Baseline)</span>
            </div>
          </div>

          {/* Wind Speed Adjustment */}
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Wind className="w-3.5 h-3.5 text-sky-400" /> Katabatic Wind Delta:
              </span>
              <span className="font-bold text-sky-300">+{windAdjustmentKmh} km/h</span>
            </div>
            <input
              type="range"
              min={0}
              max={60}
              step={5}
              value={windAdjustmentKmh}
              onChange={(e) => setWindAdjustmentKmh(Number(e.target.value))}
              className="w-full accent-sky-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>0 km/h (Calm)</span>
              <span>+60 km/h (Severe Katabatic Storm)</span>
            </div>
          </div>

          {/* Generator 2 State */}
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" /> Genset #02 Status:
              </span>
              <span className={`font-bold ${generator2Offline ? 'text-rose-400' : 'text-emerald-400'}`}>
                {generator2Offline ? 'OFFLINE (TRIPPED)' : 'RUNNING (ONLINE)'}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setGenerator2Offline(false)}
                className={`flex-1 py-1.5 rounded border text-[11px] font-bold transition-all ${
                  !generator2Offline 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                    : 'bg-polar-900 text-slate-400 border-polar-border'
                }`}
              >
                ONLINE
              </button>
              <button
                type="button"
                onClick={() => setGenerator2Offline(true)}
                className={`flex-1 py-1.5 rounded border text-[11px] font-bold transition-all ${
                  generator2Offline 
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' 
                    : 'bg-polar-900 text-slate-400 border-polar-border'
                }`}
              >
                TRIP OFFLINE
              </button>
            </div>
          </div>

          {/* Resupply Delay */}
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Fuel className="w-3.5 h-3.5 text-orange-400" /> Sea-Ice Resupply Delay:
              </span>
              <span className="font-bold text-orange-300">+{resupplyDelayDays} Days</span>
            </div>
            <input
              type="range"
              min={0}
              max={30}
              step={2}
              value={resupplyDelayDays}
              onChange={(e) => setResupplyDelayDays(Number(e.target.value))}
              className="w-full accent-orange-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>0 Days (On-Time Docking)</span>
              <span>+30 Days (Severe Pack Ice Lockout)</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 space-y-2">
            <button
              onClick={() => {
                setTemperatureAdjustmentC(0);
                setWindAdjustmentKmh(0);
                setGenerator2Offline(false);
                setResupplyDelayDays(0);
                runSimulation({
                  stationId: currentStationId,
                  temperatureAdjustmentC: 0,
                  windAdjustmentKmh: 0,
                  generator2Offline: false,
                  resupplyDelayDays: 0,
                });
              }}
              className="w-full py-2.5 rounded-lg bg-operational-green hover:bg-operational-green/80 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              [ RUN RECOVERY SIMULATION ]
            </button>

            <button
              onClick={() => {
                setTemperatureAdjustmentC(0);
                setWindAdjustmentKmh(0);
                setGenerator2Offline(false);
                setResupplyDelayDays(0);
              }}
              className="w-full py-1.5 rounded-lg bg-polar-900 hover:bg-polar-800 text-slate-300 hover:text-white border border-polar-border text-xs transition-all font-semibold"
            >
              Reset Inputs to Baseline
            </button>
          </div>
        </div>

        {/* Right 2 Columns: Timeline-Based Simulator Output & Visual Cascade */}
        <div className="lg:col-span-2 space-y-6">
          {res && (
            <>
              {/* Top Result Banner */}
              <div className={`p-4 rounded-xl border font-mono text-xs flex items-center justify-between ${
                res.simulated.overallRisk === 'critical'
                  ? 'bg-rose-950/80 border-rose-500 text-rose-200'
                  : res.simulated.overallRisk === 'warning'
                  ? 'bg-amber-950/80 border-amber-500 text-amber-200'
                  : 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
              }`}>
                <div className="flex items-center gap-3">
                  <ShieldAlert className="w-6 h-6 shrink-0" />
                  <div>
                    <span className="text-[10px] uppercase tracking-wider block opacity-75">
                      Simulated Operational Risk Verdict
                    </span>
                    <span className="text-base font-bold uppercase">
                      {res.simulated.overallRisk} RISK — {res.scenarioName}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded bg-black/40 border border-current font-bold uppercase text-xs">
                    Deficit: {res.simulated.energyDeficitPercent}%
                  </span>
                </div>
              </div>

              {/* Section 6 Requirement: BASELINE vs STRESS vs RECOVERY Matrix */}
              <div className="polar-card p-4 rounded-xl space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-cyan-400" />
                    <span className="font-bold text-white uppercase tracking-wider">
                      BASELINE vs STRESS vs RECOVERY COMPARISON
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">Station Multi-State Evaluation</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px]">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-400">
                        <th className="py-2">METRIC</th>
                        <th className="text-emerald-400">BASELINE</th>
                        <th className="text-rose-400">STRESS (SIMULATED)</th>
                        <th className="text-cyan-300">RECOVERY (ACTIONS)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      <tr>
                        <td className="py-2 font-bold text-white">Power Balance</td>
                        <td className="text-emerald-400">Equilibrium (0 kW Deficit)</td>
                        <td className={res.simulated.energyDeficitPercent > 0 ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                          {res.simulated.energyDeficitPercent > 0 ? `-${Math.max(30, Math.abs(res.simulated.netPowerKw))} kW Deficit` : 'Equilibrium'}
                        </td>
                        <td className="text-cyan-300 font-semibold">+25 kW Spinning Reserve</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-bold text-white">Battery Reserve</td>
                        <td className="text-emerald-400">85% SOC (Nominal Float)</td>
                        <td className={res.simulated.batterySocAfter24h < 40 ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                          {res.simulated.batterySocAfter24h}% SOC
                        </td>
                        <td className="text-cyan-300 font-semibold">78% SOC (Stabilized)</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-bold text-white">Fuel Runway</td>
                        <td className="text-emerald-400">20.4 Days</td>
                        <td className={res.simulated.fuelRunwayDays < 14 ? 'text-amber-300 font-bold' : 'text-slate-300'}>
                          {res.simulated.fuelRunwayDays} Days
                        </td>
                        <td className="text-cyan-300 font-semibold">{Math.min(24, res.simulated.fuelRunwayDays + 6)} Days (Conserved)</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-bold text-white">Inventory Safety</td>
                        <td className="text-emerald-400">45 Days Buffer</td>
                        <td className={res.simulated.criticalInventoryDays < 14 ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                          {res.simulated.criticalInventoryDays} Days Buffer
                        </td>
                        <td className="text-cyan-300 font-semibold">{res.simulated.criticalInventoryDays + 14} Days (Rationed)</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-bold text-white">Operational Risk</td>
                        <td>
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 uppercase">
                            NOMINAL
                          </span>
                        </td>
                        <td>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                            res.simulated.overallRisk === 'critical' ? 'bg-rose-500 text-white' :
                            res.simulated.overallRisk === 'warning' ? 'bg-amber-500 text-polar-950' : 'bg-emerald-500/20 text-emerald-300'
                          }`}>
                            {res.simulated.overallRisk}
                          </span>
                        </td>
                        <td>
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-cyan-500/20 text-cyan-300 uppercase">
                            WATCH / RECOVERING
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 6 Requirement: Explainable Battery Depletion Callout */}
              {isBatteryDepleted && (
                <div className="p-4 rounded-xl bg-red-950/90 border-2 border-red-500 font-mono text-xs text-red-100 shadow-xl space-y-2">
                  <div className="flex items-center gap-2 text-red-400 font-bold text-sm uppercase">
                    <AlertOctagon className="w-5 h-5" />
                    <span>BATTERY DEPLETED</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-[11px]">
                    <div className="bg-black/40 p-2.5 rounded border border-red-500/30">
                      <span className="text-slate-400 uppercase text-[10px] block font-bold">Cause:</span>
                      <span className="text-white">
                        {generator2Offline 
                          ? 'Continuous microgrid power deficit of 190 kW following Generator #02 trip without shedding non-essential load.' 
                          : 'Severe Antarctic cold snap thermodynamic demand exceeds total microgrid generation capacity.'}
                      </span>
                    </div>
                    <div className="bg-black/40 p-2.5 rounded border border-red-500/30">
                      <span className="text-slate-400 uppercase text-[10px] block font-bold">Duration:</span>
                      <span className="text-white">
                        BESS storage fully exhausted at {selectedTimelinePoint}; blackout condition active until emergency diesel start.
                      </span>
                    </div>
                    <div className="bg-black/40 p-2.5 rounded border border-red-500/30">
                      <span className="text-slate-400 uppercase text-[10px] block font-bold">Power Deficit:</span>
                      <span className="text-red-300 font-bold text-sm block mt-0.5">
                        -{Math.max(45, Math.abs(res.simulated.netPowerKw))} kW Unserved
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* PHASE 4: TIMELINE CARDS (T+0h to T+96h)                         */}
              {/* ============================================================== */}
              <div className="polar-card p-4 rounded-xl space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    <span className="font-bold text-white uppercase tracking-wider">
                      Simulation Horizons: T+0h → T+96h Progression
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">Click horizon to inspect point</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                  {res.timeline?.map((point: SimulationTimelinePoint) => {
                    const isSelected = selectedTimelinePoint === point.timeHorizon;
                    const isCrit = point.riskState === 'critical';
                    const isWarn = point.riskState === 'warning';

                    return (
                      <button
                        key={point.timeHorizon}
                        onClick={() => setSelectedTimelinePoint(point.timeHorizon)}
                        className={`p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all ${
                          isSelected
                            ? 'bg-polar-800 border-cyan-400 ring-1 ring-cyan-400/50'
                            : isCrit
                            ? 'bg-rose-950/40 border-rose-800/60 hover:border-rose-500'
                            : isWarn
                            ? 'bg-amber-950/40 border-amber-800/60 hover:border-amber-500'
                            : 'bg-polar-950 border-polar-border hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-xs">{point.timeHorizon}</span>
                          <span className={`w-2 h-2 rounded-full ${
                            isCrit ? 'bg-rose-500' : isWarn ? 'bg-amber-500' : 'bg-emerald-500'
                          }`} />
                        </div>
                        <div className="mt-2 space-y-1 text-[10px]">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Demand:</span>
                            <span className="text-cyan-300 font-bold">{point.energyDemandKw}kW</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">SOC:</span>
                            <span className={point.batterySoc < 40 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                              {point.batterySoc}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Fuel:</span>
                            <span className={point.fuelRunwayDays < 15 ? 'text-rose-400 font-bold' : 'text-slate-200'}>
                              {point.fuelRunwayDays}d
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Active Point Detail Pill */}
                {activePoint && (
                  <div className="mt-3 p-3 rounded-lg bg-polar-900 border border-polar-border grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase">Demand / Capacity</span>
                      <div className="text-sm font-bold text-white mt-0.5">
                        {activePoint.energyDemandKw} kW / {activePoint.generationKw} kW
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase">Power Balance</span>
                      <div className={`text-sm font-bold mt-0.5 ${
                        activePoint.powerDeficitKw > 0 ? 'text-rose-400' : 'text-emerald-400'
                      }`}>
                        {activePoint.powerDeficitKw > 0 ? `-${activePoint.powerDeficitKw} kW Deficit` : 'Equilibrium'}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase">Battery Reserve</span>
                      <div className={`text-sm font-bold mt-0.5 ${
                        activePoint.batterySoc < 40 ? 'text-rose-400' : 'text-emerald-400'
                      }`}>
                        {activePoint.batterySoc}% SOC
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase">Critical Inventory</span>
                      <div className="text-sm font-bold text-amber-300 mt-0.5">
                        {activePoint.criticalInventoryDays} Days Buffer
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ============================================================== */}
              {/* PHASE 4: VISUAL CASCADE (Weather → HVAC → Energy → ...)        */}
              {/* ============================================================== */}
              <div className="polar-card p-5 rounded-xl space-y-4 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-rose-400" />
                    <span className="font-bold text-white uppercase tracking-wider">
                      Physical Visual Cascade Flow
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">Environment ↔ Energy ↔ Infra ↔ Logistics</span>
                </div>

                <div className="space-y-2">
                  {[
                    { step: 'Weather Stress', domain: 'Environment', desc: `Ambient offset ${temperatureAdjustmentC}°C, Wind +${windAdjustmentKmh} km/h`, color: 'border-cyan-500/40 text-cyan-300 bg-cyan-950/30' },
                    { step: 'HVAC Thermal Load Surge', domain: 'HVAC Infrastructure', desc: 'Thermodynamic building loss escalates electrical heating draw', color: 'border-sky-500/40 text-sky-300 bg-sky-950/30' },
                    { step: 'Station Energy Demand Jump', domain: 'Microgrid Energy', desc: `Total station electrical demand climbs to ${res.simulated.energyDemandKw} kW`, color: 'border-amber-500/40 text-amber-300 bg-amber-950/30' },
                    { step: 'Power Deficit & Battery Drain', domain: 'Microgrid & BESS', desc: generator2Offline ? 'Genset #2 trip exposes station microgrid deficit; battery discharge begins' : 'Gensets support demand; fuel burn accelerates', color: 'border-rose-500/40 text-rose-300 bg-rose-950/30' },
                    { step: 'Battery Depletion & Fuel Consumption', domain: 'Energy Storage', desc: `Battery drains toward ${res.simulated.batterySocAfter24h}% SOC; daily fuel burn accelerates`, color: 'border-orange-500/40 text-orange-300 bg-orange-950/30' },
                    { step: 'Logistics Runway Contraction', domain: 'Logistics Supply', desc: `Fuel autonomy drops to ${res.simulated.fuelRunwayDays} days vs ${res.simulated.criticalInventoryDays}d resupply window`, color: 'border-red-500/40 text-red-300 bg-red-950/40' },
                  ].map((cascade, idx) => (
                    <div key={idx} className="relative">
                      <div className={`p-3 rounded-lg border flex items-start gap-3 ${cascade.color}`}>
                        <span className="w-5 h-5 rounded-full bg-black/50 border border-current flex items-center justify-center text-[10px] font-bold shrink-0">
                          {idx + 1}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white text-xs">{cascade.step}</span>
                            <span className="text-[10px] uppercase opacity-75">{cascade.domain}</span>
                          </div>
                          <p className="text-[11px] opacity-90 mt-0.5">{cascade.desc}</p>
                        </div>
                      </div>
                      {idx < 5 && (
                        <div className="flex justify-center my-0.5">
                          <ArrowDown className="w-3.5 h-3.5 text-slate-600" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* ============================================================== */}
              {/* PHASE 4: "WHY DID THIS HAPPEN?" EXPLANATION                    */}
              {/* ============================================================== */}
              <div className="polar-card p-5 rounded-xl space-y-3 font-mono text-xs border border-cyan-800/40">
                <div className="flex items-center gap-2 border-b border-white/10 pb-2.5">
                  <HelpCircle className="w-4 h-4 text-cyan-400" />
                  <span className="font-bold text-white uppercase tracking-wider">
                    Why Did This Happen? (Coupled Physical Explanation)
                  </span>
                </div>
                <p className="text-slate-200 text-xs leading-relaxed font-sans">
                  {res.whyDidThisHappen}
                </p>
                <div className="p-4 rounded-xl bg-polar-900 border border-polar-border text-xs text-slate-300 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-polar-cyan uppercase text-xs">Recommended Mitigating Stance</span>
                    <button
                      onClick={() => {
                        setTemperatureAdjustmentC(0);
                        setWindAdjustmentKmh(0);
                        setGenerator2Offline(false);
                        setResupplyDelayDays(0);
                        runSimulation({
                          stationId: currentStationId,
                          temperatureAdjustmentC: 0,
                          windAdjustmentKmh: 0,
                          generator2Offline: false,
                          resupplyDelayDays: 0,
                        });
                      }}
                      className="px-3 py-1 rounded-md bg-operational-green hover:bg-operational-green/80 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      [ EXECUTE RECOVERY ACTION ]
                    </button>
                  </div>
                  <p className="text-white font-medium text-xs leading-relaxed">
                    {res.recommendedResponse[0] || 'Prioritize cold-reserve backup generator start and load shedding.'}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
