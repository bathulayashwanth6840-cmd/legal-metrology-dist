// src/components/ProtectedRoute.tsx
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
 * - Argon2/Bcrypt password hashing
 * - Backend-enforced authorization & RBAC middleware
 * - Protected API endpoints with scope verification
 * - Immutable audit logging
 * ============================================================================
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useRole } from '../context/RoleContext';
import type { UserRole } from '../types/complaint';
import AccessDeniedPage from './AccessDeniedPage';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requiredRoleName?: string;
  targetFeatureName?: string;
}

export default function ProtectedRoute({
  children,
  allowedRoles,
  requiredRoleName,
  targetFeatureName,
}: ProtectedRouteProps) {
  const { currentRole, isAuthenticated } = useRole();
  const location = useLocation();

  // If user is logged out, redirect to /login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If specific roles are required and currentRole is not allowed
  if (allowedRoles && allowedRoles.length > 0) {
    const effectiveRole = currentRole === 'senior_official' ? 'admin' : currentRole;
    const isAllowed = allowedRoles.includes(effectiveRole) || (effectiveRole === 'admin' && allowedRoles.includes('admin'));

    if (!isAllowed) {
      return (
        <AccessDeniedPage
          requiredRoleName={requiredRoleName}
          targetFeatureName={targetFeatureName}
        />
      );
    }
  }

  return <>{children}</>;
}
