import { useState } from 'react';
import { Plus, Pencil, Trash2, Pause, Play } from 'lucide-react';
import { useDb, useDocumentTitle } from '../../hooks/useDb';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { q, crud, promoStatus, promoUsage } from '../../lib/db';
import DataTable from '../../components/ui/DataTable';
import { FormModal } from '../../components/ui/Form';
import { PageHeader, StatusBadge, StatCard } from '../../components/ui/Misc';
import { promoReport } from '../../lib/analytics';
import { Percent, Tag, Wallet } from 'lucide-react';
import { money, dateMed, titleCase } from '../../lib/format';

export default function AdminPromotions() {
  useDb();
  useDocumentTitle('Promotions · Admin');
  const { user } = useAuth();
  const { toast, confirm } = useUI();
  const [edit, setEdit] = useState(null);
  const rows = q.promotions();
  const report = promoReport();
  const used = report.reduce((a, r) => a + r.uses, 0);
  const given = report.reduce((a, r) => a + r.discount, 0);

  const fields = [
    { name: 'promo_code', label: 'Promo code', required: true, placeholder: 'SUMMER20', hint: 'Letters and numbers only.', validate: (v) => (!/^[A-Za-z0-9]{3,20}$/.test(v || '') ? 'Use 3–20 letters or numbers.' : (q.promotions().some((p) => p.promo_code.toLowerCase() === v.toLowerCase() && p.promotion_id !== (edit && edit.promotion_id)) ? 'This code already exists.' : undefined)) },
    { name: 'discount_type', label: 'Discount type', type: 'select', required: true, noBlank: true, options: [{ value: 'PERCENT', label: 'Percentage (%)' }, { value: 'FLAT', label: 'Flat amount (Rs.)' }] },
    { name: 'description', label: 'Description', required: true, full: true, placeholder: 'Shown to customers' },
    { name: 'discount_value', label: 'Discount value', type: 'number', required: true, min: 1, validate: (v, all) => (all.discount_type === 'PERCENT' && v > 100 ? 'A percentage cannot exceed 100.' : undefined) },
    { name: 'max_discount', label: 'Maximum discount (Rs.)', type: 'number', min: 1, hint: 'Optional cap for percentage offers.', hidden: (v) => v.discount_type !== 'PERCENT' },
    { name: 'min_order_amount', label: 'Minimum order (Rs.)', type: 'number', required: true, min: 0 },
    { name: 'usage_limit_total', label: 'Total usage limit', type: 'number', min: 1, hint: 'Leave empty for unlimited.' },
    { name: 'valid_from', label: 'Valid from', type: 'date', required: true },
    { name: 'valid_to', label: 'Valid until', type: 'date', required: true, validate: (v, all) => (v < all.valid_from ? 'Must be after the start date.' : undefined) },
    { name: 'is_active', type: 'checkbox', checkLabel: 'Promotion is active', label: 'Active' }
  ];
  const save = (v) => {
    const row = { ...v, promo_code: v.promo_code.toUpperCase(), max_discount: v.discount_type === 'PERCENT' ? v.max_discount : null, valid_from: `${v.valid_from} 00:00:00`, valid_to: `${v.valid_to} 23:59:59`, is_active: v.is_active ? 1 : 0 };
    if (edit.promotion_id) { crud.update('promotion', edit.promotion_id, row, user.user_id); toast.success('Promotion updated.'); } else { crud.insert('promotion', row, user.user_id); toast.success('Promotion created.'); }
  };
  const open = (p) => setEdit(p ? { ...p, valid_from: p.valid_from.slice(0, 10), valid_to: p.valid_to.slice(0, 10), is_active: !!p.is_active } : { discount_type: 'PERCENT', is_active: true, min_order_amount: 0, valid_from: new Date().toISOString().slice(0, 10) });
  const toggle = (p) => { crud.update('promotion', p.promotion_id, { is_active: p.is_active ? 0 : 1 }, user.user_id); toast.success(p.is_active ? `${p.promo_code} paused.` : `${p.promo_code} activated.`); };
  const del = async (p) => {
    if (!(await confirm({ title: `Delete ${p.promo_code}?`, message: 'Codes that were used in a booking cannot be deleted — pause them instead.', confirmText: 'Delete', danger: true }))) return;
    try { crud.remove('promotion', p.promotion_id, user.user_id); toast.success('Promotion deleted.'); } catch (e) { toast.fail(e); }
  };

  const columns = [
    { key: 'code', header: 'Code', sort: (p) => p.promo_code, cell: (p) => <div><span className="font-mono font-bold tracking-widest text-gold">{p.promo_code}</span><div className="text-xs text-fg3 max-w-[18rem] truncate">{p.description}</div></div> },
    { key: 'disc', header: 'Discount', sort: (p) => p.discount_value, cell: (p) => <span className="font-semibold">{p.discount_type === 'PERCENT' ? `${p.discount_value}%` : money(p.discount_value)}{p.max_discount != null && <span className="text-xs text-fg3 font-normal"> (max {money(p.max_discount)})</span>}</span>, csv: (p) => (p.discount_type === 'PERCENT' ? `${p.discount_value}%` : p.discount_value) },
    { key: 'min', header: 'Min order', sort: (p) => p.min_order_amount, cell: (p) => money(p.min_order_amount) },
    { key: 'valid', header: 'Valid', sort: (p) => p.valid_from, cell: (p) => <span className="text-xs text-fg2">{dateMed(p.valid_from)} → {dateMed(p.valid_to)}</span>, csv: (p) => `${p.valid_from} - ${p.valid_to}` },
    { key: 'use', header: 'Used', sort: (p) => promoUsage(p.promotion_id), cell: (p) => <span>{promoUsage(p.promotion_id)}{p.usage_limit_total != null ? <span className="text-fg3"> / {p.usage_limit_total}</span> : <span className="text-fg3"> / ∞</span>}</span>, csv: (p) => promoUsage(p.promotion_id) },
    { key: 'status', header: 'Status', sort: (p) => promoStatus(p), cell: (p) => <StatusBadge status={promoStatus(p)} /> },
    { key: 'act', header: '', className: 'text-right whitespace-nowrap', cell: (p) => <div className="flex justify-end gap-1"><button className="btn btn-ghost btn-icon" title={p.is_active ? 'Pause' : 'Activate'} onClick={() => toggle(p)}>{p.is_active ? <Pause size={16} /> : <Play size={16} />}</button><button className="btn btn-ghost btn-icon" onClick={() => open(p)}><Pencil size={16} /></button><button className="btn btn-ghost btn-icon text-bad" onClick={() => del(p)}><Trash2 size={16} /></button></div> }
  ];
  return (
    <div>
      <PageHeader title="Promotions" subtitle="Create promo codes with value caps, minimum orders, validity dates and usage limits." actions={<button className="btn btn-primary" onClick={() => open(null)}><Plus size={16} /> New promotion</button>} />
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <StatCard icon={Tag} label="Active codes" value={rows.filter((p) => promoStatus(p) === 'ACTIVE').length} hint={`${rows.length} in total`} />
        <StatCard icon={Percent} label="Redemptions" value={used} tone="info" hint="Confirmed bookings" />
        <StatCard icon={Wallet} label="Discount given" value={money(given)} tone="warn" />
      </div>
      <DataTable columns={columns} rows={rows} rowKey={(p) => p.promotion_id} searchText={(p) => `${p.promo_code} ${p.description}`} exportName="promotions"
        filters={[{ key: 'status', label: 'All statuses', options: ['ACTIVE', 'PAUSED', 'EXPIRED', 'SCHEDULED', 'EXHAUSTED'].map((s) => ({ value: s, label: titleCase(s) })), test: (p, v) => promoStatus(p) === v }]} />
      <FormModal open={!!edit} title={edit && edit.promotion_id ? 'Edit promotion' : 'New promotion'} size="lg" fields={fields} initial={edit || {}} onSubmit={save} onClose={() => setEdit(null)} />
    </div>
  );
}
