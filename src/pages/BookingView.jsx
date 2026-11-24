import { useEffect, useRef } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { CheckCircle2, XCircle, Clock, Printer, CalendarPlus, Ban, Ticket, Popcorn, Receipt, Lock, Undo2, Star, Timer, ArrowRight } from 'lucide-react';
import { useDb, useDocumentTitle } from '../hooks/useDb';
import { q, canCancel, cancelBooking, canReview, parseDT, now } from '../lib/db';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import TicketCard from '../components/TicketCard';
import QR from '../components/QR';
import { Badge, StatusBadge, EmptyState, Callout, InfoRow } from '../components/ui/Misc';
import { money, dateLong, time12, dateTimeShort, titleCase, downloadICS } from '../lib/format';

const BANNERS = {
  CONFIRMED: { tone: 'ok', icon: CheckCircle2, title: 'Booking confirmed', text: 'Your e-tickets are ready. Show the QR code at the cinema entrance.' },
  PENDING: { tone: 'warn', icon: Timer, title: 'Payment pending', text: 'Complete your payment before the seat hold expires.' },
  CANCELLED: { tone: 'bad', icon: XCircle, title: 'Booking cancelled', text: 'This booking was cancelled and the seats were released.' },
  EXPIRED: { tone: 'bad', icon: Clock, title: 'Booking expired', text: 'The seat hold ran out before payment was completed.' }
};

