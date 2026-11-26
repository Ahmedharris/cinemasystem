import {
  CANCEL_CUTOFF_HOURS,
  HOLD_MINUTES,
  MAX_SEATS,
  fmtD,
  isBookable,
  now,
  promoStatus,
  q
} from './db';
import {
  SCREEN_TYPE_LABEL,
  fmtDuration,
  money,
  relDay,
  time12
} from './format';

const URDU_RE =
  /\b(kya|hai|hain|ho|kaise|kesy|kese|kahan|kidhar|kab|kitni|kitne|kitna|konsi|kon|kaun|batao|bata|bataye|chahiye|karna|karni|krna|karo|krdo|mujhe|mjhe|mera|meri|mere|hum|aap|ap|salam|assalam|aoa|shukriya|nahi|nhi|han|haan|abhi|aaj|kal|paisay|paise|qeemat|khana|jagah|wala|wali|wale|bhai|yaar)\b/i;

const DEFAULT_SUGGESTIONS_EN = [
  'Now showing movies',
  'Active promo codes',
  'Cinema locations',
  'Ticket prices'
];

const DEFAULT_SUGGESTIONS_UR = [
  'Aaj konsi movies chal rahi hain?',
  'Active promo codes batao',
  'Cinemas kahan hain?',
  'Ticket ki price kya hai?'
];

function isRomanUrdu(text) {
  return URDU_RE.test(text);
}

function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getBookableShows({ movieId = null, city = null, onlyToday = false } = {}) {
  const todayStr = fmtD(now());
  return q
    .showtimes()
    .filter((s) => {
      if (!isBookable(s)) return false;
      if (movieId && s.movie_id !== movieId) return false;
      if (onlyToday && !s.start_time.startsWith(todayStr)) return false;
      if (city) {
        const cinema = q.cinemaOfScreen(s.screen_id);
        if (!cinema || cinema.city.toLowerCase() !== city.toLowerCase()) return false;
      }
      return true;
    })
    .sort((a, b) => a.start_time.localeCompare(b.start_time));
}

function findMentionedCity(norm) {
  for (const c of q.cinemas()) {
    if (c.cinema_status !== 'ACTIVE') continue;
    if (
      norm.includes(c.city.toLowerCase()) ||
      norm.includes(c.cinema_name.toLowerCase()) ||
      (c.city === 'Lahore' && /\b(lhr|gulberg)\b/.test(norm)) ||
      (c.city === 'Karachi' && /\b(khi|dha|zamzama)\b/.test(norm)) ||
      (c.city === 'Islamabad' && /\b(isb|f7|f-7)\b/.test(norm))
    ) {
      return c;
    }
  }
  return null;
}

function findMentionedMovie(norm) {
  const words = norm.split(' ').filter((w) => w.length >= 3);
  let best = null;
  let bestScore = 0;

  for (const m of q.movies()) {
    const title = m.title.toLowerCase();
    if (norm.includes(title)) return m;

    const titleWords = title.split(/\s+/).filter((w) => w.length >= 3);
    const hits = titleWords.filter((tw) => words.includes(tw)).length;
    if (hits > 0 && hits > bestScore) {
      best = m;
      bestScore = hits;
    }
  }
  return best;
}

function findMentionedGenre(norm) {
  for (const g of q.genres()) {
    if (norm.includes(g.genre_name.toLowerCase())) return g;
  }
  if (/\bscifi\b/.test(norm)) {
    return q.genres().find((g) => g.genre_name.toLowerCase() === 'sci-fi') || null;
  }
  if (/\b(funny|mazahiya)\b/.test(norm)) {
    return q.genres().find((g) => g.genre_name.toLowerCase() === 'comedy') || null;
  }
  if (/\b(scary|ghost|darawni)\b/.test(norm)) {
    return q.genres().find((g) => g.genre_name.toLowerCase() === 'horror') || null;
  }
  if (/\b(kids|cartoon|bachon)\b/.test(norm)) {
    return q.genres().find((g) => g.genre_name.toLowerCase() === 'animation') || null;
  }
  return null;
}

