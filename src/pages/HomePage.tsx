import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { Camera, History, BookOpen, CheckCircle, Search, ShieldCheck } from 'lucide-react';

export default function HomePage() {
  const { t } = useLanguage();
  const [backendStatus, setBackendStatus] = useState<string>('checking...');

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    fetch(`${apiUrl}/healthz`)
      .then(res => res.json())
      .then(() => setBackendStatus('online'))
      .catch(() => {
        fetch(`${apiUrl}/`)
          .then(res => res.json())
          .then(() => setBackendStatus('online'))
          .catch(() => setBackendStatus('offline'));
      });
  }, []);

  return (
    <div className="flex flex-col min-h-full select-none">
      {/* Mobile Top Header */}
      <header className="bg-[var(--color-navy)] text-white p-4 sm:p-6 shadow-md sm:hidden">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full overflow-hidden border border-white bg-white">
              <img src="/legal_metrology_logo.jpg" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight">LegalMetriX</h1>
              <p className="text-[10px] text-blue-200 uppercase tracking-wider">Compliance Scanner</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 sm:p-8 flex flex-col items-center justify-center text-center pb-24 sm:pb-8">
        {/* Backend Status Badge */}
        <div className="hidden sm:inline-flex items-center gap-2 mb-5 px-3 py-1 bg-white rounded-full border border-gray-200 text-xs font-semibold text-gray-600 shadow-2xs">
          <span className={`inline-block w-2 h-2 rounded-full ${backendStatus === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
          <span>Engine: <strong className="text-gray-900 capitalize">{backendStatus}</strong></span>
        </div>
        
        <h2 className="text-2xl sm:text-4xl font-black mb-3 text-gray-900 tracking-tight max-w-2xl">
          {t('home.title')}
        </h2>
        <p className="text-gray-600 max-w-xl mx-auto mb-8 sm:text-base leading-relaxed">
          {t('home.subtitle')}
        </p>

        {/* 3 Step Workflow Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 w-full max-w-4xl">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
              <Camera size={26} />
            </div>
            <h3 className="font-bold text-base text-gray-800 mb-1.5">{t('home.step1_title')}</h3>
            <p className="text-xs text-gray-500 leading-normal">{t('home.step1_desc')}</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-4">
              <Search size={26} />
            </div>
            <h3 className="font-bold text-base text-gray-800 mb-1.5">{t('home.step2_title')}</h3>
            <p className="text-xs text-gray-500 leading-normal">{t('home.step2_desc')}</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
              <CheckCircle size={26} />
            </div>
            <h3 className="font-bold text-base text-gray-800 mb-1.5">{t('home.step3_title')}</h3>
            <p className="text-xs text-gray-500 leading-normal">{t('home.step3_desc')}</p>
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="mt-10 w-full max-w-4xl bg-white p-6 rounded-2xl border border-gray-200 shadow-sm text-left">
          <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <ShieldCheck size={18} className="text-blue-700" />
            {t('home.quick_actions')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link 
              to="/scan" 
              className="flex items-center gap-4 p-4 rounded-xl border border-blue-100 bg-blue-50/50 hover:bg-blue-100/60 hover:border-blue-300 transition-all group shadow-2xs"
            >
              <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0 shadow-sm">
                <Camera size={22} />
              </div>
              <div>
                <span className="block font-bold text-gray-900 text-sm">{t('home.new_scan')}</span>
                <span className="text-[11px] text-gray-500 block mt-0.5">{t('home.new_scan_desc')}</span>
              </div>
            </Link>

            <Link 
              to="/history" 
              className="flex items-center gap-4 p-4 rounded-xl border border-purple-100 bg-purple-50/50 hover:bg-purple-100/60 hover:border-purple-300 transition-all group shadow-2xs"
            >
              <div className="w-12 h-12 bg-purple-600 text-white rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0 shadow-sm">
                <History size={22} />
              </div>
              <div>
                <span className="block font-bold text-gray-900 text-sm">{t('home.history_link')}</span>
                <span className="text-[11px] text-gray-500 block mt-0.5">{t('home.history_desc')}</span>
              </div>
            </Link>

            <Link 
              to="/rules" 
              className="flex items-center gap-4 p-4 rounded-xl border border-amber-100 bg-amber-50/50 hover:bg-amber-100/60 hover:border-amber-300 transition-all group shadow-2xs"
            >
              <div className="w-12 h-12 bg-amber-600 text-white rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0 shadow-sm">
                <BookOpen size={22} />
              </div>
              <div>
                <span className="block font-bold text-gray-900 text-sm">{t('home.rules_act')}</span>
                <span className="text-[11px] text-gray-500 block mt-0.5">{t('home.rules_act_desc')}</span>
              </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
