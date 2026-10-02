'use client';

import React, { useState } from 'react';
import { useStation } from '@/context/StationContext';
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
  AlertOctagon
} from 'lucide-react';
import StationTwin2D from '@/components/twin/StationTwin2D';
import ProvenanceBadge from '@/components/common/ProvenanceBadge';

export default function DigitalTwinPage() {
  const { stationState, currentStationId, activeInjectedEvents } = useStation();
  const { metadata, infrastructure, energy, environment, derived } = stationState;

  const [activeLayer, setActiveLayer] = useState<'all' | 'energy' | 'hvac' | 'water' | 'comms'>('all');
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(infrastructure.assets[0]?.assetId || null);
  const [showThermalFlow, setShowThermalFlow] = useState<boolean>(true);
  const [showEnergyFlow, setShowEnergyFlow] = useState<boolean>(true);

  const filteredAssets = infrastructure.assets.filter((asset) => {
    if (activeLayer === 'all') return true;
    if (activeLayer === 'energy') return asset.type === 'generator' || asset.type === 'fuel_pump';
    if (activeLayer === 'hvac') return asset.type === 'hvac';
    if (activeLayer === 'water') return asset.type === 'water_pump' || asset.type === 'reverse_osmosis';
    if (activeLayer === 'comms') return asset.type === 'satellite_uplink';
    return true;
  });

  const selectedAsset = infrastructure.assets.find(a => a.assetId === selectedAssetId) || infrastructure.assets[0];

  return (
    <div className="flex-1 p-4 md:p-6 space-y-5 max-w-7xl mx-auto w-full">
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
            Operational Spatial Digital Twin & Microgrid Blueprint
          </h1>
          <p className="text-xs text-slate-300 font-mono">
            Interactive 2D spatial layout connected to live sensor telemetry, thermodynamic loads, and causal risk propagation.
          </p>
        </div>

        {/* Filter Layer Bar & Flow Toggles */}
        <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
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
              Thermal Loop: {showThermalFlow ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={() => setShowEnergyFlow(!showEnergyFlow)}
              className={`px-2 py-1 rounded border transition-all ${
                showEnergyFlow 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-400/40' 
                  : 'bg-polar-900 text-slate-500 border-polar-border'
              }`}
            >
              Energy Flow: {showEnergyFlow ? 'ON' : 'OFF'}
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
          />

          <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
            <span>Click any subsystem node above or card below to inspect thermodynamic load and bearing telemetry</span>
            <button
              onClick={() => setSelectedAssetId(infrastructure.assets[0]?.assetId || null)}
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
              <span className="text-[10px] uppercase font-bold text-cyan-400">Subsystem Inspector</span>
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

          {/* Metrics & Anomaly Detection */}
          <div className="space-y-3 flex-1">
            <div className="bg-polar-900 p-3 rounded-lg border border-polar-border flex justify-between items-center">
              <span className="text-slate-400">Subsystem Health Score:</span>
              <span className={`text-base font-bold ${
                selectedAsset.health >= 80 ? 'text-emerald-400' : selectedAsset.health >= 60 ? 'text-amber-400' : 'text-rose-400'
              }`}>
                {selectedAsset.health}%
              </span>
            </div>

            {/* Explainable Anomaly Signal Display */}
            {selectedAsset.anomaly && (
              <div className={`p-3 rounded-lg border text-[11px] space-y-1.5 ${
                selectedAsset.anomaly.status === 'ANOMALY' 
                  ? 'bg-rose-950/70 border-rose-500/70 text-rose-200' 
                  : 'bg-polar-900 border-polar-border text-slate-300'
              }`}>
                <div className="flex items-center justify-between font-bold">
                  <span className="uppercase flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-current" />
                    Anomaly Telemetry: {selectedAsset.anomaly.parameter}
                  </span>
                  <span className={`px-1.5 py-0.2 rounded text-[9px] ${
                    selectedAsset.anomaly.status === 'ANOMALY' ? 'bg-rose-500 text-white' : 'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    {selectedAsset.anomaly.status}
                  </span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>Expected: {selectedAsset.anomaly.expectedRange}</span>
                  <span>Observed: <strong>{selectedAsset.anomaly.observedValue}</strong></span>
                </div>
                <p className="text-[10px] opacity-90">{selectedAsset.anomaly.explanation}</p>
              </div>
            )}

            <div className="space-y-2 pt-1">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                Live Sensor Telemetry
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
              {selectedAsset.metrics.pressureBar !== undefined && (
                <div className="flex justify-between p-2 rounded bg-polar-900 border border-polar-border">
                  <span className="text-slate-400 flex items-center gap-1 font-medium">
                    <Gauge className="w-3.5 h-3.5 text-blue-400" /> Line Pressure:
                  </span>
                  <span className="font-bold text-white">{selectedAsset.metrics.pressureBar} bar</span>
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
              {selectedAsset.metrics.runtimeHours !== undefined && (
                <div className="flex justify-between p-2 rounded bg-polar-900 border border-polar-border">
                  <span className="text-slate-400 font-medium">Cumulative Runtime:</span>
                  <span className="text-slate-200 font-semibold">{selectedAsset.metrics.runtimeHours} hrs</span>
                </div>
              )}
            </div>

            {/* Active Asset Alerts */}
            <div className="pt-2">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1 font-bold">
                Alerts & Advisories
              </span>
              {selectedAsset.alerts.length === 0 ? (
                <div className="p-2.5 rounded bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-[11px] flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Nominal operational state
                </div>
              ) : (
                selectedAsset.alerts.map((al, idx) => (
                  <div key={idx} className="p-2 rounded bg-rose-950/60 border border-rose-500/50 text-rose-200 text-[11px] flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>{al}</span>
                  </div>
                ))
              )}
            </div>
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
