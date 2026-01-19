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
const ChangePasswordPage = lazy(() => import('./pages/ChangePasswordPage').then(m => ({ default: m.ChangePasswordPage })));
const OnboardingQuestionnairePage = lazy(() => import('./pages/OnboardingQuestionnairePage').then(m => ({ default: m.OnboardingQuestionnairePage })));
const OAuthCallbackPage = lazy(() => import('./pages/OAuthCallbackPage').then(m => ({ default: m.OAuthCallbackPage })));
const CapturePage = lazy(() => import('./pages/CapturePage').then(m => ({ default: m.CapturePage })));
const SearchPage = lazy(() => import('./pages/SearchPage').then(m => ({ default: m.SearchPage })));
const MemoriesPage = lazy(() => import('./pages/MemoriesPage').then(m => ({ default: m.MemoriesPage })));
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
const MemoryDecksListPage = lazy(() => import('./pages/MemoryDecksListPage').then(m => ({ default: m.MemoryDecksListPage })));
const MemoryDeckViewerPage = lazy(() => import('./pages/MemoryDeckViewerPage').then(m => ({ default: m.MemoryDeckViewerPage })));
const AtlasPage = lazy(() => import('./pages/AtlasPage').then(m => ({ default: m.AtlasPage })));
const AdminPanelPage = lazy(() => import('./pages/AdminPanelPage').then(m => ({ default: m.AdminPanelPage })));
const WordsManagementPage = lazy(() => import('./pages/WordsManagementPage').then(m => ({ default: m.WordsManagementPage })));
const UserRegistrationPage = lazy(() => import('./pages/UserRegistrationPage').then(m => ({ default: m.UserRegistrationPage })));
const WordsPage = lazy(() => import('./pages/WordsPage').then(m => ({ default: m.WordsPage })));
const WordDetailPage = lazy(() => import('./pages/WordDetailPage').then(m => ({ default: m.WordDetailPage })));
const QuestionsPage = lazy(() => import('./pages/QuestionsPage').then(m => ({ default: m.QuestionsPage })));
const QuestionDetailPage = lazy(() => import('./pages/QuestionDetailPage').then(m => ({ default: m.QuestionDetailPage })));
const ReminderSchedulePage = lazy(() => import('./pages/ReminderSchedulePage').then(m => ({ default: m.ReminderSchedulePage })));
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

            {/* Password change route (requires authentication but no onboarding) */}
            <Route
              path="/change-password"
              element={
                <ProtectedRoute>
                  <ChangePasswordPage />
                </ProtectedRoute>
              }
            />

            {/* Onboarding questionnaire route (requires authentication) */}
            <Route
              path="/app/onboarding"
              element={
                <ProtectedRoute>
                  <OnboardingQuestionnairePage />
                </ProtectedRoute>
              }
            />

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
              path="/app/memories"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <MemoriesPage />
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
              path="/app/reminder-schedule"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ReminderSchedulePage />
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
              path="/app/questions"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <QuestionsPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/questions/:id"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <QuestionDetailPage />
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
              path="/app/memory-decks"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <MemoryDecksListPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/memory-decks/:id/view"
              element={
                <ProtectedRoute>
                  <MemoryDeckViewerPage />
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
              path="/app/admin/register"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AppLayout>
                    <UserRegistrationPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/admin/words"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AppLayout>
                    <WordsManagementPage />
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

