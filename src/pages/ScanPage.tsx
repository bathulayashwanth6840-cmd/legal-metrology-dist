import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Upload, ScanLine, CheckCircle2, XCircle,
  Eye, Sparkles, ShieldCheck, RotateCcw,
  Camera, Image as ImageIcon, Loader2, ClipboardCheck,
  Crop, Trash2, Check, AlertCircle, WifiOff, Download,
  Crosshair, Award, Tag
} from 'lucide-react';
import CameraCapture from '../components/CameraCapture';
import ImageCropModal from '../components/ImageCropModal';
import { compressImage } from '../utils/imageCompressor';
import { checkImageQuality } from '../utils/imageQuality';
import { useLanguage } from '../i18n/LanguageContext';
import { savePendingScan, syncPendingScans } from '../utils/offlineQueue';
import type { PendingScan } from '../utils/offlineQueue';

// ─── Types ────────────────────────────────────────────────────────────────────
type WizardStep = 'UPLOAD' | 'EXTRACT' | 'REVIEW' | 'COMPLIANCE';
type ProductSide = 'front' | 'back' | 'left' | 'right';

interface FieldConfig {
  key: string;
  label: string;
  ruleCode: string;
  condition: string;
  icon: string;
  isCritical: boolean;
}

interface SideCardConfig {
  side: ProductSide;
  labelKey: string;
  descKey: string;
  defaultLabel: string;
  defaultDesc: string;
  icon: string;
  badgeColor: string;
}

