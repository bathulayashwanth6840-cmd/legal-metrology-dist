// src/components/NewComplaintModal.tsx
import React, { useState } from 'react';
import { PlusCircle, X } from 'lucide-react';
import type { ComplaintPriority, FindingEvidence } from '../types/complaint';
import { useRole } from '../context/RoleContext';

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

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) {
      alert('Please enter a product name.');
      return;
    }

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
            evidenceNotes: 'Recorded during field inspection / citizen complaint filing.',
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
      },
      findings,
      priority,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[var(--color-navy)] text-white p-6 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 flex-shrink-0">
              <PlusCircle size={22} />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 block font-bold">
                MANUAL FILING DOCKET
              </span>
              <h3 className="text-lg font-black text-white">Create Complaint / Enquiry Dossier</h3>
              <p className="text-xs text-blue-200 mt-0.5">
                Logged by: <span className="font-semibold text-white">{profile.name}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Referenced Inspection ID:</label>
              <input
                type="text"
                value={inspectionId}
                onChange={(e) => setInspectionId(e.target.value)}
                placeholder="e.g. INS-1024"
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold text-slate-800"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Priority Level:</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as ComplaintPriority)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
              >
                <option value="High">🔴 High Priority (48h Action)</option>
                <option value="Medium">🟡 Medium Priority (7d Review)</option>
                <option value="Low">🟢 Low Priority (15d Standard)</option>
              </select>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3">
            <span className="font-black text-slate-900 block text-xs uppercase tracking-wider mb-2">
              Product Information
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 block mb-1">Product Name *:</label>
                <input
                  type="text"
                  required
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g. Haldiram's Nagpur Bhujia Sev 400g"
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Brand Name:</label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. Haldiram's"
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Category:</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Packaged Food, Cosmetics, Detergents"
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Declared MRP:</label>
                <input
                  type="text"
                  value={mrp}
                  onChange={(e) => setMrp(e.target.value)}
                  placeholder="e.g. ₹140.00"
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Net Quantity:</label>
                <input
                  type="text"
                  value={netQuantity}
                  onChange={(e) => setNetQuantity(e.target.value)}
                  placeholder="e.g. 400 g / 1 Litre"
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 block mb-1">Manufacturer Name & Address:</label>
                <input
                  type="text"
                  value={manufacturerName}
                  onChange={(e) => setManufacturerName(e.target.value)}
                  placeholder="Manufacturer name"
                  className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 mb-1.5"
                />
                <input
                  type="text"
                  value={manufacturerAddress}
                  onChange={(e) => setManufacturerAddress(e.target.value)}
                  placeholder="Complete physical address with PIN code"
                  className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3">
            <span className="font-black text-slate-900 block text-xs uppercase tracking-wider mb-2">
              Inspection / Seizure Location & Violation Summary
            </span>
            <div className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Market Location / Retail Point:</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Retail Store Counter #4, Sector 18, Noida"
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Observed Statutory Violation / Defect:</label>
                <textarea
                  rows={2}
                  value={violationDesc}
                  onChange={(e) => setViolationDesc(e.target.value)}
                  placeholder="Describe non-compliance (e.g., dual MRP sticker, missing consumer care helpline, smudged net weight)..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[var(--color-navy)] hover:bg-blue-900 text-white font-bold rounded-xl flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <PlusCircle size={16} />
              <span>Create Complaint Docket</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
