import { useState } from 'react';
import { Plus, Pencil, Trash2, LayoutGrid, Armchair } from 'lucide-react';
import { useDb, useDocumentTitle } from '../../hooks/useDb';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { q, crud } from '../../lib/db';
import DataTable from '../../components/ui/DataTable';
import { FormModal } from '../../components/ui/Form';
import Modal from '../../components/ui/Modal';
import { PageHeader, StatusBadge, Tabs, Badge } from '../../components/ui/Misc';
import { SCREEN_TYPE_LABEL, titleCase } from '../../lib/format';

/* ---------- seat layout editor ---------- */
function SeatEditor({ screen, onClose }) {
  const { user } = useAuth();
  const { toast } = useUI();
  const seats = q.seatsOf(screen.screen_id);
  const [local, setLocal] = useState(() => Object.fromEntries(seats.map((s) => [s.seat_id, { seat_category_id: s.seat_category_id, seat_status: s.seat_status }])));
  const [tool, setTool] = useState({ cat: 1, status: 'ACTIVE' });
  const cats = q.seatCategories();
  const rows = [...new Set(seats.map((s) => s.row_label))].sort();
  const paint = (id) => setLocal((l) => ({ ...l, [id]: { seat_category_id: tool.status === 'BROKEN' ? l[id].seat_category_id : tool.cat, seat_status: tool.status } }));
  const paintRow = (label) => setLocal((l) => { const n = { ...l }; seats.filter((s) => s.row_label === label).forEach((s) => { n[s.seat_id] = { seat_category_id: tool.status === 'BROKEN' ? l[s.seat_id].seat_category_id : tool.cat, seat_status: tool.status }; }); return n; });
  const changes = Object.fromEntries(seats.filter((s) => local[s.seat_id].seat_category_id !== s.seat_category_id || local[s.seat_id].seat_status !== s.seat_status).map((s) => [s.seat_id, local[s.seat_id]]));
  const n = Object.keys(changes).length;
  const save = () => { crud.saveSeatLayout(screen.screen_id, changes, user.user_id); toast.success(`Seat layout saved (${n} seats changed).`); onClose(); };
  const maxCols = Math.max(...seats.map((s) => s.seat_number));
  const tools = [...cats.map((c) => ({ key: `c${c.seat_category_id}`, label: c.category_name, cat: c.seat_category_id, status: 'ACTIVE', cls: `seat seat-c${c.seat_category_id}` })), { key: 'broken', label: 'Out of service', cat: 0, status: 'BROKEN', cls: 'seat seat-broken' }];
  return (
    <Modal open onClose={onClose} size="xl" title={`Seat layout — ${screen.screen_name}`} subtitle="Choose a brush, then click seats (or a row letter) to repaint them. Changes affect future bookings only."
      footer={<><span className="text-sm text-fg2 mr-auto">{n} unsaved {n === 1 ? 'change' : 'changes'}</span><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={!n} onClick={save}>Save layout</button></>}>
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {tools.map((t) => { const on = tool.status === t.status && (t.status === 'BROKEN' || tool.cat === t.cat); return (
          <button key={t.key} className={`chip ${on ? 'chip-active' : ''}`} onClick={() => setTool({ cat: t.cat || tool.cat, status: t.status })}><span className={`${t.cls} !w-4 !h-4 pointer-events-none`} /> {t.label}</button>); })}
      </div>
      <div className="overflow-x-auto pb-2">
        <div className="min-w-max mx-auto w-fit">
          <div className="screen-curve" /><div className="text-center text-[10px] tracking-[0.4em] text-fg3 -mt-5 mb-6">SCREEN</div>
          <div className="space-y-1.5">
            {rows.map((label) => (
              <div key={label} className="flex items-center justify-center gap-1.5">
                <button className="w-6 text-center text-[11px] font-bold text-fg3 hover:text-gold" onClick={() => paintRow(label)} title="Paint the whole row">{label}</button>
                <div className="flex gap-1.5">
                  {seats.filter((s) => s.row_label === label).sort((a, b) => a.seat_number - b.seat_number).map((s) => {
                    const l = local[s.seat_id];
                    return <button key={s.seat_id} className={`seat seat-c${l.seat_category_id} ${l.seat_status === 'BROKEN' ? 'seat-broken' : ''}`} style={s.seat_number === Math.floor(maxCols / 2) + 1 ? { marginLeft: '1.1rem' } : undefined} onClick={() => paint(s.seat_id)} title={`${label}${s.seat_number}`} />;
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default function AdminCinemas() {
  useDb();
  useDocumentTitle('Cinemas · Admin');
  const { user } = useAuth();
  const { toast, confirm } = useUI();
  const [tab, setTab] = useState('cinemas');
  const [cinemaForm, setCinemaForm] = useState(null);
  const [screenForm, setScreenForm] = useState(null);
  const [layout, setLayout] = useState(null);
  const [mult, setMult] = useState({});
  const run = (fn) => { try { fn(); } catch (e) { toast.fail(e); } };

  const cinemaFields = [
    { name: 'cinema_name', label: 'Cinema name', required: true, full: true },
    { name: 'city', label: 'City', required: true },
    { name: 'contact_number', label: 'Contact number', required: true },
    { name: 'address', label: 'Address', required: true, full: true },
    { name: 'cinema_status', label: 'Status', type: 'select', noBlank: true, options: [{ value: 'ACTIVE', label: 'Open' }, { value: 'CLOSED', label: 'Closed' }] }
  ];
  const saveCinema = (v) => {
    if (cinemaForm.cinema_id) { crud.update('cinema', cinemaForm.cinema_id, v, user.user_id); toast.success('Cinema updated.'); } else { crud.insert('cinema', v, user.user_id); toast.success('Cinema added.'); }
  };
  const delCinema = async (c) => {
    if (await confirm({ title: `Delete ${c.cinema_name}?`, message: 'Cinemas with screens or staff cannot be deleted — close them instead.', confirmText: 'Delete', danger: true })) run(() => { crud.remove('cinema', c.cinema_id, user.user_id); toast.success('Cinema deleted.'); });
  };

  const screenFields = (isNew) => [
    ...(isNew ? [{ name: 'cinema_id', label: 'Cinema', type: 'select', numeric: true, required: true, options: q.cinemas().map((c) => ({ value: c.cinema_id, label: c.cinema_name })) }] : []),
    { name: 'screen_name', label: 'Screen name', required: true },
    { name: 'screen_type', label: 'Type', type: 'select', required: true, noBlank: true, options: Object.entries(SCREEN_TYPE_LABEL).map(([value, label]) => ({ value, label })) },
    ...(isNew ? [
      { name: 'rows', label: 'Rows', type: 'number', required: true, min: 3, max: 16, hint: 'Rows are lettered A, B, C…' },
      { name: 'cols', label: 'Seats per row', type: 'number', required: true, min: 4, max: 24 }
    ] : [{ name: 'screen_status', label: 'Status', type: 'select', noBlank: true, options: ['ACTIVE', 'MAINTENANCE', 'CLOSED'].map((s) => ({ value: s, label: titleCase(s) })) }])
  ];
  const saveScreen = (v) => {
    if (screenForm.screen_id) { crud.update('screen', screenForm.screen_id, v, user.user_id); toast.success('Screen updated.'); } else { crud.createScreen(v, user.user_id); toast.success(`Screen created with ${v.rows * v.cols} seats.`); }
  };
  const delScreen = async (s) => {
    if (await confirm({ title: `Delete ${s.screen_name}?`, message: 'Its seats are deleted too. Screens that have showtimes cannot be deleted.', confirmText: 'Delete', danger: true })) run(() => { crud.remove('screen', s.screen_id, user.user_id); toast.success('Screen deleted.'); });
  };

  const cinemaCols = [
    { key: 'name', header: 'Cinema', sort: (c) => c.cinema_name, cell: (c) => <div><div className="font-semibold">{c.cinema_name}</div><div className="text-xs text-fg3">{c.address}</div></div> },
    { key: 'city', header: 'City', sort: (c) => c.city },
    { key: 'phone', header: 'Contact', sort: (c) => c.contact_number },
    { key: 'screens', header: 'Screens', sort: (c) => q.screensOf(c.cinema_id).length },
    { key: 'seats', header: 'Seats', sort: (c) => q.screensOf(c.cinema_id).reduce((a, s) => a + q.capacity(s.screen_id), 0) },
    { key: 'status', header: 'Status', sort: (c) => c.cinema_status, cell: (c) => <Badge tone={c.cinema_status === 'ACTIVE' ? 'ok' : 'muted'}>{c.cinema_status === 'ACTIVE' ? 'Open' : 'Closed'}</Badge> },
    { key: 'act', header: '', className: 'text-right', cell: (c) => <div className="flex justify-end gap-1"><button className="btn btn-ghost btn-icon" onClick={() => setCinemaForm(c)}><Pencil size={16} /></button><button className="btn btn-ghost btn-icon text-bad" onClick={() => delCinema(c)}><Trash2 size={16} /></button></div> }
  ];
  const screenCols = [
    { key: 'cinema', header: 'Cinema', sort: (s) => q.cinema(s.cinema_id).cinema_name, cell: (s) => q.cinema(s.cinema_id).cinema_name },
    { key: 'name', header: 'Screen', sort: (s) => s.screen_name, cell: (s) => <span className="font-semibold">{s.screen_name}</span> },
    { key: 'type', header: 'Type', sort: (s) => s.screen_type, cell: (s) => <Badge tone="info">{SCREEN_TYPE_LABEL[s.screen_type]}</Badge> },
    { key: 'cap', header: 'Seats', sort: (s) => q.capacity(s.screen_id), cell: (s) => { const all = q.seatsOf(s.screen_id); const broken = all.length - q.capacity(s.screen_id); return <span>{q.capacity(s.screen_id)}{broken > 0 && <span className="text-bad text-xs ml-1">({broken} out)</span>}</span>; } },
    { key: 'status', header: 'Status', sort: (s) => s.screen_status, cell: (s) => <StatusBadge status={s.screen_status} /> },
    { key: 'act', header: '', className: 'text-right whitespace-nowrap', cell: (s) => <div className="flex justify-end gap-1"><button className="btn btn-secondary btn-sm" onClick={() => setLayout(s)}><LayoutGrid size={14} /> Seat layout</button><button className="btn btn-ghost btn-icon" onClick={() => setScreenForm(s)}><Pencil size={16} /></button><button className="btn btn-ghost btn-icon text-bad" onClick={() => delScreen(s)}><Trash2 size={16} /></button></div> }
  ];

  return (
    <div>
      <PageHeader title="Cinemas & screens" subtitle="Branches, auditoriums, seat layouts and seat categories."
        actions={tab === 'cinemas' ? <button className="btn btn-primary" onClick={() => setCinemaForm({ cinema_status: 'ACTIVE' })}><Plus size={16} /> Add cinema</button> : tab === 'screens' ? <button className="btn btn-primary" onClick={() => setScreenForm({ screen_type: 'STANDARD', rows: 8, cols: 12 })}><Plus size={16} /> Add screen</button> : null} />
      <Tabs className="mb-5" value={tab} onChange={setTab} tabs={[{ value: 'cinemas', label: 'Cinemas', count: q.cinemas().length }, { value: 'screens', label: 'Screens', count: q.screens().length }, { value: 'categories', label: 'Seat categories' }]} />

      {tab === 'cinemas' && <DataTable columns={cinemaCols} rows={q.cinemas()} rowKey={(c) => c.cinema_id} searchText={(c) => `${c.cinema_name} ${c.city} ${c.address}`} exportName="cinemas" />}
      {tab === 'screens' && <DataTable columns={screenCols} rows={q.screens()} rowKey={(s) => s.screen_id} searchText={(s) => `${s.screen_name} ${q.cinema(s.cinema_id).cinema_name}`} filters={[{ key: 'cinema', label: 'All cinemas', options: q.cinemas().map((c) => ({ value: c.cinema_id, label: c.cinema_name })), test: (s, v) => s.cinema_id === Number(v) }]} />}
      {tab === 'categories' && (
        <div className="grid gap-5 md:grid-cols-3">
          {q.seatCategories().map((c) => {
            const count = q.screens().reduce((a, s) => a + q.seatsOf(s.screen_id).filter((x) => x.seat_category_id === c.seat_category_id).length, 0);
            const val = mult[c.seat_category_id] ?? c.price_multiplier;
            return (
              <div key={c.seat_category_id} className="card card-pad">
                <div className="flex items-center justify-between mb-4"><div className="flex items-center gap-3"><span className={`seat seat-c${c.seat_category_id} pointer-events-none`}><Armchair size={13} /></span><h3 className="font-semibold">{c.category_name}</h3></div><span className="text-xs text-fg3">{count} seats</span></div>
                <label className="label">Price multiplier</label>
                <div className="flex gap-2"><input className="input" type="number" step="0.05" min="0.5" max="5" value={val} onChange={(e) => setMult({ ...mult, [c.seat_category_id]: e.target.value })} />
                  <button className="btn btn-secondary" disabled={Number(val) === c.price_multiplier || !(Number(val) > 0)} onClick={() => { crud.update('seat_category', c.seat_category_id, { price_multiplier: Number(val) }, user.user_id); setMult({}); toast.success('Multiplier updated.'); }}>Save</button></div>
                <p className="field-hint">Used to suggest prices for new shows: base price × multiplier.</p>
              </div>
            );
          })}
        </div>
      )}

      <FormModal open={!!cinemaForm} title={cinemaForm && cinemaForm.cinema_id ? 'Edit cinema' : 'Add cinema'} fields={cinemaFields} initial={cinemaForm || {}} onSubmit={saveCinema} onClose={() => setCinemaForm(null)} />
      <FormModal open={!!screenForm} title={screenForm && screenForm.screen_id ? 'Edit screen' : 'Add screen'} subtitle={screenForm && !screenForm.screen_id ? 'Seats are generated automatically; fine-tune them afterwards in the seat layout editor.' : undefined} fields={screenFields(screenForm && !screenForm.screen_id)} initial={screenForm || {}} onSubmit={saveScreen} onClose={() => setScreenForm(null)} />
      {layout && <SeatEditor screen={layout} onClose={() => setLayout(null)} />}
    </div>
  );
}
