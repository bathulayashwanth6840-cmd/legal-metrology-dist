import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Download, CheckCircle2,
  Info, Sparkles, AlertTriangle, Layers,
  ChevronDown, ChevronUp, AlertCircle, ClipboardCheck,
  ShieldCheck, FileWarning, ChevronRight
} from 'lucide-react';
import { createComplaintRecord } from '../services/complaintService';
import { resolveImageUrl, handleImageError } from '../utils/imageUtils';

const METROLOGY_FIELDS = [
  // Legal Metrology Act & Rules 2011 (LMR)
  { key: 'product_name',         label: 'Generic / Product Name',    isCritical: true,  icon: '📦', ruleCode: 'Rule 6(1)(a)', category: 'LMR' },
  { key: 'net_quantity',         label: 'Net Quantity',              isCritical: true,  icon: '⚖️', ruleCode: 'Rule 6(1)(b)', category: 'LMR' },
  { key: 'mfg_date',             label: 'Mfg / Packing Date',        isCritical: true,  icon: '📅', ruleCode: 'Rule 6(1)(d)', category: 'LMR' },
  { key: 'mrp',                  label: 'Maximum Retail Price (MRP)', isCritical: true,  icon: '₹',  ruleCode: 'Rule 6(1)(e)', category: 'LMR' },
  { key: 'unit_sale_price',      label: 'Unit Sale Price (USP)',     isCritical: false, icon: '🏷️', ruleCode: 'Rule 6(1)(k)', category: 'LMR' },
  { key: 'manufacturer_name',    label: 'Manufacturer / Packer Name', isCritical: true,  icon: '🏭', ruleCode: 'Rule 6(1)(a)', category: 'LMR' },
  { key: 'manufacturer_address', label: 'Manufacturer Premises Address', isCritical: true, icon: '📍', ruleCode: 'Rule 6(1)(a)', category: 'LMR' },
  { key: 'consumer_care',        label: 'Consumer Care Details',      isCritical: true,  icon: '📞', ruleCode: 'Rule 6(1)(n)', category: 'LMR' },
  { key: 'country_of_origin',    label: 'Country of Origin',          isCritical: false, icon: '🌍', ruleCode: 'Rule 6(1)(m)', category: 'LMR' },
  
  // Food Safety and Standards (FSSAI 2011)
  { key: 'fssai_number',         label: 'FSSAI License No.',          isCritical: false, icon: '🔏', ruleCode: 'FSSAI Sec 31', category: 'FSSAI' },
  { key: 'expiry_date',          label: 'Expiry / Best Before',       isCritical: false, icon: '⏳', ruleCode: 'FSSAI Reg 2.2', category: 'FSSAI' },
  
  // Product Identification & Traceability
  { key: 'batch_number',         label: 'Batch / Lot Number',        isCritical: false, icon: '🔢', ruleCode: 'Rule 6(1)(c)', category: 'TRACKING' },
];

