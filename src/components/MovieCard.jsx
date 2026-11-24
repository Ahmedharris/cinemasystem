import { Link, useNavigate } from 'react-router-dom';
import { Play, Star, Ticket, Bell } from 'lucide-react';
import Poster from './Poster';
import { Badge } from './ui/Misc';
import { q } from '../lib/db';
import { dateMed, fmtDuration } from '../lib/format';

export default function MovieCard({ movie, onTrailer, onRemind }) {
  const nav = useNavigate();
  const rating = q.ratingOf(movie.movie_id);
  const genres = q.genresOf(movie.movie_id);
  const soon = movie.movie_status === 'COMING_SOON';
  return (
    <div className="movie-card">
      <div className="cursor-pointer" onClick={() => nav(`/movie/${movie.movie_id}`)}>
        <Poster movie={movie}>
          <div className="absolute top-2.5 left-2.5 z-[2]"><Badge tone="muted" className="!bg-black/55 backdrop-blur !text-white !border-white/20">{movie.content_rating}</Badge></div>
          {rating.count > 0 && (
            <div className="absolute top-2.5 right-2.5 z-[2] flex items-center gap-1 bg-black/60 backdrop-blur rounded-full px-2 py-0.5 text-xs font-bold">
              <Star size={12} className="text-gold fill-gold" /> {rating.avg.toFixed(1)}
            </div>
          )}
          <div className="poster-overlay">
            {!soon ? (
              <Link to={`/movie/${movie.movie_id}`} className="btn btn-primary btn-sm" onClick={(e) => e.stopPropagation()}><Ticket size={15} /> Book now</Link>
            ) : (
              <button className="btn btn-primary btn-sm" onClick={(e) => { e.stopPropagation(); onRemind && onRemind(movie); }}><Bell size={15} /> Remind me</button>
            )}
            <button className="btn btn-outline btn-sm !bg-black/40" onClick={(e) => { e.stopPropagation(); onTrailer && onTrailer(movie); }}><Play size={14} /> Trailer</button>
          </div>
        </Poster>
      </div>
      <div className="mt-3 px-0.5">
        <Link to={`/movie/${movie.movie_id}`} className="font-semibold leading-snug hover:text-gold transition-colors line-clamp-1 block">{movie.title}</Link>
        <div className="text-xs text-fg2 mt-1 truncate">{genres.map((g) => g.genre_name).join(' · ')}</div>
        <div className="text-xs text-fg3 mt-0.5">
          {soon ? <>Releases {dateMed(movie.release_date)}</> : <>{fmtDuration(movie.duration_minutes)} · {movie.language}</>}
        </div>
      </div>
    </div>
  );
}
