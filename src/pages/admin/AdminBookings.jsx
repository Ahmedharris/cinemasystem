import React, { useState } from 'react';
import { Ticket, Search, Ban, Eye, X, CheckCircle2, XCircle } from 'lucide-react';
import { useCinema } from '../../context/CinemaContext';
import { CURRENCY } from '../../data/initialData';
import AdminLayout from '../../components/AdminLayout';

export default function AdminBookings() {
  const { bookings, shows, movies, screens, cinemas, foodItems, cancelBooking } = useCinema();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [inspectBooking, setInspectBooking] = useState(null);

  const filtered = bookings.filter(b => {
    const text = `${b.id} ${b.customer?.name} ${b.customer?.email}`.toLowerCase();
    if (searchQuery && !text.includes(searchQuery.toLowerCase())) return false;
    if (statusFilter && b.status !== statusFilter) return false;
    return true;
  });

  const handleCancel = (bookingId) => {
    if (window.confirm('Cancel this booking and refund the payment? The reserved seats will be released immediately.')) {
      cancelBooking(bookingId);
      alert('Booking cancelled, seats released, and payment marked as REFUNDED.');
    }
  };

  return (
    <AdminLayout
      title="Sales &amp; Customer Bookings"
      subtitle="Complete ledger of tickets issued, seat mappings, concessions orders, and payment reconciliations."
    >
      <div className="space-y-6">
        {/* Filters */}
        <div className="bg-[#111726] border border-[#1f2b42] p-4 rounded-2xl flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by ID, customer name, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#182238] border border-[#23304a] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#182238] border border-[#23304a] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
          >
            <option value="">All Statuses</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>

        {/* Bookings Table */}
        <div className="bg-[#111726] border border-[#1f2b42] rounded-3xl p-6 shadow-xl space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-[#1f2b42]">
                  <th className="pb-3 font-semibold">Booking ID</th>
                  <th className="pb-3 font-semibold">Customer</th>
                  <th className="pb-3 font-semibold">Movie &amp; Showtime</th>
                  <th className="pb-3 font-semibold">Seats</th>
                  <th className="pb-3 font-semibold">Concessions</th>
                  <th className="pb-3 font-semibold">Total</th>
                  <th className="pb-3 font-semibold">Payment</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f2b42]">
                {filtered.map(b => {
                  const s = shows.find(sh => sh.id === b.showId);
                  const m = movies.find(mv => mv.id === s?.movieId);
                  const sc = screens.find(scr => scr.id === s?.screenId);
                  const c = cinemas.find(cin => cin.id === sc?.cinemaId);
                  const isConfirmed = b.status === 'CONFIRMED';

                  return (
                    <tr key={b.id} className="hover:bg-[#182238]/40">
                      <td className="py-3 font-mono font-bold text-amber-400">
                        {b.id}
                        <div className="text-[10px] text-slate-500 font-sans font-normal">{b.time}</div>
                      </td>
                      <td className="py-3 text-slate-200">
                        <div className="font-semibold">{b.customer?.name}</div>
                        <div className="text-[10px] text-slate-500">{b.customer?.email}</div>
                      </td>
                      <td className="py-3 text-slate-300">
                        <div className="font-semibold text-white">{m?.title || 'Movie'}</div>
                        <div className="text-[10px] text-slate-500">{c?.name} • {s?.date} {s?.start}</div>
                      </td>
                      <td className="py-3 font-mono text-slate-300 font-bold">
                        {b.seats?.map(st => st.id).join(', ')}
                      </td>
                      <td className="py-3 text-slate-400">
                        {b.food?.length ? `${b.food.reduce((acc, f) => acc + f.qty, 0)} items` : '—'}
                      </td>
                      <td className="py-3 font-extrabold text-white">
                        {CURRENCY} {b.total}
                      </td>
                      <td className="py-3">
                        <div className="font-semibold text-slate-300">{b.payment?.method}</div>
                        <div className={`text-[10px] font-bold ${b.payment?.status === 'SUCCESS' ? 'text-emerald-400' : 'text-red-400'}`}>
                          {b.payment?.status} {b.payment?.ref && `(${b.payment.ref})`}
                        </div>
                      </td>
                      <td className="py-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            isConfirmed
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-red-500/20 text-red-300 border border-red-500/30'
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="py-3 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => setInspectBooking(b)}
                          className="bg-[#182238] hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors"
                        >
                          Inspect
                        </button>
                        {isConfirmed && (
                          <button
                            onClick={() => handleCancel(b.id)}
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detailed Booking Inspection Modal */}
      {inspectBooking && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111726] border border-[#23304a] rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#23304a] pb-3">
              <div>
                <h3 className="font-bold text-white text-base">
                  Booking Inspection: {inspectBooking.id}
                </h3>
                <p className="text-[11px] text-slate-400">Timestamp: {inspectBooking.time}</p>
              </div>
              <button onClick={() => setInspectBooking(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Customer & Payment Info */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-[#182238] border border-[#23304a] text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Customer Details</span>
                <div className="font-bold text-white mt-0.5">{inspectBooking.customer?.name}</div>
                <div className="text-slate-400">{inspectBooking.customer?.email}</div>
                <div className="text-slate-400">{inspectBooking.customer?.phone}</div>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Payment Transaction</span>
                <div className="font-bold text-white mt-0.5">{inspectBooking.payment?.method}</div>
                <div className="text-emerald-400 font-bold">{inspectBooking.payment?.status}</div>
                <div className="text-slate-400 font-mono text-[11px]">Ref: {inspectBooking.payment?.ref || 'N/A'}</div>
              </div>
            </div>

            {/* Booking_Seat Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Booking_Seat Records (Mirroring Normalized Relational Schema)
              </h4>
              <table className="w-full text-left text-xs bg-[#182238]/60 rounded-xl overflow-hidden">
                <thead className="bg-[#182238] text-slate-400">
                  <tr>
                    <th className="p-2.5 font-semibold">Seat ID</th>
                    <th className="p-2.5 font-semibold">Seat Type</th>
                    <th className="p-2.5 font-semibold">Price Snapshot</th>
                    <th className="p-2.5 font-semibold">Digital Ticket ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#23304a]">
                  {inspectBooking.seats?.map(s => (
                    <tr key={s.id}>
                      <td className="p-2.5 font-mono font-bold text-white">{s.id}</td>
                      <td className="p-2.5 text-slate-300">{s.type}</td>
                      <td className="p-2.5 font-bold text-amber-400">{CURRENCY} {s.price}</td>
                      <td className="p-2.5 font-mono text-slate-400">
                        {inspectBooking.status === 'CONFIRMED' ? `TKT-${inspectBooking.id.slice(3)}-${s.id}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Food Order Details */}
            {inspectBooking.food && inspectBooking.food.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400">
                  Food_Order &amp; Order_Detail Records
                </h4>
                <table className="w-full text-left text-xs bg-[#182238]/60 rounded-xl overflow-hidden">
                  <thead className="bg-[#182238] text-slate-400">
                    <tr>
                      <th className="p-2.5 font-semibold">Item Name</th>
                      <th className="p-2.5 font-semibold">Qty</th>
                      <th className="p-2.5 font-semibold">Unit Price</th>
                      <th className="p-2.5 font-semibold">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#23304a]">
                    {inspectBooking.food.map((f, i) => {
                      const item = foodItems.find(it => it.id === f.id);
                      return (
                        <tr key={i}>
                          <td className="p-2.5 font-semibold text-white">{item?.name || `Item #${f.id}`}</td>
                          <td className="p-2.5 font-mono">{f.qty}</td>
                          <td className="p-2.5 font-mono text-slate-400">{CURRENCY} {f.unit}</td>
                          <td className="p-2.5 font-mono font-bold text-amber-400">{CURRENCY} {f.unit * f.qty}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-[#23304a]">
              <div className="text-xs text-slate-400">
                Booking Status: <strong className="text-white">{inspectBooking.status}</strong>
              </div>
              <div className="text-base font-extrabold text-white">
                Grand Total: <span className="text-amber-400">{CURRENCY} {inspectBooking.total}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setInspectBooking(null)}
                className="bg-slate-800 text-slate-300 font-bold px-4 py-2 rounded-xl text-xs"
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
