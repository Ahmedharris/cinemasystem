import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Headset, X, Send, Phone, Mail, RotateCcw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getChatbotReply } from '../lib/chatbot';

const QUICK_TOPICS = [
  'Now showing movies',
  'Active promo codes',
  'Ticket prices',
  'Cancellation & refund'
];

const INITIAL_MESSAGE = {
  id: 1,
  from: 'agent',
  text: 'Hi! Welcome to QISSA Live Support. Ask me about movies, showtimes, ticket prices, promo codes, cinemas, food, or bookings — in English or Roman Urdu!',
  suggestions: QUICK_TOPICS
};

export default function SupportChatWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
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
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInput('');
    setTyping(true);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const reply = getChatbotReply(text, { user, history: nextHistory });
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          from: 'agent',
          text: reply.text,
          link: reply.link,
          meta: reply.meta,
          suggestions: reply.suggestions
        }
      ]);
      setTyping(false);
    }, 350);
  };

  const resetChat = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setTyping(false);
    setInput('');
    setMessages([{ ...INITIAL_MESSAGE, id: Date.now() }]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const lastAgentIndex = messages.reduce((idx, m, i) => (m.from === 'agent' ? i : idx), -1);

  return (
    <div className="fixed bottom-5 right-5 z-50 no-print flex flex-col items-end gap-3">
      {open && (
        <div
          className="w-[min(23.5rem,calc(100vw-2rem))] card border-line2 shadow-2xl overflow-hidden flex flex-col fade-up"
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
                <div className="font-semibold text-sm truncate">QISSA Smart Assistant</div>
                <div className="text-xs text-ok flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-ok inline-block" />
                  Online now
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 1 && (
                <button
                  type="button"
                  onClick={resetChat}
                  className="btn btn-ghost btn-icon text-fg2 hover:text-fg"
                  aria-label="Reset chat"
                  title="New chat"
                >
                  <RotateCcw size={16} />
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="btn btn-ghost btn-icon text-fg2 hover:text-fg"
                aria-label="Close chat"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div ref={listRef} className="p-3.5 space-y-3 h-80 overflow-y-auto bg-ink/40">
            {messages.map((m, idx) => (
              <div key={m.id} className={`flex flex-col ${m.from === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    m.from === 'user'
                      ? 'bg-gold text-[#17110a] font-medium rounded-br-sm'
                      : 'bg-panel2 border border-line text-fg rounded-bl-sm'
                  }`}
                >
                  <p className="whitespace-pre-line">{m.text}</p>
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

                {m.from === 'agent' && idx === lastAgentIndex && !typing && m.suggestions?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {m.suggestions.map((topic) => (
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
            ))}

            {typing && (
              <div className="flex items-start">
                <div className="bg-panel2 border border-line text-fg2 rounded-2xl rounded-bl-sm px-3.5 py-2 text-xs">
                  Agent is typing…
                </div>
              </div>
            )}
          </div>

          <div className="px-3.5 py-2 bg-panel border-t border-line flex items-center justify-between text-[11px] text-fg3">
            <span className="inline-flex items-center gap-1"><Phone size={11} className="text-gold" /> 042-111-246-362</span>
            <span className="inline-flex items-center gap-1"><Mail size={11} className="text-gold" /> support@qissa.pk</span>
          </div>

          <form onSubmit={handleSubmit} className="p-2.5 bg-panel2 border-t border-line flex items-center gap-2">
            <input
              type="text"
              className="input input-sm flex-1"
              placeholder="Ask about movies, prices, promos…"
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
