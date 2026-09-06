// src/pages/ProfilePage.tsx
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { useRole } from '../context/RoleContext';
import {
  ShieldCheck, User as UserIcon, Sparkles,
  CheckCircle2, XCircle, LogOut, Info, Shield, Users, UserCheck
} from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

export default function ProfilePage() {
  const { t } = useLanguage();
  const { currentRole, setRole, profile, logout } = useRole();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="p-4 sm:p-6 pb-24 max-w-3xl mx-auto select-none space-y-6">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center">
            <UserIcon size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              {t('profile.title') || 'Settings & Profile'}
            </h1>
            <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">
              Demo persona profile, statutory authority credentials, and access permissions.
            </p>
          </div>
        </div>

        {/* Demo Indicator */}
        <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 rounded-full text-xs font-bold">
          <Sparkles size={12} />
          <span>Hackathon Demo Mode</span>
        </span>
      </div>

      {/* ── Profile Identity Card ────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden">
        {/* Banner with Emblem */}
        <div className="bg-[var(--color-navy)] px-6 py-4 flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-[var(--color-saffron)]" />
            <span className="font-bold tracking-wide text-xs sm:text-sm uppercase">
              Legal Metrology Compliance Portal
            </span>
          </div>
          <span className="text-[10px] bg-white/20 px-2.5 py-0.5 rounded-full font-mono font-bold">
            {profile.badge}
          </span>
        </div>

        <div className="p-6 space-y-6">
          {/* Persona Details Header */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 border-b border-gray-100 dark:border-slate-800 pb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-700 via-indigo-800 to-[var(--color-navy)] text-white rounded-3xl flex items-center justify-center text-3xl font-black shadow-md flex-shrink-0">
              {profile.avatarLetter}
            </div>

            <div className="text-center sm:text-left flex-grow space-y-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h2 className="text-xl font-black text-gray-900 dark:text-white">
                  {profile.displayName}
                </h2>
                <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 self-center sm:self-auto">
                  {profile.badge}
                </span>
              </div>
              <p className="text-gray-600 dark:text-slate-300 text-xs font-semibold">
                {profile.designation}
              </p>
              <p className="text-gray-400 dark:text-slate-400 text-xs">
                {profile.department}
              </p>
            </div>
          </div>

          {/* Persona Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-gray-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-gray-100 dark:border-slate-700">
              <span className="block text-[10px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider">
                Jurisdiction & Scope
              </span>
              <span className="font-semibold text-xs text-gray-800 dark:text-slate-200 mt-0.5 block">
                {profile.jurisdiction}
              </span>
            </div>

            <div className="bg-gray-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-gray-100 dark:border-slate-700">
              <span className="block text-[10px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider">
                Authentication Status
              </span>
              <span className="font-semibold text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 block flex items-center gap-1">
                <CheckCircle2 size={13} />
                <span>Active Demo Session</span>
              </span>
            </div>
          </div>

          {/* Role Access Matrix (Allowed vs Restricted) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Allowed Capabilities */}
            <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 space-y-2">
              <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 size={15} />
                <span>Allowed Features ({profile.allowedFeatures.length})</span>
              </span>
              <ul className="space-y-1.5 text-xs text-emerald-950 dark:text-emerald-200">
                {profile.allowedFeatures.map((feat) => (
                  <li key={feat} className="flex items-start gap-1.5 text-[11px]">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Restricted Capabilities */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-2">
              <span className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <XCircle size={15} />
                <span>Restricted Modules ({profile.restrictedFeatures.length})</span>
              </span>
              {profile.restrictedFeatures.length === 0 ? (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 italic pt-1">
                  Full administrative permissions. No module restrictions applied.
                </p>
              ) : (
                <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                  {profile.restrictedFeatures.map((feat) => (
                    <li key={feat} className="flex items-start gap-1.5 text-[11px] line-through text-slate-400 dark:text-slate-500">
                      <span>✕</span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Interactive Persona Switcher for Presenters */}
          <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-500" />
                <span>Switch Presentation Persona</span>
              </span>
              <span className="text-[10px] text-gray-400">One-click role toggle</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setRole('citizen')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  currentRole === 'citizen'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
                    : 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Users size={16} className="text-emerald-600 dark:text-emerald-400" />
                  <span className="font-bold text-xs text-gray-900 dark:text-white">Citizen</span>
                </div>
                <span className="text-[10px] text-gray-500 dark:text-slate-400 block">Public Consumer View</span>
              </button>

              <button
                type="button"
                onClick={() => setRole('inspector')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  currentRole === 'inspector'
                    ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 ring-2 ring-blue-500/20 shadow-sm'
                    : 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Shield size={16} className="text-blue-600 dark:text-blue-400" />
                  <span className="font-bold text-xs text-gray-900 dark:text-white">Officer</span>
                </div>
                <span className="text-[10px] text-gray-500 dark:text-slate-400 block">Inspector #LM-204</span>
              </button>

              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  currentRole === 'admin' || currentRole === 'senior_official'
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm'
                    : 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <UserCheck size={16} className="text-indigo-600 dark:text-indigo-400" />
                  <span className="font-bold text-xs text-gray-900 dark:text-white">Admin</span>
                </div>
                <span className="text-[10px] text-gray-500 dark:text-slate-400 block">Central Directorate</span>
              </button>
            </div>
          </div>

          {/* Theme Preference */}
          <div className="bg-gray-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-gray-100 dark:border-slate-700 flex items-center justify-between">
            <div>
              <span className="block text-xs font-bold text-gray-900 dark:text-white">Display Theme Preference</span>
              <span className="text-[11px] text-gray-500 dark:text-slate-400">Toggle dark / light mode</span>
            </div>
            <ThemeToggle />
          </div>

          {/* Logout Action */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full py-3.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
            >
              <LogOut size={16} />
              <span>Log Out of Demo Session</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Security Architecture Note ───────────────────────────────────── */}
      <div className="p-4 bg-blue-50/70 dark:bg-blue-950/30 rounded-2xl border border-blue-100 dark:border-blue-900/60 text-xs text-blue-950 dark:text-blue-200 space-y-1.5">
        <div className="flex items-center gap-1.5 font-bold text-blue-900 dark:text-blue-300">
          <Info size={14} />
          <span>Hackathon Security & Architecture Statement</span>
        </div>
        <p className="text-[11px] text-blue-800/90 dark:text-blue-300/80 leading-relaxed">
          Current implementation is a hackathon demonstration using frontend role-based access simulation for seamless multi-persona workflow testing. Production implementation uses FastAPI backend authentication, OAuth2/JWT secure tokens, HttpOnly Secure cookies, password hashing, backend-enforced authorization, protected API endpoints, and audit logging.
        </p>
      </div>
    </div>
  );
}
