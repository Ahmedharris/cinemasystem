import { Check } from 'lucide-react';

const STEPS = ['Seats', 'Food & drinks', 'Payment', 'E-tickets'];

export default function Stepper({ current }) {
  return (
    <ol className="flex items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm mb-8 no-print">
      {STEPS.map((s, i) => {
        const done = i < current, on = i === current;
        return (
          <li key={s} className="flex items-center gap-2 sm:gap-3">
            <span className={`flex items-center gap-2 font-semibold ${on ? 'text-gold' : done ? 'text-ok' : 'text-fg3'}`}>
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border ${on ? 'bg-gold text-[#17110a] border-gold' : done ? 'bg-ok/15 border-ok/50' : 'border-line2'}`}>
                {done ? <Check size={14} /> : i + 1}
              </span>
              <span className="hidden sm:inline">{s}</span>
            </span>
            {i < STEPS.length - 1 && <span className={`w-6 sm:w-12 h-px ${done ? 'bg-ok/60' : 'bg-line2'}`} />}
          </li>
        );
      })}
    </ol>
  );
}
