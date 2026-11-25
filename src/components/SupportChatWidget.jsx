import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Headset, X, Send, Phone, Mail } from 'lucide-react';
import { CANCEL_CUTOFF_HOURS, HOLD_MINUTES, MAX_SEATS } from '../lib/db';

const QUICK_TOPICS = [
  'Seat & booking help',
  'Cancellation & refund',
  'Payment methods',
  'Food pre-order'
];

function getAgentReply(text) {
  const q = text.toLowerCase();
  if (/cancel|refund|money back/.test(q)) {
    return {
      text: `Free cancellation is available up to ${CANCEL_CUTOFF_HOURS} hours before showtime from My Bookings. Full refunds (tickets + food) return to your original payment method.`,
      link: { to: '/my-bookings', label: 'Go to My bookings' }
    };
  }
  if (/seat|hold|book|ticket|qr|max/.test(q)) {
    return {
      text: `You can book up to ${MAX_SEATS} seats per order. Selected seats are held for ${HOLD_MINUTES} minutes during checkout, and your QR e-tickets appear right after payment.`,
      link: { to: '/movies', label: 'Browse movies' }
    };
  }
  if (/pay|card|easypaisa|jazzcash|cash|promo|discount|code/.test(q)) {
    return {
      text: 'We accept Credit/Debit Cards, Easypaisa, JazzCash online, and Cash at the box office. You can also apply one promo code at checkout.',
      link: { to: '/offers', label: 'View offers' }
    };
  }
  if (/food|snack|popcorn|drink|combo|menu/.test(q)) {
    return {
      text: 'After choosing your seats you can pre-order snacks & combos and pick them up at the food counter using your pickup code.',
      link: { to: '/menu', label: 'Explore food menu' }
    };
  }
  return {
    text: 'Thanks for reaching out! An agent can assist you further via our Support page, or by phone/email (Daily 10:00 – 23:00).',
    link: { to: '/help', label: 'Open Support & FAQ' }
  };
}

export default function SupportChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      from: 'agent',
      text: 'Hi! Welcome to CineMax Live Support. How can I help you today?'
    }
  ]);
  const listRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, typing, open]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && open) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [open]);

  const sendMessage = (raw) => {
    const text = raw.trim();
    if (!text) return;
    const userMsg = { id: Date.now(), from: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setTyping(true);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const reply = getAgentReply(text);
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, from: 'agent', text: reply.text, link: reply.link }
      ]);
      setTyping(false);
    }, 450);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 no-print flex flex-col items-end gap-3">
      {open && (
        <div
          className="w-[min(22.5rem,calc(100vw-2rem))] card border-line2 shadow-2xl overflow-hidden flex flex-col fade-up"
          role="dialog"
          aria-label="Chat with online agent"
        >
          <div className="px-4 py-3.5 bg-panel2 border-b border-line flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative w-9 h-9 rounded-full bg-gold/15 text-gold flex items-center justify-center shrink-0">
                <Headset size={18} />
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-ok border-2 border-panel2" />
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-sm truncate">Online Support Agent</div>
                <div className="text-xs text-ok flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-ok inline-block" />
                  Online now
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="btn btn-ghost btn-icon text-fg2 hover:text-fg"
              aria-label="Close chat"
            >
              <X size={18} />
            </button>
          </div>

          <div ref={listRef} className="p-3.5 space-y-3 h-72 overflow-y-auto bg-ink/40">
            {messages.map((m) => (
              <div key={m.id} className={`flex flex-col ${m.from === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    m.from === 'user'
                      ? 'bg-gold text-[#17110a] font-medium rounded-br-sm'
                      : 'bg-panel2 border border-line text-fg rounded-bl-sm'
                  }`}
                >
                  <p>{m.text}</p>
                  {m.link && (
                    <Link
                      to={m.link.to}
                      onClick={() => setOpen(false)}
                      className="inline-block mt-2 text-xs font-semibold text-gold hover:underline"
                    >
                      {m.link.label} →
                    </Link>
                  )}
                </div>
              </div>
            ))}

            {typing && (
              <div className="flex items-start">
                <div className="bg-panel2 border border-line text-fg2 rounded-2xl rounded-bl-sm px-3.5 py-2 text-xs">
                  Agent is typing…
                </div>
              </div>
            )}

            {messages.length === 1 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {QUICK_TOPICS.map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => sendMessage(topic)}
                    className="chip text-xs py-1 px-2.5"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="px-3.5 py-2 bg-panel border-t border-line flex items-center justify-between text-[11px] text-fg3">
            <span className="inline-flex items-center gap-1"><Phone size={11} className="text-gold" /> 042-111-246-362</span>
            <span className="inline-flex items-center gap-1"><Mail size={11} className="text-gold" /> support@cinemax.pk</span>
          </div>

          <form onSubmit={handleSubmit} className="p-2.5 bg-panel2 border-t border-line flex items-center gap-2">
            <input
              type="text"
              className="input input-sm flex-1"
              placeholder="Type your message…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              aria-label="Message online agent"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="btn btn-primary btn-icon"
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="group relative flex items-center gap-2.5 h-13 px-4 rounded-full bg-gold hover:bg-gold-hover text-[#17110a] font-semibold text-sm shadow-xl shadow-gold/25 transition-all hover:scale-105 active:scale-95"
        aria-label={open ? 'Close online agent chat' : 'Chat with online agent'}
        aria-expanded={open}
        title="Chat with online agent"
      >
        <span className="relative flex items-center justify-center">
          {open ? <X size={21} strokeWidth={2.3} /> : <MessageCircle size={21} strokeWidth={2.3} />}
          {!open && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ok opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-ok border-2 border-gold" />
            </span>
          )}
        </span>
        <span className="hidden sm:inline">{open ? 'Close' : 'Chat with Agent'}</span>
      </button>
    </div>
  );
}
