import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Clock, MapPin, Calendar, Sparkles, Timer, ArrowRight, Info, Trash2, Film } from 'lucide-react';
import { useDb, useDocumentTitle, useCountdown, fmtClock } from '../hooks/useDb';
import { q, isBookable, createHold, replaceHold, releaseHold, takenSeats, MAX_SEATS, HOLD_MINUTES, parseDT } from '../lib/db';
import { pendingBooking, setCartId } from '../lib/cart';
import { findBestSeats } from '../lib/seatpick';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import SeatMap, { SeatLegend } from '../components/SeatMap';
import Stepper from '../components/Stepper';
import Poster from '../components/Poster';
import { Badge, Callout, EmptyState } from '../components/ui/Misc';
import { money, dateLong, time12, fmtDuration, SCREEN_TYPE_LABEL } from '../lib/format';

export default function SeatSelection() {
  useDb();
  const { showId } = useParams();
  const loc = useLocation();
  const nav = useNavigate();
  const { user } = useAuth();
  const { toast } = useUI();
  const full = q.showFull(showId);
  const mine = full ? pendingBooking(user ? user.user_id : null) : null;
  const mineHere = mine && full && mine.showtime_id === full.show.showtime_id ? mine : null;
  const [selected, setSelected] = useState(() => {
    if (loc.state && loc.state.seats) return loc.state.seats;
    return mineHere ? q.bookingFull(mineHere).activeSeats.map((e) => e.seat.seat_id) : [];
  });
  const [count, setCount] = useState(2);
  const ms = useCountdown(mineHere ? parseDT(mineHere.payment_deadline).getTime() : null);
  useDocumentTitle('Select seats');

  if (!full) return <div className="container-x py-20"><EmptyState icon={Film} title="Show not found" action={<Link to="/movies" className="btn btn-primary">Browse movies</Link>} /></div>;
  const { show, movie, screen, cinema, prices } = full;
  const open = isBookable(show);
  const seatById = (id) => q.seatsOf(show.screen_id).find((s) => s.seat_id === id);
  const sel = selected.map(seatById).filter(Boolean).sort((a, b) => a.row_label.localeCompare(b.row_label) || a.seat_number - b.seat_number);
  const subtotal = sel.reduce((a, s) => a + prices[s.seat_category_id], 0);

  const toggle = (seat) => {
    if (selected.includes(seat.seat_id)) setSelected(selected.filter((x) => x !== seat.seat_id));
    else if (selected.length >= MAX_SEATS) toast.info(`You can book up to ${MAX_SEATS} seats at a time.`);
    else setSelected([...selected, seat.seat_id]);
  };
  const quick = () => {
    const ids = findBestSeats(show.showtime_id, count, mineHere ? mineHere.booking_id : null);
    if (!ids) { toast.warn(`No ${count} seats together are free in this show. Try fewer seats or pick manually.`); return; }
    setSelected(ids);
    toast.success(`Selected the best ${count} seats for you.`);
  };

  const proceed = () => {
    if (!user) { toast.info('Please sign in to continue your booking.'); nav('/login', { state: { from: loc.pathname, seats: selected } }); return; }
    try {
      let b = pendingBooking(user.user_id);
      if (b && b.showtime_id === show.showtime_id) b = replaceHold(b.booking_id, selected);
      else {
        if (b) releaseHold(b.booking_id);
        b = createHold({ showtime_id: show.showtime_id, seat_ids: selected, user_id: user.user_id });
      }
      setCartId(b.booking_id);
      nav('/book/food');
    } catch (e) {
      toast.fail(e);
      const t = takenSeats(show.showtime_id, mineHere ? mineHere.booking_id : null);
      setSelected((cur) => cur.filter((id) => !t.has(id)));
    }
  };

  return (
    <div className="container-x py-8">
      <Stepper current={0} />
      <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-2">
        <div>
          <Link to={`/movie/${movie.movie_id}`} className="text-xs text-fg3 hover:text-gold">← {movie.title}</Link>
          <h1 className="text-2xl sm:text-3xl font-bold mt-1">Select your seats</h1>
        </div>
        {mineHere && ms > 0 && (
          <div className="ml-auto flex items-center gap-2 rounded-xl border border-warn/40 bg-warn/10 px-4 py-2 text-warn text-sm font-semibold">
            <Timer size={16} /> Seats held for {fmtClock(ms)}
          </div>
        )}
      </div>

      {!open ? (
        <Callout tone="bad" icon={Info}>Booking for this show is closed. <Link to={`/movie/${movie.movie_id}`} className="underline font-semibold">Choose another showtime</Link>.</Callout>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_22rem] items-start">
          <div className="card card-pad">
            <div className="flex flex-wrap items-center gap-3 mb-8 pb-5 border-b border-line">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-fg2">Seats together:</span>
                <select className="select input-sm w-auto" value={count} onChange={(e) => setCount(Number(e.target.value))}>
                  {Array.from({ length: MAX_SEATS }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={quick}><Sparkles size={15} className="text-gold" /> Best available</button>
              {selected.length > 0 && <button className="btn btn-ghost btn-sm ml-auto" onClick={() => setSelected([])}><Trash2 size={14} /> Clear</button>}
            </div>
            <SeatMap showId={show.showtime_id} selected={selected} onToggle={toggle} exceptBookingId={mineHere ? mineHere.booking_id : null} />
            <div className="mt-8 pt-5 border-t border-line"><SeatLegend prices={prices} /></div>
          </div>

          <aside className="card lg:sticky lg:top-24 overflow-hidden">
            <div className="p-5 flex gap-4 border-b border-line">
              <Poster movie={movie} showTitle={false} className="w-20 shrink-0 !rounded-xl" />
              <div className="min-w-0">
                <h3 className="font-semibold leading-snug">{movie.title}</h3>
                <div className="flex flex-wrap gap-1.5 mt-2"><Badge tone="muted">{movie.content_rating}</Badge><Badge tone="info">{SCREEN_TYPE_LABEL[screen.screen_type]}</Badge></div>
                <div className="text-xs text-fg3 mt-2">{fmtDuration(movie.duration_minutes)} · {show.audio_language}{show.subtitle_language ? ` · ${show.subtitle_language} subtitles` : ''}</div>
              </div>
            </div>
            <div className="p-5 space-y-2.5 text-sm border-b border-line">
              <div className="flex items-center gap-2.5 text-fg2"><MapPin size={15} className="text-gold" /> {cinema.cinema_name} · {screen.screen_name}</div>
              <div className="flex items-center gap-2.5 text-fg2"><Calendar size={15} className="text-gold" /> {dateLong(show.start_time)}</div>
              <div className="flex items-center gap-2.5 text-fg2"><Clock size={15} className="text-gold" /> {time12(show.start_time)}</div>
            </div>
            <div className="p-5">
              <div className="text-xs font-bold text-fg3 uppercase tracking-wider mb-3">Your seats ({sel.length}/{MAX_SEATS})</div>
              {sel.length ? (
                <ul className="space-y-2 text-sm">
                  {sel.map((s) => (
                    <li key={s.seat_id} className="flex items-center justify-between">
                      <span className="flex items-center gap-2"><span className="w-8 h-7 rounded-md bg-gold text-[#17110a] text-xs font-bold flex items-center justify-center">{s.row_label}{s.seat_number}</span><span className="text-fg2">{q.seatCategory(s.seat_category_id).category_name}</span></span>
                      <span className="font-semibold">{money(prices[s.seat_category_id])}</span>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-fg3">Tap seats on the map to select them.</p>}
              <div className="flex items-center justify-between mt-5 pt-4 border-t border-line">
                <span className="text-fg2">Tickets total</span>
                <span className="text-xl font-display font-bold text-gold">{money(subtotal)}</span>
              </div>
              <button className="btn btn-primary btn-lg btn-block mt-4" disabled={!sel.length} onClick={proceed}>Continue <ArrowRight size={18} /></button>
              <p className="text-[11px] text-fg3 mt-3 text-center">Seats are reserved for {HOLD_MINUTES} minutes after you continue.</p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
