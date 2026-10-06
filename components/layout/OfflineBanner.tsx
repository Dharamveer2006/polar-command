'use client';

import React from 'react';
import { useStation } from '@/context/StationContext';
import { WifiOff, AlertTriangle, RefreshCw, CheckCircle2, HardDrive, Radio, X } from 'lucide-react';

export default function OfflineBanner() {
  const { 
    connectivity, 
    lastSyncTime, 
    triggerManualSync, 
    edgeQueue, 
    pendingOperationsCount,
    syncNotification,
    dismissSyncNotification 
  } = useStation();

  // If there's an active sync flush notification (e.g., "17 telemetry events synchronized")
  if (syncNotification) {
    return (
      <div className="w-full px-4 py-2.5 text-xs font-mono bg-gradient-to-r from-emerald-950 via-teal-950 to-emerald-950 border-b border-emerald-500/60 text-emerald-100 flex items-center justify-between shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-400/40">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <span className="font-bold tracking-wide">{syncNotification}</span>
          <span suppressHydrationWarning className="text-[11px] text-emerald-300/80 font-sans">
            • Cloud twin synchronized at {new Date().toLocaleTimeString()}
          </span>
        </div>
        <button
          onClick={dismissSyncNotification}
          className="p-1.5 hover:bg-emerald-900/70 rounded-lg text-emerald-300 hover:text-white transition-colors"
          title="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  if (connectivity === 'CONNECTED') {
    return null;
  }

  const isIntermittent = connectivity === 'INTERMITTENT';

  return (
    <div className={`w-full px-4 py-2.5 text-xs font-mono flex flex-wrap items-center justify-between gap-3 shadow-lg backdrop-blur-md transition-all ${
      isIntermittent 
        ? 'bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 border-b border-amber-500/60 text-amber-100' 
        : 'bg-gradient-to-r from-rose-950 via-slate-900 to-rose-950 border-b border-rose-500/60 text-rose-100'
    }`}>
      <div className="flex items-center gap-3 flex-wrap">
        <div className={`p-1.5 rounded-xl border ${
          isIntermittent 
            ? 'bg-amber-500/20 border-amber-400/40 text-amber-400' 
            : 'bg-rose-500/20 border-rose-400/40 text-rose-400'
        }`}>
          {isIntermittent ? (
            <AlertTriangle className="w-4 h-4 animate-pulse shrink-0" />
          ) : (
            <WifiOff className="w-4 h-4 animate-pulse shrink-0" />
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="font-extrabold uppercase tracking-wider text-xs">
            {isIntermittent ? 'Satellite Link Intermittent' : 'Station Disconnected (Edge Mode)'}
          </span>
          <span className="px-2 py-0.5 rounded bg-amber-500/30 text-amber-300 font-extrabold border border-amber-400 text-[10px] animate-pulse">
            LOCAL CONTROL ACTIVE
          </span>
          <span className="text-white/40">|</span>
          <span className="text-[11px] opacity-90">
            Last Cloud Sync: <strong className="text-white">{new Date(lastSyncTime).toLocaleTimeString()}</strong>
          </span>
          <span className="text-white/40">|</span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/10 border border-white/15 text-[10px]">
            <HardDrive className="w-3 h-3 text-cyan-400" />
            Buffered Events: <strong className="text-white">{edgeQueue.length}</strong>
          </span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/10 border border-white/15 text-[10px]">
            Pending Ops: <strong className="text-white">{pendingOperationsCount}</strong>
          </span>
          <span className="text-white/40 hidden md:inline">|</span>
          <span className="text-[11px] opacity-75 hidden lg:inline">
            {isIntermittent 
              ? 'Status: Delayed packet transmissions (~25% loss simulated)' 
              : 'Status: Local edge queue active. Autonomous edge alerts operational.'}
          </span>
        </div>
      </div>

      <button
        onClick={triggerManualSync}
        className="px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/30 hover:border-white/50 flex items-center gap-2 transition-all duration-200 text-xs font-bold shadow-xs hover:scale-[1.02] active:scale-100"
      >
        <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
        <span>Flush & Sync Buffer</span>
      </button>
    </div>
  );
}
