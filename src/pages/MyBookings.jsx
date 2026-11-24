import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Ticket,
  Calendar,
  Building2,
  AlertCircle,
  ExternalLink,
  Ban,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useCinema } from '../context/CinemaContext';
import { useAuth } from '../context/AuthContext';
import { CURRENCY } from '../data/initialData';

export default function MyBookings() {
  const { bookings, shows, movies, screens, cinemas, cancelBooking } = useCinema();
  const { user } = useAuth();

  const [filterStatus, setFilterStatus] = useState('ALL');

  // Customer filter (show current user's bookings, or fallback to sample user)
  const currentEmail = user?.email || 'ali.raza@example.com';

  const userBookings = bookings.filter(b => {
    const matchesUser = b.customer?.email?.toLowerCase() === currentEmail.toLowerCase() ||
      b.customerId === user?.id;
    if (!matchesUser) return false;
    if (filterStatus === 'ALL') return true;
    return b.status === filterStatus;
  });

  const handleCancel = (bookingId) => {
    if (window.confirm('Are you sure you want to cancel this booking? Payment will be refunded and seats released.')) {
      cancelBooking(bookingId);
      alert('Booking cancelled and payment marked as REFUNDED.');
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#23304a] pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white font-['Space_Grotesk'] flex items-center gap-2.5">
            <Ticket className="w-6 h-6 text-amber-400" />
            My Bookings &amp; Tickets
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Showing booking records for: <strong className="text-white">{currentEmail}</strong>
          </p>
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-2 bg-[#111726] p-1.5 rounded-2xl border border-[#23304a]">
          {['ALL', 'CONFIRMED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterStatus === st
                  ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings List */}
      {userBookings.length > 0 ? (
        <div className="space-y-4">
          {userBookings.map(b => {
            const show = shows.find(s => s.id === b.showId);
            const movie = movies.find(m => m.id === show?.movieId);
            const screen = screens.find(sc => sc.id === show?.screenId);
            const cinema = cinemas.find(c => c.id === screen?.cinemaId);

            const isConfirmed = b.status === 'CONFIRMED';
            const isCancelled = b.status === 'CANCELLED';

            return (
              <div
                key={b.id}
                className="bg-[#111726] border border-[#23304a] hover:border-slate-700 rounded-3xl p-6 transition-all shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                {/* Left Info */}
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-extrabold text-amber-400">
                      {b.id}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 ${
                        isConfirmed
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {isConfirmed ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {b.status}
                    </span>
                    <span className="text-xs text-slate-500">
                      Booked on: {b.time}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white font-['Space_Grotesk']">
                      {movie?.title || 'Movie Show'}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-slate-500" />
                      <span>{cinema?.name} • {screen?.name} ({screen?.type})</span>
                      <span>•</span>
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>{show?.date} at {show?.start}</span>
                    </p>
                  </div>

                  {/* Seat badges */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] text-slate-400 font-semibold mr-1">Seats:</span>
                    {b.seats.map((s, i) => (
                      <span
                        key={i}
                        className="bg-slate-800 text-amber-300 border border-slate-700 px-2 py-0.5 rounded text-[11px] font-mono font-bold"
                      >
                        {s.id} ({s.type})
                      </span>
                    ))}
                    {b.food && b.food.length > 0 && (
                      <span className="text-[11px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded font-medium ml-2">
                        +{b.food.reduce((sum, f) => sum + f.qty, 0)} Snacks
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Actions & Amount */}
                <div className="flex flex-col md:items-end justify-between gap-3 border-t md:border-t-0 border-[#23304a] pt-4 md:pt-0">
                  <div className="text-left md:text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Paid</span>
                    <span className="font-extrabold text-xl text-white">
                      {CURRENCY} {b.total}
                    </span>
                    <span className="block text-[10px] text-slate-400">
                      via {b.payment?.method} ({b.payment?.status})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isConfirmed && (
                      <button
                        onClick={() => handleCancel(b.id)}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        Cancel
                      </button>
                    )}

                    <Link
                      to={`/tickets/${b.id}`}
                      className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-4 py-2 rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                    >
                      <Ticket className="w-3.5 h-3.5" />
                      View Pass
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-[#111726] border border-dashed border-[#23304a] rounded-3xl space-y-4">
          <Ticket className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No bookings found</h3>
          <p className="text-xs text-slate-400">You don't have any tickets matching this criteria.</p>
          <Link
            to="/"
            className="inline-block bg-amber-500 hover:bg-amber-400 text-black font-bold px-5 py-2.5 rounded-xl text-xs shadow-lg shadow-amber-500/20"
          >
            Explore Movies &amp; Book Tickets
          </Link>
        </div>
      )}
    </div>
  );
}
