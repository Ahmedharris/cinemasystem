import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Armchair, Film } from 'lucide-react';
import { useDb, useDocumentTitle } from '../hooks/useDb';
import { q, isBookable } from '../lib/db';
import { Badge, PageHeader, EmptyState } from '../components/ui/Misc';
import { nextDays, SCREEN_TYPE_LABEL, time12 } from '../lib/format';

export default function Cinemas() {
  useDb();
  useDocumentTitle('Cinemas');
  const days = nextDays(7);
  const [date, setDate] = useState(days[0].date);
  const [city, setCity] = useState('');
  const cinemas = q.cinemas().filter((c) => !city || c.city === city);
  const cities = [...new Set(q.cinemas().map((c) => c.city))];

  return (
    <div className="container-x py-10">
      <PageHeader eyebrow="Find us" title="Our cinemas" subtitle="Premium screens across Pakistan. Pick a day to see what is playing at each location." />
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <div className="flex gap-2 flex-wrap">
          <button className={`chip ${!city ? 'chip-active' : ''}`} onClick={() => setCity('')}>All cities</button>
          {cities.map((c) => <button key={c} className={`chip ${city === c ? 'chip-active' : ''}`} onClick={() => setCity(c)}>{c}</button>)}
        </div>
        <select className="select input-sm w-auto ml-auto" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Date">
          {days.map((d) => <option key={d.date} value={d.date}>{d.label}, {d.day} {d.month}</option>)}
        </select>
      </div>
      <div className="space-y-6">
        {cinemas.map((c) => {
          const screens = q.screensOf(c.cinema_id);
          const shows = q.showtimes().filter((s) => s.show_status === 'ON_SALE' && s.start_time.startsWith(date) && q.screen(s.screen_id).cinema_id === c.cinema_id);
          const byMovie = [...new Set(shows.map((s) => s.movie_id))].map((id) => ({ movie: q.movie(id), shows: shows.filter((s) => s.movie_id === id).sort((a, b) => a.start_time.localeCompare(b.start_time)) }));
          return (
            <section key={c.cinema_id} className="card overflow-hidden">
              <div className="grid lg:grid-cols-[22rem_1fr]">
                <div className="p-6 bg-panel2/60 border-b lg:border-b-0 lg:border-r border-line">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-xl font-bold">{c.cinema_name}</h2>
                    <Badge tone={c.cinema_status === 'ACTIVE' ? 'ok' : 'warn'}>{c.cinema_status === 'ACTIVE' ? 'Open' : 'Closed'}</Badge>
                  </div>
                  <div className="mt-4 space-y-2.5 text-sm text-fg2">
                    <div className="flex gap-2.5"><MapPin size={16} className="text-gold mt-0.5 shrink-0" /> {c.address}, {c.city}</div>
                    <div className="flex gap-2.5"><Phone size={16} className="text-gold shrink-0" /> {c.contact_number}</div>
                  </div>
                  <div className="mt-6">
                    <div className="text-xs font-bold text-fg3 uppercase tracking-wider mb-2.5">Screens</div>
                    <ul className="space-y-2">
                      {screens.map((s) => (
                        <li key={s.screen_id} className="flex items-center justify-between text-sm">
                          <span>{s.screen_name}</span>
                          <span className="flex items-center gap-2"><Badge tone="info">{SCREEN_TYPE_LABEL[s.screen_type]}</Badge><span className="text-xs text-fg3 flex items-center gap-1"><Armchair size={12} /> {q.capacity(s.screen_id)}</span></span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="p-6">
                  <div className="text-xs font-bold text-fg3 uppercase tracking-wider mb-4">Showtimes</div>
                  {byMovie.length ? (
                    <div className="space-y-5">
                      {byMovie.map(({ movie, shows: list }) => (
                        <div key={movie.movie_id} className="flex flex-wrap items-center gap-x-6 gap-y-2">
                          <Link to={`/movie/${movie.movie_id}?date=${date}&cinema=${c.cinema_id}`} className="font-semibold w-48 hover:text-gold flex items-center gap-2"><Film size={15} className="text-fg3" /> {movie.title}</Link>
                          <div className="flex flex-wrap gap-2">
                            {list.map((s) => {
                              const open = isBookable(s);
                              return open
                                ? <Link key={s.showtime_id} to={`/book/seats/${s.showtime_id}`} className="px-3 py-1.5 rounded-lg border border-line2 bg-panel2 text-sm font-semibold hover:border-gold hover:text-gold transition-colors">{time12(s.start_time)}</Link>
                                : <span key={s.showtime_id} className="px-3 py-1.5 rounded-lg border border-line text-sm text-fg3 line-through">{time12(s.start_time)}</span>;
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : <EmptyState icon={Film} title="No shows scheduled" text="Try another day." />}
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
