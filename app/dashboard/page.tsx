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
  Info,
  Fuel,
  BatteryCharging,
  GitBranch,
  Settings2
} from 'lucide-react';
import TelemetryChart from '@/components/charts/TelemetryChart';

export default function DashboardPage() {
  const { 
    stationState, 
    currentStationId, 
    setCurrentStationId, 
    acknowledgeAlert,
    activeInjectedEvents 
  } = useStation();

  const [showExplainRisk, setShowExplainRisk] = React.useState(false);
  const [showWeightsModal, setShowWeightsModal] = React.useState(false);
  const [weights, setWeights] = React.useState({
    environment: 0.20,
    energy: 0.30,
    infrastructure: 0.25,
    logistics: 0.25,
  });

  const { metadata, environment, energy, infrastructure, logistics, healthScore, activeAlerts } = stationState;

  const fuelItem = logistics.inventory.find(i => i.category === 'fuel');
  const foodItem = logistics.inventory.find(i => i.category === 'food');
  const medItem = logistics.inventory.find(i => i.category === 'medical');

  const healthyAssets = infrastructure.assets.filter(a => a.status === 'running' || a.status === 'operational').length;
  const totalAssets = infrastructure.assets.length;

  return (
    <div className="flex-1 p-4 md:p-6 space-y-5 max-w-7xl mx-auto w-full">
      {/* Station Header & Critical Indicators Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 polar-card p-4 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-polar-800 border border-polar-border flex items-center justify-center font-mono font-bold text-polar-ice">
            {metadata.stationId === 'maitri' ? 'MTR' : 'BHR'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">{metadata.name}</h1>
              <span className="text-xs font-mono text-slate-400">({metadata.hindiName})</span>
            </div>
            <p className="text-xs text-slate-300 font-mono">
              {metadata.region} • Elevation: {metadata.coordinates.elevationM}m • Personnel: {metadata.currentPersonnel} on station
            </p>
          </div>
        </div>

        {/* Top 4 KPI Quick Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
          {/* Station Health (Clickable to configure weights) */}
          <div 
            onClick={() => setShowWeightsModal(true)}
            className="bg-polar-900/90 border border-polar-border/60 hover:border-cyan-400/60 p-2.5 rounded-lg flex flex-col justify-between cursor-pointer transition-all group"
            title="Click to inspect and configure domain weights"
          >
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-[10px] uppercase">Station Health</span>
              <Settings2 className="w-3 h-3 text-slate-500 group-hover:text-cyan-400 transition-colors" />
            </div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className={`text-xl font-bold ${
                healthScore.overall >= 80 ? 'text-emerald-400' :
                healthScore.overall >= 60 ? 'text-amber-400' : 'text-rose-400'
              }`}>
                {healthScore.overall}%
              </span>
              <span className="text-[10px] text-slate-400">weighted</span>
            </div>
          </div>

          {/* Power Balance */}
          <div className="bg-polar-900/90 border border-polar-border/60 p-2.5 rounded-lg flex flex-col justify-between">
            <span className="text-slate-400 text-[10px] uppercase">Power Balance</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg font-bold text-cyan-300">{energy.demandKw}</span>
              <span className="text-[10px] text-slate-400">/ {energy.generationKw} kW</span>
            </div>
          </div>

          {/* Fuel Runway */}
          <div className="bg-polar-900/90 border border-polar-border/60 p-2.5 rounded-lg flex flex-col justify-between">
            <span className="text-slate-400 text-[10px] uppercase">Fuel Runway</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className={`text-lg font-bold ${
                energy.fuelRunwayDays < 14 ? 'text-rose-400' : 'text-amber-300'
              }`}>
                {energy.fuelRunwayDays}
              </span>
              <span className="text-[10px] text-slate-400">days</span>
            </div>
          </div>

          {/* Active Alerts */}
          <div className="bg-polar-900/90 border border-polar-border/60 p-2.5 rounded-lg flex flex-col justify-between">
            <span className="text-slate-400 text-[10px] uppercase">Active Alerts</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className={`text-lg font-bold ${
                activeAlerts.length > 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}>
                {activeAlerts.length}
              </span>
              <span className="text-[10px] text-slate-400">unresolved</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: 2D Spatial Twin Preview + Risk Engine Rail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Spatial Station Twin Preview (2 Columns) */}
        <div className="lg:col-span-2 polar-card p-4 rounded-xl flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-polar-ice" />
              <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-white">
                Station Spatial Twin & Hotspots
              </h2>
            </div>
            <Link
              href="/digital-twin"
              className="text-xs font-mono text-polar-ice hover:underline flex items-center gap-1"
            >
              Full Interactive Twin <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Interactive Schematic Diagram */}
          <div className="relative bg-polar-950/80 rounded-lg border border-polar-border/40 p-4 h-72 flex flex-col justify-between overflow-hidden">
            {/* Background grid lines */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293d_1px,transparent_1px),linear-gradient(to_bottom,#1f293d_1px,transparent_1px)] bg-[size:2rem_2rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

            <div className="relative z-10 flex items-center justify-between text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                2D Schematic Overlay • Layer: Operational Assets
              </span>
              <span>Coordinates: {metadata.coordinates.lat}°, {metadata.coordinates.lng}°</span>
            </div>

            {/* Asset Nodes */}
            <div className="relative z-10 grid grid-cols-3 gap-3 my-auto">
              {infrastructure.assets.slice(0, 6).map((asset) => {
                const isWarning = asset.status === 'warning';
                const isCritical = asset.status === 'critical' || asset.status === 'offline';

                return (
                  <Link
                    key={asset.assetId}
                    href={`/infrastructure`}
                    className={`p-2.5 rounded-lg border transition-all text-xs font-mono flex flex-col justify-between ${
                      isCritical
                        ? 'bg-rose-950/60 border-rose-500/50 hover:bg-rose-900/60'
                        : isWarning
                        ? 'bg-amber-950/50 border-amber-500/40 hover:bg-amber-900/50'
                        : 'bg-polar-900/80 border-polar-border/60 hover:border-polar-ice/60 hover:bg-polar-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 uppercase truncate">{asset.building}</span>
                      <span className={`w-2 h-2 rounded-full ${
                        isCritical ? 'bg-rose-500 animate-pulse' : isWarning ? 'bg-amber-400' : 'bg-emerald-400'
                      }`} />
                    </div>
                    <span className="font-semibold text-white mt-1 truncate">{asset.name}</span>
                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-white/5 text-[10px] text-slate-400">
                      <span>Health:</span>
                      <span className={asset.health >= 80 ? 'text-emerald-400' : 'text-amber-400'}>
                        {asset.health}%
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Schematic Footer Details */}
            <div className="relative z-10 flex items-center justify-between text-xs font-mono pt-2 border-t border-white/5 text-slate-400">
              <span>Station Assets: {healthyAssets}/{totalAssets} Nominal</span>
              <span className="text-slate-500">Source: Telemetry Gateway Adapter</span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-3 gap-3 pt-1">
            <Link
              href="/simulator"
              className="py-2 px-3 rounded-lg bg-polar-800 hover:bg-polar-700 border border-polar-border text-xs font-mono text-center text-white flex items-center justify-center gap-1.5 transition-all"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-polar-ice" />
              [ Run Scenario ]
            </Link>
            <Link
              href="/alerts"
              className="py-2 px-3 rounded-lg bg-polar-800 hover:bg-polar-700 border border-polar-border text-xs font-mono text-center text-white flex items-center justify-center gap-1.5 transition-all"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              [ Open Alerts ({activeAlerts.length}) ]
            </Link>
            <Link
              href="/logistics"
              className="py-2 px-3 rounded-lg bg-polar-800 hover:bg-polar-700 border border-polar-border text-xs font-mono text-center text-white flex items-center justify-center gap-1.5 transition-all"
            >
              <FilePlus className="w-3.5 h-3.5 text-emerald-400" />
              [ Requisition ]
            </Link>
          </div>
        </div>

        {/* Right Rail: Risk Engine & Causal Chain */}
        <div className="polar-card p-4 rounded-xl flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-rose-400" />
              <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-white">
                Cross-Domain Risk Engine
              </h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30">
              Live Evaluation
            </span>
          </div>

          {/* Alert Cards or Nominal State */}
          <div className="space-y-3 flex-1 overflow-y-auto max-h-80 pr-1">
            {activeAlerts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 font-mono text-xs">
                <CheckCircle className="w-8 h-8 text-emerald-400 mb-2" />
                <p className="font-semibold text-slate-200">All Stations Operating Within Nominal Parameters</p>
                <p className="text-[11px] mt-1 text-slate-500">
                  No cross-domain threshold violations detected. Use the Demo Controller above to simulate stress scenarios.
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
                  <div className="bg-black/30 p-2 rounded text-[11px] space-y-1 text-slate-300">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Causal Chain:</span>
                    {alert.cause.map((c, i) => (
                      <p key={i} className="text-slate-200 leading-snug">• {c}</p>
                    ))}
                  </div>

                  {/* Recommendations */}
                  <div className="text-[11px] text-sky-300">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Action: </span>
                    {alert.recommendations[0]}
                  </div>

                  <div className="flex justify-between items-center pt-1 border-t border-white/10 text-[10px]">
                    <span className="text-slate-400">{new Date(alert.createdAt).toLocaleTimeString()}</span>
                    {!alert.acknowledged ? (
                      <button
                        onClick={() => acknowledgeAlert(alert.alertId)}
                        className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white font-semibold"
                      >
                        Acknowledge
                      </button>
                    ) : (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Acknowledged
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-2.5 rounded bg-polar-900 border border-polar-border/60 text-xs font-mono space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 uppercase">Recommended Station Stance</span>
              <button
                onClick={() => setShowExplainRisk(true)}
                className="px-2 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-[10px] flex items-center gap-1 font-bold"
              >
                <GitBranch className="w-3 h-3" /> [Explain Risk]
              </button>
            </div>
            <p className="text-slate-200">
              {activeAlerts.some(a => a.severity === 'critical')
                ? 'CRITICAL ALERT: Stand by for secondary generator cut-in and load shed.'
                : 'STATION STABLE: Routine monitoring active; weather window open for science sorties.'}
            </p>
          </div>
        </div>
      </div>

      {/* Four Domain Summaries (Environment, Energy, Infrastructure, Logistics) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Domain 1: Environment */}
        <Link href="/environment" className="polar-card p-4 rounded-xl hover:border-polar-ice transition-all group">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-cyan-400" />
              <h3 className="font-mono text-xs font-bold text-white uppercase">1. Environment</h3>
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
          </div>

          <div className="space-y-2 mt-3 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Ambient Temp:</span>
              <span className="font-bold text-white">{environment.temperatureC.toFixed(1)} °C</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Wind Velocity:</span>
              <span className="font-bold text-white">{environment.windKmh} km/h</span>
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
          <div className="mt-3 pt-2 border-t border-white/5 text-[10px] font-mono text-slate-500">
            Source: {environment.source}
          </div>
        </Link>

        {/* Domain 2: Energy */}
        <Link href="/energy" className="polar-card p-4 rounded-xl hover:border-polar-ice transition-all group">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <h3 className="font-mono text-xs font-bold text-white uppercase">2. Energy</h3>
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 transition-colors" />
          </div>

          <div className="space-y-2 mt-3 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Generation:</span>
              <span className="font-bold text-white">{energy.generationKw} kW</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Demand:</span>
              <span className="font-bold text-cyan-300">{energy.demandKw} kW</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Battery SoC:</span>
              <span className={`font-bold ${energy.batterySoc < 50 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {energy.batterySoc}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Fuel Runway:</span>
              <span className="font-bold text-amber-300">{energy.fuelRunwayDays} days</span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-white/5 text-[10px] font-mono text-slate-500">
            Active Gensets: {energy.generators.filter(g => g.status === 'running').length} online
          </div>
        </Link>

        {/* Domain 3: Infrastructure */}
        <Link href="/infrastructure" className="polar-card p-4 rounded-xl hover:border-polar-ice transition-all group">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="font-mono text-xs font-bold text-white uppercase">3. Infrastructure</h3>
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
          </div>

          <div className="space-y-2 mt-3 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">System Health:</span>
              <span className="font-bold text-emerald-400">{infrastructure.overallHealth}%</span>
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
              <span className="text-slate-400">Asset Health Ratio:</span>
              <span className="text-slate-200">{healthyAssets} / {totalAssets}</span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-white/5 text-[10px] font-mono text-slate-500">
            Maintenance: 1 task scheduled
          </div>
        </Link>

        {/* Domain 4: Logistics */}
        <Link href="/logistics" className="polar-card p-4 rounded-xl hover:border-polar-ice transition-all group">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-purple-400" />
              <h3 className="font-mono text-xs font-bold text-white uppercase">4. Logistics</h3>
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-purple-400 transition-colors" />
          </div>

          <div className="space-y-2 mt-3 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Fuel Stock:</span>
              <span className="font-bold text-amber-300">{fuelItem?.daysRemaining.toFixed(1)} days</span>
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
              <span className="font-semibold text-slate-300">ETA Oct 22</span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-white/5 text-[10px] font-mono text-slate-500">
            Requisitions: {logistics.requisitions.length} active
          </div>
        </Link>
      </div>

      {/* Explain Risk / Causal Chain Modal (Blueprint Page 8) */}
      {showExplainRisk && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="polar-card-highlight p-6 rounded-2xl max-w-2xl w-full space-y-5 font-mono text-xs border border-rose-500/40">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-rose-400" />
                <h3 className="font-bold text-white text-base">Cross-Domain Risk Causal Propagation Chain</h3>
              </div>
              <button
                onClick={() => setShowExplainRisk(false)}
                className="text-slate-400 hover:text-white text-base"
              >
                ✕
              </button>
            </div>

            <p className="text-slate-300 text-[11px] leading-relaxed">
              Polar Command couples environmental observations to thermodynamic loads, power generation, fuel reserves, and supply chain timelines rather than evaluating telemetry in silos.
            </p>

            {/* Causal Chain Nodes */}
            <div className="space-y-3">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                Causal Propagation Sequence (Blueprint Rule R-01 & R-04):
              </span>
              
              <div className="flex flex-col space-y-2">
                {[
                  { step: '1. Environmental Trigger', detail: 'External ambient temperature drops to -24.6°C with 38 km/h wind gusts (Rule R-01)', color: 'text-cyan-300 border-cyan-400/40 bg-cyan-950/40' },
                  { step: '2. HVAC Thermal Load Surge', detail: 'Building air handler draws +22% additional heat to maintain 21°C indoor life-support balance', color: 'text-sky-300 border-sky-400/40 bg-sky-950/40' },
                  { step: '3. Station Power Demand Shift', detail: 'Net microgrid electrical demand climbs from 350 kW to 382 kW (+8% increase)', color: 'text-amber-300 border-amber-400/40 bg-amber-950/40' },
                  { step: '4. Fuel Burn Acceleration', detail: 'Cogeneration genset fuel rate accelerates to 17.2 L/h (~460 L/day, +11% burn rate)', color: 'text-orange-300 border-orange-400/40 bg-orange-950/40' },
                  { step: '5. Reserve Runway Contraction', detail: 'Fuel autonomy shrinks from 24.0 days to 20.4 days (-3.6 day buffer erosion)', color: 'text-rose-300 border-rose-400/40 bg-rose-950/40' },
                  { step: '6. Logistics Severity Escalation', detail: 'Buffer gap vs icebreaker MV Vasiliy Golovnin triggers Logistics Warning (Rule R-04)', color: 'text-red-400 border-red-500 bg-red-950/60 font-bold' },
                ].map((node, i) => (
                  <div key={i} className={`p-3 rounded-lg border ${node.color} flex items-start gap-2.5`}>
                    <span className="w-5 h-5 rounded-full bg-black/40 flex items-center justify-center text-[10px] shrink-0 font-bold">
                      {i + 1}
                    </span>
                    <div>
                      <div className="font-bold text-white text-xs">{node.step}</div>
                      <div className="text-[11px] opacity-90 mt-0.5">{node.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-sky-950/30 border border-sky-500/30 text-sky-200 text-[11px]">
              <span className="font-bold uppercase block mb-1">Recommended Operator Action</span>
              Activate cold-reserve secondary generator pre-heaters and dispatch Priority Elevated fuel buffer replenishment request.
            </div>

            <div className="flex justify-end pt-2 border-t border-white/10">
              <button
                onClick={() => setShowExplainRisk(false)}
                className="px-4 py-2 rounded bg-polar-800 hover:bg-polar-700 text-white font-bold"
              >
                Close Causal Analysis
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Configurable Health Weights Modal (Blueprint Page 7) */}
      {showWeightsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="polar-card-highlight p-6 rounded-2xl max-w-lg w-full space-y-4 font-mono text-xs border border-cyan-500/40">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-white text-base">Configure Station Health Weights</h3>
              </div>
              <button
                onClick={() => setShowWeightsModal(false)}
                className="text-slate-400 hover:text-white text-base"
              >
                ✕
              </button>
            </div>

            <p className="text-slate-300 text-[11px]">
              Per NCPOR specification, domain weights are customizable prototype defaults:
              <br />
              <code className="text-cyan-300">healthScore = w_env*Env + w_eng*Energy + w_inf*Infra + w_log*Logistics</code>
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

            <div className="p-3 rounded bg-polar-900 border border-white/5 text-[11px] flex justify-between items-center text-slate-300">
              <span>Recalculated Station Health Preview:</span>
              <span className="text-base font-bold text-emerald-400">
                {Math.round(
                  weights.environment * healthScore.environmentScore +
                  weights.energy * healthScore.energyScore +
                  weights.infrastructure * healthScore.infrastructureScore +
                  weights.logistics * healthScore.logisticsScore
                )}%
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
              <button
                onClick={() => {
                  setWeights({ environment: 0.20, energy: 0.30, infrastructure: 0.25, logistics: 0.25 });
                }}
                className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Reset Defaults (20/30/25/25)
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
