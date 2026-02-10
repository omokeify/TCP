import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MockService } from '../services/mockDb';
import { ClassConfig, DEFAULT_CLASS_INFO } from '../types';

export const QuestBoard: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [classConfig, setClassConfig] = useState<ClassConfig | null>(null);

  useEffect(() => {
    const loadData = async () => {
        const config = await MockService.getClassConfig();
        const mergedConfig = { ...DEFAULT_CLASS_INFO, ...config };
        setClassConfig(mergedConfig);
    };
    loadData();
  }, []);

  if (!classConfig) {
      return (
          <div className="min-h-screen flex items-center justify-center text-[#3B472F]">
              <div className="animate-pulse flex flex-col items-center">
                  <div className="h-12 w-12 bg-[#3B472F]/20 rounded-full mb-4"></div>
                  <div className="h-4 w-32 bg-[#3B472F]/20 rounded"></div>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen w-full font-sans text-[#3B472F] relative overflow-x-hidden">
      <style>{`
        :root {
            --primary: #3B472F;
            --accent: #FFFA7E;
            --eucalyptus: #CEE2C0;
            --chalk: #EDEDE1;
            --ash: #686868;
        }
        .liquid-glass {
            background: rgba(255, 255, 255, 0.45);
            backdrop-filter: blur(24px) saturate(180%);
            -webkit-backdrop-filter: blur(24px) saturate(180%);
            border: 1px solid rgba(255, 255, 255, 0.3);
            box-shadow: 0 25px 50px -12px rgba(59, 71, 47, 0.08);
        }
        .glass-card {
            background: rgba(255, 255, 255, 0.7);
            border: 1px solid rgba(255, 255, 255, 0.5);
            border-radius: 1.5rem;
            transition: all 0.3s ease;
        }
        .glass-card:hover {
            transform: translateY(-4px);
            background: rgba(255, 255, 255, 0.85);
            border-color: var(--accent);
            box-shadow: 0 10px 30px -10px rgba(59, 71, 47, 0.1);
        }
        .liquid-bg {
            background: radial-gradient(circle at 0% 0%, #FFFA7E 0%, transparent 40%),
                        radial-gradient(circle at 100% 100%, #CEE2C0 0%, transparent 40%),
                        radial-gradient(circle at 50% 50%, #EDEDE1 0%, #FFFFFF 100%);
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: -1;
        }
        .nohemi-tracking {
            letter-spacing: -0.02em;
        }
      `}</style>

      <div className="liquid-bg"></div>

      <main className="max-w-6xl mx-auto px-6 pt-12 pb-20">
        <header className="mb-12 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-4">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[var(--accent)] text-[var(--primary)] rounded-full text-xs font-bold">
                    <span className="material-icons-outlined text-[16px] leading-none">auto_awesome</span>
                    New Quests Available
                </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-[var(--primary)] nohemi-tracking mb-4">
                Choose Your Next Adventure
            </h1>
            <p className="text-lg text-[var(--primary)] opacity-70 max-w-2xl font-medium">
                Select a quest set to unlock specialized class content and begin your learning journey.
            </p>
        </header>

        <div className="liquid-glass rounded-[2.5rem] p-8 md:p-12 overflow-hidden relative">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-[var(--accent)] rounded-full blur-[80px] opacity-40 pointer-events-none"></div>
            
            {!classConfig.acceptingApplications ? (
                <div className="flex flex-col items-center justify-center text-center py-16">
                    <div className="w-20 h-20 rounded-full bg-[var(--primary)]/5 flex items-center justify-center mb-6">
                        <span className="material-icons-outlined text-4xl text-[var(--primary)] opacity-50">lock</span>
                    </div>
                    <h2 className="text-3xl font-extrabold text-[var(--primary)] mb-4">Applications Closed</h2>
                    <p className="text-[var(--ash)] max-w-md mx-auto leading-relaxed">
                        New quest applications are currently paused. Please check back later or contact the administrator for more information.
                    </p>
                </div>
            ) : (
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {classConfig.questSets?.map((quest) => (
                        <div 
                            key={quest.id} 
                            onClick={() => {
                                const ref = searchParams.get('ref');
                                navigate(ref ? `/quests/${quest.id}?ref=${ref}` : `/quests/${quest.id}`);
                            }}
                            className="glass-card p-8 flex flex-col h-full cursor-pointer group"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <span className={`px-3 py-1 text-[var(--primary)] text-[10px] font-bold uppercase tracking-wider rounded-full ${
                                    quest.category === 'Foundation' ? 'bg-[var(--accent)]' : 
                                    quest.category === 'Composition' ? 'bg-[var(--eucalyptus)]' : 
                                    'bg-white/50'
                                }`}>
                                    {quest.category}
                                </span>
                                <div className="flex items-center gap-1 text-[var(--ash)]">
                                    <span className="material-icons-outlined text-sm">signal_cellular_alt</span>
                                    <span className="text-[10px] font-bold uppercase tracking-widest">{quest.level}</span>
                                </div>
                            </div>
                            
                            <h3 className="text-2xl font-extrabold text-[var(--primary)] nohemi-tracking mb-3">
                                {quest.title}
                            </h3>
                            <p className="text-[var(--ash)] text-sm leading-relaxed mb-8 flex-grow font-medium">
                                {quest.description}
                            </p>
                            
                            <div className="pt-6 border-t border-[var(--primary)]/10 flex items-center justify-between mt-auto">
                                <div className="flex -space-x-2">
                                    {quest.tutor && (
                                        <img 
                                            alt={quest.tutor.name} 
                                            className="w-8 h-8 rounded-full border-2 border-white bg-gray-200" 
                                            src={quest.tutor.avatarUrl} 
                                        />
                                    )}
                                </div>
                                <button className="px-5 py-2.5 bg-[var(--primary)] text-white rounded-xl font-bold text-xs group-hover:bg-[var(--primary)]/90 transition-colors flex items-center gap-2">
                                    Start Quest
                                    <span className="material-icons-outlined text-[16px]">arrow_forward</span>
                                </button>
                            </div>
                        </div>
                    ))}

                    <div className="rounded-[1.5rem] border-2 border-dashed border-[var(--primary)]/20 flex flex-col items-center justify-center p-8 text-center opacity-60 hover:opacity-100 transition-opacity cursor-pointer hover:bg-[var(--primary)]/5">
                        <div className="w-14 h-14 rounded-full bg-[var(--primary)]/5 flex items-center justify-center mb-4">
                            <span className="material-icons-outlined text-[var(--primary)] text-2xl">add</span>
                        </div>
                        <h4 className="text-lg font-bold text-[var(--primary)] mb-1">New Quest Coming Soon</h4>
                        <p className="text-[var(--ash)] text-xs font-bold uppercase tracking-widest">Nominate a Topic</p>
                    </div>
                </div>
            )}
        </div>

        <footer className="mt-16 flex flex-col md:flex-row items-center justify-between gap-6 opacity-40">
          <div className="flex items-center gap-4">
            <p className="text-xs font-medium text-[var(--primary)]">
              © 2024 Blink Quest Selection. Primary Entry Node.
            </p>
          </div>
          <div className="flex gap-8">
            <a className="text-xs font-bold text-[var(--primary)] hover:text-[var(--accent)] transition-colors" href="#">Developer API</a>
            <a className="text-xs font-bold text-[var(--primary)] hover:text-[var(--accent)] transition-colors" href="#">Terms of Access</a>
          </div>
        </footer>
      </main>
    </div>
  );
};
