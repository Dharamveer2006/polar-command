'use client';

import React, { useState } from 'react';
import { 
  X, 
  Cpu, 
  Zap, 
  Activity, 
  Thermometer, 
  Gauge, 
  Clock, 
  ShieldCheck, 
  Play, 
  Square, 
  RotateCcw, 
  Lock, 
  AlertTriangle, 
  CheckCircle2, 
  Radio, 
  Battery, 
  Droplets,
  Fuel,
  Power
} from 'lucide-react';
import { useStation } from '@/context/StationContext';
import { HardwareCommandType } from '@/lib/hardware/types';
import ProvenanceBadge from '@/components/common/ProvenanceBadge';

interface HardwareInspectorProps {
  nodeId: string | null;
  onClose: () => void;
}

export default function HardwareInspector({ nodeId, onClose }: HardwareInspectorProps) {
  const { 
    currentStationId, 
    currentUser, 
    spatialHardwareNodes, 
    hardwareSimulator, 
    dispatchHardwareCommand,
    hardwareScenario
  } = useStation();

  const [commandLoading, setCommandLoading] = useState<string | null>(null);
  const [commandFeedback, setCommandFeedback] = useState<{ msg: string; isError?: boolean } | null>(null);
  const [forceActuatorTrip, setForceActuatorTrip] = useState<boolean>(false);

  if (!nodeId) return null;

  const node = spatialHardwareNodes.find(n => n.nodeId === nodeId || n.deviceId === nodeId || n.assetId === nodeId);
  if (!node) return null;

  // Fetch detailed models based on node category and device
  const isBharati = currentStationId === 'bharati';
  const isGen1 = node.deviceId.includes('GEN-01');
  const isGen2 = node.deviceId.includes('GEN-02');
  const isPump = node.deviceId.includes('PUMP') || node.category === 'INFRASTRUCTURE' && node.name.includes('Water');
  const isBess = node.deviceId.includes('BESS');
  const isFuel = node.deviceId.includes('FUEL');

  const genModel = (isGen1 || isGen2) ? hardwareSimulator.getGeneratorModel(isGen1 ? 1 : 2) : null;
  const pumpModel = isPump ? hardwareSimulator.getPumpModel() : null;
  const bessModel = isBess ? hardwareSimulator.getBessModel() : null;

  const handleCommand = async (cmd: HardwareCommandType) => {
    setCommandLoading(cmd);
    setCommandFeedback(null);
    try {
      const res = await dispatchHardwareCommand({
        deviceId: node.deviceId,
        assetId: node.assetId,
        command: cmd,
        forceActuatorFailure: forceActuatorTrip
      });

      if (res.success) {
        setCommandFeedback({ msg: res.message });
      } else {
        setCommandFeedback({ msg: res.message, isError: true });
      }
    } catch (e: any) {
      setCommandFeedback({ msg: e.message || 'Execution error', isError: true });
    } finally {
      setCommandLoading(null);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[460px] bg-[#0A131F] border-l border-cyan-500/30 shadow-2xl p-6 overflow-y-auto font-mono text-xs text-slate-200 backdrop-blur-md">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            <Cpu className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white uppercase text-sm tracking-wide">{node.deviceId}</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-700">
                {node.protocol}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-sans">{node.name}</span>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Status Bar */}
      <div className="mt-4 p-3 rounded-lg bg-polar-900 border border-polar-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${node.status === 'ONLINE' ? 'bg-emerald-400 animate-pulse' : (node.status === 'WARNING' ? 'bg-amber-400 animate-pulse' : 'bg-rose-500')}`} />
          <span className="font-bold uppercase tracking-wider text-white">
            {node.status === 'ONLINE' ? 'RUNNING / NOMINAL' : (node.status === 'WARNING' ? 'DEGRADED / ADVISORY' : 'OFFLINE / TRIP')}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px]">
          <span className="text-slate-400">EDGE LINK:</span>
          <span className={`font-semibold ${node.edgeLink === 'CONNECTED' ? 'text-emerald-400' : 'text-rose-400'}`}>
            ● {node.edgeLink}
          </span>
        </div>
      </div>

      {/* Data Provenance Badge */}
      <div className="mt-2.5 flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
          <span>DATA PROVENANCE:</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
            SIMULATED SENSOR (SIH PROTO)
          </span>
        </div>
        <span className="text-[10px] text-slate-500">Last packet: 8s ago</span>
      </div>

      {/* Main Engineering Readouts */}
      <div className="mt-5 space-y-4">
        {/* GENERATOR DETAILED INSPECTION */}
        {genModel && (
          <div className="space-y-3">
            <div className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>Caterpillar CAT 275kVA Marine Genset Telemetry</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-2.5 rounded bg-polar-900 border border-polar-border">
                <span className="text-[10px] text-slate-400 uppercase">CAPACITY</span>
                <p className="text-sm font-bold text-white mt-0.5">{genModel.capacityKw} kW</p>
              </div>

              <div className="p-2.5 rounded bg-polar-900 border border-polar-border">
                <span className="text-[10px] text-slate-400 uppercase">OUTPUT</span>
                <p className={`text-sm font-bold mt-0.5 ${genModel.currentOutputKw > 0 ? 'text-emerald-300' : 'text-slate-400'}`}>
                  {genModel.currentOutputKw} kW
                </p>
              </div>

              <div className="p-2.5 rounded bg-polar-900 border border-polar-border">
                <span className="text-[10px] text-slate-400 uppercase">LOAD FACTOR</span>
                <p className="text-sm font-bold text-white mt-0.5">{genModel.loadPercent}%</p>
              </div>

              <div className="p-2.5 rounded bg-polar-900 border border-polar-border">
                <span className="text-[10px] text-slate-400 uppercase">COOLANT TEMP</span>
                <p className={`text-sm font-bold mt-0.5 ${genModel.coolantTempC > 88 ? 'text-rose-400' : 'text-white'}`}>
                  {genModel.coolantTempC}°C
                </p>
              </div>

              <div className="p-2.5 rounded bg-polar-900 border border-polar-border">
                <span className="text-[10px] text-slate-400 uppercase">OIL PRESSURE</span>
                <p className="text-sm font-bold text-white mt-0.5">{genModel.oilPressureBar} bar</p>
              </div>

              <div className="p-2.5 rounded bg-polar-900 border border-polar-border">
                <span className="text-[10px] text-slate-400 uppercase">VIBRATION</span>
                <p className={`text-sm font-bold mt-0.5 ${genModel.vibrationMmS > 2.5 ? 'text-amber-400' : 'text-white'}`}>
                  {genModel.vibrationMmS} mm/s
                </p>
              </div>

              <div className="p-2.5 rounded bg-polar-900 border border-polar-border">
                <span className="text-[10px] text-slate-400 uppercase">FUEL RATE</span>
                <p className="text-sm font-bold text-white mt-0.5">{genModel.fuelRateLph} L/h</p>
              </div>

              <div className="p-2.5 rounded bg-polar-900 border border-polar-border">
                <span className="text-[10px] text-slate-400 uppercase">RUNTIME HOURS</span>
                <p className="text-sm font-bold text-white mt-0.5">{genModel.runtimeHours} h</p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-800/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-cyan-300 uppercase font-semibold">CALCULATED HEALTH SCORE</span>
                <p className="text-xs text-slate-400 mt-0.5">Fusion of oil pressure, coolant, vibration & load</p>
              </div>
              <span className={`text-lg font-bold ${genModel.health > 80 ? 'text-emerald-400' : (genModel.health > 50 ? 'text-amber-400' : 'text-rose-400')}`}>
                {genModel.health}%
              </span>
            </div>
          </div>
        )}

        {/* PUMP DETAILED INSPECTION */}
        {pumpModel && (
          <div className="space-y-3">
            <div className="text-[11px] font-bold text-sky-300 uppercase tracking-wider flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5 text-sky-400" />
              <span>Centrifugal Water Extraction Pump Telemetry</span>
            </div>

            {/* Explainable alert banner if degradation detected */}
            {pumpModel.alertExplanation && (
              <div className="p-2.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-200 text-[11px] leading-relaxed">
                <div className="flex items-center gap-1.5 font-bold text-amber-300 mb-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Explainable Multi-Sensor Anomaly:</span>
                </div>
                {pumpModel.alertExplanation}
              </div>
            )}

            {/* Sensor failure warning if pressure sensor offline */}
            {pumpModel.dataQuality === 'UNKNOWN' && (
              <div className="p-2.5 rounded bg-rose-500/20 border border-rose-500/40 text-rose-200 text-[11px]">
                <span className="font-bold">INSTRUMENTATION SENSOR FAULT:</span> Pressure sensor offline. Mechanical health is UNKNOWN (Quality Degraded).
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-2.5 rounded bg-polar-900 border border-polar-border">
                <span className="text-[10px] text-slate-400 uppercase">FLOW RATE</span>
                <p className="text-sm font-bold text-white mt-0.5">{pumpModel.flowRateLpm} Lpm</p>
              </div>

              <div className="p-2.5 rounded bg-polar-900 border border-polar-border">
                <span className="text-[10px] text-slate-400 uppercase">DISCHARGE PRESSURE</span>
                <p className={`text-sm font-bold mt-0.5 ${pumpModel.dataQuality === 'UNKNOWN' ? 'text-rose-400' : 'text-white'}`}>
                  {pumpModel.dataQuality === 'UNKNOWN' ? 'OFFLINE' : `${pumpModel.pressureBar.toFixed(1)} bar`}
                </p>
              </div>

              <div className="p-2.5 rounded bg-polar-900 border border-polar-border">
                <span className="text-[10px] text-slate-400 uppercase">VIBRATION (ISO 10816)</span>
                <p className={`text-sm font-bold mt-0.5 ${pumpModel.vibrationMmS > 4.0 ? 'text-rose-400' : (pumpModel.vibrationMmS > 2.5 ? 'text-amber-400' : 'text-white')}`}>
                  {pumpModel.vibrationMmS.toFixed(1)} mm/s
                </p>
              </div>

              <div className="p-2.5 rounded bg-polar-900 border border-polar-border">
                <span className="text-[10px] text-slate-400 uppercase">BEARING TEMP</span>
                <p className={`text-sm font-bold mt-0.5 ${pumpModel.bearingTempC > 60 ? 'text-rose-400' : 'text-white'}`}>
                  {pumpModel.bearingTempC.toFixed(1)}°C
                </p>
              </div>

              <div className="p-2.5 rounded bg-polar-900 border border-polar-border">
                <span className="text-[10px] text-slate-400 uppercase">RUNTIME HOURS</span>
                <p className="text-sm font-bold text-white mt-0.5">{pumpModel.runtimeHours} h</p>
              </div>

              <div className="p-2.5 rounded bg-polar-900 border border-polar-border">
                <span className="text-[10px] text-slate-400 uppercase">DATA QUALITY</span>
                <p className={`text-sm font-bold mt-0.5 ${pumpModel.dataQuality === 'GOOD' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {pumpModel.dataQuality}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-sky-950/40 border border-sky-800/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-sky-300 uppercase font-semibold">PUMP HEALTH SCORE</span>
                <p className="text-xs text-slate-400 mt-0.5">ISO 10816 vibration + pressure curve correlation</p>
              </div>
              <span className={`text-lg font-bold ${pumpModel.health > 80 ? 'text-emerald-400' : (pumpModel.health > 50 ? 'text-amber-400' : (pumpModel.health === 0 ? 'text-slate-400' : 'text-rose-400'))}`}>
                {pumpModel.health === 0 ? 'UNKNOWN' : `${pumpModel.health}%`}
              </span>
            </div>
          </div>
        )}

        {/* BESS DETAILED INSPECTION */}
        {bessModel && (
          <div className="space-y-3">
            <div className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
              <Battery className="w-3.5 h-3.5 text-emerald-400" />
              <span>Microgrid BESS Battery Management System</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-2.5 rounded bg-polar-900 border border-polar-border">
                <span className="text-[10px] text-slate-400 uppercase">STATE OF CHARGE (SOC)</span>
                <p className="text-sm font-bold text-white mt-0.5">{bessModel.socPercent}%</p>
              </div>

              <div className="p-2.5 rounded bg-polar-900 border border-polar-border">
                <span className="text-[10px] text-slate-400 uppercase">BUS VOLTAGE</span>
                <p className="text-sm font-bold text-white mt-0.5">{bessModel.voltageV} V DC</p>
              </div>

              <div className="p-2.5 rounded bg-polar-900 border border-polar-border">
                <span className="text-[10px] text-slate-400 uppercase">CURRENT</span>
                <p className="text-sm font-bold text-white mt-0.5">{bessModel.currentA} A</p>
              </div>

              <div className="p-2.5 rounded bg-polar-900 border border-polar-border">
                <span className="text-[10px] text-slate-400 uppercase">ACTIVE POWER</span>
                <p className={`text-sm font-bold mt-0.5 ${bessModel.powerKw < 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {bessModel.powerKw} kW ({bessModel.chargeDischargeState})
                </p>
              </div>

              <div className="p-2.5 rounded bg-polar-900 border border-polar-border">
                <span className="text-[10px] text-slate-400 uppercase">AVAILABLE ENERGY</span>
                <p className="text-sm font-bold text-white mt-0.5">{bessModel.availableEnergyKwh} kWh</p>
              </div>

              <div className="p-2.5 rounded bg-polar-900 border border-polar-border">
                <span className="text-[10px] text-slate-400 uppercase">CELL TEMPERATURE</span>
                <p className="text-sm font-bold text-white mt-0.5">{bessModel.cellTempC}°C</p>
              </div>
            </div>
          </div>
        )}

        {/* GENERIC NODE VIEW (HVAC, RO, FUEL, SATCOM) */}
        {!genModel && !pumpModel && !bessModel && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-2.5 rounded bg-polar-900 border border-polar-border">
                <span className="text-[10px] text-slate-400 uppercase">{node.primaryMetric}</span>
                <p className="text-sm font-bold text-white mt-0.5">{node.primaryValue}</p>
              </div>

              {node.subMetric && (
                <div className="p-2.5 rounded bg-polar-900 border border-polar-border">
                  <span className="text-[10px] text-slate-400 uppercase">{node.subMetric}</span>
                  <p className="text-sm font-bold text-white mt-0.5">{node.subValue}</p>
                </div>
              )}

              <div className="p-2.5 rounded bg-polar-900 border border-polar-border">
                <span className="text-[10px] text-slate-400 uppercase">ESTIMATED HEALTH</span>
                <p className="text-sm font-bold text-emerald-400 mt-0.5">{node.health}%</p>
              </div>

              <div className="p-2.5 rounded bg-polar-900 border border-polar-border">
                <span className="text-[10px] text-slate-400 uppercase">FIELDBUS PROTOCOL</span>
                <p className="text-sm font-bold text-cyan-300 mt-0.5">{node.protocol}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* OPERATOR COMMAND / ACTUATOR CONSOLE (Requirement 18 & 21) */}
      <div className="mt-6 pt-5 border-t border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-cyan-300 font-bold uppercase tracking-wider text-[11px]">
            <Power className="w-3.5 h-3.5 text-cyan-400" />
            <span>Industrial Operator Commands</span>
          </div>
          <span className="text-[10px] text-slate-400">RBAC: {currentUser.role}</span>
        </div>

        {/* Demo Toggle: Force Actuator Failure */}
        <label className="flex items-center gap-2 text-[10px] text-slate-400 cursor-pointer select-none bg-polar-900/60 p-2 rounded border border-polar-border">
          <input 
            type="checkbox" 
            checked={forceActuatorTrip} 
            onChange={(e) => setForceActuatorTrip(e.target.checked)}
            className="rounded border-slate-700 text-cyan-500 focus:ring-0"
          />
          <span>Demo Scenario: Simulate Actuator Contactor Trip (Fail to Execute)</span>
        </label>

        {/* Command Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleCommand('START')}
            disabled={commandLoading !== null}
            className="px-2.5 py-2 rounded bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 border border-emerald-500/40 font-bold text-[10px] flex items-center justify-center gap-1 transition-all disabled:opacity-50"
          >
            <Play className="w-3 h-3 text-emerald-400" />
            <span>START</span>
          </button>

          <button
            onClick={() => handleCommand('STOP')}
            disabled={commandLoading !== null}
            className="px-2.5 py-2 rounded bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 border border-rose-500/40 font-bold text-[10px] flex items-center justify-center gap-1 transition-all disabled:opacity-50"
          >
            <Square className="w-3 h-3 text-rose-400" />
            <span>STOP</span>
          </button>

          <button
            onClick={() => handleCommand('RESET_FAULT')}
            disabled={commandLoading !== null}
            className="px-2.5 py-2 rounded bg-amber-600/30 hover:bg-amber-600/50 text-amber-200 border border-amber-500/40 font-bold text-[10px] flex items-center justify-center gap-1 transition-all disabled:opacity-50"
          >
            <RotateCcw className="w-3 h-3 text-amber-400" />
            <span>RESET FAULT</span>
          </button>

          <button
            onClick={() => handleCommand('ACKNOWLEDGE')}
            disabled={commandLoading !== null}
            className="px-2.5 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-[10px] flex items-center justify-center gap-1 transition-all disabled:opacity-50"
          >
            <CheckCircle2 className="w-3 h-3 text-cyan-400" />
            <span>ACKNOWLEDGE</span>
          </button>

          <button
            onClick={() => handleCommand('ISOLATE')}
            disabled={commandLoading !== null}
            className="px-2.5 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-[10px] flex items-center justify-center gap-1 transition-all disabled:opacity-50"
          >
            <Lock className="w-3 h-3 text-amber-400" />
            <span>ISOLATE</span>
          </button>

          <button
            onClick={() => handleCommand('ENTER_SAFE_MODE')}
            disabled={commandLoading !== null}
            className="px-2.5 py-2 rounded bg-cyan-900/40 hover:bg-cyan-900/60 text-cyan-200 border border-cyan-700/50 font-bold text-[10px] flex items-center justify-center gap-1 transition-all disabled:opacity-50"
          >
            <ShieldCheck className="w-3 h-3 text-cyan-400" />
            <span>SAFE MODE</span>
          </button>
        </div>

        {/* Feedback Display */}
        {commandFeedback && (
          <div className={`p-2.5 rounded text-[11px] leading-relaxed border ${commandFeedback.isError ? 'bg-rose-500/20 border-rose-500/40 text-rose-200' : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200'}`}>
            <span className="font-bold">{commandFeedback.isError ? 'ACTION REJECTED / FAILED: ' : 'COMMAND DISPATCHED: '}</span>
            {commandFeedback.msg}
          </div>
        )}
      </div>
    </div>
  );
}
