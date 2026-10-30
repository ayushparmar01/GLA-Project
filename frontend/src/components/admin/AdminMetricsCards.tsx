import React from 'react';
import { AdminDashboardMetrics } from '../../types';
import {
  Users,
  GraduationCap,
  Building2,
  Briefcase,
  Layers,
  FileText,
  Calendar,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';

interface AdminMetricsCardsProps {
  metrics: AdminDashboardMetrics | null;
  loading: boolean;
}

export const AdminMetricsCards: React.FC<AdminMetricsCardsProps> = ({ metrics, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="h-24 bg-slate-100 rounded-xl border border-slate-200"></div>
        ))}
      </div>
    );
  }

  if (!metrics) return null;

  const cards = [
    {
      title: 'Total Registered Users',
      value: metrics.totalUsers,
      sub: `${metrics.totalStudents} Students · ${metrics.totalEmployers} Employers · ${metrics.totalColleges} Colleges`,
      icon: Users,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    },
    {
      title: 'Active Cohorts',
      value: metrics.activeCohorts,
      sub: 'Tier-2/3 student batches',
      icon: Layers,
      color: 'text-teal-600 bg-teal-50 border-teal-200',
    },
    {
      title: 'Published Drives',
      value: metrics.publishedOpportunities,
      sub: 'Active recruitment drives',
      icon: Briefcase,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    },
    {
      title: 'Total Applications',
      value: metrics.totalApplications,
      sub: 'Student job/intern submissions',
      icon: FileText,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
    },
    {
      title: 'Pending Employers',
      value: metrics.pendingEmployerVerifications,
      sub: metrics.pendingEmployerVerifications > 0 ? 'Requires administrative review' : 'All verified',
      icon: AlertTriangle,
      color:
        metrics.pendingEmployerVerifications > 0
          ? 'text-amber-600 bg-amber-50 border-amber-300'
          : 'text-slate-600 bg-slate-50 border-slate-200',
    },
    {
      title: 'Pending Colleges',
      value: metrics.pendingCollegeVerifications,
      sub: metrics.pendingCollegeVerifications > 0 ? 'Institutions awaiting check' : 'All verified',
      icon: Building2,
      color:
        metrics.pendingCollegeVerifications > 0
          ? 'text-orange-600 bg-orange-50 border-orange-300'
          : 'text-slate-600 bg-slate-50 border-slate-200',
    },
    {
      title: 'Active Events',
      value: metrics.activeCareerEvents,
      sub: 'Workshops, hackathons & AMA',
      icon: Calendar,
      color: 'text-purple-600 bg-purple-50 border-purple-200',
    },
    {
      title: 'Platform Governance',
      value: 'Strict RBAC',
      sub: 'Append-only audit trail enabled',
      icon: ShieldCheck,
      color: 'text-emerald-700 bg-emerald-50 border-emerald-300',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c, idx) => {
        const Icon = c.icon;
        return (
          <div
            key={idx}
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {c.title}
              </span>
              <div className={`p-2 rounded-lg border ${c.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-slate-900">{c.value}</div>
              <div className="text-xs text-slate-500 mt-1 truncate">{c.sub}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
