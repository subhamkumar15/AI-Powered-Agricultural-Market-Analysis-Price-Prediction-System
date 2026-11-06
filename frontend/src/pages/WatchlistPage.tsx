import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookmarkCheck,
  TrendingUp,
  TrendingDown,
  Trash2,
  ArrowRight,
  ShoppingBag,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';
import { Commodity } from '../types';

export const WatchlistPage: React.FC = () => {
  const [watchlist, setWatchlist] = useState<Commodity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  const fetchWatchlist = async () => {
    setLoading(true);
    try {
      const data = await api.getWatchlist();
      setWatchlist(data);
    } catch (err) {
      console.error('Failed to load watchlist:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const handleRemove = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      await api.toggleWatchlist(id);
      setWatchlist(watchlist.filter((w) => w.id !== id));
    } catch (err) {
      console.warn('Remove error:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            MODULE 18: PERSONALIZED PORTFOLIO
          </span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
          Your Saved Commodities & Watchlist
        </h1>
        <p className="text-xs text-slate-500">
          Track high-priority crops, view real-time modal quotes, and receive instant alert notifications.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500 font-medium">Loading saved watchlist...</div>
      ) : watchlist.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <BookmarkCheck className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Your watchlist is currently empty</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Bookmark commodities in the Commodity Explorer to track them right here.
          </p>
          <button
            onClick={() => navigate('/commodities')}
            className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 transition"
          >
            Explore Commodities →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {watchlist.map((crop) => (
            <div
              key={crop.id}
              onClick={() => navigate(`/commodities/${crop.slug}`)}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                    {crop.category_name}
                  </span>
                  <button
                    onClick={(e) => handleRemove(e, crop.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Remove from watchlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="text-base font-extrabold text-slate-900">{crop.name}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{crop.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Modal Price</span>
                  <span className="text-lg font-extrabold text-slate-900">
                    ₹{crop.current_modal_price?.toLocaleString('en-IN') || '—'}{' '}
                    <span className="text-xs font-normal text-slate-400">/qtl</span>
                  </span>
                </div>

                <div className="flex items-center gap-1 text-xs font-bold text-emerald-700">
                  <span>View Details</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
