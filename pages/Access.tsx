import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '../components/GlassCard';
import { Button } from '../components/Button';
import { MockService } from '../services/mockDb';

export const Access: React.FC = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<{ capacity: number; approved: number; remaining: number } | null>(null);

  useEffect(() => {
      MockService.getCapacityStats().then(setStats);
  }, []);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsChecking(true);
    setError('');

    const cleanCode = code.trim().toUpperCase();

    if (!cleanCode) {
      setError('Please enter a code.');
      return;
    }

    try {
      const result = await MockService.validateAndUseCode(cleanCode);
      if (result.valid) {
        // Set session and redirect to the class portal
        sessionStorage.setItem('blink_class_access', 'true');
        // Store code to identify user for referrals/calendar features
        sessionStorage.setItem('blink_user_code', cleanCode);
        navigate('/portal?welcome=true');
      } else {
        // Show specific error message from the service (e.g. "Expired" vs "Invalid")
        setError(result.message || 'Invalid or expired invitation code.');
      }
    } catch (err) {
      setError('Unable to verify code. Please try again later.');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <GlassCard title="Enter Class">
        <p className="text-[#686868] mb-6">
          This class is invite-only. Please enter the unique access code sent to your email.
        </p>
        
        <form onSubmit={handleUnlock} className="space-y-4">
          <div>
             <input 
              type="text" 
              className="w-full text-center text-2xl tracking-widest font-mono uppercase px-4 py-4 rounded-xl bg-white/50 border border-transparent focus:border-[#3B472F] focus:bg-white focus:ring-0 transition-all outline-none text-[#3B472F] placeholder-gray-400"
              placeholder="TCP-XXXXXX"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>

          {stats && (
            <div className="flex justify-center items-center gap-2 text-sm font-medium text-[#686868]/80">
                <span className={`w-2 h-2 rounded-full ${stats.remaining < 5 ? 'bg-red-500' : 'bg-green-500'} animate-pulse`}></span>
                {stats.approved} of {stats.capacity} spots filled
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-red-100 text-red-600 text-sm text-center font-medium animate-pulse">
              {error}
            </div>
          )}

          <Button 
            type="submit" 
            variant="secondary" 
            className="w-full justify-center" 
            isLoading={isChecking}
            disabled={!code || isChecking}
          >
            Unlock Access
          </Button>
        </form>
      </GlassCard>
    </div>
  );
};