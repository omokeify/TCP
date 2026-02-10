import React, { useEffect, useState } from 'react';
import { GlassCard } from '../components/GlassCard';
import { Link } from 'react-router-dom';
import { MockService } from '../services/mockDb';
import { DEFAULT_CLASS_INFO, ClassConfig } from '../types';

export const Status: React.FC = () => {
  const [classConfig, setClassConfig] = useState<ClassConfig>(DEFAULT_CLASS_INFO);

  useEffect(() => {
    const loadConfig = async () => {
        try {
            const config = await MockService.getClassConfig();
            setClassConfig({ ...DEFAULT_CLASS_INFO, ...config });
        } catch (e) {
            console.error("Failed to load config", e);
        }
    };
    loadConfig();
  }, []);

  return (
    <GlassCard className="max-w-lg text-center py-16">
      <div className="w-20 h-20 bg-[#CEE2C0] rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-[#3B472F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-3xl font-bold text-[#3B472F] mb-4">Application Received</h2>
      <p className="text-lg text-[#686868] mb-8 leading-relaxed">
        You have successfully applied for <strong>{classConfig.title}</strong>.
        <br/><br/>
        Your application is under review. Approved applicants will receive a unique invitation code by email.
      </p>
      
      <div className="flex justify-center">
        <Link to="/" className="text-[#3B472F] font-semibold hover:underline">Return Home</Link>
      </div>
    </GlassCard>
  );
};