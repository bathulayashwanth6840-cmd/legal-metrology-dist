import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Trash2, History as HistoryIcon, AlertTriangle, ShieldCheck,
  CheckSquare, Square, MinusSquare, Check, X, AlertCircle, Loader2,
  Search
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { resolveImageUrl, handleImageError } from '../utils/imageUtils';

interface DeleteModalState {
  isOpen: boolean;
  targetIds: number[];
  isSingle: boolean;
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

  // ── Execute Deletion ────────────────────────────────────────────────────────
  const executeDelete = async () => {
    const idsToDelete = deleteModal.targetIds;
    if (idsToDelete.length === 0) return;

    setIsDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // First try backend batch delete endpoint
      const batchResp = await fetch(`${apiUrl}/api/scans/batch-delete`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ scan_ids: idsToDelete }),
      });

      if (batchResp.ok) {
        const result = await batchResp.json();
        const deletedIds: number[] = result.deleted_ids || idsToDelete;
        setScans((prev) => prev.filter((s) => !deletedIds.includes(s.id)));
        setSelectedIds((prev) => prev.filter((id) => !deletedIds.includes(id)));

        const msg = deletedIds.length === 1
          ? t('history.single_deleted_success')
          : `${deletedIds.length} ${t('history.deleted_success')}`;
        showToast(msg, 'success');
      } else {
        // Fallback: delete sequentially if batch endpoint fails
        let successCount = 0;
        const failedIds: number[] = [];

        for (const id of idsToDelete) {
          try {
            const singleResp = await fetch(`${apiUrl}/api/scans/${id}`, {
              method: 'DELETE',
              headers,
            });
            if (singleResp.ok || singleResp.status === 204) {
              successCount++;
            } else {
              failedIds.push(id);
            }
          } catch {
            failedIds.push(id);
          }
        }

        const successfulIds = idsToDelete.filter((id) => !failedIds.includes(id));
        setScans((prev) => prev.filter((s) => !successfulIds.includes(s.id)));
        setSelectedIds((prev) => prev.filter((id) => !successfulIds.includes(id)));

        if (successCount > 0) {
          const msg = successCount === 1
            ? t('history.single_deleted_success')
            : `${successCount} ${t('history.deleted_success')}`;
          showToast(msg, 'success');
        } else {
          showToast('Failed to delete selected scans.', 'error');
        }
      }
    } catch (err: any) {
      console.error('Deletion error:', err);
      showToast('An error occurred during deletion.', 'error');
    } finally {
      setIsDeleting(false);
      setDeleteModal({
        isOpen: false,
        targetIds: [],
        isSingle: false,
      });
    }
  };

  const isAllSelected = scans.length > 0 && selectedIds.length === scans.length;
  const isPartiallySelected = selectedIds.length > 0 && selectedIds.length < scans.length;

  const filteredScans = scans.filter((s) => {
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    const prodName = (s.extracted_fields?.semantic_fields?.product_name || s.extracted_fields?.product_name || `Scan #${s.id}`).toLowerCase();
    const matchesSearch = searchQuery.trim() === '' || prodName.includes(searchQuery.toLowerCase()) || String(s.id).includes(searchQuery);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="p-4 sm:p-6 pb-24 max-w-6xl mx-auto select-none relative">
      {/* ── Toast Notification Banner ────────────────────────────────────── */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg border text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200 ${
          toastMessage.type === 'success'
            ? 'bg-emerald-900 text-white border-emerald-700 shadow-emerald-950/20'
            : 'bg-rose-900 text-white border-rose-700 shadow-rose-950/20'
        }`}>
          {toastMessage.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
          <span>{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-white/70 hover:text-white"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Header & Multi-Select Action Bar ──────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center">
            <HistoryIcon size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">{t('history.title')}</h2>
            <p className="text-xs text-gray-500 font-medium">Recorded Legal Metrology Inspections</p>
          </div>
        </div>

        {/* Action Controls for Batch Selection */}
        {scans.length > 0 && (
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Select All Toggle Button */}
            <button
              type="button"
              onClick={toggleSelectAll}
              className="px-3.5 py-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 rounded-xl text-xs font-bold flex items-center gap-2 shadow-2xs transition-colors"
            >
              {isAllSelected ? (
                <CheckSquare size={16} className="text-blue-600" />
              ) : isPartiallySelected ? (
                <MinusSquare size={16} className="text-blue-600" />
              ) : (
                <Square size={16} className="text-gray-400" />
              )}
              <span>
                {isAllSelected ? t('history.deselect_all') : t('history.select_all')}
              </span>
              <span className="text-[11px] text-gray-400 font-mono">
                ({selectedIds.length}/{scans.length})
              </span>
            </button>

            {/* Delete Selected Button */}
            {selectedIds.length > 0 && (
              <button
                type="button"
                onClick={openBatchDeleteModal}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all animate-in fade-in zoom-in-95 duration-150"
              >
                <Trash2 size={15} />
                <span>{t('history.delete_selected')} ({selectedIds.length})</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Search & Filter Controls ──────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-2xs mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search product name, ID or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-xs bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {(['ALL', 'compliant', 'needs_review', 'non_compliant'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === st
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {st === 'ALL' ? 'All' : st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content Grid ─────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-28 bg-gray-200 rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : filteredScans.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 shadow-2xs">
          <HistoryIcon size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm font-medium text-gray-500 max-w-sm mx-auto">
            {searchQuery || statusFilter !== 'ALL'
              ? 'No matching inspection records found for the specified filters.'
              : t('history.empty')}
          </p>
          <Link
            to="/scan"
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-navy)] text-white text-xs font-bold rounded-lg shadow-sm hover:bg-blue-900 transition-colors"
          >
            Start New Scan
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredScans.map((scan) => {
            const isSelected = selectedIds.includes(scan.id);
            const scoreObj = scan.compliance_score || scan.extracted_fields?.compliance_score;
            const score = scoreObj?.score;
            const productName = scan.extracted_fields?.semantic_fields?.product_name || `Scan #${scan.id}`;

            return (
              <div
                key={scan.id}
                className={`bg-white rounded-xl shadow-2xs border transition-all relative group flex overflow-hidden ${
                  isSelected
                    ? 'border-blue-500 ring-2 ring-blue-300/60 bg-blue-50/20 shadow-sm'
                    : 'border-gray-200 hover:shadow-md hover:border-blue-300'
                }`}
              >
                {/* Checkbox Selector (stops navigation) */}
                <div
                  onClick={(e) => toggleSelectScan(e, scan.id)}
                  className="p-3.5 pr-0 flex items-center justify-center cursor-pointer select-none"
                  title={isSelected ? 'Deselect scan' : 'Select scan'}
                >
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-gray-300 bg-white hover:border-blue-400'
                  }`}>
                    {isSelected && <Check size={14} strokeWidth={3} />}
                  </div>
                </div>

                {/* Clickable Card Area linking to Scan Detail */}
                <Link
                  to={`/scan/${scan.id}`}
                  className="flex-1 p-3.5 pl-3 flex gap-3.5 min-w-0"
                >
                  {/* Thumbnail */}
                  <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                    <img
                      src={resolveImageUrl(scan.image_path, apiUrl)}
                      alt="Scan thumbnail"
                      className="w-full h-full object-cover"
                      onError={(e) => handleImageError(e)}
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-grow flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex justify-between items-start mb-1 gap-2">
                        <span className="text-[11px] text-gray-500 font-medium">
                          {new Date(scan.created_at).toLocaleDateString()}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          scan.status === 'compliant' ? 'bg-emerald-100 text-emerald-800' :
                          scan.status === 'needs_review' ? 'bg-amber-100 text-amber-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {scan.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>

                      <p className="text-sm font-bold text-gray-900 truncate">
                        {productName}
                      </p>
                    </div>

                    <div className="mt-2 text-xs flex justify-between items-center border-t border-gray-100 pt-2">
                      <div className="flex items-center gap-2">
                        {score !== undefined && (
                          <span className="text-[11px] font-bold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">
                            {score}/100
                          </span>
                        )}
                        <span className="text-[11px] text-gray-500 flex items-center gap-1">
                          {scan.violations && scan.violations.length > 0 ? (
                            <span className="text-rose-600 font-semibold flex items-center gap-0.5">
                              <AlertTriangle size={12} /> {scan.violations.length} {t('history.violations')}
                            </span>
                          ) : (
                            <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                              <ShieldCheck size={12} /> Compliant
                            </span>
                          )}
                        </span>
                      </div>

                      {/* Single Record Delete Icon */}
                      <button
                        type="button"
                        onClick={(e) => openSingleDeleteModal(e, scan.id)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"
                        title="Delete Scan"
                      >
                        <Trash2 size={15} />
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
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 className="text-base font-black text-gray-900">
                  {deleteModal.isSingle
                    ? t('history.confirm_single_delete_title')
                    : t('history.confirm_delete_title')}
                </h3>
                <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
                  {deleteModal.isSingle
                    ? t('history.confirm_single_delete_desc')
                    : t('history.confirm_delete_desc')}
                </p>
                <div className="mt-2 text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg inline-block border border-rose-100">
                  {deleteModal.targetIds.length} {deleteModal.targetIds.length === 1 ? 'scan' : 'scans'} will be permanently deleted.
                </div>
              </div>
            </div>

            {/* Modal Buttons */}
            <div className="flex justify-end gap-2.5 mt-6 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={isDeleting}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors disabled:opacity-50"
              >
                {t('history.cancel')}
              </button>
              <button
                type="button"
                onClick={executeDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>{t('history.deleting')}</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    <span>{t('history.delete')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
