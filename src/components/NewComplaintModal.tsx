import React, { useState } from 'react';
import { PlusCircle, X } from 'lucide-react';
import type { ComplaintPriority, FindingEvidence } from '../types/complaint';
import { useRole } from '../context/RoleContext';
import { useFocusTrap } from '../utils/useFocusTrap';
import EvidencePhotoUpload, { type AttachedEvidence } from './EvidencePhotoUpload';

interface NewComplaintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    inspectionId: string;
    product: {
      productName: string;
      brand: string;
      category: string;
      manufacturerName: string;
      manufacturerAddress: string;
      mrp: string;
      netQuantity: string;
      mfgDate: string;
      expiryDate: string;
      consumerCareDetails: string;
      countryOfOrigin: string;
      barcode: string;
    };
    inspection: {
      location: string;
      marketDistrict: string;
      packageImages?: { side: string; url: string }[];
    };
    findings: FindingEvidence[];
    priority: ComplaintPriority;
  }) => void;
}

export default function NewComplaintModal({
  isOpen,
  onClose,
  onSubmit,
}: NewComplaintModalProps) {
  const { profile } = useRole();
  const [inspectionId, setInspectionId] = useState(`INS-${Math.floor(1000 + Math.random() * 9000)}`);
  const [productName, setProductName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('Packaged Foods & Snacks');
  const [manufacturerName, setManufacturerName] = useState('');
  const [manufacturerAddress, setManufacturerAddress] = useState('');
  const [mrp, setMrp] = useState('');
  const [netQuantity, setNetQuantity] = useState('');
  const [mfgDate] = useState('');
  const [expiryDate] = useState('');
  const [consumerCareDetails] = useState('');
  const [countryOfOrigin] = useState('India');
  const [barcode] = useState('');
  const [location, setLocation] = useState('Retail Market Zone, District Enforcement Jurisdiction');
  const [marketDistrict] = useState('Central District');
  const [priority, setPriority] = useState<ComplaintPriority>('High');
  const [violationDesc, setViolationDesc] = useState('');
  const [evidencePhoto, setEvidencePhoto] = useState<AttachedEvidence | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const modalRef = useFocusTrap({ isOpen, onClose });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) {
      setErrorMessage('Please enter the commodity / product name.');
      return;
    }

    const packageImages = evidencePhoto
      ? [{ side: `Evidence Photo (${evidencePhoto.name})`, url: evidencePhoto.dataUrl }]
      : [];

    const findings: FindingEvidence[] = violationDesc.trim()
      ? [
          {
            id: `FND-${Date.now()}`,
            fieldKey: 'custom_violation',
            fieldLabel: 'Observed Statutory Non-Compliance',
            ruleCode: 'Rule 6 & Rule 12',
            ruleReference: 'Legal Metrology (Packaged Commodities) Rules 2011',
            detectedText: violationDesc,
            requiredStandard: 'Compliance with mandatory Rule 6 declarations and font standards',
            aiStatus: 'POTENTIAL VIOLATION',
            confidence: 0.95,
            evidenceImageUrl: evidencePhoto ? evidencePhoto.dataUrl : undefined,
            evidenceNotes: evidencePhoto
              ? `Visual evidence attached: ${evidencePhoto.name}. Recorded during field inspection / citizen complaint filing.`
              : 'Recorded during field inspection / citizen complaint filing.',
            reviewedByOfficer: false,
          },
        ]
      : [];

    onSubmit({
      inspectionId: inspectionId.trim() || `INS-${Math.floor(1000 + Math.random() * 9000)}`,
      product: {
        productName,
        brand: brand || productName.split(' ')[0] || 'Packaged Commodity',
        category,
        manufacturerName,
        manufacturerAddress,
        mrp,
        netQuantity,
        mfgDate,
        expiryDate,
        consumerCareDetails,
        countryOfOrigin,
        barcode,
      },
      inspection: {
        location,
        marketDistrict,
        packageImages,
      },
      findings,
      priority,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-complaint-modal-title"
      aria-describedby="new-complaint-modal-desc"
    >
      <div
        ref={modalRef}
        className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150 focus:outline-none"
        tabIndex={-1}
      >
        {/* Header */}
        <div className="bg-[var(--color-navy)] text-white p-6 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 flex-shrink-0"
              aria-hidden="true"
            >
              <PlusCircle size={22} />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 block font-bold">
                MANUAL FILING DOCKET
              </span>
              <h2 id="new-complaint-modal-title" className="text-lg font-black text-white">
                Create Complaint / Enquiry Dossier
              </h2>
              <p id="new-complaint-modal-desc" className="text-xs text-blue-200 mt-0.5">
                Logged by: <span className="font-semibold text-white">{profile.name}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close complaint filing dialog"
            className="text-slate-400 hover:text-white p-1.5 rounded-lg transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
          {errorMessage && (
            <div
              role="alert"
              aria-live="assertive"
              className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 font-medium"
            >
              {errorMessage}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="complaint-insp-id" className="font-bold text-slate-700 block mb-1">
                Referenced Inspection ID:
              </label>
              <input
                id="complaint-insp-id"
                type="text"
                value={inspectionId}
                onChange={(e) => setInspectionId(e.target.value)}
                placeholder="e.g. INS-1024"
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold text-slate-900 placeholder:text-slate-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="complaint-priority" className="font-bold text-slate-700 block mb-1">
                Priority Level:
              </label>
              <select
                id="complaint-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as ComplaintPriority)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="High" className="bg-white text-slate-900">🔴 High Priority (48h Action)</option>
                <option value="Medium" className="bg-white text-slate-900">🟡 Medium Priority (7d Review)</option>
                <option value="Low" className="bg-white text-slate-900">🟢 Low Priority (15d Standard)</option>
              </select>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3">
            <span className="font-black text-slate-900 block text-xs uppercase tracking-wider mb-2">
              Product Information
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label htmlFor="complaint-product-name" className="font-bold text-slate-700 block mb-1">
                  Product Name <span className="text-rose-600">*</span>:
                </label>
                <input
                  id="complaint-product-name"
                  type="text"
                  required
                  aria-required="true"
                  value={productName}
                  onChange={(e) => {
                    setProductName(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="e.g. Haldiram's Nagpur Bhujia Sev 400g"
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-900 placeholder:text-slate-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="complaint-brand" className="font-bold text-slate-700 block mb-1">
                  Brand Name:
                </label>
                <input
                  id="complaint-brand"
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. Haldiram's"
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-900 placeholder:text-slate-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="complaint-category" className="font-bold text-slate-700 block mb-1">
                  Category:
                </label>
                <input
                  id="complaint-category"
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Packaged Food, Cosmetics, Detergents"
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-900 placeholder:text-slate-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="complaint-mrp" className="font-bold text-slate-700 block mb-1">
                  Declared MRP:
                </label>
                <input
                  id="complaint-mrp"
                  type="text"
                  value={mrp}
                  onChange={(e) => setMrp(e.target.value)}
                  placeholder="e.g. ₹140.00"
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono font-medium text-slate-900 placeholder:text-slate-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="complaint-net-qty" className="font-bold text-slate-700 block mb-1">
                  Net Quantity:
                </label>
                <input
                  id="complaint-net-qty"
                  type="text"
                  value={netQuantity}
                  onChange={(e) => setNetQuantity(e.target.value)}
                  placeholder="e.g. 400 g / 1 Litre"
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono font-medium text-slate-900 placeholder:text-slate-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="complaint-mfg-name" className="font-bold text-slate-700 block mb-1">
                  Manufacturer Name & Address:
                </label>
                <input
                  id="complaint-mfg-name"
                  type="text"
                  value={manufacturerName}
                  onChange={(e) => setManufacturerName(e.target.value)}
                  placeholder="Manufacturer name"
                  className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-900 placeholder:text-slate-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-1.5"
                />
                <input
                  id="complaint-mfg-address"
                  type="text"
                  value={manufacturerAddress}
                  onChange={(e) => setManufacturerAddress(e.target.value)}
                  aria-label="Manufacturer complete physical address"
                  placeholder="Complete physical address with PIN code"
                  className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-900 placeholder:text-slate-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Evidence / Product Photo Upload Section (Optional) */}
          <div className="border-t border-slate-100 pt-3">
            <EvidencePhotoUpload
              evidence={evidencePhoto}
              onChange={setEvidencePhoto}
            />
          </div>

          <div className="border-t border-slate-100 pt-3">
            <span className="font-black text-slate-900 block text-xs uppercase tracking-wider mb-2">
              Inspection / Seizure Location & Violation Summary
            </span>
            <div className="space-y-3">
              <div>
                <label htmlFor="complaint-location" className="font-bold text-slate-700 block mb-1">
                  Market Location / Retail Point:
                </label>
                <input
                  id="complaint-location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Retail Store Counter #4, Sector 18, Noida"
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-900 placeholder:text-slate-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="complaint-violation-desc" className="font-bold text-slate-700 block mb-1">
                  Observed Statutory Violation / Defect:
                </label>
                <textarea
                  id="complaint-violation-desc"
                  rows={2}
                  value={violationDesc}
                  onChange={(e) => setViolationDesc(e.target.value)}
                  placeholder="Describe non-compliance (e.g., dual MRP sticker, missing consumer care helpline, smudged net weight)..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-900 placeholder:text-slate-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[var(--color-navy)] hover:bg-blue-900 text-white font-bold rounded-xl flex items-center gap-2 shadow-sm transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              <PlusCircle size={16} aria-hidden="true" />
              <span>Create Complaint Docket</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
