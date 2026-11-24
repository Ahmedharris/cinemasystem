import { useEffect, useState, useSyncExternalStore } from 'react';
import { subscribe, getVersion, now } from '../lib/db';

/** Re-render the calling component whenever the database changes. */
export const useDb = () => useSyncExternalStore(subscribe, getVersion);

/** A ticking Date (default every second). */
export function useNow(ms = 1000) {
  const [t, setT] = useState(() => now());
  useEffect(() => {
    const id = setInterval(() => setT(now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return t;
}

/** Remaining milliseconds until a "YYYY-MM-DD HH:mm:ss" deadline. */
export function useCountdown(deadlineMs) {
  const t = useNow(1000);
  if (deadlineMs == null) return 0;
  return Math.max(0, deadlineMs - t.getTime());
}
export const fmtClock = (ms) => {
  const s = Math.ceil(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

/** localStorage-backed state */
export function useStored(key, initial) {
  const [v, setV] = useState(() => {
    try { const raw = localStorage.getItem(key); return raw != null ? JSON.parse(raw) : initial; } catch { return initial; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* ignore */ } }, [key, v]);
  return [v, setV];
}

export function useDocumentTitle(title) {
  useEffect(() => { document.title = title ? `${title} · CineMax` : 'CineMax - Cinema Booking'; }, [title]);
}
