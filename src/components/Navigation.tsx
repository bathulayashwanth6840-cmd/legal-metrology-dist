// src/components/Navigation.tsx
import { NavLink } from 'react-router-dom';
import {
  Home, Camera, History, User, BookOpen,
  Globe, Video, FileText, TrendingUp, ShieldCheck,
  FileWarning, Search
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import type { Language } from '../i18n/LanguageContext';
import RoleSwitcher from './RoleSwitcher';

export default function Navigation() {
  const { language, setLanguage, t } = useLanguage();

  const navItems = [
    { to: '/', icon: <Home size={18} />, label: t('nav.home') || 'Dashboard' },
    { to: '/scan', icon: <Camera size={18} />, label: t('nav.scan') || 'New Inspection' },
    { to: '/scan?mode=video360', icon: <Video size={18} />, label: t('nav.video360') || '360° Scan', badge: '360°' },
    { to: '/complaints', icon: <FileWarning size={18} />, label: t('nav.complaints') || 'Complaints & Enquiries', badge: 'NEW' },
    { to: '/track', icon: <Search size={18} />, label: t('nav.track') || 'Track Complaint' },
    { to: '/history', icon: <History size={18} />, label: t('nav.history') || 'Inspection History' },
    { to: '/reports', icon: <FileText size={18} />, label: t('nav.reports') || 'Reports' },
    { to: '/analytics', icon: <TrendingUp size={18} />, label: t('nav.analytics') || 'Compliance Analytics' },
    { to: '/rules', icon: <BookOpen size={18} />, label: t('nav.rules') || 'Rules & Act' },
    { to: '/profile', icon: <User size={18} />, label: t('nav.profile') || 'Settings' },
  ];

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
    { code: 'te', label: 'తెలుగు', flag: '🇮🇳' },
  ];

  return (
    <>
      {/* ── Desktop Sidebar ──────────────────────────────────────────────── */}
      <div className="hidden sm:flex flex-col w-64 bg-[var(--color-navy)] text-white min-h-screen flex-shrink-0 shadow-xl select-none">
        {/* Header / Logo */}
        <div className="p-4 font-bold text-xl border-b border-blue-950/60 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl overflow-hidden border border-white/30 bg-white flex-shrink-0 shadow-sm flex items-center justify-center">
              <img src="/legal_metrology_logo.jpg" alt="Logo" className="w-full h-full object-cover" onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }} />
              <ShieldCheck size={22} className="text-blue-900" />
            </div>
            <div>
              <span className="tracking-wide text-white block font-black text-base leading-tight">LegalMetriX</span>
              <span className="text-[9px] text-blue-200 font-bold tracking-wider uppercase block">
                Enforcement Portal
              </span>
            </div>
          </div>
        </div>

        {/* Live Role Persona Switcher in Header */}
        <div className="px-3.5 py-2.5 bg-blue-950/70 border-b border-blue-900/60 flex items-center justify-between">
          <RoleSwitcher />
          <span className="text-[9px] bg-amber-400/20 text-amber-300 font-bold px-1.5 py-0.5 rounded-md border border-amber-400/30">
            SIH 2024
          </span>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 py-2.5 overflow-y-auto">
          <ul className="space-y-1 px-2.5">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2 rounded-xl font-medium text-xs transition-all ${
                      isActive
                        ? 'bg-blue-800 text-white font-bold shadow-inner border-l-4 border-[var(--color-saffron)]'
                        : 'text-blue-100 hover:bg-blue-900/60 hover:text-white border-l-4 border-transparent'
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[8px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.5 rounded-full uppercase">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Language Selector Section */}
        <div className="p-3.5 border-t border-blue-950/60 bg-blue-950/50">
          <div className="flex items-center gap-2 mb-1.5 text-xs font-semibold text-blue-200">
            <Globe size={13} />
            <span>Language / भाषा / భాష</span>
          </div>
          <div className="grid grid-cols-3 gap-1 bg-blue-900/60 p-1 rounded-lg border border-blue-800/60">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`py-1 px-1 rounded text-xs font-medium transition-all text-center flex flex-col items-center gap-0.5 cursor-pointer ${
                  language === lang.code
                    ? 'bg-[var(--color-saffron)] text-gray-900 font-bold shadow-sm'
                    : 'text-blue-100 hover:bg-blue-800/80 hover:text-white'
                }`}
                title={lang.label}
              >
                <span className="text-[11px] leading-none">{lang.flag}</span>
                <span className="text-[9px] leading-tight font-bold">{lang.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Mobile Top Role Switcher Bar ─────────────────────────────────── */}
      <div className="sm:hidden bg-[var(--color-navy)] px-4 py-2 border-b border-blue-900 flex items-center justify-between text-white">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-amber-400" />
          <span className="font-bold text-xs">LegalMetriX</span>
        </div>
        <RoleSwitcher />
      </div>

      {/* ── Mobile Bottom Tab Bar ────────────────────────────────────────── */}
      <div className="sm:hidden fixed bottom-0 w-full bg-white border-t border-gray-200 z-50 shadow-lg">
        <nav className="flex justify-around items-center">
          {navItems.slice(0, 5).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center py-2 px-1 w-full text-center transition-colors ${
                  isActive ? 'text-[var(--color-navy)] font-bold' : 'text-gray-400 font-normal'
                }`
              }
            >
              {item.icon}
              <span className="text-[9px] mt-0.5 truncate max-w-[60px]">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </>
  );
}
