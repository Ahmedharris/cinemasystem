import { useEffect, useState } from 'react';
import { Pause, Play, Volume2, Maximize2 } from 'lucide-react';
import Modal from './ui/Modal';
import { Backdrop } from './Poster';
import { fmtDuration } from '../lib/format';

/* The demo has no video files, so this is an animated placeholder player. */
export default function TrailerModal({ movie, onClose }) {
  const [playing, setPlaying] = useState(true);
  const [pos, setPos] = useState(0);
  const total = 138;
  useEffect(() => { setPos(0); setPlaying(true); }, [movie]);
  useEffect(() => {
    if (!movie || !playing) return undefined;
    const id = setInterval(() => setPos((p) => (p >= total ? total : p + 1)), 1000);
    return () => clearInterval(id);
  }, [movie, playing]);
  if (!movie) return null;
  const mm = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  return (
    <Modal open onClose={onClose} size="lg" title={`${movie.title} — Official trailer`}>
      <div className="relative aspect-video rounded-xl overflow-hidden border border-line bg-black">
        <Backdrop movie={movie} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/40" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <div className="font-display text-3xl sm:text-4xl font-bold drop-shadow-lg">{movie.title}</div>
          <div className="text-sm text-white/70 mt-2">{movie.content_rating} · {fmtDuration(movie.duration_minutes)} · {movie.language}</div>
          <button className="mt-5 w-16 h-16 rounded-full bg-gold/95 text-[#17110a] flex items-center justify-center shadow-xl hover:scale-105 transition-transform" onClick={() => setPlaying(!playing)} aria-label={playing ? 'Pause' : 'Play'}>
            {playing ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
          </button>
          <div className="mt-4 text-xs text-white/60">Demo preview — the real trailer will stream from <span className="font-mono">{movie.trailer_url.replace('https://', '')}</span></div>
        </div>
        <div className="absolute inset-x-0 bottom-0 p-4 flex items-center gap-3 text-xs">
          <span>{mm(pos)}</span>
          <div className="flex-1 h-1.5 rounded-full bg-white/20 overflow-hidden"><div className="h-full bg-gold" style={{ width: `${(pos / total) * 100}%` }} /></div>
          <span>{mm(total)}</span><Volume2 size={16} /><Maximize2 size={16} />
        </div>
      </div>
      <p className="text-sm text-fg2 mt-4 leading-relaxed">{movie.synopsis}</p>
    </Modal>
  );
}
