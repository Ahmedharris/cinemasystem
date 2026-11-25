/* Generates erd.html (Mermaid diagrams + data dictionary) from the LIVE database schema.
   Usage:  node build_erd.cjs [port] [host] [database]      (database defaults to cinemasystem)
   Requires the mysql client from XAMPP and the schema.sql already imported. */
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const PORT = process.argv[2] || "3306";
const HOST = process.argv[3] || "127.0.0.1";
const DB = process.argv[4] || "cinemasystem";
const MYSQL = "C:\\xampp\\mysql\\bin\\mysql.exe";

function q(sql) {
  const out = execFileSync(MYSQL, ["-u", "root", "-h", HOST, "-P", PORT, "-B", "-N", "-e", sql], { encoding: "utf8" });
  return out.split("\n").filter(Boolean).map(l => l.split("\t"));
}

/* ---------- modules ---------- */
const MODULES = [
  { id: "users", title: "1. Users & Security", desc: "One account table for customers and staff (role-based), plus an audit trail.", tables: ["user_account", "audit_log"] },
  { id: "catalogue", title: "2. Movie Catalogue", desc: "Movies with genres (many-to-many) and customer reviews.", tables: ["genre", "movie", "movie_genre", "movie_review"] },
  { id: "infra", title: "3. Cinema Infrastructure", desc: "Branches, screens and seats with seat categories.", tables: ["cinema", "screen", "seat_category", "seat"] },
  { id: "scheduling", title: "4. Scheduling & Pricing", desc: "Showtimes and the price of each seat category per show.", tables: ["showtime", "showtime_price"] },
  { id: "booking", title: "5. Booking, Payment & Promotions", desc: "Bookings (web or counter) with seat reservations, tickets, payments/refunds and promo codes.", tables: ["booking", "booking_seat", "ticket", "payment", "promotion"] },
  { id: "food", title: "6. Food & Beverage", desc: "Menu items and food pre-orders attached to a booking.", tables: ["food_item", "food_order", "order_detail"] }
];
const moduleOf = {};
MODULES.forEach(m => m.tables.forEach(t => (moduleOf[t] = m.id)));

/* ---------- relationship labels (by FK constraint name) ---------- */
const LABEL = {
  fk_user_cinema: "works at", fk_audit_user: "performs", fk_mg_movie: "classified as", fk_mg_genre: "classifies",
  fk_review_movie: "reviewed in", fk_review_user: "writes", fk_screen_cinema: "contains", fk_seat_screen: "contains",
  fk_seat_category: "categorises", fk_show_movie: "scheduled as", fk_show_screen: "hosts", fk_show_user: "scheduled by",
  fk_sp_show: "priced by", fk_sp_cat: "priced for", fk_booking_user: "makes", fk_booking_show: "booked for",
  fk_booking_staff: "sold by", fk_booking_promo: "discounted by", fk_bs_booking: "includes", fk_bs_show: "seat allocation for",
  fk_bs_seat: "reserved as", fk_ticket_bs: "issues", fk_ticket_staff: "checked in by", fk_pay_booking: "paid by",
  fk_pay_user: "processed by", fk_fo_booking: "has pre-order", fk_od_order: "contains", fk_od_item: "appears in"
};

/* ---------- read schema ---------- */
const colRows = q(`SELECT c.table_name, c.column_name, c.data_type, c.column_type, c.is_nullable, c.column_key, c.extra, c.column_default
                   FROM information_schema.columns c JOIN information_schema.tables t
                     ON t.table_schema=c.table_schema AND t.table_name=c.table_name AND t.table_type='BASE TABLE'
                   WHERE c.table_schema='${DB}' ORDER BY c.table_name, c.ordinal_position`);
