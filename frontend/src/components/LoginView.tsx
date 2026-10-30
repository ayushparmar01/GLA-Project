import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/I18nContext';
import { LanguageSelector } from './common/LanguageSelector';
import { Mail, Lock, AlertCircle, ArrowRight, Eye, EyeOff, Sparkles, User, School, Briefcase, ShieldCheck } from 'lucide-react';
import { BrandLogo } from './common/BrandLogo';

interface LoginViewProps {
  onSuccess: () => void;
  onSwitchToRegister: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onSuccess, onSwitchToRegister }) => {
  const { login } = useAuth();
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError(t('auth.validation.emailRequired'));
      return;
    }

    setSubmitting(true);
    const result = await login(email.trim(), password);
    setSubmitting(false);

    if (result.success) {
      onSuccess();
    } else {
      setError(result.error || 'Invalid email or password. Please verify credentials.');
    }
  };

  const handleDemoFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('DemoPass@123');
    setError(null);
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4 sm:px-6">
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/90 p-8 sm:p-10 relative">
        <div className="absolute top-5 right-5">
          <LanguageSelector variant="compact" />
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <BrandLogo size="lg" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{t('auth.login.title')}</h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 max-w-xs mx-auto">
            {t('auth.login.subtitle')}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start space-x-3 text-rose-700 text-xs sm:text-sm animate-fadeIn">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
            <div>{error}</div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">{t('auth.login.emailLabel')}</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@college.edu or name@company.com"
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-hidden transition-all bg-slate-50/50 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">{t('auth.login.passwordLabel')}</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-11 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-hidden transition-all bg-slate-50/50 focus:bg-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 focus:outline-hidden"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition-all shadow-md shadow-emerald-700/20 hover:shadow-lg disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer"
          >
            <span>{submitting ? t('auth.login.signingIn') : t('auth.login.submitBtn')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Switch to Register */}
        <div className="mt-6 text-center text-xs text-slate-500">
          {t('auth.login.noAccount')}{' '}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="text-emerald-600 font-bold hover:underline cursor-pointer ml-1"
          >
            {t('auth.login.registerLink')}
          </button>
        </div>

        {/* Quick Demo Credentials Panel for Hackathon Evaluators */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Hackathon Evaluation Demo Credentials</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <button
              type="button"
              onClick={() => handleDemoFill('student01@careerbridge.demo')}
              className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 transition text-left flex items-center space-x-2 text-slate-700 hover:text-emerald-900"
            >
              <User className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <div className="truncate">
                <span className="font-bold block truncate">Student Demo</span>
                <span className="text-[10px] text-slate-400 block truncate">student01@</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleDemoFill('college01@careerbridge.demo')}
              className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-teal-50 hover:border-teal-200 transition text-left flex items-center space-x-2 text-slate-700 hover:text-teal-900"
            >
              <School className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <div className="truncate">
                <span className="font-bold block truncate">College Demo</span>
                <span className="text-[10px] text-slate-400 block truncate">college01@</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleDemoFill('employer01@careerbridge.demo')}
              className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 transition text-left flex items-center space-x-2 text-slate-700 hover:text-indigo-900"
            >
              <Briefcase className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <div className="truncate">
                <span className="font-bold block truncate">Employer Demo</span>
                <span className="text-[10px] text-slate-400 block truncate">employer01@</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleDemoFill('admin@careerbridge.demo')}
              className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-purple-50 hover:border-purple-200 transition text-left flex items-center space-x-2 text-slate-700 hover:text-purple-900"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <div className="truncate">
                <span className="font-bold block truncate">Admin Demo</span>
                <span className="text-[10px] text-slate-400 block truncate">admin@</span>
              </div>
            </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 text-center">
            Click any role to autofill verified test accounts (Password: DemoPass@123)
          </p>
        </div>
      </div>
    </div>
  );
};
