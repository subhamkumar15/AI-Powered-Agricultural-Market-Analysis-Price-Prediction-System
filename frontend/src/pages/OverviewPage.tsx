import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Warehouse,
  ShoppingBag,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Sparkles,
  BarChart3,
  Layers,
  MapPin,
  Sprout
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { KPICard } from '../components/common/KPICard';
import { api } from '../services/api';
import { DashboardOverview, CommodityCategory, StateItem } from '../types';

const COLORS = ['#059669', '#10b981', '#34d399', '#6ee7b7', '#f59e0b', '#3b82f6'];

export const OverviewPage: React.FC = () => {
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [categories, setCategories] = useState<CommodityCategory[]>([]);
  const [states, setStates] = useState<StateItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(undefined);
  const [selectedState, setSelectedState] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [overviewRes, catRes, stateRes] = await Promise.all([
          api.getOverview(selectedCategory, selectedState),
          api.getCategories(),
          api.getStates(),
        ]);
        setData(overviewRes);
        setCategories(catRes);
        setStates(stateRes);
      } catch (err) {
        console.error('Failed to load dashboard overview:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedCategory, selectedState]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-500 font-medium">Loading AgriMarket Intelligence Overview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Title & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              NATIONAL AGRICULTURAL INTELLIGENCE
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
              <Clock className="w-3.5 h-3.5" /> Updated {data?.last_sync_time || 'Just now'}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            Indian Agricultural Market Overview
          </h1>
          <p className="text-xs text-slate-500">
            Real-time APMC mandi modal prices, arrival volumes, and AI-predicted market trajectories.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedCategory || ''}
            onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : undefined)}
            className="text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 font-medium text-slate-700 shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={selectedState || ''}
            onChange={(e) => setSelectedState(e.target.value ? Number(e.target.value) : undefined)}
            className="text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 font-medium text-slate-700 shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All States</option>
            {states.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => navigate('/predictions')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Forecasts</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Tracked Commodities"
          value={data?.total_commodities_tracked || 0}
          subtitle="Across Grains, Pulses, Veg & Fruits"
          icon={ShoppingBag}
          iconBgColor="bg-emerald-50"
          iconColor="text-emerald-700"
        />
        <KPICard
          title="Monitored Mandis"
          value={data?.total_mandis_monitored || 0}
          subtitle="Verified APMC & eNAM Yards"
          icon={Warehouse}
          iconBgColor="bg-blue-50"
          iconColor="text-blue-700"
        />
        <KPICard
          title="Average Modal Price"
          value={`₹${(data?.avg_commodity_price || 0).toLocaleString('en-IN')}`}
          subtitle="National weighted average"
          icon={BarChart3}
          trend={1.8}
          trendLabel="vs 7d ago"
          iconBgColor="bg-amber-50"
          iconColor="text-amber-700"
        />
        <KPICard
          title="Total Daily Arrivals"
          value={`${(data?.total_market_arrivals || 0).toLocaleString('en-IN')} MT`}
          subtitle="Metric Tonnes offloaded today"
          icon={Layers}
          trend={-2.4}
          trendLabel="Arrival volume shift"
          iconBgColor="bg-purple-50"
          iconColor="text-purple-700"
        />
      </div>

      {/* Secondary Fast Stats Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-900 to-emerald-950 text-white p-4 rounded-2xl border border-emerald-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Top Market Gainer</span>
            <h4 className="text-lg font-bold mt-0.5">{data?.highest_price_gain_commodity}</h4>
            <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1 mt-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" /> +{data?.highest_price_gain_pct}% this week
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-800/80 flex items-center justify-center text-emerald-300">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500">Sharpest Price Drop</span>
            <h4 className="text-lg font-bold text-slate-900 mt-0.5">{data?.highest_price_drop_commodity}</h4>
            <span className="text-xs font-semibold text-rose-600 flex items-center gap-1 mt-0.5">
              <ArrowDownRight className="w-3.5 h-3.5" /> {data?.highest_price_drop_pct}% this week
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Market Momentum</span>
            <div className="flex items-center gap-3 mt-1">
              <div>
                <span className="text-xs font-bold text-emerald-600">{data?.commodities_increasing} Gainers</span>
              </div>
              <span className="text-slate-300">|</span>
              <div>
                <span className="text-xs font-bold text-rose-600">{data?.commodities_decreasing} Decliners</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">7-day price momentum ratio</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-sm">
            {data?.commodities_increasing}:{data?.commodities_decreasing}
          </div>
        </div>
      </div>

      {/* Main Charts: National Price Trend & Regional Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 30-Day Trend Area Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">National Agricultural Price Trend (30 Days)</h3>
              <p className="text-xs text-slate-500">Composite average modal price across major mandis</p>
            </div>
            <span className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-slate-100 text-slate-600">
              ₹ / Quintal
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.price_trends || []} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} domain={['dataMin - 100', 'dataMax + 100']} />
                <Tooltip
                  formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Avg Price']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                />
                <Area type="monotone" dataKey="avg_modal_price" stroke="#059669" strokeWidth={2.5} fillOpacity={1} fill="url(#priceGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Regional Price Comparison Bar Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900">State-wise Average Prices</h3>
            <p className="text-xs text-slate-500">Average quoting price by primary state</p>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.regional_prices || []} layout="vertical" margin={{ top: 5, right: 10, left: 25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} />
                <YAxis dataKey="state" type="category" tick={{ fontSize: 10, fill: '#475569' }} tickLine={false} />
                <Tooltip
                  formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Avg State Price']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '10px', color: '#fff', fontSize: '11px' }}
                />
                <Bar dataKey="avg_price" fill="#10b981" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Gainers & Losers Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Gainers */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Top Price Gainers (This Week)</h3>
            </div>
            <button
              onClick={() => navigate('/market-tracker')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
            >
              View Tracker →
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {data?.top_gainers?.slice(0, 6).map((item) => (
              <div
                key={item.commodity_id}
                onClick={() => navigate(`/commodities/${item.commodity_name.toLowerCase()}`)}
                className="py-2.5 flex items-center justify-between hover:bg-slate-50/80 px-2 rounded-lg cursor-pointer transition"
              >
                <div>
                  <h5 className="text-xs font-bold text-slate-900">{item.commodity_name}</h5>
                  <span className="text-[10px] text-slate-400">{item.category} • {item.arrival_quantity} MT Arrival</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-900">₹{item.modal_price.toLocaleString('en-IN')}</span>
                  <div className="text-[11px] font-semibold text-emerald-600 flex items-center justify-end gap-0.5">
                    <ArrowUpRight className="w-3 h-3" />+{item.weekly_pct_change}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Losers */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-rose-100 text-rose-800">
                <TrendingDown className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Top Price Decliners (This Week)</h3>
            </div>
            <button
              onClick={() => navigate('/market-risks')}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700"
            >
              View Risk Alerts →
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {data?.top_losers?.slice(0, 6).map((item) => (
              <div
                key={item.commodity_id}
                onClick={() => navigate(`/commodities/${item.commodity_name.toLowerCase()}`)}
                className="py-2.5 flex items-center justify-between hover:bg-slate-50/80 px-2 rounded-lg cursor-pointer transition"
              >
                <div>
                  <h5 className="text-xs font-bold text-slate-900">{item.commodity_name}</h5>
                  <span className="text-[10px] text-slate-400">{item.category} • {item.arrival_quantity} MT Arrival</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-900">₹{item.modal_price.toLocaleString('en-IN')}</span>
                  <div className="text-[11px] font-semibold text-rose-600 flex items-center justify-end gap-0.5">
                    <ArrowDownRight className="w-3 h-3" />{item.weekly_pct_change}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
