import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { MockService } from '../services/mockDb';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isAdminRoute = location.pathname.startsWith('/admin') && location.pathname !== '/admin/login';
  
  // We strictly show admin layout only for authenticated admin routes (dashboard, settings, etc.)
  const showAdminLayout = isAdminRoute;

  // If it's the Admin Dashboard Layout
  if (showAdminLayout) {
    return (
      <div className="bg-chalk dark:bg-background-dark text-ash dark:text-chalk transition-colors duration-200 min-h-screen flex flex-col lg:flex-row">
         {/* Mobile Header */}
         <div className="lg:hidden bg-primary text-white p-4 flex items-center justify-between sticky top-0 z-20 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 100 100">
                  <path d="M50 15c-19.3 0-35 15.7-35 35s15.7 35 35 35 35-15.7 35-35-15.7-35-35-35zm0 60c-13.8 0-25-11.2-25-25s11.2-25 25-25 25 11.2 25 25-11.2 25-25 25z"></path>
                  <path d="M50 30c-11 0-20 9-20 20s9 20 20 20 20-9 20-20-9-20-20-20zm0 30c-5.5 0-10-4.5-10-10s4.5-10 10-10 10 4.5 10 10-4.5 10-10 10z"></path>
                  </svg>
              </div>
              <span className="text-xl font-bold tracking-tight">TCP</span>
            </div>
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors">
              <span className="material-icons-outlined">menu</span>
            </button>
         </div>

         {/* Mobile Backdrop */}
         {isSidebarOpen && (
            <div 
              className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm transition-opacity"
              onClick={() => setIsSidebarOpen(false)}
            />
         )}

         {/* Sidebar */}
        <aside className={`
            fixed inset-y-0 left-0 z-40 w-64 bg-primary text-white flex flex-col 
            transform transition-transform duration-300 ease-in-out
            lg:translate-x-0 lg:static lg:h-screen lg:sticky lg:top-0
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
            {/* Close Button for Mobile */}
            <div className="lg:hidden absolute top-4 right-4">
               <button 
                 onClick={() => setIsSidebarOpen(false)}
                 className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
               >
                 <span className="material-icons-outlined">close</span>
               </button>
            </div>

            <div className="p-8 flex items-center gap-3">
            <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-primary" fill="currentColor" viewBox="0 0 100 100">
                <path d="M50 15c-19.3 0-35 15.7-35 35s15.7 35 35 35 35-15.7 35-35-15.7-35-35-35zm0 60c-13.8 0-25-11.2-25-25s11.2-25 25-25 25 11.2 25 25-11.2 25-25 25z"></path>
                <path d="M50 30c-11 0-20 9-20 20s9 20 20 20 20-9 20-20-9-20-20-20zm0 30c-5.5 0-10-4.5-10-10s4.5-10 10-10 10 4.5 10 10-4.5 10-10 10z"></path>
                </svg>
            </div>
            <span className="text-2xl font-bold tracking-tight">TCP</span>
            </div>
            <nav className="flex-1 px-4 space-y-2 mt-4">
            <Link 
                to="/admin/applications" 
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${location.pathname.includes('applications') ? 'bg-accent text-primary' : 'hover:bg-white/10 text-white'}`}
            >
                <span className="material-icons-outlined">group</span>
                Manage Applications
            </Link>
            <Link 
                to="/admin/proofs" 
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${location.pathname.includes('proofs') ? 'bg-accent text-primary' : 'hover:bg-white/10 text-white'}`}
            >
                <span className="material-icons-outlined">fact_check</span>
                Proofs
            </Link>
            <Link 
                to="/admin/settings" 
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${location.pathname.includes('settings') ? 'bg-accent text-primary' : 'hover:bg-white/10 text-white'}`}
            >
                <span className="material-icons-outlined">settings</span>
                Settings
            </Link>
             <button onClick={() => { MockService.logoutAdmin(); navigate('/admin/login'); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium hover:bg-white/10 transition-colors text-left">
                <span className="material-icons-outlined">logout</span>
                Logout
            </button>
            </nav>
            <div className="p-6 border-t border-white/10">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-eucalyptus"></div>
                <div>
                <p className="text-sm font-semibold">Admin User</p>
                <p className="text-xs text-chalk/60">admin@tcp.studio</p>
                </div>
            </div>
            </div>
        </aside>

        {/* Main Content Wrapper */}
        <main className="flex-1 h-screen overflow-y-auto p-4 md:p-10 font-display">
            {children}
        </main>
      </div>
    );
  }

  // Public / Login Layout
  return (
    <div className="min-h-screen flex flex-col items-center p-4 sm:p-8 overflow-x-hidden">
      {/* Brand Header */}
      <header className="w-full max-w-5xl flex justify-between items-center mb-8 sm:mb-12">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative w-8 h-8 sm:w-10 sm:h-10">
             <div className="absolute inset-0 bg-[#3B472F] rounded-full opacity-20 group-hover:scale-110 transition-transform"></div>
             <svg viewBox="0 0 100 100" className="w-full h-full text-[#3B472F] animate-spin-slow" style={{ animationDuration: '10s' }}>
                <path d="M50 10 A 40 40 0 0 1 90 50" fill="none" stroke="currentColor" strokeWidth="12" strokeLinecap="round" strokeDasharray="10 20"/>
                <path d="M50 90 A 40 40 0 0 1 10 50" fill="none" stroke="currentColor" strokeWidth="12" strokeLinecap="round" strokeDasharray="10 20"/>
             </svg>
          </div>
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[#3B472F]">TCP<sup className="text-xs ml-1">TM</sup></span>
        </Link>

        <nav className="flex gap-4">
          {!location.pathname.startsWith('/admin') && (
             <Link to="/access" className={`text-xs sm:text-sm font-semibold px-4 py-2 rounded-full transition-colors ${location.pathname === '/access' ? 'bg-[#3B472F] text-white' : 'text-[#3B472F] hover:bg-[#3B472F]/10'}`}>
                 Access Class
             </Link>
          )}
        </nav>
      </header>

      {/* 
         Removed justify-center to allow natural top-to-bottom flow on mobile when content is tall,
         preventing content from being cut off at the top if centered.
      */}
      <main className="w-full max-w-5xl flex-1 flex flex-col items-center">
        {children}
      </main>

      <footer className="w-full max-w-5xl mt-12 py-6 text-center text-[#686868] text-xs flex flex-col items-center gap-2">
        <p>&copy; {new Date().getFullYear()} TCP Studio. All rights reserved.</p>
      </footer>
    </div>
  );
};