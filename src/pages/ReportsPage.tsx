import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText, Download, Search, Eye, Sparkles, RefreshCw,
  FileWarning
} from 'lucide-react';
import { getStoredComplaints } from '../services/complaintService';
import type { ComplaintRecord } from '../types/complaint';

export default function ReportsPage() {
  const [scans, setScans] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<ComplaintRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'COMPLAINTS' | 'INSPECTIONS'>('ALL');
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  useEffect(() => {
    fetchRecords();
  }, [apiUrl]);

  const fetchRecords = () => {
    setLoading(true);
    fetch(`${apiUrl}/api/scans/`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setScans(data);
        }
      })
      .catch((err) => console.warn('Reports fetch error:', err))
      .finally(() => setLoading(false));

    const stored = getStoredComplaints();
    setComplaints(stored);
  };

  const filteredScans = scans.filter((s) => {
    const prodName = (s.extracted_fields?.product_name || s.extracted_fields?.brand_name || 'Packaged Commodity').toLowerCase();
    return prodName.includes(searchQuery.toLowerCase()) || String(s.id).includes(searchQuery);
  });

  const filteredComplaints = complaints.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.id.toLowerCase().includes(q) ||
      c.product.productName.toLowerCase().includes(q) ||
      c.inspectionId.toLowerCase().includes(q) ||
      c.location.toLowerCase().includes(q)
    );
  });

  const downloadReportForScan = async (scanId: number | string) => {
    try {
      const response = await fetch(`${apiUrl}/api/scans/${scanId}/report`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `LegalMetriX_Assessment_Report_${scanId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Standard assessment report opening in preview view...');
        window.open(`/scan/${scanId}`, '_blank');
      }
    } catch (e) {
      window.open(`/scan/${scanId}`, '_blank');
    }
  };

  return (
    <div className="flex flex-col min-h-full pb-24 sm:pb-12 bg-slate-50">
      {/* ── Top Header Banner ────────────────────────────────────────────── */}
      <div className="bg-[var(--color-navy)] text-white pt-8 pb-12 px-4 sm:px-8 shadow-md">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-900/60 border border-blue-700/60 px-3 py-1 rounded-full text-[10px] font-extrabold tracking-widest text-blue-300 uppercase mb-3">
                <FileText size={12} className="text-amber-400" />
                <span>STATUTORY AUDIT & ENFORCEMENT DOSSIERS</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                Inspection / Compliance Assessment Reports
              </h1>
              <p className="text-xs sm:text-sm text-blue-200 mt-2 max-w-2xl leading-relaxed font-medium">
                Official statutory assessment reports, declaration non-conformance records, verification dossiers, and action taken dockets conforming to the Legal Metrology (Packaged Commodities) Rules, 2011.
              </p>
            </div>

            <button
              type="button"
              onClick={fetchRecords}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-2 border border-white/20 transition-all self-start sm:self-auto cursor-pointer"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Records
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Body ────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 -mt-4 space-y-6 w-full">

        {/* Search & Tabs Toolbar */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col md:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Product Name, Complaint ID, or Inspection ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'ALL'
                  ? 'bg-[var(--color-navy)] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Reports ({filteredComplaints.length + filteredScans.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('COMPLAINTS')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'COMPLAINTS'
                  ? 'bg-blue-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Complaints & Enquiries ({filteredComplaints.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('INSPECTIONS')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'INSPECTIONS'
                  ? 'bg-blue-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Field Inspections ({filteredScans.length})
            </button>
          </div>
        </div>

        {/* ── Statutory Complaints & Enquiry Reports ──────────────────────── */}
        {(activeTab === 'ALL' || activeTab === 'COMPLAINTS') && filteredComplaints.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
              <FileWarning size={18} className="text-amber-600" />
              Statutory Complaint & Enquiry Assessment Dockets ({filteredComplaints.length})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredComplaints.map((c) => (
                <div
                  key={c.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-black text-xs bg-slate-900 text-amber-400 px-2.5 py-1 rounded-lg">
                        {c.id}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-slate-400">
                        Ref: {c.inspectionId}
                      </span>
                      <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-900 border border-blue-200">
                        {c.currentStatus}
                      </span>
                    </div>

                    <h4 className="font-black text-slate-900 text-sm">{c.product.productName}</h4>

                    <p className="text-[11px] text-slate-500">
                      Manufacturer: {c.product.manufacturerName || 'Under Investigation'} • MRP: {c.product.mrp}
                    </p>

                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Official Verification:</span>
                      <p className="text-slate-800 text-[11px] font-medium">
                        {c.verification?.remarks || 'Pending final official determination and verification seal.'}
                      </p>
                      {c.verification?.actionTaken && (
                        <span className="text-[10px] text-emerald-800 font-bold block pt-0.5">
                          ⚡ Action: {c.verification.actionTaken}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => downloadReportForScan(c.inspectionId)}
                      className="py-2 px-3 bg-[var(--color-navy)] hover:bg-blue-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                    >
                      <Download size={13} /> Assessment PDF
                    </button>
                    <Link
                      to={`/complaints/${c.id}`}
                      className="py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all text-center"
                    >
                      <Eye size={13} /> Full Dossier
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Field Inspections List ──────────────────────────────────────── */}
        {(activeTab === 'ALL' || activeTab === 'INSPECTIONS') && (
          <div className="space-y-3 pt-2">
            <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
              <FileText size={18} className="text-blue-600" />
              Enforcement Inspection Summary Reports ({filteredScans.length})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredScans.length === 0 ? (
                <div className="col-span-full py-12 text-center bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
                  <FileText size={36} className="text-slate-300 mx-auto" />
                  <h4 className="font-bold text-slate-700 text-sm">No Inspection Records Found</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Capture new commodity packaging scans to automatically generate certified PDF inspection dossiers.
                  </p>
                  <Link
                    to="/scan"
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <Sparkles size={14} /> Start New Inspection
                  </Link>
                </div>
              ) : (
                filteredScans.map((s) => {
                  const prodName = s.extracted_fields?.product_name || s.extracted_fields?.brand_name || 'Packaged Commodity Sample';
                  const score = s.compliance_score?.score ?? s.extracted_fields?.compliance_score?.score ?? 85;
                  const isPass = s.status === 'compliant';
                  const isRev = s.status === 'needs_review';

                  return (
                    <div
                      key={s.id}
                      className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="font-mono text-xs font-black text-slate-500">
                            DOC #{s.id}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            isPass ? 'bg-emerald-100 text-emerald-800' :
                            isRev ? 'bg-amber-100 text-amber-800' :
                            'bg-rose-100 text-rose-800'
                          }`}>
                            {isPass ? '✅ Pass' : isRev ? '⚠️ Review' : '❌ Violation'}
                          </span>
                        </div>

                        <div>
                          <h4 className="font-black text-slate-900 text-sm line-clamp-1">{prodName}</h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Date: {new Date(s.created_at || Date.now()).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase text-slate-500">Statutory Score</span>
                          <div className="flex items-baseline gap-1 font-black">
                            <span className={score >= 85 ? 'text-emerald-700' : score >= 55 ? 'text-amber-700' : 'text-rose-700'}>
                              {score}
                            </span>
                            <span className="text-[10px] text-slate-400">/ 100</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => downloadReportForScan(s.id)}
                          className="py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                        >
                          <Download size={13} /> PDF Report
                        </button>
                        <Link
                          to={`/scan/${s.id}`}
                          className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all text-center"
                        >
                          <Eye size={13} /> View Audit
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
