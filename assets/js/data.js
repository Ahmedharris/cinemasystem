/* =====================================================================
   MOCK DATA  (prototype only)
   Mirrors the ERD: Genre, Movie, Cinema, Screen, Seat, Show, Customer,
   Booking, Booking_Seat, Ticket, Payment, Food_Item, Food_Order, Order_Detail.
   When PHP/MySQL is added, these arrays get replaced by database queries.
   ===================================================================== */

const CURRENCY = "Rs.";

const GENRES = [
  { id: 1, name: "Action" }, { id: 2, name: "Comedy" }, { id: 3, name: "Drama" },
  { id: 4, name: "Horror" }, { id: 5, name: "Sci-Fi" }, { id: 6, name: "Romance" },
  { id: 7, name: "Animation" }, { id: 8, name: "Thriller" }
];

// movie_status: NOW_SHOWING | COMING_SOON | ARCHIVED
const MOVIES = [
  { id: 1, title: "Midnight Pursuit", duration: 128, release: "2026-10-30", language: "English", rating: "PG-13", status: "NOW_SHOWING", genres: [1, 8], emoji: "🚗", colors: ["#7f1d1d", "#1e1b4b"], synopsis: "A retired getaway driver is pulled back into the city's underworld for one last night run that will decide who owns the streets." },
  { id: 2, title: "Laugh Riot", duration: 105, release: "2026-11-06", language: "Urdu", rating: "PG", status: "NOW_SHOWING", genres: [2], emoji: "😂", colors: ["#b45309", "#7c2d12"], synopsis: "Three mismatched cousins accidentally take over a failing wedding hall and must save it before the biggest wedding of the season." },
  { id: 3, title: "Orbit Zero", duration: 142, release: "2026-10-16", language: "English", rating: "PG-13", status: "NOW_SHOWING", genres: [5, 1], emoji: "🚀", colors: ["#1e3a8a", "#0f172a"], synopsis: "When a research station loses contact with Earth, a small crew must repair it while something unknown drifts closer." },
  { id: 4, title: "The Quiet House", duration: 98, release: "2026-11-13", language: "English", rating: "R", status: "NOW_SHOWING", genres: [4, 8], emoji: "🏚️", colors: ["#111827", "#3f3f46"], synopsis: "A family moves into a remote house where the silence seems to listen back. Some doors should stay closed." },
  { id: 5, title: "Monsoon Letters", duration: 115, release: "2026-11-01", language: "Urdu", rating: "PG", status: "NOW_SHOWING", genres: [3, 6], emoji: "💌", colors: ["#0f766e", "#1e293b"], synopsis: "Two strangers exchange letters through a faulty post office for a whole monsoon, falling in love without ever meeting." },
  { id: 6, title: "Pixel Pals", duration: 92, release: "2026-10-23", language: "English", rating: "G", status: "NOW_SHOWING", genres: [7, 2], emoji: "🎮", colors: ["#7e22ce", "#be185d"], synopsis: "A group of forgotten arcade characters escape their machine and race to find a way back before closing time." },
  { id: 7, title: "Iron Dynasty", duration: 150, release: "2026-12-12", language: "English", rating: "PG-13", status: "COMING_SOON", genres: [1, 3], emoji: "⚔️", colors: ["#374151", "#92400e"], synopsis: "An epic tale of rival clans, ancient swords and one heir who must unite a divided kingdom." },
  { id: 8, title: "Last Train Home", duration: 110, release: "2026-12-25", language: "Urdu", rating: "PG", status: "COMING_SOON", genres: [3], emoji: "🚆", colors: ["#9a3412", "#0c4a6e"], synopsis: "On the last train of the year, strangers share stories that change their lives forever." },
  { id: 9, title: "Neon Heist", duration: 119, release: "2026-08-15", language: "English", rating: "PG-13", status: "ARCHIVED", genres: [1, 8], emoji: "💎", colors: ["#be185d", "#312e81"], synopsis: "A crew of specialists plans an impossible robbery in a city made of light." }
];

const CINEMAS = [
  { id: 1, name: "CineMax Gulberg", city: "Lahore", address: "MM Alam Road, Gulberg III", contact: "042-111-222-333" },
  { id: 2, name: "CineMax DHA", city: "Karachi", address: "Phase 8, Zamzama Boulevard", contact: "021-111-222-444" },
  { id: 3, name: "CineMax F-7", city: "Islamabad", address: "Jinnah Super Market, F-7 Markaz", contact: "051-111-222-555" }
];