const fkRows = q(`SELECT kcu.constraint_name, kcu.table_name, kcu.column_name, kcu.referenced_table_name, kcu.referenced_column_name, kcu.ordinal_position
                  FROM information_schema.key_column_usage kcu
                  WHERE kcu.table_schema='${DB}' AND kcu.referenced_table_name IS NOT NULL
                  ORDER BY kcu.constraint_name, kcu.ordinal_position`);
const uniqRows = q(`SELECT table_name, index_name, GROUP_CONCAT(column_name ORDER BY seq_in_index) cols, MAX(non_unique) nu
                    FROM information_schema.statistics WHERE table_schema='${DB}' GROUP BY table_name, index_name`);

const tables = {};
colRows.forEach(([t, c, dt, ct, nullable, key, extra, def]) => {
  (tables[t] = tables[t] || { name: t, cols: [] }).cols.push({ name: c, dtype: dt, ctype: ct, nullable: nullable === "YES", key, extra, def });
});
const pkOf = {}, uniqueSets = {};
uniqRows.forEach(([t, idx, cols, nu]) => {
  if (idx === "PRIMARY") pkOf[t] = cols.split(",");
  else if (nu === "0") (uniqueSets[t] = uniqueSets[t] || []).push(cols.split(","));
});
const fks = {};
fkRows.forEach(([cn, t, c, rt, rc]) => {
  const f = (fks[cn] = fks[cn] || { name: cn, child: t, parent: rt, cols: [], pcols: [] });
  f.cols.push(c); f.pcols.push(rc);
});
const FKS = Object.values(fks);
const fkCols = {};
FKS.forEach(f => f.cols.forEach(c => (fkCols[f.child + "." + c] = true)));

/* single-column unique keys flagged UK */
const ukCols = {};
Object.keys(uniqueSets).forEach(t => uniqueSets[t].forEach(s => { if (s.length === 1) ukCols[t + "." + s[0]] = true; }));

function sameSet(a, b) { return a.length === b.length && a.every(x => b.includes(x)); }
function isUnique(t, cols) {
  return (pkOf[t] && sameSet(pkOf[t], cols)) || (uniqueSets[t] || []).some(s => sameSet(s, cols));
}
function relInfo(f) {
  const nullable = f.cols.some(c => tables[f.child].cols.find(x => x.name === c).nullable);
  const parentSide = nullable ? "o|" : "||";
  const childSide = isUnique(f.child, f.cols) ? "o|" : "o{";
  // a child whose FK is its whole PK and the only other PK part exists (junction) stays one-to-many
  return { parentSide, childSide, nullable, oneToOne: childSide === "o|" };
}
function cardText(f) {
  const r = relInfo(f);
  const pmin = r.nullable ? "0..1" : "1";
  const cmax = r.oneToOne ? "0..1" : "0..*";
  return { parent: pmin, child: cmax };
}

/* ---------- mermaid generation ---------- */
const typeName = c => ({ int: "int", bigint: "bigint", smallint: "smallint", tinyint: c.ctype.startsWith("tinyint(1)") ? "bool" : "tinyint", varchar: "varchar", char: "char", decimal: "decimal", datetime: "datetime", date: "date", time: "time", text: "text", enum: "enum" }[c.dtype] || c.dtype);
function entityBlock(t, onlyPk) {
  const tb = tables[t];
  const lines = [`  ${t.toUpperCase()} {`];
  tb.cols.forEach(c => {
    const isPk = (pkOf[t] || []).includes(c.name);
    if (onlyPk && !isPk) return;
    const keys = [];
    if (isPk) keys.push("PK");
    if (fkCols[t + "." + c.name]) keys.push("FK");
    if (!isPk && ukCols[t + "." + c.name]) keys.push("UK");
    const generated = /GENERATED/i.test(c.extra) ? ' "derived"' : "";
    lines.push(`    ${typeName(c)} ${c.name}${keys.length ? " " + keys.join(",") : ""}${generated}`);
  });
  lines.push("  }");
  return lines.join("\n");
}
// Mermaid syntax:  PARENT <|||"|o">--<"o{"|"o|"> CHILD : label
function relLine2(f) {
  const r = relInfo(f);
  const left = r.nullable ? "|o" : "||";
  return `  ${f.parent.toUpperCase()} ${left}--${r.childSide} ${f.child.toUpperCase()} : "${LABEL[f.name] || f.cols.join(",")}"`;
}

