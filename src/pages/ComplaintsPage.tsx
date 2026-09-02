// src/pages/ComplaintsPage.tsx
import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FileWarning, Search, Plus,
  Eye, RefreshCw, Trash2, Camera, Sparkles
} from 'lucide-react';
import {
  getStoredComplaints,
  createComplaintRecord,
  clearAllComplaints
} from '../services/complaintService';
import type { ComplaintRecord, ComplaintStatus } from '../types/complaint';
import { useRole } from '../context/RoleContext';
import NewComplaintModal from '../components/NewComplaintModal';

const STATUS_CONFIG: Record<
  ComplaintStatus,
  { label: string; badgeClass: string; dotColor: string }
> = {
  Submitted: {
    label: 'Submitted',
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
    dotColor: 'bg-blue-500',
  },
  'Under Review': {
    label: 'Under Review',
    badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    dotColor: 'bg-indigo-500',
  },
  'Further Enquiry': {
    label: 'Further Enquiry',
    badgeClass: 'bg-amber-50 text-amber-900 border-amber-300 ring-1 ring-amber-300/40',
    dotColor: 'bg-amber-500',
  },
  'Awaiting Verification': {
    label: 'Awaiting Verification',
    badgeClass: 'bg-purple-50 text-purple-800 border-purple-200',
    dotColor: 'bg-purple-500',
  },
  'Verified Violation': {
    label: 'Verified Violation',
    badgeClass: 'bg-rose-50 text-rose-900 border-rose-300 font-black',
    dotColor: 'bg-rose-600',
  },
  'Not Verified': {
    label: 'Not Verified',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    dotColor: 'bg-slate-400',
  },
  'Action Taken': {
    label: 'Action Taken',
    badgeClass: 'bg-emerald-50 text-emerald-900 border-emerald-300',
    dotColor: 'bg-emerald-500',
  },
  Closed: {
    label: 'Closed',
    badgeClass: 'bg-teal-50 text-teal-800 border-teal-200',
    dotColor: 'bg-teal-500',
  },
};

