import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AdminProtectedRoute } from './components/AdminProtectedRoute';
import { AdminLayout } from './components/AdminLayout';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { ExtractionDataPage } from './pages/ExtractionDataPage';
import { EnrichmentFailuresPage } from './pages/EnrichmentFailuresPage';
import { WordSummaryPage } from './pages/WordSummaryPage';
import { UsersPage } from './pages/UsersPage';
import { SystemStatsPage } from './pages/SystemStatsPage';
import { AICostsPage } from './pages/AICostsPage';
import { EnrichmentWorkerPage } from './pages/EnrichmentWorkerPage';
import { FailedJobsPage } from './pages/FailedJobsPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<AdminLoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route element={<AdminProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<AdminDashboardPage />} />
              <Route path="/extraction-data" element={<ExtractionDataPage />} />
              <Route path="/failures" element={<EnrichmentFailuresPage />} />
              <Route path="/words" element={<WordSummaryPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/stats" element={<SystemStatsPage />} />
              <Route path="/ai-costs" element={<AICostsPage />} />
              <Route path="/enrichment" element={<EnrichmentWorkerPage />} />
              <Route path="/failed-jobs" element={<FailedJobsPage />} />
              {/* Placeholder routes for pages not yet created */}
              <Route path="/memory-types" element={<div className="text-gray-600">Memory Types (Coming Soon)</div>} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
