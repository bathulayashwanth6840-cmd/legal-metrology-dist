// src/components/RoleSwitcher.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useRole } from '../context/RoleContext';
import { Shield, UserCheck, Users, ChevronDown, Check } from 'lucide-react';
import type { UserRole } from '../types/complaint';

export default function RoleSwitcher() {
  const { currentRole, setRole, profile } = useRole();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const roles: {
    key: UserRole;
    label: string;
    sublabel: string;
    badge: string;
    icon: React.ReactNode;
    color: string;
  }[] = [
    {
      key: 'inspector',
      label: 'Enforcement Inspector',
      sublabel: 'Field Officer #LM-204',
      badge: 'FIELD INSPECTOR',
      icon: <Shield size={14} className="text-blue-400" />,
      color: 'bg-blue-600',
    },
    {
      key: 'senior_official',
      label: 'Senior / Higher Official',
      sublabel: 'Assistant Controller (Enforcement)',
      badge: 'HIGHER AUTHORITY',
      icon: <UserCheck size={14} className="text-amber-400" />,
      color: 'bg-amber-600',
    },
    {
      key: 'citizen',
      label: 'Citizen / Consumer',
      sublabel: 'Public Complaint Tracking View',
      badge: 'PUBLIC VIEW',
      icon: <Users size={14} className="text-emerald-400" />,
      color: 'bg-emerald-600',
    },
  ];

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-blue-950/70 hover:bg-blue-900 border border-blue-700/60 text-white text-xs font-semibold transition-all shadow-sm cursor-pointer"
        title="Switch Role Perspective"
      >
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] uppercase tracking-wider font-mono text-blue-200">Role:</span>
          <span className="font-bold text-white max-w-[130px] truncate">
            {currentRole === 'inspector'
              ? 'Inspector'
              : currentRole === 'senior_official'
              ? 'Higher Official'
              : 'Citizen / Public'}
          </span>
        </div>
        <ChevronDown size={14} className={`text-blue-300 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl text-white z-50 p-2 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-3 py-2 border-b border-slate-800">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
              SIH Live Persona Switcher
            </span>
            <span className="text-xs text-slate-300 font-medium">
              Toggle access roles to evaluate multi-stakeholder workflows.
            </span>
          </div>

          <div className="space-y-1 pt-1">
            {roles.map((r) => {
              const isSelected = currentRole === r.key;
              return (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => {
                    setRole(r.key);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl text-xs flex items-start gap-3 transition-colors cursor-pointer ${
                    isSelected ? 'bg-blue-600/30 border border-blue-500/50' : 'hover:bg-slate-800 border border-transparent'
                  }`}
                >
                  <div className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 mt-0.5">
                    {r.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-white text-xs">{r.label}</span>
                      {isSelected && <Check size={14} className="text-emerald-400 flex-shrink-0" />}
                    </div>
                    <span className="text-[11px] text-slate-400 block truncate">{r.sublabel}</span>
                    <span className="text-[9px] font-mono text-blue-300 uppercase tracking-wider block mt-0.5">
                      {r.badge}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="p-2 bg-slate-950/60 rounded-xl border border-slate-800 text-[10px] text-slate-400 font-mono">
            Active: <span className="text-white font-bold">{profile.name}</span>
          </div>
        </div>
      )}
    </div>
  );
}
