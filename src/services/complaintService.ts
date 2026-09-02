// src/services/complaintService.ts
import type {
  ComplaintRecord,
  ComplaintStatus,
  ComplaintPriority,
  FindingEvidence,
  OfficialVerification,
  ForwardingDetails,
  TimelineEvent,
  AuditLogEntry
} from '../types/complaint';

const STORAGE_KEY = 'legalmetrix_complaints_live_v1';

// One-time automatic purge of previous mock/demo storage keys
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('legalmetrix_complaints_v1');
    localStorage.removeItem('legalmetrix_complaints_v2');
    localStorage.removeItem('legalmetrix_complaints');
  } catch (e) {
    // Ignore storage errors in restricted contexts
  }
}

// Helper to get all stored complaints
export function getStoredComplaints(): ComplaintRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (e) {
    console.error('Error reading complaints from storage:', e);
    return [];
  }
}

// Helper to persist complaints
export function saveComplaints(complaints: ComplaintRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(complaints));
  } catch (e) {
    console.error('Error saving complaints to storage:', e);
  }
}

// Helper to clear all complaints
export function clearAllComplaints(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    localStorage.removeItem('legalmetrix_complaints_v1');
    localStorage.removeItem('legalmetrix_complaints_v2');
    localStorage.removeItem('legalmetrix_complaints');
  } catch (e) {
    console.error('Error clearing complaints storage:', e);
  }
}

// Get single complaint by ID
export function getComplaintById(id: string): ComplaintRecord | undefined {
  const all = getStoredComplaints();
  const searchId = id.trim().toUpperCase();
  return all.find((c) => c.id.toUpperCase() === searchId || c.inspectionId.toUpperCase() === searchId);
}

// Generate new unique Complaint ID: LM-2026-XXXXXX
export function generateComplaintId(): string {
  const year = new Date().getFullYear();
  const randNum = Math.floor(100000 + Math.random() * 900000);
  return `LM-${year}-${randNum}`;
}

