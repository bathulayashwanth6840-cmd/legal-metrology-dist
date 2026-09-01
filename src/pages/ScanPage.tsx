import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Upload, ScanLine, CheckCircle2, AlertTriangle, XCircle,
  Eye, Sparkles, ShieldCheck, RotateCcw,
  Info, Camera, Image as ImageIcon, Loader2, ClipboardCheck,
  Crop, Trash2, Layers, Check, AlertCircle, WifiOff, Download
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
  { key: 'product_name',        label: 'Product Name',              ruleCode: 'LMR_006', condition: 'Must be declared on the principal display panel',               icon: '📦', isCritical: false },
  { key: 'manufacturer_name',   label: 'Manufacturer / Packer',     ruleCode: 'LMR_007', condition: 'Name of manufacturer, packer, or importer',                    icon: '🏭', isCritical: true },
  { key: 'manufacturer_address',label: 'Manufacturer Address',       ruleCode: 'LMR_005', condition: 'Complete address of manufacturer/packer/importer',              icon: '📍', isCritical: true },
  { key: 'net_quantity',        label: 'Net Quantity',               ruleCode: 'LMR_002', condition: 'Net weight, net volume, or number of units',                   icon: '⚖️', isCritical: true },
  { key: 'mrp',                 label: 'MRP (Max Retail Price)',     ruleCode: 'LMR_001', condition: 'Clearly written in Rupees, inclusive of all taxes',             icon: '₹',  isCritical: true },
  { key: 'mfg_date',            label: 'Mfg / Packing Date',        ruleCode: 'LMR_003', condition: 'Month and year of manufacture or packing',                      icon: '📅', isCritical: false },
  { key: 'expiry_date',         label: 'Expiry / Best Before',       ruleCode: 'LMR_008', condition: 'Required for commodities that may spoil or deteriorate',        icon: '⏳', isCritical: true },
  { key: 'fssai_number',        label: 'FSSAI License No.',          ruleCode: 'FSSAI_001', condition: 'Required for all packaged food products — 14 digits',        icon: '🔏', isCritical: false },
  { key: 'consumer_care',       label: 'Consumer Care Details',      ruleCode: 'LMR_004', condition: 'Name, address, phone or email of consumer care contact',       icon: '📞', isCritical: false },
  { key: 'country_of_origin',   label: 'Country of Origin',          ruleCode: 'LMR_009', condition: 'Must be declared if product is imported',                      icon: '🌍', isCritical: false },
];

const STEPS = [
  { id: 'UPLOAD',     label: 'Scan & Crop', icon: Upload },
  { id: 'EXTRACT',    label: 'Extract',     icon: Sparkles },
  { id: 'REVIEW',     label: 'Review',      icon: Eye },
  { id: 'COMPLIANCE', label: 'Compliance',  icon: ShieldCheck },
];

