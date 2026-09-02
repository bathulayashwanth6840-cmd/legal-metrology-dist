// src/services/api.ts
/**
 * Unified API Client Layer for LegalMetriX
 * Connects frontend UI components to either live FastAPI backend or resilient local mock storage.
 * Keeps the frontend fully prepared for future FastAPI microservices.
 */

import {
  getStoredComplaints,
  getComplaintById,
  createComplaintRecord,
  forwardComplaintForEnquiry,
  verifyComplaintRecord,
  getPublicComplaintInfo,
} from './complaintService';
import type {
  ComplaintRecord,
  ComplaintStatus,
  ComplaintPriority,
} from '../types/complaint';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = {
  // ── INSPECTIONS ─────────────────────────────────────────────────────────────
  async getInspections(): Promise<any[]> {
    try {
      const res = await fetch(`${BASE_URL}/api/scans/`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Backend unavailable, using fallback:', e);
    }
    return [];
  },

  async getInspectionById(id: string | number): Promise<any | null> {
    try {
      const res = await fetch(`${BASE_URL}/api/scans/${id}`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Backend unavailable, using fallback:', e);
    }
    return null;
  },

  async createInspection(formData: FormData): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/scans/`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error(`Inspection failed: ${res.statusText}`);
    return await res.json();
  },

  // ── COMPLAINTS & ENQUIRIES ──────────────────────────────────────────────────
  async getComplaints(): Promise<ComplaintRecord[]> {
    try {
      const res = await fetch(`${BASE_URL}/api/complaints/`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
    } catch (e) {
      // Local fallback
    }
    return getStoredComplaints();
  },

  async getComplaint(id: string): Promise<ComplaintRecord | null> {
    try {
      const res = await fetch(`${BASE_URL}/api/complaints/${id}`);
      if (res.ok) return await res.json();
    } catch (e) {
      // Local fallback
    }
    return getComplaintById(id) || null;
  },

  async createComplaint(payload: Parameters<typeof createComplaintRecord>[0]): Promise<ComplaintRecord> {
    try {
      const res = await fetch(`${BASE_URL}/api/complaints/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      // Local fallback
    }
    return createComplaintRecord(payload);
  },

  async updateComplaintStatus(
    id: string,
    status: ComplaintStatus,
    notes: string,
    actorName: string,
    actorRole: string
  ): Promise<ComplaintRecord | null> {
    try {
      const res = await fetch(`${BASE_URL}/api/complaints/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes, actorName, actorRole }),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      // Local fallback
    }
    const rec = getComplaintById(id);
    if (!rec) return null;

    const verdict: 'VERIFIED_VIOLATION' | 'NOT_VERIFIED' | 'FURTHER_ENQUIRY_REQUIRED' | 'ACTION_TAKEN' =
      status === 'Verified Violation'
        ? 'VERIFIED_VIOLATION'
        : status === 'Not Verified'
        ? 'NOT_VERIFIED'
        : status === 'Action Taken'
        ? 'ACTION_TAKEN'
        : 'FURTHER_ENQUIRY_REQUIRED';

    return verifyComplaintRecord(id, {
      verdict,
      newStatus: status,
      remarks: notes,
      observations: notes,
      officerName: actorName,
      officerRole: actorRole,
      officerDesignation: actorRole,
    }) || null;
  },

  async forwardComplaint(
    id: string,
    forwardData: {
      targetDepartment: string;
      targetAuthority: string;
      reason: string;
      priority: ComplaintPriority;
      remarks: string;
      evidenceSummary: string;
      forwardedBy: string;
      fromRole: string;
    }
  ): Promise<ComplaintRecord | null> {
    try {
      const res = await fetch(`${BASE_URL}/api/complaints/${id}/forward`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(forwardData),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      // Local fallback
    }
    return forwardComplaintForEnquiry(id, forwardData) || null;
  },

  async verifyComplaint(
    id: string,
    verificationData: Parameters<typeof verifyComplaintRecord>[1]
  ): Promise<ComplaintRecord | null> {
    try {
      const res = await fetch(`${BASE_URL}/api/complaints/${id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(verificationData),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      // Local fallback
    }
    return verifyComplaintRecord(id, verificationData) || null;
  },

  async getComplaintTimeline(id: string): Promise<any[]> {
    try {
      const res = await fetch(`${BASE_URL}/api/complaints/${id}/timeline`);
      if (res.ok) return await res.json();
    } catch (e) {
      // Local fallback
    }
    const rec = getComplaintById(id);
    return rec ? rec.timeline : [];
  },

  async getPublicTracking(id: string) {
    try {
      const res = await fetch(`${BASE_URL}/api/public/track/${id}`);
      if (res.ok) return await res.json();
    } catch (e) {
      // Local fallback
    }
    return getPublicComplaintInfo(id);
  },

  async getReport(id: string | number): Promise<Blob | null> {
    try {
      const res = await fetch(`${BASE_URL}/api/reports/${id}`);
      if (res.ok) return await res.blob();
    } catch (e) {
      console.warn('Report fetch error:', e);
    }
    return null;
  },
};