// Create a new Complaint / Enquiry
export function createComplaintRecord(payload: {
  inspectionId: string;
  product: {
    productName: string;
    brand?: string;
    category?: string;
    manufacturerName?: string;
    manufacturerAddress?: string;
    mrp?: string;
    netQuantity?: string;
    mfgDate?: string;
    expiryDate?: string;
    consumerCareDetails?: string;
    countryOfOrigin?: string;
    barcode?: string;
  };
  inspection: {
    location?: string;
    marketDistrict?: string;
    inspectorName?: string;
    inspectorBadge?: string;
    packageImages?: { side: string; url: string }[];
  };
  findings?: FindingEvidence[];
  priority?: ComplaintPriority;
  submittedBy?: string;
  submitterRole?: 'Inspector' | 'Citizen' | 'Autonomous AI System';
  initialStatus?: ComplaintStatus;
}): ComplaintRecord {
  const newId = generateComplaintId();
  const now = new Date().toISOString();

  const findings: FindingEvidence[] = payload.findings || [];

  const initialTimeline: TimelineEvent[] = [
    {
      id: `TL-${Date.now()}-1`,
      stageName: 'Complaint / Enquiry Submitted',
      status: payload.initialStatus || 'Submitted',
      timestamp: now,
      actorName: payload.submittedBy || 'Inspector Rajesh Sharma (LM-204)',
      actorRole: payload.submitterRole || 'Inspector',
      actionSummary: `Complaint dossier ${newId} registered and linked to Inspection ${payload.inspectionId}.`,
      isPublic: true,
      isCompleted: true,
      isCurrent: false,
    },
    {
      id: `TL-${Date.now()}-2`,
      stageName: 'AI Preliminary Findings Flagged',
      status: 'Under Review',
      timestamp: now,
      actorName: 'LegalMetriX AI Rule Engine',
      actorRole: 'Autonomous AI System',
      actionSummary: `${findings.length} preliminary declarations / potential non-compliances flagged for review.`,
      isPublic: true,
      isCompleted: true,
      isCurrent: true,
    },
    {
      id: `TL-${Date.now()}-3`,
      stageName: 'Forwarded for Further Enquiry',
      status: 'Further Enquiry',
      timestamp: '',
      actorName: 'Enforcement Authority',
      actorRole: 'Senior Official',
      actionSummary: 'Case forwarded to competent zonal cell.',
      isPublic: true,
      isCompleted: false,
      isCurrent: false,
    },
    {
      id: `TL-${Date.now()}-4`,
      stageName: 'Official Statutory Verification',
      status: 'Awaiting Verification',
      timestamp: '',
      actorName: 'Authorized Legal Metrology Officer',
      actorRole: 'Senior Official',
      actionSummary: 'Official review of seized packaging and compliance verification.',
      isPublic: true,
      isCompleted: false,
      isCurrent: false,
    },
    {
      id: `TL-${Date.now()}-5`,
      stageName: 'Statutory Action / Notice',
      status: 'Action Taken',
      timestamp: '',
      actorName: 'Competent Directorate',
      actorRole: 'Enforcement Authority',
      actionSummary: 'Notice served or compounding fee recovered.',
      isPublic: true,
      isCompleted: false,
      isCurrent: false,
    },
    {
      id: `TL-${Date.now()}-6`,
      stageName: 'Case Closed',
      status: 'Closed',
      timestamp: '',
      actorName: 'Statutory Authority',
      actorRole: 'Appellate Officer',
      actionSummary: 'Case file closed with final inspection compliance certificate.',
      isPublic: true,
      isCompleted: false,
      isCurrent: false,
    },
  ];

  const initialAudit: AuditLogEntry[] = [
    {
      id: `AUD-${Date.now()}`,
      timestamp: now,
      actorName: payload.submittedBy || 'Inspector Rajesh Sharma (LM-204)',
      actorRole: payload.submitterRole || 'Inspector',
      action: 'Complaint Docket Generated',
      toStatus: payload.initialStatus || 'Submitted',
      details: `Generated complaint ${newId} referencing statutory inspection ${payload.inspectionId}.`,
    },
  ];

  const newRecord: ComplaintRecord = {
    id: newId,
    inspectionId: payload.inspectionId,
    dateSubmitted: now,
    lastUpdated: now,
    submittedBy: payload.submittedBy || 'Inspector Rajesh Sharma (LM-204)',
    submitterRole: payload.submitterRole || 'Inspector',
    location: payload.inspection.location || 'Local Retail Market, District Enforcement Area',
    currentStatus: payload.initialStatus || 'Under Review',
    assignedAuthority: 'Assistant Controller (Enforcement), Northern Zone',
    priority: payload.priority || 'High',
    product: {
      productName: payload.product.productName || 'Packaged Commodity Sample',
      brand: payload.product.brand || 'Commercial Brand',
      category: payload.product.category || 'General Packaged Commodity',
      manufacturerName: payload.product.manufacturerName || 'Not Declared / Under Investigation',
      manufacturerAddress: payload.product.manufacturerAddress || 'Physical address verification required',
      mrp: payload.product.mrp || '₹ --',
      netQuantity: payload.product.netQuantity || '--',
      mfgDate: payload.product.mfgDate || '',
      expiryDate: payload.product.expiryDate || '',
      consumerCareDetails: payload.product.consumerCareDetails || '',
      countryOfOrigin: payload.product.countryOfOrigin || 'India',
      barcode: payload.product.barcode || '',
    },
    inspection: {
      inspectionId: payload.inspectionId,
      inspectionDate: new Date().toISOString().split('T')[0],
      location: payload.inspection.location || 'Market Inspection Store',
      marketDistrict: payload.inspection.marketDistrict || 'Enforcement Jurisdiction',
      inspectorName: payload.inspection.inspectorName || 'Inspector Rajesh Sharma',
      inspectorBadge: payload.inspection.inspectorBadge || 'LM-204',
      packageImages: payload.inspection.packageImages || [],
    },
    findings,
    verification: {
      isVerified: false,
      status: 'Under Review',
      verdict: 'PENDING',
      officerName: '',
      officerRole: '',
      officerDesignation: '',
      remarks: '',
      observations: '',
    },
    forwardingHistory: [],
    timeline: initialTimeline,
    auditTrail: initialAudit,
    publicTrackingMessage:
      'Your complaint/enquiry has been registered with the Legal Metrology Department and is currently under preliminary AI and statutory review.',
  };

  const existing = getStoredComplaints();
  saveComplaints([newRecord, ...existing]);
  return newRecord;
}

