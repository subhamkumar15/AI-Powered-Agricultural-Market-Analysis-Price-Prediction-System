import React from 'react';

interface PriceBadgeProps {
  status: 'LIVE' | 'DELAYED' | 'HISTORICAL' | 'SAMPLE' | string;
}

export const PriceBadge: React.FC<PriceBadgeProps> = ({ status }) => {
  const normalized = status?.toUpperCase() || 'HISTORICAL';

  if (normalized === 'LIVE') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
        LIVE FEED
      </span>
    );
  }

  if (normalized === 'DELAYED') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
        DELAYED
      </span>
    );
  }

  if (normalized === 'SAMPLE') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800 border border-blue-300">
        SAMPLE / SIMULATED
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
      HISTORICAL
    </span>
  );
};
