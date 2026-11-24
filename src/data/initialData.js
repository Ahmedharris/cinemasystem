export const CURRENCY = "Rs.";

export const GENRES = [
  { id: 1, name: "Action" },
  { id: 2, name: "Comedy" },
  { id: 3, name: "Drama" },
  { id: 4, name: "Horror" },
  { id: 5, name: "Sci-Fi" },
  { id: 6, name: "Romance" },
  { id: 7, name: "Animation" },
  { id: 8, name: "Thriller" }
];

export const MOVIES = [
  {
    id: 1,
    title: "Midnight Pursuit",
    duration: 128,
    release: "2026-10-30",
    language: "English",
    rating: "PG-13",
    status: "NOW_SHOWING",
    genres: [1, 8],
    emoji: "🚗",
    colors: ["#7f1d1d", "#1e1b4b"],
    poster: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80",
    backdrop: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1600&q=80",
    synopsis: "A retired getaway driver is pulled back into the city's neon underworld for one last nocturnal run that will decide who controls the streets. High-octane chases meet a tense battle of wits.",
    director: "Marcus Vance",
    cast: ["David Caine", "Elena Rostova", "Kaelen Cross"],
    featured: true
  },
  {
    id: 2,
    title: "Laugh Riot",
    duration: 105,
    release: "2026-11-06",
    language: "Urdu",
    rating: "PG",
    status: "NOW_SHOWING",
    genres: [2],
    emoji: "😂",
    colors: ["#b45309", "#7c2d12"],
    poster: "https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&w=800&q=80",
    backdrop: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=1600&q=80",
    synopsis: "Three mismatched cousins accidentally take over a failing heritage wedding hall in Lahore and must host the year's most extravagant celebrity wedding without getting caught.",
    director: "Bilal Siddiqui",
    cast: ["Ahmed Ali", "Sanam Noor", "Farhan Saeed"],
    featured: false
  },
  {
    id: 3,
    title: "Orbit Zero",
    duration: 142,
    release: "2026-10-16",
    language: "English",
    rating: "PG-13",
    status: "NOW_SHOWING",
    genres: [5, 1],
    emoji: "🚀",
    colors: ["#1e3a8a", "#0f172a"],
    poster: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80",
    backdrop: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1600&q=80",
    synopsis: "When deep space station Aegis-9 loses quantum communication with Earth, a crew of specialists investigates only to find an unexplained gravitational anomaly bending time and reality.",
    director: "Helena Rost",
    cast: ["Nathaniel Frost", "Sora Tanaka", "Michael B. Jordan"],
    featured: true
  },
  {
    id: 4,
    title: "The Quiet House",
    duration: 98,
    release: "2026-11-13",
    language: "English",
    rating: "R",
    status: "NOW_SHOWING",
    genres: [4, 8],
    emoji: "🏚️",
    colors: ["#111827", "#3f3f46"],
    poster: "https://images.unsplash.com/photo-1509248961158-e54f6934749c?auto=format&fit=crop&w=800&q=80",
    backdrop: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80",
    synopsis: "A family moves into a secluded countryside manor where the silence is unnaturally dense. As cold winter sets in, hidden doorways and locked diaries reveal horrors meant to stay buried.",
    director: "Arthur Pendelton",
    cast: ["Claire Danes", "Patrick Wilson", "Mia Goth"],
    featured: false
  },
  {
    id: 5,
    title: "Monsoon Letters",
    duration: 115,
    release: "2026-11-01",
    language: "Urdu",
    rating: "PG",
    status: "NOW_SHOWING",
    genres: [3, 6],
    emoji: "💌",
    colors: ["#0f766e", "#1e293b"],
    poster: "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=800&q=80",
    backdrop: "https://images.unsplash.com/photo-1428908728789-d2de25dbd4e2?auto=format&fit=crop&w=1600&q=80",
    synopsis: "Two strangers exchange misdelivered handwritten letters during a stormy monsoon season in old Islamabad, forging a profound connection without ever speaking face to face.",
    director: "Zoya Rehman",
    cast: ["Hamza Sohail", "Yumna Zaidi", "Noman Ijaz"],
    featured: false
  },
  {
    id: 6,
    title: "Pixel Pals",
    duration: 92,
    release: "2026-10-23",
    language: "English",
    rating: "G",
    status: "NOW_SHOWING",
    genres: [7, 2],
    emoji: "🎮",
    colors: ["#7e22ce", "#be185d"],
    poster: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80",
    backdrop: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1600&q=80",
    synopsis: "When a vintage arcade is scheduled for demolition, a heroic pixelated knight and a sassy 8-bit dragon escape into the internet to find a gamer who can preserve their code forever.",
    director: "Leo Matsuda",
    cast: ["Ben Schwartz", "Awkwafina", "Jack Black"],
    featured: false
  },
  {
    id: 7,
    title: "Iron Dynasty",
    duration: 150,
    release: "2026-12-12",
    language: "English",
    rating: "PG-13",
    status: "COMING_SOON",
    genres: [1, 3],
    emoji: "⚔️",
    colors: ["#374151", "#92400e"],
    poster: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80",
    backdrop: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1600&q=80",
    synopsis: "An epic martial arts saga set in a feudal kingdom torn apart by warlords. An exiled princess wields her ancestors' forged celestial blade to unite the realm against an invincible tyrant.",
    director: "Zhang Ke",
    cast: ["Tony Leung", "Michelle Yeoh", "Simu Liu"],
    featured: true
  },
  {
    id: 8,
    title: "Last Train Home",
    duration: 110,
    release: "2026-12-25",
    language: "Urdu",
    rating: "PG",
    status: "COMING_SOON",
    genres: [3],
    emoji: "🚆",
    colors: ["#9a3412", "#0c4a6e"],
    poster: "https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=800&q=80",
    backdrop: "https://images.unsplash.com/photo-1509749837427-ac94a2553d0e?auto=format&fit=crop&w=1600&q=80",
    synopsis: "On the final express train journey of the year traveling through the snowy northern valleys, travellers from completely different walks of life share confessions that alter their destinies.",
    director: "Sarmad Khoosat",
    cast: ["Fawad Khan", "Sania Saeed", "Mikaal Zulfiqar"],
    featured: false
  },
  {
    id: 9,
    title: "Neon Heist",
    duration: 119,
    release: "2026-08-15",
    language: "English",
    rating: "PG-13",
    status: "ARCHIVED",
    genres: [1, 8],
    emoji: "💎",
    colors: ["#be185d", "#312e81"],
    poster: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
    backdrop: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1600&q=80",
    synopsis: "A charismatic crew of cyber-hackers attempts an impossible heist inside a sky-high automated vault during the largest solar eclipse in Tokyo.",
    director: "Kenji Sato",
    cast: ["Hiroyuki Sanada", "Karen Fukuhara"],
    featured: false
  }
];

