# CineMax – Cinema Management & Online Ticket Booking System (front end)

A complete, professional front-end for the 20-entity cinema database in `database/schema.sql`
(ERD: `database/erd.html`). It runs entirely in the browser: a small "demo database" stored in
`localStorage` mirrors the same table and column names as the SQL schema, so PHP/MySQL can replace
it later without redesigning the UI.

## Run it

| How | URL |
| --- | --- |
| XAMPP (pre-built) | `http://localhost/cinemasystem/dist/` (the root `index.html` redirects there) |
| Dev server | `npm install` then `npm run dev` → `http://localhost:5173` |
| Rebuild | `npm run build` (writes `dist/`) |

Stack: React 18, Vite 5, Tailwind CSS v4, react-router (hash routes), lucide-react.

## Demo accounts (password for all: `demo1234`)

| Role | Email |
| --- | --- |
| Customer | `ali.raza@example.com`, `sara.khan@example.com`, `hamza.ahmed@example.com`, `ayesha.malik@example.com`, `usman.tariq@example.com` |
| Customer (suspended) | `zainab.iqbal@example.com` |
| Admin (all branches) | `admin@cinemax.pk` |
| Manager (Lahore) | `manager.lahore@cinemax.pk` |
| Box office (Lahore) | `boxoffice.lahore@cinemax.pk` |
| Manager (Karachi) | `manager.karachi@cinemax.pk` |

Promo codes: `WELCOME10`, `FAMILY300`, `STUDENT20` (active), `EIDSPECIAL` (expired), `WEEKEND15` (paused).

## What is included

**Customer site** – home, movies (filters), movie details (showtimes by date/cinema, reviews, trailer),
seat map with best-available + 10-minute hold, food pre-order, checkout (card / Easypaisa / JazzCash,
promo codes), e-tickets with QR, cancellation & refunds, my bookings, profile, cinemas, offers, food menu, help.

**Staff console (`#/admin`)** – dashboard, counter sale (POS), ticket check-in, bookings, movies (+genres,
reviews), showtimes (price per seat category, overlap check, cancel show → refunds), cinemas / screens /
seat-layout editor / seat categories, food & orders, promotions, payments, users & staff, reports (CSV/print),
audit log. Managers and box office are limited to their own branch; pages are role-restricted.

## Business rules implemented in `src/lib/db.js`

10-minute seat holds, max 8 seats per booking, no double booking, price snapshots on booking seats and
order lines, one ticket per seat, payment attempts (payment/refund), free cancellation until 2 hours before
the show, promo validation and limits, reviews only after a confirmed booking, audit logging, FK-style
delete protection.

## Notes

- Data lives in the browser. Use **Reset demo data** (site footer or admin sidebar) to restore the seed data.
- Payments, QR codes and trailers are simulated until the PHP/MySQL back end is connected.
- The old static prototype in `legacy_html/` is no longer used and can be deleted.

## Structure

```
database/         schema.sql, erd.html
src/lib/          db.js (demo database + rules), analytics, format, cart, seatpick
src/context/      Auth + UI (toasts, confirm dialogs)
src/components/   shared UI, seat map, tickets, layouts
src/pages/        customer pages;  src/pages/admin/  staff pages
dist/             production build served by XAMPP
```
