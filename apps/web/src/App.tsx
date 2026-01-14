import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './components/AppLayout';
import { OfflineStatusToast } from './components/SyncToast';

// Lazy load pages for better initial bundle size
const HomePage = lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const SynapseReviewPage = lazy(() => import('./pages/SynapseReviewPage').then(m => ({ default: m.SynapseReviewPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const SignupPage = lazy(() => import('./pages/SignupPage').then(m => ({ default: m.SignupPage })));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const OAuthCallbackPage = lazy(() => import('./pages/OAuthCallbackPage').then(m => ({ default: m.OAuthCallbackPage })));
const CapturePage = lazy(() => import('./pages/CapturePage').then(m => ({ default: m.CapturePage })));
const SearchPage = lazy(() => import('./pages/SearchPage').then(m => ({ default: m.SearchPage })));
const MemoryDetailPage = lazy(() => import('./pages/MemoryDetailPage').then(m => ({ default: m.MemoryDetailPage })));
const RemindersPage = lazy(() => import('./pages/RemindersPage').then(m => ({ default: m.RemindersPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
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
const TwitterPostsListPage = lazy(() => import('./pages/TwitterPostsListPage').then(m => ({ default: m.TwitterPostsListPage })));
const TwitterPostDetailPage = lazy(() => import('./pages/TwitterPostDetailPage').then(m => ({ default: m.TwitterPostDetailPage })));
const PersonBuilderPage = lazy(() => import('./pages/PersonBuilderPage').then(m => ({ default: m.PersonBuilderPage })));
const PersonDetailPage = lazy(() => import('./pages/PersonDetailPage').then(m => ({ default: m.PersonDetailPage })));
const RelationshipGraphPage = lazy(() => import('./pages/RelationshipGraphPage').then(m => ({ default: m.RelationshipGraphPage })));
const ImageBuilderPage = lazy(() => import('./pages/ImageBuilderPage').then(m => ({ default: m.ImageBuilderPage })));
const UrlBuilderPage = lazy(() => import('./pages/UrlBuilderPage').then(m => ({ default: m.UrlBuilderPage })));
const SlideDecksListPage = lazy(() => import('./pages/SlideDecksListPage').then(m => ({ default: m.SlideDecksListPage })));
const SlideDeckViewerPage = lazy(() => import('./pages/SlideDeckViewerPage').then(m => ({ default: m.SlideDeckViewerPage })));
const SlideDeckReminderSelectionPage = lazy(() => import('./pages/SlideDeckReminderSelectionPage').then(m => ({ default: m.SlideDeckReminderSelectionPage })));
const AtlasPage = lazy(() => import('./pages/AtlasPage').then(m => ({ default: m.AtlasPage })));
const AdminPanelPage = lazy(() => import('./pages/AdminPanelPage').then(m => ({ default: m.AdminPanelPage })));
const WordsPage = lazy(() => import('./pages/WordsPage').then(m => ({ default: m.WordsPage })));
const WordDetailPage = lazy(() => import('./pages/WordDetailPage').then(m => ({ default: m.WordDetailPage })));
const ProjectsPage = lazy(() => import('./pages/ProjectsPage').then(m => ({ default: m.ProjectsPage })));
const ProjectDetailPage = lazy(() => import('./pages/ProjectDetailPage').then(m => ({ default: m.ProjectDetailPage })));
const TrainingsPage = lazy(() => import('./pages/TrainingsPage').then(m => ({ default: m.TrainingsPage })));
const TrainingDetailPage = lazy(() => import('./pages/TrainingDetailPage').then(m => ({ default: m.TrainingDetailPage })));
const TrainingDecksListPage = lazy(() => import('./pages/TrainingDecksListPage').then(m => ({ default: m.TrainingDecksListPage })));
const TrainingDeckViewerPage = lazy(() => import('./pages/TrainingDeckViewerPage').then(m => ({ default: m.TrainingDeckViewerPage })));

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
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/auth/callback" element={<OAuthCallbackPage />} />

            {/* Protected app routes with layout */}
            <Route
              path="/app/feed"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <DashboardPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
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
              path="/app/review"
              element={
                <ProtectedRoute>
                  <SynapseReviewPage />
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
              path="/app/words"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <WordsPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/words/:id"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <WordDetailPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/projects"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ProjectsPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/projects/:id"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ProjectDetailPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/trainings"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <TrainingsPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/trainings/:id"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <TrainingDetailPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/training-decks"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <TrainingDecksListPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/training-decks/:id/view"
              element={
                <ProtectedRoute>
                  <TrainingDeckViewerPage />
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
              path="/app/slidedecks/select-reminders"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <SlideDeckReminderSelectionPage />
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
              path="/app/twitter-posts"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <TwitterPostsListPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/twitter-posts/:postId"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <TwitterPostDetailPage />
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
              path="/app/people/:personId"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <PersonDetailPage />
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
              path="/app/atlas"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <AtlasPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/admin"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AppLayout>
                    <AdminPanelPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/audit-trail"
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

