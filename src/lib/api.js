/* Thin client for the Laravel REST API (backend/routes/api.php).
   Base URL: VITE_API_URL, default http://localhost:8000/api  (php artisan serve). */
import { appError, auth } from './db';
import { getToken, clearToken } from './token';

export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/$/, '');

async function request(method, path, body) {
  const token = getToken();
  let res;
  try {
    res = await fetch(API_URL + path, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
  } catch {
    const e = appError('Cannot reach the server. Start the backend (php artisan serve in the backend folder) and try again.');
    e.status = 0;
    throw e;
  }
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const e = appError((json && json.message) || `Something went wrong (${res.status}).`);
    e.status = res.status;
    e.errors = (json && json.errors) || {};
    // A signed-in user whose token is no longer accepted (expired, password changed, suspended) is signed out.
    if (res.status === 401 && token) { clearToken(); auth.endSession(); }
    throw e;
  }
  return json;
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body = {}) => request('POST', path, body),
  put: (path, body = {}) => request('PUT', path, body),
  del: (path) => request('DELETE', path)
};

/** Laravel validation errors -> { field: 'first message' } */
export const fieldErrors = (err) => Object.fromEntries(Object.entries(err.errors || {}).map(([k, v]) => [k, v[0]]));
