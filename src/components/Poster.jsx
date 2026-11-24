import { useState } from 'react';

/* Generated poster artwork (no image files needed - works offline).
   If a movie has a real poster_url it is used instead. */
const INVADER = ['00100000100', '00010001000', '00111111100', '01101110110', '11111111111', '10111111101', '10100000101', '00011011000'];
const STARS = [[22, 30], [60, 12], [150, 24], [178, 70], [30, 96], [170, 130], [12, 150], [140, 8], [92, 40], [188, 18], [48, 70], [120, 60]];

const MOTIFS = {
  city: (
    <g>
      <polygon points="100,0 128,0 176,205 52,205" fill="#fff" opacity=".07" />
      <circle cx="150" cy="78" r="30" fill="#fff" opacity=".14" />
      {[[8, 170, 26, 130], [36, 140, 24, 160], [62, 180, 22, 120], [86, 120, 30, 180], [120, 160, 24, 140], [146, 130, 28, 170], [176, 175, 24, 125]].map(([x, y, w, h], i) => (
        <g key={i}><rect x={x} y={y} width={w} height={h} fill="#05060d" opacity=".72" />
          {[0, 1, 2, 3].map((r) => <rect key={r} x={x + 5} y={y + 10 + r * 18} width="4" height="5" fill="#fbbf24" opacity={(i + r) % 3 ? 0.7 : 0.15} />)}</g>
      ))}
    </g>
  ),
  comedy: (
    <g>
      <circle cx="100" cy="112" r="64" fill="#fde047" opacity=".95" />
      <circle cx="78" cy="96" r="8" fill="#422006" /><circle cx="122" cy="96" r="8" fill="#422006" />
      <path d="M62 126 Q100 172 138 126 Z" fill="#422006" /><path d="M72 134 Q100 152 128 134" stroke="#fff" strokeWidth="5" fill="none" opacity=".85" />
      {[[26, 40], [176, 52], [32, 190], [172, 180]].map(([x, y], i) => (
        <path key={i} d={`M${x} ${y - 9} L${x + 3} ${y - 3} L${x + 9} ${y} L${x + 3} ${y + 3} L${x} ${y + 9} L${x - 3} ${y + 3} L${x - 9} ${y} L${x - 3} ${y - 3} Z`} fill="#fff" opacity=".6" />
      ))}
    </g>
  ),
  space: (
    <g>
      {STARS.map(([x, y], i) => <circle key={i} cx={x} cy={y * 1.6} r={i % 3 ? 1.4 : 2.2} fill="#fff" opacity={0.4 + (i % 4) * 0.15} />)}
      <circle cx="118" cy="112" r="50" fill="#93c5fd" opacity=".2" /><circle cx="118" cy="112" r="40" fill="#1d4ed8" opacity=".55" />
      <ellipse cx="118" cy="112" rx="78" ry="16" fill="none" stroke="#bfdbfe" strokeWidth="3" opacity=".5" transform="rotate(-18 118 112)" />
      <circle cx="46" cy="190" r="10" fill="#fff" opacity=".85" /><circle cx="46" cy="190" r="22" fill="none" stroke="#fff" strokeWidth="1" opacity=".3" />
    </g>
  ),
  house: (
    <g>
      <circle cx="150" cy="55" r="26" fill="#fef9c3" opacity=".9" /><circle cx="160" cy="48" r="24" fill="#18181b" opacity=".35" />
      <polygon points="100,98 36,152 164,152" fill="#050507" opacity=".85" /><rect x="48" y="152" width="104" height="84" fill="#050507" opacity=".85" />
      <rect x="88" y="176" width="26" height="30" fill="#fbbf24" opacity=".85" /><rect x="58" y="168" width="16" height="20" fill="#fbbf24" opacity=".25" />
      <ellipse cx="60" cy="238" rx="90" ry="18" fill="#a1a1aa" opacity=".18" /><ellipse cx="150" cy="252" rx="80" ry="14" fill="#a1a1aa" opacity=".14" />
    </g>
  ),
  letters: (
    <g>
      {Array.from({ length: 14 }, (_, i) => <line key={i} x1={10 + i * 14} y1={0} x2={-10 + i * 14} y2={300} stroke="#fff" strokeWidth="1" opacity=".18" />)}
      <rect x="44" y="96" width="112" height="76" rx="6" fill="#fff" opacity=".92" /><polyline points="44,96 100,142 156,96" fill="none" stroke="#0f766e" strokeWidth="5" />
      <path d="M100 168 c-14 -12 -22 -20 -22 -29 a12 12 0 0 1 22 -6 a12 12 0 0 1 22 6 c0 9 -8 17 -22 29z" fill="#e11d48" transform="translate(0 -3) scale(.8) translate(25 40)" />
    </g>
  ),
  arcade: (
    <g>
      {INVADER.map((row, y) => row.split('').map((c, x) => c === '1' && <rect key={`${x}-${y}`} x={45 + x * 10} y={84 + y * 10} width="9" height="9" fill="#f0abfc" />))}
      {[0, 1, 2].map((i) => <rect key={i} x={30 + i * 56} y={206} width="30" height="6" fill="#fff" opacity=".4" />)}
      <circle cx="30" cy="40" r="3" fill="#fff" /><circle cx="170" cy="60" r="3" fill="#fff" /><circle cx="150" cy="30" r="2" fill="#fff" />
    </g>
  ),
  blades: (
    <g>
      <circle cx="100" cy="125" r="70" fill="#f59e0b" opacity=".22" />
      <line x1="46" y1="52" x2="154" y2="204" stroke="#e5e7eb" strokeWidth="7" strokeLinecap="round" /><line x1="154" y1="52" x2="46" y2="204" stroke="#e5e7eb" strokeWidth="7" strokeLinecap="round" />
      <line x1="62" y1="150" x2="92" y2="130" stroke="#f59e0b" strokeWidth="6" strokeLinecap="round" /><line x1="138" y1="150" x2="108" y2="130" stroke="#f59e0b" strokeWidth="6" strokeLinecap="round" />
      <circle cx="100" cy="128" r="9" fill="#dc2626" />
    </g>
  ),
  train: (
    <g>
      <polygon points="100,112 10,300 190,300" fill="#000" opacity=".35" />
      <line x1="94" y1="112" x2="30" y2="300" stroke="#e5e7eb" strokeWidth="3" opacity=".8" /><line x1="106" y1="112" x2="170" y2="300" stroke="#e5e7eb" strokeWidth="3" opacity=".8" />
      {[130, 160, 200, 250].map((y, i) => <line key={y} x1={100 - (y - 112) * 0.36 - 6 - i} y1={y} x2={100 + (y - 112) * 0.36 + 6 + i} y2={y} stroke="#78350f" strokeWidth={2 + i} opacity=".8" />)}
      <circle cx="100" cy="108" r="30" fill="#fde68a" opacity=".25" /><circle cx="100" cy="108" r="12" fill="#fff7d6" />
    </g>
  ),
  heist: (
    <g>
      {[70, 100, 130, 160, 190].map((y, i) => <line key={y} x1="0" y1={y + (i % 2) * 6} x2="200" y2={y - (i % 2) * 6} stroke="#fb7185" strokeWidth="1.5" opacity=".55" />)}
      <polygon points="100,70 148,104 100,170 52,104" fill="#fff" opacity=".18" stroke="#fff" strokeWidth="2" />
      <polyline points="52,104 148,104" stroke="#fff" strokeWidth="1.5" opacity=".7" /><polyline points="100,70 80,104 100,170 120,104 100,70" fill="none" stroke="#fff" strokeWidth="1.5" opacity=".7" />
    </g>
  )
};

