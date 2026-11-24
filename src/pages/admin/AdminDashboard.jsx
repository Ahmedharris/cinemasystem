import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Ticket,
  DollarSign,
  Users,
  Armchair,
  Building2,
  Film,
  Calendar,
  Eye,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';
import { useCinema } from '../../context/CinemaContext';
import { CURRENCY, getScreenSeats } from '../../data/initialData';
import AdminLayout from '../../components/AdminLayout';

export default function AdminDashboard() {
  const { bookings, shows, movies, screens, cinemas, foodItems } = useCinema();
  const [selectedBookingModal, setSelectedBookingModal] = useState(null);

  const confirmedBookings = bookings.filter(b => b.status === 'CONFIRMED');

  // Aggregates
  const totalRevenue = confirmedBookings.reduce((sum, b) => sum + (b.total || 0), 0);
  const totalTickets = confirmedBookings.reduce((sum, b) => sum + (b.seats?.length || 0), 0);

  // Today's shows
  const todayDateStr = shows[0]?.date || new Date().toISOString().split('T')[0];
  const todayShows = shows.filter(s => s.date === todayDateStr && s.status === 'SCHEDULED');

  // Compute show occupancy
  const getShowOcc = (show) => {
    const sc = screens.find(s => s.id === show.screenId);
    const cap = getScreenSeats(sc).length;
    let booked = 0;
    bookings.forEach(b => {
      if (String(b.showId) === String(show.id) && (b.status === 'CONFIRMED' || b.status === 'PENDING')) {
        booked += (b.seats?.length || 0);
      }
    });
    // Add deterministic taken seats baseline
    const pct = cap ? Math.min(100, Math.round((booked / cap) * 100)) : 0;
    return { cap, booked, pct };
  };

  const avgOcc = todayShows.length
    ? Math.round(todayShows.reduce((sum, s) => sum + getShowOcc(s).pct, 0) / todayShows.length)
    : 45;

  // Tickets sold per movie
  const ticketsByMovie = {};
  confirmedBookings.forEach(b => {
    const s = shows.find(sh => sh.id === b.showId);
    const m = movies.find(mv => mv.id === s?.movieId);
    if (m) {
      ticketsByMovie[m.title] = (ticketsByMovie[m.title] || 0) + (b.seats?.length || 0);
    }
  });
  const movieChartData = Object.entries(ticketsByMovie).sort((a, b) => b[1] - a[1]);
  const maxMovieTickets = Math.max(...movieChartData.map(d => d[1]), 1);

  // Revenue per cinema
  const revenueByCinema = {};
  confirmedBookings.forEach(b => {
    const s = shows.find(sh => sh.id === b.showId);
    const sc = screens.find(scr => scr.id === s?.screenId);
    const c = cinemas.find(cin => cin.id === sc?.cinemaId);
    if (c) {
      revenueByCinema[c.name] = (revenueByCinema[c.name] || 0) + (b.total || 0);
    }
  });
  const cinemaChartData = Object.entries(revenueByCinema).sort((a, b) => b[1] - a[1]);
  const maxCinemaRev = Math.max(...cinemaChartData.map(d => d[1]), 1);

  return (
    <AdminLayout
      title="Executive Operations Dashboard"
      subtitle="Real-time KPI metrics, ticket sales volume, screen occupancy, and branch revenue."
    >
      <div className="space-y-8">
        {/* KPI Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#111726] border border-[#1f2b42] p-5 rounded-2xl space-y-2 shadow-lg">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Tickets Sold</span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Ticket className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white font-['Space_Grotesk']">
              {totalTickets}
            </div>
            <div className="text-[11px] text-emerald-400 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>Confirmed bookings issued</span>
            </div>
          </div>

          <div className="bg-[#111726] border border-[#1f2b42] p-5 rounded-2xl space-y-2 shadow-lg">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Gross Revenue</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white font-['Space_Grotesk']">
              {CURRENCY} {totalRevenue.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400">
              Across all 3 branches
            </div>
          </div>

          <div className="bg-[#111726] border border-[#1f2b42] p-5 rounded-2xl space-y-2 shadow-lg">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Bookings</span>
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white font-['Space_Grotesk']">
              {bookings.length}
            </div>
            <div className="text-[11px] text-slate-400">
              {confirmedBookings.length} confirmed • {bookings.length - confirmedBookings.length} other
            </div>
          </div>

          <div className="bg-[#111726] border border-[#1f2b42] p-5 rounded-2xl space-y-2 shadow-lg">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Avg. Occupancy</span>
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <Armchair className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white font-['Space_Grotesk']">
              {avgOcc}%
            </div>
            <div className="text-[11px] text-cyan-300">
              Today's scheduled shows
            </div>
          </div>
        </div>

        {/* Visual Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Movie popularity chart */}
          <div className="bg-[#111726] border border-[#1f2b42] p-6 rounded-3xl space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#1f2b42] pb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Film className="w-4 h-4 text-amber-400" />
                Tickets Sold per Movie
              </h3>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                COUNT(Seats)
              </span>
            </div>

            <div className="space-y-3 pt-2">
              {movieChartData.slice(0, 5).map(([title, count]) => {
                const pct = Math.round((count / maxMovieTickets) * 100);
                return (
                  <div key={title} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-200 truncate pr-2">{title}</span>
                      <span className="font-mono font-bold text-amber-400">{count} tickets</span>
                    </div>
                    <div className="w-full h-2.5 bg-[#182238] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Revenue per branch */}
          <div className="bg-[#111726] border border-[#1f2b42] p-6 rounded-3xl space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#1f2b42] pb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-purple-400" />
                Revenue per Cinema Branch
              </h3>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                SUM(Payment.amount)
              </span>
            </div>

            <div className="space-y-3 pt-2">
              {cinemaChartData.map(([cinemaName, rev]) => {
                const pct = Math.round((rev / maxCinemaRev) * 100);
                return (
                  <div key={cinemaName} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-200">{cinemaName}</span>
                      <span className="font-mono font-bold text-emerald-400">
                        {CURRENCY} {rev.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-[#182238] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-400 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Today's Shows & Occupancy */}
        <div className="bg-[#111726] border border-[#1f2b42] rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#1f2b42] pb-3">
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-cyan-400" />
                Today's Scheduled Shows &amp; Live Occupancy
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Date: {todayDateStr}</p>
            </div>
            <Link
              to="/admin/shows"
              className="text-xs text-amber-400 hover:underline font-semibold"
            >
              Manage Schedule →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-[#1f2b42]">
                  <th className="pb-3 font-semibold">Time</th>
                  <th className="pb-3 font-semibold">Movie</th>
                  <th className="pb-3 font-semibold">Screen</th>
                  <th className="pb-3 font-semibold">Branch</th>
                  <th className="pb-3 font-semibold">Price</th>
                  <th className="pb-3 font-semibold">Occupancy Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f2b42]">
                {todayShows.slice(0, 6).map(show => {
                  const m = movies.find(mv => mv.id === show.movieId);
                  const sc = screens.find(scr => scr.id === show.screenId);
                  const c = cinemas.find(cin => cin.id === sc?.cinemaId);
                  const occ = getShowOcc(show);

                  return (
                    <tr key={show.id} className="hover:bg-[#182238]/40">
                      <td className="py-3 font-mono font-bold text-white">
                        {show.start} – {show.end}
                      </td>
                      <td className="py-3 font-semibold text-slate-200">{m?.title}</td>
                      <td className="py-3 text-slate-400">{sc?.name} ({sc?.type})</td>
                      <td className="py-3 text-slate-400">{c?.name}</td>
                      <td className="py-3 font-bold text-amber-400">{CURRENCY} {show.basePrice}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2 max-w-[140px]">
                          <div className="w-full h-2 bg-[#182238] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-cyan-400 rounded-full"
                              style={{ width: `${occ.pct}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11px] text-slate-400 whitespace-nowrap">
                            {occ.pct}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Transactions Table */}
        <div className="bg-[#111726] border border-[#1f2b42] rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#1f2b42] pb-3">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Ticket className="w-4 h-4 text-emerald-400" />
              Recent Customer Bookings
            </h3>
            <Link
              to="/admin/bookings"
              className="text-xs text-amber-400 hover:underline font-semibold"
            >
              View All Bookings →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-[#1f2b42]">
                  <th className="pb-3 font-semibold">Booking ID</th>
                  <th className="pb-3 font-semibold">Customer</th>
                  <th className="pb-3 font-semibold">Movie</th>
                  <th className="pb-3 font-semibold">Seats</th>
                  <th className="pb-3 font-semibold">Total</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f2b42]">
                {bookings.slice(0, 6).map(b => {
                  const s = shows.find(sh => sh.id === b.showId);
                  const m = movies.find(mv => mv.id === s?.movieId);

                  return (
                    <tr key={b.id} className="hover:bg-[#182238]/40">
                      <td className="py-3 font-mono font-bold text-amber-400">{b.id}</td>
                      <td className="py-3 text-slate-200">
                        <div className="font-semibold">{b.customer?.name}</div>
                        <div className="text-[10px] text-slate-500">{b.customer?.email}</div>
                      </td>
                      <td className="py-3 font-medium text-slate-300">{m?.title || 'Movie'}</td>
                      <td className="py-3 font-mono text-slate-400">
                        {b.seats?.map(st => st.id).join(', ')}
                      </td>
                      <td className="py-3 font-bold text-white">{CURRENCY} {b.total}</td>
                      <td className="py-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            b.status === 'CONFIRMED'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-red-500/20 text-red-300 border border-red-500/30'
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="py-3">
                        <button
                          onClick={() => setSelectedBookingModal(b)}
                          className="bg-[#182238] hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Booking Quick Inspection Modal */}
      {selectedBookingModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111726] border border-[#23304a] rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-[#23304a] pb-3">
              <h3 className="font-bold text-white text-base">
                Booking #{selectedBookingModal.id}
              </h3>
              <button
                onClick={() => setSelectedBookingModal(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-[#182238]">
                <span className="text-slate-400">Customer:</span>
                <span className="font-bold text-white">
                  {selectedBookingModal.customer?.name} ({selectedBookingModal.customer?.email})
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#182238]">
                <span className="text-slate-400">Seats Reserved:</span>
                <span className="font-bold text-amber-400">
                  {selectedBookingModal.seats?.map(s => `${s.id} (${s.type})`).join(', ')}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#182238]">
                <span className="text-slate-400">Payment Gateway:</span>
                <span className="font-bold text-slate-200">
                  {selectedBookingModal.payment?.method} ({selectedBookingModal.payment?.ref})
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#182238]">
                <span className="text-slate-400">Total Charged:</span>
                <span className="font-extrabold text-base text-emerald-400">
                  {CURRENCY} {selectedBookingModal.total}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedBookingModal(null)}
                className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
