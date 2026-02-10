import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MockService } from '../../services/mockDb';
import { Application, ApplicationStatus, InviteCode, ClassConfig } from '../../types';

export const ApplicationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [app, setApp] = useState<Application | null>(null);
  const [classConfig, setClassConfig] = useState<ClassConfig | null>(null);
  const [existingCode, setExistingCode] = useState<InviteCode | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);

  useEffect(() => {
    if (!MockService.isAdminAuthenticated()) {
      navigate('/admin/login');
      return;
    }
    const load = async () => {
      if (!id) return;
      const [appData, configData] = await Promise.all([
          MockService.getApplicationById(id),
          MockService.getClassConfig()
      ]);
      
      setClassConfig(configData);

      if (appData) {
        setApp(appData);
        setAdminNote(appData.adminNote || '');
        if (appData.status === ApplicationStatus.APPROVED) {
          const codes = await MockService.getCodes();
          const code = codes.find(c => c.applicationId === appData.id);
          if (code) setExistingCode(code);
        }
      }
      setLoading(false);
    };
    load();
  }, [id, navigate]);

  const handleSaveNote = async () => {
      if (!app) return;
      setProcessing(true);
      try {
          await MockService.updateApplication(app.id, { adminNote });
          setApp(prev => prev ? ({ ...prev, adminNote }) : null);
          alert("Note saved!");
      } catch (e) {
          alert("Failed to save note");
      } finally {
          setProcessing(false);
      }
  };

  const handleSendEmail = async () => {
    if (!app || !emailSubject || !emailBody) return;
    setProcessing(true);
    try {
        const res = await MockService.sendEmail(app.email, emailSubject, emailBody.replace(/\n/g, '<br>'));
        if (res.success) {
            alert("Email sent successfully!");
            setShowEmailForm(false);
            setEmailSubject('');
            setEmailBody('');
        } else {
            alert("Failed to send email: " + res.message);
        }
    } catch (e) {
        alert("Error sending email");
    } finally {
        setProcessing(false);
    }
  };

  const handleAction = async (status: ApplicationStatus) => {
    if (!app) return;
    setProcessing(true);
    
    try {
      await MockService.updateApplicationStatus(app.id, status);
      
      if (status === ApplicationStatus.APPROVED) {
        const newCode = await MockService.generateCode(app.id, app.email);
        setGeneratedCode(newCode.code);
        setApp(prev => prev ? ({ ...prev, status }) : null);
        alert(`Application Approved!\n\nEmail sent to ${app.email} with code: ${newCode.code}`);
      } else {
        navigate('/admin/applications');
      }
    } catch (e) {
      alert("Error updating status");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="p-8 text-primary">Loading application...</div>;
  if (!app) return <div className="p-8 text-primary">Application not found</div>;

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • ${date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto pb-20">
      {/* Header */}
      <header className="flex items-center gap-4 mb-10">
        <button 
            onClick={() => navigate('/admin/applications')}
            className="w-10 h-10 rounded-full bg-white dark:bg-white/10 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/20 transition-all group shadow-sm border border-chalk dark:border-white/5"
        >
            <span className="material-icons-outlined text-primary dark:text-white group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
        </button>
        <div>
            <h1 className="text-3xl font-bold text-primary dark:text-accent">Review Applicant Details</h1>
            <p className="text-ash dark:text-chalk/60 mt-1">Application ID: #{app.id}</p>
        </div>
      </header>

      {/* Main Liquid Card */}
      <div className="relative rounded-3xl p-8 md:p-12 bg-white dark:bg-white/5 border border-primary/5 dark:border-white/10 shadow-2xl backdrop-blur-2xl">
        
        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
            <div className="space-y-8">
                <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-primary/60 dark:text-accent/60 block mb-2">Full Name</label>
                    <p className="text-xl font-medium text-primary dark:text-chalk">{app.fullName}</p>
                </div>
                <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-primary/60 dark:text-accent/60 block mb-2">Email Address</label>
                    <p className="text-xl font-medium text-primary dark:text-chalk">{app.email}</p>
                </div>
                <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-primary/60 dark:text-accent/60 block mb-2">Submission Time</label>
                    <div className="flex items-center gap-2 text-primary dark:text-chalk">
                        <span className="material-icons-outlined text-sm">calendar_today</span>
                        <p className="text-lg">{formatDate(app.submittedAt)}</p>
                    </div>
                </div>
            </div>

            {/* Status Panel */}
            <div className="bg-chalk/30 dark:bg-white/5 rounded-2xl p-6 border border-primary/5 dark:border-white/10 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm text-ash dark:text-chalk/60">Current Status</p>
                        <span className={`inline-flex items-center gap-2 mt-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide
                            ${app.status === ApplicationStatus.APPROVED ? 'bg-green-100 text-green-800 dark:bg-eucalyptus dark:text-primary' : 
                              app.status === ApplicationStatus.REJECTED ? 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300' : 
                              'bg-accent text-primary'}`}>
                            <span className={`w-2 h-2 rounded-full ${app.status === ApplicationStatus.PENDING ? 'bg-primary animate-pulse' : 'bg-current'}`}></span>
                            {app.status === ApplicationStatus.PENDING ? 'Pending Review' : app.status}
                        </span>
                    </div>
                    {(generatedCode || existingCode) && (
                         <div className="text-right">
                            <p className="text-sm text-ash dark:text-chalk/60">Invite Code</p>
                            <p className="text-xl font-mono font-bold text-primary dark:text-eucalyptus tracking-wider">{generatedCode || existingCode?.code}</p>
                        </div>
                    )}
                </div>
                <div className="mt-8 pt-6 border-t border-primary/5 dark:border-white/10">
                    <p className="text-xs italic text-ash/60 dark:text-chalk/40">
                         {app.status === ApplicationStatus.APPROVED 
                            ? `Approved on ${existingCode?.generatedAt ? new Date(existingCode.generatedAt).toLocaleDateString() : 'Unknown'}` 
                            : "Waiting for admin action."}
                    </p>
                </div>
            </div>
        </div>

        {/* Task Proofs Section */}
        <div className="space-y-8 border-t border-primary/5 dark:border-white/10 pt-12">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded bg-accent/20 flex items-center justify-center text-primary dark:text-accent">
                    <span className="material-icons-outlined text-sm">assignment</span>
                </div>
                <h2 className="text-2xl font-bold text-primary dark:text-chalk">Task Proofs & details</h2>
            </div>

            <div className="space-y-6">
                {/* Why Join - Text Response */}
                <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-primary/60 dark:text-accent/60 block mb-3">Response: Why do you want to join?</label>
                    <div className="bg-chalk/30 dark:bg-black/20 rounded-xl p-6 text-primary/80 dark:text-chalk/80 leading-relaxed border border-primary/5 dark:border-white/5 whitespace-pre-wrap">
                        {app.whyJoin}
                    </div>
                </div>

                {/* File/Link Assets */}
                <div>
                     <label className="text-xs font-bold uppercase tracking-widest text-primary/60 dark:text-accent/60 block mb-3">Submitted Assets & Links</label>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {(classConfig?.tasks || []).filter(t => t.requiresProof).map(task => {
                             const proof = app.taskProofs?.[task.id];
                             if (!proof) return null;

                             const isImage = task.proofType === 'image' || proof.startsWith('data:image');
                             const isLink = task.proofType === 'link' || proof.startsWith('http');

                             return (
                                <a 
                                    key={task.id}
                                    href={isLink ? proof : '#'}
                                    target={isLink ? "_blank" : undefined}
                                    rel="noreferrer"
                                    onClick={(e) => { if(!isLink && !isImage) e.preventDefault(); }}
                                    className="flex items-center gap-4 p-4 rounded-xl bg-chalk/30 dark:bg-white/5 border border-primary/5 dark:border-white/10 hover:bg-chalk/50 dark:hover:bg-white/10 transition-all group"
                                >
                                    <div className="w-12 h-12 rounded-lg bg-primary/10 dark:bg-primary flex items-center justify-center text-primary dark:text-accent shrink-0">
                                        <span className="material-icons-outlined">{isImage ? 'image' : isLink ? 'link' : 'text_fields'}</span>
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="font-bold text-sm text-primary dark:text-chalk truncate">{task.proofLabel || task.description}</p>
                                        <p className="text-xs text-ash/60 dark:text-chalk/40 truncate">
                                            {isImage ? 'Image Asset' : isLink ? proof : proof}
                                        </p>
                                        {isImage && (
                                            <div className="mt-2 h-20 rounded bg-white dark:bg-black/20 overflow-hidden relative border border-primary/5">
                                                <img src={proof} alt="proof" className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                    </div>
                                    {isLink && <span className="material-icons-outlined ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-primary dark:text-chalk">open_in_new</span>}
                                </a>
                             );
                        })}
                     </div>
                </div>
            </div>
        </div>

        {/* Admin Note Section */}
        <div className="space-y-4 border-t border-primary/5 dark:border-white/10 pt-12">
             <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded bg-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-300">
                    <span className="material-icons-outlined text-sm">sticky_note_2</span>
                </div>
                <h2 className="text-2xl font-bold text-primary dark:text-chalk">Admin Note</h2>
            </div>
            <p className="text-sm text-ash dark:text-chalk/60">This note will be visible to the applicant in their portal.</p>
            <div className="flex gap-4">
                <textarea 
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    className="w-full bg-chalk/30 dark:bg-white/5 border border-primary/10 dark:border-white/10 rounded-xl p-4 min-h-[100px] text-primary dark:text-chalk focus:outline-none focus:border-accent transition-colors"
                    placeholder="e.g. Welcome aboard! Please make sure to install Zoom before the class."
                />
            </div>
            <div className="flex justify-end">
                <button 
                    onClick={handleSaveNote}
                    disabled={processing}
                    className="px-6 py-2 bg-primary dark:bg-white text-white dark:text-primary rounded-lg font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                    Save Note
                </button>
            </div>
        </div>

        {/* Email User Section */}
        <div className="space-y-4 border-t border-primary/5 dark:border-white/10 pt-12">
             <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-300">
                    <span className="material-icons-outlined text-sm">email</span>
                </div>
                <h2 className="text-2xl font-bold text-primary dark:text-chalk">Send Email</h2>
            </div>
            
            {!showEmailForm ? (
                <button 
                    onClick={() => setShowEmailForm(true)}
                    className="px-6 py-3 bg-chalk dark:bg-white/5 border border-primary/10 dark:border-white/10 text-primary dark:text-chalk rounded-xl font-bold hover:bg-chalk/50 dark:hover:bg-white/10 transition-colors flex items-center gap-2"
                >
                    <span className="material-icons-outlined text-sm">edit</span>
                    Compose Message
                </button>
            ) : (
                <div className="bg-chalk/30 dark:bg-white/5 rounded-2xl p-6 border border-primary/5 dark:border-white/10 space-y-4">
                    <div>
                        <label className="text-xs font-bold uppercase tracking-widest text-primary/60 dark:text-accent/60 block mb-2">Subject</label>
                        <input 
                            type="text"
                            value={emailSubject}
                            onChange={(e) => setEmailSubject(e.target.value)}
                            className="w-full bg-white dark:bg-black/20 border border-primary/10 dark:border-white/10 rounded-lg p-3 text-primary dark:text-chalk focus:outline-none focus:border-accent"
                            placeholder="e.g. Important Update Regarding Class"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase tracking-widest text-primary/60 dark:text-accent/60 block mb-2">Message</label>
                        <textarea 
                            value={emailBody}
                            onChange={(e) => setEmailBody(e.target.value)}
                            className="w-full bg-white dark:bg-black/20 border border-primary/10 dark:border-white/10 rounded-lg p-3 min-h-[150px] text-primary dark:text-chalk focus:outline-none focus:border-accent"
                            placeholder="Type your message here..."
                        />
                    </div>
                    <div className="flex justify-end gap-3">
                        <button 
                            onClick={() => setShowEmailForm(false)}
                            className="px-4 py-2 text-ash dark:text-chalk/60 font-bold hover:text-primary dark:hover:text-chalk transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleSendEmail}
                            disabled={processing || !emailSubject || !emailBody}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            <span className="material-icons-outlined text-sm">send</span>
                            Send Email
                        </button>
                    </div>
                </div>
            )}
        </div>

        {/* Action Footer */}
        {app.status === ApplicationStatus.PENDING && (
            <div className="mt-16 pt-10 border-t border-primary/5 dark:border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-start gap-3">
                    <span className="material-icons-outlined text-primary dark:text-accent mt-0.5">info</span>
                    <p className="text-sm text-ash dark:text-chalk/60 max-w-sm">
                        <span className="text-primary dark:text-accent font-semibold">Note:</span> Approving this applicant will auto-generate and email a unique invite code to <span className="font-medium text-primary dark:text-white">{app.email}</span>.
                    </p>
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <button 
                        onClick={() => handleAction(ApplicationStatus.REJECTED)}
                        disabled={processing}
                        className="flex-1 md:flex-none px-8 py-4 border-2 border-primary/10 dark:border-white/10 text-primary dark:text-white rounded-xl font-bold hover:bg-red-50 hover:border-red-200 dark:hover:bg-red-500/20 dark:hover:border-red-500/40 hover:text-red-600 dark:hover:text-red-100 transition-all flex items-center justify-center gap-2"
                    >
                        <span className="material-icons-outlined text-xl">close</span>
                        Reject
                    </button>
                    <button 
                        onClick={() => handleAction(ApplicationStatus.APPROVED)}
                        disabled={processing}
                        className="flex-1 md:flex-none px-12 py-4 bg-accent text-primary rounded-xl font-bold hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl shadow-accent/10 hover:bg-[#FDF050]"
                    >
                        <span className="material-icons-outlined text-xl">check_circle</span>
                        Approve Applicant
                    </button>
                </div>
            </div>
        )}
      </div>

      <footer className="mt-12 mb-8 text-center text-ash/40 dark:text-chalk/40 text-xs tracking-widest uppercase">
        Blink Admin Platform © {new Date().getFullYear()} | Secure Environment
      </footer>
    </div>
  );
};