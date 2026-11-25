import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, RotateCcw, Instagram, Facebook } from 'lucide-react';
import { Logo } from './Navbar';
import { AppStoreButtons } from './AppDownload';
import { q, resetDemoData } from '../lib/db';
import { useUI } from '../context/UIContext';
import { useDb } from '../hooks/useDb';

export default function Footer() {
  useDb();
  const { toast, confirm } = useUI();
  const reset = async () => {
    if (await confirm({ title: 'Reset demo data?', message: 'Bookings and other changes stored in this browser will be erased and the original sample data restored. Your account is kept in the database, but you will be signed out.', confirmText: 'Reset', danger: true })) {
      resetDemoData();
      toast.success('Demo data restored.');
    }
  };
  return (
    <footer className="border-t border-line bg-panel mt-16 no-print">
      <div className="container-x py-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo alwaysShowTagline />
          <p className="text-sm text-fg2 mt-4 leading-relaxed">Book the best seats, pre-order snacks and skip the queue. Real-time seat selection across all QISSA cinemas.</p>
          <div className="mt-5 space-y-2 text-sm text-fg2">
            <div className="text-xs font-semibold uppercase tracking-wider text-fg3">Follow us</div>
            <a
              href="https://www.instagram.com/qissa.pk"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-gold transition-colors"
            >
              <Instagram size={15} className="text-gold shrink-0" />
              <span>Instagram: @qissa.pk</span>
            </a>
            <a
              href="https://www.facebook.com/qissa.pk"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-gold transition-colors"
            >
              <Facebook size={15} className="text-gold shrink-0" />
              <span>Facebook: fb.com/qissa.pk</span>
            </a>
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-4 text-sm">Explore</h4>
          <ul className="space-y-2.5 text-sm text-fg2">
            <li><Link to="/movies" className="hover:text-gold">Now showing</Link></li>
            <li><Link to="/movies?status=COMING_SOON" className="hover:text-gold">Coming soon</Link></li>
            <li><Link to="/cinemas" className="hover:text-gold">Our cinemas</Link></li>
            <li><Link to="/offers" className="hover:text-gold">Offers & promo codes</Link></li>
            <li><Link to="/menu" className="hover:text-gold">Food & drinks</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-4 text-sm">Support</h4>
          <ul className="space-y-2.5 text-sm text-fg2">
            <li><Link to="/my-bookings" className="hover:text-gold">My bookings</Link></li>
            <li><Link to="/help" className="hover:text-gold">Help & FAQ</Link></li>
            <li><Link to="/help?section=cancellation" className="hover:text-gold">Cancellation policy</Link></li>
            <li><Link to="/login" className="hover:text-gold">Staff sign in</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-4 text-sm">Visit us</h4>
          <ul className="space-y-3 text-sm text-fg2">
            {q.cinemas().map((c) => <li key={c.cinema_id} className="flex gap-2"><MapPin size={15} className="mt-0.5 text-gold shrink-0" /><span>{c.cinema_name}, {c.city}</span></li>)}
            <li className="flex gap-2"><Phone size={15} className="mt-0.5 text-gold shrink-0" /> 042-111-246-362</li>
            <li className="flex gap-2"><Mail size={15} className="mt-0.5 text-gold shrink-0" /> support@qissa.pk</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="container-x py-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-sm font-semibold">Download our app</div>
            <div className="text-xs text-fg3 mt-0.5">Book tickets faster and access offline QR passes on iOS &amp; Android.</div>
          </div>
          <AppStoreButtons compact />
        </div>
      </div>
      <div className="border-t border-line">
        <div className="container-x py-5 flex flex-wrap items-center justify-between gap-3 text-xs text-fg3">
          <span>© {new Date().getFullYear()} QISSA — Every Story Matters. Cinema Management & Online Ticket Booking System — front-end prototype.</span>
          <button className="inline-flex items-center gap-1.5 hover:text-fg" onClick={reset}><RotateCcw size={13} /> Reset demo data</button>
        </div>
      </div>
    </footer>
  );
}