export default function BookingView() {
  useDb();
  const { ref } = useParams();
  const [sp] = useSearchParams();
  const { user, isStaff } = useAuth();
  const { toast, confirm } = useUI();
  const b = q.bookingByRef(ref);
  useDocumentTitle(b ? `Booking ${b.booking_reference}` : 'Booking');
  const fired = useRef(false);

  const allowed = !!(b && user && (b.user_id === user.user_id || isStaff));
  useEffect(() => {
    if (fired.current || !allowed || !sp.get('new') || b.booking_status !== 'CONFIRMED') return;
    fired.current = true;
    const end = Date.now() + 900;
    (function frame() {
      confetti({ particleCount: 5, angle: 60, spread: 60, origin: { x: 0 }, colors: ['#f5b82e', '#ffffff', '#fb7185'] });
      confetti({ particleCount: 5, angle: 120, spread: 60, origin: { x: 1 }, colors: ['#f5b82e', '#ffffff', '#60a5fa'] });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }, [allowed, b, sp]);

  if (!b) return <div className="container-x py-20"><EmptyState title="Booking not found" text={`We couldn't find a booking with reference ${ref}.`} action={<Link to="/my-bookings" className="btn btn-primary">My bookings</Link>} /></div>;
  if (!user) return <div className="container-x py-20"><EmptyState icon={Lock} title="Sign in to view this booking" action={<Link to="/login" state={{ from: `/booking/${ref}` }} className="btn btn-primary">Sign in</Link>} /></div>;
  if (!allowed) return <div className="container-x py-20"><EmptyState icon={Lock} title="This booking belongs to another account" action={<Link to="/my-bookings" className="btn btn-primary">My bookings</Link>} /></div>;

  const full = q.bookingFull(b);
  const { movie, show, screen, cinema, money: m } = full;
  const banner = BANNERS[b.booking_status];
  const entries = full.seats.filter((e) => e.ticket || e.bs.seat_status === 'HELD');
  const staffOverride = isStaff && b.user_id !== user.user_id;
  const cancel = canCancel(b, { staff: staffOverride });
  const review = b.user_id === user.user_id && b.booking_status === 'CONFIRMED' && parseDT(show.end_time) < now() ? canReview(user.user_id, movie.movie_id) : null;
  const orders = full.foodOrders.filter((o) => o.order.order_status !== 'CANCELLED' || b.booking_status === 'CANCELLED');

  const doCancel = async () => {
    const msg = cancel.refund > 0
      ? `This will cancel all tickets and refund ${money(cancel.refund)} to the original payment method (${titleCase(full.payments.find((p) => p.payment_type === 'PAYMENT' && p.payment_status === 'SUCCESS')?.payment_method || '')}).`
      : 'This will cancel the booking and release your seats.';
    if (!(await confirm({ title: 'Cancel this booking?', message: msg, confirmText: 'Yes, cancel booking', cancelText: 'Keep booking', danger: true }))) return;
    try {
      const r = cancelBooking(b.booking_id, { byUserId: user.user_id, staff: staffOverride, reason: staffOverride ? 'Cancelled by staff' : 'Cancelled by customer' });
      toast.success(r.refund ? `Booking cancelled. ${money(r.refund.amount)} refunded.` : 'Booking cancelled.');
    } catch (e) { toast.fail(e); }
  };
  const addToCalendar = () => downloadICS({
    title: `${movie.title} at ${cinema.cinema_name}`, start: show.start_time, end: show.end_time, uid: b.booking_reference,
    location: `${cinema.cinema_name}, ${cinema.address}, ${cinema.city}`,
    description: `Booking ${b.booking_reference}. Seats: ${full.activeSeats.map((e) => e.seat.row_label + e.seat.seat_number).join(', ')}. ${screen.screen_name}.`
  });

  return (
    <div className="container-x py-8 sm:py-10 max-w-6xl">
      <div className="print-only mb-4"><h1 className="text-2xl font-bold">CineMax e-ticket</h1></div>
      <div className={`rounded-2xl border p-5 sm:p-6 flex flex-wrap items-center gap-4 ${{ ok: 'border-ok/30 bg-ok/8', warn: 'border-warn/30 bg-warn/8', bad: 'border-bad/30 bg-bad/8' }[banner.tone]} no-print`}>
        <banner.icon size={34} className={{ ok: 'text-ok', warn: 'text-warn', bad: 'text-bad' }[banner.tone]} />
        <div className="flex-1 min-w-[12rem]">
          <h1 className="text-xl sm:text-2xl font-bold">{banner.title}</h1>
          <p className="text-sm text-fg2 mt-0.5">{banner.text}</p>
        </div>
        <div className="text-right">
          <div className="text-[11px] uppercase tracking-wider text-fg3 font-bold">Booking reference</div>
          <div className="font-display text-2xl font-bold tracking-widest">{b.booking_reference}</div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem] mt-6 items-start">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg flex items-center gap-2"><Ticket size={19} className="text-gold" /> {entries.length ? `${entries.length} ${entries.length === 1 ? 'ticket' : 'tickets'}` : 'Tickets'}</h2>
            <div className="text-sm text-fg2">{dateLong(show.start_time)} · {time12(show.start_time)}</div>
          </div>
          {entries.length ? entries.map((e) => <TicketCard key={e.bs.booking_seat_id} full={full} entry={e} />) : <div className="card card-pad text-sm text-fg2">No tickets were issued for this booking.</div>}

          {orders.length > 0 && orders.map(({ order, lines }) => (
            <div key={order.food_order_id} className="card card-pad">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold flex items-center gap-2"><Popcorn size={18} className="text-gold" /> Food pre-order</h3>
                <StatusBadge status={order.order_status} />
              </div>
              <ul className="text-sm space-y-1.5">{lines.map((l) => <li key={l.detail.order_detail_id} className="flex justify-between"><span>{l.detail.quantity} × {l.item.item_name}</span><span className="text-fg2">{money(l.detail.line_total)}</span></li>)}</ul>
              {b.booking_status === 'CONFIRMED' && <div className="mt-4 pt-4 border-t border-line flex items-center justify-between text-sm"><span className="text-fg2">Collect at the food counter with code</span><span className="font-display font-bold tracking-widest text-gold">F{String(order.food_order_id).padStart(5, '0')}</span></div>}
            </div>
          ))}
          {review && review.ok && <Callout tone="gold" icon={Star}>How was the movie? <Link to={`/movie/${movie.movie_id}`} className="underline font-semibold">Write a review for {movie.title}</Link>.</Callout>}
        </div>

        <div className="space-y-4">
          <div className="card card-pad no-print">
            <div className="flex flex-col gap-2.5">
              {b.booking_status === 'PENDING' && <Link to="/book/checkout" className="btn btn-primary btn-block">Complete payment <ArrowRight size={16} /></Link>}
              {b.booking_status === 'CONFIRMED' && (
                <>
                  <button className="btn btn-secondary btn-block" onClick={() => window.print()}><Printer size={16} /> Print tickets</button>
                  <button className="btn btn-secondary btn-block" onClick={addToCalendar}><CalendarPlus size={16} /> Add to calendar</button>
                </>
              )}
              {(b.booking_status === 'CONFIRMED' || b.booking_status === 'PENDING') && (
                cancel.ok
                  ? <button className="btn btn-danger btn-block" onClick={doCancel}><Ban size={16} /> Cancel booking</button>
                  : <div className="text-xs text-fg3 flex gap-2"><Ban size={14} className="shrink-0 mt-0.5" /> {cancel.reason}</div>
              )}
              <Link to="/my-bookings" className="btn btn-ghost btn-block">All my bookings</Link>
            </div>
            {b.booking_status === 'CONFIRMED' && cancel.ok && <p className="text-[11px] text-fg3 mt-3">{staffOverride ? 'Staff override: cancellation is allowed until the show ends.' : 'Free cancellation until 2 hours before the show.'}</p>}
          </div>

          <div className="card card-pad">
            <h3 className="font-semibold mb-2 flex items-center gap-2"><Receipt size={17} className="text-gold" /> Summary</h3>
            <div className="divide-y divide-line">
              <InfoRow label="Movie">{movie.title}</InfoRow>
              <InfoRow label="Cinema">{cinema.cinema_name}</InfoRow>
              <InfoRow label="Screen">{screen.screen_name}</InfoRow>
              <InfoRow label="Booked on">{dateTimeShort(b.booking_time)}</InfoRow>
              <InfoRow label="Channel"><Badge tone="muted">{titleCase(b.booking_channel)}</Badge></InfoRow>
              {!b.user_id && b.guest_phone && <InfoRow label="Guest phone">{b.guest_phone}</InfoRow>}
            </div>
            <div className="mt-3 pt-3 border-t border-line text-sm space-y-1.5">
              <div className="flex justify-between"><span className="text-fg2">Tickets</span><span>{money(b.ticket_subtotal)}</span></div>
              {b.food_subtotal > 0 && <div className="flex justify-between"><span className="text-fg2">Food & drinks</span><span>{money(b.food_subtotal)}</span></div>}
              {b.discount_amount > 0 && <div className="flex justify-between text-ok"><span>Promo {full.promo?.promo_code}</span><span>− {money(b.discount_amount)}</span></div>}
              <div className="flex justify-between font-bold text-base pt-2"><span>Total</span><span className="text-gold">{money(b.total_amount)}</span></div>
              {m.refunded > 0 && <div className="flex justify-between text-info"><span className="flex items-center gap-1.5"><Undo2 size={13} /> Refunded</span><span>{money(m.refunded)}</span></div>}
            </div>
          </div>

          {full.payments.length > 0 && (
            <div className="card card-pad">
              <h3 className="font-semibold mb-3">Payments</h3>
              <ul className="space-y-3">
                {full.payments.map((p) => (
                  <li key={p.payment_id} className="flex items-start justify-between gap-3 text-sm">
                    <div>
                      <div className="font-medium">{p.payment_type === 'REFUND' ? 'Refund' : 'Payment'} · {titleCase(p.payment_method)}</div>
                      <div className="text-xs text-fg3">{dateTimeShort(p.created_at)}{p.transaction_reference ? ` · ${p.transaction_reference}` : ''}</div>
                    </div>
                    <div className="text-right"><div className="font-semibold">{money(p.amount)}</div><StatusBadge status={p.payment_status} /></div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {b.booking_status === 'CONFIRMED' && (
            <div className="card card-pad flex items-center gap-4 print:hidden">
              <QR value={b.booking_reference} size={84} />
              <div className="text-xs text-fg2">Booking QR — the staff can look up all tickets of this booking with it.<div className="font-mono tracking-widest text-fg mt-1">{b.booking_reference}</div></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
