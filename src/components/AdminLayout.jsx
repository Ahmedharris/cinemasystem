import { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Ticket, ScanLine, ListChecks, Film, CalendarClock, Building2, Popcorn, Percent, CreditCard, BarChart3, Users, ScrollText, Menu, X, ExternalLink, LogOut, ShieldAlert, MapPin, RotateCcw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { Logo } from './Navbar';
import { Avatar, EmptyState } from './ui/Misc';
import { q, resetDemoData } from '../lib/db';
import { useDb } from '../hooks/useDb';
import { titleCase } from '../lib/format';

const A = 'ADMIN', M = 'MANAGER', B = 'BOX_OFFICE';
export const NAV = [
  { group: 'Overview', items: [{ to: '/admin', label: 'Dashboard', icon: LayoutDashboard, roles: [A, M, B], end: true }] },
  { group: 'Operations', items: [
    { to: '/admin/counter', label: 'Counter sale', icon: Ticket, roles: [A, M, B] },
    { to: '/admin/checkin', label: 'Ticket check-in', icon: ScanLine, roles: [A, M, B] },
    { to: '/admin/bookings', label: 'Bookings', icon: ListChecks, roles: [A, M, B] }
  ] },
  { group: 'Catalogue', items: [
    { to: '/admin/movies', label: 'Movies', icon: Film, roles: [A, M] },
    { to: '/admin/showtimes', label: 'Showtimes', icon: CalendarClock, roles: [A, M] },
    { to: '/admin/cinemas', label: 'Cinemas & screens', icon: Building2, roles: [A] },
    { to: '/admin/food', label: 'Food & orders', icon: Popcorn, roles: [A, M] },
    { to: '/admin/promotions', label: 'Promotions', icon: Percent, roles: [A, M] }
  ] },
  { group: 'Insights', items: [
    { to: '/admin/payments', label: 'Payments', icon: CreditCard, roles: [A, M] },
    { to: '/admin/reports', label: 'Reports', icon: BarChart3, roles: [A, M] }
  ] },
  { group: 'System', items: [
    { to: '/admin/users', label: 'Users & staff', icon: Users, roles: [A] },
    { to: '/admin/audit', label: 'Audit log', icon: ScrollText, roles: [A] }
  ] }
];
const flat = NAV.flatMap((g) => g.items);

export default function AdminLayout() {
  useDb();
  const { user, isStaff, isAdmin, logout, cinemaScope } = useAuth();
  const { toast, confirm } = useUI();
  const loc = useLocation();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [loc.pathname]);

  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  if (!isStaff) return <div className="container-x py-24"><EmptyState icon={ShieldAlert} title="Staff area" text="Your account does not have access to the admin panel." action={<Link to="/" className="btn btn-primary">Back to site</Link>} /></div>;

  const current = flat.filter((i) => (i.end ? loc.pathname === i.to : loc.pathname.startsWith(i.to))).sort((a, b) => b.to.length - a.to.length)[0];
  const allowed = !current || current.roles.includes(user.role);
  const scopeName = cinemaScope ? q.cinema(cinemaScope).cinema_name : 'All cinemas';

  const reset = async () => {
    if (await confirm({ title: 'Reset demo data?', message: 'Bookings, movies and the other sample data stored in this browser go back to the original. Users and the audit log live in the database and are not affected. You will be signed out.', confirmText: 'Reset', danger: true })) { resetDemoData(); toast.success('Demo data restored.'); }
  };
  const doLogout = () => { logout(); nav('/'); };

  const sidebar = (
    <div className="h-full flex flex-col">
      <div className="h-16 px-5 flex items-center border-b border-line shrink-0"><Logo showTagline={false} /></div>
      <nav className="flex-1 overflow-y-auto p-3 space-y-5">
        {NAV.map((g) => {
          const items = g.items.filter((i) => i.roles.includes(user.role));
          if (!items.length) return null;
          return (
            <div key={g.group}>
              <div className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-[.14em] text-fg3">{g.group}</div>
              <div className="space-y-0.5">{items.map((i) => <NavLink key={i.to} to={i.to} end={i.end} className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`}><i.icon size={18} /> {i.label}</NavLink>)}</div>
            </div>
          );
        })}
      </nav>
      <div className="p-3 border-t border-line space-y-0.5 shrink-0">
        <Link to="/" className="admin-link"><ExternalLink size={17} /> View website</Link>
        {isAdmin && <button className="admin-link w-full" onClick={reset}><RotateCcw size={17} /> Reset demo data</button>}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:pl-64">
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-64 bg-panel border-r border-line z-30 no-print">{sidebar}</aside>
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 no-print">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-panel border-r border-line fade-up">{sidebar}</aside>
        </div>
      )}
      <header className="sticky top-0 z-20 h-16 glass border-b border-line px-4 sm:px-8 flex items-center gap-4 no-print">
        <button className="lg:hidden btn btn-ghost btn-icon" onClick={() => setOpen(!open)} aria-label="Menu">{open ? <X size={21} /> : <Menu size={21} />}</button>
        <div className="font-semibold hidden sm:block">{current ? current.label : 'Admin'}</div>
        <div className="ml-auto flex items-center gap-3">
          <span className="badge badge-info hidden sm:inline-flex"><MapPin size={11} /> {scopeName}</span>
          <div className="flex items-center gap-2.5">
            <div className="text-right hidden md:block leading-tight"><div className="text-sm font-semibold">{user.full_name}</div><div className="text-[11px] text-fg3">{titleCase(user.role)}</div></div>
            <Avatar name={user.full_name} size={34} />
          </div>
          <button className="btn btn-ghost btn-icon" onClick={doLogout} title="Sign out" aria-label="Sign out"><LogOut size={18} /></button>
        </div>
      </header>
      <main className="p-4 sm:p-8 max-w-[96rem]">
        {allowed ? <Outlet /> : <EmptyState icon={ShieldAlert} title="Access restricted" text={`The ${current.label} section is not available for the ${titleCase(user.role)} role.`} action={<Link to="/admin" className="btn btn-primary">Back to dashboard</Link>} />}
      </main>
    </div>
  );
}
