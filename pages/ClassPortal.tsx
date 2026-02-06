import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MockService } from '../services/mockDb';
import { ClassConfig, DEFAULT_CLASS_INFO } from '../types';

export const ClassPortal: React.FC = () => {
  const navigate = useNavigate();
  const [classConfig, setClassConfig] = useState<ClassConfig | null>(null);

  useEffect(() => {
    const hasAccess = sessionStorage.getItem('blink_class_access');
    if (!hasAccess) {
      navigate('/access');
      return;
    }

    const loadConfig = async () => {
        const config = await MockService.getClassConfig();
        const mergedConfig = { ...DEFAULT_CLASS_INFO, ...config };
        setClassConfig(mergedConfig);
    };
    loadConfig();
  }, [navigate]);

  const handleSignOut = () => {
    sessionStorage.removeItem('blink_class_access');
    navigate('/access');
  };

  if (!classConfig) {
      return (
          <div className="min-h-screen flex items-center justify-center text-primary">
              <div className="animate-pulse flex flex-col items-center">
                  <div className="h-12 w-12 bg-primary/20 rounded-full mb-4"></div>
                  <div className="h-4 w-32 bg-primary/20 rounded"></div>
              </div>
          </div>
      );
  }

  const isLink = (str?: string) => str?.startsWith('http') || str?.startsWith('www');

  return (
    <div className="min-h-screen w-full font-sans text-primary relative">
      {/* Custom Styles for this page specifically */}
      <style>{`
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
        }
        /* Override body bg for this page context if needed, though we use a wrapper */
      `}</style>

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-accent" fill="currentColor" viewBox="0 0 100 100">
                        <path d="M50 15c-19.3 0-35 15.7-35 35s15.7 35 35 35 35-15.7 35-35-15.7-35-35-35zm0 60c-13.8 0-25-11.2-25-25s11.2-25 25-25 25 11.2 25 25-11.2 25-25 25z"></path>
                    </svg>
                </div>
                <span className="text-xl font-bold tracking-tighter text-primary">TCP<sup className="text-xs ml-0.5 font-normal opacity-60">TM</sup></span>
            </div>
            <div className="flex items-center gap-4">
                <span className="hidden sm:block text-sm font-medium text-primary opacity-60">Portal Access</span>
                <div className="hidden sm:block w-px h-4 bg-primary opacity-20"></div>
                <button 
                    onClick={handleSignOut}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-full text-xs font-bold hover:opacity-90 transition-all"
                >
                    Sign Out
                </button>
            </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 pt-32 pb-20">
        <header className="mb-12 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent text-primary rounded-full text-xs font-bold mb-4">
                <span className="material-icons-outlined text-[16px] leading-none">verified</span>
                Invite Code Redeemed
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-primary tracking-tight mb-4">
                Welcome to the Class 🎉
            </h1>
            <p className="text-lg text-primary opacity-70 max-w-2xl font-medium">
                You're all set! Below you'll find the curated details for your upcoming session. 
                Keep this link bookmarked as your primary portal.
            </p>
        </header>

        <div className="liquid-glass rounded-[2.5rem] p-8 md:p-12 overflow-hidden relative">
            {/* Background decorative blob */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-accent rounded-full blur-[80px] opacity-40 pointer-events-none"></div>
            
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Left Column: Class Details */}
                <div className="lg:col-span-7">
                    <div className="mb-10">
                        <span className="text-xs font-bold uppercase tracking-[0.2em] text-ash mb-2 block">Current Session</span>
                        <h2 className="text-3xl md:text-5xl font-extrabold text-primary tracking-tight mb-6 leading-tight">
                            {classConfig.title}
                        </h2>
                        <div className="prose prose-sm text-ash leading-relaxed font-medium whitespace-pre-wrap">
                            <p>{classConfig.description}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
                        <div className="glass-card p-6 flex flex-col gap-3">
                            <div className="w-10 h-10 bg-eucalyptus rounded-xl flex items-center justify-center text-primary">
                                <span className="material-icons-outlined">calendar_today</span>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-ash">Date</p>
                                <p className="text-lg font-bold text-primary">{classConfig.date || 'TBA'}</p>
                            </div>
                        </div>
                        <div className="glass-card p-6 flex flex-col gap-3">
                            <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-primary">
                                <span className="material-icons-outlined">schedule</span>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-ash">Time</p>
                                <p className="text-lg font-bold text-primary">{classConfig.time || 'TBA'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-primary text-white rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-primary/20">
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
                                <span className="material-icons-outlined text-white">videocam</span>
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-xs font-medium text-white/60">Meeting Location</p>
                                <p className="text-xl font-bold text-white truncate">
                                    {isLink(classConfig.location) ? 'Live via Zoom/Meet' : (classConfig.location || 'Online')}
                                </p>
                            </div>
                        </div>
                        {isLink(classConfig.location) && (
                            <a 
                                href={classConfig.location} 
                                target="_blank" 
                                rel="noreferrer"
                                className="w-full md:w-auto px-8 py-4 bg-accent text-primary rounded-2xl font-bold text-center hover:scale-105 transition-transform active:scale-95 whitespace-nowrap"
                            >
                                Join Meeting Now
                            </a>
                        )}
                    </div>
                </div>

                {/* Right Column: Instructor & Notes */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                    {/* Instructor Card */}
                    <div className="glass-card p-8">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-ash mb-6">Instructor</p>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-eucalyptus border-4 border-white shrink-0 flex items-center justify-center">
                                {/* Placeholder for instructor image since it's not in core config yet, defaulting to icon */}
                                <span className="material-icons-outlined text-3xl text-primary">person</span>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-primary">{classConfig.instructor || 'TBA'}</h3>
                                <p className="text-sm font-medium text-ash">Class Host</p>
                            </div>
                        </div>
                        <p className="text-xs text-ash leading-relaxed italic border-l-2 border-accent pl-3">
                            "Great design is eliminating all unnecessary details." — Join us for an immersive session.
                        </p>
                    </div>

                    {/* Extra Notes */}
                    <div className="glass-card p-8 flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-ash mb-6">Extra Notes</p>
                        <div className="space-y-4">
                            {classConfig.extraNotes ? (
                                <div className="flex gap-3 text-sm font-medium text-primary">
                                    <span className="material-icons-outlined text-sm text-primary mt-0.5 shrink-0">info</span>
                                    <span className="whitespace-pre-wrap">{classConfig.extraNotes}</span>
                                </div>
                            ) : (
                                <p className="text-sm text-ash italic">No additional notes.</p>
                            )}
                            
                            {/* Static filler items to match design density if notes are short */}
                            <div className="flex gap-3 text-sm font-medium text-primary opacity-60">
                                <span className="material-icons-outlined text-sm mt-0.5 shrink-0">check_circle</span>
                                <span>Q&A session will follow the main lecture.</span>
                            </div>
                        </div>
                    </div>

                    {/* Status Footer */}
                    <div className="flex flex-wrap items-center justify-between px-4 gap-2">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-ash opacity-60 uppercase tracking-widest">
                            <span className="material-icons-outlined text-[14px]">sync</span>
                            Last updated {classConfig.lastUpdated || 'recently'}
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                            <span className="text-[10px] font-bold text-ash opacity-60 uppercase tracking-widest">Live Sync Active</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <footer className="mt-12 flex flex-col md:flex-row items-center justify-between gap-6 opacity-60 px-4">
            <p className="text-xs font-medium text-primary">
                © {new Date().getFullYear()} TCP Studio. All class materials are protected.
            </p>
            <div className="flex gap-8">
                <button className="text-xs font-bold text-primary hover:underline">Support Center</button>
                <button className="text-xs font-bold text-primary hover:underline">Privacy Policy</button>
            </div>
        </footer>
      </main>
    </div>
  );
};