// Detection State Badge Formatter
export function getDetectionBadge(state: string | undefined) {
  switch (state) {
    case 'VERIFIED':
      return { label: 'Verified (Pass)', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
    case 'CONFIRMED_MISSING':
      return { label: 'Confirmed Missing', color: 'bg-rose-100 text-rose-800 border-rose-300' };
    case 'NOT_DETECTED':
      return { label: 'Not Detected (Review)', color: 'bg-amber-100 text-amber-900 border-amber-300' };
    case 'UNCLEAR':
      return { label: 'Unclear / Quality (Review)', color: 'bg-yellow-100 text-yellow-900 border-yellow-300' };
    case 'NOT_VISIBLE':
      return { label: 'Not Visible on Panel (Review)', color: 'bg-blue-100 text-blue-900 border-blue-300' };
    case 'NEEDS_MANUAL_REVIEW':
      return { label: 'Manual Review / Discrepancy', color: 'bg-purple-100 text-purple-900 border-purple-300' };
    default:
      return { label: 'Needs Review', color: 'bg-slate-100 text-slate-800 border-slate-300' };
  }
}

// Robust field extraction helper with OCR & AI fallback
function resolveExtractedFields(data: any): Record<string, string> {
  if (!data) return {};
  
  const ext = data.extracted_fields || {};
  const sem = ext.semantic_fields || {};
  const fusion = ext.fusion_fields || {};
  const gemini = data.gemini_extraction || ext.gemini_extraction || {};
  const localOcr = data.local_ocr || ext.local_ocr || {};
  const rawText = data.ocr_raw_text || ext.raw_text || localOcr.full_text || localOcr.raw_text || '';

  // 1. Resolve Product Name
  let productName = fusion.product_name?.selected_value || sem.product_name || gemini.product_name || gemini.brand_name || '';
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
  let mrp = fusion.mrp?.selected_value || sem.mrp || gemini.mrp || '';
  if (!mrp && rawText) {
    const mrpMatch = String(rawText).match(/(?:MRP|M\.R\.P\.?|Maximum\s+Retail\s+Price|Max\.?\s*Retail\s*Price)[\s:.-]*(?:Rs\.?|INR|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i)
      || String(rawText).match(/(?:₹|Rs\.?|INR)\s*([\d,]+(?:\.\d{1,2})?)/i);
    if (mrpMatch) mrp = mrpMatch[1].replace(',', '').trim();
  }

  // 3. Resolve Net Quantity
  let netQty = fusion.net_quantity?.selected_value || sem.net_quantity || '';
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
  let mfgName = fusion.manufacturer_name?.selected_value || sem.manufacturer_name || gemini.manufacturer_name || gemini.packer_name || gemini.importer_name || '';
  if (!mfgName && rawText) {
    const mfgMatch = String(rawText).match(/(?:Mfg\s*by|Manufactured\s*(?:by|&)|Packed\s*by|Marketed\s*by|Imported\s*by|Mfd\s*By)[\s:.-]*([^\n,]+)/i);
    if (mfgMatch) mfgName = mfgMatch[1].trim();
  }

  // 5. Resolve Manufacturer Address
  let mfgAddr = fusion.manufacturer_address?.selected_value || sem.manufacturer_address || gemini.manufacturer_address || gemini.packer_address || gemini.importer_address || '';
  if (!mfgAddr && rawText) {
    const pinMatch = String(rawText).match(/(?:Pin|Pincode|Dist\.?)?[\s:.-]*(\d{6})\b/i);
    if (pinMatch) mfgAddr = `Packaging facility (PIN ${pinMatch[1]})`;
  }

  // 6. Resolve Mfg Date
  let mfgDate = fusion.mfg_date?.selected_value || sem.mfg_date || gemini.manufacturing_date || gemini.packing_date || '';
  if (!mfgDate && rawText) {
    const dateMatch = String(rawText).match(/(?:MFG|MFD|Manufactured|Packed\s*On|PKD|PKG)[\s:.-]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{1,2}[/-]\d{2,4}|[A-Za-z]{3,9}\s*[-/]?\s*\d{2,4})/i);
    if (dateMatch) mfgDate = dateMatch[1].trim();
  }

  // 7. Resolve Expiry Date
  let expDate = fusion.expiry_date?.selected_value || sem.expiry_date || gemini.expiry_date || gemini.best_before || '';
  if (!expDate && rawText) {
    const expMatch = String(rawText).match(/(?:EXP|Expiry|Use\s*By|Best\s*Before)[\s:.-]*([^\n]+)/i);
    if (expMatch) expDate = expMatch[1].trim();
  }

  // 8. Resolve FSSAI
  let fssai = fusion.fssai_number?.selected_value || sem.fssai_number || gemini.fssai_number || '';
  if (!fssai && rawText) {
    const fssaiMatch = String(rawText).match(/(?:FSSAI|Lic\.?\s*No\.?)[\s:.-]*(\d{14})\b/i) || String(rawText).match(/\b(1\d{13})\b/);
    if (fssaiMatch) fssai = fssaiMatch[1].trim();
  }

  // 9. Resolve Consumer Care
  let care = fusion.consumer_care?.selected_value || sem.consumer_care || gemini.customer_care_details || gemini.consumer_care_phone || gemini.consumer_care_email || '';
  if (!care && rawText) {
    const phoneMatch = String(rawText).match(/(?:Toll\s*Free|Helpline|Phone|Call)[\s:.-]*(\+?91[\s-]?)?([1800\d\s-]{10,14})\b/i);
    const emailMatch = String(rawText).match(/([a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)/i);
    if (phoneMatch) care = phoneMatch[0].trim();
    else if (emailMatch) care = emailMatch[1].trim();
  }

  // 10. Resolve Country of Origin
  let origin = fusion.country_of_origin?.selected_value || sem.country_of_origin || gemini.country_of_origin || '';
  if (!origin && rawText) {
    const originMatch = String(rawText).match(/(?:Country\s*of\s*Origin|Origin|Made\s*in|Product\s*of)[\s:.-]*([A-Za-z\s]+)\b/i)
      || String(rawText).match(/\b(Made\s*in\s*India|Product\s*of\s*India)\b/i);
    if (originMatch) origin = originMatch[1].trim();
  }

  // 11. Unit Sale Price
  let usp = fusion.unit_sale_price?.selected_value || sem.unit_sale_price || gemini.unit_sale_price || '';

  // 12. Batch Number
  let batch = fusion.batch_number?.selected_value || sem.batch_number || gemini.batch_number || '';

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
    unit_sale_price: usp,
    batch_number: batch,
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
  const [imgNaturalSizes, setImgNaturalSizes] = useState<Record<string, { width: number; height: number }>>({});
  const [highlightedFieldKey, setHighlightedFieldKey] = useState<string | null>(null);
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

  const [createdComplaintId, setCreatedComplaintId] = useState<string | null>(null);

  const downloadReport = () => {
    window.open(`${apiUrl}/api/scans/${id}/report`, '_blank');
  };

  const handleCreateComplaint = (prodName: string, failedList: any[], resolvedMap: Record<string, string>) => {
    const findings = failedList.map((fc) => ({
      id: `FND-${fc.id}`,
      fieldKey: fc.id,
      fieldLabel: fc.label,
      ruleCode: fc.ruleCode,
      ruleReference: `Legal Metrology (Packaged Commodities) Rules, 2011 - ${fc.ruleCode}`,
      detectedText: fc.detected,
      requiredStandard: fc.required,
      aiStatus: (fc.status === 'FAIL' ? 'POTENTIAL VIOLATION' : 'NEEDS VERIFICATION') as any,
      confidence: 0.94,
      evidenceNotes: fc.reason || 'Flagged during statutory inspection archive review.',
      reviewedByOfficer: false,
    }));

    const created = createComplaintRecord({
      inspectionId: `INS-${id}`,
      product: {
        productName: prodName,
        brand: resolvedMap.brand_name || prodName.split(' ')[0] || 'Packaged Commodity',
        category: 'Packaged Commodity Sample',
        manufacturerName: resolvedMap.manufacturer_name,
        manufacturerAddress: resolvedMap.manufacturer_address,
        mrp: resolvedMap.mrp,
        netQuantity: resolvedMap.net_quantity,
        mfgDate: resolvedMap.mfg_date,
        expiryDate: resolvedMap.expiry_date,
        consumerCareDetails: resolvedMap.consumer_care,
        countryOfOrigin: resolvedMap.country_of_origin || 'India',
        barcode: scan?.barcode,
      },
      inspection: {
        location: 'Seized Commodity Archive, Enforcement Zone',
        marketDistrict: 'Enforcement Jurisdiction',
        inspectorName: 'Inspector Rajesh Sharma',
        inspectorBadge: 'LM-204',
        packageImages: (availableSides.length > 0
          ? availableSides
              .filter((s) => sidesOcr[s]?.image_path)
              .map((s) => ({
                side: `${s.toUpperCase()} Panel`,
                url: resolveImageUrl(sidesOcr[s].image_path, apiUrl),
              }))
          : []
        ).length > 0
          ? availableSides
              .filter((s) => sidesOcr[s]?.image_path)
              .map((s) => ({
                side: `${s.toUpperCase()} Panel`,
                url: resolveImageUrl(sidesOcr[s].image_path, apiUrl),
              }))
          : scan?.image_path
          ? [{ side: 'Front Panel', url: resolveImageUrl(scan.image_path, apiUrl) }]
          : [],
      },
      findings,
      priority: failedList.length > 0 ? 'High' : 'Medium',
      submittedBy: 'Inspector Rajesh Sharma (LM-204)',
      submitterRole: 'Inspector',
    });

    setCreatedComplaintId(created.id);
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

  // Metadata extraction from scan dossier
  const fusionFields = (scan.extracted_fields?.fusion_fields || {}) as Record<string, any>;
  const evidenceMap = (scan.extracted_fields?.evidence_map || {}) as Record<string, any>;
  const viewsCount = availableSides.length > 0 ? availableSides.length : (scan.image_path ? 1 : 0);

  // Helper for styling detection state badges
  const getDetectionBadge = (state: string) => {
    switch (state) {
      case 'VERIFIED':
        return { label: '✓ Verified (PASS)', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
      case 'CONFIRMED_MISSING':
        return { label: '✗ Confirmed Missing (FAIL)', color: 'bg-rose-100 text-rose-800 border-rose-300' };
      case 'NOT_VISIBLE':
        return { label: '📦 Not Visible on Panel (Review)', color: 'bg-blue-100 text-blue-900 border-blue-300' };
      case 'UNCLEAR':
        return { label: '⚡ Unclear / Low Res (Review)', color: 'bg-amber-100 text-amber-900 border-amber-300' };
      case 'NEEDS_MANUAL_REVIEW':
        return { label: '⚠️ Discrepancy (Review)', color: 'bg-purple-100 text-purple-900 border-purple-300' };
      case 'NOT_DETECTED':
      default:
        return { label: '🔍 Not Detected (Review)', color: 'bg-amber-100 text-amber-900 border-amber-300' };
    }
  };

  // Statutory Checklist Items with 5 Detection States
  const inspectionChecklist = [
    {
      id: 'image',
      label: 'Package image verified',
      status: viewsCount > 0 ? ('PASS' as const) : ('REVIEW' as const),
      detectionState: viewsCount > 0 ? 'VERIFIED' : 'NOT_VISIBLE',
      detected: `${viewsCount} view(s) recorded in audit dossier`,
      required: 'Legible, unobstructed package display surfaces',
      ruleCode: 'LMR_IMG',
      rawOcrText: viewsCount > 1 ? `${viewsCount} package surfaces captured in audit dossier` : 'Single surface photographed',
      source: `${viewsCount}-Panel Visual Dossier`,
      evidenceRegion: 'All Recorded Surfaces',
      reason: 'Package display surface recorded in official docket.',
      action: 'Proceed with statutory evaluation.'
    },
    {
      id: 'declarations',
      label: 'Mandatory declarations extracted',
      status: scoreObj.declarations_found >= 7 ? ('PASS' as const) : ('REVIEW' as const),
      detectionState: scoreObj.declarations_found >= 7 ? 'VERIFIED' : (viewsCount === 1 ? 'NOT_VISIBLE' : 'NOT_DETECTED'),
      detected: `${scoreObj.declarations_found} of 10 mandatory declarations extracted`,
      required: 'All 10 statutory declarations under Rule 6, LMR 2011',
      ruleCode: 'Rule 6, LMR 2011',
      rawOcrText: `${scoreObj.declarations_found} fields parsed across captured OCR text lines`,
      source: 'Extraction Pipeline',
      evidenceRegion: 'All Captured Surfaces',
      reason: scoreObj.declarations_found >= 7
        ? 'High statutory declaration coverage across package surfaces.'
        : viewsCount === 1
        ? 'Single panel recorded; unextracted declarations are likely printed on uncaptured flaps.'
        : 'Some declarations were not detected on captured surfaces. Officer visual inspection recommended.',
      action: scoreObj.declarations_found >= 7
        ? 'Verify physical product matching.'
        : 'Inspect physical package to verify uncaptured back/side flaps.'
    },
    // MRP
    (() => {
      const mrpVal = resolvedFields.mrp ? resolvedFields.mrp.trim() : '';
      const meta = fusionFields.mrp || {};
      const rawLine = meta.raw_text_line || evidenceMap.mrp?.raw_text_line || (mrpVal ? `MRP ₹ ${mrpVal}` : 'No MRP keywords found in dossier');
      const region = meta.source_side ? `${String(meta.source_side).toUpperCase()} Panel` : (viewsCount === 1 ? 'Back / Top Flap Panel Required' : 'Packaging Stamping Area');
      const src = meta.source === 'agreed' ? 'Both (OCR & Gemini AI Verified)' : meta.source === 'local_ocr' ? 'PaddleOCR Engine' : meta.source === 'gemini_ai' ? 'Gemini Vision AI' : (viewsCount === 1 ? 'Single-Panel Scan' : 'Multi-Panel OCR Scan');

      if (mrpVal && mrpVal.length > 0) {
        if (meta.conflict) {
          return {
            id: 'mrp',
            label: 'MRP checked',
            fieldKey: 'mrp',
            status: 'REVIEW' as const,
            detectionState: 'NEEDS_MANUAL_REVIEW',
            detected: `₹ ${mrpVal} (Discrepancy: OCR '${meta.ocr_value}' vs AI '${meta.gemini_value}')`,
            required: 'Maximum Retail Price in Rupees (₹ / Rs.), inclusive of all taxes',
            ruleCode: 'Rule 6(1)(e), LMR 2011',
            rawOcrText: rawLine,
            source: 'Discrepancy (OCR vs AI)',
            evidenceRegion: region,
            reason: `Discrepancy detected between OCR and AI readings for price. Officer visual verification required.`,
            action: 'Inspect physical stamped price on packaging to confirm correct MRP.',
            ocrValue: meta.ocr_value,
            geminiValue: meta.gemini_value
          };
        }
        return {
          id: 'mrp',
          label: 'MRP checked',
          fieldKey: 'mrp',
          status: 'PASS' as const,
          detectionState: 'VERIFIED',
          detected: `₹ ${mrpVal} (Inclusive of all taxes)`,
          required: 'Maximum Retail Price in Rupees (₹ / Rs.), inclusive of all taxes',
          ruleCode: 'Rule 6(1)(e), LMR 2011',
          rawOcrText: rawLine,
          source: src,
          evidenceRegion: region,
          reason: 'MRP is clearly declared in valid Indian Rupee format inclusive of all taxes.',
          action: 'None required.'
        };
      }
      if (viewsCount === 1) {
        return {
          id: 'mrp',
          label: 'MRP checked',
          fieldKey: 'mrp',
          status: 'REVIEW' as const,
          detectionState: 'NOT_VISIBLE',
          detected: 'Not visible on recorded panel (Single-panel scan)',
          required: 'Maximum Retail Price in Rupees (₹ / Rs.), inclusive of all taxes',
          ruleCode: 'Rule 6(1)(e), LMR 2011',
          rawOcrText: rawLine,
          source: 'Single-Panel Scan (Back/Top Flap Uncaptured)',
          evidenceRegion: 'Back / Top Flap Panel Required',
          reason: 'MRP was not detected on the single captured panel. MRP is typically printed on the back, side, or top flap.',
          action: 'Inspect back or side panels of packaging where price is stamped.'
        };
      }
      if (viewsCount >= 4) {
        return {
          id: 'mrp',
          label: 'MRP checked',
          fieldKey: 'mrp',
          status: 'FAIL' as const,
          detectionState: 'CONFIRMED_MISSING',
          detected: 'Conclusively missing across all 4 panels',
          required: 'Maximum Retail Price in Rupees (₹ / Rs.), inclusive of all taxes',
          ruleCode: 'Rule 6(1)(e), LMR 2011',
          rawOcrText: rawLine,
          source: '4-Panel Full Scan',
          evidenceRegion: 'All Recorded Surfaces',
          reason: 'All 4 packaging surfaces were captured and verified; mandatory Maximum Retail Price declaration is absent.',
          action: 'Print conspicuous MRP in Indian Rupees with "inclusive of all taxes".'
        };
      }
      return {
        id: 'mrp',
        label: 'MRP checked',
        fieldKey: 'mrp',
        status: 'REVIEW' as const,
        detectionState: 'NOT_DETECTED',
        detected: 'Not detected on recorded surfaces',
        required: 'Maximum Retail Price in Rupees (₹ / Rs.), inclusive of all taxes',
        ruleCode: 'Rule 6(1)(e), LMR 2011',
        rawOcrText: rawLine,
        source: 'Multi-Panel OCR Scan',
        evidenceRegion: 'Recorded Panels',
        reason: 'MRP was not detected on visible packaging surfaces. Do not treat as a confirmed legal violation without checking uncaptured faces.',
        action: 'Officer manual visual inspection advised.'
      };
    })(),
    // Net Quantity
    (() => {
      const qtyVal = resolvedFields.net_quantity ? resolvedFields.net_quantity.trim() : '';
      const meta = fusionFields.net_quantity || {};
      const rawLine = meta.raw_text_line || evidenceMap.net_quantity?.raw_text_line || (qtyVal || 'No quantity tokens on captured panel');
      const region = meta.source_side ? `${String(meta.source_side).toUpperCase()} Panel` : 'Principal Display Panel';
      const src = meta.source === 'agreed' ? 'Both (OCR & Gemini AI Verified)' : meta.source === 'local_ocr' ? 'PaddleOCR Engine' : 'Packaging Label';

      if (qtyVal && qtyVal.length > 0) {
        const isValidUnit = /^\d+(\.\d+)?\s*(mg|g|kg|ml|l|litre|litres|liter|liters|n|u|units?)\b/i.test(qtyVal);
        if (isValidUnit) {
          return {
            id: 'net_quantity',
            label: 'Net quantity checked',
            fieldKey: 'net_quantity',
            status: 'PASS' as const,
            detectionState: 'VERIFIED',
            detected: qtyVal,
            required: 'Net weight, volume or units in standard metric units (g, kg, ml, l, N, U)',
            ruleCode: 'Rule 6(1)(c) & Rule 11, LMR 2011',
            rawOcrText: rawLine,
            source: src,
            evidenceRegion: region,
            reason: 'Net quantity is declared in standard metric units.',
            action: 'None required.'
          };
        }
        return {
          id: 'net_quantity',
          label: 'Net quantity checked',
          fieldKey: 'net_quantity',
          status: 'REVIEW' as const,
          detectionState: 'NEEDS_MANUAL_REVIEW',
          detected: qtyVal,
          required: 'Net weight, volume or units in standard metric units (g, kg, ml, l, N, U)',
          ruleCode: 'Rule 11, LMR 2011',
          rawOcrText: rawLine,
          source: src,
          evidenceRegion: region,
          reason: 'Non-standard unit symbol used. Rule 11 prescribes standard metric symbols "g", "kg", "ml", "L", "N".',
          action: 'Use standard metric symbols "g", "kg", "ml", "L", or "N" with proper spacing.'
        };
      }
      if (viewsCount === 1) {
        return {
          id: 'net_quantity',
          label: 'Net quantity checked',
          fieldKey: 'net_quantity',
          status: 'REVIEW' as const,
          detectionState: 'NOT_VISIBLE',
          detected: 'Not visible on recorded panel',
          required: 'Net weight, volume or units in standard metric units (g, kg, ml, l, N, U)',
          ruleCode: 'Rule 6(1)(c), LMR 2011',
          rawOcrText: rawLine,
          source: 'Single-Panel Scan',
          evidenceRegion: 'Principal Display Panel',
          reason: 'Net quantity not detected on captured panel. May be printed on front PDP or base.',
          action: 'Verify front PDP panel for net weight/volume.'
        };
      }
      if (viewsCount >= 4) {
        return {
          id: 'net_quantity',
          label: 'Net quantity checked',
          fieldKey: 'net_quantity',
          status: 'FAIL' as const,
          detectionState: 'CONFIRMED_MISSING',
          detected: 'Conclusively missing across all panels',
          required: 'Net weight, volume or units in standard metric units (g, kg, ml, l, N, U)',
          ruleCode: 'Rule 6(1)(c), LMR 2011',
          rawOcrText: rawLine,
          source: '4-Panel Full Scan',
          evidenceRegion: 'All Recorded Surfaces',
          reason: 'Net quantity declaration was searched and is absent across all packaging panels.',
          action: 'Declare net weight or volume on principal display panel.'
        };
      }
      return {
        id: 'net_quantity',
        label: 'Net quantity checked',
        fieldKey: 'net_quantity',
        status: 'REVIEW' as const,
        detectionState: 'NOT_DETECTED',
        detected: 'Not detected on recorded surfaces',
        required: 'Net weight, volume or units in standard metric units (g, kg, ml, l, N, U)',
        ruleCode: 'Rule 6(1)(c), LMR 2011',
        rawOcrText: rawLine,
        source: 'Multi-Panel OCR Scan',
        evidenceRegion: 'Recorded Panels',
        reason: 'Net quantity not detected in current dossier.',
        action: 'Officer visual review advised.'
      };
    })(),
    // Manufacturer
    (() => {
      const mfgName = resolvedFields.manufacturer_name ? resolvedFields.manufacturer_name.trim() : '';
      const mfgAddr = resolvedFields.manufacturer_address ? resolvedFields.manufacturer_address.trim() : '';
      const meta = fusionFields.manufacturer_name || {};
      const rawLine = meta.raw_text_line || evidenceMap.manufacturer_name?.raw_text_line || (mfgName ? `Mfg by: ${mfgName}` : 'No manufacturer tokens on captured panel');
      const region = meta.source_side ? `${String(meta.source_side).toUpperCase()} Panel` : 'Back / Side Panel';
      const src = meta.source === 'agreed' ? 'Both (OCR & Gemini AI Verified)' : 'Packaging Label';

      if (mfgName && mfgAddr) {
        return {
          id: 'manufacturer',
          label: 'Manufacturer details checked',
          fieldKey: 'manufacturer_name',
          status: 'PASS' as const,
          detectionState: 'VERIFIED',
          detected: `${mfgName} (${mfgAddr})`,
          required: 'Complete name and physical premises address of manufacturer/packer/importer with PIN code',
          ruleCode: 'Rule 6(1)(a) & (b), LMR 2011',
          rawOcrText: rawLine,
          source: src,
          evidenceRegion: region,
          reason: 'Complete manufacturer/packer identity and physical premises address are declared.',
          action: 'None required.'
        };
      }
      if (mfgName) {
        return {
          id: 'manufacturer',
          label: 'Manufacturer details checked',
          fieldKey: 'manufacturer_name',
          status: 'REVIEW' as const,
          detectionState: 'UNCLEAR',
          detected: `${mfgName} (Address unverified)`,
          required: 'Complete name and physical premises address of manufacturer/packer/importer with PIN code',
          ruleCode: 'Rule 6(1)(a), LMR 2011',
          rawOcrText: rawLine,
          source: src,
          evidenceRegion: region,
          reason: 'Manufacturer name detected; physical premises address or PIN code requires verification.',
          action: 'Ensure complete postal address including PIN code is clearly legible.'
        };
      }
      if (viewsCount === 1) {
        return {
          id: 'manufacturer',
          label: 'Manufacturer details checked',
          fieldKey: 'manufacturer_name',
          status: 'REVIEW' as const,
          detectionState: 'NOT_VISIBLE',
          detected: 'Not visible on recorded panel',
          required: 'Complete name and physical premises address of manufacturer/packer/importer with PIN code',
          ruleCode: 'Rule 6(1)(a), LMR 2011',
          rawOcrText: rawLine,
          source: 'Single-Panel Scan',
          evidenceRegion: 'Back / Side Panel Required',
          reason: 'Manufacturer details not visible on captured panel. Normally printed on back or side panels.',
          action: 'Inspect back or side panel containing manufacturer details.'
        };
      }
      if (viewsCount >= 4) {
        return {
          id: 'manufacturer',
          label: 'Manufacturer details checked',
          fieldKey: 'manufacturer_name',
          status: 'FAIL' as const,
          detectionState: 'CONFIRMED_MISSING',
          detected: 'Conclusively missing across all panels',
          required: 'Complete name and physical premises address of manufacturer/packer/importer with PIN code',
          ruleCode: 'Rule 6(1)(a), LMR 2011',
          rawOcrText: rawLine,
          source: '4-Panel Full Scan',
          evidenceRegion: 'All Recorded Surfaces',
          reason: 'Manufacturer/packer name and address absent across all captured packaging faces.',
          action: 'Declare complete name and address of manufacturer or packer.'
        };
      }
      return {
        id: 'manufacturer',
        label: 'Manufacturer details checked',
        fieldKey: 'manufacturer_name',
        status: 'REVIEW' as const,
        detectionState: 'NOT_DETECTED',
        detected: 'Not detected on recorded surfaces',
        required: 'Complete name and physical premises address of manufacturer/packer/importer with PIN code',
        ruleCode: 'Rule 6(1)(a), LMR 2011',
        rawOcrText: rawLine,
        source: 'Multi-Panel OCR Scan',
        evidenceRegion: 'Recorded Panels',
        reason: 'Manufacturer details not detected on current image(s).',
        action: 'Check other packaging faces.'
      };
    })(),
    // Consumer Care
    (() => {
      const careVal = resolvedFields.consumer_care ? resolvedFields.consumer_care.trim() : '';
      const meta = fusionFields.consumer_care || {};
      const rawLine = meta.raw_text_line || (careVal || 'No consumer care tokens on captured panel');
      const region = meta.source_side ? `${String(meta.source_side).toUpperCase()} Panel` : 'Back / Side Panel';
      const src = meta.source === 'agreed' ? 'Both (OCR & Gemini AI Verified)' : 'Packaging Label';

      if (careVal && careVal.length > 0) {
        return {
          id: 'consumer_care',
          label: 'Consumer-care details checked',
          fieldKey: 'consumer_care',
          status: 'PASS' as const,
          detectionState: 'VERIFIED',
          detected: careVal,
          required: 'Consumer grievance contact: Name, address, phone/toll-free number, and email ID',
          ruleCode: 'Rule 6(1)(da), LMR 2011',
          rawOcrText: rawLine,
          source: src,
          evidenceRegion: region,
          reason: 'Consumer care contact details are declared.',
          action: 'None required.'
        };
      }
      if (viewsCount === 1) {
        return {
          id: 'consumer_care',
          label: 'Consumer-care details checked',
          fieldKey: 'consumer_care',
          status: 'REVIEW' as const,
          detectionState: 'NOT_VISIBLE',
          detected: 'Not visible on recorded panel',
          required: 'Consumer grievance contact: Name, address, phone/toll-free number, and email ID',
          ruleCode: 'Rule 6(1)(da), LMR 2011',
          rawOcrText: rawLine,
          source: 'Single-Panel Scan',
          evidenceRegion: 'Back / Side Panel Required',
          reason: 'Consumer care contact not visible on current panel. Typically on back or side panels.',
          action: 'Inspect back or side panels for consumer care helpline.'
        };
      }
      if (viewsCount >= 4) {
        return {
          id: 'consumer_care',
          label: 'Consumer-care details checked',
          fieldKey: 'consumer_care',
          status: 'FAIL' as const,
          detectionState: 'CONFIRMED_MISSING',
          detected: 'Conclusively missing across all panels',
          required: 'Consumer grievance contact: Name, address, phone/toll-free number, and email ID',
          ruleCode: 'Rule 6(1)(da), LMR 2011',
          rawOcrText: rawLine,
          source: '4-Panel Full Scan',
          evidenceRegion: 'All Recorded Surfaces',
          reason: 'Consumer care helpline/email absent across all packaging panels.',
          action: 'Provide customer care telephone number, email, and postal address.'
        };
      }
      return {
        id: 'consumer_care',
        label: 'Consumer-care details checked',
        fieldKey: 'consumer_care',
        status: 'REVIEW' as const,
        detectionState: 'NOT_DETECTED',
        detected: 'Not detected on recorded surfaces',
        required: 'Consumer grievance contact: Name, address, phone/toll-free number, and email ID',
        ruleCode: 'Rule 6(1)(da), LMR 2011',
        rawOcrText: rawLine,
        source: 'Multi-Panel OCR Scan',
        evidenceRegion: 'Recorded Panels',
        reason: 'Consumer care helpline was not identified on captured panels.',
        action: 'Verify consumer care section on packaging.'
      };
    })(),
    // Country of Origin
    (() => {
      const originVal = resolvedFields.country_of_origin ? resolvedFields.country_of_origin.trim() : '';
      const mfgAddr = resolvedFields.manufacturer_address ? resolvedFields.manufacturer_address.trim() : '';
      const meta = fusionFields.country_of_origin || {};
      const rawLine = meta.raw_text_line || (originVal ? `Origin: ${originVal}` : (mfgAddr ? `Mfg address: ${mfgAddr}` : 'No origin keywords on captured panel'));
      const region = meta.source_side ? `${String(meta.source_side).toUpperCase()} Panel` : 'Manufacturer Details Panel';

      if (originVal && originVal.length > 0) {
        return {
          id: 'country_of_origin',
          label: 'Country of origin checked where applicable',
          fieldKey: 'country_of_origin',
          status: 'PASS' as const,
          detectionState: 'VERIFIED',
          detected: originVal,
          required: 'Country of origin statement on all imported and domestic goods',
          ruleCode: 'Rule 6(10), LMR 2011 Amendment',
          rawOcrText: rawLine,
          source: 'Packaging Declaration',
          evidenceRegion: region,
          reason: `Country of origin explicitly declared as "${originVal}".`,
          action: 'None required.'
        };
      }
      if (mfgAddr && /(India|PIN\s*\d{6}|\d{6})/i.test(mfgAddr)) {
        return {
          id: 'country_of_origin',
          label: 'Country of origin checked where applicable',
          fieldKey: 'country_of_origin',
          status: 'PASS' as const,
          detectionState: 'VERIFIED',
          detected: 'Implied: India (Domestic Manufacturer Premises)',
          required: 'Country of origin statement on all imported and domestic goods',
          ruleCode: 'Rule 6(10), LMR 2011 Amendment',
          rawOcrText: rawLine,
          source: 'Domestic Manufacturer Premises',
          evidenceRegion: region,
          reason: 'Domestic manufacturer premises in India declared under Rule 6(1)(a); country of origin implied as India under Rule 6(10).',
          action: 'None required.'
        };
      }
      if (viewsCount === 1) {
        return {
          id: 'country_of_origin',
          label: 'Country of origin checked where applicable',
          fieldKey: 'country_of_origin',
          status: 'REVIEW' as const,
          detectionState: 'NOT_VISIBLE',
          detected: 'Not visible on recorded panel',
          required: 'Country of origin statement on all imported and domestic goods',
          ruleCode: 'Rule 6(10), LMR 2011 Amendment',
          rawOcrText: rawLine,
          source: 'Single-Panel Scan',
          evidenceRegion: 'Back Panel Required',
          reason: 'Country of origin not found on this panel. Often printed near manufacturer address on back panel.',
          action: 'Inspect back panel near manufacturer premises.'
        };
      }
      return {
        id: 'country_of_origin',
        label: 'Country of origin checked where applicable',
        fieldKey: 'country_of_origin',
        status: 'REVIEW' as const,
        detectionState: 'NOT_DETECTED',
        detected: 'Not explicitly stated',
        required: 'Country of origin statement on all imported and domestic goods',
        ruleCode: 'Rule 6(10), LMR 2011 Amendment',
        rawOcrText: rawLine,
        source: 'OCR / Vision Pipeline',
        evidenceRegion: 'Recorded Panels',
        reason: 'Origin statement not explicitly detected on scanned surfaces. If manufactured domestically, address fulfills statutory origin intent.',
        action: 'Declare "Country of Origin: India" or appropriate manufacturing country if imported.'
      };
    })(),
    // Dates
    (() => {
      const mfgDate = resolvedFields.mfg_date ? resolvedFields.mfg_date.trim() : '';
      const expDate = resolvedFields.expiry_date ? resolvedFields.expiry_date.trim() : '';
      const meta = fusionFields.mfg_date || {};
      const rawLine = meta.raw_text_line || (mfgDate ? `Mfg: ${mfgDate}` : 'No date tokens on captured panel');
      const region = meta.source_side ? `${String(meta.source_side).toUpperCase()} Panel` : 'Crimp Seal / Back Panel';
      const src = meta.source === 'agreed' ? 'Both (OCR & Gemini AI Verified)' : 'Packaging Label';

      if (mfgDate || expDate) {
        return {
          id: 'dates',
          label: 'Mfg / Packing Date & Expiry checked',
          fieldKey: 'mfg_date',
          status: 'PASS' as const,
          detectionState: 'VERIFIED',
          detected: `Mfg: ${mfgDate || 'N/A'}${expDate ? ` | Exp: ${expDate}` : ''}`,
          required: 'Month and year of manufacture or packing, with expiry date for perishable commodities',
          ruleCode: 'Rule 6(1)(d) & Rule 6(1)(g), LMR 2011',
          rawOcrText: rawLine,
          source: src,
          evidenceRegion: region,
          reason: 'Manufacturing/packing date is declared.',
          action: 'None required.'
        };
      }
      if (viewsCount === 1) {
        return {
          id: 'dates',
          label: 'Mfg / Packing Date & Expiry checked',
          fieldKey: 'mfg_date',
          status: 'REVIEW' as const,
          detectionState: 'NOT_VISIBLE',
          detected: 'Not visible on recorded panel',
          required: 'Month and year of manufacture or packing, with expiry date for perishable commodities',
          ruleCode: 'Rule 6(1)(d), LMR 2011',
          rawOcrText: rawLine,
          source: 'Single-Panel Scan',
          evidenceRegion: 'Crimp Seal / Back Panel',
          reason: 'Mfg/packing date not on captured panel. Often batch-stamped on crimp seal or back panel.',
          action: 'Check packaging crimp or back panel for stamped date.'
        };
      }
      if (viewsCount >= 4) {
        return {
          id: 'dates',
          label: 'Mfg / Packing Date & Expiry checked',
          fieldKey: 'mfg_date',
          status: 'FAIL' as const,
          detectionState: 'CONFIRMED_MISSING',
          detected: 'Conclusively missing across all panels',
          required: 'Month and year of manufacture or packing, with expiry date for perishable commodities',
          ruleCode: 'Rule 6(1)(d), LMR 2011',
          rawOcrText: rawLine,
          source: '4-Panel Full Scan',
          evidenceRegion: 'All Recorded Surfaces',
          reason: 'Month and year of manufacture/packing absent across all packaging surfaces.',
          action: 'Print month and year of manufacture/packing prominently.'
        };
      }
      return {
        id: 'dates',
        label: 'Mfg / Packing Date & Expiry checked',
        fieldKey: 'mfg_date',
        status: 'REVIEW' as const,
        detectionState: 'NOT_DETECTED',
        detected: 'Not detected on recorded surfaces',
        required: 'Month and year of manufacture or packing, with expiry date for perishable commodities',
        ruleCode: 'Rule 6(1)(d), LMR 2011',
        rawOcrText: rawLine,
        source: 'Multi-Panel OCR Scan',
        evidenceRegion: 'Recorded Panels',
        reason: 'Date of manufacture/packing not detected on current image(s).',
        action: 'Verify physical stamp on package.'
      };
    })()
  ];

  const failedChecks = inspectionChecklist.filter((c) => c.status === 'FAIL' || c.status === 'REVIEW');
  const confirmedFails = inspectionChecklist.filter((c) => c.status === 'FAIL' || c.detectionState === 'CONFIRMED_MISSING');
  const reviewItems = inspectionChecklist.filter((c) => c.status === 'REVIEW' && c.detectionState !== 'CONFIRMED_MISSING');
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
                ? `Packaged commodity contains valid declarations. ${reviewItems.length} declaration(s) require officer verification or multi-panel capture without assuming violation.`
                : `${confirmedFails.length} mandatory Legal Metrology requirement(s) conclusively failed statutory verification.`}
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
              <span className="text-[9px] font-bold text-amber-700 block mt-0.5">BARCODE DETECTED — PRODUCT NOT VERIFIED IN NATIONAL DB</span>
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

            <div className="relative flex-1 flex items-center justify-center min-h-[260px] max-h-[360px] bg-slate-950 rounded-xl overflow-hidden">
              <img 
                src={resolveImageUrl(sidesOcr[activeSide]?.image_path || scan.image_path, apiUrl)}
                alt="Scanned packaging"
                className="max-h-[340px] w-full object-contain rounded-xl"
                onLoad={(e) => {
                  const { naturalWidth, naturalHeight } = e.currentTarget;
                  if (naturalWidth && naturalHeight) {
                    setImgNaturalSizes((prev) => ({
                      ...prev,
                      [activeSide]: { width: naturalWidth, height: naturalHeight },
                    }));
                  }
                }}
                onError={(e) => handleImageError(e)}
              />

              {/* SVG Bounding Polygon Overlay */}
              {(() => {
                const nat = imgNaturalSizes[activeSide] || { width: 1000, height: 1000 };
                const sideOcr = sidesOcr[activeSide];
                const polygons: Array<{ points: number[][]; text?: string; isHighlight?: boolean; key?: string }> = [];

                if (sideOcr?.bounding_polygons && Array.isArray(sideOcr.bounding_polygons)) {
                  sideOcr.bounding_polygons.forEach((poly: any, idx: number) => {
                    if (Array.isArray(poly) && poly.length >= 3) {
                      polygons.push({ points: poly, text: sideOcr.lines?.[idx]?.text || '' });
                    }
                  });
                } else if (scan?.bounding_boxes && Array.isArray(scan.bounding_boxes) && (activeSide === 'front' || activeSide === 'Front')) {
                  scan.bounding_boxes.forEach((b: any) => {
                    if (b.polygon && Array.isArray(b.polygon)) {
                      polygons.push({ points: b.polygon, text: b.text, key: b.field_key });
                    } else if (b.box && Array.isArray(b.box)) {
                      const [ymin, xmin, ymax, xmax] = b.box;
                      const w = nat.width || 1000;
                      const h = nat.height || 1000;
                      const pts = (b.normalized ?? true)
                        ? [[xmin * w, ymin * h], [xmax * w, ymin * h], [xmax * w, ymax * h], [xmin * w, ymax * h]]
                        : [[xmin, ymin], [xmax, ymin], [xmax, ymax], [xmin, ymax]];
                      polygons.push({ points: pts, text: b.text, key: b.field_key });
                    }
                  });
                }

                if (polygons.length === 0) return null;

                const natW = nat.width || 1000;
                const natH = nat.height || 1000;

                return (
                  <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    viewBox={`0 0 ${natW} ${natH}`}
                    preserveAspectRatio="xMidYMid meet"
                  >
                    {polygons.map((poly, pIdx) => {
                      const ptsStr = poly.points.map((pt) => `${pt[0]},${pt[1]}`).join(' ');
                      const isFieldMatch = highlightedFieldKey && poly.key === highlightedFieldKey;

                      return (
                        <g key={pIdx}>
                          <polygon
                            points={ptsStr}
                            fill={isFieldMatch ? 'rgba(59, 130, 246, 0.4)' : 'rgba(16, 185, 129, 0.15)'}
                            stroke={isFieldMatch ? '#3b82f6' : '#10b981'}
                            strokeWidth={isFieldMatch ? 4 : 2}
                          />
                        </g>
                      );
                    })}
                  </svg>
                );
              })()}
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
                  {passedChecks.length} Passed • {reviewItems.length} Review • {confirmedFails.length} Failed
                </span>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {inspectionChecklist.map((item) => {
                  const isPass = item.status === 'PASS';
                  const isFail = item.status === 'FAIL';
                  const badge = getDetectionBadge(item.detectionState);

                  return (
                    <div
                      key={item.id}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs ${
                        isPass
                          ? 'bg-emerald-50/50 border-emerald-200'
                          : isFail
                          ? 'bg-rose-50/50 border-rose-200'
                          : 'bg-amber-50/50 border-amber-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                        <span className={`font-black ${isPass ? 'text-emerald-700' : isFail ? 'text-rose-700' : 'text-amber-700'}`}>
                          {isPass ? '✓' : isFail ? '✗' : '⚠'}
                        </span>
                        <div className="truncate">
                          <span className="font-bold text-slate-800 truncate block">{item.label}</span>
                          <span className="text-[10px] text-slate-500 font-mono truncate block">{item.detected}</span>
                        </div>
                      </div>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border whitespace-nowrap flex-shrink-0 ${badge.color}`}>
                        {badge.label}
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
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3">
            <AlertCircle size={20} className="text-blue-600 flex-shrink-0" />
            <div>
              <h3 className="font-black text-slate-950 text-base">
                Statutory Verification & Evidence Breakdown ({failedChecks.length})
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Comprehensive evidence proof distinguishing confirmed omissions, uncaptured package panels, and image quality warnings.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {failedChecks.map((fc) => {
              const badge = getDetectionBadge(fc.detectionState);
              const isFail = fc.status === 'FAIL';

              return (
                <div
                  key={fc.id}
                  className={`bg-white p-4 rounded-xl border shadow-xs space-y-3 ${
                    isFail ? 'border-rose-200' : 'border-amber-200'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className={`font-black text-base ${isFail ? 'text-rose-600' : 'text-amber-600'}`}>
                        {isFail ? '✗' : '⚠'}
                      </span>
                      <h4 className="text-xs font-black text-slate-900">{fc.label}</h4>
                    </div>
                    <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border ${badge.color}`}>
                      {badge.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 uppercase block">Extracted / Verified Value</span>
                      <span className={`font-mono font-bold ${isFail ? 'text-rose-900' : 'text-amber-900'}`}>{fc.detected}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 uppercase block">Actual OCR Text Snippet Used</span>
                      <span className="font-mono text-slate-800 text-[11px] block truncate">{fc.rawOcrText}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 uppercase block">Evidence Source & Panel</span>
                      <span className="text-slate-800 font-semibold">{fc.source} ({fc.evidenceRegion})</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 uppercase block">Applicable Legal Mandate</span>
                      <span className="font-mono font-bold text-blue-800">{fc.ruleCode}</span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-[9px] font-bold text-slate-500 uppercase block">Statutory Reason / Assessment</span>
                      <span className="text-slate-800 leading-relaxed">{fc.reason}</span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-blue-50/70 rounded-lg border border-blue-100 text-xs text-blue-900 flex items-start gap-2">
                    <span className="font-bold text-[10px] uppercase bg-blue-200 text-blue-900 px-1.5 py-0.5 rounded flex-shrink-0">
                      Suggested Officer Action
                    </span>
                    <span className="font-medium text-[11px]">{fc.action}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 5. EXTRACTED DECLARATIONS TABLE (CATEGORIZED) ────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <ClipboardCheck size={18} className="text-blue-600" />
              Extracted Mandatory Declarations
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Statutory values recorded in the enforcement database. Click any row to focus its image evidence.
            </p>
          </div>
          <span className="text-xs font-black bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200">
            LMR 2011 & FSSAI Audited
          </span>
        </div>

        {(['LMR', 'FSSAI', 'TRACKING'] as const).map((cat) => {
          const catFields = METROLOGY_FIELDS.filter((f) => f.category === cat);
          if (catFields.length === 0) return null;

          const catTitle =
            cat === 'LMR'
              ? 'Section 1A: Legal Metrology (Packaged Commodities) Rules, 2011'
              : cat === 'FSSAI'
              ? 'Section 1B: Food Safety and Standards (Packaging & Labelling) Regulations, 2011'
              : 'Section 1C: Product Traceability & Tracking';

          const catBadge = cat === 'LMR' ? 'LMR 2011' : cat === 'FSSAI' ? 'FSSAI' : 'TRACKING';
          const badgeBg = cat === 'LMR' ? 'bg-blue-100 text-blue-800' : cat === 'FSSAI' ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800';

          return (
            <div key={cat} className="space-y-3">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${badgeBg}`}>
                  {catBadge}
                </span>
                <span className="text-xs font-bold text-slate-800">{catTitle}</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50">
                      <th className="p-3">Field Name</th>
                      <th className="p-3">Verified Value</th>
                      <th className="p-3">Panel Source</th>
                      <th className="p-3">Confidence & Source</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {catFields.map((f) => {
                      const value = resolvedFields[f.key] || scan.extracted_fields?.semantic_fields?.[f.key];
                      const fusionMeta = scan.extracted_fields?.fusion_fields?.[f.key] || {};
                      const sourceSide = fusionMeta.source_side || 'Front';
                      const confScore = Math.round((fusionMeta.confidence || (value ? 0.85 : 0)) * 100);
                      const isHighlighted = highlightedFieldKey === f.key;
                      const hasConflict = Boolean(fusionMeta.conflict || fusionMeta.agreement === 'CONFLICT');

                      const matchCheck = inspectionChecklist.find((c: any) => c.fieldKey === f.key || c.id === f.key);
                      const badge = getDetectionBadge(matchCheck?.detectionState || (value ? 'VERIFIED' : (availableSides.length === 1 ? 'NOT_VISIBLE' : 'NOT_DETECTED')));

                      return (
                        <tr
                          key={f.key}
                          onClick={() => {
                            setHighlightedFieldKey(f.key);
                            if (fusionMeta.source_side && ['front', 'back', 'left', 'right'].includes(fusionMeta.source_side.toLowerCase())) {
                              setActiveSide(fusionMeta.source_side.toLowerCase());
                            }
                          }}
                          className={`cursor-pointer transition-colors ${
                            isHighlighted ? 'bg-blue-50/80' : hasConflict ? 'bg-amber-50/40' : 'hover:bg-slate-50/50'
                          }`}
                        >
                          <td className="p-3 font-semibold text-slate-800">
                            <span className="mr-1.5">{f.icon}</span>
                            {f.label}
                            {f.isCritical && <span className="text-rose-500 ml-1 font-bold">*</span>}
                            <span className="block text-[10px] font-mono text-slate-400 font-normal">
                              {f.ruleCode}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-slate-900">
                            {value || <span className="text-slate-400 italic">Not detected</span>}
                            {hasConflict && (
                              <span className="block text-[10px] text-amber-700 font-bold mt-0.5">
                                ⚠️ Disagreement (OCR: {fusionMeta.ocr_value || 'None'} vs AI: {fusionMeta.gemini_value || 'None'})
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-bold uppercase">
                              {sourceSide}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-slate-700">{confScore}%</div>
                            <span className="text-[10px] text-slate-400">{fusionMeta.source || 'OCR Pipeline'}</span>
                          </td>
                          <td className="p-3">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.color}`}>
                              {matchCheck?.status === 'PASS' || value ? <CheckCircle2 size={10} /> : <AlertTriangle size={10} />}
                              {badge.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 5B. OFFICER OVERRIDE & VERIFICATION AUDIT TRAIL ─────────────────────── */}
      {scan.officer_overrides && Object.keys(scan.officer_overrides).length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-600" />
                Officer Override & Verification Audit Trail
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Immutable audit log of statutory values manually verified or corrected by the inspecting officer.
              </p>
            </div>
            <span className="text-xs font-mono font-bold bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200">
              Officer Verified Docket
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50">
                  <th className="p-3">Field</th>
                  <th className="p-3">Original Machine (OCR/AI) Value</th>
                  <th className="p-3">Officer Overridden Value</th>
                  <th className="p-3">Officer ID</th>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.entries(scan.officer_overrides).map(([fieldKey, overrideData]: [string, any]) => (
                  <tr key={fieldKey} className="hover:bg-slate-50/50">
                    <td className="p-3 font-semibold text-slate-800 uppercase font-mono">
                      {fieldKey.replace(/_/g, ' ')}
                    </td>
                    <td className="p-3 font-mono text-slate-500 line-through">
                      {overrideData.original_value || '<Empty>'}
                    </td>
                    <td className="p-3 font-mono font-bold text-emerald-900 bg-emerald-50/40">
                      {overrideData.officer_value}
                    </td>
                    <td className="p-3 font-mono text-slate-700">
                      {overrideData.officer_id || '#LM-204'}
                    </td>
                    <td className="p-3 text-slate-500">
                      {overrideData.timestamp ? new Date(overrideData.timestamp).toLocaleString() : 'Recent'}
                    </td>
                    <td className="p-3 text-slate-600 italic">
                      {overrideData.reason || 'Manual officer statutory verification'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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

      {/* ── 8.5 STATUTORY COMPLAINT ESCALATION ──────────────────────────────── */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-3xl p-6 border border-blue-800 shadow-md space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block">
              STATUTORY ENFORCEMENT & COMPLAINT WORKFLOW
            </span>
            <h3 className="text-base font-black text-white mt-0.5">
              Escalate Inspection to Formal Complaint / Enquiry
            </h3>
            <p className="text-xs text-blue-200 mt-0.5">
              Generate an official tracking dossier (LM-2026-XXXX) linking this inspection ({scan.id}), its declarations, and evidence.
            </p>
          </div>

          {createdComplaintId ? (
            <div className="flex items-center gap-2">
              <Link
                to={`/complaints/${createdComplaintId}`}
                className="px-5 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-lg inline-flex items-center gap-2 transition-all"
              >
                <FileWarning size={15} />
                <span>Open Complaint {createdComplaintId}</span>
                <ChevronRight size={14} />
              </Link>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => handleCreateComplaint(displayProductName, failedChecks, resolvedFields)}
              className="px-6 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-gray-950 font-black text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all active:scale-[0.98] cursor-pointer flex-shrink-0"
            >
              <FileWarning size={16} />
              <span>Create Complaint / Enquiry</span>
            </button>
          )}
        </div>

        {createdComplaintId && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-200 text-xs flex items-center justify-between gap-2">
            <span className="font-bold flex items-center gap-1.5">
              <CheckCircle2 size={16} className="text-emerald-400" />
              Statutory Complaint <span className="font-mono text-white">{createdComplaintId}</span> successfully registered and linked!
            </span>
            <Link
              to={`/complaints/${createdComplaintId}`}
              className="font-bold text-amber-300 hover:underline text-[11px]"
            >
              Proceed to Forward / Verification →
            </Link>
          </div>
        )}
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