// Forward Case for Further Enquiry
export function forwardComplaintForEnquiry(
  complaintId: string,
  data: {
    targetDepartment: string;
    targetAuthority: string;
    reason: string;
    priority: ComplaintPriority;
    remarks: string;
    evidenceSummary: string;
    forwardedBy: string;
    fromRole: string;
  }
): ComplaintRecord | undefined {
  const all = getStoredComplaints();
  const idx = all.findIndex((c) => c.id === complaintId);
  if (idx === -1) return undefined;

  const target = all[idx];
  const now = new Date().toISOString();

  const forwardingRecord: ForwardingDetails = {
    forwardedAt: now,
    forwardedBy: data.forwardedBy,
    fromRole: data.fromRole,
    targetDepartment: data.targetDepartment,
    targetAuthority: data.targetAuthority,
    reason: data.reason,
    priority: data.priority,
    remarks: data.remarks,
    evidenceSummary: data.evidenceSummary,
  };

  const updatedAudit: AuditLogEntry = {
    id: `AUD-${Date.now()}`,
    timestamp: now,
    actorName: data.forwardedBy,
    actorRole: data.fromRole,
    action: 'Forwarded for Further Enquiry',
    fromStatus: target.currentStatus,
    toStatus: 'Further Enquiry',
    details: `Forwarded to ${data.targetAuthority} (${data.targetDepartment}). Reason: ${data.reason}`,
  };

  // Update timeline
  const updatedTimeline = target.timeline.map((item) => {
    if (item.stageName.includes('Further Enquiry')) {
      return {
        ...item,
        isCompleted: true,
        isCurrent: true,
        timestamp: now,
        actorName: data.forwardedBy,
        actionSummary: `Case forwarded to ${data.targetAuthority}. ${data.remarks}`,
      };
    }
    if (item.stageName.includes('Submitted') || item.stageName.includes('AI Preliminary')) {
      return { ...item, isCompleted: true, isCurrent: false };
    }
    return item;
  });

  const updatedComplaint: ComplaintRecord = {
    ...target,
    lastUpdated: now,
    currentStatus: 'Further Enquiry',
    assignedAuthority: data.targetAuthority,
    priority: data.priority,
    forwardingHistory: [forwardingRecord, ...target.forwardingHistory],
    auditTrail: [updatedAudit, ...target.auditTrail],
    timeline: updatedTimeline,
    publicTrackingMessage: `Your complaint has been forwarded for further enquiry and is currently under active review by the ${data.targetAuthority}.`,
  };

  all[idx] = updatedComplaint;
  saveComplaints(all);
  return updatedComplaint;
}

