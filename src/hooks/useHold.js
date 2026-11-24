import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { pendingBooking, getCartId } from '../lib/cart';
import { q, parseDT } from '../lib/db';
import { useCountdown, useDb } from './useDb';

/** Guards the food/checkout steps: needs a live seat hold, exposes the countdown. */
export function useHold() {
  useDb();
  const { user } = useAuth();
  const nav = useNavigate();
  const { toast } = useUI();
  const booking = user ? pendingBooking(user.user_id) : null;
  const ms = useCountdown(booking ? parseDT(booking.payment_deadline).getTime() : null);
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    if (!user) { done.current = true; nav('/login', { replace: true, state: { from: '/book/food' } }); return; }
    if (!booking) {
      done.current = true;
      const id = getCartId();
      const old = id ? q.booking(id) : null;
      if (old && (old.booking_status === 'EXPIRED' || old.booking_status === 'PENDING')) {
        toast.warn('Your seat hold expired. Please pick your seats again.');
        nav(`/book/seats/${old.showtime_id}`, { replace: true });
      } else {
        toast.info('Choose a movie and seats to start a booking.');
        nav('/movies', { replace: true });
      }
    }
  });
  return { booking, ms, finish: () => { done.current = true; } };
}
