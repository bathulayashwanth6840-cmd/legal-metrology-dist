// src/components/Navigation.tsx
import { Link, useLocation } from 'react-router-dom';
import {
  Home, Camera, History, User, BookOpen,
  Globe, Video, FileText, TrendingUp, ShieldCheck,
  FileWarning, Search
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import type { Language } from '../i18n/LanguageContext';
import RoleSwitcher from './RoleSwitcher';
import ThemeToggle from './ThemeToggle';

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
  badge?: string;
}

interface NavSection {
  title: string;
  hasDivider?: boolean;
  items: NavItem[];
}

export default function Navigation() {
  const { language, setLanguage, t } = useLanguage();
  const location = useLocation();

  const isItemActive = (itemTo: string) => {
    const currentFullPath = location.pathname + location.search;

    if (itemTo === '/') {
      return location.pathname === '/' && location.search === '';
    }

    if (itemTo.includes('?')) {
      // Exact match for query parameters like /scan?mode=video360
      return currentFullPath === itemTo;
    }

    if (itemTo === '/scan') {
      // Active ONLY when on /scan and NOT in 360 mode
      return location.pathname === '/scan' && !location.search.includes('mode=video360');
    }

    return location.pathname.startsWith(itemTo);
  };

  const navSections: NavSection[] = [
    {
      title: 'MAIN',
      items: [
        { to: '/', icon: <Home size={18} aria-hidden="true" />, label: t('nav.home') || 'Dashboard' },
        { to: '/scan', icon: <Camera size={18} aria-hidden="true" />, label: t('nav.scan') || 'New Inspection' },
        { to: '/scan?mode=video360', icon: <Video size={18} aria-hidden="true" />, label: t('nav.video360') || '360° Scan', badge: '360°' },
      ],
    },
    {
      title: 'COMPLAINTS',
      items: [
        { to: '/complaints', icon: <FileWarning size={18} aria-hidden="true" />, label: t('nav.complaints') || 'Complaints & Enquiries', badge: 'NEW' },
        { to: '/track', icon: <Search size={18} aria-hidden="true" />, label: t('nav.track') || 'Track Complaint' },
      ],
    },
    {
      title: 'INSPECTIONS',
      items: [
        { to: '/history', icon: <History size={18} aria-hidden="true" />, label: t('nav.history') || 'Inspection History' },
        { to: '/reports', icon: <FileText size={18} aria-hidden="true" />, label: t('nav.reports') || 'Reports' },
      ],
    },
    {
      title: 'ADMINISTRATION',
      hasDivider: true,
      items: [
        { to: '/analytics', icon: <TrendingUp size={18} aria-hidden="true" />, label: t('nav.analytics') || 'Compliance Analytics' },
        { to: '/rules', icon: <BookOpen size={18} aria-hidden="true" />, label: t('nav.rules') || 'Rules & Act' },
        { to: '/profile', icon: <User size={18} aria-hidden="true" />, label: t('nav.profile') || 'Settings & Profile' },
      ],
    },
  ];

  // Mobile bottom navigation items (top essentials)
  const mobileNavItems: NavItem[] = [
    { to: '/', icon: <Home size={18} aria-hidden="true" />, label: t('nav.home') || 'Dashboard' },
    { to: '/scan', icon: <Camera size={18} aria-hidden="true" />, label: t('nav.scan') || 'Scan' },
    { to: '/complaints', icon: <FileWarning size={18} aria-hidden="true" />, label: t('nav.complaints') || 'Complaints' },
    { to: '/history', icon: <History size={18} aria-hidden="true" />, label: t('nav.history') || 'History' },
    { to: '/profile', icon: <User size={18} aria-hidden="true" />, label: t('nav.profile') || 'Settings' },
  ];

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
    { code: 'te', label: 'తెలుగు', flag: '🇮🇳' },
  ];

  return (
    <>
      {/* ── Desktop Sidebar ──────────────────────────────────────────────── */}
      <aside
        aria-label="Sidebar Navigation"
        className="hidden sm:flex flex-col w-64 bg-[var(--color-navy)] text-white min-h-screen flex-shrink-0 shadow-xl select-none"
      >
        {/* Header / Logo */}
        <div className="p-4 font-bold text-xl border-b border-blue-950/60 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl overflow-hidden border border-white/30 bg-white flex-shrink-0 shadow-sm flex items-center justify-center">
              <img
                src="/legal_metrology_logo.jpg"
                alt="Government of India Legal Metrology Logo"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <ShieldCheck size={22} className="text-blue-900" aria-hidden="true" />
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

        {/* Navigation items grouped by sections */}
        <nav aria-label="Main Navigation Menu" className="flex-1 py-3 overflow-y-auto px-2.5">
          {navSections.map((section, idx) => (
            <div
              key={section.title}
              className={`${idx > 0 ? 'mt-4' : ''} ${
                section.hasDivider ? 'border-t border-blue-900/50 pt-3 mt-4' : ''
              }`}
            >
              {/* Section Header */}
              <div
                id={`nav-sec-${section.title.toLowerCase()}`}
                className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-blue-300/60 select-none pointer-events-none"
              >
                {section.title}
              </div>

              {/* Section Nav Links */}
              <ul className="space-y-1" aria-labelledby={`nav-sec-${section.title.toLowerCase()}`}>
                {section.items.map((item) => {
                  const isActive = isItemActive(item.to);
                  return (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        aria-current={isActive ? 'page' : undefined}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl font-medium text-xs transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                          isActive
                            ? 'bg-blue-800 text-white font-bold shadow-inner border-l-4 border-[var(--color-saffron)]'
                            : 'text-blue-100/90 hover:bg-blue-900/60 hover:text-white border-l-4 border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {item.icon}
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span
                            className={`text-[8px] px-1.5 py-0.5 rounded-full uppercase transition-all ${
                              isActive
                                ? 'bg-amber-400 text-slate-950 font-black shadow-sm'
                                : 'bg-amber-400/20 text-amber-300 border border-amber-400/30 font-bold'
                            }`}
                          >
                            <span className="sr-only">Notification: </span>
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Theme Mode Toggle */}
        <div className="p-3 border-t border-blue-950/60 bg-blue-950/40">
          <ThemeToggle />
        </div>

        {/* Language Selector Section */}
        <div className="p-3.5 border-t border-blue-950/60 bg-blue-950/50">
          <div className="flex items-center gap-2 mb-1.5 text-xs font-semibold text-blue-200">
            <Globe size={13} aria-hidden="true" />
            <span>Language / भाषा / భాష</span>
          </div>
          <div
            role="group"
            aria-label="Language selection"
            className="grid grid-cols-3 gap-1 bg-blue-900/60 p-1 rounded-lg border border-blue-800/60"
          >
            {languages.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => setLanguage(lang.code)}
                aria-pressed={language === lang.code}
                aria-label={`Change language to ${lang.label}`}
                className={`py-1 px-1 rounded text-xs font-medium transition-all text-center flex flex-col items-center gap-0.5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                  language === lang.code
                    ? 'bg-[var(--color-saffron)] text-gray-900 font-bold shadow-sm'
                    : 'text-blue-100 hover:bg-blue-800/80 hover:text-white'
                }`}
                title={lang.label}
              >
                <span className="text-[11px] leading-none" aria-hidden="true">{lang.flag}</span>
                <span className="text-[9px] leading-tight font-bold">{lang.label}</span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* ── Mobile Top Role Switcher Bar ─────────────────────────────────── */}
      <header className="sm:hidden bg-[var(--color-navy)] px-4 py-2 border-b border-blue-900 flex items-center justify-between text-white">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-amber-400" aria-hidden="true" />
          <span className="font-bold text-xs">LegalMetriX</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle compact />
          <RoleSwitcher />
        </div>
      </header>

      {/* ── Mobile Bottom Tab Bar ────────────────────────────────────────── */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="sm:hidden fixed bottom-0 w-full bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 z-50 shadow-lg transition-colors"
      >
        <div className="flex justify-around items-center">
          {mobileNavItems.map((item) => {
            const active = isItemActive(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center py-2 px-1 w-full text-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                  active ? 'text-[var(--color-navy)] dark:text-amber-400 font-bold' : 'text-gray-400 dark:text-slate-400 font-normal'
                }`}
              >
                {item.icon}
                <span className="text-[9px] mt-0.5 truncate max-w-[60px]">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
