// src/components/VerificationModal.tsx
import React, { useState } from 'react';
import { ShieldCheck, X, CheckCircle2, XCircle, RotateCcw, FileCheck } from 'lucide-react';
import type { ComplaintStatus } from '../types/complaint';
import { useRole } from '../context/RoleContext';

interface VerificationModalProps {
  isOpen: boolean;
  complaintId: string;
  productName: string;
  currentStatus?: ComplaintStatus;
  onClose: () => void;
  onVerify: (data: {
    verdict: 'VERIFIED_VIOLATION' | 'NOT_VERIFIED' | 'FURTHER_ENQUIRY_REQUIRED' | 'ACTION_TAKEN';
    newStatus: ComplaintStatus;
    remarks: string;
    observations: string;
    actionTaken?: string;
    additionalEvidenceNotes?: string;
    officerName: string;
    officerRole: string;
    officerDesignation: string;
  }) => void;
}

export default function VerificationModal({
  isOpen,
  complaintId,
  productName,
  onClose,
  onVerify,
}: VerificationModalProps) {
  const { profile } = useRole();
  const [verdict, setVerdict] = useState<'VERIFIED_VIOLATION' | 'NOT_VERIFIED' | 'FURTHER_ENQUIRY_REQUIRED' | 'ACTION_TAKEN'>('VERIFIED_VIOLATION');
  const [remarks, setRemarks] = useState('Packaging audit confirms violation under Rule 6(1)(e) and Rule 6(1)(d) of Legal Metrology (Packaged Commodities) Rules 2011.');
  const [observations, setObservations] = useState('Dual MRP sticker overlay identified on retail unit; consumer grievance helpline telephone missing from panel.');
  const [actionTaken, setActionTaken] = useState('Formal Statutory Notice issued to distributor and manufacturer under Section 18 / 36.');
  const [additionalNotes] = useState('Laboratory physical verification report #LMR-LAB-2026-44 referenced.');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let newStatus: ComplaintStatus = 'Verified Violation';
    if (verdict === 'VERIFIED_VIOLATION') newStatus = 'Verified Violation';
    else if (verdict === 'NOT_VERIFIED') newStatus = 'Not Verified';
    else if (verdict === 'FURTHER_ENQUIRY_REQUIRED') newStatus = 'Further Enquiry';
    else if (verdict === 'ACTION_TAKEN') newStatus = 'Action Taken';

    onVerify({
      verdict,
      newStatus,
      remarks,
      observations,
      actionTaken: verdict === 'ACTION_TAKEN' || verdict === 'VERIFIED_VIOLATION' ? actionTaken : '',
      additionalEvidenceNotes: additionalNotes,
      officerName: profile.name,
      officerRole: profile.role,
      officerDesignation: profile.designation,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-[var(--color-navy)] text-white p-6 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-600 flex items-center justify-center text-emerald-400 flex-shrink-0">
              <ShieldCheck size={22} />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 block font-bold">
                AUTHORIZED STATUTORY ACTION
              </span>
              <h3 className="text-lg font-black text-white">Official Statutory Verification</h3>
              <p className="text-xs text-blue-200 mt-0.5">
                Case ID: <span className="font-mono font-bold text-amber-400">{complaintId}</span> • Commodity: <span className="text-white font-medium">{productName}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Important Regulatory Notice */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 leading-relaxed">
            <span className="font-bold block text-[11px] mb-0.5">⚖️ Statutory Authority Notice:</span>
            AI findings serve as preliminary assistive cues. Only your signed verdict below constitutes the official Legal Metrology determination under the Legal Metrology Act, 2009.
          </div>

          {/* Verdict Selection */}
          <div>
            <label className="font-bold text-slate-800 block mb-2">Select Official Statutory Verdict:</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setVerdict('VERIFIED_VIOLATION')}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                  verdict === 'VERIFIED_VIOLATION'
                    ? 'bg-rose-50 border-rose-500 text-rose-950 ring-2 ring-rose-400/30 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <XCircle size={18} className={`flex-shrink-0 mt-0.5 ${verdict === 'VERIFIED_VIOLATION' ? 'text-rose-600' : 'text-slate-400'}`} />
                <div>
                  <span className="font-black block text-xs">✓ Verify Finding (Violation)</span>
                  <span className="text-[10px] text-slate-500 block">Confirms breach; moves status to Verified Violation.</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setVerdict('NOT_VERIFIED')}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                  verdict === 'NOT_VERIFIED'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-400/30 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <CheckCircle2 size={18} className={`flex-shrink-0 mt-0.5 ${verdict === 'NOT_VERIFIED' ? 'text-emerald-600' : 'text-slate-400'}`} />
                <div>
                  <span className="font-black block text-xs">✕ Mark Not Verified</span>
                  <span className="text-[10px] text-slate-500 block">Packaging verified compliant; rejects violation flag.</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setVerdict('FURTHER_ENQUIRY_REQUIRED')}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                  verdict === 'FURTHER_ENQUIRY_REQUIRED'
                    ? 'bg-amber-50 border-amber-500 text-amber-950 ring-2 ring-amber-400/30 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <RotateCcw size={18} className={`flex-shrink-0 mt-0.5 ${verdict === 'FURTHER_ENQUIRY_REQUIRED' ? 'text-amber-600' : 'text-slate-400'}`} />
                <div>
                  <span className="font-black block text-xs">↻ Request More Information</span>
                  <span className="text-[10px] text-slate-500 block">Orders further lab test or wholesale vendor audit.</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setVerdict('ACTION_TAKEN')}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                  verdict === 'ACTION_TAKEN'
                    ? 'bg-blue-50 border-blue-500 text-blue-950 ring-2 ring-blue-400/30 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <FileCheck size={18} className={`flex-shrink-0 mt-0.5 ${verdict === 'ACTION_TAKEN' ? 'text-blue-600' : 'text-slate-400'}`} />
                <div>
                  <span className="font-black block text-xs">⚡ Record Action Taken</span>
                  <span className="text-[10px] text-slate-500 block">Compounding fine recorded or seizure notice served.</span>
                </div>
              </button>
            </div>
          </div>

          {/* Verification Remarks */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">Official Statutory Verification Remarks:</label>
            <textarea
              rows={2}
              required
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="State the official legal grounds and rule analysis..."
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Technical Observations */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">Physical / Caliper / Measurement Observations:</label>
            <textarea
              rows={2}
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Specific measurements, font height verification, or vendor inspection notes..."
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Action Taken */}
          {(verdict === 'ACTION_TAKEN' || verdict === 'VERIFIED_VIOLATION') && (
            <div>
              <label className="font-bold text-slate-700 block mb-1">Enforcement Action Taken / Notice Details:</label>
              <input
                type="text"
                value={actionTaken}
                onChange={(e) => setActionTaken(e.target.value)}
                placeholder="Show Cause Notice #, Compounding receipt #, or seizure order..."
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Officer Identity & Seal Preview */}
          <div className="p-3.5 bg-slate-900 text-white rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-400 block font-bold">
                DIGITAL SIGNATURE & SEAL
              </span>
              <span className="font-bold text-xs text-white block">{profile.name}</span>
              <span className="text-[10px] text-slate-400">{profile.designation}</span>
            </div>
            <div className="text-right">
              <span className="text-[9px] font-mono text-amber-400 font-bold block">
                SEAL-LM-{Date.now().toString().slice(-4)}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">{new Date().toLocaleDateString()}</span>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <ShieldCheck size={16} />
              <span>Submit Statutory Verdict</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
