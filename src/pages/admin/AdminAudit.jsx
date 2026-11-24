import { useState } from 'react';
import { useDb, useDocumentTitle } from '../../hooks/useDb';
import { q } from '../../lib/db';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import { PageHeader, Badge } from '../../components/ui/Misc';
import { dateTimeShort, titleCase } from '../../lib/format';

const TONE = { CREATE: 'ok', UPDATE: 'info', DELETE: 'bad', CANCEL: 'warn', LOGIN: 'muted', CONFIRM: 'ok', CHECK_IN: 'gold' };
const pretty = (s) => { if (!s) return null; try { return JSON.stringify(JSON.parse(s), null, 2); } catch { return s; } };

export default function AdminAudit() {
  useDb();
  useDocumentTitle('Audit log · Admin');
  const [open, setOpen] = useState(null);
  const rows = [...q.auditLog()].sort((a, b) => b.created_at.localeCompare(a.created_at) || b.audit_id - a.audit_id);
  const who = (r) => (r.user_id ? q.user(r.user_id)?.full_name || `User #${r.user_id}` : 'System');
  const columns = [
    { key: 'time', header: 'When', sort: (r) => r.created_at, cell: (r) => <span className="text-fg2 text-xs whitespace-nowrap">{dateTimeShort(r.created_at)}</span> },
    { key: 'who', header: 'User', sort: who, cell: (r) => <span className="font-medium">{who(r)}</span> },
    { key: 'action', header: 'Action', sort: (r) => r.action, cell: (r) => <Badge tone={TONE[r.action] || 'muted'}>{titleCase(r.action)}</Badge> },
    { key: 'entity', header: 'Entity', sort: (r) => r.entity_name, cell: (r) => <span className="font-mono text-xs">{r.entity_name}{r.entity_id ? ` #${r.entity_id}` : ''}</span> },
    { key: 'details', header: 'Details', cell: (r) => <span className="text-xs text-fg3 max-w-xs inline-block truncate align-bottom">{r.new_value || r.old_value || '—'}</span>, csv: (r) => r.new_value || r.old_value || '' },
    { key: 'ip', header: 'IP', sort: (r) => r.ip_address, cell: (r) => <span className="font-mono text-xs text-fg3">{r.ip_address}</span> }
  ];
  const actions = [...new Set(rows.map((r) => r.action))];
  const entities = [...new Set(rows.map((r) => r.entity_name))];
  return (
    <div>
      <PageHeader title="Audit log" subtitle="Who changed what and when. Every create, update, delete, cancellation and check-in is recorded." />
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
