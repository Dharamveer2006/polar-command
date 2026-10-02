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
  Box
} from 'lucide-react';
import StationTwin2D from '@/components/twin/StationTwin2D';

export default function DigitalTwinPage() {
  const { stationState, currentStationId } = useStation();
  const { metadata, infrastructure, energy, environment } = stationState;

  const [activeLayer, setActiveLayer] = useState<'all' | 'energy' | 'hvac' | 'water' | 'comms'>('all');
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(infrastructure.assets[0]?.assetId || null);

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
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-300 font-bold uppercase">
              2D Spatial Interface
            </span>
            <span className="text-xs font-mono text-slate-500">Station Twin • {metadata.name}</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
            Operational 2D Digital Twin & Architectural Blueprint
          </h1>
          <p className="text-xs text-slate-600 font-mono">
            Interactive CAD blueprint connected to live sensor telemetry, thermodynamic loads, and maintenance statuses.
          </p>
        </div>

        {/* Filter Layer Bar */}
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          <span className="text-slate-500 text-[11px] uppercase mr-1 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-sky-600" /> Filter Layer:
          </span>
          <div className="bg-slate-100 border border-slate-200 rounded-lg p-1 flex">
            {(['all', 'energy', 'hvac', 'water', 'comms'] as const).map(layer => (
              <button
                key={layer}
                onClick={() => setActiveLayer(layer)}
                className={`px-3 py-1 rounded uppercase text-[11px] font-semibold transition-all ${
                  activeLayer === layer
                    ? 'bg-white text-sky-700 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
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
        {/* 2D Spatial Twin Canvas (2 Columns) */}
        <div className="lg:col-span-2 space-y-3">
          <StationTwin2D
            stationId={metadata.stationId}
            assets={filteredAssets}
            selectedAssetId={selectedAssetId}
            onSelectAsset={(id) => setSelectedAssetId(id)}
          />

          <div className="flex items-center justify-between text-xs font-mono text-slate-500 px-1">
            <span>Click any hotspot above or card below to inspect thermodynamic load and bearing telemetry</span>
            <button
              onClick={() => setSelectedAssetId(infrastructure.assets[0]?.assetId || null)}
              className="px-2.5 py-1 rounded bg-white hover:bg-slate-100 text-sky-700 text-[11px] border border-slate-200 shadow-sm flex items-center gap-1 font-semibold transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Selection
            </button>
          </div>
        </div>

        {/* Selected Asset Inspector (1 Column) */}
        <div className="polar-card p-5 rounded-xl flex flex-col justify-between space-y-4">
          <div className="border-b border-slate-200 pb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase font-bold text-sky-700">Subsystem Inspector</span>
              <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold font-mono ${
                selectedAsset.status === 'running' || selectedAsset.status === 'operational'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : selectedAsset.status === 'warning'
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-rose-100 text-rose-800 border border-rose-300'
              }`}>
                {selectedAsset.status}
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900 mt-1">{selectedAsset.name}</h2>
            <p className="text-xs font-mono text-slate-500">{selectedAsset.building} • ID: {selectedAsset.assetId}</p>
          </div>

          {/* Metrics Card */}
          <div className="space-y-3 font-mono text-xs flex-1">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between items-center">
              <span className="text-slate-600 font-semibold">Subsystem Health Score:</span>
              <span className={`text-base font-bold ${
                selectedAsset.health >= 80 ? 'text-emerald-700' : 'text-amber-700'
              }`}>
                {selectedAsset.health} / 100
              </span>
            </div>

            <div className="space-y-2 pt-1">
              <span className="text-[11px] text-slate-500 uppercase tracking-wider block font-bold">
                Live Sensor Telemetry
              </span>
              {selectedAsset.metrics.temperatureC !== undefined && (
                <div className="flex justify-between p-2 rounded bg-slate-50 border border-slate-200">
                  <span className="text-slate-600 flex items-center gap-1 font-medium">
                    <Thermometer className="w-3.5 h-3.5 text-sky-600" /> Operating Temp:
                  </span>
                  <span className="font-bold text-slate-900">{selectedAsset.metrics.temperatureC} °C</span>
                </div>
              )}
              {selectedAsset.metrics.loadKw !== undefined && (
                <div className="flex justify-between p-2 rounded bg-slate-50 border border-slate-200">
                  <span className="text-slate-600 flex items-center gap-1 font-medium">
                    <Zap className="w-3.5 h-3.5 text-amber-600" /> Active Load:
                  </span>
                  <span className="font-bold text-slate-900">{selectedAsset.metrics.loadKw} kW</span>
                </div>
              )}
              {selectedAsset.metrics.pressureBar !== undefined && (
                <div className="flex justify-between p-2 rounded bg-slate-50 border border-slate-200">
                  <span className="text-slate-600 flex items-center gap-1 font-medium">
                    <Gauge className="w-3.5 h-3.5 text-blue-600" /> Line Pressure:
                  </span>
                  <span className="font-bold text-slate-900">{selectedAsset.metrics.pressureBar} bar</span>
                </div>
              )}
              {selectedAsset.metrics.flowRateLpm !== undefined && (
                <div className="flex justify-between p-2 rounded bg-slate-50 border border-slate-200">
                  <span className="text-slate-600 font-medium">Volumetric Flow:</span>
                  <span className="font-bold text-slate-900">{selectedAsset.metrics.flowRateLpm} L/min</span>
                </div>
              )}
              {selectedAsset.metrics.runtimeHours !== undefined && (
                <div className="flex justify-between p-2 rounded bg-slate-50 border border-slate-200">
                  <span className="text-slate-600 font-medium">Cumulative Runtime:</span>
                  <span className="text-slate-800 font-semibold">{selectedAsset.metrics.runtimeHours} hrs</span>
                </div>
              )}
            </div>

            {/* Active Asset Alerts */}
            <div className="pt-2">
              <span className="text-[11px] text-slate-500 uppercase tracking-wider block mb-1 font-bold">
                Alerts & Advisories
              </span>
              {selectedAsset.alerts.length === 0 ? (
                <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> No active hardware warnings
                </div>
              ) : (
                selectedAsset.alerts.map((al, idx) => (
                  <div key={idx} className="p-2 rounded bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>{al}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Maintenance Metadata */}
          <div className="pt-3 border-t border-slate-200 font-mono text-[11px] text-slate-500 space-y-1">
            <div className="flex justify-between">
              <span>Last Serviced:</span>
              <span className="text-slate-800 font-semibold">{selectedAsset.lastServiced}</span>
            </div>
            <div className="flex justify-between">
              <span>Next Routine Due:</span>
              <span className="text-slate-800 font-semibold">{selectedAsset.nextServiceDue}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
