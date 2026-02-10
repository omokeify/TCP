import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { MockService } from '../services/mockDb';
import { ClassConfig, DEFAULT_CLASS_INFO, Application, QuestSet } from '../types';
import { GlassCard } from '../components/GlassCard';
import { Button } from '../components/Button';

export const QuestDetail: React.FC = () => {
  const navigate = useNavigate();
  const { questSetId } = useParams<{ questSetId: string }>();
  const [searchParams] = useSearchParams();
  const [classConfig, setClassConfig] = useState<ClassConfig | null>(null);
  const [questSet, setQuestSet] = useState<QuestSet | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [proofs, setProofs] = useState<Record<string, string>>({});
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Application Form State
  const [formData, setFormData] = useState({
      fullName: '',
      email: '',
      whyJoin: ''
  });

  useEffect(() => {
    const loadData = async () => {
        // Load Config
        const config = await MockService.getClassConfig();
        const mergedConfig = { ...DEFAULT_CLASS_INFO, ...config };
        setClassConfig(mergedConfig);

        // Find Quest Set
        if (mergedConfig.questSets && questSetId) {
            const foundQuest = mergedConfig.questSets.find(q => q.id === questSetId);
            if (foundQuest) {
                setQuestSet(foundQuest);
            } else {
                console.error("Quest Set not found");
            }
        }
    };
    loadData();
  }, [questSetId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleProofChange = (taskId: string, value: string) => {
      setProofs(prev => ({ ...prev, [taskId]: value }));
  };

  const handleFileChange = (taskId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5000000) { // 5MB limit
         alert("File is too large. Please upload an image under 5MB.");
         return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
         handleProofChange(taskId, reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

    // Combine Global Tasks and Quest Tasks (Deduplicated)
    const combinedTasks = React.useMemo(() => {
        if (!classConfig || !questSet) return [];
        
        const allTasks = [...(classConfig.tasks || []), ...(questSet.tasks || [])];
        const uniqueTasks = new Map();

        allTasks.forEach(task => {
            // Exclude t2 (Why Join) as it is hardcoded in form
            if (task.id === 't2' || !task.requiresProof) return; 
            uniqueTasks.set(task.id, task);
        });

        return Array.from(uniqueTasks.values());
    }, [classConfig, questSet]);

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      setIsSubmitting(true);
      try {
          const referrerId = searchParams.get('ref') || undefined;
          await MockService.submitApplication({
              fullName: formData.fullName,
              email: formData.email,
              whyJoin: formData.whyJoin,
              taskProofs: proofs,
              referrerId,
              adminNote: `Applied via Quest: ${questSet?.title} (${questSet?.id})`
          });
          setIsSuccess(true);
      } catch (e) {
          alert("Failed to submit application: " + (e as Error).message);
      } finally {
          setIsSubmitting(false);
      }
  };

  if (!classConfig || !questSet) {
      return (
          <div className="min-h-screen flex items-center justify-center text-[#3B472F]">
              <div className="animate-pulse flex flex-col items-center">
                  <div className="h-12 w-12 bg-[#3B472F]/20 rounded-full mb-4"></div>
                  <div className="h-4 w-32 bg-[#3B472F]/20 rounded"></div>
              </div>
          </div>
      );
  }

  if (!classConfig.acceptingApplications) {
    return (
        <div className="min-h-screen w-full font-sans text-[#3B472F] relative overflow-x-hidden flex items-center justify-center p-6">
             <style>{`
                :root { --primary: #3B472F; --accent: #FFFA7E; --eucalyptus: #CEE2C0; --chalk: #EDEDE1; --ash: #686868; }
                .liquid-bg {
                    background: radial-gradient(circle at 0% 0%, #FFFA7E 0%, transparent 40%),
                                radial-gradient(circle at 100% 100%, #CEE2C0 0%, transparent 40%),
                                radial-gradient(circle at 50% 50%, #EDEDE1 0%, #FFFFFF 100%);
                    position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: -1;
                }
            `}</style>
            <div className="liquid-bg"></div>
            <GlassCard className="max-w-lg w-full text-center py-12 px-8">
                <div className="w-20 h-20 bg-[#3B472F]/5 rounded-full flex items-center justify-center mx-auto mb-6 text-[#3B472F]">
                    <span className="material-icons-outlined text-4xl">lock</span>
                </div>
                <h2 className="text-3xl font-bold mb-4">Applications Closed</h2>
                <p className="text-[#686868] mb-8 text-lg">
                    This quest is currently not accepting new applications.
                </p>
                <Button onClick={() => navigate('/quests')}>
                    Back to Quests
                </Button>
            </GlassCard>
        </div>
    );
  }

  if (isSuccess) {
      return (
        <div className="min-h-screen w-full font-sans text-[#3B472F] relative overflow-x-hidden flex items-center justify-center p-6">
            <style>{`
                :root { --primary: #3B472F; --accent: #FFFA7E; --eucalyptus: #CEE2C0; --chalk: #EDEDE1; --ash: #686868; }
                .liquid-bg {
                    background: radial-gradient(circle at 0% 0%, #FFFA7E 0%, transparent 40%),
                                radial-gradient(circle at 100% 100%, #CEE2C0 0%, transparent 40%),
                                radial-gradient(circle at 50% 50%, #EDEDE1 0%, #FFFFFF 100%);
                    position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: -1;
                }
            `}</style>
            <div className="liquid-bg"></div>
            <GlassCard className="max-w-lg w-full text-center py-12 px-8">
                <div className="w-20 h-20 bg-[#3B472F] rounded-full flex items-center justify-center mx-auto mb-6 text-[#FFFA7E]">
                    <span className="material-icons-outlined text-4xl">check</span>
                </div>
                <h2 className="text-3xl font-bold mb-4">Application Received</h2>
                <p className="text-[#686868] mb-8 text-lg">
                    Your application for <span className="font-bold text-[#3B472F]">{questSet.title}</span> has been submitted.
                    <br/><br/>
                    Once approved, you will receive an access code via email to enter the Class Portal.
                </p>
                <Button onClick={() => navigate('/quests')}>
                    Return to Quests
                </Button>
            </GlassCard>
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

      <main className="max-w-6xl mx-auto px-6 pt-8 pb-20">
        <button 
            onClick={() => navigate('/quests')}
            className="mb-8 flex items-center gap-2 text-sm font-bold text-[var(--ash)] hover:text-[var(--primary)] transition-colors"
        >
            <span className="material-icons-outlined text-sm">arrow_back</span>
            Back to Quests
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 w-full">
            {/* Info Column */}
            <div className="space-y-6 flex flex-col order-1 lg:order-none">
                <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 bg-[var(--accent)] text-[var(--primary)] text-[10px] font-black uppercase tracking-widest rounded-full">{questSet.category}</span>
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--ash)]">{questSet.level}</span>
                </div>
                
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-[var(--primary)] nohemi-tracking leading-tight">
                    {questSet.title}
                </h1>
                
                <p className="text-lg text-[var(--ash)] max-w-md leading-relaxed font-medium">
                    {questSet.description}
                </p>

                <div className="bg-[#FFFA7E]/50 backdrop-blur-sm p-6 rounded-2xl border border-[#FFFA7E] mt-6">
                    <h3 className="font-bold text-[var(--primary)] mb-3 uppercase tracking-wider text-sm">Required Tasks</h3>
                    <ul className="space-y-3">
                        {questSet.tasks.map((task, i) => (
                            <li key={i} className="flex items-start gap-3 text-[var(--primary)]">
                                <span className="bg-[var(--primary)] text-[#FFFA7E] w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold mt-1 shrink-0">{i + 1}</span>
                                <div className="flex flex-col">
                                    {task.link ? (
                                        <a href={task.link} target="_blank" rel="noreferrer" className="text-sm font-medium hover:underline flex items-center gap-1 group">
                                            {task.description}
                                            <span className="material-icons-outlined text-xs opacity-50 group-hover:opacity-100 transition-opacity">open_in_new</span>
                                        </a>
                                    ) : (
                                        <span className="text-sm font-medium">{task.description}</span>
                                    )}
                                    <span className="text-xs text-[var(--ash)]/80 mt-1">
                                        (Proof: {task.proofLabel || task.proofType})
                                    </span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Form Column */}
            <div className="order-2 lg:order-none">
                <GlassCard className="w-full">
                    <h2 className="text-2xl font-bold text-[var(--primary)] mb-6">Submit Application</h2>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Personal Info Fields */}
                        <div className="space-y-4 mb-8 pb-8 border-b border-[var(--primary)]/10">
                             <div>
                                <label className="block text-sm font-bold text-[var(--primary)] mb-1">
                                    {questSet.customFields?.nameLabel || classConfig.nameLabel || "Full Name"}
                                </label>
                                <input
                                    required
                                    type="text"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 rounded-xl bg-white/50 border border-transparent focus:border-[var(--primary)] focus:bg-white focus:ring-0 transition-all outline-none text-[var(--primary)]"
                                    placeholder="Enter your full name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-[var(--primary)] mb-1">
                                    {questSet.customFields?.emailLabel || classConfig.emailLabel || "Email Address"}
                                </label>
                                <input
                                    required
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 rounded-xl bg-white/50 border border-transparent focus:border-[var(--primary)] focus:bg-white focus:ring-0 transition-all outline-none text-[var(--primary)]"
                                    placeholder="Enter your email"
                                />
                            </div>
                             <div>
                                <label className="block text-sm font-bold text-[var(--primary)] mb-1">
                                    {questSet.customFields?.whyJoinLabel || classConfig.whyJoinLabel || "Why do you want to join?"}
                                </label>
                                <textarea
                                    required
                                    name="whyJoin"
                                    value={formData.whyJoin}
                                    onChange={handleInputChange}
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-xl bg-white/50 border border-transparent focus:border-[var(--primary)] focus:bg-white focus:ring-0 transition-all outline-none text-[var(--primary)] resize-none"
                                    placeholder="Tell us about your motivation..."
                                />
                            </div>
                        </div>

                        {combinedTasks.map((task) => (
                            <div key={task.id}>
                                <div className="mb-2">
                                    <label className="block text-sm font-bold text-[var(--primary)]">
                                        {task.proofLabel || task.description}
                                    </label>
                                    {task.link && (
                                        <a 
                                            href={task.link} 
                                            target="_blank" 
                                            rel="noreferrer" 
                                            className="text-xs text-[var(--primary)] opacity-80 hover:opacity-100 hover:underline flex items-center gap-1 mt-0.5 w-fit"
                                        >
                                            <span className="material-icons-outlined text-[14px]">link</span>
                                            Open Link for Task
                                        </a>
                                    )}
                                </div>

                                {task.proofType === 'image' ? (
                                    <div className="space-y-2">
                                        <input 
                                            required={!proofs[task.id]} // Required only if not already filled
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleFileChange(task.id, e)}
                                            className="w-full block text-sm text-[var(--ash)] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[var(--primary)] file:text-white hover:file:bg-[#2A3322] cursor-pointer"
                                        />
                                        {proofs[task.id] && (
                                            <div className="relative inline-block mt-2">
                                                <img src={proofs[task.id]} alt="Preview" className="h-20 w-auto rounded-lg border border-[var(--primary)]/20" />
                                                <button 
                                                    type="button" 
                                                    onClick={() => handleProofChange(task.id, '')}
                                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-sm hover:bg-red-600 transition-colors"
                                                >
                                                    <span className="material-icons-outlined text-xs block">close</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ) : task.proofType === 'yes_no' ? (
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input 
                                                type="radio"
                                                name={`proof-${task.id}`}
                                                value="yes"
                                                checked={proofs[task.id] === 'yes'}
                                                onChange={(e) => handleProofChange(task.id, e.target.value)}
                                                className="w-4 h-4 text-[var(--primary)] focus:ring-[var(--primary)] border-gray-300"
                                            />
                                            <span className="text-sm font-medium text-[var(--primary)]">Yes</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input 
                                                type="radio"
                                                name={`proof-${task.id}`}
                                                value="no"
                                                checked={proofs[task.id] === 'no'}
                                                onChange={(e) => handleProofChange(task.id, e.target.value)}
                                                className="w-4 h-4 text-[var(--primary)] focus:ring-[var(--primary)] border-gray-300"
                                            />
                                            <span className="text-sm font-medium text-[var(--primary)]">No</span>
                                        </label>
                                    </div>
                                ) : (
                                    <input 
                                        required={!proofs[task.id]}
                                        type={task.proofType === 'link' ? 'url' : 'text'} 
                                        className="w-full px-4 py-3 rounded-xl bg-white/50 border border-transparent focus:border-[var(--primary)] focus:bg-white focus:ring-0 transition-all outline-none text-[var(--primary)]"
                                        placeholder={task.proofType === 'link' ? 'https://...' : task.proofType === 'username' ? '@username' : 'Answer here'}
                                        value={proofs[task.id] || ''}
                                        onChange={(e) => handleProofChange(task.id, e.target.value)}
                                    />
                                )}
                            </div>
                        ))}

                        <Button type="submit" isLoading={isSubmitting} className="w-full mt-4">
                            Submit Quest
                        </Button>
                        
                        <p className="text-xs text-center text-[var(--ash)] mt-4">
                            Submissions are reviewed by your tutor.
                        </p>
                    </form>
                </GlassCard>
            </div>
        </div>
      </main>
    </div>
  );
};
