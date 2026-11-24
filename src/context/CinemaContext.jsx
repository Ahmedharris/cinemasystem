import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  GENRES,
  MOVIES,
  CINEMAS,
  SCREENS,
  FOOD_ITEMS,
  SAMPLE_BOOKINGS,
  SCREEN_BASE_PRICE,
  SEAT_MULTIPLIER,
  generateInitialShows,
  getScreenSeats
} from '../data/initialData';

const CinemaContext = createContext(null);

export function CinemaProvider({ children }) {
  // Load state from localStorage with fallback to initial data
  const [genres, setGenres] = useState(() => {
    try {
      const saved = localStorage.getItem('cms_genres');
      return saved ? JSON.parse(saved) : GENRES;
    } catch { return GENRES; }
  });

  const [movies, setMovies] = useState(() => {
    try {
      const saved = localStorage.getItem('cms_movies');
      return saved ? JSON.parse(saved) : MOVIES;
    } catch { return MOVIES; }
  });

  const [cinemas, setCinemas] = useState(() => {
    try {
      const saved = localStorage.getItem('cms_cinemas');
      return saved ? JSON.parse(saved) : CINEMAS;
    } catch { return CINEMAS; }
  });

  const [screens, setScreens] = useState(() => {
    try {
      const saved = localStorage.getItem('cms_screens');
      return saved ? JSON.parse(saved) : SCREENS;
    } catch { return SCREENS; }
  });

  const [shows, setShows] = useState(() => {
    try {
      const saved = localStorage.getItem('cms_shows');
      return saved ? JSON.parse(saved) : generateInitialShows();
    } catch { return generateInitialShows(); }
  });

  const [foodItems, setFoodItems] = useState(() => {
    try {
      const saved = localStorage.getItem('cms_food');
      return saved ? JSON.parse(saved) : FOOD_ITEMS;
    } catch { return FOOD_ITEMS; }
  });

  const [bookings, setBookings] = useState(() => {
    try {
      const saved = localStorage.getItem('cms_bookings');
      return saved ? JSON.parse(saved) : SAMPLE_BOOKINGS;
    } catch { return SAMPLE_BOOKINGS; }
  });

  // Sync to localStorage
  useEffect(() => { localStorage.setItem('cms_genres', JSON.stringify(genres)); }, [genres]);
  useEffect(() => { localStorage.setItem('cms_movies', JSON.stringify(movies)); }, [movies]);
  useEffect(() => { localStorage.setItem('cms_cinemas', JSON.stringify(cinemas)); }, [cinemas]);
  useEffect(() => { localStorage.setItem('cms_screens', JSON.stringify(screens)); }, [screens]);
  useEffect(() => { localStorage.setItem('cms_shows', JSON.stringify(shows)); }, [shows]);
  useEffect(() => { localStorage.setItem('cms_food', JSON.stringify(foodItems)); }, [foodItems]);
  useEffect(() => { localStorage.setItem('cms_bookings', JSON.stringify(bookings)); }, [bookings]);

  // Lookup helpers
  const getMovieById = (id) => movies.find(m => String(m.id) === String(id));
  const getCinemaById = (id) => cinemas.find(c => String(c.id) === String(id));
  const getScreenById = (id) => screens.find(s => String(s.id) === String(id));
  const getShowById = (id) => shows.find(s => String(s.id) === String(id));
  const getGenreById = (id) => genres.find(g => String(g.id) === String(id));
  const getFoodById = (id) => foodItems.find(f => String(f.id) === String(id));

  // Seat pricing calculation
  const calculateSeatPrice = (show, seatType) => {
    if (!show) return 800;
    const base = show.basePrice || 800;
    const mult = SEAT_MULTIPLIER[seatType] || 1;
    return Math.round((base * mult) / 10) * 10;
  };

  // Occupied seats computation for a show
  const getOccupiedSeats = (showId) => {
    const show = getShowById(showId);
    if (!show) return [];
    const screen = getScreenById(show.screenId);
    if (!screen) return [];
    const allSeats = getScreenSeats(screen);

    // Seeded deterministic taken seats
    const taken = [];
    allSeats.forEach((s, i) => {
      const x = Math.sin(Number(showId) * 97 + i * 13.37) * 10000;
      if ((x - Math.floor(x)) < 0.22) {
        taken.push(s.id);
      }
    });

    // Plus actual confirmed or pending bookings
    bookings.forEach(b => {
      if (String(b.showId) === String(showId) && (b.status === 'CONFIRMED' || b.status === 'PENDING')) {
        b.seats.forEach(s => {
          if (!taken.includes(s.id)) taken.push(s.id);
        });
      }
    });

    return taken;
  };

  // Movie actions
  const addMovie = (movieData) => {
    const newId = movies.length ? Math.max(...movies.map(m => Number(m.id))) + 1 : 1;
    const newMovie = {
      id: newId,
      colors: ['#1e1b4b', '#312e81'],
      emoji: '🎬',
      poster: movieData.poster || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80',
      backdrop: movieData.backdrop || 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1600&q=80',
      ...movieData
    };
    setMovies(prev => [newMovie, ...prev]);
    return newMovie;
  };

  const updateMovie = (id, updated) => {
    setMovies(prev => prev.map(m => String(m.id) === String(id) ? { ...m, ...updated } : m));
  };

  const deleteMovie = (id) => {
    const hasShows = shows.some(s => String(s.movieId) === String(id) && s.status !== 'CANCELLED');
    if (hasShows) {
      // Soft-archive if active shows exist (matching DB Foreign Key constraints)
      updateMovie(id, { status: 'ARCHIVED' });
      return { success: false, archived: true, message: 'Movie has scheduled shows. It has been moved to ARCHIVED status instead.' };
    }
    setMovies(prev => prev.filter(m => String(m.id) !== String(id)));
    return { success: true, message: 'Movie deleted successfully.' };
  };

  // Genre actions
  const addGenre = (name) => {
    if (genres.some(g => g.name.toLowerCase() === name.trim().toLowerCase())) {
      return { success: false, message: 'Genre already exists.' };
    }
    const newGenre = { id: genres.length ? Math.max(...genres.map(g => g.id)) + 1 : 1, name: name.trim() };
    setGenres(prev => [...prev, newGenre]);
    return { success: true, genre: newGenre };
  };

  // Shows scheduling & clash detection
  const timeToMinutes = (t) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  const addShow = ({ movieId, screenId, date, start, basePrice }) => {
    const movie = getMovieById(movieId);
    if (!movie) return { success: false, message: 'Invalid movie selected.' };

    const startMin = timeToMinutes(start);
    const endMin = startMin + movie.duration + 15; // 15 min intermission & cleaning buffer
    const end = `${String(Math.floor(endMin / 60) % 24).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`;

    // Overlap conflict detection
    const conflict = shows.find(s => {
      if (String(s.screenId) !== String(screenId) || s.date !== date || s.status === 'CANCELLED') return false;
      const sStart = timeToMinutes(s.start);
      const sEnd = timeToMinutes(s.end);
      return startMin < sEnd && endMin > sStart;
    });

    if (conflict) {
      return {
        success: false,
        message: `Scheduling collision! Screen already booked for show #${conflict.id} (${conflict.start} – ${conflict.end}).`
      };
    }

    const newShow = {
      id: shows.length ? Math.max(...shows.map(s => Number(s.id))) + 1 : 1,
      movieId: Number(movieId),
      screenId: Number(screenId),
      date,
      start,
      end,
      basePrice: Number(basePrice),
      status: 'SCHEDULED'
    };

    setShows(prev => [newShow, ...prev]);
    return { success: true, show: newShow };
  };

  const cancelShow = (showId) => {
    setShows(prev => prev.map(s => String(s.id) === String(showId) ? { ...s, status: 'CANCELLED' } : s));
  };

  // Cinema & Screen actions
  const addCinema = (cinemaData) => {
    const newCinema = {
      id: cinemas.length ? Math.max(...cinemas.map(c => Number(c.id))) + 1 : 1,
      amenities: ['Dolby Atmos', '4K Laser', 'Express Concessions'],
      image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80',
      ...cinemaData
    };
    setCinemas(prev => [...prev, newCinema]);
    return newCinema;
  };

  const addScreen = (screenData) => {
    const newScreen = {
      id: screens.length ? Math.max(...screens.map(s => Number(s.id))) + 1 : 1,
      ...screenData,
      rows: Number(screenData.rows) || 8,
      cols: Number(screenData.cols) || 12
    };
    setScreens(prev => [...prev, newScreen]);
    return newScreen;
  };

  // Food Items actions
  const addFoodItem = (item) => {
    const newItem = {
      id: foodItems.length ? Math.max(...foodItems.map(f => Number(f.id))) + 1 : 1,
      available: true,
      ...item,
      price: Number(item.price)
    };
    setFoodItems(prev => [...prev, newItem]);
    return newItem;
  };

  const updateFoodItem = (id, updated) => {
    setFoodItems(prev => prev.map(f => String(f.id) === String(id) ? { ...f, ...updated } : f));
  };

  const deleteFoodItem = (id) => {
    setFoodItems(prev => prev.filter(f => String(f.id) !== String(id)));
  };

  const toggleFoodAvailability = (id) => {
    setFoodItems(prev => prev.map(f => String(f.id) === String(id) ? { ...f, available: !f.available } : f));
  };

  // Bookings & Transactions
  const createBooking = (bookingData) => {
    const newId = `BK-${1000 + bookings.length + 1}`;
    const newBooking = {
      id: newId,
      time: new Date().toISOString().replace('T', ' ').slice(0, 16),
      status: 'CONFIRMED',
      ...bookingData
    };
    setBookings(prev => [newBooking, ...prev]);
    return newBooking;
  };

  const cancelBooking = (bookingId) => {
    setBookings(prev => prev.map(b => {
      if (b.id === bookingId) {
        return {
          ...b,
          status: 'CANCELLED',
          payment: { ...b.payment, status: 'REFUNDED' }
        };
      }
      return b;
    }));
  };

  const resetToDemoData = () => {
    setGenres(GENRES);
    setMovies(MOVIES);
    setCinemas(CINEMAS);
    setScreens(SCREENS);
    setShows(generateInitialShows());
    setFoodItems(FOOD_ITEMS);
    setBookings(SAMPLE_BOOKINGS);
    localStorage.clear();
  };

  return (
    <CinemaContext.Provider
      value={{
        genres,
        movies,
        cinemas,
        screens,
        shows,
        foodItems,
        bookings,
        getMovieById,
        getCinemaById,
        getScreenById,
        getShowById,
        getGenreById,
        getFoodById,
        calculateSeatPrice,
        getOccupiedSeats,
        addMovie,
        updateMovie,
        deleteMovie,
        addGenre,
        addShow,
        cancelShow,
        addCinema,
        addScreen,
        addFoodItem,
        updateFoodItem,
        deleteFoodItem,
        toggleFoodAvailability,
        createBooking,
        cancelBooking,
        resetToDemoData
      }}
    >
      {children}
    </CinemaContext.Provider>
  );
}

export function useCinema() {
  const context = useContext(CinemaContext);
  if (!context) {
    throw new Error('useCinema must be used within a CinemaProvider');
  }
  return context;
}
