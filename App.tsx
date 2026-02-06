import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Apply } from './pages/Apply';
import { Status } from './pages/Status';
import { Access } from './pages/Access';
import { ClassContent } from './pages/ClassContent';
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
          <Route path="/" element={<Navigate to="/apply" replace />} />
          <Route path="/apply" element={<Apply />} />
          <Route path="/status" element={<Status />} />
          <Route path="/access" element={<Access />} />
          <Route path="/content" element={<ClassContent />} />

          {/* Admin Flow */}
          <Route path="/admin" element={<Navigate to="/admin/applications" replace />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/applications" element={<AdminDashboard />} />
          <Route path="/admin/applications/:id" element={<ApplicationDetail />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;