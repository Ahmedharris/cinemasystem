import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Film,
  CalendarDays,
  Building2,
  Popcorn,
  Ticket,
  BarChart3,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { useCinema } from '../context/CinemaContext';
import { useAuth } from '../context/AuthContext';

export default function AdminLayout({ children, title, subtitle, actions }) {
  const location = useLocation();
  const { resetToDemoData } = useCinema();
  const { user } = useAuth();

  const links = [
    { section: 'Overview' },
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { section: 'Catalog Management' },
    { to: '/admin/movies', label: 'Movies & Genres', icon: Film },
    { to: '/admin/shows', label: 'Show Schedule', icon: CalendarDays },
    { to: '/admin/cinemas', label: 'Cinemas & Screens', icon: Building2 },
    { to: '/admin/food', label: 'Food Menu', icon: Popcorn },
    { section: 'Sales & Analytics' },
    { to: '/admin/bookings', label: 'Bookings & Refunds', icon: Ticket },
    { to: '/admin/reports', label: 'Reports & Aggregates', icon: BarChart3 }
  ];

  const handleReset = () => {
    if (window.confirm('Reset all cinema data, shows, and bookings back to factory demo state?')) {
      resetToDemoData();
      alert('Data reset to defaults!');
    }
  };

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col md:flex-row">
      {/* Admin Sidebar */}
      <aside className="w-full md:w-64 bg-[#0d1322] border-r border-[#1f2b42] flex flex-col justify-between shrink-0">
        <div>
          {/* Header */}
          <div className="p-5 border-b border-[#1f2b42] flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-lg text-white font-['Space_Grotesk'] leading-none">
                  CineMax
                </span>
                <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">
                  Admin Portal
                </span>
              </div>
            </Link>
          </div>

          {/* Nav List */}
          <nav className="p-3 space-y-1">
            {links.map((item, idx) => {
              if (item.section) {
                return (
                  <div
                    key={idx}
                    className="px-3 pt-4 pb-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest"
                  >
                    {item.section}
                  </div>
                );
              }
              const Icon = item.icon;
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-purple-600 text-white font-semibold shadow-lg shadow-purple-600/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-[#1f2b42] space-y-2">
          <button
            onClick={handleReset}
            className="w-full flex items-center justify-center gap-2 bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-amber-400 p-2 rounded-xl text-xs font-medium transition-colors border border-slate-700/40"
            title="Reset Mock Database"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Demo DB
          </button>

          <Link
            to="/"
            className="w-full flex items-center justify-center gap-2 bg-[#111726] hover:bg-[#182238] text-slate-300 p-2 rounded-xl text-xs font-medium transition-colors border border-[#23304a]"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
            Customer Site
          </Link>
        </div>
      </aside>

      {/* Admin Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-20 bg-[#090d16]/80 backdrop-blur-md border-b border-[#1f2b42] px-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-white font-['Space_Grotesk']">{title}</h1>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>

        {/* Main Body */}
        <main className="p-6 overflow-y-auto flex-1">{children}</main>
      </div>
    </div>
  );
}
