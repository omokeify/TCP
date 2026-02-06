import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '../components/GlassCard';
import { Button } from '../components/Button';

export const ClassContent: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const hasAccess = sessionStorage.getItem('blink_class_access');
    if (!hasAccess) {
      navigate('/access');
    }
  }, [navigate]);

  return (
    <div className="w-full max-w-3xl space-y-8">
      <GlassCard className="text-center py-16 bg-white/70">
        <div className="w-20 h-20 bg-[#CEE2C0] rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-[#3B472F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-[#3B472F] mb-4">Access Granted.</h1>
        <p className="text-lg text-[#686868] max-w-lg mx-auto">
          Welcome to the inner circle. Use the secure links below to join the live sessions and community channels.
        </p>
      </GlassCard>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Live Session Card */}
        <GlassCard className="flex flex-col h-full hover:scale-[1.02] transition-transform duration-300">
          <div className="flex items-center gap-4 mb-4">
             <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
               <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>
             </div>
             <div>
               <h3 className="font-bold text-[#3B472F] text-lg">Google Meet</h3>
               <p className="text-xs text-[#686868]">Live Class Session</p>
             </div>
          </div>
          <p className="text-sm text-[#686868] mb-6 flex-grow">
            Join the weekly live stream where we dissect advanced patterns.
            <br/><span className="font-bold mt-2 block text-[#3B472F]">Next Call: Friday, 10:00 AM PST</span>
          </p>
          <a href="https://meet.google.com/" target="_blank" rel="noreferrer" className="block w-full">
            <Button className="w-full">Join Meeting</Button>
          </a>
        </GlassCard>

        {/* Community Card */}
        <GlassCard className="flex flex-col h-full hover:scale-[1.02] transition-transform duration-300">
          <div className="flex items-center gap-4 mb-4">
             <div className="w-12 h-12 rounded-full bg-[#5865F2]/20 flex items-center justify-center text-[#5865F2] shrink-0">
               <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.118.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
             </div>
             <div>
               <h3 className="font-bold text-[#3B472F] text-lg">Discord</h3>
               <p className="text-xs text-[#686868]">Private Server</p>
             </div>
          </div>
          <p className="text-sm text-[#686868] mb-6 flex-grow">
            Chat with other approved members and get direct feedback on your tasks in the #exclusive channel.
          </p>
          <a href="https://discord.com/" target="_blank" rel="noreferrer" className="block w-full">
            <Button variant="secondary" className="w-full">Join Server</Button>
          </a>
        </GlassCard>
      </div>
      
      {/* Telegram / Additional Card */}
      <GlassCard className="p-0 overflow-hidden flex flex-col md:flex-row">
         <div className="bg-[#2AABEE]/10 p-6 md:w-1/3 flex items-center justify-center">
            <svg className="w-12 h-12 text-[#2AABEE]" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 11.944 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.638z"/></svg>
         </div>
         <div className="p-6 md:w-2/3 flex flex-col justify-center">
            <h3 className="font-bold text-[#3B472F] text-lg">Telegram Alerts</h3>
            <p className="text-sm text-[#686868] mb-4">Get instant notifications about class schedule changes and new resource drops.</p>
            <a href="https://telegram.org/" target="_blank" rel="noreferrer" className="inline-block self-start">
               <span className="text-[#2AABEE] font-bold text-sm hover:underline">Subscribe to Channel →</span>
            </a>
         </div>
      </GlassCard>
    </div>
  );
};