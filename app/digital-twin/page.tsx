'use client';

import React, { useState } from 'react';
import { useStation } from '@/context/StationContext';
import { 
  Layers, 
  Eye, 
  Sliders, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  MapPin, 
  Box, 
  Thermometer, 
  Zap, 
  Gauge, 
  RotateCcw 
} from 'lucide-react';
import StationTwin3D from '@/components/twin/StationTwin3D';

export default function DigitalTwinPage() {
  const { stationState, currentStationId } = useStation();
  const { metadata, infrastructure, energy, environment } = stationState;

  const [activeLayer, setActiveLayer] = useState<'all' | 'energy' | 'hvac' | 'water' | 'comms'>('all');
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(infrastructure.assets[0]?.assetId || null);
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');

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
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-polar-ice/20 text-polar-ice border border-polar-ice/30 uppercase">
              Spatial Interface
            </span>
            <span className="text-xs font-mono text-slate-400">Station Twin • {metadata.name}</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight mt-1">
            Operational Digital Twin & Asset Spatial Map
          </h1>
          <p className="text-xs text-slate-300 font-mono">
            Interactive physical geometry connected to live telemetry, thermodynamic loads, and maintenance statuses.
          </p>
        </div>

        {/* View Mode & Filter Layer Bar */}
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          <div className="bg-polar-900 border border-polar-border rounded-lg p-0.5 flex">
            <button
              onClick={() => setViewMode('2d')}
              className={`px-3 py-1 rounded transition-colors ${
                viewMode === '2d' ? 'bg-cyan-500 text-polar-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              2D Schematic Layer
            </button>
            <button
              onClick={() => setViewMode('3d')}
              className={`px-3 py-1 rounded transition-colors ${
                viewMode === '3d' ? 'bg-cyan-500 text-polar-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              3D Spatial Mesh
            </button>
          </div>

          <div className="bg-polar-900 border border-polar-border rounded-lg p-0.5 flex">
            {(['all', 'energy', 'hvac', 'water', 'comms'] as const).map(layer => (
              <button
                key={layer}
                onClick={() => setActiveLayer(layer)}
                className={`px-2.5 py-1 rounded uppercase text-[11px] transition-colors ${
                  activeLayer === layer ? 'bg-polar-700 text-polar-ice font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {layer}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Twin Canvas + Asset Telemetry Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Spatial Twin Canvas */}
        <div className="lg:col-span-2 polar-card p-4 rounded-xl flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2 font-mono text-xs text-slate-300">
              <Box className="w-4 h-4 text-polar-ice" />
              <span>{metadata.name} Coordinates: {metadata.coordinates.lat}°, {metadata.coordinates.lng}°</span>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Live Mesh Synchronized
            </span>
          </div>

          {/* Canvas Rendering Area: 3D WebGL vs 2D Schematic Fallback */}
          {viewMode === '3d' ? (
            <StationTwin3D
              stationId={metadata.stationId}
              assets={filteredAssets}
              selectedAssetId={selectedAssetId}
              onSelectAsset={(id) => setSelectedAssetId(id)}
            />
          ) : (
            <div className="relative bg-polar-950 rounded-xl border border-polar-border/60 min-h-[420px] flex items-center justify-center overflow-hidden p-6">
              {/* Visual Polar Grid */}
              <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

              {/* Ice terrain contour styling */}
              <div className="absolute inset-0 border border-sky-500/10 rounded-xl pointer-events-none" />
              <div className="absolute top-4 left-4 text-xs font-mono text-slate-500">
                Station Altitude: {metadata.coordinates.elevationM}m AMSL | Ambient: {environment.temperatureC}°C
              </div>

              {/* Station Building Modules Layout */}
              <div className="relative z-10 w-full max-w-lg space-y-4">
                <div className="text-center font-mono text-xs text-slate-400 mb-2">
                  Click an asset module below to inspect live state & telemetry:
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {filteredAssets.map((asset) => {
                    const isSelected = selectedAsset?.assetId === asset.assetId;
                    const isWarning = asset.status === 'warning';
                    const isCritical = asset.status === 'critical' || asset.status === 'offline';

                    return (
                      <button
                        key={asset.assetId}
                        onClick={() => setSelectedAssetId(asset.assetId)}
                        className={`p-3 rounded-xl border text-left font-mono transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'border-cyan-400 bg-cyan-950/40 ring-2 ring-cyan-400/40 shadow-lg shadow-cyan-500/20'
                            : isCritical
                            ? 'border-rose-500/60 bg-rose-950/30 hover:bg-rose-900/40'
                            : isWarning
                            ? 'border-amber-500/60 bg-amber-950/30 hover:bg-amber-900/40'
                            : 'border-polar-border/70 bg-polar-900/80 hover:border-polar-ice hover:bg-polar-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-400 uppercase truncate">{asset.type.replace('_', ' ')}</span>
                          <span className={`w-2.5 h-2.5 rounded-full ${
                            isCritical ? 'bg-rose-500 animate-pulse' : isWarning ? 'bg-amber-400' : 'bg-emerald-400'
                          }`} />
                        </div>
                        <span className="text-xs font-bold text-white mt-1.5 line-clamp-1">{asset.name}</span>
                        <div className="mt-2 pt-1.5 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                          <span>Health:</span>
                          <span className={`font-semibold ${
                            asset.health >= 80 ? 'text-emerald-400' : asset.health >= 60 ? 'text-amber-400' : 'text-rose-400'
                          }`}>
                            {asset.health}%
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* View Mode Tag */}
              <div className="absolute bottom-3 right-3 text-[10px] font-mono text-slate-500 bg-polar-900/80 px-2 py-1 rounded border border-white/5">
                Render Mode: 2D Vector Orthographic Projection
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Click any module to inspect thermodynamic load and bearing telemetry</span>
            <button
              onClick={() => setSelectedAssetId(infrastructure.assets[0]?.assetId || null)}
              className="px-2 py-0.5 rounded bg-polar-800 hover:bg-polar-700 text-polar-ice text-[10px] border border-polar-border flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Reset Twin View
            </button>
          </div>
        </div>

        {/* Selected Asset Inspector (1 Column) */}
        <div className="polar-card p-5 rounded-xl flex flex-col justify-between space-y-4">
          <div className="border-b border-white/10 pb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-polar-ice">Asset Inspector</span>
              <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold font-mono ${
                selectedAsset.status === 'running' || selectedAsset.status === 'operational'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : selectedAsset.status === 'warning'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              }`}>
                {selectedAsset.status}
              </span>
            </div>
            <h2 className="text-base font-bold text-white mt-1">{selectedAsset.name}</h2>
            <p className="text-xs font-mono text-slate-400">{selectedAsset.building} • ID: {selectedAsset.assetId}</p>
          </div>

          {/* Metrics Card */}
          <div className="space-y-3 font-mono text-xs flex-1">
            <div className="bg-polar-900/90 p-3 rounded-lg border border-polar-border/50 flex justify-between items-center">
              <span className="text-slate-400">Asset Health Score:</span>
              <span className={`text-base font-bold ${
                selectedAsset.health >= 80 ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {selectedAsset.health} / 100
              </span>
            </div>

            <div className="space-y-2 pt-1">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Telemetry Channels</span>
              {selectedAsset.metrics.temperatureC !== undefined && (
                <div className="flex justify-between p-2 rounded bg-polar-950/60 border border-white/5">
                  <span className="text-slate-400 flex items-center gap-1"><Thermometer className="w-3.5 h-3.5" /> Operating Temp:</span>
                  <span className="font-bold text-white">{selectedAsset.metrics.temperatureC} °C</span>
                </div>
              )}
              {selectedAsset.metrics.loadKw !== undefined && (
                <div className="flex justify-between p-2 rounded bg-polar-950/60 border border-white/5">
                  <span className="text-slate-400 flex items-center gap-1"><Zap className="w-3.5 h-3.5" /> Active Load:</span>
                  <span className="font-bold text-white">{selectedAsset.metrics.loadKw} kW</span>
                </div>
              )}
              {selectedAsset.metrics.pressureBar !== undefined && (
                <div className="flex justify-between p-2 rounded bg-polar-950/60 border border-white/5">
                  <span className="text-slate-400 flex items-center gap-1"><Gauge className="w-3.5 h-3.5" /> Line Pressure:</span>
                  <span className="font-bold text-white">{selectedAsset.metrics.pressureBar} bar</span>
                </div>
              )}
              {selectedAsset.metrics.flowRateLpm !== undefined && (
                <div className="flex justify-between p-2 rounded bg-polar-950/60 border border-white/5">
                  <span className="text-slate-400">Volumetric Flow:</span>
                  <span className="font-bold text-white">{selectedAsset.metrics.flowRateLpm} L/min</span>
                </div>
              )}
              {selectedAsset.metrics.runtimeHours !== undefined && (
                <div className="flex justify-between p-2 rounded bg-polar-950/60 border border-white/5">
                  <span className="text-slate-400">Cumulative Runtime:</span>
                  <span className="text-slate-200">{selectedAsset.metrics.runtimeHours} hrs</span>
                </div>
              )}
            </div>

            {/* Active Asset Alerts */}
            <div className="pt-2">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block mb-1">Alerts & Advisories</span>
              {selectedAsset.alerts.length === 0 ? (
                <div className="p-2.5 rounded bg-emerald-950/30 border border-emerald-500/20 text-emerald-300 text-[11px] flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5" /> No active hardware warnings
                </div>
              ) : (
                selectedAsset.alerts.map((al, idx) => (
                  <div key={idx} className="p-2 rounded bg-amber-950/40 border border-amber-500/30 text-amber-200 text-[11px] flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{al}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Maintenance Metadata */}
          <div className="pt-3 border-t border-white/10 font-mono text-[11px] text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Last Serviced:</span>
              <span className="text-slate-200">{selectedAsset.lastServiced}</span>
            </div>
            <div className="flex justify-between">
              <span>Next Routine Due:</span>
              <span className="text-slate-200">{selectedAsset.nextServiceDue}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
