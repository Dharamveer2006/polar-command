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
  AlertOctagon,
  Cpu,
  Server,
  Terminal,
  Play,
  WifiOff,
  Wifi,
  RefreshCw
} from 'lucide-react';
import StationTwin2D from '@/components/twin/StationTwin2D';
import ProvenanceBadge from '@/components/common/ProvenanceBadge';
import HardwareStatus from '@/components/hardware/HardwareStatus';
import HardwareInspector from '@/components/hardware/HardwareInspector';
import TelemetryPanel from '@/components/hardware/TelemetryPanel';
import EdgeGatewayPanel from '@/components/hardware/EdgeGatewayPanel';
import CommandPanel from '@/components/hardware/CommandPanel';

export default function DigitalTwinPage() {
  const { 
    stationState, 
    currentStationId, 
    activeInjectedEvents,
    selectedHardwareNodeId,
    setSelectedHardwareNodeId,
    hardwareScenario,
    toggleHardwareScenario
  } = useStation();
  
  const { metadata, infrastructure, energy, environment, derived } = stationState;

  const [viewMode, setViewMode] = useState<'blueprint' | 'telemetry' | 'gateway' | 'commands'>('blueprint');
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
    <div className="flex-1 p-4 md:p-6 space-y-4 max-w-7xl mx-auto w-full font-mono text-xs text-slate-200">
      {/* 1. Compact Hardware Status Ribbon (Requirement 23) */}
      <HardwareStatus 
        onOpenGateway={() => setViewMode('gateway')}
        onOpenTelemetry={() => setViewMode('telemetry')}
      />

      {/* 2. Top Navigation & Subsystem View Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 polar-card p-4 rounded-xl border border-polar-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 font-bold uppercase">
              Hardware Digital Twin
            </span>
            <ProvenanceBadge source="Derived Calculation" />
            <span className="text-xs font-mono text-slate-400">{metadata.name} (Antarctic ICS Node)</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight mt-1">
            Industrial Control System & Spatial Hardware Twin
          </h1>
          <p className="text-xs text-slate-400 font-sans">
            Directly coupled physical fieldbus instrumentation, telemetry ingestion, predictive model, and edge actuator loop.
          </p>
        </div>

        {/* View Mode Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-polar-900 border border-polar-border rounded-lg p-1">
            <button
              onClick={() => setViewMode('blueprint')}
              className={`px-3 py-1.5 rounded uppercase text-[10px] font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'blueprint'
                  ? 'bg-cyan-500 text-polar-950 font-extrabold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>SPATIAL CAD</span>
            </button>

            <button
              onClick={() => setViewMode('telemetry')}
              className={`px-3 py-1.5 rounded uppercase text-[10px] font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'telemetry'
                  ? 'bg-cyan-500 text-polar-950 font-extrabold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>FIELDBUS MATRIX (27)</span>
            </button>

            <button
              onClick={() => setViewMode('gateway')}
              className={`px-3 py-1.5 rounded uppercase text-[10px] font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'gateway'
                  ? 'bg-cyan-500 text-polar-950 font-extrabold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              <span>EDGE GATEWAY</span>
            </button>

            <button
              onClick={() => setViewMode('commands')}
              className={`px-3 py-1.5 rounded uppercase text-[10px] font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'commands'
                  ? 'bg-cyan-500 text-polar-950 font-extrabold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>OPERATOR COMMANDS</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Demo Scenario Bar (Requirement 28: Instant hardware scenario injection) */}
      <div className="bg-[#0B1522] border border-cyan-800/40 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-[11px]">
        <div className="flex items-center gap-2 text-cyan-300 font-bold uppercase">
          <Play className="w-3.5 h-3.5 text-cyan-400" />
          <span>Interactive Hardware Scenarios (Requirement 28):</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Scenario 1: Gen #2 Failure */}
          <button
            onClick={() => toggleHardwareScenario('generator2Offline')}
            className={`px-2.5 py-1 rounded border font-semibold transition-all flex items-center gap-1.5 ${
              hardwareScenario.generator2Offline
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                : 'bg-polar-900 text-slate-300 border-polar-border hover:border-slate-600'
            }`}
          >
            <Zap className={`w-3 h-3 ${hardwareScenario.generator2Offline ? 'text-rose-400' : 'text-slate-400'}`} />
            <span>1. GEN #2 FAILURE</span>
            {hardwareScenario.generator2Offline && <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />}
          </button>

          {/* Scenario 2: Pump Vibration Fault */}
          <button
            onClick={() => toggleHardwareScenario('pumpVibrationFault')}
            className={`px-2.5 py-1 rounded border font-semibold transition-all flex items-center gap-1.5 ${
              hardwareScenario.pumpVibrationFault
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                : 'bg-polar-900 text-slate-300 border-polar-border hover:border-slate-600'
            }`}
          >
            <Activity className={`w-3 h-3 ${hardwareScenario.pumpVibrationFault ? 'text-amber-400' : 'text-slate-400'}`} />
            <span>2. PUMP #1 VIBRATION (4.8 mm/s)</span>
            {hardwareScenario.pumpVibrationFault && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />}
          </button>

          {/* Scenario 3: Sensor Fault */}
          <button
            onClick={() => toggleHardwareScenario('pressureSensorOffline')}
            className={`px-2.5 py-1 rounded border font-semibold transition-all flex items-center gap-1.5 ${
              hardwareScenario.pressureSensorOffline
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/50'
                : 'bg-polar-900 text-slate-300 border-polar-border hover:border-slate-600'
            }`}
          >
            <Cpu className={`w-3 h-3 ${hardwareScenario.pressureSensorOffline ? 'text-purple-400' : 'text-slate-400'}`} />
            <span>3. SENSOR FAULT (QUALITY DEGRADED)</span>
            {hardwareScenario.pressureSensorOffline && <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />}
          </button>

          {/* Scenario 4: Edge Disconnect */}
          <button
            onClick={() => toggleHardwareScenario('edgeGatewayDisconnected')}
            className={`px-2.5 py-1 rounded border font-semibold transition-all flex items-center gap-1.5 ${
              hardwareScenario.edgeGatewayDisconnected
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                : 'bg-polar-900 text-slate-300 border-polar-border hover:border-slate-600'
            }`}
          >
            {hardwareScenario.edgeGatewayDisconnected ? (
              <WifiOff className="w-3 h-3 text-rose-400 animate-pulse" />
            ) : (
              <Wifi className="w-3 h-3 text-slate-400" />
            )}
            <span>4. SATCOM DISCONNECT (LOCAL EDGE ACTIVE)</span>
          </button>
        </div>
      </div>

      {/* 4. Tab 1: Spatial CAD Blueprint View */}
      {viewMode === 'blueprint' && (
        <div className="space-y-4">
          {/* Subsystem Filters & Thermal/Energy Flow Toggles */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-polar-900/60 p-2.5 rounded-xl border border-polar-border">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold mr-1">Layer:</span>
              {(['all', 'energy', 'hvac', 'water', 'comms'] as const).map(layer => (
                <button
                  key={layer}
                  onClick={() => setActiveLayer(layer)}
                  className={`px-2.5 py-1 rounded uppercase text-[10px] font-semibold transition-all ${
                    activeLayer === layer
                      ? 'bg-cyan-400 text-polar-950 font-bold'
                      : 'text-slate-400 hover:text-white bg-polar-900'
                  }`}
                >
                  {layer}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 text-[10px]">
              <button
                onClick={() => setShowThermalFlow(!showThermalFlow)}
                className={`px-2.5 py-1 rounded border transition-all ${
                  showThermalFlow 
                    ? 'bg-sky-500/20 text-sky-300 border-sky-400/40' 
                    : 'bg-polar-900 text-slate-500 border-polar-border'
                }`}
              >
                Thermal Loop: {showThermalFlow ? 'ON' : 'OFF'}
              </button>
              <button
                onClick={() => setShowEnergyFlow(!showEnergyFlow)}
                className={`px-2.5 py-1 rounded border transition-all ${
                  showEnergyFlow 
                    ? 'bg-amber-500/20 text-amber-300 border-amber-400/40' 
                    : 'bg-polar-900 text-slate-500 border-polar-border'
                }`}
              >
                Energy Flow: {showEnergyFlow ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          {/* Main 2D Spatial Twin Canvas + Asset Telemetry Inspector */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-3">
              <StationTwin2D
                stationId={metadata.stationId}
                assets={filteredAssets}
                selectedAssetId={selectedAssetId}
                onSelectAsset={(id) => {
                  setSelectedAssetId(id);
                  setSelectedHardwareNodeId(id);
                }}
                showThermalFlow={showThermalFlow}
                showEnergyFlow={showEnergyFlow}
              />

              <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
                <span>Click any engineering node above (GEN #1, GEN #2, BESS, HVAC, PUMP, RO, FUEL, SATCOM) to open Hardware Inspector</span>
                <button
                  onClick={() => {
                    setSelectedAssetId(infrastructure.assets[0]?.assetId || null);
                    setSelectedHardwareNodeId(null);
                  }}
                  className="px-2.5 py-1 rounded bg-polar-900 hover:bg-polar-800 text-cyan-300 text-[11px] border border-polar-border flex items-center gap-1 font-semibold transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset Selection
                </button>
              </div>
            </div>

            {/* Selected Asset Quick Inspector */}
            <div className="polar-card p-5 rounded-xl flex flex-col justify-between space-y-4 font-mono text-xs border border-polar-border">
              <div className="border-b border-white/10 pb-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-cyan-400">Subsystem Quick View</span>
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

              {/* Subsystem Health Score */}
              <div className="bg-polar-900 p-3 rounded-lg border border-polar-border flex justify-between items-center">
                <span className="text-slate-400">Calculated Health Score:</span>
                <span className={`text-base font-bold ${
                  selectedAsset.health >= 80 ? 'text-emerald-400' : selectedAsset.health >= 50 ? 'text-amber-400' : 'text-rose-400'
                }`}>
                  {selectedAsset.health}%
                </span>
              </div>

              {/* Live Sensor Metrics */}
              <div className="space-y-2 flex-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                  Telemetry Readings
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
              </div>

              {/* Action Button to launch Full Hardware Inspector */}
              <button
                onClick={() => setSelectedHardwareNodeId(selectedAsset.assetId)}
                className="w-full py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 font-bold text-xs transition-all flex items-center justify-center gap-2"
              >
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span>Launch Hardware Inspector</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Tab 2: Hardware Telemetry Network Matrix */}
      {viewMode === 'telemetry' && (
        <TelemetryPanel 
          onSelectDevice={(deviceId) => setSelectedHardwareNodeId(deviceId)}
        />
      )}

      {/* 6. Tab 3: Edge Gateway Telemetry */}
      {viewMode === 'gateway' && (
        <EdgeGatewayPanel />
      )}

      {/* 7. Tab 4: Operator Command & Actuator Layer */}
      {viewMode === 'commands' && (
        <CommandPanel />
      )}

      {/* 8. Slide-over Hardware Inspector Modal */}
      {selectedHardwareNodeId && (
        <HardwareInspector 
          nodeId={selectedHardwareNodeId}
          onClose={() => setSelectedHardwareNodeId(null)}
        />
      )}
    </div>
  );
}
