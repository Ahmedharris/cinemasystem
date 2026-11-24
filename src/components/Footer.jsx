import React from 'react';
import { Link } from 'react-router-dom';
import { Film, ShieldAlert, Heart, MapPin, Phone, Mail } from 'lucide-react';
import { CINEMAS } from '../data/initialData';

export default function Footer() {
  return (
    <footer className="bg-[#070a12] border-t border-[#23304a] text-slate-400 pt-16 pb-12 mt-20 no-print">
      <div className="cinemax-container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-[#23304a]">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black font-bold">
                <Film className="w-5 h-5 text-black" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-white font-['Space_Grotesk']">
                CINE<span className="text-amber-400">MAX</span>
              </span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed">
              Pakistan's premier luxury cinema network featuring IMAX Laser, Dolby Atmos acoustics, VIP Recliners, and gourmet in-theater dining.
            </p>
            <div className="flex items-center gap-2 text-xs text-amber-400/90 font-medium pt-1">
              <span>Next-Gen React Cinema Suite</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Explore</h4>
            <ul className="space-y-2.5 text-xs">
              <li><Link to="/" className="hover:text-amber-400 transition-colors">Now Showing Movies</Link></li>
              <li><Link to="/cinemas" className="hover:text-amber-400 transition-colors">Our Cinema Locations</Link></li>
              <li><Link to="/menu" className="hover:text-amber-400 transition-colors">Refreshments & Snacks</Link></li>
              <li><Link to="/my-bookings" className="hover:text-amber-400 transition-colors">Manage My Bookings</Link></li>
            </ul>
          </div>

          {/* Branches */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Locations</h4>
            <ul className="space-y-3 text-xs">
              {CINEMAS.map(c => (
                <li key={c.id} className="space-y-0.5">
                  <div className="text-slate-200 font-semibold">{c.name}</div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>{c.address}, {c.city}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Management & Admin */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Management</h4>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Staff and cinema operators can access the live administrative suite for real-time ticket validation, scheduling, and sales analytics.
            </p>
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 bg-[#111726] hover:bg-[#182238] border border-purple-500/30 hover:border-purple-500/60 text-purple-300 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shadow-lg"
            >
              <ShieldAlert className="w-4 h-4 text-purple-400" />
              Launch Admin Dashboard
            </Link>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} CineMax Pakistan. All rights reserved. Built with React & Vite.</p>
          <div className="flex items-center gap-1 text-[11px]">
            <span>Crafted for high performance & modern cinema operations</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
