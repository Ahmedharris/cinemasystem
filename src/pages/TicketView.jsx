import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Printer,
  Sparkles,
  Ticket,
  Film,
  Building2,
  Calendar,
  Clock,
  QrCode,
  CheckCircle,
  Share2,
  ArrowRight,
  Popcorn
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCinema } from '../context/CinemaContext';
import { CURRENCY } from '../data/initialData';
import BookingStepper from '../components/BookingStepper';

export default function TicketView() {
  const { bookingId } = useParams();
  const { bookings, shows, movies, screens, cinemas, foodItems } = useCinema();

  const booking = bookings.find(b => b.id === bookingId) || bookings[0];

  const show = shows.find(s => s.id === booking?.showId);
  const movie = movies.find(m => m.id === show?.movieId);
  const screen = screens.find(sc => sc.id === show?.screenId);
  const cinema = cinemas.find(c => c.id === screen?.cinemaId);

  // Trigger celebration confetti on mount
  useEffect(() => {
    if (booking?.status === 'CONFIRMED') {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [booking?.status]);

  if (!booking) {
    return (
      <div className="text-center py-20 space-y-4">
        <h2 className="text-xl font-bold text-white">Booking not found</h2>
        <Link to="/my-bookings" className="inline-block bg-amber-500 text-black font-bold px-6 py-2.5 rounded-xl text-xs">
          View My Bookings
        </Link>
      </div>
    );
  }

  const isConfirmed = booking.status === 'CONFIRMED';

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div className="no-print">
        <BookingStepper currentStep={4} />
      </div>

      {/* Confirmation Header */}
      <div className="text-center space-y-2 no-print">
        <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-2xl">
          <CheckCircle className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-white font-['Space_Grotesk']">
          {isConfirmed ? 'Booking Confirmed!' : `Booking ${booking.status}`}
        </h1>
        <p className="text-xs text-slate-400">
          Booking Reference: <strong className="text-amber-400 font-mono text-sm">{booking.id}</strong> • Transaction Ref: {booking.payment?.ref || 'N/A'}
        </p>
      </div>

      {/* Perforated Boarding Pass Passports */}
      <div className="space-y-6">
        {booking.seats.map((seat, index) => (
          <div
            key={seat.id || index}
            className="ticket-wrapper bg-[#111726] border border-[#23304a] rounded-3xl overflow-hidden relative shadow-2xl flex flex-col md:flex-row"
          >
            {/* Left/Right Notch Cutouts */}
            <div className="ticket-notch-left hidden md:block" />
            <div className="ticket-notch-right hidden md:block" />

            {/* Main Ticket Pass Body */}
            <div className="p-6 md:p-8 flex-1 space-y-5">
              <div className="flex items-center justify-between">
                <span className="bg-amber-400 text-black text-xs font-black px-2.5 py-1 rounded-lg uppercase tracking-wider">
                  {screen?.type} Pass
                </span>
                <span className="text-xs font-bold text-slate-400 font-mono">
                  TICKET #{booking.id.replace('BK-', '')}-{seat.id}
                </span>
              </div>

              <div>
                <h2 className="text-2xl font-extrabold text-white font-['Space_Grotesk'] leading-tight">
                  {movie?.title}
                </h2>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-amber-400" />
                  {cinema?.name}, {cinema?.city} ({screen?.name})
                </p>
              </div>

              {/* Grid of Ticket Details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-3 border-y border-[#23304a] text-xs">
                <div>
                  <span className="text-slate-500 font-semibold block text-[10px] uppercase">Date</span>
                  <strong className="text-white font-bold">{show?.date}</strong>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block text-[10px] uppercase">Time</span>
                  <strong className="text-white font-bold">{show?.start}</strong>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block text-[10px] uppercase">Seat</span>
                  <span className="bg-amber-400 text-black font-extrabold px-2 py-0.5 rounded text-xs">
                    {seat.id}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block text-[10px] uppercase">Seat Tier</span>
                  <strong className="text-slate-200 font-semibold">{seat.type}</strong>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Guest: <strong>{booking.customer?.name}</strong></span>
                <span>Payment: <strong>{booking.payment?.method} ({CURRENCY} {seat.price})</strong></span>
              </div>
            </div>

            {/* Ticket Stub (Barcode & Scanner QR) */}
            <div className="bg-[#0c1220] border-t md:border-t-0 md:border-l border-dashed border-[#23304a] p-6 flex flex-col items-center justify-center min-w-[200px] text-center space-y-3">
              {/* QR Code Graphic */}
              <div className="w-28 h-28 bg-white p-2 rounded-2xl flex items-center justify-center shadow-lg">
                <svg viewBox="0 0 100 100" className="w-full h-full text-black fill-current">
                  {/* Stylized QR Matrix Pattern */}
                  <rect x="5" y="5" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="6" />
                  <rect x="13" y="13" width="14" height="14" />
                  <rect x="65" y="5" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="6" />
                  <rect x="73" y="13" width="14" height="14" />
                  <rect x="5" y="65" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="6" />
                  <rect x="13" y="73" width="14" height="14" />
                  <rect x="45" y="10" width="10" height="10" />
                  <rect x="45" y="30" width="10" height="10" />
                  <rect x="45" y="50" width="10" height="10" />
                  <rect x="25" y="45" width="10" height="10" />
                  <rect x="65" y="45" width="20" height="10" />
                  <rect x="55" y="65" width="15" height="15" />
                  <rect x="75" y="75" width="15" height="15" />
                </svg>
              </div>

              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                SCAN AT USHER GATE
              </span>
              <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                ACTIVE PASS
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Pre-Ordered Food Voucher Voucher (If any) */}
      {booking.food && booking.food.length > 0 && (
        <div className="bg-[#111726] border border-[#23304a] rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#23304a] pb-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Popcorn className="w-4 h-4 text-amber-400" />
              Refreshments Pre-Order Voucher
            </h3>
            <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded font-bold uppercase">
              Fast-Track Collection
            </span>
          </div>

          <div className="space-y-2">
            {booking.food.map((f, i) => {
              const item = foodItems.find(it => it.id === f.id);
              return (
                <div key={i} className="flex items-center justify-between text-xs py-1 text-slate-300">
                  <span>{item?.name || `Item #${f.id}`} × {f.qty}</span>
                  <span className="font-bold text-white">{CURRENCY} {(f.unit || item?.price || 0) * f.qty}</span>
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-slate-500 pt-2 border-t border-[#23304a]">
            Show booking ID <strong>{booking.id}</strong> at the CineMax concessions counter to collect your order.
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-4 pt-4 no-print">
        <button
          onClick={() => window.print()}
          className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-6 py-3 rounded-xl text-xs flex items-center gap-2 border border-slate-700 shadow-md transition-all"
        >
          <Printer className="w-4 h-4 text-amber-400" />
          Print / Save PDF Tickets
        </button>

        <Link
          to="/my-bookings"
          className="bg-[#182238] hover:bg-[#202c48] text-slate-200 font-bold px-6 py-3 rounded-xl text-xs flex items-center gap-2 border border-[#23304a] transition-all"
        >
          View All My Bookings
        </Link>

        <Link
          to="/"
          className="bg-amber-500 hover:bg-amber-400 text-black font-extrabold px-6 py-3 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
        >
          Book Another Movie
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
