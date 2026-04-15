import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MockService } from '../../services/mockDb';
import { MemberOnboarding } from '../../types';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState<MemberOnboarding[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDark, setIsDark] = useState(false);

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
    const data = await MockService.getMemberOnboarding();
    const validData = Array.isArray(data) ? data.filter(m => m && typeof m === 'object') : [];
    setMembers(validData.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()));
    setLoading(false);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(filteredMembers.map(m => m.id)));
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
        "welcome": {
            subject: "Welcome to The Compass Community!",
            body: "Hi there,\n\nWe are thrilled to officially welcome you to TCC! \n\nPlease make sure you have introduced yourself in our Telegram and Discord channels.\n\nBest regards,\nThe Community Team"
        },
        "event": {
            subject: "Upcoming Community Event Reminder",
            body: "Hello,\n\nWe are hosting a community space shortly! Please check the latest announcements.\n\nSee you there!"
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
        const recipients = members.filter(m => selectedIds.has(m.id)).map(m => m.email);
        const res = await MockService.batchSendEmail(recipients, emailSubject, emailBody.replace(/\n/g, '<br>'));
        if (res.success) {
            alert(`Successfully sent emails to ${res.sent} recipients.`);
            setShowEmailModal(false);
            setSelectedIds(new Set());
            setEmailSubject('');
            setEmailBody('');
            await loadData();
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
    if (members.length === 0) return;
    const headers = ['fullName', 'email', 'telegramUsername', 'discordUsername', 'xUsername', 'country', 'stateRegion', 'maritalStatus', 'ageRange', 'joinTccDate', 'startWeb3JourneyDate', 'currentStatus', 'skills', 'otherSkills', 'skillLevel', 'knowledgeableTools', 'hasCertifications', 'certificationsList', 'hasPortfolio', 'portfolioLink', 'workedWithWeb3Brand', 'web3Role', 'web3Brands', 'contributionAreas', 'otherContributionAreas', 'contributionCapacity', 'inspiration', 'expectations', 'openToTeaching', 'hasNetworkAccess', 'networkDescription'];
    const rows = members.map(m => [
        m.fullName, m.email, m.telegramUsername, m.discordUsername, m.xUsername, m.country, m.stateRegion, m.maritalStatus, m.ageRange, m.joinTccDate, m.startWeb3JourneyDate, m.currentStatus, (m.skills || []).join('|'), m.otherSkills, m.skillLevel, m.knowledgeableTools, m.hasCertifications, m.certificationsList, m.hasPortfolio, m.portfolioLink, m.workedWithWeb3Brand, m.web3Role, m.web3Brands, (m.contributionAreas || []).join('|'), m.otherContributionAreas, m.contributionCapacity, m.inspiration, m.expectations, m.openToTeaching, m.hasNetworkAccess, m.networkDescription
    ]);

    const escapeCsv = (val: any) => {
        if (val == null) return '""';
        // Replace newlines with a separator so Excel rows don't become massive
        const str = String(val).replace(/[\n\r]+/g, ' | ');
        return `"${str.replace(/"/g, '""')}"`;
    };

    const csvContent = [headers.map(escapeCsv), ...rows.map(r => r.map(escapeCsv))].map(e => e.join(",")).join("\n");

    // Use Blob to prevent browser URI cutoff limits and prepend BOM for Excel UTF-8 support
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) { 
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "tcc_dashboard_export.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
  };

  const filteredMembers = members.filter(m => {
    if (!m) return false;
    const search = searchTerm.toLowerCase();
    return (m.email?.toLowerCase().includes(search) || m.fullName?.toLowerCase().includes(search) || m.telegramUsername?.toLowerCase().includes(search));
  });

  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const paginatedMembers = filteredMembers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const startRange = (currentPage - 1) * itemsPerPage + 1;
  const endRange = Math.min(filteredMembers.length, currentPage * itemsPerPage);

  const stats = {
    total: members.length,
    recent: members.filter(m => {
      const isRecent = new Date(m.submittedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return isRecent;
    }).length,
    withPortfolio: members.filter(m => m.hasPortfolio === 'Yes').length,
    experienced: members.filter(m => m.workedWithWeb3Brand === 'Yes').length
  };

  const emailCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    members.forEach(m => {
       if (m.email) counts[m.email.toLowerCase()] = (counts[m.email.toLowerCase()] || 0) + 1;
    });
    return counts;
  }, [members]);

  if (loading) return <div className="p-8 text-primary">Loading data...</div>;

  return (
    <>
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#3B472F] dark:text-[#FFFA7E]">Community Dashboard</h1>
          <p className="text-ash dark:text-chalk/60 mt-1">Overview of the TCC Member Ecosystem and communications.</p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <button 
             onClick={() => navigate('/admin/members')}
             className="flex items-center gap-2 px-4 py-2 border-2 border-[#3B472F]/20 dark:border-[#FFFA7E]/20 text-[#3B472F] dark:text-[#FFFA7E] rounded-lg font-bold hover:bg-[#3B472F]/5 transition-all"
          >
             <span className="material-icons-outlined text-sm">group</span>
             Detailed Directory
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
             onClick={handleExportCSV}
             className="flex items-center gap-2 px-4 py-2 bg-[#3B472F] text-white dark:bg-[#FFFA7E] dark:text-[#3B472F] rounded-lg font-semibold hover:opacity-90 transition-all shadow-lg shadow-[#3B472F]/20"
          >
             <span className="material-icons-outlined text-sm">download</span>
             Quick Export
          </button>
          <button 
            onClick={toggleTheme}
            className="p-2 bg-white dark:bg-ash/20 rounded-lg text-[#3B472F] dark:text-[#FFFA7E] hover:bg-gray-50 dark:hover:bg-ash/30 transition-colors border border-[#3B472F]/10 dark:border-white/10"
          >
            <span className="material-icons-outlined">{isDark ? 'light_mode' : 'dark_mode'}</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-white/5 p-6 rounded-2xl shadow-sm border border-chalk dark:border-white/10">
          <p className="text-ash dark:text-chalk/60 text-sm font-medium">Total Community Members</p>
          <p className="text-3xl font-bold text-[#3B472F] dark:text-white mt-2">{stats.total}</p>
        </div>
        <div className="bg-[#FFFA7E]/20 dark:bg-[#FFFA7E]/10 p-6 rounded-2xl shadow-sm border border-[#FFFA7E]/30">
          <p className="text-ash dark:text-chalk/60 text-sm font-medium">Joined Last 7 Days</p>
          <p className="text-3xl font-bold text-[#3B472F] dark:text-[#FFFA7E] mt-2">+{stats.recent}</p>
        </div>
        <div className="bg-green-100 dark:bg-green-900/20 p-6 rounded-2xl shadow-sm border border-green-200 dark:border-green-800/30">
          <p className="text-ash dark:text-chalk/60 text-sm font-medium">Has Portfolio</p>
          <p className="text-3xl font-bold text-[#3B472F] dark:text-green-400 mt-2">{stats.withPortfolio}</p>
        </div>
        <div className="bg-blue-100 dark:bg-blue-900/20 p-6 rounded-2xl shadow-sm border border-blue-200 dark:border-blue-800/30">
          <p className="text-ash dark:text-chalk/60 text-sm font-medium">Web3 Brand XP</p>
          <p className="text-3xl font-bold text-[#3B472F] dark:text-blue-400 mt-2">{stats.experienced}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-white/5 rounded-2xl shadow-sm border border-chalk dark:border-white/10 overflow-hidden">
        <div className="p-6 border-b border-chalk dark:border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <span className="material-icons-outlined absolute left-3 top-2.5 text-ash dark:text-chalk/40">search</span>
            <input 
                className="w-full pl-10 pr-4 py-2 bg-chalk/50 dark:bg-white/5 border-none rounded-lg focus:ring-2 focus:ring-[#3B472F] dark:focus:ring-[#FFFA7E] transition-all text-sm text-[#3B472F] dark:text-chalk placeholder-ash/50 dark:placeholder-chalk/30" 
                placeholder="Search by email, name, telegram..." 
                type="text"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
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
                        checked={filteredMembers.length > 0 && selectedIds.size === filteredMembers.length}
                        className="w-4 h-4 rounded border-gray-300 text-[#3B472F] focus:ring-[#3B472F]"
                    />
                </th>
                <th className="px-6 py-4">Member Data</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Registration Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-chalk dark:divide-white/10">
              {paginatedMembers.length === 0 ? (
                 <tr><td colSpan={5} className="p-8 text-center text-ash dark:text-chalk/50">No members found.</td></tr>
              ) : paginatedMembers.map(member => (
                  <tr key={member.id} className="hover:bg-chalk/10 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-5">
                        <input 
                            type="checkbox" 
                            checked={selectedIds.has(member.id)} 
                            onChange={() => handleSelectOne(member.id)}
                            className="w-4 h-4 rounded border-gray-300 text-[#3B472F] focus:ring-[#3B472F]"
                        />
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#3B472F]/10 flex items-center justify-center text-[#3B472F] dark:text-[#FFFA7E] font-bold text-sm uppercase">
                            {(member.fullName || 'M').substring(0, 2)}
                        </div>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-1">
                                <span className="font-bold text-[#3B472F] dark:text-chalk">{member.fullName}</span>
                                {member.email && emailCounts[member.email.toLowerCase()] > 1 && (
                                    <div className="group relative">
                                        <span className="material-icons-outlined text-amber-500 text-sm cursor-help">warning</span>
                                        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 w-48 bg-gray-900 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                                            Duplicate Email ({emailCounts[member.email.toLowerCase()]} submissions)
                                        </div>
                                    </div>
                                )}
                            </div>
                            <span className="text-xs text-ash/60 dark:text-chalk/40 mt-0.5">{member.email}</span>
                            <span className="text-xs text-[#3B472F]/60 dark:text-[#FFFA7E]/60 font-medium">TG: {member.telegramUsername}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                        <span className="text-sm font-medium text-ash dark:text-white/80">{member.country}</span><br/>
                        <span className="text-xs text-ash/60 dark:text-white/40">{member.stateRegion}</span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 dark:bg-eucalyptus/20 text-green-800 dark:text-eucalyptus">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 dark:bg-eucalyptus"></span>
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-5 text-sm font-medium text-ash dark:text-chalk/60">
                        {new Date(member.submittedAt).toLocaleDateString()}
                    </td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="p-6 border-t border-chalk dark:border-white/10 flex items-center justify-between">
          <p className="text-xs font-medium text-ash/60 dark:text-chalk/40">
             Showing {paginatedMembers.length > 0 ? startRange : 0} - {endRange} of {filteredMembers.length} members
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-white/10">
            <div className="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
              <h3 className="text-xl font-bold text-[#3B472F] dark:text-[#FFFA7E]">Compose Mass Broadcast</h3>
              <button onClick={() => setShowEmailModal(false)} className="p-2 rounded-full hover:bg-chalk dark:hover:bg-white/10 text-ash transition-colors">
                <span className="material-icons-outlined">close</span>
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800/30">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-blue-800 dark:text-blue-300">Selected Recipients ({selectedIds.size})</span>
                    <button 
                        onClick={() => setSelectedIds(new Set())}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                    >
                        Clear Selection
                    </button>
                </div>
                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto custom-scrollbar">
                    {Array.from(selectedIds).slice(0, 15).map(id => {
                        const m = members.find(a => a.id === id);
                        return (
                            <span key={id} className="text-[10px] bg-white dark:bg-white/10 px-2 py-1 rounded border border-blue-200 dark:border-white/10 text-blue-700 dark:text-blue-200 font-medium">
                                {m?.email}
                            </span>
                        );
                    })}
                    {selectedIds.size > 15 && (
                        <span className="text-[10px] text-blue-500 font-bold flex items-center px-2">
                            +{selectedIds.size - 15} more
                        </span>
                    )}
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-ash/70 dark:text-chalk/60 mb-3">Quick Templates</label>
                <div className="flex gap-2">
                    <button onClick={() => applyTemplate('welcome')} className="px-4 py-2 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 rounded-lg text-xs font-bold transition-colors border border-gray-200 dark:border-white/10 text-[#3B472F] dark:text-chalk">
                        Welcome Email
                    </button>
                    <button onClick={() => applyTemplate('event')} className="px-4 py-2 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 rounded-lg text-xs font-bold transition-colors border border-gray-200 dark:border-white/10 text-[#3B472F] dark:text-chalk">
                        Event Reminder
                    </button>
                    <button onClick={() => applyTemplate('general')} className="px-4 py-2 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 rounded-lg text-xs font-bold transition-colors border border-gray-200 dark:border-white/10 text-[#3B472F] dark:text-chalk">
                        General Announce
                    </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-ash/70 dark:text-chalk/60 mb-2">Subject Line</label>
                <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-[#3B472F] dark:focus:ring-[#FFFA7E] transition-all text-sm text-[#3B472F] dark:text-chalk"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Enter email subject"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-ash/70 dark:text-chalk/60 mb-2">Message Body</label>
                <textarea 
                    rows={8}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-[#3B472F] dark:focus:ring-[#FFFA7E] transition-all text-[#3B472F] dark:text-chalk resize-none font-medium text-sm"
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    placeholder="Write your broadcast message here... (Standard HTML supported)"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-white/10 flex justify-end gap-3 bg-gray-50/50 dark:bg-white/5">
              <button 
                onClick={() => setShowEmailModal(false)}
                className="px-6 py-2 text-ash hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl font-bold transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSendBatchEmail}
                disabled={sendingEmail || !emailSubject || !emailBody}
                className="px-8 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-blue-600/20"
              >
                {sendingEmail ? (
                    <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Broadcasting...
                    </>
                ) : (
                    <>
                        <span className="material-icons-outlined text-sm">send</span>
                        Send Now
                    </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(59, 71, 47, 0.2); border-radius: 10px; }
      `}</style>
    </>
  );
};