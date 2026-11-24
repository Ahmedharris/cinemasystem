import { useState } from 'react';
import { Plus, Pencil, Trash2, MessageSquare, Tags, Star } from 'lucide-react';
import { useDb, useDocumentTitle } from '../../hooks/useDb';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { q, crud, fmtDT, now } from '../../lib/db';
import DataTable from '../../components/ui/DataTable';
import { FormModal } from '../../components/ui/Form';
import Modal from '../../components/ui/Modal';
import Poster from '../../components/Poster';
import { PageHeader, StatusBadge, Stars, EmptyState } from '../../components/ui/Misc';
import { fmtDuration, dateMed, titleCase, timeAgo } from '../../lib/format';

const LANGS = ['English', 'Urdu', 'Punjabi', 'Pashto', 'Sindhi', 'Hindi', 'Arabic', 'Korean', 'Japanese'];
const ART = [
  { motif: 'city', c1: '#7f1d1d', c2: '#1e1b4b' }, { motif: 'space', c1: '#1e3a8a', c2: '#0f172a' }, { motif: 'letters', c1: '#0f766e', c2: '#1e293b' },
  { motif: 'arcade', c1: '#7e22ce', c2: '#be185d' }, { motif: 'blades', c1: '#374151', c2: '#92400e' }, { motif: 'heist', c1: '#be185d', c2: '#312e81' }, { motif: 'comedy', c1: '#b45309', c2: '#7c2d12' }
];

