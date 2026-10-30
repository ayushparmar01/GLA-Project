import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/I18nContext';
import { LanguageSelector } from './common/LanguageSelector';
import { SafeUser } from '../types';
import {
  User,
  School,
  Briefcase,
  Award,
  CheckCircle2,
  Edit3,
  Globe,
  Sparkles,
  BookOpen,
  MapPin,
  ArrowRight,
  Send,
  Users,
  MessageSquare,
} from 'lucide-react';
import { CollegeDashboardView } from './CollegeDashboardView';
import { EmployerDashboardView } from './employer/EmployerDashboardView';
import { AdminControlCentreView } from './admin/AdminControlCentreView';

interface DashboardViewProps {
  onEditProfile: () => void;
  onNavigateToCohorts?: () => void;
  onNavigateToDrives?: () => void;
  onNavigateToStudentPlacement?: () => void;
  onNavigateToEmployerOpportunities?: () => void;
  onNavigateToEmployerApplicants?: () => void;
  onNavigateToEmployerInterviews?: () => void;
  onNavigateToEmployerConnections?: () => void;
  onNavigateToEmployerProfile?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onEditProfile,
  onNavigateToCohorts = () => {},
  onNavigateToDrives = () => {},
  onNavigateToStudentPlacement = () => {},
  onNavigateToEmployerOpportunities = () => {},
  onNavigateToEmployerApplicants = () => {},
  onNavigateToEmployerInterviews = () => {},
  onNavigateToEmployerConnections = () => {},
  onNavigateToEmployerProfile = () => {},
}) => {
  const { user } = useAuth();
  const { t } = useTranslation();

  if (!user) {
    return null;
  }

  // If admin, display the Dedicated Admin Control Centre
  if (user.role === 'ADMIN') {
    return <AdminControlCentreView />;
  }

  // If college, display the Institutional Placement Cell Dashboard
  if (user.role === 'COLLEGE') {
    return (
      <CollegeDashboardView
        onNavigateToCohorts={onNavigateToCohorts}
        onNavigateToDrives={onNavigateToDrives}
        onEditProfile={onEditProfile}
      />
    );
  }

  // If employer, display the Employer Corporate Recruitment Dashboard
  if (user.role === 'EMPLOYER') {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <EmployerDashboardView
          onNavigateToOpportunities={onNavigateToEmployerOpportunities}
          onNavigateToApplicants={onNavigateToEmployerApplicants}
          onNavigateToInterviews={onNavigateToEmployerInterviews}
          onNavigateToConnections={onNavigateToEmployerConnections}
          onNavigateToProfile={onNavigateToEmployerProfile}
        />
      </div>
    );
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'STUDENT':
        return {
          label: 'STUDENT PORTAL',
          color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          icon: User,
        };
      case 'EMPLOYER':
        return {
          label: 'RECRUITER PORTAL',
          color: 'bg-indigo-50 text-indigo-800 border-indigo-200',
          icon: Briefcase,
        };
      default:
        return {
          label: role,
          color: 'bg-slate-100 text-slate-800 border-slate-200',
          icon: User,
        };
    }
  };

  const badge = getRoleBadge(user.role);
  const BadgeIcon = badge.icon;

  const sp = user.studentProfile;
  const ep = user.employerProfile;

  const score = sp?.profileCompletionScore || 0;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Top Welcome Card */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden mb-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badge.color}`}>
                <BadgeIcon className="w-3.5 h-3.5" />
                <span>{badge.label}</span>
              </span>
              <span className="text-xs text-emerald-400 font-mono bg-emerald-950/80 px-2.5 py-0.5 rounded border border-emerald-800">
                Active Account
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              {t('student.dashboard.welcome', { name: user.fullName })}
            </h1>
            <p className="text-slate-300 text-sm mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span>Email: <strong className="text-white">{user.email}</strong></span>
              <span>&bull;</span>
              <span>Language: <strong className="text-white uppercase">{user.preferredLanguage}</strong></span>
              {user.phoneNumber && (
                <>
                  <span>&bull;</span>
                  <span>Phone: <strong className="text-white">{user.phoneNumber}</strong></span>
                </>
              )}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <LanguageSelector variant="compact" />
            <button
              onClick={onEditProfile}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-all shadow-md shadow-emerald-700/25 cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
              <span>{t('actions.edit')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Student Portal Specific Content */}
      {user.role === 'STUDENT' && (
        <div className="space-y-8">
          {/* Phase 3 Quick Access Banner */}
          <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                Phase 3 Automated Placement Desk
              </span>
              <h3 className="text-lg font-bold text-emerald-950">
                Campus Drives & Cohort Participation
              </h3>
              <p className="text-xs text-emerald-800/80 max-w-xl">
                Browse placement drives published by your college, verify your eligibility with explainable criteria, and track recruitment rounds.
              </p>
            </div>
            <button
              onClick={onNavigateToStudentPlacement}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-sm flex-shrink-0"
            >
              <span>Explore Campus Drives</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Phase 10 WhatsApp Career Assistant Quick Access */}
          <div className="bg-gradient-to-r from-emerald-900 to-teal-950 text-white rounded-2xl p-6 border border-emerald-700/40 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                <MessageSquare className="w-4 h-4" />
                <span>Phase 10 · WhatsApp Career Assistant</span>
              </div>
              <h3 className="text-lg font-bold text-white">
                Career Updates & AI Guidance on Your Phone
              </h3>
              <p className="text-xs text-emerald-200/90 max-w-xl">
                Link your WhatsApp to receive instant placement alerts, application status changes, interview reminders, and 24/7 AI career counseling without internet browsing.
              </p>
            </div>
            <button
              onClick={onEditProfile}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-emerald-500/20 flex-shrink-0 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Configure WhatsApp</span>
            </button>
          </div>

          {/* Profile Completion Meter */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
              <div>
                <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-emerald-600">
                  <Sparkles className="w-4 h-4" />
                  <span>Profile Strength & Readiness</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">Profile Completion Score</h3>
              </div>
              <div className="text-2xl font-black text-emerald-600 font-heading">
                {score}%
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden p-0.5 border border-slate-200">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-teal-500' : 'bg-amber-500'
                }`}
                style={{ width: `${Math.max(5, score)}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-3">
              {score === 100
                ? 'Your student profile is 100% complete! You are ready for Phase 4 ICAN assessments and regional pooled drives.'
                : 'Tip: Add skills, degree course, graduation year, and career interests in "Edit Profile" to reach 100% completion.'}
            </p>
          </div>

          {/* Student Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
              <div className="flex items-center space-x-2 text-slate-800 font-bold mb-4">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold">Academic Information</h3>
              </div>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-xs text-slate-400 font-medium">Institution / College</dt>
                  <dd className="font-semibold text-slate-800">{sp?.collegeName || 'Not specified yet'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400 font-medium">Degree & Branch</dt>
                  <dd className="font-semibold text-slate-800">{sp?.course || 'Not specified yet'}</dd>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-xs text-slate-400 font-medium">Education Level</dt>
                    <dd className="font-semibold text-slate-800">{sp?.educationLevel || 'Undergraduate'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-400 font-medium">Graduation Year</dt>
                    <dd className="font-semibold text-slate-800">{sp?.graduationYear || 'Not set'}</dd>
                  </div>
                </div>
              </dl>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
              <div className="flex items-center space-x-2 text-slate-800 font-bold mb-4">
                <Award className="w-5 h-5 text-teal-600" />
                <h3 className="text-base font-bold">Skills & Preferences</h3>
              </div>
              <div className="space-y-4 text-sm">
                <div>
                  <span className="text-xs text-slate-400 font-medium block mb-1.5">Technical & Professional Skills</span>
                  {sp?.skills && sp.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {sp.skills.map((skill, idx) => (
                        <span key={idx} className="bg-emerald-50 text-emerald-800 text-xs px-2.5 py-1 rounded-md font-medium border border-emerald-200">
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No skills listed yet. Add skills in Edit Profile.</p>
                  )}
                </div>

                <div>
                  <span className="text-xs text-slate-400 font-medium block mb-1.5">Career Interests</span>
                  {sp?.careerInterests && sp.careerInterests.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {sp.careerInterests.map((interest, idx) => (
                        <span key={idx} className="bg-teal-50 text-teal-800 text-xs px-2.5 py-1 rounded-md font-medium border border-teal-200">
                          {interest}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No career interests specified.</p>
                  )}
                </div>

                <div>
                  <span className="text-xs text-slate-400 font-medium block mb-1.5">Preferred Work Locations</span>
                  {sp?.preferredWorkLocation && sp.preferredWorkLocation.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {sp.preferredWorkLocation.map((loc, idx) => (
                        <span key={idx} className="bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-md font-medium border border-slate-200 flex items-center space-x-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{loc}</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Any location across India.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
