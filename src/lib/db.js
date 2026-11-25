/* =====================================================================
   QISSA demo database  (front-end only)

   Mirrors the 20-table schema in /database/schema.sql, using the SAME table
   and column names, so every screen can later be wired to PHP/MySQL by
   replacing this module with API calls.

   Tables: cinema, user_account, audit_log, genre, movie, movie_genre,
   movie_review, screen, seat_category, seat, showtime, showtime_price,
   promotion, booking, booking_seat, ticket, payment, food_item, food_order,
   order_detail.

   The business rules from the ERD (seat holds, no double booking, one ticket
   per seat, refunds, overlap check, price snapshots) are enforced in the
   services below, the way the PHP + MySQL layer will do it.
   Data is persisted in localStorage.
   ===================================================================== */

const VERSION = 5;
const KEY = `qissa_db_v${VERSION}`;
const SESSION_KEY = 'qissa_session';

export const CURRENCY = 'Rs.';
export const HOLD_MINUTES = 10;       // seats are held while the customer pays
export const MAX_SEATS = 8;           // per booking
export const CANCEL_CUTOFF_HOURS = 2; // free cancellation until 2h before the show

/* ------------------------------------------------------------ time utils */
const pad = (n) => String(n).padStart(2, '0');
export const fmtDT = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
export const fmtD = (d) => fmtDT(d).slice(0, 10);
export const parseDT = (s) => {
  if (!s) return null;
  const [d, t = '00:00:00'] = s.split(' ');
  const [y, m, dd] = d.split('-').map(Number);
  const [h, mi, se = 0] = t.split(':').map(Number);
  return new Date(y, m - 1, dd, h, mi, se);
};
export const addMinutes = (d, m) => new Date(d.getTime() + m * 60000);
export const now = () => new Date();
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const ALNUM = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const randStr = (n, r = Math.random) => Array.from({ length: n }, () => ALNUM[Math.floor(r() * ALNUM.length)]).join('');
const randDigits = (n, r = Math.random) => Array.from({ length: n }, () => Math.floor(r() * 10)).join('');

export function appError(message) {
  const e = new Error(message);
  e.userMessage = message;
  return e;
}

/* ------------------------------------------------------------ core state */
const PK = {
  cinema: 'cinema_id', user_account: 'user_id', audit_log: 'audit_id', genre: 'genre_id', movie: 'movie_id',
  movie_review: 'review_id', screen: 'screen_id', seat_category: 'seat_category_id', seat: 'seat_id',
  showtime: 'showtime_id', promotion: 'promotion_id', booking: 'booking_id', booking_seat: 'booking_seat_id',
  ticket: 'ticket_id', payment: 'payment_id', food_item: 'food_item_id', food_order: 'food_order_id',
  order_detail: 'order_detail_id'
};

let data = null;
let version = 0;
let seeding = false;
const listeners = new Set();
const simCache = new Map();

export const subscribe = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
export const getVersion = () => version;

function persist() {
  try { if (typeof localStorage !== 'undefined') localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* quota */ }
}
export function save() {
  if (seeding) return;
  persist();
  version += 1;
  listeners.forEach((fn) => fn());
}

const get = (table, id) => { const k = PK[table]; return data[table].find((r) => r[k] === Number(id)); };
const nextId = (table) => { const k = PK[table]; let m = 0; for (const r of data[table]) if (r[k] > m) m = r[k]; return m + 1; };
function insertRaw(table, row) {
  const k = PK[table];
  if (k && row[k] == null) row[k] = nextId(table);
  data[table].push(row);
  return row;
}
export const table = (name) => data[name];

function audit(userId, action, entity, entityId, oldV, newV) {
  insertRaw('audit_log', {
    user_id: userId ?? null, action, entity_name: entity, entity_id: entityId != null ? String(entityId) : null,
    old_value: oldV ? JSON.stringify(oldV) : null, new_value: newV ? JSON.stringify(newV) : null,
    ip_address: '127.0.0.1', created_at: fmtDT(now())
  });
}

/* ------------------------------------------------------------ seed data */
const SLOTS = ['11:30', '14:45', '18:00', '21:15'];
const BASE_PRICE = { STANDARD: 800, '3D': 1000, IMAX: 1400, VIP: 1800 };

function seatCategoryForRow(screen, rowIdx, rows) {
  if (screen.screen_type === 'VIP') return rowIdx < 2 ? 2 : 3;
  const vipRows = 2, premiumRows = rows >= 8 ? 3 : 2;
  if (rowIdx >= rows - vipRows) return 3;
  if (rowIdx >= rows - vipRows - premiumRows) return 2;
  return 1;
}
export function generateSeats(screenId, rows, cols, screenType = 'STANDARD') {
  const out = [];
  for (let r = 0; r < rows; r++) {
    const label = String.fromCharCode(65 + r);
    for (let n = 1; n <= cols; n++) {
      out.push({ screen_id: screenId, seat_category_id: seatCategoryForRow({ screen_type: screenType }, r, rows), row_label: label, seat_number: n, seat_status: 'ACTIVE' });
    }
  }
  return out;
}

function genDay(date) {
  const ds = fmtD(date);
  if (data.showtime.some((s) => s.start_time.startsWith(ds))) return;
  const nowShowing = data.movie.filter((m) => m.movie_status === 'NOW_SHOWING');
  if (!nowShowing.length) return;
  const dayNo = Math.floor(date.getTime() / 86400000);
  const n = now();
  data.screen.forEach((sc, si) => {
    if (sc.screen_status !== 'ACTIVE') return;
    SLOTS.forEach((t, ti) => {
      const mv = nowShowing[(si * 2 + ti + dayNo) % nowShowing.length];
      const [h, m] = t.split(':').map(Number);
      const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, m);
      const end = addMinutes(start, mv.duration_minutes + 15);
      const base = BASE_PRICE[sc.screen_type];
      const row = insertRaw('showtime', {
        movie_id: mv.movie_id, screen_id: sc.screen_id, start_time: fmtDT(start), end_time: fmtDT(end),
        audio_language: mv.language, subtitle_language: mv.language === 'English' ? (ti % 2 === 0 ? 'Urdu' : null) : 'English',
        base_price: base, show_status: end < n ? 'COMPLETED' : 'ON_SALE', created_by: 6
      });
      data.seat_category.forEach((c) =>
        data.showtime_price.push({ showtime_id: row.showtime_id, seat_category_id: c.seat_category_id, price: Math.round((base * c.price_multiplier) / 10) * 10 }));
    });
  });
}

