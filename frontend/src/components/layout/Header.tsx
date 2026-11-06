import React, { useState, useEffect } from 'react';
import {
  Menu,
  Search,
  RefreshCw,
  Bell,
  MapPin,
  ChevronDown,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFilter } from '../../context/FilterContext';
import { api } from '../../services/api';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  onMenuToggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const { user, role } = useAuth();
  const { selectedState, setSelectedState, selectedMandi, setSelectedMandi } = useFilter();
  const [states, setStates] = useState<string[]>([]);
  const [mandis, setMandis] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [riskCount, setRiskCount] = useState<number>(3);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadFilters = async () => {
      try {
        const sList = await api.getStates();
        setStates(['All States', ...sList.map((s) => s.name)]);
        const mList = await api.getMarkets();
        setMandis(['All Mandis', ...mList.map((m) => m.name)]);
        const risks = await api.getMarketRisks();
        setRiskCount(risks.length);
      } catch (e) {
        console.warn('Error loading header filters:', e);
      }
    };
    loadFilters();
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncMessage('Fetching AGMARKNET updates...');
    try {
      const res = await api.syncMarketData();
      setSyncMessage(`Synced ${res.records_added} new records!`);
      setTimeout(() => setSyncMessage(null), 3500);
    } catch (e) {
      setSyncMessage('Sync finished');
      setTimeout(() => setSyncMessage(null), 3000);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSearch = async (val: string) => {
    setSearchQuery(val);
    if (val.trim().length > 1) {
      try {
        const comms = await api.getCommodities(undefined, val);
        setSearchResults(comms.slice(0, 5));
        setIsSearchOpen(true);
      } catch (e) {
        setSearchResults([]);
      }
    } else {
      setSearchResults([]);
      setIsSearchOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 lg:px-8 py-3 flex items-center justify-between shadow-xs">
      {/* Left: Mobile hamburger & Search bar */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onMenuToggle}
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"
          aria-label="Toggle Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search */}
        <div className="relative flex-1">
          <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-1.5 border border-slate-200 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100 transition-all">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search wheat, onion, Lasalgaon, Azadpur, MSP..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => searchQuery.length > 1 && setIsSearchOpen(true)}
              className="bg-transparent text-xs w-full focus:outline-none text-slate-800 placeholder-slate-400"
            />
          </div>

          {/* Search Dropdown Results */}
          {isSearchOpen && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50">
              <div className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1">Commodity Matches</div>
              {searchResults.map((c) => (
                <div
                  key={c.id}
                  onClick={() => {
                    navigate(`/commodities/${c.slug}`);
                    setIsSearchOpen(false);
                  }}
                  className="px-3 py-2 rounded-lg hover:bg-emerald-50 flex items-center justify-between cursor-pointer transition"
                >
                  <div>
                    <span className="font-semibold text-xs text-slate-900">{c.name}</span>
                    <span className="text-[10px] text-slate-500 ml-2">({c.category_name})</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-700">₹{c.current_modal_price || '—'} /qtl</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right controls: State / Mandi filters, Sync Button, Alerts, Profile */}
      <div className="flex items-center gap-3">
        {/* Quick State Selector */}
        <div className="hidden md:flex items-center gap-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="bg-transparent text-slate-700 font-medium focus:outline-none text-xs cursor-pointer"
          >
            {states.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Sync Feed Button */}
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 transition"
          title="Sync with AGMARKNET & Open-Meteo"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isSyncing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{syncMessage || 'Sync Data'}</span>
        </button>

        {/* Alerts Bell */}
        <button
          onClick={() => navigate('/market-risks')}
          className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition"
          title="Market Risk Alerts"
        >
          <Bell className="w-4 h-4 text-slate-600" />
          {riskCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
              {riskCount}
            </span>
          )}
        </button>

        {/* User Persona Profile */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-green-500 text-white flex items-center justify-center font-bold text-xs shadow-sm">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="hidden xl:block text-left">
            <div className="text-xs font-bold text-slate-800 leading-tight">{user?.full_name}</div>
            <div className="text-[10px] text-emerald-600 capitalize font-medium">{role} Persona</div>
          </div>
        </div>
      </div>
    </header>
  );
};
