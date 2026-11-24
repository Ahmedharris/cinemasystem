import { useState } from 'react';
import { Plus, Pencil, UserX, UserCheck, KeyRound } from 'lucide-react';
import { useDb, useDocumentTitle } from '../../hooks/useDb';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { q, crud } from '../../lib/db';
import DataTable from '../../components/ui/DataTable';
import { FormModal } from '../../components/ui/Form';
import { PageHeader, StatusBadge, Avatar, Badge, StatCard } from '../../components/ui/Misc';
import { Users, ShieldCheck, UserCog } from 'lucide-react';
import { dateMed, titleCase, timeAgo } from '../../lib/format';

const ROLES = ['CUSTOMER', 'ADMIN', 'MANAGER', 'BOX_OFFICE'];

export default function AdminUsers() {
  useDb();
  useDocumentTitle('Users · Admin');
  const { user: me } = useAuth();
  const { toast, confirm } = useUI();
  const [edit, setEdit] = useState(null);
  const rows = q.users();
  const isNew = edit && !edit.user_id;

  const fields = [
    { name: 'full_name', label: 'Full name', required: true, full: true },
    { name: 'email', label: 'Email', type: 'email', required: true, validate: (v) => (q.users().some((u) => u.email.toLowerCase() === (v || '').toLowerCase() && u.user_id !== (edit && edit.user_id)) ? 'This email is already registered.' : undefined) },
    { name: 'phone', label: 'Phone' },
    { name: 'role', label: 'Role', type: 'select', required: true, noBlank: true, options: ROLES.map((r) => ({ value: r, label: titleCase(r) })) },
    { name: 'cinema_id', label: 'Cinema (branch)', type: 'select', numeric: true, hidden: (v) => !['MANAGER', 'BOX_OFFICE'].includes(v.role), required: true, hint: 'Branch staff only see data for their own cinema.', options: q.cinemas().map((c) => ({ value: c.cinema_id, label: c.cinema_name })) },
    ...(isNew ? [{ name: 'password', label: 'Initial password', type: 'password', required: true, validate: (v) => (v.length < 6 ? 'At least 6 characters.' : undefined) }] : []),
    { name: 'account_status', label: 'Account status', type: 'select', noBlank: true, options: [{ value: 'ACTIVE', label: 'Active' }, { value: 'SUSPENDED', label: 'Suspended' }] }
  ];
  const save = (v) => {
    const row = { ...v, phone: v.phone || null, cinema_id: ['MANAGER', 'BOX_OFFICE'].includes(v.role) ? v.cinema_id : null };
    if (edit.user_id) {
      if (edit.user_id === me.user_id && (v.role !== me.role || v.account_status !== 'ACTIVE')) throw Object.assign(new Error('You cannot change your own role or suspend yourself.'), { userMessage: 'You cannot change your own role or suspend yourself.' });
      crud.update('user_account', edit.user_id, row, me.user_id); toast.success('User updated.');
    } else {
      const { password, ...rest } = row;
      crud.insert('user_account', { ...rest, password_hash: `$demo$${password}`, created_at: new Date().toISOString().slice(0, 19).replace('T', ' '), last_login_at: null }, me.user_id);
      toast.success('User created.');
    }
  };
  const toggle = async (u) => {
    if (u.user_id === me.user_id) { toast.error('You cannot suspend your own account.'); return; }
    const suspend = u.account_status === 'ACTIVE';
    if (suspend && !(await confirm({ title: `Suspend ${u.full_name}?`, message: 'They will no longer be able to sign in. Existing bookings stay valid.', confirmText: 'Suspend', danger: true }))) return;
    crud.update('user_account', u.user_id, { account_status: suspend ? 'SUSPENDED' : 'ACTIVE' }, me.user_id);
    toast.success(suspend ? 'Account suspended.' : 'Account re-activated.');
  };
  const reset = async (u) => {
    if (!(await confirm({ title: `Reset password for ${u.full_name}?`, message: 'The password will be set to demo1234 (demo only — in production an email reset link is sent).', confirmText: 'Reset password' }))) return;
    crud.update('user_account', u.user_id, { password_hash: '$demo$demo1234' }, me.user_id);
    toast.success('Password reset to demo1234.');
  };

  const columns = [
    { key: 'name', header: 'User', sort: (u) => u.full_name, cell: (u) => <div className="flex items-center gap-3"><Avatar name={u.full_name} size={34} /><div><div className="font-semibold">{u.full_name}{u.user_id === me.user_id && <span className="text-fg3 font-normal"> (you)</span>}</div><div className="text-xs text-fg3">{u.email}</div></div></div> },
    { key: 'role', header: 'Role', sort: (u) => u.role, cell: (u) => <Badge tone={u.role === 'CUSTOMER' ? 'muted' : u.role === 'ADMIN' ? 'gold' : 'info'}>{titleCase(u.role)}</Badge> },
    { key: 'cinema', header: 'Branch', sort: (u) => (u.cinema_id ? q.cinema(u.cinema_id).cinema_name : ''), cell: (u) => (u.cinema_id ? q.cinema(u.cinema_id).cinema_name : <span className="text-fg3">—</span>) },
    { key: 'phone', header: 'Phone', sort: (u) => u.phone || '', cell: (u) => u.phone || <span className="text-fg3">—</span> },
    { key: 'bookings', header: 'Bookings', sort: (u) => q.bookingsOfUser(u.user_id).length, cell: (u) => q.bookingsOfUser(u.user_id).length },
    { key: 'joined', header: 'Joined', sort: (u) => u.created_at, cell: (u) => <span className="text-fg2 text-xs">{dateMed(u.created_at)}</span> },
    { key: 'login', header: 'Last login', sort: (u) => u.last_login_at || '', cell: (u) => <span className="text-fg2 text-xs">{u.last_login_at ? timeAgo(u.last_login_at) : 'Never'}</span> },
    { key: 'status', header: 'Status', sort: (u) => u.account_status, cell: (u) => <StatusBadge status={u.account_status} /> },
    { key: 'act', header: '', className: 'text-right whitespace-nowrap', cell: (u) => (
      <div className="flex justify-end gap-1">
        <button className="btn btn-ghost btn-icon" title="Edit" onClick={() => setEdit(u)}><Pencil size={16} /></button>
        <button className="btn btn-ghost btn-icon" title="Reset password" onClick={() => reset(u)}><KeyRound size={16} /></button>
        <button className={`btn btn-ghost btn-icon ${u.account_status === 'ACTIVE' ? 'text-bad' : 'text-ok'}`} title={u.account_status === 'ACTIVE' ? 'Suspend' : 'Re-activate'} onClick={() => toggle(u)}>{u.account_status === 'ACTIVE' ? <UserX size={16} /> : <UserCheck size={16} />}</button>
      </div>) }
  ];
  return (
    <div>
      <PageHeader title="Users & staff" subtitle="Customer accounts and staff roles. Managers and box-office staff are limited to one cinema." actions={<button className="btn btn-primary" onClick={() => setEdit({ role: 'BOX_OFFICE', account_status: 'ACTIVE' })}><Plus size={16} /> Add user</button>} />
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <StatCard icon={Users} label="Customers" value={rows.filter((u) => u.role === 'CUSTOMER').length} />
        <StatCard icon={UserCog} label="Staff" value={rows.filter((u) => u.role !== 'CUSTOMER').length} tone="info" />
        <StatCard icon={ShieldCheck} label="Suspended" value={rows.filter((u) => u.account_status === 'SUSPENDED').length} tone="bad" />
      </div>
      <DataTable columns={columns} rows={rows} rowKey={(u) => u.user_id} searchText={(u) => `${u.full_name} ${u.email} ${u.phone || ''}`} searchPlaceholder="Search name, email, phone…" exportName="users"
        filters={[{ key: 'role', label: 'All roles', options: ROLES.map((r) => ({ value: r, label: titleCase(r) })), test: (u, v) => u.role === v }, { key: 'status', label: 'All statuses', options: [{ value: 'ACTIVE', label: 'Active' }, { value: 'SUSPENDED', label: 'Suspended' }], test: (u, v) => u.account_status === v }]} />
      <FormModal open={!!edit} title={isNew ? 'Add user' : 'Edit user'} fields={fields} initial={edit || {}} onSubmit={save} onClose={() => setEdit(null)} />
    </div>
  );
}
