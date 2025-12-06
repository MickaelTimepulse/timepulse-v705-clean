import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy, useState, useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';

function ErrorBoundaryContent() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-red-50">
      <div className="text-center p-8 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Erreur de chargement</h1>
        <p className="text-gray-700">Une erreur s'est produite lors du chargement de l'application.</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Recharger la page
        </button>
      </div>
    </div>
  );
}

const Home = lazy(() => import('./pages/Home'));
const EventDetail = lazy(() => import('./pages/EventDetail'));
const PublicRegistration = lazy(() => import('./pages/PublicRegistration'));
const RaceEntriesList = lazy(() => import('./pages/RaceEntriesList'));
const RaceResults = lazy(() => import('./pages/RaceResults'));
const ResultsListPage = lazy(() => import('./pages/ResultsListPage'));
const EventResultsDetail = lazy(() => import('./pages/EventResultsDetail'));
const BibExchange = lazy(() => import('./pages/BibExchange'));
const BuyBib = lazy(() => import('./pages/BuyBib'));
const CarpoolingOffers = lazy(() => import('./pages/CarpoolingOffers'));
const ServicePage = lazy(() => import('./pages/ServicePage'));
const OrganizerLogin = lazy(() => import('./pages/OrganizerLogin'));
const OrganizerRegister = lazy(() => import('./pages/OrganizerRegister'));
const OrganizerDashboard = lazy(() => import('./pages/OrganizerDashboard'));
const OrganizerEventDetail = lazy(() => import('./pages/OrganizerEventDetail'));
const OrganizerCreateEvent = lazy(() => import('./pages/OrganizerCreateEvent'));
const OrganizerEntries = lazy(() => import('./pages/OrganizerEntries'));
const OrganizerProfile = lazy(() => import('./pages/OrganizerProfile'));
const OrganizerStats = lazy(() => import('./pages/OrganizerStats'));
const OrganizerBibExchange = lazy(() => import('./pages/OrganizerBibExchange'));
const OrganizerCarpooling = lazy(() => import('./pages/OrganizerCarpooling'));
const OrganizerVolunteers = lazy(() => import('./pages/OrganizerVolunteers'));
const OrganizerVolunteerPostForm = lazy(() => import('./pages/OrganizerVolunteerPostForm'));
const VolunteerRegistration = lazy(() => import('./pages/VolunteerRegistration'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminOrganizers = lazy(() => import('./pages/AdminOrganizers'));
const AdminEvents = lazy(() => import('./pages/AdminEvents'));
const AdminCreateEvent = lazy(() => import('./pages/AdminCreateEvent'));
const AdminEntries = lazy(() => import('./pages/AdminEntries'));
const AdminResults = lazy(() => import('./pages/AdminResults'));
const AdminAthletes = lazy(() => import('./pages/AdminAthletes'));
const AdminFinance = lazy(() => import('./pages/AdminFinance'));
const AdminCommission = lazy(() => import('./pages/AdminCommission'));
const AdminSettings = lazy(() => import('./pages/AdminSettings'));
const AdminEmailTemplates = lazy(() => import('./pages/AdminEmailTemplates'));
const AdminEmailManager = lazy(() => import('./pages/AdminEmailManager'));
const AdminEmailVariables = lazy(() => import('./pages/AdminEmailVariables'));
const AdminServicePages = lazy(() => import('./pages/AdminServicePages'));
const AdminServicePagesEditor = lazy(() => import('./pages/AdminServicePagesEditor'));
const AdminHomepageFeatures = lazy(() => import('./pages/AdminHomepageFeatures'));
const AdminEmailMonitoring = lazy(() => import('./pages/AdminEmailMonitoring'));
const AdminBackups = lazy(() => import('./pages/AdminBackups'));
const AdminUsers = lazy(() => import('./pages/AdminUsers'));
const AdminActivityLogs = lazy(() => import('./pages/AdminActivityLogs'));
const AdminMonitoring = lazy(() => import('./pages/AdminMonitoring'));
const AdminDeployment = lazy(() => import('./pages/AdminDeployment'));
const AdminEmailAssets = lazy(() => import('./pages/AdminEmailAssets'));
const AdminCertificates = lazy(() => import('./pages/AdminCertificates'));
const AdminFooterSettings = lazy(() => import('./pages/AdminFooterSettings'));
const AdminStaticPages = lazy(() => import('./pages/AdminStaticPages'));
const AdminProjectTracking = lazy(() => import('./pages/AdminProjectTracking'));
const AdminVideos = lazy(() => import('./pages/AdminVideos'));
const AdminAuditLogs = lazy(() => import('./pages/AdminAuditLogs'));
const AdminCarts = lazy(() => import('./pages/AdminCarts'));
const AdminExternalResults = lazy(() => import('./pages/AdminExternalResults'));
const AdminExternalResultsDetail = lazy(() => import('./pages/AdminExternalResultsDetail'));
const AdminExternalResultsImport = lazy(() => import('./pages/AdminExternalResultsImport'));
const AdminTimepulseImport = lazy(() => import('./pages/AdminTimepulseImport'));
const OrganizerExternalResults = lazy(() => import('./pages/OrganizerExternalResults'));
const OrganizerExternalResultsImport = lazy(() => import('./pages/OrganizerExternalResultsImport'));
const PublicResultsSubmit = lazy(() => import('./pages/PublicResultsSubmit'));
const StaticPage = lazy(() => import('./pages/StaticPage'));
const Videos = lazy(() => import('./pages/Videos'));
const AthleteLogin = lazy(() => import('./pages/AthleteLogin'));
const AthleteProfile = lazy(() => import('./pages/AthleteProfile'));
const ModifyRegistration = lazy(() => import('./pages/ModifyRegistration'));
const SpeakerLogin = lazy(() => import('./pages/SpeakerLogin'));
const SpeakerDashboard = lazy(() => import('./pages/SpeakerDashboard'));
const ExternalEventResults = lazy(() => import('./pages/ExternalEventResults'));
const ProtectedRoute = lazy(() => import('./components/ProtectedRoute'));
const OrganizerProtectedRoute = lazy(() => import('./components/OrganizerProtectedRoute'));

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Chargement...</p>
      </div>
    </div>
  );
}

