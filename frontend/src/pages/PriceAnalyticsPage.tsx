import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend
} from 'recharts';
import {
  TrendingUp,
  Activity,
  Sliders,
  Calendar,
  Layers,
  BarChart2,
  Percent
} from 'lucide-react';
import { api } from '../services/api';
import { Commodity, Market, PriceHistoryResponse } from '../types';

export const PriceAnalyticsPage: React.FC = () => {
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [selectedCommodityId, setSelectedCommodityId] = useState<number>(1);
  const [selectedMarketId, setSelectedMarketId] = useState<number | undefined>(undefined);
  const [days, setDays] = useState<number>(90);
  const [analyticsData, setAnalyticsData] = useState<PriceHistoryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const [cList, mList] = await Promise.all([api.getCommodities(), api.getMarkets()]);
        setCommodities(cList);
        setMarkets(mList);
        if (cList.length > 0) setSelectedCommodityId(cList[0].id);
      } catch (err) {
        console.error('Failed to load filter items:', err);
      }
    };
    fetchDropdowns();
  }, []);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!selectedCommodityId) return;
      setLoading(true);
      try {
        const res = await api.getPriceHistory(selectedCommodityId, selectedMarketId, days);
        setAnalyticsData(res);
      } catch (err) {
        console.error('Failed to load price analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [selectedCommodityId, selectedMarketId, days]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            MODULE 4: QUANTITATIVE PRICE ANALYTICS
          </span>
          <span className="text-xs text-slate-400 font-medium">Moving Averages • Volatility Bands</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
          Advanced Agricultural Price Analytics Engine
        </h1>
        <p className="text-xs text-slate-500">
          Statistical indicators, 7/30/90-day moving averages, historical volatility, and arrival-price elasticity.
        </p>
      </div>

      {/* Control Strip */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Commodity</label>
            <select
              value={selectedCommodityId}
              onChange={(e) => setSelectedCommodityId(Number(e.target.value))}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-bold focus:outline-none"
            >
              {commodities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Mandi Yard</label>
            <select
              value={selectedMarketId || ''}
              onChange={(e) => setSelectedMarketId(e.target.value ? Number(e.target.value) : undefined)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none"
            >
              <option value="">National Composite Average</option>
              {markets.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.state_name})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Days selector */}
        <div>
          <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Lookback Period</label>
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            {[30, 60, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  days === d ? 'bg-emerald-700 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {d} Days
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards for Statistical Indicators */}
      {analyticsData && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Modal</span>
            <div className="text-xl font-extrabold text-slate-900 mt-1">
              ₹{analyticsData.stats.current_modal.toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-slate-500 font-medium">₹ / Quintal</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mean Historical</span>
            <div className="text-xl font-extrabold text-slate-900 mt-1">
              ₹{analyticsData.stats.historical_avg.toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-slate-500 font-medium">{days}-Day Mean</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Price Volatility (σ)</span>
            <div className="text-xl font-extrabold text-amber-700 mt-1">
              ± ₹{analyticsData.stats.volatility}
            </div>
            <span className="text-[11px] text-slate-500 font-medium">Standard Deviation</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mean Deviation</span>
            <div
              className={`text-xl font-extrabold mt-1 ${
                analyticsData.stats.deviation_from_avg_pct >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {analyticsData.stats.deviation_from_avg_pct > 0 ? `+${analyticsData.stats.deviation_from_avg_pct}%` : `${analyticsData.stats.deviation_from_avg_pct}%`}
            </div>
            <span className="text-[11px] text-slate-500 font-medium">From historical avg</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs col-span-2 lg:col-span-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Observed Range</span>
            <div className="text-sm font-extrabold text-slate-800 mt-1.5">
              ₹{analyticsData.stats.historical_min} – ₹{analyticsData.stats.historical_max}
            </div>
            <span className="text-[11px] text-slate-500 font-medium">Spread: ₹{analyticsData.stats.historical_max - analyticsData.stats.historical_min}</span>
          </div>
        </div>
      )}

      {/* Main Technical Price Chart (Modal + 7d MA + 30d MA + High/Low spread) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Moving Average Technical Overlay</h3>
            <p className="text-xs text-slate-500">
              Golden cross & death cross indicators based on 7-day and 30-day moving averages.
            </p>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={analyticsData?.history || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} domain={['dataMin - 50', 'dataMax + 50']} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Line type="monotone" dataKey="modal_price" name="Modal Price" stroke="#059669" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="ma_7" name="7-Day Moving Avg" stroke="#2563eb" strokeWidth={2} dot={false} strokeDasharray="3 3" />
              <Line type="monotone" dataKey="ma_30" name="30-Day Moving Avg" stroke="#d97706" strokeWidth={2} dot={false} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Arrival Volumes vs Modal Price (Dual Axis style) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Mandi Arrival Volume vs Price Elasticity</h3>
          <p className="text-xs text-slate-500">
            Evaluating arrival surges against mandi price pressure.
          </p>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analyticsData?.history || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} />
              <Tooltip
                formatter={(val: any) => [`${val} MT`, 'Arrivals']}
                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
              />
              <Bar dataKey="arrival_quantity" fill="#10b981" radius={[4, 4, 0, 0]} name="Arrival Volume (MT)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
