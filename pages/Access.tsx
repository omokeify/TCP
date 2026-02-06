import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '../components/GlassCard';
import { Button } from '../components/Button';
import { MockService } from '../services/mockDb';

export const Access: React.FC = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState('');

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsChecking(true);
    setError('');

    try {
      const isValid = await MockService.validateAndUseCode(code.trim().toUpperCase());
      if (isValid) {
        // In a real app, set a session token here
        sessionStorage.setItem('blink_class_access', 'true');
        navigate('/content');
      } else {
        setError('Invalid or expired invitation code.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
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
              placeholder="BLINK-XXXXXX"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-100 text-red-600 text-sm text-center font-medium">
              {error}
            </div>
          )}

          <Button 
            type="submit" 
            variant="secondary" 
            className="w-full justify-center" 
            isLoading={isChecking}
            disabled={!code}
          >
            Unlock Access
          </Button>
        </form>
      </GlassCard>
    </div>
  );
};