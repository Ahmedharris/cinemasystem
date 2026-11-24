import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  CreditCard,
  Smartphone,
  Banknote,
  ShieldCheck,
  Tag,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Sparkles,
  X
} from 'lucide-react';
import { useCinema } from '../context/CinemaContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { CURRENCY } from '../data/initialData';
import BookingStepper from '../components/BookingStepper';

export default function Checkout() {
  const navigate = useNavigate();
  const { shows, movies, screens, cinemas, foodItems, createBooking } = useCinema();
  const {
    cart,
    seatsTotal,
    foodTotal,
    subtotal,
    discountTotal,
    grandTotal,
    applyPromo,
    removePromo,
    clearCart
  } = useCart();
  const { user } = useAuth();

  if (!cart.seats || !cart.seats.length) {
    return (
      <div className="text-center py-20 space-y-4">
        <h2 className="text-xl font-bold text-white">No active checkout session</h2>
        <p className="text-xs text-slate-400">Please choose a movie and select seats first.</p>
        <Link to="/" className="inline-block bg-amber-500 text-black font-bold px-6 py-2 rounded-xl text-xs">
          Browse Movies
        </Link>
      </div>
    );
  }

  const show = shows.find(s => s.id === cart.showId);
  const movie = movies.find(m => m.id === show?.movieId);
  const screen = screens.find(sc => sc.id === show?.screenId);
  const cinema = cinemas.find(c => c.id === screen?.cinemaId);

  // Form State
  const [name, setName] = useState(user?.name || 'Ali Raza');
  const [email, setEmail] = useState(user?.email || 'ali.raza@example.com');
  const [phone, setPhone] = useState(user?.phone || '0300-1112233');

  const [paymentMethod, setPaymentMethod] = useState('Card');
  const [simulatedResult, setSimulatedResult] = useState('SUCCESS');

  // Card details
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('888');

  // Mobile wallet details
  const [mobileWalletNumber, setMobileWalletNumber] = useState('0300-1112233');

  // Promo code input
  const [promoInput, setPromoInput] = useState('');
  const [promoMessage, setPromoMessage] = useState(null);

  const handleApplyPromo = (e) => {
    e.preventDefault();
    if (!promoInput) return;
    const res = applyPromo(promoInput);
    setPromoMessage(res);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (simulatedResult === 'FAILED') {
      alert('❌ Simulated Payment Failed: The transaction could not be processed. Please try again or switch simulation result.');
      return;
    }

    const txnRef = `TXN-${Math.floor(10000 + Math.random() * 90000)}`;

    const newBooking = createBooking({
      customerId: user?.id || 1,
      customer: { name, email, phone },
      showId: show.id,
      seats: cart.seats,
      food: Object.entries(cart.food).map(([id, qty]) => ({
        id: Number(id),
        qty,
        unit: foodItems.find(f => f.id === Number(id))?.price || 0
      })),
      payment: {
        method: paymentMethod,
        status: 'SUCCESS',
        ref: txnRef,
        amount: grandTotal
      },
      total: grandTotal
    });

    clearCart();
    navigate(`/tickets/${newBooking.id}`);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <BookingStepper currentStep={3} />

      <div className="border-b border-[#23304a] pb-4">
        <h1 className="text-2xl font-extrabold text-white font-['Space_Grotesk'] flex items-center gap-2.5">
          <CreditCard className="w-6 h-6 text-amber-400" />
          Checkout &amp; Payment
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Review your tickets, select your preferred payment gateway, and confirm your reservation.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Form: Details & Payment Gateways */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Contact Panel */}
          <div className="bg-[#111726] border border-[#23304a] rounded-3xl p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              1. Customer Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#182238] border border-[#23304a] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#182238] border border-[#23304a] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">Mobile Phone (for SMS Tickets)</label>
                <input
                  type="tel"
                  required
                  placeholder="0300-0000000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#182238] border border-[#23304a] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="bg-[#111726] border border-[#23304a] rounded-3xl p-6 space-y-5 shadow-xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-400" />
              2. Payment Method
            </h3>

            {/* Gateway Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: 'Card', label: 'Credit / Debit', icon: CreditCard },
                { id: 'Easypaisa', label: 'Easypaisa', icon: Smartphone },
                { id: 'JazzCash', label: 'JazzCash', icon: Smartphone },
                { id: 'Cash at counter', label: 'Pay at Counter', icon: Banknote }
              ].map((m) => {
                const Icon = m.icon;
                const active = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id)}
                    className={`p-3.5 rounded-2xl border text-center flex flex-col items-center justify-center gap-2 transition-all ${
                      active
                        ? 'bg-amber-500/10 border-amber-400 text-amber-400 shadow-md font-bold'
                        : 'bg-[#182238] border-[#23304a] text-slate-400 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs leading-none">{m.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Credit Card Input Sub-form */}
            {paymentMethod === 'Card' && (
              <div className="p-5 rounded-2xl bg-[#182238] border border-[#23304a] space-y-4 animate-fade-in">
                <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-[#23304a]">
                  <span>Encrypted 256-Bit SSL Checkout</span>
                  <div className="flex items-center gap-1.5">
                    <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-slate-300 font-mono">VISA</span>
                    <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-slate-300 font-mono">Mastercard</span>
                    <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-slate-300 font-mono">PayPak</span>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Card Number</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full bg-[#111726] border border-[#23304a] rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">Expiry Date</label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full bg-[#111726] border border-[#23304a] rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">CVV / CVC</label>
                    <input
                      type="password"
                      maxLength={4}
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      className="w-full bg-[#111726] border border-[#23304a] rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Mobile Wallet Sub-form */}
            {(paymentMethod === 'Easypaisa' || paymentMethod === 'JazzCash') && (
              <div className="p-5 rounded-2xl bg-[#182238] border border-[#23304a] space-y-3 animate-fade-in">
                <span className="text-xs font-semibold text-slate-300 block">
                  Enter your {paymentMethod} registered mobile wallet account:
                </span>
                <input
                  type="tel"
                  required
                  placeholder="03xx-xxxxxxx"
                  value={mobileWalletNumber}
                  onChange={(e) => setMobileWalletNumber(e.target.value)}
                  className="w-full bg-[#111726] border border-[#23304a] rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                />
                <p className="text-[11px] text-slate-500">
                  You will receive an in-app approval prompt or USSD confirmation on your device.
                </p>
              </div>
            )}

            {paymentMethod === 'Cash at counter' && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1">
                <p className="font-bold">⚠️ Pay at counter policy:</p>
                <p className="text-[11px] text-amber-300/80">
                  Please arrive at {cinema?.name} at least 20 minutes prior to showtime to pay in cash and collect your printed boarding pass.
                </p>
              </div>
            )}

            {/* Simulation Controller for Academic Testing */}
            <div className="p-4 rounded-2xl bg-[#090d16] border border-dashed border-[#23304a] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-400">Simulation Mode (Testing Harness):</span>
                <select
                  value={simulatedResult}
                  onChange={(e) => setSimulatedResult(e.target.value)}
                  className="bg-[#182238] border border-[#23304a] rounded-lg px-2.5 py-1 text-xs text-white font-semibold focus:outline-none"
                >
                  <option value="SUCCESS">Simulate: Success</option>
                  <option value="FAILED">Simulate: Payment Failure</option>
                </select>
              </div>
              <p className="text-[10px] text-slate-500">
                You can toggle this to test how the system handles both successful issuance and payment declines.
              </p>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Order Summary & Promo Code */}
        <div className="space-y-6">
          <div className="bg-[#111726] border border-[#23304a] rounded-3xl p-6 space-y-6 shadow-xl sticky top-24">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                Final Review
              </span>
              <h3 className="text-lg font-bold text-white mt-1">{movie?.title}</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {cinema?.name} • {screen?.name}
              </p>
              <p className="text-xs text-slate-400">
                {show.date} • {show.start}
              </p>
            </div>

            {/* Line items breakdown */}
            <div className="space-y-3 border-t border-[#23304a] pt-4 text-xs">
              <div className="space-y-1.5">
                <div className="flex justify-between font-semibold text-slate-300">
                  <span>Seats ({cart.seats.length}):</span>
                  <span>{CURRENCY} {seatsTotal}</span>
                </div>
                <div className="text-[11px] text-slate-500 pl-2">
                  {cart.seats.map(s => `${s.id} (${s.type})`).join(', ')}
                </div>
              </div>

              {foodTotal > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-[#23304a]/60">
                  <div className="flex justify-between font-semibold text-slate-300">
                    <span>Refreshments:</span>
                    <span>{CURRENCY} {foodTotal}</span>
                  </div>
                  {Object.entries(cart.food).map(([id, qty]) => {
                    const item = foodItems.find(f => String(f.id) === String(id));
                    if (!item) return null;
                    return (
                      <div key={id} className="flex justify-between text-[11px] text-slate-500 pl-2">
                        <span>{item.name} × {qty}</span>
                        <span>{CURRENCY} {item.price * qty}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Promo Code Form */}
              <div className="pt-3 border-t border-[#23304a]">
                {cart.promoCode ? (
                  <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
                    <span className="font-bold flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5" />
                      {cart.promoCode} (-{cart.discountPct}%)
                    </span>
                    <button
                      type="button"
                      onClick={removePromo}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Promo code (try CINEMA20)"
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value)}
                        className="w-full bg-[#182238] border border-[#23304a] rounded-xl px-3 py-1.5 text-xs text-white uppercase placeholder:normal-case placeholder-slate-500 focus:outline-none focus:border-amber-400"
                      />
                      <button
                        type="button"
                        onClick={handleApplyPromo}
                        className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold px-3 py-1.5 rounded-xl text-xs border border-amber-500/40 transition-colors"
                      >
                        Apply
                      </button>
                    </div>
                    {promoMessage && (
                      <p className={`text-[10px] ${promoMessage.success ? 'text-emerald-400' : 'text-red-400'}`}>
                        {promoMessage.message}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Discount line */}
              {discountTotal > 0 && (
                <div className="flex justify-between font-bold text-emerald-400 pt-1">
                  <span>Discount Applied:</span>
                  <span>- {CURRENCY} {discountTotal}</span>
                </div>
              )}

              {/* Grand Total */}
              <div className="pt-4 border-t border-[#23304a] flex items-center justify-between">
                <span className="font-bold text-white text-sm">Total Payable</span>
                <span className="font-extrabold text-2xl text-amber-400">
                  {CURRENCY} {grandTotal}
                </span>
              </div>
            </div>

            {/* Final Confirmation Button */}
            <button
              type="submit"
              className="w-full py-4 rounded-xl font-extrabold text-sm bg-amber-500 hover:bg-amber-400 text-black flex items-center justify-center gap-2 shadow-xl shadow-amber-500/30 transition-all hover:scale-[1.02]"
            >
              Confirm &amp; Pay {CURRENCY} {grandTotal}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
