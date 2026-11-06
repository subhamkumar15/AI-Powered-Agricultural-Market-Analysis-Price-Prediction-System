import React, { useState, useEffect } from 'react';
import {
  Layers,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  BarChart2,
  Calendar,
  CheckCircle2,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { api } from '../services/api';
import { Commodity } from '../types';

export const SupplyDemandPage: React.FC = () => {
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [selectedCommodityId, setSelectedCommodityId] = useState<number>(1);
  const [overviewData, setOverviewData] = useState<any>(null);
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

  useEffect(() => {
    const fetchSupplyDemand = async () => {
      if (!selectedCommodityId) return;
      setLoading(true);
      try {
        const res = await api.getSupplyDemandOverview(selectedCommodityId, 30);
        setOverviewData(res);
      } catch (err) {
        console.error('Failed to load supply demand:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSupplyDemand();
  }, [selectedCommodityId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
            MODULE 11: PHYSICAL MARKET EQUILIBRIUM
          </span>
          <span className="text-xs text-slate-400 font-medium">Arrival Volume Deviations • Glut & Squeeze Alerts</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
          Supply and Demand Intelligence Dashboard
        </h1>
        <p className="text-xs text-slate-500">
          Monitor mandi arrival volumes, identify unseasonal harvest influxes, and anticipate supply bottlenecks.
        </p>
      </div>

      {/* Control Strip */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div>
          <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Tracked Commodity</label>
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

        {overviewData && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Physical Market Status:</span>
            <span
              className={`px-3 py-1 rounded-xl text-xs font-bold ${
                overviewData.supply_status.includes('Glut')
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : overviewData.supply_status.includes('Squeeze')
                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              }`}
            >
              {overviewData.supply_status}
            </span>
          </div>
        )}
      </div>

      {/* Metric Cards */}
      {overviewData && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-bold uppercase text-slate-400">Latest Daily Arrivals</span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {overviewData.latest_daily_arrival_mt.toLocaleString('en-IN')} <span className="text-xs font-normal">MT</span>
            </div>
            <span className="text-[11px] text-slate-500">Across monitored APMC yards</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-bold uppercase text-slate-400">30-Day Mean Arrivals</span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {overviewData.average_daily_arrival_mt.toLocaleString('en-IN')} <span className="text-xs font-normal">MT/day</span>
            </div>
            <span className="text-[11px] text-slate-500">Baseline historical average</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-bold uppercase text-slate-400">Arrival Deviation</span>
            <div
              className={`text-2xl font-black mt-1 ${
                overviewData.arrival_deviation_pct > 0 ? 'text-emerald-700' : 'text-rose-600'
              }`}
            >
              {overviewData.arrival_deviation_pct > 0
                ? `+${overviewData.arrival_deviation_pct}%`
                : `${overviewData.arrival_deviation_pct}%`}
            </div>
            <span className="text-[11px] text-slate-500">vs 30-day baseline equilibrium</span>
          </div>
        </div>
      )}

      {/* Arrival Volumes Chart */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            30-Day Daily Mandi Arrivals (MT) vs Modal Price (₹/qtl)
          </h3>
          <p className="text-xs text-slate-500">
            Evaluating arrival compression versus auction price elasticities.
          </p>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={overviewData?.arrivals_trend || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#059669' }} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar yAxisId="left" dataKey="arrival_quantity" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Arrivals (MT)" />
              <Line yAxisId="right" type="monotone" dataKey="modal_price" stroke="#059669" strokeWidth={2.5} dot={false} name="Modal Price (₹/qtl)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 text-xs text-slate-500 rounded-xl flex items-start gap-2">
          <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <span>
            <strong>Data Disclosure:</strong> Mandi arrival quantities represent offloaded truck manifests recorded across APMC gate registers. Retail consumption demand is modeled econometrically from urban terminal throughput.
          </span>
        </div>
      </div>
    </div>
  );
};