function buildSeed() {
  const n = now();
  const day = (offset, h = 12, m = 0) => fmtDT(new Date(n.getFullYear(), n.getMonth(), n.getDate() + offset, h, m));
  const d = (offset) => fmtD(new Date(n.getFullYear(), n.getMonth(), n.getDate() + offset));

  const db = {
    meta: { version: VERSION, seeded_at: fmtDT(n) },
    cinema: [], user_account: [], audit_log: [], genre: [], movie: [], movie_genre: [], movie_review: [],
    screen: [], seat_category: [], seat: [], showtime: [], showtime_price: [], promotion: [], booking: [],
    booking_seat: [], ticket: [], payment: [], food_item: [], food_order: [], order_detail: []
  };
  data = db;
  seeding = true;

  db.cinema = [
    { cinema_id: 1, cinema_name: 'QISSA Gulberg', city: 'Lahore', address: 'MM Alam Road, Gulberg III', contact_number: '042-111-246-362', cinema_status: 'ACTIVE' },
    { cinema_id: 2, cinema_name: 'QISSA DHA', city: 'Karachi', address: 'Zamzama Boulevard, Phase 5, DHA', contact_number: '021-111-246-362', cinema_status: 'ACTIVE' },
    { cinema_id: 3, cinema_name: 'QISSA F-7', city: 'Islamabad', address: 'Jinnah Super Market, F-7 Markaz', contact_number: '051-111-246-362', cinema_status: 'ACTIVE' }
  ];

  const pw = '$demo$demo1234';
  const user = (id, role, cinema, name, email, phone, status = 'ACTIVE', created = -90) => ({
    user_id: id, role, cinema_id: cinema, full_name: name, email, phone, password_hash: pw, account_status: status,
    created_at: day(created, 10), last_login_at: day(-1, 9)
  });
  db.user_account = [
    user(1, 'CUSTOMER', null, 'Ali Raza', 'ali.raza@example.com', '0300-1112233', 'ACTIVE', -80),
    user(2, 'CUSTOMER', null, 'Sara Khan', 'sara.khan@example.com', '0301-2223344', 'ACTIVE', -60),
    user(3, 'CUSTOMER', null, 'Hamza Ahmed', 'hamza.ahmed@example.com', '0321-3334455', 'ACTIVE', -45),
    user(4, 'CUSTOMER', null, 'Ayesha Malik', 'ayesha.malik@example.com', '0333-4445566', 'ACTIVE', -30),
    user(5, 'CUSTOMER', null, 'Usman Tariq', 'usman.tariq@example.com', '0345-5556677', 'ACTIVE', -12),
    user(6, 'ADMIN', null, 'System Admin', 'admin@qissa.pk', '042-111-246-362', 'ACTIVE', -200),
    user(7, 'MANAGER', 1, 'Nadia Hussain', 'manager.lahore@qissa.pk', '0300-7000001', 'ACTIVE', -150),
    user(8, 'BOX_OFFICE', 1, 'Bilal Sheikh', 'boxoffice.lahore@qissa.pk', '0300-7000002', 'ACTIVE', -120),
    user(9, 'MANAGER', 2, 'Omar Farooq', 'manager.karachi@qissa.pk', '0300-7000003', 'ACTIVE', -140),
    user(10, 'CUSTOMER', null, 'Zainab Iqbal', 'zainab.iqbal@example.com', '0302-8889900', 'SUSPENDED', -50)
  ];

  db.genre = ['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Romance', 'Animation', 'Thriller']
    .map((g, i) => ({ genre_id: i + 1, genre_name: g }));

  const M = (id, title, dur, rel, lang, rating, dir, cast, genres, status, art, synopsis) => ({
    movie_id: id, title, duration_minutes: dur, release_date: d(rel), language: lang, content_rating: rating,
    director: dir, cast_members: cast, synopsis, poster_url: null, trailer_url: `https://trailers.qissa.pk/watch/${id}`,
    movie_status: status, created_at: day(rel - 20, 9), _genres: genres, art
  });
  const movies = [
    M(1, 'Midnight Pursuit', 128, -21, 'English', 'PG-13', 'Daniel Ruiz', 'Marcus Hale, Elena Park, Tariq Aziz', [1, 8], 'NOW_SHOWING',
      { motif: 'city', c1: '#7f1d1d', c2: '#1e1b4b' }, 'A retired getaway driver is pulled back into the city\'s underworld for one last night run that will decide who owns the streets.'),
    M(2, 'Laugh Riot', 105, -14, 'Urdu', 'PG', 'Faisal Qureshi', 'Imran Siddiqui, Hina Javed, Nabeel Raza', [2], 'NOW_SHOWING',
      { motif: 'comedy', c1: '#b45309', c2: '#7c2d12' }, 'Three mismatched cousins accidentally take over a failing wedding hall and must save it before the biggest wedding of the season.'),
    M(3, 'Orbit Zero', 142, -35, 'English', 'PG-13', 'Mara Lindqvist', 'Jonah Reyes, Priya Nair, Chen Wei', [5, 1], 'NOW_SHOWING',
      { motif: 'space', c1: '#1e3a8a', c2: '#0f172a' }, 'When a research station loses contact with Earth, a small crew must repair it while something unknown drifts closer.'),
    M(4, 'The Quiet House', 98, -7, 'English', 'R', 'Oliver Grant', 'Lena Ford, Mason Cole, Ruth Abbott', [4, 8], 'NOW_SHOWING',
      { motif: 'house', c1: '#18181b', c2: '#3f3f46' }, 'A family moves into a remote house where the silence seems to listen back. Some doors should stay closed.'),
    M(5, 'Monsoon Letters', 115, -20, 'Urdu', 'PG', 'Sadia Mirza', 'Fawad Anwar, Mahira Shah, Adeel Chaudhry', [3, 6], 'NOW_SHOWING',
      { motif: 'letters', c1: '#0f766e', c2: '#1e293b' }, 'Two strangers exchange letters through a faulty post office for a whole monsoon, falling in love without ever meeting.'),
    M(6, 'Pixel Pals', 92, -28, 'English', 'G', 'Kim Alvarez', 'Voices: Tara Bloom, Leo Park, Dina Ross', [7, 2], 'NOW_SHOWING',
      { motif: 'arcade', c1: '#7e22ce', c2: '#be185d' }, 'A group of forgotten arcade characters escape their machine and race to find a way back before closing time.'),
    M(7, 'Iron Dynasty', 150, 24, 'English', 'PG-13', 'Hiroshi Tanabe', 'Ken Mori, Aiko Sato, Rahul Verma', [1, 3], 'COMING_SOON',
      { motif: 'blades', c1: '#374151', c2: '#92400e' }, 'An epic tale of rival clans, ancient swords and one heir who must unite a divided kingdom.'),
    M(8, 'Last Train Home', 110, 45, 'Urdu', 'PG', 'Ahsan Raza', 'Noman Jaffri, Zara Hashmi', [3], 'COMING_SOON',
      { motif: 'train', c1: '#9a3412', c2: '#0c4a6e' }, 'On the last train of the year, strangers share stories that change their lives forever.'),
    M(9, 'Neon Heist', 119, -120, 'English', 'PG-13', 'Vera Castellanos', 'Dante Moore, Yuki Tan, Omar Haddad', [1, 8], 'ARCHIVED',
      { motif: 'heist', c1: '#be185d', c2: '#312e81' }, 'A crew of specialists plans an impossible robbery in a city made of light.')
  ];
  movies.forEach((m) => { m._genres.forEach((g) => db.movie_genre.push({ movie_id: m.movie_id, genre_id: g })); });
  // `art` is demo-only decoration (generated poster artwork) next to the real columns
  db.movie = movies.map(({ _genres, ...rest }) => rest);

  db.seat_category = [
    { seat_category_id: 1, category_name: 'Standard', price_multiplier: 1.0 },
    { seat_category_id: 2, category_name: 'Premium', price_multiplier: 1.25 },
    { seat_category_id: 3, category_name: 'VIP', price_multiplier: 1.6 }
  ];
  db.screen = [
    { screen_id: 1, cinema_id: 1, screen_name: 'Screen 1', screen_type: 'STANDARD', screen_status: 'ACTIVE', _r: 8, _c: 12 },
    { screen_id: 2, cinema_id: 1, screen_name: 'Screen 2 IMAX', screen_type: 'IMAX', screen_status: 'ACTIVE', _r: 10, _c: 14 },
    { screen_id: 3, cinema_id: 2, screen_name: 'Screen 1 3D', screen_type: '3D', screen_status: 'ACTIVE', _r: 8, _c: 12 },
    { screen_id: 4, cinema_id: 2, screen_name: 'Screen 2 VIP', screen_type: 'VIP', screen_status: 'ACTIVE', _r: 6, _c: 8 },
    { screen_id: 5, cinema_id: 3, screen_name: 'Screen 1', screen_type: 'STANDARD', screen_status: 'ACTIVE', _r: 8, _c: 12 },
    { screen_id: 6, cinema_id: 3, screen_name: 'Screen 2 3D', screen_type: '3D', screen_status: 'ACTIVE', _r: 8, _c: 12 }
  ];
  db.screen.forEach((sc) => {
    generateSeats(sc.screen_id, sc._r, sc._c, sc.screen_type).forEach((s) => insertRaw('seat', s));
    delete sc._r; delete sc._c;
  });

  db.promotion = [
    { promotion_id: 1, promo_code: 'WELCOME10', description: '10% off your booking (up to Rs. 500)', discount_type: 'PERCENT', discount_value: 10, max_discount: 500, min_order_amount: 1000, valid_from: day(-30, 0), valid_to: day(90, 23), usage_limit_total: 500, is_active: 1 },
    { promotion_id: 2, promo_code: 'FAMILY300', description: 'Rs. 300 off when you spend Rs. 3,000 or more', discount_type: 'FLAT', discount_value: 300, max_discount: null, min_order_amount: 3000, valid_from: day(-10, 0), valid_to: day(60, 23), usage_limit_total: 200, is_active: 1 },
    { promotion_id: 3, promo_code: 'STUDENT20', description: '20% student discount (up to Rs. 800)', discount_type: 'PERCENT', discount_value: 20, max_discount: 800, min_order_amount: 800, valid_from: day(-60, 0), valid_to: day(120, 23), usage_limit_total: null, is_active: 1 },
    { promotion_id: 4, promo_code: 'EIDSPECIAL', description: 'Eid festival offer: 25% off (up to Rs. 1,000)', discount_type: 'PERCENT', discount_value: 25, max_discount: 1000, min_order_amount: 1500, valid_from: day(-120, 0), valid_to: day(-45, 23), usage_limit_total: 300, is_active: 1 },
    { promotion_id: 5, promo_code: 'WEEKEND15', description: 'Weekend special: 15% off (paused)', discount_type: 'PERCENT', discount_value: 15, max_discount: 600, min_order_amount: 1200, valid_from: day(-5, 0), valid_to: day(30, 23), usage_limit_total: 100, is_active: 0 }
  ];

  const F = (id, name, category, desc, price, emoji, avail = 'AVAILABLE') =>
    ({ food_item_id: id, item_name: name, category, description: desc, current_price: price, availability_status: avail, emoji });
  db.food_item = [
    F(1, 'Salted Popcorn (Large)', 'SNACKS', 'Freshly popped, lightly salted', 650, '🍿'),
    F(2, 'Caramel Popcorn', 'SNACKS', 'Sweet caramel-coated popcorn', 750, '🍯'),
    F(3, 'Nachos with Cheese', 'SNACKS', 'Crispy nachos with warm cheese dip', 600, '🧀'),
    F(4, 'French Fries', 'SNACKS', 'Golden fries with ketchup', 400, '🍟'),
    F(5, 'Chicken Burger', 'MEALS', 'Grilled chicken patty, lettuce and house sauce', 700, '🍔'),
    F(6, 'Chicken Wrap', 'MEALS', 'Tortilla wrap with grilled chicken and veggies', 650, '🌯'),
    F(7, 'Soft Drink (500ml)', 'DRINKS', 'Chilled cola, lemon-lime or orange', 250, '🥤'),
    F(8, 'Iced Coffee', 'DRINKS', 'Cold brew with milk and ice', 450, '☕'),
    F(9, 'Mineral Water', 'DRINKS', 'Still water, 500ml', 120, '💧'),
    F(10, 'Chocolate Brownie', 'DESSERTS', 'Warm fudge brownie', 380, '🍫', 'UNAVAILABLE'),
    F(11, 'Ice Cream Cup', 'DESSERTS', 'Two scoops with toppings', 300, '🍨'),
    F(12, 'Popcorn + 2 Drinks Combo', 'COMBOS', 'Large popcorn with two soft drinks', 1050, '🎬')
  ];

  // reviews (one per customer per movie)
  const REV = [
    [1, 1, 5, 'Edge-of-the-seat from the first minute. The chase scenes are huge on IMAX.'],
    [1, 2, 4, 'Great action, a bit long in the middle but a strong finish.'],
    [3, 1, 5, 'Beautiful visuals and a genuinely tense story. Best sci-fi of the year.'],
    [3, 3, 4, 'Loved the sound design. Worth seeing in the biggest screen you can find.'],
    [2, 2, 5, 'We laughed all the way through. Perfect family outing.'],
    [2, 4, 4, 'Funny and warm. The wedding hall scenes are hilarious.'],
    [5, 4, 5, 'A lovely, gentle story. Cried a little at the end.'],
    [5, 2, 4, 'Wonderful performances and music.'],
    [6, 5, 5, 'My kids adored it! Plenty of jokes for parents too.'],
    [4, 3, 3, 'Scary atmosphere but the ending felt rushed.'],
    [4, 5, 4, 'Properly creepy. Don\'t watch alone.']
  ];
  REV.forEach(([mv, u, rating, text], i) => insertRaw('movie_review', {
    movie_id: mv, user_id: u, rating, review_text: text, created_at: day(-(18 - i), 20)
  }));

  // showtimes: one week of history + one week ahead
  for (let off = -29; off <= 6; off++) genDay(new Date(n.getFullYear(), n.getMonth(), n.getDate() + off));

  seedBookings();
  seedAudit();
  seeding = false;
  return db;
}