function formatMovieReply(movie, { ur, city = null } = {}) {
  const genres = q.genresOf(movie.movie_id).map((g) => g.genre_name).join(', ');
  const rating = q.ratingOf(movie.movie_id);
  const ratingText = rating.count ? `${rating.avg.toFixed(1)}/5 (${rating.count})` : ur ? 'Abhi koi review nahi' : 'No reviews yet';

  if (movie.movie_status === 'COMING_SOON') {
    return {
      text: ur
        ? `${movie.title} (${movie.language}, ${fmtDuration(movie.duration_minutes)}) jald aa rahi hai!\nRelease: ${movie.release_date} · Genre: ${genres || 'N/A'}\nCast: ${movie.cast_members}`
        : `${movie.title} (${movie.language}, ${fmtDuration(movie.duration_minutes)}) is Coming Soon!\nRelease: ${movie.release_date} · Genre: ${genres || 'N/A'}\nCast: ${movie.cast_members}`,
      link: { to: `/movie/${movie.movie_id}`, label: `Open ${movie.title}` },
      meta: { movieId: movie.movie_id },
      suggestions: ur
        ? ['Aaj konsi movies chal rahi hain?', 'Ticket ki price kya hai?']
        : ['Now showing movies', 'Ticket prices']
    };
  }

  if (movie.movie_status === 'ARCHIVED') {
    return {
      text: ur
        ? `${movie.title} abhi cinemas mein nahi chal rahi (Archived). Aap abhi chalne wali movies dekh sakte hain.`
        : `${movie.title} is currently archived and not playing in cinemas. Check our Now Showing lineup instead!`,
      link: { to: '/movies', label: 'Browse Now Showing' },
      meta: { movieId: movie.movie_id },
      suggestions: ur ? DEFAULT_SUGGESTIONS_UR : DEFAULT_SUGGESTIONS_EN
    };
  }

  const upcoming = getBookableShows({ movieId: movie.movie_id, city: city?.city });
  const preview = upcoming.slice(0, 4).map((s) => {
    const cinema = q.cinemaOfScreen(s.screen_id);
    const screen = q.screen(s.screen_id);
    return `• ${relDay(s.start_time.slice(0, 10))} ${time12(s.start_time)} — ${cinema.city} (${SCREEN_TYPE_LABEL[screen.screen_type] || screen.screen_type}, from ${money(q.minPrice(s.showtime_id))})`;
  });

  const header = `${movie.title} — ${movie.language} · ${fmtDuration(movie.duration_minutes)} · ${movie.content_rating}\nGenres: ${genres || 'N/A'} · Rating: ${ratingText}`;
  const showBlock = preview.length
    ? `\n${ur ? 'Agle showtimes:' : 'Upcoming showtimes:'}\n${preview.join('\n')}`
    : `\n${ur ? 'Is waqt koi upcoming show available nahi hai.' : 'No upcoming shows available right now.'}`;

  return {
    text: `${header}${showBlock}`,
    link: { to: `/movie/${movie.movie_id}`, label: ur ? `${movie.title} book karein` : `Book ${movie.title}` },
    meta: { movieId: movie.movie_id },
    suggestions: ur
      ? ['Seat booking kaise hoti hai?', 'Active promo codes batao', 'Food menu dikhao']
      : ['How to book seats?', 'Active promo codes', 'Explore food menu']
  };
}

