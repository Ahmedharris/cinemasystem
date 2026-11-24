import { useState } from 'react';
import { Plus, Pencil, Trash2, ChevronRight, ChefHat } from 'lucide-react';
import { useDb, useDocumentTitle } from '../../hooks/useDb';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { q, crud, table, parseDT, now, fmtD } from '../../lib/db';
import DataTable from '../../components/ui/DataTable';
import { FormModal } from '../../components/ui/Form';
import { PageHeader, StatusBadge, Tabs, EmptyState } from '../../components/ui/Misc';
import { money, titleCase, time24, dateShort } from '../../lib/format';

const NEXT = { PLACED: 'PREPARING', PREPARING: 'READY', READY: 'COLLECTED' };
const COLS = [{ s: 'PLACED', label: 'New', tone: 'text-warn' }, { s: 'PREPARING', label: 'Preparing', tone: 'text-info' }, { s: 'READY', label: 'Ready for pickup', tone: 'text-ok' }, { s: 'COLLECTED', label: 'Collected today', tone: 'text-fg3' }];

function Orders() {
  const { user, cinemaScope: scope } = useAuth();
  const { toast } = useUI();
  const today = fmtD(now());
  const orders = table('food_order').filter((o) => {
    const b = q.booking(o.booking_id);
    if (b.booking_status !== 'CONFIRMED' && o.order_status !== 'CANCELLED') return false;
    const s = q.showtime(b.showtime_id);
    if (scope && q.screen(s.screen_id).cinema_id !== scope) return false;
    if (o.order_status === 'CANCELLED') return false;
    if (o.order_status === 'COLLECTED') return s.start_time.startsWith(today);
    return parseDT(s.end_time) >= now();
  });
  const advance = (o) => { crud.setFoodOrderStatus(o.food_order_id, NEXT[o.order_status], user.user_id); toast.success(`Order F${String(o.food_order_id).padStart(5, '0')} → ${titleCase(NEXT[o.order_status])}`); };
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 items-start">
      {COLS.map((col) => {
        const list = orders.filter((o) => o.order_status === col.s).sort((a, b) => q.showtime(q.booking(a.booking_id).showtime_id).start_time.localeCompare(q.showtime(q.booking(b.booking_id).showtime_id).start_time));
        return (
          <div key={col.s} className="rounded-2xl bg-panel border border-line p-3">
            <div className="flex items-center justify-between px-2 py-2 mb-2"><h3 className={`font-semibold text-sm ${col.tone}`}>{col.label}</h3><span className="badge badge-muted">{list.length}</span></div>
            <div className="space-y-3">
              {list.map((o) => {
                const b = q.booking(o.booking_id); const s = q.showtime(b.showtime_id);
                const lines = table('order_detail').filter((d) => d.food_order_id === o.food_order_id);
                return (
                  <div key={o.food_order_id} className="card p-3.5">
                    <div className="flex justify-between items-start gap-2"><span className="font-display font-bold tracking-wider">F{String(o.food_order_id).padStart(5, '0')}</span><span className="text-xs text-fg2">{dateShort(s.start_time)} {time24(s.start_time)}</span></div>
                    <div className="text-xs text-fg3 truncate mb-2">{q.movie(s.movie_id).title} · {b.booking_reference}</div>
                    <ul className="text-sm space-y-0.5">{lines.map((d) => <li key={d.order_detail_id}>{d.quantity}× {q.foodItem(d.food_item_id).item_name}</li>)}</ul>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-line"><span className="text-sm font-semibold text-gold">{money(o.total_amount)}</span>
                      {NEXT[o.order_status] && <button className="btn btn-secondary btn-sm" onClick={() => advance(o)}>{titleCase(NEXT[o.order_status])} <ChevronRight size={14} /></button>}</div>
                  </div>
                );
              })}
              {!list.length && <p className="text-xs text-fg3 text-center py-6">Nothing here</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminFood() {
  useDb();
  useDocumentTitle('Food · Admin');
  const { user } = useAuth();
  const { toast, confirm } = useUI();
  const [tab, setTab] = useState('orders');
  const [edit, setEdit] = useState(null);
  const fields = [
    { name: 'item_name', label: 'Item name', required: true, full: true },
    { name: 'category', label: 'Category', type: 'select', required: true, options: ['SNACKS', 'MEALS', 'DRINKS', 'DESSERTS', 'COMBOS'].map((c) => ({ value: c, label: titleCase(c) })) },
    { name: 'current_price', label: 'Price (Rs.)', type: 'number', required: true, min: 1 },
    { name: 'description', label: 'Description', type: 'textarea', rows: 2 },
    { name: 'emoji', label: 'Emoji', placeholder: '🍿', hint: 'Shown on the website menu.' },
    { name: 'availability_status', label: 'Availability', type: 'select', noBlank: true, options: [{ value: 'AVAILABLE', label: 'Available' }, { value: 'UNAVAILABLE', label: 'Sold out' }] }
  ];
  const save = (v) => {
    if (edit.food_item_id) { crud.update('food_item', edit.food_item_id, v, user.user_id); toast.success('Item updated.'); } else { crud.insert('food_item', { ...v, emoji: v.emoji || '🍽️' }, user.user_id); toast.success('Item added.'); }
  };
  const toggle = (f) => { crud.update('food_item', f.food_item_id, { availability_status: f.availability_status === 'AVAILABLE' ? 'UNAVAILABLE' : 'AVAILABLE' }, user.user_id); };
  const del = async (f) => {
    if (!(await confirm({ title: `Delete ${f.item_name}?`, message: 'Items that were ordered before cannot be deleted — mark them as sold out instead.', confirmText: 'Delete', danger: true }))) return;
    try { crud.remove('food_item', f.food_item_id, user.user_id); toast.success('Item deleted.'); } catch (e) { toast.fail(e); }
  };
  const columns = [
    { key: 'item', header: 'Item', sort: (f) => f.item_name, cell: (f) => <div className="flex items-center gap-3"><span className="text-2xl">{f.emoji}</span><div><div className="font-semibold">{f.item_name}</div><div className="text-xs text-fg3 line-clamp-1 max-w-xs">{f.description}</div></div></div> },
    { key: 'cat', header: 'Category', sort: (f) => f.category, cell: (f) => titleCase(f.category) },
    { key: 'price', header: 'Price', sort: (f) => f.current_price, cell: (f) => <span className="font-semibold">{money(f.current_price)}</span> },
    { key: 'sold', header: 'Units sold', sort: (f) => table('order_detail').filter((d) => d.food_item_id === f.food_item_id).reduce((a, d) => a + d.quantity, 0), cell: (f) => table('order_detail').filter((d) => d.food_item_id === f.food_item_id).reduce((a, d) => a + d.quantity, 0) },
    { key: 'st', header: 'Availability', sort: (f) => f.availability_status, cell: (f) => <button onClick={() => toggle(f)} title="Click to toggle"><StatusBadge status={f.availability_status} label={f.availability_status === 'AVAILABLE' ? 'Available' : 'Sold out'} /></button> },
    { key: 'act', header: '', className: 'text-right', cell: (f) => <div className="flex justify-end gap-1"><button className="btn btn-ghost btn-icon" onClick={() => setEdit(f)}><Pencil size={16} /></button><button className="btn btn-ghost btn-icon text-bad" onClick={() => del(f)}><Trash2 size={16} /></button></div> }
  ];
  return (
    <div>
      <PageHeader title="Food & orders" subtitle="Run the concession counter: fulfil pre-orders and manage the menu."
        actions={tab === 'menu' ? <button className="btn btn-primary" onClick={() => setEdit({ category: 'SNACKS', availability_status: 'AVAILABLE' })}><Plus size={16} /> Add item</button> : null} />
      <Tabs className="mb-5" value={tab} onChange={setTab} tabs={[{ value: 'orders', label: 'Order board' }, { value: 'menu', label: 'Menu', count: q.food().length }]} />
      {tab === 'orders' ? <Orders /> : <DataTable columns={columns} rows={q.food()} rowKey={(f) => f.food_item_id} searchText={(f) => `${f.item_name} ${f.category}`} exportName="menu" filters={[{ key: 'cat', label: 'All categories', options: ['SNACKS', 'MEALS', 'DRINKS', 'DESSERTS', 'COMBOS'].map((c) => ({ value: c, label: titleCase(c) })), test: (f, v) => f.category === v }]} emptyTitle="No menu items" />}
      <FormModal open={!!edit} title={edit && edit.food_item_id ? 'Edit item' : 'Add menu item'} fields={fields} initial={edit || {}} onSubmit={save} onClose={() => setEdit(null)} />
    </div>
  );
}
