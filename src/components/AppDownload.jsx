import { Smartphone, QrCode, Bell, Ticket } from 'lucide-react';
import { useUI } from '../context/UIContext';

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current shrink-0" aria-hidden="true">
      <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.05.28.05.43zm4.565 15.71c-.03.07-.463 1.58-1.518 3.12-.945 1.34-1.94 2.71-3.43 2.71-1.517 0-1.9-.88-3.63-.88-1.698 0-2.302.91-3.67.91-1.377 0-2.332-1.26-3.428-2.8-1.287-1.82-2.323-4.63-2.323-7.28 0-4.28 2.797-6.55 5.552-6.55 1.448 0 2.675.95 3.6.95.865 0 2.222-1.01 3.902-1.01.613 0 2.886.06 4.374 2.19-.13.09-2.383 1.37-2.383 4.19 0 3.26 2.854 4.42 2.955 4.45z" />
    </svg>
  );
}

function PlayStoreIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current shrink-0" aria-hidden="true">
      <path d="M3.609 1.814L13.792 12 3.61 22.186a1.75 1.75 0 0 1-.61-1.335V3.149c0-.517.224-.995.609-1.335zm11.127 11.13l2.747 2.747-10.309 5.952 7.562-8.7zm3.662-2.113l2.467 1.425c.726.419.726 1.07 0 1.488l-2.467 1.425-3.031-3.031 3.031-3.032v1.725zm-3.662-1.762L7.174 2.357l10.309 5.952-2.747 2.76z" />
    </svg>
  );
}

export function AppStoreButtons({ compact = false }) {
  const { toast } = useUI();
  const notify = (store) => toast.info(`QISSA app on ${store} is coming soon!`);

  const btnCls = `inline-flex items-center gap-2.5 rounded-xl border border-line2 bg-panel2 hover:bg-panel3 hover:border-gold/50 transition-colors text-left ${
    compact ? 'px-3.5 py-2' : 'px-4 py-2.5'
  }`;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" onClick={() => notify('App Store')} className={btnCls}>
        <AppleIcon />
        <span className="leading-tight">
          <span className="block text-[10px] uppercase tracking-wider text-fg3">Download on the</span>
          <span className="block text-sm font-semibold text-fg">App Store</span>
        </span>
      </button>
      <button type="button" onClick={() => notify('Google Play')} className={btnCls}>
        <PlayStoreIcon />
        <span className="leading-tight">
          <span className="block text-[10px] uppercase tracking-wider text-fg3">Get it on</span>
          <span className="block text-sm font-semibold text-fg">Google Play</span>
        </span>
      </button>
    </div>
  );
}

export function AppDownloadBanner() {
  return (
    <section className="container-x section">
      <div className="rounded-3xl border border-line bg-gradient-to-br from-panel2 via-panel to-panel2 p-8 sm:p-12 grid gap-8 lg:grid-cols-[1.2fr_.8fr] items-center overflow-hidden relative">
        <div>
          <div className="eyebrow">Cinema in your pocket</div>
          <h2 className="text-3xl sm:text-4xl font-bold mt-2">Download our app</h2>
          <p className="text-fg2 mt-3 max-w-lg leading-relaxed">
            Book seats in seconds, get instant showtime alerts, pre-order snacks, and keep all your QR e-tickets ready offline on iOS and Android.
          </p>
          <div className="mt-6">
            <AppStoreButtons />
          </div>
        </div>

        <div className="rounded-2xl bg-ink/60 border border-line2 p-5 flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gold/15 border border-gold/30 text-gold flex items-center justify-center shrink-0">
            <Smartphone size={30} />
          </div>
          <div className="min-w-0 space-y-2 text-xs text-fg2">
            <div className="font-display font-bold text-base text-fg">QISSA Mobile</div>
            <div className="flex items-center gap-2"><Ticket size={14} className="text-gold shrink-0" /> 1-tap seat & snack booking</div>
            <div className="flex items-center gap-2"><QrCode size={14} className="text-gold shrink-0" /> Offline QR e-tickets at gate</div>
            <div className="flex items-center gap-2"><Bell size={14} className="text-gold shrink-0" /> Exclusive app-only promo alerts</div>
          </div>
        </div>
      </div>
    </section>
  );
}
