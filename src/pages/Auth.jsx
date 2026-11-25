import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Phone, CheckCircle2, Shield, Briefcase, Ticket as TicketIcon, Users, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { useDocumentTitle } from '../hooks/useDb';
import { Logo } from '../components/Navbar';
import { Field } from '../components/ui/Form';
import { Spinner } from '../components/ui/Misc';
import Poster from '../components/Poster';
import { q } from '../lib/db';

function Shell({ title, subtitle, children, footer }) {
  const movies = q.movies().filter((m) => m.movie_status === 'NOW_SHOWING').slice(0, 6);
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex relative overflow-hidden flex-col justify-between p-12 bg-gradient-to-br from-[#1c1608] via-panel to-ink border-r border-line">
        <div className="hero-glow" />
        <Logo className="relative" alwaysShowTagline />
        <div className="relative">
          <div className="grid grid-cols-3 gap-3 -rotate-6 scale-105 opacity-90 mb-12 w-[88%]">
            {movies.map((m) => <Poster key={m.movie_id} movie={m} showTitle={false} className="!rounded-xl shadow-2xl" />)}
          </div>
          <h2 className="text-4xl font-bold leading-tight">Your seat is waiting.</h2>
          <p className="text-fg2 mt-3 max-w-sm">Pick your seats, pre-order snacks and walk straight in with a QR ticket.</p>
        </div>
        <div className="relative text-xs text-fg3">© QISSA — Every Story Matters. · Cinema Management & Online Ticket Booking</div>
      </div>
      <div className="flex flex-col justify-center px-5 py-10 sm:px-12">
        <div className="w-full max-w-md mx-auto">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-fg2 hover:text-gold mb-8"><ArrowLeft size={15} /> Back to site</Link>
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="text-fg2 mt-2 mb-8">{subtitle}</p>
          {children}
          {footer && <div className="mt-8 text-sm text-fg2 text-center">{footer}</div>}
        </div>
      </div>
    </div>
  );
}

const DEMOS = [
  { email: 'ali.raza@example.com', label: 'Customer', name: 'Ali Raza', icon: Users },
  { email: 'admin@qissa.pk', label: 'Admin', name: 'System Admin', icon: Shield },
  { email: 'manager.lahore@qissa.pk', label: 'Manager · Lahore', name: 'Nadia Hussain', icon: Briefcase },
  { email: 'boxoffice.lahore@qissa.pk', label: 'Box office · Lahore', name: 'Bilal Sheikh', icon: TicketIcon }
];

export default function Login() {
  useDocumentTitle('Sign in');
  const { login } = useAuth();
  const { toast } = useUI();
  const nav = useNavigate();
  const loc = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const go = (u) => {
    toast.success(`Welcome back, ${u.full_name.split(' ')[0]}!`);
    const from = loc.state && loc.state.from;
    if (from) nav(from, { replace: true, state: { seats: loc.state.seats } });
    else nav(u.role === 'CUSTOMER' ? '/' : '/admin', { replace: true });
  };
  const submit = (e, creds) => {
    if (e) e.preventDefault();
    const em = creds ? creds.email : email, pw = creds ? creds.password : password;
    setError('');
    if (!em || !pw) { setError('Enter your email and password.'); return; }
    setBusy(true);
    setTimeout(() => {
      try { go(login(em, pw)); } catch (err) { setError(err.userMessage); setBusy(false); }
    }, 350);
  };

  return (
    <Shell title="Welcome back" subtitle="Sign in to book tickets and manage your bookings." footer={<>New to QISSA? <Link to="/register" state={loc.state} className="text-gold font-semibold">Create an account</Link></>}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        {error && <div className="rounded-xl border border-bad/30 bg-bad/10 text-bad text-sm px-4 py-2.5">{error}</div>}
        <Field label="Email">
          <div className="relative"><Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fg3" /><input className="input pl-10" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="username" autoFocus /></div>
        </Field>
        <Field label="Password">
          <div className="relative"><Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fg3" />
            <input className="input pl-10 pr-11" type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-fg3 hover:text-fg" onClick={() => setShow(!show)} aria-label="Show password">{show ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>
        </Field>
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-fg2 cursor-pointer"><input type="checkbox" defaultChecked /> Remember me</label>
          <Link to="/forgot-password" className="text-gold font-semibold">Forgot password?</Link>
        </div>
        <button className="btn btn-primary btn-lg btn-block" disabled={busy}>{busy ? <Spinner /> : null} Sign in</button>
      </form>

      <div className="mt-8 rounded-2xl border border-dashed border-line2 p-4 bg-panel/60">
        <div className="text-xs font-bold text-fg2 uppercase tracking-wider mb-3">Demo accounts <span className="text-fg3 normal-case font-medium">· password: demo1234</span></div>
        <div className="grid grid-cols-2 gap-2">
          {DEMOS.map((d) => (
            <button key={d.email} type="button" className="flex items-center gap-2.5 rounded-xl border border-line bg-panel2 hover:border-gold/60 p-2.5 text-left transition-colors" onClick={() => submit(null, { email: d.email, password: 'demo1234' })}>
              <span className="w-8 h-8 rounded-lg bg-gold/12 text-gold flex items-center justify-center shrink-0" style={{ background: 'rgba(245,184,46,.12)' }}><d.icon size={16} /></span>
              <span className="min-w-0"><span className="block text-sm font-semibold leading-tight">{d.label}</span><span className="block text-[11px] text-fg3 truncate">{d.name}</span></span>
            </button>
          ))}
        </div>
      </div>
    </Shell>
  );
}

