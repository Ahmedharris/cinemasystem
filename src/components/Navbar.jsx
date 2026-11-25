import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Clapperboard, Search, Menu, X, LogOut, User, Ticket, LayoutDashboard, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Avatar } from './ui/Misc';
import { useUI } from '../context/UIContext';

export function Logo({ className = '', showTagline = true, alwaysShowTagline = false }) {
  return (
    <Link to="/" className={`flex items-center gap-2.5 shrink-0 ${className}`}>
      <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold to-orange-500 text-[#17110a] flex items-center justify-center shadow-lg shadow-gold/20 shrink-0"><Clapperboard size={20} strokeWidth={2.4} /></span>
      <span className="flex items-baseline gap-2 min-w-0">
        <span className="font-display font-bold text-xl tracking-wide">QIS<span className="text-gold">SA</span></span>
        {showTagline && (
          <span className={`${alwaysShowTagline ? 'inline' : 'hidden sm:inline'} text-[11px] xl:text-xs font-medium text-fg2 whitespace-nowrap`}>
            — Every Story Matters.
          </span>
        )}
      </span>
    </Link>
  );
}

const LINKS = [
  { to: '/movies', label: 'Movies' },
  { to: '/cinemas', label: 'Cinemas' },
  { to: '/offers', label: 'Offers' },
  { to: '/menu', label: 'Food & Drinks' },
  { to: '/help', label: 'Support' }
];

export default function Navbar() {
  const { user, isStaff, logout } = useAuth();
  const { toast } = useUI();
  const nav = useNavigate();
  const loc = useLocation();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef(null);

  useEffect(() => { setOpen(false); setMenu(false); }, [loc.pathname]);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setMenu(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const search = (e) => { e.preventDefault(); nav(`/movies${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ''}`); setQuery(''); setOpen(false); };
  const doLogout = () => { logout(); toast.info('You have been signed out.'); nav('/'); };

  const linkCls = ({ isActive }) => `px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${isActive ? 'text-gold bg-gold/10' : 'text-fg2 hover:text-fg hover:bg-panel2'}`;

  return (
    <header className="sticky top-0 z-50 glass border-b border-line no-print">
      <div className="container-x h-16 flex items-center gap-4">
        <Logo />
        <nav className="hidden lg:flex items-center gap-1 ml-3 xl:ml-6">
          {LINKS.map((l) => <NavLink key={l.to} to={l.to} className={linkCls}>{l.label}</NavLink>)}
        </nav>
        <div className="flex-1" />
        <form onSubmit={search} className="relative hidden md:block">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg3" />
          <input className="input input-sm pl-9 w-40 xl:w-52 focus:w-64 xl:focus:w-72 transition-all" placeholder="Search movies…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search movies" />
        </form>
        {user ? (
          <div className="relative" ref={ref}>
            <button className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-panel2 transition-colors" onClick={() => setMenu(!menu)} aria-haspopup="menu" aria-expanded={menu}>
              <Avatar name={user.full_name} size={32} />
              <span className="hidden sm:block text-sm font-semibold max-w-[8rem] truncate">{user.full_name.split(' ')[0]}</span>
              <ChevronDown size={14} className="text-fg3" />
            </button>
            {menu && (
              <div className="absolute right-0 mt-2 w-60 card p-2 shadow-2xl fade-up" role="menu">
                <div className="px-3 py-2 border-b border-line mb-1">
                  <div className="font-semibold text-sm truncate">{user.full_name}</div>
                  <div className="text-xs text-fg3 truncate">{user.email}</div>
                  {isStaff && <div className="badge badge-gold mt-1.5">{user.role.replace('_', ' ')}</div>}
                </div>
                {isStaff && <Link to="/admin" className="admin-link"><LayoutDashboard size={17} /> Admin panel</Link>}
                <Link to="/my-bookings" className="admin-link"><Ticket size={17} /> My bookings</Link>
                <Link to="/profile" className="admin-link"><User size={17} /> My profile</Link>
                <button className="admin-link w-full text-bad hover:!text-bad" onClick={doLogout}><LogOut size={17} /> Sign out</button>
              </div>
            )}
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-2">
            <Link to="/login" className="btn btn-ghost btn-sm">Sign in</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Sign up</Link>
          </div>
        )}
        <button className="lg:hidden btn btn-ghost btn-icon" onClick={() => setOpen(!open)} aria-label="Menu">{open ? <X size={22} /> : <Menu size={22} />}</button>
      </div>
      {open && (
        <div className="lg:hidden border-t border-line bg-panel fade-up">
          <div className="container-x py-4 space-y-1">
            <form onSubmit={search} className="relative mb-3">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg3" />
              <input className="input pl-9" placeholder="Search movies…" value={query} onChange={(e) => setQuery(e.target.value)} />
            </form>
            {LINKS.map((l) => <NavLink key={l.to} to={l.to} className={({ isActive }) => `block ${linkCls({ isActive })}`}>{l.label}</NavLink>)}
            {!user && (
              <div className="flex gap-2 pt-3">
                <Link to="/login" className="btn btn-outline flex-1">Sign in</Link>
                <Link to="/register" className="btn btn-primary flex-1">Sign up</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
