import { Link } from 'react-router-dom';
import { Clapperboard } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDb';

export default function NotFound() {
  useDocumentTitle('Page not found');
  return (
    <div className="container-x py-24 text-center">
      <div className="mx-auto w-20 h-20 rounded-3xl bg-panel2 border border-line flex items-center justify-center mb-6"><Clapperboard size={36} className="text-gold" /></div>
      <div className="text-7xl font-display font-bold gradient-text">404</div>
      <h1 className="text-2xl font-bold mt-3">This scene was cut</h1>
      <p className="text-fg2 mt-2">The page you are looking for doesn't exist or has moved.</p>
      <div className="flex justify-center gap-3 mt-8"><Link to="/" className="btn btn-primary">Back to home</Link><Link to="/movies" className="btn btn-outline">Browse movies</Link></div>
    </div>
  );
}
