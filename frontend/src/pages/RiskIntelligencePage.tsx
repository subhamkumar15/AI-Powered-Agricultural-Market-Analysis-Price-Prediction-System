import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  TrendingDown,
  CloudRain,
  Flame,
  CheckCircle,
  HelpCircle,
  Activity,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { MarketRiskItem } from '../types';

export const RiskIntelligencePage: React.FC = () => {
  const [risks, setRisks] = useState<MarketRiskItem[]>([]);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchRisks = async () => {
      setLoading(true);
      try {
        const res = await api.getMarketRisks();
        setRisks(res);
      } catch (err) {
        console.error('Failed to load market risks:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRisks();
  }, []);

  const filteredRisks = selectedSeverity === 'all'
    ? risks
    : risks.filter((r) => r.severity.toLowerCase() === selectedSeverity.toLowerCase());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
            MODULE 16: AUTOMATED MARKET SURVEILLANCE
          </span>
          <span className="text-xs text-slate-400 font-medium">Anomaly Detection • Price Crash & Supply Shock Alerts</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
          Agricultural Market Risk Intelligence
        </h1>
        <p className="text-xs text-slate-500">
          Surveillance engine scanning APMC price volatility, sudden auction crashes, distress sales, and weather anomalies.
        </p>
      </div>

      {/* Control Strip */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700">Filter Severity:</span>
          {['all', 'high', 'medium', 'low'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSelectedSeverity(sev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition ${
                selectedSeverity === sev
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        <span className="text-xs font-bold text-slate-500">
          {filteredRisks.length} Active Market Surveillance Alerts
        </span>
      </div>

      {/* Risks Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500 font-medium">
          Running surveillance anomaly scan across mandi databases...
        </div>
      ) : filteredRisks.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-800">No high-risk anomalies detected</p>
          <p className="text-xs text-slate-400 mt-1">All monitored commodities are trading within normal volatility bands.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredRisks.map((item) => {
            const isHigh = item.severity === 'High';
            const isMedium = item.severity === 'Medium';

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl p-5 border shadow-xs space-y-4 flex flex-col justify-between ${
                  isHigh ? 'border-rose-300' : 'border-slate-200/80'
                }`}
              >
                <div>
                  {/* Top Bar: Risk Category & Severity */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isHigh
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : isMedium
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {item.severity} Severity • {item.risk_category}
                    </span>

                    <span className="text-[10px] text-slate-400 font-medium">{item.detected_at}</span>
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900 mt-1">
                    {item.commodity_name} @ {item.market_name}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-medium">
                    {item.description}
                  </p>
                </div>

                {/* Recommended Action Advisory Box */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
                    <span className="font-bold text-slate-900 block text-[10px] uppercase mb-0.5">
                      Recommended Monitoring Action:
                    </span>
                    {item.recommended_action}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