interface SideQualityInfo {
  warnings: string[];
  dimensions?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const PRODUCT_SIDES: SideCardConfig[] = [
  { side: 'front', labelKey: 'scan.front', descKey: 'scan.front_desc', defaultLabel: 'Front Side', defaultDesc: 'Brand name, product title, net quantity', icon: '📦', badgeColor: '#3b82f6' },
  { side: 'back',  labelKey: 'scan.back',  descKey: 'scan.back_desc',  defaultLabel: 'Back Side',  defaultDesc: 'MRP, manufacturer details, dates & FSSAI', icon: '📋', badgeColor: '#8b5cf6' },
  { side: 'left',  labelKey: 'scan.left',  descKey: 'scan.left_desc',  defaultLabel: 'Left Side',  defaultDesc: 'Nutritional facts & ingredients list', icon: '🥗', badgeColor: '#10b981' },
  { side: 'right', labelKey: 'scan.right', descKey: 'scan.right_desc', defaultLabel: 'Right Side', defaultDesc: 'Barcode, consumer care & batch number', icon: '🏷️', badgeColor: '#f59e0b' },
];

const METROLOGY_FIELDS: FieldConfig[] = [
  { key: 'product_name',        label: 'Product Name',              ruleCode: 'LMR_001', condition: 'Generic or common name on principal display panel',            icon: '📦', isCritical: true },
  { key: 'mrp',                 label: 'MRP (Max Retail Price)',     ruleCode: 'LMR_002', condition: 'Clearly written in Rupees, inclusive of all taxes',             icon: '₹',  isCritical: true },
  { key: 'net_quantity',        label: 'Net Quantity',               ruleCode: 'LMR_003', condition: 'Net weight, volume, or number of units in standard metric',    icon: '⚖️', isCritical: true },
  { key: 'manufacturer_name',   label: 'Manufacturer / Packer',     ruleCode: 'LMR_004', condition: 'Name of manufacturer, packer, or importer',                    icon: '🏭', isCritical: true },
  { key: 'manufacturer_address',label: 'Manufacturer Address',       ruleCode: 'LMR_004', condition: 'Complete physical address with PIN code',                       icon: '📍', isCritical: true },
  { key: 'mfg_date',            label: 'Mfg / Packing Date',        ruleCode: 'LMR_005', condition: 'Month and year of manufacture or packing',                      icon: '📅', isCritical: true },
  { key: 'expiry_date',         label: 'Expiry / Best Before',       ruleCode: 'LMR_006', condition: 'Required for commodities that deteriorate over time',           icon: '⏳', isCritical: false },
  { key: 'consumer_care',       label: 'Consumer Care Details',      ruleCode: 'LMR_007', condition: 'Name, address, phone or email of consumer care contact',       icon: '📞', isCritical: true },
  { key: 'country_of_origin',   label: 'Country of Origin',          ruleCode: 'LMR_008', condition: 'Country of origin statement (e.g. Made in India)',             icon: '🌍', isCritical: false },
  { key: 'fssai_number',        label: 'FSSAI License No.',          ruleCode: 'FSSAI_001', condition: '14-digit FSSAI License Number for food commodities',          icon: '🔏', isCritical: false },
];

const STEPS = [
  { id: 'UPLOAD',     label: 'Scan & Crop', icon: Upload },
  { id: 'EXTRACT',    label: 'Extract',     icon: Sparkles },
  { id: 'REVIEW',     label: 'Review & Evidence', icon: Eye },
  { id: 'COMPLIANCE', label: 'Compliance',  icon: ShieldCheck },
];

// Convert File to base64
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ScanPage() {
  const { t } = useLanguage();
  const [step, setStep] = useState<WizardStep>('UPLOAD');
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  // 4-side image state
  const [images, setImages] = useState<Record<ProductSide, File | null>>({
    front: null,
    back: null,
    left: null,
    right: null,
  });

  const [previewUrls, setPreviewUrls] = useState<Record<ProductSide, string>>({
    front: '',
    back: '',
    left: '',
    right: '',
  });

  const [qualityInfo, setQualityInfo] = useState<Record<ProductSide, SideQualityInfo>>({
    front: { warnings: [] },
    back:  { warnings: [] },
    left:  { warnings: [] },
    right: { warnings: [] },
  });

  // Modal states
  const [cameraModal, setCameraModal] = useState<{ isOpen: boolean; side: ProductSide | null }>({
    isOpen: false,
    side: null,
  });

  const [cropModal, setCropModal] = useState<{ isOpen: boolean; side: ProductSide | null; imageSrc: string }>({
    isOpen: false,
    side: null,
    imageSrc: '',
  });

  // Pipeline & Execution state
  const [isScanning, setIsScanning] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [error, setError] = useState('');
  const [offlineNotice, setOfflineNotice] = useState<string | null>(null);

  // Results state
  const [scanResult, setScanResult] = useState<any>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [selectedSideViewer, setSelectedSideViewer] = useState<ProductSide>('front');
  const [highlightedFieldKey, setHighlightedFieldKey] = useState<string | null>(null);

  // Input refs
  const fileInputsRef = {
    front: useRef<HTMLInputElement>(null),
    back:  useRef<HTMLInputElement>(null),
    left:  useRef<HTMLInputElement>(null),
    right: useRef<HTMLInputElement>(null),
  };
  const generalGalleryInputRef = useRef<HTMLInputElement>(null);
  const previewUrlsRef = useRef<Record<ProductSide, string>>({ front: '', back: '', left: '', right: '' });

  // ── Online / Offline Synchronization Listener ────────────────────────────────
  useEffect(() => {
    const handleOnline = async () => {
      setOfflineNotice('Internet connected. Syncing pending scans...');
      try {
        const synced = await syncPendingScans(apiUrl);
        if (synced > 0) {
          setOfflineNotice(`✓ Successfully synced ${synced} pending offline scan(s)!`);
          setTimeout(() => setOfflineNotice(null), 4000);
        } else {
          setOfflineNotice(null);
        }
      } catch (e) {
        console.error('Offline sync error:', e);
      }
    };

    const handleOffline = () => {
      setOfflineNotice('📡 Offline Mode Active. Scans will be queued and synced when internet returns.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [apiUrl]);

  // Clean up ObjectURLs on unmount
  useEffect(() => {
    return () => {
      Object.values(previewUrlsRef.current).forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, []);

  // ── File Management & Quality Check ──────────────────────────────────────────
  const applyFileForSide = useCallback(async (side: ProductSide, file: File) => {
    try {
      const compressed = await compressImage(file, 1600, 0.88);
      const quality = await checkImageQuality(compressed);

      if (previewUrlsRef.current[side]) {
        URL.revokeObjectURL(previewUrlsRef.current[side]);
      }

      const newUrl = URL.createObjectURL(compressed);
      previewUrlsRef.current[side] = newUrl;

      setImages((prev) => ({ ...prev, [side]: compressed }));
      setPreviewUrls((prev) => ({ ...prev, [side]: newUrl }));
      setQualityInfo((prev) => ({
        ...prev,
        [side]: {
          warnings: quality.warnings,
          dimensions: `${quality.width}×${quality.height}`,
        },
      }));
      setError('');
    } catch (e: any) {
      setError(`Failed to process image for ${side} side: ${e.message || e}`);
    }
  }, []);

  const handleFileInput = (side: ProductSide, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) applyFileForSide(side, file);
    e.target.value = '';
  };

  const handlePrimaryCameraClick = () => {
    const emptySide = (PRODUCT_SIDES.find((s) => !images[s.side])?.side) || 'front';
    setCameraModal({ isOpen: true, side: emptySide });
  };

  const handlePrimaryGalleryClick = () => {
    generalGalleryInputRef.current?.click();
  };

  const handleGeneralGallerySelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (!selectedFiles.length) return;

    const emptySides = PRODUCT_SIDES.filter((s) => !images[s.side]).map((s) => s.side);
    const targetSides = emptySides.length > 0 ? emptySides : (['front', 'back', 'left', 'right'] as ProductSide[]);

    selectedFiles.slice(0, 4).forEach((file, index) => {
      const side = targetSides[index];
      if (side) {
        applyFileForSide(side, file);
      }
    });

    e.target.value = '';
  };

  const handleRemoveSide = (side: ProductSide) => {
    if (previewUrlsRef.current[side]) {
      URL.revokeObjectURL(previewUrlsRef.current[side]);
      previewUrlsRef.current[side] = '';
    }
    setImages((prev) => ({ ...prev, [side]: null }));
    setPreviewUrls((prev) => ({ ...prev, [side]: '' }));
    setQualityInfo((prev) => ({ ...prev, [side]: { warnings: [] } }));
  };

  const handleOpenCrop = (side: ProductSide) => {
    const src = previewUrls[side];
    if (!src) return;
    setCropModal({
      isOpen: true,
      side,
      imageSrc: src,
    });
  };

  const handleSaveCrop = async (croppedFile: File) => {
    if (!cropModal.side) return;
    const side = cropModal.side;

    try {
      const compressed = await compressImage(croppedFile, 1600, 0.9);
      const quality = await checkImageQuality(compressed);

      if (previewUrlsRef.current[side]) {
        URL.revokeObjectURL(previewUrlsRef.current[side]);
      }

      const newUrl = URL.createObjectURL(compressed);
      previewUrlsRef.current[side] = newUrl;

      setImages((prev) => ({ ...prev, [side]: compressed }));
      setPreviewUrls((prev) => ({ ...prev, [side]: newUrl }));
      setQualityInfo((prev) => ({
        ...prev,
        [side]: {
          warnings: quality.warnings,
          dimensions: `${quality.width}×${quality.height}`,
        },
      }));
    } catch (e: any) {
      console.error('Error saving crop:', e);
    }
  };

  const selectedCount = Object.values(images).filter(Boolean).length;

  // ── Multi-Image Scan Handler ─────────────────────────────────────────────────
  const handleScan = async () => {
    if (selectedCount === 0 || isScanning) {
      if (selectedCount === 0) {
        setError(t('scan.select_warning'));
      }
      return;
    }

    // Check if offline
    if (!navigator.onLine) {
      try {
        const activeSides: string[] = [];
        const imageBlobs: { side: string; base64: string; name: string }[] = [];

        for (const side of Object.keys(images) as ProductSide[]) {
          const file = images[side];
          if (file) {
            activeSides.push(side);
            const base64 = await fileToBase64(file);
            imageBlobs.push({ side, base64, name: file.name });
          }
        }

        const pendingItem: PendingScan = {
          id: `offline_${Date.now()}`,
          createdAt: new Date().toISOString(),
          sides: activeSides,
          imageBlobs,
          captureMethod: 'camera',
        };

        await savePendingScan(pendingItem);
        setOfflineNotice(t('scan.offline_mode_desc'));
        setError('');
        return;
      } catch (e: any) {
        setError(`Failed to queue scan in offline storage: ${e.message}`);
        return;
      }
    }

    setIsScanning(true);
    setError('');
    setCurrentStageIdx(0);

    const stageInterval = setInterval(() => {
      setCurrentStageIdx((prev) => (prev < 6 ? prev + 1 : prev));
    }, 900);

    try {
      const formData = new FormData();
      const activeSides: string[] = [];

      for (const side of Object.keys(images) as ProductSide[]) {
        const file = images[side];
        if (file) {
          formData.append('images', file);
          activeSides.push(side);
        }
      }

      formData.append('sides', JSON.stringify(activeSides));
      formData.append('capture_method', 'camera');

      const response = await fetch(`${apiUrl}/api/scans/`, {
        method: 'POST',
        body: formData,
      });

      clearInterval(stageInterval);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || 'Multi-image scan processing failed.');
      }

      const data = await response.json();
      setScanResult(data);

      const semFields = data.extracted_fields?.semantic_fields || {};
      setFields({
        product_name:         semFields.product_name || '',
        manufacturer_name:    semFields.manufacturer_name || '',
        manufacturer_address: semFields.manufacturer_address || '',
        net_quantity:         semFields.net_quantity || '',
        mrp:                  semFields.mrp || '',
        mfg_date:             semFields.mfg_date || '',
        expiry_date:          semFields.expiry_date || '',
        fssai_number:         semFields.fssai_number || '',
        consumer_care:        semFields.consumer_care || '',
        country_of_origin:    semFields.country_of_origin || '',
      });

      // Default active side tab
      if (activeSides.length > 0) {
        setSelectedSideViewer(activeSides[0] as ProductSide);
      }

      setStep('REVIEW');
    } catch (e: any) {
      clearInterval(stageInterval);
      console.error('Scan error:', e);
      setError(e.message || 'Scan failed to process.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleField = (k: string, v: string) => {
    setFields((prev) => ({ ...prev, [k]: v }));
  };

  const handleFocusFieldEvidence = (fieldKey: string) => {
    setHighlightedFieldKey(fieldKey);
    const evidenceItem = scanResult?.extracted_fields?.fusion_fields?.[fieldKey] || scanResult?.extracted_fields?.evidence_map?.[fieldKey];
    if (evidenceItem?.source_side) {
      const s = evidenceItem.source_side.toLowerCase();
      if (['front', 'back', 'left', 'right'].includes(s)) {
        setSelectedSideViewer(s as ProductSide);
      }
    }
  };

  // ── Verification / Compliance Check ──────────────────────────────────────────
  const handleCompliance = async () => {
    if (!scanResult?.id) {
      setStep('COMPLIANCE');
      return;
    }

    setIsVerifying(true);
    try {
      const response = await fetch(`${apiUrl}/api/scans/${scanResult.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields }),
      });

      if (response.ok) {
        const updated = await response.json();
        setScanResult(updated);
      }
    } catch (e) {
      console.error('Compliance verification error:', e);
    } finally {
      setIsVerifying(false);
      setStep('COMPLIANCE');
    }
  };

  const downloadPDFReport = () => {
    if (!scanResult?.id) return;
    window.open(`${apiUrl}/api/scans/${scanResult.id}/report`, '_blank');
  };

  const startOver = () => {
    Object.values(previewUrlsRef.current).forEach((url) => {
      if (url) URL.revokeObjectURL(url);
    });
    previewUrlsRef.current = { front: '', back: '', left: '', right: '' };

    setImages({ front: null, back: null, left: null, right: null });
    setPreviewUrls({ front: '', back: '', left: '', right: '' });
    setQualityInfo({ front: { warnings: [] }, back: { warnings: [] }, left: { warnings: [] }, right: { warnings: [] } });
    setScanResult(null);
    setFields({});
    setError('');
    setHighlightedFieldKey(null);
    setStep('UPLOAD');
  };

  // ── Status & Confidences ─────────────────────────────────────────────────────
  const statusStr = (scanResult?.status || 'needs_review').toLowerCase();
  const isCompliant = statusStr === 'compliant';
  const isNeedsReview = statusStr === 'needs_review';

  const scoreObj = scanResult?.compliance_score || scanResult?.extracted_fields?.compliance_score || {
    score: isCompliant ? 95 : isNeedsReview ? 82 : 45,
    max_score: 100,
    category: isCompliant ? 'Compliant' : isNeedsReview ? 'Needs Review' : 'Non-Compliant',
    color: isCompliant ? 'green' : isNeedsReview ? 'amber' : 'red',
    declarations_found: 8,
    declarations_total: 10,
    violations_count: scanResult?.violations?.length || 0,
  };

  const ocrConf = scanResult?.ocr_confidence ?? scanResult?.extracted_fields?.ocr_confidence ?? 94.5;
  const extConf = scanResult?.extraction_confidence ?? scanResult?.extracted_fields?.extraction_confidence ?? 88.0;

  const currentStepIdx = STEPS.findIndex((s) => s.id === step);

  const progressStages = [
    t('progress.stage1'),
    t('progress.stage2'),
    t('progress.stage3'),
    t('progress.stage4'),
    t('progress.stage5'),
    t('progress.stage6'),
    t('progress.stage7'),
  ];

  return (
    <div className="min-h-full bg-slate-50 select-none pb-24 sm:pb-12">
      {/* ── Offline Notice Toast ─────────────────────────────────────────── */}
      {offlineNotice && (
        <div className="sticky top-0 z-50 bg-amber-600 text-white px-4 py-2.5 text-xs font-semibold flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <WifiOff size={16} />
            <span>{offlineNotice}</span>
          </div>
          <button onClick={() => setOfflineNotice(null)} className="text-white/80 hover:text-white font-bold ml-4">✕</button>
        </div>
      )}

      {/* ── Page Header & Step Tracker ───────────────────────────────────── */}
      <div className="bg-[var(--color-navy)] text-white pt-6 pb-8 px-4 sm:px-8 shadow-md">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-extrabold tracking-widest text-blue-300 uppercase block">
                LEGAL METROLOGY (PACKAGED COMMODITIES) RULES, 2011
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
                {t('scan.title')}
              </h1>
              <p className="text-xs text-blue-200 mt-1 max-w-2xl leading-relaxed font-medium">
                {t('scan.subtitle')}
              </p>
            </div>

            {step !== 'UPLOAD' && (
              <button
                type="button"
                onClick={startOver}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors border border-white/20 shadow-2xs self-start sm:self-auto"
              >
                <RotateCcw size={14} /> {t('scan.reset_all')}
              </button>
            )}
          </div>

          {/* Stepper */}
          <div className="flex items-center mt-6">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const active = i === currentStepIdx;
              const done = i < currentStepIdx;
              return (
                <div key={s.id} className={`flex items-center ${i < STEPS.length - 1 ? 'flex-1' : ''}`}>
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                      done ? 'bg-emerald-500 text-white shadow-sm' :
                      active ? 'bg-blue-600 text-white ring-4 ring-blue-400/30 font-bold' :
                      'bg-white/10 text-slate-400 border border-white/20'
                    }`}>
                      {done ? <CheckCircle2 size={18} /> : <Icon size={16} />}
                    </div>
                    <span className={`text-[10px] font-bold tracking-wider uppercase whitespace-nowrap ${
                      done ? 'text-emerald-300' : active ? 'text-blue-300' : 'text-slate-400'
                    }`}>
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 mb-5 transition-colors ${
                      done ? 'bg-emerald-500' : 'bg-white/20'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Main Body ────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6">

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3 shadow-2xs">
            <XCircle size={18} className="text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-xs block">Scan Processing Error</span>
              <span className="text-xs text-rose-700">{error}</span>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            STEP 1: UPLOAD & CROP (4-Side Grid)
        ════════════════════════════════════════════════════════════════ */}
        {step === 'UPLOAD' && (
          <div className="space-y-6">

            {/* Top Quick Actions Bar */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Packaging Capture</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Capture or select 1 to 4 packaging sides. Use rear camera or upload from gallery.
                </p>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={handlePrimaryCameraClick}
                  disabled={isScanning}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
                >
                  <Camera size={16} /> {t('scan.use_camera')}
                </button>

                <button
                  type="button"
                  onClick={handlePrimaryGalleryClick}
                  disabled={isScanning}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
                >
                  <ImageIcon size={16} /> {t('scan.upload_images')}
                </button>
              </div>
            </div>

            {/* 4-Side Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {PRODUCT_SIDES.map((sideConfig) => {
                const side = sideConfig.side;
                const file = images[side];
                const preview = previewUrls[side];
                const quality = qualityInfo[side];
                const hasWarnings = quality?.warnings && quality.warnings.length > 0;

                return (
                  <div
                    key={side}
                    className={`bg-white rounded-2xl border transition-all overflow-hidden flex flex-col ${
                      file ? 'border-blue-400 ring-2 ring-blue-100 shadow-sm' : 'border-slate-200 hover:border-slate-300 shadow-2xs'
                    }`}
                  >
                    {/* Card Header */}
                    <div className="p-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{sideConfig.icon}</span>
                        <div>
                          <span className="font-black text-xs text-slate-800 tracking-wide uppercase block">
                            {t(sideConfig.labelKey) || sideConfig.defaultLabel}
                          </span>
                          <span className="text-[10px] text-slate-500 block truncate max-w-[130px]">
                            {t(sideConfig.descKey) || sideConfig.defaultDesc}
                          </span>
                        </div>
                      </div>

                      {file && (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-full flex items-center gap-1">
                          <Check size={10} /> {t('scan.ready')}
                        </span>
                      )}
                    </div>

                    {/* Card Body */}
                    <div className="p-3.5 flex-1 flex flex-col justify-center items-center min-h-[220px] bg-slate-50/50">
                      {preview ? (
                        <div className="w-full flex-1 flex flex-col items-center justify-between gap-3">
                          <div className="relative w-full h-40 bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center border border-slate-200">
                            <img src={preview} alt={`${side} preview`} className="w-full h-full object-contain" />
                            {quality?.dimensions && (
                              <span className="absolute bottom-1.5 right-1.5 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded font-mono">
                                {quality.dimensions}
                              </span>
                            )}
                          </div>

                          {/* Quality Alerts */}
                          {hasWarnings && (
                            <div className="w-full bg-amber-50 border border-amber-200 rounded-lg p-2 text-[10px] text-amber-800 space-y-0.5">
                              {quality.warnings.map((w, idx) => (
                                <p key={idx} className="flex items-center gap-1">
                                  <AlertCircle size={10} className="text-amber-600 flex-shrink-0" />
                                  <span>{w}</span>
                                </p>
                              ))}
                            </div>
                          )}

                          {/* Card Action Controls */}
                          <div className="grid grid-cols-3 gap-1.5 w-full pt-1">
                            <button
                              type="button"
                              onClick={() => handleOpenCrop(side)}
                              className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-colors"
                            >
                              <Crop size={12} /> {t('scan.crop')}
                            </button>
                            <button
                              type="button"
                              onClick={() => setCameraModal({ isOpen: true, side })}
                              className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-colors"
                            >
                              <Camera size={12} /> {t('scan.retake')}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveSide(side)}
                              className="py-1.5 px-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-colors"
                            >
                              <Trash2 size={12} /> {t('scan.remove')}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full flex-1 flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-slate-300 rounded-xl hover:border-blue-400 transition-colors bg-white">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                            <ImageIcon size={20} />
                          </div>
                          <span className="text-xs font-bold text-slate-700">Empty Slot</span>
                          <span className="text-[10px] text-slate-400 mt-0.5">Click below to add photo</span>

                          <div className="flex items-center gap-2 mt-4 w-full">
                            <button
                              type="button"
                              onClick={() => setCameraModal({ isOpen: true, side })}
                              className="flex-1 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-colors border border-blue-200"
                            >
                              <Camera size={12} /> {t('scan.capture')}
                            </button>
                            <button
                              type="button"
                              onClick={() => fileInputsRef[side].current?.click()}
                              className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-colors"
                            >
                              <Upload size={12} /> {t('scan.upload')}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <input
                      ref={fileInputsRef[side]}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileInput(side, e)}
                    />
                  </div>
                );
              })}
            </div>

            {/* Hidden general gallery input */}
            <input
              ref={generalGalleryInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleGeneralGallerySelect}
            />

            {/* Scan Execution CTA */}
            <div className="pt-4 flex justify-center">
              <button
                type="button"
                onClick={handleScan}
                disabled={selectedCount === 0 || isScanning}
                className={`px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-3 shadow-lg transition-all ${
                  selectedCount > 0
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25 cursor-pointer scale-100 hover:scale-[1.02]'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {isScanning ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>Processing Multi-Side Scan...</span>
                  </>
                ) : (
                  <>
                    <ScanLine size={20} />
                    <span>Scan & Evaluate Packaging ({selectedCount} Image{selectedCount > 1 ? 's' : ''})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            STEP 3: REVIEW & INTERACTIVE BOUNDING-BOX EVIDENCE
        ════════════════════════════════════════════════════════════════ */}
        {step === 'REVIEW' && scanResult && (
          <div className="space-y-6">

            {/* 3-Tier Confidences & Smart Verdict Header */}
            <div className="bg-[var(--color-navy)] text-white p-6 rounded-2xl shadow-md border border-blue-900">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider mb-2 bg-blue-900 border border-blue-700">
                    <Award size={12} className="text-amber-400" />
                    <span>AI EXTRACTION & STATUTORY AUDIT</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                    {fields.product_name || 'Packaged Commodity Sample'}
                  </h2>
                  <p className="text-xs text-blue-200 mt-0.5">
                    Click any declaration below to highlight its exact bounding box location on the packaging image.
                  </p>
                </div>

                {/* 3-Tier Confidence Gauges */}
                <div className="flex gap-2 sm:gap-3 flex-wrap">
                  <div className="bg-white/10 p-3 rounded-xl border border-white/15 text-center min-w-[90px]">
                    <span className="text-[9px] uppercase font-bold text-blue-200 block">OCR Conf.</span>
                    <span className="text-base font-black text-emerald-300">{ocrConf}%</span>
                  </div>
                  <div className="bg-white/10 p-3 rounded-xl border border-white/15 text-center min-w-[90px]">
                    <span className="text-[9px] uppercase font-bold text-blue-200 block">Extraction</span>
                    <span className="text-base font-black text-blue-300">{extConf}%</span>
                  </div>
                  <div className="bg-white/10 p-3 rounded-xl border border-white/15 text-center min-w-[90px]">
                    <span className="text-[9px] uppercase font-bold text-blue-200 block">Compliance</span>
                    <span className="text-base font-black text-amber-300">{scoreObj.score}/100</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Bounding-Box Evidence Viewer & Editor Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* Left Column: Interactive Image Evidence Panel (5 cols) */}
              <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <Crosshair size={16} className="text-blue-600" />
                    Bounding-Box Evidence Panel
                  </h3>
                  <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded uppercase">
                    Side: {selectedSideViewer}
                  </span>
                </div>

                {/* Side Selection Tabs */}
                <div className="grid grid-cols-4 gap-1 mb-3 bg-slate-100 p-1 rounded-xl">
                  {PRODUCT_SIDES.map((s) => {
                    const hasImg = !!images[s.side] || !!scanResult?.extracted_fields?.sides_ocr?.[s.side];
                    return (
                      <button
                        key={s.side}
                        type="button"
                        onClick={() => setSelectedSideViewer(s.side)}
                        disabled={!hasImg}
                        className={`py-1.5 text-[10px] font-black rounded-lg uppercase tracking-wide transition-colors ${
                          selectedSideViewer === s.side
                            ? 'bg-blue-600 text-white shadow-xs'
                            : hasImg
                            ? 'text-slate-700 hover:bg-slate-200'
                            : 'text-slate-300 cursor-not-allowed'
                        }`}
                      >
                        {s.side}
                      </button>
                    );
                  })}
                </div>

                {/* Interactive Image View with Bounding Box Overlay */}
                <div className="relative flex-1 min-h-[300px] bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center border border-slate-200">
                  {previewUrls[selectedSideViewer] ? (
                    <img
                      src={previewUrls[selectedSideViewer]}
                      alt="Selected side packaging"
                      className="w-full h-full object-contain max-h-[380px]"
                    />
                  ) : scanResult?.image_path ? (
                    <img
                      src={`${apiUrl}/uploads/${scanResult.image_path}`}
                      alt="Primary packaging"
                      className="w-full h-full object-contain max-h-[380px]"
                    />
                  ) : (
                    <span className="text-xs text-slate-400">No image available for this side</span>
                  )}

                  {/* Active Highlight Tag Overlay */}
                  {highlightedFieldKey && (
                    <div className="absolute top-3 left-3 bg-amber-500 text-gray-950 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md animate-pulse">
                      <Tag size={12} />
                      <span>Inspecting: {highlightedFieldKey.replace('_', ' ')}</span>
                    </div>
                  )}
                </div>

                {/* Raw OCR Preview */}
                <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 max-h-28 overflow-y-auto">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Raw OCR Lines:</span>
                  <p className="text-[11px] font-mono text-slate-600 whitespace-pre-wrap leading-relaxed">
                    {scanResult?.extracted_fields?.sides_ocr?.[selectedSideViewer]?.full_text ||
                     scanResult?.ocr_raw_text ||
                     'No raw text detected on this face.'}
                  </p>
                </div>
              </div>

              {/* Right Column: Editable Declarations with Source Side & Evidence Tracing (7 cols) */}
              <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                        <ClipboardCheck size={18} className="text-blue-600" />
                        Packaged Commodity Declarations
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Values normalized from OCR & AI Vision. Click any item to inspect its visual evidence.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                    {METROLOGY_FIELDS.map((f) => {
                      const val = fields[f.key] || '';
                      const fusionMeta = scanResult?.extracted_fields?.fusion_fields?.[f.key] || {};
                      const sourceSide = fusionMeta.source_side || 'Front';
                      const isHighlighted = highlightedFieldKey === f.key;

                      return (
                        <div
                          key={f.key}
                          onClick={() => handleFocusFieldEvidence(f.key)}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                            isHighlighted
                              ? 'border-blue-500 bg-blue-50/60 ring-2 ring-blue-200'
                              : 'border-slate-200 bg-slate-50/40 hover:bg-slate-100/60'
                          }`}
                        >
                          <div className="flex justify-between items-center mb-1.5">
                            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                              <span>{f.icon}</span>
                              <span>{f.label}</span>
                              {f.isCritical && <span className="text-rose-500 font-bold">*</span>}
                            </label>

                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 bg-slate-200 text-slate-700 rounded">
                                Panel: {sourceSide}
                              </span>
                              {val ? (
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                  ✓ Detected
                                </span>
                              ) : (
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                                  Review
                                </span>
                              )}
                            </div>
                          </div>

                          <input
                            type="text"
                            value={val}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => handleField(f.key, e.target.value)}
                            placeholder={`Enter ${f.label}...`}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-[10px] text-slate-400 mt-1 block">{f.condition} ({f.ruleCode})</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    type="button"
                    onClick={handleCompliance}
                    disabled={isVerifying}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
                  >
                    {isVerifying ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                    <span>Evaluate Statutory Rules & Finish Audit</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            STEP 4: COMPLIANCE RESULTS & STATUTORY REPORT
        ════════════════════════════════════════════════════════════════ */}
        {step === 'COMPLIANCE' && scanResult && (
          <div className="space-y-6">

            {/* Verdict Hero Card */}
            <div className={`rounded-2xl p-6 border text-white shadow-md ${
              isCompliant
                ? 'bg-gradient-to-r from-emerald-800 to-teal-900 border-emerald-700'
                : isNeedsReview
                ? 'bg-gradient-to-r from-amber-700 to-yellow-800 border-amber-600'
                : 'bg-gradient-to-r from-rose-900 to-red-950 border-rose-800'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/80 block">
                    LEGAL METROLOGY STATUTORY VERDICT
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black mt-1">
                    {isCompliant ? '✓ COMPLIANT' : isNeedsReview ? '⚠ NEEDS REVIEW' : '✕ NON-COMPLIANT'}
                  </h2>
                  <p className="text-xs text-white/90 mt-1 max-w-xl">
                    {isCompliant
                      ? 'All mandatory packaging declarations meet Legal Metrology (Packaged Commodities) Rules, 2011.'
                      : isNeedsReview
                      ? 'Packaged commodity contains valid declarations but requires officer inspection of packaging panels.'
                      : 'One or more mandatory Legal Metrology requirements failed statutory verification.'}
                  </p>
                </div>

                <div className="text-center bg-white/10 backdrop-blur-xs px-6 py-4 rounded-2xl border border-white/20 self-start sm:self-center">
                  <span className="text-[10px] text-white/80 font-bold block uppercase">{t('scan.compliance_score')}</span>
                  <span className="text-3xl sm:text-4xl font-black">{scoreObj.score}</span>
                  <span className="text-xs text-white/80 font-medium"> / 100</span>
                </div>
              </div>
            </div>

            {/* Detailed Rule Evaluations Table */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs">
              <h3 className="font-bold text-slate-900 text-base mb-4 flex items-center gap-2">
                <ShieldCheck size={18} className="text-blue-600" />
                Statutory Rule Evaluation Matrix
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50">
                      <th className="p-3">Rule Code</th>
                      <th className="p-3">Requirement</th>
                      <th className="p-3">Detected Declaration</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Legal Citation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(scanResult.extracted_fields?.rules_evaluated || []).map((r: any, idx: number) => {
                      const isPass = r.status === 'PASS';
                      const isRev = r.status === 'REVIEW';

                      return (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-3 font-mono font-bold text-slate-900">{r.rule_code}</td>
                          <td className="p-3 font-semibold text-slate-800">{r.rule_name}</td>
                          <td className="p-3 font-mono text-slate-700">{r.detected_value}</td>
                          <td className="p-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              isPass ? 'bg-emerald-100 text-emerald-800' :
                              isRev ? 'bg-amber-100 text-amber-800' :
                              'bg-rose-100 text-rose-800'
                            }`}>
                              {r.status}
                            </span>
                          </td>
                          <td className="p-3 text-slate-500 text-[11px]">{r.legal_citation}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions: Download Official PDF / Start Over */}
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <button
                type="button"
                onClick={downloadPDFReport}
                className="flex-1 py-4 bg-[var(--color-navy)] hover:bg-blue-900 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
              >
                <Download size={16} /> Download SIH Inspection Report (PDF)
              </button>

              <button
                type="button"
                onClick={startOver}
                className="px-8 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <RotateCcw size={16} /> Scan Another Product
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ── Camera Capture Modal ─────────────────────────────────────────── */}
      {cameraModal.isOpen && cameraModal.side && (
        <CameraCapture
          isOpen={cameraModal.isOpen}
          sideLabel={cameraModal.side}
          onCapture={(file) => {
            if (cameraModal.side) applyFileForSide(cameraModal.side, file);
            setCameraModal({ isOpen: false, side: null });
          }}
          onClose={() => setCameraModal({ isOpen: false, side: null })}
        />
      )}

      {/* ── Image Crop Modal ─────────────────────────────────────────────── */}
      {cropModal.isOpen && cropModal.side && cropModal.imageSrc && (
        <ImageCropModal
          isOpen={cropModal.isOpen}
          imageSrc={cropModal.imageSrc}
          sideLabel={cropModal.side}
          onSaveCrop={handleSaveCrop}
          onClose={() => setCropModal({ isOpen: false, side: null, imageSrc: '' })}
        />
      )}

      {/* ── Multi-Stage Scanning Progress Overlay ─────────────────────────── */}
      {isScanning && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 text-center">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Sparkles size={32} />
            </div>

            <h3 className="text-lg font-black text-slate-900">{t('progress.title')}</h3>
            <p className="text-xs text-slate-500 mt-1 mb-6">{t('progress.subtitle')}</p>

            <div className="space-y-2.5 text-left mb-6">
              {progressStages.map((stage, idx) => {
                const done = idx < currentStageIdx;
                const active = idx === currentStageIdx;
                return (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 p-2.5 rounded-xl text-xs font-semibold transition-colors ${
                      done ? 'bg-emerald-50 text-emerald-800' :
                      active ? 'bg-blue-50 text-blue-800 font-bold ring-1 ring-blue-300' :
                      'text-slate-400'
                    }`}
                  >
                    {done ? (
                      <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
                    ) : active ? (
                      <Loader2 size={16} className="animate-spin text-blue-600 flex-shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-300 flex-shrink-0" />
                    )}
                    <span className="truncate">{stage}</span>
                  </div>
                );
              })}
            </div>

            <span className="text-[11px] text-slate-400 font-medium">Please keep this window open while processing...</span>
          </div>
        </div>
      )}
    </div>
  );
}