// Official Verification by Authorized Officer
export function verifyComplaintRecord(
  complaintId: string,
  data: {
    verdict: 'VERIFIED_VIOLATION' | 'NOT_VERIFIED' | 'FURTHER_ENQUIRY_REQUIRED' | 'ACTION_TAKEN';
    newStatus: ComplaintStatus;
    remarks: string;
    observations: string;
    actionTaken?: string;
    additionalEvidenceNotes?: string;
    officerName: string;
    officerRole: string;
    officerDesignation: string;
  }
): ComplaintRecord | undefined {
  const all = getStoredComplaints();
  const idx = all.findIndex((c) => c.id === complaintId);
  if (idx === -1) return undefined;

  const target = all[idx];
  const now = new Date().toISOString();
  const seal = `SEAL-LM-DIR-${Date.now().toString().slice(-4)}`;

  const verification: OfficialVerification = {
    isVerified: true,
    status: data.newStatus,
    verdict: data.verdict,
    officerName: data.officerName,
    officerRole: data.officerRole,
    officerDesignation: data.officerDesignation,
    verifiedAt: now,
    remarks: data.remarks,
    observations: data.observations,
    actionTaken: data.actionTaken || '',
    additionalEvidenceNotes: data.additionalEvidenceNotes || '',
    digitalSealSignature: seal,
  };

  const auditEntry: AuditLogEntry = {
    id: `AUD-${Date.now()}`,
    timestamp: now,
    actorName: data.officerName,
    actorRole: data.officerRole,
    action: `Official Verification: ${data.verdict.replace(/_/g, ' ')}`,
    fromStatus: target.currentStatus,
    toStatus: data.newStatus,
    details: `${data.observations} | Remarks: ${data.remarks}`,
  };

  // Update timeline
  const updatedTimeline = target.timeline.map((item) => {
    if (item.stageName.includes('Statutory Verification') || item.stageName.includes('Official Statutory')) {
      return {
        ...item,
        isCompleted: true,
        isCurrent: data.newStatus === 'Awaiting Verification' || data.newStatus === 'Verified Violation',
        timestamp: now,
        actorName: data.officerName,
        actionSummary: `Official statutory verdict: ${data.verdict.replace(/_/g, ' ')}. ${data.remarks}`,
      };
    }
    if (data.newStatus === 'Action Taken' && item.stageName.includes('Action Taken')) {
      return {
        ...item,
        isCompleted: true,
        isCurrent: true,
        timestamp: now,
        actorName: data.officerName,
        actionSummary: data.actionTaken || 'Statutory action taken.',
      };
    }
    if (data.newStatus === 'Closed' && item.stageName.includes('Closed')) {
      return {
        ...item,
        isCompleted: true,
        isCurrent: true,
        timestamp: now,
        actorName: data.officerName,
        actionSummary: 'Case closed with final compliance order.',
      };
    }
    return item;
  });

  let publicMsg = target.publicTrackingMessage;
  if (data.newStatus === 'Verified Violation') {
    publicMsg =
      'The Legal Metrology Department has officially verified the statutory declaration defect and initiated formal statutory enforcement proceedings against the manufacturer/packer.';
  } else if (data.newStatus === 'Not Verified') {
    publicMsg =
      'Upon comprehensive physical verification by authorized officials, the packaging was found to be in statutory compliance. The enquiry has been resolved.';
  } else if (data.newStatus === 'Action Taken') {
    publicMsg =
      'Official statutory action has been concluded. Necessary compound fees or corrective orders have been executed under the Legal Metrology Act.';
  } else if (data.newStatus === 'Closed') {
    publicMsg = 'This complaint and enquiry has been fully resolved and officially closed by the competent authority.';
  }

  const updatedComplaint: ComplaintRecord = {
    ...target,
    lastUpdated: now,
    currentStatus: data.newStatus,
    verification,
    auditTrail: [auditEntry, ...target.auditTrail],
    timeline: updatedTimeline,
    publicTrackingMessage: publicMsg,
  };

  all[idx] = updatedComplaint;
  saveComplaints(all);
  return updatedComplaint;
}

// Citizen Public Tracking: Sanitized & Redacted view
export function getPublicComplaintInfo(id: string) {
  const record = getComplaintById(id);
  if (!record) return null;

  return {
    id: record.id,
    productName: record.product.productName,
    brand: record.product.brand,
    dateSubmitted: record.dateSubmitted,
    lastUpdated: record.lastUpdated,
    currentStatus: record.currentStatus,
    assignedAuthority: record.assignedAuthority,
    publicTrackingMessage: record.publicTrackingMessage,
    timeline: record.timeline.filter((t) => t.isPublic),
  };
}
