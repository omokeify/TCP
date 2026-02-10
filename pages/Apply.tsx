import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/Button';
import { DEFAULT_CLASS_INFO, ClassConfig } from '../types';
import { MockService } from '../services/mockDb';

export const Apply: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [classInfo, setClassInfo] = useState<ClassConfig>(DEFAULT_CLASS_INFO);

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

  // If applications are closed, we might still want to show the landing page 
  // but maybe hide the "Browse Quests" if the whole program is paused.
  // For now, we'll assume the landing page is always visible.

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full max-w-4xl mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="text-center space-y-6 mb-16">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-[#3B472F] leading-tight">
          The Community Platform
        </h1>
        <p className="text-lg md:text-xl text-[#686868] max-w-2xl mx-auto leading-relaxed">
          A dedicated space for builders, creators, and learners to collaborate and grow together. Complete quests, earn access to exclusive sessions, and join a vibrant network of peers.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Button onClick={() => {
                const ref = searchParams.get('ref');
                navigate(ref ? `/quests?ref=${ref}` : '/quests');
            }} className="flex items-center justify-center gap-2 px-8 py-4 text-lg">
                <span className="material-icons-outlined">explore</span>
                Start Your Journey
            </Button>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="w-full">
        <h3 className="font-bold text-[#3B472F] mb-8 text-center uppercase tracking-wider text-sm">How It Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#FFFA7E]/50 backdrop-blur-sm p-6 rounded-2xl border border-[#FFFA7E] flex flex-col items-center text-center">
                <span className="bg-[#3B472F] text-[#FFFA7E] w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold mb-4">1</span>
                <span className="font-bold block text-lg text-[#3B472F] mb-2">Choose a Quest</span>
                <span className="text-[#3B472F]/80">Explore available quest sets and find one that matches your interests.</span>
            </div>
            
            <div className="bg-[#FFFA7E]/50 backdrop-blur-sm p-6 rounded-2xl border border-[#FFFA7E] flex flex-col items-center text-center">
                <span className="bg-[#3B472F] text-[#FFFA7E] w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold mb-4">2</span>
                <span className="font-bold block text-lg text-[#3B472F] mb-2">Submit Proofs</span>
                <span className="text-[#3B472F]/80">Complete tasks and submit your work to demonstrate your skills.</span>
            </div>
            
            <div className="bg-[#FFFA7E]/50 backdrop-blur-sm p-6 rounded-2xl border border-[#FFFA7E] flex flex-col items-center text-center">
                <span className="bg-[#3B472F] text-[#FFFA7E] w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold mb-4">3</span>
                <span className="font-bold block text-lg text-[#3B472F] mb-2">Get Access</span>
                <span className="text-[#3B472F]/80">Receive an invite code to join exclusive sessions and the community portal.</span>
            </div>
        </div>
      </div>
    </div>
  );
};