import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, Ticket, Star, Wallet } from 'lucide-react';
import { useDb, useDocumentTitle } from '../hooks/useDb';
import { q } from '../lib/db';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { Avatar, EmptyState, PageHeader, StatusBadge } from '../components/ui/Misc';
import { Field } from '../components/ui/Form';
import { dateMed, money, titleCase } from '../lib/format';

export default function Profile() {
  useDb();
  useDocumentTitle('My profile');
  const { user, updateProfile, changePassword } = useAuth();
  const { toast } = useUI();
  const [form, setForm] = useState({ full_name: user ? user.full_name : '', phone: user && user.phone ? user.phone : '' });
  const [pw, setPw] = useState({ cur: '', next: '', again: '' });
  const [errs, setErrs] = useState({});
  if (!user) return <div className="container-x py-20"><EmptyState icon={Lock} title="Sign in to manage your profile" action={<Link to="/login" state={{ from: '/profile' }} className="btn btn-primary">Sign in</Link>} /></div>;

  const mine = q.bookingsOfUser(user.user_id).filter((b) => b.booking_status === 'CONFIRMED');
  const spent = mine.reduce((a, b) => a + b.total_amount, 0);
  const reviews = q.movies().reduce((n, m) => n + q.reviewsOf(m.movie_id).filter((r) => r.user_id === user.user_id).length, 0);

  const saveProfile = (e) => {
    e.preventDefault();
    const er = {};
    if (form.full_name.trim().length < 3) er.full_name = 'Please enter your full name.';
    if (form.phone && !/^[0-9+\-\s]{7,15}$/.test(form.phone)) er.phone = 'Enter a valid phone number.';
    setErrs(er);
    if (Object.keys(er).length) return;
    updateProfile(form);
    toast.success('Profile updated.');
  };
  const savePw = (e) => {
    e.preventDefault();
    const er = {};
    if (pw.next.length < 6) er.next = 'At least 6 characters.';
    if (pw.next !== pw.again) er.again = 'Passwords do not match.';
    setErrs(er);
    if (Object.keys(er).length) return;
    try { changePassword(pw.cur, pw.next); setPw({ cur: '', next: '', again: '' }); toast.success('Password changed.'); } catch (err) { setErrs({ cur: err.userMessage }); }
  };

  return (
    <div className="container-x py-10 max-w-5xl">
      <PageHeader eyebrow="Account" title="My profile" />
      <div className="grid gap-6 lg:grid-cols-[18rem_1fr] items-start">
        <div className="card card-pad text-center">
          <div className="flex justify-center"><Avatar name={user.full_name} size={84} /></div>
          <h2 className="text-lg font-bold mt-4">{user.full_name}</h2>
          <div className="text-sm text-fg2">{user.email}</div>
          <div className="mt-2 flex justify-center gap-2"><span className="badge badge-gold">{titleCase(user.role)}</span><StatusBadge status={user.account_status} /></div>
          <div className="text-xs text-fg3 mt-3">Member since {dateMed(user.created_at)}</div>
          <div className="grid grid-cols-3 gap-2 mt-6 pt-5 border-t border-line">
            <div><Ticket size={16} className="mx-auto text-gold mb-1" /><div className="font-bold">{mine.length}</div><div className="text-[11px] text-fg3">Bookings</div></div>
            <div><Wallet size={16} className="mx-auto text-gold mb-1" /><div className="font-bold text-sm leading-6">{money(spent).replace('Rs. ', '')}</div><div className="text-[11px] text-fg3">Spent (Rs.)</div></div>
            <div><Star size={16} className="mx-auto text-gold mb-1" /><div className="font-bold">{reviews}</div><div className="text-[11px] text-fg3">Reviews</div></div>
          </div>
        </div>
        <div className="space-y-6">
          <form onSubmit={saveProfile} className="card card-pad space-y-4">
            <h3 className="font-semibold">Personal details</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Full name" error={errs.full_name}><input className={`input ${errs.full_name ? 'input-error' : ''}`} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></Field>
              <Field label="Phone" error={errs.phone}><input className={`input ${errs.phone ? 'input-error' : ''}`} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="0300-1234567" /></Field>
              <Field label="Email" hint="Email cannot be changed."><input className="input" value={user.email} disabled /></Field>
            </div>
            <button className="btn btn-primary">Save changes</button>
          </form>
          <form onSubmit={savePw} className="card card-pad space-y-4">
            <h3 className="font-semibold">Change password</h3>
            <div className="grid sm:grid-cols-3 gap-4">
              <Field label="Current password" error={errs.cur}><input type="password" className={`input ${errs.cur ? 'input-error' : ''}`} value={pw.cur} onChange={(e) => setPw({ ...pw, cur: e.target.value })} autoComplete="current-password" /></Field>
              <Field label="New password" error={errs.next}><input type="password" className={`input ${errs.next ? 'input-error' : ''}`} value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} autoComplete="new-password" /></Field>
              <Field label="Repeat new password" error={errs.again}><input type="password" className={`input ${errs.again ? 'input-error' : ''}`} value={pw.again} onChange={(e) => setPw({ ...pw, again: e.target.value })} autoComplete="new-password" /></Field>
            </div>
            <button className="btn btn-secondary" disabled={!pw.cur || !pw.next}>Update password</button>
          </form>
        </div>
      </div>
    </div>
  );
}
