/* The "cart" is simply the customer's PENDING booking (seats on hold).
   Only its id is remembered here; everything else lives in the booking tables. */
import { q, releaseHold, parseDT, now } from './db';

const KEY = 'qissa_cart';
export const getCartId = () => { try { return Number(localStorage.getItem(KEY)) || null; } catch { return null; } };
export const setCartId = (id) => { try { localStorage.setItem(KEY, String(id)); } catch { /* ignore */ } };
export const clearCart = () => { try { localStorage.removeItem(KEY); } catch { /* ignore */ } };

/** the active pending booking of the current cart, or null (expired / paid / cancelled) */
export function pendingBooking(userId) {
  const id = getCartId();
  const b = id ? q.booking(id) : null;
  if (!b || b.booking_status !== 'PENDING' || (userId && b.user_id !== userId)) return null;
  if (parseDT(b.payment_deadline) <= now()) return null; // expired (the sweeper will mark it)
  return b;
}
export function discardCart() {
  const id = getCartId();
  if (id) releaseHold(id);
  clearCart();
}
export const remainingMs = (b) => (b && b.payment_deadline ? Math.max(0, parseDT(b.payment_deadline) - now()) : 0);
