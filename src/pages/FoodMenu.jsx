import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, Info } from 'lucide-react';
import { useDb, useDocumentTitle } from '../hooks/useDb';
import { q } from '../lib/db';
import { PageHeader, Callout } from '../components/ui/Misc';
import { money, titleCase } from '../lib/format';

const CATS = ['ALL', 'COMBOS', 'SNACKS', 'MEALS', 'DRINKS', 'DESSERTS'];

export default function FoodMenu() {
  useDb();
  useDocumentTitle('Food & drinks');
  const [cat, setCat] = useState('ALL');
  const items = q.food().filter((f) => cat === 'ALL' || f.category === cat);
  return (
    <div className="container-x py-10">
      <PageHeader eyebrow="Concessions" title="Food & drinks" subtitle="Fresh popcorn, hot meals and cold drinks. Pre-order with your tickets and collect at the counter." actions={<Link to="/movies" className="btn btn-primary"><Ticket size={16} /> Book & pre-order</Link>} />
      <Callout tone="info" icon={Info} className="mb-8">Prices are the same at the counter and online. Items marked sold out are temporarily unavailable.</Callout>
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 mb-4">
        {CATS.map((c) => <button key={c} className={`chip ${cat === c ? 'chip-active' : ''}`} onClick={() => setCat(c)}>{c === 'ALL' ? 'Everything' : titleCase(c)}</button>)}
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((f) => {
          const off = f.availability_status !== 'AVAILABLE';
          return (
            <div key={f.food_item_id} className={`card card-pad flex gap-4 ${off ? 'opacity-55' : 'card-hover'}`}>
              <div className="w-20 h-20 rounded-2xl bg-panel2 border border-line flex items-center justify-center text-4xl shrink-0">{f.emoji}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2"><h3 className="font-semibold leading-snug">{f.item_name}</h3>{off && <span className="badge badge-bad shrink-0">Sold out</span>}</div>
                <p className="text-xs text-fg2 mt-1 line-clamp-2">{f.description}</p>
                <div className="flex items-center justify-between mt-3"><span className="font-bold text-gold text-lg">{money(f.current_price)}</span><span className="badge badge-muted">{titleCase(f.category)}</span></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
