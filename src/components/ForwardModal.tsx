// src/components/ForwardModal.tsx
import React, { useState } from 'react';
import { Send, X, AlertTriangle, Building2 } from 'lucide-react';
import type { ComplaintPriority } from '../types/complaint';
import { useFocusTrap } from '../utils/useFocusTrap';

interface ForwardModalProps {
  isOpen: boolean;
  complaintId: string;
  productName: string;
  onClose: () => void;
  onForward: (data: {
    targetDepartment: string;
    targetAuthority: string;
    reason: string;
    priority: ComplaintPriority;
    remarks: string;
    evidenceSummary: string;
  }) => void;
}

const DEPARTMENTS = [
  {
    dept: 'District Enforcement Cell (Field Investigation)',
    authority: 'Assistant Controller (Enforcement), Northern Zone',
  },
  {
    dept: 'Prosecution & Legal Directorate',
    authority: 'Director of Legal Metrology / Public Prosecutor Cell',
  },
  {
    dept: 'Laboratory Standards & Verification Wing',
    authority: 'Deputy Controller (Weights & Measures Testing Lab)',
  },
  {
    dept: 'Inter-State Packaging Directorate',
    authority: 'Central Standards & E-Commerce Surveillance Directorate',
  },
];

export default function ForwardModal({
  isOpen,
  complaintId,
  productName,
  onClose,
  onForward,
}: ForwardModalProps) {
  const [selectedDeptIndex, setSelectedDeptIndex] = useState(0);
  const [priority, setPriority] = useState<ComplaintPriority>('High');
  const [reason, setReason] = useState('Dual MRP sticker and non-compliant consumer helpline format requires distributor investigation.');
  const [remarks, setRemarks] = useState('Seized retail sample Form-1 attached. Recommend issuing statutory enquiry notice under Section 18 / 36.');
  const [evidenceSummary, setEvidenceSummary] = useState('2 high-resolution panel photos with OCR bounding box annotations and detected OCR text.');

  const modalRef = useFocusTrap({ isOpen, onClose });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sel = DEPARTMENTS[selectedDeptIndex];
    onForward({
      targetDepartment: sel.dept,
      targetAuthority: sel.authority,
      reason,
      priority,
      remarks,
      evidenceSummary,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="forward-modal-title"
      aria-describedby="forward-modal-desc"
    >
      <div
        ref={modalRef}
        className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150 focus:outline-none"
        tabIndex={-1}
      >
        {/* Modal Header */}
        <div className="bg-[var(--color-navy)] text-white p-6 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl bg-blue-900 border border-blue-700 flex items-center justify-center text-amber-400 flex-shrink-0"
              aria-hidden="true"
            >
              <Send size={20} />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-blue-300 block font-bold">
                ENFORCEMENT ESCALATION
              </span>
              <h2 id="forward-modal-title" className="text-lg font-black text-white">
                Forward for Further Enquiry
              </h2>
              <p id="forward-modal-desc" className="text-xs text-blue-200 mt-0.5">
                Case ID: <span className="font-mono font-bold text-amber-400">{complaintId}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close forward dialog"
            className="text-slate-400 hover:text-white p-1.5 rounded-lg transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-amber-900">
            <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <span className="font-bold block">Commodity under Investigation:</span>
              <span className="font-medium text-[11px]">{productName}</span>
            </div>
          </div>

          {/* Department Selection */}
          <div>
            <label htmlFor="forward-target-dept" className="font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
              <Building2 size={14} className="text-blue-600" aria-hidden="true" />
              Target Department & Designated Authority:
            </label>
            <select
              id="forward-target-dept"
              value={selectedDeptIndex}
              onChange={(e) => setSelectedDeptIndex(Number(e.target.value))}
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900"
            >
              {DEPARTMENTS.map((d, idx) => (
                <option key={idx} value={idx}>
                  {d.authority} — {d.dept}
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div>
            <span id="priority-group-label" className="font-bold text-slate-700 block mb-1.5">
              Priority Level:
            </span>
            <div
              role="radiogroup"
              aria-labelledby="priority-group-label"
              className="grid grid-cols-3 gap-2"
            >
              {(['High', 'Medium', 'Low'] as ComplaintPriority[]).map((p) => (
                <button
                  type="button"
                  key={p}
                  role="radio"
                  aria-checked={priority === p}
                  onClick={() => setPriority(p)}
                  className={`py-2 px-3 rounded-xl font-bold border transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    priority === p
                      ? p === 'High'
                        ? 'bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-400/30'
                        : p === 'Medium'
                        ? 'bg-amber-50 border-amber-500 text-amber-800 ring-2 ring-amber-400/30'
                        : 'bg-blue-50 border-blue-500 text-blue-800 ring-2 ring-blue-400/30'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {p === 'High' ? '🔴 High (48h)' : p === 'Medium' ? '🟡 Medium (7d)' : '🟢 Low (15d)'}
                </button>
              ))}
            </div>
          </div>

          {/* Reason for Forwarding */}
          <div>
            <label htmlFor="forward-reason" className="font-bold text-slate-700 block mb-1">
              Reason for Forwarding / Statutory Grounds <span className="text-rose-600">*</span>:
            </label>
            <textarea
              id="forward-reason"
              rows={2}
              required
              aria-required="true"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Specify the legal reason or statutory ambiguity requiring higher investigation..."
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Remarks */}
          <div>
            <label htmlFor="forward-remarks" className="font-bold text-slate-700 block mb-1">
              Forwarding Remarks & Inspector Observations:
            </label>
            <textarea
              id="forward-remarks"
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Add specific instructions for the recipient authority..."
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Evidence Summary */}
          <div>
            <label htmlFor="forward-evidence-summary" className="font-bold text-slate-700 block mb-1">
              Evidence Summary Attached:
            </label>
            <input
              id="forward-evidence-summary"
              type="text"
              value={evidenceSummary}
              onChange={(e) => setEvidenceSummary(e.target.value)}
              placeholder="List photos, lab receipts, sample Form-1..."
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-800 hover:bg-blue-900 text-white font-bold rounded-xl flex items-center gap-2 shadow-sm transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              <Send size={14} aria-hidden="true" />
              <span>Forward Case</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
