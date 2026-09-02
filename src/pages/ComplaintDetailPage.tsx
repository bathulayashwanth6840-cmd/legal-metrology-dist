// src/pages/ComplaintDetailPage.tsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, ShieldCheck, AlertTriangle, Send,
  Clock, Eye, Building2, Tag, Sparkles,
  ClipboardList, Check, RefreshCw
} from 'lucide-react';
import {
  getComplaintById,
  forwardComplaintForEnquiry,
  verifyComplaintRecord,
} from '../services/complaintService';
import type { ComplaintRecord, ComplaintStatus, FindingEvidence } from '../types/complaint';
import { useRole } from '../context/RoleContext';
import ForwardModal from '../components/ForwardModal';
import VerificationModal from '../components/VerificationModal';
import EvidenceModal from '../components/EvidenceModal';

const STATUS_BADGES: Record<
  ComplaintStatus,
  { label: string; badgeClass: string; icon: string }
> = {
  Submitted: { label: 'Submitted', badgeClass: 'bg-blue-100 text-blue-900 border-blue-300', icon: '📝' },
  'Under Review': { label: 'Under Review', badgeClass: 'bg-indigo-100 text-indigo-900 border-indigo-300', icon: '🔍' },
  'Further Enquiry': { label: 'Further Enquiry', badgeClass: 'bg-amber-100 text-amber-950 border-amber-400 ring-2 ring-amber-300/40', icon: '⏳' },
  'Awaiting Verification': { label: 'Awaiting Verification', badgeClass: 'bg-purple-100 text-purple-950 border-purple-400', icon: '⚖️' },
  'Verified Violation': { label: 'Verified Violation', badgeClass: 'bg-rose-100 text-rose-950 border-rose-400 font-black', icon: '❌' },
  'Not Verified': { label: 'Not Verified', badgeClass: 'bg-slate-100 text-slate-800 border-slate-300', icon: '✓' },
  'Action Taken': { label: 'Action Taken', badgeClass: 'bg-emerald-100 text-emerald-950 border-emerald-400 font-bold', icon: '⚡' },
  Closed: { label: 'Closed', badgeClass: 'bg-teal-100 text-teal-900 border-teal-300', icon: '🔒' },
};

