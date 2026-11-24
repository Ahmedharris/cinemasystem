import { Calendar, MapPin, Timer, Tag } from 'lucide-react';
import Poster from './Poster';
import { Badge } from './ui/Misc';
import { fmtClock } from '../hooks/useDb';
import { money, dateLong, time12, SCREEN_TYPE_LABEL } from '../lib/format';

/** Right-hand booking summary for the food and payment steps. */
export default function OrderSummary({ full, food, ms, children }) {
  const { booking, movie, show, screen, cinema, activeSeats, foodOrders, promo } = full;
  const lines = food ? food.lines : foodOrders.filter((o) => o.order.order_status !== 'CANCELLED').flatMap((o) => o.lines.map((l) => ({ name: l.item.item_name, qty: l.detail.quantity, total: l.detail.line_total })));
  const foodSub = food ? food.subtotal : booking.food_subtotal;
  const discount = food ? 0 : booking.discount_amount;
  const total = booking.ticket_subtotal + foodSub - discount;
  return (
    <aside className="card lg:sticky lg:top-24 overflow-hidden">
      {ms != null && (
        <div className="flex items-center justify-between gap-2 px-5 py-3 bg-warn/10 border-b border-warn/25 text-warn text-sm font-semibold">
          <span className="flex items-center gap-2"><Timer size={16} /> Seats held</span><span className="font-display text-base tabular-nums">{fmtClock(ms)}</span>
        </div>
      )}
      <div className="p-5 flex gap-4 border-b border-line">
        <Poster movie={movie} showTitle={false} className="w-16 shrink-0 !rounded-lg" />
        <div className="min-w-0">
          <h3 className="font-semibold leading-snug">{movie.title}</h3>
          <div className="flex gap-1.5 mt-1.5"><Badge tone="muted">{movie.content_rating}</Badge><Badge tone="info">{SCREEN_TYPE_LABEL[screen.screen_type]}</Badge></div>
          <div className="text-xs text-fg2 mt-2 flex items-center gap-1.5"><MapPin size={12} /> {cinema.cinema_name}</div>
          <div className="text-xs text-fg2 mt-1 flex items-center gap-1.5"><Calendar size={12} /> {dateLong(show.start_time)}, {time12(show.start_time)}</div>
        </div>
      </div>
      <div className="p-5 space-y-3 text-sm">
        <div>
          <div className="flex justify-between"><span className="text-fg2">{activeSeats.length} {activeSeats.length === 1 ? 'ticket' : 'tickets'}</span><span>{money(booking.ticket_subtotal)}</span></div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {[...activeSeats].sort((a, b) => a.seat.row_label.localeCompare(b.seat.row_label) || a.seat.seat_number - b.seat.seat_number).map((e) => (
              <span key={e.bs.booking_seat_id} className="text-xs font-bold px-2 py-0.5 rounded-md bg-panel3 border border-line2" title={`${e.category.category_name} · ${money(e.bs.seat_price)}`}>{e.seat.row_label}{e.seat.seat_number}</span>
            ))}
          </div>
        </div>
        {lines.length > 0 && (
          <div className="pt-3 border-t border-line space-y-1.5">
            {lines.map((l, i) => <div key={i} className="flex justify-between gap-3 text-fg2"><span className="truncate">{l.qty} × {l.name}</span><span className="shrink-0">{money(l.total)}</span></div>)}
            <div className="flex justify-between"><span className="text-fg2">Food & drinks</span><span>{money(foodSub)}</span></div>
          </div>
        )}
        {discount > 0 && <div className="flex justify-between text-ok"><span className="flex items-center gap-1.5"><Tag size={14} /> {promo ? promo.promo_code : 'Discount'}</span><span>− {money(discount)}</span></div>}
        <div className="flex items-end justify-between pt-4 border-t border-line">
          <span className="text-fg2">Total</span>
          <span className="text-2xl font-display font-bold text-gold">{money(total)}</span>
        </div>
        {children}
      </div>
    </aside>
  );
}
