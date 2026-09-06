import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { LanguageProvider } from './i18n/LanguageContext';
import { RoleProvider } from './context/RoleContext';
import { ThemeProvider } from './context/ThemeContext';
import Navigation from './components/Navigation';
import ProtectedRoute from './components/ProtectedRoute';
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

function AppLayout() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  if (isLoginPage) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
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
            {/* Dashboard: All authenticated roles */}
            <Route
              path="/"
              element={
                <ProtectedRoute allowedRoles={['citizen', 'inspector', 'admin']}>
                  <HomePage />
                </ProtectedRoute>
              }
            />

            {/* New Inspection Scanner: Officer & Admin only */}
            <Route
              path="/scan"
              element={
                <ProtectedRoute
                  allowedRoles={['inspector', 'admin']}
                  requiredRoleName="Legal Metrology Officer or Administrator"
                  targetFeatureName="Autonomous Packaging Inspection Scanner"
                >
                  <ScanPage />
                </ProtectedRoute>
              }
            />

            {/* Scan Inspection Dossier Detail: Officer & Admin only */}
            <Route
              path="/scan/:id"
              element={
                <ProtectedRoute
                  allowedRoles={['inspector', 'admin']}
                  requiredRoleName="Legal Metrology Officer or Administrator"
                  targetFeatureName="Packaging Inspection Dossier & Override Verification"
                >
                  <ScanDetail />
                </ProtectedRoute>
              }
            />

            {/* Complaints & Enquiries: Citizen & Admin */}
            <Route
              path="/complaints"
              element={
                <ProtectedRoute
                  allowedRoles={['citizen', 'admin']}
                  requiredRoleName="Citizen or Administrator"
                  targetFeatureName="Complaints & Enquiries Management"
                >
                  <ComplaintsPage />
                </ProtectedRoute>
              }
            />

            {/* Complaint Detail Docket */}
            <Route
              path="/complaints/:id"
              element={
                <ProtectedRoute
                  allowedRoles={['citizen', 'admin', 'inspector']}
                  requiredRoleName="Authorized Persona"
                  targetFeatureName="Complaint Details & Investigation Docket"
                >
                  <ComplaintDetailPage />
                </ProtectedRoute>
              }
            />

            {/* Track Complaint: Citizen, Officer, Admin */}
            <Route
              path="/track"
              element={
                <ProtectedRoute
                  allowedRoles={['citizen', 'inspector', 'admin']}
                  requiredRoleName="Authorized Persona"
                  targetFeatureName="Complaint Tracking Portal"
                >
                  <TrackComplaintPage />
                </ProtectedRoute>
              }
            />

            {/* Inspection History: Officer & Admin only */}
            <Route
              path="/history"
              element={
                <ProtectedRoute
                  allowedRoles={['inspector', 'admin']}
                  requiredRoleName="Legal Metrology Officer or Administrator"
                  targetFeatureName="Field Inspection History & Archival Dossiers"
                >
                  <HistoryPage />
                </ProtectedRoute>
              }
            />

            {/* Reports: Officer & Admin only */}
            <Route
              path="/reports"
              element={
                <ProtectedRoute
                  allowedRoles={['inspector', 'admin']}
                  requiredRoleName="Legal Metrology Officer or Administrator"
                  targetFeatureName="Enforcement Summary Reports & Certified Assessment PDFs"
                >
                  <ReportsPage />
                </ProtectedRoute>
              }
            />

            {/* Compliance Analytics: Admin only */}
            <Route
              path="/analytics"
              element={
                <ProtectedRoute
                  allowedRoles={['admin']}
                  requiredRoleName="Administrator"
                  targetFeatureName="Compliance Analytics & Directorate Violation Metrics"
                >
                  <AnalyticsPage />
                </ProtectedRoute>
              }
            />

            {/* Rules & Act: All roles */}
            <Route
              path="/rules"
              element={
                <ProtectedRoute allowedRoles={['citizen', 'inspector', 'admin']}>
                  <RulesPage />
                </ProtectedRoute>
              }
            />

            {/* Settings & Profile: All roles */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute allowedRoles={['citizen', 'inspector', 'admin']}>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            {/* Login / Role Selection */}
            <Route path="/login" element={<LoginPage />} />

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

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

            <AppLayout />
          </HashRouter>
        </RoleProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