function moduleDiagram(m) {
  const inMod = new Set(m.tables);
  const rels = FKS.filter(f => inMod.has(f.child) || inMod.has(f.parent));
  const stubs = new Set();
  rels.forEach(f => { [f.child, f.parent].forEach(t => { if (!inMod.has(t)) stubs.add(t); }); });
  let s = "erDiagram\n";
  m.tables.forEach(t => (s += entityBlock(t, false) + "\n"));
  stubs.forEach(t => (s += entityBlock(t, true) + "\n"));
  rels.forEach(f => (s += relLine2(f) + "\n"));
  return s;
}
// ONE diagram: every entity with all its attributes + every relationship
function overviewDiagram() {
  let s = "erDiagram\n";
  Object.keys(tables).sort().forEach(t => (s += entityBlock(t, false) + "\n"));
  FKS.forEach(f => (s += relLine2(f) + "\n"));
  return s;
}

/* ---------- html helpers ---------- */
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
function dictionary(m) {
  return m.tables.map(t => {
    const tb = tables[t];
    const rows = tb.cols.map(c => {
      const isPk = (pkOf[t] || []).includes(c.name);
      const keys = [isPk ? "PK" : "", fkCols[t + "." + c.name] ? "FK" : "", !isPk && ukCols[t + "." + c.name] ? "UK" : ""].filter(Boolean).join(", ");
      const fk = FKS.find(f => f.child === t && f.cols.includes(c.name));
      const extra = [];
      if (/auto_increment/i.test(c.extra)) extra.push("auto");
      if (/GENERATED/i.test(c.extra)) extra.push("derived");
      if (c.def !== undefined && c.def !== "NULL" && !/auto_increment/i.test(c.extra) && c.def !== "") extra.push("default " + c.def);
      return `<tr><td><code>${c.name}</code></td><td>${esc(c.ctype)}</td><td>${keys}</td><td>${c.nullable ? "yes" : "no"}</td><td>${fk ? "→ " + fk.parent : ""} ${extra.join(", ")}</td></tr>`;
    }).join("");
    return `<details><summary><strong>${t}</strong> <span class="muted">(${tb.cols.length} columns)</span></summary>
      <table><thead><tr><th>Column</th><th>Type</th><th>Key</th><th>Null</th><th>Notes</th></tr></thead><tbody>${rows}</tbody></table></details>`;
  }).join("\n");
}
function cardTable() {
  const rows = FKS.sort((a, b) => a.parent.localeCompare(b.parent) || a.child.localeCompare(b.child)).map(f => {
    const c = cardText(f);
    return `<tr><td>${f.parent}</td><td>${f.child}</td><td>${c.parent} : ${c.child}</td><td>${f.cols.join(", ")}</td><td>${LABEL[f.name] || ""}</td></tr>`;
  }).join("");
  return `<table><thead><tr><th>Parent</th><th>Child</th><th>Cardinality (parent : child)</th><th>FK column(s)</th><th>Meaning</th></tr></thead><tbody>${rows}</tbody></table>`;
}

