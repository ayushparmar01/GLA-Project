import { useState, useEffect, useCallback } from 'react';

export interface NetworkStatus {
  isOnline: boolean;
  wasOffline: boolean;
  isLowBandwidth: boolean;
  effectiveType: string;
  saveData: boolean;
  checkConnection: () => Promise<boolean>;
}

export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [wasOffline, setWasOffline] = useState<boolean>(false);
  const [effectiveType, setEffectiveType] = useState<string>('4g');
  const [saveData, setSaveData] = useState<boolean>(false);

  // Read Network Information API where available
  const updateConnectionInfo = useCallback(() => {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const conn = (navigator as any).connection;
      if (conn) {
        setEffectiveType(conn.effectiveType || '4g');
        setSaveData(!!conn.saveData);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    updateConnectionInfo();

    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
      // Auto-clear wasOffline notification banner after 4 seconds
      const timer = setTimeout(() => {
        setWasOffline(false);
      }, 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen to connection changes if supported
    let conn: any;
    if ('connection' in navigator) {
      conn = (navigator as any).connection;
      conn?.addEventListener?.('change', updateConnectionInfo);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      conn?.removeEventListener?.('change', updateConnectionInfo);
    };
  }, [updateConnectionInfo]);

  // Ping health endpoint to actively verify backend reachability
  const checkConnection = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined') return true;
    try {
      const res = await fetch('/api/health', {
        method: 'GET',
        cache: 'no-store',
      });
      const online = res.ok;
      setIsOnline(online);
      return online;
    } catch {
      setIsOnline(false);
      return false;
    }
  }, []);

  const isLowBandwidth =
    effectiveType === '2g' ||
    effectiveType === 'slow-2g' ||
    saveData === true;

  return {
    isOnline,
    wasOffline,
    isLowBandwidth,
    effectiveType,
    saveData,
    checkConnection,
  };
}