/* ---- seeded bookings (history for charts and admin screens) ---- */
function seedBookings() {
  const r = rng(20261124);
  const n = now();
  const shows = data.showtime.filter((s) => parseDT(s.start_time) > addMinutes(n, -29 * 24 * 60) && parseDT(s.start_time) < addMinutes(n, 3 * 24 * 60));
  const customers = data.user_account.filter((u) => u.role === 'CUSTOMER' && u.account_status === 'ACTIVE');
  const foodAvail = data.food_item.filter((f) => f.availability_status === 'AVAILABLE');
  const promo = get('promotion', 1);
  const webMethods = ['CARD', 'CARD', 'CARD', 'EASYPAISA', 'EASYPAISA', 'JAZZCASH'];
  const usedRefs = new Set();

  for (let i = 0; i < 420; i++) {
    const show = shows[Math.floor(r() * shows.length)];
    const start = parseDT(show.start_time);
    const screen = get('screen', show.screen_id);
    const seats = data.seat.filter((s) => s.screen_id === screen.screen_id);
    const nSeats = 1 + Math.floor(r() * 4);
    const rows = [...new Set(seats.map((s) => s.row_label))];
    const row = rows[Math.floor(r() * rows.length)];
    const rowSeats = seats.filter((s) => s.row_label === row).sort((a, b) => a.seat_number - b.seat_number);
    const from = Math.floor(r() * (rowSeats.length - nSeats + 1));
    const pick = rowSeats.slice(from, from + nSeats);
    const taken = takenSeats(show.showtime_id);
    if (pick.some((s) => taken.has(s.seat_id))) continue;

    const roll = r();
    const status = roll < 0.8 ? 'CONFIRMED' : roll < 0.9 ? 'CANCELLED' : 'EXPIRED';
    const counter = screen.cinema_id === 1 && r() < 0.2 && start < n;
    let bt = counter ? addMinutes(start, -(15 + Math.floor(r() * 75))) : addMinutes(n, -Math.floor(r() * 60 * 60));
    if (bt > addMinutes(start, -30)) bt = addMinutes(start, -30 - Math.floor(r() * 600));
    if (status !== 'CONFIRMED' && start < n && counter) continue;

    const cust = counter ? null : customers[Math.floor(r() * customers.length)];
    const ticketSub = pick.reduce((a, s) => a + seatPrice(show.showtime_id, s), 0);
    let foodSub = 0;
    const foodLines = [];
    if (r() < 0.45) {
      const k = 1 + Math.floor(r() * 3);
      const items = [...foodAvail].sort(() => r() - 0.5).slice(0, k);
      items.forEach((f) => { const q = 1 + Math.floor(r() * 2); foodLines.push({ f, q }); foodSub += f.current_price * q; });
    }
    let discount = 0, promoId = null;
    if (!counter && r() < 0.18 && ticketSub + foodSub >= promo.min_order_amount) {
      promoId = 1; discount = Math.min(Math.round(((ticketSub + foodSub) * 10) / 100), promo.max_discount);
    }
    const total = ticketSub + foodSub - discount;
    let ref;
    do { ref = 'CM' + randStr(8, r); } while (usedRefs.has(ref));
    usedRefs.add(ref);

    const booking = insertRaw('booking', {
      booking_reference: ref, user_id: cust ? cust.user_id : null, guest_phone: counter ? `03${Math.floor(r() * 5)}${Math.floor(r() * 10)}-${randDigits(7, r)}` : null,
      showtime_id: show.showtime_id, booking_channel: counter ? 'COUNTER' : 'WEB', sold_by_user_id: counter ? 8 : null,
      promotion_id: promoId, ticket_subtotal: ticketSub, food_subtotal: foodSub, discount_amount: discount, total_amount: total,
      booking_status: status, booking_time: fmtDT(bt), payment_deadline: counter ? null : fmtDT(addMinutes(bt, HOLD_MINUTES)),
      cancelled_at: status === 'CANCELLED' ? fmtDT(addMinutes(bt, 45)) : null
    });
    const bsStatus = status === 'CONFIRMED' ? 'CONFIRMED' : status === 'CANCELLED' ? 'CANCELLED' : 'EXPIRED';
    const bsRows = pick.map((s) => insertRaw('booking_seat', {
      booking_id: booking.booking_id, showtime_id: show.showtime_id, screen_id: screen.screen_id, seat_id: s.seat_id,
      seat_price: seatPrice(show.showtime_id, s), seat_status: bsStatus, hold_expires_at: null
    }));

    const method = counter ? (r() < 0.7 ? 'CASH' : 'CARD') : webMethods[Math.floor(r() * webMethods.length)];
    const paidAt = addMinutes(bt, 2);
    if (status === 'EXPIRED' || (status === 'CONFIRMED' && !counter && r() < 0.08)) {
      insertRaw('payment', { booking_id: booking.booking_id, payment_type: 'PAYMENT', amount: total, payment_method: 'CARD', payment_status: 'FAILED', transaction_reference: 'TXN' + randDigits(9, r), processed_by_user_id: null, created_at: fmtDT(addMinutes(bt, 1)), paid_at: null });
    }
    if (status !== 'EXPIRED') {
      insertRaw('payment', { booking_id: booking.booking_id, payment_type: 'PAYMENT', amount: total, payment_method: method, payment_status: 'SUCCESS', transaction_reference: (method === 'CASH' ? 'CSH' : 'TXN') + randDigits(9, r), processed_by_user_id: counter ? 8 : null, created_at: fmtDT(paidAt), paid_at: fmtDT(paidAt) });
      bsRows.forEach((bs) => {
        const used = status === 'CONFIRMED' && start < n && r() < 0.92;
        insertRaw('ticket', {
          booking_seat_id: bs.booking_seat_id, ticket_code: randStr(16, r), ticket_status: status === 'CANCELLED' ? 'CANCELLED' : used ? 'USED' : 'VALID',
          issued_at: fmtDT(paidAt), checked_in_at: used ? fmtDT(addMinutes(start, -(5 + Math.floor(r() * 12)))) : null, checked_in_by_user_id: used ? 8 : null
        });
      });
    }
    if (status === 'CANCELLED') {
      insertRaw('payment', { booking_id: booking.booking_id, payment_type: 'REFUND', amount: total, payment_method: method, payment_status: 'SUCCESS', transaction_reference: 'RF' + randDigits(9, r), processed_by_user_id: 7, created_at: booking.cancelled_at, paid_at: booking.cancelled_at });
    }
    if (foodLines.length && status !== 'EXPIRED') {
      const fo = insertRaw('food_order', {
        booking_id: booking.booking_id, order_time: fmtDT(paidAt),
        order_status: status === 'CANCELLED' ? 'CANCELLED' : start < n ? 'COLLECTED' : (start - n < 60 * 60000 ? 'PREPARING' : 'PLACED'), total_amount: foodSub
      });
      foodLines.forEach(({ f, q }) => insertRaw('order_detail', { food_order_id: fo.food_order_id, food_item_id: f.food_item_id, quantity: q, unit_price: f.current_price, line_total: q * f.current_price }));
    }
  }
}

