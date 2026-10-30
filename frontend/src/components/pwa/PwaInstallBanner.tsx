import React, { useState } from 'react';
import { usePwaInstall } from '../../pwa/usePwaInstall';
import { Download, X, Sparkles, Smartphone, Check } from 'lucide-react';

interface PwaInstallBannerProps {
  variant?: 'banner' | 'pill' | 'button';
  className?: string;
}

export const PwaInstallBanner: React.FC<PwaInstallBannerProps> = ({
  variant = 'banner',
  className = '',
}) => {
  const { isInstallable, isInstalled, promptInstall, dismissBanner } = usePwaInstall();
  const [installing, setInstalling] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  if (isInstalled) {
    if (variant === 'button') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <Check className="w-3.5 h-3.5" />
          <span>App Installed</span>
        </span>
      );
    }
    return null;
  }

  if (!isInstallable) {
    return null;
  }

  const handleInstall = async () => {
    setInstalling(true);
    const accepted = await promptInstall();
    setInstalling(false);
    if (accepted) {
      setInstalledSuccess(true);
    }
  };

  // Compact Pill Button for Navbar / Footer
  if (variant === 'pill' || variant === 'button') {
    return (
      <button
        type="button"
        onClick={handleInstall}
        disabled={installing}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-sm hover:shadow-emerald-500/20 cursor-pointer ${className}`}
        title="Install CareerBridge App for faster access and offline mode"
      >
        <Download className="w-3.5 h-3.5" />
        <span>{installing ? 'Installing...' : 'Install App'}</span>
      </button>
    );
  }

  // Floating or In-page Banner variant
  return (
    <div
      className={`bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 shadow-xl text-white relative overflow-hidden ${className}`}
      role="region"
      aria-label="Install CareerBridge Application"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 flex-shrink-0">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold tracking-tight text-white">
                Install CareerBridge App
              </h4>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <Sparkles className="w-2.5 h-2.5" /> Fast & 0-Data Shell
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 max-w-xl">
              Access placement drives, review resume drafts, and explore opportunities offline. Designed for low-connectivity campuses across Tier-2/3 India.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={dismissBanner}
            className="px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            Not Now
          </button>
          <button
            type="button"
            onClick={handleInstall}
            disabled={installing}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{installing ? 'Opening Prompt...' : 'Install Free'}</span>
          </button>
        </div>
      </div>

      {/* Decorative gradient glow */}
      <div className="absolute right-0 top-0 -translate-y-8 translate-x-8 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
    </div>
  );
};
