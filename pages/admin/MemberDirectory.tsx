import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MockService } from '../../services/mockDb';
import { MemberOnboarding } from '../../types';

export const MemberDirectory: React.FC = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState<MemberOnboarding[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDark, setIsDark] = useState(false);

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

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await MockService.getMemberOnboarding();
      // Ensure data is an array and filter out any potential nulls or invalid entries
      const validData = Array.isArray(data) ? data.filter(m => m && typeof m === 'object') : [];
      setMembers(validData);
    } catch (error) {
      console.error("Critical error loading members:", error);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = () => {
    if (document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    }
  };

  const filteredMembers = React.useMemo(() => {
    return members.filter(m => {
       if (!m) return false;
       const search = (searchTerm || '').toLowerCase();
       const fullName = (m.fullName || '').toString().toLowerCase();
       const email = (m.email || '').toString().toLowerCase();
       const telegram = (m.telegramUsername || '').toString().toLowerCase();
       const discord = (m.discordUsername || '').toString().toLowerCase();
       const x = (m.xUsername || '').toString().toLowerCase();

       return fullName.includes(search) || 
              email.includes(search) || 
              telegram.includes(search) || 
              discord.includes(search) ||
              x.includes(search);
    });
  }, [members, searchTerm]);

  const handleExportCSV = () => {
    if (members.length === 0) return;
    const headers = ['Full Name', 'Email', 'Telegram', 'Discord', 'X', 'Country', 'Status', 'Submitted At'];
    const rows = members.map(m => [
        m.fullName,
        m.email,
        m.telegramUsername,
        m.discordUsername,
        m.xUsername,
        m.country,
        m.currentStatus,
        m.submittedAt
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
        + [headers, ...rows].map(e => e.join(",")).join("\n");
        
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "tcc_members_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="p-8 text-primary">Loading members...</div>;

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary dark:text-accent">TCC Member Directory</h1>
          <p className="text-ash dark:text-chalk/60 mt-1">View detailed profiles and onboarding responses from TCC members.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
             onClick={() => navigate('/admin/applications')}
             className="px-4 py-2 border-2 border-primary/20 dark:border-accent/20 text-primary dark:text-accent rounded-lg font-semibold hover:bg-primary/5 transition-all"
          >
             Applications
          </button>
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 border-2 border-primary dark:border-accent text-primary dark:text-accent rounded-lg font-semibold hover:bg-primary hover:text-white dark:hover:bg-accent dark:hover:text-primary transition-all"
          >
            <span className="material-icons-outlined text-sm">download</span>
            Export CSV
          </button>
          <button 
            onClick={toggleTheme}
            className="p-2 bg-white dark:bg-ash/20 rounded-lg text-primary dark:text-accent hover:bg-gray-50 dark:hover:bg-ash/30 transition-colors"
          >
            <span className="material-icons-outlined">{isDark ? 'light_mode' : 'dark_mode'}</span>
          </button>
        </div>
      </header>

      <div className="bg-white dark:bg-white/5 rounded-2xl shadow-sm border border-chalk dark:border-white/10 overflow-hidden">
        <div className="p-6 border-b border-chalk dark:border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <span className="material-icons-outlined absolute left-3 top-3 text-ash dark:text-chalk/40">search</span>
            <input 
                className="w-full pl-10 pr-4 py-3 bg-chalk/50 dark:bg-white/5 border-none rounded-xl focus:ring-2 focus:ring-primary dark:focus:ring-accent transition-all text-sm text-primary dark:text-chalk placeholder-ash/50 dark:placeholder-chalk/30" 
                placeholder="Search by name, email, or username..." 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="text-sm font-medium text-ash dark:text-chalk/60">
            Total Members: <span className="text-primary dark:text-accent font-bold">{members.length}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-chalk/30 dark:bg-white/5 text-ash/70 dark:text-chalk/50 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Member</th>
                <th className="px-6 py-4">Contact (TG/DC/X)</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Skills</th>
                <th className="px-6 py-4">Joined TCC</th>
                <th className="px-6 py-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-chalk dark:divide-white/10">
              {filteredMembers.length === 0 ? (
                <tr><td colSpan={6} className="p-12 text-center text-ash dark:text-chalk/50">No members found in the directory.</td></tr>
              ) : filteredMembers.map(member => (
                <tr key={member.id} className="hover:bg-chalk/10 dark:hover:bg-white/5 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary text-accent flex items-center justify-center font-bold text-sm">
                        {(member.fullName || 'M').charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-primary dark:text-chalk">{member.fullName}</span>
                        <span className="text-xs text-ash/60 dark:text-chalk/40">{member.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-ash dark:text-chalk/60">TG: <span className="font-medium">{member.telegramUsername}</span></span>
                      <span className="text-xs text-ash dark:text-chalk/60">DC: <span className="font-medium">{member.discordUsername}</span></span>
                      <span className="text-xs text-ash dark:text-chalk/60">X: <span className="font-medium">{member.xUsername}</span></span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="inline-flex px-2 py-1 rounded-lg bg-eucalyptus/20 text-primary dark:text-eucalyptus text-xs font-bold">
                      {member.currentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {(member.skills || []).slice(0, 2).map((s, i) => (
                        <span key={i} className="text-[10px] bg-chalk dark:bg-white/10 px-1.5 py-0.5 rounded border border-chalk dark:border-white/10 text-ash dark:text-chalk/60">
                          {s}
                        </span>
                      ))}
                      {(member.skills || []).length > 2 && (
                        <span className="text-[10px] text-ash/40">+{(member.skills || []).length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-xs text-ash dark:text-chalk/60 font-medium">
                      {member.joinTccDate}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button 
                      onClick={() => alert('Full profile view coming soon!')}
                      className="p-2 text-ash dark:text-chalk/40 hover:text-primary dark:hover:text-accent transition-colors"
                    >
                      <span className="material-icons-outlined">chevron_right</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