function seedAudit() {
  const n = now();
  const day = (off, h) => fmtDT(new Date(n.getFullYear(), n.getMonth(), n.getDate() + off, h, 15));
  const rows = [
    [6, 'LOGIN', 'user_account', 6, null, null, -3, 9], [6, 'CREATE', 'movie', 4, null, { title: 'The Quiet House', movie_status: 'NOW_SHOWING' }, -9, 10],
    [6, 'CREATE', 'promotion', 2, null, { promo_code: 'FAMILY300' }, -10, 11], [7, 'CREATE', 'showtime', 120, null, { screen_id: 1, movie_id: 3 }, -6, 12],
    [7, 'UPDATE', 'food_item', 10, { availability_status: 'AVAILABLE' }, { availability_status: 'UNAVAILABLE' }, -4, 15],
    [6, 'UPDATE', 'promotion', 5, { is_active: 1 }, { is_active: 0 }, -2, 16], [9, 'LOGIN', 'user_account', 9, null, null, -1, 8],
    [6, 'UPDATE', 'movie', 7, { movie_status: 'ARCHIVED' }, { movie_status: 'COMING_SOON' }, -1, 17]
  ];
  rows.forEach(([u, a, e, id, o, nw, off, h]) => insertRaw('audit_log', {
    user_id: u, action: a, entity_name: e, entity_id: String(id), old_value: o ? JSON.stringify(o) : null, new_value: nw ? JSON.stringify(nw) : null, ip_address: '192.168.1.' + (10 + u), created_at: day(off, h)
  }));
}

/* ------------------------------------------------------------ load/reset */
function ensureFutureShowtimes() {
  const n = now();
  for (let off = 0; off <= 6; off++) genDay(new Date(n.getFullYear(), n.getMonth(), n.getDate() + off));
}
function syncShowStatus() {
  const n = now();
  data.showtime.forEach((s) => { if (s.show_status === 'ON_SALE' && parseDT(s.end_time) < n) s.show_status = 'COMPLETED'; });
}
export function init() {
  if (data) return;
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null;
    if (raw) { data = JSON.parse(raw); if (data.meta?.version !== VERSION) data = null; }
  } catch { data = null; }
  if (!data) { buildSeed(); persist(); }
  seeding = true;
  ensureFutureShowtimes();
  syncShowStatus();
  seeding = false;
  expireHolds();
  persist();
}
export function resetDemoData() {
  try { if (typeof localStorage !== 'undefined') { localStorage.removeItem(KEY); localStorage.removeItem(SESSION_KEY); localStorage.removeItem('qissa_cart'); } } catch { /* ignore */ }
  data = null; simCache.clear(); init();
  version += 1; listeners.forEach((fn) => fn());
}

/* ------------------------------------------------------------ pricing */
export function priceMap(showId) {
  const m = {};
  data.showtime_price.filter((p) => p.showtime_id === Number(showId)).forEach((p) => { m[p.seat_category_id] = p.price; });
  return m;
}
function seatPrice(showId, seat) {
  const p = data.showtime_price.find((x) => x.showtime_id === showId && x.seat_category_id === seat.seat_category_id);
  return p ? p.price : get('showtime', showId).base_price;
}

/* ------------------------------------------------------------ availability */
function simTaken(show) {
  const seats = data.seat.filter((s) => s.screen_id === show.screen_id && s.seat_status === 'ACTIVE');
  const key = `${show.showtime_id}:${seats.length}`;
  if (simCache.has(key)) return simCache.get(key);
  const rand = rng(show.showtime_id * 7919 + 13);
  const hour = parseDT(show.start_time).getHours();
  let p = 0.1 + ((show.showtime_id * 37) % 22) / 100;
  if (hour >= 18) p += 0.12;
  if (show.showtime_id % 13 === 0) p = 0.96;
  if (show.showtime_id % 39 === 0) p = 1;
  const set = new Set();
  seats.forEach((s) => { if (rand() < p) set.add(s.seat_id); });
  simCache.set(key, set);
  return set;
}
/** Seats that cannot be picked: confirmed/held reservations (+ demo filler so maps look lived-in). */
export function takenSeats(showId, exceptBookingId = null) {
  const show = get('showtime', showId);
  const set = new Set(simTaken(show));
  for (const bs of data.booking_seat) {
    if (bs.showtime_id === Number(showId) && (bs.seat_status === 'HELD' || bs.seat_status === 'CONFIRMED') && bs.booking_id !== exceptBookingId) set.add(bs.seat_id);
  }
  return set;
}
export function availability(show) {
  const capacity = data.seat.filter((s) => s.screen_id === show.screen_id && s.seat_status === 'ACTIVE').length;
  const taken = takenSeats(show.showtime_id).size;
  const free = Math.max(0, capacity - taken);
  return { capacity, taken, free, pct: capacity ? Math.round((taken / capacity) * 100) : 0 };
}
export function isBookable(show, { staff = false } = {}) {
  if (!show || show.show_status !== 'ON_SALE') return false;
  const start = parseDT(show.start_time);
  return staff ? addMinutes(start, 20) > now() : start > now();
}

