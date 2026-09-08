/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw, Radio, Check } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { StorageService, OutboxItem } from '../services/storage';

export const OfflineIndicator: React.FC = () => {
  const { isOnline, isSimulatedOffline, toggleSimulatedOffline } = useOnlineStatus();
  const [outboxItems, setOutboxItems] = useState<OutboxItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [justSynced, setJustSynced] = useState(false);

  const refreshOutbox = () => {
    setOutboxItems(StorageService.getOutbox());
  };

  useEffect(() => {
    refreshOutbox();

    const onSyncComplete = () => {
      refreshOutbox();
      setJustSynced(true);
      setTimeout(() => setJustSynced(false), 3000);
    };

    window.addEventListener('transafrica-sync-complete', onSyncComplete);
    window.addEventListener('online', refreshOutbox);
    window.addEventListener('offline', refreshOutbox);

    const interval = setInterval(refreshOutbox, 3000);

    return () => {
      window.removeEventListener('transafrica-sync-complete', onSyncComplete);
      window.removeEventListener('online', refreshOutbox);
      window.removeEventListener('offline', refreshOutbox);
      clearInterval(interval);
    };
  }, []);

  const handleSyncNow = async () => {
    if (!isOnline && isSimulatedOffline) {
      // Prompt user to switch to online or toggle off simulation
      toggleSimulatedOffline();
    }
    setIsSyncing(true);
    await StorageService.syncOutbox();
    setIsSyncing(false);
    refreshOutbox();
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Network Status Pill */}
      <button
        id="btn-toggle-offline-simulation"
        onClick={toggleSimulatedOffline}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition cursor-pointer ${
          isOnline
            ? 'bg-emerald-950/60 border-emerald-700/50 text-emerald-400 hover:bg-emerald-900/60'
            : 'bg-amber-950/80 border-amber-600/70 text-amber-300 hover:bg-amber-900/80 shadow-xs'
        }`}
        title="Click to toggle Simulated Border Dead Zone (Offline Mode) to test local queueing"
      >
        {isOnline ? (
          <>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <Wifi className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Online (Live SADC Network)</span>
            <span className="sm:hidden">Online</span>
          </>
        ) : (
          <>
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <WifiOff className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {isSimulatedOffline ? 'Simulated Offline (Border Dead Zone)' : 'Offline (Cached Mode)'}
            </span>
          </>
        )}
      </button>

      {/* Outbox Pending Sync Count */}
      {outboxItems.length > 0 && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 border border-amber-500/60 text-amber-300 text-xs font-medium">
          <Radio className="w-3 h-3 text-amber-400 animate-spin" />
          <span>{outboxItems.length} queued locally</span>
          <button
            id="btn-force-sync"
            onClick={handleSyncNow}
            disabled={isSyncing}
            className="ml-1 px-1.5 py-0.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className={`w-2.5 h-2.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      )}

      {justSynced && (
        <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium animate-fade-in">
          <Check className="w-3 h-3" /> Synced to corridor!
        </span>
      )}
    </div>
  );
};
