import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MockService } from '../services/mockDb';
import { ClassConfig, DEFAULT_CLASS_INFO, Application } from '../types';

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

  useEffect(() => {
    const hasAccess = sessionStorage.getItem('blink_class_access');
    const code = sessionStorage.getItem('blink_user_code');
    
    if (!hasAccess) {
      navigate('/access');
      return;
    }
    
    if (code) setUserCode(code);

    const loadConfig = async () => {
        const config = await MockService.getClassConfig();
        const mergedConfig = { ...DEFAULT_CLASS_INFO, ...config };
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
             } catch (e) { console.error("Failed to load application details", e); }
        }
    };
    loadConfig();
  }, [navigate]);

  const generateReferralLink = () => {
    if (!userCode) return '';
    // Construct absolute URL
    const baseUrl = window.location.href.split('#')[0];
    return `${baseUrl}#/apply?ref=${userCode}`;
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

  const handleDownloadIcs = (session: { title: string, description?: string, instructor?: string, location?: string, date: string, time: string }) => {
     const dates = parseDates(session);
     if (!dates) {
         alert("Could not generate calendar file. Date format may be invalid.");
         return;
     }

     const formatDate = (date: Date) => date.toISOString().replace(/-|:|\.\d+/g, "");

     const icsContent = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//TCP//Blink Class//EN",
        "BEGIN:VEVENT",
        `UID:${Date.now()}@tcp.studio`,
        `DTSTAMP:${formatDate(new Date())}`,
        `DTSTART:${formatDate(dates.start)}`,
        `DTEND:${formatDate(dates.end)}`,
        `SUMMARY:${session.title}`,
        `DESCRIPTION:${(session.description || classConfig?.description || "").replace(/\n/g, "\\n")}\\n\\nInstructor: ${session.instructor}`,
        `LOCATION:${session.location}`,
        "END:VEVENT",
        "END:VCALENDAR"
     ].join("\r\n");

     const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
     const link = document.createElement('a');
     link.href = window.URL.createObjectURL(blob);
     link.setAttribute('download', 'class_schedule.ics');
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
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
            </div>
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
                {/* Left Column: Sessions List */}
                <div className="lg:col-span-7 space-y-12">
                    {sessions.map((session, index) => {
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
                                            <p className="text-xl font-bold text-white truncate">
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
                                            <div className="flex gap-2 justify-center">
                                                <button 
                                                    onClick={() => handleDownloadIcs(session)}
                                                    className="p-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-colors"
                                                    title="Download .ics"
                                                >
                                                    <span className="material-icons-outlined">download</span>
                                                </button>
                                                <button 
                                                    onClick={() => handleGoogleCalendar(session)}
                                                    className="p-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-colors"
                                                    title="Add to Google Calendar"
                                                >
                                                    <span className="material-icons-outlined">event</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Right Column: Instructor & Notes */}
                <div className="lg:col-span-5 flex flex-col gap-6">
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
                © {new Date().getFullYear()} Blink Design Studio. All class materials are protected.
            </p>
            <div className="flex gap-8">
                <button className="text-xs font-bold text-[var(--primary)] hover:underline">Support Center</button>
                <button className="text-xs font-bold text-[var(--primary)] hover:underline">Privacy Policy</button>
            </div>
        </footer>
      </main>
    </div>
  );
};