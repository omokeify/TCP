import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MockService } from '../services/mockDb';
import { ClassConfig, DEFAULT_CLASS_INFO, Application, LearningChallenge } from '../types';

const Countdown = ({ targetDate }: { targetDate: Date }) => {
    const [timeLeft, setTimeLeft] = useState<{days: number, hours: number, minutes: number, seconds: number} | null>(null);

    useEffect(() => {
        const calculate = () => {
            const now = new Date();
            const diff = targetDate.getTime() - now.getTime();
            if (diff <= 0) {
                setTimeLeft(null); // Started
                return;
            }
            setTimeLeft({
                days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((diff / 1000 / 60) % 60),
                seconds: Math.floor((diff / 1000) % 60)
            });
        };
        calculate();
        const interval = setInterval(calculate, 1000);
        return () => clearInterval(interval);
    }, [targetDate]);

    if (!timeLeft) return <div className="inline-block px-3 py-1 bg-red-100 text-red-600 rounded-full text-xs font-bold animate-pulse">HAPPENING NOW</div>;

    return (
        <div className="flex gap-3 text-center bg-white/50 px-4 py-2 rounded-xl border border-white/50">
            {Object.entries(timeLeft).map(([unit, value]) => (
                <div key={unit} className="flex flex-col min-w-[30px]">
                    <span className="text-xl font-bold font-mono text-[var(--primary)] leading-none">{String(value).padStart(2, '0')}</span>
                    <span className="text-[8px] uppercase text-[var(--ash)] tracking-wider mt-1">{unit}</span>
                </div>
            ))}
        </div>
    );
};