/* ------------------------------------------------------------ promotions */
export function promoDiscount(p, amount) {
  if (!p || amount < p.min_order_amount) return 0;
  let v = p.discount_type === 'PERCENT' ? Math.round((amount * p.discount_value) / 100) : p.discount_value;
  if (p.max_discount != null) v = Math.min(v, p.max_discount);
  return Math.min(v, amount);
}
export function promoStatus(p) {
  const n = now();
  if (!p.is_active) return 'PAUSED';
  if (parseDT(p.valid_to) < n) return 'EXPIRED';
  if (parseDT(p.valid_from) > n) return 'SCHEDULED';
  if (p.usage_limit_total != null && promoUsage(p.promotion_id) >= p.usage_limit_total) return 'EXHAUSTED';
  return 'ACTIVE';
}
export function promoUsage(promotionId) {
  return data.booking.filter((b) => b.promotion_id === promotionId && (b.booking_status === 'CONFIRMED' || b.booking_status === 'PENDING')).length;
}
export function validatePromo(code, bookingId) {
  const p = data.promotion.find((x) => x.promo_code.toLowerCase() === String(code).trim().toLowerCase());
  if (!p) return { ok: false, message: 'This promo code is not valid.' };
  const st = promoStatus(p);
  if (st === 'PAUSED') return { ok: false, message: 'This promo code is currently not active.' };
  if (st === 'EXPIRED') return { ok: false, message: 'This promo code has expired.' };
  if (st === 'SCHEDULED') return { ok: false, message: 'This promo code is not valid yet.' };
  if (st === 'EXHAUSTED') return { ok: false, message: 'This promo code has reached its usage limit.' };
  const b = get('booking', bookingId);
  const amount = b.ticket_subtotal + b.food_subtotal;
  if (amount < p.min_order_amount) return { ok: false, message: `Minimum order of ${CURRENCY} ${p.min_order_amount.toLocaleString()} required for ${p.promo_code}.` };
  return { ok: true, promotion: p, discount: promoDiscount(p, amount), message: `${p.promo_code} applied.` };
}

/* ------------------------------------------------------------ bookings */
function newRef() { let ref; do { ref = 'CM' + randStr(8); } while (data.booking.some((b) => b.booking_reference === ref)); return ref; }
function newTicketCode() { let c; do { c = randStr(16); } while (data.ticket.some((t) => t.ticket_code === c)); return c; }

function recalc(b) {
  const seats = data.booking_seat.filter((s) => s.booking_id === b.booking_id && (s.seat_status === 'HELD' || s.seat_status === 'CONFIRMED'));
  b.ticket_subtotal = seats.reduce((a, s) => a + s.seat_price, 0);
  const orders = data.food_order.filter((o) => o.booking_id === b.booking_id && o.order_status !== 'CANCELLED');
  b.food_subtotal = orders.reduce((a, o) => a + o.total_amount, 0);
  const promo = b.promotion_id ? get('promotion', b.promotion_id) : null;
  b.discount_amount = promo ? promoDiscount(promo, b.ticket_subtotal + b.food_subtotal) : 0;
  b.total_amount = Math.max(0, b.ticket_subtotal + b.food_subtotal - b.discount_amount);
  return b;
}

export function expireHolds() {
  const n = now();
  let changed = false;
  data.booking.forEach((b) => {
    if (b.booking_status === 'PENDING' && b.payment_deadline && parseDT(b.payment_deadline) < n) {
      b.booking_status = 'EXPIRED';
      data.booking_seat.forEach((s) => { if (s.booking_id === b.booking_id && s.seat_status === 'HELD') { s.seat_status = 'EXPIRED'; s.hold_expires_at = null; } });
      data.food_order.forEach((o) => { if (o.booking_id === b.booking_id && o.order_status === 'PLACED') o.order_status = 'CANCELLED'; });
      changed = true;
    }
  });
  if (changed && !seeding) save();
  return changed;
}

function validateSeatPick(show, seatIds, exceptBookingId) {
  if (!seatIds.length) throw appError('Select at least one seat.');
  if (seatIds.length > MAX_SEATS) throw appError(`You can book up to ${MAX_SEATS} seats at a time.`);
  const taken = takenSeats(show.showtime_id, exceptBookingId);
  seatIds.forEach((id) => {
    const seat = get('seat', id);
    if (!seat || seat.screen_id !== show.screen_id || seat.seat_status !== 'ACTIVE') throw appError('One of the selected seats is not available.');
    if (taken.has(seat.seat_id)) throw appError(`Seat ${seat.row_label}${seat.seat_number} was just taken. Please choose another seat.`);
  });
}
function addHeldSeats(booking, show, seatIds) {
  const deadline = booking.payment_deadline;
  seatIds.forEach((id) => {
    const seat = get('seat', id);
    insertRaw('booking_seat', {
      booking_id: booking.booking_id, showtime_id: show.showtime_id, screen_id: show.screen_id, seat_id: seat.seat_id,
      seat_price: seatPrice(show.showtime_id, seat), seat_status: 'HELD', hold_expires_at: deadline
    });
  });
}

/** Step 1 of a booking: hold the chosen seats for HOLD_MINUTES (status PENDING). */
export function createHold({ showtime_id, seat_ids, user_id = null, guest_phone = null, channel = 'WEB', sold_by = null }) {
  expireHolds();
  const show = get('showtime', showtime_id);
  if (!show) throw appError('Show not found.');
  if (!isBookable(show, { staff: channel === 'COUNTER' })) throw appError('Booking for this show is closed.');
  if (!user_id && !guest_phone) throw appError('A customer account or guest phone number is required.');
  validateSeatPick(show, seat_ids, null);
  const n = now();
  const b = insertRaw('booking', {
    booking_reference: newRef(), user_id, guest_phone, showtime_id: show.showtime_id, booking_channel: channel, sold_by_user_id: sold_by,
    promotion_id: null, ticket_subtotal: 0, food_subtotal: 0, discount_amount: 0, total_amount: 0, booking_status: 'PENDING',
    booking_time: fmtDT(n), payment_deadline: fmtDT(addMinutes(n, HOLD_MINUTES)), cancelled_at: null
  });
  addHeldSeats(b, show, seat_ids);
  recalc(b);
  save();
  return b;
}
/** Customer went back and changed their seats: swap the held seats and restart the clock. */
export function replaceHold(bookingId, seat_ids) {
  expireHolds();
  const b = get('booking', bookingId);
  if (!b || b.booking_status !== 'PENDING') throw appError('Your seat hold has expired. Please select seats again.');
  const show = get('showtime', b.showtime_id);
  validateSeatPick(show, seat_ids, b.booking_id);
  data.booking_seat.forEach((s) => { if (s.booking_id === b.booking_id && s.seat_status === 'HELD') { s.seat_status = 'CANCELLED'; s.hold_expires_at = null; } });
  b.payment_deadline = fmtDT(addMinutes(now(), HOLD_MINUTES));
  addHeldSeats(b, show, seat_ids);
  recalc(b);
  save();
  return b;
}
export function releaseHold(bookingId) {
  const b = get('booking', bookingId);
  if (!b || b.booking_status !== 'PENDING') return;
  b.booking_status = 'CANCELLED'; b.cancelled_at = fmtDT(now());
  data.booking_seat.forEach((s) => { if (s.booking_id === b.booking_id && s.seat_status === 'HELD') { s.seat_status = 'CANCELLED'; s.hold_expires_at = null; } });
  data.food_order.forEach((o) => { if (o.booking_id === b.booking_id) o.order_status = 'CANCELLED'; });
  save();
}
/** Replace the food pre-order of a pending booking. map = { food_item_id: quantity } */
export function setFood(bookingId, map) {
  expireHolds();
  const b = get('booking', bookingId);
  if (!b || b.booking_status !== 'PENDING') throw appError('Your seat hold has expired. Please select seats again.');
  let order = data.food_order.find((o) => o.booking_id === b.booking_id && o.order_status !== 'CANCELLED');
  const entries = Object.entries(map).filter(([, q]) => q > 0);
  if (!entries.length) {
    if (order) {
      data.order_detail = data.order_detail.filter((d) => d.food_order_id !== order.food_order_id);
      data.food_order = data.food_order.filter((o) => o.food_order_id !== order.food_order_id);
    }
  } else {
    if (!order) order = insertRaw('food_order', { booking_id: b.booking_id, order_time: fmtDT(now()), order_status: 'PLACED', total_amount: 0 });
    data.order_detail = data.order_detail.filter((d) => d.food_order_id !== order.food_order_id);
    let total = 0;
    entries.forEach(([id, q]) => {
      const item = get('food_item', id);
      if (!item || item.availability_status !== 'AVAILABLE') throw appError(`${item ? item.item_name : 'An item'} is no longer available.`);
      insertRaw('order_detail', { food_order_id: order.food_order_id, food_item_id: item.food_item_id, quantity: q, unit_price: item.current_price, line_total: q * item.current_price });
      total += q * item.current_price;
    });
    order.total_amount = total;
  }
  recalc(b);
  save();
  return b;
}
export function applyPromo(bookingId, code) {
  const res = validatePromo(code, bookingId);
  if (!res.ok) throw appError(res.message);
  const b = get('booking', bookingId);
  b.promotion_id = res.promotion.promotion_id;
  recalc(b);
  save();
  return res;
}
export function removePromo(bookingId) {
  const b = get('booking', bookingId);
  b.promotion_id = null;
  recalc(b);
  save();
}