export default function AdminMovies() {
  useDb();
  useDocumentTitle('Movies · Admin');
  const { user } = useAuth();
  const { toast, confirm } = useUI();
  const [edit, setEdit] = useState(null); // null | {} (new) | movie
  const [reviewsOf, setReviewsOf] = useState(null);
  const [genreOpen, setGenreOpen] = useState(false);
  const [newGenre, setNewGenre] = useState('');
  const genres = q.genres();
  const langs = [...new Set([...LANGS, ...q.movies().map((m) => m.language)])];

  const fields = [
    { name: 'title', label: 'Title', required: true, full: true },
    { name: 'duration_minutes', label: 'Duration (minutes)', type: 'number', required: true, min: 20, max: 400 },
    { name: 'release_date', label: 'Release date', type: 'date', required: true },
    { name: 'language', label: 'Language', type: 'select', required: true, options: langs.map((l) => ({ value: l, label: l })) },
    { name: 'content_rating', label: 'Age rating', type: 'select', required: true, options: ['G', 'PG', 'PG-13', 'R'].map((r) => ({ value: r, label: r })) },
    { name: 'director', label: 'Director' },
    { name: 'movie_status', label: 'Status', type: 'select', required: true, noBlank: true, options: ['NOW_SHOWING', 'COMING_SOON', 'ARCHIVED'].map((s) => ({ value: s, label: titleCase(s) })) },
    { name: 'cast_members', label: 'Cast', full: true, placeholder: 'Comma separated names' },
    { name: 'genre_ids', label: 'Genres', type: 'multi', options: genres.map((g) => ({ value: g.genre_id, label: g.genre_name })) },
    { name: 'synopsis', label: 'Synopsis', type: 'textarea', rows: 4 },
    { name: 'poster_url', label: 'Poster image URL', hint: 'Optional — a generated poster is used when empty.' },
    { name: 'trailer_url', label: 'Trailer URL' }
  ];

  const save = (v) => {
    const { genre_ids, ...row } = v;
    row.poster_url = row.poster_url || null; row.trailer_url = row.trailer_url || null;
    if (edit.movie_id) {
      crud.update('movie', edit.movie_id, row, user.user_id);
      crud.setMovieGenres(edit.movie_id, genre_ids);
      toast.success('Movie updated.');
    } else {
      const m = crud.insert('movie', { ...row, created_at: fmtDT(now()), art: ART[q.movies().length % ART.length] }, user.user_id);
      crud.setMovieGenres(m.movie_id, genre_ids);
      toast.success('Movie added.');
    }
  };
  const remove = async (m) => {
    if (!(await confirm({ title: `Delete "${m.title}"?`, message: 'This also removes its genres and reviews. Movies that already have showtimes cannot be deleted — archive them instead.', confirmText: 'Delete', danger: true }))) return;
    try { crud.remove('movie', m.movie_id, user.user_id); toast.success('Movie deleted.'); } catch (e) { toast.fail(e); }
  };
  const addGenre = (e) => {
    e.preventDefault();
    const n = newGenre.trim();
    if (!n) return;
    if (genres.some((g) => g.genre_name.toLowerCase() === n.toLowerCase())) { toast.error('That genre already exists.'); return; }
    crud.insert('genre', { genre_name: n }, user.user_id); setNewGenre(''); toast.success('Genre added.');
  };
  const rm = (fn) => { try { fn(); } catch (e) { toast.fail(e); } };

  const columns = [
    { key: 'title', header: 'Movie', sort: (m) => m.title, cell: (m) => (
      <div className="flex items-center gap-3"><Poster movie={m} showTitle={false} className="w-10 shrink-0 !rounded-md" /><div className="min-w-0"><div className="font-semibold">{m.title}</div><div className="text-xs text-fg3">{q.genresOf(m.movie_id).map((g) => g.genre_name).join(', ') || 'No genres'}</div></div></div>) },
    { key: 'lang', header: 'Language', sort: (m) => m.language, cell: (m) => `${m.language} · ${m.content_rating}` },
    { key: 'dur', header: 'Duration', sort: (m) => m.duration_minutes, cell: (m) => fmtDuration(m.duration_minutes) },
    { key: 'rel', header: 'Release', sort: (m) => m.release_date, cell: (m) => dateMed(m.release_date) },
    { key: 'rating', header: 'Rating', sort: (m) => q.ratingOf(m.movie_id).avg, cell: (m) => { const r = q.ratingOf(m.movie_id); return r.count ? <span className="flex items-center gap-1.5"><Star size={13} className="text-gold fill-gold" /> {r.avg.toFixed(1)} <span className="text-fg3 text-xs">({r.count})</span></span> : <span className="text-fg3">—</span>; } },
    { key: 'status', header: 'Status', sort: (m) => m.movie_status, cell: (m) => <StatusBadge status={m.movie_status} /> },
    { key: 'act', header: '', className: 'text-right whitespace-nowrap', cell: (m) => (
      <div className="flex justify-end gap-1">
        <button className="btn btn-ghost btn-icon" title="Reviews" onClick={() => setReviewsOf(m)}><MessageSquare size={16} /></button>
        <button className="btn btn-ghost btn-icon" title="Edit" onClick={() => setEdit({ ...m, genre_ids: q.genresOf(m.movie_id).map((g) => g.genre_id) })}><Pencil size={16} /></button>
        <button className="btn btn-ghost btn-icon text-bad" title="Delete" onClick={() => remove(m)}><Trash2 size={16} /></button>
      </div>) }
  ];
  const reviews = reviewsOf ? q.reviewsOf(reviewsOf.movie_id) : [];

  return (
    <div>
      <PageHeader title="Movies" subtitle="Manage the movie catalogue, genres and customer reviews."
        actions={<><button className="btn btn-secondary" onClick={() => setGenreOpen(true)}><Tags size={16} /> Genres</button><button className="btn btn-primary" onClick={() => setEdit({ movie_status: 'NOW_SHOWING', content_rating: 'PG-13', language: 'English', genre_ids: [] })}><Plus size={16} /> Add movie</button></>} />
      <DataTable columns={columns} rows={q.movies()} rowKey={(m) => m.movie_id} searchText={(m) => `${m.title} ${m.director} ${m.cast_members}`} searchPlaceholder="Search title, director, cast…" exportName="movies"
        filters={[{ key: 'status', label: 'All statuses', options: ['NOW_SHOWING', 'COMING_SOON', 'ARCHIVED'].map((s) => ({ value: s, label: titleCase(s) })), test: (m, v) => m.movie_status === v }, { key: 'lang', label: 'All languages', options: langs.map((l) => ({ value: l, label: l })), test: (m, v) => m.language === v }]} />

      <FormModal open={!!edit} title={edit && edit.movie_id ? 'Edit movie' : 'Add movie'} size="lg" fields={fields} initial={edit || {}} onSubmit={save} onClose={() => setEdit(null)} submitText={edit && edit.movie_id ? 'Save changes' : 'Add movie'} />

      <Modal open={!!reviewsOf} onClose={() => setReviewsOf(null)} size="lg" title={reviewsOf ? `Reviews — ${reviewsOf.title}` : ''}>
        {reviews.length ? (
          <ul className="divide-y divide-line">
            {reviews.map((r) => (
              <li key={r.review_id} className="py-3 flex items-start gap-4">
                <div className="flex-1 min-w-0"><div className="flex items-center gap-3"><span className="font-semibold text-sm">{r.user ? r.user.full_name : 'Deleted user'}</span><Stars value={r.rating} size={13} /><span className="text-xs text-fg3">{timeAgo(r.created_at)}</span></div>{r.review_text && <p className="text-sm text-fg2 mt-1">{r.review_text}</p>}</div>
                <button className="btn btn-danger btn-sm" onClick={() => rm(() => { crud.remove('movie_review', r.review_id, user.user_id); toast.success('Review removed.'); })}><Trash2 size={14} /> Remove</button>
              </li>
            ))}
          </ul>
        ) : <EmptyState icon={MessageSquare} title="No reviews yet" />}
      </Modal>

      <Modal open={genreOpen} onClose={() => setGenreOpen(false)} title="Genres" subtitle="Genres used by movies cannot be deleted.">
        <form onSubmit={addGenre} className="flex gap-2 mb-4"><input className="input" placeholder="New genre name" value={newGenre} onChange={(e) => setNewGenre(e.target.value)} /><button className="btn btn-primary">Add</button></form>
        <ul className="divide-y divide-line">
          {genres.map((g) => {
            const n = q.movies().filter((m) => q.genresOf(m.movie_id).some((x) => x.genre_id === g.genre_id)).length;
            return (
              <li key={g.genre_id} className="py-2.5 flex items-center justify-between text-sm"><span className="font-medium">{g.genre_name} <span className="text-fg3 text-xs ml-1">{n} movies</span></span>
                <button className="btn btn-ghost btn-icon text-bad" onClick={() => rm(() => { crud.remove('genre', g.genre_id, user.user_id); toast.success('Genre deleted.'); })}><Trash2 size={15} /></button></li>
            );
          })}
        </ul>
      </Modal>
    </div>
  );
}
