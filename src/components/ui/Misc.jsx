import { Star, Inbox, Loader2 } from 'lucide-react';
import { statusTone, titleCase } from '../../lib/format';

export function Badge({ tone = 'muted', children, className = '' }) {
  return <span className={`badge badge-${tone} ${className}`}>{children}</span>;
}
export function StatusBadge({ status, label }) {
  return <Badge tone={statusTone(status)}>{label || titleCase(status)}</Badge>;
}

export function Stars({ value = 0, size = 14, onChange, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const fill = Math.max(0, Math.min(1, value - (n - 1)));
        const star = (
          <span className="relative inline-block" style={{ width: size, height: size }}>
            <Star size={size} className="absolute inset-0 text-line2" />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star size={size} className="text-gold fill-gold" />
            </span>
          </span>
        );
        return onChange ? (
          <button key={n} type="button" className="p-0.5 hover:scale-125 transition-transform" onClick={() => onChange(n)} aria-label={`${n} stars`}>{star}</button>
        ) : <span key={n}>{star}</span>;
      })}
    </span>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, text, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-4">
      <div className="w-14 h-14 rounded-2xl bg-panel2 border border-line flex items-center justify-center mb-4"><Icon size={26} className="text-fg3" /></div>
      <h3 className="text-base font-semibold">{title}</h3>
      {text && <p className="text-sm text-fg2 mt-1 max-w-sm">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Spinner({ className = '' }) { return <Loader2 className={`spin ${className}`} size={18} />; }

export function Tabs({ tabs, value, onChange, className = '' }) {
  return (
    <div className={`tabs no-scrollbar ${className}`} role="tablist">
      {tabs.map((t) => (
        <button key={t.value} role="tab" aria-selected={value === t.value} className={`tab ${value === t.value ? 'tab-active' : ''}`} onClick={() => onChange(t.value)}>
          {t.label}{t.count != null && <span className="ml-2 text-xs text-fg3">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions, eyebrow }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        {eyebrow && <div className="eyebrow mb-1">{eyebrow}</div>}
        <h1 className="text-2xl sm:text-3xl font-bold">{title}</h1>
        {subtitle && <p className="text-fg2 text-sm mt-1.5 max-w-2xl">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({ icon: Icon, label, value, hint, tone = 'gold' }) {
  const tones = { gold: 'bg-gold/15 text-gold', ok: 'bg-ok/15 text-ok', info: 'bg-info/15 text-info', bad: 'bg-bad/15 text-bad', warn: 'bg-warn/15 text-warn' };
  return (
    <div className="card card-pad flex items-start gap-4">
      <div className={`stat-icon ${tones[tone]}`}><Icon size={20} /></div>
      <div className="min-w-0">
        <div className="text-xs font-semibold text-fg3 uppercase tracking-wider">{label}</div>
        <div className="text-2xl font-bold font-display mt-0.5 truncate">{value}</div>
        {hint && <div className="text-xs text-fg2 mt-0.5">{hint}</div>}
      </div>
    </div>
  );
}

export function ProgressBar({ pct, tone }) {
  const color = tone === 'auto' ? (pct >= 90 ? 'var(--color-bad)' : pct >= 60 ? 'var(--color-warn)' : 'var(--color-ok)') : 'var(--color-gold)';
  return <div className="progress"><span style={{ width: `${Math.min(100, pct)}%`, background: color }} /></div>;
}

export function Avatar({ name, size = 36 }) {
  const initials = (name || '?').split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
  return (
    <span className="inline-flex items-center justify-center rounded-full bg-gradient-to-br from-gold to-orange-500 text-[#17110a] font-bold shrink-0" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {initials}
    </span>
  );
}

export function InfoRow({ label, children, className = '' }) {
  return (
    <div className={`flex items-start justify-between gap-4 py-2 text-sm ${className}`}>
      <span className="text-fg2 shrink-0">{label}</span>
      <span className="text-right font-medium min-w-0 break-words">{children}</span>
    </div>
  );
}

export function Callout({ tone = 'info', icon: Icon, children, className = '' }) {
  const t = { info: 'border-info/30 bg-info/10 text-info', warn: 'border-warn/30 bg-warn/10 text-warn', bad: 'border-bad/30 bg-bad/10 text-bad', ok: 'border-ok/30 bg-ok/10 text-ok', gold: 'border-gold/30 bg-gold/10 text-gold' };
  return (
    <div className={`flex gap-3 items-start rounded-xl border px-4 py-3 text-sm ${t[tone]} ${className}`}>
      {Icon && <Icon size={18} className="mt-0.5 shrink-0" />}
      <div className="text-fg flex-1">{children}</div>
    </div>
  );
}