function confirmBooking(b, actorId) {
  b.booking_status = 'CONFIRMED';
  b.payment_deadline = null;
  const n = fmtDT(now());
  data.booking_seat.forEach((s) => {
    if (s.booking_id === b.booking_id && s.seat_status === 'HELD') {
      s.seat_status = 'CONFIRMED'; s.hold_expires_at = null;
      insertRaw('ticket', { booking_seat_id: s.booking_seat_id, ticket_code: newTicketCode(), ticket_status: 'VALID', issued_at: n, checked_in_at: null, checked_in_by_user_id: null });
    }
  });
  data.food_order.forEach((o) => { if (o.booking_id === b.booking_id && o.order_status !== 'CANCELLED') o.order_status = 'PLACED'; });
  audit(actorId ?? b.user_id, 'CONFIRM', 'booking', b.booking_id, { booking_status: 'PENDING' }, { booking_status: 'CONFIRMED', total_amount: b.total_amount });
}
/** Record a payment attempt. outcome is simulated (SUCCESS / FAILED) since no real gateway is attached. */
export function pay(bookingId, { method, outcome = 'SUCCESS', processedBy = null }) {
  expireHolds();
  const b = get('booking', bookingId);
  if (!b) throw appError('Booking not found.');
  if (b.booking_status !== 'PENDING') throw appError(b.booking_status === 'EXPIRED' ? 'Your seat hold has expired. Please select your seats again.' : 'This booking can no longer be paid.');
  recalc(b);
  const ok = outcome === 'SUCCESS';
  const n = fmtDT(now());
  let payment = null;
  if (b.total_amount > 0) {
    payment = insertRaw('payment', {
      booking_id: b.booking_id, payment_type: 'PAYMENT', amount: b.total_amount, payment_method: method, payment_status: ok ? 'SUCCESS' : 'FAILED',
      transaction_reference: method === 'CASH' ? (ok ? 'CSH' + randDigits(9) : null) : 'TXN' + randDigits(9),
      processed_by_user_id: processedBy, created_at: n, paid_at: ok ? n : null
    });
  }
  if (ok) confirmBooking(b, processedBy);
  save();
  return { ok, payment, booking: b };
}

export function refundableTotal(b) {
  const paid = data.payment.filter((p) => p.booking_id === b.booking_id && p.payment_type === 'PAYMENT' && p.payment_status === 'SUCCESS').reduce((a, p) => a + p.amount, 0);
  const refunded = data.payment.filter((p) => p.booking_id === b.booking_id && p.payment_type === 'REFUND' && p.payment_status === 'SUCCESS').reduce((a, p) => a + p.amount, 0);
  return { paid, refunded, net: paid - refunded };
}
export function canCancel(b, { staff = false } = {}) {
  if (b.booking_status === 'PENDING') return { ok: true, refund: 0 };
  if (b.booking_status !== 'CONFIRMED') return { ok: false, reason: 'This booking is not active.' };
  const tickets = ticketsOf(b.booking_id);
  if (tickets.some((t) => t.ticket_status === 'USED')) return { ok: false, reason: 'Tickets have already been used.' };
  const show = get('showtime', b.showtime_id);
  const cutoff = addMinutes(parseDT(show.start_time), -CANCEL_CUTOFF_HOURS * 60);
  if (!staff && now() > cutoff) return { ok: false, reason: `Free cancellation closes ${CANCEL_CUTOFF_HOURS} hours before the show.` };
  if (staff && now() > parseDT(show.end_time)) return { ok: false, reason: 'The show has already finished.' };
  return { ok: true, refund: refundableTotal(b).net };
}
export function cancelBooking(bookingId, { byUserId = null, staff = false, reason = null } = {}) {
  expireHolds();
  const b = get('booking', bookingId);
  if (!b) throw appError('Booking not found.');
  const chk = canCancel(b, { staff });
  if (!chk.ok) throw appError(chk.reason);
  const was = b.booking_status;
  const n = fmtDT(now());
  let refund = null;
  if (was === 'CONFIRMED') {
    const { net } = refundableTotal(b);
    const original = data.payment.find((p) => p.booking_id === b.booking_id && p.payment_type === 'PAYMENT' && p.payment_status === 'SUCCESS');
    if (net > 0 && original) {
      refund = insertRaw('payment', {
        booking_id: b.booking_id, payment_type: 'REFUND', amount: net, payment_method: original.payment_method, payment_status: 'SUCCESS',
        transaction_reference: 'RF' + randDigits(9), processed_by_user_id: staff ? byUserId : null, created_at: n, paid_at: n
      });
    }
  }
  b.booking_status = 'CANCELLED';
  b.cancelled_at = n;
  data.booking_seat.forEach((s) => { if (s.booking_id === b.booking_id && (s.seat_status === 'HELD' || s.seat_status === 'CONFIRMED')) { s.seat_status = 'CANCELLED'; s.hold_expires_at = null; } });
  ticketsOf(b.booking_id).forEach((t) => { if (t.ticket_status === 'VALID') t.ticket_status = 'CANCELLED'; });
  data.food_order.forEach((o) => { if (o.booking_id === b.booking_id && o.order_status !== 'COLLECTED') o.order_status = 'CANCELLED'; });
  audit(byUserId ?? b.user_id, 'CANCEL', 'booking', b.booking_id, { booking_status: was }, { booking_status: 'CANCELLED', refund: refund ? refund.amount : 0, reason });
  save();
  return { booking: b, refund };
}

/** Box-office sale: hold + (optional) food + immediate payment in one step. */
export function counterSale({ showtime_id, seat_ids, guest_phone, method, food = {}, staffId }) {
  const b = createHold({ showtime_id, seat_ids, guest_phone, channel: 'COUNTER', sold_by: staffId });
  try {
    if (Object.keys(food).length) setFood(b.booking_id, food);
    return pay(b.booking_id, { method, outcome: 'SUCCESS', processedBy: staffId }).booking;
  } catch (e) { releaseHold(b.booking_id); throw e; }
}

