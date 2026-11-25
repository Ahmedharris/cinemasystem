import { useCallback, useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { useDocumentTitle } from '../../hooks/useDb';
import { api } from '../../lib/api';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import { PageHeader, Badge, Spinner, EmptyState } from '../../components/ui/Misc';
import { dateTimeShort, titleCase } from '../../lib/format';

const TONE = { CREATE: 'ok', UPDATE: 'info', DELETE: 'bad', CANCEL: 'warn', LOGIN: 'muted', CONFIRM: 'ok', CHECK_IN: 'gold', PASSWORD_RESET: 'warn', PASSWORD_CHANGE: 'warn' };
const pretty = (s) => { if (!s) return null; try { return JSON.stringify(JSON.parse(s), null, 2); } catch { return s; } };

/** Audit trail = the MySQL table audit_log (read through GET /api/audit-logs). */
export default function AdminAudit() {
  useDocumentTitle('Audit log · Admin');
  const [open, setOpen] = useState(null);
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try { setRows((await api.get('/audit-logs')).logs); setError(''); } catch (err) { setError(err.userMessage || 'Could not load the audit log.'); }
  }, []);
  useEffect(() => { load(); }, [load]);

  if (!rows) {
    return (
      <div>
        <PageHeader title="Audit log" subtitle="Who changed what and when." />
        {error
          ? <div className="card"><EmptyState icon={WifiOff} title="Could not load the audit log" text={error} action={<button className="btn btn-primary" onClick={load}>Try again</button>} /></div>
          : <div className="flex justify-center py-20 text-fg2"><Spinner className="mr-3" /> Loading…</div>}
      </div>
    );
  }

  const who = (r) => r.user_name || (r.user_id ? `User #${r.user_id}` : 'System');
  const columns = [
    { key: 'time', header: 'When', sort: (r) => r.created_at, cell: (r) => <span className="text-fg2 text-xs whitespace-nowrap">{dateTimeShort(r.created_at)}</span> },
    { key: 'who', header: 'User', sort: who, cell: (r) => <span className="font-medium">{who(r)}</span> },
    { key: 'action', header: 'Action', sort: (r) => r.action, cell: (r) => <Badge tone={TONE[r.action] || 'muted'}>{titleCase(r.action)}</Badge> },
    { key: 'entity', header: 'Entity', sort: (r) => r.entity_name, cell: (r) => <span className="font-mono text-xs">{r.entity_name}{r.entity_id ? ` #${r.entity_id}` : ''}</span> },
    { key: 'details', header: 'Details', cell: (r) => <span className="text-xs text-fg3 max-w-xs inline-block truncate align-bottom">{r.new_value || r.old_value || '—'}</span>, csv: (r) => r.new_value || r.old_value || '' },
    { key: 'ip', header: 'IP', sort: (r) => r.ip_address || '', cell: (r) => <span className="font-mono text-xs text-fg3">{r.ip_address}</span> }
  ];
  const actions = [...new Set(rows.map((r) => r.action))];
  const entities = [...new Set(rows.map((r) => r.entity_name))];
  return (
    <div>
      <PageHeader title="Audit log" subtitle="Who changed what and when. Sign-ins of staff, password changes and every user-account change are recorded here." actions={<button className="btn btn-secondary" onClick={load}>Refresh</button>} />
      <DataTable columns={columns} rows={rows} rowKey={(r) => r.audit_id} pageSize={15} onRowClick={setOpen} exportName="audit-log" searchText={(r) => `${who(r)} ${r.action} ${r.entity_name} ${r.new_value || ''} ${r.old_value || ''}`} searchPlaceholder="Search user, entity, details…"
        filters={[{ key: 'action', label: 'All actions', options: actions.map((a) => ({ value: a, label: titleCase(a) })), test: (r, v) => r.action === v }, { key: 'entity', label: 'All entities', options: entities.map((e) => ({ value: e, label: e })), test: (r, v) => r.entity_name === v }]} />
      <Modal open={!!open} onClose={() => setOpen(null)} title={open ? `${titleCase(open.action)} · ${open.entity_name}${open.entity_id ? ` #${open.entity_id}` : ''}` : ''} subtitle={open ? `${who(open)} · ${dateTimeShort(open.created_at)} · ${open.ip_address}` : ''} size="lg">
        {open && (
          <div className="grid gap-4 md:grid-cols-2">
            <div><div className="text-xs font-bold text-fg3 uppercase tracking-wider mb-2">Before</div><pre className="rounded-xl bg-panel2 border border-line p-3 text-xs overflow-auto max-h-72 text-fg2">{pretty(open.old_value) || '—'}</pre></div>
            <div><div className="text-xs font-bold text-fg3 uppercase tracking-wider mb-2">After</div><pre className="rounded-xl bg-panel2 border border-line p-3 text-xs overflow-auto max-h-72 text-fg">{pretty(open.new_value) || '—'}</pre></div>
          </div>
        )}
      </Modal>
    </div>
  );
}
