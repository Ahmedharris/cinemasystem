/* Report queries - the front-end equivalents of the aggregate SQL in the proposal
   (COUNT / SUM / AVG with GROUP BY, HAVING and sub-queries). */
import { table, q, parseDT, fmtD, now, availability } from './db';

const cinemaOfBooking = (b) => q.screen(q.showtime(b.showtime_id).screen_id).cinema_id;
const inCinema = (b, cinemaId) => !cinemaId || cinemaOfBooking(b) === cinemaId;
const inRange = (dt, range) => {
  if (!range) return true;
  const d = parseDT(dt);
  return (!range.from || d >= range.from) && (!range.to || d <= range.to);
};

/** Date range helper: days = number | null (all time) */
export const lastDays = (days) => (days ? { from: new Date(now().getFullYear(), now().getMonth(), now().getDate() - days + 1), to: null } : null);

export function netPayments({ cinemaId = null, range = null } = {}) {
  let gross = 0, refunds = 0, failed = 0, count = 0;
  table('payment').forEach((p) => {
    const b = q.booking(p.booking_id);
    if (!inCinema(b, cinemaId) || !inRange(p.created_at, range)) return;
    if (p.payment_status === 'FAILED') failed += 1;
    else if (p.payment_status === 'SUCCESS') {
      if (p.payment_type === 'PAYMENT') { gross += p.amount; count += 1; } else refunds += p.amount;
    }
  });
  return { gross, refunds, net: gross - refunds, failed, count };
}
export function soldBookings({ cinemaId = null, range = null } = {}) {
  return table('booking').filter((b) => b.booking_status === 'CONFIRMED' && inCinema(b, cinemaId) && inRange(b.booking_time, range));
}
export function ticketsSold(opts) {
  const ids = new Set(soldBookings(opts).map((b) => b.booking_id));
  return table('booking_seat').filter((s) => ids.has(s.booking_id) && s.seat_status === 'CONFIRMED').length;
}
export function revenueByDay(days = 7, cinemaId = null) {
  const out = [];
  const t = now();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(t.getFullYear(), t.getMonth(), t.getDate() - i);
    out.push({ date: fmtD(d), label: d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' }), value: 0, tickets: 0 });
  }
  const idx = Object.fromEntries(out.map((o) => [o.date, o]));
  table('payment').forEach((p) => {
    if (p.payment_status !== 'SUCCESS') return;
    const o = idx[p.created_at.slice(0, 10)];
    if (!o || !inCinema(q.booking(p.booking_id), cinemaId)) return;
    o.value += p.payment_type === 'PAYMENT' ? p.amount : -p.amount;
  });
  table('booking').forEach((b) => {
    const o = idx[b.booking_time.slice(0, 10)];
    if (!o || b.booking_status !== 'CONFIRMED' || !inCinema(b, cinemaId)) return;
    o.tickets += table('booking_seat').filter((s) => s.booking_id === b.booking_id && s.seat_status === 'CONFIRMED').length;
  });
  return out;
}
export function ticketsByMovie(opts = {}) {
  const ids = new Map(soldBookings(opts).map((b) => [b.booking_id, b]));
  const m = {};
  table('booking_seat').forEach((s) => {
    const b = ids.get(s.booking_id);
    if (!b || s.seat_status !== 'CONFIRMED') return;
    const t = q.movie(q.showtime(b.showtime_id).movie_id).title;
    m[t] = (m[t] || 0) + 1;
  });
  return Object.entries(m).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}
export function revenueByCinema(range = null) {
  const m = {};
  table('payment').forEach((p) => {
    if (p.payment_status !== 'SUCCESS' || !inRange(p.created_at, range)) return;
    const name = q.cinema(cinemaOfBooking(q.booking(p.booking_id))).cinema_name;
    m[name] = (m[name] || 0) + (p.payment_type === 'PAYMENT' ? p.amount : -p.amount);
  });
  return Object.entries(m).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}
export function paymentSplit({ cinemaId = null, range = null } = {}) {
  const m = {};
  table('payment').forEach((p) => {
    if (p.payment_status !== 'SUCCESS' || p.payment_type !== 'PAYMENT' || !inCinema(q.booking(p.booking_id), cinemaId) || !inRange(p.created_at, range)) return;
    m[p.payment_method] = (m[p.payment_method] || 0) + p.amount;
  });
  return Object.entries(m).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}
export function foodSales({ cinemaId = null, range = null } = {}) {
  const m = {};
  table('food_order').forEach((o) => {
    if (o.order_status === 'CANCELLED') return;
    const b = q.booking(o.booking_id);
    if (b.booking_status !== 'CONFIRMED' || !inCinema(b, cinemaId) || !inRange(b.booking_time, range)) return;
    table('order_detail').filter((d) => d.food_order_id === o.food_order_id).forEach((d) => {
      const n = q.foodItem(d.food_item_id).item_name;
      m[n] = m[n] || { label: n, value: 0, revenue: 0 };
      m[n].value += d.quantity; m[n].revenue += d.line_total;
    });
  });
  return Object.values(m).sort((a, b) => b.value - a.value);
}
/** customers spending above the average (sub-query + HAVING in SQL) */
export function topCustomers({ cinemaId = null, range = null } = {}) {
  const m = {};
  soldBookings({ cinemaId, range }).forEach((b) => {
    if (!b.user_id) return;
    const u = q.user(b.user_id);
    m[u.user_id] = m[u.user_id] || { user_id: u.user_id, label: u.full_name, bookings: 0, value: 0 };
    m[u.user_id].bookings += 1; m[u.user_id].value += b.total_amount;
  });
  const list = Object.values(m).sort((a, b) => b.value - a.value);
  const avg = list.length ? list.reduce((a, c) => a + c.value, 0) / list.length : 0;
  return { list, avg, aboveAverage: list.filter((c) => c.value >= avg) };
}
export function occupancyForDate(dateStr, cinemaId = null) {
  return table('showtime')
    .filter((s) => s.start_time.startsWith(dateStr) && s.show_status !== 'CANCELLED' && (!cinemaId || q.screen(s.screen_id).cinema_id === cinemaId))
    .sort((a, b) => a.start_time.localeCompare(b.start_time))
    .map((s) => ({ show: s, ...availability(s) }));
}
export function avgOccupancyUpcoming(cinemaId = null, hours = 48) {
  const n = now(), end = new Date(n.getTime() + hours * 3600000);
  const list = table('showtime').filter((s) => s.show_status === 'ON_SALE' && parseDT(s.start_time) > n && parseDT(s.start_time) < end && (!cinemaId || q.screen(s.screen_id).cinema_id === cinemaId));
  if (!list.length) return 0;
  return Math.round(list.reduce((a, s) => a + availability(s).pct, 0) / list.length);
}
export function promoReport() {
  return table('promotion').map((p) => {
    const used = table('booking').filter((b) => b.promotion_id === p.promotion_id && b.booking_status === 'CONFIRMED');
    return { promo: p, uses: used.length, discount: used.reduce((a, b) => a + b.discount_amount, 0) };
  });
}
