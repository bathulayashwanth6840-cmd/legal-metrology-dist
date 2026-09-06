// src/components/RoleSwitcher.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRole } from '../context/RoleContext';
import { Shield, UserCheck, Users, ChevronDown, Check, LogOut, Sparkles } from 'lucide-react';
import type { UserRole } from '../types/complaint';

export default function RoleSwitcher() {
  const { currentRole, setRole, profile, logout } = useRole();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuItemsRef = useRef<(HTMLButtonElement | null)[]>([]);

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
  }[] = [
    {
      key: 'citizen',
      label: 'Citizen',
      sublabel: 'Public Consumer / Grievance Portal',
      badge: 'PUBLIC VIEW',
      icon: <Users size={15} className="text-emerald-400" aria-hidden="true" />,
    },
    {
      key: 'inspector',
      label: 'Legal Metrology Officer',
      sublabel: 'Field Enforcement Inspector #LM-204',
      badge: 'FIELD OFFICER',
      icon: <Shield size={15} className="text-blue-400" aria-hidden="true" />,
    },
    {
      key: 'admin',
      label: 'Administrator',
      sublabel: 'Central Metrology Directorate Admin',
      badge: 'CENTRAL DIRECTORATE',
      icon: <UserCheck size={15} className="text-amber-400" aria-hidden="true" />,
    },
  ];

  const handleKeyDownTrigger = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(true);
      setTimeout(() => {
        menuItemsRef.current[0]?.focus();
      }, 50);
    }
  };

  const handleKeyDownMenu = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      triggerRef.current?.focus();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = (index + 1) % roles.length;
      menuItemsRef.current[nextIndex]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = (index - 1 + roles.length) % roles.length;
      menuItemsRef.current[prevIndex]?.focus();
    } else if (e.key === 'Tab') {
      setIsOpen(false);
    }
  };

  const handleLogout = () => {
    setIsOpen(false);
    logout();
    navigate('/login');
  };

  const roleLabel = profile.displayName;

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        ref={triggerRef}
        type="button"
        id="role-switcher-button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls="role-switcher-menu"
        aria-label={`Current Role: ${roleLabel}. Click to switch demo role`}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDownTrigger}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-950/80 hover:bg-blue-900 border border-blue-700/60 text-white text-xs font-semibold transition-all shadow-sm cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
      >
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
          <span className="text-[10px] uppercase tracking-wider font-mono text-blue-200">Role:</span>
          <span className="font-bold text-white max-w-[130px] truncate">{roleLabel}</span>
        </div>
        <ChevronDown
          size={14}
          aria-hidden="true"
          className={`text-blue-300 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div
          id="role-switcher-menu"
          role="menu"
          aria-labelledby="role-switcher-button"
          className="absolute right-0 mt-2 w-72 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl text-white z-50 p-2 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150"
        >
          {/* Header Note */}
          <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block flex items-center gap-1">
                <Sparkles size={11} />
                <span>Demo Persona Switcher</span>
              </span>
              <span className="text-[11px] text-slate-300 font-medium">
                Switch role to test access boundaries.
              </span>
            </div>
          </div>

          {/* Role List */}
          <div className="space-y-1 pt-1">
            {roles.map((r, idx) => {
              const isSelected =
                currentRole === r.key || (r.key === 'admin' && currentRole === 'senior_official');
              return (
                <button
                  key={r.key}
                  ref={(el) => {
                    menuItemsRef.current[idx] = el;
                  }}
                  type="button"
                  role="menuitemradio"
                  aria-checked={isSelected}
                  onClick={() => {
                    setRole(r.key);
                    setIsOpen(false);
                    triggerRef.current?.focus();
                  }}
                  onKeyDown={(e) => handleKeyDownMenu(e, idx)}
                  className={`w-full text-left p-2.5 rounded-xl text-xs flex items-start gap-3 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                    isSelected
                      ? 'bg-blue-600/30 border border-blue-500/60 text-white'
                      : 'hover:bg-slate-800/80 border border-transparent text-slate-200'
                  }`}
                >
                  <div className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 mt-0.5" aria-hidden="true">
                    {r.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-white text-xs">{r.label}</span>
                      {isSelected && (
                        <Check size={14} className="text-emerald-400 flex-shrink-0" aria-hidden="true" />
                      )}
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

          {/* Active Profile Summary */}
          <div className="p-2.5 bg-slate-950/70 rounded-xl border border-slate-800 text-[11px] space-y-0.5">
            <div className="text-[10px] text-slate-400 font-mono">
              Active Persona: <span className="text-white font-bold">{profile.name || profile.displayName}</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Badge: <span className="text-amber-400 font-bold">{profile.badge}</span>
            </div>
          </div>

          {/* Logout Action */}
          <div className="pt-1 border-t border-slate-800">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full p-2 rounded-xl text-xs text-rose-400 hover:bg-rose-950/50 hover:text-rose-300 flex items-center justify-center gap-2 font-bold transition-colors cursor-pointer"
            >
              <LogOut size={13} />
              <span>Logout Demo Session</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
