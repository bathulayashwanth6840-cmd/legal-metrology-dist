// src/context/RoleContext.tsx
/**
 * ============================================================================
 * SECURITY & ARCHITECTURE NOTICE — INTERNAL HACKATHON DEMO IMPLEMENTATION
 * ============================================================================
 * Current implementation is a hackathon demonstration using frontend role-based
 * access simulation for rapid workflow evaluation and interactive multi-persona demos.
 *
 * Production implementation should use:
 * - FastAPI backend authentication
 * - OAuth2 / JWT or secure session authentication
 * - HttpOnly Secure cookies
 * - Password hashing (Argon2/Bcrypt)
 * - Backend-enforced authorization & RBAC middleware
 * - Protected API endpoints with token/scope verification
 * - Immutable audit logging
 * ============================================================================
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserRole } from '../types/complaint';

export interface RoleProfile {
  role: UserRole;
  name: string;
  displayName: string;
  badge: string;
  designation: string;
  department: string;
  jurisdiction: string;
  avatarLetter: string;
  accentColor: string;
  allowedFeatures: string[];
  restrictedFeatures: string[];
  description: string;
}

export interface RoleContextType {
  currentRole: UserRole;
  isAuthenticated: boolean;
  profile: RoleProfile;
  setRole: (role: UserRole) => void;
  loginAsRole: (role: UserRole) => void;
  logout: () => void;
  isCitizen: boolean;
  isOfficer: boolean;
  isInspector: boolean;
  isAdmin: boolean;
  isSeniorOfficial: boolean;
  canAccessRoute: (path: string) => boolean;
}

export const ROLE_PROFILES: Record<UserRole, RoleProfile> = {
  citizen: {
    role: 'citizen',
    name: 'Priya Sharma (Consumer)',
    displayName: 'Citizen',
    badge: 'CITIZEN-PORTAL',
    designation: 'General Citizen / Aggrieved Consumer',
    department: 'National Consumer Helpline & Public Grievance Portal',
    jurisdiction: 'Pan-India Citizen Access',
    avatarLetter: 'C',
    accentColor: 'emerald',
    allowedFeatures: [
      'Dashboard Overview',
      'Complaints & Enquiries',
      'Track Complaint Dockets',
      'Rules & Statutory Acts',
      'Settings & Profile',
    ],
    restrictedFeatures: [
      'New Packaging Inspection',
      '360° Video Scan',
      'Inspection History & Dossiers',
      'Inspection Summary Reports',
      'Compliance Analytics & Audit Logs',
      'Central Administrative Controls',
    ],
    description:
      'Public consumer view designed for lodging packaged commodity grievances, tracking verification dockets, and exploring statutory rules.',
  },
  inspector: {
    role: 'inspector',
    name: 'Inspector Rajesh Sharma',
    displayName: 'Legal Metrology Officer',
    badge: 'LM-204',
    designation: 'Legal Metrology Inspector (Field Enforcement)',
    department: 'Department of Consumer Affairs & Legal Metrology',
    jurisdiction: 'North Zone Enforcement Circle, New Delhi',
    avatarLetter: 'O',
    accentColor: 'blue',
    allowedFeatures: [
      'Dashboard Overview',
      'New Packaging Inspection',
      '360° Single-Clip Video Scan',
      'Inspection History & Full Dossiers',
      'Certified Assessment & Summary Reports',
      'Rules & Statutory Acts',
      'Settings & Profile',
    ],
    restrictedFeatures: [
      'Compliance Analytics & Directorate Logs',
      'Central Administrative Controls',
    ],
    description:
      'Field officer view equipped with AI camera & 360° multi-panel inspection, automated rule verification, and certified PDF report generation.',
  },
  admin: {
    role: 'admin',
    name: 'Dr. V. Ramanathan',
    displayName: 'Administrator',
    badge: 'ADMIN-DIR-01',
    designation: 'Central Metrology Director & Systems Administrator',
    department: 'Central Standards, Enforcement & Analytics Directorate',
    jurisdiction: 'National Directorate, New Delhi',
    avatarLetter: 'A',
    accentColor: 'indigo',
    allowedFeatures: [
      'Dashboard Overview',
      'New Packaging Inspection',
      '360° Single-Clip Video Scan',
      'Complaints & Enquiries Management',
      'Track Complaint Dockets',
      'Inspection History & Full Dossiers',
      'Certified Assessment & Summary Reports',
      'Compliance Analytics & Directorate Audit Logs',
      'Rules & Statutory Acts',
      'Settings & Profile',
    ],
    restrictedFeatures: [],
    description:
      'Executive director & central administrator view with comprehensive regulatory oversight, real-time violation metrics, and full audit logs.',
  },
  senior_official: {
    role: 'senior_official',
    name: 'Dr. V. Ramanathan',
    displayName: 'Administrator',
    badge: 'LM-DIR-08',
    designation: 'Assistant Controller & Directorate Admin',
    department: 'Central Standards & Enforcement Directorate',
    jurisdiction: 'National Capital Region & Northern Zone',
    avatarLetter: 'A',
    accentColor: 'indigo',
    allowedFeatures: [
      'Dashboard Overview',
      'New Packaging Inspection',
      '360° Single-Clip Video Scan',
      'Complaints & Enquiries Management',
      'Track Complaint Dockets',
      'Inspection History & Full Dossiers',
      'Certified Assessment & Summary Reports',
      'Compliance Analytics & Directorate Audit Logs',
      'Rules & Statutory Acts',
      'Settings & Profile',
    ],
    restrictedFeatures: [],
    description:
      'Executive director & central administrator view with comprehensive regulatory oversight, real-time violation metrics, and full audit logs.',
  },
};

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    const saved = localStorage.getItem('legalmetrix_active_role');
    if (saved === 'citizen' || saved === 'inspector' || saved === 'admin' || saved === 'senior_official') {
      return saved as UserRole;
    }
    return 'inspector'; // Default demo starting role
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const authFlag = localStorage.getItem('legalmetrix_authenticated');
    return authFlag !== 'false'; // Authenticated by default in demo mode unless explicitly logged out
  });

  useEffect(() => {
    localStorage.setItem('legalmetrix_active_role', currentRole);
    localStorage.setItem('legalmetrix_authenticated', isAuthenticated ? 'true' : 'false');
  }, [currentRole, isAuthenticated]);

  const setRole = (role: UserRole) => {
    const normalized = role === 'senior_official' ? 'admin' : role;
    setCurrentRole(normalized);
    setIsAuthenticated(true);
  };

  const loginAsRole = (role: UserRole) => {
    const normalized = role === 'senior_official' ? 'admin' : role;
    setCurrentRole(normalized);
    setIsAuthenticated(true);
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('legalmetrix_authenticated');
    localStorage.removeItem('token');
  };

  /**
   * Evaluates route permission for current role.
   */
  const canAccessRoute = (path: string): boolean => {
    if (!isAuthenticated) return false;

    const normalizedPath = path.toLowerCase().split('?')[0];

    // Citizen Role Permissions
    if (currentRole === 'citizen') {
      const allowedCitizen = ['/', '/complaints', '/track', '/rules', '/profile', '/login'];
      const isAllowed = allowedCitizen.some(
        (allowed) => normalizedPath === allowed || (allowed !== '/' && normalizedPath.startsWith(allowed))
      );
      return isAllowed;
    }

    // Legal Metrology Officer Role Permissions
    if (currentRole === 'inspector') {
      // Restricted from Compliance Analytics (/analytics)
      if (normalizedPath.startsWith('/analytics')) {
        return false;
      }
      return true;
    }

    // Administrator Role Permissions (Full Access)
    if (currentRole === 'admin' || currentRole === 'senior_official') {
      return true;
    }

    return true;
  };

  const value: RoleContextType = {
    currentRole,
    isAuthenticated,
    profile: ROLE_PROFILES[currentRole] || ROLE_PROFILES.inspector,
    setRole,
    loginAsRole,
    logout,
    isCitizen: currentRole === 'citizen',
    isOfficer: currentRole === 'inspector',
    isInspector: currentRole === 'inspector',
    isAdmin: currentRole === 'admin' || currentRole === 'senior_official',
    isSeniorOfficial: currentRole === 'admin' || currentRole === 'senior_official',
    canAccessRoute,
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
