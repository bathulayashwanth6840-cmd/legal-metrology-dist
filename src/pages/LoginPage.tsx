// src/pages/LoginPage.tsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ShieldCheck, Shield, Users, UserCheck, Sparkles,
  ArrowRight, Lock, Eye, EyeOff, Info, CheckCircle2
} from 'lucide-react';
import { useRole } from '../context/RoleContext';
import type { UserRole } from '../types/complaint';

export default function LoginPage() {
  const { loginAsRole } = useRole();
  const navigate = useNavigate();
  const location = useLocation();

  const [showManualForm, setShowManualForm] = useState(false);
  const [email, setEmail] = useState('officer@gov.in');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('inspector');

  const redirectTarget = (location.state as any)?.from?.pathname || '/';

  const handleRoleLogin = (role: UserRole) => {
    loginAsRole(role);
    navigate(redirectTarget, { replace: true });
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      loginAsRole(selectedRole);
      setIsLoading(false);
      navigate(redirectTarget, { replace: true });
    }, 400);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[var(--color-navy)] to-slate-950 text-white flex flex-col justify-between p-4 sm:p-8 select-none">
      {/* ── Top Emblem & Title Bar ────────────────────────────────────────── */}
      <header className="max-w-5xl mx-auto w-full flex items-center justify-between py-2 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white p-1 shadow-md flex items-center justify-center">
            <img
              src="/legal_metrology_logo.jpg"
              alt="Government of India Emblem"
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <ShieldCheck size={24} className="text-[var(--color-navy)]" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg sm:text-xl tracking-tight text-white block">
                LegalMetriX
              </span>
              <span className="text-[9px] bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                SIH 2024
              </span>
            </div>
            <span className="text-[10px] text-blue-200 uppercase tracking-widest font-mono block">
              Autonomous Legal Metrology Compliance Suite
            </span>
          </div>
        </div>

        {/* Demo Mode Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-xs font-bold text-amber-300 backdrop-blur-xs">
          <Sparkles size={14} />
          <span>Demo Mode — Internal Hackathon</span>
        </div>
      </header>

      {/* ── Main Hero & Demo Role Selector ────────────────────────────────── */}
      <main className="max-w-5xl mx-auto w-full py-8 space-y-8 my-auto">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 px-3.5 py-1 rounded-full text-xs font-bold text-blue-300">
            <Sparkles size={13} className="text-amber-400" />
            <span>Multi-Stakeholder Interactive Demonstration</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Select Demo Persona & Access Role
          </h1>
          <p className="text-xs sm:text-sm text-blue-200 leading-relaxed font-medium">
            Experience role-tailored workflows designed for Citizens, Field Enforcement Officers, and Central Administrators.
          </p>
        </div>

        {/* ── 3 Hackathon Demo Role Cards ──────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* 1. CITIZEN ROLE CARD */}
          <div className="bg-white/10 dark:bg-slate-900/80 backdrop-blur-md rounded-3xl p-6 border border-emerald-500/30 shadow-xl hover:border-emerald-400 hover:shadow-2xl transition-all flex flex-col justify-between space-y-5 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                  <Users size={24} />
                </div>
                <span className="text-[10px] font-mono font-black uppercase px-2.5 py-1 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                  PUBLIC CITIZEN
                </span>
              </div>

              <div>
                <h2 className="text-lg font-black text-white group-hover:text-emerald-300 transition-colors">
                  Continue as Citizen
                </h2>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Aggrieved consumer perspective for lodging packaged commodity grievances, tracking verification dockets, and exploring statutory rules.
                </p>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-white/10 text-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Allowed Capabilities:
                </span>
                <ul className="space-y-1 text-slate-200 text-[11px]">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                    <span>File Complaints & Packaging Enquiries</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                    <span>Real-time Docket Tracking</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                    <span>Rules & Metrology Act Reference</span>
                  </li>
                </ul>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleRoleLogin('citizen')}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
            >
              <span>Launch as Citizen</span>
              <ArrowRight size={15} />
            </button>
          </div>

          {/* 2. LEGAL METROLOGY OFFICER ROLE CARD */}
          <div className="bg-white/10 dark:bg-slate-900/80 backdrop-blur-md rounded-3xl p-6 border-2 border-blue-400 shadow-2xl hover:border-blue-300 transition-all flex flex-col justify-between space-y-5 group relative overflow-hidden ring-4 ring-blue-500/20">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-400/40 text-blue-300 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                  <Shield size={24} />
                </div>
                <span className="text-[10px] font-mono font-black uppercase px-2.5 py-1 rounded-full bg-blue-400 text-slate-950 font-extrabold shadow-sm">
                  RECOMMENDED DEMO
                </span>
              </div>

              <div>
                <h2 className="text-lg font-black text-white group-hover:text-blue-300 transition-colors">
                  Continue as Officer
                </h2>
                <p className="text-xs text-blue-100 mt-1 leading-relaxed">
                  Field enforcement inspector (#LM-204) equipped with AI camera scanner, 360° video rotation analysis, statutory verification, and certified reports.
                </p>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-white/10 text-xs">
                <span className="text-[10px] uppercase font-bold text-blue-300 block tracking-wider">
                  Allowed Capabilities:
                </span>
                <ul className="space-y-1 text-slate-200 text-[11px]">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-blue-400 shrink-0" />
                    <span>Autonomous Packaging Scanner</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-blue-400 shrink-0" />
                    <span>360° Video Rotation Extractor</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-blue-400 shrink-0" />
                    <span>Inspection Dossiers & Certified PDFs</span>
                  </li>
                </ul>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleRoleLogin('inspector')}
              className="w-full py-3.5 bg-gradient-to-r from-blue-500 via-indigo-600 to-blue-600 hover:from-blue-400 hover:to-indigo-500 text-white font-extrabold text-xs rounded-2xl shadow-xl shadow-blue-900/40 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
            >
              <span>Launch as Field Officer</span>
              <ArrowRight size={15} />
            </button>
          </div>

          {/* 3. ADMINISTRATOR ROLE CARD */}
          <div className="bg-white/10 dark:bg-slate-900/80 backdrop-blur-md rounded-3xl p-6 border border-indigo-500/30 shadow-xl hover:border-indigo-400 hover:shadow-2xl transition-all flex flex-col justify-between space-y-5 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                  <UserCheck size={24} />
                </div>
                <span className="text-[10px] font-mono font-black uppercase px-2.5 py-1 rounded-full bg-indigo-400/20 text-indigo-300 border border-indigo-400/30">
                  FULL ACCESS
                </span>
              </div>

              <div>
                <h2 className="text-lg font-black text-white group-hover:text-indigo-300 transition-colors">
                  Continue as Administrator
                </h2>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Central Directorate authority with complete access across compliance analytics, audit trail logs, complaint processing, and all inspection modules.
                </p>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-white/10 text-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Allowed Capabilities:
                </span>
                <ul className="space-y-1 text-slate-200 text-[11px]">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-indigo-400 shrink-0" />
                    <span>Compliance Analytics & Violation Index</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-indigo-400 shrink-0" />
                    <span>Full Complaint & Inspection Dossiers</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-indigo-400 shrink-0" />
                    <span>Regulatory Directorate Audit Logs</span>
                  </li>
                </ul>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleRoleLogin('admin')}
              className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-indigo-900/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
            >
              <span>Launch as Administrator</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>

        {/* ── Optional Manual Credentials Toggle ───────────────────────────── */}
        <div className="max-w-md mx-auto text-center pt-4">
          <button
            type="button"
            onClick={() => setShowManualForm(!showManualForm)}
            className="text-xs font-semibold text-blue-300 hover:text-white underline inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Lock size={12} />
            <span>{showManualForm ? 'Hide manual credential form' : 'Or test custom credentials / sign in manually'}</span>
          </button>

          {showManualForm && (
            <form onSubmit={handleManualSubmit} className="mt-4 p-5 bg-white/10 rounded-2xl border border-white/20 text-left space-y-3 animate-in fade-in duration-150">
              <div>
                <label className="block text-xs font-bold text-blue-200 mb-1">Official ID / Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 bg-slate-900/80 border border-blue-500/40 rounded-xl text-xs text-white focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  placeholder="officer@gov.in"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-blue-200 mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 bg-slate-900/80 border border-blue-500/40 rounded-xl text-xs text-white focus:ring-2 focus:ring-amber-400 focus:outline-none pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-blue-200 mb-1">Demo Persona Target</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 bg-slate-900/80 border border-blue-500/40 rounded-xl text-xs text-white focus:ring-2 focus:ring-amber-400 focus:outline-none"
                >
                  <option value="inspector">Legal Metrology Officer (#LM-204)</option>
                  <option value="admin">Administrator (Central Directorate)</option>
                  <option value="citizen">Citizen Consumer (Public View)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoading ? 'Authenticating...' : 'Sign In with Selected Role'}
              </button>
            </form>
          )}
        </div>
      </main>

      {/* ── Footer & Security Architecture Disclaimer ────────────────────── */}
      <footer className="max-w-5xl mx-auto w-full pt-4 border-t border-white/10 text-center text-[11px] text-blue-300/80 space-y-1">
        <div className="flex items-center justify-center gap-1.5 font-semibold text-amber-300/90">
          <Info size={13} />
          <span>Internal Hackathon Prototype Architecture Note</span>
        </div>
        <p className="max-w-2xl mx-auto text-[10px] text-slate-400 leading-relaxed">
          Current implementation utilizes frontend role-based access simulation for presentation and workflow evaluation. Production deployment utilizes FastAPI backend OAuth2/JWT tokens, HttpOnly cookies, Bcrypt hashing, and backend-enforced route authorization.
        </p>
      </footer>
    </div>
  );
}
