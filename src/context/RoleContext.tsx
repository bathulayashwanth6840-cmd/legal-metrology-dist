// src/context/RoleContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserRole } from '../types/complaint';

interface RoleProfile {
  role: UserRole;
  name: string;
  badge: string;
  designation: string;
  department: string;
  jurisdiction: string;
}

interface RoleContextType {
  currentRole: UserRole;
  setRole: (role: UserRole) => void;
  profile: RoleProfile;
  isInspector: boolean;
  isSeniorOfficial: boolean;
  isCitizen: boolean;
}

const ROLE_PROFILES: Record<UserRole, RoleProfile> = {
  inspector: {
    role: 'inspector',
    name: 'Inspector Rajesh Sharma',
    badge: 'LM-204',
    designation: 'Legal Metrology Inspector (Field Enforcement)',
    department: 'Department of Consumer Affairs & Legal Metrology',
    jurisdiction: 'North Zone, New Delhi',
  },
  senior_official: {
    role: 'senior_official',
    name: 'Dr. V. Ramanathan',
    badge: 'LM-DIR-08',
    designation: 'Assistant Controller of Legal Metrology (Enforcement & Prosecution)',
    department: 'Central Standards & Enforcement Directorate',
    jurisdiction: 'National Capital Region & Northern Zone',
  },
  citizen: {
    role: 'citizen',
    name: 'Citizen Consumer / Public',
    badge: 'PUBLIC-ACCESS',
    designation: 'General Citizen / Aggrieved Consumer',
    department: 'National Consumer Helpline & Public Portal',
    jurisdiction: 'Pan-India',
  },
};

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    const saved = localStorage.getItem('legalmetrix_active_role');
    if (saved === 'inspector' || saved === 'senior_official' || saved === 'citizen') {
      return saved;
    }
    return 'inspector';
  });

  useEffect(() => {
    localStorage.setItem('legalmetrix_active_role', currentRole);
  }, [currentRole]);

  const value: RoleContextType = {
    currentRole,
    setRole: setCurrentRole,
    profile: ROLE_PROFILES[currentRole],
    isInspector: currentRole === 'inspector',
    isSeniorOfficial: currentRole === 'senior_official',
    isCitizen: currentRole === 'citizen',
  };

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
};

export const useRole = (): RoleContextType => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};
