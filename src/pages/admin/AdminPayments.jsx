import { Wallet, Undo2, TrendingUp, AlertTriangle } from 'lucide-react';
import { useDb, useDocumentTitle } from '../../hooks/useDb';
import { useAuth } from '../../context/AuthContext';
import { q, table } from '../../lib/db';
import { netPayments } from '../../lib/analytics';
import DataTable from '../../components/ui/DataTable';
import { PageHeader, StatCard, StatusBadge, Badge } from '../../components/ui/Misc';
import { money, dateTimeShort, titleCase } from '../../lib/format';

export default function AdminPayments() {
  useDb();
  useDocumentTitle('Payments · Admin');
  const { cinemaScope: scope } = useAuth();
  const t = netPayments({ cinemaId: scope });
  const rows = [...table('payment')].filter((p) => !scope || q.screen(q.showtime(q.booking(p.booking_id).showtime_id).screen_id).cinema_id === scope).sort((a, b) => b.created_at.localeCompare(a.created_at));
  const cust = (p) => { const b = q.booking(p.booking_id); return b.user_id ? q.user(b.user_id).full_name : `Guest ${b.guest_phone}`; };
  const ref = (p) => q.booking(p.booking_id).booking_reference;

  const columns = [
    { key: 'id', header: '#', sort: (p) => p.payment_id, cell: (p) => <span className="text-fg3">{p.payment_id}</span> },
    { key: 'time', header: 'Date', sort: (p) => p.created_at, cell: (p) => <span className="text-xs text-fg2">{dateTimeShort(p.created_at)}</span> },
    { key: 'ref', header: 'Booking', sort: ref, cell: (p) => <span className="font-semibold tracking-wider">{ref(p)}</span> },
    { key: 'cust', header: 'Customer', sort: cust },
    { key: 'type', header: 'Type', sort: (p) => p.payment_type, cell: (p) => <Badge tone={p.payment_type === 'REFUND' ? 'info' : 'ok'}>{titleCase(p.payment_type)}</Badge> },
    { key: 'method', header: 'Method', sort: (p) => p.payment_method, cell: (p) => titleCase(p.payment_method) },
    { key: 'amount', header: 'Amount', sort: (p) => p.amount, cell: (p) => <span className={`font-semibold ${p.payment_type === 'REFUND' ? 'text-info' : ''}`}>{p.payment_type === 'REFUND' ? '− ' : ''}{money(p.amount)}</span>, csv: (p) => (p.payment_type === 'REFUND' ? -p.amount : p.amount) },
    { key: 'status', header: 'Status', sort: (p) => p.payment_status, cell: (p) => <StatusBadge status={p.payment_status} /> },
    { key: 'txn', header: 'Transaction', sort: (p) => p.transaction_reference || '', cell: (p) => <span className="font-mono text-xs text-fg2">{p.transaction_reference || '—'}</span> },
    { key: 'by', header: 'Processed by', sort: (p) => (p.processed_by_user_id ? q.user(p.processed_by_user_id).full_name : ''), cell: (p) => (p.processed_by_user_id ? q.user(p.processed_by_user_id).full_name : <span className="text-fg3">Online</span>) }
  ];
  return (
    <div>
      <PageHeader title="Payments" subtitle="Every payment attempt and refund. Failed attempts are kept for auditing." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <StatCard icon={Wallet} label="Collected" value={money(t.gross)} hint={`${t.count} successful payments`} />
        <StatCard icon={Undo2} label="Refunded" value={money(t.refunds)} tone="info" />
        <StatCard icon={TrendingUp} label="Net revenue" value={money(t.net)} tone="ok" />
        <StatCard icon={AlertTriangle} label="Failed attempts" value={t.failed} tone="bad" hint="Declined or abandoned" />
      </div>
      <DataTable columns={columns} rows={rows} rowKey={(p) => p.payment_id} pageSize={12} exportName="payments" searchText={(p) => `${ref(p)} ${cust(p)} ${p.transaction_reference || ''}`} searchPlaceholder="Search booking, customer, transaction…"
        filters={[
          { key: 'type', label: 'All types', options: [{ value: 'PAYMENT', label: 'Payments' }, { value: 'REFUND', label: 'Refunds' }], test: (p, v) => p.payment_type === v },
          { key: 'method', label: 'All methods', options: ['CARD', 'EASYPAISA', 'JAZZCASH', 'CASH'].map((m) => ({ value: m, label: titleCase(m) })), test: (p, v) => p.payment_method === v },
          { key: 'status', label: 'All statuses', options: ['SUCCESS', 'FAILED'].map((m) => ({ value: m, label: titleCase(m) })), test: (p, v) => p.payment_status === v }
        ]} />
    </div>
  );
}
