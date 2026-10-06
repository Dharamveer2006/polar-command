'use client';

import React, { useState } from 'react';
import { 
  Wifi, 
  WifiOff, 
  Cpu, 
  RefreshCw, 
  HardDrive, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Activity, 
  Radio, 
  Server,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useStation } from '@/context/StationContext';

interface EdgeGatewayPanelProps {
  onClose?: () => void;
}

export default function EdgeGatewayPanel({ onClose }: EdgeGatewayPanelProps) {
  const { 
    currentStationId, 
    edgeGateway, 
    toggleHardwareScenario, 
    hardwareScenario,
    syncEdgeGateway
  } = useStation();

  const [syncing, setSyncing] = useState<boolean>(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const isDisconnected = edgeGateway.connectionState !== 'CONNECTED';

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await syncEdgeGateway();
      setSyncResult(`Reconnection successful! Synced ${res.syncedPacketsCount} buffered packets and ${res.executedCommandsCount} queued commands.`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="p-5 bg-[#0A1422] border border-cyan-500/30 rounded-xl space-y-5 font-mono text-xs text-slate-200 shadow-xl">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            <Server className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm uppercase tracking-wide">{edgeGateway.gatewayId}</span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                {edgeGateway.firmwareVersion}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-sans">{edgeGateway.name}</span>
          </div>
        </div>

        {/* State Badge */}
        <div className="flex items-center gap-2">
          {edgeGateway.localControlActive ? (
            <div className="px-2.5 py-1 rounded bg-amber-500/20 border border-amber-500/50 text-amber-300 font-bold flex items-center gap-1.5 animate-pulse">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>LOCAL CONTROL ACTIVE</span>
            </div>
          ) : (
            <div className="px-2.5 py-1 rounded bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>GATEWAY CONNECTED</span>
            </div>
          )}
        </div>
      </div>

      {/* Grid of Key Gateway Telemetry Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg bg-polar-900 border border-polar-border">
          <span className="text-[10px] text-slate-400 uppercase">FIELD DEVICES</span>
          <p className="text-sm font-bold text-white mt-1">
            {edgeGateway.devicesConnected}/{edgeGateway.totalDevices} ONLINE
          </p>
          <span className="text-[10px] text-emerald-400">96.3% availability</span>
        </div>

        <div className="p-3 rounded-lg bg-polar-900 border border-polar-border">
          <span className="text-[10px] text-slate-400 uppercase">PACKET LOSS</span>
          <p className={`text-sm font-bold mt-1 ${edgeGateway.packetLossPercent > 5 ? 'text-rose-400' : 'text-cyan-300'}`}>
            {edgeGateway.packetLossPercent}%
          </p>
          <span className="text-[10px] text-slate-400">SATCOM / HF link</span>
        </div>

        <div className="p-3 rounded-lg bg-polar-900 border border-polar-border">
          <span className="text-[10px] text-slate-400 uppercase">BUFFERED PACKETS</span>
          <p className={`text-sm font-bold mt-1 ${edgeGateway.bufferedPackets.length > 0 ? 'text-amber-300' : 'text-white'}`}>
            {edgeGateway.bufferedPackets.length} PKTS
          </p>
          <span className="text-[10px] text-slate-400">Local flash ring buffer</span>
        </div>

        <div className="p-3 rounded-lg bg-polar-900 border border-polar-border">
          <span className="text-[10px] text-slate-400 uppercase">QUEUED COMMANDS</span>
          <p className={`text-sm font-bold mt-1 ${edgeGateway.queuedCommands.length > 0 ? 'text-amber-300' : 'text-white'}`}>
            {edgeGateway.queuedCommands.length} CMDS
          </p>
          <span className="text-[10px] text-slate-400">On-premise queue</span>
        </div>
      </div>

      {/* Protocols & Local Storage Architecture */}
      <div className="p-3.5 rounded-lg bg-polar-900/60 border border-polar-border space-y-2">
        <div className="text-[11px] font-bold text-cyan-300 uppercase flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span>Multi-Protocol Ingestion Engines</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {edgeGateway.protocols.map(p => (
            <span key={p} className="px-2 py-0.5 rounded bg-slate-800/90 text-cyan-300 border border-slate-700 text-[10px]">
              {p}
            </span>
          ))}
        </div>
      </div>

      {/* Disconnection Warning & Sync Actions */}
      {isDisconnected && (
        <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>SATCOM UPLINK SEVERED • ON-PREMISE AUTONOMOUS CONTROLLER ACTIVE</span>
          </div>
          <p className="leading-relaxed font-sans text-[11px]">
            The edge gateway is buffering live sensor telemetry packets to NVRAM while executing local thermal/microgrid safety interlocks. All operator actions are placed in the secure edge queue.
          </p>
        </div>
      )}

      {/* Sync Feedback */}
      {syncResult && (
        <div className="p-3 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{syncResult}</span>
        </div>
      )}

      {/* Controls: Simulation Toggle & Manual Sync */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <button
          onClick={() => toggleHardwareScenario('edgeGatewayDisconnected')}
          className={`px-3 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 border ${
            hardwareScenario.edgeGatewayDisconnected
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
              : 'bg-rose-500/10 text-rose-300 border-rose-500/30 hover:bg-rose-500/20'
          }`}
        >
          {hardwareScenario.edgeGatewayDisconnected ? (
            <>
              <Wifi className="w-3.5 h-3.5 text-amber-400" />
              <span>Restore SATCOM Link</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5 text-rose-400" />
              <span>Simulate SATCOM Disconnect</span>
            </>
          )}
        </button>

        <button
          onClick={handleSync}
          disabled={syncing}
          className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-polar-950 font-extrabold text-xs transition-all flex items-center gap-1.5 shadow-md disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
          <span>{syncing ? 'Reconciling Buffers...' : 'Sync Edge Telemetry & Reconnect'}</span>
        </button>
      </div>
    </div>
  );
}
