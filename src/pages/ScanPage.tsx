import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Upload, ScanLine, CheckCircle2, AlertTriangle, XCircle,
  ChevronRight, Eye, FileText, Sparkles, ShieldCheck, RotateCcw,
  Info, Camera, Image as ImageIcon, Loader2, ClipboardCheck,
  Crop, Trash2, RefreshCw, Layers, Check, AlertCircle
} from 'lucide-react';
import CameraCapture from '../components/CameraCapture';
import ImageCropModal from '../components/ImageCropModal';
import { compressImage } from '../utils/imageCompressor';
import { checkImageQuality } from '../utils/imageQuality';

// ─── Types ────────────────────────────────────────────────────────────────────
type WizardStep = 'UPLOAD' | 'EXTRACT' | 'REVIEW' | 'COMPLIANCE';
type ProductSide = 'front' | 'back' | 'left' | 'right';

interface FieldConfig {
  key: string;
  label: string;
  ruleCode: string;
  condition: string;
  icon: string;
}

interface SideCardConfig {
  side: ProductSide;
  label: string;
  description: string;
  icon: string;
  badgeColor: string;
}

interface SideQualityInfo {
  warnings: string[];
  dimensions?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const PRODUCT_SIDES: SideCardConfig[] = [
  { side: 'front', label: 'Front Side', description: 'Brand name, product title, net quantity', icon: '📦', badgeColor: '#3b82f6' },
  { side: 'back',  label: 'Back Side',  description: 'MRP, manufacturer details, dates & FSSAI', icon: '📋', badgeColor: '#8b5cf6' },
  { side: 'left',  label: 'Left Side',  description: 'Nutritional facts & ingredients list', icon: '🥗', badgeColor: '#10b981' },
  { side: 'right', label: 'Right Side', description: 'Barcode, consumer care & batch number', icon: '🏷️', badgeColor: '#f59e0b' },
];

const METROLOGY_FIELDS: FieldConfig[] = [
  { key: 'product_name',        label: 'Product Name',              ruleCode: 'LMR_006', condition: 'Must be declared on the principal display panel',               icon: '📦' },
  { key: 'manufacturer_name',   label: 'Manufacturer / Packer',     ruleCode: 'LMR_007', condition: 'Name of manufacturer, packer, or importer',                    icon: '🏭' },
  { key: 'manufacturer_address',label: 'Manufacturer Address',       ruleCode: 'LMR_005', condition: 'Complete address of manufacturer/packer/importer',              icon: '📍' },
  { key: 'net_quantity',        label: 'Net Quantity',               ruleCode: 'LMR_002', condition: 'Net weight, net volume, or number of units',                   icon: '⚖️' },
  { key: 'mrp',                 label: 'MRP (Max Retail Price)',     ruleCode: 'LMR_001', condition: 'Clearly written in Rupees, inclusive of all taxes',             icon: '₹' },
  { key: 'mfg_date',            label: 'Mfg / Packing Date',        ruleCode: 'LMR_003', condition: 'Month and year of manufacture or packing',                      icon: '📅' },
  { key: 'expiry_date',         label: 'Expiry / Best Before',       ruleCode: 'LMR_008', condition: 'Required for commodities that may spoil or deteriorate',        icon: '⏳' },
  { key: 'fssai_number',        label: 'FSSAI License No.',          ruleCode: 'FSSAI_001', condition: 'Required for all packaged food products — 14 digits',        icon: '🔏' },
  { key: 'consumer_care',       label: 'Consumer Care Details',      ruleCode: 'LMR_004', condition: 'Name, address, phone or email of consumer care contact',       icon: '📞' },
  { key: 'country_of_origin',   label: 'Country of Origin',          ruleCode: 'LMR_009', condition: 'Must be declared if product is imported',                      icon: '🌍' },
];

const STEPS = [
  { id: 'UPLOAD',     label: 'Scan & Crop', icon: Upload },
  { id: 'EXTRACT',    label: 'Extract',     icon: Sparkles },
  { id: 'REVIEW',     label: 'Review',      icon: Eye },
  { id: 'COMPLIANCE', label: 'Compliance',  icon: ShieldCheck },
];

const PROGRESS_STAGES = [
  'Optimizing & uploading product label images…',
  'Reading product labels with OCR engine…',
  'Extracting product information with Gemini AI…',
  'Reconciling fields & cross-checking declarations…',
  'Evaluating Legal Metrology rules…',
  'Preparing compliance results…',
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

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ScanPage() {
  const [step, setStep] = useState<WizardStep>('UPLOAD');

  // Multi-image state: up to 4 sides
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

  // Quality check warnings per side
  const [qualityInfo, setQualityInfo] = useState<Record<ProductSide, SideQualityInfo>>({
    front: { warnings: [] },
    back:  { warnings: [] },
    left:  { warnings: [] },
    right: { warnings: [] },
  });

  // Active side tab for reviewing images & OCR text in EXTRACT step
  const [activeSideTab, setActiveSideTab] = useState<string>('all');

  // Camera Modal State
  const [cameraModal, setCameraModal] = useState<{
    isOpen: boolean;
    side: ProductSide | null;
  }>({
    isOpen: false,
    side: null,
  });

  // Crop Modal State
  const [cropModal, setCropModal] = useState<{
    isOpen: boolean;
    side: ProductSide | null;
    imageSrc: string;
  }>({
    isOpen: false,
    side: null,
    imageSrc: '',
  });

  const [scanResult, setScanResult]     = useState<any>(null);
  const [fields, setFields]             = useState<Record<string, string>>({});
  const [isScanning, setIsScanning]     = useState(false);
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [isVerifying, setIsVerifying]   = useState(false);
  const [error, setError]               = useState('');

  // Hidden file inputs for each side
  const fileInputsRef = {
    front: useRef<HTMLInputElement>(null),
    back:  useRef<HTMLInputElement>(null),
    left:  useRef<HTMLInputElement>(null),
    right: useRef<HTMLInputElement>(null),
  };

  // General gallery upload ref for quick multi-select or first available slot
  const generalGalleryInputRef = useRef<HTMLInputElement>(null);

  const previewUrlsRef = useRef<Record<ProductSide, string>>({
    front: '',
    back: '',
    left: '',
    right: '',
  });

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  // Revoke blob URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(previewUrlsRef.current).forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, []);

  // ── Image Handlers ───────────────────────────────────────────────────────────
  const applyFileForSide = useCallback(async (side: ProductSide, file: File) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setError(`Unsupported file type on ${side} side (${file.type || 'unknown'}). Please upload a JPG, JPEG, PNG, or WEBP image.`);
      return;
    }

    try {
      // 1. Run lightweight client-side quality check
      const quality = await checkImageQuality(file);

      // 2. Compress and resize safely to max 1600px
      const compressed = await compressImage(file, 1600, 0.88);

      // Revoke old side preview URL
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

  // Quick primary actions
  const handlePrimaryCameraClick = () => {
    // Pick the first empty side, or default to front
    const emptySide = (PRODUCT_SIDES.find((s) => !images[s.side])?.side) || 'front';
    setCameraModal({ isOpen: true, side: emptySide });
  };

  const handlePrimaryGalleryClick = () => {
    generalGalleryInputRef.current?.click();
  };

  const handleGeneralGallerySelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (!selectedFiles.length) return;

    // Fill empty slots in order: front, back, left, right
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
      // Re-run quality & compression on the newly cropped region
      const compressed = await compressImage(croppedFile, 1600, 0.9);
      const quality = await checkImageQuality(compressed);

      // Revoke old URL
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

  // Count how many images are currently loaded
  const selectedCount = Object.values(images).filter(Boolean).length;

  // ── Multi-Image Scan Handler ─────────────────────────────────────────────────
  const handleScan = async () => {
    if (selectedCount === 0 || isScanning) {
      if (selectedCount === 0) {
        setError('Please upload or capture at least one product label image to proceed.');
      }
      return;
    }

    setIsScanning(true);
    setError('');
    setCurrentStageIdx(0);

    const stageInterval = setInterval(() => {
      setCurrentStageIdx((prev) => (prev < PROGRESS_STAGES.length - 1 ? prev + 1 : prev));
    }, 2200);

    try {
      const formData = new FormData();
      const activeSides: string[] = [];

      // Append all selected images under 'images' and record side names in order
      (Object.keys(images) as ProductSide[]).forEach((side) => {
        const file = images[side];
        if (file) {
          formData.append('images', file);
          activeSides.push(side);
        }
      });

      // Backward compatibility: also append first image under 'image'
      const firstSide = activeSides[0] as ProductSide;
      if (firstSide && images[firstSide]) {
        formData.append('image', images[firstSide] as File);
      }

      // Send JSON sides mapping
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

      if (res.status === 401) {
        throw new Error('Your session has expired. Please log in again.');
      }

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || 'Backend could not process the product scan. Please try again.');
      }

      const data = await res.json();
      setScanResult(data);

      // Populate editable metrology fields from AI extraction
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

  // ── Field Edit Handler ───────────────────────────────────────────────────────
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

      if (res.status === 401) {
        throw new Error('Your session has expired. Please log in again.');
      }

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

  // ── Reset ────────────────────────────────────────────────────────────────────
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
    setActiveSideTab('all');
    setStep('UPLOAD');
  };

  // ── Derived Metrics ──────────────────────────────────────────────────────────
  const violationCodes = new Set((scanResult?.violations || []).map((v: any) => v.rule_code));
  const isCompliant = (scanResult?.violations?.length === 0) || scanResult?.status === 'compliant';
  const passCount    = METROLOGY_FIELDS.filter((f) => !violationCodes.has(f.ruleCode) && fields[f.key]?.trim()).length;
  const failCount    = (scanResult?.violations || []).filter((v: any) => v.severity === 'HIGH').length;
  const warnCount    = (scanResult?.violations || []).filter((v: any) => v.severity === 'MEDIUM').length;

  const getFieldStatus = (f: FieldConfig) => {
    if (violationCodes.has(f.ruleCode)) {
      const sev = (scanResult?.violations || []).find((v: any) => v.rule_code === f.ruleCode)?.severity;
      return sev === 'HIGH' ? 'FAIL' : 'WARN';
    }
    return fields[f.key]?.trim() ? 'PASS' : 'MISSING';
  };

  const currentStepIdx = STEPS.findIndex((s) => s.id === step);
  const sidesOcr = scanResult?.extracted_fields?.sides_ocr || {};

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", background: '#f0f4f8', minHeight: '100vh' }}>

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div style={{ background: 'linear-gradient(135deg, #0f2027 0%, #1a3a5c 60%, #0f2027 100%)', padding: '28px 20px 24px', color: '#fff' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <ShieldCheck size={22} color="#60a5fa" />
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: '#93c5fd', textTransform: 'uppercase' }}>
                  Legal Metrology Compliance · Multi-Side Scanner
                </span>
              </div>
              <h1 style={{ fontSize: 'clamp(18px, 4vw, 26px)', fontWeight: 800, margin: 0, letterSpacing: '-0.01em' }}>
                Product Label Multi-Side Compliance Scanner
              </h1>
              <p style={{ fontSize: 13, color: '#94a3b8', margin: '6px 0 0', lineHeight: 1.4 }}>
                Capture or upload up to 4 sides of the packaged product (Front, Back, Left, Right), crop text areas, and run AI Legal Metrology compliance.
              </p>
            </div>
            {step !== 'UPLOAD' && (
              <button
                type="button"
                onClick={startOver}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#e2e8f0', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                <RotateCcw size={14} /> Start Over
              </button>
            )}
          </div>

          {/* ── Progress Stepper ──────────────────────────────────────── */}
          <div style={{ display: 'flex', alignItems: 'center', marginTop: 24, gap: 0 }}>
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const active  = i === currentStepIdx;
              const done    = i < currentStepIdx;
              const future  = i > currentStepIdx;
              return (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? '1' : 'none' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: done ? '#22c55e' : active ? '#3b82f6' : 'rgba(255,255,255,0.1)',
                      border: active ? '2px solid #93c5fd' : done ? '2px solid #16a34a' : '2px solid rgba(255,255,255,0.2)',
                      transition: 'all 0.3s',
                    }}>
                      {done ? <CheckCircle2 size={18} color="#fff" /> : <Icon size={16} color={future ? '#64748b' : '#fff'} />}
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: done ? '#86efac' : active ? '#93c5fd' : '#64748b', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div style={{ flex: 1, height: 2, background: done ? '#22c55e' : 'rgba(255,255,255,0.1)', margin: '0 8px', marginBottom: 20, transition: 'background 0.3s' }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Main Content ────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '24px 16px 48px' }}>

