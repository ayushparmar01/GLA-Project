import { SupportedLanguage } from './types';
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, LANGUAGE_STORAGE_KEY } from './languageConfig';

// Import English locale modules
import enCommon from './locales/en/common.json';
import enAuth from './locales/en/auth.json';
import enStudent from './locales/en/student.json';
import enEmployer from './locales/en/employer.json';
import enCollege from './locales/en/college.json';
import enAdmin from './locales/en/admin.json';
import enJobs from './locales/en/jobs.json';
import enResume from './locales/en/resume.json';
import enAssessments from './locales/en/assessments.json';
import enAssistant from './locales/en/assistant.json';
import enNotifications from './locales/en/notifications.json';
import enWhatsapp from './locales/en/whatsapp.json';

// Import Hindi locale modules
import hiCommon from './locales/hi/common.json';
import hiAuth from './locales/hi/auth.json';
import hiStudent from './locales/hi/student.json';
import hiEmployer from './locales/hi/employer.json';
import hiCollege from './locales/hi/college.json';
import hiAdmin from './locales/hi/admin.json';
import hiJobs from './locales/hi/jobs.json';
import hiResume from './locales/hi/resume.json';
import hiAssessments from './locales/hi/assessments.json';
import hiAssistant from './locales/hi/assistant.json';
import hiNotifications from './locales/hi/notifications.json';
import hiWhatsapp from './locales/hi/whatsapp.json';

// Import Hinglish locale modules
import hiLatnCommon from './locales/hi-Latn/common.json';
import hiLatnAuth from './locales/hi-Latn/auth.json';
import hiLatnStudent from './locales/hi-Latn/student.json';
import hiLatnEmployer from './locales/hi-Latn/employer.json';
import hiLatnCollege from './locales/hi-Latn/college.json';
import hiLatnAdmin from './locales/hi-Latn/admin.json';
import hiLatnJobs from './locales/hi-Latn/jobs.json';
import hiLatnResume from './locales/hi-Latn/resume.json';
import hiLatnAssessments from './locales/hi-Latn/assessments.json';
import hiLatnAssistant from './locales/hi-Latn/assistant.json';
import hiLatnNotifications from './locales/hi-Latn/notifications.json';
import hiLatnWhatsapp from './locales/hi-Latn/whatsapp.json';

export const resources: Record<SupportedLanguage, Record<string, any>> = {
  en: {
    common: enCommon,
    auth: enAuth,
    student: enStudent,
    employer: enEmployer,
    college: enCollege,
    admin: enAdmin,
    jobs: enJobs,
    resume: enResume,
    assessments: enAssessments,
    assistant: enAssistant,
    notifications: enNotifications,
    whatsapp: enWhatsapp,
  },
  hi: {
    common: hiCommon,
    auth: hiAuth,
    student: hiStudent,
    employer: hiEmployer,
    college: hiCollege,
    admin: hiAdmin,
    jobs: hiJobs,
    resume: hiResume,
    assessments: hiAssessments,
    assistant: hiAssistant,
    notifications: hiNotifications,
    whatsapp: hiWhatsapp,
  },
  'hi-Latn': {
    common: hiLatnCommon,
    auth: hiLatnAuth,
    student: hiLatnStudent,
    employer: hiLatnEmployer,
    college: hiLatnCollege,
    admin: hiLatnAdmin,
    jobs: hiLatnJobs,
    resume: hiLatnResume,
    assessments: hiLatnAssessments,
    assistant: hiLatnAssistant,
    notifications: hiLatnNotifications,
    whatsapp: hiLatnWhatsapp,
  },
};

/**
 * Resolves a nested translation key (e.g., 'common.brand.name' or 'student.dashboard.welcome')
 * with fallback to English if missing, and replaces interpolation variables {{var}}.
 */
export function lookupTranslation(
  lang: SupportedLanguage,
  key: string,
  params?: Record<string, string | number>
): string {
  if (!key) return '';

  const parts = key.split('.');
  const primaryNs = parts[0];

  let current: any = resources[lang]?.[primaryNs];
  let found = true;

  for (let i = 1; i < parts.length; i++) {
    if (current && typeof current === 'object' && parts[i] in current) {
      current = current[parts[i]];
    } else {
      found = false;
      break;
    }
  }

  // Fallback to English if not found in requested language
  if (!found || typeof current !== 'string') {
    current = resources[DEFAULT_LANGUAGE]?.[primaryNs];
    found = true;
    for (let i = 1; i < parts.length; i++) {
      if (current && typeof current === 'object' && parts[i] in current) {
        current = current[parts[i]];
      } else {
        found = false;
        break;
      }
    }
  }

  if (!found || typeof current !== 'string') {
    return key; // return key as safe fallback
  }

  // Handle interpolation {{param}}
  if (params && typeof current === 'string') {
    let interpolated = current;
    for (const [pKey, pVal] of Object.entries(params)) {
      interpolated = interpolated.replace(
        new RegExp(`{{\\s*${pKey}\\s*}}`, 'g'),
        String(pVal)
      );
    }
    return interpolated;
  }

  return current;
}

export function formatI18nDate(
  date: Date | string,
  lang: SupportedLanguage,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  const locale = lang === 'hi' ? 'hi-IN' : 'en-IN';
  return d.toLocaleDateString(locale, options || { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatI18nNumber(
  num: number,
  lang: SupportedLanguage,
  options?: Intl.NumberFormatOptions
): string {
  const locale = lang === 'hi' ? 'hi-IN' : 'en-IN';
  return num.toLocaleString(locale, options);
}

export function formatI18nCurrency(amount: number, lang: SupportedLanguage): string {
  const locale = lang === 'hi' ? 'hi-IN' : 'en-IN';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export * from './types';
export * from './languageConfig';