export const CINEMAS = [
  {
    id: 1,
    name: "CineMax Gulberg",
    city: "Lahore",
    address: "MM Alam Road, Gulberg III",
    contact: "042-111-222-333",
    amenities: ["Dolby Atmos", "4K Laser", "VIP Lounge", "Valet Parking"],
    image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 2,
    name: "CineMax DHA",
    city: "Karachi",
    address: "Phase 8, Zamzama Boulevard",
    contact: "021-111-222-444",
    amenities: ["IMAX with Laser", "Recliner Seats", "Gourmet Cafe", "Dolby Atmos"],
    image: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 3,
    name: "CineMax F-7",
    city: "Islamabad",
    address: "Jinnah Super Market, F-7 Markaz",
    contact: "051-111-222-555",
    amenities: ["Barco 4K", "Dolby Atmos 7.1", "Express Concessions"],
    image: "https://images.unsplash.com/photo-1574267432553-4b4628081c31?auto=format&fit=crop&w=800&q=80"
  }
];

export const SCREENS = [
  { id: 1, cinemaId: 1, name: "Screen 1 (Grand)", type: "Standard", rows: 8, cols: 12 },
  { id: 2, cinemaId: 1, name: "Screen 2 (IMAX)", type: "IMAX", rows: 8, cols: 12 },
  { id: 3, cinemaId: 2, name: "Screen 1 (3D Luxe)", type: "3D", rows: 8, cols: 12 },
  { id: 4, cinemaId: 2, name: "Screen 2 (VIP Recliners)", type: "VIP", rows: 8, cols: 12 },
  { id: 5, cinemaId: 3, name: "Screen 1 (Classic)", type: "Standard", rows: 8, cols: 12 },
  { id: 6, cinemaId: 3, name: "Screen 2 (Dolby 3D)", type: "3D", rows: 8, cols: 12 }
];

