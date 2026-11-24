import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Popcorn,
  ArrowRight,
  ArrowLeft,
  Plus,
  Minus,
  Sparkles,
  CheckCircle,
  ShoppingBag
} from 'lucide-react';
import { useCinema } from '../context/CinemaContext';
import { useCart } from '../context/CartContext';
import { CURRENCY } from '../data/initialData';
import BookingStepper from '../components/BookingStepper';

export default function FoodSelection() {
  const navigate = useNavigate();
  const { foodItems, movies, screens, cinemas, shows } = useCinema();
  const { cart, updateFoodQuantity, seatsTotal, foodTotal, subtotal } = useCart();

  const [selectedCategory, setSelectedCategory] = useState('All');

  // Verify that seats are selected; if not redirect to home or show
  if (!cart.seats || !cart.seats.length) {
    return (
      <div className="text-center py-20 space-y-4">
        <h2 className="text-xl font-bold text-white">No active seat booking session found</h2>
        <p className="text-xs text-slate-400">Please choose a movie and select your seats first.</p>
        <Link
          to="/"
          className="inline-block bg-amber-500 text-black font-bold px-6 py-2.5 rounded-xl text-xs"
        >
          Browse Movies
        </Link>
      </div>
    );
  }

  const show = shows.find(s => s.id === cart.showId);
  const movie = movies.find(m => m.id === show?.movieId);
  const screen = screens.find(sc => sc.id === show?.screenId);
  const cinema = cinemas.find(c => c.id === screen?.cinemaId);

  const categories = ['All', ...new Set(foodItems.map(f => f.category))];

  const filteredFood = foodItems.filter(f =>
    selectedCategory === 'All' ? true : f.category === selectedCategory
  );

  return (
    <div className="space-y-8">
      {/* Booking Stepper Header */}
      <BookingStepper currentStep={2} />

      {/* Title & Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#23304a] pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white font-['Space_Grotesk'] flex items-center gap-2.5">
            <Popcorn className="w-6 h-6 text-amber-400" />
            Add Refreshments &amp; Snacks
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Pre-order concessions online for fast-lane counter collection when you arrive.
          </p>
        </div>

        {/* Categories Tab Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto bg-[#111726] p-1.5 rounded-2xl border border-[#23304a] scrollbar-none">
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === c
                  ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Food Items Catalog */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredFood.map(item => {
            const qty = cart.food[item.id] || 0;
            const isAvailable = item.available;

            return (
              <div
                key={item.id}
                className={`bg-[#111726] border rounded-2xl p-5 flex flex-col justify-between transition-all ${
                  qty > 0
                    ? 'border-amber-400/60 shadow-lg shadow-amber-500/10'
                    : 'border-[#23304a] hover:border-slate-700'
                } ${!isAvailable ? 'opacity-50' : ''}`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-3xl p-2.5 bg-[#182238] rounded-xl border border-[#23304a]">
                      {item.icon || '🍿'}
                    </span>
                    <div className="text-right">
                      <span className="font-extrabold text-base text-amber-400">
                        {CURRENCY} {item.price}
                      </span>
                      {item.calories && (
                        <span className="block text-[10px] text-slate-500 mt-0.5">
                          {item.calories}
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-white text-sm leading-snug">{item.name}</h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="pt-4 mt-4 border-t border-[#23304a] flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400">
                    {isAvailable ? 'Available Now' : 'Sold Out'}
                  </span>

                  {isAvailable && (
                    <div className="flex items-center gap-2 bg-[#182238] border border-[#23304a] rounded-xl p-1">
                      <button
                        onClick={() => updateFoodQuantity(item.id, -1)}
                        disabled={qty <= 0}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                          qty > 0
                            ? 'bg-slate-700 hover:bg-slate-600 text-white'
                            : 'text-slate-600 cursor-not-allowed'
                        }`}
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>

                      <span className="w-6 text-center font-bold text-xs text-white">{qty}</span>

                      <button
                        onClick={() => updateFoodQuantity(item.id, 1)}
                        className="w-7 h-7 rounded-lg bg-amber-500 hover:bg-amber-400 text-black flex items-center justify-center font-bold transition-colors shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Sidebar Summary */}
        <div className="space-y-6">
          <div className="bg-[#111726] border border-[#23304a] rounded-3xl p-6 space-y-6 shadow-xl sticky top-24">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                Cart Summary
              </span>
              <h3 className="text-lg font-bold text-white mt-1">{movie?.title}</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {cinema?.name} • {screen?.name}
              </p>
            </div>

            {/* Seats Snapshot */}
            <div className="p-3.5 rounded-2xl bg-[#182238] border border-[#23304a] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold">
                  Seats ({cart.seats.length}):
                </span>
                <span className="font-bold text-white">{CURRENCY} {seatsTotal}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {cart.seats.map(s => (
                  <span
                    key={s.id}
                    className="text-[11px] bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded font-bold"
                  >
                    {s.id}
                  </span>
                ))}
              </div>
            </div>

            {/* Refreshments List */}
            <div className="space-y-2 border-t border-[#23304a] pt-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Concessions Pre-order:</span>
                <span className="font-bold text-white">{CURRENCY} {foodTotal}</span>
              </div>

              {Object.keys(cart.food).length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {Object.entries(cart.food).map(([id, qty]) => {
                    const item = foodItems.find(f => String(f.id) === String(id));
                    if (!item) return null;
                    return (
                      <div
                        key={id}
                        className="flex items-center justify-between text-xs text-slate-300"
                      >
                        <span className="truncate pr-2">
                          {item.name} × {qty}
                        </span>
                        <span className="font-bold text-white shrink-0">
                          {CURRENCY} {item.price * qty}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 italic">
                  No refreshments selected (optional).
                </p>
              )}
            </div>

            {/* Total */}
            <div className="border-t border-[#23304a] pt-4 space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400 font-medium">Subtotal Payable</span>
                <span className="font-extrabold text-2xl text-amber-400">
                  {CURRENCY} {subtotal}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-2">
              <button
                onClick={() => navigate('/book/checkout')}
                className="w-full py-3.5 rounded-xl font-extrabold text-sm bg-amber-500 hover:bg-amber-400 text-black flex items-center justify-center gap-2 shadow-xl shadow-amber-500/30 transition-all hover:scale-[1.02]"
              >
                Continue to Checkout
                <ArrowRight className="w-4 h-4" />
              </button>

              <Link
                to={`/book/seats/${cart.showId}`}
                className="w-full py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-transparent hover:bg-slate-800/60 flex items-center justify-center gap-1.5 transition-colors border border-transparent hover:border-slate-700"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Change Seats
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
