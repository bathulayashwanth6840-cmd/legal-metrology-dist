// src/pages/TrackComplaintPage.tsx
import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search, ShieldCheck, Clock, AlertCircle, ArrowRight
} from 'lucide-react';
import { getPublicComplaintInfo } from '../services/complaintService';
import type { ComplaintStatus } from '../types/complaint';

const STATUS_COLOR_MAP: Record<
  ComplaintStatus,
  { label: string; badge: string; icon: string }
> = {
  Submitted: { label: 'Complaint Registered', badge: 'bg-blue-100 text-blue-900 border-blue-300', icon: '📝' },
  'Under Review': { label: 'Under AI & Preliminary Review', badge: 'bg-indigo-100 text-indigo-900 border-indigo-300', icon: '🔍' },
  'Further Enquiry': { label: 'In Active Statutory Enquiry', badge: 'bg-amber-100 text-amber-950 border-amber-400 ring-2 ring-amber-300/40', icon: '⏳' },
  'Awaiting Verification': { label: 'Awaiting Official Verification', badge: 'bg-purple-100 text-purple-950 border-purple-400', icon: '⚖️' },
  'Verified Violation': { label: 'Statutory Violation Formally Verified', badge: 'bg-rose-100 text-rose-950 border-rose-400 font-black', icon: '❌' },
  'Not Verified': { label: 'Compliant / Case Resolved', badge: 'bg-slate-100 text-slate-800 border-slate-300', icon: '✓' },
  'Action Taken': { label: 'Enforcement Action Concluded', badge: 'bg-emerald-100 text-emerald-950 border-emerald-400 font-bold', icon: '⚡' },
  Closed: { label: 'Case Officially Closed', badge: 'bg-teal-100 text-teal-900 border-teal-300', icon: '🔒' },
};

