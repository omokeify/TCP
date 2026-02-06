import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '../components/GlassCard';
import { Button } from '../components/Button';
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
        // Fallback for older configs or if sheet missing cols
        const mergedConfig = { ...DEFAULT_CLASS_INFO, ...config };
        setClassConfig(mergedConfig);
    };
    loadConfig();
  }, [navigate]);

  if (!classConfig) return <div className="text-center p-10 text-[#3B472F] font-medium">Loading class portal...</div>;

  const isLink = (str?: string) => str?.startsWith('http') || str?.startsWith('www');

  return (
    <div className="w-full max-w-4xl space-y-8 pb-20">
      {/* Header Section */}
      <div className="text-center space-y-4 py-8">
        <h1 className="text-4xl md:text-5xl font-bold text-[#3B472F]">Welcome to the Class 🎉</h1>
        <p className="text-lg text-[#686868] max-w-lg mx-auto">
          Below are the full details for your upcoming training. <br/>
          Please save this information.
        </p>
      </div>

      {/* Main Details Card */}
      <GlassCard className="bg-white/70">
        <div className="border-b border-[#3B472F]/10 pb-6 mb-6">
            <h2 className="text-3xl font-bold text-[#3B472F] mb-3">{classConfig.title}</h2>
            <p className="text-[#686868] leading-relaxed whitespace-pre-wrap">{classConfig.description}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
            {/* Logistics Column */}
            <div className="space-y-6">
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#FFFA7E] flex items-center justify-center text-[#3B472F] shrink-0">
                        <span className="material-icons-outlined">calendar_today</span>
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-[#686868]">Date & Time</p>
                        <p className="font-semibold text-[#3B472F] text-lg">{classConfig.date || 'TBA'}</p>
                        <p className="text-[#3B472F]">{classConfig.time || 'TBA'}</p>
                    </div>
                </div>

                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#FFFA7E] flex items-center justify-center text-[#3B472F] shrink-0">
                        <span className="material-icons-outlined">location_on</span>
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-[#686868]">Location</p>
                        {isLink(classConfig.location) ? (
                            <a href={classConfig.location} target="_blank" rel="noreferrer" className="font-semibold text-[#3B472F] text-lg hover:underline decoration-[#FFFA7E] underline-offset-4">
                                Join Session &rarr;
                            </a>
                        ) : (
                            <p className="font-semibold text-[#3B472F] text-lg">{classConfig.location || 'Online'}</p>
                        )}
                    </div>
                </div>

                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#FFFA7E] flex items-center justify-center text-[#3B472F] shrink-0">
                        <span className="material-icons-outlined">person</span>
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-[#686868]">Instructor</p>
                        <p className="font-semibold text-[#3B472F] text-lg">{classConfig.instructor || 'TBA'}</p>
                    </div>
                </div>
            </div>

            {/* Notes Column */}
            <div className="bg-[#3B472F]/5 rounded-2xl p-6 border border-[#3B472F]/10">
                <h3 className="font-bold text-[#3B472F] mb-4 flex items-center gap-2">
                    <span className="material-icons-outlined text-sm">info</span>
                    Important Notes
                </h3>
                <p className="text-[#686868] text-sm leading-relaxed whitespace-pre-wrap">
                    {classConfig.extraNotes || "No additional notes at this time."}
                </p>
            </div>
        </div>

        {classConfig.lastUpdated && (
            <div className="mt-8 pt-6 border-t border-[#3B472F]/10 text-center">
                <p className="text-xs text-[#686868]">
                    Last updated: <span className="font-medium text-[#3B472F]">{classConfig.lastUpdated}</span>
                </p>
            </div>
        )}
      </GlassCard>
      
      {/* Existing Resources Section (if any) */}
      {classConfig.resources && classConfig.resources.length > 0 && (
          <div className="pt-8">
             <h3 className="text-2xl font-bold text-[#3B472F] mb-6 px-4">Class Resources</h3>
             <div className="grid md:grid-cols-2 gap-6">
                {classConfig.resources.map((resource, idx) => (
                    <GlassCard key={resource.id || idx} className="hover:scale-[1.01] transition-transform duration-300">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-10 h-10 rounded-lg bg-[#3B472F]/10 flex items-center justify-center text-[#3B472F]">
                                <span className="material-icons-outlined">
                                    {resource.type === 'video' ? 'play_circle' : 
                                    resource.type === 'stream' ? 'video_camera_front' : 
                                    resource.type === 'community' ? 'forum' : 
                                    resource.type === 'document' ? 'article' : 'link'}
                                </span>
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-[#3B472F] text-[#FFFA7E] px-2 py-1 rounded-md">
                                {resource.type}
                            </span>
                        </div>
                        <h4 className="font-bold text-[#3B472F] text-lg mb-2">{resource.title}</h4>
                        <p className="text-sm text-[#686868] mb-6">{resource.description}</p>
                        <a href={resource.url} target="_blank" rel="noreferrer" className="block">
                            <Button className="w-full text-sm py-2">Open Resource</Button>
                        </a>
                    </GlassCard>
                ))}
             </div>
          </div>
      )}
    </div>
  );
};