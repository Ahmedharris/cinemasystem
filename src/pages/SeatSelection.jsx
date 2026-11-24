import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Armchair,
  Clock,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  ShieldCheck,
  Check
} from 'lucide-react';
import { useCinema } from '../context/CinemaContext';
import { useCart } from '../context/CartContext';
import { CURRENCY, getScreenSeats } from '../data/initialData';
import BookingStepper from '../components/BookingStepper';

export default function SeatSelection() {
  const { showId } = useParams();
  const navigate = useNavigate();
  const { shows, movies, screens, cinemas, calculateSeatPrice, getOccupiedSeats } = useCinema();
  const { cart, selectSeats, formatTimer, timeLeft } = useCart();

  const show = shows.find(s => String(s.id) === String(showId)) || shows[0];
  const movie = movies.find(m => m.id === show?.movieId);
  const screen = screens.find(sc => sc.id === show?.screenId);
  const cinema = cinemas.find(c => c.id === screen?.cinemaId);

  const occupiedSeats = getOccupiedSeats(show.id);
  const allSeats = getScreenSeats(screen);

  // Initial selected seats (restore from cart if returning to this step for same show)
  const [selectedSeatIds, setSelectedSeatIds] = useState(() => {
    if (cart.showId === show.id && cart.seats?.length) {
      return cart.seats.map(s => s.id);
    }
    return [];
  });

  const MAX_SEATS = 8;

  const toggleSeat = (seat) => {
    if (occupiedSeats.includes(seat.id)) return;

    if (selectedSeatIds.includes(seat.id)) {
      setSelectedSeatIds(prev => prev.filter(id => id !== seat.id));
    } else {
      if (selectedSeatIds.length >= MAX_SEATS) {
        alert(`You can select a maximum of ${MAX_SEATS} seats per booking.`);
        return;
      }
      setSelectedSeatIds(prev => [...prev, seat.id]);
    }
  };

  const handleProceed = () => {
    if (!selectedSeatIds.length) return;

    const formattedSeats = selectedSeatIds.map(id => {
      const seatObj = allSeats.find(s => s.id === id);
      return {
        id,
        row: seatObj.row,
        number: seatObj.number,
        type: seatObj.type,
        price: calculateSeatPrice(show, seatObj.type)
      };
    });

    selectSeats(show.id, formattedSeats);
    navigate('/book/food');
  };

  const selectedSeatsData = selectedSeatIds.map(id => {
    const s = allSeats.find(seat => seat.id === id);
    return {
      id,
      type: s?.type || 'Standard',
      price: calculateSeatPrice(show, s?.type || 'Standard')
    };
  });

  const totalSeatsPrice = selectedSeatsData.reduce((sum, s) => sum + s.price, 0);

  return (
    <div className="space-y-8">
      {/* Stepper Header */}
      <BookingStepper currentStep={1} />

      {/* Show Context Banner */}
      <div className="bg-[#111726] border border-[#23304a] rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            to={`/movie/${movie?.id}`}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white font-['Space_Grotesk'] leading-tight">
              {movie?.title}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {cinema?.name} • {screen?.name} ({screen?.type}) • {show.date} at {show.start}
            </p>
          </div>
        </div>

        {/* Reservation Hold Timer Badge */}
        {selectedSeatIds.length > 0 && (
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-3.5 py-1.5 rounded-full text-xs text-amber-400 font-semibold self-start md:self-auto">
            <Clock className="w-3.5 h-3.5 animate-spin" />
            <span>Seats held for:</span>
            <span className="font-mono text-white bg-amber-500/20 px-2 py-0.5 rounded">
              {formatTimer()}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cinema Theater Viewport */}
        <div className="lg:col-span-2 bg-[#111726] border border-[#23304a] rounded-3xl p-6 md:p-8 flex flex-col items-center shadow-2xl relative overflow-hidden">
          {/* Ambient Curved Screen Indicator */}
          <div className="cinema-screen-container w-full">
            <div className="cinema-screen-curve" />
            <div className="screen-text">ALL EYES THIS WAY • CINEMA SCREEN</div>
          </div>

          {/* Seat Grid Map */}
          <div className="w-full overflow-x-auto py-6 flex flex-col items-center scrollbar-none">
            <div className="min-w-fit space-y-3">
              {Array.from({ length: screen?.rows || 8 }, (_, r) => {
                const rowLabel = String.fromCharCode(65 + r);
                const rowSeats = allSeats.filter(s => s.row === rowLabel);
                const halfCol = Math.floor((screen?.cols || 12) / 2);

                return (
                  <div key={rowLabel} className="flex items-center gap-2">
                    {/* Left Row Label */}
                    <span className="w-5 text-center font-bold text-xs text-slate-500">
                      {rowLabel}
                    </span>

                    {/* Seats in Row */}
                    <div className="flex items-center gap-2">
                      {rowSeats.map(seat => {
                        const isOccupied = occupiedSeats.includes(seat.id);
                        const isSelected = selectedSeatIds.includes(seat.id);
                        const price = calculateSeatPrice(show, seat.type);

                        let seatClass = 'seat-standard';
                        if (seat.type === 'Premium') seatClass = 'seat-premium';
                        if (seat.type === 'VIP') seatClass = 'seat-vip';
                        if (isSelected) seatClass = 'seat-selected';
                        if (isOccupied) seatClass = 'seat-booked';

                        return (
                          <React.Fragment key={seat.id}>
                            <button
                              disabled={isOccupied}
                              onClick={() => toggleSeat(seat)}
                              title={`${seat.id} (${seat.type}) - ${CURRENCY} ${price} ${isOccupied ? '[Sold Out]' : ''}`}
                              className={`seat-button ${seatClass}`}
                            >
                              {isOccupied ? '✕' : seat.number}
                            </button>
                            {seat.number === halfCol && (
                              <div className="w-5 md:w-8 shrink-0" /> // Center Aisle Separation
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>

                    {/* Right Row Label */}
                    <span className="w-5 text-center font-bold text-xs text-slate-500">
                      {rowLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Seat Legend */}
          <div className="w-full pt-6 mt-4 border-t border-[#23304a] flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-[#1e293b] border border-[#334155]" />
              <span>Standard ({CURRENCY} {calculateSeatPrice(show, 'Standard')})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-[#1e3a8a] border border-[#2563eb]" />
              <span>Premium ({CURRENCY} {calculateSeatPrice(show, 'Premium')})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-[#78350f] border border-[#d97706]" />
              <span>VIP Recliner ({CURRENCY} {calculateSeatPrice(show, 'VIP')})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-amber-400 shadow-md shadow-amber-400/50" />
              <span className="text-amber-400 font-bold">Selected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-slate-900 border border-slate-800 text-[10px] flex items-center justify-center text-slate-600">
                ✕
              </div>
              <span>Reserved</span>
            </div>
          </div>
        </div>

        {/* Selection Summary Sidebar */}
        <div className="space-y-6">
          <div className="bg-[#111726] border border-[#23304a] rounded-3xl p-6 space-y-6 shadow-xl sticky top-24">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                Order Summary
              </span>
              <h3 className="text-lg font-bold text-white mt-1">{movie?.title}</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {cinema?.name} • {screen?.name}
              </p>
            </div>

            {/* Selected Seats Chips */}
            <div className="space-y-2 border-t border-[#23304a] pt-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Selected Seats:</span>
                <span className="font-bold text-white">
                  {selectedSeatIds.length} / {MAX_SEATS}
                </span>
              </div>

              {selectedSeatsData.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedSeatsData.map(s => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-[#182238] border border-[#23304a] text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="bg-amber-400 text-black font-extrabold px-2 py-0.5 rounded text-[11px]">
                          {s.id}
                        </span>
                        <span className="text-slate-300 font-medium">{s.type} Seat</span>
                      </div>
                      <span className="font-bold text-white">
                        {CURRENCY} {s.price}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center rounded-2xl bg-[#182238]/40 border border-dashed border-[#23304a] text-slate-500 text-xs">
                  Click on the cinema seat layout to select your preferred seats.
                </div>
              )}
            </div>

            {/* Subtotal */}
            <div className="border-t border-[#23304a] pt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Seats Subtotal</span>
                <span className="font-extrabold text-xl text-amber-400">
                  {CURRENCY} {totalSeatsPrice}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Taxes included. Refreshments and snacks can be added in the next step.
              </p>
            </div>

            {/* Proceed CTA */}
            <button
              disabled={selectedSeatIds.length === 0}
              onClick={handleProceed}
              className={`w-full py-3.5 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl transition-all ${
                selectedSeatIds.length > 0
                  ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/30 hover:scale-[1.02]'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              Continue to Refreshments
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
