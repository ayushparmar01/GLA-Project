import React, { useState } from 'react';
import { useNetworkStatus } from '../../pwa/useNetworkStatus';
import { WifiOff, Wifi, RefreshCw, Zap, AlertTriangle } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const { isOnline, wasOffline, isLowBandwidth, effectiveType, checkConnection } = useNetworkStatus();
  const [retrying, setRetrying] = useState(false);
  const [retryResult, setRetryResult] = useState<string | null>(null);

  const handleRetry = async () => {
    setRetrying(true);
    setRetryResult(null);
    const online = await checkConnection();
    setRetrying(false);
    if (online) {
      setRetryResult('Connected!');
    } else {
      setRetryResult('Still offline');
    }
  };

  // 1. Connection Restored Notice (auto-clears after 4 seconds)
  if (wasOffline && isOnline) {
    return (
      <aside
        className="bg-emerald-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 shadow-md animate-fadeIn transition-all"
        role="status"
        aria-live="polite"
        aria-label="Connection Restored Notice"
      >
        <Wifi className="w-4 h-4 animate-bounce" />
        <span>Connection Restored! You are back online. Real-time syncing active.</span>
      </aside>
    );
  }

  // 2. Offline Mode Alert Banner
  if (!isOnline) {
    return (
      <aside
        className="bg-gradient-to-r from-amber-600 via-rose-700 to-amber-700 text-white px-4 py-2.5 text-xs font-medium shadow-lg transition-all"
        role="alert"
        aria-live="assertive"
        aria-label="Offline Mode Active"
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 text-center sm:text-left">
            <span className="p-1 bg-white/20 rounded-full flex-shrink-0">
              <WifiOff className="w-3.5 h-3.5" />
            </span>
            <span>
              <strong>Offline Mode Active:</strong> You are viewing previously cached resources. Placement applications and assessments require an active connection.
            </span>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {retryResult && (
              <span className="text-[11px] font-bold text-amber-200">
                {retryResult}
              </span>
            )}
            <button
              type="button"
              onClick={handleRetry}
              disabled={retrying}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white font-bold text-xs transition-colors cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${retrying ? 'animate-spin' : ''}`} />
              <span>{retrying ? 'Checking...' : 'Retry Connection'}</span>
            </button>
          </div>
        </div>
      </aside>
    );
  }

  // 3. Subtle Low-Bandwidth Mode Indicator (when on 2G or Data Saver)
  if (isLowBandwidth) {
    return (
      <aside
        className="bg-slate-900/90 border-b border-slate-800 text-slate-300 px-4 py-1.5 text-[11px] font-medium flex items-center justify-center gap-2"
        role="status"
        aria-label="Low Bandwidth Mode Active"
      >
        <Zap className="w-3.5 h-3.5 text-amber-400" />
        <span>
          <strong>Low-Bandwidth Mode ({effectiveType.toUpperCase()}):</strong> Image compression & lightweight payloads active for rural network stability.
        </span>
      </aside>
    );
  }

  return null;
};