export default function ComplaintsPage() {
  const { currentRole, profile } = useRole();
  const [complaints, setComplaints] = useState<ComplaintRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  useEffect(() => {
    loadComplaints();
  }, []);

  const loadComplaints = () => {
    setLoading(true);
    const data = getStoredComplaints();
    setComplaints(data);
    setLoading(false);
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all complaint and enquiry records?')) {
      clearAllComplaints();
      setComplaints([]);
    }
  };

  const handleCreateComplaint = (payload: Parameters<typeof createComplaintRecord>[0]) => {
    createComplaintRecord({
      ...payload,
      submittedBy: `${profile.name} (${profile.badge})`,
      submitterRole: currentRole === 'inspector' ? 'Inspector' : currentRole === 'senior_official' ? 'Inspector' : 'Citizen',
    });
    setComplaints(getStoredComplaints());
    setIsNewModalOpen(false);
  };

  // Status Counts
  const stats = useMemo(() => {
    const total = complaints.length;
    const submitted = complaints.filter((c) => c.currentStatus === 'Submitted').length;
    const underReview = complaints.filter((c) => c.currentStatus === 'Under Review').length;
    const furtherEnquiry = complaints.filter((c) => c.currentStatus === 'Further Enquiry').length;
    const awaitingVerif = complaints.filter((c) => c.currentStatus === 'Awaiting Verification').length;
    const verifiedViolation = complaints.filter((c) => c.currentStatus === 'Verified Violation').length;
    const notVerified = complaints.filter((c) => c.currentStatus === 'Not Verified').length;
    const actionTaken = complaints.filter((c) => c.currentStatus === 'Action Taken').length;
    const closed = complaints.filter((c) => c.currentStatus === 'Closed').length;

    return {
      total,
      submitted,
      underReview,
      furtherEnquiry,
      awaitingVerif,
      verifiedViolation,
      notVerified,
      actionTaken,
      closed,
    };
  }, [complaints]);

  // Filtered List
  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        c.id.toLowerCase().includes(q) ||
        c.product.productName.toLowerCase().includes(q) ||
        c.inspectionId.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q) ||
        c.assignedAuthority.toLowerCase().includes(q);

      const matchesStatus = selectedStatus === 'ALL' || c.currentStatus === selectedStatus;
      const matchesPriority = selectedPriority === 'ALL' || c.priority === selectedPriority;

      return matchesQuery && matchesStatus && matchesPriority;
    });
  }, [complaints, searchQuery, selectedStatus, selectedPriority]);

  return (
    <div className="flex flex-col min-h-full select-none pb-24 sm:pb-12 bg-slate-50">
      {/* ── Header Banner ──────────────────────────────────────────────── */}
      <div className="bg-[var(--color-navy)] text-white pt-8 pb-12 px-4 sm:px-8 shadow-md">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-900/60 border border-blue-700/60 px-3 py-1 rounded-full text-[10px] font-extrabold tracking-widest text-blue-300 uppercase mb-3">
                <FileWarning size={12} className="text-amber-400" />
                <span>STATUTORY COMPLAINT & ENQUIRY CELL</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                Legal Metrology Complaints & Enquiries
              </h1>
              <p className="text-xs sm:text-sm text-blue-200 mt-2 max-w-2xl leading-relaxed font-medium">
                Official investigation management, inter-departmental forwarding, physical verification dockets, and statutory enforcement actions.
              </p>
            </div>

            {/* Header Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/scan"
                className="px-5 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-gray-950 font-black text-xs rounded-2xl shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
              >
                <Camera size={16} />
                <span>Scan Product to Verify</span>
              </Link>

              <button
                type="button"
                onClick={() => setIsNewModalOpen(true)}
                className="px-4 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-2xl border border-white/20 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Plus size={16} />
                <span>File Manual Docket</span>
              </button>

              {complaints.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearHistory}
                  className="px-4 py-3.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-xs rounded-2xl border border-rose-500/30 flex items-center gap-2 transition-all cursor-pointer"
                  title="Clear All History"
                >
                  <Trash2 size={16} />
                  <span>Clear History</span>
                </button>
              )}

              <button
                type="button"
                onClick={loadComplaints}
                className="p-3.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl border border-white/20 transition-all cursor-pointer"
                title="Refresh Records"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* ── 8 Statutory Status Metrics ─────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 mt-8">
            <button
              type="button"
              onClick={() => setSelectedStatus(selectedStatus === 'Submitted' ? 'ALL' : 'Submitted')}
              className={`p-3 rounded-2xl border transition-all text-left cursor-pointer ${
                selectedStatus === 'Submitted'
                  ? 'bg-blue-600 border-blue-400 text-white ring-2 ring-blue-300'
                  : 'bg-white/10 border-white/15 text-blue-100 hover:bg-white/15'
              }`}
            >
              <span className="text-[9px] uppercase font-bold tracking-wider block opacity-80">1. Submitted</span>
              <span className="text-xl font-black block mt-0.5">{stats.submitted}</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedStatus(selectedStatus === 'Under Review' ? 'ALL' : 'Under Review')}
              className={`p-3 rounded-2xl border transition-all text-left cursor-pointer ${
                selectedStatus === 'Under Review'
                  ? 'bg-indigo-600 border-indigo-400 text-white ring-2 ring-indigo-300'
                  : 'bg-white/10 border-white/15 text-indigo-100 hover:bg-white/15'
              }`}
            >
              <span className="text-[9px] uppercase font-bold tracking-wider block opacity-80">2. Review</span>
              <span className="text-xl font-black block mt-0.5">{stats.underReview}</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedStatus(selectedStatus === 'Further Enquiry' ? 'ALL' : 'Further Enquiry')}
              className={`p-3 rounded-2xl border transition-all text-left cursor-pointer ${
                selectedStatus === 'Further Enquiry'
                  ? 'bg-amber-600 border-amber-400 text-white ring-2 ring-amber-300'
                  : 'bg-amber-950/50 border-amber-500/40 text-amber-200 hover:bg-amber-900/60'
              }`}
            >
              <span className="text-[9px] uppercase font-bold tracking-wider block text-amber-300">3. Enquiry</span>
              <span className="text-xl font-black block mt-0.5 text-amber-300">{stats.furtherEnquiry}</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedStatus(selectedStatus === 'Awaiting Verification' ? 'ALL' : 'Awaiting Verification')}
              className={`p-3 rounded-2xl border transition-all text-left cursor-pointer ${
                selectedStatus === 'Awaiting Verification'
                  ? 'bg-purple-600 border-purple-400 text-white ring-2 ring-purple-300'
                  : 'bg-purple-950/50 border-purple-500/40 text-purple-200 hover:bg-purple-900/60'
              }`}
            >
              <span className="text-[9px] uppercase font-bold tracking-wider block text-purple-300">4. Pending Verif.</span>
              <span className="text-xl font-black block mt-0.5 text-purple-300">{stats.awaitingVerif}</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedStatus(selectedStatus === 'Verified Violation' ? 'ALL' : 'Verified Violation')}
              className={`p-3 rounded-2xl border transition-all text-left cursor-pointer ${
                selectedStatus === 'Verified Violation'
                  ? 'bg-rose-600 border-rose-400 text-white ring-2 ring-rose-300'
                  : 'bg-rose-950/50 border-rose-500/40 text-rose-200 hover:bg-rose-900/60'
              }`}
            >
              <span className="text-[9px] uppercase font-bold tracking-wider block text-rose-300">5. Violations</span>
              <span className="text-xl font-black block mt-0.5 text-rose-400">{stats.verifiedViolation}</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedStatus(selectedStatus === 'Not Verified' ? 'ALL' : 'Not Verified')}
              className={`p-3 rounded-2xl border transition-all text-left cursor-pointer ${
                selectedStatus === 'Not Verified'
                  ? 'bg-slate-700 border-slate-400 text-white ring-2 ring-slate-300'
                  : 'bg-white/10 border-white/15 text-slate-300 hover:bg-white/15'
              }`}
            >
              <span className="text-[9px] uppercase font-bold tracking-wider block opacity-80">6. Not Verified</span>
              <span className="text-xl font-black block mt-0.5">{stats.notVerified}</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedStatus(selectedStatus === 'Action Taken' ? 'ALL' : 'Action Taken')}
              className={`p-3 rounded-2xl border transition-all text-left cursor-pointer ${
                selectedStatus === 'Action Taken'
                  ? 'bg-emerald-600 border-emerald-400 text-white ring-2 ring-emerald-300'
                  : 'bg-emerald-950/50 border-emerald-500/40 text-emerald-200 hover:bg-emerald-900/60'
              }`}
            >
              <span className="text-[9px] uppercase font-bold tracking-wider block text-emerald-300">7. Action Taken</span>
              <span className="text-xl font-black block mt-0.5 text-emerald-300">{stats.actionTaken}</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedStatus(selectedStatus === 'Closed' ? 'ALL' : 'Closed')}
              className={`p-3 rounded-2xl border transition-all text-left cursor-pointer ${
                selectedStatus === 'Closed'
                  ? 'bg-teal-600 border-teal-400 text-white ring-2 ring-teal-300'
                  : 'bg-white/10 border-white/15 text-teal-200 hover:bg-white/15'
              }`}
            >
              <span className="text-[9px] uppercase font-bold tracking-wider block opacity-80">8. Closed</span>
              <span className="text-xl font-black block mt-0.5">{stats.closed}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Content Container ───────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 -mt-4 space-y-6 w-full">
        {/* Filters & Search Toolbar */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-lg">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Complaint ID (e.g. LM-2026-XXXXXX), Product, Inspection #, or Location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter Dropdown */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL">All Statuses ({complaints.length})</option>
              <option value="Submitted">Submitted ({stats.submitted})</option>
              <option value="Under Review">Under Review ({stats.underReview})</option>
              <option value="Further Enquiry">Further Enquiry ({stats.furtherEnquiry})</option>
              <option value="Awaiting Verification">Awaiting Verification ({stats.awaitingVerif})</option>
              <option value="Verified Violation">Verified Violation ({stats.verifiedViolation})</option>
              <option value="Not Verified">Not Verified ({stats.notVerified})</option>
              <option value="Action Taken">Action Taken ({stats.actionTaken})</option>
              <option value="Closed">Closed ({stats.closed})</option>
            </select>

            {/* Priority Filter */}
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL">All Priorities</option>
              <option value="High">🔴 High Priority</option>
              <option value="Medium">🟡 Medium Priority</option>
              <option value="Low">🟢 Low Priority</option>
            </select>

            {(selectedStatus !== 'ALL' || selectedPriority !== 'ALL' || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedStatus('ALL');
                  setSelectedPriority('ALL');
                  setSearchQuery('');
                }}
                className="px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Complaints Table / Clean Empty State */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Active Enquiries & Statutory Cases ({filteredComplaints.length})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Statutory complaints linked to physical audits and AI detection findings
              </p>
            </div>
            <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-800 px-3 py-1 rounded-full border border-blue-200">
              LMR ACT 2009 • RULE 6 & 12
            </span>
          </div>

          {filteredComplaints.length === 0 ? (
            <div className="py-20 px-4 text-center max-w-lg mx-auto space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center mx-auto shadow-xs">
                <FileWarning size={32} />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-black text-slate-900">
                  No Active Complaints or Enquiries
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Records will appear here only when you scan a packaged commodity and escalate any detected non-compliances, or when a manual docket is filed.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  to="/scan"
                  className="px-6 py-3 bg-[var(--color-navy)] hover:bg-blue-900 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Sparkles size={14} className="text-amber-400" />
                  <span>Start Inspection & Scan Product</span>
                </Link>

                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(true)}
                  className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  + File Manual Docket
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50/80">
                    <th className="p-3.5">Complaint ID</th>
                    <th className="p-3.5">Product & Brand</th>
                    <th className="p-3.5">Date & Jurisdiction</th>
                    <th className="p-3.5">Submitted By</th>
                    <th className="p-3.5">Current Status</th>
                    <th className="p-3.5">Assigned Authority</th>
                    <th className="p-3.5">Priority</th>
                    <th className="p-3.5">Findings</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredComplaints.map((c) => {
                    const st = STATUS_CONFIG[c.currentStatus] || STATUS_CONFIG.Submitted;
                    return (
                      <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3.5 font-mono font-black text-slate-900">
                          <Link to={`/complaints/${c.id}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                            {c.id}
                          </Link>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            Ref: {c.inspectionId}
                          </span>
                        </td>

                        <td className="p-3.5 max-w-xs">
                          <span className="font-bold text-slate-900 block truncate">{c.product.productName}</span>
                          <span className="text-[10px] text-slate-400 block">
                            {c.product.category} • MRP: {c.product.mrp}
                          </span>
                        </td>

                        <td className="p-3.5">
                          <span className="font-semibold text-slate-800 block">
                            {new Date(c.dateSubmitted).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                          <span className="text-[10px] text-slate-400 block max-w-[150px] truncate">
                            {c.location}
                          </span>
                        </td>

                        <td className="p-3.5">
                          <span className="font-medium text-slate-700 block">{c.submittedBy}</span>
                          <span className="text-[10px] text-slate-400 font-mono">Role: {c.submitterRole}</span>
                        </td>

                        <td className="p-3.5">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] border ${st.badgeClass}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${st.dotColor}`} />
                            <span>{st.label}</span>
                          </span>
                        </td>

                        <td className="p-3.5 text-slate-700 max-w-[180px]">
                          <span className="font-medium block truncate" title={c.assignedAuthority}>
                            {c.assignedAuthority}
                          </span>
                        </td>

                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              c.priority === 'High'
                                ? 'bg-rose-100 text-rose-800'
                                : c.priority === 'Medium'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {c.priority}
                          </span>
                        </td>

                        <td className="p-3.5">
                          <span className="font-black text-slate-800">{c.findings.length}</span>
                          <span className="text-[10px] text-slate-400 ml-1">items</span>
                        </td>

                        <td className="p-3.5 text-right">
                          <Link
                            to={`/complaints/${c.id}`}
                            className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold inline-flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <Eye size={13} />
                            <span>Open Dossier</span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* New Complaint Modal */}
      {isNewModalOpen && (
        <NewComplaintModal
          isOpen={isNewModalOpen}
          onClose={() => setIsNewModalOpen(false)}
          onSubmit={handleCreateComplaint}
        />
      )}
    </div>
  );
}
