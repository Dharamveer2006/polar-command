'use client';

import React from 'react';
import { 
  Cpu, 
  Zap, 
  Battery, 
  Droplets, 
  Wind, 
  Fuel, 
  Radio, 
  Wifi, 
  WifiOff, 
  AlertTriangle,
  Activity
} from 'lucide-react';
import { useStation } from '@/context/StationContext';

interface HardwareStatusProps {
  onOpenGateway?: () => void;
  onOpenTelemetry?: () => void;
  className?: string;
}

export default function HardwareStatus({
  onOpenGateway,
  onOpenTelemetry,
  className = ''
}: HardwareStatusProps) {
  const { 
    stationState, 
    hardwareNetwork, 
    edgeGateway, 
    toggleHardwareScenario, 
    hardwareScenario 
  } = useStation();

  const { energy, infrastructure } = stationState;

  // Running generators count
  const runningGens = energy.generators.filter(g => g.status === 'running').length;
  const totalGens = energy.generators.length;

  // Water pump online count
  const waterAssets = infrastructure.assets.filter(a => a.type === 'water_pump' || a.type === 'reverse_osmosis');
  const onlineWater = waterAssets.filter(a => a.status === 'operational' || a.status === 'running').length;

  const isEdgeDisconnected = edgeGateway.connectionState !== 'CONNECTED';

  return (
    <div className={`w-full bg-[#0B1726] border border-cyan-500/20 rounded-xl px-4 py-2.5 shadow-md font-mono text-xs text-slate-300 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Industrial Header & Edge Indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-cyan-950/80 border border-cyan-800/60 text-cyan-300 font-bold tracking-wider text-[11px]">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>ICS HARDWARE TELEMETRY</span>
          </div>

          {/* Local Control Active Badge if disconnected */}
          {edgeGateway.localControlActive ? (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/50 text-amber-300 font-bold text-[10px] animate-pulse">
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              <span>LOCAL CONTROL ACTIVE</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>FIELD BUS ONLINE</span>
            </div>
          )}
        </div>

        {/* Center: Hardware Category Status Counters */}
        <div className="flex flex-wrap items-center gap-2.5 md:gap-4 text-[11px]">
          {/* Genset */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-polar-900 border border-polar-border">
            <Zap className={`w-3.5 h-3.5 ${runningGens < 2 ? 'text-amber-400' : 'text-cyan-400'}`} />
            <span className="text-slate-400">GENSET:</span>
            <span className={`font-bold ${runningGens < 2 ? 'text-amber-300' : 'text-white'}`}>
              {runningGens}/{totalGens} ONLINE
            </span>
          </div>

          {/* BESS */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-polar-900 border border-polar-border">
            <Battery className={`w-3.5 h-3.5 ${energy.batterySoc < 30 ? 'text-rose-400' : 'text-emerald-400'}`} />
            <span className="text-slate-400">BESS:</span>
            <span className={`font-bold ${energy.batterySoc < 30 ? 'text-rose-300' : 'text-emerald-300'}`}>
              {energy.batterySoc}%
            </span>
          </div>

          {/* Water */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-polar-900 border border-polar-border">
            <Droplets className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-slate-400">WATER:</span>
            <span className="font-bold text-white">
              {onlineWater}/{waterAssets.length} ONLINE
            </span>
          </div>

          {/* HVAC */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-polar-900 border border-polar-border">
            <Wind className="w-3.5 h-3.5 text-teal-400" />
            <span className="text-slate-400">HVAC:</span>
            <span className="font-bold text-white">
              {infrastructure.hvacHealth}%
            </span>
          </div>

          {/* Fuel */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-polar-900 border border-polar-border">
            <Fuel className={`w-3.5 h-3.5 ${hardwareScenario.fuelTransferFailure ? 'text-amber-400' : 'text-cyan-400'}`} />
            <span className="text-slate-400">FUEL:</span>
            <span className={`font-bold ${hardwareScenario.fuelTransferFailure ? 'text-amber-300' : 'text-cyan-300'}`}>
              {hardwareScenario.fuelTransferFailure ? 'TRANSFER FAULT' : 'CONNECTED'}
            </span>
          </div>

          {/* Edge Gateway Status */}
          <div 
            onClick={onOpenGateway}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-polar-900 border border-cyan-800/40 cursor-pointer hover:border-cyan-400 transition-colors"
            title="Click to view Edge Gateway telemetry"
          >
            {isEdgeDisconnected ? (
              <WifiOff className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            ) : (
              <Wifi className="w-3.5 h-3.5 text-cyan-400" />
            )}
            <span className="text-slate-400">EDGE:</span>
            <span className={`font-bold ${isEdgeDisconnected ? 'text-rose-400' : 'text-cyan-300'}`}>
              {hardwareNetwork.onlineCount}/{hardwareNetwork.totalDevices} ONLINE
            </span>
            <span className="text-[10px] text-slate-500">({hardwareNetwork.packetLossPercent}% loss)</span>
          </div>
        </div>

        {/* Right: Telemetry Network Inspection link */}
        <div className="flex items-center gap-2">
          {onOpenTelemetry && (
            <button
              onClick={onOpenTelemetry}
              className="px-2.5 py-1 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold uppercase transition-all flex items-center gap-1"
            >
              <Activity className="w-3 h-3 text-cyan-400" />
              <span>Fieldbus Matrix</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
