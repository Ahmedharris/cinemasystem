import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Play, Ticket, ChevronLeft, ChevronRight, Star, Clock, MapPin, Film, Armchair, QrCode, Popcorn, RefreshCw, Percent, Copy, ArrowRight, Zap, Sparkles, Volume2, Crown, Box } from 'lucide-react';
import { useDb, useDocumentTitle, useStored } from '../hooks/useDb';
import { q, availability, isBookable, promoStatus, parseDT, now } from '../lib/db';
import { Backdrop } from '../components/Poster';
import Poster from '../components/Poster';
import MovieCard from '../components/MovieCard';
import TrailerModal from '../components/TrailerModal';
import { Badge, Stars, ProgressBar } from '../components/ui/Misc';
import { useUI } from '../context/UIContext';
import { fmtDuration, relDay, time12, nextDays, money, dateMed } from '../lib/format';

function Hero({ movies, onTrailer }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || movies.length < 2) return undefined;
    const id = setInterval(() => setI((x) => (x + 1) % movies.length), 6500);
    return () => clearInterval(id);
  }, [paused, movies.length]);
  if (!movies.length) return null;
  return (
    <section className="container-x pt-6" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="relative h-[30rem] sm:h-[34rem] rounded-3xl overflow-hidden border border-line bg-panel">
        {movies.map((m, idx) => {
          const r = q.ratingOf(m.movie_id);
          const genres = q.genresOf(m.movie_id).map((g) => g.genre_name);
          return (
            <div key={m.movie_id} className={`absolute inset-0 transition-opacity duration-700 ${idx === i ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} aria-hidden={idx !== i}>
              <Backdrop movie={m} />
              <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 sm:via-ink/70 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent" />
              <div className="relative h-full flex flex-col justify-center px-6 sm:px-14 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <Badge tone="gold"><Sparkles size={12} /> Now showing</Badge>
                  <Badge tone="muted">{m.content_rating}</Badge>
                  <Badge tone="muted">{m.language}</Badge>
                </div>
                <h1 className="text-4xl sm:text-6xl font-bold leading-[1.05]">{m.title}</h1>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-4 text-sm text-fg2">
                  {r.count > 0 && <span className="flex items-center gap-1.5"><Star size={15} className="text-gold fill-gold" /> <b className="text-fg">{r.avg.toFixed(1)}</b> ({r.count})</span>}
                  <span className="flex items-center gap-1.5"><Clock size={15} /> {fmtDuration(m.duration_minutes)}</span>
                  <span>{genres.join(' · ')}</span>
                </div>
                <p className="text-fg2 mt-4 line-clamp-3 max-w-lg leading-relaxed">{m.synopsis}</p>
                <div className="flex flex-wrap gap-3 mt-7">
                  <Link to={`/movie/${m.movie_id}`} className="btn btn-primary btn-lg"><Ticket size={18} /> Book tickets</Link>
                  <button className="btn btn-outline btn-lg" onClick={() => onTrailer(m)}><Play size={18} /> Watch trailer</button>
                </div>
              </div>
            </div>
          );
        })}
        {movies.length > 1 && (
          <>
            <button className="absolute left-3 top-1/2 -translate-y-1/2 btn btn-icon glass border border-line2 hidden sm:flex" onClick={() => setI((i - 1 + movies.length) % movies.length)} aria-label="Previous"><ChevronLeft size={20} /></button>
            <button className="absolute right-3 top-1/2 -translate-y-1/2 btn btn-icon glass border border-line2 hidden sm:flex" onClick={() => setI((i + 1) % movies.length)} aria-label="Next"><ChevronRight size={20} /></button>
            <div className="absolute bottom-5 right-6 sm:right-14 flex gap-2">
              {movies.map((m, idx) => <button key={m.movie_id} onClick={() => setI(idx)} aria-label={`Slide ${idx + 1}`} className={`h-1.5 rounded-full transition-all ${idx === i ? 'w-8 bg-gold' : 'w-3 bg-white/30 hover:bg-white/50'}`} />)}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function QuickBook({ movies }) {
  const nav = useNavigate();
  const { toast } = useUI();
  const cinemas = q.cinemas().filter((c) => c.cinema_status === 'ACTIVE');
  const days = nextDays(7);
  const [f, setF] = useState({ cinema: '', movie: '', date: days[0].date });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const go = (e) => {
    e.preventDefault();
    if (!f.movie) { toast.info('Please choose a movie first.'); return; }
    nav(`/movie/${f.movie}?date=${f.date}${f.cinema ? `&cinema=${f.cinema}` : ''}`);
  };
  return (
    <form onSubmit={go} className="container-x relative z-10 -mt-9">
      <div className="card glass p-4 sm:p-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1.3fr_1fr_auto] items-end shadow-2xl">
        <div><label className="label">Cinema</label>
          <select className="select" value={f.cinema} onChange={set('cinema')}>
            <option value="">All cinemas</option>
            {cinemas.map((c) => <option key={c.cinema_id} value={c.cinema_id}>{c.cinema_name} — {c.city}</option>)}
          </select></div>
        <div><label className="label">Movie</label>
          <select className="select" value={f.movie} onChange={set('movie')}>
            <option value="">Select a movie…</option>
            {movies.map((m) => <option key={m.movie_id} value={m.movie_id}>{m.title}</option>)}
          </select></div>
        <div><label className="label">Date</label>
          <select className="select" value={f.date} onChange={set('date')}>
            {days.map((d) => <option key={d.date} value={d.date}>{d.label}, {d.day} {d.month}</option>)}
          </select></div>
        <button className="btn btn-primary btn-lg sm:col-span-2 lg:col-span-1"><Zap size={18} /> Quick book</button>
      </div>
    </form>
  );
}

function StartingSoon() {
  const list = q.showtimes().filter((s) => isBookable(s)).sort((a, b) => a.start_time.localeCompare(b.start_time)).slice(0, 6);
  return (
    <section className="container-x section pb-4">
      <div className="flex items-end justify-between mb-6">
        <div><div className="eyebrow">Last minute</div><h2 className="section-title">Starting soon</h2></div>
        <Link to="/movies" className="text-sm font-semibold text-gold hover:underline hidden sm:block">All showtimes <ArrowRight size={14} className="inline" /></Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((s) => {
          const f = q.showFull(s.showtime_id);
          const a = availability(s);
          const mins = Math.round((parseDT(s.start_time) - now()) / 60000);
          return (
            <Link key={s.showtime_id} to={`/book/seats/${s.showtime_id}`} className="card card-hover p-3 flex gap-4">
              <Poster movie={f.movie} showTitle={false} className="w-20 shrink-0 !rounded-xl" />
              <div className="min-w-0 flex-1 flex flex-col">
                <div className="font-semibold truncate">{f.movie.title}</div>
                <div className="text-xs text-fg2 mt-0.5 truncate">{f.cinema.cinema_name} · {f.screen.screen_name}</div>
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <span className="font-display font-bold text-lg text-gold">{time12(s.start_time)}</span>
                  <span className="text-xs text-fg3">{relDay(s.start_time.slice(0, 10))}{mins > 0 && mins < 180 ? ` · in ${mins} min` : ''}</span>
                </div>
                <div className="mt-auto pt-2">
                  <div className="flex justify-between text-[11px] text-fg3 mb-1"><span>{a.free} seats left</span><span>{money(q.minPrice(s.showtime_id))}</span></div>
                  <ProgressBar pct={a.pct} tone="auto" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

const FEATURES = [
  { icon: Armchair, title: 'Pick your exact seat', text: 'Live seat map with instant availability and a 10-minute hold while you pay.' },
  { icon: QrCode, title: 'Skip the queue', text: 'Show the QR code on your phone at the entrance. No printing, no waiting.' },
  { icon: Popcorn, title: 'Pre-order snacks', text: 'Add popcorn and drinks to your booking and collect them before the show.' },
  { icon: RefreshCw, title: 'Easy cancellation', text: 'Cancel up to 2 hours before showtime and get your money back automatically.' }
];

export default function Home() {
  useDb();
  useDocumentTitle('');
  const { toast } = useUI();
  const [trailer, setTrailer] = useState(null);
  const [reminders, setReminders] = useStored('cinemax_reminders', []);
  const showing = useMemo(() => q.movies().filter((m) => m.movie_status === 'NOW_SHOWING'), []);
  const soon = q.movies().filter((m) => m.movie_status === 'COMING_SOON');
  const featured = [...showing].sort((a, b) => q.ratingOf(b.movie_id).avg - q.ratingOf(a.movie_id).avg).slice(0, 4);
  const promos = q.promotions().filter((p) => promoStatus(p) === 'ACTIVE').slice(0, 3);
  const food = q.food().filter((f) => f.availability_status === 'AVAILABLE').slice(0, 4);
  const types = q.screens().reduce((m, s) => ({ ...m, [s.screen_type]: (m[s.screen_type] || 0) + 1 }), {});

  const remind = (m) => {
    if (reminders.includes(m.movie_id)) { toast.info(`You'll already be reminded about ${m.title}.`); return; }
    setReminders([...reminders, m.movie_id]);
    toast.success(`We'll remind you when ${m.title} opens for booking.`);
  };
  const copy = (code) => { navigator.clipboard?.writeText(code).catch(() => {}); toast.success(`Code ${code} copied.`); };

  return (
    <div>
      <Hero movies={featured} onTrailer={setTrailer} />
      <QuickBook movies={showing} />

      <section className="container-x section">
        <div className="flex items-end justify-between mb-6">
          <div><div className="eyebrow">In cinemas</div><h2 className="section-title">Now showing</h2></div>
          <Link to="/movies" className="text-sm font-semibold text-gold hover:underline">View all <ArrowRight size={14} className="inline" /></Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5">
          {showing.map((m) => <MovieCard key={m.movie_id} movie={m} onTrailer={setTrailer} />)}
        </div>
      </section>

      <StartingSoon />

      <section className="container-x section">
        <div className="mb-6"><div className="eyebrow">Why CineMax</div><h2 className="section-title">A better way to watch</h2></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="card card-pad">
              <div className="w-11 h-11 rounded-xl bg-gold/12 text-gold flex items-center justify-center mb-4" style={{ background: 'rgba(245,184,46,.12)' }}><f.icon size={22} /></div>
              <h3 className="font-semibold mb-1.5">{f.title}</h3>
              <p className="text-sm text-fg2 leading-relaxed">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {promos.length > 0 && (
        <section className="container-x section pt-4">
          <div className="flex items-end justify-between mb-6">
            <div><div className="eyebrow">Save more</div><h2 className="section-title">Offers for you</h2></div>
            <Link to="/offers" className="text-sm font-semibold text-gold hover:underline">All offers <ArrowRight size={14} className="inline" /></Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {promos.map((p, i) => (
              <div key={p.promotion_id} className="relative overflow-hidden rounded-2xl border border-line p-6" style={{ background: `linear-gradient(135deg, ${['#3b2a08', '#10263f', '#2a1233'][i % 3]}, #0e1320)` }}>
                <Percent className="absolute -right-4 -bottom-4 text-white/5" size={120} />
                <div className="text-3xl font-display font-bold text-gold">{p.discount_type === 'PERCENT' ? `${p.discount_value}% OFF` : `${money(p.discount_value)} OFF`}</div>
                <p className="text-sm text-fg2 mt-2 min-h-[2.6rem]">{p.description}</p>
                <button onClick={() => copy(p.promo_code)} className="mt-4 inline-flex items-center gap-2 border border-dashed border-gold/60 text-gold font-mono font-bold tracking-widest px-3 py-1.5 rounded-lg hover:bg-gold/10">{p.promo_code} <Copy size={14} /></button>
                <div className="text-[11px] text-fg3 mt-3">Valid until {dateMed(p.valid_to)}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="container-x section">
        <div className="mb-6"><div className="eyebrow">Choose your experience</div><h2 className="section-title">Screens built for every mood</h2></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { k: 'IMAX', icon: Film, t: 'IMAX', d: 'Giant screen, laser projection and powerful immersive sound.' },
            { k: '3D', icon: Box, t: '3D', d: 'Step into the picture with crisp, bright 3D on every screen.' },
            { k: 'VIP', icon: Crown, t: 'VIP Recliners', d: 'Fully reclining leather seats with in-seat service.' },
            { k: 'STANDARD', icon: Volume2, t: 'Standard', d: 'Comfortable seating and Dolby sound at the best value.' }
          ].map((e) => (
            <Link key={e.k} to="/cinemas" className="card card-hover card-pad group">
              <e.icon size={26} className="text-gold mb-4" />
              <h3 className="font-semibold text-lg">{e.t}</h3>
              <p className="text-sm text-fg2 mt-1.5 leading-relaxed">{e.d}</p>
              <div className="text-xs text-fg3 mt-4">{types[e.k] || 0} screens across {q.cinemas().length} cinemas</div>
            </Link>
          ))}
        </div>
      </section>

      {soon.length > 0 && (
        <section className="container-x section">
          <div className="mb-6"><div className="eyebrow">Mark your calendar</div><h2 className="section-title">Coming soon</h2></div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-5">
            {soon.map((m) => <MovieCard key={m.movie_id} movie={m} onTrailer={setTrailer} onRemind={remind} />)}
          </div>
        </section>
      )}

      <section className="container-x section">
        <div className="rounded-3xl border border-line bg-gradient-to-br from-panel2 to-panel p-8 sm:p-12 grid gap-8 lg:grid-cols-2 items-center overflow-hidden relative">
          <div>
            <div className="eyebrow">Don't miss the good part</div>
            <h2 className="text-3xl sm:text-4xl font-bold mt-2">Add snacks to your booking</h2>
            <p className="text-fg2 mt-3 max-w-md">Pre-order popcorn, drinks and combos while you book. Everything is ready at the counter when you arrive.</p>
            <Link to="/menu" className="btn btn-primary mt-6"><Popcorn size={18} /> Browse the menu</Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {food.map((f) => (
              <div key={f.food_item_id} className="rounded-2xl bg-ink/50 border border-line p-4">
                <div className="text-3xl">{f.emoji}</div>
                <div className="font-semibold text-sm mt-2 leading-snug">{f.item_name}</div>
                <div className="text-gold text-sm font-bold mt-1">{money(f.current_price)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-x pb-4">
        <div className="grid gap-4 md:grid-cols-3">
          {q.cinemas().map((c) => (
            <Link key={c.cinema_id} to="/cinemas" className="card card-hover card-pad flex gap-4">
              <div className="w-11 h-11 rounded-xl bg-info/10 text-info flex items-center justify-center shrink-0"><MapPin size={20} /></div>
              <div><div className="font-semibold">{c.cinema_name}</div><div className="text-sm text-fg2">{c.address}</div><div className="text-xs text-fg3 mt-1">{q.screensOf(c.cinema_id).length} screens · {c.contact_number}</div></div>
            </Link>
          ))}
        </div>
      </section>

      <TrailerModal movie={trailer} onClose={() => setTrailer(null)} />
    </div>
  );
}
