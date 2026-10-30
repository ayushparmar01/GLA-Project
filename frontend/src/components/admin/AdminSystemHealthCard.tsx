import React from 'react';
import { AdminSystemHealthReport } from '../../types';
import {
  Server,
  Database,
  Cpu,
  Radio,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

interface AdminSystemHealthCardProps {
  health: AdminSystemHealthReport | null;
  loading: boolean;
  onRefresh: () => void;
}

export const AdminSystemHealthCard: React.FC<AdminSystemHealthCardProps> = ({
  health,
  loading,
  onRefresh,
}) => {
  if (loading) {
    return (
      <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-400">
        Querying system diagnostics & server status...
      </div>
    );
  }

  if (!health) return null;

  const isServerHealthy = health.server.status === 'healthy';
  const isDbConnected = health.database.status === 'connected';

  const formatUptime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs}h ${mins}m ${secs}s`;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Server className="w-5 h-5 text-indigo-600" /> Operational Diagnostics & Health Monitor
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time backend performance, service connectivity, and sanitized system telemetry
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Telemetry
        </button>
      </div>

      {/* Primary Status Grids */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Node.js Server */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Express Backend</span>
            {isServerHealthy ? (
              <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" /> Healthy
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                <AlertTriangle className="w-3 h-3" /> {health.server.status}
              </span>
            )}
          </div>
          <div className="text-sm font-bold text-slate-900">Uptime: {formatUptime(health.server.uptimeSeconds)}</div>
          <div className="text-xs text-slate-500">
            Node: {health.server.nodeVersion} · Env: {health.server.environment}
          </div>
        </div>

        {/* Database */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">MongoDB Database</span>
            {isDbConnected ? (
              <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" /> Connected
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                <AlertTriangle className="w-3 h-3" /> {health.database.status}
              </span>
            )}
          </div>
          <div className="text-sm font-bold text-slate-900">{health.database.name}</div>
          <div className="text-xs text-slate-500">Host: {health.database.host}</div>
        </div>

        {/* AI Provider */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">AI Career Guide</span>
            <span className="flex items-center gap-1 text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
              <Cpu className="w-3 h-3" /> {health.aiProvider.activeProvider}
            </span>
          </div>
          <div className="text-sm font-bold text-slate-900">
            {health.aiProvider.configured ? 'Live API Active' : 'Deterministic Fallback'}
          </div>
          <div className="text-xs text-slate-500">Mode: {health.aiProvider.status}</div>
        </div>

        {/* Real-time Notifications */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">SSE Event Stream</span>
            <span className="flex items-center gap-1 text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
              <Radio className="w-3 h-3" /> Operational
            </span>
          </div>
          <div className="text-sm font-bold text-slate-900">{health.notifications.activeSseClients} Active Clients</div>
          <div className="text-xs text-slate-500">Real-time SSE event pipeline</div>
        </div>
      </div>

      {/* Memory Allocation */}
      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
        <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Process Memory Footprint</h4>
        <div className="grid grid-cols-3 gap-4 pt-1">
          <div>
            <div className="text-xs text-slate-500">Heap Used</div>
            <div className="text-base font-bold text-slate-900">{health.server.memoryUsage.heapUsedMB} MB</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Heap Allocated</div>
            <div className="text-base font-bold text-slate-900">{health.server.memoryUsage.heapTotalMB} MB</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Resident Set Size (RSS)</div>
            <div className="text-base font-bold text-slate-900">{health.server.memoryUsage.rssMB} MB</div>
          </div>
        </div>
      </div>

      {/* Sanitized Diagnostics (No Secret Leakage) */}
      <div className="p-4 bg-slate-900 text-slate-200 rounded-xl space-y-2 font-mono text-xs">
        <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Sanitized Diagnostics (Strict Privacy)
          </span>
          <span className="text-[11px] text-slate-500">Secrets & Credentials Redacted</span>
        </div>
        <div className="space-y-1 pt-1">
          {health.sanitizedDiagnostics.map((diag, idx) => (
            <div key={idx} className="text-emerald-300">
              <span className="text-slate-500">$ </span>
              {diag}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
