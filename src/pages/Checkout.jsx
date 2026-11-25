import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CreditCard, Smartphone, Lock, Tag, X, ShieldCheck, AlertTriangle, CheckCircle2, FlaskConical, ArrowLeft } from 'lucide-react';
import { q, applyPromo, removePromo, pay, promoStatus, promoDiscount } from '../lib/db';
import { clearCart } from '../lib/cart';
import { useHold } from '../hooks/useHold';
import { useDocumentTitle } from '../hooks/useDb';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import Stepper from '../components/Stepper';
import OrderSummary from '../components/OrderSummary';
import { Spinner, Callout } from '../components/ui/Misc';
import { Field } from '../components/ui/Form';
import { money } from '../lib/format';

const METHODS = [
  { v: 'CARD', label: 'Credit / debit card', sub: 'Visa, Mastercard', icon: CreditCard },
  { v: 'EASYPAISA', label: 'Easypaisa', sub: 'Mobile wallet', icon: Smartphone },
  { v: 'JAZZCASH', label: 'JazzCash', sub: 'Mobile wallet', icon: Smartphone }
];

const fmtCard = (v) => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
const fmtExp = (v) => { const d = v.replace(/\D/g, '').slice(0, 4); return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d; };

export default function Checkout() {
  useDocumentTitle('Payment');
  const nav = useNavigate();
  const { user } = useAuth();
  const { toast } = useUI();
  const { booking, ms, finish } = useHold();
  const [method, setMethod] = useState('CARD');
  const [card, setCard] = useState({ number: '', name: user ? user.full_name : '', exp: '', cvv: '' });
  const [wallet, setWallet] = useState(user && user.phone ? user.phone : '');
  const [code, setCode] = useState('');
  const [promoErr, setPromoErr] = useState('');
  const [agree, setAgree] = useState(false);
  const [outcome, setOutcome] = useState('SUCCESS');
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});
  const [declined, setDeclined] = useState('');
  if (!booking) return null;
  const full = q.bookingFull(booking);
  const promos = q.promotions().filter((p) => promoStatus(p) === 'ACTIVE');

  const apply = (c) => {
    setPromoErr('');
    try { const r = applyPromo(booking.booking_id, c || code); toast.success(`${r.promotion.promo_code} applied — you save ${money(r.discount)}.`); setCode(''); } catch (e) { setPromoErr(e.userMessage || e.message); }
  };

  const validate = () => {
    const e = {};
    if (method === 'CARD') {
      if (card.number.replace(/\s/g, '').length !== 16) e.number = 'Enter the 16-digit card number.';
      if (card.name.trim().length < 3) e.name = 'Enter the name on the card.';
      const m = card.exp.match(/^(\d{2})\/(\d{2})$/);
      if (!m || +m[1] < 1 || +m[1] > 12) e.exp = 'Use MM/YY.';
      else { const d = new Date(2000 + +m[2], +m[1], 0, 23, 59); if (d < new Date()) e.exp = 'This card has expired.'; }
      if (!/^\d{3,4}$/.test(card.cvv)) e.cvv = '3 or 4 digits.';
    } else if (!/^03\d{2}[-\s]?\d{7}$/.test(wallet.trim())) e.wallet = 'Enter a mobile number like 0300-1234567.';
    if (!agree) e.agree = 'Please accept the booking terms.';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const submit = () => {
    setDeclined('');
    if (!validate()) return;
    setBusy(true);
    setTimeout(() => {
      try {
        const res = pay(booking.booking_id, { method, outcome });
        if (res.ok) { finish(); clearCart(); nav(`/booking/${res.booking.booking_reference}?new=1`, { replace: true }); }
        else { setBusy(false); setDeclined(method === 'CARD' ? 'Your bank declined the payment. Please check your card details or try another method. Your seats are still held.' : 'The wallet payment was not approved. Please try again. Your seats are still held.'); }
      } catch (e) { setBusy(false); toast.fail(e); finish(); nav(`/book/seats/${booking.showtime_id}`, { replace: true }); }
    }, 1600);
  };

  const applied = full.promo;
  const brand = card.number.startsWith('4') ? 'VISA' : card.number.startsWith('5') ? 'MASTERCARD' : 'CARD';

  return (
    <div className="container-x py-8">
      <Stepper current={2} />
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem] items-start">
        <div className="space-y-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Payment</h1>

          {declined && <Callout tone="bad" icon={AlertTriangle}><b>Payment failed.</b> {declined}</Callout>}

          <section className="card card-pad">
            <h2 className="font-semibold mb-4">Promo code</h2>
            {applied ? (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-ok/35 bg-ok/10 px-4 py-3">
                <div className="flex items-center gap-3 text-sm"><CheckCircle2 className="text-ok" size={20} /><div><b className="tracking-wider">{applied.promo_code}</b> applied<div className="text-xs text-fg2">{applied.description}</div></div></div>
                <button className="btn btn-ghost btn-sm" onClick={() => removePromo(booking.booking_id)}><X size={14} /> Remove</button>
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <div className="relative flex-1"><Tag size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fg3" />
                    <input className={`input pl-10 uppercase tracking-wider ${promoErr ? 'input-error' : ''}`} placeholder="Enter promo code" value={code} onChange={(e) => { setCode(e.target.value); setPromoErr(''); }} onKeyDown={(e) => { if (e.key === 'Enter') apply(); }} /></div>
                  <button className="btn btn-secondary" onClick={() => apply()} disabled={!code.trim()}>Apply</button>
                </div>
                {promoErr && <p className="field-error">{promoErr}</p>}
                {promos.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-fg3">Try:
                    {promos.map((p) => {
                      const d = promoDiscount(p, booking.ticket_subtotal + booking.food_subtotal);
                      return <button key={p.promotion_id} className="chip !py-1 !text-xs" onClick={() => apply(p.promo_code)} title={p.description}>{p.promo_code}{d > 0 && <span className="text-ok">−{money(d)}</span>}</button>;
                    })}
                  </div>
                )}
              </>
            )}
          </section>

          <section className="card card-pad">
            <h2 className="font-semibold mb-4">Payment method</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {METHODS.map((m) => (
                <button key={m.v} type="button" onClick={() => { setMethod(m.v); setErrors({}); }} className={`text-left rounded-xl border p-4 transition-all ${method === m.v ? 'border-gold bg-gold/8' : 'border-line hover:border-line2 bg-panel2'}`} style={method === m.v ? { background: 'rgba(245,184,46,.08)' } : undefined}>
                  <m.icon size={22} className={method === m.v ? 'text-gold' : 'text-fg2'} />
                  <div className="font-semibold text-sm mt-3">{m.label}</div>
                  <div className="text-xs text-fg3">{m.sub}</div>
                </button>
              ))}
            </div>

            {method === 'CARD' ? (
              <div className="grid gap-6 md:grid-cols-[1fr_16rem] mt-6">
                <div className="space-y-4">
                  <Field label="Card number" error={errors.number}>
                    <input className={`input font-mono tracking-wider ${errors.number ? 'input-error' : ''}`} inputMode="numeric" placeholder="4242 4242 4242 4242" value={card.number} onChange={(e) => setCard({ ...card, number: fmtCard(e.target.value) })} autoComplete="cc-number" />
                  </Field>
                  <Field label="Name on card" error={errors.name}>
                    <input className={`input ${errors.name ? 'input-error' : ''}`} value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} autoComplete="cc-name" />
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Expiry" error={errors.exp}><input className={`input font-mono ${errors.exp ? 'input-error' : ''}`} placeholder="MM/YY" value={card.exp} onChange={(e) => setCard({ ...card, exp: fmtExp(e.target.value) })} autoComplete="cc-exp" /></Field>
                    <Field label="CVV" error={errors.cvv}><input className={`input font-mono ${errors.cvv ? 'input-error' : ''}`} type="password" inputMode="numeric" maxLength={4} placeholder="•••" value={card.cvv} onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, '') })} autoComplete="cc-csc" /></Field>
                  </div>
                </div>
                <div className="hidden md:flex rounded-2xl p-5 flex-col justify-between aspect-[1.6] self-start bg-gradient-to-br from-indigo-600 via-purple-700 to-fuchsia-700 shadow-xl">
                  <div className="flex justify-between items-center text-xs font-bold tracking-widest opacity-90"><span>QISSA Pay</span><span>{brand}</span></div>
                  <div className="font-mono text-[15px] tracking-wider whitespace-nowrap">{card.number || '•••• •••• •••• ••••'}</div>
                  <div className="flex justify-between text-[11px] uppercase opacity-90"><span className="truncate max-w-[9rem]">{card.name || 'Card holder'}</span><span>{card.exp || 'MM/YY'}</span></div>
                </div>
              </div>
            ) : (
              <div className="mt-6 max-w-sm">
                <Field label={`${method === 'EASYPAISA' ? 'Easypaisa' : 'JazzCash'} mobile number`} error={errors.wallet} hint="You'll approve the payment in your wallet app.">
                  <input className={`input ${errors.wallet ? 'input-error' : ''}`} placeholder="0300-1234567" value={wallet} onChange={(e) => setWallet(e.target.value)} inputMode="tel" />
                </Field>
              </div>
            )}

            <div className="mt-6 rounded-xl border border-dashed border-line2 p-4 bg-panel2/50">
              <div className="flex items-center gap-2 text-xs font-bold text-fg2 uppercase tracking-wider mb-2"><FlaskConical size={14} className="text-gold" /> Demo gateway</div>
              <div className="flex flex-wrap gap-5 text-sm">
                <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="outcome" checked={outcome === 'SUCCESS'} onChange={() => setOutcome('SUCCESS')} /> Approve payment</label>
                <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="outcome" checked={outcome === 'FAILED'} onChange={() => setOutcome('FAILED')} /> Simulate a declined payment</label>
              </div>
              <p className="text-xs text-fg3 mt-2">No real money is charged. Any card details are accepted in this prototype.</p>
            </div>
          </section>

          <div>
            <label className="flex items-start gap-3 text-sm cursor-pointer"><input type="checkbox" className="mt-1 w-4 h-4" checked={agree} onChange={(e) => { setAgree(e.target.checked); setErrors({ ...errors, agree: undefined }); }} />
              <span className="text-fg2">I agree to the booking terms and the <Link to="/help?section=cancellation" className="text-gold underline" target="_blank">cancellation policy</Link> (free cancellation until 2 hours before the show).</span></label>
            {errors.agree && <p className="field-error">{errors.agree}</p>}
          </div>
        </div>

        <OrderSummary full={full} ms={ms}>
          <button className="btn btn-primary btn-lg btn-block mt-2" onClick={submit} disabled={busy}>
            {busy ? <><Spinner /> Processing…</> : <><Lock size={17} /> Pay {money(booking.total_amount)}</>}
          </button>
          <Link to="/book/food" className="btn btn-ghost btn-block"><ArrowLeft size={16} /> Back to food</Link>
          <p className="text-[11px] text-fg3 text-center flex items-center justify-center gap-1.5"><ShieldCheck size={12} /> Secure 256-bit encrypted checkout</p>
        </OrderSummary>
      </div>
    </div>
  );
}