export const SCREEN_BASE_PRICE = {
  Standard: 800,
  "3D": 1000,
  IMAX: 1400,
  VIP: 1800
};

export const SEAT_MULTIPLIER = {
  Standard: 1,
  Premium: 1.25,
  VIP: 1.6
};

export const FOOD_ITEMS = [
  {
    id: 1,
    name: "Salted Popcorn (Large)",
    desc: "Freshly popped golden corn kernels, lightly salted with premium cinema butter.",
    price: 650,
    icon: "🍿",
    category: "Snacks",
    calories: "450 kcal",
    available: true
  },
  {
    id: 2,
    name: "Gourmet Caramel Popcorn",
    desc: "Sweet brown sugar caramelized popcorn with a crispy artisanal crunch.",
    price: 750,
    icon: "🍿",
    category: "Snacks",
    calories: "580 kcal",
    available: true
  },
  {
    id: 3,
    name: "Crispy Nachos & Jalapeño Cheese",
    desc: "Warm tortilla chips served with melted cheddar cheese sauce and sliced jalapeños.",
    price: 600,
    icon: "🧀",
    category: "Snacks",
    calories: "520 kcal",
    available: true
  },
  {
    id: 4,
    name: "Signature Grilled Chicken Burger",
    desc: "Chargrilled chicken fillet, crisp butterhead lettuce, melted gouda & secret sauce.",
    price: 700,
    icon: "🍔",
    category: "Meals",
    calories: "680 kcal",
    available: true
  },
  {
    id: 5,
    name: "Golden Crinkle Fries",
    desc: "Seasoned deep-fried potato wedges with garlic mayo dip and tomato ketchup.",
    price: 400,
    icon: "🍟",
    category: "Snacks",
    calories: "380 kcal",
    available: true
  },
  {
    id: 6,
    name: "Fountain Cola (500ml)",
    desc: "Ice-cold sparkling refreshment poured fresh with lemon wedge option.",
    price: 250,
    icon: "🥤",
    category: "Drinks",
    calories: "190 kcal",
    available: true
  },
  {
    id: 7,
    name: "Iced Cold Brew Coffee",
    desc: "Slow steeped espresso blend served over clear ice cubes with chilled whole milk.",
    price: 450,
    icon: "☕",
    category: "Drinks",
    calories: "110 kcal",
    available: true
  },
  {
    id: 8,
    name: "Artesian Spring Water (500ml)",
    desc: "Pure naturally filtered mountain mineral water.",
    price: 120,
    icon: "💧",
    category: "Drinks",
    calories: "0 kcal",
    available: true
  },
  {
    id: 9,
    name: "Blockbuster Combo: 1 Popcorn + 2 Colas",
    desc: "The classic date night pairing: 1 Large Popcorn plus two 500ml fountain drinks.",
    price: 1050,
    icon: "🎬",
    category: "Combos",
    calories: "830 kcal",
    available: true
  },
  {
    id: 10,
    name: "Warm Chocolate Lava Brownie",
    desc: "Decadent dark chocolate brownie with molten Belgian ganache center.",
    price: 380,
    icon: "🍫",
    category: "Desserts",
    calories: "410 kcal",
    available: false
  }
];

export const CUSTOMERS = [
  { id: 1, name: "Ali Raza", email: "ali.raza@example.com", phone: "0300-1112233", role: "customer", joined: "2026-09-12" },
  { id: 2, name: "Sara Khan", email: "sara.khan@example.com", phone: "0301-2223344", role: "customer", joined: "2026-09-20" },
  { id: 3, name: "Hamza Ahmed", email: "hamza.a@example.com", phone: "0321-3334455", role: "customer", joined: "2026-10-02" },
  { id: 4, name: "Ayesha Malik", email: "ayesha.m@example.com", phone: "0333-4445566", role: "customer", joined: "2026-10-15" },
  { id: 5, name: "Admin Manager", email: "admin@cinemax.com", phone: "0345-0000000", role: "admin", joined: "2026-08-01" }
];

export const SHOW_TIMES = ["12:00", "15:30", "19:00", "22:15"];

export function pad2(n) {
  return String(n).padStart(2, "0");
}

export function toDateStr(d) {
  return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
}

