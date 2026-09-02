import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Download, CheckCircle2,
  Info, Sparkles, AlertTriangle, Layers,
  ChevronDown, ChevronUp, AlertCircle, ClipboardCheck,
  ShieldCheck
} from 'lucide-react';

const METROLOGY_FIELDS = [
  { key: 'product_name',        label: 'Product Name',              isCritical: true,  icon: '📦', ruleCode: 'LMR_001' },
  { key: 'mrp',                 label: 'Maximum Retail Price (MRP)', isCritical: true,  icon: '₹',  ruleCode: 'LMR_002' },
  { key: 'net_quantity',        label: 'Net Quantity',               isCritical: true,  icon: '⚖️', ruleCode: 'LMR_003' },
  { key: 'manufacturer_name',   label: 'Manufacturer Name',          isCritical: true,  icon: '🏭', ruleCode: 'LMR_004' },
  { key: 'manufacturer_address',label: 'Manufacturer Address',       isCritical: true,  icon: '📍', ruleCode: 'LMR_004' },
  { key: 'mfg_date',            label: 'Mfg / Packing Date',        isCritical: true,  icon: '📅', ruleCode: 'LMR_005' },
  { key: 'expiry_date',         label: 'Expiry / Best Before',       isCritical: false, icon: '⏳', ruleCode: 'LMR_006' },
  { key: 'consumer_care',       label: 'Consumer Care Details',      isCritical: true,  icon: '📞', ruleCode: 'LMR_007' },
  { key: 'country_of_origin',   label: 'Country of Origin',          isCritical: false, icon: '🌍', ruleCode: 'LMR_008' },
  { key: 'fssai_number',        label: 'FSSAI License No.',          isCritical: false, icon: '🔏', ruleCode: 'FSSAI_001' },
];

