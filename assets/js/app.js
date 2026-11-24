/* =====================================================================
   Shared helpers for the prototype (header/footer, storage, pricing)
   ===================================================================== */

/* ---------- small utils ---------- */
function $(sel, root) { return (root || document).querySelector(sel); }
function $$(sel, root) { return Array.from((root || document).querySelectorAll(sel)); }
function money(n) { return CURRENCY + " " + Math.round(n).toLocaleString("en-US"); }
function param(name) { return new URLSearchParams(location.search).get(name); }
function byId(list, id) { return list.find(x => String(x.id) === String(id)); }
function fmtDate(str, opts) {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", opts || { weekday: "short", day: "numeric", month: "short" });
}
function fmtDuration(min) { return Math.floor(min / 60) + "h " + (min % 60) + "m"; }
function genreNames(movie) { return movie.genres.map(g => byId(GENRES, g).name); }
function statusBadge(status) {
  const map = {
    CONFIRMED: "ok", SUCCESS: "ok", NOW_SHOWING: "ok", SCHEDULED: "info", AVAILABLE: "ok", ACTIVE: "ok", VALID: "ok", SERVED: "ok",
    PENDING: "warn", COMING_SOON: "gold", HELD: "warn", REFUNDED: "info", PREPARING: "warn",
    CANCELLED: "bad", FAILED: "bad", ARCHIVED: "", UNAVAILABLE: "bad", EXPIRED: "bad"
  };
  return '<span class="badge ' + (map[status] || "") + '">' + status.replace("_", " ") + "</span>";
}
function toast(msg) {
  let t = $("#toast");
  if (!t) { t = document.createElement("div"); t.id = "toast"; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove("show"), 2400);
}

/* ---------- poster (no image files needed in the prototype) ---------- */
function posterHTML(m) {
  return '<div class="poster" style="background:linear-gradient(160deg,' + m.colors[0] + "," + m.colors[1] + ')">' +
    '<span class="p-rating">' + m.rating + "</span>" +
    '<span class="emoji">' + m.emoji + "</span>" +
    '<span class="p-title">' + m.title + "</span></div>";
}
function movieCardHTML(m) {
  return '<a class="movie-card" href="movie.html?id=' + m.id + '">' + posterHTML(m) +
    '<div class="info"><h4>' + m.title + '</h4><div class="muted small">' + genreNames(m).join(" · ") +
    " • " + fmtDuration(m.duration) + "</div><div class=\"chips\">" + statusBadge(m.status) +
    '<span class="badge">' + m.language + "</span></div></div></a>";
}

/* ---------- storage (localStorage stands in for the database) ---------- */
const store = {
  get(key, fallback) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; } },
  set(key, val) { localStorage.setItem(key, JSON.stringify(val)); },
  del(key) { localStorage.removeItem(key); }
};
function getUser() { return store.get("cms_user", null); }
function getCart() { return store.get("cms_cart", null); }
function setCart(c) { store.set("cms_cart", c); }
function clearCart() { store.del("cms_cart"); }

/* ---------- pricing ---------- */
function seatPrice(show, seatType) {
  return Math.round((show.basePrice * SEAT_MULTIPLIER[seatType]) / 10) * 10;
}
function foodTotal(foodMap) {
  let t = 0;
  Object.keys(foodMap || {}).forEach(id => { t += byId(FOOD_ITEMS, id).price * foodMap[id]; });
  return t;
}

/* ---------- bookings (sample + ones created in the browser) ---------- */
function normalizeSample(b) {
  const show = byId(SHOWS, b.showId);
  const cust = byId(CUSTOMERS, b.customerId);
  const seats = b.seats.map(s => ({ id: s[0], type: s[1], price: seatPrice(show, s[1]) }));
  const food = b.food.map(f => ({ id: f[0], qty: f[1], unit: byId(FOOD_ITEMS, f[0]).price }));
  const total = seats.reduce((a, s) => a + s.price, 0) + food.reduce((a, f) => a + f.unit * f.qty, 0);
  return { id: b.id, customer: { name: cust.name, email: cust.email }, showId: b.showId, time: b.time, status: b.status, seats, food, payment: b.payment, total };
}
function allBookings() {
  return SAMPLE_BOOKINGS.map(normalizeSample).concat(store.get("cms_bookings", []));
}
function activeSeatsFor(showId) {
  const taken = seededTakenSeats(showId).slice();
  allBookings().forEach(b => {
    if (b.showId === showId && (b.status === "CONFIRMED" || b.status === "PENDING")) b.seats.forEach(s => taken.push(s.id));
  });
  return taken;
}
function saveBooking(b) {
  const list = store.get("cms_bookings", []);
  list.push(b);
  store.set("cms_bookings", list);
}
function nextBookingId() { return "BK-" + (1009 + store.get("cms_bookings", []).length); }

