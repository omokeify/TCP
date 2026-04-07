import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { GlassCard } from '../components/GlassCard';
import { MemberOnboarding } from '../types';
import { MockService } from '../services/mockDb';

const SECTIONS = [
  'Basic Information',
  'Location & Demographics',
  'Community & Web3 Journey',
  'Motivation & Expectations',
  'Skills & Expertise',
  'Work Experience',
  'Contribution & Roles',
  'Current Status',
  'Teaching & Leadership',
  'Network & Reach'
];

export const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [config, setConfig] = useState<any>(MockService.getClassConfigSync ? MockService.getClassConfigSync() : null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<Partial<MemberOnboarding>>({
    fullName: '',
    email: '',
    telegramUsername: '',
    discordUsername: '',
    xUsername: '',
    skills: [],
    contributionAreas: [],
    otherContributionAreas: '',
    skillLevel: 3,
    maritalStatus: 'Single',
    ageRange: '20–30',
    hasCertifications: 'No',
    hasPortfolio: 'No',
    workedWithWeb3Brand: 'No',
    currentStatus: 'Learning',
    openToTeaching: 'Maybe',
    hasNetworkAccess: 'No'
  });

  React.useEffect(() => {
    MockService.getClassConfig().then(setConfig);
  }, []);

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};
    if (step === 0) {
      if (!formData.fullName) newErrors.fullName = 'Required';
      if (!formData.email) newErrors.email = 'Required';
      if (!formData.telegramUsername) newErrors.telegramUsername = 'Required';
      if (!formData.discordUsername) newErrors.discordUsername = 'Required';
      if (!formData.xUsername) newErrors.xUsername = 'Required';
    } else if (step === 1) {
      if (!formData.country) newErrors.country = 'Required';
      if (!formData.stateRegion) newErrors.stateRegion = 'Required';
    } else if (step === 2) {
      if (!formData.howLongInTcc) newErrors.howLongInTcc = 'Required';
      if (!formData.joinTccDate) newErrors.joinTccDate = 'Required';
      if (!formData.startWeb3JourneyDate) newErrors.startWeb3JourneyDate = 'Required';
    } else if (step === 3) {
      if (!formData.inspiration) newErrors.inspiration = 'Required';
      if (!formData.expectations) newErrors.expectations = 'Required';
    } else if (step === 4) {
      if (!formData.skills?.length && !formData.otherSkills) newErrors.skills = 'Select at least one skill or specify other';
    } else if (step === 6) {
      if (!formData.contributionAreas?.length && !formData.otherContributionAreas) newErrors.contributionAreas = 'Select at least one area or specify other';
      if (!formData.contributionCapacity) newErrors.contributionCapacity = 'Required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name: 'skills' | 'contributionAreas', value: string) => {
    setFormData(prev => {
      const currentValues = (prev[name] as string[]) || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      return { ...prev, [name]: newValues };
    });
  };

  const nextStep = () => {
    if (!validateStep(currentStep)) return;

    if (currentStep < SECTIONS.length - 1) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      handleSubmit();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await MockService.submitMemberOnboarding(formData);
      setIsSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Error submitting onboarding:', error);
      alert('Failed to submit onboarding. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = ((currentStep + 1) / SECTIONS.length) * 100;

  if (isSubmitted) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-24 text-center animate-fadeIn">
        <div className="mb-8 flex justify-center">
          <div className="w-24 h-24 bg-[#FFFA7E] text-[#3B472F] rounded-full flex items-center justify-center shadow-2xl shadow-[#FFFA7E]/40 border-4 border-white animate-bounce-slow">
            <span className="material-icons-outlined text-5xl">check_circle</span>
          </div>
        </div>
        <h1 className="text-4xl font-bold text-[#3B472F] mb-4">You're All Set!</h1>
        <p className="text-lg text-[#686868] mb-12">
          Thank you for completing the member intake form. Your profile has been successfully submitted and is now being processed by the community leads.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
          <div className="bg-white/40 backdrop-blur-md p-6 rounded-3xl border border-white/60 text-left">
            <h3 className="font-bold text-[#3B472F] mb-1">What's Next?</h3>
            <p className="text-xs text-[#686868]">Our team will review your skills and experience to find the best positioning for you in the ecosystem.</p>
          </div>
          <div className="bg-[#3B472F]/5 p-6 rounded-3xl border border-[#3B472F]/10 text-left">
            <h3 className="font-bold text-[#3B472F] mb-1">Stay Updated</h3>
            <p className="text-xs text-[#686868]">Keep an eye on your Telegram or Email for updates regarding your status and next steps.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={() => navigate('/')} className="px-8 py-3 !bg-white/50 !text-[#3B472F] border border-[#3B472F]/20 hover:!bg-white/80">
            Back to Home
          </Button>
          <Button onClick={() => navigate('/quests')} className="px-8 py-3 flex items-center gap-2">
            Explore Quests
            <span className="material-icons-outlined text-sm">explore</span>
          </Button>
        </div>
        
        <div className="onboarding-bg opacity-30"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-12">
      <div className="mb-8 text-center pt-8">
        {/* Title removed per request */}
      </div>

      {/* Progress Bar */}
      <div className="mb-12">
        <div className="flex justify-between text-xs font-medium text-[#3B472F] mb-3 uppercase tracking-wider">
          <span className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-[#3B472F] text-white flex items-center justify-center font-bold">
              {currentStep + 1}
            </span>
            <span>Section {currentStep + 1} of {SECTIONS.length}</span>
          </span>
          <span className="font-bold">{SECTIONS[currentStep]}</span>
        </div>
        <div className="w-full h-2.5 bg-[#FFFA7E]/30 rounded-full overflow-hidden shadow-inner">
          <div 
            className="h-full bg-gradient-to-r from-[#3B472F] to-[#5a6b47] transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      <GlassCard className="p-8 w-full">
        {currentStep === 0 && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-xl font-bold text-[#3B472F] border-b border-[#3B472F]/10 pb-2">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-[#3B472F] mb-1">Full Name (First & Last) <span className="text-red-500">*</span></label>
                  <input 
                    type="text" name="fullName" value={formData.fullName || ''} onChange={handleInputChange}
                    className={`w-full p-3 rounded-xl border ${errors.fullName ? 'border-red-500' : 'border-[#FFFA7E]'} bg-white/50 focus:outline-none focus:ring-2 focus:ring-[#3B472F]/20`}
                    placeholder="John Doe"
                  />
                  {errors.fullName && <p className="text-red-500 text-[10px] mt-1 font-bold italic">{errors.fullName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#3B472F] mb-1">Email Address <span className="text-red-500">*</span></label>
                  <input 
                    type="email" name="email" value={formData.email || ''} onChange={handleInputChange}
                    className={`w-full p-3 rounded-xl border ${errors.email ? 'border-red-500' : 'border-[#FFFA7E]'} bg-white/50 focus:outline-none focus:ring-2 focus:ring-[#3B472F]/20`}
                    placeholder="john@example.com"
                  />
                  {errors.email && <p className="text-red-500 text-[10px] mt-1 font-bold italic">{errors.email}</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#3B472F] mb-1">Telegram Username <span className="text-red-500">*</span></label>
                  <input 
                    type="text" name="telegramUsername" value={formData.telegramUsername || ''} onChange={handleInputChange}
                    className={`w-full p-3 rounded-xl border ${errors.telegramUsername ? 'border-red-500' : 'border-[#FFFA7E]'} bg-white/50 focus:outline-none focus:ring-2 focus:ring-[#3B472F]/20`}
                    placeholder="@username"
                  />
                  {errors.telegramUsername && <p className="text-red-500 text-[10px] mt-1 font-bold italic">{errors.telegramUsername}</p>}
                </div>
              <div>
                <label className="block text-sm font-bold text-[#3B472F] mb-1">Discord Username <span className="text-red-500">*</span></label>
                <input 
                  type="text" name="discordUsername" value={formData.discordUsername || ''} onChange={handleInputChange}
                  className={`w-full p-3 rounded-xl border ${errors.discordUsername ? 'border-red-500' : 'border-[#FFFA7E]'} bg-white/50 focus:outline-none focus:ring-2 focus:ring-[#3B472F]/20`}
                  placeholder="username#0000"
                />
                {errors.discordUsername && <p className="text-red-500 text-[10px] mt-1 font-bold italic">{errors.discordUsername}</p>}
              </div>
              <div>
                <label className="block text-sm font-bold text-[#3B472F] mb-1">X Username <span className="text-red-500">*</span></label>
                <input 
                  type="text" name="xUsername" value={formData.xUsername || ''} onChange={handleInputChange}
                  className={`w-full p-3 rounded-xl border ${errors.xUsername ? 'border-red-500' : 'border-[#FFFA7E]'} bg-white/50 focus:outline-none focus:ring-2 focus:ring-[#3B472F]/20`}
                  placeholder="@username"
                />
                {errors.xUsername && <p className="text-red-500 text-[10px] mt-1 font-bold italic">{errors.xUsername}</p>}
              </div>
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-xl font-bold text-[#3B472F] border-b border-[#3B472F]/10 pb-2">Location & Demographics</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-[#3B472F] mb-1">Country <span className="text-red-500">*</span></label>
                <select 
                  name="country" value={formData.country || ''} onChange={handleInputChange}
                  className={`w-full p-3 rounded-xl border ${errors.country ? 'border-red-500' : 'border-[#FFFA7E]'} bg-white/50 focus:outline-none focus:ring-2 focus:ring-[#3B472F]/20`}
                >
                  <option value="">Select Country</option>
                  <option value="Nigeria">Nigeria</option>
                  <option value="United States">United States</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Canada">Canada</option>
                  {/* More countries would be here */}
                </select>
                {errors.country && <p className="text-red-500 text-[10px] mt-1 font-bold italic">{errors.country}</p>}
              </div>
              <div>
                <label className="block text-sm font-bold text-[#3B472F] mb-1">State/Region <span className="text-red-500">*</span></label>
                <input 
                  type="text" name="stateRegion" value={formData.stateRegion || ''} onChange={handleInputChange}
                  className={`w-full p-3 rounded-xl border ${errors.stateRegion ? 'border-red-500' : 'border-[#FFFA7E]'} bg-white/50 focus:outline-none focus:ring-2 focus:ring-[#3B472F]/20`}
                />
                {errors.stateRegion && <p className="text-red-500 text-[10px] mt-1 font-bold italic">{errors.stateRegion}</p>}
              </div>
              <div>
                <label className="block text-sm font-bold text-[#3B472F] mb-1">Marital Status</label>
                <div className="space-y-2">
                  {['Single', 'Married', 'Prefer not to say'].map(option => (
                    <label key={option} className="flex items-center gap-3 p-3 rounded-xl border border-[#FFFA7E] bg-white/30 cursor-pointer hover:bg-white/50 transition-colors">
                      <input 
                        type="radio" name="maritalStatus" value={option} 
                        checked={formData.maritalStatus === option} onChange={handleInputChange}
                        className="w-4 h-4 accent-[#3B472F]"
                      />
                      <span className="text-sm text-[#3B472F]">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-[#3B472F] mb-1">Age Range</label>
                <div className="space-y-2">
                  {['Below 20', '20–30', '30–40', '40 & above'].map(option => (
                    <label key={option} className="flex items-center gap-3 p-3 rounded-xl border border-[#FFFA7E] bg-white/30 cursor-pointer hover:bg-white/50 transition-colors">
                      <input 
                        type="radio" name="ageRange" value={option} 
                        checked={formData.ageRange === option} onChange={handleInputChange}
                        className="w-4 h-4 accent-[#3B472F]"
                      />
                      <span className="text-sm text-[#3B472F]">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-xl font-bold text-[#3B472F] border-b border-[#3B472F]/10 pb-2">Community & Web3 Journey</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-[#3B472F] mb-1">How long have you been in TCC? <span className="text-red-500">*</span></label>
                <input 
                  type="text" name="howLongInTcc" value={formData.howLongInTcc || ''} onChange={handleInputChange}
                  className={`w-full p-3 rounded-xl border ${errors.howLongInTcc ? 'border-red-500' : 'border-[#FFFA7E]'} bg-white/50 focus:outline-none focus:ring-2 focus:ring-[#3B472F]/20`}
                  placeholder="e.g., 6 months"
                />
                {errors.howLongInTcc && <p className="text-red-500 text-[10px] mt-1 font-bold italic">{errors.howLongInTcc}</p>}
              </div>
              <div>
                <label className="block text-sm font-bold text-[#3B472F] mb-1">When did you join TCC? (Month & Year) <span className="text-red-500">*</span></label>
                <input 
                  type="month" name="joinTccDate" value={formData.joinTccDate || ''} onChange={handleInputChange}
                  className={`w-full p-3 rounded-xl border ${errors.joinTccDate ? 'border-red-500' : 'border-[#FFFA7E]'} bg-white/50 focus:outline-none focus:ring-2 focus:ring-[#3B472F]/20`}
                />
                {errors.joinTccDate && <p className="text-red-500 text-[10px] mt-1 font-bold italic">{errors.joinTccDate}</p>}
              </div>
              <div>
                <label className="block text-sm font-bold text-[#3B472F] mb-1">When did you start your Web3 journey? (Month & Year) <span className="text-red-500">*</span></label>
                <input 
                  type="month" name="startWeb3JourneyDate" value={formData.startWeb3JourneyDate || ''} onChange={handleInputChange}
                  className={`w-full p-3 rounded-xl border ${errors.startWeb3JourneyDate ? 'border-red-500' : 'border-[#FFFA7E]'} bg-white/50 focus:outline-none focus:ring-2 focus:ring-[#3B472F]/20`}
                />
                {errors.startWeb3JourneyDate && <p className="text-red-500 text-[10px] mt-1 font-bold italic">{errors.startWeb3JourneyDate}</p>}
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-xl font-bold text-[#3B472F] border-b border-[#3B472F]/10 pb-2">Motivation & Expectations</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-[#3B472F] mb-1">What inspired you to join The Compass Community? <span className="text-red-500">*</span></label>
                <textarea 
                  name="inspiration" value={formData.inspiration || ''} onChange={handleInputChange}
                  className={`w-full p-3 rounded-xl border ${errors.inspiration ? 'border-red-500' : 'border-[#FFFA7E]'} bg-white/50 focus:outline-none focus:ring-2 focus:ring-[#3B472F]/20 min-h-[120px]`}
                />
                {errors.inspiration && <p className="text-red-500 text-[10px] mt-1 font-bold italic">{errors.inspiration}</p>}
              </div>
              <div>
                <label className="block text-sm font-bold text-[#3B472F] mb-1">What are your short-term and long-term expectations in TCC? <span className="text-red-500">*</span></label>
                <textarea 
                  name="expectations" value={formData.expectations || ''} onChange={handleInputChange}
                  className={`w-full p-3 rounded-xl border ${errors.expectations ? 'border-red-500' : 'border-[#FFFA7E]'} bg-white/50 focus:outline-none focus:ring-2 focus:ring-[#3B472F]/20 min-h-[120px]`}
                />
                {errors.expectations && <p className="text-red-500 text-[10px] mt-1 font-bold italic">{errors.expectations}</p>}
              </div>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-xl font-bold text-[#3B472F] border-b border-[#3B472F]/10 pb-2">Skills & Expertise</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-[#3B472F] mb-3">What tech/Web3 skills do you have? <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    'Trading (Spot/Futures)', 'Research/Analysis', 'Content Creation', 
                    'Community Management', 'Graphic Design', 'Development (Frontend/Backend/Web3)',
                    'Marketing/Growth', 'Data Analysis'
                  ].map(skill => (
                    <label key={skill} className={`flex items-center gap-3 p-3 rounded-xl border ${errors.skills ? 'border-red-500/50' : 'border-[#FFFA7E]'} bg-white/30 cursor-pointer hover:bg-white/50 transition-colors`}>
                      <input 
                        type="checkbox" checked={formData.skills?.includes(skill)} 
                        onChange={() => handleCheckboxChange('skills', skill)}
                        className="w-4 h-4 accent-[#3B472F]"
                      />
                      <span className="text-sm text-[#3B472F]">{skill}</span>
                    </label>
                  ))}
                </div>
                {errors.skills && <p className="text-red-500 text-[10px] mt-1 font-bold italic">{errors.skills}</p>}
              </div>
              <div>
                <label className="block text-sm font-bold text-[#3B472F] mb-1">Other Skills</label>
                <input 
                  type="text" name="otherSkills" value={formData.otherSkills || ''} onChange={handleInputChange}
                  className="w-full p-3 rounded-xl border border-[#FFFA7E] bg-white/50 focus:outline-none focus:ring-2 focus:ring-[#3B472F]/20"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#3B472F] mb-4">Rate your overall skill level (1 = Beginner, 5 = Advanced)</label>
                <div className="flex items-center gap-4 px-4">
                  {[1, 2, 3, 4, 5].map(level => (
                    <button 
                      key={level}
                      onClick={() => setFormData(prev => ({ ...prev, skillLevel: level }))}
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                        formData.skillLevel === level 
                        ? 'bg-[#3B472F] text-white scale-110 shadow-lg shadow-[#3B472F]/20' 
                        : 'bg-[#FFFA7E]/40 text-[#3B472F] hover:bg-[#FFFA7E]/60'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-[#3B472F] mb-1">What tools are you very knowledgeable with?</label>
                <textarea 
                  name="knowledgeableTools" value={formData.knowledgeableTools || ''} onChange={handleInputChange}
                  className="w-full p-3 rounded-xl border border-[#FFFA7E] bg-white/50 focus:outline-none focus:ring-2 focus:ring-[#3B472F]/20 min-h-[80px]"
                  placeholder="e.g., TradingView, Notion, Dune, Canva, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#3B472F] mb-1">Do you have any certifications?</label>
                <div className="flex gap-4">
                   {['Yes', 'No'].map(opt => (
                    <label key={opt} className="flex-1 flex items-center gap-3 p-3 rounded-xl border border-[#FFFA7E] bg-white/30 cursor-pointer hover:bg-white/50 transition-colors">
                      <input 
                        type="radio" name="hasCertifications" value={opt} 
                        checked={formData.hasCertifications === opt} onChange={handleInputChange}
                        className="w-4 h-4 accent-[#3B472F]"
                      />
                      <span className="text-sm text-[#3B472F]">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
              {formData.hasCertifications === 'Yes' && (
                <div className="animate-slideDown">
                  <label className="block text-sm font-bold text-[#3B472F] mb-1">List your certifications</label>
                  <textarea 
                    name="certificationsList" value={formData.certificationsList || ''} onChange={handleInputChange}
                    className="w-full p-3 rounded-xl border border-[#FFFA7E] bg-white/50 focus:outline-none focus:ring-2 focus:ring-[#3B472F]/20 min-h-[80px]"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-bold text-[#3B472F] mb-1">Do you have a portfolio?</label>
                <div className="flex gap-4">
                   {['Yes', 'No'].map(opt => (
                    <label key={opt} className="flex-1 flex items-center gap-3 p-3 rounded-xl border border-[#FFFA7E] bg-white/30 cursor-pointer hover:bg-white/50 transition-colors">
                      <input 
                        type="radio" name="hasPortfolio" value={opt} 
                        checked={formData.hasPortfolio === opt} onChange={handleInputChange}
                        className="w-4 h-4 accent-[#3B472F]"
                      />
                      <span className="text-sm text-[#3B472F]">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
              {formData.hasPortfolio === 'Yes' && (
                <div className="animate-slideDown">
                  <label className="block text-sm font-bold text-[#3B472F] mb-1">Share your portfolio link</label>
                  <input 
                    type="text" name="portfolioLink" value={formData.portfolioLink || ''} onChange={handleInputChange}
                    className="w-full p-3 rounded-xl border border-[#FFFA7E] bg-white/50 focus:outline-none focus:ring-2 focus:ring-[#3B472F]/20"
                    placeholder="https://..."
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-xl font-bold text-[#3B472F] border-b border-[#3B472F]/10 pb-2">Work Experience</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-[#3B472F] mb-1">Have you worked with a Web3 brand before?</label>
                <div className="flex gap-4">
                   {['Yes', 'No'].map(opt => (
                    <label key={opt} className="flex-1 flex items-center gap-3 p-3 rounded-xl border border-[#FFFA7E] bg-white/30 cursor-pointer hover:bg-white/50 transition-colors">
                      <input 
                        type="radio" name="workedWithWeb3Brand" value={opt} 
                        checked={formData.workedWithWeb3Brand === opt} onChange={handleInputChange}
                        className="w-4 h-4 accent-[#3B472F]"
                      />
                      <span className="text-sm text-[#3B472F]">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
              {formData.workedWithWeb3Brand === 'Yes' && (
                <div className="space-y-4 animate-slideDown">
                  <div>
                    <label className="block text-sm font-bold text-[#3B472F] mb-1">What was your role?</label>
                    <input 
                      type="text" name="web3Role" value={formData.web3Role || ''} onChange={handleInputChange}
                      className="w-full p-3 rounded-xl border border-[#FFFA7E] bg-white/50 focus:outline-none focus:ring-2 focus:ring-[#3B472F]/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[#3B472F] mb-1">Which brand(s) have you worked with?</label>
                    <input 
                      type="text" name="web3Brands" value={formData.web3Brands || ''} onChange={handleInputChange}
                      className="w-full p-3 rounded-xl border border-[#FFFA7E] bg-white/50 focus:outline-none focus:ring-2 focus:ring-[#3B472F]/20"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {currentStep === 6 && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-xl font-bold text-[#3B472F] border-b border-[#3B472F]/10 pb-2">Contribution & Roles</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-[#3B472F] mb-3">What areas are you comfortable contributing to? <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    'Community Moderation', 'Content Creation', 'Trading/Signals', 
                    'Research & Reports', 'Events/Spaces Hosting', 'Business Development',
                    'Technical Development', 'Design', 'Education/Training'
                  ].map(area => (
                    <label key={area} className={`flex items-center gap-3 p-3 rounded-xl border ${errors.contributionAreas ? 'border-red-500/50' : 'border-[#FFFA7E]'} bg-white/30 cursor-pointer hover:bg-white/50 transition-colors`}>
                      <input 
                        type="checkbox" checked={formData.contributionAreas?.includes(area)} 
                        onChange={() => handleCheckboxChange('contributionAreas', area)}
                        className="w-4 h-4 accent-[#3B472F]"
                      />
                      <span className="text-sm text-[#3B472F]">{area}</span>
                    </label>
                  ))}
                </div>
                {errors.contributionAreas && <p className="text-red-500 text-[10px] mt-1 font-bold italic">{errors.contributionAreas}</p>}
              </div>
              <div>
                <label className="block text-sm font-bold text-[#3B472F] mb-1">Other contribution areas (list ones not part of the options above)</label>
                <input 
                  type="text" name="otherContributionAreas" value={formData.otherContributionAreas || ''} onChange={handleInputChange}
                  className="w-full p-3 rounded-xl border border-[#FFFA7E] bg-white/50 focus:outline-none focus:ring-2 focus:ring-[#3B472F]/20"
                  placeholder="e.g., Legal, Partnership, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#3B472F] mb-1">In what capacity can you contribute to TCC? <span className="text-red-500">*</span></label>
                <textarea 
                  name="contributionCapacity" value={formData.contributionCapacity || ''} onChange={handleInputChange}
                  className={`w-full p-3 rounded-xl border ${errors.contributionCapacity ? 'border-red-500' : 'border-[#FFFA7E]'} bg-white/50 focus:outline-none focus:ring-2 focus:ring-[#3B472F]/20 min-h-[120px]`}
                />
                {errors.contributionCapacity && <p className="text-red-500 text-[10px] mt-1 font-bold italic">{errors.contributionCapacity}</p>}
              </div>
            </div>
          </div>
        )}

        {currentStep === 7 && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-xl font-bold text-[#3B472F] border-b border-[#3B472F]/10 pb-2">Current Status</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-[#3B472F] mb-3">What best describes your current situation?</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {['Job Hunting', 'Freelancing', 'Learning', 'Building', 'All of the above'].map(opt => (
                    <label key={opt} className="flex items-center gap-3 p-3 rounded-xl border border-[#FFFA7E] bg-white/30 cursor-pointer hover:bg-white/50 transition-colors">
                      <input 
                        type="radio" name="currentStatus" value={opt} 
                        checked={formData.currentStatus === opt} onChange={handleInputChange}
                        className="w-4 h-4 accent-[#3B472F]"
                      />
                      <span className="text-sm text-[#3B472F]">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 8 && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-xl font-bold text-[#3B472F] border-b border-[#3B472F]/10 pb-2">Teaching & Leadership</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-[#3B472F] mb-3">Are you open to teaching or mentoring others?</label>
                <div className="flex flex-col gap-2">
                  {['Yes', 'No', 'Maybe'].map(opt => (
                    <label key={opt} className="flex items-center gap-3 p-3 rounded-xl border border-[#FFFA7E] bg-white/30 cursor-pointer hover:bg-white/50 transition-colors">
                      <input 
                        type="radio" name="openToTeaching" value={opt} 
                        checked={formData.openToTeaching === opt} onChange={handleInputChange}
                        className="w-4 h-4 accent-[#3B472F]"
                      />
                      <span className="text-sm text-[#3B472F]">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 9 && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-xl font-bold text-[#3B472F] border-b border-[#3B472F]/10 pb-2">Network & Reach</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-[#3B472F] mb-1">Do you have access to any audience, community, or network?</label>
                <div className="flex gap-4">
                   {['Yes', 'No'].map(opt => (
                    <label key={opt} className="flex-1 flex items-center gap-3 p-3 rounded-xl border border-[#FFFA7E] bg-white/30 cursor-pointer hover:bg-white/50 transition-colors">
                      <input 
                        type="radio" name="hasNetworkAccess" value={opt} 
                        checked={formData.hasNetworkAccess === opt} onChange={handleInputChange}
                        className="w-4 h-4 accent-[#3B472F]"
                      />
                      <span className="text-sm text-[#3B472F]">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
              {formData.hasNetworkAccess === 'Yes' && (
                <div className="animate-slideDown">
                  <label className="block text-sm font-bold text-[#3B472F] mb-1">Describe your audience/network (platform, size, niche)</label>
                  <textarea 
                    name="networkDescription" value={formData.networkDescription || ''} onChange={handleInputChange}
                    className="w-full p-3 rounded-xl border border-[#FFFA7E] bg-white/50 focus:outline-none focus:ring-2 focus:ring-[#3B472F]/20 min-h-[120px]"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="mt-12 flex justify-between gap-4">
          <Button 
            onClick={prevStep} 
            disabled={currentStep === 0 || isSubmitting}
            className={`px-8 py-3 !bg-white/20 !text-[#3B472F] border border-[#3B472F]/20 hover:!bg-white/40 ${currentStep === 0 ? 'opacity-0 pointer-events-none' : ''}`}
          >
            Previous
          </Button>
          <Button 
            onClick={nextStep} 
            disabled={isSubmitting}
            className="px-10 py-3 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
               <div className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full"></div>
            ) : (
                <>
                    {currentStep === SECTIONS.length - 1 ? 'Submit Onboarding' : 'Continue'}
                    <span className="material-icons-outlined text-sm">
                        {currentStep === SECTIONS.length - 1 ? 'send' : 'arrow_forward'}
                    </span>
                </>
            )}
          </Button>
        </div>
      </GlassCard>

      <div className="mt-8 text-center text-xs text-[#686868] opacity-60">
        Your data is securely stored and used only for community positioning.
      </div>

      <style>{`
        .onboarding-bg {
          background: linear-gradient(135deg, #FFFA7E 0%, #ffffff 50%, #FFFA7E/20 100%);
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: -1;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes slideDown {
          from { opacity: 0; height: 0; transform: translateY(-10px); }
          to { opacity: 1; height: auto; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-slideDown {
          animation: slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        input:focus, textarea:focus, select:focus {
          border-color: #3B472F !important;
          box-shadow: 0 0 0 4px rgba(59, 71, 47, 0.1) !important;
        }
        .step-transition {
          transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
      `}</style>
      <div className="onboarding-bg opacity-30"></div>
    </div>
  );
};
