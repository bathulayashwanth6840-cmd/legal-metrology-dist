import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Download } from 'lucide-react';

const METROLOGY_FIELDS = [
  { key: 'product_name', label: 'Product Name' },
  { key: 'manufacturer_name', label: 'Manufacturer Name' },
  { key: 'manufacturer_address', label: 'Manufacturer Address' },
  { key: 'net_quantity', label: 'Net Quantity' },
  { key: 'mrp', label: 'MRP' },
  { key: 'mfg_date', label: 'Mfg / Packing Date' },
  { key: 'expiry_date', label: 'Expiry / Best Before' },
  { key: 'fssai_number', label: 'FSSAI License No.' },
  { key: 'consumer_care', label: 'Consumer Care Details' },
  { key: 'country_of_origin', label: 'Country of Origin' },
];

export default function ScanDetail() {
  const { id } = useParams();
  const [scan, setScan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  useEffect(() => {
    const fetchScan = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${apiUrl}/api/scans/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        setScan(data);
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

  if (loading) return <div className="p-6">Loading...</div>;
  if (!scan) return <div className="p-6 text-red-500">Scan not found</div>;

  const isCompliant = scan.status === 'compliant' || (scan.violations && scan.violations.length === 0);

  return (
    <div className="p-4 sm:p-6 pb-20 max-w-4xl mx-auto">
      <Link to="/history" className="inline-flex items-center text-[var(--color-navy)] mb-6 hover:underline">
        <ArrowLeft size={16} className="mr-1" /> Back to History
      </Link>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex flex-col md:flex-row">
          
          {/* Image Section */}
          <div className="w-full md:w-1/3 bg-gray-100 flex items-center justify-center p-4">
            <img 
              src={`${apiUrl}/uploads/${scan.image_path}`}
              alt="Scanned product"
              className="max-h-96 object-contain rounded shadow-sm"
              onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
            />
          </div>
          
          {/* Details Section */}
          <div className="w-full md:w-2/3 p-6 flex flex-col">
            <div className="flex justify-between items-start mb-4 border-b pb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Scan #{scan.id}</h2>
                <p className="text-sm text-gray-500">{new Date(scan.created_at).toLocaleString()}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                isCompliant ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {scan.status.toUpperCase()}
              </span>
            </div>

            <div className="mb-6 flex-grow">
              <h3 className="font-semibold text-gray-700 mb-3">Compliance Results</h3>
              {isCompliant ? (
                <div className="bg-green-50 text-green-700 p-4 rounded border border-green-200">
                  ✅ No violations found. Product complies with Legal Metrology rules.
                </div>
              ) : (
                <div className="space-y-3">
                  {scan.violations?.map((v: any) => (
                    <div key={v.id} className="bg-red-50 p-3 rounded border border-red-100">
                      <div className="flex justify-between">
                        <span className="font-bold text-red-800 text-sm">{v.rule_code}</span>
                        <span className="text-xs bg-red-200 text-red-900 px-2 rounded font-bold">{v.severity}</span>
                      </div>
                      <p className="text-sm text-red-700 mt-1">{v.rule_description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-4 mt-auto">
              <button 
                onClick={downloadReport}
                className="flex-1 bg-[var(--color-navy)] text-white py-3 rounded-md font-semibold flex justify-center items-center gap-2 hover:bg-blue-900 transition-colors"
              >
                <Download size={18} /> Download PDF Report
              </button>
            </div>

          </div>
        </div>
      </div>
      
      {/* Verified Declarations Table */}
      <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
         <h3 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2">
            📋 Verified Product Declarations
         </h3>
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
               <thead>
                  <tr className="border-b text-gray-500 font-bold bg-gray-50/50">
                     <th className="p-3">Field Name</th>
                     <th className="p-3">Verified Value</th>
                     <th className="p-3">Source</th>
                     <th className="p-3">Confidence</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                  {METROLOGY_FIELDS.map((f) => {
                     const value = scan.extracted_fields?.semantic_fields?.[f.key];
                     const fusionMeta = scan.extracted_fields?.fusion_fields?.[f.key];
                     
                     let sourceBadge = '';
                     let sourceLabel = 'Not Found';
                     if (value) {
                        if (fusionMeta?.source === 'agreed') {
                           sourceBadge = 'bg-emerald-50 text-emerald-700 border border-emerald-200';
                           sourceLabel = 'Double-Verified';
                        } else if (fusionMeta?.source === 'gemini') {
                           sourceBadge = 'bg-purple-50 text-purple-700 border border-purple-200';
                           sourceLabel = 'Gemini AI';
                        } else if (fusionMeta?.source === 'local') {
                           sourceBadge = 'bg-blue-50 text-blue-700 border border-blue-200';
                           sourceLabel = 'Local OCR';
                        } else if (fusionMeta?.source === 'barcode_decoder') {
                           sourceBadge = 'bg-green-50 text-green-700 border border-green-200';
                           sourceLabel = 'Barcode';
                        } else {
                           sourceBadge = 'bg-gray-50 text-gray-600 border border-gray-200';
                           sourceLabel = 'Officer Entered';
                        }
                     }

                     let confidenceBadge = '';
                     let confidenceLabel = 'N/A';
                     if (value) {
                        const conf = fusionMeta?.confidence || 'medium';
                        if (conf === 'high') {
                           confidenceBadge = 'text-green-600 font-bold';
                           confidenceLabel = 'High';
                        } else if (conf === 'medium') {
                           confidenceBadge = 'text-blue-600 font-bold';
                           confidenceLabel = 'Medium';
                        } else {
                           confidenceBadge = 'text-amber-600 font-bold';
                           confidenceLabel = 'Low';
                        }
                     }

                     return (
                        <tr key={f.key} className="hover:bg-gray-50/30 transition-colors">
                           <td className="p-3 font-semibold text-gray-700">{f.label}</td>
                           <td className="p-3 font-mono text-xs">
                              {value || <span className="text-gray-400 italic">Missing</span>}
                           </td>
                           <td className="p-3 text-xs">
                              {value ? (
                                 <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${sourceBadge}`}>
                                    {sourceLabel}
                                 </span>
                              ) : (
                                 <span className="text-gray-400 italic">-</span>
                              )}
                           </td>
                           <td className="p-3 text-xs">
                              {value ? (
                                 <span className={confidenceBadge}>{confidenceLabel}</span>
                              ) : (
                                 <span className="text-gray-400 italic">-</span>
                              )}
                           </td>
                        </tr>
                     );
                  })}
               </tbody>
            </table>
         </div>
      </div>

      {/* Raw Text Accordion or Section */}
      <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
         <h3 className="font-semibold text-gray-700 mb-3">Raw Extracted Text</h3>
         <div className="bg-gray-50 p-4 rounded text-sm font-mono text-gray-600 whitespace-pre-wrap max-h-64 overflow-y-auto">
            {scan.ocr_raw_text}
         </div>
      </div>
    </div>
  );
}
