import { NavLink } from 'react-router-dom';
import { Home, Camera, History, User, BookOpen, Globe } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import type { Language } from '../i18n/LanguageContext';

export default function Navigation() {
  const { language, setLanguage, t } = useLanguage();

  const navItems = [
    { to: '/', icon: <Home size={22} />, label: t('nav.home') },
    { to: '/scan', icon: <Camera size={22} />, label: t('nav.scan') },
    { to: '/history', icon: <History size={22} />, label: t('nav.history') },
    { to: '/rules', icon: <BookOpen size={22} />, label: t('nav.rules') },
    { to: '/profile', icon: <User size={22} />, label: t('nav.profile') },
  ];

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
    { code: 'te', label: 'తెలుగు', flag: '🇮🇳' },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden sm:flex flex-col w-64 bg-[var(--color-navy)] text-white min-h-screen flex-shrink-0 shadow-lg select-none">
        {/* Header / Logo */}
        <div className="p-5 font-bold text-xl border-b border-blue-950/60 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border border-white/30 bg-white flex-shrink-0 shadow-sm">
            <img src="/legal_metrology_logo.jpg" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <span className="tracking-wide text-white block font-black">LegalMetriX</span>
            <span className="text-[10px] text-blue-200 font-medium tracking-wider uppercase block">Compliance Scanner</span>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 py-4">
          <ul className="space-y-1 px-2">
            {navItems.map(item => (
              <li key={item.to}>
                <NavLink 
                  to={item.to} 
                  className={({ isActive }) => 
                    `flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-all ${
                      isActive 
                        ? 'bg-blue-800 text-white font-semibold shadow-inner border-l-4 border-[var(--color-saffron)]' 
                        : 'text-blue-100 hover:bg-blue-900/60 hover:text-white border-l-4 border-transparent'
                    }`
                  }
                >
                  {item.icon}
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Language Selector Section */}
        <div className="p-4 border-t border-blue-950/60 bg-blue-950/40">
          <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-blue-200">
            <Globe size={14} />
            <span>Language / भाषा / భాష</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 bg-blue-900/60 p-1 rounded-lg border border-blue-800/60">
            {languages.map(lang => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`py-1.5 px-1 rounded text-xs font-medium transition-all text-center flex flex-col items-center gap-0.5 ${
                  language === lang.code
                    ? 'bg-[var(--color-saffron)] text-gray-900 font-bold shadow-sm'
                    : 'text-blue-100 hover:bg-blue-800/80 hover:text-white'
                }`}
                title={lang.label}
              >
                <span className="text-[11px] leading-none">{lang.flag}</span>
                <span className="text-[10px] leading-tight">{lang.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <div className="sm:hidden fixed bottom-0 w-full bg-white border-t border-gray-200 z-50 shadow-lg">
        <nav className="flex justify-around items-center">
          {navItems.map(item => (
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
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </>
  );
}
