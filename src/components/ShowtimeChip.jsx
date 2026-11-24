import { Link } from 'react-router-dom';
import { q, availability, isBookable } from '../lib/db';
import { money, time12, SCREEN_TYPE_LABEL } from '../lib/format';

export default function ShowtimeChip({ show }) {
  const a = availability(show);
  const screen = q.screen(show.screen_id);
  const open = isBookable(show);
  const sold = a.free === 0;
  const ok = open && !sold;
  const dot = a.pct >= 85 ? 'bg-bad' : a.pct >= 55 ? 'bg-warn' : 'bg-ok';
  const body = (
    <>
      <div className="flex items-center justify-between gap-3">
        <span className="font-display font-bold text-base">{time12(show.start_time)}</span>
        <span className={`w-2 h-2 rounded-full ${ok ? dot : 'bg-fg3'}`} />
      </div>
      <div className="text-[11px] text-fg2 mt-0.5">{SCREEN_TYPE_LABEL[screen.screen_type]} · {show.audio_language}{show.subtitle_language ? ` · ${show.subtitle_language} sub` : ''}</div>
      <div className="text-[11px] mt-1 font-semibold text-fg">
        {show.show_status === 'CANCELLED' ? 'Cancelled' : !open ? 'Closed' : sold ? 'Sold out' : <>from {money(q.minPrice(show.showtime_id))}</>}
        {ok && a.free <= 20 && <span className="text-warn font-medium"> · {a.free} left</span>}
      </div>
    </>
  );
  const base = 'block rounded-xl border px-3.5 py-2.5 min-w-[9.5rem] transition-all';
  return ok ? (
    <Link to={`/book/seats/${show.showtime_id}`} className={`${base} bg-panel2 border-line2 hover:border-gold hover:bg-panel3 hover:-translate-y-0.5`}>{body}</Link>
  ) : (
    <div className={`${base} bg-panel border-line opacity-50 cursor-not-allowed`} aria-disabled="true">{body}</div>
  );
}
