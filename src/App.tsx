import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './i18n/LanguageContext';
import { RoleProvider } from './context/RoleContext';
import { ThemeProvider } from './context/ThemeContext';
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
import LoginPage from './pages/LoginPage';

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <RoleProvider>
          <HashRouter>
            {/* Skip to Main Content Link for Keyboard / Screen Reader Accessibility */}
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-amber-400 focus:text-slate-950 focus:font-bold focus:rounded-lg focus:shadow-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              Skip to main content
            </a>

            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col sm:flex-row text-gray-900 dark:text-slate-100 font-sans transition-colors">
              {/* Main Sidebar / Tab Navigation */}
              <Navigation />

              <div className="flex-1 flex flex-col min-w-0">
                {/* Indian National Tricolor Header Accent Strip */}
                <div className="h-1.5 w-full flex flex-shrink-0 shadow-sm" aria-hidden="true">
                  <div className="flex-1 bg-[var(--color-saffron)]"></div>
                  <div className="flex-1 bg-white"></div>
                  <div className="flex-1 bg-[var(--color-green)]"></div>
                </div>

                <main id="main-content" className="flex-1 overflow-y-auto focus:outline-none" tabIndex={-1}>
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
                    <Route path="/login" element={<LoginPage />} />
                    {/* Fallback route */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </main>
              </div>
            </div>
          </HashRouter>
        </RoleProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
