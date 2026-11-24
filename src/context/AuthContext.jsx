import { createContext, useContext } from 'react';
import { auth } from '../lib/db';
import { discardCart } from '../lib/cart';
import { useDb } from '../hooks/useDb';

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  useDb(); // re-render when the session or profile changes
  const user = auth.current();
  const value = {
    user,
    isStaff: !!user && user.role !== 'CUSTOMER',
    isAdmin: !!user && user.role === 'ADMIN',
    /** cinema_id the staff member is limited to (null = all cinemas) */
    cinemaScope: user && user.role !== 'ADMIN' && user.role !== 'CUSTOMER' ? user.cinema_id : null,
    login: auth.login,
    register: auth.register,
    logout: () => { discardCart(); auth.logout(); },
    updateProfile: (data) => auth.updateProfile(user.user_id, data),
    changePassword: (cur, next) => auth.changePassword(user.user_id, cur, next)
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export const useAuth = () => useContext(Ctx);