const RULES = [
  ["Seat belongs to the show's screen", "booking_seat stores (booking_id, showtime_id, screen_id, seat_id) with composite FKs to booking(booking_id, showtime_id), showtime(showtime_id, screen_id) and seat(seat_id, screen_id). A seat from another screen cannot be booked."],
  ["No double booking, history kept", "booking_seat.active_slot is 1 for HELD/CONFIRMED rows and NULL otherwise; UNIQUE(showtime_id, seat_id, active_slot) allows one active reservation per seat per show, while cancelled rows stay for history and the seat can be re-booked."],
  ["Seat holds", "Seats are HELD (hold_expires_at) while the customer pays. PENDING bookings past payment_deadline are expired by sp_expire_unpaid_bookings() and their seats released."],
  ["No overlapping shows", "Triggers on showtime reject any non-cancelled show that overlaps another show on the same screen."],
  ["One ticket per seat", "ticket.booking_seat_id is FK + UNIQUE and ticket_code is UNIQUE (used in the QR code). Tickets are issued only after a SUCCESS payment and scanned at the door (checked_in_at / checked_in_by_user_id)."],
  ["Historical prices", "booking_seat.seat_price and order_detail.unit_price are snapshots; showtime_price holds the price per seat category for each show; food_item.current_price is only today's menu price."],
  ["Web and counter sales", "booking_channel is WEB or COUNTER. Walk-in customers have user_id NULL with guest_phone; counter sales record sold_by_user_id."],
  ["Payments and refunds", "payment.payment_type is PAYMENT or REFUND. A booking can have several attempts; only SUCCESS rows count. Net revenue = SUCCESS payments - SUCCESS refunds."],
  ["Promotions", "A booking may use at most one promotion (booking.promotion_id) and stores the discount_amount; validity dates and usage limits are checked by the application inside the booking transaction."],
  ["Roles", "user_account.role (CUSTOMER, ADMIN, MANAGER, BOX_OFFICE) replaces separate customer/staff tables; staff are linked to a branch via cinema_id (CHECK: customers have none)."],
  ["Passwords and sign-in", "user_account.password_hash stores a bcrypt hash only. Forgot-password uses a one-time token: only its SHA-256 (reset_token_hash) and expiry (reset_token_expires_at) are stored and both are cleared once used. API sessions are stateless signed tokens, so no session table is needed."],
  ["Audit", "audit_log records who changed what, with old and new values."],
  ["Derived values not stored", "Screen capacity = COUNT of active seats. order_detail.line_total is a generated column (quantity x unit_price)."]
];

const V1 = [
  ["Entities", "15", `${Object.keys(tables).length}`],
  ["Users", "Customer only", "user_account for customers and staff, with roles (customer, admin, manager, box office)"],
  ["Movies", "Movie, Genre", "+ movie_review, poster/trailer, director/cast columns"],
  ["Cinemas", "Cinema, Screen, Seat", "+ seat_category (Standard/Premium/VIP), screen type (Standard/3D/IMAX/VIP)"],
  ["Shows", "One base_price", "+ audio/subtitle language and a price per seat category (showtime_price)"],
  ["Booking", "Customer-only online", "+ web and counter sales, walk-in guests, seat holds and expiry, QR ticket check-in"],
  ["Payments", "Payment only", "+ refunds, Easypaisa / JazzCash / cash, one promo code per booking"],
  ["Food", "Items + orders", "unchanged structure, availability status, order status"],
  ["System", "None", "audit_log"]
];

const total = Object.keys(tables).length;
const diagrams = MODULES.map(m => ({ m, code: moduleDiagram(m) }));
const overview = overviewDiagram();

