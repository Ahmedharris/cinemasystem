import React from 'react';
import { Armchair, Popcorn, CreditCard, TicketCheck } from 'lucide-react';

export default function BookingStepper({ currentStep = 1 }) {
  const steps = [
    { num: 1, title: 'Seats', icon: Armchair },
    { num: 2, title: 'Refreshments', icon: Popcorn },
    { num: 3, title: 'Checkout', icon: CreditCard },
    { num: 4, title: 'Tickets', icon: TicketCheck }
  ];

  return (
    <div className="w-full max-w-2xl mx-auto mb-8">
      <div className="flex items-center justify-between relative">
        {/* Track Line behind */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-[#23304a] -translate-y-1/2 z-0" />

        {steps.map((s) => {
          const isDone = currentStep > s.num;
          const isCurrent = currentStep === s.num;
          const Icon = s.icon;

          return (
            <div key={s.num} className="relative z-10 flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                  isDone
                    ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                    : isCurrent
                    ? 'bg-amber-400 text-black ring-4 ring-amber-500/20 shadow-lg shadow-amber-400/30 font-extrabold scale-110'
                    : 'bg-[#182238] border border-[#23304a] text-slate-500'
                }`}
              >
                <Icon className={`w-4 h-4 ${isDone || isCurrent ? 'text-black' : 'text-slate-400'}`} />
              </div>
              <span
                className={`mt-2 text-xs font-semibold tracking-tight ${
                  isCurrent ? 'text-amber-400' : isDone ? 'text-slate-200' : 'text-slate-500'
                }`}
              >
                {s.title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
