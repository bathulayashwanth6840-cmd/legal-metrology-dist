// src/components/EvidenceModal.tsx
import { useState } from 'react';
import { Eye, X, ShieldAlert, Check } from 'lucide-react';
import type { FindingEvidence } from '../types/complaint';
import { resolveImageUrl, handleImageError } from '../utils/imageUtils';

interface EvidenceModalProps {
  isOpen: boolean;
  finding: FindingEvidence | null;
  productName?: string;
  onClose: () => void;
  onMarkReviewed?: (findingId: string) => void;
}

export default function EvidenceModal({
  isOpen,
  finding,
  onClose,
  onMarkReviewed,
}: EvidenceModalProps) {
  const [isReviewed, setIsReviewed] = useState(finding?.reviewedByOfficer ?? false);

  if (!isOpen || !finding) return null;

  const handleToggleReview = () => {
    setIsReviewed(!isReviewed);
    if (onMarkReviewed) {
      onMarkReviewed(finding.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[var(--color-navy)] text-white p-6 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-900 border border-blue-700 flex items-center justify-center text-blue-300 flex-shrink-0">
              <Eye size={20} />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-blue-300 block font-bold">
                STATUTORY EVIDENCE VIEWER
              </span>
              <h3 className="text-lg font-black text-white">{finding.fieldLabel}</h3>
              <p className="text-xs text-blue-200 mt-0.5">
                Rule Reference: <span className="font-mono font-bold text-amber-400">{finding.ruleCode}</span>
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

        {/* Content */}
        <div className="p-6 space-y-5 text-xs">
          {/* Image & Bounding Box Box */}
          <div className="relative bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center min-h-[220px]">
            {finding.evidenceImageUrl ? (
              <div className="relative w-full h-full max-h-[300px] flex items-center justify-center">
                <img
                  src={resolveImageUrl(finding.evidenceImageUrl)}
                  alt="Packaging Evidence"
                  className="w-full h-auto object-contain max-h-[300px]"
                  onError={(e) => handleImageError(e)}
                />
                {finding.highlightBox && (
                  <div
                    className="absolute border-2 border-rose-500 bg-rose-500/20 rounded-md pointer-events-none animate-pulse flex items-start justify-start p-1"
                    style={{
                      left: `${finding.highlightBox.x}%`,
                      top: `${finding.highlightBox.y}%`,
                      width: `${finding.highlightBox.width}%`,
                      height: `${finding.highlightBox.height}%`,
                    }}
                  >
                    <span className="bg-rose-600 text-white text-[8px] font-black px-1 rounded uppercase">
                      Evidence ROI
                    </span>
                  </div>
                )}
                {!finding.highlightBox && (
                  <div className="absolute bottom-2 right-2 bg-slate-900/80 text-slate-300 text-[9px] px-2 py-0.5 rounded border border-slate-700">
                    Full Panel Visual Excerpt
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center p-8 text-slate-400">
                <ShieldAlert size={32} className="mx-auto mb-2 text-slate-500" />
                <span>Original packaging photographic panel excerpt</span>
                <span className="block text-[10px] text-slate-500 mt-1 font-mono">Evidence coordinates not directly localized</span>
              </div>
            )}
          </div>

          {/* Finding Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">OCR Detected Text</span>
              <p className="font-mono text-xs font-black text-rose-950 mt-1">{finding.detectedText || 'No text detected'}</p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Statutory Mandate</span>
              <p className="text-xs text-slate-800 font-medium mt-1">{finding.requiredStandard}</p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">AI Preliminary Status</span>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                  finding.aiStatus === 'PASS'
                    ? 'bg-emerald-100 text-emerald-800'
                    : finding.aiStatus === 'POTENTIAL VIOLATION'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {finding.aiStatus}
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  Confidence: {Math.round(finding.confidence * 100)}%
                </span>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Legal Act / Rule Reference</span>
              <p className="font-mono text-xs text-blue-900 font-bold mt-1">{finding.ruleReference}</p>
            </div>
          </div>

          {finding.evidenceNotes && (
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-blue-900 text-xs">
              <span className="font-bold block text-[10px] uppercase text-blue-700">Forensic Notes:</span>
              <p className="mt-0.5">{finding.evidenceNotes}</p>
            </div>
          )}

          {/* Action footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleToggleReview}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                isReviewed
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {isReviewed ? (
                <>
                  <Check size={14} className="text-emerald-700" />
                  <span>✓ Evidence Marked as Reviewed by Officer</span>
                </>
              ) : (
                <>
                  <Eye size={14} />
                  <span>Mark Evidence Reviewed</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-[var(--color-navy)] hover:bg-blue-900 text-white font-bold rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
