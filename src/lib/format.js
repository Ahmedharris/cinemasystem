import { CURRENCY, parseDT, fmtD, now } from './db';

export const money = (n) => `${CURRENCY} ${Math.round(Number(n) || 0).toLocaleString('en-US')}`;
export const fmtDuration = (m) => `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`;
export const time24 = (dt) => (dt ? dt.slice(11, 16) : '');
export const time12 = (dt) => {
  const d = parseDT(dt);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};
export const dateLong = (dt) => parseDT(dt.length === 10 ? dt + ' 00:00:00' : dt).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
export const dateShort = (dt) => parseDT(dt.length === 10 ? dt + ' 00:00:00' : dt).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
export const dateMed = (dt) => parseDT(dt.length === 10 ? dt + ' 00:00:00' : dt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
export const dateTimeShort = (dt) => `${dateMed(dt)}, ${time24(dt)}`;

export function relDay(dateStr) {
  const today = fmtD(now());
  const tomorrow = fmtD(new Date(now().getFullYear(), now().getMonth(), now().getDate() + 1));
  if (dateStr === today) return 'Today';
  if (dateStr === tomorrow) return 'Tomorrow';
  return dateShort(dateStr);
}
export function nextDays(n = 7, from = 0) {
  const t = now();
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(t.getFullYear(), t.getMonth(), t.getDate() + from + i);
    return {
      date: fmtD(d), weekday: d.toLocaleDateString('en-GB', { weekday: 'short' }), day: d.getDate(),
      month: d.toLocaleDateString('en-GB', { month: 'short' }), label: i + from === 0 ? 'Today' : i + from === 1 ? 'Tomorrow' : d.toLocaleDateString('en-GB', { weekday: 'short' })
    };
  });
}
export const initials = (name = '') => name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
export function timeAgo(dt) {
  const s = Math.max(0, Math.floor((now() - parseDT(dt)) / 1000));
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
}
export const pluralize = (n, w, p = w + 's') => `${n} ${n === 1 ? w : p}`;
export const seatLabel = (seat) => `${seat.row_label}${seat.seat_number}`;
export const titleCase = (s = '') => s.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export const SCREEN_TYPE_LABEL = { STANDARD: 'Standard', '3D': '3D', IMAX: 'IMAX', VIP: 'VIP Recliners' };

const TONES = {
  CONFIRMED: 'ok', SUCCESS: 'ok', NOW_SHOWING: 'ok', AVAILABLE: 'ok', ACTIVE: 'ok', VALID: 'ok', ON_SALE: 'ok', COLLECTED: 'ok', PAYMENT: 'ok',
  PENDING: 'warn', PLACED: 'warn', PREPARING: 'warn', HELD: 'warn', DRAFT: 'warn', PAUSED: 'warn', MAINTENANCE: 'warn', SCHEDULED: 'info',
  COMING_SOON: 'gold', READY: 'info', USED: 'info', REFUND: 'info', COMPLETED: 'muted', ARCHIVED: 'muted', CLOSED: 'muted',
  CANCELLED: 'bad', FAILED: 'bad', EXPIRED: 'bad', UNAVAILABLE: 'bad', SUSPENDED: 'bad', BROKEN: 'bad', EXHAUSTED: 'bad', SOLD_OUT: 'bad'
};
export const statusTone = (s) => TONES[s] || 'muted';

/** print only the open modal (used for ticket printouts) */
export function printModal() {
  document.body.classList.add('print-modal');
  try { window.print(); } finally { setTimeout(() => document.body.classList.remove('print-modal'), 300); }
}

/* ---- downloads ---- */
function download(filename, mime, content) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function downloadCSV(filename, rows) {
  const esc = (v) => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  download(filename.endsWith('.csv') ? filename : filename + '.csv', 'text/csv;charset=utf-8', '\uFEFF' + rows.map((r) => r.map(esc).join(',')).join('\r\n'));
}
export function downloadICS({ title, start, end, location, description, uid }) {
  const f = (s) => s.replace(/[-: ]/g, '').slice(0, 15);
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//QISSA//Booking//EN', 'BEGIN:VEVENT', `UID:${uid}@qissa.pk`,
    `DTSTAMP:${f(new Date().toISOString().replace('T', ' ').slice(0, 19))}Z`, `DTSTART:${f(start)}`, `DTEND:${f(end)}`,
    `SUMMARY:${title}`, `LOCATION:${location}`, `DESCRIPTION:${description}`, 'END:VEVENT', 'END:VCALENDAR'
  ].join('\r\n');
  download(`${uid}.ics`, 'text/calendar', ics);
}
