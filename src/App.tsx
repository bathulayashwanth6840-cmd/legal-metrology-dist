import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './i18n/LanguageContext';
import { RoleProvider } from './context/RoleContext';
import Navigation from './components/Navigation';
import HomePage from './pages/HomePage';
import ScanPage from './pages/ScanPage';
import HistoryPage from './pages/HistoryPage';
import ScanDetail from './pages/ScanDetail';
import ProfilePage from './pages/ProfilePage';
import RulesPage from './pages/RulesPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ReportsPage from './pages/ReportsPage';
import ComplaintsPage from './pages/ComplaintsPage';
import ComplaintDetailPage from './pages/ComplaintDetailPage';
import TrackComplaintPage from './pages/TrackComplaintPage';

function App() {
  return (
    <LanguageProvider>
      <RoleProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-slate-50 flex flex-col sm:flex-row text-gray-900 font-sans">
            {/* Main Sidebar / Tab Navigation */}
            <Navigation />

            <div className="flex-1 flex flex-col min-w-0">
              {/* Indian National Tricolor Header Accent Strip */}
              <div className="h-1.5 w-full flex flex-shrink-0 shadow-sm">
                <div className="flex-1 bg-[var(--color-saffron)]"></div>
                <div className="flex-1 bg-white"></div>
                <div className="flex-1 bg-[var(--color-green)]"></div>
              </div>

              <div className="flex-1 overflow-y-auto">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/scan" element={<ScanPage />} />
                  <Route path="/complaints" element={<ComplaintsPage />} />
                  <Route path="/complaints/:id" element={<ComplaintDetailPage />} />
                  <Route path="/track" element={<TrackComplaintPage />} />
                  <Route path="/history" element={<HistoryPage />} />
                  <Route path="/reports" element={<ReportsPage />} />
                  <Route path="/analytics" element={<AnalyticsPage />} />
                  <Route path="/rules" element={<RulesPage />} />
                  <Route path="/scan/:id" element={<ScanDetail />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  {/* Fallback route */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </div>
            </div>
          </div>
        </BrowserRouter>
      </RoleProvider>
    </LanguageProvider>
  );
}

export default App;
