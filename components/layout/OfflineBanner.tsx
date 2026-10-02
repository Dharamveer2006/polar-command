'use client';

import React from 'react';
import { useStation } from '@/context/StationContext';
import { WifiOff, AlertTriangle, RefreshCw } from 'lucide-react';

export default function OfflineBanner() {
  const { connectivity, lastSyncTime, triggerManualSync } = useStation();

  if (connectivity === 'CONNECTED') {
    return null;
  }

  const isIntermittent = connectivity === 'INTERMITTENT';

  return (
    <div className={`w-full px-4 py-2 text-xs font-mono flex items-center justify-between transition-colors ${
      isIntermittent 
        ? 'bg-amber-950/80 border-b border-amber-600/40 text-amber-200' 
        : 'bg-rose-950/90 border-b border-rose-600/50 text-rose-200'
    }`}>
      <div className="flex items-center gap-2">
        {isIntermittent ? (
          <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse" />
        ) : (
          <WifiOff className="w-4 h-4 text-rose-400 animate-bounce" />
        )}
        <span>
          <strong className="font-semibold uppercase tracking-wider">
            {isIntermittent ? 'Satellite Link Intermittent (High Packet Loss)' : 'Station Disconnected (Edge Standalone Mode)'}
          </strong>
          {' — '}
          Operating on cached telemetry and local risk engine. Last synced: {new Date(lastSyncTime).toLocaleTimeString()}.
        </span>
      </div>

      <button
        onClick={triggerManualSync}
        className="px-2.5 py-1 rounded bg-black/40 hover:bg-black/60 border border-current flex items-center gap-1.5 transition-all text-xs"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Sync Buffer
      </button>
    </div>
  );
}
