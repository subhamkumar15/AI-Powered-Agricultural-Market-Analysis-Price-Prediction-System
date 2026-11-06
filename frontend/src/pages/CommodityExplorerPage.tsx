import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Bookmark,
  BookmarkCheck,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Sprout,
  ArrowRight,
  ShieldCheck,
  Clock
} from 'lucide-react';
import { api } from '../services/api';
import { Commodity, CommodityCategory } from '../types';

export const CommodityExplorerPage: React.FC = () => {
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [categories, setCategories] = useState<CommodityCategory[]>([]);
  const [selectedCat, setSelectedCat] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [watchlistIds, setWatchlistIds] = useState<Set<number>>(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [cList, catList, watchList] = await Promise.all([
          api.getCommodities(),
          api.getCategories(),
          api.getWatchlist().catch(() => []),
        ]);
        setCommodities(cList);
        setCategories(catList);
        setWatchlistIds(new Set(watchList.map((w) => w.id)));
      } catch (err) {
        console.error('Failed to load commodities:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleToggleWatchlist = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      await api.toggleWatchlist(id);
      setWatchlistIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    } catch (err) {
      console.warn('Watchlist toggle error:', err);
    }
  };

  const filteredCommodities = commodities.filter((c) => {
    const matchesCat = selectedCat ? c.category_id === selectedCat : true;
    const matchesSearch = searchQuery
      ? c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              MODULE 2: COMMODITY MASTER DIRECTORY
            </span>
            <span className="text-xs text-slate-400 font-medium">{commodities.length} Verified Crops</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            Agricultural Commodity Explorer
          </h1>
          <p className="text-xs text-slate-500">
            Browse benchmark market prices, seasonal harvest calendars, and predictive intelligence across categories.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder="Search crop by name, pulse, variety..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedCat(null)}
          className={`px-4 py-2 rounded-xl text-xs font-semibold shrink-0 transition ${
            selectedCat === null
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          All Commodities ({commodities.length})
        </button>

        {categories.map((cat) => {
          const count = commodities.filter((c) => c.category_id === cat.id).length;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCat(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold shrink-0 transition ${
                selectedCat === cat.id
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat.name} ({count})
            </button>
          );
        })}
      </div>

      {/* Grid of Commodities */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500 font-medium">
          Loading agricultural directory...
        </div>
      ) : filteredCommodities.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <p className="text-sm font-semibold text-slate-700">No commodities match your search</p>
          <p className="text-xs text-slate-400 mt-1">Try selecting another category or clearing your query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCommodities.map((crop) => {
            const isWatchlisted = watchlistIds.has(crop.id);
            const isGain = (crop.weekly_pct_change || 0) >= 0;

            return (
              <div
                key={crop.id}
                onClick={() => navigate(`/commodities/${crop.slug}`)}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-lg hover:border-emerald-300 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  {/* Top tags & watchlist button */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600">
                        {crop.category_name}
                      </span>
                      {crop.msp_applicable && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-amber-600" /> MSP Notified
                        </span>
                      )}
                      {crop.perishable && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          Perishable
                        </span>
                      )}
                    </div>

                    <button
                      onClick={(e) => handleToggleWatchlist(e, crop.id)}
                      className={`p-1.5 rounded-lg transition ${
                        isWatchlisted
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                      }`}
                      title={isWatchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}
                    >
                      {isWatchlisted ? (
                        <BookmarkCheck className="w-4 h-4 fill-emerald-600" />
                      ) : (
                        <Bookmark className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Crop Name & Description */}
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition">
                    {crop.name}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                    {crop.description || 'Verified agricultural market commodity.'}
                  </p>
                </div>

                {/* Price Stats Box */}
                <div className="mt-4 pt-3.5 border-t border-slate-100">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400">Modal Price</span>
                      <div className="text-xl font-extrabold text-slate-900 mt-0.5">
                        {crop.current_modal_price
                          ? `₹${crop.current_modal_price.toLocaleString('en-IN')}`
                          : '—'}
                        <span className="text-[11px] font-normal text-slate-500 ml-1">/qtl</span>
                      </div>
                    </div>

                    {crop.weekly_pct_change !== undefined && crop.weekly_pct_change !== null && (
                      <div
                        className={`text-xs font-bold flex items-center gap-0.5 px-2 py-0.5 rounded-lg ${
                          isGain ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {isGain ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        <span>{isGain ? `+${crop.weekly_pct_change}%` : `${crop.weekly_pct_change}%`}</span>
                      </div>
                    )}
                  </div>

                  {/* Range & Storability */}
                  <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500">
                    <span>
                      Range: ₹{crop.min_price || '—'} – ₹{crop.max_price || '—'}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-slate-400">
                      <Clock className="w-3 h-3" /> {crop.shelf_life_days}d storability
                    </span>
                  </div>

                  {/* View Details CTA */}
                  <div className="mt-3 pt-2 flex items-center justify-between text-xs font-bold text-emerald-700 group-hover:translate-x-0.5 transition">
                    <span>Full Analytics & ML Forecast</span>
                    <ArrowRight className="w-4 h-4" />
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
