import { useState } from 'react';
import { Banknote, CreditCard, Minus, Plus, Printer, CheckCircle2, RotateCcw, Popcorn, Film } from 'lucide-react';
import { useDb, useDocumentTitle } from '../../hooks/useDb';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { q, counterSale, availability, isBookable, takenSeats, priceMap, MAX_SEATS, now, fmtD } from '../../lib/db';
import SeatMap, { SeatLegend } from '../../components/SeatMap';
import Modal from '../../components/ui/Modal';
import TicketCard from '../../components/TicketCard';
import { PageHeader, EmptyState, ProgressBar } from '../../components/ui/Misc';
import { money, time12, SCREEN_TYPE_LABEL, nextDays, printModal } from '../../lib/format';

export default function AdminCounter() {
  useDb();
  useDocumentTitle('Counter sale · Admin');
  const { user, cinemaScope: scope } = useAuth();
  const { toast } = useUI();
  const days = nextDays(2);
  const [cinema, setCinema] = useState(scope || 1);
  const [date, setDate] = useState(fmtD(now()));
  const [showId, setShowId] = useState(null);
  const [sel, setSel] = useState([]);
  const [food, setFood] = useState({});
  const [phone, setPhone] = useState('');
  const [method, setMethod] = useState('CASH');
  const [tendered, setTendered] = useState('');
  const [done, setDone] = useState(null);

  const shows = q.showtimes().filter((s) => s.start_time.startsWith(date) && q.screen(s.screen_id).cinema_id === Number(cinema) && isBookable(s, { staff: true })).sort((a, b) => a.start_time.localeCompare(b.start_time));
  const full = showId ? q.showFull(showId) : null;
  const prices = showId ? priceMap(showId) : {};
  const seatObjs = full ? sel.map((id) => q.seatsOf(full.show.screen_id).find((s) => s.seat_id === id)).filter(Boolean).sort((a, b) => a.row_label.localeCompare(b.row_label) || a.seat_number - b.seat_number) : [];
  const ticketTotal = seatObjs.reduce((a, s) => a + prices[s.seat_category_id], 0);
  const foodItems = q.food().filter((f) => f.availability_status === 'AVAILABLE');
  const foodTotal = Object.entries(food).reduce((a, [id, n]) => a + n * q.foodItem(id).current_price, 0);
  const total = ticketTotal + foodTotal;
  const change = method === 'CASH' && Number(tendered) >= total ? Number(tendered) - total : null;

  const pick = (id) => { setShowId(id); setSel([]); };
  const toggle = (seat) => {
    if (sel.includes(seat.seat_id)) setSel(sel.filter((x) => x !== seat.seat_id));
    else if (sel.length >= MAX_SEATS) toast.info(`Maximum ${MAX_SEATS} seats per sale.`);
    else setSel([...sel, seat.seat_id]);
  };
  const adjust = (id, d) => setFood((f) => ({ ...f, [id]: Math.max(0, Math.min(10, (f[id] || 0) + d)) }));
  const reset = () => { setSel([]); setFood({}); setPhone(''); setTendered(''); setDone(null); };

  const sell = () => {
    try {
      const b = counterSale({ showtime_id: showId, seat_ids: sel, guest_phone: phone.trim() || 'Walk-in', method, food, staffId: user.user_id });
      setDone({ booking: b, change });
      toast.success(`Sale complete — ${b.booking_reference}`);
    } catch (e) {
      toast.fail(e);
      const t = takenSeats(showId);
      setSel((cur) => cur.filter((id) => !t.has(id)));
    }
  };
  const doneFull = done ? q.bookingFull(done.booking) : null;

  return (
    <div>
      <PageHeader title="Counter sale" subtitle="Sell tickets and snacks at the box office. Payment is taken immediately and tickets are issued on the spot." />
      <div className="grid gap-6 xl:grid-cols-[1fr_24rem] items-start">
        <div className="space-y-6">
          <div className="card card-pad">
            <div className="flex flex-wrap items-center gap-3 mb-5">
              {!scope && <select className="select input-sm w-auto" value={cinema} onChange={(e) => { setCinema(Number(e.target.value)); pick(null); }}>{q.cinemas().map((c) => <option key={c.cinema_id} value={c.cinema_id}>{c.cinema_name}</option>)}</select>}
              <div className="flex gap-1.5 bg-panel2 p-1 rounded-xl border border-line">
                {days.map((d) => <button key={d.date} onClick={() => { setDate(d.date); pick(null); }} className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold ${date === d.date ? 'bg-gold text-[#17110a]' : 'text-fg2'}`}>{d.label}</button>)}
              </div>
              <span className="text-xs text-fg3 ml-auto">{shows.length} shows available</span>
            </div>
            {shows.length ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {shows.map((s) => {
                  const f = q.showFull(s.showtime_id); const a = availability(s); const on = showId === s.showtime_id;
                  return (
                    <button key={s.showtime_id} onClick={() => pick(s.showtime_id)} className={`text-left rounded-xl border p-3.5 transition-all ${on ? 'border-gold' : 'border-line hover:border-line2 bg-panel2'}`} style={on ? { background: 'rgba(245,184,46,.08)' } : undefined}>
                      <div className="flex justify-between items-start gap-2"><span className="font-display font-bold text-lg">{time12(s.start_time)}</span><span className="text-xs text-fg3">{a.free} free</span></div>
                      <div className="font-medium text-sm truncate mt-0.5">{f.movie.title}</div>
                      <div className="text-xs text-fg2 mb-2">{f.screen.screen_name} · {SCREEN_TYPE_LABEL[f.screen.screen_type]}</div>
                      <ProgressBar pct={a.pct} tone="auto" />
                    </button>
                  );
                })}
              </div>
            ) : <EmptyState icon={Film} title="No shows available" text="There are no shows on sale for this day." />}
          </div>

          {full && (
            <div className="card card-pad">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-6"><h3 className="font-semibold">{full.movie.title} · {time12(full.show.start_time)} · {full.screen.screen_name}</h3>{sel.length > 0 && <button className="btn btn-ghost btn-sm" onClick={() => setSel([])}>Clear seats</button>}</div>
              <SeatMap showId={showId} selected={sel} onToggle={toggle} />
              <div className="mt-6 pt-4 border-t border-line"><SeatLegend prices={prices} /></div>
            </div>
          )}
        </div>

        <aside className="card xl:sticky xl:top-24 overflow-hidden">
          <div className="p-5 border-b border-line"><h3 className="font-semibold">Order</h3>{!full && <p className="text-sm text-fg3 mt-1">Choose a show to begin.</p>}</div>
          {full && (
            <div className="p-5 space-y-5">
              <div>
                <div className="text-xs font-bold text-fg3 uppercase tracking-wider mb-2">Seats</div>
                {seatObjs.length ? <ul className="space-y-1.5 text-sm">{seatObjs.map((s) => <li key={s.seat_id} className="flex justify-between"><span><b>{s.row_label}{s.seat_number}</b> <span className="text-fg3">{q.seatCategory(s.seat_category_id).category_name}</span></span><span>{money(prices[s.seat_category_id])}</span></li>)}</ul> : <p className="text-sm text-fg3">Click seats on the map.</p>}
              </div>
              <details className="group">
                <summary className="text-xs font-bold text-fg3 uppercase tracking-wider cursor-pointer flex items-center gap-2 list-none"><Popcorn size={14} /> Snacks {foodTotal > 0 && <span className="text-gold normal-case">{money(foodTotal)}</span>}<span className="ml-auto text-fg3 group-open:rotate-45 transition-transform">+</span></summary>
                <ul className="mt-3 space-y-2 max-h-56 overflow-y-auto pr-1">
                  {foodItems.map((f) => (
                    <li key={f.food_item_id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="truncate">{f.emoji} {f.item_name} <span className="text-fg3 text-xs">{money(f.current_price)}</span></span>
                      <span className="flex items-center gap-1 shrink-0"><button className="btn btn-ghost btn-icon !p-1" onClick={() => adjust(f.food_item_id, -1)} disabled={!food[f.food_item_id]}><Minus size={13} /></button><span className="w-5 text-center font-bold">{food[f.food_item_id] || 0}</span><button className="btn btn-ghost btn-icon !p-1" onClick={() => adjust(f.food_item_id, 1)}><Plus size={13} /></button></span>
                    </li>
                  ))}
                </ul>
              </details>
              <div><label className="label">Customer phone (optional)</label><input className="input" placeholder="0300-1234567" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
              <div>
                <div className="label">Payment</div>
                <div className="grid grid-cols-2 gap-2">
                  {[{ v: 'CASH', l: 'Cash', i: Banknote }, { v: 'CARD', l: 'Card (POS)', i: CreditCard }].map((m) => <button key={m.v} onClick={() => setMethod(m.v)} className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold ${method === m.v ? 'border-gold text-gold' : 'border-line text-fg2 hover:border-line2'}`} style={method === m.v ? { background: 'rgba(245,184,46,.08)' } : undefined}><m.i size={16} /> {m.l}</button>)}
                </div>
                {method === 'CASH' && total > 0 && <div className="mt-3 flex items-center gap-3"><input className="input input-sm" type="number" placeholder="Cash received" value={tendered} onChange={(e) => setTendered(e.target.value)} />{change != null && <span className="text-sm whitespace-nowrap text-ok font-semibold">Change {money(change)}</span>}</div>}
              </div>
              <div className="pt-4 border-t border-line">
                <div className="flex justify-between text-sm text-fg2"><span>Tickets</span><span>{money(ticketTotal)}</span></div>
                {foodTotal > 0 && <div className="flex justify-between text-sm text-fg2 mt-1"><span>Snacks</span><span>{money(foodTotal)}</span></div>}
                <div className="flex justify-between items-end mt-3"><span className="font-semibold">Total</span><span className="text-3xl font-display font-bold text-gold">{money(total)}</span></div>
                <button className="btn btn-primary btn-lg btn-block mt-4" disabled={!sel.length || (method === 'CASH' && tendered !== '' && Number(tendered) < total)} onClick={sell}>Complete sale</button>
              </div>
            </div>
          )}
        </aside>
      </div>

      <Modal open={!!done} onClose={reset} size="lg" printable title={<span className="flex items-center gap-2 text-ok"><CheckCircle2 size={22} /> Sale complete</span>}
        footer={<><button className="btn btn-secondary" onClick={printModal}><Printer size={15} /> Print tickets</button><button className="btn btn-primary" onClick={reset}><RotateCcw size={15} /> New sale</button></>}>
        {doneFull && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm"><div>Reference <b className="tracking-widest text-base">{doneFull.booking.booking_reference}</b></div><div>Total <b className="text-gold text-base">{money(doneFull.booking.total_amount)}</b>{done.change != null && done.change > 0 && <span className="ml-3 text-ok">Change {money(done.change)}</span>}</div></div>
            {doneFull.activeSeats.map((e) => <TicketCard key={e.bs.booking_seat_id} full={doneFull} entry={e} />)}
          </div>
        )}
      </Modal>
    </div>
  );
}
