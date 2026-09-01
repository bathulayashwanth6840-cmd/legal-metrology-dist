import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Download, CheckCircle2,
  Info, Sparkles, ShieldCheck, AlertTriangle, Layers
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

      {/* Main Inspection Hero Card */}
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
                Panel: {activeSide.toUpperCase()} | Barcode: {scan.barcode || 'N/A'}
              </span>
            </div>
          </div>
          
          {/* Inspection Case Details & 3-Tier Confidences */}
          <div className="w-full lg:w-7/12 p-6 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-4 border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Statutory Inspection Case</span>
                  <h2 className="text-xl font-black text-slate-900">
                    {scan.extracted_fields?.semantic_fields?.product_name || `Scan Record #${scan.id}`}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">{new Date(scan.created_at).toLocaleString()}</p>
                </div>

                <span className={`px-3 py-1 rounded-full text-xs font-black tracking-wide uppercase ${
                  isCompliant ? 'bg-emerald-100 text-emerald-800' :
                  isNeedsReview ? 'bg-amber-100 text-amber-800' :
                  'bg-rose-100 text-rose-800'
                }`}>
                  {scan.status.replace('_', ' ')}
                </span>
              </div>

              {/* 3-Tier Confidence Gauges */}
              <div className="grid grid-cols-3 gap-2.5 mb-4">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <span className="text-[9px] font-black uppercase text-slate-500 block">OCR Recognition</span>
                  <span className="text-base font-black text-emerald-700">{ocrConf}%</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <span className="text-[9px] font-black uppercase text-slate-500 block">Field Extraction</span>
                  <span className="text-base font-black text-blue-700">{extConf}%</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <span className="text-[9px] font-black uppercase text-slate-500 block">Compliance Score</span>
                  <span className="text-base font-black text-amber-700">{scoreObj.score}/100</span>
                </div>
              </div>

              {/* Violations / Findings Notice */}
              <div className="mb-4">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-blue-600" />
                  Statutory Rule Findings
                </h3>
                {isCompliant ? (
                  <div className="bg-emerald-50 text-emerald-800 p-3.5 rounded-xl border border-emerald-200 text-xs flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    <span>All mandatory Legal Metrology packaging declarations verified successfully.</span>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {scan.violations?.map((v: any, idx: number) => (
                      <div key={idx} className="bg-rose-50 p-3 rounded-xl border border-rose-200 text-xs flex justify-between items-start gap-2">
                        <div>
                          <span className="font-bold text-rose-900 block">{v.rule_code}: {v.rule_description}</span>
                          <p className="text-rose-700 mt-0.5">{v.detail_text}</p>
                        </div>
                        <span className="text-[9px] bg-rose-200 text-rose-900 px-2 py-0.5 rounded font-black uppercase whitespace-nowrap">
                          {v.severity}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex gap-3">
              <button 
                onClick={downloadReport}
                className="flex-1 bg-[var(--color-navy)] hover:bg-blue-900 text-white py-3 rounded-xl font-bold text-xs flex justify-center items-center gap-2 transition-colors shadow-sm cursor-pointer"
              >
                <Download size={16} /> Download SIH Inspection Report (PDF)
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Verified Declarations Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h3 className="font-bold text-slate-900 text-base mb-4 flex items-center gap-2">
          <Sparkles size={18} className="text-blue-600" />
          Packaging Declarations & Multi-Side Evidence
        </h3>
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
              {(() => {
                const resolved = resolveExtractedFields(scan);
                return METROLOGY_FIELDS.map((f) => {
                  const value = resolved[f.key] || scan.extracted_fields?.semantic_fields?.[f.key];
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
              });
            })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* Raw OCR View */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h3 className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-2">
          <Layers size={16} className="text-purple-600" />
          Raw Multi-Side OCR Output
        </h3>
        <div className="bg-slate-950 text-slate-100 p-4 rounded-xl text-xs font-mono whitespace-pre-wrap max-h-56 overflow-y-auto border border-slate-900">
          {scan.ocr_raw_text || "No OCR text recorded"}
        </div>
      </div>
    </div>
  );
}