/* ------------------------------------------------------------ tickets / check-in */
export function ticketsOf(bookingId) {
  const ids = new Set(data.booking_seat.filter((s) => s.booking_id === bookingId).map((s) => s.booking_seat_id));
  return data.ticket.filter((t) => ids.has(t.booking_seat_id));
}
export function lookupTicket(codeOrRef) {
  const code = String(codeOrRef || '').trim().toUpperCase().replace(/\s+/g, '');
  if (!code) return null;
  const t = data.ticket.find((x) => x.ticket_code === code);
  if (!t) return null;
  const bs = get('booking_seat', t.booking_seat_id);
  const booking = get('booking', bs.booking_id);
  const show = get('showtime', booking.showtime_id);
  return { ticket: t, bs, booking, seat: get('seat', bs.seat_id), show, movie: get('movie', show.movie_id), screen: get('screen', show.screen_id), cinema: get('cinema', get('screen', show.screen_id).cinema_id) };
}
export function checkIn(code, staffId) {
  const info = lookupTicket(code);
  if (!info) throw appError('Ticket not found. Check the code and try again.');
  const { ticket, show } = info;
  const seatLabel = `${info.seat.row_label}${info.seat.seat_number}`;
  if (ticket.ticket_status === 'USED') throw appError(`Ticket for seat ${seatLabel} was already used at ${ticket.checked_in_at.slice(11, 16)}.`);
  if (ticket.ticket_status === 'CANCELLED') throw appError(`Ticket for seat ${seatLabel} was cancelled and is not valid.`);
  if (info.booking.booking_status !== 'CONFIRMED') throw appError('This booking is not confirmed.');
  const n = now();
  if (fmtD(parseDT(show.start_time)) !== fmtD(n)) throw appError(`This ticket is for ${fmtD(parseDT(show.start_time))}, not today.`);
  if (parseDT(show.end_time) < n) throw appError('This show has already finished.');
  ticket.ticket_status = 'USED';
  ticket.checked_in_at = fmtDT(n);
  ticket.checked_in_by_user_id = staffId;
  audit(staffId, 'CHECK_IN', 'ticket', ticket.ticket_id, { ticket_status: 'VALID' }, { ticket_status: 'USED' });
  save();
  return lookupTicket(ticket.ticket_code);
}

/* ------------------------------------------------------------ reviews */
export function canReview(userId, movieId) {
  if (!userId) return { ok: false, reason: 'Log in to write a review.' };
  if (data.movie_review.some((r) => r.movie_id === Number(movieId) && r.user_id === userId)) return { ok: false, reason: 'You have already reviewed this movie.' };
  const hasBooking = data.booking.some((b) => b.user_id === userId && b.booking_status === 'CONFIRMED' && get('showtime', b.showtime_id).movie_id === Number(movieId));
  if (!hasBooking) return { ok: false, reason: 'Only customers with a confirmed booking for this movie can review it.' };
  return { ok: true };
}
export function addReview(userId, movieId, rating, text) {
  const c = canReview(userId, movieId);
  if (!c.ok) throw appError(c.reason);
  insertRaw('movie_review', { movie_id: Number(movieId), user_id: userId, rating, review_text: text || null, created_at: fmtDT(now()) });
  save();
}

/* ------------------------------------------------------------ showtimes (admin) */
export function findOverlap(screenId, startStr, endStr, excludeId = null) {
  const s = parseDT(startStr), e = parseDT(endStr);
  return data.showtime.find((x) => x.screen_id === Number(screenId) && x.show_status !== 'CANCELLED' && x.showtime_id !== excludeId && s < parseDT(x.end_time) && e > parseDT(x.start_time));
}
export function addShowtime({ movie_id, screen_id, start_time, audio_language, subtitle_language, base_price, prices, status = 'ON_SALE' }, actor) {
  const movie = get('movie', movie_id);
  if (!movie) throw appError('Choose a movie.');
  const start = parseDT(start_time);
  const end = addMinutes(start, movie.duration_minutes + 15);
  const clash = findOverlap(screen_id, start_time, fmtDT(end));
  if (clash) throw appError(`Overlaps show #${clash.showtime_id} on this screen (${clash.start_time.slice(11, 16)} – ${clash.end_time.slice(11, 16)}).`);
  const row = insertRaw('showtime', {
    movie_id: Number(movie_id), screen_id: Number(screen_id), start_time: fmtDT(start), end_time: fmtDT(end), audio_language,
    subtitle_language: subtitle_language || null, base_price: Number(base_price), show_status: status, created_by: actor ?? null
  });
  data.seat_category.forEach((c) => data.showtime_price.push({
    showtime_id: row.showtime_id, seat_category_id: c.seat_category_id,
    price: prices && prices[c.seat_category_id] != null ? Number(prices[c.seat_category_id]) : Math.round((Number(base_price) * c.price_multiplier) / 10) * 10
  }));
  audit(actor, 'CREATE', 'showtime', row.showtime_id, null, { movie_id: row.movie_id, screen_id: row.screen_id, start_time: row.start_time });
  save();
  return row;
}
export function cancelShowtime(showtimeId, actor) {
  const show = get('showtime', showtimeId);
  if (!show) throw appError('Show not found.');
  let n = 0;
  data.booking.filter((b) => b.showtime_id === show.showtime_id && (b.booking_status === 'CONFIRMED' || b.booking_status === 'PENDING')).forEach((b) => {
    if (b.booking_status === 'CONFIRMED') {
      const { net } = refundableTotal(b);
      const orig = data.payment.find((p) => p.booking_id === b.booking_id && p.payment_type === 'PAYMENT' && p.payment_status === 'SUCCESS');
      if (net > 0 && orig) insertRaw('payment', { booking_id: b.booking_id, payment_type: 'REFUND', amount: net, payment_method: orig.payment_method, payment_status: 'SUCCESS', transaction_reference: 'RF' + randDigits(9), processed_by_user_id: actor, created_at: fmtDT(now()), paid_at: fmtDT(now()) });
    }
    b.booking_status = 'CANCELLED'; b.cancelled_at = fmtDT(now());
    data.booking_seat.forEach((s) => { if (s.booking_id === b.booking_id && ['HELD', 'CONFIRMED'].includes(s.seat_status)) s.seat_status = 'CANCELLED'; });
    ticketsOf(b.booking_id).forEach((t) => { if (t.ticket_status === 'VALID') t.ticket_status = 'CANCELLED'; });
    data.food_order.forEach((o) => { if (o.booking_id === b.booking_id) o.order_status = 'CANCELLED'; });
    n += 1;
  });
  const old = show.show_status;
  show.show_status = 'CANCELLED';
  audit(actor, 'CANCEL', 'showtime', show.showtime_id, { show_status: old }, { show_status: 'CANCELLED', bookings_refunded: n });
  save();
  return n;
}

/* ------------------------------------------------------------ generic CRUD (admin) */
const RESTRICT = {
  movie: [['showtime', 'movie_id']], genre: [['movie_genre', 'genre_id']], cinema: [['screen', 'cinema_id'], ['user_account', 'cinema_id']],
  screen: [['showtime', 'screen_id']], seat_category: [['seat', 'seat_category_id']], food_item: [['order_detail', 'food_item_id']],
  promotion: [['booking', 'promotion_id']], showtime: [['booking', 'showtime_id']],
  user_account: [['booking', 'user_id'], ['booking', 'sold_by_user_id'], ['showtime', 'created_by']]
};
const CASCADE = {
  movie: [['movie_genre', 'movie_id'], ['movie_review', 'movie_id']], screen: [['seat', 'screen_id']],
  showtime: [['showtime_price', 'showtime_id']], user_account: [['movie_review', 'user_id']]
};
const diff = (o, n) => { const a = {}, b = {}; Object.keys(n).forEach((k) => { if (JSON.stringify(o[k]) !== JSON.stringify(n[k])) { a[k] = o[k]; b[k] = n[k]; } }); return [a, b]; };
export const crud = {
  insert(tbl, row, actor) {
    const r = insertRaw(tbl, row);
    const { art, ...clean } = r;
    audit(actor, 'CREATE', tbl, r[PK[tbl]], null, clean);
    save();
    return r;
  },
  update(tbl, id, patch, actor) {
    const r = get(tbl, id);
    if (!r) throw appError('Record not found.');
    const [o, n] = diff(r, patch);
    Object.assign(r, patch);
    if (Object.keys(n).length) audit(actor, 'UPDATE', tbl, id, o, n);
    save();
    return r;
  },
  remove(tbl, id, actor) {
    const r = get(tbl, id);
    if (!r) throw appError('Record not found.');
    for (const [t, col] of RESTRICT[tbl] || []) {
      const cnt = data[t].filter((x) => x[col] === Number(id)).length;
      if (cnt) throw appError(`Cannot delete: referenced by ${cnt} ${t.replace('_', ' ')} record(s). Archive or deactivate it instead.`);
    }
    for (const [t, col] of CASCADE[tbl] || []) data[t] = data[t].filter((x) => x[col] !== Number(id));
    data[tbl] = data[tbl].filter((x) => x[PK[tbl]] !== Number(id));
    audit(actor, 'DELETE', tbl, id, { ...r, art: undefined }, null);
    save();
  },
  /** replace the genres of a movie (movie_genre rows) */
  setMovieGenres(movieId, genreIds) {
    data.movie_genre = data.movie_genre.filter((g) => g.movie_id !== Number(movieId));
    genreIds.forEach((g) => data.movie_genre.push({ movie_id: Number(movieId), genre_id: Number(g) }));
    save();
  },
  /** create a screen and generate its seats */
  createScreen({ cinema_id, screen_name, screen_type, rows, cols }, actor) {
    if (data.screen.some((s) => s.cinema_id === Number(cinema_id) && s.screen_name.toLowerCase() === screen_name.trim().toLowerCase())) throw appError('A screen with this name already exists in this cinema.');
    const sc = insertRaw('screen', { cinema_id: Number(cinema_id), screen_name: screen_name.trim(), screen_type, screen_status: 'ACTIVE' });
    generateSeats(sc.screen_id, Number(rows), Number(cols), screen_type).forEach((s) => insertRaw('seat', s));
    audit(actor, 'CREATE', 'screen', sc.screen_id, null, { screen_name: sc.screen_name, seats: rows * cols });
    save();
    return sc;
  },
  saveSeatLayout(screenId, changes, actor) {
    let n = 0;
    Object.entries(changes).forEach(([seatId, patch]) => { const s = get('seat', seatId); if (s) { Object.assign(s, patch); n += 1; } });
    simCache.clear();
    audit(actor, 'UPDATE', 'seat', null, null, { screen_id: screenId, seats_changed: n });
    save();
  },
  setFoodOrderStatus(orderId, status, actor) {
    const o = get('food_order', orderId);
    const old = o.order_status;
    o.order_status = status;
    audit(actor, 'UPDATE', 'food_order', orderId, { order_status: old }, { order_status: status });
    save();
  }
};

