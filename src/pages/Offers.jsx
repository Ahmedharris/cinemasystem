import { Link } from 'react-router-dom';
import { Percent, Copy, CalendarClock, Ticket } from 'lucide-react';
import { useDb, useDocumentTitle } from '../hooks/useDb';
import { q, promoStatus } from '../lib/db';
import { useUI } from '../context/UIContext';
import { Badge, PageHeader, StatusBadge } from '../components/ui/Misc';
import { money, dateMed } from '../lib/format';

export default function Offers() {
  useDb();
  useDocumentTitle('Offers');
  const { toast } = useUI();
  const all = q.promotions().map((p) => ({ p, status: promoStatus(p) }));
  const active = all.filter((x) => x.status === 'ACTIVE');
  const other = all.filter((x) => x.status !== 'ACTIVE' && x.status !== 'PAUSED');
  const copy = (code) => { navigator.clipboard?.writeText(code).catch(() => {}); toast.success(`Code ${code} copied. Use it at checkout.`); };

  const Card = ({ p, status }) => {
    const live = status === 'ACTIVE';
    return (
      <div className={`card overflow-hidden flex flex-col ${live ? '' : 'opacity-60'}`}>
        <div className="p-6 relative" style={{ background: live ? 'linear-gradient(135deg, #3b2a08, #0e1320)' : undefined }}>
          <Percent className="absolute right-3 bottom-1 text-white/5" size={96} />
          <div className="flex items-start justify-between"><div className="text-3xl font-display font-bold text-gold">{p.discount_type === 'PERCENT' ? `${p.discount_value}% OFF` : `${money(p.discount_value)} OFF`}</div><StatusBadge status={status} /></div>
          <p className="text-sm text-fg2 mt-2">{p.description}</p>
        </div>
        <div className="p-6 pt-4 flex-1 flex flex-col gap-3 text-sm border-t border-line">
          <ul className="space-y-1.5 text-fg2 text-[13px]">
            <li className="flex gap-2"><Ticket size={14} className="mt-0.5 text-fg3" /> Minimum order {money(p.min_order_amount)}</li>
            {p.max_discount != null && <li className="flex gap-2"><Percent size={14} className="mt-0.5 text-fg3" /> Maximum discount {money(p.max_discount)}</li>}
            <li className="flex gap-2"><CalendarClock size={14} className="mt-0.5 text-fg3" /> {dateMed(p.valid_from)} – {dateMed(p.valid_to)}</li>
          </ul>
          <button disabled={!live} onClick={() => copy(p.promo_code)} className="mt-auto inline-flex items-center justify-center gap-2 border border-dashed border-gold/60 text-gold font-mono font-bold tracking-widest px-3 py-2 rounded-xl hover:bg-gold/10 disabled:opacity-50 disabled:cursor-not-allowed">{p.promo_code} <Copy size={14} /></button>
        </div>
      </div>
    );
  };

  return (
    <div className="container-x py-10">
      <PageHeader eyebrow="Save more" title="Offers & promo codes" subtitle="Enter a code at checkout. One promo code can be used per booking." actions={<Link to="/movies" className="btn btn-primary"><Ticket size={16} /> Book now</Link>} />
      <h2 className="font-semibold mb-4 flex items-center gap-2">Active offers <Badge tone="ok">{active.length}</Badge></h2>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 mb-12">{active.map((x) => <Card key={x.p.promotion_id} {...x} />)}</div>
      {other.length > 0 && (
        <>
          <h2 className="font-semibold mb-4 text-fg2">Expired & upcoming</h2>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{other.map((x) => <Card key={x.p.promotion_id} {...x} />)}</div>
        </>
      )}
    </div>
  );
}
