import { useState, useRef } from 'react';
import { ScanLine, CheckCircle2, XCircle, Keyboard, Users } from 'lucide-react';
import { useDb, useDocumentTitle } from '../../hooks/useDb';
import { useAuth } from '../../context/AuthContext';
import { table, checkIn, lookupTicket, appError, fmtD, now, parseDT } from '../../lib/db';
import { PageHeader, StatusBadge, Badge } from '../../components/ui/Misc';
import { dateShort, time12, time24 } from '../../lib/format';

export default function AdminCheckIn() {
  useDb();
  useDocumentTitle('Check-in · Admin');
  const { user, cinemaScope: scope } = useAuth();
  const [code, setCode] = useState('');
  const [result, setResult] = useState(null); // {ok, info?, message?}
  const inputRef = useRef(null);
  const today = fmtD(now());

  const todays = table('ticket').map((t) => lookupTicket(t.ticket_code)).filter((i) => i && i.show.start_time.startsWith(today) && i.booking.booking_status === 'CONFIRMED' && (!scope || i.cinema.cinema_id === scope));
  const valid = todays.filter((i) => i.ticket.ticket_status === 'VALID' && parseDT(i.show.end_time) > now());
  const used = todays.filter((i) => i.ticket.ticket_status === 'USED');
  const recent = [...used].sort((a, b) => b.ticket.checked_in_at.localeCompare(a.ticket.checked_in_at)).slice(0, 8);
  const preview = code.replace(/\s/g, '').length >= 8 ? lookupTicket(code) : null;

  const submit = (c) => {
    const value = (c || code).trim();
    if (!value) return;
    try {
      const pre = lookupTicket(value);
      if (pre && scope && pre.cinema.cinema_id !== scope) throw appError(`This ticket is for ${pre.cinema.cinema_name}, not your cinema.`);
      const info = checkIn(value, user.user_id);
      setResult({ ok: true, info });
      setCode('');
    } catch (e) {
      setResult({ ok: false, message: e.userMessage || e.message, info: lookupTicket(value) });
    }
    inputRef.current?.focus();
  };
  const byShow = [...new Set(todays.map((i) => i.show.showtime_id))].map((id) => {
    const l = todays.filter((i) => i.show.showtime_id === id);
    return { show: l[0].show, movie: l[0].movie, screen: l[0].screen, total: l.length, used: l.filter((i) => i.ticket.ticket_status === 'USED').length };
  }).sort((a, b) => a.show.start_time.localeCompare(b.show.start_time));

  return (
    <div>
      <PageHeader title="Ticket check-in" subtitle="Scan the QR code or type the 16-character ticket code. Each ticket can be used once, on the day of the show." />
      <div className="grid gap-6 lg:grid-cols-[1fr_24rem] items-start">
        <div className="space-y-6">
          <div className="card card-pad">
            <div className="grid sm:grid-cols-[11rem_1fr] gap-6 items-center">
              <div className="scan-box mx-auto w-44 h-44 rounded-2xl border-2 border-dashed border-gold/50 bg-panel2 flex items-center justify-center text-gold/60"><ScanLine size={64} /></div>
              <div>
                <label className="label flex items-center gap-2"><Keyboard size={14} /> Ticket code</label>
                <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="flex gap-2">
                  <input ref={inputRef} autoFocus className="input font-mono tracking-[.2em] uppercase text-lg" placeholder="XXXX XXXX XXXX XXXX" value={code} onChange={(e) => { setCode(e.target.value); setResult(null); }} maxLength={19} />
                  <button className="btn btn-primary btn-lg">Check in</button>
                </form>
                <p className="field-hint">With a USB/camera scanner, simply focus this field and scan.</p>
                {preview && !result && (
                  <div className="mt-4 rounded-xl border border-line bg-panel2 p-3 text-sm flex items-center justify-between gap-3">
                    <span><b>{preview.movie.title}</b> · seat <b>{preview.seat.row_label}{preview.seat.seat_number}</b> · {time24(preview.show.start_time)}</span><StatusBadge status={preview.ticket.ticket_status} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {result && (
            <div className={`rounded-2xl border p-6 flex gap-5 items-start fade-up ${result.ok ? 'border-ok/40 bg-ok/10' : 'border-bad/40 bg-bad/10'}`}>
              {result.ok ? <CheckCircle2 size={44} className="text-ok shrink-0" /> : <XCircle size={44} className="text-bad shrink-0" />}
              <div className="min-w-0">
                <h3 className="text-xl font-bold">{result.ok ? 'Welcome in — checked in' : 'Cannot admit'}</h3>
                {result.ok ? (
                  <div className="mt-2 text-sm space-y-0.5"><div className="text-lg font-semibold">{result.info.movie.title}</div>
                    <div>Seat <b className="text-gold text-base">{result.info.seat.row_label}{result.info.seat.seat_number}</b> · {result.info.screen.screen_name} · {dateShort(result.info.show.start_time)}, {time12(result.info.show.start_time)}</div>
                    <div className="text-fg2">Booking {result.info.booking.booking_reference}</div></div>
                ) : <p className="mt-1.5 text-fg">{result.message}</p>}
              </div>
            </div>
          )}

          <div className="card overflow-hidden">
            <div className="p-5 border-b border-line flex items-center gap-2"><Users size={18} className="text-gold" /><h3 className="font-semibold">Today's admissions by show</h3></div>
            <table className="tbl"><thead><tr><th>Time</th><th>Movie</th><th>Screen</th><th>Checked in</th></tr></thead><tbody>
              {byShow.map((s) => (<tr key={s.show.showtime_id}><td className="font-display font-bold">{time24(s.show.start_time)}</td><td>{s.movie.title}</td><td className="text-fg2">{s.screen.screen_name}</td>
                <td className="min-w-[10rem]"><div className="flex items-center gap-3"><div className="progress flex-1"><span style={{ width: `${(s.used / s.total) * 100}%`, background: 'var(--color-ok)' }} /></div><span className="text-xs text-fg2 w-14 text-right">{s.used} / {s.total}</span></div></td></tr>))}
              {!byShow.length && <tr><td colSpan={4} className="text-center text-fg3 py-8">No confirmed tickets for today's shows.</td></tr>}
            </tbody></table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="card card-pad text-center"><div className="text-3xl font-display font-bold text-ok">{used.length}</div><div className="text-xs text-fg3 mt-1">Checked in today</div></div>
            <div className="card card-pad text-center"><div className="text-3xl font-display font-bold text-gold">{valid.length}</div><div className="text-xs text-fg3 mt-1">Still to arrive</div></div>
          </div>
          <div className="card card-pad">
            <h3 className="font-semibold mb-1">Demo: simulate a scan</h3>
            <p className="text-xs text-fg3 mb-3">Valid tickets for today's shows — click to scan.</p>
            <ul className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {valid.filter((i) => parseDT(i.show.end_time) > now()).slice(0, 14).map((i) => (
                <li key={i.ticket.ticket_id}><button className="w-full text-left rounded-lg border border-line hover:border-gold/60 bg-panel2 px-3 py-2 text-sm flex justify-between gap-2" onClick={() => submit(i.ticket.ticket_code)}>
                  <span className="truncate"><b>{i.seat.row_label}{i.seat.seat_number}</b> · {i.movie.title}</span><span className="text-fg3 text-xs shrink-0">{time24(i.show.start_time)}</span></button></li>
              ))}
              {!valid.length && <li className="text-sm text-fg3 py-4 text-center">No valid tickets for today.</li>}
            </ul>
          </div>
          <div className="card card-pad">
            <h3 className="font-semibold mb-3">Recent check-ins</h3>
            <ul className="divide-y divide-line">
              {recent.map((i) => (<li key={i.ticket.ticket_id} className="py-2.5 flex items-center justify-between text-sm"><span><b>{i.seat.row_label}{i.seat.seat_number}</b> <span className="text-fg2">{i.movie.title}</span></span><Badge tone="ok">{i.ticket.checked_in_at.slice(11, 16)}</Badge></li>))}
              {!recent.length && <li className="text-sm text-fg3 py-3 text-center">Nobody checked in yet.</li>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