export function generateInitialShows(movies = MOVIES, screens = SCREENS) {
  const list = [];
  const nowShowing = movies.filter(m => m.status === "NOW_SHOWING");
  if (!nowShowing.length) return [];
  const today = new Date();
  let id = 1;
  for (let day = 0; day < 7; day++) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + day);
    screens.forEach((sc, si) => {
      SHOW_TIMES.forEach((t, ti) => {
        const movie = nowShowing[(si * 2 + ti + day) % nowShowing.length];
        const [h, m] = t.split(":").map(Number);
        const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m);
        const end = new Date(start.getTime() + (movie.duration + 15) * 60000);
        list.push({
          id: id++,
          movieId: movie.id,
          screenId: sc.id,
          date: toDateStr(d),
          start: pad2(h) + ":" + pad2(m),
          end: pad2(end.getHours()) + ":" + pad2(end.getMinutes()),
          basePrice: SCREEN_BASE_PRICE[sc.type] || 800,
          status: "SCHEDULED"
        });
      });
    });
  }
  return list;
}

export function getScreenSeats(screen) {
  if (!screen) return [];
  const seats = [];
  for (let r = 0; r < screen.rows; r++) {
    const label = String.fromCharCode(65 + r);
    const type = r < screen.rows - 5 ? "Standard" : (r < screen.rows - 2 ? "Premium" : "VIP");
    for (let n = 1; n <= screen.cols; n++) {
      seats.push({
        id: label + n,
        row: label,
        number: n,
        type: type
      });
    }
  }
  return seats;
}

export const SAMPLE_BOOKINGS = [
  {
    id: "BK-1001",
    customerId: 1,
    showId: 3,
    time: "2026-11-18 14:05",
    status: "CONFIRMED",
    seats: [
      { id: "E5", type: "Premium", price: 1000 },
      { id: "E6", type: "Premium", price: 1000 }
    ],
    food: [
      { id: 1, qty: 1, unit: 650 },
      { id: 6, qty: 2, unit: 250 }
    ],
    payment: { method: "Card", status: "SUCCESS", ref: "TXN-88123" },
    customer: { name: "Ali Raza", email: "ali.raza@example.com", phone: "0300-1112233" },
    total: 3150
  },
  {
    id: "BK-1002",
    customerId: 2,
    showId: 7,
    time: "2026-11-18 16:20",
    status: "CONFIRMED",
    seats: [
      { id: "G3", type: "VIP", price: 2880 }
    ],
    food: [],
    payment: { method: "Easypaisa", status: "SUCCESS", ref: "TXN-88124" },
    customer: { name: "Sara Khan", email: "sara.khan@example.com", phone: "0301-2223344" },
    total: 2880
  },
  {
    id: "BK-1003",
    customerId: 3,
    showId: 10,
    time: "2026-11-19 09:12",
    status: "CANCELLED",
    seats: [
      { id: "B2", type: "Standard", price: 800 },
      { id: "B3", type: "Standard", price: 800 },
      { id: "B4", type: "Standard", price: 800 }
    ],
    food: [],
    payment: { method: "Card", status: "REFUNDED", ref: "TXN-88125" },
    customer: { name: "Hamza Ahmed", email: "hamza.a@example.com", phone: "0321-3334455" },
    total: 2400
  },
  {
    id: "BK-1004",
    customerId: 4,
    showId: 13,
    time: "2026-11-19 11:45",
    status: "CONFIRMED",
    seats: [
      { id: "F7", type: "Premium", price: 1250 },
      { id: "F8", type: "Premium", price: 1250 },
      { id: "F9", type: "Premium", price: 1250 }
    ],
    food: [
      { id: 9, qty: 1, unit: 1050 }
    ],
    payment: { method: "JazzCash", status: "SUCCESS", ref: "TXN-88126" },
    customer: { name: "Ayesha Malik", email: "ayesha.m@example.com", phone: "0333-4445566" },
    total: 4800
  },
  {
    id: "BK-1005",
    customerId: 1,
    showId: 18,
    time: "2026-11-19 18:30",
    status: "CONFIRMED",
    seats: [
      { id: "H1", type: "VIP", price: 2880 },
      { id: "H2", type: "VIP", price: 2880 }
    ],
    food: [
      { id: 2, qty: 2, unit: 750 },
      { id: 7, qty: 2, unit: 450 }
    ],
    payment: { method: "Card", status: "SUCCESS", ref: "TXN-88127" },
    customer: { name: "Ali Raza", email: "ali.raza@example.com", phone: "0300-1112233" },
    total: 8160
  }
];
