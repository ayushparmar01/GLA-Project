import React from 'react';
import { Database, Clock } from 'lucide-react';

interface CachedSnapshotBadgeProps {
  timestamp?: string | Date;
  className?: string;
}

export const CachedSnapshotBadge: React.FC<CachedSnapshotBadgeProps> = ({
  timestamp,
  className = '',
}) => {
  const formattedTime = timestamp
    ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Offline Cache';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 ${className}`}
      title="This record was retrieved from your local offline cache. Live verification requires an active internet connection."
      role="status"
    >
      <Database className="w-3 h-3 text-amber-400" />
      <span>Cached Snapshot</span>
      <span className="text-amber-500/70 font-mono text-[10px]">({formattedTime})</span>
    </span>
  );
};
