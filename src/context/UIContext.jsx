import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import Modal from '../components/ui/Modal';

const Ctx = createContext(null);
const ICONS = {
  success: <CheckCircle2 size={18} className="text-ok mt-0.5 shrink-0" />,
  error: <XCircle size={18} className="text-bad mt-0.5 shrink-0" />,
  info: <Info size={18} className="text-info mt-0.5 shrink-0" />,
  warn: <AlertTriangle size={18} className="text-warn mt-0.5 shrink-0" />
};

export function UIProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [dialog, setDialog] = useState(null);
  const idRef = useRef(0);

  const remove = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const push = useCallback((type, message, ms = 4200) => {
    const id = ++idRef.current;
    setToasts((t) => [...t.slice(-3), { id, type, message }]);
    setTimeout(() => remove(id), ms);
  }, [remove]);

  const toast = useMemo(() => ({
    success: (m) => push('success', m),
    error: (m) => push('error', m, 6000),
    info: (m) => push('info', m),
    warn: (m) => push('warn', m, 5500),
    /** show the message of an appError / any thrown error */
    fail: (e) => push('error', e && e.userMessage ? e.userMessage : (e && e.message) || 'Something went wrong.', 6000)
  }), [push]);

  const confirm = useCallback((opts) => new Promise((resolve) => setDialog({ ...opts, resolve })), []);
  const close = (v) => { dialog.resolve(v); setDialog(null); };

  return (
    <Ctx.Provider value={{ toast, confirm }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 no-print" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="toast">
            {ICONS[t.type]}
            <div className="flex-1 min-w-0">{t.message}</div>
            <button className="text-fg3 hover:text-fg" onClick={() => remove(t.id)} aria-label="Dismiss"><X size={15} /></button>
          </div>
        ))}
      </div>
      <Modal
        open={!!dialog} onClose={() => close(false)} size="sm" hideClose title={dialog?.title}
        footer={dialog && (
          <>
            <button className="btn btn-ghost" onClick={() => close(false)}>{dialog.cancelText || 'Cancel'}</button>
            <button className={`btn ${dialog.danger ? 'btn-danger' : 'btn-primary'}`} onClick={() => close(true)}>{dialog.confirmText || 'Confirm'}</button>
          </>
        )}
      >
        {dialog && <div className="text-sm text-fg2 leading-relaxed">{dialog.message}</div>}
      </Modal>
    </Ctx.Provider>
  );
}
export const useUI = () => useContext(Ctx);
