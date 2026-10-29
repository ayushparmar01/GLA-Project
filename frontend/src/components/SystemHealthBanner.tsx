import React, { useState } from 'react';
import { Activity, Database, Server, RefreshCw, CheckCircle, AlertTriangle, XCircle, Code2, Globe } from 'lucide-react';
import { SystemHealthResponse } from '../types';

interface SystemHealthBannerProps {
  health: SystemHealthResponse | null;
  loading: boolean;
  onRefresh: () => void;
}

export const SystemHealthBanner: React.FC<SystemHealthBannerProps> = ({ health, loading, onRefresh }) => {
  const [showRawJson, setShowRawJson] = useState(false);

  const isHealthy = health?.success && health.data?.status === 'healthy';
  const isDegraded = health?.success && health.data?.status === 'degraded';
  const isOffline = health && !health.success;

  const dbStatus = health?.data?.services?.database;
  const icanStatus = health?.data?.services?.icanSandbox;

  return (
    <section id="diagnostics" className="py-12 bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-8 border-b border-slate-800 gap-4">
          <div>
            <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold tracking-widest uppercase mb-1">
              <Activity className="w-4 h-4 animate-pulse" />
              <span>Real-Time Phase 1 Verification</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">System Health & API Monitor</h2>
            <p className="text-slate-400 text-sm mt-1">
              Verifying Express REST API health endpoint, database tolerance, and architectural readiness.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onRefresh}
              disabled={loading}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
              <span>{loading ? 'Probing /api/health...' : 'Recheck /api/health'}</span>
            </button>
            <button
              onClick={() => setShowRawJson(!showRawJson)}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 text-xs font-mono border border-slate-700/60"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>{showRawJson ? 'Hide Raw JSON' : 'Inspect JSON'}</span>
            </button>
          </div>
        </div>

        {/* Status Indicators Grid */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Express Server API */}
          <div className="bg-slate-800/80 rounded-xl p-5 border border-slate-700/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-400 flex items-center space-x-1.5">
                  <Server className="w-4 h-4 text-emerald-400" />
                  <span>Express API Server</span>
                </span>
                {isOffline ? (
                  <span className="inline-flex items-center space-x-1 text-xs text-rose-400 font-semibold bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800">
                    <XCircle className="w-3 h-3" />
                    <span>Offline</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 text-xs text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                    <CheckCircle className="w-3 h-3" />
                    <span>HTTP 200 OK</span>
                  </span>
                )}
              </div>
              <div className="text-xl font-bold text-slate-100">
                {health?.data?.service || 'CareerBridge API'}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Version: {health?.data?.version || '0.1.0'} &bull; Environment: {health?.data?.environment || 'development'}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-700/50 text-xs text-slate-400 flex justify-between">
              <span>Uptime:</span>
              <span className="font-mono text-slate-300">
                {health?.data?.uptimeSeconds !== undefined ? `${health.data.uptimeSeconds}s` : 'N/A'}
              </span>
            </div>
          </div>

          {/* Card 2: MongoDB Status & Fault Tolerance */}
          <div className="bg-slate-800/80 rounded-xl p-5 border border-slate-700/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-400 flex items-center space-x-1.5">
                  <Database className="w-4 h-4 text-cyan-400" />
                  <span>MongoDB Connection</span>
                </span>
                {dbStatus?.status === 'connected' ? (
                  <span className="inline-flex items-center space-x-1 text-xs text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                    <CheckCircle className="w-3 h-3" />
                    <span>Connected</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 text-xs text-amber-400 font-semibold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Handled Gracefully</span>
                  </span>
                )}
              </div>
              <div className="text-xl font-bold text-slate-100">
                {dbStatus?.status === 'connected' ? 'Database Active' : 'Degraded Mode (No Crash)'}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {dbStatus?.status === 'connected'
                  ? `Host: ${dbStatus.host || 'localhost'} / DB: ${dbStatus.name || 'careerbridge'}`
                  : 'App handles missing MongoDB without crashing. Ready for local mongod or Atlas URI.'}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-700/50 text-xs text-slate-400 flex justify-between">
              <span>State:</span>
              <span className="font-mono text-amber-300 capitalize">
                {dbStatus?.state || 'disconnected'}
              </span>
            </div>
          </div>

          {/* Card 3: ICAN Sandbox Readiness */}
          <div className="bg-slate-800/80 rounded-xl p-5 border border-slate-700/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-400 flex items-center space-x-1.5">
                  <Globe className="w-4 h-4 text-indigo-400" />
                  <span>ICAN Sandbox Adapter</span>
                </span>
                <span className="inline-flex items-center space-x-1 text-xs text-indigo-300 font-semibold bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800">
                  <span>Architecture Ready</span>
                </span>
              </div>
              <div className="text-xl font-bold text-slate-100">Phase 1 Prepared</div>
              <p className="text-xs text-slate-400 mt-1">
                {icanStatus?.note || 'Standardized REST structure configured for upcoming ICAN integration.'}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-700/50 text-xs text-slate-400 flex justify-between">
              <span>Target URL:</span>
              <span className="font-mono text-slate-300 text-[11px] truncate max-w-[160px]">
                {icanStatus?.targetEnvironment || 'https://sandbox.ican.mock'}
              </span>
            </div>
          </div>
        </div>

        {/* Collapsible Raw JSON Diagnostic Viewer */}
        {showRawJson && (
          <div className="mt-6 bg-slate-950 rounded-xl p-4 border border-slate-800">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs text-slate-400">
              <span className="font-mono">Payload from GET /api/health</span>
              <span>{health?.data?.timestamp || new Date().toISOString()}</span>
            </div>
            <pre className="text-xs font-mono text-emerald-400 overflow-x-auto p-2">
              {JSON.stringify(health || { message: 'No response received yet' }, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </section>
  );
};
