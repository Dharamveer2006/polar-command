'use client';

import React, { useState } from 'react';
import { useStation } from '@/context/StationContext';
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
  ArrowDown
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

  return (
    <div className="flex-1 p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="polar-card p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-100/90 text-cyan-900 border border-cyan-300 uppercase font-bold">
              Predictive Decision Support
            </span>
            <ProvenanceBadge source="Prototype Forecast" />
          </div>
          <h1 className="text-xl font-bold text-[#0F2740] tracking-tight mt-1">
            Timeline-Based What-If Station Stress Simulator
          </h1>
          <p className="text-xs text-[#36546D] font-mono">
            Simulate compounded extreme weather, generator trips, and icebreaker resupply delays across T+0h to T+96h timeline horizons.
          </p>
        </div>

        <button
          onClick={handleRun}
          className="px-5 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs font-mono flex items-center gap-2 transition-all shadow-md"
        >
          <Play className="w-4 h-4 fill-current" />
          [ RUN SIMULATION ]
        </button>
      </div>

      {/* Simulator Inputs & Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Input Parameter Controls */}
        <div className="polar-card p-5 rounded-xl space-y-5 font-mono text-xs">
          <div className="border-b border-slate-200/80 pb-3 flex items-center justify-between">
            <span className="text-[#0F2740] font-bold uppercase tracking-wider">Scenario Stress Inputs</span>
            <SlidersHorizontal className="w-4 h-4 text-cyan-600" />
          </div>

          {/* Temperature Adjustment */}
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-[#36546D] flex items-center gap-1.5 font-semibold">
                <Thermometer className="w-3.5 h-3.5 text-cyan-600" /> Temperature Delta:
              </span>
              <span className="font-bold text-cyan-900">{temperatureAdjustmentC} °C</span>
            </div>
            <input
              type="range"
              min={-30}
              max={5}
              step={1}
              value={temperatureAdjustmentC}
              onChange={(e) => setTemperatureAdjustmentC(Number(e.target.value))}
              className="w-full accent-cyan-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#4B6B88] font-medium">
              <span>-30°C (Antarctic Polar Snap)</span>
              <span>0°C (Baseline)</span>
            </div>
          </div>

          {/* Wind Speed Adjustment */}
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-[#36546D] flex items-center gap-1.5 font-semibold">
                <Wind className="w-3.5 h-3.5 text-sky-600" /> Katabatic Wind Delta:
              </span>
              <span className="font-bold text-sky-900">+{windAdjustmentKmh} km/h</span>
            </div>
            <input
              type="range"
              min={0}
              max={60}
              step={5}
              value={windAdjustmentKmh}
              onChange={(e) => setWindAdjustmentKmh(Number(e.target.value))}
              className="w-full accent-sky-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#4B6B88] font-medium">
              <span>0 km/h (Calm)</span>
              <span>+60 km/h (Severe Katabatic Storm)</span>
            </div>
          </div>

          {/* Generator 2 State */}
          <div className="p-3.5 rounded-lg bg-polar-900 border border-polar-border space-y-2">
            <span className="text-slate-200 flex items-center gap-1.5 font-semibold">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> Genset #2 (Primary 220kW Unit)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setGenerator2Offline(false)}
                className={`py-1.5 rounded transition-colors ${
                  !generator2Offline ? 'bg-emerald-600 text-white font-bold' : 'bg-polar-950 text-slate-400'
                }`}
              >
                ONLINE
              </button>
              <button
                type="button"
                onClick={() => setGenerator2Offline(true)}
                className={`py-1.5 rounded transition-colors ${
                  generator2Offline ? 'bg-rose-600 text-white font-bold' : 'bg-polar-950 text-slate-400'
                }`}
              >
                TRIPPED (OFFLINE)
              </button>
            </div>
          </div>

          {/* Resupply Delay */}
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-[#36546D] flex items-center gap-1.5 font-semibold">
                <Fuel className="w-3.5 h-3.5 text-purple-600" /> Resupply Ship Delay:
              </span>
              <span className="font-bold text-purple-900">+{resupplyDelayDays} Days</span>
            </div>
            <input
              type="range"
              min={0}
              max={25}
              step={1}
              value={resupplyDelayDays}
              onChange={(e) => setResupplyDelayDays(Number(e.target.value))}
              className="w-full accent-purple-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#4B6B88] font-medium">
              <span>On Schedule (0d)</span>
              <span>+25 Days (Pack-Ice Blockade)</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200/80 space-y-2">
            <button
              onClick={handleRun}
              className="w-full py-2.5 rounded-lg bg-polar-blue hover:bg-polar-blue/80 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              [ RE-EVALUATE SIMULATION ]
            </button>

            {/* Section 36 Step 7: Run Recovery Simulation */}
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
                  ? 'bg-rose-900 border-rose-600 text-white shadow-md'
                  : res.simulated.overallRisk === 'warning'
                  ? 'bg-amber-900 border-amber-600 text-white shadow-md'
                  : 'bg-emerald-900 border-emerald-600 text-white shadow-md'
              }`}>
                <div className="flex items-center gap-3">
                  <ShieldAlert className="w-6 h-6 shrink-0" />
                  <div>
                    <span className="text-[10px] uppercase tracking-wider block opacity-90 text-white/80">
                      Simulated Operational Risk Verdict
                    </span>
                    <span className="text-base font-bold uppercase text-white">
                      {res.simulated.overallRisk} RISK — {res.scenarioName}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded bg-black/40 border border-white/40 font-bold uppercase text-xs text-white">
                    Deficit: {res.simulated.energyDeficitPercent}%
                  </span>
                </div>
              </div>

              {/* ============================================================== */}
              {/* PHASE 4: TIMELINE CARDS (T+0h to T+96h)                         */}
              {/* ============================================================== */}
              <div className="polar-card p-4 rounded-xl space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-cyan-600" />
                    <span className="font-bold text-[#0F2740] uppercase tracking-wider">
                      Simulation Horizons: T+0h → T+96h Progression
                    </span>
                  </div>
                  <span className="text-[10px] text-[#36546D] font-medium">Click horizon to inspect point</span>
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
                            ? 'bg-[#0B192C] border-cyan-400 ring-2 ring-cyan-400/50 shadow-md'
                            : isCrit
                            ? 'bg-rose-50/95 border-rose-300 hover:border-rose-400 shadow-sm'
                            : isWarn
                            ? 'bg-amber-50/95 border-amber-300 hover:border-amber-400 shadow-sm'
                            : 'bg-white/85 border-slate-200 hover:border-cyan-400 shadow-sm'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`font-bold text-xs ${
                            isSelected
                              ? 'text-white'
                              : isCrit
                              ? 'text-rose-950'
                              : isWarn
                              ? 'text-amber-950'
                              : 'text-[#0F2740]'
                          }`}>
                            {point.timeHorizon}
                          </span>
                          <span className={`w-2 h-2 rounded-full ${
                            isCrit ? 'bg-rose-600' : isWarn ? 'bg-amber-600' : 'bg-emerald-600'
                          }`} />
                        </div>
                        <div className="mt-2 space-y-1 text-[10px]">
                          <div className="flex justify-between">
                            <span className={isSelected ? 'text-slate-300' : 'text-[#36546D] font-medium'}>Demand:</span>
                            <span className={isSelected ? 'text-cyan-300 font-bold' : 'text-[#08243A] font-bold'}>
                              {point.energyDemandKw}kW
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className={isSelected ? 'text-slate-300' : 'text-[#36546D] font-medium'}>SOC:</span>
                            <span className={`font-bold ${
                              isSelected
                                ? (point.batterySoc < 40 ? 'text-rose-400' : 'text-emerald-400')
                                : (point.batterySoc < 40 ? 'text-rose-700' : 'text-emerald-700')
                            }`}>
                              {point.batterySoc}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className={isSelected ? 'text-slate-300' : 'text-[#36546D] font-medium'}>Fuel:</span>
                            <span className={`font-bold ${
                              isSelected
                                ? (point.fuelRunwayDays < 15 ? 'text-rose-400' : 'text-slate-200')
                                : (point.fuelRunwayDays < 15 ? 'text-rose-700' : 'text-[#08243A]')
                            }`}>
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
                      <span className="text-[10px] text-slate-300 uppercase font-semibold">Demand / Capacity</span>
                      <div className="text-sm font-bold text-white mt-0.5">
                        {activePoint.energyDemandKw} kW / {activePoint.generationKw} kW
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-300 uppercase font-semibold">Power Balance</span>
                      <div className={`text-sm font-bold mt-0.5 ${
                        activePoint.powerDeficitKw > 0 ? 'text-rose-400' : 'text-emerald-400'
                      }`}>
                        {activePoint.powerDeficitKw > 0 ? `-${activePoint.powerDeficitKw} kW Deficit` : 'Equilibrium'}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-300 uppercase font-semibold">Battery Reserve</span>
                      <div className={`text-sm font-bold mt-0.5 ${
                        activePoint.batterySoc < 40 ? 'text-rose-400' : 'text-emerald-400'
                      }`}>
                        {activePoint.batterySoc}% SOC
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-300 uppercase font-semibold">Critical Inventory</span>
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
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-rose-600" />
                    <span className="font-bold text-[#0F2740] uppercase tracking-wider">
                      Physical Visual Cascade Flow
                    </span>
                  </div>
                  <span className="text-[10px] text-[#36546D] font-medium">Environment ↔ Energy ↔ Infra ↔ Logistics</span>
                </div>

                <div className="space-y-2">
                  {[
                    { 
                      step: 'Weather Stress', 
                      domain: 'Environment', 
                      desc: `Ambient offset ${temperatureAdjustmentC}°C, Wind +${windAdjustmentKmh} km/h`, 
                      cardBg: 'bg-cyan-50/90 border-cyan-300 text-cyan-950',
                      badge: 'bg-cyan-100 text-cyan-800 border-cyan-300',
                      descColor: 'text-[#08243A]',
                      pillBg: 'bg-cyan-700 text-white'
                    },
                    { 
                      step: 'HVAC Thermal Load Surge', 
                      domain: 'HVAC Infrastructure', 
                      desc: 'Thermodynamic building loss escalates electrical heating draw', 
                      cardBg: 'bg-sky-50/90 border-sky-300 text-sky-950',
                      badge: 'bg-sky-100 text-sky-800 border-sky-300',
                      descColor: 'text-[#08243A]',
                      pillBg: 'bg-sky-700 text-white'
                    },
                    { 
                      step: 'Station Energy Demand Jump', 
                      domain: 'Microgrid Energy', 
                      desc: `Total station electrical demand climbs to ${res.simulated.energyDemandKw} kW`, 
                      cardBg: 'bg-amber-50/95 border-amber-300 text-amber-950',
                      badge: 'bg-amber-100 text-amber-900 border-amber-300',
                      descColor: 'text-[#78350F]',
                      pillBg: 'bg-amber-600 text-white'
                    },
                    { 
                      step: 'Power Deficit & Battery Drain', 
                      domain: 'Microgrid & BESS', 
                      desc: generator2Offline ? 'Genset #2 trip exposes station microgrid deficit; battery discharge begins' : 'Gensets support demand; fuel burn accelerates', 
                      cardBg: 'bg-rose-50/95 border-rose-300 text-rose-950',
                      badge: 'bg-rose-100 text-rose-900 border-rose-300',
                      descColor: 'text-[#9F1239]',
                      pillBg: 'bg-rose-600 text-white'
                    },
                    { 
                      step: 'Battery Depletion & Fuel Consumption', 
                      domain: 'Energy Storage', 
                      desc: `Battery drains toward ${res.simulated.batterySocAfter24h}% SOC; daily fuel burn accelerates`, 
                      cardBg: 'bg-orange-50/95 border-orange-300 text-orange-950',
                      badge: 'bg-orange-100 text-orange-900 border-orange-300',
                      descColor: 'text-[#9A3412]',
                      pillBg: 'bg-orange-600 text-white'
                    },
                    { 
                      step: 'Logistics Runway Contraction', 
                      domain: 'Logistics Supply', 
                      desc: `Fuel autonomy drops to ${res.simulated.fuelRunwayDays} days vs ${res.simulated.criticalInventoryDays}d resupply window`, 
                      cardBg: 'bg-red-50/95 border-red-300 text-red-950',
                      badge: 'bg-red-100 text-red-900 border-red-300',
                      descColor: 'text-[#991B1B]',
                      pillBg: 'bg-red-700 text-white'
                    },
                  ].map((cascade, idx) => (
                    <div key={idx} className="relative">
                      <div className={`p-3.5 rounded-xl border shadow-sm flex items-start gap-3 transition-all ${cascade.cardBg}`}>
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 shadow-sm ${cascade.pillBg}`}>
                          {idx + 1}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#0F2740] text-xs">{cascade.step}</span>
                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${cascade.badge}`}>{cascade.domain}</span>
                          </div>
                          <p className={`text-[11px] font-mono mt-1 font-medium leading-relaxed ${cascade.descColor}`}>{cascade.desc}</p>
                        </div>
                      </div>
                      {idx < 5 && (
                        <div className="flex justify-center my-1">
                          <ArrowDown className="w-4 h-4 text-[#36546D]" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* ============================================================== */}
              {/* PHASE 4: "WHY DID THIS HAPPEN?" EXPLANATION                    */}
              {/* ============================================================== */}
              <div className="polar-card p-5 rounded-xl space-y-3 font-mono text-xs border border-cyan-300/80 shadow-md">
                <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2.5">
                  <HelpCircle className="w-4 h-4 text-cyan-600" />
                  <span className="font-bold text-[#0F2740] uppercase tracking-wider text-xs">
                    Why Did This Happen? (Coupled Physical Explanation)
                  </span>
                </div>
                <p className="text-[#0F2740] text-xs leading-relaxed font-sans font-medium">
                  {res.whyDidThisHappen}
                </p>
                <div className="p-4 rounded-xl bg-polar-900 border border-polar-border text-xs text-slate-200 space-y-2">
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
                      className="px-3.5 py-1.5 rounded-md bg-operational-green hover:bg-operational-green/90 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm"
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
