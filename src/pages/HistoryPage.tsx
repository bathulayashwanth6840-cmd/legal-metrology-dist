import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';

export default function HistoryPage() {
  const [scans, setScans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScans();
  }, []);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  const fetchScans = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/api/scans/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setScans(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteScan = async (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this scan from history?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/api/scans/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        setScans(scans.filter(scan => scan.id !== id));
      } else {
        alert('Failed to delete scan');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-4 sm:p-6 pb-20">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Scan History</h2>
      
      {loading ? (
        <div className="animate-pulse flex flex-col gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg w-full"></div>
          ))}
        </div>
      ) : scans.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          No scans found. Start by capturing a new product label.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {scans.map(scan => (
            <Link 
              to={`/scan/${scan.id}`} 
              key={scan.id}
              className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 flex gap-4 hover:shadow-md transition-shadow relative"
            >
              <div className="w-20 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                <img 
                  src={`${apiUrl}/uploads/${scan.image_path}`} 
                  alt="Scan thumbnail"
                  className="w-full h-full object-cover"
                  onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                />
              </div>
              <div className="flex-grow flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs text-gray-500">
                      {new Date(scan.created_at).toLocaleDateString()}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded ${
                      scan.status === 'compliant' ? 'bg-green-100 text-green-800' : 
                      scan.status === 'non_compliant' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {scan.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-800 line-clamp-2">
                    ID: {scan.id}
                  </p>
                </div>
                
                <div className="mt-2 text-xs text-gray-500 flex justify-between items-center">
                  <span>{scan.violations ? scan.violations.length : 0} violations</span>
                  <button
                    onClick={(e) => deleteScan(e, scan.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
                    title="Delete Scan"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