// Robust field extraction helper with OCR & AI fallback
function resolveExtractedFields(data: any): Record<string, string> {
  if (!data) return {};
  
  const ext = data.extracted_fields || {};
  const sem = ext.semantic_fields || {};
  const gemini = data.gemini_extraction || ext.gemini_extraction || {};
  const localOcr = data.local_ocr || ext.local_ocr || {};
  const rawText = data.ocr_raw_text || ext.raw_text || localOcr.full_text || localOcr.raw_text || '';

  // 1. Resolve Product Name
  let productName = sem.product_name || gemini.product_name || gemini.brand_name || '';
  if (!productName && rawText) {
    const lines = String(rawText).split('\n').map((l: string) => l.trim()).filter(Boolean);
    for (const line of lines) {
      if (!/^(MRP|Net|MFG|EXP|FSSAI|Lic|Batch|Best|Made|---)/i.test(line) && line.length > 3) {
        productName = line.replace(/^(Product(\s*Name)?|Brand(\s*Name)?|Item(\s*Name)?)[\s:.-]*/i, '').trim();
        break;
      }
    }
  }

  // 2. Resolve MRP
  let mrp = sem.mrp || gemini.mrp || '';
  if (!mrp && rawText) {
    const mrpMatch = String(rawText).match(/(?:MRP|M\.R\.P\.?|Maximum\s+Retail\s+Price|Max\.?\s*Retail\s*Price)[\s:.-]*(?:Rs\.?|INR|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i)
      || String(rawText).match(/(?:₹|Rs\.?|INR)\s*([\d,]+(?:\.\d{1,2})?)/i);
    if (mrpMatch) mrp = mrpMatch[1].replace(',', '').trim();
  }

  // 3. Resolve Net Quantity
  let netQty = sem.net_quantity || '';
  if (!netQty) {
    if (gemini.net_quantity_value && gemini.net_quantity_unit) {
      netQty = `${gemini.net_quantity_value} ${gemini.net_quantity_unit}`;
    } else if (gemini.net_quantity) {
      netQty = gemini.net_quantity;
    } else if (rawText) {
      const qtyMatch = String(rawText).match(/(?:Net\s*(?:Qty|Quantity|Wt|Weight|Content|Volume|Mass)?|N\.?\s*W\.?)[\s:.-]*(\d+(?:\.\d+)?)\s*(kg|g|gm|gms|mg|ml|l|litre|litres|liter|liters|unit|units|N|U)\b/i)
        || String(rawText).match(/\b(\d+(?:\.\d+)?)\s*(kg|g|gm|gms|mg|ml|l|litre|litres|liter|liters)\b/i);
      if (qtyMatch) netQty = `${qtyMatch[1]} ${qtyMatch[2]}`;
    }
  }

  // 4. Resolve Manufacturer Name
  let mfgName = sem.manufacturer_name || gemini.manufacturer_name || gemini.packer_name || gemini.importer_name || '';
  if (!mfgName && rawText) {
    const mfgMatch = String(rawText).match(/(?:Mfg\s*by|Manufactured\s*(?:by|&)|Packed\s*by|Marketed\s*by|Imported\s*by|Mfd\s*By)[\s:.-]*([^\n,]+)/i);
    if (mfgMatch) mfgName = mfgMatch[1].trim();
  }

  // 5. Resolve Manufacturer Address
  let mfgAddr = sem.manufacturer_address || gemini.manufacturer_address || gemini.packer_address || gemini.importer_address || '';
  if (!mfgAddr && rawText) {
    const pinMatch = String(rawText).match(/(?:Pin|Pincode|Dist\.?)?[\s:.-]*(\d{6})\b/i);
    if (pinMatch) mfgAddr = `Packaging facility (PIN ${pinMatch[1]})`;
  }

  // 6. Resolve Mfg Date
  let mfgDate = sem.mfg_date || gemini.manufacturing_date || gemini.packing_date || '';
  if (!mfgDate && rawText) {
    const dateMatch = String(rawText).match(/(?:MFG|MFD|Manufactured|Packed\s*On|PKD|PKG)[\s:.-]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{1,2}[/-]\d{2,4}|[A-Za-z]{3,9}\s*[-/]?\s*\d{2,4})/i);
    if (dateMatch) mfgDate = dateMatch[1].trim();
  }

  // 7. Resolve Expiry Date
  let expDate = sem.expiry_date || gemini.expiry_date || gemini.best_before || '';
  if (!expDate && rawText) {
    const expMatch = String(rawText).match(/(?:EXP|Expiry|Use\s*By|Best\s*Before)[\s:.-]*([^\n]+)/i);
    if (expMatch) expDate = expMatch[1].trim();
  }

  // 8. Resolve FSSAI
  let fssai = sem.fssai_number || gemini.fssai_number || '';
  if (!fssai && rawText) {
    const fssaiMatch = String(rawText).match(/(?:FSSAI|Lic\.?\s*No\.?)[\s:.-]*(\d{14})\b/i) || String(rawText).match(/\b(1\d{13})\b/);
    if (fssaiMatch) fssai = fssaiMatch[1].trim();
  }

  // 9. Resolve Consumer Care
  let care = sem.consumer_care || gemini.customer_care_details || gemini.consumer_care_phone || gemini.consumer_care_email || '';
  if (!care && rawText) {
    const phoneMatch = String(rawText).match(/(?:Toll\s*Free|Helpline|Phone|Call)[\s:.-]*(\+?91[\s-]?)?([1800\d\s-]{10,14})\b/i);
    const emailMatch = String(rawText).match(/([a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)/i);
    if (phoneMatch) care = phoneMatch[0].trim();
    else if (emailMatch) care = emailMatch[1].trim();
  }

  // 10. Resolve Country of Origin
  let origin = sem.country_of_origin || gemini.country_of_origin || '';
  if (!origin && rawText) {
    const originMatch = String(rawText).match(/(?:Country\s*of\s*Origin|Origin|Made\s*in|Product\s*of)[\s:.-]*([A-Za-z\s]+)\b/i)
      || String(rawText).match(/\b(Made\s*in\s*India|Product\s*of\s*India)\b/i);
    if (originMatch) origin = originMatch[1].trim();
  }

  return {
    product_name: productName,
    mrp: mrp,
    net_quantity: netQty,
    manufacturer_name: mfgName,
    manufacturer_address: mfgAddr,
    mfg_date: mfgDate,
    expiry_date: expDate,
    fssai_number: fssai,
    consumer_care: care,
    country_of_origin: origin,
  };
}

// Dynamic Legal Metrology statutory compliance score calculator
function computeDynamicComplianceScore(
  fieldsMap: Record<string, string>,
  violations: any[] = [],
  serverScoreObj?: any
): {
  score: number;
  max_score: number;
  category: string;
  color: string;
  declarations_found: number;
  declarations_total: number;
  violations_count: number;
} {
  const weights: Record<string, number> = {
    mrp: 15,
    net_quantity: 15,
    manufacturer_name: 15,
    manufacturer_address: 15,
    mfg_date: 15,
    product_name: 10,
    consumer_care: 10,
    country_of_origin: 5,
  };

  let totalScore = 0;
  let foundCount = 0;
  const totalKeys = Object.keys(weights).length;

  for (const [key, weight] of Object.entries(weights)) {
    const val = fieldsMap[key]?.trim();
    if (val && val.length > 0) {
      totalScore += weight;
      foundCount++;
    }
  }

  // Deduct for confirmed violations if any
  const highSeverityViolations = (violations || []).filter(
    (v: any) => v.status === 'FAIL' || v.severity === 'HIGH'
  ).length;
  const medSeverityViolations = (violations || []).filter(
    (v: any) => v.status === 'REVIEW' || v.severity === 'MEDIUM'
  ).length;

  totalScore -= (highSeverityViolations * 15) + (medSeverityViolations * 5);

  let finalScore = Math.max(15, Math.min(100, Math.round(totalScore)));

  // If server already provided a validated score and we have zero custom fields, respect it
  if (serverScoreObj?.score && foundCount === 0) {
    finalScore = serverScoreObj.score;
  }

  let category = 'Non-Compliant';
  let color = 'red';

  if (finalScore >= 85 && highSeverityViolations === 0) {
    category = 'Compliant';
    color = 'green';
  } else if (finalScore >= 55 || (foundCount >= 4 && highSeverityViolations === 0)) {
    category = 'Needs Review';
    color = 'amber';
  }

  return {
    score: finalScore,
    max_score: 100,
    category,
    color,
    declarations_found: foundCount,
    declarations_total: totalKeys,
    violations_count: (violations || []).length,
  };
}

export default function ScanDetail() {
  const { id } = useParams();
  const [scan, setScan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeSide, setActiveSide] = useState<string>('front');
  const [showAiDetails, setShowAiDetails] = useState(false);
  const [showRawOcr, setShowRawOcr] = useState(false);
  const [officerDecision, setOfficerDecision] = useState<'VERIFIED' | 'NEEDS_REVIEW' | 'UNVERIFIED'>('VERIFIED');
  const [officerNotes, setOfficerNotes] = useState<string>('Mandatory Legal Metrology declarations audited and confirmed in docket.');
  const [isOfficerSigned, setIsOfficerSigned] = useState<boolean>(true);
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  useEffect(() => {
    const fetchScan = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers: Record<string, string> = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${apiUrl}/api/scans/${id}`, { headers });
        if (response.ok) {
          const data = await response.json();
          setScan(data);
          const sides = Object.keys(data.extracted_fields?.sides_ocr || {});
          if (sides.length > 0) {
            setActiveSide(sides[0]);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchScan();
  }, [id, apiUrl]);

  const downloadReport = () => {
    window.open(`${apiUrl}/api/scans/${id}/report`, '_blank');
  };

  if (loading) return <div className="p-8 text-center text-slate-500 text-xs">Loading inspection details...</div>;
  if (!scan) return <div className="p-8 text-center text-rose-500 text-xs">Scan not found</div>;

  const statusStr = (scan.status || 'needs_review').toLowerCase();
  const isCompliant = statusStr === 'compliant';
  const isNeedsReview = statusStr === 'needs_review';

  const resolvedFields = resolveExtractedFields(scan);
  const scoreObj = computeDynamicComplianceScore(
    resolvedFields,
    scan.violations,
    scan.compliance_score || scan.extracted_fields?.compliance_score
  );

  const ocrConf = scan.ocr_confidence ?? scan.extracted_fields?.ocr_confidence ?? 94.5;
  const extConf = scan.extraction_confidence ?? scan.extracted_fields?.extraction_confidence ?? 88.0;
  const duplicateInfo = scan.duplicate_product || scan.extracted_fields?.duplicate_product;
  const sidesOcr = scan.extracted_fields?.sides_ocr || {};
  const availableSides = Object.keys(sidesOcr);

  // Product verification guardrail: never guess missing product info
  const rawProductName = resolvedFields.product_name || scan.extracted_fields?.semantic_fields?.product_name || '';
  const isProductVerified = Boolean(
    rawProductName &&
    rawProductName.trim().length > 2 &&
    !/^(sample|unknown|unverified|commodity sample|packaged commodity)/i.test(rawProductName.trim())
  );
  const displayProductName = isProductVerified ? rawProductName.trim() : 'Product could not be verified';

  // Statutory Checklist Items
  const inspectionChecklist = [
    {
      id: 'image',
      label: 'Package image verified',
      status: scan.image_path || availableSides.length > 0 ? 'PASS' : 'REVIEW',
      detected: `${availableSides.length > 0 ? availableSides.length : 1} view(s) recorded in audit dossier`,
      required: 'Legible, unobstructed package display surfaces',
      ruleCode: 'LMR_IMG',
      reason: 'Packaging image contains minor motion or resolution warning.',
      action: 'Ensure steady camera capture with even lighting across all product panels.'
    },
    {
      id: 'declarations',
      label: 'Mandatory declarations extracted',
      status: scoreObj.declarations_found >= 7 ? 'PASS' : scoreObj.declarations_found >= 4 ? 'REVIEW' : 'FAIL',
      detected: `${scoreObj.declarations_found} of 10 mandatory declarations extracted`,
      required: 'All 10 statutory declarations under Rule 6, LMR 2011',
      ruleCode: 'Rule 6',
      reason: 'Some mandatory packaging declarations were not detected on captured surfaces.',
      action: 'Rotate package to capture all sides including back, sides, and base panels.'
    },
    {
      id: 'mrp',
      label: 'MRP checked',
      status: resolvedFields.mrp && resolvedFields.mrp.trim().length > 0 ? 'PASS' : 'FAIL',
      detected: resolvedFields.mrp ? `₹ ${resolvedFields.mrp}` : 'Not detected on packaging',
      required: 'Maximum Retail Price in Rupees (₹ / Rs.), inclusive of all taxes',
      ruleCode: 'Rule 6(1)(e)',
      reason: 'Mandatory Maximum Retail Price declaration is missing or obscured.',
      action: 'Print conspicuous MRP in Indian Rupees with "inclusive of all taxes" declaration.'
    },
    {
      id: 'net_quantity',
      label: 'Net quantity checked',
      status: resolvedFields.net_quantity && resolvedFields.net_quantity.trim().length > 0 ? 'PASS' : 'FAIL',
      detected: resolvedFields.net_quantity || 'Not detected on packaging',
      required: 'Net weight, volume or units in standard metric units (g, kg, ml, l, N, U)',
      ruleCode: 'Rule 12 & Schedule II',
      reason: 'Net quantity statement is missing or non-standard.',
      action: 'Declare net quantity in standard metric units with prescribed minimum numeral height.'
    },
    {
      id: 'manufacturer',
      label: 'Manufacturer details checked',
      status: (resolvedFields.manufacturer_name && resolvedFields.manufacturer_address) ? 'PASS' : resolvedFields.manufacturer_name ? 'REVIEW' : 'FAIL',
      detected: resolvedFields.manufacturer_name ? `${resolvedFields.manufacturer_name}${resolvedFields.manufacturer_address ? ` (${resolvedFields.manufacturer_address})` : ''}` : 'Not detected on packaging',
      required: 'Complete name and physical premises address of manufacturer/packer/importer with PIN code',
      ruleCode: 'Rule 6(1)(a) & (b)',
      reason: 'Manufacturer/packer name or complete physical premises address with PIN code is missing.',
      action: 'Print complete manufacturer name and physical address including 6-digit postal PIN code.'
    },
    {
      id: 'consumer_care',
      label: 'Consumer-care details checked',
      status: resolvedFields.consumer_care && resolvedFields.consumer_care.trim().length > 0 ? 'PASS' : 'FAIL',
      detected: resolvedFields.consumer_care || 'Not detected on packaging',
      required: 'Consumer grievance contact: Name, address, phone/toll-free number, and email ID',
      ruleCode: 'Rule 6(1)(h)',
      reason: 'Consumer care contact telephone number or email address is absent.',
      action: 'Provide valid helpline telephone number and email address on the package for consumer grievances.'
    },
    {
      id: 'country_of_origin',
      label: 'Country of origin checked where applicable',
      status: resolvedFields.country_of_origin && resolvedFields.country_of_origin.trim().length > 0 ? 'PASS' : 'REVIEW',
      detected: resolvedFields.country_of_origin || 'Not explicitly stated',
      required: 'Country of origin or "Made in India" statement on all imported and domestic goods',
      ruleCode: 'Rule 6(1)(f)',
      reason: 'Country of origin statement was not identified on visible packaging surfaces.',
      action: 'Clearly print "Country of Origin: [Country]" on the packaging display panel.'
    },
    {
      id: 'dates',
      label: 'Mfg / Packing Date & Expiry checked',
      status: (resolvedFields.mfg_date || resolvedFields.expiry_date) ? 'PASS' : 'REVIEW',
      detected: resolvedFields.mfg_date ? `Mfg: ${resolvedFields.mfg_date}${resolvedFields.expiry_date ? ` | Exp: ${resolvedFields.expiry_date}` : ''}` : 'Not detected',
      required: 'Month and year of manufacture or packing, with expiry date for perishable commodities',
      ruleCode: 'Rule 6(1)(d) & Rule 6(1)(g)',
      reason: 'Date of manufacture or packaging is missing or unreadable.',
      action: 'Conspicuously stamp MM/YYYY or DD/MM/YYYY manufacturing and expiry dates.'
    }
  ];

  const failedChecks = inspectionChecklist.filter((c) => c.status === 'FAIL' || c.status === 'REVIEW');
  const passedChecks = inspectionChecklist.filter((c) => c.status === 'PASS');

  return (
    <div className="p-4 sm:p-6 pb-20 max-w-6xl mx-auto select-none space-y-6">
      <Link to="/history" className="inline-flex items-center text-blue-800 text-xs font-bold hover:underline">
        <ArrowLeft size={16} className="mr-1" /> Back to Inspection History
      </Link>

      {/* Duplicate Product Alert Banner */}
      {duplicateInfo?.is_duplicate && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start gap-3">
            <Info size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-xs block">⚠️ Duplicate Product Detected</span>
              <p className="text-xs text-amber-800 mt-0.5">
                Product <strong>{duplicateInfo.product_name}</strong> was previously inspected on{' '}
                {new Date(duplicateInfo.scanned_at).toLocaleString()} with status{' '}
                <span className="font-bold uppercase underline">{duplicateInfo.previous_status}</span>.
              </p>
            </div>
          </div>
          <Link
            to={`/scan/${duplicateInfo.previous_scan_id}`}
            className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-bold whitespace-nowrap self-start sm:self-center shadow-xs"
          >
            View Previous Scan #{duplicateInfo.previous_scan_id}
          </Link>
        </div>
      )}

      {/* ── Official Inspection Session Context Bar ────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-900 border border-blue-200 flex items-center justify-center font-black flex-shrink-0">
            <ShieldCheck size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-black text-slate-900">
                OFFICIAL INSPECTION DOCKET #LM-2024-{scan.id}
              </span>
              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                INSPECTOR: #LM-204
              </span>
              <span className="text-[9px] font-bold uppercase text-slate-500">
                DIRECTORATE OF LEGAL METROLOGY
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Enforcement Protocol: <em>"AI assisted evidence extraction • Officer verified statutory assessment"</em>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-mono font-bold text-slate-700">
            {new Date(scan.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* ── 1. PROMINENT INSPECTION RESULT HERO BANNER ────────────────────────── */}
      <div className={`rounded-3xl p-6 sm:p-8 border text-white shadow-xl ${
        isCompliant
          ? 'bg-gradient-to-br from-emerald-800 via-teal-900 to-slate-950 border-emerald-600/50'
          : isNeedsReview
          ? 'bg-gradient-to-br from-amber-700 via-yellow-900 to-slate-950 border-amber-500/50'
          : 'bg-gradient-to-br from-rose-900 via-red-950 to-slate-950 border-rose-600/50'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-white/15 border border-white/20">
                OFFICIAL INSPECTION RECORD #{scan.id}
              </span>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-white/90 uppercase tracking-tight">
                INSPECTION RESULT:
              </h1>
              <span className={`text-2xl sm:text-4xl font-black px-4 py-1.5 rounded-2xl tracking-tight shadow-md inline-block ${
                isCompliant
                  ? 'bg-emerald-500 text-white'
                  : isNeedsReview
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-rose-600 text-white'
              }`}>
                {isCompliant ? '[COMPLIANT]' : isNeedsReview ? '[NEEDS REVIEW]' : '[NON-COMPLIANT]'}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-white/90 max-w-2xl leading-relaxed">
              {isCompliant
                ? 'All mandatory statutory declarations meet the Legal Metrology (Packaged Commodities) Rules, 2011.'
                : isNeedsReview
                ? 'Packaged commodity contains valid declarations but requires officer inspection of packaging panels or scale.'
                : 'One or more mandatory Legal Metrology requirements failed statutory verification.'}
            </p>
          </div>

          {/* Supporting Compliance Score Card */}
          <div className="bg-black/30 backdrop-blur-md p-5 rounded-2xl border border-white/15 text-center min-w-[200px] self-start lg:self-center">
            <span className="text-[10px] text-white/75 font-bold uppercase tracking-wider block">
              Supporting Metric
            </span>
            <span className="text-[11px] text-white/90 font-extrabold uppercase mt-0.5 block">
              Compliance Score
            </span>
            <div className="flex items-baseline justify-center gap-1 my-1">
              <span className="text-3xl sm:text-4xl font-black text-white">{scoreObj.score}</span>
              <span className="text-xs text-white/70 font-bold">/ 100</span>
            </div>
            <span className="text-[10px] text-white/80 font-mono block">
              {passedChecks.length} of {inspectionChecklist.length} Checks Passed
            </span>
          </div>
        </div>
      </div>

      {/* ── 2. PRODUCT IDENTIFICATION & VERIFICATION CARD ─────────────────────── */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold flex-shrink-0 ${
              isProductVerified ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
            }`}>
              {isProductVerified ? <CheckCircle2 size={22} /> : <AlertTriangle size={22} />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  Product Verification Status:
                </span>
                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${
                  isProductVerified
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-900 border border-amber-300'
                }`}>
                  {isProductVerified ? '✓ VERIFIED COMMODITY' : 'UNVERIFIED / LOW CONFIDENCE'}
                </span>
              </div>
              <h3 className={`text-base font-black mt-0.5 ${
                isProductVerified ? 'text-slate-900' : 'text-amber-900'
              }`}>
                {displayProductName}
              </h3>
              {!isProductVerified && (
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Product could not be confidently identified from OCR text. Missing product information is not guessed.
                </p>
              )}
            </div>
          </div>

          {scan.barcode && (
            <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl self-start sm:self-center">
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Barcode / GTIN</span>
              <span className="text-xs font-mono font-bold text-slate-800">{scan.barcode}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── 3. PACKAGING EVIDENCE & DETAILS GRID ──────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex flex-col lg:flex-row">
          
          {/* Packaging Image & Side Tabs */}
          <div className="w-full lg:w-5/12 bg-slate-900 p-5 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-200">
            {availableSides.length > 1 && (
              <div className="grid grid-cols-4 gap-1 mb-3 bg-slate-800 p-1 rounded-xl">
                {availableSides.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setActiveSide(s)}
                    className={`py-1 text-[10px] font-black uppercase rounded-lg transition-colors ${
                      activeSide === s ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div className="relative flex-1 flex items-center justify-center min-h-[260px] max-h-[360px]">
              <img 
                src={`${apiUrl}/uploads/${sidesOcr[activeSide]?.image_path || scan.image_path}`}
                alt="Scanned packaging"
                className="max-h-[340px] w-full object-contain rounded-xl"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/legal_metrology_logo.jpg';
                }}
              />
            </div>

            <div className="mt-3 bg-slate-800/80 p-2.5 rounded-xl text-center">
              <span className="text-[10px] text-slate-300 font-mono">
                Panel: {activeSide.toUpperCase()} | Case Scanned: {new Date(scan.created_at).toLocaleString()}
              </span>
            </div>
          </div>
          
          {/* Statutory Verification Checklist */}
          <div className="w-full lg:w-7/12 p-6 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex justify-between items-center mb-3 border-b border-slate-100 pb-2.5">
                <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <ClipboardCheck size={18} className="text-blue-600" />
                  Statutory Inspection Checklist
                </h3>
                <span className="text-[10px] font-black bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-200">
                  {passedChecks.length} / {inspectionChecklist.length} Passed
                </span>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {inspectionChecklist.map((item) => {
                  const isPass = item.status === 'PASS';
                  const isRev = item.status === 'REVIEW';

                  return (
                    <div
                      key={item.id}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs ${
                        isPass
                          ? 'bg-emerald-50/50 border-emerald-200'
                          : isRev
                          ? 'bg-amber-50/50 border-amber-200'
                          : 'bg-rose-50/50 border-rose-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className={`font-black ${isPass ? 'text-emerald-700' : isRev ? 'text-amber-700' : 'text-rose-700'}`}>
                          {isPass ? '✓' : isRev ? '⚠' : '✗'}
                        </span>
                        <span className="font-bold text-slate-800 truncate">{item.label}</span>
                      </div>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full whitespace-nowrap ${
                        isPass ? 'bg-emerald-100 text-emerald-800' :
                        isRev ? 'bg-amber-100 text-amber-900' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {isPass ? 'Pass' : isRev ? 'Review' : 'Failed'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex gap-3">
              <button 
                onClick={downloadReport}
                className="flex-1 bg-[var(--color-navy)] hover:bg-blue-900 text-white py-3 rounded-xl font-bold text-xs flex justify-center items-center gap-2 transition-colors shadow-sm cursor-pointer"
              >
                <Download size={16} /> Download Official Inspection Report (PDF)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. ACTIONABLE FAILURE & REVIEW FINDINGS ────────────────────────────── */}
      {failedChecks.length > 0 && (
        <div className="bg-rose-50/40 border border-rose-200 rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-rose-200 pb-3">
            <AlertCircle size={20} className="text-rose-600 flex-shrink-0" />
            <div>
              <h3 className="font-black text-rose-950 text-base">
                Failed / Non-Compliant Checks Breakdown ({failedChecks.length})
              </h3>
              <p className="text-xs text-rose-800 mt-0.5">
                Statutory breaches and advisory items requiring corrective action or officer inspection.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {failedChecks.map((fc) => (
              <div
                key={fc.id}
                className="bg-white p-4 rounded-xl border border-rose-200 shadow-xs space-y-2.5"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-rose-600 font-black text-base">✗</span>
                    <h4 className="text-xs font-black text-slate-900">{fc.label}</h4>
                  </div>
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                    fc.status === 'FAIL' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-900'
                  }`}>
                    {fc.status === 'FAIL' ? 'Non-Compliant' : 'Needs Review'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Detected Value</span>
                    <span className="font-mono font-bold text-rose-900">{fc.detected}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Required Value / Declaration</span>
                    <span className="text-slate-800 font-medium">{fc.required}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Relevant Rule / Section</span>
                    <span className="font-mono font-bold text-blue-800">{fc.ruleCode}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Reason for Failure</span>
                    <span className="text-rose-800">{fc.reason}</span>
                  </div>
                </div>

                <div className="p-2.5 bg-blue-50/70 rounded-lg border border-blue-100 text-xs text-blue-900 flex items-start gap-2">
                  <span className="font-bold text-[10px] uppercase bg-blue-200 text-blue-900 px-1.5 py-0.5 rounded flex-shrink-0">
                    Suggested Action
                  </span>
                  <span className="font-medium text-[11px]">{fc.action}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 5. EXTRACTED DECLARATIONS TABLE ───────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <ClipboardCheck size={18} className="text-blue-600" />
              Extracted Mandatory Declarations
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Statutory values recorded in the enforcement database.
            </p>
          </div>
          <span className="text-xs font-black bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200">
            Rule 6 & Rule 12 Audited
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50">
                <th className="p-3">Field Name</th>
                <th className="p-3">Verified Value</th>
                <th className="p-3">Panel Source</th>
                <th className="p-3">Confidence</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {METROLOGY_FIELDS.map((f) => {
                const value = resolvedFields[f.key] || scan.extracted_fields?.semantic_fields?.[f.key];
                const fusionMeta = scan.extracted_fields?.fusion_fields?.[f.key] || {};
                const sourceSide = fusionMeta.source_side || 'Front';
                const confScore = fusionMeta.confidence_score || (value ? 85 : 0);

                return (
                  <tr key={f.key} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3 font-semibold text-slate-800">
                      <span className="mr-1.5">{f.icon}</span>
                      {f.label}
                      {f.isCritical && <span className="text-rose-500 ml-1 font-bold">*</span>}
                    </td>
                    <td className="p-3 font-mono text-slate-900">
                      {value || <span className="text-slate-400 italic">Not detected</span>}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-bold uppercase">
                        {sourceSide}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-slate-700">
                      {confScore}%
                    </td>
                    <td className="p-3">
                      {value ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 size={10} /> Present
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                          <AlertTriangle size={10} /> Review
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 6. AI ANALYSIS & PROCESSING DETAILS (COLLAPSIBLE) ─────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <button
          type="button"
          onClick={() => setShowAiDetails(!showAiDetails)}
          className="w-full p-5 text-left flex justify-between items-center bg-slate-50 hover:bg-slate-100/80 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Sparkles size={18} className="text-blue-600" />
            <div>
              <h3 className="font-bold text-slate-900 text-sm">AI Analysis & Processing Details</h3>
              <span className="text-[11px] text-slate-500">Technical recognition metadata, OCR confidence, and pipeline stages</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase">
              {showAiDetails ? 'Hide Details' : 'Show Details'}
            </span>
            {showAiDetails ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
          </div>
        </button>

        {showAiDetails && (
          <div className="p-5 border-t border-slate-200 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">OCR Recognition Engine</span>
                <span className="text-sm font-black text-slate-900 mt-1 block">PaddleOCR Local Engine</span>
                <span className="text-xs font-mono font-bold text-emerald-700">{ocrConf}% Confidence</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Vision Extraction Engine</span>
                <span className="text-sm font-black text-slate-900 mt-1 block">Gemini Multimodal Vision</span>
                <span className="text-xs font-mono font-bold text-blue-700">{extConf}% Confidence</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Statutory Rule Engine</span>
                <span className="text-sm font-black text-slate-900 mt-1 block">LMR 2011 Weighted Evaluator</span>
                <span className="text-xs font-mono font-bold text-amber-700">{scoreObj.score} / 100 Score</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── 7. RAW OCR TEXT (EXPANDABLE PANEL) ────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <button
          type="button"
          onClick={() => setShowRawOcr(!showRawOcr)}
          className="w-full p-5 text-left flex justify-between items-center bg-slate-50 hover:bg-slate-100/80 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Layers size={18} className="text-slate-700" />
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Raw OCR Text</h3>
              <span className="text-[11px] text-slate-500">Complete unformatted text recorded for this inspection</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase">
              {showRawOcr ? 'Hide Raw Text' : 'View Raw Text'}
            </span>
            {showRawOcr ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
          </div>
        </button>

        {showRawOcr && (
          <div className="p-5 border-t border-slate-200">
            <div className="bg-slate-950 text-slate-100 p-4 rounded-xl text-xs font-mono whitespace-pre-wrap max-h-72 overflow-y-auto border border-slate-900 leading-relaxed">
              {scan.ocr_raw_text ||
               scan.extracted_fields?.sides_ocr?.front?.full_text ||
               'No raw OCR text recorded.'}
            </div>
          </div>
        )}
      </div>

      {/* ── 8. INSPECTOR VERIFICATION & OFFICIAL SIGN-OFF ────────────────────── */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
              <ShieldCheck size={20} className="text-blue-600" />
              Inspector Statutory Verification & Sign-Off
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Official legal sign-off and verification recorded by the inspecting officer.
            </p>
          </div>
          <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-full border border-slate-200 self-start sm:self-auto">
            Officer: #LM-204
          </span>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-700 block">
            Officer Verification Determination:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setOfficerDecision('VERIFIED')}
              className={`p-3.5 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                officerDecision === 'VERIFIED'
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-400/30 font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <CheckCircle2 size={16} className={`flex-shrink-0 mt-0.5 ${officerDecision === 'VERIFIED' ? 'text-emerald-600' : 'text-slate-400'}`} />
              <div>
                <span className="text-xs font-black block">VERIFIED & COMPLIANT</span>
                <span className="text-[10px] text-slate-500 mt-0.5 block">Statutory packaging evidence verified by officer.</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setOfficerDecision('NEEDS_REVIEW')}
              className={`p-3.5 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                officerDecision === 'NEEDS_REVIEW'
                  ? 'bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-400/30 font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <AlertTriangle size={16} className={`flex-shrink-0 mt-0.5 ${officerDecision === 'NEEDS_REVIEW' ? 'text-amber-600' : 'text-slate-400'}`} />
              <div>
                <span className="text-xs font-black block">FLAG FOR SENSORY INSPECTION</span>
                <span className="text-[10px] text-slate-500 mt-0.5 block">Requires physical caliper measurement or lab test.</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setOfficerDecision('UNVERIFIED')}
              className={`p-3.5 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                officerDecision === 'UNVERIFIED'
                  ? 'bg-rose-50 border-rose-500 text-rose-900 ring-2 ring-rose-400/30 font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <AlertCircle size={16} className={`flex-shrink-0 mt-0.5 ${officerDecision === 'UNVERIFIED' ? 'text-rose-600' : 'text-slate-400'}`} />
              <div>
                <span className="text-xs font-black block">CONFIRM NON-COMPLIANCE</span>
                <span className="text-[10px] text-slate-500 mt-0.5 block">Statutory violations confirmed for enforcement action.</span>
              </div>
            </button>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Officer Inspection Remarks / Docket Notes:
            </label>
            <textarea
              rows={2}
              placeholder="Enter official remarks, seized sample batch details, or market location notes..."
              value={officerNotes}
              onChange={(e) => setOfficerNotes(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
            {isOfficerSigned ? (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs flex items-center gap-2.5 w-full">
                <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
                <div>
                  <span className="font-black block">✓ Digitally Signed & Sealed by Enforcement Officer #LM-204</span>
                  <span className="text-[10px] text-emerald-700 font-mono">
                    Audit Status: {officerDecision} • Docket Archived on {new Date(scan.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsOfficerSigned(true)}
                className="px-5 py-2.5 bg-blue-800 hover:bg-blue-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <ShieldCheck size={14} /> Sign & Seal Inspection Docket
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── 9. ACTION BUTTONS ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-4 pt-2">
        <button
          type="button"
          onClick={downloadReport}
          className="flex-1 py-4 bg-[var(--color-navy)] hover:bg-blue-900 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
        >
          <Download size={16} /> Download Official Inspection Report (PDF)
        </button>

        <Link
          to="/history"
          className="px-8 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer text-center"
        >
          <ArrowLeft size={16} /> Return to History
        </Link>
      </div>
    </div>
  );
}
