import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  Search,
  Filter,
  Navigation,
  Warehouse,
  TrendingUp,
  CloudSun
} from 'lucide-react';
import { api } from '../services/api';
import { Market, Commodity, StateItem } from '../types';

// Fix for default Leaflet marker icons in React/Vite
const createCustomIcon = (color = '#059669') => {
  return L.divIcon({
    className: 'custom-mandi-pin',
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
            <div style="background-color: white; width: 6px; height: 6px; border-radius: 50%;"></div>
          </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

export const MapPage: React.FC = () => {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [states, setStates] = useState<StateItem[]>([]);
  const [selectedState, setSelectedState] = useState<string>('All States');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // India Center coordinates
  const defaultCenter: [number, number] = [22.9734, 78.6569];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [mList, sList] = await Promise.all([api.getMarkets(), api.getStates()]);
        setMarkets(mList);
        setStates(sList);
      } catch (err) {
        console.error('Failed to load map data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredMarkets = markets.filter((m) => {
    const matchesState = selectedState === 'All States' ? true : m.state_name === selectedState;
    const matchesSearch = searchQuery
      ? m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.district.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesState && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            MODULE 20: GEOGRAPHICAL MARKET INTELLIGENCE
          </span>
          <span className="text-xs text-slate-400 font-medium">34 Verified APMC Mandis • Real Geo-Coordinates</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
          Interactive Agricultural Mandi Map of India
        </h1>
        <p className="text-xs text-slate-500">
          Explore spatial market distributions, APMC trade hubs, and regional pricing clusters across India.
        </p>
      </div>

      {/* Control Strip */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Filter by State</label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-bold focus:outline-none"
            >
              <option value="All States">All States ({markets.length} Mandis)</option>
              {states.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="relative flex-1 md:w-64">
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Search Mandi</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search Khanna, Azadpur, Lasalgaon..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-600 border-2 border-white shadow-xs"></span>
            <span className="text-slate-600 font-medium">Primary APMC Yard</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-600 border-2 border-white shadow-xs"></span>
            <span className="text-slate-600 font-medium">eNAM Electronic Hub</span>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden h-[600px] relative z-10">
        <MapContainer
          center={defaultCenter}
          zoom={5}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {filteredMarkets.map((m) => {
            const isENAM = m.market_type?.includes('eNAM');
            const pinColor = isENAM ? '#2563eb' : '#059669';

            return (
              <Marker
                key={m.id}
                position={[m.latitude, m.longitude]}
                icon={createCustomIcon(pinColor)}
              >
                <Popup className="custom-popup">
                  <div className="p-1 space-y-2 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                      <span className="font-extrabold text-slate-900 text-sm">{m.name}</span>
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                        {m.market_type}
                      </span>
                    </div>

                    <div className="space-y-1 text-slate-600 text-[11px]">
                      <div><strong>State:</strong> {m.state_name}</div>
                      <div><strong>District:</strong> {m.district}</div>
                      <div><strong>Geo-Coordinates:</strong> {m.latitude.toFixed(4)}, {m.longitude.toFixed(4)}</div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-emerald-700 font-bold">
                      <span>Verified APMC Trading Center</span>
                      <span>AGMARKNET Linked</span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
};