export function getChatbotReply(rawText, { user = null, history = [] } = {}) {
  const text = String(rawText || '').trim();
  const norm = normalize(text);
  const ur = isRomanUrdu(text);
  const city = findMentionedCity(norm);

  // Pull last referenced movie/topic from history for short follow-ups
  const lastBot = [...history].reverse().find((m) => m.from === 'agent');
  const lastMovieId = lastBot?.meta?.movieId ?? null;

  // 1. Booking reference lookup (e.g. CM1234ABCD)
  const refMatch = text.match(/\b(CM[A-Z0-9]{6,10})\b/i);
  if (refMatch) {
    const ref = refMatch[1].toUpperCase();
    const b = q.bookingByRef(ref);
    if (!b) {
      return {
        text: ur
          ? `Booking reference ${ref} nahi mili. Meherbani karke code dubara check karein ya My Bookings mein dekhein.`
          : `I couldn't find booking reference ${ref}. Please double-check the code or view your bookings page.`,
        link: { to: '/my-bookings', label: 'Go to My bookings' }
      };
    }
    const canView = user && (user.role !== 'CUSTOMER' || b.user_id === user.user_id);
    if (!canView) {
      return {
        text: ur
          ? `Booking ${ref} ki details dekhne ke liye apne account se sign in karein.`
          : `Please sign in with the account that made booking ${ref} to view its details.`,
        link: { to: user ? '/my-bookings' : '/login', label: user ? 'Go to My bookings' : 'Sign in' }
      };
    }
    const full = q.bookingFull(b);
    const seatNames = full.activeSeats.map((s) => `${s.seat.row_label}${s.seat.seat_number}`).join(', ') || '—';
    return {
      text: ur
        ? `Booking ${b.booking_reference} (${b.booking_status}):\nMovie: ${full.movie.title}\nCinema: ${full.cinema.cinema_name}, ${full.cinema.city}\nShowtime: ${relDay(full.show.start_time.slice(0, 10))} at ${time12(full.show.start_time)}\nSeats: ${seatNames}\nTotal: ${money(b.total_amount)}`
        : `Booking ${b.booking_reference} (${b.booking_status}):\nMovie: ${full.movie.title}\nCinema: ${full.cinema.cinema_name}, ${full.cinema.city}\nShowtime: ${relDay(full.show.start_time.slice(0, 10))} at ${time12(full.show.start_time)}\nSeats: ${seatNames}\nTotal: ${money(b.total_amount)}`,
      link: { to: `/booking/${b.booking_reference}`, label: 'View booking & QR tickets' },
      suggestions: ur
        ? ['Cancel aur refund policy kya hai?', 'Food pre-order kaise karein?']
        : ['Cancellation & refund policy', 'Food pre-order']
    };
  }

  // 2. Greetings
  if (/^(hi|hello|hey|hy|hlo|yo|salam|slm|assalam|assalamualaikum|aoa|good morning|good afternoon|good evening)\b/.test(norm)) {
    const name = user?.full_name ? ` ${user.full_name.split(' ')[0]}` : '';
    return {
      text: ur
        ? `Assalam-o-Alaikum${name}! QISSA Support mein khush amdeed. Main movies, showtimes, seat booking, promo codes, cinemas, food menu aur refunds mein aap ki madad kar sakta hoon. Aap kya poochna chahte hain?`
        : `Hi${name}! Welcome to QISSA Live Support. I can help you with movies, showtimes, seat booking, promo codes, cinemas, food pre-orders, and cancellations. What would you like to know?`,
      suggestions: ur ? DEFAULT_SUGGESTIONS_UR : DEFAULT_SUGGESTIONS_EN
    };
  }

  // 3. Thanks / Closing
  if (/^(thanks|thank you|thx|ty|shukriya|jazakallah|ok|okay|great|awesome|perfect|cool|theek|thik|bye|allah hafiz)\b/.test(norm)) {
    return {
      text: ur
        ? 'Bohat shukriya! Agar aur koi sawal ho (movies, showtimes, booking ya offers ke bare mein), to zaroor poochein.'
        : "You're welcome! Let me know anytime if you need help with movies, showtimes, bookings, or offers.",
      suggestions: ur ? DEFAULT_SUGGESTIONS_UR : DEFAULT_SUGGESTIONS_EN
    };
  }

  // 4. Specific movie mentioned
  const matchedMovie = findMentionedMovie(norm);
  if (matchedMovie) {
    return formatMovieReply(matchedMovie, { ur, city });
  }

  // 5. Short contextual follow-up about previously discussed movie
  if (
    lastMovieId &&
    norm.split(' ').length <= 5 &&
    /(timing|time|show|price|kitne|kab|kahan|city|lahore|karachi|islamabad|detail)/.test(norm)
  ) {
    const prevMovie = q.movie(lastMovieId);
    if (prevMovie) return formatMovieReply(prevMovie, { ur, city });
  }

  // 6. Cancellation & Refund
  if (/cancel|refund|money back|wapis|wapsi/.test(norm)) {
    return {
      text: ur
        ? `Showtime se ${CANCEL_CUTOFF_HOURS} ghante pehle tak My Bookings se free cancellation available hai. Confirm booking cancel karne par poora refund (tickets + food) original payment method par wapis mil jata hai. Agar ticket scan ho chuka ho to cancel nahi ho sakti.`
        : `Free cancellation is available up to ${CANCEL_CUTOFF_HOURS} hours before showtime from My Bookings. Full refunds (tickets + food) return to your original payment method. Used tickets cannot be cancelled.`,
      link: { to: '/my-bookings', label: 'Go to My bookings' },
      suggestions: ur
        ? ['Meri bookings dikhao', 'Payment methods kya hain?']
        : ['Check my bookings', 'Payment methods']
    };
  }

  // 7. User's own bookings
  if (/(my booking|meri booking|my ticket|mere ticket|meri tickets|booking status|booked)/.test(norm)) {
    if (!user) {
      return {
        text: ur
          ? 'Apni bookings aur QR tickets dekhne ke liye pehle apna account sign in karein.'
          : 'Please sign in to view your bookings and QR e-tickets.',
        link: { to: '/login', label: 'Sign in' }
      };
    }
    const list = q.bookingsOfUser(user.user_id).sort((a, b) => b.booking_time.localeCompare(a.booking_time));
    if (!list.length) {
      return {
        text: ur
          ? 'Abhi aap ke account par koi booking mojood nahi hai. Aap abhi movies dekh kar seats book kar sakte hain!'
          : "You don't have any bookings yet. Browse Now Showing movies to book your seats!",
        link: { to: '/movies', label: 'Browse movies' }
      };
    }
    const latest = q.bookingFull(list[0]);
    const confirmedCount = list.filter((b) => b.booking_status === 'CONFIRMED').length;
    return {
      text: ur
        ? `Aap ki kul ${list.length} bookings hain (${confirmedCount} confirmed).\nLatest: ${latest.booking.booking_reference} — ${latest.movie.title} (${latest.booking.booking_status}, ${relDay(latest.show.start_time.slice(0, 10))} ${time12(latest.show.start_time)})`
        : `You have ${list.length} booking(s) (${confirmedCount} confirmed).\nLatest: ${latest.booking.booking_reference} — ${latest.movie.title} (${latest.booking.booking_status}, ${relDay(latest.show.start_time.slice(0, 10))} ${time12(latest.show.start_time)})`,
      link: { to: '/my-bookings', label: 'Open My bookings' },
      suggestions: ur
        ? ['Cancel aur refund policy kya hai?', 'Food pre-order kaise karein?']
        : ['Cancellation & refund policy', 'Food pre-order']
    };
  }

  // 8. Active promo codes / offers / discounts
  if (/promo|offer|discount|coupon|deal|voucher|sasta|student|family/.test(norm)) {
    const activePromos = q.promotions().filter((p) => promoStatus(p) === 'ACTIVE');
    if (!activePromos.length) {
      return {
        text: ur
          ? 'Is waqt koi active promo code mojood nahi hai. Naye offers ke liye Offers page check karein.'
          : 'There are no active promo codes right now. Check the Offers page for updates.',
        link: { to: '/offers', label: 'View offers' }
      };
    }
    const lines = activePromos.map((p) => `• ${p.promo_code}: ${p.description}`);
    return {
      text: ur
        ? `Abhi yeh active promo codes available hain (checkout par aik code apply ho sakta hai):\n${lines.join('\n')}`
        : `Here are our active promo codes (one code can be applied per booking at checkout):\n${lines.join('\n')}`,
      link: { to: '/offers', label: 'View all offers' },
      suggestions: ur
        ? ['Payment methods kya hain?', 'Ticket ki price kya hai?']
        : ['Payment methods', 'Ticket prices']
    };
  }

  // 9. Food & Snacks menu
  if (/food|snack|popcorn|drink|burger|wrap|nacho|fries|coffee|water|ice cream|combo|menu|khana|peena/.test(norm)) {
    const available = q.food().filter((f) => f.availability_status === 'AVAILABLE');
    const picks = available
      .filter((f) => ['COMBOS', 'SNACKS', 'MEALS', 'DRINKS'].includes(f.category))
      .slice(0, 5)
      .map((f) => `• ${f.item_name} — ${money(f.current_price)}`);

    return {
      text: ur
        ? `Seat select karne ke baad aap snacks & combos pre-order kar sakte hain aur food counter se pickup code dikha kar le sakte hain.\nPopular items:\n${picks.join('\n')}`
        : `After selecting your seats, you can pre-order snacks & combos and collect them from the food counter using your pickup code.\nPopular items:\n${picks.join('\n')}`,
      link: { to: '/menu', label: 'Explore full food menu' },
      suggestions: ur
        ? ['Active promo codes batao', 'Seat booking kaise hoti hai?']
        : ['Active promo codes', 'How to book seats?']
    };
  }

  // 10. Ticket prices & screen types
  if (/price|rate|cost|kitne|kitni|qeemat|charges|fee|imax|vip|3d|recliner/.test(norm)) {
    const cats = q.seatCategories().map((c) => `${c.category_name} (${c.price_multiplier}x)`).join(', ');
    return {
      text: ur
        ? `Ticket ki base price screen type ke hisaab se hoti hai:\n• Standard: ${money(800)}\n• 3D: ${money(1000)}\n• IMAX: ${money(1400)}\n• VIP Recliners: ${money(1800)}\nSeat categories: ${cats}.`
        : `Base ticket prices depend on the screen type:\n• Standard: ${money(800)}\n• 3D: ${money(1000)}\n• IMAX: ${money(1400)}\n• VIP Recliners: ${money(1800)}\nSeat categories: ${cats}.`,
      link: { to: '/movies', label: 'Check showtimes & prices' },
      suggestions: ur
        ? ['Active promo codes batao', 'Aaj konsi movies chal rahi hain?']
        : ['Active promo codes', 'Now showing movies']
    };
  }

  // 11. City-specific showtimes (e.g. "timings in lahore", "lahore movies")
  if (city && /(movie|film|showtime|show|timing|today|aaj|playing|chal rahi|schedule|kab)/.test(norm) && !/(address|location|branch|contact|phone|number|kahan|kidhar)/.test(norm)) {
    const cityShows = getBookableShows({ city: city.city });
    const preview = cityShows.slice(0, 5).map((s) => {
      const m = q.movie(s.movie_id);
      const sc = q.screen(s.screen_id);
      return `• ${m.title} — ${relDay(s.start_time.slice(0, 10))} ${time12(s.start_time)} (${SCREEN_TYPE_LABEL[sc.screen_type] || sc.screen_type}, from ${money(q.minPrice(s.showtime_id))})`;
    });
    return {
      text: preview.length
        ? `${ur ? `${city.cinema_name} (${city.city}) ke agle showtimes:` : `Upcoming showtimes at ${city.cinema_name} (${city.city}):`}\n${preview.join('\n')}`
        : ur
          ? `${city.cinema_name} (${city.city}) mein abhi koi upcoming show available nahi hai.`
          : `No upcoming shows are available at ${city.cinema_name} (${city.city}) right now.`,
      link: { to: '/movies', label: `Browse ${city.city} showtimes` },
      suggestions: ur
        ? [`${city.city} cinema ka address?`, 'Active promo codes batao']
        : [`${city.city} cinema address`, 'Active promo codes']
    };
  }

  // 12. Cinemas / Locations / Contact
  if (city || /cinema|branch|location|address|city|shehar|kahan|kidhar|contact|phone|number|email/.test(norm)) {
    const list = city ? [city] : q.cinemas().filter((c) => c.cinema_status === 'ACTIVE');
    const lines = list.map((c) => {
      const types = [...new Set(q.screensOf(c.cinema_id).map((s) => SCREEN_TYPE_LABEL[s.screen_type] || s.screen_type))].join(', ');
      return `• ${c.cinema_name} (${c.city}) — ${c.address}\n  Screens: ${types} · Tel: ${c.contact_number}`;
    });
    return {
      text: ur
        ? `${city ? `${city.cinema_name} ki details:` : 'Hamare QISSA cinemas in cities mein hain:'}\n${lines.join('\n')}\nSupport hours: Daily 10:00 – 23:00 (support@qissa.pk)`
        : `${city ? `Details for ${city.cinema_name}:` : 'Our active QISSA cinemas:'}\n${lines.join('\n')}\nSupport hours: Daily 10:00 – 23:00 (support@qissa.pk)`,
      link: { to: '/cinemas', label: 'View cinemas & screens' },
      suggestions: ur
        ? ['Aaj ke showtimes dikhao', 'Ticket ki price kya hai?']
        : ['Showtimes today', 'Ticket prices']
    };
  }

  // 12. Movies by Genre / Language / Coming Soon / Now Showing / Showtimes
  const genre = findMentionedGenre(norm);
  const langMatch = /\b(urdu|english)\b/.exec(norm);
  if (genre || langMatch) {
    const all = q.movies().filter((m) => m.movie_status !== 'ARCHIVED');
    const filtered = all.filter((m) => {
      const okGenre = genre ? q.genresOf(m.movie_id).some((g) => g.genre_id === genre.genre_id) : true;
      const okLang = langMatch ? m.language.toLowerCase() === langMatch[1] : true;
      return okGenre && okLang;
    });
    if (!filtered.length) {
      return {
        text: ur
          ? 'Is filter ke sath abhi koi movie available nahi hai. Saari movies dekhne ke liye Movies page kholein.'
          : 'No movies matched that filter right now. Browse all movies on our Movies page.',
        link: { to: '/movies', label: 'Browse all movies' }
      };
    }
    const lines = filtered.map((m) => `• ${m.title} (${m.language}, ${m.movie_status === 'COMING_SOON' ? 'Coming Soon' : 'Now Showing'})`);
    return {
      text: `${ur ? 'Yeh movies match karti hain:' : 'Matching movies:'}\n${lines.join('\n')}`,
      link: { to: '/movies', label: 'Explore Movies' },
      meta: filtered.length === 1 ? { movieId: filtered[0].movie_id } : undefined
    };
  }

  if (/coming soon|upcoming|agli|new movie|nayi|soon/.test(norm)) {
    const soon = q.movies().filter((m) => m.movie_status === 'COMING_SOON');
    const lines = soon.map((m) => `• ${m.title} (${m.language}) — Release: ${m.release_date}`);
    return {
      text: soon.length
        ? `${ur ? 'Jald aane wali movies:' : 'Coming soon at QISSA:'}\n${lines.join('\n')}`
        : ur
          ? 'Abhi koi upcoming release listed nahi hai.'
          : 'No upcoming releases are listed right now.',
      link: { to: '/movies', label: 'View Movies' }
    };
  }

  if (/movie|film|showtime|show|timing|today|aaj|playing|chal rahi|schedule|kab/.test(norm)) {
    const nowShowing = q.movies().filter((m) => m.movie_status === 'NOW_SHOWING');
    const todayShows = getBookableShows({ onlyToday: true });
    const lines = nowShowing.map((m) => {
      const genres = q.genresOf(m.movie_id).map((g) => g.genre_name).join('/');
      return `• ${m.title} (${m.language}, ${genres}, ${fmtDuration(m.duration_minutes)})`;
    });
    return {
      text: ur
        ? `Abhi ${nowShowing.length} movies chal rahi hain (${todayShows.length} shows aaj bookable hain):\n${lines.join('\n')}\nKisi movie ka naam likhein to main uske exact showtimes aur prices bata doon!`
        : `There are ${nowShowing.length} movies Now Showing (${todayShows.length} bookable shows left today):\n${lines.join('\n')}\nType any movie name and I'll share its exact showtimes and prices!`,
      link: { to: '/movies', label: 'Browse movies & showtimes' },
      suggestions: nowShowing.slice(0, 3).map((m) => m.title)
    };
  }

  // 13. Payment methods
  if (/pay|payment|card|easypaisa|jazzcash|cash|paisa|paisay|paise|bank/.test(norm)) {
    return {
      text: ur
        ? 'Online booking par Credit/Debit Card, Easypaisa aur JazzCash accept hote hain. Cinema ke box office counter par aap Cash se bhi payment kar sakte hain. Checkout par aik promo code bhi lagaya ja sakta hai.'
        : 'We accept Credit/Debit Cards, Easypaisa, and JazzCash online, plus Cash at the box office counter. You can also apply one promo code at checkout.',
      link: { to: '/offers', label: 'View offers' },
      suggestions: ur
        ? ['Active promo codes batao', 'Seat booking kaise hoti hai?']
        : ['Active promo codes', 'How to book seats?']
    };
  }

  // 14. Seat selection / hold / booking process / QR
  if (/seat|hold|book|booking|ticket|qr|max|kaise/.test(norm)) {
    return {
      text: ur
        ? `Booking ka tarika:\n1. Movie aur showtime select karein.\n2. Apni pasand ki seats chunein (aik order mein max ${MAX_SEATS} seats).\n3. Seats checkout ke liye ${HOLD_MINUTES} minute tak hold rehti hain.\n4. Optional food pre-order add karein aur payment complete karein.\n5. Payment ke baad aap ko QR e-tickets mil jayenge.`
        : `How booking works:\n1. Pick a movie & showtime.\n2. Select up to ${MAX_SEATS} seats (held for ${HOLD_MINUTES} minutes during checkout).\n3. Optionally pre-order snacks & apply a promo code.\n4. Complete payment to get your QR e-tickets right away.`,
      link: { to: '/movies', label: 'Browse movies' },
      suggestions: ur
        ? ['Payment methods kya hain?', 'Cancel aur refund policy kya hai?']
        : ['Payment methods', 'Cancellation & refund policy']
    };
  }

  // 15. Reviews & ratings
  if (/review|rating|rate|comment|star/.test(norm)) {
    return {
      text: ur
        ? 'Sirf woh customers kisi movie par rating aur review likh sakte hain jin ki us movie ke liye CONFIRMED booking ho. Movie page par ja kar apna review add karein.'
        : 'Only customers with a confirmed booking for a movie can rate and write a review on that movie’s page.',
      link: { to: '/movies', label: 'Browse movies' }
    };
  }

  // 16. Account / Login / Register / Password
  if (/login|sign in|register|signup|sign up|account|password|forgot|reset|profile/.test(norm)) {
    return {
      text: ur
        ? user
          ? `Aap ${user.full_name} (${user.email}) ke taur par signed in hain. Profile ya password update karne ke liye Profile page par jayein.`
          : 'Aap Login page se sign in kar sakte hain, naya account bana sakte hain, ya password bhool gaye hon to Forgot Password use kar sakte hain.'
        : user
          ? `You are signed in as ${user.full_name} (${user.email}). You can update your details or password from your Profile page.`
          : 'You can sign in, create an account, or reset a forgotten password from our Auth pages.',
      link: { to: user ? '/profile' : '/login', label: user ? 'Open Profile' : 'Sign in / Register' }
    };
  }

  // 17. Help / Capabilities
  if (/help|madad|support|what can you do|options|menu/.test(norm)) {
    return {
      text: ur
        ? 'Main aap ko in cheezon mein madad kar sakta hoon:\n• Now Showing & Coming Soon movies + showtimes\n• Kisi specific movie ki details (naam likhein)\n• Ticket prices (Standard, 3D, IMAX, VIP)\n• Active promo codes aur offers\n• Cinemas & locations (Lahore, Karachi, Islamabad)\n• Food pre-order, My Bookings, aur Refund policy'
        : 'I can help you with:\n• Now Showing & Coming Soon movies + showtimes\n• Details for any specific movie (just type its name)\n• Ticket prices (Standard, 3D, IMAX, VIP)\n• Active promo codes & offers\n• Cinema locations & contact info\n• Food pre-orders, My Bookings (or CM... ref), & Refunds',
      link: { to: '/help', label: 'Open Help & FAQ' },
      suggestions: ur ? DEFAULT_SUGGESTIONS_UR : DEFAULT_SUGGESTIONS_EN
    };
  }

  // 18. Smart fallback
  return {
    text: ur
      ? 'Mujhe aap ka sawal poori tarah samajh nahi aaya, lekin aap movies (e.g. "Orbit Zero"), showtimes, ticket prices, promo codes, cinemas, food menu ya cancellation ke bare mein pooch sakte hain — ya neeche diye topics par click karein:'
      : "I didn't quite catch that, but you can ask me about movies (e.g. \"Orbit Zero\"), showtimes, ticket prices, promo codes, cinemas, food menu, or cancellations — or pick a topic below:",
    link: { to: '/help', label: 'Open Support & FAQ' },
    suggestions: ur ? DEFAULT_SUGGESTIONS_UR : DEFAULT_SUGGESTIONS_EN
  };
}
