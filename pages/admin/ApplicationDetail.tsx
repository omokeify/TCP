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
      <div className="relative overflow-hidden rounded-3xl p-8 md:p-12 bg-white dark:bg-white/5 border border-primary/5 dark:border-white/10 shadow-2xl backdrop-blur-2xl">
        
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
                        {classConfig?.tasks.filter(t => t.requiresProof).map(task => {
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