        {/* Error Banner */}
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderLeft: '4px solid #ef4444', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 20 }}>
            <XCircle size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ margin: 0, fontWeight: 700, color: '#991b1b', fontSize: 14 }}>Scan Error</p>
              <p style={{ margin: '2px 0 0', color: '#b91c1c', fontSize: 13 }}>{error}</p>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            STEP 1: UPLOAD & CROP (Modern Scan UI with 4 Product Sides)
        ════════════════════════════════════════════════════════════════ */}
        {step === 'UPLOAD' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Top Action Bar: Primary options (Use Camera / Upload Images) */}
            <div style={{
              background: '#fff',
              borderRadius: 16,
              border: '1px solid #e2e8f0',
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 16,
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#1e293b' }}>
                  Product Packaging Scanner
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
                  Use camera or gallery upload. Capture 1 to 4 sides of the packaged item.
                </p>
              </div>

              {/* Primary Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handlePrimaryCameraClick}
                  disabled={isScanning}
                  style={{
                    background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 10,
                    padding: '11px 20px',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: isScanning ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: '0 4px 12px rgba(59,130,246,0.25)',
                    transition: 'all 0.2s',
                  }}
                >
                  <Camera size={18} /> Use Camera
                </button>

                <button
                  type="button"
                  onClick={handlePrimaryGalleryClick}
                  disabled={isScanning}
                  style={{
                    background: '#f8fafc',
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    borderRadius: 10,
                    padding: '11px 20px',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: isScanning ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'all 0.2s',
                  }}
                >
                  <Upload size={18} color="#475569" /> Upload Images
                </button>

                {/* Hidden general gallery input (supports multi-select) */}
                <input
                  ref={generalGalleryInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  multiple
                  onChange={handleGeneralGallerySelect}
                  style={{ display: 'none' }}
                />
              </div>
            </div>

            {/* Product Side Slots Overview Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, padding: '0 4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Layers size={18} color="#3b82f6" />
                <span style={{ fontSize: 14, fontWeight: 800, color: '#1e293b' }}>
                  Product Side Slots (Front, Back, Left, Right)
                </span>
              </div>
              <span style={{
                fontSize: 12,
                fontWeight: 700,
                padding: '4px 12px',
                borderRadius: 16,
                background: selectedCount > 0 ? '#ecfdf5' : '#f1f5f9',
                color: selectedCount > 0 ? '#059669' : '#64748b',
                border: `1px solid ${selectedCount > 0 ? '#a7f3d0' : '#e2e8f0'}`,
              }}>
                {selectedCount} of 4 Images Loaded
              </span>
            </div>

            {/* 4 Cards Grid (Desktop: 2x2, Mobile: 1-col) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
              {PRODUCT_SIDES.map((sideConfig) => {
                const side = sideConfig.side;
                const preview = previewUrls[side];
                const quality = qualityInfo[side];

                return (
                  <div
                    key={side}
                    style={{
                      background: '#fff',
                      borderRadius: 16,
                      border: `1.5px solid ${preview ? '#93c5fd' : '#e2e8f0'}`,
                      boxShadow: preview ? '0 4px 14px rgba(59,130,246,0.08)' : '0 1px 4px rgba(0,0,0,0.03)',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                    }}
                  >
                    {/* Card Header */}
                    <div style={{
                      padding: '12px 16px',
                      background: preview ? '#f0f7ff' : '#f8fafc',
                      borderBottom: '1px solid #f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 16 }}>{sideConfig.icon}</span>
                        <div>
                          <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#1e293b', textTransform: 'uppercase' }}>
                            {sideConfig.label}
                          </h4>
                          <span style={{ fontSize: 11, color: '#64748b' }}>{sideConfig.description}</span>
                        </div>
                      </div>

                      {preview ? (
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '2px 8px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Check size={11} /> Ready
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', background: '#f1f5f9', padding: '2px 8px', borderRadius: 12 }}>
                          Empty
                        </span>
                      )}
                    </div>

                    {/* Card Body */}
                    <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      {!preview ? (
                        // State 1: EMPTY
                        <div
                          style={{
                            border: '2px dashed #cbd5e1',
                            borderRadius: 12,
                            padding: '24px 12px',
                            textAlign: 'center',
                            background: '#fafbfc',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 10,
                            minHeight: 180,
                          }}
                        >
                          <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ImageIcon size={20} color="#3b82f6" />
                          </div>
                          <div>
                            <p style={{ margin: 0, fontWeight: 700, color: '#1e293b', fontSize: 13 }}>
                              {sideConfig.label}
                            </p>
                            <p style={{ margin: '3px 0 0', color: '#94a3b8', fontSize: 11 }}>
                              JPG, JPEG, PNG, WEBP
                            </p>
                          </div>
                          <div style={{ display: 'flex', gap: 8, marginTop: 4, width: '100%', maxWidth: 220 }}>
                            <button
                              type="button"
                              onClick={() => setCameraModal({ isOpen: true, side })}
                              style={{
                                flex: 1,
                                background: '#1e40af',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 8,
                                padding: '8px 10px',
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 4,
                              }}
                            >
                              <Camera size={13} /> Capture
                            </button>
                            <button
                              type="button"
                              onClick={() => fileInputsRef[side].current?.click()}
                              style={{
                                flex: 1,
                                background: '#f1f5f9',
                                color: '#475569',
                                border: '1px solid #e2e8f0',
                                borderRadius: 8,
                                padding: '8px 10px',
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 4,
                              }}
                            >
                              <Upload size={13} /> Upload
                            </button>
                          </div>
                        </div>
                      ) : (
                        // State 3 & 5: IMAGE PREVIEW / READY
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {/* Image preview box */}
                          <div style={{
                            height: 180,
                            borderRadius: 10,
                            overflow: 'hidden',
                            border: '1px solid #e2e8f0',
                            background: '#0f172a',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                          }}>
                            <img
                              src={preview}
                              alt={`${sideConfig.label} preview`}
                              style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                            />
                            {quality.dimensions && (
                              <span style={{ position: 'absolute', bottom: 6, right: 6, background: 'rgba(0,0,0,0.65)', color: '#fff', fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4 }}>
                                {quality.dimensions}
                              </span>
                            )}
                          </div>

                          {/* Quality Check Warnings (if any) */}
                          {quality.warnings.length > 0 && (
                            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '6px 10px', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                              <AlertCircle size={13} color="#d97706" style={{ flexShrink: 0, marginTop: 1 }} />
                              <div style={{ fontSize: 11, color: '#92400e', lineHeight: 1.4 }}>
                                {quality.warnings.map((w, idx) => (
                                  <div key={idx}>{w}</div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Action Toolbar */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                            <button
                              type="button"
                              onClick={() => handleOpenCrop(side)}
                              style={{
                                background: '#eff6ff',
                                color: '#2563eb',
                                border: '1px solid #bfdbfe',
                                borderRadius: 8,
                                padding: '7px 0',
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 4,
                                transition: 'background 0.2s',
                              }}
                            >
                              <Crop size={13} /> Crop
                            </button>

                            <button
                              type="button"
                              onClick={() => setCameraModal({ isOpen: true, side })}
                              style={{
                                background: '#f8fafc',
                                color: '#475569',
                                border: '1px solid #e2e8f0',
                                borderRadius: 8,
                                padding: '7px 0',
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 4,
                              }}
                            >
                              <RefreshCw size={13} /> Retake
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRemoveSide(side)}
                              style={{
                                background: '#fef2f2',
                                color: '#dc2626',
                                border: '1px solid #fecaca',
                                borderRadius: 8,
                                padding: '7px 0',
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 4,
                              }}
                            >
                              <Trash2 size={13} /> Remove
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Hidden File Input for this specific side */}
                      <input
                        ref={fileInputsRef[side]}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={(e) => handleFileInput(side, e)}
                        style={{ display: 'none' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Scan CTA Card */}
            <div style={{
              background: '#fff',
              borderRadius: 16,
              border: '1px solid #e2e8f0',
              padding: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 14,
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Info size={18} color="#3b82f6" />
                <span style={{ fontSize: 13, color: '#475569' }}>
                  {selectedCount === 0
                    ? 'Upload or capture at least one product label image (Front, Back, Left, or Right) to start compliance scan.'
                    : `Ready to analyze ${selectedCount} packaging image${selectedCount > 1 ? 's' : ''} with PaddleOCR and Gemini Vision.`}
                </span>
              </div>

              <button
                type="button"
                onClick={handleScan}
                disabled={selectedCount === 0 || isScanning}
                style={{
                  background: selectedCount === 0 || isScanning ? '#94a3b8' : 'linear-gradient(135deg, #1d4ed8, #4f46e5)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  padding: '12px 32px',
                  fontSize: 15,
                  fontWeight: 800,
                  cursor: selectedCount === 0 || isScanning ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: selectedCount > 0 && !isScanning ? '0 4px 16px rgba(37,99,235,0.35)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                {isScanning ? (
                  <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Analyzing product labels…</>
                ) : (
                  <><ScanLine size={18} /> Scan Product Labels ({selectedCount})</>
                )}
              </button>
            </div>

            {/* ── Scanning Progress Modal / Overlay (Part 9 & 10) ──────────── */}
            {isScanning && (
              <div style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(6px)',
                zIndex: 60,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 16,
              }}>
                <div style={{
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: 20,
                  padding: '32px 28px',
                  maxWidth: 480,
                  width: '100%',
                  color: '#fff',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 20,
                }}>
                  {/* Progress Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(59,130,246,0.2)', color: '#60a5fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#f8fafc' }}>
                        Analyzing Product Labels
                      </h3>
                      <p style={{ margin: '2px 0 0', fontSize: 12, color: '#94a3b8' }}>
                        Processing {selectedCount} packaging image{selectedCount > 1 ? 's' : ''} through compliance pipeline
                      </p>
                    </div>
                  </div>

                  {/* Multi-stage Progress Stepper */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, background: '#0f172a', padding: '16px 18px', borderRadius: 12, border: '1px solid #1e293b' }}>
                    {PROGRESS_STAGES.map((stageText, idx) => {
                      const isDone = idx < currentStageIdx;
                      const isCurrent = idx === currentStageIdx;
                      return (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, background: isDone ? '#22c55e' : isCurrent ? '#3b82f6' : '#334155', color: '#fff', flexShrink: 0 }}>
                            {isDone ? '✓' : isCurrent ? '⏳' : idx + 1}
                          </div>
                          <span style={{ fontSize: 12, color: isDone ? '#86efac' : isCurrent ? '#93c5fd' : '#64748b', fontWeight: isCurrent ? 700 : 500 }}>
                            {stageText}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <p style={{ margin: 0, fontSize: 11, color: '#64748b', textAlign: 'center' }}>
                    Please wait while LegalMetriX extracts declarations and verifies packaging rules.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            STEP 2: EXTRACT — Multi-Side Image & OCR Viewer + AI Fields
        ════════════════════════════════════════════════════════════════ */}
        {(step === 'EXTRACT' || step === 'REVIEW') && scanResult && (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 1.9fr)', gap: 20, alignItems: 'start' }}>

            {/* ── Left Column: Multi-Side Images & OCR text ──────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Scanned Images Card */}
              <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 1px 6px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ImageIcon size={15} color="#3b82f6" />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>Product Images ({selectedCount || 1})</span>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '2px 8px', borderRadius: 12 }}>
                    ✓ OCR Extracted
                  </span>
                </div>

                <div style={{ padding: 14 }}>
                  {/* Side Selector Tabs if multi-images present */}
                  <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => setActiveSideTab('all')}
                      style={{
                        background: activeSideTab === 'all' ? '#1d4ed8' : '#f1f5f9',
                        color: activeSideTab === 'all' ? '#fff' : '#475569',
                        border: 'none',
                        borderRadius: 6,
                        padding: '5px 10px',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      All Sides
                    </button>
                    {PRODUCT_SIDES.map((s) => {
                      if (!previewUrls[s.side]) return null;
                      const active = activeSideTab === s.side;
                      return (
                        <button
                          key={s.side}
                          type="button"
                          onClick={() => setActiveSideTab(s.side)}
                          style={{
                            background: active ? '#1d4ed8' : '#f1f5f9',
                            color: active ? '#fff' : '#475569',
                            border: 'none',
                            borderRadius: 6,
                            padding: '5px 10px',
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer',
                            textTransform: 'capitalize',
                          }}
                        >
                          {s.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Display Active Preview */}
                  <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #e2e8f0', background: '#f8fafc', minHeight: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {activeSideTab !== 'all' && previewUrls[activeSideTab as ProductSide] ? (
                      <img
                        src={previewUrls[activeSideTab as ProductSide]}
                        alt="Product Side View"
                        style={{ width: '100%', maxHeight: 280, objectFit: 'contain', display: 'block' }}
                      />
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: selectedCount > 1 ? '1fr 1fr' : '1fr', gap: 8, padding: 8, width: '100%' }}>
                        {PRODUCT_SIDES.map((s) => {
                          const src = previewUrls[s.side];
                          if (!src) return null;
                          return (
                            <div key={s.side} style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #cbd5e1', background: '#fff', position: 'relative' }}>
                              <img src={src} alt={s.label} style={{ width: '100%', height: 120, objectFit: 'contain', display: 'block' }} />
                              <span style={{ position: 'absolute', bottom: 4, left: 4, background: 'rgba(15,23,42,0.75)', color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>
                                {s.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Raw OCR Card (Per Side / Combined) */}
              <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 1px 6px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FileText size={15} color="#6366f1" />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>Raw OCR Text</span>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, background: '#eef2ff', color: '#4f46e5', padding: '3px 8px', borderRadius: 20, border: '1px solid #c7d2fe' }}>
                    {activeSideTab === 'all' ? 'COMBINED OCR' : `${activeSideTab.toUpperCase()} SIDE`}
                  </span>
                </div>
                <div style={{ padding: 12 }}>
                  <div style={{
                    background: '#0f172a',
                    borderRadius: 8,
                    padding: '12px 14px',
                    maxHeight: 240,
                    overflowY: 'auto',
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 12,
                    lineHeight: 1.7,
                    color: '#e2e8f0',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}>
                    {activeSideTab !== 'all' && sidesOcr[activeSideTab]?.full_text ? (
                      sidesOcr[activeSideTab].full_text
                    ) : (
                      scanResult.ocr_raw_text || <span style={{ color: '#64748b', fontStyle: 'italic' }}>No OCR text detected.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Right Column: AI Extracted Fields ──────────────────── */}
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 1px 6px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
              <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Sparkles size={16} color="#8b5cf6" />
                    <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#1e293b' }}>AI Extracted Declarations</h2>
                  </div>
                  <button
                    type="button"
                    onClick={startOver}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                  >
                    <RotateCcw size={12} /> Start Over
                  </button>
                </div>
                <p style={{ margin: '6px 0 0', fontSize: 13, color: '#64748b' }}>
                  Review and verify structured declarations extracted from packaging images before running the compliance engine.
                </p>
              </div>

              {/* Review notice */}
              <div style={{ margin: '16px 20px 0', padding: '10px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <AlertTriangle size={15} color="#d97706" style={{ flexShrink: 0, marginTop: 1 }} />
                <p style={{ margin: 0, fontSize: 12, color: '#92400e', lineHeight: 1.5 }}>
                  <strong>Inspector Verification:</strong> AI auto-populated detected declarations from all sides. Please verify or edit any field marked with <strong>Review Required</strong> before finalizing compliance.
                </p>
              </div>

              {/* Fields List */}
              <div style={{ padding: '16px 20px 8px' }}>
                {METROLOGY_FIELDS.map((f) => {
                  const val = fields[f.key] || '';
                  const isEmpty = !val.trim();
                  const aiExtracted = !!getGeminiField(scanResult, f.key);

                  return (
                    <div key={f.key} style={{ marginBottom: 18, paddingBottom: 18, borderBottom: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                        <label style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>
                          {f.icon} {f.label}
                        </label>
                        {aiExtracted && !isEmpty && (
                          <span style={{ fontSize: 10, fontWeight: 700, background: '#f5f3ff', color: '#7c3aed', padding: '2px 7px', borderRadius: 20, border: '1px solid #ddd6fe' }}>
                            ✨ AI Extracted
                          </span>
                        )}
                        {isEmpty && (
                          <span style={{ fontSize: 10, fontWeight: 700, background: '#fff7ed', color: '#c2410c', padding: '2px 7px', borderRadius: 20, border: '1px solid #fed7aa', display: 'flex', alignItems: 'center', gap: 3 }}>
                            <AlertTriangle size={9} /> Review Required
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={val}
                        onChange={(e) => handleField(f.key, e.target.value)}
                        placeholder={isEmpty ? 'Not detected — enter manually' : ''}
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          padding: '10px 12px',
                          borderRadius: 8,
                          border: `1.5px solid ${isEmpty ? '#fed7aa' : '#d1fae5'}`,
                          background: isEmpty ? '#fffbf7' : '#f0fdf4',
                          fontSize: 13,
                          color: '#1e293b',
                          fontFamily: 'inherit',
                          outline: 'none',
                          transition: 'border-color 0.2s',
                        }}
                        onFocus={(e) => (e.target.style.borderColor = '#3b82f6')}
                        onBlur={(e) => (e.target.style.borderColor = isEmpty ? '#fed7aa' : '#d1fae5')}
                      />
                      <p style={{ margin: '4px 0 0', fontSize: 11, color: '#94a3b8' }}>{f.condition}</p>
                    </div>
                  );
                })}
              </div>

              {/* Check Compliance CTA */}
              <div style={{ padding: '16px 20px 20px', borderTop: '1px solid #f1f5f9' }}>
                <div style={{ marginBottom: 14, padding: '10px 14px', background: '#f0f9ff', borderRadius: 8, border: '1px solid #bae6fd' }}>
                  <p style={{ margin: 0, fontSize: 12, color: '#0c4a6e', lineHeight: 1.5 }}>
                    <strong>Ready to verify?</strong> The Legal Metrology rule engine will evaluate your verified declarations across all packaging rules.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCompliance}
                  disabled={isVerifying}
                  style={{
                    width: '100%',
                    background: isVerifying ? '#6366f1' : 'linear-gradient(135deg, #1d4ed8, #4f46e5)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 10,
                    padding: '14px 0',
                    fontSize: 15,
                    fontWeight: 800,
                    cursor: isVerifying ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    boxShadow: '0 4px 14px rgba(79,70,229,0.35)',
                    transition: 'all 0.2s',
                    letterSpacing: '0.02em',
                  }}
                >
                  {isVerifying ? (
                    <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Running Metrology Verification…</>
                  ) : (
                    <><ShieldCheck size={18} /> Check Compliance</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            STEP 4: COMPLIANCE RESULT
        ════════════════════════════════════════════════════════════════ */}
        {step === 'COMPLIANCE' && scanResult && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Result Banner */}
            <div style={{
              borderRadius: 16,
              border: `1px solid ${isCompliant ? '#bbf7d0' : '#fecaca'}`,
              background: isCompliant ? 'linear-gradient(135deg, #f0fdf4, #dcfce7)' : 'linear-gradient(135deg, #fef2f2, #fee2e2)',
              padding: '24px 28px',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 20,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{
                  width: 60, height: 60, borderRadius: '50%',
                  background: isCompliant ? '#22c55e' : '#ef4444',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 4px 16px ${isCompliant ? 'rgba(34,197,94,0.35)' : 'rgba(239,68,68,0.35)'}`,
                }}>
                  {isCompliant ? <CheckCircle2 size={30} color="#fff" /> : <XCircle size={30} color="#fff" />}
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: isCompliant ? '#166534' : '#991b1b', textTransform: 'uppercase', marginBottom: 4 }}>
                    Compliance Result
                  </div>
                  <div style={{ fontSize: 'clamp(22px, 4vw, 30px)', fontWeight: 900, color: isCompliant ? '#15803d' : '#dc2626', letterSpacing: '-0.02em' }}>
                    {isCompliant ? '✓ COMPLIANT' : '✕ NON-COMPLIANT'}
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: isCompliant ? '#166534' : '#991b1b' }}>
                    {isCompliant
                      ? 'All mandatory packaging declarations are present and compliant under LMR 2011.'
                      : `${failCount + warnCount} violation(s) found. Corrective action required.`}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                {[
                  { label: 'PASS',     value: passCount,  color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
                  { label: 'WARNINGS', value: warnCount,  color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
                  { label: 'FAILURES', value: failCount,  color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
                ].map((m) => (
                  <div key={m.label} style={{ background: m.bg, border: `1px solid ${m.border}`, borderRadius: 10, padding: '10px 18px', textAlign: 'center', minWidth: 72 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: m.color, letterSpacing: '0.08em', marginBottom: 4 }}>{m.label}</div>
                    <div style={{ fontSize: 28, fontWeight: 900, color: m.color, lineHeight: 1 }}>{m.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Checklist Table */}
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
                <ClipboardCheck size={15} color="#6366f1" />
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1e293b' }}>Field Verification Checklist</h3>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                      {['Field', 'Extracted Value', 'Rule', 'Status', 'Notes'].map((h) => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 800, color: '#64748b', letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {METROLOGY_FIELDS.map((f) => {
                      const st = step === 'COMPLIANCE' ? getFieldStatus(f) : 'MISSING';
                      const val = fields[f.key];
                      const violation = (scanResult?.violations || []).find((v: any) => v.rule_code === f.ruleCode);
                      const badge = {
                        PASS:    { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0', label: '✓ PASS' },
                        FAIL:    { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', label: '✕ FAIL' },
                        WARN:    { bg: '#fffbeb', color: '#d97706', border: '#fde68a', label: '⚠ WARN' },
                        MISSING: { bg: '#f8fafc', color: '#94a3b8', border: '#e2e8f0', label: '— N/A' },
                      }[st] || { bg: '#f8fafc', color: '#94a3b8', border: '#e2e8f0', label: '— N/A' };

                      return (
                        <tr key={f.key} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '10px 14px', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>{f.icon} {f.label}</td>
                          <td style={{ padding: '10px 14px', fontFamily: '"JetBrains Mono", monospace', fontSize: 12, color: val ? '#1e293b' : '#94a3b8', fontStyle: val ? 'normal' : 'italic', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={val}>
                            {val || 'Not declared'}
                          </td>
                          <td style={{ padding: '10px 14px', color: '#6366f1', fontSize: 11, fontWeight: 700 }}>{f.ruleCode}</td>
                          <td style={{ padding: '10px 14px' }}>
                            <span style={{ fontSize: 10, fontWeight: 800, background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`, padding: '3px 9px', borderRadius: 20 }}>
                              {badge.label}
                            </span>
                          </td>
                          <td style={{ padding: '10px 14px', fontSize: 12, color: violation ? '#b91c1c' : '#16a34a' }}>
                            {violation ? violation.rule_description || 'Violation detected.' : val ? 'Declaration present.' : 'Not found on label.'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setStep('EXTRACT')}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: '1px solid #e2e8f0', color: '#475569', padding: '12px 24px', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
              >
                <ChevronRight size={15} style={{ transform: 'rotate(180deg)' }} /> Back to Review
              </button>
              <a
                href={`${apiUrl}/api/scans/${scanResult.id}/report`}
                target="_blank"
                rel="noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f8fafc', border: '1px solid #cbd5e1', color: '#1e293b', padding: '12px 24px', borderRadius: 10, fontSize: 14, fontWeight: 700, textDecoration: 'none' }}
              >
                <FileText size={15} color="#2563eb" /> Download PDF Report
              </a>
              <button
                type="button"
                onClick={startOver}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg, #0f2027, #1a3a5c)', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(15,32,39,0.3)' }}
              >
                <RotateCcw size={15} /> Start New Inspection
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Camera Capture Modal ─────────────────────────────────────────── */}
      <CameraCapture
        isOpen={cameraModal.isOpen}
        sideLabel={cameraModal.side ? cameraModal.side.toUpperCase() : 'PRODUCT'}
        onCapture={(file) => {
          if (cameraModal.side) {
            applyFileForSide(cameraModal.side, file);
          }
        }}
        onClose={() => setCameraModal({ isOpen: false, side: null })}
      />

      {/* ── Client-side Image Crop Modal ─────────────────────────────────── */}
      <ImageCropModal
        isOpen={cropModal.isOpen}
        imageSrc={cropModal.imageSrc}
        sideLabel={cropModal.side ? cropModal.side.toUpperCase() : 'PRODUCT'}
        onClose={() => setCropModal({ isOpen: false, side: null, imageSrc: '' })}
        onSaveCrop={handleSaveCrop}
        onSkipCrop={() => setCropModal({ isOpen: false, side: null, imageSrc: '' })}
      />

      {/* CSS Keyframes */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
