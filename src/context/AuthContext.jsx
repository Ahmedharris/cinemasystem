import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../lib/db';
import { api } from '../lib/api';
import { getToken, setToken, clearToken } from '../lib/token';
import { discardCart } from '../lib/cart';
import { useDb } from '../hooks/useDb';
import { Spinner } from '../components/ui/Misc';

const Ctx = createContext(null);

/** Signing in, registering and the profile are handled by the Laravel API (module 1: Users & Security). */
export function AuthProvider({ children }) {
  useDb(); // re-render when the session or profile changes
  // With a stored token, ask the server who we are before showing the app.
  const [ready, setReady] = useState(() => !getToken());

  useEffect(() => {
    if (!getToken()) return undefined;
    let alive = true;
    api.get('/auth/me')
      .then(({ user }) => { if (alive) auth.startSession(user); })
      .catch((err) => { if (err.status === 401) { clearToken(); auth.endSession(); } /* server offline: keep the local session */ })
      .finally(() => { if (alive) setReady(true); });
    return () => { alive = false; };
  }, []);

  const user = getToken() ? auth.current() : null;

  const startFrom = ({ token, user: u }) => { setToken(token); return auth.startSession(u); };
  const value = {
    user,
    isStaff: !!user && user.role !== 'CUSTOMER',
    isAdmin: !!user && user.role === 'ADMIN',
    /** cinema_id the staff member is limited to (null = all cinemas) */
    cinemaScope: user && user.role !== 'ADMIN' && user.role !== 'CUSTOMER' ? user.cinema_id : null,
    login: async (email, password) => startFrom(await api.post('/auth/login', { email, password })),
    register: async ({ full_name, email, phone, password }) => startFrom(await api.post('/auth/register', { full_name, email, phone: phone || null, password })),
    logout: () => {
      discardCart();
      api.post('/auth/logout').catch(() => {});
      clearToken();
      auth.endSession();
    },
    updateProfile: async ({ full_name, phone }) => auth.mirror((await api.put('/auth/profile', { full_name, phone: phone || null })).user),
    changePassword: async (current_password, new_password) => startFrom(await api.put('/auth/password', { current_password, new_password }))
  };

  if (!ready) return <div className="min-h-screen flex items-center justify-center text-fg2"><Spinner className="mr-3" /> Loading…</div>;
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export const useAuth = () => useContext(Ctx);