export default function TrackComplaintPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [complaintIdInput, setComplaintIdInput] = useState(searchParams.get('id') || '');
  const [result, setResult] = useState<any | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const idParam = searchParams.get('id');
    if (idParam) {
      setComplaintIdInput(idParam);
      handleSearch(idParam);
    }
  }, [searchParams]);

  const handleSearch = (idToSearch?: string) => {
    const query = (idToSearch || complaintIdInput).trim();
    setHasSearched(true);
    if (!query) {
      setResult(null);
      return;
    }
    const data = getPublicComplaintInfo(query);
    setResult(data || null);
    if (idToSearch && idToSearch !== searchParams.get('id')) {
      setSearchParams({ id: idToSearch });
    }
  };

  return (
    <div className="flex flex-col min-h-full select-none pb-24 sm:pb-12 bg-slate-50">
      {/* ── Top Header Banner ──────────────────────────────────────────────── */}
      <div className="bg-[var(--color-navy)] text-white pt-8 pb-14 px-4 sm:px-8 shadow-md">
        <div className="max-w-4xl mx-auto text-center space-y-3">
          <div className="inline-flex items-center gap-2 bg-blue-900/60 border border-blue-700/60 px-3.5 py-1 rounded-full text-[10px] font-extrabold tracking-widest text-blue-300 uppercase">
            <ShieldCheck size={14} className="text-amber-400" />
            <span>NATIONAL LEGAL METROLOGY CONSUMER GRIEVANCE TRACKER</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Track Complaint & Enquiry Status
          </h1>
          <p className="text-xs sm:text-sm text-blue-200 max-w-2xl mx-auto leading-relaxed font-medium">
            Enter your Legal Metrology Complaint ID to check real-time statutory investigation, zonal authority status, and resolution progress.
          </p>

          {/* Search Box */}
          <div className="pt-4 max-w-2xl mx-auto">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch();
              }}
              className="flex flex-col sm:flex-row items-center gap-2 bg-white/10 p-2 rounded-2xl border border-white/20 backdrop-blur-xs"
            >
              <div className="relative flex-1 w-full">
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Enter Complaint ID (e.g. LM-2026-XXXXXX)..."
                  value={complaintIdInput}
                  onChange={(e) => setComplaintIdInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 font-mono font-bold text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
              >
                Track Status
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ── Search Results View ────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-8 -mt-6 space-y-6 w-full">
        {hasSearched && !result && (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-2xs text-center space-y-3 animate-in fade-in duration-150">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <AlertCircle size={28} />
            </div>
            <h3 className="text-base font-black text-slate-900">Complaint ID Not Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              No statutory complaint was found with ID <span className="font-mono font-bold text-slate-800">"{complaintIdInput}"</span>. Please check the Complaint ID on your acknowledgement receipt and try again.
            </p>
          </div>
        )}

        {result && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
            {/* Main Status Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-black text-sm bg-slate-900 text-amber-400 px-3 py-1 rounded-lg">
                      {result.id}
                    </span>
                    <span className="text-xs text-slate-400">
                      Filed: {new Date(result.dateSubmitted).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-slate-900 mt-1">
                    {result.productName}
                  </h2>
                </div>

                <div
                  className={`px-4 py-3 rounded-2xl border flex items-center gap-2.5 ${
                    STATUS_COLOR_MAP[result.currentStatus as ComplaintStatus]?.badge || 'bg-slate-100'
                  }`}
                >
                  <span className="text-xl">
                    {STATUS_COLOR_MAP[result.currentStatus as ComplaintStatus]?.icon || '📝'}
                  </span>
                  <div>
                    <span className="text-[9px] uppercase font-bold tracking-wider block opacity-75">Current Status</span>
                    <span className="font-black text-xs block">
                      {STATUS_COLOR_MAP[result.currentStatus as ComplaintStatus]?.label || result.currentStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* Public Friendly Official Message */}
              <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-2xl text-blue-950 space-y-1">
                <span className="font-bold text-xs flex items-center gap-1.5 text-blue-900">
                  <ShieldCheck size={16} className="text-blue-600" />
                  Official Grievance Cell Update:
                </span>
                <p className="text-xs leading-relaxed font-medium">
                  {result.publicTrackingMessage}
                </p>
                <span className="text-[10px] text-blue-700 font-mono block pt-1">
                  Responsible Directorate: {result.assignedAuthority} • Last Updated: {new Date(result.lastUpdated).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>

              {/* Citizen Progress Timeline */}
              <div className="space-y-4 pt-2">
                <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <Clock size={16} className="text-blue-600" />
                  Statutory Progression Stages
                </h3>

                <div className="space-y-4 pt-1">
                  {result.timeline.map((step: any, idx: number) => {
                    const isDone = step.isCompleted;
                    const isCurrent = step.isCurrent;

                    return (
                      <div key={idx} className="flex items-start gap-3.5">
                        <div className="flex flex-col items-center flex-shrink-0">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-colors ${
                              isDone
                                ? 'bg-emerald-600 text-white'
                                : isCurrent
                                ? 'bg-amber-500 text-white ring-4 ring-amber-100 animate-pulse'
                                : 'bg-slate-200 text-slate-500'
                            }`}
                          >
                            {isDone ? '✓' : isCurrent ? '●' : idx + 1}
                          </div>
                          {idx < result.timeline.length - 1 && (
                            <div
                              className={`w-0.5 h-10 my-1 ${
                                isDone ? 'bg-emerald-400' : 'bg-slate-200'
                              }`}
                            />
                          )}
                        </div>

                        <div className="flex-1 min-w-0 pb-2">
                          <div className="flex items-center justify-between gap-1">
                            <h4
                              className={`text-xs font-bold ${
                                isCurrent ? 'text-amber-950 font-black' : 'text-slate-800'
                              }`}
                            >
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
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{step.actionSummary}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Citizen Advisory Footer */}
              <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-400 text-[11px]">
                <span>National Consumer Helpline (NCH): 1915 • Toll Free</span>
                <Link
                  to={`/complaints/${result.id}`}
                  className="font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 text-xs"
                >
                  <span>Authorized Officer View</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
