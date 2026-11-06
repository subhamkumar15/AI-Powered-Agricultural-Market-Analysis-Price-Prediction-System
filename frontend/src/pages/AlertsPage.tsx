import React, { useState, useEffect } from 'react';
import {
  Bell,
  Plus,
  Trash2,
  CheckCircle,
  AlertTriangle,
  ToggleLeft,
  ToggleRight,
  ShieldCheck
} from 'lucide-react';
import { api } from '../services/api';
import { MarketAlertItem, Commodity, Market } from '../types';

export const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<MarketAlertItem[]>([]);
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Form states
  const [formCommodityId, setFormCommodityId] = useState<string>('');
  const [formMarketId, setFormMarketId] = useState<string>('');
  const [formCondition, setFormCondition] = useState<string>('price_above');
  const [formThreshold, setFormThreshold] = useState<number>(2500);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const [aList, cList, mList] = await Promise.all([
        api.getAlerts().catch(() => []),
        api.getCommodities(),
        api.getMarkets(),
      ]);
      setAlerts(aList);
      setCommodities(cList);
      setMarkets(mList);
    } catch (err) {
      console.error('Failed to load alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newAlert = await api.createAlert({
        commodity_id: formCommodityId ? Number(formCommodityId) : undefined,
        market_id: formMarketId ? Number(formMarketId) : undefined,
        condition_type: formCondition,
        threshold_value: formThreshold,
      });
      setAlerts([newAlert, ...alerts]);
      setShowCreateModal(false);
    } catch (err) {
      console.error('Failed to create alert:', err);
    }
  };

  const handleToggle = async (id: number) => {
    try {
      const res = await api.toggleAlert(id);
      setAlerts(alerts.map((a) => (a.id === id ? { ...a, is_active: res.is_active } : a)));
    } catch (err) {
      console.warn('Toggle alert error:', err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteAlert(id);
      setAlerts(alerts.filter((a) => a.id !== id));
    } catch (err) {
      console.warn('Delete alert error:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              MODULE 15: CUSTOMIZABLE PRICE ALERTS
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            Price Alerts & Notification Center
          </h1>
          <p className="text-xs text-slate-500">
            Set triggers for price surges, crashes, MSP violations, and unusual volatility events.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Alert</span>
        </button>
      </div>

      {/* Alerts List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500">Loading active alerts...</div>
      ) : alerts.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <Bell className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No active alerts configured</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Create an alert to get notified when commodity prices cross target levels or breach MSP.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 transition"
          >
            Create Your First Alert
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">Commodity</th>
                  <th className="py-3 px-4">Mandi Yard</th>
                  <th className="py-3 px-4">Trigger Condition</th>
                  <th className="py-3 px-4 text-right">Threshold Target</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {alerts.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">{a.commodity_name || 'All Commodities'}</td>
                    <td className="py-3 px-4 text-slate-600 font-medium">{a.market_name || 'All Mandis'}</td>
                    <td className="py-3 px-4 text-slate-700 font-medium capitalize">
                      {a.condition_type.replace(/_/g, ' ')}
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-slate-900">
                      ₹{a.threshold_value.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggle(a.id)}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase transition ${
                          a.is_active
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {a.is_active ? 'Active' : 'Paused'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDelete(a.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition"
                        title="Delete alert"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Alert Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Create Customized Market Alert</h3>

            <form onSubmit={handleCreateAlert} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Target Commodity</label>
                <select
                  value={formCommodityId}
                  onChange={(e) => setFormCommodityId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-bold focus:outline-none"
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
                <label className="text-slate-600 font-semibold block mb-1">Target Mandi (Optional)</label>
                <select
                  value={formMarketId}
                  onChange={(e) => setFormMarketId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none"
                >
                  <option value="">All Monitored Mandis</option>
                  {markets.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.state_name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-600 font-semibold block mb-1">Trigger Condition</label>
                <select
                  value={formCondition}
                  onChange={(e) => setFormCondition(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-bold focus:outline-none"
                >
                  <option value="price_above">Modal Price Rises Above (₹/qtl)</option>
                  <option value="price_below">Modal Price Drops Below (₹/qtl)</option>
                  <option value="below_msp">Trading Below Government MSP</option>
                  <option value="high_volatility">Severe Volatility Surge (&gt; 15% σ)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-600 font-semibold block mb-1">Threshold Value (₹)</label>
                <input
                  type="number"
                  value={formThreshold}
                  onChange={(e) => setFormThreshold(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-bold focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-semibold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
                >
                  Save Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
