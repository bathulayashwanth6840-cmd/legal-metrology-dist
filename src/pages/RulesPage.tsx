import { useState } from 'react';
import { Search, ChevronDown, ChevronUp, AlertCircle, CheckSquare, ArrowRight, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RuleItem {
  id: number;
  ruleCode: string;
  title: string;
  category: string;
  explanation: string;
  verificationGuidelines: string[];
  violationExamples: string[];
  checkCriteria: string;
}

const SAMPLE_RULES: RuleItem[] = [
  {
    id: 1,
    ruleCode: "Rule 6(1)(a)",
    title: "Common Name of the Commodity",
    category: "Mandatory Declarations",
    explanation: "Every package must declare the common or generic name of the commodity contained in the package.",
    verificationGuidelines: [
      "Verify that the name is prominent and clearly visible on the principal display panel.",
      "Check if generic words like 'Food Product' are qualified by the actual common name (e.g., 'Potato Chips')."
    ],
    violationExamples: [
      "Name printed in extremely small font on the side flap.",
      "Vague representation that doesn't name the actual commodity."
    ],
    checkCriteria: "Name must be in Hindi or English, easily readable, and occupy a prominent position on the principal display area."
  },
  {
    id: 2,
    ruleCode: "Rule 6(1)(b)",
    title: "Net Quantity Declaration",
    category: "Package/Net Quantity",
    explanation: "The net quantity in terms of standard unit of weight or measure or number must be declared on every package.",
    verificationGuidelines: [
      "Verify the net quantity matches standard units (g, kg, ml, L, or units/pcs).",
      "Check if symbols are correct (use 'g' instead of 'gms', 'ml' instead of 'm.l.').",
      "Ensure no qualifying words like 'approximate' or 'when packed' are used."
    ],
    violationExamples: [
      "Using non-standard units (e.g. '1 Kilo' or '10 Gms').",
      "Qualifying statements like 'Net weight when packed: 500g'."
    ],
    checkCriteria: "Must use standard SI symbols only. No trailing abbreviations or qualifying text allowed."
  },
  {
    id: 3,
    ruleCode: "Rule 6(1)(da)",
    title: "Maximum Retail Price (MRP)",
    category: "MRP Declaration",
    explanation: "The maximum retail price inclusive of all taxes must be clearly declared on the package.",
    verificationGuidelines: [
      "Ensure the MRP is printed as 'MRP Rs. XX.XX incl. of all taxes' or similar clear wording.",
      "Verify the price digits are clear and not overwritten or stickered over."
    ],
    violationExamples: [
      "Sticker pasted over pre-printed MRP to inflate the retail price.",
      "Price printed without mentioning that it is inclusive of all taxes."
    ],
    checkCriteria: "Single price declaration. Retail price stickers are illegal unless authorized by the metrology department."
  },
  {
    id: 4,
    ruleCode: "Rule 6(1)(a)",
    title: "Manufacturer / Packer / Importer Details",
    category: "Manufacturer/Importer Details",
    explanation: "Every package must bear the name and complete address of the manufacturer, packer, or importer.",
    verificationGuidelines: [
      "Verify that the complete street address, city, state, and pin code are present.",
      "For imported goods, verify both foreign manufacturer and Indian importer details are declared."
    ],
    violationExamples: [
      "Only declaring 'Marketed by' address without the manufacturer's details.",
      "Providing a PO Box number instead of a physical address."
    ],
    checkCriteria: "Full physical location must be listed. Standard corporate address checks apply."
  },
  {
    id: 5,
    ruleCode: "Rule 6(1)(e)",
    title: "Date of Manufacture / Packing / Import",
    category: "Date/Month/Year Information",
    explanation: "The month and year in which the commodity is manufactured, packed, or imported must be declared.",
    verificationGuidelines: [
      "Verify the format is readable (e.g., 'MM/YYYY' or 'Month YYYY').",
      "Check if the printing is blurred or missing on the bottom of the tin/box."
    ],
    violationExamples: [
      "Month and year stamped in smudged, unreadable ink.",
      "Declaration missing entirely from the packaging."
    ],
    checkCriteria: "Month and Year must be clearly legible. Expiry date, if applicable, should also be displayed."
  },
  {
    id: 6,
    ruleCode: "Rule 6(2)",
    title: "Consumer Care Contact Details",
    category: "Consumer Care Details",
    explanation: "Every package must declare the name, address, telephone number, and email address of the consumer care cell.",
    verificationGuidelines: [
      "Verify that a dedicated telephone helpline number is listed.",
      "Verify a working email address is printed.",
      "Ensure the name of the contact person or designation (e.g. 'Consumer Care Manager') is stated."
    ],
    violationExamples: [
      "Providing a telephone number that is missing digits or invalid.",
      "Missing email address on the consumer care panel."
    ],
    checkCriteria: "All 4 attributes (Name/Designation, Address, Phone, Email) must be present in the consumer panel."
  },
  {
    id: 7,
    ruleCode: "Rule 12",
    title: "Declaration of Size of Letters and Numerals",
    category: "Units and Measurements",
    explanation: "Letters and numerals in the mandatory declarations must match height specifications relative to the package size.",
    verificationGuidelines: [
      "Measure height of net quantity digits using inspection calipers.",
      "Compare package volume/area with Rule 12 size charts (typically 1mm to 6mm minimum height)."
    ],
    violationExamples: [
      "Net quantity digits printed in 0.8mm height on a large 1kg box (requires 4mm)."
    ],
    checkCriteria: "Strict compliance with height charts based on principal display panel size."
  }
];

const CATEGORIES = [
  "All",
  "Mandatory Declarations",
  "Package/Net Quantity",
  "MRP Declaration",
  "Manufacturer/Importer Details",
  "Consumer Care Details",
  "Date/Month/Year Information",
  "Units and Measurements"
];

export default function RulesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isChecklistOpen, setIsChecklistOpen] = useState(true);
  
  const navigate = useNavigate();

  // Search and Filter logic
  const filteredRules = SAMPLE_RULES.filter(rule => {
    const matchesSearch = rule.ruleCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          rule.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          rule.explanation.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'All' || rule.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-4 sm:p-6 pb-20 max-w-5xl mx-auto flex flex-col gap-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            📖 Rules & Guidelines
          </h2>
          <p className="text-gray-500 text-sm">Reference handbook for Legal Metrology (Packaged Commodities) Rules, 2011</p>
        </div>
      </div>

      {/* Official Status Warning Banner */}
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl flex items-start gap-3">
        <ShieldAlert className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
        <div>
          <h4 className="font-bold text-amber-800 text-sm">Sample / Reference Content Only</h4>
          <p className="text-amber-700 text-xs mt-1">
            The rules and sections displayed below are mock records representing the Legal Metrology framework for portal demonstration. Verify with the official gazette or state metrology controller before issuing fines or violation notices.
          </p>
        </div>
      </div>

      {/* Quick Reference Checklist */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <button 
          onClick={() => setIsChecklistOpen(!isChecklistOpen)}
          className="w-full px-5 py-4 bg-gray-50 flex items-center justify-between border-b border-gray-150 hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-2 font-bold text-gray-800 text-sm">
            <CheckSquare className="text-blue-600" size={18} />
            <span>Field Inspection Checklist (Standard Declarations)</span>
          </div>
          {isChecklistOpen ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
        </button>
        
        {isChecklistOpen && (
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 bg-white">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span className="text-emerald-500 font-bold">✓</span> Manufacturer/Packer/Importer details
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span className="text-emerald-500 font-bold">✓</span> Common name of the product
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span className="text-emerald-500 font-bold">✓</span> Net quantity in standard SI units
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span className="text-emerald-500 font-bold">✓</span> MRP (incl. of all taxes)
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span className="text-emerald-500 font-bold">✓</span> Month & Year of packing/import
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span className="text-emerald-500 font-bold">✓</span> Consumer care name, email, phone & address
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span className="text-emerald-500 font-bold">✓</span> Required units and decimal placements
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span className="text-emerald-500 font-bold">✓</span> Digit height relative to package volume
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span className="text-emerald-500 font-bold">✓</span> Country of origin (for imports)
            </div>
          </div>
        )}
      </div>

      {/* Toolbar: Search and Category Tabs */}
      <div className="flex flex-col gap-4">
        {/* Search */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by rule number, declaration, keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-navy)] focus:outline-none text-sm"
            />
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap border transition-all ${
                selectedCategory === cat 
                  ? 'bg-[var(--color-navy)] text-white border-[var(--color-navy)]' 
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Rule Cards Grid */}
      <div className="flex flex-col gap-6">
        {filteredRules.map(rule => (
          <div 
            key={rule.id}
            className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow"
          >
            {/* Title Block */}
            <div className="px-5 py-4 border-b border-gray-150 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[10px] font-bold uppercase tracking-wide">
                  {rule.ruleCode}
                </span>
                <h3 className="font-bold text-gray-800 text-base mt-1">{rule.title}</h3>
              </div>
              <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-2 py-1 rounded">
                {rule.category}
              </span>
            </div>

            {/* Content Details */}
            <div className="p-5 flex flex-col gap-4">
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Rule Explanation</h4>
                <p className="text-sm text-gray-600 mt-1">{rule.explanation}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Guidelines */}
                <div className="bg-slate-50 p-4 rounded-lg border border-gray-150">
                  <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
                    🔍 Field Verification Guidelines
                  </h4>
                  <ul className="list-disc pl-4 mt-2 text-xs text-gray-600 flex flex-col gap-1.5">
                    {rule.verificationGuidelines.map((guideline, idx) => (
                      <li key={idx}>{guideline}</li>
                    ))}
                  </ul>
                </div>

                {/* Common Violations */}
                <div className="bg-red-50/40 p-4 rounded-lg border border-red-100">
                  <h4 className="text-xs font-bold text-red-700 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertCircle size={14} /> Common Violations
                  </h4>
                  <ul className="list-disc pl-4 mt-2 text-xs text-red-700 flex flex-col gap-1.5">
                    {rule.violationExamples.map((violation, idx) => (
                      <li key={idx}>{violation}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Compliance Status Checks */}
              <div className="border-t pt-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Compliance Criteria</h4>
                <p className="text-xs text-gray-500 mt-1 font-medium bg-emerald-50 text-emerald-800 border border-emerald-100 px-3 py-2 rounded-lg">
                  {rule.checkCriteria}
                </p>
              </div>
            </div>

            {/* Inspection Trigger Button */}
            <div className="px-5 py-3.5 bg-gray-50 border-t border-gray-150 flex justify-end">
              <button
                onClick={() => navigate('/scan')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-5 rounded-lg text-xs flex items-center gap-1.5 transition-colors"
              >
                <span>Use This Rule During Inspection</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        ))}

        {filteredRules.length === 0 && (
          <div className="text-center py-10 bg-white border border-gray-100 rounded-xl text-gray-400">
            No rules found matching your filters.
          </div>
        )}
      </div>

    </div>
  );
}
