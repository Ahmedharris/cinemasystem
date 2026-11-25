/* The API sign-in token (issued by the Laravel backend) lives in localStorage. */
const KEY = 'cinemax_token';

export const getToken = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
export const setToken = (token) => { try { localStorage.setItem(KEY, token); } catch { /* storage unavailable */ } };
export const clearToken = () => { try { localStorage.removeItem(KEY); } catch { /* ignore */ } };
