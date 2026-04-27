import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Footer from './components/Footer/Footer';
import Header from './components/Header/Header';
import ScrollToTop from './components/ScrollToTop';
import SocialMetaDefaults from './seo/SocialMetaDefaults';
import ErrorBoundary from './components/ErrorBoundary';

const Homepage = lazy(() => import('./components/pages/Homepage/HomepageMain'));
const Discovery = lazy(() => import('./components/pages/Discovery/DiscoveryMain'));
const Academics = lazy(() => import('./components/pages/Academics/AcademicsMain'));
const Admission = lazy(() => import('./components/pages/Admission/AdmissionMain'));
const Support = lazy(() => import('./components/pages/Support/SupportMain'));
const Transcript = lazy(() => import('./components/pages/Transcript/TranscriptMain'));
const LoginPortal = lazy(() => import('./components/pages/Auth/LoginPortal'));
const AdminLogin = lazy(() => import('./components/pages/Admin/AdminLogin'));
const AdminDashboard = lazy(() => import('./components/pages/Admin/AdminDashboard'));
const AdminTranscriptPage = lazy(() => import('./components/pages/Admin/AdminTranscriptPage'));
const NotFound = lazy(() => import('./components/pages/NotFound'));
const PrivacyPolicy = lazy(() => import('./components/pages/PrivacyPolicy'));
const TermsOfUse = lazy(() => import('./components/pages/TermsOfUse'));

// Pathways
const PathwaysHub = lazy(() => import('./components/pages/Pathways/PathwaysHub'));
const PsychologyPathway = lazy(() => import('./components/pages/Pathways/PsychologyPathway'));
const CSPathway = lazy(() => import('./components/pages/Pathways/CSPathway'));
const BusinessPathway = lazy(() => import('./components/pages/Pathways/BusinessPathway'));
const EconomicsPathway = lazy(() => import('./components/pages/Pathways/EconomicsPathway'));
const EngineeringPathway = lazy(() => import('./components/pages/Pathways/EngineeringPathway'));
const MathDataPathway = lazy(() => import('./components/pages/Pathways/MathDataPathway'));
const CommunicationsPathway = lazy(() => import('./components/pages/Pathways/CommunicationsPathway'));
const ArtsDesignPathway = lazy(() => import('./components/pages/Pathways/ArtsDesignPathway'));

// Learning portal
const LearnDashboard = lazy(() => import('./components/pages/Learn/LearnDashboard'));
const CoursePage = lazy(() => import('./components/pages/Learn/CoursePage'));
const ModulePage = lazy(() => import('./components/pages/Learn/ModulePage'));
const ExamPage = lazy(() => import('./components/pages/Learn/ExamPage'));
const GradesPage = lazy(() => import('./components/pages/Learn/GradesPage'));
const SyllabusPage = lazy(() => import('./components/pages/Learn/SyllabusPage'));
const ProfilePage = lazy(() => import('./components/pages/Profile/ProfilePage'));
const PricingPage = lazy(() => import('./components/pages/Pricing/PricingPage'));

const LANGUAGE_STORAGE_KEY = 'giis-language';

function readInitialLanguage() {
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved === 'en' || saved === 'zh') {
      return saved;
    }
  } catch {
    /* ignore */
  }
  const browserLanguage = navigator.language || navigator.userLanguage;
  return browserLanguage && browserLanguage.includes('zh') ? 'zh' : 'en';
}

function RouteFallback() {
  return (
    <div className="py-5 text-center text-muted" role="status">
      Loading…
    </div>
  );
}

function App() {
  const [language, setLanguage] = useState(readInitialLanguage);

  useEffect(() => {
    document.documentElement.lang = language === 'en' ? 'en' : 'zh';
  }, [language]);

  useEffect(() => {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
      /* ignore */
    }
  }, [language]);

  const toggleLanguage = () => {
    setLanguage((prevLanguage) => (prevLanguage === 'en' ? 'zh' : 'en'));
  };

  const location = useLocation();
  const isTranscript = location.pathname === '/transcript';
  const isAdmin = location.pathname.startsWith('/admin');
  const isLearn = location.pathname.startsWith('/learn');
  const isProfile = location.pathname === '/profile';
  const hideChrome = isTranscript || isAdmin || isLearn || isProfile;

  return (
     <>
      <SocialMetaDefaults />
      <ScrollToTop />
      {!hideChrome && <Header language={language} toggleLanguage={toggleLanguage} />}
      <main className="container-fluid">
       <ErrorBoundary>
       <Suspense fallback={<RouteFallback />}>
       <Routes>
         <Route path="/" element={<Homepage language={language} toggleLanguage={toggleLanguage} />} />
         <Route path="/discovery" element={<Discovery language={language} toggleLanguage={toggleLanguage}  />} />
         <Route path="/academics" element={<Academics language={language}/>} />
         <Route path="/admission" element={<Admission language={language} toggleLanguage={toggleLanguage} />} />
         <Route path="/support" element={<Support language={language} toggleLanguage={toggleLanguage} />} />
         <Route path="/transcript" element={<Transcript language={language}/>}/>
         <Route path="/login" element={<LoginPortal language={language} />} />
         <Route path="/register" element={<Navigate to="/login?tab=register" replace />} />
         <Route path="/admin/login" element={<AdminLogin />} />
         <Route path="/admin" element={<AdminDashboard language={language} />} />
         <Route path="/admin/transcript/:studentId" element={<AdminTranscriptPage language={language} />} />
         {/* Pathways hub */}
         <Route path="/pathways" element={<PathwaysHub language={language} />} />
         {/* Individual pathways */}
         <Route path="/pathways/psychology" element={<PsychologyPathway />} />
         <Route path="/pathways/cs" element={<CSPathway />} />
         <Route path="/pathways/business" element={<BusinessPathway />} />
         <Route path="/pathways/economics" element={<EconomicsPathway />} />
         <Route path="/pathways/engineering" element={<EngineeringPathway />} />
         <Route path="/pathways/math" element={<MathDataPathway />} />
         <Route path="/pathways/communications" element={<CommunicationsPathway />} />
         <Route path="/pathways/arts" element={<ArtsDesignPathway />} />
         {/* Learning portal */}
         <Route path="/learn" element={<LearnDashboard language={language} />} />
         <Route path="/learn/:slug" element={<CoursePage language={language} />} />
         <Route path="/learn/:slug/module/:order" element={<ModulePage language={language} />} />
         <Route path="/learn/:slug/exam" element={<ExamPage language={language} />} />
         <Route path="/learn/:slug/grades" element={<GradesPage language={language} />} />
         <Route path="/learn/:slug/syllabus" element={<SyllabusPage language={language} />} />
         <Route path="/profile" element={<ProfilePage language={language} />} />
         <Route path="/pricing" element={<PricingPage language={language} />} />
         <Route path="/privacy" element={<PrivacyPolicy language={language} />} />
         <Route path="/terms" element={<TermsOfUse language={language} />} />
         <Route path="*" element={<NotFound language={language} />} />
       </Routes>
       </Suspense>
       </ErrorBoundary>
      </main>
      {!hideChrome && <Footer language={language} />}
     </>
  );
}

export default App;
