/* Report helpers for the admin pages.
   These mimic the SQL aggregates planned in the proposal
   (COUNT / SUM / GROUP BY). In PHP they become real queries. */

function confirmedBookings() { return allBookings().filter(b => b.status === "CONFIRMED"); }

function ticketsPerMovie() {
  const map = {};
  confirmedBookings().forEach(b => {
    const m = byId(MOVIES, byId(SHOWS, b.showId).movieId);
    map[m.title] = (map[m.title] || 0) + b.seats.length;
  });
  return Object.entries(map).sort((a, b) => b[1] - a[1]);
}
function revenuePerCinema() {
  const map = {};
  confirmedBookings().forEach(b => {
    const c = byId(CINEMAS, byId(SCREENS, byId(SHOWS, b.showId).screenId).cinemaId);
    map[c.name] = (map[c.name] || 0) + b.total;
  });
  return Object.entries(map).sort((a, b) => b[1] - a[1]);
}
function foodSales() {
  const map = {};
  confirmedBookings().forEach(b => b.food.forEach(f => {
    const n = byId(FOOD_ITEMS, f.id).name;
    map[n] = (map[n] || 0) + f.qty;
  }));
  return Object.entries(map).sort((a, b) => b[1] - a[1]);
}
function topCustomers() {
  const map = {};
  confirmedBookings().forEach(b => { map[b.customer.name] = (map[b.customer.name] || 0) + b.total; });
  return Object.entries(map).sort((a, b) => b[1] - a[1]);
}
function showOccupancy(show) {
  const cap = screenCapacity(show.screenId);
  const booked = activeSeatsFor(show.id).length;
  return { cap, booked, pct: Math.round((booked / cap) * 100) };
}
function totalRevenue() { return confirmedBookings().reduce((a, b) => a + b.total, 0); }
function totalTickets() { return confirmedBookings().reduce((a, b) => a + b.seats.length, 0); }
