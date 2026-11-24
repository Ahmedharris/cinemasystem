import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, MapPin, Calendar, Lock, Popcorn } from 'lucide-react';
import { useDb, useDocumentTitle } from '../hooks/useDb';
import { q, parseDT, now } from '../lib/db';
import { useAuth } from '../context/AuthContext';
import Poster from '../components/Poster';
import { StatusBadge, Tabs, EmptyState, PageHeader } from '../components/ui/Misc';
import { money, dateLong, time12 } from '../lib/format';

export default function MyBookings() {
  useDb();
  useDocumentTitle('My bookings');
  const { user } = useAuth();
  const [tab, setTab] = useState('upcoming');
  if (!user) return <div className="container-x py-20"><EmptyState icon={Lock} title="Sign in to see your bookings" action={<Link to="/login" state={{ from: '/my-bookings' }} className="btn btn-primary">Sign in</Link>} /></div>;

  const all = q.bookingsOfUser(user.user_id).map((b) => ({ b, show: q.showtime(b.showtime_id) })).sort((x, y) => y.b.booking_time.localeCompare(x.b.booking_time));
  const ended = (s) => parseDT(s.end_time) < now();
  const groups = {
    upcoming: all.filter(({ b, show }) => (b.booking_status === 'CONFIRMED' || b.booking_status === 'PENDING') && !ended(show)),
    past: all.filter(({ b, show }) => b.booking_status === 'CONFIRMED' && ended(show)),
    other: all.filter(({ b }) => b.booking_status === 'CANCELLED' || b.booking_status === 'EXPIRED' || (b.booking_status === 'PENDING' && false))
  };
  const list = groups[tab];

  return (
    <div className="container-x py-10 max-w-5xl">
      <PageHeader eyebrow="Account" title="My bookings" subtitle="Your tickets, past visits and cancelled bookings in one place." actions={<Link to="/movies" className="btn btn-primary"><Ticket size={16} /> Book a movie</Link>} />
      <Tabs value={tab} onChange={setTab} className="mb-6" tabs={[{ value: 'upcoming', label: 'Upcoming', count: groups.upcoming.length }, { value: 'past', label: 'Past', count: groups.past.length }, { value: 'other', label: 'Cancelled & expired', count: groups.other.length }]} />
      {list.length ? (
        <div className="space-y-4">
          {list.map(({ b, show }) => {
            const f = q.showFull(show.showtime_id);
            const seats = q.bookingFull(b).activeSeats.map((e) => `${e.seat.row_label}${e.seat.seat_number}`);
            const hasFood = q.foodOrders().some((o) => o.booking_id === b.booking_id && o.order_status !== 'CANCELLED');
            return (
              <Link key={b.booking_id} to={`/booking/${b.booking_reference}`} className="card card-hover p-4 flex gap-5">
                <Poster movie={f.movie} showTitle={false} className="w-20 sm:w-24 shrink-0 !rounded-xl" />
                <div className="flex-1 min-w-0 flex flex-col">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="font-semibold text-lg leading-snug">{f.movie.title}</h3>
                    <StatusBadge status={b.booking_status} />
                  </div>
                  <div className="mt-2 grid gap-1 text-sm text-fg2">
                    <span className="flex items-center gap-2"><Calendar size={14} className="text-gold" /> {dateLong(show.start_time)} · {time12(show.start_time)}</span>
                    <span className="flex items-center gap-2"><MapPin size={14} className="text-gold" /> {f.cinema.cinema_name} · {f.screen.screen_name}</span>
                  </div>
                  <div className="mt-auto pt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-fg3">
                    <span>Ref <b className="text-fg tracking-wider">{b.booking_reference}</b></span>
                    {seats.length > 0 && <span>Seats <b className="text-fg">{seats.join(', ')}</b></span>}
                    {hasFood && <span className="flex items-center gap-1"><Popcorn size={12} /> Food added</span>}
                    <span className="ml-auto text-sm font-bold text-gold">{money(b.total_amount)}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyState icon={Ticket} title={tab === 'upcoming' ? 'No upcoming bookings' : tab === 'past' ? 'No past visits yet' : 'Nothing cancelled or expired'} text="When you book a movie it will show up here." action={tab === 'upcoming' ? <Link to="/movies" className="btn btn-primary">Browse movies</Link> : null} />
      )}
    </div>
  );
}
