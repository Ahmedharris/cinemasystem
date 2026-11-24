import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Globe, Star, Ticket } from 'lucide-react';
import { useCinema } from '../context/CinemaContext';

export default function MovieCard({ movie }) {
  const { genres } = useCinema();

  const movieGenres = movie.genres
    ? movie.genres.map(gid => genres.find(g => g.id === gid)?.name).filter(Boolean)
    : [];

  const formatDuration = (mins) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  const isNowShowing = movie.status === 'NOW_SHOWING';

  return (
    <div className="group relative bg-[#111726] border border-[#23304a] rounded-2xl overflow-hidden hover:border-amber-400/50 hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-300 flex flex-col">
      {/* Poster Image Container */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-900">
        {movie.poster ? (
          <img
            src={movie.poster}
            alt={movie.title}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div
            className="w-full h-full flex flex-col items-center justify-center p-6 text-center"
            style={{
              background: `linear-gradient(135deg, ${movie.colors?.[0] || '#1e1b4b'}, ${movie.colors?.[1] || '#0f172a'})`
            }}
          >
            <span className="text-5xl mb-2">{movie.emoji || '🎬'}</span>
            <span className="font-bold text-lg text-white font-['Space_Grotesk']">{movie.title}</span>
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#111726] via-transparent to-black/40" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <span className="bg-black/70 backdrop-blur-md text-amber-400 border border-amber-400/30 text-[11px] font-bold px-2.5 py-1 rounded-lg">
            {movie.rating}
          </span>
          <span
            className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
              isNowShowing
                ? 'bg-emerald-500/90 text-black shadow-lg shadow-emerald-500/30'
                : 'bg-amber-500/90 text-black shadow-lg shadow-amber-500/30'
            }`}
          >
            {movie.status === 'NOW_SHOWING' ? 'Now Showing' : 'Coming Soon'}
          </span>
        </div>

        {/* Hover Quick Action Button */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
          <Link
            to={`/movie/${movie.id}`}
            className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-sm shadow-xl shadow-amber-500/30 transform translate-y-3 group-hover:translate-y-0 transition-transform"
          >
            <Ticket className="w-4 h-4" />
            {isNowShowing ? 'Book Tickets' : 'View Details'}
          </Link>
        </div>
      </div>

      {/* Details Footer */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div>
          <h3 className="font-bold text-white text-base leading-snug group-hover:text-amber-400 transition-colors line-clamp-1">
            {movie.title}
          </h3>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              {formatDuration(movie.duration)}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              {movie.language}
            </span>
          </div>
        </div>

        {/* Genres */}
        <div className="flex flex-wrap gap-1.5 pt-1 border-t border-[#23304a]">
          {movieGenres.slice(0, 3).map((g, idx) => (
            <span key={idx} className="bg-slate-800/80 text-slate-300 text-[10px] font-medium px-2 py-0.5 rounded-md">
              {g}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