// screen_type: Standard | 3D | IMAX | VIP   (capacity is derived from seat count)
const SCREENS = [
  { id: 1, cinemaId: 1, name: "Screen 1", type: "Standard", rows: 8, cols: 12 },
  { id: 2, cinemaId: 1, name: "Screen 2 (IMAX)", type: "IMAX", rows: 8, cols: 12 },
  { id: 3, cinemaId: 2, name: "Screen 1", type: "3D", rows: 8, cols: 12 },
  { id: 4, cinemaId: 2, name: "Screen 2 (VIP)", type: "VIP", rows: 8, cols: 12 },
  { id: 5, cinemaId: 3, name: "Screen 1", type: "Standard", rows: 8, cols: 12 },
  { id: 6, cinemaId: 3, name: "Screen 2", type: "3D", rows: 8, cols: 12 }
];

const SCREEN_BASE_PRICE = { Standard: 800, "3D": 1000, IMAX: 1400, VIP: 1800 };
const SEAT_MULTIPLIER = { Standard: 1, Premium: 1.25, VIP: 1.6 };

const FOOD_ITEMS = [
  { id: 1, name: "Salted Popcorn (Large)", desc: "Freshly popped, lightly salted", price: 650, icon: "🍿", category: "Snacks", available: true },
  { id: 2, name: "Caramel Popcorn", desc: "Sweet caramel coated popcorn", price: 750, icon: "🍿", category: "Snacks", available: true },
  { id: 3, name: "Nachos with Cheese", desc: "Crispy nachos with warm cheese dip", price: 600, icon: "🧀", category: "Snacks", available: true },
  { id: 4, name: "Chicken Burger", desc: "Grilled chicken patty, lettuce, sauce", price: 700, icon: "🍔", category: "Meals", available: true },
  { id: 5, name: "French Fries", desc: "Golden fries with ketchup", price: 400, icon: "🍟", category: "Snacks", available: true },
  { id: 6, name: "Cola (500ml)", desc: "Chilled soft drink", price: 250, icon: "🥤", category: "Drinks", available: true },
  { id: 7, name: "Iced Coffee", desc: "Cold brew with milk", price: 450, icon: "☕", category: "Drinks", available: true },
  { id: 8, name: "Bottled Water", desc: "Mineral water 500ml", price: 120, icon: "💧", category: "Drinks", available: true },
  { id: 9, name: "Combo: Popcorn + 2 Cola", desc: "Large popcorn with two colas", price: 1050, icon: "🎬", category: "Combos", available: true },
  { id: 10, name: "Chocolate Brownie", desc: "Warm fudge brownie", price: 380, icon: "🍫", category: "Desserts", available: false }
];

const CUSTOMERS = [
  { id: 1, name: "Ali Raza", email: "ali.raza@example.com", phone: "0300-1112233", joined: "2026-09-12" },
  { id: 2, name: "Sara Khan", email: "sara.khan@example.com", phone: "0301-2223344", joined: "2026-09-20" },
  { id: 3, name: "Hamza Ahmed", email: "hamza.a@example.com", phone: "0321-3334455", joined: "2026-10-02" },
  { id: 4, name: "Ayesha Malik", email: "ayesha.m@example.com", phone: "0333-4445566", joined: "2026-10-15" },
  { id: 5, name: "Usman Tariq", email: "usman.t@example.com", phone: "0345-5556677", joined: "2026-11-01" }
];

/* ---------------------------------------------------------------------
   Generated data: Shows (next 7 days) + Seats
   --------------------------------------------------------------------- */
const SHOW_TIMES = ["12:00", "15:30", "19:00", "22:15"];

function pad2(n) { return String(n).padStart(2, "0"); }
function toDateStr(d) { return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate()); }

