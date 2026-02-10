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
  const [reminding, setReminding] = useState(false);
  const [batchProcessing, setBatchProcessing] = useState(false);

  // Email State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

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
    if (document.documentElement.classList.contains('dark')) {
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
    const app = apps.find(a => a.id === id);
    if (!app) return;

    if (window.confirm(`Are you sure you want to ${status === ApplicationStatus.APPROVED ? 'approve' : 'reject'} this application?`)) {
         await MockService.updateApplicationStatus(id, status);
        
        if (status === ApplicationStatus.APPROVED) {
            await MockService.generateCode(app.id, app.email);
        }
        await loadData();
    }
  };

  const handleTriggerReminders = async () => {
    if (!window.confirm("Send reminder emails to all approved users with valid codes?")) return;
    setReminding(true);
    try {
        const res = await MockService.triggerReminders();
        alert(`Successfully sent reminders to ${res.sent} users.`);
    } catch (e) {
        alert("Failed to send reminders.");
    } finally {
        setReminding(false);
    }
  };

  const handleBatchApprove = async () => {
    const pendingApps = apps.filter(a => a.status === ApplicationStatus.PENDING);
    if (pendingApps.length === 0) return;

    if (!window.confirm(`Are you sure you want to approve ALL ${pendingApps.length} pending applications?\n\nThis will generate codes and send emails to everyone.`)) {
        return;
    }

    setBatchProcessing(true);
    try {
        const ids = pendingApps.map(a => a.id);
        const res = await MockService.batchApproveApplications(ids);
        alert(`Successfully approved ${res.count} applications.`);
        await loadData();
    } catch (e) {
        alert("Failed to batch approve: " + (e as Error).message);
    } finally {
        setBatchProcessing(false);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(filteredApps.map(a => a.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const applyTemplate = (type: string) => {
    const templates: Record<string, { subject: string, body: string }> = {
        "reminder": {
            subject: "Reminder: Upcoming Class Assignment",
            body: "Hi there,\n\nThis is a friendly reminder to complete your assignment before the next session.\n\nYou can access the materials in the Class Portal.\n\nBest regards,\nThe Team"
        },
        "start": {
            subject: "Class Starting Soon!",
            body: "Hello,\n\nWe are starting in 1 hour! Please get your environment ready.\n\nSee you there!"
        },
        "general": {
            subject: "Important Announcement",
            body: "Hi Everyone,\n\nPlease note the following updates...\n\nBest,"
        }
    };
    if (templates[type]) {
        setEmailSubject(templates[type].subject);
        setEmailBody(templates[type].body);
    }
  };

  const handleSendBatchEmail = async () => {
    if (selectedIds.size === 0) return;
    setSendingEmail(true);
    try {
        const recipients = apps.filter(a => selectedIds.has(a.id)).map(a => a.email);
        const res = await MockService.batchSendEmail(recipients, emailSubject, emailBody.replace(/\n/g, '<br>'));
        if (res.success) {
            alert(`Successfully sent emails to ${res.sent} recipients.`);
            setShowEmailModal(false);
            setSelectedIds(new Set());
            setEmailSubject('');
            setEmailBody('');
        } else {
            alert("Failed to send: " + (res.errors ? res.errors.join('\n') : "Unknown error"));
        }
    } catch (e) {
        alert("Failed to send emails: " + (e as Error).message);
    } finally {
        setSendingEmail(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Email', 'Full Name', 'Status', 'Submitted At', 'Wave', 'Twitter'];
    const rows = apps.map(app => [
        app.id,
        app.email,
        app.fullName,
        app.status,
        app.submittedAt,
        app.wave || '',
        app.twitterHandle || ''
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
        + [headers, ...rows].map(e => e.join(",")).join("\n");
        
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "applications_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSetWave = async () => {
    const waveStr = prompt("Enter Wave Number for selected applications (e.g. 1, 2):");
    if (!waveStr) return;
    const wave = parseInt(waveStr);
    if (isNaN(wave)) return;

    if (!window.confirm(`Set Wave ${wave} for ${selectedIds.size} applications?`)) return;
    
    try {
        await MockService.batchSetWave(Array.from(selectedIds), wave);
        alert("Waves updated!");
        loadData();
        setSelectedIds(new Set());
    } catch (e) {
        alert("Failed to update waves");
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
  const startRange = (currentPage - 1) * itemsPerPage + 1;
  const endRange = Math.min(filteredApps.length, currentPage * itemsPerPage);

  const stats = {
    total: apps.length,
    pending: apps.filter(a => a.status === ApplicationStatus.PENDING).length,
    approved: apps.filter(a => a.status === ApplicationStatus.APPROVED).length
  };

  const emailCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    apps.forEach(a => counts[a.email.toLowerCase()] = (counts[a.email.toLowerCase()] || 0) + 1);
    return counts;
  }, [apps]);

  if (loading) return <div className="p-8 text-primary">Loading data...</div>;

  return (
    <>
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-primary dark:text-accent">Application Management</h1>
          <p className="text-ash dark:text-chalk/60 mt-1">Review and approve pending requests for class access.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
             onClick={handleBatchApprove}
             disabled={batchProcessing || stats.pending === 0}
             className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white border-2 border-green-600 rounded-lg font-bold hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
             <span className="material-icons-outlined text-sm">done_all</span>
             {batchProcessing ? 'Approving...' : `Approve All (${stats.pending})`}
          </button>
          <button 
             onClick={() => setShowEmailModal(true)}
             disabled={selectedIds.size === 0}
             className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white border-2 border-blue-600 rounded-lg font-bold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
             <span className="material-icons-outlined text-sm">email</span>
             Message ({selectedIds.size})
          </button>
          <button 
             onClick={handleSetWave}
             disabled={selectedIds.size === 0}
             className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white border-2 border-purple-600 rounded-lg font-bold hover:bg-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
             <span className="material-icons-outlined text-sm">waves</span>
             Set Wave
          </button>
          <button 
             onClick={handleTriggerReminders}
             disabled={reminding}
             className="flex items-center gap-2 px-4 py-2 bg-accent/20 text-primary dark:text-accent border-2 border-accent rounded-lg font-semibold hover:bg-accent hover:text-primary transition-all disabled:opacity-50"
          >
             <span className="material-icons-outlined text-sm">notifications_active</span>
             {reminding ? 'Sending...' : 'Send Reminders'}
          </button>
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 border-2 border-primary dark:border-accent text-primary dark:text-accent rounded-lg font-semibold hover:bg-primary hover:text-white dark:hover:bg-accent dark:hover:text-primary transition-all"
          >
            <span className="material-icons-outlined text-sm">download</span>
            Export List
          </button>
          <button 
            onClick={toggleTheme}
            className="p-2 bg-white dark:bg-ash/20 rounded-lg text-primary dark:text-accent hover:bg-gray-50 dark:hover:bg-ash/30 transition-colors"
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
                className="w-full pl-10 pr-4 py-2 bg-chalk/50 dark:bg-white/5 border-none rounded-lg focus:ring-2 focus:ring-primary dark:focus:ring-accent transition-all text-sm text-primary dark:text-chalk placeholder-ash/50 dark:placeholder-chalk/30" 
                placeholder="Search by email or name..." 
                type="text"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
            <span className="text-xs font-bold uppercase tracking-wider text-ash/60 mr-2">Filter:</span>
            <button 
                onClick={() => { setFilter('all'); setCurrentPage(1); }} 
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${filter === 'all' ? 'bg-primary text-white' : 'bg-chalk dark:bg-white/10 text-ash dark:text-chalk hover:bg-chalk/80'}`}
            >
                All
            </button>
            <button 
                onClick={() => { setFilter(ApplicationStatus.PENDING); setCurrentPage(1); }} 
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${filter === ApplicationStatus.PENDING ? 'bg-primary text-white' : 'bg-chalk dark:bg-white/10 text-ash dark:text-chalk hover:bg-chalk/80'}`}
            >
                Pending
            </button>
            <button 
                onClick={() => { setFilter(ApplicationStatus.APPROVED); setCurrentPage(1); }} 
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${filter === ApplicationStatus.APPROVED ? 'bg-primary text-white' : 'bg-chalk dark:bg-white/10 text-ash dark:text-chalk hover:bg-chalk/80'}`}
            >
                Approved
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-chalk/30 dark:bg-white/5 text-ash/70 dark:text-chalk/50 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4 w-10">
                    <input 
                        type="checkbox" 
                        onChange={handleSelectAll} 
                        checked={filteredApps.length > 0 && selectedIds.size === filteredApps.length}
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                </th>
                <th className="px-6 py-4">Applicant Email</th>
                <th className="px-6 py-4">Wave</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Submission Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-chalk dark:divide-white/10">
              {paginatedApps.length === 0 ? (
                 <tr><td colSpan={5} className="p-8 text-center text-ash dark:text-chalk/50">No applications found.</td></tr>
              ) : paginatedApps.map(app => (
                  <tr key={app.id} className="hover:bg-chalk/10 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-5">
                        <input 
                            type="checkbox" 
                            checked={selectedIds.has(app.id)} 
                            onChange={() => handleSelectOne(app.id)}
                            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary dark:text-accent font-bold text-xs uppercase">
                            {app.fullName.substring(0, 2)}
                        </div>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-1">
                                <span className="font-medium text-primary dark:text-chalk">{app.email}</span>
                                {emailCounts[app.email.toLowerCase()] > 1 && (
                                    <div className="group relative">
                                        <span className="material-icons-outlined text-amber-500 text-sm cursor-help">warning</span>
                                        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 w-48 bg-gray-900 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                                            Duplicate Email ({emailCounts[app.email.toLowerCase()]} submissions)
                                        </div>
                                    </div>
                                )}
                            </div>
                            <span className="text-xs text-ash/60 dark:text-chalk/40">{app.fullName}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                        {app.wave ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                                Wave {app.wave}
                            </span>
                        ) : (
                            <span className="text-xs text-ash/40 dark:text-chalk/30">-</span>
                        )}
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
                        {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-sm text-ash dark:text-chalk/60">
                        {new Date(app.submittedAt).toLocaleDateString()} • {new Date(app.submittedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {app.status === ApplicationStatus.PENDING ? (
                            <button 
                                onClick={() => handleStatusUpdate(app.id, ApplicationStatus.APPROVED)}
                                className="px-4 py-1.5 bg-primary text-white rounded-lg text-xs font-bold hover:opacity-90 transition-opacity"
                            >
                                Approve
                            </button>
                        ) : (
                            <span className="text-xs italic text-ash/40 dark:text-chalk/30 mr-2">
                                {app.status === ApplicationStatus.APPROVED ? 'Code Sent' : 'Rejected'}
                            </span>
                        )}
                        <Link 
                            to={`/admin/applications/${app.id}`}
                            className="p-1.5 text-ash dark:text-chalk/40 hover:text-primary dark:hover:text-accent transition-colors"
                        >
                             <span className="material-icons-outlined text-lg">visibility</span>
                        </Link>
                        {app.status === ApplicationStatus.PENDING && (
                            <button 
                                onClick={() => handleStatusUpdate(app.id, ApplicationStatus.REJECTED)}
                                className="p-1.5 text-ash dark:text-chalk/40 hover:text-red-500 transition-colors"
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
        
        <div className="p-6 border-t border-chalk dark:border-white/10 flex items-center justify-between">
          <p className="text-xs text-ash/60 dark:text-chalk/40">
             Showing {paginatedApps.length > 0 ? startRange : 0}-{endRange} of {filteredApps.length} applications
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
      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center">
              <h3 className="text-xl font-bold text-primary dark:text-white">Send Message</h3>
              <button onClick={() => setShowEmailModal(false)} className="text-ash/50 hover:text-red-500">
                <span className="material-icons-outlined">close</span>
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800/50">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-blue-800 dark:text-blue-300">Recipients ({selectedIds.size})</span>
                    <button 
                        onClick={() => setSelectedIds(new Set())}
                        className="text-xs text-blue-600 hover:underline"
                    >
                        Clear Selection
                    </button>
                </div>
                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                    {Array.from(selectedIds).slice(0, 10).map(id => {
                        const app = apps.find(a => a.id === id);
                        return (
                            <span key={id} className="text-xs bg-white dark:bg-white/10 px-2 py-1 rounded border border-blue-200 dark:border-white/10 text-blue-700 dark:text-blue-200">
                                {app?.email}
                            </span>
                        );
                    })}
                    {selectedIds.size > 10 && (
                        <span className="text-xs text-blue-500 italic flex items-center px-2">
                            +{selectedIds.size - 10} more
                        </span>
                    )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-ash/70 dark:text-chalk/60 mb-2">Load Template</label>
                <div className="flex gap-2">
                    <button onClick={() => applyTemplate('reminder')} className="px-3 py-1 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 rounded text-xs font-medium transition-colors border border-gray-200 dark:border-white/10 text-primary dark:text-chalk">
                        Assignment Reminder
                    </button>
                    <button onClick={() => applyTemplate('start')} className="px-3 py-1 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 rounded text-xs font-medium transition-colors border border-gray-200 dark:border-white/10 text-primary dark:text-chalk">
                        Class Starting
                    </button>
                    <button onClick={() => applyTemplate('general')} className="px-3 py-1 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 rounded text-xs font-medium transition-colors border border-gray-200 dark:border-white/10 text-primary dark:text-chalk">
                        General
                    </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-ash/70 dark:text-chalk/60 mb-2">Subject</label>
                <input 
                    type="text" 
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-primary dark:focus:ring-accent text-primary dark:text-chalk"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Email Subject"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-ash/70 dark:text-chalk/60 mb-2">Message Body</label>
                <textarea 
                    rows={8}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-primary dark:focus:ring-accent text-primary dark:text-chalk resize-none font-mono text-sm"
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    placeholder="Write your message here... (HTML tags supported)"
                />
                <p className="text-xs text-ash/50 mt-2 text-right">Preview not available. Sent as HTML.</p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-white/10 flex justify-end gap-3">
              <button 
                onClick={() => setShowEmailModal(false)}
                className="px-4 py-2 text-ash hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg font-bold transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSendBatchEmail}
                disabled={sendingEmail || !emailSubject || !emailBody}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {sendingEmail ? (
                    <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Sending...
                    </>
                ) : (
                    <>
                        <span className="material-icons-outlined text-sm">send</span>
                        Send Message
                    </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};