import { q, takenSeats } from './db';

/** "Best available": the n adjacent seats closest to the centre, a little behind the middle row. */
export function findBestSeats(showId, n, exceptBookingId = null) {
  const show = q.showtime(showId);
  const taken = takenSeats(showId, exceptBookingId);
  const seats = q.seatsOf(show.screen_id);
  const rows = [...new Set(seats.map((s) => s.row_label))].sort();
  const targetRow = Math.min(rows.length - 1, Math.round(rows.length * 0.55));
  let best = null;
  rows.forEach((label, ri) => {
    const rowSeats = seats.filter((s) => s.row_label === label).sort((a, b) => a.seat_number - b.seat_number);
    const mid = (rowSeats[0].seat_number + rowSeats[rowSeats.length - 1].seat_number) / 2;
    for (let i = 0; i + n <= rowSeats.length; i++) {
      const block = rowSeats.slice(i, i + n);
      const ok = block.every((s, k) => s.seat_status === 'ACTIVE' && !taken.has(s.seat_id) && (k === 0 || s.seat_number === block[k - 1].seat_number + 1));
      if (!ok) continue;
      const center = (block[0].seat_number + block[n - 1].seat_number) / 2;
      const score = Math.abs(ri - targetRow) * 2 + Math.abs(center - mid);
      if (!best || score < best.score) best = { score, ids: block.map((s) => s.seat_id) };
    }
  });
  return best ? best.ids : null;
}
