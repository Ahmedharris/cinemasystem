import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, X, SlidersHorizontal, Film } from 'lucide-react';
import { useDb, useDocumentTitle, useStored } from '../hooks/useDb';
import { q } from '../lib/db';
import MovieCard from '../components/MovieCard';
import TrailerModal from '../components/TrailerModal';
import { EmptyState, PageHeader } from '../components/ui/Misc';
import { useUI } from '../context/UIContext';

const STATUS = [{ v: 'NOW_SHOWING', l: 'Now showing' }, { v: 'COMING_SOON', l: 'Coming soon' }, { v: 'ALL', l: 'All' }];
const SORTS = [{ v: 'rating', l: 'Top rated' }, { v: 'new', l: 'Newest' }, { v: 'title', l: 'Title A–Z' }, { v: 'length', l: 'Duration' }];

export default function Movies() {
  useDb();
  useDocumentTitle('Movies');
  const { toast } = useUI();
  const [sp, setSp] = useSearchParams();
  const [trailer, setTrailer] = useState(null);
  const [reminders, setReminders] = useStored('cinemax_reminders', []);
  const f = { q: sp.get('q') || '', genre: sp.get('genre') || '', lang: sp.get('lang') || '', rated: sp.get('rated') || '', status: sp.get('status') || 'NOW_SHOWING', sort: sp.get('sort') || 'rating' };
  const set = (k, v) => { const n = new URLSearchParams(sp); if (v && !(k === 'status' && v === 'NOW_SHOWING') && !(k === 'sort' && v === 'rating')) n.set(k, v); else n.delete(k); setSp(n, { replace: true }); };
  const reset = () => setSp({}, { replace: true });

  const languages = [...new Set(q.movies().map((m) => m.language))];
  const ratings = [...new Set(q.movies().map((m) => m.content_rating))];
  const genres = q.genres();

  const list = useMemo(() => {
    let out = q.movies().filter((m) => m.movie_status !== 'ARCHIVED');
    if (f.status !== 'ALL') out = out.filter((m) => m.movie_status === f.status);
    if (f.q) { const s = f.q.toLowerCase(); out = out.filter((m) => `${m.title} ${m.director} ${m.cast_members}`.toLowerCase().includes(s)); }
    if (f.genre) out = out.filter((m) => q.genresOf(m.movie_id).some((g) => String(g.genre_id) === f.genre));
    if (f.lang) out = out.filter((m) => m.language === f.lang);
    if (f.rated) out = out.filter((m) => m.content_rating === f.rated);
    const sorters = {
      rating: (a, b) => q.ratingOf(b.movie_id).avg - q.ratingOf(a.movie_id).avg,
      new: (a, b) => b.release_date.localeCompare(a.release_date),
      title: (a, b) => a.title.localeCompare(b.title),
      length: (a, b) => b.duration_minutes - a.duration_minutes
    };
    return [...out].sort(sorters[f.sort]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp, q.movies().length]);

  const active = ['q', 'genre', 'lang', 'rated'].filter((k) => f[k]).length;
  const remind = (m) => {
    if (reminders.includes(m.movie_id)) return toast.info('You already asked to be reminded.');
    setReminders([...reminders, m.movie_id]);
    return toast.success(`We'll remind you when ${m.title} opens for booking.`);
  };

  return (
    <div className="container-x py-10">
      <PageHeader eyebrow="Browse" title="Movies" subtitle="Find something to watch, check the showtimes and book your seats in a minute." />

      <div className="card p-4 mb-8 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[14rem]">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fg3" />
            <input className="input pl-10" placeholder="Search by title, director or cast…" value={f.q} onChange={(e) => set('q', e.target.value)} />
          </div>
          <div className="flex gap-1.5 bg-panel2 p-1 rounded-xl border border-line">
            {STATUS.map((s) => <button key={s.v} onClick={() => set('status', s.v)} className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors ${f.status === s.v ? 'bg-gold text-[#17110a]' : 'text-fg2 hover:text-fg'}`}>{s.l}</button>)}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SlidersHorizontal size={16} className="text-fg3" />
          <select className="select input-sm w-auto" value={f.genre} onChange={(e) => set('genre', e.target.value)} aria-label="Genre"><option value="">All genres</option>{genres.map((g) => <option key={g.genre_id} value={g.genre_id}>{g.genre_name}</option>)}</select>
          <select className="select input-sm w-auto" value={f.lang} onChange={(e) => set('lang', e.target.value)} aria-label="Language"><option value="">All languages</option>{languages.map((l) => <option key={l}>{l}</option>)}</select>
          <select className="select input-sm w-auto" value={f.rated} onChange={(e) => set('rated', e.target.value)} aria-label="Rating"><option value="">Any age rating</option>{ratings.map((l) => <option key={l}>{l}</option>)}</select>
          <div className="ml-auto flex items-center gap-3">
            {active > 0 && <button className="text-sm text-fg2 hover:text-gold inline-flex items-center gap-1" onClick={reset}><X size={14} /> Clear filters</button>}
            <select className="select input-sm w-auto" value={f.sort} onChange={(e) => set('sort', e.target.value)} aria-label="Sort">{SORTS.map((s) => <option key={s.v} value={s.v}>Sort: {s.l}</option>)}</select>
          </div>
        </div>
      </div>

      <div className="text-sm text-fg2 mb-5">{list.length} {list.length === 1 ? 'movie' : 'movies'} found</div>
      {list.length ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {list.map((m) => <MovieCard key={m.movie_id} movie={m} onTrailer={setTrailer} onRemind={remind} />)}
        </div>
      ) : (
        <EmptyState icon={Film} title="No movies match your search" text="Try removing a filter or searching for something else." action={<button className="btn btn-outline" onClick={reset}>Clear filters</button>} />
      )}
      <TrailerModal movie={trailer} onClose={() => setTrailer(null)} />
    </div>
  );
}
