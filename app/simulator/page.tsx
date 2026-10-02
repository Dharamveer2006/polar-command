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
  Sparkles
} from 'lucide-react';
import { SimulationInputs } from '@/types';

export default function SimulatorPage() {
  const { currentStationId, runSimulation, lastSimulationResult } = useStation();

  // Scenario form parameters
  const [temperatureAdjustmentC, setTemperatureAdjustmentC] = useState<number>(-10);
  const [windAdjustmentKmh, setWindAdjustmentKmh] = useState<number>(25);
  const [generator2Offline, setGenerator2Offline] = useState<boolean>(true);
  const [resupplyDelayDays, setResupplyDelayDays] = useState<number>(6);

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

  // If no simulation run yet, run default on mount
  React.useEffect(() => {
    if (!lastSimulationResult) {
      handleRun();
    }
  }, [lastSimulationResult, handleRun]);

  const res = lastSimulationResult;

  return (
    <div className="flex-1 p-4 md:p-6 space-y-5 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="polar-card p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-400/30 uppercase">
              Operational Decision Support
            </span>
            <span className="text-xs font-mono text-slate-400">What-If Multi-Domain Simulator</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight mt-1">
            Station Failure & Weather Stress Simulator
          </h1>
          <p className="text-xs text-slate-300 font-mono">
            Test generator trips, extreme cold snaps, and resupply vessel delays before committing operational interventions.
          </p>
        </div>

        <button
          onClick={handleRun}
          className="px-5 py-2.5 rounded-lg bg-polar-accent hover:bg-sky-400 text-polar-950 font-bold text-xs font-mono flex items-center gap-2 transition-all shadow-lg shadow-sky-500/20"
        >
          <Play className="w-4 h-4 fill-current" />
          [ RUN SIMULATION ]
        </button>
      </div>

      {/* Simulator Inputs & Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column: Input Parameter Controls */}
        <div className="polar-card p-5 rounded-xl space-y-4 font-mono text-xs">
          <div className="border-b border-white/10 pb-3 flex items-center justify-between">
            <span className="text-white font-bold uppercase tracking-wider">Scenario Stress Inputs</span>
            <SlidersHorizontal className="w-4 h-4 text-polar-ice" />
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
              <span>-30°C (Extreme Polar Snap)</span>
              <span>0°C (Nominal)</span>
            </div>
          </div>

          {/* Wind Speed Adjustment */}
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Wind className="w-3.5 h-3.5 text-sky-400" /> Wind Speed Delta:
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
              <span>+60 km/h (Blizzard Gusts)</span>
            </div>
          </div>

          {/* Generator 2 State */}
          <div className="p-3 rounded-lg bg-polar-900 border border-polar-border space-y-2">
            <span className="text-slate-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> Generator #2 (220kW CAT Genset)
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
                OFFLINE (TRIP)
              </button>
            </div>
          </div>

          {/* Resupply Delay */}
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Fuel className="w-3.5 h-3.5 text-purple-400" /> Resupply Delay:
              </span>
              <span className="font-bold text-purple-300">+{resupplyDelayDays} Days</span>
            </div>
            <input
              type="range"
              min={0}
              max={25}
              step={1}
              value={resupplyDelayDays}
              onChange={(e) => setResupplyDelayDays(Number(e.target.value))}
              className="w-full accent-purple-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>On Schedule (0d)</span>
              <span>+25 Days (Pack-Ice Blockade)</span>
            </div>
          </div>

          <div className="pt-3 border-t border-white/10">
            <button
              onClick={handleRun}
              className="w-full py-2 rounded bg-polar-800 hover:bg-polar-700 text-white font-bold border border-polar-border transition-all"
            >
              Re-Calculate Simulation
            </button>
          </div>
        </div>

        {/* Right 2 Columns: Baseline vs Simulation Impact Tree */}
        <div className="lg:col-span-2 space-y-4">
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
                <span className="px-3 py-1 rounded bg-black/40 border border-current font-bold uppercase text-xs">
                  Deficit: {res.simulated.energyDeficitPercent}%
                </span>
              </div>

              {/* Baseline vs Simulated Comparison Tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                {/* Station Demand */}
                <div className="polar-card p-3 rounded-lg">
                  <span className="text-slate-400 text-[10px] uppercase block">Station Demand</span>
                  <div className="text-lg font-bold text-white mt-1">
                    {res.simulated.energyDemandKw} kW
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Baseline: {res.baseline.energyDemandKw} kW ({res.simulated.energyDemandKw > res.baseline.energyDemandKw ? `+${res.simulated.energyDemandKw - res.baseline.energyDemandKw}kW` : '0kW'})
                  </div>
                </div>

                {/* Battery after 24h */}
                <div className="polar-card p-3 rounded-lg">
                  <span className="text-slate-400 text-[10px] uppercase block">Battery After 24h</span>
                  <div className={`text-lg font-bold mt-1 ${
                    res.simulated.batterySocAfter24h < 40 ? 'text-rose-400' : 'text-emerald-400'
                  }`}>
                    {res.simulated.batterySocAfter24h}%
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Baseline: {res.baseline.batterySocAfter24h}%
                  </div>
                </div>

                {/* Fuel Runway */}
                <div className="polar-card p-3 rounded-lg">
                  <span className="text-slate-400 text-[10px] uppercase block">Fuel Runway</span>
                  <div className={`text-lg font-bold mt-1 ${
                    res.simulated.fuelRunwayDays < 14 ? 'text-rose-400' : 'text-amber-300'
                  }`}>
                    {res.simulated.fuelRunwayDays} Days
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Baseline: {res.baseline.fuelRunwayDays}d ({Number((res.simulated.fuelRunwayDays - res.baseline.fuelRunwayDays).toFixed(1))}d)
                  </div>
                </div>

                {/* Resupply Buffer */}
                <div className="polar-card p-3 rounded-lg">
                  <span className="text-slate-400 text-[10px] uppercase block">Critical Inventory</span>
                  <div className="text-lg font-bold text-amber-300 mt-1">
                    {res.simulated.criticalInventoryDays} Days
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Baseline: {res.baseline.criticalInventoryDays}d
                  </div>
                </div>
              </div>

              {/* Causal Chain Tree */}
              <div className="polar-card p-4 rounded-xl space-y-2">
                <span className="text-xs font-mono font-bold text-white uppercase tracking-wider block">
                  Connected Cross-Domain Causal Chain
                </span>
                <div className="space-y-1.5 font-mono text-xs">
                  {res.causalChain.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 rounded bg-polar-900 border border-white/5 text-slate-200">
                      <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 flex items-center justify-center text-[10px] font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Response Playbook */}
              <div className="polar-card p-4 rounded-xl space-y-2">
                <span className="text-xs font-mono font-bold text-sky-300 uppercase tracking-wider block">
                  Autonomous Decision Support & Playbook
                </span>
                <div className="space-y-1.5 font-mono text-xs">
                  {res.recommendedResponse.map((action, idx) => (
                    <div key={idx} className="p-2 rounded bg-sky-950/40 border border-sky-500/30 text-sky-200 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                      <span>{action}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
