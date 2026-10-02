'use client';

import React, { useState } from 'react';
import { useStation } from '@/context/StationContext';
import Link from 'next/link';
import GlobalStationStatusRail from '@/components/layout/GlobalStationStatusRail';
import { 
  Layers, 
  MapPin, 
  Thermometer, 
  Zap, 
  Gauge, 
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Compass,
  Activity,
  SlidersHorizontal,
  Flame,
  Radio,
  ShieldCheck,
  AlertOctagon,
  ArrowRight,
  ArrowDown,
  Crosshair,
  ExternalLink,
  Play,
  HelpCircle,
  X
} from 'lucide-react';
import StationTwin2D from '@/components/twin/StationTwin2D';
import ProvenanceBadge from '@/components/common/ProvenanceBadge';

export default function DigitalTwinPage() {
  const { stationState, effectiveStationState, currentStationId, activeInjectedEvents } = useStation();
  const { metadata, infrastructure, energy, environment, derived, activeAlerts } = stationState;
  const { risk } = effectiveStationState;

  const [activeLayer, setActiveLayer] = useState<'all' | 'energy' | 'hvac' | 'water' | 'comms'>('all');
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(infrastructure.assets[0]?.assetId || null);
  const [showThermalFlow, setShowThermalFlow] = useState<boolean>(true);
  const [showEnergyFlow, setShowEnergyFlow] = useState<boolean>(true);
  const [focusIncident, setFocusIncident] = useState<boolean>(false);
  const [showExplainModal, setShowExplainModal] = useState<boolean>(false);

  const filteredAssets = infrastructure.assets.filter((asset) => {
    if (activeLayer === 'all') return true;
    if (activeLayer === 'energy') return asset.type === 'generator' || asset.type === 'fuel_pump';
    if (activeLayer === 'hvac') return asset.type === 'hvac';
    if (activeLayer === 'water') return asset.type === 'water_pump' || asset.type === 'reverse_osmosis';
    if (activeLayer === 'comms') return asset.type === 'satellite_uplink';
    return true;
  });

  const selectedAsset = infrastructure.assets.find(a => a.assetId === selectedAssetId) || infrastructure.assets[0];

  // Map selected asset to domain & subsystem for Requirement 9 cascade
  const subsystemTitle = selectedAsset.type === 'generator' || selectedAsset.type === 'fuel_pump' 
    ? 'POWER GENERATION' 
    : selectedAsset.type === 'hvac' 
    ? 'THERMAL RECOVERY & HVAC' 
    : selectedAsset.type === 'water_pump' || selectedAsset.type === 'reverse_osmosis'
    ? 'WATER & DESALINATION'
    : 'SATCOM UPLINK';

  const affectedDomainTitle = selectedAsset.type === 'water_pump' || selectedAsset.type === 'reverse_osmosis'
    ? 'LIFE SUPPORT & HABITAT'
    : selectedAsset.type === 'hvac'
    ? 'THERMAL EQUILIBRIUM'
    : 'CRITICAL MICROGRID POWER';

  // Find related alerts for this asset
  const relatedAlerts = activeAlerts.filter(a => 
    a.affectedAssets.some(aff => 
      selectedAsset.name.toLowerCase().includes(aff.toLowerCase()) || 
      aff.toLowerCase().includes(selectedAsset.name.toLowerCase()) ||
      selectedAsset.assetId.toLowerCase().includes(aff.toLowerCase())
    )
  );

  return (
    <div className="flex-1 p-4 md:p-6 space-y-5 max-w-7xl mx-auto w-full">
      {/* Global Shared Station Status Rail */}
      <GlobalStationStatusRail />

      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 polar-card p-4 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 font-bold uppercase">
              Spatial Digital Twin
            </span>
            <ProvenanceBadge source="Derived Calculation" />
            <span className="text-xs font-mono text-slate-400">Station Twin • {metadata.name}</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight mt-1">
            Operational Spatial Digital Twin & Dependency Graph
          </h1>
          <p className="text-xs text-slate-300 font-mono">
            Interactive 2D spatial layout connected to live sensor telemetry, dependency tracing, and Focus Incident Mode.
          </p>
        </div>

        {/* Filter Layer Bar, Flow Toggles & Focus Incident Mode */}
        <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
          {/* Section 9 Requirement: FOCUS INCIDENT TOGGLE */}
          <button
            onClick={() => setFocusIncident(!focusIncident)}
            className={`px-3 py-1.5 rounded-lg border font-bold flex items-center gap-1.5 transition-all shadow-md ${
              focusIncident 
                ? 'bg-rose-500 text-white border-rose-400 shadow-rose-500/30 ring-2 ring-rose-400/50' 
                : 'bg-polar-900 text-slate-300 hover:text-white border-polar-border hover:border-rose-500/40'
            }`}
          >
            <Crosshair className={`w-3.5 h-3.5 ${focusIncident ? 'animate-spin' : ''}`} />
            <span>FOCUS INCIDENT: {focusIncident ? 'ACTIVE' : 'OFF'}</span>
          </button>

          <div className="flex items-center gap-1.5 bg-polar-900 border border-polar-border rounded-lg p-1">
            {(['all', 'energy', 'hvac', 'water', 'comms'] as const).map(layer => (
              <button
                key={layer}
                onClick={() => setActiveLayer(layer)}
                className={`px-2.5 py-1 rounded uppercase text-[10px] font-semibold transition-all ${
                  activeLayer === layer
                    ? 'bg-cyan-400 text-polar-950 shadow-sm font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {layer}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-[10px]">
            <button
              onClick={() => setShowThermalFlow(!showThermalFlow)}
              className={`px-2 py-1 rounded border transition-all ${
                showThermalFlow 
                  ? 'bg-sky-500/20 text-sky-300 border-sky-400/40' 
                  : 'bg-polar-900 text-slate-500 border-polar-border'
              }`}
            >
              Thermal: {showThermalFlow ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={() => setShowEnergyFlow(!showEnergyFlow)}
              className={`px-2 py-1 rounded border transition-all ${
                showEnergyFlow 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-400/40' 
                  : 'bg-polar-900 text-slate-500 border-polar-border'
              }`}
            >
              Power: {showEnergyFlow ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Twin Canvas + Asset Telemetry Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* 2D Spatial Twin Canvas (2 Columns) */}
        <div className="lg:col-span-2 space-y-3">
          <StationTwin2D
            stationId={metadata.stationId}
            assets={filteredAssets}
            selectedAssetId={selectedAssetId}
            onSelectAsset={(id) => setSelectedAssetId(id)}
            showThermalFlow={showThermalFlow}
            showEnergyFlow={showEnergyFlow}
            focusIncidentMode={focusIncident}
          />

          <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
            <span>
              {focusIncident 
                ? 'Focus Incident Mode Active: Unrelated systems dimmed. Upstream/downstream dependencies highlighted.' 
                : 'Click any subsystem node above or card below to trace upstream/downstream dependency links.'}
            </span>
            <button
              onClick={() => {
                setSelectedAssetId(infrastructure.assets[0]?.assetId || null);
                setFocusIncident(false);
              }}
              className="px-2.5 py-1 rounded bg-polar-900 hover:bg-polar-800 text-cyan-300 text-[11px] border border-polar-border flex items-center gap-1 font-semibold transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Selection
            </button>
          </div>
        </div>

        {/* Selected Asset Inspector (1 Column) */}
        <div className="polar-card p-5 rounded-xl flex flex-col justify-between space-y-4 font-mono text-xs">
          <div className="border-b border-white/10 pb-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-cyan-400">Dependency Inspector</span>
              <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                selectedAsset.status === 'running' || selectedAsset.status === 'operational'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : selectedAsset.status === 'warning'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}>
                {selectedAsset.status}
              </span>
            </div>
            <h2 className="text-base font-bold text-white mt-1">{selectedAsset.name}</h2>
            <p className="text-slate-400">{selectedAsset.building} • ID: {selectedAsset.assetId}</p>
          </div>

          {/* Section 9 Requirement: FOCUS INCIDENT CASCADE DISPLAY */}
          <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-2">
            <div className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider flex items-center justify-between">
              <span>Incident Dependency Cascade:</span>
              {focusIncident && (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500 text-white font-bold animate-pulse">
                  FOCUSED
                </span>
              )}
            </div>
            
            <div className="space-y-1 text-[11px]">
              <div className="flex items-center gap-2 p-1.5 rounded bg-polar-900 border border-white/10 text-white font-bold">
                <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[10px]">1</span>
                <span>{selectedAsset.name.toUpperCase()}</span>
              </div>
              <div className="flex justify-center my-0.5">
                <ArrowDown className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="flex items-center gap-2 p-1.5 rounded bg-sky-950/60 border border-sky-500/30 text-sky-200 font-semibold">
                <span className="w-4 h-4 rounded-full bg-sky-500/20 text-sky-300 flex items-center justify-center text-[10px]">2</span>
                <span>{subsystemTitle}</span>
              </div>
              <div className="flex justify-center my-0.5">
                <ArrowDown className="w-3.5 h-3.5 text-sky-400" />
              </div>
              <div className="flex items-center gap-2 p-1.5 rounded bg-amber-950/60 border border-amber-500/30 text-amber-200 font-semibold">
                <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-[10px]">3</span>
                <span>{affectedDomainTitle}</span>
              </div>
              <div className="flex justify-center my-0.5">
                <ArrowDown className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="flex items-center gap-2 p-1.5 rounded bg-rose-950/60 border border-rose-500/30 text-rose-200 font-bold">
                <span className="w-4 h-4 rounded-full bg-rose-500/20 text-rose-300 flex items-center justify-center text-[10px]">4</span>
                <span>STATION RISK: {risk.operationalStatus}</span>
              </div>
            </div>

            {/* Operational Impact */}
            <div className="pt-2 border-t border-white/5 text-[11px] text-slate-300">
              <span className="text-[10px] uppercase font-bold text-amber-400 block mb-0.5">Current Impact:</span>
              <p className="text-slate-200">{selectedAsset.operationalImpact || 'Nominal operational contribution to station baseload.'}</p>
            </div>
          </div>

          {/* Section 9 Requirement: Action Buttons (EXPLAIN, SIMULATE, OPEN ASSET) */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setShowExplainModal(!showExplainModal)}
              className="py-2 px-2 rounded-lg bg-polar-900 hover:bg-polar-800 text-cyan-300 border border-cyan-500/30 font-bold text-center flex items-center justify-center gap-1 transition-all"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              EXPLAIN
            </button>
            <Link
              href="/simulator"
              className="py-2 px-2 rounded-lg bg-polar-900 hover:bg-polar-800 text-amber-300 border border-amber-500/30 font-bold text-center flex items-center justify-center gap-1 transition-all"
            >
              <Play className="w-3.5 h-3.5" />
              SIMULATE
            </Link>
            <Link
              href={`/infrastructure?assetId=${selectedAsset.assetId}`}
              className="py-2 px-2 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-polar-950 font-bold text-center flex items-center justify-center gap-1 transition-all shadow-md shadow-cyan-500/20"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              OPEN ASSET
            </Link>
          </div>

          {/* Expandable Explanation Panel */}
          {showExplainModal && (
            <div className="p-3 rounded-xl bg-polar-900 border border-cyan-500/40 text-slate-200 space-y-2">
              <div className="flex items-center justify-between text-cyan-300 font-bold text-xs border-b border-white/10 pb-1.5">
                <span>Coupled Physics Explanation</span>
                <button onClick={() => setShowExplainModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-300">
                {derived.rootCause}
              </p>
              <div className="text-[10px] text-sky-300 bg-black/30 p-2 rounded border border-white/5">
                <strong>Recommended SOP:</strong> {derived.recommendedResponse}
              </div>
            </div>
          )}

          {/* Live Sensor Telemetry */}
          <div className="space-y-2 pt-1">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
              Subsystem Sensor Telemetry
            </span>
            {selectedAsset.metrics.temperatureC !== undefined && (
              <div className="flex justify-between p-2 rounded bg-polar-900 border border-polar-border">
                <span className="text-slate-400 flex items-center gap-1 font-medium">
                  <Thermometer className="w-3.5 h-3.5 text-cyan-400" /> Operating Temp:
                </span>
                <span className="font-bold text-white">{selectedAsset.metrics.temperatureC} °C</span>
              </div>
            )}
            {selectedAsset.metrics.loadKw !== undefined && (
              <div className="flex justify-between p-2 rounded bg-polar-900 border border-polar-border">
                <span className="text-slate-400 flex items-center gap-1 font-medium">
                  <Zap className="w-3.5 h-3.5 text-amber-400" /> Active Load:
                </span>
                <span className="font-bold text-white">{selectedAsset.metrics.loadKw} kW</span>
              </div>
            )}
            {selectedAsset.metrics.vibrationMmS !== undefined && (
              <div className="flex justify-between p-2 rounded bg-polar-900 border border-polar-border">
                <span className="text-slate-400 flex items-center gap-1 font-medium">
                  <Activity className="w-3.5 h-3.5 text-purple-400" /> Vibration:
                </span>
                <span className="font-bold text-white">{selectedAsset.metrics.vibrationMmS} mm/s</span>
              </div>
            )}
          </div>

          {/* Related Alerts */}
          <div className="pt-2">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1 font-bold">
              Related Active Alerts ({relatedAlerts.length})
            </span>
            {relatedAlerts.length === 0 ? (
              <div className="p-2.5 rounded bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-[11px] flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Nominal operational state
              </div>
            ) : (
              relatedAlerts.map((al) => (
                <div key={al.alertId} className="p-2 rounded bg-rose-950/60 border border-rose-500/50 text-rose-200 text-[11px] flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>{al.title}</span>
                </div>
              ))
            )}
          </div>

          {/* Maintenance Metadata */}
          <div className="pt-3 border-t border-white/10 text-[11px] text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Last Serviced:</span>
              <span className="text-slate-200 font-semibold">{selectedAsset.lastServiced}</span>
            </div>
            <div className="flex justify-between">
              <span>Next Routine Due:</span>
              <span className="text-slate-200 font-semibold">{selectedAsset.nextServiceDue}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