/* ------------------------------------------------------------ queries */
const seatsOf = (screenId) => data.seat.filter((s) => s.screen_id === Number(screenId));
export const q = {
  movies: () => data.movie,
  movie: (id) => get('movie', id),
  genres: () => data.genre,
  genresOf: (movieId) => data.movie_genre.filter((g) => g.movie_id === Number(movieId)).map((g) => get('genre', g.genre_id)).filter(Boolean),
  ratingOf(movieId) {
    const rs = data.movie_review.filter((r) => r.movie_id === Number(movieId));
    const dist = [0, 0, 0, 0, 0];
    rs.forEach((r) => { dist[r.rating - 1] += 1; });
    return { avg: rs.length ? rs.reduce((a, r) => a + r.rating, 0) / rs.length : 0, count: rs.length, dist };
  },
  reviewsOf: (movieId) => data.movie_review.filter((r) => r.movie_id === Number(movieId)).sort((a, b) => b.created_at.localeCompare(a.created_at)).map((r) => ({ ...r, user: get('user_account', r.user_id) })),
  cinemas: () => data.cinema,
  cinema: (id) => get('cinema', id),
  screens: () => data.screen,
  screen: (id) => get('screen', id),
  screensOf: (cinemaId) => data.screen.filter((s) => s.cinema_id === Number(cinemaId)),
  cinemaOfScreen: (screenId) => get('cinema', get('screen', screenId).cinema_id),
  seatsOf,
  capacity: (screenId) => seatsOf(screenId).filter((s) => s.seat_status === 'ACTIVE').length,
  seatCategories: () => data.seat_category,
  seatCategory: (id) => get('seat_category', id),
  showtimes: () => data.showtime,
  showtime: (id) => get('showtime', id),
  showFull(id) {
    const show = get('showtime', id);
    if (!show) return null;
    const screen = get('screen', show.screen_id);
    return { show, movie: get('movie', show.movie_id), screen, cinema: get('cinema', screen.cinema_id), prices: priceMap(show.showtime_id), availability: availability(show) };
  },
  minPrice: (showId) => Math.min(...Object.values(priceMap(showId))),
  promotions: () => data.promotion,
  food: () => data.food_item,
  foodItem: (id) => get('food_item', id),
  users: () => data.user_account,
  user: (id) => get('user_account', id),
  bookings: () => data.booking,
  booking: (id) => get('booking', id),
  bookingByRef: (ref) => data.booking.find((b) => b.booking_reference === String(ref).toUpperCase()),
  bookingsOfUser: (userId) => data.booking.filter((b) => b.user_id === userId),
  payments: () => data.payment,
  paymentsOf: (bookingId) => data.payment.filter((p) => p.booking_id === bookingId),
  foodOrders: () => data.food_order,
  auditLog: () => data.audit_log,
  bookingFull(b) {
    if (!b) return null;
    const show = get('showtime', b.showtime_id);
    const screen = get('screen', show.screen_id);
    const seats = data.booking_seat.filter((s) => s.booking_id === b.booking_id).map((bs) => ({
      bs, seat: get('seat', bs.seat_id), category: get('seat_category', get('seat', bs.seat_id).seat_category_id), ticket: data.ticket.find((t) => t.booking_seat_id === bs.booking_seat_id) || null
    }));
    const foodOrders = data.food_order.filter((o) => o.booking_id === b.booking_id).map((order) => ({
      order, lines: data.order_detail.filter((d) => d.food_order_id === order.food_order_id).map((detail) => ({ detail, item: get('food_item', detail.food_item_id) }))
    }));
    return {
      booking: b, show, movie: get('movie', show.movie_id), screen, cinema: get('cinema', screen.cinema_id), user: b.user_id ? get('user_account', b.user_id) : null,
      seller: b.sold_by_user_id ? get('user_account', b.sold_by_user_id) : null, promo: b.promotion_id ? get('promotion', b.promotion_id) : null,
      seats, activeSeats: seats.filter((s) => s.bs.seat_status === 'HELD' || s.bs.seat_status === 'CONFIRMED'), foodOrders,
      payments: data.payment.filter((p) => p.booking_id === b.booking_id).sort((a, c) => a.created_at.localeCompare(c.created_at)), money: refundableTotal(b)
    };
  }
};

/* ------------------------------------------------------------ auth */
export const auth = {
  current() {
    try {
      const id = typeof localStorage !== 'undefined' ? localStorage.getItem(SESSION_KEY) : null;
      return id ? get('user_account', id) || null : null;
    } catch { return null; }
  },
  login(email, password) {
    const u = data.user_account.find((x) => x.email.toLowerCase() === String(email).trim().toLowerCase());
    if (!u || u.password_hash !== '$demo$' + password) throw appError('Incorrect email or password.');
    if (u.account_status !== 'ACTIVE') throw appError('This account is suspended. Please contact support.');
    u.last_login_at = fmtDT(now());
    if (u.role !== 'CUSTOMER') audit(u.user_id, 'LOGIN', 'user_account', u.user_id, null, null);
    localStorage.setItem(SESSION_KEY, String(u.user_id));
    save();
    return u;
  },
  logout() { localStorage.removeItem(SESSION_KEY); version += 1; listeners.forEach((fn) => fn()); },
  register({ full_name, email, phone, password }) {
    if (data.user_account.some((x) => x.email.toLowerCase() === email.trim().toLowerCase())) throw appError('An account with this email already exists.');
    const u = insertRaw('user_account', { role: 'CUSTOMER', cinema_id: null, full_name: full_name.trim(), email: email.trim(), phone: phone || null, password_hash: '$demo$' + password, account_status: 'ACTIVE', created_at: fmtDT(now()), last_login_at: fmtDT(now()) });
    localStorage.setItem(SESSION_KEY, String(u.user_id));
    save();
    return u;
  },
  updateProfile(userId, { full_name, phone }) {
    const u = get('user_account', userId);
    u.full_name = full_name.trim(); u.phone = phone || null;
    save();
    return u;
  },
  changePassword(userId, current, next) {
    const u = get('user_account', userId);
    if (u.password_hash !== '$demo$' + current) throw appError('Your current password is incorrect.');
    if (next.length < 6) throw appError('New password must be at least 6 characters.');
    u.password_hash = '$demo$' + next;
    save();
  }
};

init();
