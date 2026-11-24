import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const SIZES = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl', '2xl': 'max-w-6xl' };

export default function Modal({ open, onClose, title, subtitle, children, footer, size = 'md', hideClose = false, printable = false }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape' && onClose) onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className={`modal-backdrop ${printable ? '' : 'no-print'}`} onMouseDown={(e) => { if (e.target === e.currentTarget && onClose) onClose(); }}>
      <div className={`modal ${SIZES[size] || SIZES.md}`} role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : undefined}>
        {(title || !hideClose) && (
          <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-3">
            <div className="min-w-0">
              {title && <h3 className="text-lg font-bold">{title}</h3>}
              {subtitle && <p className="text-sm text-fg2 mt-0.5">{subtitle}</p>}
            </div>
            {!hideClose && (
              <button className="btn btn-ghost btn-icon -mr-2 -mt-1" onClick={onClose} aria-label="Close"><X size={18} /></button>
            )}
          </div>
        )}
        <div className="px-6 pb-5">{children}</div>
        {footer && <div className="no-print px-6 py-4 border-t border-line flex flex-wrap items-center justify-end gap-3">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
