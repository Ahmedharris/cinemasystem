import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Film, Popcorn, Ticket, Building2, User, LogOut, ShieldAlert, Sparkles, ShoppingBag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { CUSTOMERS } from '../data/initialData';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, switchUser, isAdmin } = useAuth();
  const { cart, formatTimer } = useCart();
  const [demoMenuOpen, setDemoMenuOpen] = useState(false);

  const navLinks = [
    { to: '/', label: 'Movies', icon: Film },
    { to: '/cinemas', label: 'Cinemas', icon: Building2 },
    { to: '/menu', label: 'Food Menu', icon: Popcorn },
    { to: '/my-bookings', label: 'My Bookings', icon: Ticket }
  ];

  const totalCartItems = (cart.seats?.length || 0) + Object.values(cart.food || {}).reduce((a, b) => a + b, 0);

  return (
    <header className="sticky top-0 z-50 bg-[#090d16]/90 backdrop-blur-md border-b border-[#23304a]">
      <div className="cinemax-container h-20 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <Film className="w-5 h-5 text-black" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-2xl tracking-tight text-white font-['Space_Grotesk'] leading-none">
              CINE<span className="text-amber-400">MAX</span>
            </span>
            <span className="text-[10px] text-amber-400/80 tracking-widest uppercase font-semibold">Cinema Systems</span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-[#111726] p-1.5 rounded-full border border-[#23304a]">
          {navLinks.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  active
                    ? 'bg-amber-500 text-black font-semibold shadow-md shadow-amber-500/25'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-black' : 'text-amber-400'}`} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Active Cart Pill if seats selected */}
          {cart.seats && cart.seats.length > 0 && (
            <Link
              to={cart.showId ? `/book/seats/${cart.showId}` : '/'}
              className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-amber-500/20 transition-all"
              title="Active Booking Session"
            >
              <ShoppingBag className="w-3.5 h-3.5 animate-bounce" />
              <span>{cart.seats.length} Seat{cart.seats.length > 1 ? 's' : ''}</span>
              <span className="bg-amber-500/20 px-1.5 py-0.5 rounded text-[10px] text-amber-300 font-mono">
                {formatTimer()}
              </span>
            </Link>
          )}

          {/* Admin Link */}
          <Link
            to="/admin"
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              location.pathname.startsWith('/admin')
                ? 'bg-purple-600/20 border-purple-500/40 text-purple-300'
                : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:text-white hover:border-slate-600'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
            Admin Panel
          </Link>

          {/* Quick Demo Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDemoMenuOpen(!demoMenuOpen)}
              className="flex items-center gap-2 bg-[#111726] border border-[#23304a] hover:border-amber-500/50 px-3 py-1.5 rounded-xl text-xs text-slate-300 transition-all"
              title="Switch demo account"
            >
              <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-black uppercase">
                {user ? user.name.charAt(0) : '?'}
              </div>
              <span className="max-w-[100px] truncate font-medium text-white">
                {user ? user.name.split(' ')[0] : 'Guest'}
              </span>
              <Sparkles className="w-3 h-3 text-amber-400" />
            </button>

            {demoMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-64 bg-[#111726] border border-[#23304a] rounded-2xl shadow-2xl p-2 z-50 animate-fade-in"
                onClick={() => setDemoMenuOpen(false)}
              >
                <div className="px-3 py-2 border-b border-[#23304a]">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Account</p>
                  <p className="text-sm font-bold text-white mt-0.5">{user?.name || 'Guest'}</p>
                  <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                  {isAdmin && (
                    <span className="inline-block mt-1 text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded font-semibold border border-purple-500/30">
                      ADMINISTRATOR
                    </span>
                  )}
                </div>

                <div className="py-1">
                  <p className="px-3 pt-2 pb-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Switch Test Profile
                  </p>
                  {CUSTOMERS.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => switchUser(c)}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                        user?.email === c.email ? 'bg-amber-500/20 text-amber-300 font-semibold' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span>{c.name}</span>
                      <span className="text-[10px] text-slate-500 uppercase">{c.role}</span>
                    </button>
                  ))}
                </div>

                <div className="pt-1 border-t border-[#23304a]">
                  {user ? (
                    <button
                      onClick={logout}
                      className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-2 font-medium"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  ) : (
                    <Link
                      to="/login"
                      className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-amber-400 hover:bg-amber-500/10 flex items-center gap-2 font-medium"
                    >
                      <User className="w-3.5 h-3.5" />
                      Sign In / Register
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>

          {!user && (
            <Link
              to="/login"
              className="bg-amber-500 hover:bg-amber-400 text-black px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/20"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
