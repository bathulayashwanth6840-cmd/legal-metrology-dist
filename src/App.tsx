import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navigation from './components/Navigation';
import HomePage from './pages/HomePage';
import ScanPage from './pages/ScanPage';
import HistoryPage from './pages/HistoryPage';
import ScanDetail from './pages/ScanDetail';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import LocationsPage from './pages/LocationsPage';
import RulesPage from './pages/RulesPage';

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
        const response = await fetch(`${apiUrl}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          localStorage.removeItem('token');
        }
      } catch (err) {
        console.error("Auth check failed", err);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  // Protected route wrapper
  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (!user) {
      return <Navigate to="/login" replace />;
    }
    return <>{children}</>;
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 flex flex-col sm:flex-row">
        {user && <Navigation />}
        
        <div className="flex-1 flex flex-col min-w-0">
          {/* Tricolor accent strip */}
          <div className="h-2 w-full flex flex-shrink-0">
            <div className="flex-1 bg-[var(--color-saffron)]"></div>
            <div className="flex-1 bg-white"></div>
            <div className="flex-1 bg-[var(--color-green)]"></div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <Routes>
              <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
              <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
              <Route path="/scan" element={<ProtectedRoute><ScanPage /></ProtectedRoute>} />
              <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
              <Route path="/locations" element={<ProtectedRoute><LocationsPage /></ProtectedRoute>} />
              <Route path="/rules" element={<ProtectedRoute><RulesPage /></ProtectedRoute>} />
              <Route path="/scan/:id" element={<ProtectedRoute><ScanDetail /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><ProfilePage user={user} /></ProtectedRoute>} />
            </Routes>
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
