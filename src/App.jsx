import React, { useContext, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AppContext } from './context/AppContext';

// Shell - always needed, kept in the main bundle.
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import ScrollToTop from './components/ScrollToTop';
import ErrorBoundary from './components/ErrorBoundary';
import { PAYMENTS_ENABLED } from './config/features';
import UpgradeNudge from './components/UpgradeNudge';
import InstallPrompt from './components/InstallPrompt';
import NotFound from './pages/NotFound';
import DashboardLayout from './components/dashboard/DashboardLayout';

// Home is the landing/LCP page - keep it in the main bundle for instant paint.
import Home from './pages/Home';
import { GENERATORS } from './pages/generators/generators';

// Every other route is code-split (loaded on demand) so the first page load
// doesn't ship the Studio, PDF editor, Business Hub, charts, etc.
const Collections = lazy(() => import('./pages/Collections'));
const BusinessHub = lazy(() => import('./business/BusinessHub'));
const BusinessHelp = lazy(() => import('./business/BusinessHelp'));
const BusinessLanding = lazy(() => import('./business/BusinessLanding'));
const PdfEditor = lazy(() => import('./pdfeditor/PdfEditor'));
const Contact = lazy(() => import('./pages/Contact'));
const Legal = lazy(() => import('./pages/Legal'));
const Terms = lazy(() => import('./pages/Terms'));
const Privacy = lazy(() => import('./pages/Privacy'));
const License = lazy(() => import('./pages/License'));
const Licenses = lazy(() => import('./pages/Licenses'));
const Dmca = lazy(() => import('./pages/Dmca'));
const Status = lazy(() => import('./pages/Status'));
const Billing = lazy(() => import('./pages/Billing'));
const Waitlist = lazy(() => import('./pages/Waitlist'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Products = lazy(() => import('./pages/Products'));
const Favorites = lazy(() => import('./pages/Favorites'));
const DashboardHome = lazy(() => import('./pages/DashboardHome'));
const DashboardSearch = lazy(() => import('./pages/DashboardSearch'));
const BackgroundGenerator = lazy(() => import('./pages/BackgroundGenerator'));
const Profile = lazy(() => import('./pages/Profile'));
const GradientGenerator = lazy(() => import('./pages/GradientGenerator'));
const FreeTools = lazy(() => import('./pages/FreeTools'));
const ToolPage = lazy(() => import('./pages/ToolPage'));
const Settings = lazy(() => import('./pages/Settings'));
const TemplatesIndex = lazy(() => import('./pages/templates/TemplatesIndex'));
const TemplateCategory = lazy(() => import('./pages/templates/TemplateCategory'));
const GeneratorPage = lazy(() => import('./pages/generators/GeneratorPage'));
const Help = lazy(() => import('./pages/Help'));
const About = lazy(() => import('./pages/About'));
const Studio = lazy(() => import('./pages/Studio'));
const GradientToolPage = lazy(() => import('./pages/GradientToolPage'));
const Blog = lazy(() => import('./pages/Blog'));
const BlogPost = lazy(() => import('./pages/BlogPost'));
const Search = lazy(() => import('./pages/Search'));
const Admin = lazy(() => import('./pages/Admin'));

// PikCircle — Creative Community
const CommunityLayout = lazy(() => import('./community/CommunityLayout'));
const CommunityFeed = lazy(() => import('./community/CommunityFeed'));
const CommunityExplore = lazy(() => import('./community/CommunityExplore'));
const PostDetail = lazy(() => import('./community/PostDetail'));
const CreatePost = lazy(() => import('./community/CreatePost'));
const CreatorProfile = lazy(() => import('./community/CreatorProfile'));
const SavedPosts = lazy(() => import('./community/SavedPosts'));
const CommunityNotifications = lazy(() => import('./community/CommunityNotifications'));

import EcosystemModals from './components/EcosystemModals';


function App() {
  const { isAuthModalOpen, isLoggedIn } = useContext(AppContext);

  return (
    <>
      <ScrollToTop />
      <UpgradeNudge />
      <div className="bg-shape shape-1"></div>
      <div className="bg-shape shape-2"></div>
      <div className="noise-bg"></div>
      
      <ErrorBoundary>
      <Suspense fallback={<div className="route-suspense" aria-busy="true" />}>
      <Routes>
        <Route path="/studio" element={<Studio />} />
        
        {/* Authenticated Dashboard Routes */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardHome />} />
          <Route path="search" element={<DashboardSearch />} />
        </Route>

        {/* Public / Main Application Routes (Unified Layout with Navbar & Footer) */}
        <Route element={
          <>
            <Navbar />
            <main>
              <Outlet />
            </main>
            <Footer />
          </>
        }>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/collections" element={<Collections />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/legal" element={<Legal />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/license" element={<License />} />
          <Route path="/licenses" element={<Licenses />} />
          <Route path="/dmca" element={<Dmca />} />
          <Route path="/status" element={<Status />} />
          <Route path="/billing" element={PAYMENTS_ENABLED ? <Billing /> : <Navigate to="/" replace />} />
          <Route path="/pricing" element={<Navigate to={PAYMENTS_ENABLED ? "/billing" : "/"} replace />} />
          <Route path="/waitlist" element={<Navigate to={PAYMENTS_ENABLED ? "/billing" : "/"} replace />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/products" element={<Products />} />
          <Route path="/backgrounds" element={<BackgroundGenerator />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/gradient" element={<GradientGenerator />} />
          <Route path="/tools/gradient-generator" element={<GradientToolPage />} />
          <Route path="/tools" element={<FreeTools />} />
          <Route path="/tools/:slug" element={<ToolPage />} />
          <Route path="/qr-code" element={<Navigate to="/tools/qr-code-generator" replace />} />
          <Route path="/qr-code-generator" element={<Navigate to="/tools/qr-code-generator" replace />} />
          <Route path="/qr" element={<Navigate to="/tools/qr-code-generator" replace />} />
          <Route path="/support" element={<Navigate to="/contact" replace />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/help" element={<Help />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/about" element={<About />} />
          <Route path="/business-automation" element={<BusinessLanding />} />
          <Route path="/business" element={<BusinessHub />} />
          <Route path="/business/help" element={<BusinessHelp />} />
          <Route path="/pdf-editor" element={<PdfEditor />} />
          <Route path="/templates" element={<TemplatesIndex />} />
          <Route path="/templates/:slug" element={<TemplateCategory />} />
          {GENERATORS.map((g) => (
            <Route key={g.slug} path={`/${g.slug}`} element={<GeneratorPage slug={g.slug} />} />
          ))}

          {/* PikCircle Creative Community Routes */}
          <Route path="/community" element={<CommunityLayout />}>
            <Route index element={<CommunityFeed />} />
            <Route path="explore" element={<CommunityExplore />} />
            <Route path="post/:postId" element={<PostDetail />} />
            <Route path="create" element={<CreatePost />} />
            <Route path="profile/:username" element={<CreatorProfile />} />
            <Route path="saved" element={<SavedPosts />} />
            <Route path="notifications" element={<CommunityNotifications />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      </Suspense>
      </ErrorBoundary>

      {/* Global Modals */}
      {isAuthModalOpen && <AuthModal />}
      <EcosystemModals />
      <InstallPrompt />
    </>
  );
}

export default App;
