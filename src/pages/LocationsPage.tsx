import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ScanHistoryItem {
  id: number;
  date: string;
  status: 'compliant' | 'non_compliant' | 'pending';
  violationsCount: number;
}

interface LocationItem {
  id: number;
  name: string;
  address: string;
  totalInspections: number;
  compliantCount: number;
  violationCount: number;
  lastInspectionDate: string;
  status: 'Active' | 'No Recent Inspection';
  coordinates: { x: number; y: number }; // Relative coordinates for SVG Map
  history: ScanHistoryItem[];
}

const MOCK_LOCATIONS: LocationItem[] = [
  {
    id: 1,
    name: "Reliance Smart Supermarket",
    address: "Metro Plaza, Sector 18, Noida, Uttar Pradesh 201301",
    totalInspections: 12,
    compliantCount: 10,
    violationCount: 2,
    lastInspectionDate: "2026-08-29",
    status: "Active",
    coordinates: { x: 80, y: 110 },
    history: [
      { id: 2, date: "2026-08-29", status: "non_compliant", violationsCount: 2 },
      { id: 1, date: "2026-08-27", status: "compliant", violationsCount: 0 }
    ]
  },
  {
    id: 2,
    name: "Aggarwal Sweet Corner",
    address: "Main Market Road, Block C, Noida, Uttar Pradesh 201301",
    totalInspections: 4,
    compliantCount: 1,
    violationCount: 3,
    lastInspectionDate: "2026-08-28",
    status: "Active",
    coordinates: { x: 260, y: 90 },
    history: [
      { id: 3, date: "2026-08-28", status: "non_compliant", violationsCount: 3 }
    ]
  },
  {
    id: 3,
    name: "Spencers Grocery Mart",
    address: "Level 1, Mall of India, Noida, Uttar Pradesh 201301",
    totalInspections: 8,
    compliantCount: 8,
    violationCount: 0,
    lastInspectionDate: "2026-08-25",
    status: "Active",
    coordinates: { x: 150, y: 240 },
    history: [
      { id: 4, date: "2026-08-25", status: "compliant", violationsCount: 0 }
    ]
  },
  {
    id: 4,
    name: "BigBazaar Outlet",
    address: "Shipra Mall, Indirapuram, Ghaziabad, Uttar Pradesh 201014",
    totalInspections: 15,
    compliantCount: 11,
    violationCount: 4,
    lastInspectionDate: "2026-08-15",
    status: "No Recent Inspection",
    coordinates: { x: 310, y: 200 },
    history: [
      { id: 5, date: "2026-08-15", status: "non_compliant", violationsCount: 1 }
    ]
  },
  {
    id: 5,
    name: "Gupta Provision Store",
    address: "Gali No 2, Sector 22, Noida, Uttar Pradesh 201301",
    totalInspections: 3,
    compliantCount: 3,
    violationCount: 0,
    lastInspectionDate: "2026-08-01",
    status: "No Recent Inspection",
    coordinates: { x: 190, y: 150 },
    history: [
      { id: 6, date: "2026-08-01", status: "compliant", violationsCount: 0 }
    ]
  }
];

