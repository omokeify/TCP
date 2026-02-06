import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', title, subtitle }) => {
  return (
    <div className={`relative overflow-hidden bg-[#EDEDED]/60 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] rounded-3xl p-6 md:p-8 ${className}`}>
      
      {/* Glossy reflection effect */}
      <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />

      {(title || subtitle) && (
        <div className="mb-6 relative z-10">
          {title && <h2 className="text-3xl font-bold text-[#3B472F] tracking-tight">{title}</h2>}
          {subtitle && <p className="text-[#686868] mt-2 font-medium">{subtitle}</p>}
        </div>
      )}
      
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};