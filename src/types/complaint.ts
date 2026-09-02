// src/types/complaint.ts

export type ComplaintStatus =
  | 'Submitted'
  | 'Under Review'
  | 'Further Enquiry'
  | 'Awaiting Verification'
  | 'Verified Violation'
  | 'Not Verified'
  | 'Action Taken'
  | 'Closed';

export type ComplaintPriority = 'High' | 'Medium' | 'Low';

export type UserRole = 'inspector' | 'senior_official' | 'citizen';

export interface FindingEvidence {
  id: string;
  fieldKey: string;
  fieldLabel: string;
  ruleCode: string;
  ruleReference: string;
  detectedText: string;
  requiredStandard: string;
  aiStatus: 'PASS' | 'POTENTIAL VIOLATION' | 'NEEDS VERIFICATION';
  confidence: number;
  evidenceImageUrl?: string;
  highlightBox?: { x: number; y: number; width: number; height: number };
  evidenceNotes?: string;
  reviewedByOfficer?: boolean;
}

export interface OfficialVerification {
  isVerified: boolean;
  status: ComplaintStatus;
  verdict: 'VERIFIED_VIOLATION' | 'NOT_VERIFIED' | 'FURTHER_ENQUIRY_REQUIRED' | 'ACTION_TAKEN' | 'PENDING';
  officerName: string;
  officerRole: string;
  officerDesignation: string;
  verifiedAt?: string;
  remarks: string;
  observations: string;
  actionTaken?: string;
  additionalEvidenceNotes?: string;
  digitalSealSignature?: string;
}

export interface TimelineEvent {
  id: string;
  stageName: string;
  status: ComplaintStatus;
  timestamp: string;
  actorName: string;
  actorRole: string;
  actionSummary: string;
  isPublic: boolean;
  isCompleted: boolean;
  isCurrent: boolean;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: string;
  action: string;
  fromStatus?: ComplaintStatus;
  toStatus?: ComplaintStatus;
  details: string;
}

export interface ForwardingDetails {
  forwardedAt: string;
  forwardedBy: string;
  fromRole: string;
  targetDepartment: string;
  targetAuthority: string;
  reason: string;
  priority: ComplaintPriority;
  remarks: string;
  evidenceSummary: string;
}

export interface ProductInfo {
  productName: string;
  brand: string;
  category: string;
  manufacturerName: string;
  manufacturerAddress: string;
  packerName?: string;
  importerName?: string;
  mrp: string;
  netQuantity: string;
  mfgDate?: string;
  expiryDate?: string;
  consumerCareDetails?: string;
  countryOfOrigin: string;
  fssaiNumber?: string;
  barcode?: string;
}

export interface InspectionContext {
  inspectionId: string;
  inspectionDate: string;
  location: string;
  marketDistrict: string;
  inspectorName: string;
  inspectorBadge: string;
  packageImages: { side: string; url: string }[];
}

export interface ComplaintRecord {
  id: string; // e.g. LM-2026-004281
  inspectionId: string; // e.g. INS-1024
  dateSubmitted: string;
  lastUpdated: string;
  submittedBy: string;
  submitterRole: 'Inspector' | 'Citizen' | 'Autonomous AI System';
  location: string;
  currentStatus: ComplaintStatus;
  assignedAuthority: string;
  priority: ComplaintPriority;
  product: ProductInfo;
  inspection: InspectionContext;
  findings: FindingEvidence[];
  verification: OfficialVerification;
  forwardingHistory: ForwardingDetails[];
  timeline: TimelineEvent[];
  auditTrail: AuditLogEntry[];
  publicTrackingMessage: string;
}
