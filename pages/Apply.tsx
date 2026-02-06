import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { GlassCard } from '../components/GlassCard';
import { Button } from '../components/Button';
import { DEFAULT_CLASS_INFO, ClassConfig, TaskConfig } from '../types';
import { MockService } from '../services/mockDb';

export const Apply: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [classInfo, setClassInfo] = useState<ClassConfig>(DEFAULT_CLASS_INFO);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    twitterHandle: '', 
    whyJoin: ''
  });
  const [taskProofs, setTaskProofs] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const config = await MockService.getClassConfig();
        setClassInfo(config);
      } catch (e) {
        console.error("Failed to load class config", e);
      }
    };
    fetchConfig();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleProofChange = (taskId: string, value: string) => {
    setTaskProofs(prev => ({ ...prev, [taskId]: value }));
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
         // This is a Data URL (base64)
         handleProofChange(taskId, reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Get referral ID from URL
    const referrerId = searchParams.get('ref') || undefined;

    try {
      await MockService.submitApplication({
        ...formData,
        taskProofs,
        referrerId
      });
      navigate('/status');
    } catch (error) {
      console.error("Submission failed", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // If applications are closed (or default false), show the "Closed" view
  if (!classInfo.acceptingApplications) {
    return (
        <div className="flex flex-col items-center justify-center text-center max-w-3xl mx-auto space-y-8 py-10">
             <h1 className="text-5xl lg:text-7xl font-bold text-[#3B472F] leading-tight">
                {classInfo.title}
             </h1>
             <p className="text-xl text-[#686868] max-w-2xl leading-relaxed whitespace-pre-wrap">
                {classInfo.description}
             </p>
             
             <div className="mt-8 p-6 bg-[#3B472F]/5 rounded-2xl border border-[#3B472F]/10">
                 <p className="text-[#3B472F] font-semibold text-lg">Applications are currently closed.</p>
                 <p className="text--[#686868] mt-2">Please check back later or wait for the next cohort to open.</p>
             </div>
        </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-2 gap-8 w-full">
      {/* Info Column */}
      <div className="space-y-6 flex flex-col justify-center">
        <h1 className="text-4xl lg:text-6xl font-bold text-[#3B472F] leading-tight">
          {classInfo.title}
        </h1>
        <p className="text-lg text-[#686868] max-w-md leading-relaxed whitespace-pre-wrap">
          {classInfo.description}
        </p>

        <div className="bg-[#FFFA7E]/50 backdrop-blur-sm p-6 rounded-2xl border border-[#FFFA7E]">
          <h3 className="font-bold text-[#3B472F] mb-3 uppercase tracking-wider text-sm">Required Tasks</h3>
          <ul className="space-y-3">
            {classInfo.tasks.map((task, i) => (
              <li key={i} className="flex items-start gap-3 text-[#3B472F]">
                <span className="bg-[#3B472F] text-[#FFFA7E] w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold mt-1 shrink-0">{i + 1}</span>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{task.description}</span>
                  {task.requiresProof && (
                    <span className="text-xs text-[#686868]/80 mt-1">
                      (Proof required: {task.proofType === 'image' ? 'Image Upload' : task.proofType})
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Form Column */}
      <GlassCard className="w-full">
        <h2 className="text-2xl font-bold text-[#3B472F] mb-6">Apply for Access</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-[#3B472F] mb-1">Full Name</label>
            <input 
              required
              name="fullName"
              type="text" 
              className="w-full px-4 py-3 rounded-xl bg-white/50 border border-transparent focus:border-[#3B472F] focus:bg-white focus:ring-0 transition-all outline-none text-[#3B472F]"
              placeholder="Jane Doe"
              value={formData.fullName}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-[#3B472F] mb-1">Email Address</label>
            <input 
              required
              name="email"
              type="email" 
              className="w-full px-4 py-3 rounded-xl bg-white/50 border border-transparent focus:border-[#3B472F] focus:bg-white focus:ring-0 transition-all outline-none text-[#3B472F]"
              placeholder="jane@example.com"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-[#3B472F] mb-1">Why do you want to join?</label>
            <textarea 
              required
              name="whyJoin"
              rows={4}
              className="w-full px-4 py-3 rounded-xl bg-white/50 border border-transparent focus:border-[#3B472F] focus:bg-white focus:ring-0 transition-all outline-none text-[#3B472F] resize-none"
              placeholder="Tell us about your goals..."
              value={formData.whyJoin}
              onChange={handleChange}
            />
          </div>

          <hr className="border-[#3B472F]/10 my-4" />
          <h3 className="text-sm font-bold text-[#3B472F] uppercase tracking-wide">Task Proofs</h3>

          {classInfo.tasks.map((task) => {
            if (!task.requiresProof) return null;
            const proof = taskProofs[task.id] || '';

            return (
              <div key={task.id}>
                <label className="block text-sm font-bold text-[#3B472F] mb-1">
                  {task.proofLabel || task.description}
                </label>
                
                {task.proofType === 'image' ? (
                    <div className="space-y-2">
                      <input 
                          required={!proof}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(task.id, e)}
                          className="w-full block text-sm text-[#686868] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#3B472F] file:text-white hover:file:bg-[#2A3322] cursor-pointer"
                      />
                      {proof && (
                        <div className="relative inline-block mt-2">
                           <img src={proof} alt="Preview" className="h-20 w-auto rounded-lg border border-[#3B472F]/20" />
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
                ) : (
                    <input 
                        required
                        type={task.proofType === 'link' ? 'url' : 'text'} 
                        className="w-full px-4 py-3 rounded-xl bg-white/50 border border-transparent focus:border-[#3B472F] focus:bg-white focus:ring-0 transition-all outline-none text-[#3B472F]"
                        placeholder={task.proofType === 'link' ? 'https://...' : task.proofType === 'username' ? '@username' : 'Answer here'}
                        value={proof}
                        onChange={(e) => handleProofChange(task.id, e.target.value)}
                    />
                )}
              </div>
            );
          })}

          <Button type="submit" isLoading={isSubmitting} className="w-full mt-4">
            Submit Application
          </Button>
          
          <p className="text-xs text-center text-[#686868] mt-4">
            By submitting, you agree to our terms. Manual approval required.
          </p>
        </form>
      </GlassCard>
    </div>
  );
};