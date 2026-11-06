import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Sprout,
  Sun,
  CloudRain,
  MapPin,
  Clock,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import { CropCalendarItem, Commodity, StateItem } from '../types';

export const CropCalendarPage: React.FC = () => {
  const [calendars, setCalendars] = useState<CropCalendarItem[]>([]);
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [states, setStates] = useState<StateItem[]>([]);
  const [selectedCommodityId, setSelectedCommodityId] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchInit = async () => {
      try {
        const [cList, sList] = await Promise.all([api.getCommodities(), api.getStates()]);
        setCommodities(cList);
        setStates(sList);
      } catch (err) {
        console.error('Failed to load calendar init items:', err);
      }
    };
    fetchInit();
  }, []);

  const fetchCalendars = async () => {
    setLoading(true);
    try {
      const cId = selectedCommodityId ? Number(selectedCommodityId) : undefined;
      const res = await api.getCropCalendar(cId, selectedState || undefined);
      setCalendars(res);
    } catch (err) {
      console.error('Failed to load crop calendars:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendars();
  }, [selectedCommodityId, selectedState]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            MODULE 12: INDIAN AGRO-CLIMATIC CALENDAR
          </span>
          <span className="text-xs text-slate-400 font-medium">Kharif • Rabi • Zaid Crop Seasons</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
          Indian Crop Calendar & Seasonal Intelligence
        </h1>
        <p className="text-xs text-slate-500">
          Sowing, vegetative growth, harvest windows, and peak APMC arrival timelines across Indian production belts.
        </p>
      </div>

      {/* Control Strip */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Crop</label>
            <select
              value={selectedCommodityId}
              onChange={(e) => setSelectedCommodityId(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-bold focus:outline-none"
            >
              <option value="">All Crops</option>
              {commodities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">State Belt</label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none"
            >
              <option value="">All States</option>
              {states.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
            🌱 Sowing Period
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 font-semibold border border-amber-200">
            🌾 Harvesting & Peak
          </span>
        </div>
      </div>

      {/* Calendar Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500 font-medium">
          Loading crop seasonal calendars...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {calendars.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition space-y-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    {item.season} Season
                  </span>
                  <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" /> {item.state_name}
                  </span>
                </div>

                <h3 className="text-base font-extrabold text-slate-900 mt-1">{item.commodity_name}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.notes}</p>
              </div>

              {/* Timeline blocks */}
              <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50/70 border border-emerald-100">
                  <span className="text-slate-600 font-medium">Sowing Window:</span>
                  <span className="font-bold text-emerald-900">{item.sowing_period}</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-amber-50/70 border border-amber-100">
                  <span className="text-slate-600 font-medium">Harvesting Window:</span>
                  <span className="font-bold text-amber-900">{item.harvesting_period}</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-purple-50/70 border border-purple-100">
                  <span className="text-slate-600 font-medium">Peak Mandi Arrivals:</span>
                  <span className="font-extrabold text-purple-900">{item.peak_arrival_period}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
