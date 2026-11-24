import { useMemo } from 'react';

/* Decorative QR-style code, derived from the text. A real QR encoder
   (or the PHP side) will replace this once the backend exists. */
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function matrix(text, n = 25) {
  let seed = hash(text) || 1;
  const rnd = () => { seed ^= seed << 13; seed >>>= 0; seed ^= seed >>> 17; seed ^= seed << 5; seed >>>= 0; return seed / 4294967296; };
  const m = Array.from({ length: n }, () => Array.from({ length: n }, () => rnd() > 0.52));
  const finder = (ox, oy) => {
    for (let y = -1; y <= 7; y++) for (let x = -1; x <= 7; x++) {
      const px = ox + x, py = oy + y;
      if (px < 0 || py < 0 || px >= n || py >= n) continue;
      const edge = x === 0 || x === 6 || y === 0 || y === 6;
      const core = x >= 2 && x <= 4 && y >= 2 && y <= 4;
      m[py][px] = x >= 0 && x <= 6 && y >= 0 && y <= 6 && (edge || core);
    }
  };
  finder(0, 0); finder(n - 7, 0); finder(0, n - 7);
  return m;
}

export default function QR({ value, size = 120, className = '', fg = '#0f1424', bg = '#ffffff' }) {
  const n = 25;
  const m = useMemo(() => matrix(value || '-', n), [value]);
  const rects = [];
  m.forEach((row, y) => row.forEach((on, x) => { if (on) rects.push(<rect key={`${x}-${y}`} x={x + 1} y={y + 1} width="1.02" height="1.02" fill={fg} />); }));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${n + 2} ${n + 2}`} className={className} role="img" aria-label={`QR code ${value}`} shapeRendering="crispEdges">
      <rect width={n + 2} height={n + 2} fill={bg} />
      {rects}
    </svg>
  );
}
