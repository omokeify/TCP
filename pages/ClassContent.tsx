import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '../components/GlassCard';
import { Button } from '../components/Button';
import { MockService } from '../services/mockDb';
import { ClassConfig, DEFAULT_CLASS_INFO, ClassResource } from '../types';

export const ClassContent: React.FC = () => {
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
        // Ensure defaults if old config loaded
        if (!config.resources) config.resources = DEFAULT_CLASS_INFO.resources;
        setClassConfig(config);
    };
    loadConfig();
  }, [navigate]);

  if (!classConfig) return <div className="text-center p-10 text-[#3B472F]">Loading class data...</div>;

  const getIcon = (type: ClassResource['type']) => {
      switch (type) {
          case 'stream': return (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>
          );
          case 'community': return (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
          );
          case 'video': return (
               <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          );
          case 'document': return (
               <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
          );
          default: return (
               <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>
          );
      }
  };

  const getColor = (type: ClassResource['type']) => {
      switch (type) {
          case 'stream': return 'bg-blue-100 text-blue-600';
          case 'community': return 'bg-[#5865F2]/20 text-[#5865F2]';
          case 'video': return 'bg-red-100 text-red-600';
          case 'document': return 'bg-orange-100 text-orange-600';
          default: return 'bg-gray-100 text-gray-600';
      }
  };

  return (
    <div className="w-full max-w-4xl space-y-8 pb-10">
      <GlassCard className="text-center py-16 bg-white/70">
        <div className="w-20 h-20 bg-[#CEE2C0] rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-[#3B472F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-[#3B472F] mb-4">Access Granted.</h1>
        <h2 className="text-2xl font-semibold text-[#3B472F] mb-2">{classConfig.title}</h2>
        <p className="text-lg text-[#686868] max-w-lg mx-auto">
          {classConfig.description}
        </p>
      </GlassCard>

      <div className="grid md:grid-cols-2 gap-6">
        {classConfig.resources.map((resource, idx) => (
             <GlassCard key={resource.id || idx} className="flex flex-col h-full hover:scale-[1.02] transition-transform duration-300">
                <div className="flex items-center gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${getColor(resource.type)}`}>
                        {getIcon(resource.type)}
                    </div>
                    <div>
                        <h3 className="font-bold text-[#3B472F] text-lg">{resource.title}</h3>
                        <p className="text-xs text-[#686868] uppercase tracking-wider">{resource.type === 'stream' ? 'Live Session' : resource.type}</p>
                    </div>
                </div>
                <p className="text-sm text-[#686868] mb-6 flex-grow leading-relaxed">
                    {resource.description}
                </p>
                <a href={resource.url} target="_blank" rel="noreferrer" className="block w-full mt-auto">
                    <Button variant={resource.type === 'community' ? 'secondary' : 'primary'} className="w-full">
                        {resource.type === 'stream' ? 'Join Session' : 
                         resource.type === 'community' ? 'Open Chat' : 
                         resource.type === 'video' ? 'Watch Video' : 
                         resource.type === 'document' ? 'View Document' : 'Open Link'}
                    </Button>
                </a>
            </GlassCard>
        ))}

        {classConfig.resources.length === 0 && (
            <div className="md:col-span-2 text-center p-8 text-[#686868] italic">
                No course content has been added yet. Check back soon.
            </div>
        )}
      </div>
    </div>
  );
};