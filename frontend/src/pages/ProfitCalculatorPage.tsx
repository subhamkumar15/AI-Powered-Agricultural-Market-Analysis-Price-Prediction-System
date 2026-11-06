import React, { useState } from 'react';
import {
  Calculator,
  IndianRupee,
  TrendingUp,
  Percent,
  Layers,
  ArrowRight,
  Truck,
  Users,
  Warehouse,
  Package
} from 'lucide-react';
import { api } from '../services/api';
import { ProfitCalculationResult } from '../types';

export const ProfitCalculatorPage: React.FC = () => {
  const [cropName, setCropName] = useState<string>('Wheat');
  const [quantity, setQuantity] = useState<number>(100);
  const [quantityUnit, setQuantityUnit] = useState<string>('Quintal');
  const [sellingPrice, setSellingPrice] = useState<number>(2450);

  // Expense fields
  const [transportCost, setTransportCost] = useState<number>(4500);
  const [laborCost, setLaborCost] = useState<number>(3000);
  const [storageCost, setStorageCost] = useState<number>(1500);
  const [packagingCost, setPackagingCost] = useState<number>(1200);
  const [otherCost, setOtherCost] = useState<number>(800);

  const [result, setResult] = useState<ProfitCalculationResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.calculateProfit({
        crop_name: cropName,
        quantity,
        quantity_unit: quantityUnit,
        selling_price: sellingPrice,
        transport_cost: transportCost,
        labor_cost: laborCost,
        storage_cost: storageCost,
        packaging_cost: packagingCost,
        other_cost: otherCost,
      });
      setResult(res);
    } catch (err) {
      console.error('Calculation error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Run initial calculation
  React.useEffect(() => {
    handleCalculate({ preventDefault: () => {} } as any);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            MODULE 8: FARM ENTERPRISE ECONOMICS
          </span>
          <span className="text-xs text-slate-400 font-medium">Break-Even & Multi-Mandi Realization</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
          Farmer Profitability & Break-Even Calculator
        </h1>
        <p className="text-xs text-slate-500">
          Compute gross revenue, operational expenses, break-even price, and estimated net returns across regional mandis.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form: Inputs */}
        <form
          onSubmit={handleCalculate}
          className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4"
        >
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">Production & Price Parameters</h3>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Crop / Commodity</label>
            <input
              type="text"
              value={cropName}
              onChange={(e) => setCropName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Quantity</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Unit</label>
              <select
                value={quantityUnit}
                onChange={(e) => setQuantityUnit(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none"
              >
                <option value="Quintal">Quintals (qtl)</option>
                <option value="Ton">Metric Tonnes (MT)</option>
                <option value="Kg">Kilograms (kg)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Expected Selling Price (₹/Quintal)</label>
            <input
              type="number"
              min="1"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider pt-3 border-t border-slate-100">
            Post-Harvest Expenses (₹)
          </h4>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-600 block mb-1">Transportation</label>
              <input
                type="number"
                min="0"
                value={transportCost}
                onChange={(e) => setTransportCost(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-medium"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-600 block mb-1">Labor & Loading</label>
              <input
                type="number"
                min="0"
                value={laborCost}
                onChange={(e) => setLaborCost(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-medium"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-600 block mb-1">Storage / Holding</label>
              <input
                type="number"
                min="0"
                value={storageCost}
                onChange={(e) => setStorageCost(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-medium"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-600 block mb-1">Packaging / Bags</label>
              <input
                type="number"
                min="0"
                value={packagingCost}
                onChange={(e) => setPackagingCost(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] text-slate-600 block mb-1">Other Overheads / Mandi Cess (₹)</label>
            <input
              type="number"
              min="0"
              value={otherCost}
              onChange={(e) => setOtherCost(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm transition mt-2"
          >
            {loading ? 'Recalculating...' : 'Recalculate Profitability'}
          </button>
        </form>

        {/* Right 2 cols: Results & Mandi Comparison */}
        {result && (
          <div className="lg:col-span-2 space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-[10px] font-bold uppercase text-slate-400">Gross Revenue</span>
                <div className="text-xl font-extrabold text-slate-900 mt-1">
                  ₹{result.gross_revenue.toLocaleString('en-IN')}
                </div>
                <span className="text-[11px] text-slate-500">{result.quantity_quintals} qtl total</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-[10px] font-bold uppercase text-slate-400">Total Expenses</span>
                <div className="text-xl font-extrabold text-rose-600 mt-1">
                  ₹{result.total_expenses.toLocaleString('en-IN')}
                </div>
                <span className="text-[11px] text-slate-500">Post-harvest costs</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-[10px] font-bold uppercase text-slate-400">Net Profit</span>
                <div className="text-xl font-extrabold text-emerald-700 mt-1">
                  ₹{result.net_profit.toLocaleString('en-IN')}
                </div>
                <span className="text-[11px] font-bold text-emerald-600">{result.profit_margin_pct}% Margin</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-[10px] font-bold uppercase text-slate-400">Break-Even Price</span>
                <div className="text-xl font-extrabold text-amber-700 mt-1">
                  ₹{result.break_even_price.toLocaleString('en-IN')}
                </div>
                <span className="text-[11px] text-slate-500">₹/qtl minimum</span>
              </div>
            </div>

            {/* Expenses Breakdown Box */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Expenses Breakdown</h4>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">Transit</span>
                  <span className="font-bold text-slate-800">₹{result.breakdown.transport}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">Labor</span>
                  <span className="font-bold text-slate-800">₹{result.breakdown.labor}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">Storage</span>
                  <span className="font-bold text-slate-800">₹{result.breakdown.storage}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">Packaging</span>
                  <span className="font-bold text-slate-800">₹{result.breakdown.packaging}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">Others/Cess</span>
                  <span className="font-bold text-slate-800">₹{result.breakdown.other}</span>
                </div>
              </div>
            </div>

            {/* Mandi Comparative Realization Table */}
            {result.mandi_comparisons.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Estimated Realization Across Mandis for {result.quantity_quintals} Quintals
                  </h4>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                        <th className="py-2.5 px-3">Mandi Yard</th>
                        <th className="py-2.5 px-3">State</th>
                        <th className="py-2.5 px-3 text-right">Modal Rate</th>
                        <th className="py-2.5 px-3 text-right">Estimated Revenue</th>
                        <th className="py-2.5 px-3 text-right">Net Profit</th>
                        <th className="py-2.5 px-3 text-right">Profit Margin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {result.mandi_comparisons.map((m, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-bold text-slate-800">{m.mandi_name}</td>
                          <td className="py-2.5 px-3 text-slate-600">{m.state_name}</td>
                          <td className="py-2.5 px-3 text-right font-medium text-slate-800">₹{m.modal_price}/qtl</td>
                          <td className="py-2.5 px-3 text-right font-medium text-slate-800">₹{m.estimated_revenue.toLocaleString('en-IN')}</td>
                          <td className="py-2.5 px-3 text-right font-extrabold text-emerald-700">₹{m.estimated_net_profit.toLocaleString('en-IN')}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-emerald-600">{m.profit_margin_pct}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
