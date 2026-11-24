import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, ArrowRight, ArrowLeft, Popcorn } from 'lucide-react';
import { q, setFood } from '../lib/db';
import { useHold } from '../hooks/useHold';
import { useDocumentTitle } from '../hooks/useDb';
import { useUI } from '../context/UIContext';
import Stepper from '../components/Stepper';
import OrderSummary from '../components/OrderSummary';
import { titleCase, money } from '../lib/format';

const CATS = ['ALL', 'COMBOS', 'SNACKS', 'MEALS', 'DRINKS', 'DESSERTS'];

export default function FoodSelection() {
  useDocumentTitle('Food & drinks');
  const nav = useNavigate();
  const { toast } = useUI();
  const { booking, ms, finish } = useHold();
  const [cat, setCat] = useState('ALL');
  const [qty, setQty] = useState(() => {
    const m = {};
    if (booking) q.bookingFull(booking).foodOrders.filter((o) => o.order.order_status !== 'CANCELLED').forEach((o) => o.lines.forEach((l) => { m[l.item.food_item_id] = l.detail.quantity; }));
    return m;
  });
  if (!booking) return null;
  const full = q.bookingFull(booking);
  const items = q.food().filter((f) => cat === 'ALL' || f.category === cat);
  const lines = Object.entries(qty).filter(([, n]) => n > 0).map(([id, n]) => { const it = q.foodItem(id); return { name: it.item_name, qty: n, total: n * it.current_price }; });
  const subtotal = lines.reduce((a, l) => a + l.total, 0);
  const change = (id, d) => setQty((cur) => ({ ...cur, [id]: Math.max(0, Math.min(10, (cur[id] || 0) + d)) }));

  const next = (skip) => {
    try { setFood(booking.booking_id, skip ? {} : qty); finish(); nav('/book/checkout'); } catch (e) { toast.fail(e); }
  };

  return (
    <div className="container-x py-8">
      <Stepper current={1} />
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem] items-start">
        <div>
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold">Add food & drinks</h1>
            <p className="text-fg2 text-sm mt-1.5">Pre-order and collect at the counter before your show — or skip this step.</p>
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 mb-4">
            {CATS.map((c) => <button key={c} className={`chip ${cat === c ? 'chip-active' : ''}`} onClick={() => setCat(c)}>{c === 'ALL' ? 'Everything' : titleCase(c)}</button>)}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {items.map((f) => {
              const n = qty[f.food_item_id] || 0;
              const off = f.availability_status !== 'AVAILABLE';
              return (
                <div key={f.food_item_id} className={`card p-4 flex gap-4 ${off ? 'opacity-50' : n ? 'border-gold/60' : ''}`}>
                  <div className="w-16 h-16 rounded-2xl bg-panel2 border border-line flex items-center justify-center text-3xl shrink-0">{f.emoji}</div>
                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="font-semibold leading-snug">{f.item_name}</div>
                    <div className="text-xs text-fg2 mt-0.5 line-clamp-2">{f.description}</div>
                    <div className="flex items-center justify-between mt-auto pt-3">
                      <span className="font-bold text-gold">{money(f.current_price)}</span>
                      {off ? <span className="badge badge-bad">Sold out</span> : n === 0 ? (
                        <button className="btn btn-secondary btn-sm" onClick={() => change(f.food_item_id, 1)}><Plus size={14} /> Add</button>
                      ) : (
                        <div className="flex items-center gap-1 bg-panel2 rounded-xl border border-line2 p-0.5">
                          <button className="btn btn-ghost btn-icon !p-1.5" onClick={() => change(f.food_item_id, -1)} aria-label="Remove one"><Minus size={14} /></button>
                          <span className="w-6 text-center text-sm font-bold">{n}</span>
                          <button className="btn btn-ghost btn-icon !p-1.5" onClick={() => change(f.food_item_id, 1)} aria-label="Add one"><Plus size={14} /></button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <OrderSummary full={full} ms={ms} food={{ lines, subtotal }}>
          <button className="btn btn-primary btn-lg btn-block mt-2" onClick={() => next(false)}>{subtotal ? 'Continue to payment' : 'Continue without food'} <ArrowRight size={18} /></button>
          <Link to={`/book/seats/${booking.showtime_id}`} className="btn btn-ghost btn-block"><ArrowLeft size={16} /> Change seats</Link>
          {!subtotal && <p className="text-[11px] text-fg3 text-center flex items-center justify-center gap-1.5"><Popcorn size={12} /> Snacks are also available at the counter.</p>}
        </OrderSummary>
      </div>
    </div>
  );
}
