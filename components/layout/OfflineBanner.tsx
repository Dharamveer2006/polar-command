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
      <div className="w-full px-4 py-2 text-xs font-mono bg-emerald-950/90 border-b border-emerald-500/60 text-emerald-200 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold">{syncNotification}</span>
          <span suppressHydrationWarning className="text-[10px] text-emerald-400/80">• Cloud twin synchronized at {new Date().toLocaleTimeString()}</span>
        </div>
        <button
          onClick={dismissSyncNotification}
          className="p-1 hover:bg-emerald-900/60 rounded text-emerald-300"
          title="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  if (connectivity === 'CONNECTED') {
    return null;
  }

  const isIntermittent = connectivity === 'INTERMITTENT';

  return (
    <div className={`w-full px-4 py-2 text-xs font-mono flex flex-wrap items-center justify-between gap-3 transition-colors ${
      isIntermittent 
        ? 'bg-amber-950/90 border-b border-amber-600/50 text-amber-200' 
        : 'bg-rose-950/90 border-b border-rose-600/60 text-rose-200'
    }`}>
      <div className="flex items-center gap-3">
        {isIntermittent ? (
          <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
        ) : (
          <WifiOff className="w-4 h-4 text-rose-400 animate-pulse shrink-0" />
        )}
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold uppercase tracking-wider">
            {isIntermittent ? 'Satellite Link Intermittent' : 'Station Disconnected (Edge Mode)'}
          </span>
          <span className="text-white/60">|</span>
          <span>Last Cloud Sync: <strong>{new Date(lastSyncTime).toLocaleTimeString()}</strong></span>
          <span className="text-white/60">|</span>
          <span className="flex items-center gap-1">
            <HardDrive className="w-3 h-3 text-current" />
            Buffered Events: <strong>{edgeQueue.length}</strong>
          </span>
          <span className="text-white/60">|</span>
          <span>Pending Ops: <strong>{pendingOperationsCount}</strong></span>
          <span className="text-white/60">|</span>
          <span className="text-[11px] opacity-80">
            {isIntermittent 
              ? 'Status: Delayed packet transmissions (simulate ~25% loss)' 
              : 'Status: Local edge queue active. Autonomous local alerts operational.'}
          </span>
        </div>
      </div>

      <button
        onClick={triggerManualSync}
        className="px-3 py-1 rounded bg-black/40 hover:bg-black/60 border border-current flex items-center gap-1.5 transition-all text-xs font-bold"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Flush & Sync Buffer
      </button>
    </div>
  );
}
