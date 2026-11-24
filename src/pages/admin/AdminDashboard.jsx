import { Link } from 'react-router-dom';
import { Wallet, Ticket, CalendarCheck, Gauge, ScanLine, CalendarPlus, ArrowRight } from 'lucide-react';
import { useDb, useDocumentTitle } from '../../hooks/useDb';
import { useAuth } from '../../context/AuthContext';
import { q, fmtD, now, parseDT } from '../../lib/db';
import * as A from '../../lib/analytics';
import { StatCard, PageHeader, ProgressBar, StatusBadge, Badge } from '../../components/ui/Misc';
import { BarChart, HBars, Donut } from '../../components/ui/Charts';
import { money, time24, timeAgo, dateTimeShort, titleCase } from '../../lib/format';

export default function AdminDashboard() {
  useDb();
  useDocumentTitle('Dashboard');
  const { user, cinemaScope: scope, isAdmin } = useAuth();
  const days = A.revenueByDay(7, scope);
  const today = days[days.length - 1];
  const upcoming = q.bookings().filter((b) => b.booking_status === 'CONFIRMED' && parseDT(q.showtime(b.showtime_id).start_time) > now() && (!scope || q.screen(q.showtime(b.showtime_id).screen_id).cinema_id === scope)).length;
  const range30 = A.lastDays(30);
  const todayShows = A.occupancyForDate(fmtD(now()), scope);
  const recent = [...q.bookings()].filter((b) => !scope || q.screen(q.showtime(b.showtime_id).screen_id).cinema_id === scope).sort((a, b) => b.booking_time.localeCompare(a.booking_time)).slice(0, 7);
  const week = days.reduce((a, d) => a + d.value, 0);

  return (
    <div className="space-y-6">
      <PageHeader title={`Welcome back, ${user.role === 'ADMIN' ? user.full_name : user.full_name.split(' ')[0]}`} subtitle={`Here is what is happening ${scope ? `at ${q.cinema(scope).cinema_name}` : 'across all cinemas'} today.`}
        actions={<><Link to="/admin/counter" className="btn btn-primary"><Ticket size={16} /> New counter sale</Link><Link to="/admin/checkin" className="btn btn-secondary"><ScanLine size={16} /> Check-in</Link>{user.role !== 'BOX_OFFICE' && <Link to="/admin/showtimes" className="btn btn-outline"><CalendarPlus size={16} /> Schedule show</Link>}</>} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Wallet} label="Revenue today" value={money(today.value)} hint={`${money(week)} in the last 7 days`} />
        <StatCard icon={Ticket} label="Tickets sold today" value={today.tickets} hint="Web and counter sales" tone="info" />
        <StatCard icon={CalendarCheck} label="Upcoming bookings" value={upcoming} hint="Confirmed, show not yet started" tone="ok" />
        <StatCard icon={Gauge} label="Avg occupancy (48h)" value={`${A.avgOccupancyUpcoming(scope)}%`} hint="Upcoming shows on sale" tone="warn" />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="card card-pad xl:col-span-2">
          <div className="flex items-center justify-between mb-5"><h3 className="font-semibold">Net revenue — last 7 days</h3><Link to="/admin/reports" className="text-xs text-gold font-semibold">Full report <ArrowRight size={12} className="inline" /></Link></div>
          <BarChart data={days} format={(v) => (v >= 1000 ? `${Math.round(v / 100) / 10}k` : v)} />
        </div>
        <div className="card card-pad">
          <h3 className="font-semibold mb-5">Payment methods <span className="text-fg3 font-normal text-xs">· 30 days</span></h3>
          <Donut data={A.paymentSplit({ cinemaId: scope, range: range30 })} centerLabel="Methods" centerValue={A.paymentSplit({ cinemaId: scope, range: range30 }).length} size={150} thickness={20} />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="card card-pad">
          <h3 className="font-semibold mb-5">Top movies <span className="text-fg3 font-normal text-xs">· tickets, 30 days</span></h3>
          <HBars data={A.ticketsByMovie({ cinemaId: scope, range: range30 }).slice(0, 5)} format={(v) => `${v} tickets`} />
        </div>
        <div className="card card-pad">
          {isAdmin ? (
            <>
              <h3 className="font-semibold mb-5">Revenue by cinema <span className="text-fg3 font-normal text-xs">· 30 days</span></h3>
              <HBars data={A.revenueByCinema(range30)} format={money} color="var(--color-info)" />
            </>
          ) : (
            <>
              <h3 className="font-semibold mb-5">Best-selling food <span className="text-fg3 font-normal text-xs">· 30 days</span></h3>
              <HBars data={A.foodSales({ cinemaId: scope, range: range30 }).slice(0, 5)} format={(v) => `${v} sold`} color="var(--color-info)" />
            </>
          )}
        </div>
        <div className="card card-pad">
          <div className="flex items-center justify-between mb-4"><h3 className="font-semibold">Recent bookings</h3><Link to="/admin/bookings" className="text-xs text-gold font-semibold">View all</Link></div>
          <ul className="divide-y divide-line">
            {recent.map((b) => (
              <li key={b.booking_id} className="py-2.5 flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0"><div className="font-semibold tracking-wide">{b.booking_reference}</div><div className="text-xs text-fg3 truncate">{q.movie(q.showtime(b.showtime_id).movie_id).title} · {timeAgo(b.booking_time)}</div></div>
                <div className="text-right shrink-0"><div className="font-semibold text-xs">{money(b.total_amount)}</div><StatusBadge status={b.booking_status} /></div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-5 flex items-center justify-between border-b border-line"><h3 className="font-semibold">Today's shows</h3><Link to="/admin/showtimes" className="text-xs text-gold font-semibold">Manage showtimes</Link></div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Time</th><th>Movie</th><th>Cinema · Screen</th><th>Occupancy</th><th>Seats</th><th>Status</th></tr></thead>
            <tbody>
              {todayShows.map(({ show, capacity, taken, pct }) => {
                const movie = q.movie(show.movie_id), sc = q.screen(show.screen_id);
                const over = parseDT(show.end_time) < now();
                return (
                  <tr key={show.showtime_id}>
                    <td className="font-display font-bold">{time24(show.start_time)}</td>
                    <td className="font-medium">{movie.title}</td>
                    <td className="text-fg2">{q.cinema(sc.cinema_id).cinema_name} · {sc.screen_name}</td>
                    <td className="min-w-[10rem]"><div className="flex items-center gap-3"><div className="flex-1"><ProgressBar pct={pct} tone="auto" /></div><span className="text-xs text-fg2 w-9">{pct}%</span></div></td>
                    <td className="text-fg2">{taken}/{capacity}</td>
                    <td>{over && show.show_status === 'ON_SALE' ? <Badge tone="muted">Finished</Badge> : <StatusBadge status={show.show_status} label={titleCase(show.show_status)} />}</td>
                  </tr>
                );
              })}
              {!todayShows.length && <tr><td colSpan={6} className="text-center text-fg3 py-8">No shows scheduled today.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
