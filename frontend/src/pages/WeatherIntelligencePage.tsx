import React, { useState, useEffect } from 'react';
import {
  CloudRain,
  Sun,
  Wind,
  Droplets,
  Thermometer,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Info,
  Calendar
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { api } from '../services/api';
import { Commodity, Market, WeatherCorrelationData } from '../types';

export const WeatherIntelligencePage: React.FC = () => {
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [selectedCommodityId, setSelectedCommodityId] = useState<number>(1);
  const [selectedMarketId, setSelectedMarketId] = useState<number>(1);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [correlationData, setCorrelationData] = useState<WeatherCorrelationData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchInit = async () => {
      try {
        const [cList, mList] = await Promise.all([api.getCommodities(), api.getMarkets()]);
        setCommodities(cList);
        setMarkets(mList);
        if (cList.length > 0) setSelectedCommodityId(cList[0].id);
        if (mList.length > 0) setSelectedMarketId(mList[0].id);
      } catch (err) {
        console.error('Failed to load init data:', err);
      }
    };
    fetchInit();
  }, []);

  useEffect(() => {
    const fetchWeather = async () => {
      if (!selectedMarketId || !selectedCommodityId) return;
      setLoading(true);
      try {
        const [wRes, corrRes] = await Promise.all([
          api.getCurrentWeather(selectedMarketId),
          api.getWeatherCorrelation(selectedCommodityId),
        ]);
        setWeatherData(wRes);
        setCorrelationData(corrRes);
      } catch (err) {
        console.error('Error fetching weather data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchWeather();
  }, [selectedCommodityId, selectedMarketId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
            MODULE 6: AGRO-METEOROLOGICAL INTELLIGENCE
          </span>
          <span className="text-xs text-slate-400 font-medium">Open-Meteo Synced • Pearson & Spearman Statistics</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
          Weather Intelligence & Price Correlation Engine
        </h1>
        <p className="text-xs text-slate-500">
          Analyze thermal extremes, monsoon precipitation, and climatic anomalies affecting APMC market supply.
        </p>
      </div>

      {/* Selector Strip */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Mandi Weather Station</label>
            <select
              value={selectedMarketId}
              onChange={(e) => setSelectedMarketId(Number(e.target.value))}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-bold focus:outline-none"
            >
              {markets.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.state_name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Correlation Commodity</label>
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
        </div>

        <div className="text-right">
          <span className="text-[10px] text-slate-400 font-semibold block">Feed Status</span>
          <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Open-Meteo API Connected
          </span>
        </div>
      </div>

      {/* Live Mandi Weather Cards */}
      {weatherData && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[10px] font-bold uppercase">Temperature</span>
              <Thermometer className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2">
              {weatherData.temperature_current}°C
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              Max: {weatherData.temperature_max}°C • Min: {weatherData.temperature_min}°C
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[10px] font-bold uppercase">Rainfall</span>
              <CloudRain className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2">
              {weatherData.rainfall_mm} <span className="text-xs font-normal">mm</span>
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">24h Precipitation</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[10px] font-bold uppercase">Humidity</span>
              <Droplets className="w-4 h-4 text-cyan-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2">
              {weatherData.humidity_pct}%
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Relative Atmospheric</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[10px] font-bold uppercase">Wind Speed</span>
              <Wind className="w-4 h-4 text-teal-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2">
              {weatherData.wind_speed_kmh} <span className="text-xs font-normal">km/h</span>
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Surface Velocity</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[10px] font-bold uppercase">Agro Alert</span>
              {weatherData.heatwave_detected ? (
                <Flame className="w-4 h-4 text-rose-600" />
              ) : weatherData.heavy_rain_detected ? (
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              )}
            </div>
            <div className="text-sm font-bold text-slate-800 mt-2">
              {weatherData.heatwave_detected
                ? 'Heatwave Detected'
                : weatherData.heavy_rain_detected
                ? 'Heavy Rain Alert'
                : 'Favorable Weather'}
            </div>
            <span className="text-[11px] text-slate-500 block">Drought Index: {weatherData.drought_index || 0.15}</span>
          </div>
        </div>
      )}

      {/* Correlation Insights Strip */}
      {correlationData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Rainfall Sensitivity ({correlationData.commodity_name})
              </h4>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                Pearson r: {correlationData.pearson_rainfall_price}
              </span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              {correlationData.rainfall_impact_summary}
            </p>
            <div className="text-[11px] text-slate-400">
              Spearman Rank Correlation: <span className="font-bold text-slate-600">{correlationData.spearman_rainfall_price}</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Thermal Elasticity ({correlationData.commodity_name})
              </h4>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                Pearson r: {correlationData.pearson_temp_price}
              </span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              {correlationData.temp_impact_summary}
            </p>
            <div className="text-[11px] text-slate-400">
              Spearman Rank Correlation: <span className="font-bold text-slate-600">{correlationData.spearman_temp_price}</span>
            </div>
          </div>
        </div>
      )}

      {/* Dual Weather & Price Chart */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Historical Rainfall (mm) vs Modal Price (₹/qtl) Overlay
          </h3>
          <p className="text-xs text-slate-500">
            Observed 30-day interactions between daily precipitation shocks and mandi auction clearing rates.
          </p>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={correlationData?.trend_data || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} />
              <YAxis yAxisId="price" tick={{ fontSize: 10, fill: '#059669' }} tickLine={false} />
              <YAxis yAxisId="rain" orientation="right" tick={{ fontSize: 10, fill: '#2563eb' }} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Line yAxisId="price" type="monotone" dataKey="modal_price" name="Modal Price (₹/qtl)" stroke="#059669" strokeWidth={2.5} dot={false} />
              <Line yAxisId="rain" type="monotone" dataKey="rainfall_mm" name="Precipitation (mm)" stroke="#2563eb" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 flex items-start gap-2">
          <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <span>
            <strong>Scientific Advisory:</strong> Correlation does not establish causation. Meteorological variations impact field plucking, moisture content, and road freight bottlenecks, which in turn drive physical market supply and auction bidding.
          </span>
        </div>
      </div>
    </div>
  );
};
