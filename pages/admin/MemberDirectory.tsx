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

  const [selectedMember, setSelectedMember] = useState<MemberOnboarding | null>(null);

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
      setMembers(validData.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()));
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
    const headers = ['fullName', 'email', 'telegramUsername', 'discordUsername', 'xUsername', 'country', 'stateRegion', 'maritalStatus', 'ageRange', 'joinTccDate', 'startWeb3JourneyDate', 'currentStatus', 'skills', 'otherSkills', 'skillLevel', 'knowledgeableTools', 'hasCertifications', 'certificationsList', 'hasPortfolio', 'portfolioLink', 'workedWithWeb3Brand', 'web3Role', 'web3Brands', 'contributionAreas', 'otherContributionAreas', 'contributionCapacity', 'inspiration', 'expectations', 'openToTeaching', 'hasNetworkAccess', 'networkDescription'];
    const rows = members.map(m => [
        m.fullName, m.email, m.telegramUsername, m.discordUsername, m.xUsername, m.country, m.stateRegion, m.maritalStatus, m.ageRange, m.joinTccDate, m.startWeb3JourneyDate, m.currentStatus, (m.skills || []).join('|'), m.otherSkills, m.skillLevel, m.knowledgeableTools, m.hasCertifications, m.certificationsList, m.hasPortfolio, m.portfolioLink, m.workedWithWeb3Brand, m.web3Role, m.web3Brands, (m.contributionAreas || []).join('|'), m.otherContributionAreas, m.contributionCapacity, m.inspiration, m.expectations, m.openToTeaching, m.hasNetworkAccess, m.networkDescription
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
        + [headers, ...rows].map(e => e.join(",")).join("\n");
        
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "tcc_members_full_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length < 2) return;

        const headers = lines[0].split(',').map(h => h.trim());
        const newMembers: Partial<MemberOnboarding>[] = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            const member: any = {};
            headers.forEach((header, index) => {
                let val: any = values[index];
                if (header === 'skills' || header === 'contributionAreas') {
                    val = val ? val.split('|') : [];
                }
                if (header === 'skillLevel') {
                    val = parseInt(val) || 3;
                }
                member[header] = val;
            });
            newMembers.push(member);
        }

        if (window.confirm(`Found ${newMembers.length} members in CSV. Import them now?`)) {
            setLoading(true);
            try {
                for (const member of newMembers) {
                    await MockService.submitMemberOnboarding(member);
                }
                alert(`Successfully imported ${newMembers.length} members!`);
                loadData();
            } catch (err) {
                alert("Error importing members: " + (err as Error).message);
            } finally {
                setLoading(false);
            }
        }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  if (loading) return <div className="p-8 text-[#3B472F] dark:text-[#FFFA7E]">Processing data...</div>;

  return (
    <div className="space-y-8 relative">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#3B472F] dark:text-[#FFFA7E]">TCC Member Directory</h1>
          <p className="text-[#686868] dark:text-white/60 mt-1">View detailed profiles and onboarding responses from TCC members.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
             onClick={() => navigate('/admin/applications')}
             className="px-4 py-2 border-2 border-[#3B472F]/20 dark:border-[#FFFA7E]/20 text-[#3B472F] dark:text-[#FFFA7E] rounded-lg font-semibold hover:bg-[#3B472F]/5 transition-all"
          >
             Applications
          </button>
          <label className="flex items-center gap-2 px-4 py-2 bg-[#3B472F] text-white dark:bg-[#FFFA7E] dark:text-[#3B472F] rounded-lg font-semibold hover:opacity-90 transition-all cursor-pointer shadow-lg shadow-[#3B472F]/20">
            <span className="material-icons-outlined text-sm">upload</span>
            Import CSV
            <input type="file" accept=".csv" className="hidden" onChange={handleImportCSV} />
          </label>
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 border-2 border-[#3B472F] dark:border-[#FFFA7E] text-[#3B472F] dark:text-[#FFFA7E] rounded-lg font-semibold hover:bg-[#3B472F]/5 transition-all"
          >
            <span className="material-icons-outlined text-sm">download</span>
            Export CSV
          </button>
          <button 
            onClick={toggleTheme}
            className="p-2 bg-white dark:bg-white/5 rounded-lg text-[#3B472F] dark:text-[#FFFA7E] hover:bg-gray-50 dark:hover:bg-white/10 transition-colors border border-[#3B472F]/10 dark:border-white/10"
          >
            <span className="material-icons-outlined">{isDark ? 'light_mode' : 'dark_mode'}</span>
          </button>
        </div>
      </header>

      <div className="bg-white dark:bg-white/5 rounded-2xl shadow-sm border border-chalk dark:border-white/10 overflow-hidden">
        <div className="p-6 border-b border-chalk dark:border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <span className="material-icons-outlined absolute left-3 top-3 text-ash dark:text-white/40">search</span>
            <input 
                className="w-full pl-10 pr-4 py-3 bg-chalk/50 dark:bg-white/5 border-none rounded-xl focus:ring-2 focus:ring-[#3B472F] dark:focus:ring-[#FFFA7E] transition-all text-sm text-[#3B472F] dark:text-white placeholder-ash/50 dark:placeholder-white/30" 
                placeholder="Search by name, email, or username..." 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="text-sm font-medium text-ash dark:text-white/60">
            Total Members: <span className="text-[#3B472F] dark:text-[#FFFA7E] font-bold">{members.length}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-chalk/30 dark:bg-white/5 text-ash/70 dark:text-white/50 text-xs font-bold uppercase tracking-wider">
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
                <tr><td colSpan={6} className="p-12 text-center text-ash dark:text-white/50">No members found in the directory.</td></tr>
              ) : filteredMembers.map(member => (
                <tr key={member.id} className="hover:bg-chalk/10 dark:hover:bg-white/5 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#3B472F] text-white flex items-center justify-center font-bold text-sm">
                        {(member.fullName || 'M').charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-[#3B472F] dark:text-white">{member.fullName}</span>
                        <span className="text-xs text-ash/60 dark:text-white/40">{member.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-ash dark:text-white/60">TG: <span className="font-medium text-[#3B472F] dark:text-white/80">{member.telegramUsername}</span></span>
                      <span className="text-xs text-ash dark:text-white/60">DC: <span className="font-medium text-[#3B472F] dark:text-white/80">{member.discordUsername}</span></span>
                      <span className="text-xs text-ash dark:text-white/60">X: <span className="font-medium text-[#3B472F] dark:text-white/80">{member.xUsername}</span></span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="inline-flex px-2 py-1 rounded-lg bg-[#3B472F]/10 text-[#3B472F] dark:bg-[#FFFA7E]/20 dark:text-[#FFFA7E] text-xs font-bold whitespace-nowrap">
                      {member.currentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {(member.skills || []).slice(0, 2).map((s, i) => (
                        <span key={i} className="text-[10px] bg-chalk dark:bg-white/10 px-1.5 py-0.5 rounded border border-chalk dark:border-white/10 text-ash dark:text-white/60">
                          {s}
                        </span>
                      ))}
                      {(member.skills || []).length > 2 && (
                        <span className="text-[10px] text-ash/40">+{(member.skills || []).length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-xs text-ash dark:text-white/60 font-medium">
                      {member.joinTccDate}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button 
                      onClick={() => setSelectedMember(member)}
                      className="p-2 text-ash dark:text-white/40 hover:text-[#3B472F] dark:hover:text-[#FFFA7E] transition-colors"
                    >
                      <span className="material-icons-outlined">visibility</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Member Details Modal */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-[#1a1a1a] w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl shadow-2xl flex flex-col border border-white/10">
            <header className="p-6 border-b border-chalk dark:border-white/10 flex items-center justify-between bg-gray-50/50 dark:bg-white/5">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#3B472F] text-white flex items-center justify-center font-bold text-xl">
                        {selectedMember.fullName.charAt(0)}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-[#3B472F] dark:text-[#FFFA7E]">{selectedMember.fullName}</h2>
                        <p className="text-sm text-ash dark:text-white/40">{selectedMember.email}</p>
                    </div>
                </div>
                <button 
                  onClick={() => setSelectedMember(null)}
                  className="p-2 rounded-full hover:bg-chalk dark:hover:bg-white/10 text-ash transition-colors"
                >
                    <span className="material-icons-outlined">close</span>
                </button>
            </header>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {/* Basic & Demo */}
                    <div className="space-y-8">
                        <section>
                            <h3 className="text-xs font-bold text-[#3B472F]/50 dark:text-[#FFFA7E]/50 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#3B472F] dark:bg-[#FFFA7E]"></span>
                                Contact Information
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <DetailItem label="Telegram" value={selectedMember.telegramUsername} />
                                <DetailItem label="Discord" value={selectedMember.discordUsername} />
                                <DetailItem label="X (Twitter)" value={selectedMember.xUsername} />
                                <DetailItem label="Location" value={`${selectedMember.country}, ${selectedMember.stateRegion}`} />
                            </div>
                        </section>

                        <section>
                            <h3 className="text-xs font-bold text-[#3B472F]/50 dark:text-[#FFFA7E]/50 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#3B472F] dark:bg-[#FFFA7E]"></span>
                                Demographics
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <DetailItem label="Marital Status" value={selectedMember.maritalStatus} />
                                <DetailItem label="Age Range" value={selectedMember.ageRange} />
                            </div>
                        </section>

                        <section>
                            <h3 className="text-xs font-bold text-[#3B472F]/50 dark:text-[#FFFA7E]/50 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#3B472F] dark:bg-[#FFFA7E]"></span>
                                TCC & Web3 Journey
                            </h3>
                            <div className="space-y-4">
                                <DetailItem label="Member Since" value={selectedMember.joinTccDate} />
                                <DetailItem label="In Community For" value={selectedMember.howLongInTcc} />
                                <DetailItem label="Web3 Experience Since" value={selectedMember.startWeb3JourneyDate} />
                            </div>
                        </section>
                    </div>

                    {/* Skills & Experience */}
                    <div className="space-y-8">
                         <section>
                            <h3 className="text-xs font-bold text-[#3B472F]/50 dark:text-[#FFFA7E]/50 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#3B472F] dark:bg-[#FFFA7E]"></span>
                                Skills & Expertise
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[10px] text-ash uppercase font-bold mb-2">Core Skills</p>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedMember.skills.map((s, i) => (
                                            <span key={i} className="px-3 py-1 bg-[#3B472F]/5 dark:bg-[#FFFA7E]/5 text-[#3B472F] dark:text-[#FFFA7E] rounded-full text-xs border border-[#3B472F]/10">
                                                {s}
                                            </span>
                                        ))}
                                        {selectedMember.otherSkills && (
                                           <span className="px-3 py-1 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 rounded-full text-xs border border-yellow-500/20 italic">
                                              {selectedMember.otherSkills}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <DetailItem label="Overall Skill Level" value={`${selectedMember.skillLevel} / 5`} />
                                <DetailItem label="Knowledgeable Tools" value={selectedMember.knowledgeableTools} />
                            </div>
                        </section>

                        <section>
                            <h3 className="text-xs font-bold text-[#3B472F]/50 dark:text-[#FFFA7E]/50 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#3B472F] dark:bg-[#FFFA7E]"></span>
                                Professional Status
                            </h3>
                            <div className="space-y-4">
                                <DetailItem label="Current Status" value={selectedMember.currentStatus} isHighlight />
                                <DetailItem label="Worked with Web3 Brands?" value={selectedMember.workedWithWeb3Brand} />
                                {selectedMember.workedWithWeb3Brand === 'Yes' && (
                                    <>
                                        <DetailItem label="Role" value={selectedMember.web3Role} />
                                        <DetailItem label="Brands" value={selectedMember.web3Brands} />
                                    </>
                                )}
                            </div>
                        </section>

                        <section>
                            <h3 className="text-xs font-bold text-[#3B472F]/50 dark:text-[#FFFA7E]/50 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#3B472F] dark:bg-[#FFFA7E]"></span>
                                Contributions
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[10px] text-ash uppercase font-bold mb-2">Interest Areas</p>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedMember.contributionAreas.map((a, i) => (
                                            <span key={i} className="px-3 py-1 bg-blue-500/5 text-blue-600 dark:text-blue-400 rounded-full text-xs border border-blue-500/10">
                                                {a}
                                            </span>
                                        ))}
                                        {selectedMember.otherContributionAreas && (
                                            <span className="px-3 py-1 bg-purple-500/5 text-purple-600 dark:text-purple-400 rounded-full text-xs border border-purple-500/10 italic">
                                                {selectedMember.otherContributionAreas}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <DetailItem label="Contribution Capacity" value={selectedMember.contributionCapacity} />
                            </div>
                        </section>
                    </div>
                </div>

                <div className="mt-10 pt-10 border-t border-chalk dark:border-white/10 grid grid-cols-1 md:grid-cols-2 gap-10">
                     <section>
                        <h3 className="text-xs font-bold text-[#3B472F]/50 dark:text-[#FFFA7E]/50 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#3B472F] dark:bg-[#FFFA7E]"></span>
                            Additional Info
                        </h3>
                        <div className="space-y-4">
                             <DetailItem label="Certifications" value={selectedMember.hasCertifications === 'Yes' ? selectedMember.certificationsList : 'None'} />
                             <DetailItem label="Portfolio" value={selectedMember.hasPortfolio === 'Yes' ? selectedMember.portfolioLink : 'None'} isLink={selectedMember.hasPortfolio === 'Yes'} />
                             <DetailItem label="Open to Mentoring?" value={selectedMember.openToTeaching} />
                        </div>
                    </section>

                    <section className="bg-[#3B472F]/5 dark:bg-[#FFFA7E]/5 p-6 rounded-2xl border border-[#3B472F]/10 dark:border-[#FFFA7E]/10">
                        <h3 className="text-xs font-bold text-[#3B472F]/50 dark:text-[#FFFA7E]/50 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#3B472F] dark:bg-[#FFFA7E]"></span>
                            Inspiration & Goals
                        </h3>
                        <div className="space-y-6">
                            <div>
                                <p className="text-[10px] text-ash uppercase font-bold mb-1">Impact & Motivation</p>
                                <p className="text-sm text-[#3B472F] dark:text-white/80 leading-relaxed italic">"{selectedMember.inspiration}"</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-ash uppercase font-bold mb-1">Expectations</p>
                                <p className="text-sm text-[#3B472F] dark:text-white/80 leading-relaxed">"{selectedMember.expectations}"</p>
                            </div>
                            {selectedMember.hasNetworkAccess === 'Yes' && (
                                <div>
                                    <p className="text-[10px] text-ash uppercase font-bold mb-1">Network & Reach</p>
                                    <p className="text-sm text-[#3B472F] dark:text-white/80 leading-relaxed font-medium">{selectedMember.networkDescription}</p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>

            <footer className="p-6 border-t border-chalk dark:border-white/10 flex justify-end gap-3 bg-gray-50/50 dark:bg-white/5">
                <button 
                  onClick={() => setSelectedMember(null)}
                  className="px-6 py-2 bg-[#3B472F] text-white dark:bg-[#FFFA7E] dark:text-[#3B472F] rounded-xl font-bold shadow-lg shadow-[#3B472F]/20 dark:shadow-[#FFFA7E]/10 border-none"
                >
                  Close Profile
                </button>
            </footer>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(59, 71, 47, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 71, 47, 0.2);
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
};

const DetailItem: React.FC<{ label: string; value?: string | number; isLink?: boolean; isHighlight?: boolean }> = ({ label, value, isLink, isHighlight }) => (
    <div className="flex flex-col">
        <span className="text-[10px] text-ash dark:text-white/30 uppercase font-bold mb-1">{label}</span>
        {isLink && value ? (
            <a href={value.toString().startsWith('http') ? value.toString() : `https://${value}`} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 dark:text-blue-400 hover:underline break-all font-medium">
                {value}
            </a>
        ) : (
            <span className={`text-sm ${isHighlight ? 'font-bold text-[#3B472F] dark:text-[#FFFA7E]' : 'text-[#3B472F] dark:text-white/80'} font-medium`}>
                {value || 'N/A'}
            </span>
        )}
    </div>
);
