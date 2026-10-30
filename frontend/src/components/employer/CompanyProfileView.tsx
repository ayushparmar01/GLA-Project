import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  fetchEmployerProfileApi,
  createEmployerProfileApi,
  updateEmployerProfileApi,
} from '../../services/api';
import { EmployerCompanyProfileData, VerificationStatus } from '../../types';
import {
  Building2,
  Globe,
  MapPin,
  Users,
  UserCheck,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Edit3,
  Save,
  X,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Info,
} from 'lucide-react';

const URL_REGEX = /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&/=]*)$/;

export const CompanyProfileView: React.FC = () => {
  const { token, user } = useAuth();
  const [profile, setProfile] = useState<EmployerCompanyProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    companyName: '',
    companyDescription: '',
    companyWebsite: '',
    industry: 'Information Technology & Software',
    companySize: '51-200 employees',
    headquarters: '',
    contactPerson: '',
    designation: '',
  });

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchEmployerProfileApi(token);
      if (res.success && res.data) {
        setProfile(res.data);
        setFormData({
          companyName: res.data.companyName || '',
          companyDescription: res.data.companyDescription || '',
          companyWebsite: res.data.companyWebsite || '',
          industry: res.data.industry || 'Information Technology & Software',
          companySize: res.data.companySize || '51-200 employees',
          headquarters: res.data.headquarters || '',
          contactPerson: res.data.contactPerson || '',
          designation: res.data.designation || '',
        });
      } else {
        // If profile doesn't exist yet, populate from user profile if available
        if (user) {
          setFormData((prev) => ({
            ...prev,
            companyName: user.employerProfile?.organizationName || user.fullName || '',
            companyDescription: user.employerProfile?.organizationDescription || '',
            industry: user.employerProfile?.industry || 'Information Technology & Software',
            headquarters: user.employerProfile?.organizationLocation || '',
            contactPerson: user.fullName || '',
          }));
        }
      }
    } catch {
      setError('Failed to load company profile.');
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = (): string | null => {
    if (!formData.companyName.trim() || formData.companyName.trim().length < 2) {
      return 'Company name is required (minimum 2 characters).';
    }
    if (!formData.companyDescription.trim() || formData.companyDescription.trim().length < 10) {
      return 'Company description is required (minimum 10 characters).';
    }
    if (!formData.companyWebsite.trim() || !URL_REGEX.test(formData.companyWebsite.trim())) {
      return 'Valid company website URL is required (must start with http:// or https://).';
    }
    if (!formData.contactPerson.trim()) {
      return 'Contact person name is required.';
    }
    if (!formData.designation.trim()) {
      return 'Contact person designation is required.';
    }
    return null;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    try {
      if (profile) {
        // Update existing profile (notice protected fields verified, verificationStatus are NOT sent)
        const res = await updateEmployerProfileApi(formData, token);
        if (res.success && res.data) {
          setProfile(res.data);
          setIsEditing(false);
          setSuccessMessage('Company profile updated successfully.');
        } else {
          setError(res.error?.message || 'Failed to update profile.');
        }
      } else {
        // Create new profile
        const res = await createEmployerProfileApi(formData, token);
        if (res.success && res.data) {
          setProfile(res.data);
          setIsEditing(false);
          setSuccessMessage('Company profile created successfully and queued for verification.');
        } else {
          setError(res.error?.message || 'Failed to create profile.');
        }
      }
    } catch {
      setError('An error occurred while saving the company profile.');
    } finally {
      setSaving(false);
    }
  };

  const renderVerificationBadge = (status?: VerificationStatus, verified?: boolean) => {
    if (verified || status === 'VERIFIED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          <ShieldCheck className="w-4 h-4" />
          Verified Company
        </span>
      );
    }
    if (status === 'REJECTED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
          <ShieldAlert className="w-4 h-4" />
          Verification Rejected
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
        <Clock className="w-4 h-4" />
        Verification Pending
      </span>
    );
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm">Loading company profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-8 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-indigo-600/20 text-indigo-400 rounded-2xl border border-indigo-500/30 flex-shrink-0">
            <Building2 className="w-10 h-10" />
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-white tracking-tight">
                {profile?.companyName || formData.companyName || 'Corporate Profile'}
              </h1>
              {renderVerificationBadge(profile?.verificationStatus, profile?.verified)}
            </div>
            <p className="text-slate-400 text-sm mt-1">
              {profile?.industry || formData.industry}
              {profile?.headquarters && ` • ${profile.headquarters}`}
            </p>
          </div>
        </div>

        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-2 self-start sm:self-auto"
          >
            <Edit3 className="w-4 h-4" />
            {profile ? 'Edit Profile' : 'Set Up Profile'}
          </button>
        )}
      </div>

      {/* Verification Notice */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-indigo-500/20 text-slate-300 text-sm flex items-start gap-3">
        <Info className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-semibold text-white">Trust & Verification Policy: </span>
          <span>
            CareerBridge enforces authentic campus recruitment. Company verification status is verified and authenticated by partner placement cell officers and platform administrators. Employers cannot self-verify.
          </span>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Content: Display or Edit Form */}
      {isEditing ? (
        <form onSubmit={handleSave} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 lg:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h2 className="text-lg font-bold text-white">
              {profile ? 'Edit Company Information' : 'Initialize Company Profile'}
            </h2>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-slate-400 hover:text-white transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Company Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                placeholder="e.g. Bharat Tech Innovations Pvt Ltd"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                required
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Company Description <span className="text-rose-400">*</span>
              </label>
              <textarea
                name="companyDescription"
                rows={4}
                value={formData.companyDescription}
                onChange={handleInputChange}
                placeholder="Briefly describe your company, mission, engineering culture, and products..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                required
              />
              <span className="text-[11px] text-slate-500">Minimum 10 characters</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Official Website URL <span className="text-rose-400">*</span>
              </label>
              <input
                type="url"
                name="companyWebsite"
                value={formData.companyWebsite}
                onChange={handleInputChange}
                placeholder="https://example.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Industry Sector <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                name="industry"
                value={formData.industry}
                onChange={handleInputChange}
                placeholder="e.g. Software, Core Engineering, FinTech"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Company Size
              </label>
              <select
                name="companySize"
                value={formData.companySize}
                onChange={handleInputChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="1-10 employees">1-10 employees (Early Startup)</option>
                <option value="11-50 employees">11-50 employees (Growth)</option>
                <option value="51-200 employees">51-200 employees (Scale-up)</option>
                <option value="201-500 employees">201-500 employees (Mid-Enterprise)</option>
                <option value="500+ employees">500+ employees (Large Enterprise)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Headquarters Location
              </label>
              <input
                type="text"
                name="headquarters"
                value={formData.headquarters}
                onChange={handleInputChange}
                placeholder="e.g. Pune, Maharashtra / Remote"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Primary Contact Person <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleInputChange}
                placeholder="e.g. Anita Rao"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Designation / Role <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                name="designation"
                value={formData.designation}
                onChange={handleInputChange}
                placeholder="e.g. Head of Talent Acquisition"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              disabled={saving}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Company Profile'}
            </button>
          </div>
        </form>
      ) : profile ? (
        <div className="space-y-6">
          {/* About Section */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 lg:p-8 space-y-4">
            <h2 className="text-base font-bold text-white">About the Organization</h2>
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
              {profile.companyDescription}
            </p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                Corporate Credentials
              </h3>
              <div className="space-y-3.5 text-sm">
                <div className="flex items-center gap-3 text-slate-300">
                  <Globe className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <span className="text-slate-500 w-24">Website:</span>
                  <a
                    href={profile.companyWebsite}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium truncate"
                  >
                    {profile.companyWebsite}
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  </a>
                </div>

                <div className="flex items-center gap-3 text-slate-300">
                  <MapPin className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <span className="text-slate-500 w-24">HQ:</span>
                  <span>{profile.headquarters || 'Remote / India'}</span>
                </div>

                <div className="flex items-center gap-3 text-slate-300">
                  <Users className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <span className="text-slate-500 w-24">Scale:</span>
                  <span>{profile.companySize || '51-200 employees'}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                Recruitment Representative
              </h3>
              <div className="space-y-3.5 text-sm">
                <div className="flex items-center gap-3 text-slate-300">
                  <UserCheck className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <span className="text-slate-500 w-24">Contact:</span>
                  <span className="font-semibold text-white">{profile.contactPerson}</span>
                </div>

                <div className="flex items-center gap-3 text-slate-300">
                  <Building2 className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <span className="text-slate-500 w-24">Title:</span>
                  <span>{profile.designation}</span>
                </div>

                <div className="flex items-center gap-3 text-slate-300">
                  <Clock className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <span className="text-slate-500 w-24">Status:</span>
                  <span>{profile.verificationStatus}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-12 text-center space-y-4">
          <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center mx-auto">
            <Building2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-white text-lg">No Company Profile Set Up</h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              Complete your corporate profile to post recruitment opportunities and connect directly with placement cells.
            </p>
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-500/25 inline-flex items-center gap-2"
          >
            <Edit3 className="w-4 h-4" />
            Set Up Profile Now
          </button>
        </div>
      )}
    </div>
  );
};
