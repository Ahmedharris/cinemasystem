import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Ban, ExternalLink } from 'lucide-react';
import { useDb, useDocumentTitle } from '../../hooks/useDb';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { q, canCancel, cancelBooking, parseDT, now, fmtD } from '../../lib/db';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import { PageHeader, StatusBadge, Badge, InfoRow } from '../../components/ui/Misc';
import { money, dateTimeShort, time24, titleCase, dateShort } from '../../lib/format';

function Detail({ id, onClose }) {
  const { user } = useAuth();
  const { toast, confirm } = useUI();
  const b = q.booking(id);
  const f = q.bookingFull(b);
  const chk = canCancel(b, { staff: true });
  const doCancel = async () => {
    const msg = chk.refund > 0 ? `All tickets will be cancelled and ${money(chk.refund)} refunded to the original payment method.` : 'The booking and seat holds will be cancelled.';
    if (!(await confirm({ title: `Cancel booking ${b.booking_reference}?`, message: msg, confirmText: 'Cancel & refund', cancelText: 'Keep', danger: true }))) return;
    try { cancelBooking(b.booking_id, { byUserId: user.user_id, staff: true, reason: 'Cancelled by staff' }); toast.success('Booking cancelled.'); } catch (e) { toast.fail(e); }
  };
  return (
    <Modal open onClose={onClose} size="lg" title={<span className="flex items-center gap-3">{b.booking_reference} <StatusBadge status={b.booking_status} /></span>}
      footer={<><Link to={`/booking/${b.booking_reference}`} className="btn btn-ghost" onClick={onClose}><ExternalLink size={15} /> Open ticket page</Link>{['CONFIRMED', 'PENDING'].includes(b.booking_status) && (chk.ok ? <button className="btn btn-danger" onClick={doCancel}><Ban size={15} /> Cancel booking</button> : <span className="text-xs text-fg3 max-w-xs">{chk.reason}</span>)}</>}>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="divide-y divide-line">
          <InfoRow label="Customer">{f.user ? <>{f.user.full_name}<div className="text-xs text-fg3 font-normal">{f.user.email}</div></> : <>Guest · {b.guest_phone}</>}</InfoRow>
          <InfoRow label="Movie">{f.movie.title}</InfoRow>
          <InfoRow label="Show">{dateShort(f.show.start_time)}, {time24(f.show.start_time)}</InfoRow>
          <InfoRow label="Cinema">{f.cinema.cinema_name} · {f.screen.screen_name}</InfoRow>
          <InfoRow label="Channel"><Badge tone="muted">{titleCase(b.booking_channel)}</Badge></InfoRow>
          {f.seller && <InfoRow label="Sold by">{f.seller.full_name}</InfoRow>}
          <InfoRow label="Booked">{dateTimeShort(b.booking_time)}</InfoRow>
          {b.cancelled_at && <InfoRow label="Cancelled">{dateTimeShort(b.cancelled_at)}</InfoRow>}
        </div>
        <div>
          <div className="text-xs font-bold text-fg3 uppercase tracking-wider mb-2">Seats & tickets</div>
          <table className="tbl"><thead><tr><th>Seat</th><th>Class</th><th>Price</th><th>Ticket</th></tr></thead><tbody>
            {f.seats.map((e) => <tr key={e.bs.booking_seat_id}><td className="font-bold">{e.seat.row_label}{e.seat.seat_number}</td><td>{e.category.category_name}</td><td>{money(e.bs.seat_price)}</td><td>{e.ticket ? <StatusBadge status={e.ticket.ticket_status} /> : <StatusBadge status={e.bs.seat_status} />}</td></tr>)}
          </tbody></table>
        </div>
      </div>
      {f.foodOrders.length > 0 && (
        <div className="mt-6"><div className="text-xs font-bold text-fg3 uppercase tracking-wider mb-2">Food order</div>
          {f.foodOrders.map(({ order, lines }) => <div key={order.food_order_id} className="rounded-xl border border-line p-3 text-sm flex flex-wrap justify-between gap-3"><span>{lines.map((l) => `${l.detail.quantity}× ${l.item.item_name}`).join(', ')}</span><StatusBadge status={order.order_status} /></div>)}</div>
      )}
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div><div className="text-xs font-bold text-fg3 uppercase tracking-wider mb-2">Payments</div>
          {f.payments.length ? <ul className="space-y-2 text-sm">{f.payments.map((p) => <li key={p.payment_id} className="flex justify-between gap-3"><span>{p.payment_type === 'REFUND' ? 'Refund' : 'Payment'} · {titleCase(p.payment_method)}<div className="text-xs text-fg3">{dateTimeShort(p.created_at)}</div></span><span className="text-right font-semibold">{money(p.amount)}<div><StatusBadge status={p.payment_status} /></div></span></li>)}</ul> : <p className="text-sm text-fg3">No payment attempts.</p>}
        </div>
        <div className="text-sm space-y-1.5 self-start rounded-xl bg-panel2 p-4 border border-line">
          <div className="flex justify-between"><span className="text-fg2">Tickets</span><span>{money(b.ticket_subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-fg2">Food</span><span>{money(b.food_subtotal)}</span></div>
          {b.discount_amount > 0 && <div className="flex justify-between text-ok"><span>Promo {f.promo?.promo_code}</span><span>− {money(b.discount_amount)}</span></div>}
          <div className="flex justify-between font-bold text-base pt-2 border-t border-line"><span>Total</span><span className="text-gold">{money(b.total_amount)}</span></div>
          <div className="flex justify-between text-xs text-fg3"><span>Paid {money(f.money.paid)}</span><span>Refunded {money(f.money.refunded)}</span></div>
        </div>
      </div>
    </Modal>
  );
}

export default function AdminBookings() {
  useDb();
  useDocumentTitle('Bookings · Admin');
  const { cinemaScope: scope } = useAuth();
  const [openId, setOpenId] = useState(null);
  const rows = [...q.bookings()].filter((b) => !scope || q.screen(q.showtime(b.showtime_id).screen_id).cinema_id === scope).sort((a, b) => b.booking_time.localeCompare(a.booking_time));
  const customer = (b) => (b.user_id ? q.user(b.user_id).full_name : `Guest ${b.guest_phone}`);
  const columns = [
    { key: 'ref', header: 'Reference', sort: (b) => b.booking_reference, cell: (b) => <span className="font-semibold tracking-wider">{b.booking_reference}</span> },
    { key: 'cust', header: 'Customer', sort: customer, cell: (b) => customer(b) },
    { key: 'movie', header: 'Movie & show', sort: (b) => q.showtime(b.showtime_id).start_time, cell: (b) => { const s = q.showtime(b.showtime_id); return <div><div className="font-medium">{q.movie(s.movie_id).title}</div><div className="text-xs text-fg2">{dateShort(s.start_time)}, {time24(s.start_time)}</div></div>; }, csv: (b) => { const s = q.showtime(b.showtime_id); return `${q.movie(s.movie_id).title} ${s.start_time}`; } },
    { key: 'seats', header: 'Seats', sort: (b) => q.bookingFull(b).activeSeats.length, cell: (b) => q.bookingFull(b).activeSeats.length || '—' },
    { key: 'total', header: 'Total', sort: (b) => b.total_amount, cell: (b) => <span className="font-semibold">{money(b.total_amount)}</span> },
    { key: 'channel', header: 'Channel', sort: (b) => b.booking_channel, cell: (b) => <Badge tone="muted">{titleCase(b.booking_channel)}</Badge> },
    { key: 'status', header: 'Status', sort: (b) => b.booking_status, cell: (b) => <StatusBadge status={b.booking_status} /> },
    { key: 'time', header: 'Booked', sort: (b) => b.booking_time, cell: (b) => <span className="text-fg2 text-xs">{dateTimeShort(b.booking_time)}</span> }
  ];
  const day = (n) => new Date(now().getFullYear(), now().getMonth(), now().getDate() - n);
  return (
    <div>
      <PageHeader title="Bookings" subtitle="Search, review and cancel bookings from the website and the box office." />
      <DataTable columns={columns} rows={rows} rowKey={(b) => b.booking_id} onRowClick={(b) => setOpenId(b.booking_id)} pageSize={12} exportName="bookings"
        searchText={(b) => `${b.booking_reference} ${customer(b)} ${q.movie(q.showtime(b.showtime_id).movie_id).title}`} searchPlaceholder="Search reference, customer, movie…"
        filters={[
          { key: 'status', label: 'All statuses', options: ['CONFIRMED', 'PENDING', 'CANCELLED', 'EXPIRED'].map((s) => ({ value: s, label: titleCase(s) })), test: (b, v) => b.booking_status === v },
          { key: 'channel', label: 'All channels', options: [{ value: 'WEB', label: 'Web' }, { value: 'COUNTER', label: 'Counter' }], test: (b, v) => b.booking_channel === v },
          { key: 'when', label: 'Any date', options: [{ value: '0', label: 'Booked today' }, { value: '7', label: 'Last 7 days' }, { value: 'show', label: 'Show today' }], test: (b, v) => (v === 'show' ? q.showtime(b.showtime_id).start_time.startsWith(fmtD(now())) : parseDT(b.booking_time) >= day(Number(v))) }
        ]} />
      {openId && <Detail id={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
}
