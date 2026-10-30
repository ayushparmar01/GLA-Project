import React, { useState } from 'react';
import { SafeUser } from '../../types';
import {
  GraduationCap,
  CheckCircle,
  MapPin,
  Mail,
  Phone,
  Layers,
  Briefcase,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';

interface CollegeWithStats extends SafeUser {
  stats?: {
    cohortCount: number;
    driveCount: number;
  };
}

interface AdminCollegeManagementTableProps {
  colleges: CollegeWithStats[];
  loading: boolean;
  onVerifyCollege: (collegeId: string) => Promise<boolean>;
}

export const AdminCollegeManagementTable: React.FC<AdminCollegeManagementTableProps> = ({
  colleges,
  loading,
  onVerifyCollege,
}) => {
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const handleVerify = async (id: string) => {
    setActionLoadingId(id);
    await onVerifyCollege(id);
    setActionLoadingId(null);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="p-5 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-teal-600" /> College & Institutional Governance
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Supervise registered Tier-2/3 polytechnics and degree colleges, verify institutional validity, and monitor student batches
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
            {colleges.length} Registered Institutions
          </span>
        </div>
      </div>

      <div className="divide-y divide-slate-200">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading registered colleges...</div>
        ) : colleges.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No registered colleges found.</div>
        ) : (
          colleges.map((col) => {
            const isVerified = Boolean(col.collegeProfile?.verified);

            return (
              <div
                key={col.id}
                className="p-5 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className="text-base font-bold text-slate-900">
                      {col.collegeProfile?.institutionName || col.fullName}
                    </h4>
                    {isVerified ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <ShieldCheck className="w-3.5 h-3.5" /> Verified Institution
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        Pending Verification
                      </span>
                    )}
                    {col.collegeProfile?.institutionType && (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-slate-100 text-slate-600">
                        {col.collegeProfile.institutionType}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                    {col.collegeProfile?.institutionLocation && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" /> {col.collegeProfile.institutionLocation}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400" /> {col.collegeProfile?.placementEmail || col.email}
                    </span>
                    {col.collegeProfile?.placementPhone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" /> {col.collegeProfile.placementPhone}
                      </span>
                    )}
                  </div>

                  {/* Operational stats */}
                  <div className="flex items-center gap-4 pt-2 text-xs text-slate-600">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 font-medium">
                      <Layers className="w-3.5 h-3.5 text-teal-600" /> {col.stats?.cohortCount ?? 0} Student Cohorts
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 font-medium">
                      <Briefcase className="w-3.5 h-3.5 text-indigo-600" /> {col.stats?.driveCount ?? 0} Drives Hosted
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="shrink-0">
                  {isVerified ? (
                    <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" /> Credentials On Record
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={actionLoadingId === col.id}
                      onClick={() => handleVerify(col.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-teal-300 bg-teal-50 text-teal-700 font-medium hover:bg-teal-100 text-xs transition-colors cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      {actionLoadingId === col.id ? 'Verifying...' : 'Verify College'}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