// ─── Helper Functions ─────────────────────────────────────────────────────────
function getGeminiField(scanResult: any, key: string): string {
  const gemini = scanResult?.extracted_fields?.gemini_extraction;
  if (!gemini) return '';
  const keyMap: Record<string, string> = {
    manufacturer_name:    'manufacturer_name',
    manufacturer_address: 'manufacturer_address',
    net_quantity:         'net_quantity',
    mrp:                  'mrp',
    expiry_date:          'expiry_date',
    consumer_care:        'customer_care_details',
    country_of_origin:    'country_of_origin',
    mfg_date:             'mfg_date',
    product_name:         'product_name',
    fssai_number:         'fssai_number',
    batch_number:         'batch_number',
  };
  const backendKey = keyMap[key] || key;
  const val = gemini[backendKey];
  if (!val || val === 'null' || val === 'None') return '';
  return String(val);
}

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
        return;
      } catch (err) {
        console.error('Failed to save offline scan:', err);
      }
    }

    setIsScanning(true);
    setError('');
    setCurrentStageIdx(0);

    const stageInterval = setInterval(() => {
      setCurrentStageIdx((prev) => (prev < 6 ? prev + 1 : prev));
    }, 2000);

    try {
      const formData = new FormData();
      const activeSides: string[] = [];

      (Object.keys(images) as ProductSide[]).forEach((side) => {
        const file = images[side];
        if (file) {
          formData.append('images', file);
          activeSides.push(side);
        }
      });

      const firstSide = activeSides[0] as ProductSide;
      if (firstSide && images[firstSide]) {
        formData.append('image', images[firstSide] as File);
      }

      formData.append('sides', JSON.stringify(activeSides));
      formData.append('capture_method', 'camera');

      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${apiUrl}/api/scans/`, {
        method: 'POST',
        body: formData,
        headers,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || 'Backend could not process the product scan.');
      }

      const data = await res.json();
      setScanResult(data);

      const populated: Record<string, string> = {};
      METROLOGY_FIELDS.forEach((f) => {
        populated[f.key] = getGeminiField(data, f.key);
      });
      setFields(populated);
      setStep('EXTRACT');
    } catch (err: any) {
      setError(err.message || 'An error occurred while scanning the product.');
    } finally {
      clearInterval(stageInterval);
      setIsScanning(false);
      setCurrentStageIdx(0);
    }
  };

  const handleField = (key: string, val: string) =>
    setFields((prev) => ({ ...prev, [key]: val }));

  // ── Compliance Verification ──────────────────────────────────────────────────
  const handleCompliance = async () => {
    if (!scanResult || isVerifying) return;
    setIsVerifying(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${apiUrl}/api/scans/${scanResult.id}/verify`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ fields }),
      });

      if (!res.ok) {
        throw new Error('Failed to run compliance check on the product declarations.');
      }

      const updated = await res.json();
      setScanResult(updated);
      setStep('COMPLIANCE');
    } catch (err: any) {
      setError(err.message || 'Compliance verification check failed.');
    } finally {
      setIsVerifying(false);
    }
  };

  const startOver = () => {
    (Object.keys(previewUrlsRef.current) as ProductSide[]).forEach((side) => {
      if (previewUrlsRef.current[side]) {
        URL.revokeObjectURL(previewUrlsRef.current[side]);
        previewUrlsRef.current[side] = '';
      }
    });

    setImages({ front: null, back: null, left: null, right: null });
    setPreviewUrls({ front: '', back: '', left: '', right: '' });
    setQualityInfo({
      front: { warnings: [] },
      back:  { warnings: [] },
      left:  { warnings: [] },
      right: { warnings: [] },
    });
    setScanResult(null);
    setFields({});
    setError('');
    setStep('UPLOAD');
  };

  const downloadPDFReport = () => {
    if (!scanResult?.id) return;
    window.open(`${apiUrl}/api/scans/${scanResult.id}/report`, '_blank');
  };

  const currentStepIdx = STEPS.findIndex((s) => s.id === step);

  // Calculate or read compliance score
  const isCompliant = scanResult?.status === 'compliant' || (scanResult?.violations && scanResult?.violations.length === 0);
  const scoreObj = scanResult?.compliance_score || scanResult?.extracted_fields?.compliance_score || {
    score: isCompliant ? 95 : Math.max(25, 90 - (scanResult?.violations?.length || 1) * 20),
    max_score: 100,
    category: isCompliant ? 'Excellent / Compliant' : 'High Risk / Non-Compliant',
    declarations_found: 8,
    declarations_total: 10,
    missing_declarations: ['country_of_origin'],
    violations_count: scanResult?.violations?.length || 0,
  };

  const duplicateInfo = scanResult?.duplicate_product || scanResult?.extracted_fields?.duplicate_product;
  const fieldConfidences = scanResult?.field_confidences || scanResult?.extracted_fields?.field_confidences || {};

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
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={(e) => handleFileInput(side, e)}
                      className="hidden"
                    />
                  </div>
                );
              })}
            </div>

            {/* Hidden multi-file gallery input */}
            <input
              ref={generalGalleryInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleGeneralGallerySelect}
              className="hidden"
            />

            {/* Scan Execution CTA */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Selected Images</span>
                <span className="text-base font-black text-slate-900">
                  {selectedCount} of 4 Packaging Sides Ready
                </span>
              </div>

              <button
                type="button"
                onClick={handleScan}
                disabled={selectedCount === 0 || isScanning}
                className={`px-8 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 shadow-md transition-all ${
                  selectedCount > 0 && !isScanning
                    ? 'bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white shadow-blue-500/20'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {isScanning ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Analyzing Packaging...</span>
                  </>
                ) : (
                  <>
                    <ScanLine size={18} />
                    <span>{t('scan.scan_button')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            STEP 2 & 3: EXTRACT & REVIEW
        ════════════════════════════════════════════════════════════════ */}
        {(step === 'EXTRACT' || step === 'REVIEW') && scanResult && (
          <div className="space-y-6">

            {/* Duplicate Product Alert Banner */}
            {duplicateInfo?.is_duplicate && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-start gap-3">
                  <Info size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-xs block">⚠️ {t('scan.duplicate_alert_title')}</span>
                    <p className="text-xs text-amber-800 mt-0.5">
                      Product <strong>{duplicateInfo.product_name}</strong> was previously inspected on{' '}
                      {new Date(duplicateInfo.scanned_at).toLocaleString()} with status{' '}
                      <span className="font-bold uppercase underline">{duplicateInfo.previous_status}</span>.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Compliance Score Gauge Card */}
            <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-white rounded-2xl p-6 shadow-md border border-blue-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <span className="text-[11px] font-bold text-blue-300 uppercase tracking-wider block">
                    {t('scan.compliance_score')}
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-4xl font-black tracking-tight">{scoreObj.score}</span>
                    <span className="text-sm text-blue-300 font-medium">/ 100</span>
                    <span className={`ml-3 px-3 py-0.5 rounded-full text-xs font-black uppercase ${
                      scoreObj.score >= 90 ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400' :
                      scoreObj.score >= 70 ? 'bg-amber-500/30 text-amber-300 border border-amber-400' :
                      scoreObj.score >= 40 ? 'bg-orange-500/30 text-orange-300 border border-orange-400' :
                      'bg-rose-500/30 text-rose-300 border border-rose-400'
                    }`}>
                      {scoreObj.category}
                    </span>
                  </div>
                </div>

                <div className="flex gap-4 text-xs font-semibold bg-white/10 p-3 rounded-xl border border-white/15">
                  <div>
                    <span className="text-blue-200 block text-[10px] uppercase">Found</span>
                    <span className="text-base font-black text-emerald-300">{scoreObj.declarations_found} / 10</span>
                  </div>
                  <div className="w-px bg-white/20"></div>
                  <div>
                    <span className="text-blue-200 block text-[10px] uppercase">Violations</span>
                    <span className="text-base font-black text-rose-300">{scoreObj.violations_count}</span>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-blue-950 rounded-full h-3 overflow-hidden border border-blue-700/50">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    scoreObj.score >= 90 ? 'bg-emerald-400' :
                    scoreObj.score >= 70 ? 'bg-amber-400' :
                    scoreObj.score >= 40 ? 'bg-orange-400' : 'bg-rose-500'
                  }`}
                  style={{ width: `${scoreObj.score}%` }}
                ></div>
              </div>
            </div>

            {/* Multi-Side OCR & AI Declarations Form */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Left Side: Declarations Editor */}
              <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <ClipboardCheck size={18} className="text-blue-600" />
                    Mandatory Declarations & Confidence
                  </h3>
                  <span className="text-[11px] text-slate-500 font-medium">Verify & edit if required</span>
                </div>

                <div className="space-y-3.5">
                  {METROLOGY_FIELDS.map((f) => {
                    const val = fields[f.key] || '';
                    const conf = fieldConfidences[f.key] || {
                      score: val ? 85 : 0,
                      level: val ? 'HIGH' : 'LOW',
                      needs_review: f.isCritical && !val
                    };

                    return (
                      <div key={f.key} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <span>{f.icon}</span>
                            <span>{f.label}</span>
                            {f.isCritical && <span className="text-rose-500 font-bold">*</span>}
                          </label>

                          <div className="flex items-center gap-2">
                            {val && (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                conf.level === 'HIGH' ? 'bg-emerald-100 text-emerald-800' :
                                conf.level === 'MEDIUM' ? 'bg-amber-100 text-amber-800' :
                                'bg-rose-100 text-rose-800'
                              }`}>
                                {conf.score}% ({conf.level})
                              </span>
                            )}
                            {conf.needs_review && (
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-900 rounded border border-amber-200 flex items-center gap-1">
                                <AlertTriangle size={10} /> {t('scan.manual_review_recommended')}
                              </span>
                            )}
                          </div>
                        </div>

                        <input
                          type="text"
                          value={val}
                          onChange={(e) => handleField(f.key, e.target.value)}
                          placeholder={`Enter or edit ${f.label}...`}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-[10px] text-slate-400 mt-1 block">{f.condition} ({f.ruleCode})</span>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    type="button"
                    onClick={handleCompliance}
                    disabled={isVerifying}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm transition-colors"
                  >
                    {isVerifying ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                    <span>{t('scan.check_compliance')}</span>
                  </button>
                </div>
              </div>

              {/* Right Side: Raw OCR per packaging face */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs flex flex-col">
                <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
                  <Layers size={16} className="text-purple-600" />
                  Side-by-Side Raw OCR
                </h3>

                {/* Side tabs */}
                <div className="grid grid-cols-4 gap-1 mb-3 bg-slate-100 p-1 rounded-xl">
                  {PRODUCT_SIDES.map((s) => (
                    <button
                      key={s.side}
                      type="button"
                      onClick={() => setSelectedSideViewer(s.side)}
                      className={`py-1 text-[11px] font-bold rounded-lg uppercase tracking-wide transition-colors ${
                        selectedSideViewer === s.side
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {s.side}
                    </button>
                  ))}
                </div>

                <div className="flex-1 bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono whitespace-pre-wrap overflow-y-auto max-h-[500px]">
                  {scanResult?.extracted_fields?.sides_ocr?.[selectedSideViewer]?.full_text ||
                   scanResult?.ocr_raw_text ||
                   'No text extracted on this side.'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            STEP 4: COMPLIANCE RESULTS & PDF CERTIFICATE
        ════════════════════════════════════════════════════════════════ */}
        {step === 'COMPLIANCE' && scanResult && (
          <div className="space-y-6">
            {/* Score & Verdict Banner */}
            <div className={`rounded-2xl p-6 border text-white shadow-md ${
              isCompliant ? 'bg-gradient-to-r from-emerald-800 to-teal-900 border-emerald-700' : 'bg-gradient-to-r from-rose-900 to-red-950 border-rose-800'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/80 block">
                    FINAL COMPLIANCE VERDICT
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black mt-1">
                    {isCompliant ? '✓ COMPLIANT WITH LMR 2011' : '✕ NON-COMPLIANT — VIOLATIONS DETECTED'}
                  </h2>
                  <p className="text-xs text-white/80 mt-1">
                    {isCompliant
                      ? 'All mandatory packaging declarations meet Legal Metrology standards.'
                      : `${scanResult.violations?.length || 0} violation(s) require enforcement action or correction.`}
                  </p>
                </div>

                <div className="text-center bg-white/10 px-5 py-3 rounded-2xl border border-white/20 self-start sm:self-center">
                  <span className="text-[10px] text-white/80 font-bold block uppercase">{t('scan.compliance_score')}</span>
                  <span className="text-3xl font-black">{scoreObj.score}</span>
                  <span className="text-xs text-white/80 font-medium"> / 100</span>
                </div>
              </div>
            </div>

            {/* Violations Table */}
            {scanResult.violations && scanResult.violations.length > 0 && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs">
                <h3 className="font-bold text-slate-900 text-base mb-4 flex items-center gap-2">
                  <AlertTriangle size={18} className="text-rose-600" />
                  Identified Violations ({scanResult.violations.length})
                </h3>

                <div className="space-y-3">
                  {scanResult.violations.map((v: any, idx: number) => (
                    <div key={idx} className="p-4 rounded-xl bg-rose-50/70 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-rose-900 text-xs font-mono">{v.rule_code}</span>
                          <span className="text-xs font-bold text-slate-800">{v.rule_description}</span>
                        </div>
                        <p className="text-xs text-rose-800 mt-1">{v.detail_text}</p>
                      </div>

                      <span className="px-2.5 py-1 bg-rose-200 text-rose-900 rounded-lg text-[10px] font-black uppercase whitespace-nowrap self-start sm:self-center">
                        {v.severity} SEVERITY
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions: Download PDF Report / Start Over */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={downloadPDFReport}
                className="flex-1 py-3.5 bg-[var(--color-navy)] hover:bg-blue-900 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors"
              >
                <Download size={16} /> {t('scan.download_report')}
              </button>

              <button
                type="button"
                onClick={startOver}
                className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <RotateCcw size={16} /> {t('scan.reset_all')}
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
