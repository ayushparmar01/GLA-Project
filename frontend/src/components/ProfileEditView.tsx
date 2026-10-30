import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/I18nContext';
import { LanguageSelector } from './common/LanguageSelector';
import { SupportedLanguage } from '../i18n/types';
import { User, Lock, Mail, Globe, Phone, Building, ArrowLeft, Save, Plus, X, AlertCircle, CheckCircle } from 'lucide-react';
import { WhatsAppIntegrationCard } from './whatsapp/WhatsAppIntegrationCard';
import { WhatsAppAssistantPreview } from './whatsapp/WhatsAppAssistantPreview';

interface ProfileEditViewProps {
  onBack: () => void;
}

export const ProfileEditView: React.FC<ProfileEditViewProps> = ({ onBack }) => {
  const { user, token, updateProfile } = useAuth();
  const { t, changeLanguage, supportedLanguages } = useTranslation();
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

  // Base fields
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [preferredLanguage, setPreferredLanguage] = useState(user?.preferredLanguage || 'en');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');

  // Student fields
  const sp = user?.studentProfile || {};
  const [collegeName, setCollegeName] = useState(sp.collegeName || '');
  const [course, setCourse] = useState(sp.course || '');
  const [educationLevel, setEducationLevel] = useState(sp.educationLevel || 'Undergraduate');
  const [graduationYear, setGraduationYear] = useState<number | ''>(sp.graduationYear || 2026);
  const [skills, setSkills] = useState<string[]>(sp.skills || []);
  const [newSkill, setNewSkill] = useState('');
  const [careerInterests, setCareerInterests] = useState<string[]>(sp.careerInterests || []);
  const [newInterest, setNewInterest] = useState('');
  const [preferredWorkLocation, setPreferredWorkLocation] = useState<string[]>(sp.preferredWorkLocation || []);
  const [newLocation, setNewLocation] = useState('');

  // Employer fields
  const ep = user?.employerProfile || {};
  const [orgName, setOrgName] = useState(ep.organizationName || '');
  const [industry, setIndustry] = useState(ep.industry || '');
  const [orgLocation, setOrgLocation] = useState(ep.organizationLocation || '');
  const [orgDescription, setOrgDescription] = useState(ep.organizationDescription || '');
  const [hiringInterests, setHiringInterests] = useState<string[]>(ep.hiringInterests || []);
  const [newHiringRole, setNewHiringRole] = useState('');

  // College fields
  const cp = user?.collegeProfile || {};
  const [instName, setInstName] = useState(cp.institutionName || '');
  const [instLocation, setInstLocation] = useState(cp.institutionLocation || '');
  const [instType, setInstType] = useState(cp.institutionType || 'Rural Higher Education');
  const [contactPerson, setContactPerson] = useState(cp.contactPerson || '');
  const [placementEmail, setPlacementEmail] = useState(cp.placementEmail || '');
  const [placementPhone, setPlacementPhone] = useState(cp.placementPhone || '');

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync state when user object updates
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setPreferredLanguage(user.preferredLanguage || 'en');
      setPhoneNumber(user.phoneNumber || '');
      if (user.studentProfile) {
        setCollegeName(user.studentProfile.collegeName || '');
        setCourse(user.studentProfile.course || '');
        setEducationLevel(user.studentProfile.educationLevel || 'Undergraduate');
        setGraduationYear(user.studentProfile.graduationYear || 2026);
        setSkills(user.studentProfile.skills || []);
        setCareerInterests(user.studentProfile.careerInterests || []);
        setPreferredWorkLocation(user.studentProfile.preferredWorkLocation || []);
      }
      if (user.employerProfile) {
        setOrgName(user.employerProfile.organizationName || '');
        setIndustry(user.employerProfile.industry || '');
        setOrgLocation(user.employerProfile.organizationLocation || '');
        setOrgDescription(user.employerProfile.organizationDescription || '');
        setHiringInterests(user.employerProfile.hiringInterests || []);
      }
      if (user.collegeProfile) {
        setInstName(user.collegeProfile.institutionName || '');
        setInstLocation(user.collegeProfile.institutionLocation || '');
        setInstType(user.collegeProfile.institutionType || 'Rural Higher Education');
        setContactPerson(user.collegeProfile.contactPerson || '');
        setPlacementEmail(user.collegeProfile.placementEmail || '');
        setPlacementPhone(user.collegeProfile.placementPhone || '');
      }
    }
  }, [user]);

  if (!user) {
    return null;
  }

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleAddInterest = () => {
    if (newInterest.trim() && !careerInterests.includes(newInterest.trim())) {
      setCareerInterests([...careerInterests, newInterest.trim()]);
      setNewInterest('');
    }
  };

  const handleRemoveInterest = (itemToRemove: string) => {
    setCareerInterests(careerInterests.filter((i) => i !== itemToRemove));
  };

  const handleAddLocation = () => {
    if (newLocation.trim() && !preferredWorkLocation.includes(newLocation.trim())) {
      setPreferredWorkLocation([...preferredWorkLocation, newLocation.trim()]);
      setNewLocation('');
    }
  };

  const handleRemoveLocation = (locToRemove: string) => {
    setPreferredWorkLocation(preferredWorkLocation.filter((l) => l !== locToRemove));
  };

  const handleAddHiringRole = () => {
    if (newHiringRole.trim() && !hiringInterests.includes(newHiringRole.trim())) {
      setHiringInterests([...hiringInterests, newHiringRole.trim()]);
      setNewHiringRole('');
    }
  };

  const handleRemoveHiringRole = (roleToRemove: string) => {
    setHiringInterests(hiringInterests.filter((r) => r !== roleToRemove));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const payload: Record<string, unknown> = {
      fullName: fullName.trim(),
      preferredLanguage,
      phoneNumber: phoneNumber.trim() || undefined,
    };

    if (user.role === 'STUDENT') {
      payload.studentProfile = {
        collegeName: collegeName.trim(),
        course: course.trim(),
        educationLevel,
        graduationYear: typeof graduationYear === 'number' ? graduationYear : undefined,
        skills,
        careerInterests,
        preferredWorkLocation,
      };
    } else if (user.role === 'EMPLOYER') {
      payload.employerProfile = {
        organizationName: orgName.trim(),
        industry: industry.trim(),
        organizationLocation: orgLocation.trim(),
        organizationDescription: orgDescription.trim(),
        hiringInterests,
      };
    } else if (user.role === 'COLLEGE') {
      payload.collegeProfile = {
        institutionName: instName.trim(),
        institutionLocation: instLocation.trim(),
        institutionType: instType.trim(),
        contactPerson: contactPerson.trim(),
        placementEmail: placementEmail.trim() || undefined,
        placementPhone: placementPhone.trim() || undefined,
      };
    }

    const res = await updateProfile(payload);
    setSaving(false);

    if (res.success) {
      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } else {
      setErrorMsg(res.error || 'Failed to update profile.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('actions.backToDashboard')}</span>
        </button>
        <div className="flex items-center gap-3">
          <LanguageSelector variant="compact" />
          <span className="hidden sm:inline text-xs text-slate-500 font-mono">
            Security: Role & Identity Immutable
          </span>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="border-b border-slate-200 pb-5 mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Edit Profile & Credentials</h2>
          <p className="text-slate-500 text-sm mt-1">
            Maintain your verified profile information according to your {user.role.toLowerCase()} credentials.
          </p>
        </div>

        {successMsg && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center space-x-3 text-emerald-800 text-sm">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center space-x-3 text-rose-800 text-sm">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Read-Only Identity Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1 flex items-center space-x-1">
                <span>Email Address</span>
                <Lock className="w-3 h-3 text-slate-400" />
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-100 text-slate-500 cursor-not-allowed font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1 flex items-center space-x-1">
                <span>Account Role</span>
                <Lock className="w-3 h-3 text-slate-400" />
              </label>
              <div className="relative">
                <Building className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  disabled
                  value={user.role}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-100 text-slate-500 cursor-not-allowed font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Editable General Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t('common.language.selectLanguage')}</label>
              <div className="relative">
                <Globe className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <select
                  value={preferredLanguage}
                  onChange={(e) => {
                    const val = e.target.value as SupportedLanguage;
                    setPreferredLanguage(val);
                    changeLanguage(val);
                  }}
                  className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white cursor-pointer"
                >
                  {supportedLanguages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.flag} {lang.nativeName} ({lang.name})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number <span className="text-slate-400 font-normal">(Optional & Private)</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g. +91 9876543210"
                  className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Student Role Section */}
          {user.role === 'STUDENT' && (
            <div className="border-t border-slate-200 pt-6 space-y-4">
              <h3 className="text-base font-bold text-slate-900">Student Profile & Academic Details</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">College / Institution</label>
                  <input
                    type="text"
                    value={collegeName}
                    onChange={(e) => setCollegeName(e.target.value)}
                    placeholder="e.g. Govt Engineering College, Bilaspur"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Course / Degree</label>
                  <input
                    type="text"
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    placeholder="e.g. B.Tech Computer Science"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Education Level</label>
                  <select
                    value={educationLevel}
                    onChange={(e) => setEducationLevel(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                  >
                    <option value="Diploma">Diploma / Polytechnic</option>
                    <option value="Undergraduate">Undergraduate (B.E. / B.Tech / B.Sc / B.Com)</option>
                    <option value="Postgraduate">Postgraduate (M.Tech / MCA / M.Sc / MBA)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Graduation Year</label>
                  <input
                    type="number"
                    min="1990"
                    max="2035"
                    value={graduationYear}
                    onChange={(e) => setGraduationYear(e.target.value ? parseInt(e.target.value, 10) : '')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Skills Tags */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Skills <span className="text-slate-400 font-normal">(Add up to 50 skills)</span>
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                    placeholder="e.g. Python, SQL, React, Linux"
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors flex items-center space-x-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add</span>
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="bg-emerald-50 text-emerald-800 text-xs px-2.5 py-1 rounded-md font-medium border border-emerald-200 inline-flex items-center space-x-1"
                    >
                      <span>{skill}</span>
                      <button type="button" onClick={() => handleRemoveSkill(skill)} className="hover:text-rose-600">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Career Interests Tags */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Career Interests</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newInterest}
                    onChange={(e) => setNewInterest(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddInterest();
                      }
                    }}
                    placeholder="e.g. Frontend Developer, QA Automation, Data Analyst"
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddInterest}
                    className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors flex items-center space-x-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add</span>
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {careerInterests.map((interest, idx) => (
                    <span
                      key={idx}
                      className="bg-teal-50 text-teal-800 text-xs px-2.5 py-1 rounded-md font-medium border border-teal-200 inline-flex items-center space-x-1"
                    >
                      <span>{interest}</span>
                      <button type="button" onClick={() => handleRemoveInterest(interest)} className="hover:text-rose-600">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Preferred Locations */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Preferred Work Locations</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddLocation();
                      }
                    }}
                    placeholder="e.g. Remote, Pune, Hyderabad, Noida"
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddLocation}
                    className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors flex items-center space-x-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add</span>
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {preferredWorkLocation.map((loc, idx) => (
                    <span
                      key={idx}
                      className="bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-md font-medium border border-slate-200 inline-flex items-center space-x-1"
                    >
                      <span>{loc}</span>
                      <button type="button" onClick={() => handleRemoveLocation(loc)} className="hover:text-rose-600">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Employer Role Section */}
          {user.role === 'EMPLOYER' && (
            <div className="border-t border-slate-200 pt-6 space-y-4">
              <h3 className="text-base font-bold text-slate-900">Company & Hiring Details</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Organization Name</label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Industry Sector</label>
                  <input
                    type="text"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="e.g. IT Services, Core Engineering, EdTech"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={orgLocation}
                    onChange={(e) => setOrgLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">About Company</label>
                  <textarea
                    rows={3}
                    value={orgDescription}
                    onChange={(e) => setOrgDescription(e.target.value)}
                    placeholder="Brief description of your company culture and mission..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Hiring Roles Tags */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Hiring Roles</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newHiringRole}
                    onChange={(e) => setNewHiringRole(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddHiringRole();
                      }
                    }}
                    placeholder="e.g. Junior Software Engineer, QA Tester"
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddHiringRole}
                    className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors flex items-center space-x-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add</span>
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {hiringInterests.map((role, idx) => (
                    <span
                      key={idx}
                      className="bg-indigo-50 text-indigo-800 text-xs px-2.5 py-1 rounded-md font-medium border border-indigo-200 inline-flex items-center space-x-1"
                    >
                      <span>{role}</span>
                      <button type="button" onClick={() => handleRemoveHiringRole(role)} className="hover:text-rose-600">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* College Role Section */}
          {user.role === 'COLLEGE' && (
            <div className="border-t border-slate-200 pt-6 space-y-4">
              <h3 className="text-base font-bold text-slate-900">Institution & Placement Cell Details</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Institution Name</label>
                  <input
                    type="text"
                    value={instName}
                    onChange={(e) => setInstName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Campus Location</label>
                  <input
                    type="text"
                    value={instLocation}
                    onChange={(e) => setInstLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Institution Type</label>
                  <input
                    type="text"
                    value={instType}
                    onChange={(e) => setInstType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">TPO / Faculty Coordinator</label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Placement Email</label>
                  <input
                    type="email"
                    value={placementEmail}
                    onChange={(e) => setPlacementEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Placement Desk Phone</label>
                  <input
                    type="tel"
                    value={placementPhone}
                    onChange={(e) => setPlacementPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onBack}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-all shadow-md shadow-emerald-700/25 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Student WhatsApp Career Assistant Integration (Phase 10) */}
      {user.role === 'STUDENT' && (
        <div className="mt-8">
          <WhatsAppIntegrationCard
            token={token}
            onPreviewRequested={() => setIsSimulatorOpen(true)}
          />
        </div>
      )}

      {/* Interactive WhatsApp Assistant Simulator Modal */}
      {isSimulatorOpen && (
        <WhatsAppAssistantPreview onClose={() => setIsSimulatorOpen(false)} />
      )}
    </div>
  );
};
