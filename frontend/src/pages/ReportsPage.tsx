import React, { useState, useEffect } from 'react';
import {
  FileDown,
  FileSpreadsheet,
  FileText,
  CheckCircle,
  Clock,
  Download,
  Calendar,
  Layers
} from 'lucide-react';
import { api } from '../services/api';
import { Commodity } from '../types';

export const ReportsPage: React.FC = () => {
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [selectedReport, setSelectedReport] = useState<string>('commodity_price');
  const [selectedCommodityId, setSelectedCommodityId] = useState<string>('');
  const [format, setFormat] = useState<string>('csv');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [recentReports, setRecentReports] = useState<any[]>([
    {
      title: 'National Agricultural Modal Price Report',
      type: 'commodity_price',
      format: 'CSV',
      date: 'Today, 10:30 AM',
      records: 120,
    },
    {
      title: '2025-26 Central Government MSP Comparison',
      type: 'msp_comparison',
      format: 'CSV',
      date: 'Yesterday',
      records: 32,
    },
    {
      title: 'Inter-Mandi Arbitrage & Freight Differential',
      type: 'arbitrage',
      format: 'JSON',
      date: 'Nov 04, 2026',
      records: 25,
    },
  ]);

  useEffect(() => {
    const fetchC = async () => {
      try {
        const cList = await api.getCommodities();
        setCommodities(cList);
      } catch (err) {
        console.error('Failed to load commodities:', err);
      }
    };
    fetchC();
  }, []);

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const cId = selectedCommodityId ? Number(selectedCommodityId) : undefined;
      const res = await api.generateReport(selectedReport, format, cId);

      if (format === 'csv') {
        const blob = new Blob([res], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `agrimarket_${selectedReport}_${Date.now()}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        const blob = new Blob([JSON.stringify(res, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `agrimarket_${selectedReport}_${Date.now()}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
      }

      setRecentReports([
        {
          title: `AgriMarket ${selectedReport.replace(/_/g, ' ').toUpperCase()}`,
          type: selectedReport,
          format: format.toUpperCase(),
          date: 'Just now',
          records: 50,
        },
        ...recentReports,
      ]);
    } catch (err) {
      console.error('Error generating report:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            MODULE 19: ANALYTICAL REPORT GENERATION
          </span>
          <span className="text-xs text-slate-400 font-medium">Export CSV • JSON Data Payloads</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
          Export Market Reports & Research Datasets
        </h1>
        <p className="text-xs text-slate-500">
          Generate structured, auditable export files containing verified mandi transactions, moving averages, and MSP spreads.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Generator Form */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">Configure Report Parameters</h3>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Report Dataset</label>
            <select
              value={selectedReport}
              onChange={(e) => setSelectedReport(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="commodity_price">Commodity Mandi Price & Arrival Timeseries</option>
              <option value="msp_comparison">Government MSP vs Market Modal Comparison</option>
              <option value="market_overview">National Market Master Directory</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Filter by Commodity (Optional)</label>
            <select
              value={selectedCommodityId}
              onChange={(e) => setSelectedCommodityId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none"
            >
              <option value="">All Tracked Commodities</option>
              {commodities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Export Format</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormat('csv')}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition ${
                  format === 'csv'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>CSV Spreadsheet</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat('json')}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition ${
                  format === 'json'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>JSON Payload</span>
              </button>
            </div>
          </div>

          <button
            onClick={handleDownload}
            disabled={isGenerating}
            className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition mt-3"
          >
            <Download className="w-4 h-4" />
            <span>{isGenerating ? 'Generating Dataset...' : `Export & Download ${format.toUpperCase()}`}</span>
          </button>
        </div>

        {/* Right: Recent Generated Reports List */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">Recent Report Downloads</h3>

          <div className="divide-y divide-slate-100">
            {recentReports.map((r, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between hover:bg-slate-50 px-2 rounded-xl transition">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs">
                    {r.format}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{r.title}</h4>
                    <span className="text-[10px] text-slate-400">
                      Generated {r.date} • {r.records} Verified Rows
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleDownload}
                  className="p-2 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition"
                  title="Re-download"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