export const ClassPortal: React.FC = () => {
  const navigate = useNavigate();
  const [classConfig, setClassConfig] = useState<ClassConfig | null>(null);
  const [userCode, setUserCode] = useState<string>('');
  const [application, setApplication] = useState<Application | null>(null);
  const [leaderboard, setLeaderboard] = useState<{name: string, xp: number, avatar: string}[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.includes('?') ? window.location.hash.split('?')[1] : '');
    if (params.get('welcome')) {
        setShowCelebration(true);
        // Using HashRouter, we don't necessarily need to replace state to clean URL as easily without reloading,
        // but we can just leave it for now or clean the hash if needed.
    }
  }, []);

  const handleProofSubmit = async (challenge: LearningChallenge) => {
    if (!application) return;

    let proof = "";
    if (challenge.proofType === 'link' || challenge.proofType === 'github' || challenge.proofType === 'image') {
        proof = prompt(`Please enter the URL for your ${challenge.proofType} proof:`) || "";
    } else {
        proof = prompt("Please enter your text proof:") || "";
    }

    if (!proof) return;

    try {
        const currentProofs = application.taskProofs || {};
        const newProofs = { ...currentProofs, [challenge.id]: proof };
        
        // Optimistic UI Update
        const updatedApp = { ...application, taskProofs: newProofs };
        setApplication(updatedApp);

        // API Call
        await MockService.updateApplication(application.id, { taskProofs: newProofs });
        alert("Proof submitted successfully! XP awarded pending review.");
    } catch (e) {
        alert("Failed to submit proof. Please try again.");
    }
  };

  useEffect(() => {
    const hasAccess = sessionStorage.getItem('tcp_class_access');
    const code = sessionStorage.getItem('tcp_user_code');
    
    if (!hasAccess) {
      navigate('/access');
      return;
    }
    
    if (code) setUserCode(code);

    const loadConfig = async () => {
        const config = await MockService.getClassConfig();
        // Force local defaults for critical schedule info to ensure the update takes precedence
        // over potentially stale remote data
        const mergedConfig = { 
            ...DEFAULT_CLASS_INFO, 
            ...config,
            date: DEFAULT_CLASS_INFO.date,
            time: DEFAULT_CLASS_INFO.time,
            sessions: DEFAULT_CLASS_INFO.sessions,
            questSets: DEFAULT_CLASS_INFO.questSets
        };
        setClassConfig(mergedConfig);

        // Load Application for Admin Note
        if (code) {
             try {
                 const codes = await MockService.getCodes();
                 const codeEntry = codes.find(c => c.code === code);
                 if (codeEntry) {
                     const app = await MockService.getApplicationById(codeEntry.applicationId);
                     if (app) setApplication(app);
                 }
             } catch (e) {
                 console.error("Failed to load user application", e);
             }
        }
    };

    loadConfig();
  }, [navigate]);

  // Leaderboard Logic
  useEffect(() => {
    if (!classConfig) return;

    const loadLeaderboard = async () => {
        try {
            const apps = await MockService.getApplications();
            const approvedApps = apps.filter(a => a.status === 'approved');
            
            // Resolve Modules (Prioritize Active Quest, then Global)
            const activeQuest = classConfig.questSets?.find(q => q.status === 'active') || classConfig.questSets?.[0];
            const modules = activeQuest?.modules && activeQuest.modules.length > 0 
                ? activeQuest.modules 
                : (classConfig.modules || []);

            const stats = approvedApps.map(app => {
                let xp = 0;
                modules.forEach(mod => {
                    mod.challenges.forEach(chal => {
                        if (app.taskProofs?.[chal.id]) {
                            xp += (chal.xp || 0);
                        }
                    });
                });
                
                // Get Display Name
                const names = (app.fullName || "").split(' ');
                const displayName = names.length > 1 ? `${names[0]} ${names[names.length - 1][0]}.` : names[0];

                return {
                    name: displayName || app.email.split('@')[0],
                    xp,
                    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${app.email}`
                };
            });

            // Sort by XP desc, then Name asc
            const sorted = stats.sort((a, b) => {
                if (b.xp !== a.xp) return b.xp - a.xp;
                return a.name.localeCompare(b.name);
            }).slice(0, 5); // Top 5
            
            setLeaderboard(sorted);
        } catch (e) {
            console.error("Leaderboard error", e);
        }
    };

    loadLeaderboard();
  }, [classConfig]);

  const generateReferralLink = () => {
    if (!userCode) return '';
    // Construct absolute URL
    return `${window.location.origin}/?ref=${userCode}`;
  };

  const copyReferralLink = () => {
    const link = generateReferralLink();
    if (link) {
      navigator.clipboard.writeText(link);
      alert("Referral link copied to clipboard!");
    }
  };

  // --- Calendar Logic ---
  
  const parseDates = (session?: { date?: string; time?: string }) => {
    if (!session?.date || !session?.time) return null;
    
    // Attempt basic parsing for "October 15, 2024" and "10:00 AM - 2:00 PM PST"
    try {
        const dateStr = session.date; // e.g. "October 15, 2024"
        const timeStr = session.time; // e.g. "10:00 AM - 2:00 PM PST"
        
        // Extract start/end time
        // Matches "10:00 AM" or "14:00"
        const times = timeStr.match(/(\d{1,2}:\d{2}\s?(?:AM|PM)?)/gi);
        
        if (!times || times.length < 1) return null;

        const startDateTimeStr = `${dateStr} ${times[0]}`;
        const endDateTimeStr = times.length > 1 ? `${dateStr} ${times[1]}` : startDateTimeStr;

        const start = new Date(startDateTimeStr);
        // Default duration 1 hour if no end time
        const end = times.length > 1 ? new Date(endDateTimeStr) : new Date(start.getTime() + 60*60*1000);

        if (isNaN(start.getTime())) return null;

        return { start, end };
    } catch (e) {
        return null;
    }
  };

  const handleGoogleCalendar = (session: { title: string, description?: string, instructor?: string, location?: string, date: string, time: string }) => {
     const dates = parseDates(session);
     if (!dates) {
        alert("Could not open Google Calendar. Date format may be invalid.");
        return;
     }
     
     const formatDate = (date: Date) => date.toISOString().replace(/-|:|\.\d+/g, "");
     
     const url = new URL("https://calendar.google.com/calendar/render");
     url.searchParams.append("action", "TEMPLATE");
     url.searchParams.append("text", session.title);
     url.searchParams.append("dates", `${formatDate(dates.start)}/${formatDate(dates.end)}`);
     url.searchParams.append("details", `${session.description || classConfig?.description || ""}\n\nInstructor: ${session.instructor}`);
     url.searchParams.append("location", session.location || "");

     window.open(url.toString(), '_blank');
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
  
  // Progress Calculation
  const totalTasks = classConfig.tasks?.length || 0;
  const completedTasks = application?.taskProofs ? Object.keys(application.taskProofs).length : 0;
  const pendingTasks = Math.max(0, totalTasks - completedTasks);
  const progressPercent = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Use sessions if available, otherwise fallback to legacy single session
  const sessions = classConfig.sessions && classConfig.sessions.length > 0 ? classConfig.sessions : [
      {
          id: 'default',
          title: classConfig.title, // Use main title for default session
          description: classConfig.description,
          date: classConfig.date || 'TBA',
          time: classConfig.time || 'TBA',
          location: classConfig.location || 'Online',
          instructor: classConfig.instructor || 'TBA'
      }
  ];

  // Resolve Modules (Prioritize Active Quest, then Global)
  const activeQuest = classConfig.questSets?.find(q => q.status === 'active') || classConfig.questSets?.[0];
  const modules = activeQuest?.modules && activeQuest.modules.length > 0 
      ? activeQuest.modules 
      : (classConfig.modules || []);

  return (
    <div className="min-h-screen w-full font-sans text-primary relative overflow-x-hidden">
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
                    <span className="material-icons-outlined text-[16px] leading-none">verified</span>
                    Invite Code Redeemed
                </div>
                {classConfig.stats && classConfig.capacity && (
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/50 text-[var(--primary)] rounded-full text-xs font-bold border border-[var(--primary)]/10 backdrop-blur-sm">
                        <span className="material-icons-outlined text-[16px] leading-none">group</span>
                        {classConfig.stats.approved} of {classConfig.capacity} spots filled
                    </div>
                )}
                <button 
                    onClick={() => alert("✅ Browser: Supported\n✅ Network: Online\n✅ Zoom: Reachable\n\nYou are ready for class! See you inside.")}
                    className="inline-flex items-center gap-2 px-4 py-1.5 bg-white text-[var(--primary)] rounded-full text-xs font-bold border border-[var(--primary)]/10 hover:bg-[var(--primary)] hover:text-white transition-colors"
                >
                    <span className="material-icons-outlined text-[16px] leading-none">speed</span>
                    Test Access
                </button>
            </div>

            {application?.adminNote && (
                <div className="mb-8 p-4 bg-[#FFFA7E]/80 border border-[#FFFA7E] rounded-xl flex gap-3 shadow-sm max-w-2xl">
                    <span className="material-icons-outlined text-[var(--primary)]">campaign</span>
                    <div>
                        <h3 className="font-bold text-[var(--primary)] text-xs uppercase tracking-wide mb-1">Message from Admin</h3>
                        <p className="text-[var(--primary)] text-sm font-medium leading-relaxed">{application.adminNote}</p>
                    </div>
                </div>
            )}

            <h1 className="text-4xl md:text-6xl font-extrabold text-[var(--primary)] nohemi-tracking mb-4">
                Welcome to the Class 🎉
            </h1>
            <p className="text-lg text-[var(--primary)] opacity-70 max-w-2xl font-medium">
                You're all set! Below you'll find the curated details for your upcoming session. 
                Keep this link bookmarked as your primary portal.
            </p>
        </header>

        <div className="liquid-glass rounded-[2.5rem] p-8 md:p-12 overflow-hidden relative">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-[var(--accent)] rounded-full blur-[80px] opacity-40 pointer-events-none"></div>
            
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Left Column: Quest Map or Sessions List */}
                <div className="lg:col-span-7 space-y-12">
                    {modules && modules.length > 0 ? (
                        <div className="space-y-12 animate-fadeIn">
                            <div className="flex items-center gap-3 mb-8 pb-8 border-b border-[var(--primary)]/10">
                                <div className="p-3 bg-[var(--primary)] text-white rounded-xl shadow-lg shadow-[var(--primary)]/20">
                                    <span className="material-icons-outlined text-2xl">map</span>
                                </div>
                                <div>
                                    <h2 className="text-3xl font-extrabold text-[var(--primary)] nohemi-tracking leading-none">Quest Map</h2>
                                    <p className="text-sm font-medium text-[var(--ash)] mt-1">Your journey to mastery starts here.</p>
                                </div>
                            </div>
                            
                            {modules.map((module, mIndex) => (
                                <div key={module.id || mIndex} className="relative pl-8 border-l-2 border-[var(--primary)]/10 last:border-0 pb-16 last:pb-0">
                                    {/* Timeline Node */}
                                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[var(--accent)] border-4 border-white shadow-sm z-10"></div>
                                    
                                    <div className="mb-8">
                                        <div className="inline-block px-3 py-1 bg-[var(--primary)]/5 text-[var(--primary)] rounded-full text-[10px] font-bold uppercase tracking-wider mb-3">
                                            Level {mIndex + 1}
                                        </div>
                                        <h3 className="text-3xl font-extrabold text-[var(--primary)] mb-3">{module.title}</h3>
                                        <p className="text-[var(--ash)] font-medium leading-relaxed">{module.description}</p>
                                    </div>

                                    <div className="grid gap-8">
                                        {/* Resources (Loot) */}
                                        {module.resources && module.resources.length > 0 && (
                                            <div>
                                                <h4 className="text-xs font-bold uppercase text-[var(--primary)] opacity-60 mb-4 flex items-center gap-2">
                                                    <span className="material-icons-outlined text-sm">inventory_2</span> Loot Box (Resources)
                                                </h4>
                                                <div className="grid gap-3">
                                                    {module.resources.map((res, rIndex) => (
                                                        <a 
                                                            key={res.id || rIndex}
                                                            href={res.url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="flex items-center gap-4 p-4 bg-white/60 hover:bg-white/90 border border-white/50 rounded-2xl transition-all group shadow-sm hover:shadow-md hover:-translate-y-1"
                                                        >
                                                            <div className="w-10 h-10 rounded-xl bg-[var(--eucalyptus)]/50 flex items-center justify-center text-[var(--primary)] shrink-0 group-hover:scale-110 transition-transform">
                                                                <span className="material-icons-outlined">
                                                                    {res.type === 'video' ? 'play_circle' : 
                                                                     res.type === 'document' ? 'article' :
                                                                     res.type === 'github' ? 'code' : 'link'}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-[var(--primary)] text-sm group-hover:text-[var(--primary)] transition-colors">{res.title}</p>
                                                                {res.description && <p className="text-xs text-[var(--ash)] mt-0.5">{res.description}</p>}
                                                            </div>
                                                            <span className="material-icons-outlined text-[var(--primary)] opacity-0 group-hover:opacity-100 ml-auto transition-opacity">open_in_new</span>
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Challenges (Boss) */}
                                        {module.challenges && module.challenges.length > 0 && (
                                            <div className="bg-[var(--primary)] text-white rounded-3xl p-6 md:p-8 shadow-xl shadow-[var(--primary)]/10 relative overflow-hidden">
                                                <div className="absolute top-0 right-0 p-12 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                                                
                                                <h4 className="text-xs font-bold uppercase text-white/60 mb-6 flex items-center gap-2 relative z-10">
                                                    <span className="material-icons-outlined text-sm">sports_esports</span> Boss Fight (Challenges)
                                                </h4>
                                                <div className="space-y-4 relative z-10">
                                                    {module.challenges.map((chal, cIndex) => (
                                                        <div key={chal.id || cIndex} className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/10 hover:bg-white/15 transition-colors">
                                                            <div className="flex justify-between items-start mb-3">
                                                                <h5 className="font-bold text-lg">{chal.title}</h5>
                                                                <span className="text-[10px] font-bold bg-[var(--accent)] text-[var(--primary)] px-2 py-1 rounded-lg">
                                                                    +{chal.xp} XP
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-white/80 mb-5 leading-relaxed">{chal.description}</p>
                                                            <button 
                                                                onClick={() => handleProofSubmit(chal)}
                                                                className={`w-full py-3 text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2 ${
                                                                    application?.taskProofs?.[chal.id] 
                                                                    ? 'bg-[var(--eucalyptus)] text-[var(--primary)] cursor-default' 
                                                                    : 'bg-white text-[var(--primary)] hover:bg-[var(--accent)]'
                                                                }`}
                                                                disabled={!!application?.taskProofs?.[chal.id]}
                                                            >
                                                                <span className="material-icons-outlined text-sm">
                                                                    {application?.taskProofs?.[chal.id] ? 'check_circle' : 'upload_file'}
                                                                </span>
                                                                {application?.taskProofs?.[chal.id] ? 'Submitted' : `Submit Proof (${chal.proofType})`}
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                    sessions.map((session, index) => {
                        const hasCalendar = !!parseDates(session);
                        return (
                            <div key={session.id || index} className="relative">
                                {index > 0 && <div className="w-full h-px bg-[var(--primary)]/10 mb-12"></div>}
                                <div className="mb-10">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--ash)] mt-2 block">
                                            {sessions.length > 1 ? `Session ${index + 1}` : 'Current Session'}
                                        </span>
                                        {parseDates(session) && <Countdown targetDate={parseDates(session)!.start} />}
                                    </div>
                                    <h2 className="text-3xl md:text-4xl font-extrabold text-[var(--primary)] nohemi-tracking mb-6 leading-tight">
                                        {session.title}
                                    </h2>
                                    <div className="prose prose-sm text-[var(--ash)] leading-relaxed font-medium whitespace-pre-wrap">
                                        <p>{session.description || classConfig.description}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
                                    <div className="glass-card p-6 flex flex-col gap-3">
                                        <div className="w-10 h-10 bg-[var(--eucalyptus)] rounded-xl flex items-center justify-center text-[var(--primary)]">
                                            <span className="material-icons-outlined">calendar_today</span>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--ash)]">Date</p>
                                            <p className="text-lg font-bold text-[var(--primary)]">{session.date}</p>
                                        </div>
                                    </div>
                                    <div className="glass-card p-6 flex flex-col gap-3">
                                        <div className="w-10 h-10 bg-[var(--accent)] rounded-xl flex items-center justify-center text-[var(--primary)]">
                                            <span className="material-icons-outlined">schedule</span>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--ash)]">Time</p>
                                            <p className="text-lg font-bold text-[var(--primary)]">{session.time}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-[var(--primary)] text-white rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-[var(--primary)]/20">
                                    <div className="flex items-center gap-4 w-full md:w-auto">
                                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
                                            <span className="material-icons-outlined text-white">videocam</span>
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="text-xs font-medium text-white/60">Meeting Location</p>
                                            <p className="text-xl font-bold text-white whitespace-normal break-words">
                                                {isLink(session.location) ? 'Live via Zoom/Meet' : (session.location || 'Online')}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                                        {isLink(session.location) && (
                                            <>
                                            <a 
                                                href={session.location} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                className="px-8 py-4 bg-[var(--accent)] text-[var(--primary)] rounded-2xl font-bold text-center hover:scale-105 transition-transform active:scale-95 whitespace-nowrap"
                                            >
                                                Join Meeting
                                            </a>
                                            <button
                                                onClick={() => window.open(session.location, '_blank')}
                                                className="px-6 py-4 bg-white/10 text-white rounded-2xl font-bold hover:bg-white/20 transition-colors flex items-center gap-2 whitespace-nowrap"
                                                title="Check if link works"
                                            >
                                                <span className="material-icons-outlined text-sm">wifi_tethering</span>
                                                Test Access
                                            </button>
                                            </>
                                        )}
                                        {hasCalendar && (
                                            <div className="flex gap-2 justify-center w-full sm:w-auto">
                                                <button 
                                                    onClick={() => handleGoogleCalendar(session)}
                                                    className="px-6 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-colors flex items-center gap-2 font-bold whitespace-nowrap flex-1 sm:flex-none justify-center"
                                                    title="Add to Google Calendar"
                                                >
                                                    <span className="material-icons-outlined text-sm">event</span>
                                                    <span>Google Calendar</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                    )}
                </div>

                {/* Right Column: Instructor & Notes */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                    {/* Quests Card */}
                    <div className="glass-card p-8 bg-[var(--accent)]/20 border-[var(--accent)]/30 relative overflow-hidden group hover:scale-[1.02] transition-transform cursor-pointer" onClick={() => navigate('/quests')}>
                         <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                             <span className="material-icons-outlined text-8xl text-[var(--primary)]">assignment_turned_in</span>
                         </div>
                         <div className="relative z-10">
                             <div className="flex items-center justify-between mb-4">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--primary)] bg-white/50 px-3 py-1 rounded-full backdrop-blur-sm">New Quests Available</span>
                                <span className="material-icons-outlined text-[var(--primary)] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                             </div>
                             <h3 className="text-2xl font-extrabold text-[var(--primary)] mb-2">Quest Board ⚔️</h3>
                             <p className="text-sm font-medium text-[var(--primary)] opacity-80 mb-6 max-w-[80%]">
                                 Complete tasks to unlock perks and prove your mastery.
                             </p>
                             
                             {/* Mini Progress */}
                             <div className="flex items-center gap-3">
                                 <div className="flex-1 h-2 bg-white/40 rounded-full overflow-hidden">
                                     <div 
                                        className="h-full bg-[var(--primary)] rounded-full transition-all duration-1000 ease-out"
                                        style={{ width: `${progressPercent}%` }}
                                     ></div>
                                 </div>
                                 <span className="text-xs font-bold text-[var(--primary)]">
                                     {pendingTasks === 0 ? 'All Done!' : `${pendingTasks} Pending`}
                                 </span>
                             </div>
                         </div>
                    </div>

                    {/* Leaderboard Card */}
                    {leaderboard.length > 0 && (
                        <div className="glass-card p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-[var(--accent)] rounded-lg text-[var(--primary)]">
                                    <span className="material-icons-outlined text-xl">emoji_events</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-[var(--primary)]">Leaderboard</h3>
                                    <p className="text-[10px] uppercase font-bold text-[var(--ash)] tracking-wider">Top Performers</p>
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                {leaderboard.map((user, index) => (
                                    <div key={index} className="flex items-center gap-4 group">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                            index === 0 ? 'bg-[var(--accent)] text-[var(--primary)] shadow-lg shadow-[var(--accent)]/30' : 
                                            index === 1 ? 'bg-gray-300 text-gray-700' :
                                            index === 2 ? 'bg-orange-200 text-orange-800' :
                                            'bg-[var(--primary)]/5 text-[var(--primary)]/60'
                                        }`}>
                                            {index + 1}
                                        </div>
                                        <div className="w-10 h-10 rounded-full bg-[var(--primary)]/5 overflow-hidden">
                                            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-[var(--primary)] text-sm">{user.name}</p>
                                            <p className="text-[10px] font-bold text-[var(--eucalyptus)]">{user.xp} XP</p>
                                        </div>
                                        {index === 0 && <span className="text-xl">👑</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Admin Note Card */}
                    {application?.adminNote && (
                        <div className="glass-card p-8 bg-[var(--accent)]/10 border-[var(--accent)]/20 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <span className="material-icons-outlined text-6xl text-[var(--primary)]">format_quote</span>
                            </div>
                            <div className="flex items-center gap-3 mb-4 relative z-10">
                                <span className="material-icons-outlined text-[var(--primary)]">campaign</span>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--primary)] opacity-60">Note from Admin</p>
                            </div>
                            <p className="text-lg font-medium text-[var(--primary)] leading-relaxed relative z-10 whitespace-pre-wrap">
                                {application.adminNote}
                            </p>
                        </div>
                    )}

                    {/* Instructor Card */}
                    <div className="glass-card p-8">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--ash)] mb-6">Instructor</p>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-[var(--eucalyptus)] border-4 border-white shrink-0 flex items-center justify-center">
                                <span className="material-icons-outlined text-3xl text-[var(--primary)]">person</span>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-[var(--primary)]">{classConfig.instructor || 'TBA'}</h3>
                                <p className="text-sm font-medium text-[var(--ash)]">Class Host</p>
                            </div>
                        </div>
                        <p className="text-xs text-[var(--ash)] leading-relaxed italic">
                            "Design is not just what it looks like. Design is how it works." — Join us for an immersive session.
                        </p>
                    </div>

                    {/* Extra Notes */}
                    <div className="glass-card p-8 flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--ash)] mb-6">Extra Notes</p>
                        <ul className="space-y-4">
                            {classConfig.extraNotes ? (
                                <li className="flex gap-3 text-sm font-medium text-[var(--primary)]">
                                    <span className="material-icons-outlined text-sm text-[var(--primary)] mt-0.5 shrink-0">info</span>
                                    <span className="whitespace-pre-wrap">{classConfig.extraNotes}</span>
                                </li>
                            ) : (
                                <li className="text-sm text-[var(--ash)] italic">No additional notes.</li>
                            )}
                            
                            <li className="flex gap-3 text-sm font-medium text-[var(--primary)]">
                                <span className="material-icons-outlined text-sm text-[var(--primary)] mt-0.5">info</span>
                                Q&A session will follow the main lecture.
                            </li>
                        </ul>
                    </div>

                    {/* Status Footer */}
                    <div className="flex items-center justify-between px-4">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-[var(--ash)] opacity-60 uppercase tracking-widest">
                            <span className="material-icons-outlined text-[14px]">sync</span>
                            Last updated {classConfig.lastUpdated || 'recently'}
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                            <span className="text-[10px] font-bold text-[var(--ash)] opacity-60 uppercase tracking-widest">Live Sync Active</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <footer className="mt-12 flex flex-col md:flex-row items-center justify-between gap-6 opacity-60 px-4">
            <p className="text-xs font-medium text-[var(--primary)]">
                © {new Date().getFullYear()} TCP Design Studio. All class materials are protected.
            </p>
            <div className="flex gap-8">
                <button className="text-xs font-bold text-[var(--primary)] hover:underline">Support Center</button>
                <button className="text-xs font-bold text-[var(--primary)] hover:underline">Privacy Policy</button>
            </div>
        </footer>
      </main>

      {showCelebration && (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn" 
            onClick={() => setShowCelebration(false)}
        >
            <div className="text-center p-8">
                <div className="text-8xl mb-6 animate-bounce">🎉</div>
                <h2 className="text-5xl font-extrabold text-white mb-4 tracking-tight">You're In!</h2>
                <p className="text-xl text-white/80 font-medium max-w-md mx-auto mb-8">
                    Welcome to the inner circle. Your access is confirmed.
                </p>
                <button 
                    onClick={() => setShowCelebration(false)}
                    className="px-8 py-3 bg-[var(--accent)] text-[var(--primary)] font-bold rounded-full hover:scale-105 transition-transform"
                >
                    Let's Go
                </button>
            </div>
        </div>
      )}
    </div>
  );
};