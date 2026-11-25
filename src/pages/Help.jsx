import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronDown, Mail, Phone, Clock, Send } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDb';
import { useUI } from '../context/UIContext';
import { PageHeader } from '../components/ui/Misc';
import { Field } from '../components/ui/Form';
import { CANCEL_CUTOFF_HOURS, HOLD_MINUTES, MAX_SEATS } from '../lib/db';

const FAQ = [
  { q: 'How does seat reservation work?', a: `When you pick your seats and continue, they are held for you for ${HOLD_MINUTES} minutes. Finish payment within that time to confirm the booking; otherwise the seats are released for other customers.` },
  { q: 'How many seats can I book at once?', a: `Up to ${MAX_SEATS} seats per booking. For larger groups please make several bookings or contact the cinema.` },
  { q: 'How do I get into the cinema?', a: 'After payment you receive an e-ticket with a QR code for every seat. Show it on your phone (or a printout) at the entrance - staff scan it and you walk in.' },
  { q: 'Which payment methods are accepted?', a: 'Credit and debit cards, Easypaisa and JazzCash online. At the box office you can also pay in cash.' },
  { q: 'Can I order food in advance?', a: 'Yes. After choosing seats you can add popcorn, drinks and combos. Collect them from the food counter with your pickup code.' },
  { q: 'How do promo codes work?', a: 'Enter a code at checkout. Each code has a minimum order amount, validity dates and sometimes a usage limit. Only one code can be applied to a booking.' },
  { q: 'Can I write a review?', a: 'Yes, once you have a confirmed booking for the movie you can rate it and write a review on the movie page.' }
];

export default function Help() {
  useDocumentTitle('Help & FAQ');
  const { toast } = useUI();
  const [sp] = useSearchParams();
  const [open, setOpen] = useState(0);
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [errs, setErrs] = useState({});

  useEffect(() => {
    const s = sp.get('section');
    if (s) setTimeout(() => document.getElementById(s)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  }, [sp]);

  const submit = (e) => {
    e.preventDefault();
    const er = {};
    if (form.name.trim().length < 2) er.name = 'Please enter your name.';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) er.email = 'Enter a valid email.';
    if (form.message.trim().length < 10) er.message = 'Tell us a little more (10+ characters).';
    setErrs(er);
    if (Object.keys(er).length) return;
    toast.success('Message sent! Our team will reply within one working day.');
    setForm({ name: '', email: '', message: '' });
  };

  return (
    <div className="container-x py-10 max-w-5xl">
      <PageHeader eyebrow="Support" title="Help & FAQ" subtitle="Answers to the most common questions about booking, payments and cancellations." />
      <div className="grid gap-8 lg:grid-cols-[1fr_20rem] items-start">
        <div className="space-y-10">
          <section>
            <div className="space-y-3">
              {FAQ.map((f, i) => (
                <div key={f.q} className="card overflow-hidden">
                  <button className="w-full flex items-center justify-between gap-4 text-left px-5 py-4 font-semibold" onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}>
                    {f.q}<ChevronDown size={18} className={`text-fg3 shrink-0 transition-transform ${open === i ? 'rotate-180 text-gold' : ''}`} />
                  </button>
                  {open === i && <div className="px-5 pb-5 text-sm text-fg2 leading-relaxed fade-up">{f.a}</div>}
                </div>
              ))}
            </div>
          </section>

          <section id="cancellation" className="scroll-mt-24">
            <h2 className="section-title mb-4">Cancellation & refund policy</h2>
            <div className="card card-pad text-sm text-fg2 leading-relaxed space-y-3">
              <p><b className="text-fg">Free cancellation</b> is available until {CANCEL_CUTOFF_HOURS} hours before the show starts. Open the booking from <Link to="/my-bookings" className="text-gold">My bookings</Link> and choose <i>Cancel booking</i>.</p>
              <p>Refunds are returned to the original payment method (full amount including food pre-orders) and are recorded as a refund payment on your booking.</p>
              <p>Bookings cannot be cancelled by the customer within {CANCEL_CUTOFF_HOURS} hours of the show, or once a ticket has been scanned. If a show is cancelled by the cinema, all bookings are refunded automatically.</p>
              <p>Unpaid bookings are released automatically after {HOLD_MINUTES} minutes.</p>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <form onSubmit={submit} className="card card-pad space-y-4" noValidate>
            <h3 className="font-semibold">Still need help?</h3>
            <Field label="Your name" error={errs.name}><input className={`input ${errs.name ? 'input-error' : ''}`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Email" error={errs.email}><input className={`input ${errs.email ? 'input-error' : ''}`} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
            <Field label="Message" error={errs.message}><textarea className={`textarea ${errs.message ? 'input-error' : ''}`} rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></Field>
            <button className="btn btn-primary btn-block"><Send size={15} /> Send message</button>
          </form>
          <div className="card card-pad space-y-3 text-sm text-fg2">
            <div className="flex gap-3"><Phone size={16} className="text-gold mt-0.5" /> 042-111-246-362</div>
            <div className="flex gap-3"><Mail size={16} className="text-gold mt-0.5" /> support@qissa.pk</div>
            <div className="flex gap-3"><Clock size={16} className="text-gold mt-0.5" /> Daily, 10:00 – 23:00</div>
          </div>
        </div>
      </div>
    </div>
  );
}
