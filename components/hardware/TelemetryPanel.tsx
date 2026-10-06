'use client';

import React, { useState } from 'react';
import { 
  Activity, 
  Search, 
  Filter, 
  Cpu, 
  Wifi, 
  WifiOff, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Layers,
  ArrowUpDown,
  ExternalLink
} from 'lucide-react';
import { useStation } from '@/context/StationContext';
import { HardwareCategory, SensorDevice } from '@/lib/hardware/types';

interface TelemetryPanelProps {
  onSelectDevice?: (deviceId: string) => void;
}

export default function TelemetryPanel({ onSelectDevice }: TelemetryPanelProps) {
  const { 
    currentStationId, 
    hardwareSimulator, 
    hardwareNetwork, 
    edgeGateway,
    toggleHardwareScenario,
    hardwareScenario
  } = useStation();

  const [activeTab, setActiveTab] = useState<'ALL' | HardwareCategory>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const sensors = hardwareSimulator.getAllSensors();

  const filteredSensors = sensors.filter(s => {
    if (activeTab !== 'ALL' && s.category !== activeTab) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        s.deviceId.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.sensorType.toLowerCase().includes(q) ||
        s.protocol.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Network Header Summary (Requirement 16) */}
      <div className="p-4 rounded-xl bg-[#091524] border border-cyan-500/20 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold uppercase text-[10px]">
              Subsystem Link Matrix
            </span>
            <span className="text-slate-400 font-bold uppercase tracking-wider">
              HARDWARE TELEMETRY NETWORK • {currentStationId.toUpperCase()}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-sans">
            Real-time physical fieldbus instrumentation, telemetry quality metrics, and protocol gateways.
          </p>
        </div>

        {/* Live Counters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-polar-900 border border-polar-border text-center">
            <span className="text-[10px] text-slate-400 uppercase">TOTAL DEVICES</span>
            <p className="text-sm font-bold text-white mt-0.5">{hardwareNetwork.totalDevices} DEVICES</p>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-center">
            <span className="text-[10px] text-emerald-400 uppercase">ONLINE</span>
            <p className="text-sm font-bold text-emerald-300 mt-0.5">{hardwareNetwork.onlineCount} ONLINE</p>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-amber-950/40 border border-amber-800/40 text-center">
            <span className="text-[10px] text-amber-400 uppercase">WARNING</span>
            <p className="text-sm font-bold text-amber-300 mt-0.5">{hardwareNetwork.warningCount} WARNING</p>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-rose-950/40 border border-rose-800/40 text-center">
            <span className="text-[10px] text-rose-400 uppercase">OFFLINE / FAULT</span>
            <p className="text-sm font-bold text-rose-300 mt-0.5">{hardwareNetwork.offlineCount} OFFLINE</p>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-polar-900 border border-polar-border text-center">
            <span className="text-[10px] text-slate-400 uppercase">PACKET LOSS</span>
            <p className={`text-sm font-bold mt-0.5 ${hardwareNetwork.packetLossPercent > 5 ? 'text-rose-400' : 'text-cyan-300'}`}>
              {hardwareNetwork.packetLossPercent}%
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#0B1726] p-3 rounded-xl border border-polar-border">
        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {(['ALL', 'ENVIRONMENT', 'ENERGY', 'INFRASTRUCTURE', 'COMMUNICATION'] as const).map(cat => {
            const count = cat === 'ALL' 
              ? sensors.length 
              : sensors.filter(s => s.category === cat).length;

            return (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                className={`px-3 py-1.5 rounded-lg uppercase text-[10px] font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === cat
                    ? 'bg-cyan-500 text-polar-950 shadow-md font-extrabold'
                    : 'bg-polar-900 text-slate-400 hover:text-white border border-polar-border'
                }`}
              >
                <span>{cat}</span>
                <span className={`px-1 rounded text-[9px] ${activeTab === cat ? 'bg-cyan-900 text-cyan-200' : 'bg-slate-800 text-slate-400'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search device ID, name, protocol..."
            className="w-full bg-polar-900 border border-polar-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </div>
      </div>

      {/* Telemetry Devices Table */}
      <div className="bg-[#0B1726] border border-polar-border rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-polar-900/90 border-b border-white/10 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                <th className="py-3 px-4">DEVICE ID</th>
                <th className="py-3 px-4">SENSOR / INSTRUMENT</th>
                <th className="py-3 px-4">CATEGORY</th>
                <th className="py-3 px-4">PROTOCOL</th>
                <th className="py-3 px-4">LIVE READING</th>
                <th className="py-3 px-4">QUALITY</th>
                <th className="py-3 px-4">STATUS</th>
                <th className="py-3 px-4 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-[11px]">
              {filteredSensors.map((sensor) => {
                const isOnline = sensor.status === 'ONLINE';
                const isWarning = sensor.status === 'WARNING';
                const isOffline = sensor.status === 'OFFLINE' || sensor.status === 'CRITICAL';

                return (
                  <tr 
                    key={sensor.deviceId} 
                    className="hover:bg-cyan-950/20 transition-colors cursor-pointer group"
                    onClick={() => onSelectDevice?.(sensor.deviceId)}
                  >
                    {/* Device ID */}
                    <td className="py-3 px-4 font-bold text-cyan-300">
                      <span className="group-hover:underline">{sensor.deviceId}</span>
                    </td>

                    {/* Sensor Name */}
                    <td className="py-3 px-4 text-white">
                      <div>
                        <span className="font-medium text-slate-200">{sensor.name}</span>
                        <div className="text-[10px] text-slate-500 font-sans">{sensor.sensorType}</div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-polar-900 border border-polar-border text-slate-400 font-semibold">
                        {sensor.category}
                      </span>
                    </td>

                    {/* Protocol */}
                    <td className="py-3 px-4 text-slate-300 font-medium">
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800/80 border border-slate-700 text-cyan-300">
                        {sensor.protocol}
                      </span>
                    </td>

                    {/* Reading */}
                    <td className="py-3 px-4">
                      <span className={`font-bold ${isOffline ? 'text-slate-500' : 'text-white'}`}>
                        {isOffline && sensor.failureMode === 'SENSOR_OFFLINE' ? 'N/A' : `${sensor.lastReading} ${sensor.unit}`}
                      </span>
                    </td>

                    {/* Quality */}
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        sensor.quality === 'GOOD'
                          ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                          : (sensor.quality === 'UNCERTAIN' || sensor.quality === 'DEGRADED')
                          ? 'bg-amber-950/60 text-amber-300 border border-amber-800'
                          : 'bg-rose-950/60 text-rose-300 border border-rose-800'
                      }`}>
                        {sensor.quality}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 font-bold">
                        <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : (isWarning ? 'bg-amber-400' : 'bg-rose-500')}`} />
                        <span className={isOnline ? 'text-emerald-400' : (isWarning ? 'text-amber-400' : 'text-rose-400')}>
                          {sensor.status}
                        </span>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectDevice?.(sensor.deviceId);
                        }}
                        className="px-2 py-1 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold transition-all inline-flex items-center gap-1"
                      >
                        <span>Inspect</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
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
