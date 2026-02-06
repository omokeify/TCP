import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button';
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

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/admin/applications')} className="p-2 rounded-full bg-chalk dark:bg-white/10 hover:bg-chalk/50 text-primary dark:text-chalk transition-colors">
            <span className="material-icons-outlined">arrow_back</span>
        </button>
        <h1 className="text-2xl font-bold text-primary dark:text-white">Review Application</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         {/* Main Content */}
         <div className="md:col-span-2 space-y-6">
            <div className="bg-white dark:bg-white/5 p-8 rounded-2xl border border-chalk dark:border-white/10 shadow-sm">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-3xl font-bold text-primary dark:text-white">{app.fullName}</h2>
                        <p className="text-ash dark:text-chalk/60">{app.email}</p>
                    </div>
                    <span className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wide
                        ${app.status === ApplicationStatus.APPROVED ? 'bg-green-100 text-green-800' : 
                          app.status === ApplicationStatus.REJECTED ? 'bg-red-100 text-red-800' : 
                          'bg-yellow-100 text-yellow-800'}`}>
                        {app.status}
                    </span>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="text-xs font-bold text-ash/50 dark:text-chalk/40 uppercase mb-2 block">Why they want to join</label>
                        <p className="text-primary dark:text-chalk whitespace-pre-wrap leading-relaxed bg-chalk/20 dark:bg-white/5 p-4 rounded-xl">
                            {app.whyJoin}
                        </p>
                    </div>

                    <div className="border-t border-chalk dark:border-white/10 pt-6">
                        <h3 className="font-bold text-primary dark:text-white mb-4">Task Proofs</h3>
                        <div className="grid gap-4">
                            {classConfig?.tasks.filter(t => t.requiresProof).map(task => {
                                const proof = app.taskProofs?.[task.id];
                                
                                let content;
                                if (!proof) {
                                    content = <span className="text-xs text-ash/40 italic">Not provided</span>;
                                } else if (task.proofType === 'image' || proof.startsWith('data:image')) {
                                    content = (
                                        <div className="mt-2">
                                            <img src={proof} alt="Proof" className="max-w-full h-auto max-h-64 rounded-lg border border-chalk dark:border-white/20" />
                                            {proof.startsWith('http') && (
                                                <a href={proof} target="_blank" rel="noreferrer" className="block mt-1 text-xs text-primary dark:text-accent hover:underline">View Full Size</a>
                                            )}
                                        </div>
                                    );
                                } else if (task.proofType === 'link' || proof.startsWith('http')) {
                                    content = (
                                        <a href={proof} target="_blank" rel="noreferrer" className="text-sm font-bold text-primary dark:text-accent hover:underline break-all">
                                            {proof} <span className="material-icons-outlined text-xs align-middle">open_in_new</span>
                                        </a>
                                    );
                                } else {
                                    content = <span className="text-sm font-bold text-primary dark:text-white break-all">{proof}</span>;
                                }

                                return (
                                    <div key={task.id} className="p-3 rounded-lg bg-chalk/30 dark:bg-white/5 border border-chalk dark:border-white/5">
                                        <span className="block text-sm font-medium text-ash dark:text-chalk/80 mb-1">{task.proofLabel || task.description}</span>
                                        {content}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
         </div>

         {/* Sidebar Actions */}
         <div className="space-y-6">
             {app.status === ApplicationStatus.PENDING && (
                <div className="bg-white dark:bg-white/5 p-6 rounded-2xl border border-chalk dark:border-white/10 shadow-sm">
                    <h3 className="font-bold text-primary dark:text-white mb-4">Actions</h3>
                    <div className="space-y-3">
                        <Button 
                            variant="secondary" 
                            className="w-full justify-center"
                            onClick={() => handleAction(ApplicationStatus.APPROVED)}
                            isLoading={processing}
                        >
                            Approve & Send Code
                        </Button>
                        <Button 
                            variant="danger" 
                            className="w-full justify-center bg-transparent border-2 border-red-500 text-red-500 hover:bg-red-50"
                            onClick={() => handleAction(ApplicationStatus.REJECTED)}
                            isLoading={processing}
                        >
                            Reject Application
                        </Button>
                    </div>
                </div>
             )}

            {(app.status === ApplicationStatus.APPROVED || generatedCode) && (
                <div className="bg-accent/10 border border-accent p-6 rounded-2xl">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="material-icons-outlined text-green-600">check_circle</span>
                        <h3 className="font-bold text-primary dark:text-accent">Access Granted</h3>
                    </div>
                    <div className="mt-4 p-4 bg-white/50 dark:bg-black/20 rounded-xl text-center">
                        <p className="text-xs text-ash dark:text-chalk/60 uppercase font-bold mb-1">Invite Code</p>
                        <p className="font-mono text-xl tracking-widest text-primary dark:text-white font-bold">
                            {generatedCode || existingCode?.code}
                        </p>
                        <p className="text-xs text-ash dark:text-chalk/60 mt-2">Sent to {app.email}</p>
                    </div>
                </div>
            )}
         </div>
      </div>
    </div>
  );
};