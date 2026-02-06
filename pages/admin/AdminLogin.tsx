import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '../../components/GlassCard';
import { Button } from '../../components/Button';
import { MockService } from '../../services/mockDb';

export const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const success = await MockService.loginAdmin(password);
    if (success) {
      navigate('/admin/applications');
    } else {
      setError('Invalid password');
    }
    setLoading(false);
  };

  return (
    <div className="w-full max-w-sm">
      <GlassCard title="Admin Portal">
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-sm font-bold text-[#3B472F]">Password</label>
            <input 
              type="password"
              className="w-full px-4 py-2 mt-1 rounded-xl bg-white/50 border border-transparent outline-none focus:ring-2 ring-[#3B472F]/20 text-[#3B472F]"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button type="submit" className="w-full" isLoading={loading}>Login</Button>
        </form>
      </GlassCard>
    </div>
  );
};