/* ---------- customer site header / footer ---------- */
function renderHeader(active) {
  const user = getUser();
  const links = [
    ["home", "index.html", "Movies"],
    ["cinemas", "cinemas.html", "Cinemas"],
    ["food", "menu.html", "Food Menu"],
    ["bookings", "my-bookings.html", "My Bookings"]
  ];
  let html = '<header class="site-header"><div class="container"><a class="brand" href="index.html">Cine<span>Max</span></a><nav class="nav">';
  links.forEach(l => { html += '<a href="' + l[1] + '"' + (active === l[0] ? ' class="active"' : "") + ">" + l[2] + "</a>"; });
  if (user) {
    html += '<a href="#" onclick="logout();return false;">Logout (' + user.name.split(" ")[0] + ")</a>";
  } else {
    html += '<a href="login.html"' + (active === "login" ? ' class="active"' : "") + '>Login</a><a class="btn" href="register.html">Sign up</a>';
  }
  html += '</nav></div></header>';
  const el = $("#app-header");
  if (el) el.outerHTML = html;
  const f = $("#app-footer");
  if (f) f.outerHTML = '<footer class="site-footer"><div class="container">CineMax Cinema Management System — DBMS Project prototype (front-end only) • <a href="admin/index.html" style="text-decoration:underline">Admin panel</a></div></footer>';
}
function logout() { store.del("cms_user"); location.href = "index.html"; }

/* ---------- admin shell ---------- */
function renderAdmin(active, title, subtitle, actionsHTML) {
  const links = [
    ["Overview", null],
    ["dashboard", "index.html", "📊 Dashboard"],
    ["Catalog", null],
    ["movies", "movies.html", "🎬 Movies & Genres"],
    ["shows", "shows.html", "🕒 Show Schedule"],
    ["cinemas", "cinemas.html", "🏢 Cinemas & Screens"],
    ["food", "food.html", "🍿 Food Menu"],
    ["Sales", null],
    ["bookings", "bookings.html", "🎟️ Bookings"],
    ["customers", "customers.html", "👥 Customers"],
    ["reports", "reports.html", "📈 Reports"]
  ];
  let side = '<aside class="sidebar"><a class="brand" href="index.html">Cine<span>Max</span> <span class="small muted" style="font-size:.7rem">ADMIN</span></a>';
  links.forEach(l => {
    if (l[1] === null) side += '<div class="label">' + l[0] + "</div>";
    else side += '<a class="link' + (active === l[0] ? " active" : "") + '" href="' + l[1] + '">' + l[2] + "</a>";
  });
  side += '<div class="label">Site</div><a class="link" href="../index.html">↩ Customer site</a></aside>';
  const main = $("#admin-content");
  const head = '<div class="admin-top"><div><h1 class="page-title">' + title + '</h1><div class="muted">' + (subtitle || "") + "</div></div><div>" + (actionsHTML || "") + "</div></div>";
  main.insertAdjacentHTML("afterbegin", head);
  const wrap = document.createElement("div");
  wrap.innerHTML = side;
  document.body.insertBefore(wrap.firstChild, document.body.firstChild);
}

/* ---------- modal helpers ---------- */
function openModal(id) { $("#" + id).classList.add("open"); }
function closeModal(id) { $("#" + id).classList.remove("open"); }
document.addEventListener("click", e => {
  if (e.target.classList && e.target.classList.contains("modal-back")) e.target.classList.remove("open");
});

/* ---------- admin bar chart helper ---------- */
function barsHTML(rows, fmt) {
  const max = Math.max.apply(null, rows.map(r => r[1]).concat([1]));
  return '<div class="bars">' + rows.map(r =>
    '<div class="bar-row"><div class="bar-label" title="' + r[0] + '">' + r[0] + '</div><div class="bar-track"><div class="bar-fill" style="width:' +
    Math.round((r[1] / max) * 100) + '%"></div></div><div class="bar-val">' + (fmt ? fmt(r[1]) : r[1]) + "</div></div>").join("") + "</div>";
}
