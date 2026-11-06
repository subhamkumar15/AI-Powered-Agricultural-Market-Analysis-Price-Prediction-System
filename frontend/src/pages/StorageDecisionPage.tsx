import React, { useState, useEffect } from 'react';
import {
  Warehouse,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Info,
  Calendar,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { Commodity, StorageDecisionResponse } from '../types';

export const StorageDecisionPage: React.FC = () => {
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [selectedCommodityId, setSelectedCommodityId] = useState<number>(1);
  const [quantity, setQuantity] = useState<number>(100);
  const [storageRate, setStorageRate] = useState<number>(25); // ₹/qtl/month
  const [holdingInterest, setHoldingInterest] = useState<number>(0.8); // %/month
  const [wastageRate, setWastageRate] = useState<number>(1.5); // %/month
  const [decisionData, setDecisionData] = useState<StorageDecisionResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchInit = async () => {
      try {
        const cList = await api.getCommodities();
        setCommodities(cList);
        if (cList.length > 0) setSelectedCommodityId(cList[0].id);
      } catch (err) {
        console.error('Failed to load commodities:', err);
      }
    };
    fetchInit();
  }, []);

  const runAnalysis = async () => {
    if (!selectedCommodityId) return;
    setLoading(true);
    try {
      const res = await api.analyzeStorage({
        commodity_id: selectedCommodityId,
        quantity_quintals: quantity,
        monthly_storage_rate_per_qtl: storageRate,
        monthly_holding_interest_pct: holdingInterest,
        monthly_wastage_pct: wastageRate,
      });
      setDecisionData(res);
    } catch (err) {
      console.error('Failed to analyze storage scenarios:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runAnalysis();
  }, [selectedCommodityId, quantity, storageRate, holdingInterest, wastageRate]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            MODULE 13: POST-HARVEST TIMING ADVISORY
          </span>
          <span className="text-xs text-slate-400 font-medium">ML Forecasts • Spoilage & Carrying Cost Modeling</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
          Storage vs Immediate Selling Decision Support
        </h1>
        <p className="text-xs text-slate-500">
          Compare immediate liquidation proceeds against warehouse holding scenarios across 7, 15, 30, and 60 days.
        </p>
      </div>

      {/* Control Strip */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="col-span-2 sm:col-span-1">
          <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Produce / Crop</label>
          <select
            value={selectedCommodityId}
            onChange={(e) => setSelectedCommodityId(Number(e.target.value))}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-bold focus:outline-none"
          >
            {commodities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.perishable ? 'Perishable' : 'Dry Storage'})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Quantity (qtl)</label>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-medium"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Warehouse Rent (₹/qtl/mo)</label>
          <input
            type="number"
            min="0"
            value={storageRate}
            onChange={(e) => setStorageRate(Number(e.target.value))}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-medium"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Holding Interest (%/mo)</label>
          <input
            type="number"
            step="0.1"
            min="0"
            value={holdingInterest}
            onChange={(e) => setHoldingInterest(Number(e.target.value))}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-medium"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Wastage / Shrink (%/mo)</label>
          <input
            type="number"
            step="0.1"
            min="0"
            value={wastageRate}
            onChange={(e) => setWastageRate(Number(e.target.value))}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-medium"
          />
        </div>
      </div>

      {decisionData && (
        <>
          {/* Executive Recommendation Banner */}
          <div className="bg-gradient-to-r from-emerald-900 to-emerald-950 text-white p-6 rounded-2xl border border-emerald-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> AI Recommended Strategy
              </span>
              <h3 className="text-xl font-extrabold mt-1">{decisionData.best_strategy}</h3>
              <p className="text-xs text-emerald-100/90 mt-1 max-w-2xl leading-relaxed">
                {decisionData.decision_summary}
              </p>
            </div>

            <div className="text-right shrink-0 bg-emerald-800/60 p-4 rounded-xl border border-emerald-700/60">
              <span className="text-[10px] text-emerald-300 font-semibold uppercase block">Immediate Liquidation</span>
              <span className="text-xl font-black text-white">
                ₹{decisionData.immediate_selling_revenue.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-emerald-300 block">@ ₹{decisionData.current_price}/qtl today</span>
            </div>
          </div>

          {/* Scenario Comparison Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {decisionData.scenarios.map((scen) => {
              const isProfit = scen.net_gain_vs_immediate > 0;
              return (
                <div
                  key={scen.duration_days}
                  className={`bg-white rounded-2xl p-5 border transition-all ${
                    isProfit
                      ? 'border-emerald-300 shadow-sm hover:shadow-md'
                      : 'border-slate-200/80 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-extrabold text-slate-900">{scen.duration_days} Days Holding</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        isProfit ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {scen.recommendation}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">ML Target Price:</span>
                      <span className="font-bold text-slate-800">₹{scen.projected_price}/qtl</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Warehouse Rent:</span>
                      <span className="text-slate-600">₹{scen.storage_cost}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Capital Holding Cost:</span>
                      <span className="text-slate-600">₹{scen.holding_cost}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Moisture / Spoilage:</span>
                      <span className="text-slate-600">₹{scen.wastage_loss_amount}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Net Proceeds</span>
                      <span className="text-sm font-extrabold text-slate-900">
                        ₹{scen.net_future_proceeds.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Net Gain vs Today</span>
                      <span
                        className={`text-sm font-extrabold ${
                          isProfit ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {isProfit ? `+₹${scen.net_gain_vs_immediate}` : `-₹${Math.abs(scen.net_gain_vs_immediate)}`}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 text-xs text-slate-500 rounded-xl italic flex items-center gap-2">
            <Info className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              Decision-support outputs are derived from time-series machine learning models and empirical storage cost models. They do not constitute guaranteed financial returns.
            </span>
          </div>
        </>
      )}
    </div>
  );
};
