import React, { useState, useEffect } from 'react';
import {
  Sprout,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Info,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { api } from '../services/api';
import { MSPRecordItem } from '../types';

export const MSPIntelligencePage: React.FC = () => {
  const [mspRecords, setMspRecords] = useState<MSPRecordItem[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('2025-26');
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const [onlyBelowMsp, setOnlyBelowMsp] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchMSP = async () => {
      setLoading(true);
      try {
        const res = await api.getMSPRecords(selectedYear, selectedSeason || undefined);
        setMspRecords(res);
      } catch (err) {
        console.error('Failed to load MSP records:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMSP();
  }, [selectedYear, selectedSeason]);

  const displayedRecords = onlyBelowMsp ? mspRecords.filter((m) => m.is_below_msp) : mspRecords;
  const belowMspCount = mspRecords.filter((m) => m.is_below_msp).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
            MODULE 10: MINIMUM SUPPORT PRICE BENCHMARK
          </span>
          <span className="text-xs text-slate-400 font-medium">CACP Cost of Production • Distress Price Detection</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
          Minimum Support Price (MSP) Intelligence
        </h1>
        <p className="text-xs text-slate-500">
          Track official Government MSP benchmarks against prevailing APMC modal auction rates and detect distress selling discounts.
        </p>
      </div>

      {/* Distress Selling Alert Banner if any below MSP */}
      {belowMspCount > 0 && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-100 text-rose-700 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-rose-900">
                {belowMspCount} MSP-Notified Commodities Trading Below Government Support Benchmark
              </h4>
              <p className="text-[11px] text-rose-700 mt-0.5">
                Farmers in affected mandis are strongly advised to seek NAFED/CCI/FCI procurement centers or pledge produce via e-NWR warehouse receipts.
              </p>
            </div>
          </div>
          <button
            onClick={() => setOnlyBelowMsp(!onlyBelowMsp)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600 text-white shrink-0 hover:bg-rose-700 transition"
          >
            {onlyBelowMsp ? 'Show All MSP Crops' : 'Filter Distress Crops'}
          </button>
        </div>
      )}

      {/* Control Strip */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">MSP Marketing Season</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-bold focus:outline-none"
            >
              <option value="2025-26">2025-26 (Latest Cabinet Notified)</option>
              <option value="2024-25">2024-25</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Season</label>
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none"
            >
              <option value="">All Crop Seasons</option>
              <option value="Kharif">Kharif Crops</option>
              <option value="Rabi">Rabi Crops</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={onlyBelowMsp}
              onChange={(e) => setOnlyBelowMsp(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span>Show Only Distress Selling (&lt; MSP)</span>
          </label>
        </div>
      </div>

      {/* MSP Comparison Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Commodity</th>
                <th className="py-3 px-4">Season</th>
                <th className="py-3 px-4 text-right">Official MSP</th>
                <th className="py-3 px-4 text-right">Cost of Production (A2+FL)</th>
                <th className="py-3 px-4 text-right">Mandated Return Margin</th>
                <th className="py-3 px-4 text-right">Current Mandi Modal</th>
                <th className="py-3 px-4 text-right">Spread vs MSP</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedRecords.map((row, idx) => {
                const diff = row.difference_pct ?? 0;
                const isBelow = row.is_below_msp;

                return (
                  <tr key={idx} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">{row.commodity_name}</td>
                    <td className="py-3 px-4 font-medium text-slate-600">{row.season}</td>
                    <td className="py-3 px-4 text-right font-extrabold text-amber-800 text-sm">
                      ₹{row.msp_price.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500 font-medium">
                      ₹{row.cost_of_production ? row.cost_of_production.toLocaleString('en-IN') : '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-700">
                      {row.margin_percent ? `+${row.margin_percent}%` : '50%'}
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-slate-900 text-sm">
                      ₹{row.current_modal_price ? row.current_modal_price.toLocaleString('en-IN') : '—'}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-bold ${
                        isBelow ? 'text-rose-600' : 'text-emerald-700'
                      }`}
                    >
                      {diff > 0 ? `+${diff}%` : `${diff}%`}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {isBelow ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                          BELOW MSP
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          ABOVE MSP
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-3 bg-slate-50 border border-slate-200 text-xs text-slate-500 rounded-xl italic flex items-center gap-2">
        <Info className="w-4 h-4 text-slate-400 shrink-0" />
        <span>
          MSP figures reflect official Ministry of Agriculture & Farmers Welfare notifications. In open market private auctions, prices fluctuate based on physical demand, grade quality, and moisture.
        </span>
      </div>
    </div>
  );
};
