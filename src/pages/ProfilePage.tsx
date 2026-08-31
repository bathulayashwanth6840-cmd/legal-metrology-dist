export default function ProfilePage({ user }: { user: any }) {

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  if (!user) {
    return <div className="p-6">Loading profile...</div>;
  }

  return (
    <div className="p-4 sm:p-6 pb-20 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Officer Profile</h2>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Banner with logo */}
        <div className="bg-[var(--color-navy)] px-6 py-4 flex justify-between items-center text-white">
          <span className="font-bold tracking-wide text-sm sm:text-base">DEPARTMENT OF LEGAL METROLOGY</span>
          <img src="/legal_metrology_logo.jpg" alt="Logo" className="w-10 h-10 rounded-full border border-white bg-white" />
        </div>
        
        <div className="p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 border-b pb-6 mb-6">
            {/* Officer Avatar */}
            <div className="w-20 h-20 bg-blue-50 text-[var(--color-navy)] rounded-full flex items-center justify-center text-3xl font-bold border-2 border-[var(--color-navy)] flex-shrink-0">
              {user.name ? user.name.charAt(0) : '?'}
            </div>
            
            {/* Officer Details */}
            <div className="text-center sm:text-left flex-grow">
              <h3 className="text-2xl font-bold text-gray-800">{user.name || 'Officer'}</h3>
              <p className="text-gray-500 text-sm mt-1">{user.email}</p>
              
              <div className="mt-3 flex flex-wrap justify-center sm:justify-start gap-2">
                <span className="px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs font-bold flex items-center gap-1">
                  🛡️ Active Inspector
                </span>
                <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-bold">
                  Role: {user.role.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 flex justify-between items-center">
              <div>
                <span className="block text-xs font-semibold text-gray-400 uppercase">Inspector Badge ID</span>
                <span className="font-mono text-sm font-semibold text-gray-700 mt-1 block">LMR-2026-{user.id}</span>
              </div>
              <span className="text-xs text-gray-400 font-medium">Valid ID Card</span>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <span className="block text-xs font-semibold text-gray-400 uppercase mb-2">Authority Stamp</span>
              <div className="flex items-center gap-3">
                <img src="/legal_metrology_logo.jpg" alt="Emblem" className="w-12 h-12 rounded-full border border-gray-200 bg-white" />
                <div>
                  <span className="text-sm font-bold text-gray-800 block">Legal Metrology Compliance Division</span>
                  <span className="text-xs text-gray-500">Government of India</span>
                </div>
              </div>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="mt-8 w-full bg-red-50 text-red-600 font-bold py-3 rounded-lg border border-red-100 hover:bg-red-100 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
