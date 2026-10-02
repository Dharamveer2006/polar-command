'use client';

import React from 'react';
import { useStation } from '@/context/StationContext';
import { 
  Zap, 
  BatteryCharging, 
  Fuel, 
  Flame, 
  Gauge, 
  AlertCircle, 
  CheckCircle2, 
  Thermometer, 
  Activity,
  Cpu
} from 'lucide-react';
import TelemetryChart from '@/components/charts/TelemetryChart';

export default function EnergyPage() {
  const { stationState } = useStation();
  const { energy, metadata } = stationState;

  const netPower = energy.generationKw - energy.demandKw;
  const isDeficit = netPower < 0;

  return (
    <div className="flex-1 p-4 md:p-6 space-y-5 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="polar-card p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30 uppercase">
              Domain 2: Power & Microgrid
            </span>
            <span className="text-xs font-mono text-slate-400">{metadata.name}</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight mt-1">
            Station Energy Generation, Battery Bank & Fuel Runway
          </h1>
          <p className="text-xs text-slate-300 font-mono">
            Autonomous cogeneration load balancing, diesel genset telemetry, battery buffer discharge, and reserve autonomy.
          </p>
        </div>

        {/* Net Power Badge */}
        <div className={`p-3 rounded-lg border font-mono text-xs flex items-center gap-3 ${
          isDeficit 
            ? 'bg-rose-950/80 border-rose-500 text-rose-200' 
            : 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
        }`}>
          <Zap className={`w-5 h-5 ${isDeficit ? 'text-rose-400 animate-bounce' : 'text-emerald-400'}`} />
          <div>
            <span className="text-[10px] uppercase block text-slate-400">Station Net Power</span>
            <span className="text-sm font-bold">
              {netPower >= 0 ? `+${netPower} kW Surplus` : `${netPower} kW DEFICIT`}
            </span>
          </div>
        </div>
      </div>

      {/* 4 Core Energy KPI Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Generation */}
        <div className="polar-card p-4 rounded-xl">
          <div className="flex justify-between items-center text-xs font-mono text-slate-400">
            <span>ACTIVE GENERATION</span>
            <Zap className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-3xl font-mono font-bold text-white">
            {energy.generationKw} <span className="text-lg font-normal text-cyan-300">kW</span>
          </div>
          <div className="mt-2 text-xs font-mono text-slate-400">
            {energy.generators.filter(g => g.status === 'running').length} of {energy.generators.length} gensets online
          </div>
        </div>

        {/* Total Demand */}
        <div className="polar-card p-4 rounded-xl">
          <div className="flex justify-between items-center text-xs font-mono text-slate-400">
            <span>TOTAL LOAD DEMAND</span>
            <Cpu className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-3xl font-mono font-bold text-white">
            {energy.demandKw} <span className="text-lg font-normal text-amber-300">kW</span>
          </div>
          <div className="mt-2 text-xs font-mono text-slate-400 flex justify-between">
            <span>Base: {energy.baseLoadKw}kW</span>
            <span className="text-amber-300">Heating: {energy.heatingLoadKw}kW</span>
          </div>
        </div>

        {/* Battery SOC */}
        <div className="polar-card p-4 rounded-xl">
          <div className="flex justify-between items-center text-xs font-mono text-slate-400">
            <span>BATTERY STORAGE (BESS)</span>
            <BatteryCharging className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-3xl font-mono font-bold text-white">
            {energy.batterySoc}% <span className="text-lg font-normal text-emerald-300">SOC</span>
          </div>
          <div className="mt-2 text-xs font-mono text-slate-400 flex justify-between">
            <span>Capacity: {energy.batteryCapacityKwh} kWh</span>
            <span className="text-emerald-400">{energy.batteryRunwayHours}h buffer</span>
          </div>
        </div>

        {/* Fuel Runway */}
        <div className="polar-card p-4 rounded-xl">
          <div className="flex justify-between items-center text-xs font-mono text-slate-400">
            <span>POLAR FUEL RUNWAY</span>
            <Fuel className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 text-3xl font-mono font-bold text-white">
            {energy.fuelRunwayDays} <span className="text-lg font-normal text-purple-300">Days</span>
          </div>
          <div className="mt-2 text-xs font-mono text-slate-400 flex justify-between">
            <span>Stock: {energy.fuelLitres.toLocaleString()} L</span>
            <span className="text-slate-300">{energy.averageFuelBurnLitresPerDay} L/day</span>
          </div>
        </div>
      </div>

      {/* 24-Hour Microgrid Dispatch & Demand Profile */}
      <div className="polar-card p-5 rounded-xl space-y-3">
        <TelemetryChart
          title="24-Hour Microgrid Power Dispatch vs Station Demand Profile"
          data={Array.from({ length: 12 }).map((_, i) => {
            const hour = `${(i * 2).toString().padStart(2, '0')}:00`;
            const demandVariation = Math.sin(i * 0.6) * 18;
            return {
              time: hour,
              generation: energy.generationKw,
              totalDemand: Math.round(energy.demandKw + demandVariation),
              heatingDemand: Math.round(energy.heatingLoadKw + demandVariation * 0.7),
            };
          })}
          series={[
            { key: 'generation', label: 'Generation Capacity (kW)', color: '#10b981' },
            { key: 'totalDemand', label: 'Total Demand (kW)', color: '#00f0ff' },
            { key: 'heatingDemand', label: 'HVAC Heating Demand (kW)', color: '#f59e0b' },
          ]}
          height={240}
        />
      </div>

      {/* Generators Fleet Table */}
      <div className="polar-card p-5 rounded-xl space-y-3">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
            Station Generator & Cogeneration Units Telemetry
          </h2>
          <span className="text-xs font-mono text-slate-400">
            Standard Operating Thresholds • Continuous Polling
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-white/5">
                <th className="py-2.5">GENERATOR UNIT</th>
                <th className="py-2.5">STATUS</th>
                <th className="py-2.5">OUTPUT / CAPACITY</th>
                <th className="py-2.5">LOAD %</th>
                <th className="py-2.5">COOLANT TEMP</th>
                <th className="py-2.5">OIL PRESS</th>
                <th className="py-2.5">FUEL RATE</th>
                <th className="py-2.5">HEALTH</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-200">
              {energy.generators.map((gen) => {
                const isOnline = gen.status === 'running';
                const isStandby = gen.status === 'standby';

                return (
                  <tr key={gen.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 font-semibold text-white">
                      {gen.name}
                      <span className="block text-[10px] text-slate-500 font-normal">{gen.id}</span>
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        isOnline
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : isStandby
                          ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}>
                        {gen.status}
                      </span>
                    </td>
                    <td className="py-3 font-mono">
                      {gen.currentOutputKw} / {gen.capacityKw} kW
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 rounded-full bg-polar-950 overflow-hidden border border-white/10">
                          <div 
                            className={`h-full ${gen.loadPercent > 90 ? 'bg-amber-400' : 'bg-cyan-400'}`} 
                            style={{ width: `${Math.min(100, gen.loadPercent)}%` }}
                          />
                        </div>
                        <span>{gen.loadPercent}%</span>
                      </div>
                    </td>
                    <td className="py-3 text-slate-300">{gen.coolantTempC} °C</td>
                    <td className="py-3 text-slate-300">{gen.oilPressureBar} bar</td>
                    <td className="py-3 text-slate-300">{gen.fuelRateLph} L/h</td>
                    <td className="py-3">
                      <span className={`font-bold ${gen.health >= 80 ? 'text-emerald-400' : gen.health >= 60 ? 'text-amber-400' : 'text-rose-400'}`}>
                        {gen.health}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
