import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  Search,
  Sparkles,
  CloudRain,
  LineChart,
  GitCompare,
  ArrowRightLeft,
  Calculator,
  Warehouse,
  ShieldAlert,
  Bot,
  MapPin,
  Calendar,
  Globe2,
  BookmarkCheck,
  Bell,
  FileDown,
  Layers,
  Sprout,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { role, switchRole } = useAuth();

  const navSections = [
    {
      title: 'CORE PLATFORM',
      items: [
        { name: 'Main Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'Market Price Tracker', path: '/market-tracker', icon: TrendingUp },
        { name: 'Commodity Explorer', path: '/commodities', icon: Search },
        { name: 'Interactive Map', path: '/map', icon: MapPin },
      ]
    },
    {
      title: 'ANALYTICS & AI',
      items: [
        { name: 'AI Price Predictions', path: '/predictions', icon: Sparkles },
        { name: 'Weather Intelligence', path: '/weather', icon: CloudRain },
        { name: 'Advanced Price Analytics', path: '/analytics', icon: LineChart },
        { name: 'Supply & Demand', path: '/supply-demand', icon: Layers },
      ]
    },
    {
      title: 'DECISION SUPPORT',
      items: [
        { name: 'Mandi Comparison', path: '/mandi-comparison', icon: GitCompare },
        { name: 'Market Arbitrage', path: '/arbitrage', icon: ArrowRightLeft },
        { name: 'Farmer Profit Calculator', path: '/profit-calculator', icon: Calculator },
        { name: 'Storage Decision Support', path: '/storage-decision', icon: Warehouse },
      ]
    },
    {
      title: 'POLICY & INTELLIGENCE',
      items: [
        { name: 'MSP Intelligence', path: '/msp', icon: Sprout },
        { name: 'Crop Calendar', path: '/crop-calendar', icon: Calendar },
        { name: 'Market Risk Alerts', path: '/market-risks', icon: ShieldAlert },
        { name: 'AI Market Assistant', path: '/assistant', icon: Bot },
        { name: 'International Markets', path: '/international', icon: Globe2 },
      ]
    },
    {
      title: 'USER WORKSPACE',
      items: [
        { name: 'Watchlist', path: '/watchlist', icon: BookmarkCheck },
        { name: 'Price Alerts', path: '/alerts', icon: Bell },
        { name: 'Export Reports', path: '/reports', icon: FileDown },
      ]
    }
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#063a2c] text-white flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } border-r border-emerald-900/60 shadow-2xl`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-emerald-800/60 bg-[#042d22]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-green-400 flex items-center justify-center shadow-lg shadow-emerald-950/40 text-white font-bold">
              <Sprout className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                AgriMarket <span className="text-emerald-400 text-xs px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-800">AI</span>
              </h1>
              <p className="text-[11px] text-emerald-300/80 font-medium tracking-wide">
                Price Intelligence & Forecasts
              </p>
            </div>
          </div>
        </div>

        {/* Role Switcher Pill */}
        <div className="px-4 py-3 bg-[#03241b] border-b border-emerald-800/40">
          <div className="flex items-center justify-between text-xs text-emerald-300 mb-1.5">
            <span className="flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" /> Active Persona
            </span>
            <span className="font-semibold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded bg-emerald-900 text-emerald-200">
              {role}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1 text-[10px]">
            {(['farmer', 'trader', 'analyst', 'admin'] as const).map((r) => (
              <button
                key={r}
                onClick={() => switchRole(r)}
                className={`py-1 rounded font-medium capitalize transition-all ${
                  role === r
                    ? 'bg-emerald-500 text-white shadow'
                    : 'bg-emerald-950/70 text-emerald-300/70 hover:bg-emerald-900 hover:text-emerald-200'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              <h2 className="px-3 text-[10px] font-bold uppercase tracking-wider text-emerald-400/70">
                {section.title}
              </h2>
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-md shadow-emerald-950/50 font-semibold'
                          : 'text-emerald-100/80 hover:bg-emerald-900/60 hover:text-white'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0 text-emerald-300" />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer Status */}
        <div className="p-3 border-t border-emerald-900/80 bg-[#03241b] text-[11px] text-emerald-300/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>AGMARKNET Connected</span>
          </div>
          <span className="text-[10px] text-emerald-400/60 font-mono">v1.0.0</span>
        </div>
      </aside>
    </>
  );
};