export function PosterArt({ movie, wide = false, className = '' }) {
  const art = movie.art || { motif: 'city', c1: '#1e293b', c2: '#0f172a' };
  const id = `g${movie.movie_id}${wide ? 'w' : 'p'}`;
  return (
    <svg className={`art ${className}`} viewBox={wide ? '0 0 200 300' : '0 0 200 300'} preserveAspectRatio={wide ? 'xMaxYMid meet' : 'xMidYMid slice'} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={art.c1} /><stop offset="1" stopColor={art.c2} /></linearGradient>
      </defs>
      {!wide && <rect width="200" height="300" fill={`url(#${id})`} />}
      {MOTIFS[art.motif]}
    </svg>
  );
}

/** Backdrop used by hero banners and trailers. */
export function Backdrop({ movie, className = '' }) {
  const art = movie.art || { c1: '#1e293b', c2: '#0f172a' };
  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`} style={{ background: `linear-gradient(120deg, ${art.c1}, ${art.c2})` }}>
      <PosterArt movie={movie} wide className="absolute inset-0 w-full h-full opacity-90" />
    </div>
  );
}

export default function Poster({ movie, showTitle = true, className = '', children }) {
  const [broken, setBroken] = useState(false);
  const real = movie.poster_url && !broken;
  return (
    <div className={`poster ${className}`}>
      {real ? <img src={movie.poster_url} alt={movie.title} onError={() => setBroken(true)} loading="lazy" /> : <PosterArt movie={movie} />}
      {showTitle && !real && <div className="poster-title text-lg">{movie.title}</div>}
      {children}
    </div>
  );
}
