'use client';

import React, { useState } from 'react';
import { 
  Terminal, 
  Power, 
  Play, 
  Square, 
  RotateCcw, 
  Lock, 
  ShieldCheck, 
  CheckCircle2, 
  AlertOctagon, 
  Clock, 
  User as UserIcon,
  Cpu,
  ArrowRight
} from 'lucide-react';
import { useStation } from '@/context/StationContext';
import { HardwareCommandType, CommandPacket } from '@/lib/hardware/types';

export default function CommandPanel() {
  const { 
    currentStationId, 
    currentUser, 
    spatialHardwareNodes, 
    dispatchHardwareCommand, 
    commandHistory 
  } = useStation();

  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(
    spatialHardwareNodes[0]?.deviceId || 'BHR-GEN-01'
  );
  const [selectedCommand, setSelectedCommand] = useState<HardwareCommandType>('START');
  const [forceActuatorFailure, setForceActuatorFailure] = useState<boolean>(false);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ msg: string; isError?: boolean } | null>(null);

  const targetNode = spatialHardwareNodes.find(n => n.deviceId === selectedDeviceId) || spatialHardwareNodes[0];

  const handleExecute = async () => {
    setIsExecuting(true);
    setFeedback(null);
    try {
      const res = await dispatchHardwareCommand({
        deviceId: selectedDeviceId,
        assetId: targetNode?.assetId || 'gen-1',
        command: selectedCommand,
        forceActuatorFailure
      });

      if (res.success) {
        setFeedback({ msg: res.message });
      } else {
        setFeedback({ msg: res.message, isError: true });
      }
    } catch (e: any) {
      setFeedback({ msg: e.message || 'Execution failed', isError: true });
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="space-y-5 font-mono text-xs text-slate-200">
      {/* Dispatcher Form */}
      <div className="p-5 rounded-xl bg-[#091524] border border-cyan-500/20 space-y-4 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              <Terminal className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <span className="font-bold text-white uppercase text-sm">Industrial Operator Command Dispatcher</span>
              <p className="text-[11px] text-slate-400 font-sans">
                Station ICS actuator setpoint control with cryptographic command audit trail.
              </p>
            </div>
          </div>
          <div className="text-[11px] px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
            Operator: <span className="font-bold text-cyan-300">{currentUser.name}</span> ({currentUser.role})
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Target Equipment Selector */}
          <div>
            <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1.5">
              TARGET FIELD EQUIPMENT
            </label>
            <select
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              className="w-full bg-polar-900 border border-polar-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
            >
              {spatialHardwareNodes.map(n => (
                <option key={n.deviceId} value={n.deviceId}>
                  {n.deviceId} — {n.name} ({n.protocol})
                </option>
              ))}
            </select>
          </div>

          {/* Action Selector */}
          <div>
            <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1.5">
              COMMAND ACTION
            </label>
            <select
              value={selectedCommand}
              onChange={(e) => setSelectedCommand(e.target.value as HardwareCommandType)}
              className="w-full bg-polar-900 border border-polar-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
            >
              <option value="START">START (Energize Equipment / Close Contactor)</option>
              <option value="STOP">STOP (De-energize / Controlled Shutdown)</option>
              <option value="RESET_FAULT">RESET FAULT (Clear Trip & Diagnostic Interlocks)</option>
              <option value="ACKNOWLEDGE">ACKNOWLEDGE (Confirm Operator Advisory)</option>
              <option value="ISOLATE">ISOLATE (Trip Lockout Tagout Bus)</option>
              <option value="ENTER_SAFE_MODE">ENTER SAFE MODE (Load Shedding Preset)</option>
            </select>
          </div>
        </div>

        {/* Actuator Failure Simulation Checkbox (Requirement 21) */}
        <div className="p-3 rounded-lg bg-polar-900/80 border border-polar-border flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={forceActuatorFailure}
              onChange={(e) => setForceActuatorFailure(e.target.checked)}
              className="rounded border-slate-700 text-cyan-500 focus:ring-0"
            />
            <span className="text-[11px] text-slate-300">
              Simulate Actuator Contactor Jam (Demonstrates <strong className="text-amber-300">COMMAND SENT vs EXECUTED</strong> fault)
            </span>
          </label>
          <span className="text-[10px] text-slate-500">Requirement 21</span>
        </div>

        {/* Dispatch Button & Feedback */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <button
            onClick={handleExecute}
            disabled={isExecuting}
            className="px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-polar-950 font-extrabold text-xs transition-all flex items-center gap-2 shadow-lg disabled:opacity-50"
          >
            <Power className="w-4 h-4" />
            <span>{isExecuting ? 'Transmitting Field Command...' : 'TRANSMIT INDUSTRIAL COMMAND'}</span>
          </button>
        </div>

        {feedback && (
          <div className={`p-3 rounded-lg text-[11px] leading-relaxed border ${feedback.isError ? 'bg-rose-500/20 border-rose-500/40 text-rose-200' : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200'}`}>
            <span className="font-bold">{feedback.isError ? 'ACTUATOR ANOMALY / PERMISSION DENIED: ' : 'EXECUTION CONFIRMED: '}</span>
            {feedback.msg}
          </div>
        )}
      </div>

      {/* Command Audit Log */}
      <div className="bg-[#0B1726] border border-polar-border rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-white uppercase text-xs">Command Execution Audit Trail</span>
          </div>
          <span className="text-[10px] text-slate-400">{commandHistory.length} Recorded Transmissions</span>
        </div>

        <div className="space-y-2">
          {commandHistory.slice(0, 8).map((cmd) => {
            const isExecuted = cmd.status === 'EXECUTED';
            const isFailed = cmd.status === 'FAILED';
            const isPending = cmd.status === 'SENT' || cmd.status === 'ACKNOWLEDGED' || cmd.status === 'QUEUED';

            return (
              <div 
                key={cmd.commandId}
                className="p-3 rounded-lg bg-polar-900 border border-polar-border flex flex-wrap items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    isExecuted 
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : (isFailed 
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : 'bg-amber-950 text-amber-300 border border-amber-800')
                  }`}>
                    {cmd.status}
                  </span>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{cmd.command}</span>
                      <span className="text-slate-400">→</span>
                      <span className="text-cyan-300 font-bold">{cmd.deviceId}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-sans mt-0.5">
                      Operator: {cmd.operator} ({cmd.operatorRole}) • ID: {cmd.commandId}
                    </div>
                  </div>
                </div>

                <div className="text-right text-[10px] text-slate-400">
                  <div>{new Date(cmd.timestamp).toLocaleTimeString()}</div>
                  {cmd.failureReason && (
                    <div className="text-rose-400 font-bold max-w-xs truncate">{cmd.failureReason}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
