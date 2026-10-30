import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../../i18n/I18nContext';
import { SupportedLanguage } from '../../i18n/types';
import { Globe, Check, ChevronDown } from 'lucide-react';

interface LanguageSelectorProps {
  variant?: 'compact' | 'full' | 'inline';
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'compact',
  className = '',
}) => {
  const { language, changeLanguage, supportedLanguages, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on Escape key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const currentLangObj =
    supportedLanguages.find((l) => l.code === language) || supportedLanguages[0];

  const handleSelect = (code: SupportedLanguage) => {
    changeLanguage(code);
    setIsOpen(false);
  };

  // Inline buttons variant (e.g. for Profile Settings)
  if (variant === 'inline') {
    return (
      <div className={`space-y-2 ${className}`}>
        <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-emerald-600" />
          <span>{t('common.language.selectLanguage')}</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {supportedLanguages.map((lang) => {
            const isSelected = language === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleSelect(lang.code)}
                className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 font-bold ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                }`}
                aria-pressed={isSelected}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base" role="img" aria-label={lang.name}>
                    {lang.flag}
                  </span>
                  <div>
                    <div className="text-sm font-semibold">{lang.nativeName}</div>
                    <div className="text-xs text-slate-400">{lang.name}</div>
                  </div>
                </div>
                {isSelected && <Check className="w-4 h-4 text-emerald-600" />}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Dropdown selector variant (compact / full)
  return (
    <div
      ref={dropdownRef}
      className={`relative inline-block text-left ${className}`}
      onKeyDown={handleKeyDown}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all cursor-pointer ${
          variant === 'compact'
            ? 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 shadow-2xs'
            : 'border-slate-300 bg-white hover:bg-slate-50 text-slate-800 shadow-xs'
        }`}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={t('common.language.selectLanguage')}
        title={`${t('common.language.currentLanguage')}: ${currentLangObj.nativeName}`}
      >
        <Globe className="w-3.5 h-3.5 text-emerald-600" />
        <span className="hidden sm:inline">{currentLangObj.flag}</span>
        <span className="font-medium">{currentLangObj.nativeName}</span>
        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className="origin-top-right absolute right-0 mt-2 w-48 rounded-2xl shadow-lg bg-white ring-1 ring-black/5 divide-y divide-slate-100 focus:outline-none z-50 p-1.5 animate-in fade-in-50 zoom-in-95 duration-100"
          role="menu"
          aria-orientation="vertical"
        >
          <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            {t('common.language.selectLanguage')}
          </div>
          <div className="py-1">
            {supportedLanguages.map((lang) => {
              const isSelected = language === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleSelect(lang.code)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50 text-emerald-900 font-bold'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                  role="menuitem"
                >
                  <div className="flex items-center gap-2">
                    <span>{lang.flag}</span>
                    <span>{lang.nativeName}</span>
                    <span className="text-[10px] text-slate-400">({lang.name})</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
