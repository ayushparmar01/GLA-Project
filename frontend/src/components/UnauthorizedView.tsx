import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

interface UnauthorizedViewProps {
  onBack: () => void;
  requiredRole?: string;
  userRole?: string;
}

export const UnauthorizedView: React.FC<UnauthorizedViewProps> = ({ onBack, requiredRole, userRole }) => {
  return (
    <div className="max-w-lg mx-auto py-20 px-4 sm:px-6 text-center">
      <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
        <ShieldAlert className="w-9 h-9" />
      </div>
      <span className="text-xs font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
        HTTP 403 Forbidden
      </span>
      <h2 className="text-2xl font-bold text-slate-900 mt-4">Access Denied</h2>
      <p className="text-slate-600 text-sm mt-2 leading-relaxed">
        Your current account role <strong className="text-slate-900 font-semibold">{userRole || 'UNKNOWN'}</strong> does not have permission to access the requested resource{requiredRole ? ` (requires ${requiredRole})` : ''}.
      </p>
      <div className="mt-8">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </button>
      </div>
    </div>
  );
};
