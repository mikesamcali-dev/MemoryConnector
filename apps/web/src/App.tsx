import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './components/AppLayout';
import { OfflineStatusToast } from './components/SyncToast';

// Lazy load pages for better initial bundle size
const HomePage = lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const SignupPage = lazy(() => import('./pages/SignupPage').then(m => ({ default: m.SignupPage })));
const CapturePage = lazy(() => import('./pages/CapturePage').then(m => ({ default: m.CapturePage })));
const SearchPage = lazy(() => import('./pages/SearchPage').then(m => ({ default: m.SearchPage })));
const MemoryDetailPage = lazy(() => import('./pages/MemoryDetailPage').then(m => ({ default: m.MemoryDetailPage })));
const RemindersPage = lazy(() => import('./pages/RemindersPage').then(m => ({ default: m.RemindersPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage').then(m => ({ default: m.AdminDashboardPage })));
const ExtractionDataPage = lazy(() => import('./pages/ExtractionDataPage').then(m => ({ default: m.ExtractionDataPage })));
const EnrichmentFailuresPage = lazy(() => import('./pages/EnrichmentFailuresPage').then(m => ({ default: m.EnrichmentFailuresPage })));
const WordSummaryPage = lazy(() => import('./pages/WordSummaryPage').then(m => ({ default: m.WordSummaryPage })));
const AuditTrailPage = lazy(() => import('./pages/AuditTrailPage').then(m => ({ default: m.AuditTrailPage })));
const LinkMemoryPage = lazy(() => import('./pages/LinkMemoryPage').then(m => ({ default: m.LinkMemoryPage })));
const UpgradePage = lazy(() => import('./pages/UpgradePage').then(m => ({ default: m.UpgradePage })));
const LocationBuilderPage = lazy(() => import('./pages/LocationBuilderPage').then(m => ({ default: m.LocationBuilderPage })));
const LocationMemoriesPage = lazy(() => import('./pages/LocationMemoriesPage').then(m => ({ default: m.LocationMemoriesPage })));
const YouTubeBuilderPage = lazy(() => import('./pages/YouTubeBuilderPage').then(m => ({ default: m.YouTubeBuilderPage })));
const YouTubeVideoMemoriesPage = lazy(() => import('./pages/YouTubeVideoMemoriesPage').then(m => ({ default: m.YouTubeVideoMemoriesPage })));
const TikTokVideosListPage = lazy(() => import('./pages/TikTokVideosListPage').then(m => ({ default: m.TikTokVideosListPage })));
const TikTokVideoDetailPage = lazy(() => import('./pages/TikTokVideoDetailPage').then(m => ({ default: m.TikTokVideoDetailPage })));
const TikTokBuilderPage = lazy(() => import('./pages/TikTokBuilderPage').then(m => ({ default: m.TikTokBuilderPage })));
const PersonBuilderPage = lazy(() => import('./pages/PersonBuilderPage').then(m => ({ default: m.PersonBuilderPage })));
const RelationshipGraphPage = lazy(() => import('./pages/RelationshipGraphPage').then(m => ({ default: m.RelationshipGraphPage })));
const ImageBuilderPage = lazy(() => import('./pages/ImageBuilderPage').then(m => ({ default: m.ImageBuilderPage })));
const UrlBuilderPage = lazy(() => import('./pages/UrlBuilderPage').then(m => ({ default: m.UrlBuilderPage })));
const SlideDecksListPage = lazy(() => import('./pages/SlideDecksListPage').then(m => ({ default: m.SlideDecksListPage })));
const SlideDeckViewerPage = lazy(() => import('./pages/SlideDeckViewerPage').then(m => ({ default: m.SlideDeckViewerPage })));

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <OfflineStatusToast />
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-gray-600">Loading...</div>
          </div>
        }>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            {/* Protected app routes with layout */}
            <Route
              path="/app/capture"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <CapturePage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/search"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <SearchPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/memories/:id"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <MemoryDetailPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/memories/:id/link"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LinkMemoryPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/reminders"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <RemindersPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/slidedecks"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <SlideDecksListPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/slidedecks/:id/view"
              element={
                <ProtectedRoute>
                  <SlideDeckViewerPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/settings"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <SettingsPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/upgrade"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <UpgradePage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/locations"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LocationBuilderPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/locations/:locationId/memories"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LocationMemoriesPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/youtube-videos"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <YouTubeBuilderPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/youtube-videos/:videoId/memories"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <YouTubeVideoMemoriesPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/tiktok-videos"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <TikTokVideosListPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/tiktok-videos/:videoId"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <TikTokVideoDetailPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/tiktok-builder"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <TikTokBuilderPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/people"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <PersonBuilderPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/images"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ImageBuilderPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/urls"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <UrlBuilderPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/relationships"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <RelationshipGraphPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/admin"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AppLayout>
                    <AdminDashboardPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/admin/extraction-data"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AppLayout>
                    <ExtractionDataPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/admin/enrichment-failures"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AppLayout>
                    <EnrichmentFailuresPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/admin/words"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AppLayout>
                    <WordSummaryPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/admin/audit-trail"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AppLayout>
                    <AuditTrailPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

