import { useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Play, Clock, Calendar, Languages, ShieldCheck, Star, MapPin, Film, MessageSquare, Lock, User } from 'lucide-react';
import { useDb, useDocumentTitle } from '../hooks/useDb';
import { q, canReview, addReview } from '../lib/db';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import Poster, { Backdrop } from '../components/Poster';
import ShowtimeChip from '../components/ShowtimeChip';
import MovieCard from '../components/MovieCard';
import TrailerModal from '../components/TrailerModal';
import { Badge, Stars, EmptyState, Tabs, Avatar } from '../components/ui/Misc';
import { fmtDuration, nextDays, dateMed, timeAgo, relDay } from '../lib/format';

function Reviews({ movie }) {
  const { user } = useAuth();
  const { toast } = useUI();
  const r = q.ratingOf(movie.movie_id);
  const reviews = q.reviewsOf(movie.movie_id);
  const can = canReview(user ? user.user_id : null, movie.movie_id);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const submit = (e) => {
    e.preventDefault();
    if (!rating) { toast.info('Please choose a star rating.'); return; }
    try { addReview(user.user_id, movie.movie_id, rating, text.trim()); setRating(0); setText(''); toast.success('Thanks for your review!'); } catch (err) { toast.fail(err); }
  };
  return (
    <div className="grid gap-8 lg:grid-cols-[18rem_1fr]">
      <div className="card card-pad self-start">
        <div className="flex items-end gap-3">
          <div className="text-5xl font-display font-bold">{r.count ? r.avg.toFixed(1) : '–'}</div>
          <div className="pb-1.5"><Stars value={r.avg} size={16} /><div className="text-xs text-fg3 mt-1">{r.count} {r.count === 1 ? 'review' : 'reviews'}</div></div>
        </div>
        <div className="mt-5 space-y-2">
          {[5, 4, 3, 2, 1].map((n) => (
            <div key={n} className="flex items-center gap-2 text-xs text-fg2">
              <span className="w-3">{n}</span><Star size={11} className="text-gold fill-gold" />
              <div className="progress flex-1"><span style={{ width: `${r.count ? (r.dist[n - 1] / r.count) * 100 : 0}%`, background: 'var(--color-gold)' }} /></div>
              <span className="w-4 text-right">{r.dist[n - 1]}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <div className="card card-pad">
          <h4 className="font-semibold mb-3 flex items-center gap-2"><MessageSquare size={17} className="text-gold" /> Write a review</h4>
          {can.ok ? (
            <form onSubmit={submit} className="space-y-3">
              <Stars value={rating} size={26} onChange={setRating} />
              <textarea className="textarea" rows={3} placeholder="What did you think of the movie?" value={text} onChange={(e) => setText(e.target.value)} maxLength={500} />
              <button className="btn btn-primary btn-sm">Post review</button>
            </form>
          ) : (
            <p className="text-sm text-fg2 flex items-start gap-2"><Lock size={15} className="mt-0.5 shrink-0 text-fg3" /> {can.reason} {!user && <Link to="/login" className="text-gold font-semibold ml-1">Sign in</Link>}</p>
          )}
        </div>
        {reviews.length ? reviews.map((rv) => (
          <div key={rv.review_id} className="card card-pad">
            <div className="flex items-center gap-3">
              <Avatar name={rv.user ? rv.user.full_name : '?'} size={36} />
              <div className="flex-1 min-w-0"><div className="font-semibold text-sm">{rv.user ? rv.user.full_name : 'Customer'}</div><div className="text-xs text-fg3">{timeAgo(rv.created_at)}</div></div>
              <Stars value={rv.rating} size={14} />
            </div>
            {rv.review_text && <p className="text-sm text-fg2 mt-3 leading-relaxed">{rv.review_text}</p>}
          </div>
        )) : <EmptyState icon={MessageSquare} title="No reviews yet" text="Be the first to review this movie after you watch it." />}
      </div>
    </div>
  );
}

export default function MovieDetails() {
  useDb();
  const { id } = useParams();
  const [sp, setSp] = useSearchParams();
  const movie = q.movie(id);
  useDocumentTitle(movie ? movie.title : 'Movie');
  const [tab, setTab] = useState('about');
  const [trailer, setTrailer] = useState(null);
  const days = nextDays(7);
  const cinemaFilter = sp.get('cinema') || '';

  const shows = useMemo(
    () => (movie ? q.showtimes().filter((s) => s.movie_id === movie.movie_id && s.show_status === 'ON_SALE') : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [id, q.showtimes().length]
  );
  if (!movie) return <div className="container-x py-20"><EmptyState icon={Film} title="Movie not found" action={<Link to="/movies" className="btn btn-primary">Browse movies</Link>} /></div>;

  const withShows = new Set(shows.map((s) => s.start_time.slice(0, 10)));
  const date = sp.get('date') || (days.find((d) => withShows.has(d.date)) || days[0]).date;
  const setDate = (d) => { const n = new URLSearchParams(sp); n.set('date', d); setSp(n, { replace: true }); };
  const setCinema = (c) => { const n = new URLSearchParams(sp); if (c) n.set('cinema', c); else n.delete('cinema'); setSp(n, { replace: true }); };

  const r = q.ratingOf(movie.movie_id);
  const genres = q.genresOf(movie.movie_id);
  const cinemas = q.cinemas().filter((c) => c.cinema_status === 'ACTIVE' && (!cinemaFilter || String(c.cinema_id) === cinemaFilter));
  const dayShows = shows.filter((s) => s.start_time.startsWith(date));
  const similar = q.movies().filter((m) => m.movie_id !== movie.movie_id && m.movie_status === 'NOW_SHOWING' && q.genresOf(m.movie_id).some((g) => genres.some((x) => x.genre_id === g.genre_id))).slice(0, 5);
  const soon = movie.movie_status === 'COMING_SOON';

  return (
    <div>
      <section className="relative overflow-hidden border-b border-line">
        <Backdrop movie={movie} className="opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/90 to-ink/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-transparent" />
        <div className="container-x relative py-10 sm:py-14 grid gap-8 md:grid-cols-[15rem_1fr] items-center">
          <Poster movie={movie} className="w-48 md:w-full mx-auto shadow-2xl ring-1 ring-white/10" />
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {soon ? <Badge tone="gold">Coming soon</Badge> : <Badge tone="ok">Now showing</Badge>}
              <Badge tone="muted">{movie.content_rating}</Badge>
              {genres.map((g) => <Badge key={g.genre_id} tone="muted">{g.genre_name}</Badge>)}
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold">{movie.title}</h1>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4 text-sm text-fg2">
              {r.count > 0 && <span className="flex items-center gap-2"><Stars value={r.avg} /> <b className="text-fg">{r.avg.toFixed(1)}</b> <span className="text-fg3">({r.count} reviews)</span></span>}
              <span className="flex items-center gap-1.5"><Clock size={15} /> {fmtDuration(movie.duration_minutes)}</span>
              <span className="flex items-center gap-1.5"><Languages size={15} /> {movie.language}</span>
              <span className="flex items-center gap-1.5"><Calendar size={15} /> {dateMed(movie.release_date)}</span>
            </div>
            <p className="mt-5 text-fg2 max-w-2xl leading-relaxed">{movie.synopsis}</p>
            <div className="flex flex-wrap gap-3 mt-7">
              {!soon && <a href="#showtimes" className="btn btn-primary btn-lg" onClick={(e) => { e.preventDefault(); document.getElementById('showtimes')?.scrollIntoView({ behavior: 'smooth' }); }}>Book tickets</a>}
              <button className="btn btn-outline btn-lg" onClick={() => setTrailer(movie)}><Play size={18} /> Trailer</button>
            </div>
          </div>
        </div>
      </section>

      <div className="container-x py-10 space-y-12">
        <section id="showtimes" className="scroll-mt-24">
          <h2 className="section-title mb-5">Showtimes</h2>
          {soon ? (
            <div className="card card-pad text-fg2 flex items-center gap-3"><Calendar className="text-gold" /> Booking opens closer to the release date ({dateMed(movie.release_date)}).</div>
          ) : (
            <>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                {days.map((d) => {
                  const on = d.date === date;
                  return (
                    <button key={d.date} onClick={() => setDate(d.date)} className={`shrink-0 w-[4.6rem] rounded-2xl border py-2.5 text-center transition-all ${on ? 'bg-gold border-gold text-[#17110a]' : 'bg-panel border-line hover:border-line2'}`}>
                      <div className={`text-[11px] font-bold uppercase ${on ? '' : 'text-fg3'}`}>{d.weekday}</div>
                      <div className="text-xl font-display font-bold">{d.day}</div>
                      <div className={`text-[11px] ${on ? '' : 'text-fg3'}`}>{d.month}</div>
                      <div className={`mx-auto mt-1 w-1 h-1 rounded-full ${withShows.has(d.date) ? (on ? 'bg-[#17110a]' : 'bg-gold') : 'bg-transparent'}`} />
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-2 my-5">
                <button className={`chip ${!cinemaFilter ? 'chip-active' : ''}`} onClick={() => setCinema('')}>All cinemas</button>
                {q.cinemas().filter((c) => c.cinema_status === 'ACTIVE').map((c) => <button key={c.cinema_id} className={`chip ${String(c.cinema_id) === cinemaFilter ? 'chip-active' : ''}`} onClick={() => setCinema(c.cinema_id)}>{c.city}</button>)}
              </div>
              <div className="space-y-4">
                {cinemas.map((c) => {
                  const list = dayShows.filter((s) => q.screen(s.screen_id).cinema_id === c.cinema_id).sort((a, b) => a.start_time.localeCompare(b.start_time));
                  if (!list.length) return null;
                  return (
                    <div key={c.cinema_id} className="card card-pad">
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div><h3 className="font-semibold">{c.cinema_name}</h3><div className="text-sm text-fg2 flex items-center gap-1.5 mt-0.5"><MapPin size={14} /> {c.address}</div></div>
                        <Badge tone="muted">{relDay(date)}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-3">{list.map((s) => <ShowtimeChip key={s.showtime_id} show={s} />)}</div>
                    </div>
                  );
                })}
                {!dayShows.length || !cinemas.some((c) => dayShows.some((s) => q.screen(s.screen_id).cinema_id === c.cinema_id)) ? (
                  <EmptyState icon={Calendar} title="No shows on this day" text="Pick another date or cinema to see more showtimes." />
                ) : null}
              </div>
              <p className="text-xs text-fg3 mt-4 flex items-center gap-1.5"><ShieldCheck size={13} /> Seats are held for 10 minutes once you select them.</p>
            </>
          )}
        </section>

        <section>
          <Tabs value={tab} onChange={setTab} tabs={[{ value: 'about', label: 'About' }, { value: 'reviews', label: 'Reviews', count: r.count }]} className="mb-6" />
          {tab === 'about' ? (
            <div className="grid gap-6 md:grid-cols-2">
              <div className="card card-pad">
                <h3 className="font-semibold mb-3">Synopsis</h3>
                <p className="text-fg2 leading-relaxed">{movie.synopsis}</p>
              </div>
              <div className="card card-pad">
                <h3 className="font-semibold mb-3">Details</h3>
                <dl className="grid grid-cols-[7rem_1fr] gap-y-3 text-sm">
                  <dt className="text-fg3">Director</dt><dd>{movie.director}</dd>
                  <dt className="text-fg3">Cast</dt><dd>{movie.cast_members}</dd>
                  <dt className="text-fg3">Genres</dt><dd>{genres.map((g) => g.genre_name).join(', ')}</dd>
                  <dt className="text-fg3">Language</dt><dd>{movie.language}</dd>
                  <dt className="text-fg3">Age rating</dt><dd>{movie.content_rating}</dd>
                  <dt className="text-fg3">Duration</dt><dd>{fmtDuration(movie.duration_minutes)}</dd>
                  <dt className="text-fg3">Release</dt><dd>{dateMed(movie.release_date)}</dd>
                </dl>
              </div>
            </div>
          ) : <Reviews movie={movie} />}
        </section>

        {similar.length > 0 && (
          <section>
            <h2 className="section-title mb-5">You may also like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">{similar.map((m) => <MovieCard key={m.movie_id} movie={m} onTrailer={setTrailer} />)}</div>
          </section>
        )}
      </div>
      <TrailerModal movie={trailer} onClose={() => setTrailer(null)} />
    </div>
  );
}
