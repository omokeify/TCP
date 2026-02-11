import React, { Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';

// Lazy Load Pages
const Apply = lazy(() => import('./pages/Apply').then(module => ({ default: module.Apply })));
const Status = lazy(() => import('./pages/Status').then(module => ({ default: module.Status })));
const Access = lazy(() => import('./pages/Access').then(module => ({ default: module.Access })));
const ClassPortal = lazy(() => import('./pages/ClassPortal').then(module => ({ default: module.ClassPortal })));
const QuestBoard = lazy(() => import('./pages/QuestBoard').then(module => ({ default: module.QuestBoard })));
const QuestDetail = lazy(() => import('./pages/QuestDetail').then(module => ({ default: module.QuestDetail })));

// Admin Pages
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin').then(module => ({ default: module.AdminLogin })));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then(module => ({ default: module.AdminDashboard })));
const ApplicationDetail = lazy(() => import('./pages/admin/ApplicationDetail').then(module => ({ default: module.ApplicationDetail })));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings').then(module => ({ default: module.AdminSettings })));
const ProofReview = lazy(() => import('./pages/admin/ProofReview').then(module => ({ default: module.ProofReview })));

function App() {
  return (
    <Router>
      <Layout>
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center text-[#3B472F]">
              <div className="animate-pulse flex flex-col items-center">
                  <div className="h-12 w-12 bg-[#3B472F]/20 rounded-full mb-4"></div>
                  <div className="h-4 w-32 bg-[#3B472F]/20 rounded"></div>
              </div>
          </div>
        }>
          <Routes>
            {/* Public Flow */}
            <Route path="/" element={<Apply />} />
            <Route path="/apply" element={<Navigate to="/" replace />} />
            <Route path="/status" element={<Status />} />
            <Route path="/access" element={<Access />} />
            <Route path="/portal" element={<ClassPortal />} />
            <Route path="/quests" element={<QuestBoard />} />
            <Route path="/quests/:questSetId" element={<QuestDetail />} />

            {/* Legacy redirect */}
            <Route path="/content" element={<Navigate to="/portal" replace />} />

            {/* Admin Flow */}
            <Route path="/admin" element={<Navigate to="/admin/applications" replace />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/applications" element={<AdminDashboard />} />
            <Route path="/admin/applications/:id" element={<ApplicationDetail />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/admin/proofs" element={<ProofReview />} />

            {/* Catch-all for unknown routes */}
            <Route path="*" element={<Navigate to="/apply" replace />} />
          </Routes>
        </Suspense>
      </Layout>
    </Router>
  );
}

export default App;