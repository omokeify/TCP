import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MockService } from '../../services/mockDb';
import { Application, ApplicationStatus } from '../../types';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ApplicationStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDark, setIsDark] = useState(false);

  // Pagination state (visual mostly for this mock)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    // Check dark mode
    if (document.documentElement.classList.contains('dark')) {
      setIsDark(true);
    }

    if (!MockService.isAdminAuthenticated()) {
      navigate('/admin/login');
      return;
    }
    loadData();
  }, [navigate]);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    }
  };

  const loadData = async () => {
    const data = await MockService.getApplications();
    setApps(data);
    setLoading(false);
  };

  const handleStatusUpdate = async (id: string, status: ApplicationStatus) => {
    if (window.confirm(`Are you sure you want to mark this as ${status}?`)) {
        await MockService.updateApplicationStatus(id, status);
        if (status === ApplicationStatus.APPROVED) {
            const app = apps.find(a => a.id === id);
            if (app) await MockService.generateCode(app.id, app.email);
        }
        await loadData();
    }
  };

  const filteredApps = apps.filter(app => {
    const matchesFilter = filter === 'all' || app.status === filter;
    const matchesSearch = app.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          app.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredApps.length / itemsPerPage);
  const paginatedApps = filteredApps.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const stats = {
    total: apps.length,
    pending: apps.filter(a => a.status === ApplicationStatus.PENDING).length,
    approved: apps.filter(a => a.status === ApplicationStatus.APPROVED).length
  };

  if (loading) return <div className="p-8 text-primary">Loading data...</div>;

  return (
    <>
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
            <h1 className="text-3xl font-bold text-primary dark:text-accent">Application Management</h1>
            <p className="text-ash dark:text-chalk/60 mt-1">Review and approve pending requests for class access.</p>
        </div>
        <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 border-2 border-primary dark:border-accent text-primary dark:text-accent rounded-lg font-semibold hover:bg-primary hover:text-white dark:hover:bg-accent dark:hover:text-primary transition-all">
                <span className="material-icons-outlined text-sm">download</span>
                Export List
            </button>
            <button 
                onClick={toggleTheme}
                className="p-2 bg-white dark:bg-ash/20 rounded-lg text-primary dark:text-accent"
            >
                <span className="material-icons-outlined">{isDark ? 'light_mode' : 'dark_mode'}</span>
            </button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-white/5 p-6 rounded-2xl shadow-sm border border-chalk dark:border-white/10">
            <p className="text-ash dark:text-chalk/60 text-sm font-medium">Total Submissions</p>
            <p className="text-3xl font-bold text-primary dark:text-white mt-2">{stats.total}</p>
        </div>
        <div className="bg-accent/20 dark:bg-accent/10 p-6 rounded-2xl shadow-sm border border-accent/30">
            <p className="text-ash dark:text-chalk/60 text-sm font-medium">Pending Review</p>
            <p className="text-3xl font-bold text-primary dark:text-accent mt-2">{stats.pending}</p>
        </div>
        <div className="bg-eucalyptus/20 dark:bg-eucalyptus/10 p-6 rounded-2xl shadow-sm border border-eucalyptus/30">
            <p className="text-ash dark:text-chalk/60 text-sm font-medium">Approved Total</p>
            <p className="text-3xl font-bold text-primary dark:text-eucalyptus mt-2">{stats.approved}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-white/5 rounded-2xl shadow-sm border border-chalk dark:border-white/10 overflow-hidden">
        <div className="p-6 border-b border-chalk dark:border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
                <span className="material-icons-outlined absolute left-3 top-2.5 text-ash dark:text-chalk/40">search</span>
                <input 
                    className="w-full pl-10 pr-4 py-2 bg-chalk/50 dark:bg-white/5 border-none rounded-lg focus:ring-2 focus:ring-primary dark:focus:ring-accent transition-all text-sm text-primary dark:text-chalk" 
                    placeholder="Search by email or name..." 
                    type="text"
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                <span className="text-xs font-bold uppercase tracking-wider text-ash/60 mr-2">Filter:</span>
                <button onClick={() => { setFilter('all'); setCurrentPage(1); }} className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${filter === 'all' ? 'bg-primary text-white' : 'bg-chalk dark:bg-white/10 text-ash dark:text-chalk'}`}>All</button>
                <button onClick={() => { setFilter(ApplicationStatus.PENDING); setCurrentPage(1); }} className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${filter === ApplicationStatus.PENDING ? 'bg-primary text-white' : 'bg-chalk dark:bg-white/10 text-ash dark:text-chalk'}`}>Pending</button>
                <button onClick={() => { setFilter(ApplicationStatus.APPROVED); setCurrentPage(1); }} className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${filter === ApplicationStatus.APPROVED ? 'bg-primary text-white' : 'bg-chalk dark:bg-white/10 text-ash dark:text-chalk'}`}>Approved</button>
            </div>
        </div>
        
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="bg-chalk/30 dark:bg-white/5 text-ash/70 dark:text-chalk/50 text-xs font-bold uppercase tracking-wider">
                        <th className="px-6 py-4">Applicant Email</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Submission Date</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-chalk dark:divide-white/10">
                    {paginatedApps.length === 0 ? (
                        <tr><td colSpan={4} className="p-8 text-center text-ash dark:text-chalk/50">No applications found.</td></tr>
                    ) : paginatedApps.map(app => (
                        <tr key={app.id} className="hover:bg-chalk/10 dark:hover:bg-white/5 transition-colors">
                            <td className="px-6 py-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary dark:text-accent font-bold text-xs">
                                        {app.fullName.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="font-medium text-primary dark:text-chalk">{app.email}</div>
                                        <div className="text-xs text-ash/80 dark:text-chalk/60">{app.fullName}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-5">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold
                                     ${app.status === ApplicationStatus.APPROVED ? 'bg-green-100 dark:bg-eucalyptus/20 text-green-800 dark:text-eucalyptus' : 
                                       app.status === ApplicationStatus.REJECTED ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400' : 
                                       'bg-yellow-100 dark:bg-accent/20 text-yellow-800 dark:text-accent'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                         app.status === ApplicationStatus.APPROVED ? 'bg-green-500 dark:bg-eucalyptus' : 
                                         app.status === ApplicationStatus.REJECTED ? 'bg-red-500' : 
                                         'bg-yellow-500 dark:bg-accent'}`}></span>
                                    {app.status === ApplicationStatus.APPROVED ? 'Approved' : app.status === ApplicationStatus.REJECTED ? 'Rejected' : 'Pending'}
                                </span>
                            </td>
                            <td className="px-6 py-5 text-sm text-ash dark:text-chalk/60">
                                {new Date(app.submittedAt).toLocaleDateString()} • {new Date(app.submittedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </td>
                            <td className="px-6 py-5 text-right">
                                <div className="flex items-center justify-end gap-2">
                                    {app.status === ApplicationStatus.PENDING && (
                                        <button 
                                            onClick={() => handleStatusUpdate(app.id, ApplicationStatus.APPROVED)}
                                            className="px-4 py-1.5 bg-primary text-white rounded-lg text-xs font-bold hover:opacity-90 transition-opacity"
                                        >
                                            Approve
                                        </button>
                                    )}
                                    <Link to={`/admin/applications/${app.id}`} className="p-1.5 text-ash dark:text-chalk/40 hover:text-primary dark:hover:text-accent transition-colors" title="View Details">
                                        <span className="material-icons-outlined text-lg">visibility</span>
                                    </Link>
                                    {app.status === ApplicationStatus.PENDING && (
                                         <button 
                                            onClick={() => handleStatusUpdate(app.id, ApplicationStatus.REJECTED)}
                                            className="p-1.5 text-ash dark:text-chalk/40 hover:text-red-500 transition-colors"
                                            title="Reject"
                                         >
                                            <span className="material-icons-outlined text-lg">delete_outline</span>
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        
        {/* Pagination Footer */}
        <div className="p-6 border-t border-chalk dark:border-white/10 flex items-center justify-between">
            <p className="text-xs text-ash/60 dark:text-chalk/40">
                Showing {Math.min(filteredApps.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filteredApps.length, currentPage * itemsPerPage)} of {filteredApps.length} applications
            </p>
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-chalk dark:border-white/10 rounded-lg text-ash dark:text-chalk/40 hover:bg-chalk/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <span className="material-icons-outlined">chevron_left</span>
                </button>
                <button 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="p-2 border border-chalk dark:border-white/10 rounded-lg text-ash dark:text-chalk/40 hover:bg-chalk/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <span className="material-icons-outlined">chevron_right</span>
                </button>
            </div>
        </div>
      </div>
    </>
  );
};