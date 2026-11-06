import React, { useState, useEffect } from 'react';
import {
  ArrowRightLeft,
  Truck,
  TrendingUp,
  MapPin,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { ArbitrageOpportunity, Commodity } from '../types';

export const ArbitragePage: React.FC = () => {
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [selectedCommodityId, setSelectedCommodityId] = useState<string>('');
  const [minNetBenefit, setMinNetBenefit] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchDropdown = async () => {
      try {
        const cList = await api.getCommodities();
        setCommodities(cList);
      } catch (err) {
        console.error('Failed to load commodities:', err);
      }
    };
    fetchDropdown();
  }, []);

  const fetchArbitrage = async () => {
    setLoading(true);
    try {
      const cId = selectedCommodityId ? Number(selectedCommodityId) : undefined;
      const res = await api.getArbitrageOpportunities(cId, minNetBenefit);
      setOpportunities(res);
    } catch (err) {
      console.error('Failed to load arbitrage opportunities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArbitrage();
  }, [selectedCommodityId, minNetBenefit]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
            MODULE 9: INTER-MANDI ARBITRAGE
          </span>
          <span className="text-xs text-slate-400 font-medium">Diesel Freight Costs • Net Margin Discovery</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
          Mandi Opportunity Finder & Market Arbitrage
        </h1>
        <p className="text-xs text-slate-500">
          Identify attractive inter-market selling opportunities after deducting real-world transit freight, labor loading, and mandi cess.
        </p>
      </div>

      {/* Control Strip */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Filter by Commodity</label>
            <select
              value={selectedCommodityId}
              onChange={(e) => setSelectedCommodityId(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-bold focus:outline-none"
            >
              <option value="">All Commodities</option>
              {commodities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Min Net Benefit (₹/qtl)</label>
            <select
              value={minNetBenefit}
              onChange={(e) => setMinNetBenefit(Number(e.target.value))}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none"
            >
              <option value={0}>All (Positive Spread)</option>
              <option value={50}>₹50+ / Quintal</option>
              <option value={100}>₹100+ / Quintal (Moderate)</option>
              <option value={200}>₹200+ / Quintal (High Return)</option>
            </select>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-slate-400 font-semibold block">Transit Freight Model</span>
          <span className="text-xs font-semibold text-slate-700">₹0.38/qtl/km + ₹25 loading + 1.5% cess</span>
        </div>
      </div>

      {/* Opportunities List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500 font-medium">
          Calculating inter-mandi freight routes and price differentials...
        </div>
      ) : opportunities.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">No arbitrage opportunities meet this threshold</p>
          <p className="text-xs text-slate-400 mt-1">Lower the minimum net benefit to see marginal spreads.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {opportunities.map((opp, idx) => {
            const isExcellent = opp.opportunity_rating === 'Excellent';
            const isModerate = opp.opportunity_rating === 'Moderate';

            return (
              <div
                key={idx}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition space-y-4"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900">{opp.commodity_name}</span>
                    <span className="text-[10px] text-slate-400 ml-2 font-medium">({opp.estimated_distance_km} km highway route)</span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      isExcellent
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : isModerate
                        ? 'bg-blue-100 text-blue-800 border border-blue-300'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {opp.opportunity_rating}
                  </span>
                </div>

                {/* Mandi Route Comparison Box */}
                <div className="grid grid-cols-3 items-center gap-2 p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                  {/* Origin */}
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Origin Mandi</span>
                    <span className="font-bold text-slate-800 block truncate">{opp.source_mandi}</span>
                    <span className="text-slate-500 text-[11px] font-semibold">₹{opp.source_price}/qtl</span>
                  </div>

                  {/* Route arrow */}
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <ArrowRight className="w-4 h-4 text-emerald-600" />
                    <span className="text-[9px] text-slate-400 mt-0.5">₹{opp.price_difference} Gross Spread</span>
                  </div>

                  {/* Destination */}
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 block">Destination</span>
                    <span className="font-bold text-slate-800 block truncate">{opp.dest_mandi}</span>
                    <span className="text-emerald-700 text-[11px] font-extrabold">₹{opp.dest_price}/qtl</span>
                  </div>
                </div>

                {/* Financial breakdown */}
                <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Est. Freight & Handling</span>
                    <span className="font-semibold text-slate-700">₹{opp.estimated_freight_cost_per_qtl} /qtl</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 text-[10px] block">Net Benefit (100 Quintals)</span>
                    <span className="font-extrabold text-emerald-700 text-sm">
                      ₹{opp.total_net_benefit_100qtl.toLocaleString('en-IN')}
                    </span>
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
