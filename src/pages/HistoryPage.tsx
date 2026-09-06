import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Trash2, History as HistoryIcon, AlertTriangle, ShieldCheck,
  CheckSquare, Square, MinusSquare, Check, AlertCircle, Loader2,
  Search
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { resolveImageUrl, handleImageError } from '../utils/imageUtils';
import { useFocusTrap } from '../utils/useFocusTrap';
import { evaluateCanonicalCompliance } from '../utils/complianceEngine';

interface DeleteModalState {
  isOpen: boolean;
  targetIds: number[];
  isSingle: boolean;
}

function DeleteConfirmDialog({
  isOpen,
  isSingle,
  targetCount,
  isDeleting,
  onClose,
  onConfirm,
  t,
}: {
  isOpen: boolean;
  isSingle: boolean;
  targetCount: number;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
  t: (key: string) => string;
}) {
  const modalRef = useFocusTrap({ isOpen, onClose, closeOnEscape: !isDeleting });

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="delete-confirm-title"
      aria-describedby="delete-confirm-desc"
    >
      <div
        ref={modalRef}
        className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 animate-in fade-in zoom-in-95 duration-150 focus:outline-none"
        tabIndex={-1}
      >
        <div className="flex items-start gap-4">
          <div
            className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0"
            aria-hidden="true"
          >
            <AlertTriangle size={22} />
          </div>
          <div>
            <h2 id="delete-confirm-title" className="text-base font-black text-gray-900">
              {isSingle
                ? t('history.confirm_single_delete_title')
                : t('history.confirm_delete_title')}
            </h2>
            <p id="delete-confirm-desc" className="text-xs text-gray-600 mt-1.5 leading-relaxed">
              {isSingle
                ? t('history.confirm_single_delete_desc')
                : t('history.confirm_delete_desc')}
            </p>
            <div className="mt-2 text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg inline-block border border-rose-100">
              {targetCount} {targetCount === 1 ? 'scan' : 'scans'} will be permanently deleted.
            </div>
          </div>
        </div>

        {/* Modal Buttons */}
        <div className="flex justify-end gap-2.5 mt-6 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            {t('history.cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
          >
            {isDeleting ? (
              <>
                <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                <span>{t('history.deleting')}</span>
              </>
            ) : (
              <>
                <Trash2 size={14} aria-hidden="true" />
                <span>{t('history.delete')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const { t } = useLanguage();
  const [scans, setScans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'compliant' | 'needs_review' | 'non_compliant'>('ALL');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [deleteModal, setDeleteModal] = useState<DeleteModalState>({
    isOpen: false,
    targetIds: [],
    isSingle: false,
  });

  const toastTimeoutRef = useRef<any>(null);
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  useEffect(() => {
    fetchScans();
  }, []);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage({ text, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const fetchScans = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${apiUrl}/api/scans/`, { headers });
      if (response.ok) {
        const data = await response.json();
        setScans(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch scans:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── Selection Handlers ──────────────────────────────────────────────────────
  const toggleSelectAll = () => {
    if (selectedIds.length === scans.length && scans.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(scans.map((s) => s.id));
    }
  };

  const toggleSelectScan = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // ── Delete Confirmation Trigger ─────────────────────────────────────────────
  const openSingleDeleteModal = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteModal({
      isOpen: true,
      targetIds: [id],
      isSingle: true,
    });
  };

  const openBatchDeleteModal = () => {
    if (selectedIds.length === 0) return;
    setDeleteModal({
      isOpen: true,
      targetIds: [...selectedIds],
      isSingle: false,
    });
  };

  const closeDeleteModal = () => {
    if (isDeleting) return;
    setDeleteModal({
      isOpen: false,
      targetIds: [],
      isSingle: false,
    });
  };

  // ── Execute Delete via Backend ──────────────────────────────────────────────
  const executeDelete = async () => {
    const ids = deleteModal.targetIds;
    if (ids.length === 0) return;

    setIsDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      if (deleteModal.isSingle && ids.length === 1) {
        const res = await fetch(`${apiUrl}/api/scans/${ids[0]}`, {
          method: 'DELETE',
          headers,
        });

        if (!res.ok) {
          throw new Error('Failed to delete scan from server');
        }

        setScans((prev) => prev.filter((s) => s.id !== ids[0]));
        setSelectedIds((prev) => prev.filter((i) => i !== ids[0]));
        showToast(t('history.single_deleted_success'), 'success');
      } else {
        const res = await fetch(`${apiUrl}/api/scans/batch-delete`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ scan_ids: ids }),
        });

        if (!res.ok) {
          throw new Error('Batch delete request failed');
        }

        const data = await res.json();
        const deletedIds: number[] = data.deleted_ids || ids;

        setScans((prev) => prev.filter((s) => !deletedIds.includes(s.id)));
        setSelectedIds([]);
        showToast(`${deletedIds.length} ${t('history.deleted_success')}`, 'success');
      }

      closeDeleteModal();
    } catch (err: any) {
      console.error('Delete error:', err);
      showToast(err.message || 'Error occurred while deleting scan(s)', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter scans based on search query & status
  const filteredScans = scans.filter((scan) => {
    const productName = (scan.extracted_fields?.product_name || scan.extracted_fields?.brand_name || 'Packaged Commodity').toLowerCase();
    const matchesSearch = productName.includes(searchQuery.toLowerCase()) || String(scan.id).includes(searchQuery);
    const matchesStatus = statusFilter === 'ALL' ? true : scan.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const isAllSelected = filteredScans.length > 0 && selectedIds.length === filteredScans.length;
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < filteredScans.length;

  return (
    <div className="p-4 sm:p-6 pb-24 max-w-6xl mx-auto select-none">
      {/* ── Toast Notification Announcement ─────────────────────────────── */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-5 right-5 z-50 animate-in fade-in slide-in-from-top-3 duration-200"
        >
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl border font-bold text-xs ${
              toastMessage.type === 'success'
                ? 'bg-emerald-950 text-emerald-200 border-emerald-700'
                : 'bg-rose-950 text-rose-200 border-rose-700'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <Check size={16} className="text-emerald-400" aria-hidden="true" />
            ) : (
              <AlertCircle size={16} className="text-rose-400" aria-hidden="true" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center"
            aria-hidden="true"
          >
            <HistoryIcon size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-800 tracking-tight">
              {t('history.title')}
            </h1>
            <p className="text-xs text-gray-500 font-medium">
              {scans.length} total packaging inspections recorded
            </p>
          </div>
        </div>

        {/* Batch Delete Action Trigger */}
        {selectedIds.length > 0 && (
          <button
            type="button"
            onClick={openBatchDeleteModal}
            aria-label={`Delete ${selectedIds.length} selected scans`}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm transition-all self-start sm:self-auto animate-in fade-in duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
          >
            <Trash2 size={15} aria-hidden="true" />
            <span>{t('history.delete_selected')} ({selectedIds.length})</span>
          </button>
        )}
      </div>

      {/* ── Filter & Search Toolbar ───────────────────────────────────────── */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-gray-200 shadow-2xs mb-6 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <label htmlFor="history-search" className="sr-only">
              Search by product name or inspection ID
            </label>
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
            <input
              id="history-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by product name or ID..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-navy)] font-medium"
            />
          </div>

          {/* Status Filter Buttons */}
          <div
            role="group"
            aria-label="Filter scans by compliance status"
            className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0"
          >
            {[
              { key: 'ALL', label: 'All' },
              { key: 'compliant', label: 'Compliant' },
              { key: 'needs_review', label: 'Review' },
              { key: 'non_compliant', label: 'Violation' },
            ].map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setStatusFilter(f.key as any)}
                aria-pressed={statusFilter === f.key}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  statusFilter === f.key
                    ? 'bg-[var(--color-navy)] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Multi-Select Header Bar */}
        {scans.length > 0 && (
          <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-500">
            <button
              type="button"
              onClick={toggleSelectAll}
              aria-label={isAllSelected ? 'Deselect all scans' : 'Select all scans'}
              className="flex items-center gap-2 font-bold hover:text-gray-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              {isAllSelected ? (
                <CheckSquare size={16} className="text-blue-600" aria-hidden="true" />
              ) : isIndeterminate ? (
                <MinusSquare size={16} className="text-blue-600" aria-hidden="true" />
              ) : (
                <Square size={16} className="text-gray-400" aria-hidden="true" />
              )}
              <span>{isAllSelected ? t('history.deselect_all') : t('history.select_all')}</span>
            </button>

            <span>
              Showing {filteredScans.length} of {scans.length} records
            </span>
          </div>
        )}
      </div>

      {/* ── Scan Grid ────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400" role="status">
          <Loader2 className="animate-spin text-blue-600" size={32} aria-hidden="true" />
          <span className="sr-only">Loading inspections...</span>
        </div>
      ) : filteredScans.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-2xs">
          <HistoryIcon size={40} className="mx-auto text-gray-300 mb-3" aria-hidden="true" />
          <h2 className="text-base font-bold text-gray-700">No inspections found</h2>
          <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
            {searchQuery ? 'Try clearing your search filters' : t('history.empty')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredScans.map((scan) => {
            const isSelected = selectedIds.includes(scan.id);
            const rawImg = scan.image_path || scan.images?.[0] || scan.preview_image || scan.image_url || scan.extracted_fields?.images_paths?.[0];
            const previewImg = rawImg ? resolveImageUrl(rawImg) : null;
            const productName =
              scan.extracted_fields?.semantic_fields?.product_name ||
              scan.extracted_fields?.product_name ||
              scan.extracted_fields?.fusion_fields?.product_name?.selected_value ||
              scan.extracted_fields?.brand_name ||
              'Packaged Commodity';
            const canonical = evaluateCanonicalCompliance({
              serverScan: scan,
              ocrConfidence: scan.ocr_confidence ?? scan.extracted_fields?.ocr_confidence
            });
            const scanDate = scan.created_at
              ? new Date(scan.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
              : null;

            return (
              <div
                key={scan.id}
                className={`relative group bg-white rounded-2xl border transition-all shadow-2xs hover:shadow-md overflow-hidden ${
                  isSelected ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/20' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Select Checkbox Button */}
                <button
                  type="button"
                  onClick={(e) => toggleSelectScan(e, scan.id)}
                  role="checkbox"
                  aria-checked={isSelected}
                  aria-label={`Select ${productName} scan`}
                  className="absolute top-3 left-3 z-10 p-1 bg-white/90 backdrop-blur rounded-lg border border-gray-200 shadow-sm text-gray-600 hover:text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  {isSelected ? (
                    <CheckSquare size={16} className="text-blue-600" aria-hidden="true" />
                  ) : (
                    <Square size={16} aria-hidden="true" />
                  )}
                </button>

                <Link
                  to={`/scan/${scan.id}`}
                  aria-label={`View scan details for ${productName}`}
                  className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  {/* Thumbnail / Header */}
                  <div className="h-36 bg-gray-100 relative overflow-hidden flex items-center justify-center">
                    {previewImg ? (
                      <img
                        src={previewImg}
                        alt={`Scan preview of ${productName}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => handleImageError(e)}
                      />
                    ) : (
                      <div className="text-gray-400 text-xs flex flex-col items-center gap-1">
                        <HistoryIcon size={24} aria-hidden="true" />
                        <span>No Preview Image</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                  </div>

                  {/* Body Content */}
                  <div className="p-4">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] text-gray-500 font-semibold">
                            ID: #{scan.id}
                          </span>
                          {scanDate && (
                            <span className="text-[10px] text-gray-400 font-medium">
                              • {scanDate}
                            </span>
                          )}
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${canonical.textBadgeClass}`}>
                          {canonical.status}
                        </span>
                      </div>

                      <p className="text-sm font-bold text-gray-900 truncate">
                        {productName}
                      </p>
                    </div>

                    <div className="mt-2 text-xs flex justify-between items-center border-t border-gray-100 pt-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">
                          {canonical.score}/100
                        </span>
                        <span className="text-[11px] text-gray-500 flex items-center gap-1">
                          {canonical.failedChecks > 0 ? (
                            <span className="text-rose-600 font-semibold flex items-center gap-0.5">
                              <AlertTriangle size={12} aria-hidden="true" /> {canonical.failedChecks} {t('history.violations')}
                            </span>
                          ) : canonical.reviewChecks > 0 ? (
                            <span className="text-amber-600 font-semibold flex items-center gap-0.5">
                              <AlertCircle size={12} aria-hidden="true" /> {canonical.reviewChecks} Needs Review
                            </span>
                          ) : (
                            <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                              <ShieldCheck size={12} aria-hidden="true" /> Compliant
                            </span>
                          )}
                        </span>
                      </div>

                      {/* Single Record Delete Icon */}
                      <button
                        type="button"
                        onClick={(e) => openSingleDeleteModal(e, scan.id)}
                        aria-label={`Delete scan record ${productName}`}
                        className="p-1.5 text-gray-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                        title="Delete Scan"
                      >
                        <Trash2 size={15} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Confirmation Modal ───────────────────────────────────────────── */}
      <DeleteConfirmDialog
        isOpen={deleteModal.isOpen}
        isSingle={deleteModal.isSingle}
        targetCount={deleteModal.targetIds.length}
        isDeleting={isDeleting}
        onClose={closeDeleteModal}
        onConfirm={executeDelete}
        t={t}
      />
    </div>
  );
}
