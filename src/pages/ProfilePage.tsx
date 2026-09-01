import { useLanguage } from '../i18n/LanguageContext';
import { ShieldCheck, User as UserIcon, Award, Building, Sparkles } from 'lucide-react';

export default function ProfilePage() {
  const { t } = useLanguage();

  const officer = {
    name: "Legal Metrology Officer",
    badgeId: "LMR-GOI-2026-INSP",
    role: "FIELD_ENFORCEMENT_OFFICER",
    jurisdiction: "All India Packaging Inspection Hub",
    division: "Department of Consumer Affairs, Legal Metrology Division"
  };

  return (
    <div className="p-4 sm:p-6 pb-20 max-w-2xl mx-auto select-none">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center">
          <UserIcon size={22} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-gray-800 tracking-tight">{t('profile.title')}</h2>
          <p className="text-xs text-gray-500 font-medium">{t('profile.subtitle')}</p>
        </div>
      </div>
      
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Banner with logo */}
        <div className="bg-[var(--color-navy)] px-6 py-4 flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-[var(--color-saffron)]" />
            <span className="font-bold tracking-wide text-xs sm:text-sm uppercase">Legal Metrology Enforcement System</span>
          </div>
          <img src="/legal_metrology_logo.jpg" alt="Logo" className="w-9 h-9 rounded-full border border-white/50 bg-white" />
        </div>
        
        <div className="p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 border-b border-gray-100 pb-6 mb-6">
            {/* Officer Avatar */}
            <div className="w-18 h-18 bg-gradient-to-br from-blue-700 to-blue-900 text-white rounded-2xl flex items-center justify-center text-3xl font-black shadow-md flex-shrink-0">
              L
            </div>
            
            {/* Officer Details */}
            <div className="text-center sm:text-left flex-grow">
              <h3 className="text-xl font-bold text-gray-900">{officer.name}</h3>
              <p className="text-gray-500 text-xs mt-0.5">{officer.division}</p>
              
              <div className="mt-3 flex flex-wrap justify-center sm:justify-start gap-2">
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold flex items-center gap-1">
                  <Sparkles size={12} /> Active Inspector
                </span>
                <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-bold flex items-center gap-1">
                  <Award size={12} /> {officer.role}
                </span>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex justify-between items-center">
              <div>
                <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Badge Identifier</span>
                <span className="font-mono text-sm font-bold text-gray-800 mt-0.5 block">{officer.badgeId}</span>
              </div>
              <span className="text-xs bg-white px-2.5 py-1 rounded-md border border-gray-200 text-gray-600 font-semibold shadow-2xs">Authorized</span>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex justify-between items-center">
              <div>
                <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Jurisdiction</span>
                <span className="text-sm font-medium text-gray-700 mt-0.5 block">{officer.jurisdiction}</span>
              </div>
              <Building size={18} className="text-gray-400" />
            </div>

            <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-100">
              <span className="block text-[11px] font-bold text-blue-600 uppercase tracking-wider mb-2">Authority Standard</span>
              <div className="flex items-center gap-3">
                <img src="/legal_metrology_logo.jpg" alt="Emblem" className="w-10 h-10 rounded-full border border-blue-200 bg-white shadow-2xs" />
                <div>
                  <span className="text-sm font-bold text-gray-800 block">Legal Metrology (Packaged Commodities) Rules, 2011</span>
                  <span className="text-xs text-gray-500">Ministry of Consumer Affairs, Food and Public Distribution</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
