import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Apply } from './pages/Apply';
import { Status } from './pages/Status';
import { Access } from './pages/Access';
import { ClassPortal } from './pages/ClassPortal';
import { QuestBoard } from './pages/QuestBoard';
import { QuestDetail } from './pages/QuestDetail';
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { ApplicationDetail } from './pages/admin/ApplicationDetail';
import { AdminSettings } from './pages/admin/AdminSettings';

function App() {
  return (
    <Router>
      <Layout>
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

          {/* Catch-all for unknown routes */}
          <Route path="*" element={<Navigate to="/apply" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;