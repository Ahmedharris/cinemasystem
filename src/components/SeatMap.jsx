import { useMemo } from 'react';
import { q, takenSeats, priceMap } from '../lib/db';
import { money } from '../lib/format';

export function SeatLegend({ prices }) {
  const cats = q.seatCategories();
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-fg2">
      {cats.map((c) => (
        <span key={c.seat_category_id} className="inline-flex items-center gap-2">
          <span className={`seat-legend seat-c${c.seat_category_id}`} />
          <span>{c.category_name}{prices && prices[c.seat_category_id] ? ` · ${money(prices[c.seat_category_id])}` : ''}</span>
        </span>
      ))}
      <span className="inline-flex items-center gap-2"><span className="seat-legend bg-gold !border-gold" /> Selected</span>
      <span className="inline-flex items-center gap-2"><span className="seat-legend !bg-[#1a2033] !border-[#1a2033]" /> Taken</span>
      <span className="inline-flex items-center gap-2"><span className="seat-legend !border-dashed !border-[#7c3a4c]" /> Unavailable</span>
    </div>
  );
}

/** Interactive seat plan for one show. `selected` is an array of seat_ids. */
export default function SeatMap({ showId, selected = [], onToggle, exceptBookingId = null, readOnly = false }) {
  const show = q.showtime(showId);
  const seats = q.seatsOf(show.screen_id);
  const taken = takenSeats(showId, exceptBookingId);
  const prices = priceMap(showId);

  const { rows, aisle } = useMemo(() => {
    const labels = [...new Set(seats.map((s) => s.row_label))].sort();
    const maxCols = Math.max(...seats.map((s) => s.seat_number));
    return {
      rows: labels.map((l) => ({ label: l, seats: seats.filter((s) => s.row_label === l).sort((a, b) => a.seat_number - b.seat_number) })),
      aisle: Math.floor(maxCols / 2)
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show.screen_id, seats.length]);

  return (
    <div className="overflow-x-auto pb-2">
      <div className="min-w-max mx-auto px-2" style={{ width: 'fit-content' }}>
        <div className="screen-curve" />
        <div className="text-center text-[10px] tracking-[0.4em] text-fg3 -mt-5 mb-6">SCREEN</div>
        <div className="space-y-1.5">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-center gap-1.5">
              <span className="w-5 text-center text-[11px] font-bold text-fg3">{row.label}</span>
              <div className="flex gap-1.5">
                {row.seats.map((s) => {
                  const isSel = selected.includes(s.seat_id);
                  const isTaken = taken.has(s.seat_id);
                  const broken = s.seat_status !== 'ACTIVE';
                  const cat = q.seatCategory(s.seat_category_id);
                  const label = `${row.label}${s.seat_number}`;
                  const state = isSel ? 'seat-selected' : broken ? 'seat-broken' : isTaken ? 'seat-taken' : '';
                  return (
                    <button
                      key={s.seat_id} type="button" disabled={readOnly || isTaken || broken}
                      className={`seat seat-c${s.seat_category_id} ${state}`}
                      style={s.seat_number === aisle + 1 ? { marginLeft: '1.1rem' } : undefined}
                      title={broken ? `${label} · out of service` : isTaken ? `${label} · taken` : `${label} · ${cat.category_name} · ${money(prices[s.seat_category_id])}`}
                      aria-label={`Seat ${label} ${isTaken ? 'taken' : broken ? 'unavailable' : isSel ? 'selected' : 'available'}`}
                      aria-pressed={isSel}
                      onClick={() => onToggle && onToggle(s)}
                    >
                      {isSel ? s.seat_number : ''}
                    </button>
                  );
                })}
              </div>
              <span className="w-5 text-center text-[11px] font-bold text-fg3">{row.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
