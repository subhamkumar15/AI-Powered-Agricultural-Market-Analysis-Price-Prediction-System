import React, { useState, useEffect } from 'react';
import {
  GitCompare,
  TrendingUp,
  TrendingDown,
  Warehouse,
  CheckCircle,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { api } from '../services/api';
import { Commodity, Market } from '../types';

const LINE_COLORS = ['#059669', '#2563eb', '#d97706', '#9333ea', '#dc2626', '#0891b2'];

export const MandiComparisonPage: React.FC = () => {
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [selectedCommodityId, setSelectedCommodityId] = useState<number>(1);
  const [selectedMarketIds, setSelectedMarketIds] = useState<number[]>([]);
  const [comparisonResult, setComparisonResult] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchInit = async () => {
      try {
        const [cList, mList] = await Promise.all([api.getCommodities(), api.getMarkets()]);
        setCommodities(cList);
        setMarkets(mList);
        if (cList.length > 0) setSelectedCommodityId(cList[0].id);
        if (mList.length >= 3) {
          setSelectedMarketIds([mList[0].id, mList[1].id, mList[2].id]);
        }
      } catch (err) {
        console.error('Failed to load comparison init data:', err);
      }
    };
    fetchInit();
  }, []);

  const runComparison = async () => {
    if (!selectedCommodityId) return;
    setLoading(true);
    try {
      const idsStr = selectedMarketIds.length > 0 ? selectedMarketIds.join(',') : undefined;
      const res = await api.compareMandis(selectedCommodityId, idsStr, 30);
      setComparisonResult(res);
    } catch (err) {
      console.error('Failed to compare mandis:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runComparison();
  }, [selectedCommodityId, selectedMarketIds]);

  const toggleMarket = (id: number) => {
    if (selectedMarketIds.includes(id)) {
      if (selectedMarketIds.length > 1) {
        setSelectedMarketIds(selectedMarketIds.filter((m) => m !== id));
      }
    } else {
      if (selectedMarketIds.length < 5) {
        setSelectedMarketIds([...selectedMarketIds, id]);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            MODULE 7: MULTI-MARKET BENCHMARKING
          </span>
          <span className="text-xs text-slate-400 font-medium">Inter-Mandi Spreads & Price Leadership</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
          Mandi Price Comparison Engine
        </h1>
        <p className="text-xs text-slate-500">
          Compare auction clearing prices across multiple APMC yards to discover premium trading hubs and inter-mandi spreads.
        </p>
      </div>

      {/* Control Strip */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div>
          <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Select Commodity to Compare</label>
          <select
            value={selectedCommodityId}
            onChange={(e) => setSelectedCommodityId(Number(e.target.value))}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-bold focus:outline-none"
          >
            {commodities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.category_name})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] font-bold uppercase text-slate-400 block mb-2">
            Select Mandis to Compare (Up to 5)
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            {markets.slice(0, 16).map((m) => {
              const isSelected = selectedMarketIds.includes(m.id);
              return (
                <button
                  key={m.id}
                  onClick={() => toggleMarket(m.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    isSelected
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {m.name} ({m.state_name})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Extremes Highlights Strip */}
      {comparisonResult && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase text-emerald-600">Highest Quoting Mandi</span>
              <h4 className="text-base font-extrabold text-slate-900 mt-0.5">
                {comparisonResult.highest_priced_mandi?.market_name}
              </h4>
              <span className="text-xl font-black text-emerald-700 mt-1 block">
                ₹{comparisonResult.highest_priced_mandi?.latest_modal_price.toLocaleString('en-IN')}{' '}
                <span className="text-xs font-normal text-slate-400">/qtl</span>
              </span>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 font-bold text-xs">
              Rank #1
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase text-rose-500">Lowest Quoting Mandi</span>
              <h4 className="text-base font-extrabold text-slate-900 mt-0.5">
                {comparisonResult.lowest_priced_mandi?.market_name}
              </h4>
              <span className="text-xl font-black text-rose-600 mt-1 block">
                ₹{comparisonResult.lowest_priced_mandi?.latest_modal_price.toLocaleString('en-IN')}{' '}
                <span className="text-xs font-normal text-slate-400">/qtl</span>
              </span>
            </div>
            <div className="p-3 bg-rose-50 rounded-xl text-rose-600 font-bold text-xs">
              Lowest
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400">Inter-Mandi Price Spread</span>
              <h4 className="text-xl font-black text-slate-900 mt-1">
                ₹{comparisonResult.price_spread.toLocaleString('en-IN')}{' '}
                <span className="text-xs font-normal text-slate-400">/qtl</span>
              </h4>
              <span className="text-xs text-slate-500 mt-0.5 block">Gross Arbitrage Differential</span>
            </div>
            <div className="p-3 bg-slate-100 rounded-xl text-slate-700 font-bold text-xs">
              Spread
            </div>
          </div>
        </div>
      )}

      {/* Rankings Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Mandi Price League Table: {comparisonResult?.commodity_name}
          </h3>
          <span className="text-[11px] text-slate-400">Sorted by highest modal price</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Mandi Name</th>
                <th className="py-3 px-4">State</th>
                <th className="py-3 px-4 text-right">Modal Price</th>
                <th className="py-3 px-4 text-right">Min – Max Spread</th>
                <th className="py-3 px-4 text-right">Daily Arrivals</th>
                <th className="py-3 px-4 text-right">Difference vs #1</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {comparisonResult?.rankings?.map((r: any) => {
                const diff = (r.latest_modal_price - comparisonResult.highest_priced_mandi.latest_modal_price);
                return (
                  <tr key={r.market_id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-bold text-slate-500">#{r.rank}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{r.market_name}</td>
                    <td className="py-3 px-4 text-slate-600">{r.state_name}</td>
                    <td className="py-3 px-4 text-right font-extrabold text-emerald-700 text-sm">
                      ₹{r.latest_modal_price.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600 font-medium">
                      ₹{r.min_price} – ₹{r.max_price}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-800 font-semibold">
                      {r.arrival_quantity} MT
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-rose-600">
                      {diff === 0 ? 'Benchmark' : `- ₹${Math.abs(diff)}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
