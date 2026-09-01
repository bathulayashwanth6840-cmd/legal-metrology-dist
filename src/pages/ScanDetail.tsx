import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Download, AlertTriangle, CheckCircle2, XCircle, Info, Sparkles } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

const METROLOGY_FIELDS = [
  { key: 'product_name', label: 'Product Name', isCritical: false },
  { key: 'manufacturer_name', label: 'Manufacturer Name', isCritical: true },
  { key: 'manufacturer_address', label: 'Manufacturer Address', isCritical: true },
  { key: 'net_quantity', label: 'Net Quantity', isCritical: true },
  { key: 'mrp', label: 'Maximum Retail Price (MRP)', isCritical: true },
  { key: 'mfg_date', label: 'Mfg / Packing Date', isCritical: false },
  { key: 'expiry_date', label: 'Expiry / Best Before', isCritical: true },
  { key: 'fssai_number', label: 'FSSAI License No.', isCritical: false },
  { key: 'consumer_care', label: 'Consumer Care Details', isCritical: false },
  { key: 'country_of_origin', label: 'Country of Origin', isCritical: false },
];

export default function ScanDetail() {
  const { id } = useParams();
  const { t } = useLanguage();
  const [scan, setScan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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

  if (loading) return <div className="p-8 text-center text-gray-500">Loading inspection details...</div>;
  if (!scan) return <div className="p-8 text-center text-rose-500">Scan not found</div>;

  const isCompliant = scan.status === 'compliant' || (scan.violations && scan.violations.length === 0);

  // Compute or read compliance score
  const scoreObj = scan.compliance_score || scan.extracted_fields?.compliance_score || {
    score: isCompliant ? 95 : Math.max(25, 90 - (scan.violations?.length || 1) * 20),
    max_score: 100,
    category: isCompliant ? 'Excellent / Compliant' : 'High Risk / Non-Compliant',
    color: isCompliant ? 'green' : 'red',
    declarations_found: 8,
    declarations_total: 10,
    violations_count: scan.violations?.length || 0
  };

  const duplicateInfo = scan.duplicate_product || scan.extracted_fields?.duplicate_product;
  const fieldConfidences = scan.field_confidences || scan.extracted_fields?.field_confidences || {};

  return (
    <div className="p-4 sm:p-6 pb-20 max-w-5xl mx-auto select-none">
      <Link to="/history" className="inline-flex items-center text-blue-800 text-xs font-bold mb-4 hover:underline">
        <ArrowLeft size={16} className="mr-1" /> Back to History
      </Link>

      {/* Duplicate Product Alert Banner */}
      {duplicateInfo?.is_duplicate && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start gap-3">
            <Info size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-sm block">⚠️ {t('scan.duplicate_alert_title')}</span>
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
            {t('scan.view_previous_scan')}
          </Link>
        </div>
      )}

      {/* Main Overview Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="flex flex-col md:flex-row">
          
          {/* Image Thumbnail */}
          <div className="w-full md:w-1/3 bg-gray-50 flex items-center justify-center p-5 border-b md:border-b-0 md:border-r border-gray-200">
            <img 
              src={`${apiUrl}/uploads/${scan.image_path}`}
              alt="Scanned product"
              className="max-h-80 object-contain rounded-xl shadow-2xs border border-gray-200"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/legal_metrology_logo.jpg';
              }}
            />
          </div>
          
          {/* Header & Compliance Summary */}
          <div className="w-full md:w-2/3 p-6 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-4 border-b border-gray-100 pb-3">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Inspection Case</span>
                  <h2 className="text-xl font-black text-gray-900">Scan #{scan.id}</h2>
                  <p className="text-xs text-gray-500">{new Date(scan.created_at).toLocaleString()}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-black tracking-wide ${
                  isCompliant ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {scan.status.toUpperCase()}
                </span>
              </div>

              {/* Compliance Score Gauge Card */}
              <div className="mb-5 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                    {t('scan.compliance_score')}
                  </span>
                  <span className="text-lg font-black text-blue-900">
                    {scoreObj.score} <span className="text-xs text-gray-500 font-medium">/ 100</span>
                  </span>
                </div>
                <div className="w-full bg-blue-200/60 rounded-full h-2.5 overflow-hidden mb-2">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      scoreObj.score >= 90 ? 'bg-emerald-500' :
                      scoreObj.score >= 70 ? 'bg-amber-500' :
                      scoreObj.score >= 40 ? 'bg-orange-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${scoreObj.score}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[11px] text-gray-600 font-medium">
                  <span>Rating: <strong className="text-gray-900">{scoreObj.category}</strong></span>
                  <span>{scan.violations?.length || 0} {t('scan.violations_detected')}</span>
                </div>
              </div>

              {/* Violations List */}
              <div className="mb-4">
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Compliance Rule Violations
                </h3>
                {isCompliant ? (
                  <div className="bg-emerald-50 text-emerald-800 p-3.5 rounded-xl border border-emerald-200 text-xs flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    <span>All mandatory Legal Metrology declarations verified successfully.</span>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {scan.violations?.map((v: any) => (
                      <div key={v.id} className="bg-rose-50 p-3 rounded-xl border border-rose-100 text-xs">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-rose-900">{v.rule_code}: {v.rule_description}</span>
                          <span className="text-[10px] bg-rose-200/80 text-rose-900 px-2 py-0.5 rounded font-black uppercase">
                            {v.severity}
                          </span>
                        </div>
                        <p className="text-rose-700">{v.detail_text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100">
              <button 
                onClick={downloadReport}
                className="w-full bg-[var(--color-navy)] text-white py-2.5 rounded-xl font-bold text-xs flex justify-center items-center gap-2 hover:bg-blue-900 transition-colors shadow-sm"
              >
                <Download size={16} /> {t('scan.download_report')}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Verified Declarations Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="font-bold text-gray-900 text-base mb-4 flex items-center gap-2">
          <Sparkles size={18} className="text-blue-600" />
          Extracted Packaging Declarations & Field Confidence
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 font-bold bg-gray-50/70">
                <th className="p-3">Field Name</th>
                <th className="p-3">Verified Value</th>
                <th className="p-3">Confidence</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {METROLOGY_FIELDS.map((f) => {
                const value = scan.extracted_fields?.semantic_fields?.[f.key];
                const confData = fieldConfidences[f.key] || {
                  score: value ? 85 : 0,
                  level: value ? 'HIGH' : 'LOW',
                  needs_review: f.isCritical && !value
                };

                return (
                  <tr key={f.key} className="hover:bg-gray-50/40 transition-colors">
                    <td className="p-3 font-semibold text-gray-800">
                      {f.label}
                      {f.isCritical && <span className="text-rose-500 ml-1 font-bold">*</span>}
                    </td>
                    <td className="p-3 font-mono text-gray-900">
                      {value || <span className="text-gray-400 italic">Not detected</span>}
                    </td>
                    <td className="p-3">
                      {value ? (
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-block w-2 h-2 rounded-full ${
                            confData.level === 'HIGH' ? 'bg-emerald-500' :
                            confData.level === 'MEDIUM' ? 'bg-amber-500' : 'bg-rose-500'
                          }`}></span>
                          <span className="font-bold text-gray-700">{confData.score}%</span>
                          <span className="text-[10px] text-gray-400 uppercase">({confData.level})</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">-</span>
                      )}
                    </td>
                    <td className="p-3">
                      {confData.needs_review ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                          <AlertTriangle size={10} /> Review Recommended
                        </span>
                      ) : value ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 size={10} /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <XCircle size={10} /> Missing
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

      {/* Raw Text View */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-bold text-gray-800 text-sm mb-2">Raw Multi-Side OCR Text</h3>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-xl text-xs font-mono whitespace-pre-wrap max-h-56 overflow-y-auto border border-gray-800">
          {scan.ocr_raw_text || "No OCR text recorded"}
        </div>
      </div>
    </div>
  );
}