const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>CineMax - Enhanced ERD</title>
<style>
 body{font-family:"Segoe UI",Arial,sans-serif;margin:0;background:#f5f6fa;color:#1c2030}
 header{background:#0f1117;color:#fff;padding:22px 32px}
 header h1{margin:0 0 4px;font-size:1.7rem} header p{margin:0;color:#9aa1b5}
 nav{position:sticky;top:0;background:#fff;border-bottom:1px solid #d9dce6;padding:8px 24px;z-index:5;display:flex;gap:6px;flex-wrap:wrap}
 nav a{padding:6px 12px;border-radius:6px;text-decoration:none;color:#333;font-size:.85rem;font-weight:600}
 nav a:hover{background:#eceef5}
 section{background:#fff;margin:20px auto;max-width:1500px;padding:22px 28px;border-radius:10px;border:1px solid #e1e4ee}
 h2{margin-top:0;border-bottom:2px solid #e50914;padding-bottom:6px;display:inline-block}
 .muted{color:#7a8094;font-weight:400}
 .diagram{overflow-x:auto;padding:10px 0}
 table{border-collapse:collapse;width:100%;font-size:.85rem;margin:8px 0}
 th,td{border:1px solid #dfe2ec;padding:6px 10px;text-align:left;vertical-align:top}
 th{background:#f0f2f8}
 code{background:#eef0f7;padding:1px 5px;border-radius:4px}
 details{margin:6px 0;border:1px solid #e1e4ee;border-radius:8px;padding:6px 12px}
 summary{cursor:pointer;padding:4px 0}
 .pill{display:inline-block;background:#e50914;color:#fff;border-radius:20px;padding:2px 12px;font-size:.8rem;margin-left:8px}
 .legend{font-size:.85rem;background:#f8f9fc;border:1px dashed #cfd3e2;padding:10px 14px;border-radius:8px;margin-bottom:10px}
 @media print{nav{display:none} section{break-inside:avoid-page;border:0;margin:0}.diagram{overflow:visible} details{display:block} details>*{display:block}}
</style></head><body>
<header><h1>CineMax Cinema Management System - Enhanced ERD <span class="pill">${total} entities</span></h1>
<p>Production-ready design for online + counter ticketing, scheduling, payments, food, promotions and administration. Generated from <code>schema.sql</code> (MySQL / MariaDB).</p></header>
<nav><a href="#overview">Complete ERD</a><a href="#changes">What changed</a>
${MODULES.map(m => `<a href="#${m.id}">${m.title}</a>`).join("")}
<a href="#rules">Business rules</a><a href="#cardinality">Cardinalities</a><a href="#dictionary">Data dictionary</a></nav>

<section id="overview"><h2>Complete ERD - all ${total} entities</h2>
<div class="legend">Crow's Foot notation: <code>||</code> exactly one, <code>|o</code> / <code>o|</code> zero or one, <code>o{</code> zero or many. PK = primary key, FK = foreign key, UK = unique key. The same model is split by module further down for easier reading.</div>
<div class="diagram"><pre class="mermaid">${esc(overview)}</pre></div></section>

<section id="changes"><h2>Original ERD vs enhanced ERD</h2>
<table><thead><tr><th>Area</th><th>Original (15 entities)</th><th>Enhanced (${total} entities)</th></tr></thead><tbody>
${V1.map(r => `<tr><td><strong>${r[0]}</strong></td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join("")}
</tbody></table></section>

${diagrams.map(d => `<section id="${d.m.id}"><h2>${d.m.title}</h2><p class="muted">${d.m.desc} Entities from other modules appear with their primary key only.</p>
<div class="diagram"><pre class="mermaid">${esc(d.code)}</pre></div></section>`).join("\n")}

<section id="rules"><h2>Business rules &amp; integrity constraints</h2>
<table><thead><tr><th>Rule</th><th>How it is enforced</th></tr></thead><tbody>
${RULES.map(r => `<tr><td><strong>${r[0]}</strong></td><td>${r[1]}</td></tr>`).join("")}
</tbody></table></section>

<section id="cardinality"><h2>Relationship cardinalities</h2>${cardTable()}</section>

<section id="dictionary"><h2>Data dictionary</h2>
${MODULES.map(m => `<h3>${m.title}</h3>${dictionary(m)}`).join("\n")}</section>

<script src="lib/mermaid.min.js"></script>
<script>
 mermaid.initialize({startOnLoad:true, theme:"default", er:{useMaxWidth:false, layoutDirection:"TB"}, securityLevel:"loose", maxTextSize:900000});
</script>
</body></html>`;

fs.writeFileSync(path.join(__dirname, "erd.html"), html);
console.log("erd.html written:", total, "tables,", FKS.length, "relationships");
