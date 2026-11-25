/**
 * QISSA Frontend API Client
 * Connects React frontend components to PHP/MySQL backend endpoints in /api/
 */

const getApiBase = () => {
  // If hosted in XAMPP subdirectory (e.g. http://localhost/cinemasystem/ or http://localhost/cinemasystem/dist/)
  if (window.location.pathname.includes('/cinemasystem/')) {
    return '/cinemasystem/api';
  }
  // If running on Vite dev server proxy or root
  return '/cinemasystem/api';
};

const API_BASE = getApiBase();

/**
 * Common request wrapper with JSON serialization and robust error handling
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers
    }
  };

  try {
    const response = await fetch(url, config);
    const result = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg = result?.error || result?.message || `HTTP error ${response.status}: ${response.statusText}`;
      const err = new Error(errorMsg);
      err.status = response.status;
      err.details = result?.details;
      throw err;
    }

    return result?.data !== undefined ? result.data : result;
  } catch (error) {
    console.error(`API Request to ${endpoint} failed:`, error);
    throw error;
  }
}

/**
 * Screen Entity API
 */
export const screensApi = {
  // GET all screens with optional filters: ?cinema_id=X&type=IMAX&status=ACTIVE
  async getAll(params = {}) {
    const query = new URLSearchParams();
    if (params.cinema_id) query.append('cinema_id', params.cinema_id);
    if (params.type) query.append('type', params.type);
    if (params.status) query.append('status', params.status);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request(`/screens.php${qs}`);
  },

  // GET single screen with full seat layout
  async getById(id) {
    return request(`/screens.php?id=${encodeURIComponent(id)}`);
  },

  // POST create a new screen (auto-generates seats)
  async create(screenData) {
    return request('/screens.php', {
      method: 'POST',
      body: JSON.stringify({
        cinema_id: Number(screenData.cinemaId || screenData.cinema_id),
        screen_name: screenData.name || screenData.screen_name,
        screen_type: (screenData.type || screenData.screen_type || 'STANDARD').toUpperCase(),
        screen_status: (screenData.status || screenData.screen_status || 'ACTIVE').toUpperCase(),
        rows_count: Number(screenData.rows || screenData.rows_count || 8),
        columns_count: Number(screenData.cols || screenData.columns_count || 12)
      })
    });
  },

  // PUT update screen metadata or status
  async update(id, screenData) {
    return request(`/screens.php?id=${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify({
        cinema_id: screenData.cinemaId || screenData.cinema_id,
        screen_name: screenData.name || screenData.screen_name,
        screen_type: screenData.type || screenData.screen_type,
        screen_status: screenData.status || screenData.screen_status,
        rows_count: screenData.rows || screenData.rows_count,
        columns_count: screenData.cols || screenData.columns_count
      })
    });
  },

  // PUT update individual seat layout in MySQL
  async saveSeatLayout(screenId, changes) {
    return request(`/screens.php?action=seats&id=${encodeURIComponent(screenId)}`, {
      method: 'PUT',
      body: JSON.stringify({ changes })
    });
  },

  // DELETE screen and associated seats
  async delete(id) {
    return request(`/screens.php?id=${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
  }
};

/**
 * Cinema Entity API
 */
export const cinemasApi = {
  async getAll() {
    return request('/cinemas.php');
  },

  async getById(id) {
    return request(`/cinemas.php?id=${encodeURIComponent(id)}`);
  }
};