export default function LocationsPage() {
  const locations = MOCK_LOCATIONS;
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'no_recent' | 'violations'>('all');
  const [selectedLocation, setSelectedLocation] = useState<LocationItem | null>(null);
  const [hoveredLocationId, setHoveredLocationId] = useState<number | null>(null);
  const [realScanIds, setRealScanIds] = useState<number[]>([]);

  useEffect(() => {
    const fetchScans = async () => {
      try {
        const token = localStorage.getItem('token');
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8001';
        const res = await fetch(`${apiUrl}/api/scans/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setRealScanIds(data.map((s: any) => s.id));
        }
      } catch (err) {
        console.error("Failed to load real scans list", err);
      }
    };
    fetchScans();
  }, []);

  // Filter & Search Logic
  const filteredLocations = locations.filter(loc => {
    const matchesSearch = loc.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          loc.address.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    if (selectedFilter === 'active') return loc.status === 'Active';
    if (selectedFilter === 'no_recent') return loc.status === 'No Recent Inspection';
    if (selectedFilter === 'violations') return loc.violationCount > 0;
    
    return true;
  });

  // Today's date check (mocked to 2026-08-29)
  const inspectedTodayCount = locations.filter(loc => loc.lastInspectionDate === "2026-08-29").length;
  const locationsWithViolationsCount = locations.filter(loc => loc.violationCount > 0).length;

  return (
    <div className="p-4 sm:p-6 pb-20 max-w-7xl mx-auto flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Inspection Locations</h2>
          <p className="text-gray-500 text-sm">View and manage outlet inspection sites and audit records</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xl">🏢</div>
          <div>
            <span className="block text-xs font-semibold text-gray-400 uppercase">Total Outlets</span>
            <span className="text-2xl font-bold text-gray-850">{locations.length}</span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl">📅</div>
          <div>
            <span className="block text-xs font-semibold text-gray-400 uppercase">Inspected Today</span>
            <span className="text-2xl font-bold text-gray-850">{inspectedTodayCount}</span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-red-50 text-red-600 flex items-center justify-center text-xl">⚠️</div>
          <div>
            <span className="block text-xs font-semibold text-gray-400 uppercase">With Violations</span>
            <span className="text-2xl font-bold text-red-600">{locationsWithViolationsCount}</span>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: List & Filters */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Toolbar */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search shop name or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-navy)] focus:outline-none text-sm"
              />
            </div>
            
            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2 text-xs">
              <button 
                onClick={() => setSelectedFilter('all')}
                className={`px-3 py-1.5 rounded-full border transition-colors ${selectedFilter === 'all' ? 'bg-[var(--color-navy)] text-white border-[var(--color-navy)]' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
              >
                All
              </button>
              <button 
                onClick={() => setSelectedFilter('active')}
                className={`px-3 py-1.5 rounded-full border transition-colors ${selectedFilter === 'active' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
              >
                Active
              </button>
              <button 
                onClick={() => setSelectedFilter('no_recent')}
                className={`px-3 py-1.5 rounded-full border transition-colors ${selectedFilter === 'no_recent' ? 'bg-yellow-600 text-white border-yellow-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
              >
                No Recent Inspection
              </button>
              <button 
                onClick={() => setSelectedFilter('violations')}
                className={`px-3 py-1.5 rounded-full border transition-colors ${selectedFilter === 'violations' ? 'bg-red-600 text-white border-red-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
              >
                With Violations
              </button>
            </div>
          </div>

          {/* Location Cards */}
          <div className="flex flex-col gap-4">
            {filteredLocations.map(loc => (
              <div 
                key={loc.id}
                onClick={() => setSelectedLocation(loc)}
                onMouseEnter={() => setHoveredLocationId(loc.id)}
                onMouseLeave={() => setHoveredLocationId(null)}
                className={`bg-white rounded-xl shadow-sm border p-5 flex flex-col sm:flex-row justify-between items-start gap-4 hover:shadow-md transition-all cursor-pointer ${hoveredLocationId === loc.id ? 'border-[var(--color-navy)] ring-1 ring-[var(--color-navy)]' : 'border-gray-100'}`}
              >
                <div className="flex-1 flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-lg flex-shrink-0">
                    📍
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-base">{loc.name}</h3>
                    <p className="text-gray-500 text-xs mt-1">{loc.address}</p>
                    
                    <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500 font-medium">
                      <span className="flex items-center gap-1">📊 <strong>{loc.totalInspections}</strong> inspections</span>
                      <span className="flex items-center gap-1 text-emerald-600">✅ <strong>{loc.compliantCount}</strong> compliant</span>
                      <span className="flex items-center gap-1 text-red-600">⚠️ <strong>{loc.violationCount}</strong> violations</span>
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col items-end gap-2 w-full sm:w-auto justify-between sm:justify-start border-t sm:border-0 pt-3 sm:pt-0">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${loc.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {loc.status}
                  </span>
                  <div className="text-right">
                    <span className="block text-[10px] text-gray-400 font-bold uppercase">Last Inspected</span>
                    <span className="text-xs text-gray-600 font-semibold">{loc.lastInspectionDate}</span>
                  </div>
                </div>
              </div>
            ))}
            {filteredLocations.length === 0 && (
              <div className="text-center py-10 bg-white border border-gray-100 rounded-xl text-gray-400">
                No inspection sites found matching the filters.
              </div>
            )}
          </div>
        </div>

        {/* Right column: Interactive Map */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 h-[350px] lg:h-[500px] flex flex-col gap-4">
          <div>
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              🗺️ Zone Inspection Map
            </h3>
            <p className="text-[10px] text-gray-400 uppercase font-semibold mt-0.5">District Area 4 - Local Outlets</p>
          </div>
          
          {/* Map canvas */}
          <div className="flex-1 bg-slate-50 border border-gray-200 rounded-lg relative overflow-hidden flex items-center justify-center">
            {/* SVG Interactive Map Grid */}
            <svg 
              viewBox="0 0 400 300" 
              className="w-full h-full object-cover select-none"
            >
              {/* Rivers/Parks backgrounds */}
              <rect x="0" y="0" width="400" height="300" fill="#f8fafc" />
              <path d="M 0 150 Q 150 180 200 130 T 400 170" fill="none" stroke="#e2e8f0" strokeWidth="16" />
              <path d="M 0 150 Q 150 180 200 130 T 400 170" fill="none" stroke="#e0f2fe" strokeWidth="10" /> {/* River */}
              
              <rect x="180" y="20" width="70" height="50" rx="10" fill="#f0fdf4" stroke="#dcfce7" strokeWidth="1" /> {/* Park */}
              
              {/* Roads street grid */}
              <line x1="40" y1="0" x2="40" y2="300" stroke="#e2e8f0" strokeWidth="6" />
              <line x1="140" y1="0" x2="140" y2="300" stroke="#e2e8f0" strokeWidth="6" />
              <line x1="240" y1="0" x2="240" y2="300" stroke="#e2e8f0" strokeWidth="6" strokeDasharray="4 2" />
              <line x1="340" y1="0" x2="340" y2="300" stroke="#e2e8f0" strokeWidth="6" />
              
              <line x1="0" y1="60" x2="400" y2="60" stroke="#e2e8f0" strokeWidth="6" />
              <line x1="0" y1="180" x2="400" y2="180" stroke="#e2e8f0" strokeWidth="6" />
              <line x1="0" y1="260" x2="400" y2="260" stroke="#e2e8f0" strokeWidth="6" />
              
              {/* Map Pins */}
              {filteredLocations.map(loc => {
                const isHovered = hoveredLocationId === loc.id;
                return (
                  <g 
                    key={loc.id}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredLocationId(loc.id)}
                    onMouseLeave={() => setHoveredLocationId(null)}
                    onClick={() => setSelectedLocation(loc)}
                  >
                    {/* Ripple animation on hover */}
                    {isHovered && (
                      <circle 
                        cx={loc.coordinates.x} 
                        cy={loc.coordinates.y} 
                        r="12" 
                        fill={loc.violationCount > 0 ? '#fee2e2' : '#dcfce7'} 
                        opacity="0.6"
                      >
                        <animate attributeName="r" values="8;18;8" dur="1.5s" repeatCount="indefinite" />
                      </circle>
                    )}
                    
                    {/* Pin Circle */}
                    <circle 
                      cx={loc.coordinates.x} 
                      cy={loc.coordinates.y} 
                      r={isHovered ? 8 : 6} 
                      fill={loc.violationCount > 0 ? '#ef4444' : '#10b981'} 
                      stroke="#ffffff" 
                      strokeWidth="2"
                      className="transition-all duration-200" 
                    />
                    {/* Pin shadow */}
                    <ellipse cx={loc.coordinates.x} cy={loc.coordinates.y + 7} rx="4" ry="1.5" fill="#000000" opacity="0.15" />
                    
                    {/* Tooltip on hover */}
                    {isHovered && (
                      <g transform={`translate(${loc.coordinates.x - 60}, ${loc.coordinates.y - 45})`}>
                        <rect width="120" height="32" rx="6" fill="#0f172a" opacity="0.9" />
                        <text x="60" y="14" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">
                          {loc.name.length > 20 ? `${loc.name.substring(0, 18)}...` : loc.name}
                        </text>
                        <text x="60" y="24" fill={loc.violationCount > 0 ? '#fca5a5' : '#a7f3d0'} fontSize="7" textAnchor="middle">
                          {loc.violationCount > 0 ? `${loc.violationCount} Violations` : 'Compliant'}
                        </text>
                        <polygon points="55,32 65,32 60,37" fill="#0f172a" opacity="0.9" />
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
            
            {/* Map Legends */}
            <div className="absolute bottom-2 right-2 bg-white/95 backdrop-blur px-2.5 py-1.5 rounded-md border border-gray-200 text-[9px] flex gap-3 font-semibold shadow-sm text-gray-500">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white"></span> Compliant</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 border border-white"></span> Violating</span>
            </div>
          </div>
        </div>

      </div>

      {/* History Slide-out Panel (Modal) */}
      {selectedLocation && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-end">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col p-6 overflow-y-auto animate-slide-in">
            <div className="flex justify-between items-start border-b pb-4 mb-5">
              <div>
                <span className="inline-block px-2 py-0.5 bg-purple-50 border border-purple-200 text-purple-700 font-bold rounded text-[9px] uppercase tracking-wide">
                  Outlet Directory
                </span>
                <h3 className="text-xl font-bold text-gray-800 mt-1">{selectedLocation.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{selectedLocation.address}</p>
              </div>
              <button 
                onClick={() => setSelectedLocation(null)}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <h4 className="font-bold text-gray-700 text-sm mb-3">Audit Logs & History</h4>
            
            <div className="flex flex-col gap-3 flex-grow">
              {selectedLocation.history.map(item => {
                const isReal = realScanIds.includes(item.id);
                const content = (
                  <>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="block text-xs font-bold text-gray-700">Audit ID: #{item.id}</span>
                        {!isReal && (
                          <span className="text-[8px] bg-gray-200 text-gray-550 border border-gray-300 font-bold px-1 rounded uppercase tracking-wide">
                            Demo Record
                          </span>
                        )}
                      </div>
                      <span className="block text-[10px] text-gray-400 font-medium mt-0.5">{item.date}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded ${
                        item.status === 'compliant' ? 'bg-green-100 text-green-800' : 
                        item.status === 'non_compliant' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {item.status === 'compliant' ? 'COMPLIANT' : item.status === 'non_compliant' ? 'VIOLATIONS' : 'PENDING'}
                      </span>
                      {isReal && <span className="text-gray-300 text-sm">→</span>}
                    </div>
                  </>
                );

                if (isReal) {
                  return (
                    <Link 
                      to={`/scan/${item.id}`}
                      key={item.id}
                      onClick={() => setSelectedLocation(null)}
                      className="p-4 rounded-xl border border-gray-150 bg-gray-50 hover:bg-gray-100 transition-colors flex justify-between items-center"
                    >
                      {content}
                    </Link>
                  );
                } else {
                  return (
                    <div 
                      key={item.id}
                      title="This is a demo record. Real inspection reports are only generated for scans captured through the portal."
                      className="p-4 rounded-xl border border-gray-150 bg-gray-50/70 opacity-80 flex justify-between items-center cursor-help"
                    >
                      {content}
                    </div>
                  );
                }
              })}
            </div>

            <div className="border-t pt-5 mt-5">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <span className="block text-[9px] font-bold text-gray-400 uppercase">Compliant Audits</span>
                  <span className="text-lg font-bold text-emerald-600 mt-1 block">{selectedLocation.compliantCount}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <span className="block text-[9px] font-bold text-gray-400 uppercase">Violating Audits</span>
                  <span className="text-lg font-bold text-red-600 mt-1 block">{selectedLocation.violationCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
