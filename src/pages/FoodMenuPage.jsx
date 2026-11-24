import React, { useState } from 'react';
import { Popcorn, Sparkles, Flame, CheckCircle2, XCircle } from 'lucide-react';
import { useCinema } from '../context/CinemaContext';
import { CURRENCY } from '../data/initialData';

export default function FoodMenuPage() {
  const { foodItems } = useCinema();
  const [selectedCat, setSelectedCat] = useState('All');

  const categories = ['All', ...new Set(foodItems.map(f => f.category))];

  const filtered = foodItems.filter(f => selectedCat === 'All' ? true : f.category === selectedCat);

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#23304a] pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white font-['Space_Grotesk'] flex items-center gap-2.5">
            <Popcorn className="w-6 h-6 text-amber-400" />
            Concessions &amp; Gourmet Dining
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Pre-order at checkout or purchase on-demand at any of our cinema concession bars.
          </p>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto bg-[#111726] p-1.5 rounded-2xl border border-[#23304a] scrollbar-none">
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setSelectedCat(c)}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCat === c
                  ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filtered.map(item => (
          <div
            key={item.id}
            className="bg-[#111726] border border-[#23304a] hover:border-amber-400/50 rounded-2xl p-5 flex flex-col justify-between transition-all shadow-xl hover:shadow-2xl hover:shadow-amber-500/10"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <span className="text-4xl p-3 bg-[#182238] rounded-2xl border border-[#23304a]">
                  {item.icon || '🍿'}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-1 ${
                    item.available
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-red-500/20 text-red-300 border border-red-500/30'
                  }`}
                >
                  {item.available ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  {item.available ? 'In Stock' : 'Sold Out'}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                  {item.category}
                </span>
                <h3 className="font-bold text-white text-base mt-0.5">{item.name}</h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-3 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-[#23304a] flex items-center justify-between">
              <span className="font-extrabold text-lg text-amber-400">
                {CURRENCY} {item.price}
              </span>
              {item.calories && (
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Flame className="w-3 h-3 text-amber-500" />
                  {item.calories}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
