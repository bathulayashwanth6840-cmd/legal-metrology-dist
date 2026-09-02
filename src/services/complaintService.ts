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

const STORAGE_KEY = 'legalmetrix_complaints_v1';

const INITIAL_MOCK_COMPLAINTS: ComplaintRecord[] = [
  {
    id: 'LM-2026-004281',
    inspectionId: 'INS-1024',
    dateSubmitted: '2026-08-28T10:30:00.000Z',
    lastUpdated: '2026-09-02T14:15:00.000Z',
    submittedBy: 'Inspector Rajesh Sharma (LM-204)',
    submitterRole: 'Inspector',
    location: 'Sector 18 Supermarket, Noida, UP',
    currentStatus: 'Further Enquiry',
    assignedAuthority: 'Assistant Controller (Enforcement), Northern Zone',
    priority: 'High',
    product: {
      productName: "Haldiram's Nagpur Bhujia Sev (400g)",
      brand: "Haldiram's",
      category: 'Packaged Snacks / Savouries',
      manufacturerName: 'Haldiram Snacks Pvt. Ltd.',
      manufacturerAddress: 'B-1/H-8, Mohan Co-op Industrial Estate, Main Mathura Road, New Delhi 110044',
      mrp: '₹140.00 (Incl. of all taxes)',
      netQuantity: '400 g',
      mfgDate: '07/2026',
      expiryDate: '01/2027',
      consumerCareDetails: 'Missing official telephone helpline & web grievance link',
      countryOfOrigin: 'India',
      fssaiNumber: '10012011000184',
      barcode: '8904063200192',
    },
    inspection: {
      inspectionId: 'INS-1024',
      inspectionDate: '2026-08-28',
      location: 'Retail Store Counter #4, Sector 18, Noida',
      marketDistrict: 'Gautam Buddha Nagar, Uttar Pradesh',
      inspectorName: 'Inspector Rajesh Sharma',
      inspectorBadge: 'LM-204',
      packageImages: [
        { side: 'Front Panel', url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80' },
        { side: 'Back Panel (Mandatory Declarations)', url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80' },
        { side: 'Right Panel (Barcode & MRP)', url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80' },
      ],
    },
    findings: [
      {
        id: 'FND-01',
        fieldKey: 'consumer_care',
        fieldLabel: 'Consumer Care Helpline & Address',
        ruleCode: 'Rule 6(1)(e)',
        ruleReference: 'Legal Metrology (Packaged Commodities) Rules, 2011 - Rule 6(1)(e)',
        detectedText: 'Write to feedback@haldiram.com. Phone helpline number illegible/missing.',
        requiredStandard: 'Name, complete address, active telephone helpline and email of the consumer grievance officer',
        aiStatus: 'POTENTIAL VIOLATION',
        confidence: 0.94,
        evidenceImageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
        highlightBox: { x: 25, y: 65, width: 50, height: 20 },
        evidenceNotes: 'Consumer care declaration lacks mandatory phone number as per 2021 amendments.',
        reviewedByOfficer: true,
      },
      {
        id: 'FND-02',
        fieldKey: 'mrp',
        fieldLabel: 'Maximum Retail Price Declaration & Font Ratio',
        ruleCode: 'Rule 6(1)(d)',
        ruleReference: 'LMR 2011 Rule 6(1)(d) & Rule 7 (Font Height)',
        detectedText: 'MRP Rs 140/- (Old sticker partially overlaid)',
        requiredStandard: 'Unambiguous MRP declaration with "inclusive of all taxes" in prescribed font height >= 4mm',
        aiStatus: 'NEEDS VERIFICATION',
        confidence: 0.82,
        evidenceImageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
        highlightBox: { x: 30, y: 40, width: 40, height: 25 },
        evidenceNotes: 'Overlaid price alteration sticker suspected at point of retail sale.',
        reviewedByOfficer: true,
      },
    ],
    verification: {
      isVerified: false,
      status: 'Further Enquiry',
      verdict: 'FURTHER_ENQUIRY_REQUIRED',
      officerName: 'Dr. V. Ramanathan',
      officerRole: 'Assistant Controller',
      officerDesignation: 'Assistant Controller of Legal Metrology',
      verifiedAt: '2026-09-01T11:00:00.000Z',
      remarks: 'Forwarded to District Enforcement Cell for physical seizure of batch and retail vendor audit.',
      observations: 'Preliminary review indicates dual price marking and non-compliant consumer helpline format.',
      actionTaken: 'Summons letter issued to vendor to produce original invoice and batch sample.',
      digitalSealSignature: 'SEAL-LM-NZ-2026-9041',
    },
    forwardingHistory: [
      {
        forwardedAt: '2026-09-01T11:00:00.000Z',
        forwardedBy: 'Inspector Rajesh Sharma (LM-204)',
        fromRole: 'Inspector',
        targetDepartment: 'Prosecution & Standards Wing',
        targetAuthority: 'Assistant Controller (Enforcement), Northern Zone',
        reason: 'Dual MRP overlay sticker requires vendor invoice verification and verification of master carton.',
        priority: 'High',
        remarks: 'Sample seized from counter #4 under Form-1 receipt. Master distributor inquiry recommended.',
        evidenceSummary: 'Two photo evidences with OCR bounding boxes attached.',
      },
    ],
    timeline: [
      {
        id: 'TL-1',
        stageName: 'Complaint / Enquiry Submitted',
        status: 'Submitted',
        timestamp: '2026-08-28T10:30:00.000Z',
        actorName: 'Inspector Rajesh Sharma',
        actorRole: 'Enforcement Inspector',
        actionSummary: 'Statutory inspection completed and complaint dossier generated.',
        isPublic: true,
        isCompleted: true,
        isCurrent: false,
      },
      {
        id: 'TL-2',
        stageName: 'AI Preliminary Compliance Analysis',
        status: 'Under Review',
        timestamp: '2026-08-28T10:32:00.000Z',
        actorName: 'LegalMetriX AI Engine',
        actorRole: 'Autonomous AI System',
        actionSummary: 'Potential violation detected under Rule 6(1)(e) & Rule 6(1)(d).',
        isPublic: true,
        isCompleted: true,
        isCurrent: false,
      },
      {
        id: 'TL-3',
        stageName: 'Forwarded for Further Enquiry',
        status: 'Further Enquiry',
        timestamp: '2026-09-01T11:00:00.000Z',
        actorName: 'Assistant Controller Dr. V. Ramanathan',
        actorRole: 'Higher Official',
        actionSummary: 'Forwarded to District Enforcement Cell for vendor invoice verification.',
        isPublic: true,
        isCompleted: false,
        isCurrent: true,
      },
      {
        id: 'TL-4',
        stageName: 'Official Statutory Verification',
        status: 'Awaiting Verification',
        timestamp: '2026-09-02T14:15:00.000Z',
        actorName: 'Pending Authorized Officer',
        actorRole: 'Legal Metrology Officer',
        actionSummary: 'Officer evaluation of vendor response and packaging evidence.',
        isPublic: true,
        isCompleted: false,
        isCurrent: false,
      },
      {
        id: 'TL-5',
        stageName: 'Final Decision & Action Taken',
        status: 'Action Taken',
        timestamp: '',
        actorName: 'Enforcement Directorate',
        actorRole: 'Statutory Authority',
        actionSummary: 'Issuance of compound notice or formal adjudication under Section 36.',
        isPublic: true,
        isCompleted: false,
        isCurrent: false,
      },
      {
        id: 'TL-6',
        stageName: 'Case Closed',
        status: 'Closed',
        timestamp: '',
        actorName: 'Competent Authority',
        actorRole: 'Appellate Officer',
        actionSummary: 'Compliance rectified and case file closed.',
        isPublic: true,
        isCompleted: false,
        isCurrent: false,
      },
    ],
    auditTrail: [
      {
        id: 'AUD-01',
        timestamp: '2026-08-28T10:30:00.000Z',
        actorName: 'Inspector Rajesh Sharma',
        actorRole: 'Inspector',
        action: 'Complaint Created',
        toStatus: 'Submitted',
        details: 'Enquiry initiated following market inspection INS-1024 at Noida retail store.',
      },
      {
        id: 'AUD-02',
        timestamp: '2026-08-28T10:32:00.000Z',
        actorName: 'LegalMetriX AI Engine',
        actorRole: 'AI Assistant',
        action: 'Preliminary Findings Flagged',
        fromStatus: 'Submitted',
        toStatus: 'Under Review',
        details: '2 potential non-compliances flagged with 94% and 82% confidence scores.',
      },
      {
        id: 'AUD-03',
        timestamp: '2026-09-01T11:00:00.000Z',
        actorName: 'Dr. V. Ramanathan',
        actorRole: 'Senior Official',
        action: 'Case Forwarded for Further Enquiry',
        fromStatus: 'Under Review',
        toStatus: 'Further Enquiry',
        details: 'Case transferred to District Cell; distributor notice issued for MRP dual labelling verification.',
      },
    ],
    publicTrackingMessage:
      'Your complaint/enquiry is currently under active investigation by the Legal Metrology Enforcement Cell. The concerned distributor has been issued a notice to verify compliance.',
  },
  {
    id: 'LM-2026-003819',
    inspectionId: 'INS-1022',
    dateSubmitted: '2026-08-25T14:20:00.000Z',
    lastUpdated: '2026-09-02T09:40:00.000Z',
    submittedBy: 'Inspector Sunita Verma (LM-109)',
    submitterRole: 'Inspector',
    location: 'APMC Market Yard, Vashi, Navi Mumbai',
    currentStatus: 'Awaiting Verification',
    assignedAuthority: 'Deputy Controller (Weights & Measures), Zone 2',
    priority: 'High',
    product: {
      productName: 'Fortune Sunlite Refined Sunflower Oil (1 Litre Pouch)',
      brand: 'Fortune',
      category: 'Edible Oils & Fats',
      manufacturerName: 'Adani Wilmar Limited',
      manufacturerAddress: 'Fortune House, Near Navrangpura Railway Crossing, Ahmedabad 380009',
      mrp: '₹165.00 (Incl. of all taxes)',
      netQuantity: '1 L / 910 g',
      mfgDate: '08/2026',
      expiryDate: '05/2027',
      consumerCareDetails: 'care@adaniwilmar.in / Toll Free: 1800 233 9999',
      countryOfOrigin: 'India',
      fssaiNumber: '10013021000853',
      barcode: '8906007281452',
    },
    inspection: {
      inspectionId: 'INS-1022',
      inspectionDate: '2026-08-25',
      location: 'Wholesale Depot Bay #12, APMC Yard, Vashi',
      marketDistrict: 'Thane / Navi Mumbai, Maharashtra',
      inspectorName: 'Inspector Sunita Verma',
      inspectorBadge: 'LM-109',
      packageImages: [
        { side: 'Front Face', url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80' },
        { side: 'Back Declarations', url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80' },
      ],
    },
    findings: [
      {
        id: 'FND-10',
        fieldKey: 'net_quantity',
        fieldLabel: 'Dual Net Quantity Standard Declaration (Weight & Volume)',
        ruleCode: 'Rule 12(1)',
        ruleReference: 'LMR 2011 Rule 12 & Edible Oil Notification 2022',
        detectedText: 'Net Vol: 1 L (Net Wt declaration smudged)',
        requiredStandard: 'Edible oils must declare both Volume in Litres and equivalent Mass in Grams/Kilograms at 30°C',
        aiStatus: 'POTENTIAL VIOLATION',
        confidence: 0.91,
        evidenceImageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80',
        highlightBox: { x: 20, y: 50, width: 60, height: 25 },
        evidenceNotes: 'Equivalent weight in grams missing from front principal display panel.',
        reviewedByOfficer: false,
      },
    ],
    verification: {
      isVerified: false,
      status: 'Awaiting Verification',
      verdict: 'PENDING',
      officerName: 'Shri A. K. Deshmukh',
      officerRole: 'Deputy Controller',
      officerDesignation: 'Deputy Controller of Legal Metrology',
      remarks: 'Laboratory density test and gravimetric check report received; awaiting final signature.',
      observations: 'Gravimetric test indicates 906g instead of declared 910g; within maximum permissible error check underway.',
      actionTaken: '',
    },
    forwardingHistory: [],
    timeline: [
      {
        id: 'TL-1',
        stageName: 'Complaint / Enquiry Submitted',
        status: 'Submitted',
        timestamp: '2026-08-25T14:20:00.000Z',
        actorName: 'Inspector Sunita Verma',
        actorRole: 'Inspector',
        actionSummary: 'Market inspection sample submitted with field audit dossier.',
        isPublic: true,
        isCompleted: true,
        isCurrent: false,
      },
      {
        id: 'TL-2',
        stageName: 'Preliminary Analysis & Review',
        status: 'Under Review',
        timestamp: '2026-08-26T09:15:00.000Z',
        actorName: 'LegalMetriX AI Engine',
        actorRole: 'Autonomous AI System',
        actionSummary: 'Potential violation flagged on dual quantity temperature calibration.',
        isPublic: true,
        isCompleted: true,
        isCurrent: false,
      },
      {
        id: 'TL-3',
        stageName: 'Statutory Verification Pending',
        status: 'Awaiting Verification',
        timestamp: '2026-09-02T09:40:00.000Z',
        actorName: 'Deputy Controller Shri A. K. Deshmukh',
        actorRole: 'Senior Official',
        actionSummary: 'Lab reports uploaded; officer verification in progress.',
        isPublic: true,
        isCompleted: false,
        isCurrent: true,
      },
    ],
    auditTrail: [
      {
        id: 'AUD-01',
        timestamp: '2026-08-25T14:20:00.000Z',
        actorName: 'Inspector Sunita Verma',
        actorRole: 'Inspector',
        action: 'Case Submitted',
        toStatus: 'Submitted',
        details: 'Sample seized during edible oil surveillance drive.',
      },
    ],
    publicTrackingMessage:
      'Laboratory sample evaluation is in progress. Formal verification by the Deputy Controller is scheduled.',
  },
  {
    id: 'LM-2026-002941',
    inspectionId: 'INS-1019',
    dateSubmitted: '2026-08-18T11:00:00.000Z',
    lastUpdated: '2026-08-30T16:45:00.000Z',
    submittedBy: 'Inspector Amit Kulkarni (LM-312)',
    submitterRole: 'Inspector',
    location: 'D-Mart Superstore, Bannerghatta Road, Bengaluru, Karnataka',
    currentStatus: 'Verified Violation',
    assignedAuthority: 'Assistant Controller (Enforcement), Bengaluru South',
    priority: 'High',
    product: {
      productName: 'Surf Excel Easy Wash Detergent Powder (1.5 kg Pack)',
      brand: 'Surf Excel',
      category: 'Soaps & Detergents',
      manufacturerName: 'Hindustan Unilever Limited',
      manufacturerAddress: 'Unilever House, B.D. Sawant Marg, Chakala, Andheri East, Mumbai 400099',
      mrp: '₹210.00 (Incl. of all taxes)',
      netQuantity: '1.5 kg (Non-standard pack size without mandatory unit-sale-price)',
      mfgDate: '06/2026',
      expiryDate: '06/2028',
      consumerCareDetails: 'lever.care@unilever.com / 1800-10-22-221',
      countryOfOrigin: 'India',
      barcode: '8901030829141',
    },
    inspection: {
      inspectionId: 'INS-1019',
      inspectionDate: '2026-08-18',
      location: 'Retail Shelf Bay 3, Bannerghatta Road',
      marketDistrict: 'Bengaluru Urban, Karnataka',
      inspectorName: 'Inspector Amit Kulkarni',
      inspectorBadge: 'LM-312',
      packageImages: [
        { side: 'Front Panel', url: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=600&q=80' },
      ],
    },
    findings: [
      {
        id: 'FND-20',
        fieldKey: 'unit_sale_price',
        fieldLabel: 'Unit Sale Price (USP) Declaration',
        ruleCode: 'Rule 6(1)(s)',
        ruleReference: 'Legal Metrology (Packaged Commodities) Amendment Rules - Rule 6(1)(s)',
        detectedText: 'Unit Sale Price missing from principal display panel.',
        requiredStandard: 'Mandatory declaration of Unit Sale Price in Rs per gram/kg on all multi-unit and non-standard packaging',
        aiStatus: 'POTENTIAL VIOLATION',
        confidence: 0.98,
        evidenceImageUrl: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=600&q=80',
        highlightBox: { x: 30, y: 70, width: 40, height: 20 },
        evidenceNotes: 'USP declaration completely absent next to MRP.',
        reviewedByOfficer: true,
      },
    ],
    verification: {
      isVerified: true,
      status: 'Verified Violation',
      verdict: 'VERIFIED_VIOLATION',
      officerName: 'Dr. V. Ramanathan',
      officerRole: 'Assistant Controller',
      officerDesignation: 'Assistant Controller (Enforcement)',
      verifiedAt: '2026-08-30T16:45:00.000Z',
      remarks: 'Statutory violation confirmed under Section 18 / Section 36 of Legal Metrology Act 2009.',
      observations: 'Non-declaration of Unit Sale Price is a compoundable statutory defect.',
      actionTaken: 'Statutory Show Cause Notice issued to manufacturer; 15-day rectification order dispatched.',
      digitalSealSignature: 'SEAL-LM-BLR-2026-4412',
    },
    forwardingHistory: [],
    timeline: [
      {
        id: 'TL-1',
        stageName: 'Complaint Submitted',
        status: 'Submitted',
        timestamp: '2026-08-18T11:00:00.000Z',
        actorName: 'Inspector Amit Kulkarni',
        actorRole: 'Inspector',
        actionSummary: 'Field seizure report submitted.',
        isPublic: true,
        isCompleted: true,
        isCurrent: false,
      },
      {
        id: 'TL-2',
        stageName: 'AI Preliminary Finding',
        status: 'Under Review',
        timestamp: '2026-08-18T11:05:00.000Z',
        actorName: 'LegalMetriX AI Engine',
        actorRole: 'AI Assistant',
        actionSummary: 'High-confidence violation flagged on Unit Sale Price (USP).',
        isPublic: true,
        isCompleted: true,
        isCurrent: false,
      },
      {
        id: 'TL-3',
        stageName: 'Official Verification Completed',
        status: 'Verified Violation',
        timestamp: '2026-08-30T16:45:00.000Z',
        actorName: 'Dr. V. Ramanathan',
        actorRole: 'Senior Official',
        actionSummary: 'Violation formally verified and sealed under Section 36.',
        isPublic: true,
        isCompleted: true,
        isCurrent: true,
      },
    ],
    auditTrail: [
      {
        id: 'AUD-01',
        timestamp: '2026-08-18T11:00:00.000Z',
        actorName: 'Inspector Amit Kulkarni',
        actorRole: 'Inspector',
        action: 'Case Created',
        toStatus: 'Submitted',
        details: 'Retail sample logged.',
      },
      {
        id: 'AUD-02',
        timestamp: '2026-08-30T16:45:00.000Z',
        actorName: 'Dr. V. Ramanathan',
        actorRole: 'Senior Official',
        action: 'Finding Verified as Violation',
        fromStatus: 'Under Review',
        toStatus: 'Verified Violation',
        details: 'Show cause notice #SCN-2026-88 issued to manufacturer.',
      },
    ],
    publicTrackingMessage:
      'The Legal Metrology Department has officially verified the statutory declaration defect and issued a formal Show Cause Notice to the manufacturer.',
  },
  {
    id: 'LM-2026-001830',
    inspectionId: 'INS-1015',
    dateSubmitted: '2026-08-10T09:00:00.000Z',
    lastUpdated: '2026-08-20T17:00:00.000Z',
    submittedBy: 'Inspector Rajesh Sharma (LM-204)',
    submitterRole: 'Inspector',
    location: 'Metro Cash & Carry, Gurugram, Haryana',
    currentStatus: 'Closed',
    assignedAuthority: 'Controller of Legal Metrology, Haryana',
    priority: 'Low',
    product: {
      productName: 'Parle-G Gold Glucose Biscuits (1 kg Mega Pack)',
      brand: 'Parle',
      category: 'Bakery & Confectionery',
      manufacturerName: 'Parle Products Pvt. Ltd.',
      manufacturerAddress: 'North Level Crossing, Vile Parle East, Mumbai 400057',
      mrp: '₹120.00',
      netQuantity: '1.0 kg',
      mfgDate: '07/2026',
      expiryDate: '01/2027',
      consumerCareDetails: 'cs@parle.biz / 022-66916911',
      countryOfOrigin: 'India',
      fssaiNumber: '10013022002253',
      barcode: '8901719101037',
    },
    inspection: {
      inspectionId: 'INS-1015',
      inspectionDate: '2026-08-10',
      location: 'Wholesale Aisle 7, Metro Cash & Carry',
      marketDistrict: 'Gurugram, Haryana',
      inspectorName: 'Inspector Rajesh Sharma',
      inspectorBadge: 'LM-204',
      packageImages: [
        { side: 'Front Panel', url: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80' },
      ],
    },
    findings: [
      {
        id: 'FND-30',
        fieldKey: 'fssai_alignment',
        fieldLabel: 'FSSAI Logo & License Font Ratio',
        ruleCode: 'Rule 6(1)',
        ruleReference: 'FSSAI & LMR Convergence Standard',
        detectedText: 'FSSAI Lic No. 10013022002253 present with standard logo',
        requiredStandard: 'FSSAI license number clearly legible in contrast background',
        aiStatus: 'PASS',
        confidence: 0.99,
        evidenceImageUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80',
        reviewedByOfficer: true,
      },
    ],
    verification: {
      isVerified: true,
      status: 'Closed',
      verdict: 'NOT_VERIFIED',
      officerName: 'Dr. V. Ramanathan',
      officerRole: 'Senior Official',
      officerDesignation: 'Assistant Controller',
      verifiedAt: '2026-08-20T17:00:00.000Z',
      remarks: 'Product audited thoroughly; all statutory requirements compliant under LMR 2011. File closed.',
      observations: 'No non-compliance observed upon physical caliper measurement.',
      actionTaken: 'Case closed with Clean Statutory Audit Certificate issued to retailer.',
      digitalSealSignature: 'SEAL-LM-HR-2026-1198',
    },
    forwardingHistory: [],
    timeline: [
      {
        id: 'TL-1',
        stageName: 'Complaint / Audit Submitted',
        status: 'Submitted',
        timestamp: '2026-08-10T09:00:00.000Z',
        actorName: 'Inspector Rajesh Sharma',
        actorRole: 'Inspector',
        actionSummary: 'Routine retail sampling inspection logged.',
        isPublic: true,
        isCompleted: true,
        isCurrent: false,
      },
      {
        id: 'TL-2',
        stageName: 'Official Verification & Closure',
        status: 'Closed',
        timestamp: '2026-08-20T17:00:00.000Z',
        actorName: 'Dr. V. Ramanathan',
        actorRole: 'Senior Official',
        actionSummary: 'Full compliance verified. Case concluded and closed.',
        isPublic: true,
        isCompleted: true,
        isCurrent: true,
      },
    ],
    auditTrail: [
      {
        id: 'AUD-01',
        timestamp: '2026-08-10T09:00:00.000Z',
        actorName: 'Inspector Rajesh Sharma',
        actorRole: 'Inspector',
        action: 'Audit Logged',
        toStatus: 'Submitted',
        details: 'Routine verification logged.',
      },
      {
        id: 'AUD-02',
        timestamp: '2026-08-20T17:00:00.000Z',
        actorName: 'Dr. V. Ramanathan',
        actorRole: 'Senior Official',
        action: 'Case Concluded & Closed',
        fromStatus: 'Under Review',
        toStatus: 'Closed',
        details: 'Verified 100% compliant. Certificate issued.',
      },
    ],
    publicTrackingMessage:
      'This inspection/enquiry has been thoroughly audited, verified compliant with all statutory standards, and officially closed.',
  },
  {
    id: 'LM-2026-001205',
    inspectionId: 'INS-1012',
    dateSubmitted: '2026-08-01T12:00:00.000Z',
    lastUpdated: '2026-08-22T15:30:00.000Z',
    submittedBy: 'Inspector Sunita Verma (LM-109)',
    submitterRole: 'Inspector',
    location: 'Reliance Fresh, Dadar West, Mumbai, Maharashtra',
    currentStatus: 'Action Taken',
    assignedAuthority: 'Deputy Controller of Legal Metrology, Mumbai',
    priority: 'Medium',
    product: {
      productName: 'Dabur 100% Pure Honey (500g Jar)',
      brand: 'Dabur',
      category: 'Processed Food Products',
      manufacturerName: 'Dabur India Limited',
      manufacturerAddress: '8/3, Asaf Ali Road, New Delhi 110002',
      mrp: '₹225.00',
      netQuantity: '500 g',
      mfgDate: '06/2026',
      expiryDate: '06/2028',
      consumerCareDetails: 'daburcares@feedback.dabur / 1800-103-1644',
      countryOfOrigin: 'India',
      barcode: '8901207000102',
    },
    inspection: {
      inspectionId: 'INS-1012',
      inspectionDate: '2026-08-01',
      location: 'Retail Rack #2, Dadar West Store',
      marketDistrict: 'Mumbai City, Maharashtra',
      inspectorName: 'Inspector Sunita Verma',
      inspectorBadge: 'LM-109',
      packageImages: [
        { side: 'Front Jar Face', url: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=600&q=80' },
      ],
    },
    findings: [
      {
        id: 'FND-40',
        fieldKey: 'mfg_date_format',
        fieldLabel: 'Month & Year Format Alignment',
        ruleCode: 'Rule 6(1)(c)',
        ruleReference: 'LMR 2011 Rule 6(1)(c)',
        detectedText: 'PKD 06/26 with low print contrast',
        requiredStandard: 'Month and year of manufacture must be clearly legible and distinct',
        aiStatus: 'POTENTIAL VIOLATION',
        confidence: 0.89,
        evidenceImageUrl: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=600&q=80',
        reviewedByOfficer: true,
      },
    ],
    verification: {
      isVerified: true,
      status: 'Action Taken',
      verdict: 'ACTION_TAKEN',
      officerName: 'Shri A. K. Deshmukh',
      officerRole: 'Senior Official',
      officerDesignation: 'Deputy Controller',
      verifiedAt: '2026-08-22T15:30:00.000Z',
      remarks: 'Compounding notice issued under Section 48; fine of ₹25,000 paid by regional distributor; corrective relabeling verified.',
      observations: 'Batch relabeling completed under officer supervision.',
      actionTaken: 'Compounding fee recovered (Receipt #MH-LM-2026-9921) and compliance undertaking filed.',
      digitalSealSignature: 'SEAL-LM-MH-2026-7841',
    },
    forwardingHistory: [],
    timeline: [
      {
        id: 'TL-1',
        stageName: 'Complaint Logged',
        status: 'Submitted',
        timestamp: '2026-08-01T12:00:00.000Z',
        actorName: 'Inspector Sunita Verma',
        actorRole: 'Inspector',
        actionSummary: 'Field inspection and defect report recorded.',
        isPublic: true,
        isCompleted: true,
        isCurrent: false,
      },
      {
        id: 'TL-2',
        stageName: 'Action Taken & Remediation',
        status: 'Action Taken',
        timestamp: '2026-08-22T15:30:00.000Z',
        actorName: 'Shri A. K. Deshmukh',
        actorRole: 'Senior Official',
        actionSummary: 'Statutory compounding fee settled and packaging corrected.',
        isPublic: true,
        isCompleted: true,
        isCurrent: true,
      },
    ],
    auditTrail: [
      {
        id: 'AUD-01',
        timestamp: '2026-08-01T12:00:00.000Z',
        actorName: 'Inspector Sunita Verma',
        actorRole: 'Inspector',
        action: 'Case Created',
        toStatus: 'Submitted',
        details: 'Retail sample logged.',
      },
      {
        id: 'AUD-02',
        timestamp: '2026-08-22T15:30:00.000Z',
        actorName: 'Shri A. K. Deshmukh',
        actorRole: 'Senior Official',
        action: 'Compounding Notice Executed',
        fromStatus: 'Verified Violation',
        toStatus: 'Action Taken',
        details: 'Fine recovered and packaging rectified.',
      },
    ],
    publicTrackingMessage:
      'Statutory action has been successfully taken. The compounding notice was executed, penal fees settled, and packaging brought into full legal compliance.',
  },
];

// Helper to get all stored complaints
export function getStoredComplaints(): ComplaintRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MOCK_COMPLAINTS));
      return INITIAL_MOCK_COMPLAINTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MOCK_COMPLAINTS));
    return INITIAL_MOCK_COMPLAINTS;
  } catch (e) {
    console.error('Error reading complaints from storage:', e);
    return INITIAL_MOCK_COMPLAINTS;
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