export default function ComplaintDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { currentRole, profile } = useRole();

  const [complaint, setComplaint] = useState<ComplaintRecord | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isForwardModalOpen, setIsForwardModalOpen] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [selectedFinding, setSelectedFinding] = useState<FindingEvidence | null>(null);

  useEffect(() => {
    if (id) {
      loadComplaint(id);
    }
  }, [id]);

  const loadComplaint = (complaintId: string) => {
    setLoading(true);
    const rec = getComplaintById(complaintId);
    setComplaint(rec || null);
    setLoading(false);
  };

  const handleForward = (forwardData: any) => {
    if (!complaint) return;
    const updated = forwardComplaintForEnquiry(complaint.id, {
      ...forwardData,
      forwardedBy: `${profile.name} (${profile.badge})`,
      fromRole: currentRole === 'senior_official' ? 'Senior Official' : 'Inspector',
    });
    if (updated) setComplaint(updated);
    setIsForwardModalOpen(false);
  };

  const handleVerify = (verifyData: any) => {
    if (!complaint) return;
    const updated = verifyComplaintRecord(complaint.id, verifyData);
    if (updated) setComplaint(updated);
    setIsVerifyModalOpen(false);
  };

  const handleMarkEvidenceReviewed = (findingId: string) => {
    if (!complaint) return;
    const updatedFindings = complaint.findings.map((f) =>
      f.id === findingId ? { ...f, reviewedByOfficer: true } : f
    );
    const updatedComplaint = { ...complaint, findings: updatedFindings };
    setComplaint(updatedComplaint);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <RefreshCw className="animate-spin text-blue-600 mx-auto" size={32} />
          <p className="text-xs font-bold text-slate-500">Loading statutory complaint dossier...</p>
        </div>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertTriangle size={48} className="text-amber-500 mx-auto" />
        <h2 className="text-xl font-black text-slate-900">Complaint Dossier Not Found</h2>
        <p className="text-xs text-slate-500">
          No statutory complaint record was found with ID: <span className="font-mono font-bold">{id}</span>
        </p>
        <Link
          to="/complaints"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-800 text-white rounded-xl text-xs font-bold shadow-sm"
        >
          <ArrowLeft size={14} /> Back to Complaints List
        </Link>
      </div>
    );
  }

  const st = STATUS_BADGES[complaint.currentStatus] || STATUS_BADGES.Submitted;

  return (
    <div className="flex flex-col min-h-full select-none pb-24 sm:pb-12 bg-slate-50">
      {/* ── Top Header Banner ──────────────────────────────────────────────── */}
      <div className="bg-[var(--color-navy)] text-white pt-6 pb-10 px-4 sm:px-8 shadow-md">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <Link
              to="/complaints"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-200 hover:text-white transition-colors"
            >
              <ArrowLeft size={14} /> Back to Complaints & Enquiries
            </Link>

            <Link
              to={`/track?id=${complaint.id}`}
              className="text-xs font-bold bg-white/10 hover:bg-white/20 text-blue-200 hover:text-white px-3 py-1.5 rounded-xl border border-white/15 transition-all inline-flex items-center gap-1.5"
            >
              <Eye size={12} /> View Public Citizen Tracking
            </Link>
          </div>

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pt-2">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="font-mono font-black text-xs bg-amber-400 text-slate-950 px-2.5 py-1 rounded-lg">
                  {complaint.id}
                </span>
                <span className="text-xs font-mono font-bold text-blue-200">
                  Ref: {complaint.inspectionId}
                </span>
                <span
                  className={`px-3 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                    complaint.priority === 'High'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : complaint.priority === 'Medium'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                  }`}
                >
                  {complaint.priority} Priority
                </span>
              </div>

              <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight">
                {complaint.product.productName}
              </h1>
              <p className="text-xs text-blue-200 mt-1 max-w-3xl">
                Location: <span className="font-semibold text-white">{complaint.location}</span> • Submitted: {new Date(complaint.dateSubmitted).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} by {complaint.submittedBy}
              </p>
            </div>

            {/* Status & Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <div className={`px-4 py-2.5 rounded-2xl border flex items-center gap-2 shadow-sm ${st.badgeClass}`}>
                <span className="text-base">{st.icon}</span>
                <div>
                  <span className="text-[9px] uppercase font-bold tracking-wider block opacity-75">Statutory Status</span>
                  <span className="font-black text-xs block">{st.label}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsForwardModalOpen(true)}
                className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Send size={14} />
                <span>Forward for Further Enquiry</span>
              </button>

              <button
                type="button"
                onClick={() => setIsVerifyModalOpen(true)}
                className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <ShieldCheck size={14} />
                <span>Official Verification</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Dossier Grid ────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 -mt-4 space-y-6 w-full">
        {/* Section 1: Product & Inspection Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Product Specifications */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <Tag size={18} className="text-blue-600" />
                Commodity & Packaging Information
              </h3>
              <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                Rule 6 LMR 2011
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Product Name</span>
                <span className="font-bold text-slate-900 block mt-0.5">{complaint.product.productName}</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Brand</span>
                <span className="font-bold text-slate-900 block mt-0.5">{complaint.product.brand}</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Declared MRP</span>
                <span className="font-mono font-black text-blue-900 block mt-0.5">{complaint.product.mrp}</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Declared Net Quantity</span>
                <span className="font-mono font-bold text-slate-900 block mt-0.5">{complaint.product.netQuantity}</span>
              </div>

              <div className="col-span-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Manufacturer / Packer</span>
                <span className="font-semibold text-slate-900 block mt-0.5">{complaint.product.manufacturerName}</span>
                <span className="text-[11px] text-slate-500 block mt-0.5">{complaint.product.manufacturerAddress}</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Country of Origin</span>
                <span className="font-bold text-slate-900 block mt-0.5">{complaint.product.countryOfOrigin}</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Barcode / GTIN</span>
                <span className="font-mono font-bold text-slate-800 block mt-0.5">
                  {complaint.product.barcode || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Inspection Seizure Context */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <Building2 size={18} className="text-blue-600" />
                Physical Inspection & Audit Context
              </h3>
              <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-800 px-2 py-0.5 rounded">
                Form-1 Seizure Linked
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Inspection Reference</span>
                <span className="font-mono font-black text-slate-900 block mt-0.5">{complaint.inspection.inspectionId}</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Inspection Date</span>
                <span className="font-semibold text-slate-900 block mt-0.5">{complaint.inspection.inspectionDate}</span>
              </div>

              <div className="col-span-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Seizure Point & Retail Outlet</span>
                <span className="font-semibold text-slate-900 block mt-0.5">{complaint.inspection.location}</span>
                <span className="text-[11px] text-slate-500 block mt-0.5">{complaint.inspection.marketDistrict}</span>
              </div>

              <div className="col-span-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Reporting Field Officer</span>
                <span className="font-semibold text-slate-900 block mt-0.5">
                  {complaint.inspection.inspectorName} ({complaint.inspection.inspectorBadge})
                </span>
              </div>
            </div>

            {/* Package Images Gallery */}
            {complaint.inspection.packageImages && complaint.inspection.packageImages.length > 0 && (
              <div className="pt-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">
                  Seized Package Evidence Photos ({complaint.inspection.packageImages.length}):
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {complaint.inspection.packageImages.map((img, i) => (
                    <div key={i} className="group relative rounded-xl overflow-hidden border border-slate-200 h-20 bg-slate-100">
                      <img src={img.url} alt={img.side} className="w-full h-full object-cover" />
                      <span className="absolute bottom-0 inset-x-0 bg-slate-900/80 text-[8px] font-bold text-white px-1 py-0.5 truncate text-center">
                        {img.side}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 2: AI Preliminary Findings vs Official Verification */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full text-[10px] font-extrabold tracking-widest text-blue-800 uppercase mb-1">
                <Sparkles size={12} className="text-amber-500" />
                <span>AI ASSISTIVE DETECTION LAYER</span>
              </div>
              <h3 className="font-black text-slate-900 text-lg">
                AI Preliminary Findings ({complaint.findings.length})
              </h3>
              <p className="text-xs text-slate-500">
                Rule violations and non-conformances identified through PaddleOCR and Gemini Vision pipeline.
              </p>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 max-w-md">
              <span className="font-black block text-amber-950">⚖️ Non-Binding Statutory Notice:</span>
              AI findings are assistive cues. Legal penalties or notices are determined solely through authorized officer verification.
            </div>
          </div>

          {/* Findings List */}
          <div className="space-y-3">
            {complaint.findings.length === 0 ? (
              <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-2xl">
                No preliminary violations recorded for this item.
              </div>
            ) : (
              complaint.findings.map((f) => {
                const isPass = f.aiStatus === 'PASS';
                const isPotential = f.aiStatus === 'POTENTIAL VIOLATION';

                return (
                  <div
                    key={f.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                      isPass
                        ? 'bg-emerald-50/40 border-emerald-200'
                        : isPotential
                        ? 'bg-rose-50/40 border-rose-200'
                        : 'bg-amber-50/40 border-amber-200'
                    }`}
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                            isPass
                              ? 'bg-emerald-100 text-emerald-800'
                              : isPotential
                              ? 'bg-rose-100 text-rose-900 ring-1 ring-rose-400/40'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {f.aiStatus}
                        </span>
                        <span className="font-black text-xs text-slate-900">{f.fieldLabel}</span>
                        <span className="font-mono text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-bold">
                          {f.ruleCode}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">OCR Detected:</span>
                          <span className="font-mono text-slate-800 font-bold">{f.detectedText}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Mandate:</span>
                          <span className="text-slate-700">{f.requiredStandard}</span>
                        </div>
                      </div>

                      {f.reviewedByOfficer && (
                        <div className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 mt-1">
                          <Check size={12} /> Officer Evidence Reviewed
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 self-end md:self-center">
                      <button
                        type="button"
                        onClick={() => setSelectedFinding(f)}
                        className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                      >
                        <Eye size={12} className="text-blue-600" />
                        <span>Inspect Evidence</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Section 3: Official Verification Record */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full text-[10px] font-extrabold tracking-widest text-emerald-800 uppercase mb-1">
                <ShieldCheck size={12} className="text-emerald-600" />
                <span>LEGAL METROLOGY ACT 2009 VERIFICATION</span>
              </div>
              <h3 className="font-black text-slate-900 text-lg">Official Statutory Determination</h3>
              <p className="text-xs text-slate-500">
                Binding enforcement determination by authorized officer.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsVerifyModalOpen(true)}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
            >
              <ShieldCheck size={14} /> Update Official Verification
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Official Statutory Verdict</span>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm text-slate-900">
                  {complaint.verification?.verdict?.replace(/_/g, ' ') || 'Pending Official Determination'}
                </span>
              </div>
              <p className="text-slate-600 text-xs mt-1">
                {complaint.verification?.remarks || 'No formal verification remarks recorded yet.'}
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Action Taken & Remediation</span>
              <span className="font-bold text-xs text-slate-900 block">
                {complaint.verification?.actionTaken || 'Pending compliance notice / compounding execution'}
              </span>
              <p className="text-slate-600 text-xs">
                {complaint.verification?.observations || 'Field observations recorded.'}
              </p>
            </div>
          </div>

          {complaint.verification?.digitalSealSignature && (
            <div className="p-3 bg-emerald-950 text-white rounded-2xl border border-emerald-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-400" />
                <span className="font-bold">
                  Verified by {complaint.verification.officerName} ({complaint.verification.officerDesignation})
                </span>
              </div>
              <span className="font-mono text-[10px] text-amber-300 font-bold">
                {complaint.verification.digitalSealSignature} • Sealed on {new Date(complaint.verification.verifiedAt || Date.now()).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        {/* Section 4: Visual Progression Timeline & Audit Trail */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Visual Progression Stepper */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
            <h3 className="font-black text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
              <Clock size={18} className="text-blue-600" />
              Statutory Case Timeline
            </h3>

            <div className="space-y-4 pt-2">
              {complaint.timeline.map((step, idx) => {
                const isDone = step.isCompleted;
                const isCurrent = step.isCurrent;

                return (
                  <div key={step.id || idx} className="flex items-start gap-3">
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-colors ${
                          isDone
                            ? 'bg-emerald-600 text-white'
                            : isCurrent
                            ? 'bg-amber-500 text-white ring-4 ring-amber-100 animate-pulse'
                            : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        {isDone ? '✓' : isCurrent ? '●' : idx + 1}
                      </div>
                      {idx < complaint.timeline.length - 1 && (
                        <div
                          className={`w-0.5 h-10 my-1 ${
                            isDone ? 'bg-emerald-400' : 'bg-slate-200'
                          }`}
                        />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 pb-2">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className={`text-xs font-bold ${isCurrent ? 'text-amber-950 font-black' : 'text-slate-800'}`}>
                          {step.stageName}
                        </h4>
                        {step.timestamp && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(step.timestamp).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                            })}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{step.actionSummary}</p>
                      <span className="text-[9px] font-mono text-slate-400 block mt-0.5">
                        Role: {step.actorRole}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Immutable Audit Trail */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
            <h3 className="font-black text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
              <ClipboardList size={18} className="text-blue-600" />
              Immutable Enforcement Audit Trail
            </h3>

            <div className="space-y-3 pt-2 max-h-[380px] overflow-y-auto">
              {complaint.auditTrail.map((log) => (
                <div
                  key={log.id}
                  className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-blue-900 bg-blue-100 px-2 py-0.5 rounded">
                      {log.actorRole}
                    </span>
                    <span className="text-slate-400 font-mono">
                      {new Date(log.timestamp).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <span className="font-black text-slate-900 block">{log.action}</span>
                  <p className="text-[11px] text-slate-600 leading-relaxed">{log.details}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {isForwardModalOpen && (
        <ForwardModal
          isOpen={isForwardModalOpen}
          complaintId={complaint.id}
          productName={complaint.product.productName}
          onClose={() => setIsForwardModalOpen(false)}
          onForward={handleForward}
        />
      )}

      {isVerifyModalOpen && (
        <VerificationModal
          isOpen={isVerifyModalOpen}
          complaintId={complaint.id}
          productName={complaint.product.productName}
          onClose={() => setIsVerifyModalOpen(false)}
          onVerify={handleVerify}
        />
      )}

      {selectedFinding && (
        <EvidenceModal
          isOpen={Boolean(selectedFinding)}
          finding={selectedFinding}
          productName={complaint.product.productName}
          onClose={() => setSelectedFinding(null)}
          onMarkReviewed={handleMarkEvidenceReviewed}
        />
      )}
    </div>
  );
}
