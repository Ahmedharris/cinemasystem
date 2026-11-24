import { MapPin } from 'lucide-react';
import QR from './QR';
import { dateLong, time12, money, SCREEN_TYPE_LABEL } from '../lib/format';

/** One printable ticket = one booking_seat + ticket row. */
export default function TicketCard({ full, entry }) {
  const { movie, show, screen, cinema, booking } = full;
  const { seat, category, bs, ticket } = entry;
  const status = ticket ? ticket.ticket_status : bs.seat_status === 'HELD' ? 'HELD' : 'CANCELLED';
  const dim = status === 'CANCELLED' ? 'ticket-cancelled' : status === 'USED' ? 'ticket-used' : '';
  const label = `${seat.row_label}${seat.seat_number}`;
  return (
    <div className={`ticket ${dim}`}>
      <div className="ticket-main">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] font-bold tracking-[.18em] text-[#b7791f] uppercase">CineMax · {SCREEN_TYPE_LABEL[screen.screen_type]}</div>
            <h4 className="font-display text-xl font-bold leading-tight mt-0.5 truncate">{movie.title}</h4>
          </div>
          <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${status === 'VALID' ? 'text-emerald-700 border-emerald-300 bg-emerald-50' : status === 'USED' ? 'text-sky-700 border-sky-300 bg-sky-50' : status === 'HELD' ? 'text-amber-700 border-amber-300 bg-amber-50' : 'text-rose-700 border-rose-300 bg-rose-50'}`}>{status === 'USED' ? 'CHECKED IN' : status}</span>
        </div>
        <div className="grid grid-cols-3 gap-x-4 gap-y-3 mt-4 text-sm">
          <Cell k="Date" v={dateLong(show.start_time)} span />
          <Cell k="Time" v={time12(show.start_time)} />
          <Cell k="Screen" v={screen.screen_name} />
          <Cell k="Seat" v={label} strong />
          <Cell k="Class" v={category.category_name} />
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-4"><MapPin size={13} /> {cinema.cinema_name}, {cinema.city}</div>
        <div className="flex items-center justify-between text-xs text-slate-500 mt-1.5">
          <span>Booking <b className="text-slate-800 tracking-wider">{booking.booking_reference}</b></span>
          <span>{money(bs.seat_price)}</span>
        </div>
      </div>
      <div className="ticket-stub">
        {ticket ? <QR value={ticket.ticket_code} size={104} /> : <div className="w-[104px] h-[104px] rounded bg-slate-200" />}
        <div className="text-[10px] font-mono tracking-widest text-slate-500 text-center break-all">{ticket ? ticket.ticket_code : '— not issued —'}</div>
      </div>
    </div>
  );
}
function Cell({ k, v, span, strong }) {
  return (
    <div className={span ? 'col-span-1' : ''}>
      <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">{k}</div>
      <div className={`${strong ? 'text-lg font-extrabold text-[#0f1424]' : 'font-semibold'} leading-tight`}>{v}</div>
    </div>
  );
}
