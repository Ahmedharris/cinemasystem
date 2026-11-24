import { useState } from 'react';
import { Plus, Pencil, Ban } from 'lucide-react';
import { useDb, useDocumentTitle } from '../../hooks/useDb';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { q, crud, table, save, addShowtime, cancelShowtime, availability, parseDT, now, fmtD } from '../../lib/db';
import DataTable from '../../components/ui/DataTable';
import { FormModal } from '../../components/ui/Form';
import { PageHeader, StatusBadge, Tabs, ProgressBar, Badge, Callout } from '../../components/ui/Misc';
import { money, dateShort, time24, SCREEN_TYPE_LABEL, titleCase } from '../../lib/format';

const BASE = { STANDARD: 800, '3D': 1000, IMAX: 1400, VIP: 1800 };
const LANGS = ['English', 'Urdu', 'Punjabi', 'Hindi', 'Pashto', 'Sindhi', 'Arabic'];

export default function AdminShowtimes() {
  useDb();
  useDocumentTitle('Showtimes · Admin');
  const { user, cinemaScope: scope } = useAuth();
  const { toast, confirm } = useUI();
  const [when, setWhen] = useState('upcoming');
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);
  const cats = q.seatCategories();
  const today = fmtD(now());

  const screens = q.screens().filter((s) => !scope || s.cinema_id === scope);
  const all = q.showtimes().filter((s) => !scope || q.screen(s.screen_id).cinema_id === scope);
  const rows = all.filter((s) => (when === 'today' ? s.start_time.startsWith(today) : when === 'upcoming' ? parseDT(s.end_time) >= now() : when === 'past' ? parseDT(s.end_time) < now() : true));
  const counts = { upcoming: all.filter((s) => parseDT(s.end_time) >= now()).length, today: all.filter((s) => s.start_time.startsWith(today)).length, past: all.filter((s) => parseDT(s.end_time) < now()).length, all: all.length };
  const sortDir = when === 'past' ? 'desc' : 'asc';

  const priceFields = cats.map((c) => ({ name: `price_${c.seat_category_id}`, label: `${c.category_name} price (Rs.)`, type: 'number', required: true, min: 0 }));
  const derive = (v, ch) => {
    const patch = {};
    if (ch === 'screen_id' && v.screen_id) patch.base_price = BASE[q.screen(Number(v.screen_id)).screen_type];
    if (ch === 'movie_id' && v.movie_id && !v.audio_language) patch.audio_language = q.movie(Number(v.movie_id)).language;
    if (ch === 'screen_id' || ch === 'base_price') {
      const base = Number(patch.base_price ?? v.base_price);
      if (base) cats.forEach((c) => { patch[`price_${c.seat_category_id}`] = Math.round((base * c.price_multiplier) / 10) * 10; });
    }
    return patch;
  };
  const addFields = [
    { name: 'movie_id', label: 'Movie', type: 'select', numeric: true, required: true, full: true, options: q.movies().filter((m) => m.movie_status === 'NOW_SHOWING').map((m) => ({ value: m.movie_id, label: `${m.title} (${m.duration_minutes} min)` })) },
    { name: 'screen_id', label: 'Screen', type: 'select', numeric: true, required: true, full: true, options: screens.map((s) => ({ value: s.screen_id, label: `${q.cinema(s.cinema_id).cinema_name} — ${s.screen_name} (${SCREEN_TYPE_LABEL[s.screen_type]})` })) },
    { name: 'date', label: 'Date', type: 'date', required: true, min: today },
    { name: 'time', label: 'Start time', type: 'time', required: true },
    { name: 'audio_language', label: 'Audio language', type: 'select', required: true, options: LANGS.map((l) => ({ value: l, label: l })) },
    { name: 'subtitle_language', label: 'Subtitles', type: 'select', placeholder: 'None', options: LANGS.map((l) => ({ value: l, label: l })) },
    { name: 'base_price', label: 'Base price (Rs.)', type: 'number', required: true, min: 100, hint: 'Seat prices below follow the category multipliers; you can override them.' },
    ...priceFields.map((f) => ({ ...f, full: false }))
  ];
  const create = (v) => {
    const start = `${v.date} ${v.time}:00`;
    if (parseDT(start) < now()) throw Object.assign(new Error('Start time must be in the future.'), { userMessage: 'Start time must be in the future.' });
    const prices = {};
    cats.forEach((c) => { prices[c.seat_category_id] = v[`price_${c.seat_category_id}`]; });
    addShowtime({ movie_id: v.movie_id, screen_id: v.screen_id, start_time: start, audio_language: v.audio_language, subtitle_language: v.subtitle_language, base_price: v.base_price, prices }, user.user_id);
    toast.success('Showtime scheduled.');
  };

  const editFields = [
    { name: 'show_status', label: 'Status', type: 'select', noBlank: true, options: [{ value: 'ON_SALE', label: 'On sale' }, { value: 'DRAFT', label: 'Draft (hidden)' }] },
    { name: 'base_price', label: 'Base price (Rs.)', type: 'number', required: true, min: 100 },
    ...priceFields
  ];
  const saveEdit = (v) => {
    crud.update('showtime', editing.showtime_id, { show_status: v.show_status, base_price: v.base_price }, user.user_id);
    cats.forEach((c) => { const row = table('showtime_price').find((p) => p.showtime_id === editing.showtime_id && p.seat_category_id === c.seat_category_id); if (row) row.price = v[`price_${c.seat_category_id}`]; });
    save();
    toast.success('Showtime updated.');
  };
  const startEdit = (s) => {
    const pm = {};
    table('showtime_price').filter((p) => p.showtime_id === s.showtime_id).forEach((p) => { pm[`price_${p.seat_category_id}`] = p.price; });
    setEditing({ ...s, ...pm });
  };
  const cancel = async (s) => {
    const n = q.bookings().filter((b) => b.showtime_id === s.showtime_id && ['CONFIRMED', 'PENDING'].includes(b.booking_status)).length;
    const msg = n ? `${n} active ${n === 1 ? 'booking' : 'bookings'} will be cancelled and fully refunded.` : 'No bookings exist for this show yet.';
    if (!(await confirm({ title: `Cancel show #${s.showtime_id}?`, message: msg, confirmText: 'Cancel show', cancelText: 'Keep', danger: true }))) return;
    try { const k = cancelShowtime(s.showtime_id, user.user_id); toast.success(k ? `Show cancelled and ${k} bookings refunded.` : 'Show cancelled.'); } catch (e) { toast.fail(e); }
  };

  const columns = [
    { key: 'when', header: 'Date & time', sort: (s) => s.start_time, cell: (s) => <div><div className="font-semibold">{dateShort(s.start_time)}</div><div className="text-xs text-fg2">{time24(s.start_time)} – {time24(s.end_time)}</div></div> },
    { key: 'movie', header: 'Movie', sort: (s) => q.movie(s.movie_id).title, cell: (s) => <span className="font-medium">{q.movie(s.movie_id).title}</span> },
    { key: 'screen', header: 'Cinema · Screen', sort: (s) => q.screen(s.screen_id).screen_name, cell: (s) => { const sc = q.screen(s.screen_id); return <div><div>{q.cinema(sc.cinema_id).cinema_name}</div><div className="text-xs text-fg2">{sc.screen_name} · {SCREEN_TYPE_LABEL[sc.screen_type]}</div></div>; } },
    { key: 'lang', header: 'Audio / sub', cell: (s) => <span className="text-fg2">{s.audio_language}{s.subtitle_language ? ` / ${s.subtitle_language}` : ''}</span>, csv: (s) => `${s.audio_language}${s.subtitle_language ? '/' + s.subtitle_language : ''}` },
    { key: 'price', header: 'Base price', sort: (s) => s.base_price, cell: (s) => money(s.base_price) },
    { key: 'occ', header: 'Occupancy', sort: (s) => availability(s).pct, cell: (s) => { const a = availability(s); return <div className="min-w-[8rem]"><div className="flex justify-between text-xs text-fg2 mb-1"><span>{a.taken}/{a.capacity}</span><span>{a.pct}%</span></div><ProgressBar pct={a.pct} tone="auto" /></div>; }, csv: (s) => availability(s).pct },
    { key: 'status', header: 'Status', sort: (s) => s.show_status, cell: (s) => (parseDT(s.end_time) < now() && s.show_status === 'ON_SALE' ? <Badge tone="muted">Finished</Badge> : <StatusBadge status={s.show_status} />) },
    { key: 'act', header: '', className: 'text-right whitespace-nowrap', cell: (s) => {
      const live = parseDT(s.end_time) >= now() && s.show_status !== 'CANCELLED';
      return live ? <div className="flex justify-end gap-1"><button className="btn btn-ghost btn-icon" title="Edit prices & status" onClick={() => startEdit(s)}><Pencil size={16} /></button><button className="btn btn-ghost btn-icon text-bad" title="Cancel show" onClick={() => cancel(s)}><Ban size={16} /></button></div> : null;
    } }
  ];

  return (
    <div>
      <PageHeader title="Showtimes" subtitle="Schedule shows, set seat-category prices and monitor occupancy. Overlapping shows on the same screen are blocked."
        actions={<button className="btn btn-primary" onClick={() => setAdding(true)}><Plus size={16} /> Schedule show</button>} />
      <Tabs className="mb-5" value={when} onChange={setWhen} tabs={[{ value: 'upcoming', label: 'Upcoming', count: counts.upcoming }, { value: 'today', label: 'Today', count: counts.today }, { value: 'past', label: 'Past', count: counts.past }, { value: 'all', label: 'All', count: counts.all }]} />
      <DataTable key={when} columns={columns} rows={rows} rowKey={(s) => s.showtime_id} pageSize={12} defaultSort={{ key: 'when', dir: sortDir }} exportName="showtimes"
        searchText={(s) => `${q.movie(s.movie_id).title} ${q.screen(s.screen_id).screen_name} ${s.showtime_id}`} searchPlaceholder="Search movie or screen…"
        filters={[
          ...(scope ? [] : [{ key: 'cinema', label: 'All cinemas', options: q.cinemas().map((c) => ({ value: c.cinema_id, label: c.cinema_name })), test: (s, v) => q.screen(s.screen_id).cinema_id === Number(v) }]),
          { key: 'movie', label: 'All movies', options: q.movies().filter((m) => m.movie_status !== 'COMING_SOON').map((m) => ({ value: m.movie_id, label: m.title })), test: (s, v) => s.movie_id === Number(v) },
          { key: 'status', label: 'All statuses', options: ['ON_SALE', 'DRAFT', 'CANCELLED', 'COMPLETED'].map((x) => ({ value: x, label: titleCase(x) })), test: (s, v) => s.show_status === v }
        ]} />

      <FormModal open={adding} title="Schedule a show" subtitle="End time is calculated from the movie length plus a 15-minute break." size="lg" fields={addFields} derive={derive} initial={{}} onSubmit={create} onClose={() => setAdding(false)} submitText="Schedule show" />
      <FormModal open={!!editing} title={editing ? `Edit show #${editing.showtime_id}` : ''} subtitle="New prices apply to future bookings only — existing tickets keep the price they were sold at." fields={editFields} initial={editing || {}} onSubmit={saveEdit} onClose={() => setEditing(null)} />
    </div>
  );
}
