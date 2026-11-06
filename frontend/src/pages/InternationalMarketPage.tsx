import React, { useState } from 'react';
import {
  Globe2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  Ship,
  Info
} from 'lucide-react';

export const InternationalMarketPage: React.FC = () => {
  const globalCommodities = [
    {
      name: 'CBOT Soft Red Winter Wheat',
      symbol: 'ZW (CBOT)',
      international_usd: '$5.85 / Bushel',
      inr_equivalent_qtl: 1825,
      domestic_indian_mandi: 2450,
      parity: '+34.2% Premium (Domestic)',
      trend: '+1.4%',
      isGain: true,
      notes: 'Domestic prices trade at a premium due to government procurement buffer stocking and export quotas.',
    },
    {
      name: 'Thai White Rice (5% Broken)',
      symbol: 'THAI-5',
      international_usd: '$545 / MT FOB',
      inr_equivalent_qtl: 4575,
      domestic_indian_mandi: 3400,
      parity: '-25.6% Discount (Indian Export)',
      trend: '-0.8%',
      isGain: false,
      notes: 'Indian non-basmati rice remains competitive in West African and Middle Eastern import destinations.',
    },
    {
      name: 'CBOT Yellow Corn (Maize)',
      symbol: 'ZC (CBOT)',
      international_usd: '$4.30 / Bushel',
      inr_equivalent_qtl: 1420,
      domestic_indian_mandi: 2280,
      parity: '+60.5% Premium (Domestic)',
      trend: '+0.5%',
      isGain: true,
      notes: 'Strong domestic poultry feed and ethanol blending demand keeps local rates firm.',
    },
    {
      name: 'ICE Cotton No. 2',
      symbol: 'CT (ICE)',
      international_usd: '72.4¢ / lb',
      inr_equivalent_qtl: 6850,
      domestic_indian_mandi: 7150,
      parity: '+4.3% Parity Spread',
      trend: '-1.2%',
      isGain: false,
      notes: 'Indian Shankar-6 quotes near international parity. Mill intake remains stable.',
    },
    {
      name: 'CBOT Soybean',
      symbol: 'ZS (CBOT)',
      international_usd: '$10.20 / Bushel',
      inr_equivalent_qtl: 3180,
      domestic_indian_mandi: 4650,
      parity: '+46.2% Domestic Import Duty Buffer',
      trend: '+2.1%',
      isGain: true,
      notes: 'Protected by import tariffs on edible crude degummed soybean oil.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
            MODULE 17: GLOBAL AGRI-COMMODITY BENCHMARKS
          </span>
          <span className="text-xs text-slate-400 font-medium">CBOT • ICE • FOB Parities • USD/INR Reference: 83.90</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
          International Agricultural Market Intelligence
        </h1>
        <p className="text-xs text-slate-500">
          Compare Indian domestic APMC mandi clearing prices with international commodity futures (Chicago CBOT, ICE) and export FOB benchmarks.
        </p>
      </div>

      {/* Global Commodity Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {globalCommodities.map((item, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4 hover:shadow-md transition"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {item.symbol}
                </span>
                <h3 className="text-base font-extrabold text-slate-900 mt-0.5">{item.name}</h3>
              </div>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                  item.isGain ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                }`}
              >
                {item.trend}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Global Benchmark</span>
                <span className="font-extrabold text-slate-800">{item.international_usd}</span>
                <span className="text-[10px] text-slate-500 block">≈ ₹{item.inr_equivalent_qtl}/qtl landed</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-emerald-700 block">Indian Mandi Modal</span>
                <span className="font-extrabold text-emerald-800 text-sm">
                  ₹{item.domestic_indian_mandi.toLocaleString('en-IN')}/qtl
                </span>
                <span className="text-[10px] font-bold text-emerald-600 block">{item.parity}</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">{item.notes}</p>
          </div>
        ))}
      </div>

      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 flex items-start gap-2">
        <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <span>
          <strong>Methodological Note:</strong> International price comparisons reflect standardized grade equivalents adjusted for USD/INR currency conversion, freight basis (FOB/CIF), and prevailing import duty schedules.
        </span>
      </div>
    </div>
  );
};