export function Register() {
  useDocumentTitle('Create account');
  const { register } = useAuth();
  const { toast } = useUI();
  const nav = useNavigate();
  const loc = useLocation();
  const [f, setF] = useState({ full_name: '', email: '', phone: '', password: '', again: '', agree: false });
  const [errs, setErrs] = useState({});
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const submit = (e) => {
    e.preventDefault();
    const er = {};
    if (f.full_name.trim().length < 3) er.full_name = 'Please enter your full name.';
    if (!/^\S+@\S+\.\S+$/.test(f.email)) er.email = 'Enter a valid email address.';
    if (f.phone && !/^[0-9+\-\s]{7,15}$/.test(f.phone)) er.phone = 'Enter a valid phone number.';
    if (f.password.length < 6) er.password = 'Use at least 6 characters.';
    if (f.password !== f.again) er.again = 'Passwords do not match.';
    if (!f.agree) er.agree = 'Please accept the terms.';
    setErrs(er);
    if (Object.keys(er).length) return;
    try {
      const u = register({ full_name: f.full_name, email: f.email, phone: f.phone, password: f.password });
      toast.success(`Welcome to QISSA, ${u.full_name.split(' ')[0]}!`);
      const from = loc.state && loc.state.from;
      nav(from || '/', { replace: true, state: from ? { seats: loc.state.seats } : undefined });
    } catch (err) { setErrs({ email: err.userMessage }); }
  };
  const bar = Math.min(4, (f.password.length >= 6) + (f.password.length >= 10) + /[A-Z]/.test(f.password) + /\d/.test(f.password) + /[^A-Za-z0-9]/.test(f.password));

  return (
    <Shell title="Create your account" subtitle="Join QISSA to book seats, track tickets and write reviews." footer={<>Already have an account? <Link to="/login" state={loc.state} className="text-gold font-semibold">Sign in</Link></>}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Full name" error={errs.full_name}><div className="relative"><User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fg3" /><input className={`input pl-10 ${errs.full_name ? 'input-error' : ''}`} value={f.full_name} onChange={set('full_name')} autoComplete="name" /></div></Field>
        <Field label="Email" error={errs.email}><div className="relative"><Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fg3" /><input className={`input pl-10 ${errs.email ? 'input-error' : ''}`} type="email" value={f.email} onChange={set('email')} autoComplete="email" /></div></Field>
        <Field label="Phone (optional)" error={errs.phone}><div className="relative"><Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fg3" /><input className={`input pl-10 ${errs.phone ? 'input-error' : ''}`} value={f.phone} onChange={set('phone')} placeholder="0300-1234567" autoComplete="tel" /></div></Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Password" error={errs.password}><input className={`input ${errs.password ? 'input-error' : ''}`} type="password" value={f.password} onChange={set('password')} autoComplete="new-password" /></Field>
          <Field label="Repeat password" error={errs.again}><input className={`input ${errs.again ? 'input-error' : ''}`} type="password" value={f.again} onChange={set('again')} autoComplete="new-password" /></Field>
        </div>
        {f.password && <div className="flex gap-1.5">{[0, 1, 2, 3].map((i) => <span key={i} className="h-1 flex-1 rounded-full" style={{ background: i < bar ? ['#fb7185', '#fbbf24', '#34d399', '#34d399'][bar - 1] : 'var(--color-panel3)' }} />)}</div>}
        <div>
          <label className="flex items-start gap-3 text-sm text-fg2 cursor-pointer"><input type="checkbox" className="mt-1" checked={f.agree} onChange={set('agree')} /> I agree to the terms of use and privacy policy.</label>
          {errs.agree && <p className="field-error">{errs.agree}</p>}
        </div>
        <button className="btn btn-primary btn-lg btn-block">Create account</button>
      </form>
    </Shell>
  );
}

export function ForgotPassword() {
  useDocumentTitle('Reset password');
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');
  const submit = (e) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) { setErr('Enter a valid email address.'); return; }
    setSent(true);
  };
  return (
    <Shell title="Reset your password" subtitle="We'll email you a link to choose a new password." footer={<Link to="/login" className="text-gold font-semibold">Back to sign in</Link>}>
      {sent ? (
        <div className="rounded-2xl border border-ok/30 bg-ok/10 p-6 text-center">
          <CheckCircle2 className="mx-auto text-ok mb-3" size={36} />
          <h3 className="font-semibold">Check your inbox</h3>
          <p className="text-sm text-fg2 mt-1.5">If an account exists for <b>{email}</b>, a reset link is on its way. (Demo: no email is actually sent.)</p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <Field label="Email" error={err}><div className="relative"><Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fg3" /><input className={`input pl-10 ${err ? 'input-error' : ''}`} value={email} onChange={(e) => { setEmail(e.target.value); setErr(''); }} /></div></Field>
          <button className="btn btn-primary btn-lg btn-block">Send reset link</button>
        </form>
      )}
    </Shell>
  );
}
