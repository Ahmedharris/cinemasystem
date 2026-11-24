export const PALETTE = ['#f5b82e', '#60a5fa', '#34d399', '#fb7185', '#a78bfa', '#fb923c', '#2dd4bf'];

export function BarChart({ data, height = 220, format = (v) => v, color = 'var(--color-gold)' }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const ticks = [1, 0.75, 0.5, 0.25, 0];
  return (
    <div className="flex gap-3" style={{ height: height + 28 }}>
      <div className="flex flex-col justify-between text-[10px] text-fg3 text-right pb-7 w-12 shrink-0" style={{ height: height + 28 }}>
        {ticks.map((t) => <span key={t}>{format(Math.round(max * t))}</span>)}
      </div>
      <div className="relative flex-1 min-w-0">
        <div className="absolute inset-x-0 top-0 flex flex-col justify-between pointer-events-none" style={{ height }}>
          {ticks.map((t) => <div key={t} className="border-t border-line/70" />)}
        </div>
        <div className={`relative flex items-end h-full ${data.length > 14 ? 'gap-1' : 'gap-2 sm:gap-3'}`}>
          {data.map((d, i) => (
            <div key={d.label} className="flex-1 flex flex-col items-center justify-end min-w-0 group" style={{ height: '100%' }} title={`${d.label}: ${format(d.value)}`}>
              <div className="w-full flex flex-col justify-end items-center" style={{ height }}>
                <div className="text-[10px] text-fg2 opacity-0 group-hover:opacity-100 transition-opacity mb-1 whitespace-nowrap">{format(d.value)}</div>
                <div className="w-full max-w-[44px] rounded-t-lg transition-all group-hover:brightness-125" style={{ height: `${Math.max(2, (Math.max(d.value, 0) / max) * 100)}%`, background: `linear-gradient(to top, ${color}, color-mix(in srgb, ${color} 55%, transparent))` }} />
              </div>
              <div className={`text-[10px] text-fg3 mt-2 h-5 w-full text-center ${data.length > 14 ? 'overflow-visible' : 'truncate'}`}>{data.length > 14 && i % Math.ceil(data.length / 7) !== 0 ? '' : <span className="inline-block whitespace-nowrap">{d.label}</span>}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function HBars({ data, format = (v) => v, color = 'var(--color-gold)', max: forced, empty = 'No data for this period.' }) {
  if (!data.length) return <p className="text-sm text-fg3 py-6 text-center">{empty}</p>;
  const max = forced || Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-3">
      {data.map((d, i) => (
        <div key={d.label}>
          <div className="flex items-center justify-between text-sm mb-1.5 gap-3">
            <span className="truncate text-fg">{d.label}</span>
            <span className="text-fg2 font-semibold shrink-0">{format(d.value)}</span>
          </div>
          <div className="progress"><span style={{ width: `${Math.max(2, (d.value / max) * 100)}%`, background: d.color || (data.length > 1 && color === 'palette' ? PALETTE[i % PALETTE.length] : color) }} /></div>
        </div>
      ))}
    </div>
  );
}

export function Donut({ data, size = 170, thickness = 22, centerLabel, centerValue, format = (v) => v }) {
  const total = data.reduce((a, d) => a + d.value, 0);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="flex flex-wrap items-center gap-6 justify-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-panel3)" strokeWidth={thickness} />
          {total > 0 && data.map((d, i) => {
            const len = (d.value / total) * c;
            const el = <circle key={d.label} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={d.color || PALETTE[i % PALETTE.length]} strokeWidth={thickness} strokeDasharray={`${Math.max(0, len - 2)} ${c}`} strokeDashoffset={-offset} />;
            offset += len;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="text-xl font-bold font-display">{centerValue ?? format(total)}</div>
          <div className="text-[11px] text-fg3">{centerLabel || 'Total'}</div>
        </div>
      </div>
      <ul className="space-y-2 text-sm min-w-[10rem]">
        {data.map((d, i) => (
          <li key={d.label} className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color || PALETTE[i % PALETTE.length] }} />
            <span className="text-fg2 flex-1">{d.label}</span>
            <span className="font-semibold">{total ? Math.round((d.value / total) * 100) : 0}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