const SHOWS = (function () {
  const list = [];
  const nowShowing = MOVIES.filter(m => m.status === "NOW_SHOWING");
  const today = new Date();
  let id = 1;
  for (let day = 0; day < 7; day++) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + day);
    SCREENS.forEach((sc, si) => {
      SHOW_TIMES.forEach((t, ti) => {
        const movie = nowShowing[(si * 2 + ti + day) % nowShowing.length];
        const [h, m] = t.split(":").map(Number);
        const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m);
        const end = new Date(start.getTime() + (movie.duration + 15) * 60000);
        list.push({
          id: id++, movieId: movie.id, screenId: sc.id, date: toDateStr(d),
          start: pad2(h) + ":" + pad2(m),
          end: pad2(end.getHours()) + ":" + pad2(end.getMinutes()),
          basePrice: SCREEN_BASE_PRICE[sc.type],
          status: "SCHEDULED"
        });
      });
    });
  }
  return list;
})();

// Build seat list for a screen: row_label, seat_number, seat_type
function getSeats(screenId) {
  const sc = SCREENS.find(s => s.id === screenId);
  const seats = [];
  for (let r = 0; r < sc.rows; r++) {
    const label = String.fromCharCode(65 + r);
    const type = r < sc.rows - 5 ? "Standard" : (r < sc.rows - 2 ? "Premium" : "VIP");
    for (let n = 1; n <= sc.cols; n++) {
      seats.push({ id: label + n, row: label, number: n, type: type });
    }
  }
  return seats;
}
function screenCapacity(screenId) { return getSeats(screenId).length; }

// Deterministic "already booked" seats so the demo looks realistic
function seededTakenSeats(showId) {
  const show = SHOWS.find(s => s.id === showId);
  const seats = getSeats(show.screenId);
  const taken = [];
  seats.forEach((s, i) => {
    const x = Math.sin(showId * 97 + i * 13.37) * 10000;
    if ((x - Math.floor(x)) < 0.22) taken.push(s.id);
  });
  return taken;
}

/* ---------------------------------------------------------------------
   Sample bookings (for admin pages and "My bookings")
   --------------------------------------------------------------------- */
const SAMPLE_BOOKINGS = [
  { id: "BK-1001", customerId: 1, showId: 3,  time: "2026-11-18 14:05", status: "CONFIRMED", seats: [["E5", "Premium"], ["E6", "Premium"]], food: [[1, 1], [6, 2]], payment: { method: "Card", status: "SUCCESS", ref: "TXN-88123" } },
  { id: "BK-1002", customerId: 2, showId: 7,  time: "2026-11-18 16:20", status: "CONFIRMED", seats: [["G3", "VIP"]], food: [], payment: { method: "Easypaisa", status: "SUCCESS", ref: "TXN-88124" } },
  { id: "BK-1003", customerId: 3, showId: 10, time: "2026-11-19 09:12", status: "CANCELLED", seats: [["B2", "Standard"], ["B3", "Standard"], ["B4", "Standard"]], food: [], payment: { method: "Card", status: "REFUNDED", ref: "TXN-88125" } },
  { id: "BK-1004", customerId: 4, showId: 13, time: "2026-11-19 11:45", status: "CONFIRMED", seats: [["F7", "Premium"], ["F8", "Premium"], ["F9", "Premium"]], food: [[9, 1]], payment: { method: "JazzCash", status: "SUCCESS", ref: "TXN-88126" } },
  { id: "BK-1005", customerId: 1, showId: 18, time: "2026-11-19 18:30", status: "CONFIRMED", seats: [["H1", "VIP"], ["H2", "VIP"]], food: [[2, 2], [7, 2]], payment: { method: "Card", status: "SUCCESS", ref: "TXN-88127" } },
  { id: "BK-1006", customerId: 5, showId: 21, time: "2026-11-20 10:02", status: "PENDING", seats: [["C4", "Standard"]], food: [], payment: { method: "Card", status: "PENDING", ref: null } },
  { id: "BK-1007", customerId: 2, showId: 22, time: "2026-11-20 12:40", status: "CONFIRMED", seats: [["D10", "Premium"], ["D11", "Premium"]], food: [[3, 1]], payment: { method: "Cash at counter", status: "SUCCESS", ref: "TXN-88128" } },
  { id: "BK-1008", customerId: 3, showId: 5,  time: "2026-11-20 13:15", status: "CONFIRMED", seats: [["A6", "Standard"], ["A7", "Standard"]], food: [[5, 2]], payment: { method: "Card", status: "SUCCESS", ref: "TXN-88129" } }
];