function App() {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const errorHandler = (error: ErrorEvent) => {
      console.error('Global error:', error);
      setHasError(true);
    };
    window.addEventListener('error', errorHandler);
    return () => window.removeEventListener('error', errorHandler);
  }, []);

  if (hasError) {
    return <ErrorBoundaryContent />;
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/videos" element={<Videos />} />
            <Route path="/publier-resultats" element={<PublicResultsSubmit />} />
            <Route path="/resultats" element={<ResultsListPage />} />
            <Route path="/resultats/:slug" element={<EventResultsDetail />} />
            <Route path="/resultats-externes/:slug" element={<ExternalEventResults />} />
            <Route path="/events/:slug" element={<EventDetail />} />
            <Route path="/events/:eventId/register" element={<PublicRegistration />} />
            <Route path="/events/:eventSlug/races/:raceId/entries" element={<RaceEntriesList />} />
            <Route path="/races/:raceId/results" element={<RaceResults />} />
            <Route path="/resultats/:raceSlug" element={<RaceResults />} />
            <Route path="/events/:eventId/bib-exchange" element={<BibExchange />} />
            <Route path="/events/:eventId/bib-exchange/buy/:listingId" element={<BuyBib />} />
            <Route path="/events/:eventId/carpooling" element={<CarpoolingOffers />} />
            <Route path="/events/:slug/volunteer" element={<VolunteerRegistration />} />
            <Route path="/services/:slug" element={<ServicePage />} />
            <Route path="/page/:slug" element={<StaticPage />} />

            <Route path="/athlete/login" element={<AthleteLogin />} />
            <Route path="/athlete/profile" element={<AthleteProfile />} />
            <Route path="/athlete/:athleteId" element={<AthleteProfile />} />

            <Route path="/modify-registration/:code" element={<ModifyRegistration />} />

            <Route path="/speaker/login" element={<SpeakerLogin />} />
            <Route path="/speaker/dashboard/:eventId" element={<SpeakerDashboard />} />

            <Route path="/organizer/login" element={<OrganizerLogin />} />
            <Route path="/organizer/register" element={<OrganizerRegister />} />
            <Route
              path="/organizer/dashboard"
              element={
                <OrganizerProtectedRoute>
                  <OrganizerDashboard />
                </OrganizerProtectedRoute>
              }
            />
            <Route
              path="/organizer/events/create"
              element={
                <OrganizerProtectedRoute>
                  <OrganizerCreateEvent />
                </OrganizerProtectedRoute>
              }
            />
            <Route
              path="/organizer/events/:id"
              element={
                <OrganizerProtectedRoute>
                  <OrganizerEventDetail />
                </OrganizerProtectedRoute>
              }
            />
            <Route
              path="/organizer/events/:eventId/entries"
              element={
                <OrganizerProtectedRoute>
                  <OrganizerEntries />
                </OrganizerProtectedRoute>
              }
            />
            <Route
              path="/organizer/events/:eventId/stats"
              element={
                <OrganizerProtectedRoute>
                  <OrganizerStats />
                </OrganizerProtectedRoute>
              }
            />
            <Route
              path="/organizer/events/:eventId/bib-exchange"
              element={
                <OrganizerProtectedRoute>
                  <OrganizerBibExchange />
                </OrganizerProtectedRoute>
              }
            />
            <Route
              path="/organizer/events/:eventId/carpooling"
              element={
                <OrganizerProtectedRoute>
                  <OrganizerCarpooling />
                </OrganizerProtectedRoute>
              }
            />
            <Route
              path="/organizer/events/:id/volunteers"
              element={
                <OrganizerProtectedRoute>
                  <OrganizerVolunteers />
                </OrganizerProtectedRoute>
              }
            />
            <Route
              path="/organizer/events/:id/volunteers/post/:postId"
              element={
                <OrganizerProtectedRoute>
                  <OrganizerVolunteerPostForm />
                </OrganizerProtectedRoute>
              }
            />
            <Route
              path="/organizer/external-results"
              element={
                <OrganizerProtectedRoute>
                  <OrganizerExternalResults />
                </OrganizerProtectedRoute>
              }
            />
            <Route
              path="/organizer/external-results/import"
              element={
                <OrganizerProtectedRoute>
                  <OrganizerExternalResultsImport />
                </OrganizerProtectedRoute>
              }
            />
            <Route
              path="/organizer/profile"
              element={
                <OrganizerProtectedRoute>
                  <OrganizerProfile />
                </OrganizerProtectedRoute>
              }
            />

            <Route path="/admin/login" element={<AdminLogin />} />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/organizers"
              element={
                <ProtectedRoute>
                  <AdminOrganizers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/events"
              element={
                <ProtectedRoute>
                  <AdminEvents />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/events/create"
              element={
                <ProtectedRoute>
                  <AdminCreateEvent />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/entries"
              element={
                <ProtectedRoute>
                  <AdminEntries />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/results"
              element={
                <ProtectedRoute>
                  <AdminResults />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/external-results"
              element={
                <ProtectedRoute>
                  <AdminExternalResults />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/external-results/:id"
              element={
                <ProtectedRoute>
                  <AdminExternalResultsDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/external-results/import"
              element={
                <ProtectedRoute>
                  <AdminExternalResultsImport />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/athletes"
              element={
                <ProtectedRoute>
                  <AdminAthletes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/finance"
              element={
                <ProtectedRoute>
                  <AdminFinance />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/commission"
              element={
                <ProtectedRoute>
                  <AdminCommission />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute>
                  <AdminSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/email-templates"
              element={
                <ProtectedRoute>
                  <AdminEmailTemplates />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/email-manager"
              element={
                <ProtectedRoute>
                  <AdminEmailManager />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/email-variables"
              element={
                <ProtectedRoute>
                  <AdminEmailVariables />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/services"
              element={
                <ProtectedRoute>
                  <AdminServicePages />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/services/new"
              element={
                <ProtectedRoute>
                  <AdminServicePagesEditor />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/services/:id"
              element={
                <ProtectedRoute>
                  <AdminServicePagesEditor />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/homepage-features"
              element={
                <ProtectedRoute>
                  <AdminHomepageFeatures />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/email-monitoring"
              element={
                <ProtectedRoute>
                  <AdminEmailMonitoring />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/backups"
              element={
                <ProtectedRoute>
                  <AdminBackups />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute>
                  <AdminUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/activity-logs"
              element={
                <ProtectedRoute>
                  <AdminActivityLogs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/monitoring"
              element={
                <ProtectedRoute>
                  <AdminMonitoring />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/deployment"
              element={
                <ProtectedRoute>
                  <AdminDeployment />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/email-assets"
              element={
                <ProtectedRoute>
                  <AdminEmailAssets />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/certificates"
              element={
                <ProtectedRoute>
                  <AdminCertificates />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/footer-settings"
              element={
                <ProtectedRoute>
                  <AdminFooterSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/static-pages"
              element={
                <ProtectedRoute>
                  <AdminStaticPages />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/project-tracking"
              element={
                <ProtectedRoute>
                  <AdminProjectTracking />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/videos"
              element={
                <ProtectedRoute>
                  <AdminVideos />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/audit-logs"
              element={
                <ProtectedRoute>
                  <AdminAuditLogs />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/carts"
              element={
                <ProtectedRoute>
                  <AdminCarts />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/timepulse-import"
              element={
                <ProtectedRoute>
                  <AdminTimepulseImport />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
