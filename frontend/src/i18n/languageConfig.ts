import { SupportedLanguage, LanguageOption } from './types';

export const LANGUAGE_STORAGE_KEY = 'cb_preferred_language';

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇬🇧',
    direction: 'ltr',
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिंदी',
    flag: '🇮🇳',
    direction: 'ltr',
  },
  {
    code: 'hi-Latn',
    name: 'Hinglish',
    nativeName: 'Hinglish',
    flag: '🇮🇳',
    direction: 'ltr',
  },
];

export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

export function isSupportedLanguage(lang: unknown): lang is SupportedLanguage {
  return typeof lang === 'string' && ['en', 'hi', 'hi-Latn'].includes(lang);
}

export function getInitialLanguage(): SupportedLanguage {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;

  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (stored && isSupportedLanguage(stored)) {
    return stored;
  }

  // Check browser language
  const browserLang = navigator.language?.toLowerCase();
  if (browserLang?.startsWith('hi')) {
    return 'hi';
  }

  return DEFAULT_LANGUAGE;
}
