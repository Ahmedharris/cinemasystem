import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Clock,
  Globe,
  Calendar,
  Film,
  Play,
  MapPin,
  Sparkles,
  ArrowLeft,
  X,
  Building2,
  Tv
} from 'lucide-react';
import { useCinema } from '../context/CinemaContext';
import { CURRENCY } from '../data/initialData';

export default function MovieDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { movies, genres, cinemas, screens, shows } = useCinema();

  const [selectedCity, setSelectedCity] = useState('');
  const [trailerModalOpen, setTrailerModalOpen] = useState(false);

  const movie = movies.find(m => String(m.id) === String(id)) || movies[0];

  const movieGenres = movie.genres
    ? movie.genres.map(gid => genres.find(g => g.id === gid)?.name).filter(Boolean)
    : [];

  const formatDuration = (mins) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  const cities = [...new Set(cinemas.map(c => c.city))];

  // Distinct dates for shows
  const movieShows = shows.filter(s => String(s.movieId) === String(movie.id) && s.status === 'SCHEDULED');
  const availableDates = [...new Set(movieShows.map(s => s.date))].sort();

  const [selectedDate, setSelectedDate] = useState(() => availableDates[0] || '');

  // Filter shows for selected date and city
  const filteredShows = movieShows.filter(s => {
    if (selectedDate && s.date !== selectedDate) return false;
    if (selectedCity) {
      const sc = screens.find(scr => scr.id === s.screenId);
      const c = cinemas.find(cin => cin.id === sc?.cinemaId);
      if (c?.city !== selectedCity) return false;
    }
    return true;
  });

  return (
    <div className="space-y-10">
      {/* Back button */}
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-amber-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Movies
        </Link>
      </div>

      {/* Movie Details Hero Banner */}
      <div className="relative bg-[#111726] border border-[#23304a] rounded-3xl overflow-hidden p-6 md:p-10 flex flex-col md:flex-row gap-8 shadow-2xl">
        {/* Poster Image */}
        <div className="w-full md:w-72 aspect-[2/3] shrink-0 rounded-2xl overflow-hidden shadow-2xl relative group bg-slate-900 border border-[#23304a]">
          {movie.poster ? (
            <img src={movie.poster} alt={movie.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
              <span className="text-6xl mb-2">{movie.emoji || '🎬'}</span>
              <span className="font-bold text-white">{movie.title}</span>
            </div>
          )}

          {/* Play Trailer Floating Button */}
          <button
            onClick={() => setTrailerModalOpen(true)}
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-2 font-bold text-xs"
          >
            <div className="w-12 h-12 rounded-full bg-amber-500 text-black flex items-center justify-center shadow-lg">
              <Play className="w-5 h-5 fill-black ml-0.5" />
            </div>
            Watch Trailer
          </button>
        </div>

        {/* Details Information */}
        <div className="space-y-5 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="bg-amber-400 text-black text-xs font-black px-2.5 py-1 rounded-lg">
              {movie.rating}
            </span>
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                movie.status === 'NOW_SHOWING' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}
            >
              {movie.status === 'NOW_SHOWING' ? 'Now Showing' : 'Coming Soon'}
            </span>
            {movieGenres.map((g, idx) => (
              <span key={idx} className="bg-slate-800 text-slate-300 text-xs px-2.5 py-1 rounded-lg border border-slate-700/60 font-medium">
                {g}
              </span>
            ))}
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold text-white font-['Space_Grotesk'] leading-tight">
            {movie.title}
          </h1>

          {/* Metadata Row */}
          <div className="flex flex-wrap items-center gap-6 text-xs text-slate-300 py-2 border-y border-[#23304a]">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span><strong>Runtime:</strong> {formatDuration(movie.duration)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-amber-400" />
              <span><strong>Language:</strong> {movie.language}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span><strong>Release Date:</strong> {new Date(movie.release).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
          </div>

          {/* Synopsis */}
          <div className="space-y-1.5">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Synopsis</h3>
            <p className="text-sm text-slate-300 leading-relaxed">{movie.synopsis}</p>
          </div>

          {/* Cast & Crew */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase block">Director</span>
              <span className="text-xs font-bold text-white">{movie.director || 'Marcus Vance'}</span>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase block">Starring Cast</span>
              <span className="text-xs font-bold text-slate-200">
                {movie.cast ? movie.cast.join(', ') : 'David Caine, Elena Rostova'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Showtimes Section */}
      <div className="space-y-6 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#23304a] pb-4">
          <div>
            <h2 className="text-2xl font-extrabold text-white font-['Space_Grotesk'] flex items-center gap-2.5">
              <Film className="w-6 h-6 text-amber-400" />
              Select Showtime & Branch
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Choose your cinema location and showtime to pick your seats.
            </p>
          </div>

          {/* City Filter */}
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-amber-400" />
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="bg-[#111726] border border-[#23304a] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
            >
              <option value="">All Cities</option>
              {cities.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {movie.status !== 'NOW_SHOWING' ? (
          <div className="bg-[#111726] border border-[#23304a] p-10 rounded-3xl text-center space-y-3">
            <Film className="w-12 h-12 text-amber-400/60 mx-auto" />
            <h3 className="text-lg font-bold text-white">Coming Soon to CineMax</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Advance ticket bookings will open 7 days prior to official release on {movie.release}. Stay tuned!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Date Pills Carousel */}
            {availableDates.length > 0 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
                {availableDates.map(d => {
                  const [y, m, dd] = d.split('-').map(Number);
                  const dateObj = new Date(y, m - 1, dd);
                  const isSelected = d === selectedDate;
                  return (
                    <button
                      key={d}
                      onClick={() => setSelectedDate(d)}
                      className={`flex flex-col items-center justify-center min-w-[80px] p-3 rounded-2xl border transition-all ${
                        isSelected
                          ? 'bg-amber-500 text-black border-amber-400 shadow-lg shadow-amber-500/25 font-bold scale-105'
                          : 'bg-[#111726] text-slate-300 border-[#23304a] hover:border-slate-600'
                      }`}
                    >
                      <span className="text-[11px] uppercase tracking-wider">
                        {dateObj.toLocaleDateString('en-GB', { weekday: 'short' })}
                      </span>
                      <span className="text-xl font-extrabold my-0.5">{dd}</span>
                      <span className="text-[10px] uppercase font-semibold">
                        {dateObj.toLocaleDateString('en-GB', { month: 'short' })}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Shows Grouped By Cinema Branch */}
            <div className="space-y-6">
              {cinemas
                .filter(c => !selectedCity || c.city === selectedCity)
                .map(cinema => {
                  // Find screens belonging to this cinema
                  const cinemaScreens = screens.filter(sc => sc.cinemaId === cinema.id);
                  // Find shows on these screens for selected date
                  const cinemaShows = filteredShows.filter(s =>
                    cinemaScreens.some(sc => sc.id === s.screenId)
                  );

                  if (!cinemaShows.length) return null;

                  return (
                    <div
                      key={cinema.id}
                      className="bg-[#111726] border border-[#23304a] rounded-2xl p-6 space-y-5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#23304a] pb-4">
                        <div>
                          <h3 className="text-base font-bold text-white flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-amber-400" />
                            {cinema.name}
                          </h3>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {cinema.address}, {cinema.city} • Contact: {cinema.contact}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {cinema.amenities?.map((a, i) => (
                            <span
                              key={i}
                              className="text-[10px] bg-slate-800/80 text-amber-300/80 px-2 py-0.5 rounded border border-slate-700/50"
                            >
                              {a}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Screen Rows */}
                      <div className="space-y-4">
                        {cinemaScreens.map(scr => {
                          const scrShows = cinemaShows.filter(s => s.screenId === scr.id);
                          if (!scrShows.length) return null;

                          return (
                            <div
                              key={scr.id}
                              className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-[#182238]/60 border border-[#23304a]"
                            >
                              <div className="min-w-[180px]">
                                <div className="font-bold text-sm text-white">{scr.name}</div>
                                <span className="inline-block mt-1 text-[10px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded">
                                  {scr.type} Experience
                                </span>
                              </div>

                              {/* Show Time Buttons */}
                              <div className="flex flex-wrap items-center gap-3">
                                {scrShows.map(show => (
                                  <Link
                                    key={show.id}
                                    to={`/book/seats/${show.id}`}
                                    className="group/btn bg-[#111726] hover:bg-amber-500 border border-[#23304a] hover:border-amber-400 px-4 py-2.5 rounded-xl transition-all flex flex-col items-center min-w-[90px] shadow-sm hover:shadow-lg hover:shadow-amber-500/20"
                                  >
                                    <span className="font-extrabold text-sm text-white group-hover/btn:text-black">
                                      {show.start}
                                    </span>
                                    <span className="text-[10px] text-amber-400 group-hover/btn:text-black/80 font-bold">
                                      {CURRENCY} {show.basePrice}
                                    </span>
                                  </Link>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

              {filteredShows.length === 0 && (
                <div className="p-8 text-center bg-[#111726]/40 border border-dashed border-[#23304a] rounded-2xl text-slate-400 text-xs">
                  No scheduled shows found for the chosen date or city. Please select another date.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Trailer Modal */}
      {trailerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#111726] border border-[#23304a] rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl animate-fade-in relative">
            <div className="p-4 border-b border-[#23304a] flex items-center justify-between">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Film className="w-4 h-4 text-amber-400" />
                Official Trailer — {movie.title}
              </h3>
              <button
                onClick={() => setTrailerModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="aspect-video bg-black flex items-center justify-center relative">
              {/* Simulated high quality cinema preview player */}
              <img
                src={movie.backdrop || movie.poster}
                alt="Trailer Preview"
                className="w-full h-full object-cover opacity-60"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-gradient-to-t from-black/80 via-transparent to-transparent">
                <div className="w-16 h-16 rounded-full bg-amber-500 text-black flex items-center justify-center shadow-2xl mb-3 animate-pulse">
                  <Play className="w-7 h-7 fill-black ml-1" />
                </div>
                <h4 className="text-lg font-bold text-white">{movie.title} (Official Theatrical Trailer)</h4>
                <p className="text-xs text-slate-300 mt-1 max-w-md">
                  In 4K Ultra HD &amp; Dolby Atmos Surround Sound. Experience exclusively on CineMax screens.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
