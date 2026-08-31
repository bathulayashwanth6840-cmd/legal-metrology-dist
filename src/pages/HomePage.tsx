import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const [backendStatus, setBackendStatus] = useState<string>('checking...');

  useEffect(() => {
    fetch(import.meta.env.VITE_API_URL + '/health')
      .then(res => res.json())
      .then(data => setBackendStatus(data.status))
      .catch(() => setBackendStatus('offline'));
  }, []);

  return (
    <div className="flex flex-col min-h-full">
      <header className="bg-[var(--color-navy)] text-white p-4 sm:p-6 shadow-md sm:hidden">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-white bg-white">
              <img src="/legal_metrology_logo.jpg" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">Legal Metrology</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 sm:p-6 flex flex-col items-center justify-center text-center pb-24 sm:pb-6">
        <div className="hidden sm:flex items-center gap-2 mb-4 text-sm font-semibold text-gray-500">
           <span className={`inline-block w-2 h-2 rounded-full ${backendStatus === 'ok' ? 'bg-green-500' : 'bg-red-500'}`}></span>
           API: {backendStatus}
        </div>
        
        <h2 className="text-2xl sm:text-4xl font-bold mb-4 text-gray-800">Enforcement Officer Portal</h2>
        <p className="text-gray-600 max-w-md mx-auto mb-8 sm:text-lg">
          Scan packaged commodities to instantly check compliance with the Legal Metrology (Packaged Commodities) Rules, 2011.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-5xl">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center hover:shadow-md transition-shadow">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 text-3xl">📸</div>
            <h3 className="font-semibold text-lg mb-2">1. Scan Label</h3>
            <p className="text-sm text-gray-500">Capture a clear image of the product packaging.</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center hover:shadow-md transition-shadow">
            <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-4 text-3xl">🔍</div>
            <h3 className="font-semibold text-lg mb-2">2. AI Extraction</h3>
            <p className="text-sm text-gray-500">PaddleOCR extracts mandatory declarations.</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center hover:shadow-md transition-shadow">
            <div className="w-16 h-16 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-4 text-3xl">✅</div>
            <h3 className="font-semibold text-lg mb-2">3. Verify Rules</h3>
            <p className="text-sm text-gray-500">Instant compliance check against Legal Metrology Rules.</p>
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="mt-12 w-full max-w-3xl bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-left">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            ⚡ Officer Quick Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link 
              to="/scan" 
              className="flex items-center gap-4 p-4 rounded-xl border border-blue-100 bg-blue-50/50 hover:bg-blue-50 hover:border-blue-200 transition-all group"
            >
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center text-2xl group-hover:scale-105 transition-transform flex-shrink-0">
                📸
              </div>
              <div>
                <span className="block font-bold text-gray-800">New Scan</span>
                <span className="text-[10px] text-gray-500 mt-1">Verify packages via camera/upload</span>
              </div>
            </Link>
            <Link 
              to="/locations" 
              className="flex items-center gap-4 p-4 rounded-xl border border-purple-100 bg-purple-50/50 hover:bg-purple-50 hover:border-purple-200 transition-all group"
            >
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center text-2xl group-hover:scale-105 transition-transform flex-shrink-0">
                📍
              </div>
              <div>
                <span className="block font-bold text-gray-800">Locations</span>
                <span className="text-[10px] text-gray-500 mt-1">View and manage inspection sites</span>
              </div>
            </Link>
            <Link 
              to="/rules" 
              className="flex items-center gap-4 p-4 rounded-xl border border-amber-100 bg-amber-50/50 hover:bg-amber-50 hover:border-amber-200 transition-all group"
            >
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center text-2xl group-hover:scale-105 transition-transform flex-shrink-0">
                📖
              </div>
              <div>
                <span className="block font-bold text-gray-800">Rules & Act</span>
                <span className="text-[10px] text-gray-500 mt-1">Legal Metrology rules database</span>
              </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
