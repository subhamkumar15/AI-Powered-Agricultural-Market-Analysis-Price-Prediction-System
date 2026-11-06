import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  Sparkles,
  CloudRain,
  Bookmark,
  BookmarkCheck,
  ShieldCheck,
  Calendar,
  Layers,
  BarChart3,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar
} from 'recharts';
import { api } from '../services/api';
import {
  Commodity,
  PriceHistoryResponse,
  PredictionResult,
  WeatherCorrelationData
} from '../types';

export const CommodityDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [commodity, setCommodity] = useState<Commodity | null>(null);
  const [historyData, setHistoryData] = useState<PriceHistoryResponse | null>(null);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [weatherCorr, setWeatherCorr] = useState<WeatherCorrelationData | null>(null);
  const [horizonDays, setHorizonDays] = useState<number>(30);
  const [isWatchlisted, setIsWatchlisted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingForecast, setLoadingForecast] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'history' | 'forecast' | 'weather' | 'arrivals'>('history');

  useEffect(() => {
    const fetchDetails = async () => {
      if (!slug) return;
      setLoading(true);
      try {
        const comm = await api.getCommodityDetail(slug);
        setCommodity(comm);

        // Fetch price history, ML prediction, and weather correlation in parallel
        const [hist, pred, wCorr] = await Promise.all([
          api.getPriceHistory(comm.id, undefined, 90),
          api.generatePrediction(comm.id, horizonDays).catch(() => null),
          api.getWeatherCorrelation(comm.id).catch(() => null),
        ]);

        setHistoryData(hist);
        if (pred) setPrediction(pred);
        if (wCorr) setWeatherCorr(wCorr);
      } catch (err) {
        console.error('Failed to load commodity details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [slug]);

  const handleHorizonChange = async (days: number) => {
    setHorizonDays(days);
    if (!commodity) return;
    setLoadingForecast(true);
    try {
      const pred = await api.generatePrediction(commodity.id, days);
      setPrediction(pred);
    } catch (err) {
      console.warn('Forecast error:', err);
    } finally {
      setLoadingForecast(false);
    }
  };

  const handleToggleWatchlist = async () => {
    if (!commodity) return;
    try {
      await api.toggleWatchlist(commodity.id);
      setIsWatchlisted(!isWatchlisted);
    } catch (err) {
      console.warn('Watchlist toggle error:', err);
    }
  };

  if (loading || !commodity) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-500 font-medium">Loading comprehensive commodity intelligence...</p>
        </div>
      </div>
    );
  }

  const isWeeklyGain = (commodity.weekly_pct_change || 0) >= 0;

  return (
    <div className="space-y-6">
      {/* Back button & top bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/commodities')}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Commodity Directory
        </button>

        <button
          onClick={handleToggleWatchlist}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
            isWatchlisted
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          {isWatchlisted ? <BookmarkCheck className="w-4 h-4 fill-emerald-700" /> : <Bookmark className="w-4 h-4" />}
          <span>{isWatchlisted ? 'In Watchlist' : 'Add to Watchlist'}</span>
        </button>
      </div>

      {/* Hero Commodity Card */}
      <div className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-200/90 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                {commodity.category_name}
              </span>
              {commodity.msp_applicable && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" /> Government MSP Protected
                </span>
              )}
              {commodity.perishable && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                  Perishable Produce
                </span>
              )}
            </div>

            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{commodity.name}</h1>
            <p className="text-sm text-slate-600 mt-2 max-w-2xl leading-relaxed">{commodity.description}</p>

            <div className="mt-4 flex items-center gap-6 text-xs text-slate-500">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Standard Unit</span>
                <span className="font-semibold text-slate-800">{commodity.unit}</span>
              </div>
              <div className="h-6 w-px bg-slate-200" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Safe Storability</span>
                <span className="font-semibold text-slate-800">{commodity.shelf_life_days} Days</span>
              </div>
              {commodity.msp_price && (
                <>
                  <div className="h-6 w-px bg-slate-200" />
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">2025-26 Central MSP</span>
                    <span className="font-bold text-amber-700">₹{commodity.msp_price.toLocaleString('en-IN')}/qtl</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Price Snapshot Box */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/90 text-right min-w-[220px]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Current Modal Price</span>
            <div className="text-3xl font-extrabold text-slate-900 mt-1">
              ₹{commodity.current_modal_price?.toLocaleString('en-IN') || '—'}
            </div>

            <div className="mt-2 flex items-center justify-end gap-1.5 text-xs font-bold">
              <span className={isWeeklyGain ? 'text-emerald-600' : 'text-rose-600'}>
                {isWeeklyGain ? `+${commodity.weekly_pct_change}%` : `${commodity.weekly_pct_change}%`}
              </span>
              <span className="text-slate-400 text-[10px] font-normal">vs last week</span>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-200 text-slate-600 text-[11px] space-y-1">
              <div className="flex justify-between">
                <span>7d Min:</span>
                <span className="font-semibold text-slate-900">₹{commodity.min_price || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span>7d Max:</span>
                <span className="font-semibold text-slate-900">₹{commodity.max_price || '—'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        {[
          { key: 'history', label: 'Price Trends & Moving Averages', icon: BarChart3 },
          { key: 'forecast', label: 'AI Machine Learning Forecast', icon: Sparkles },
          { key: 'arrivals', label: 'Mandi Arrival Volumes', icon: Layers },
          { key: 'weather', label: 'Weather Correlation Dynamics', icon: CloudRain },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 py-3 px-4 font-bold text-xs border-b-2 transition ${
                isActive
                  ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50 rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Historical Prices & Moving Averages */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  90-Day Historical Modal Price & Moving Averages (MA-7, MA-30)
                </h3>
                <p className="text-xs text-slate-500">
                  Technical trend overlays indicating short and medium term support/resistance levels.
                </p>
              </div>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyData?.history || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} domain={['dataMin - 50', 'dataMax + 50']} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                  />
                  <Line type="monotone" dataKey="modal_price" name="Modal Price" stroke="#047857" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="ma_7" name="7-Day MA" stroke="#3b82f6" strokeWidth={1.8} strokeDasharray="3 3" dot={false} />
                  <Line type="monotone" dataKey="ma_30" name="30-Day MA" stroke="#f59e0b" strokeWidth={1.8} strokeDasharray="5 5" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Historical Stats Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">90-Day Low</span>
                <span className="font-extrabold text-slate-800 text-sm">
                  ₹{historyData?.stats.historical_min.toLocaleString('en-IN') || '—'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">90-Day High</span>
                <span className="font-extrabold text-slate-800 text-sm">
                  ₹{historyData?.stats.historical_max.toLocaleString('en-IN') || '—'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Historical Mean</span>
                <span className="font-extrabold text-slate-800 text-sm">
                  ₹{historyData?.stats.historical_avg.toLocaleString('en-IN') || '—'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Price Volatility (σ)</span>
                <span className="font-extrabold text-slate-800 text-sm">
                  ± ₹{historyData?.stats.volatility || '—'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AI ML Price Forecast */}
      {activeTab === 'forecast' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-purple-600" /> Walk-Forward Machine Learning Model
                  </span>
                  <span className="text-xs text-slate-500 font-medium">Model: {prediction?.model_name}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  Predictive Price Trajectory & Confidence Band
                </h3>
              </div>

              {/* Horizon Selector */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                {[7, 15, 30, 60, 90].map((d) => (
                  <button
                    key={d}
                    onClick={() => handleHorizonChange(d)}
                    disabled={loadingForecast}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      horizonDays === d
                        ? 'bg-white text-emerald-800 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {d} Days
                  </button>
                ))}
              </div>
            </div>

            {loadingForecast ? (
              <div className="h-72 flex items-center justify-center text-xs text-slate-500">
                Running walk-forward inference pipeline...
              </div>
            ) : (
              <>
                {/* Metric Summary Box */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 mb-6 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Predicted Target Price</span>
                    <span className="text-lg font-extrabold text-emerald-700">
                      ₹{prediction?.predicted_modal_price.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-slate-400 block">By {prediction?.target_date}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Expected Price Band</span>
                    <span className="text-sm font-bold text-slate-800">
                      ₹{prediction?.expected_min_price} – ₹{prediction?.expected_max_price}
                    </span>
                    <span className="text-[10px] text-slate-400 block">Prediction Interval</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Directional Bias</span>
                    <span
                      className={`text-sm font-bold ${
                        prediction?.market_direction === 'Bullish'
                          ? 'text-emerald-600'
                          : prediction?.market_direction === 'Bearish'
                          ? 'text-rose-600'
                          : 'text-slate-600'
                      }`}
                    >
                      {prediction?.market_direction} ({(prediction?.predicted_pct_change ?? 0) > 0 ? `+${prediction?.predicted_pct_change}%` : `${prediction?.predicted_pct_change}%`})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Model Confidence & R²</span>
                    <span className="text-sm font-bold text-slate-800">
                      {Math.round((prediction?.confidence_score || 0.85) * 100)}% Confidence (R²: {prediction?.metrics.r2})
                    </span>
                  </div>
                </div>

                {/* Forecast Chart */}
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={prediction?.forecast_series || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="forecastBand" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} domain={['dataMin - 30', 'dataMax + 30']} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                      />
                      <Area type="monotone" dataKey="upper_bound" stroke="#a78bfa" strokeDasharray="2 2" fill="url(#forecastBand)" name="Upper Bound" />
                      <Area type="monotone" dataKey="lower_bound" stroke="#a78bfa" strokeDasharray="2 2" fill="none" name="Lower Bound" />
                      <Line type="monotone" dataKey="predicted_price" stroke="#7c3aed" strokeWidth={2.5} dot={false} name="Forecast Modal" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Key Drivers */}
                <div className="mt-6 pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                    Key Influencing Factors (Feature Importances)
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {Object.entries(prediction?.influencing_factors || {}).map(([factor, weight]) => (
                      <div key={factor} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs flex justify-between items-center">
                        <span className="font-medium text-slate-700 capitalize">{factor.replace(/_/g, ' ')}</span>
                        <span className="font-bold text-emerald-700">{Math.round((weight as number) * 100)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Mandi Arrivals */}
      {activeTab === 'arrivals' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Mandi Daily Arrival Quantities (MT)</h3>
          <p className="text-xs text-slate-500 mb-4">
            Volume of produce unloaded in tracked APMC yards. Inversely correlates with price pressure.
          </p>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={historyData?.history || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} />
                <Tooltip
                  formatter={(val: any) => [`${val} MT`, 'Arrivals']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                />
                <Bar dataKey="arrival_quantity" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* TAB 4: Weather Correlation */}
      {activeTab === 'weather' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Meteorological Sensitivity & Correlation Analysis</h3>
            <p className="text-xs text-slate-500">
              Statistical relationship between ambient precipitation, thermal extremes, and mandi pricing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                Rainfall vs Price Correlation (Pearson r)
              </span>
              <div className="text-2xl font-extrabold text-emerald-900 mt-1">
                {weatherCorr?.pearson_rainfall_price || 0}
              </div>
              <p className="text-xs text-emerald-800 mt-2 leading-relaxed">
                {weatherCorr?.rainfall_impact_summary}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                Temperature vs Price Correlation (Pearson r)
              </span>
              <div className="text-2xl font-extrabold text-amber-900 mt-1">
                {weatherCorr?.pearson_temp_price || 0}
              </div>
              <p className="text-xs text-amber-800 mt-2 leading-relaxed">
                {weatherCorr?.temp_impact_summary}
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 italic">
            <strong>Scientific Disclaimer:</strong> {weatherCorr?.disclaimer}
          </div>
        </div>
      )}
    </div>
  );
};
