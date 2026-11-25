# QISSA – Cinema Management & Online Ticket Booking System

A React front end (`src/`) for the 20-entity cinema database in `database/schema.sql`
(ERD: `database/erd.html`), and a Laravel + MySQL back end (`backend/`) that is being connected **module by module**.

| Module | Status |
| --- | --- |
| 1 Users & Security (sign in, sign up, profile, password reset, users admin, audit log) | **connected to Laravel/MySQL** |
| 2 Movies, 3 Cinemas & screens, 4 Showtimes, 5 Bookings/payments/promotions, 6 Food | still the browser demo database (`localStorage`), same table/column names as the schema |

## Run it

1. Start **Apache and MySQL** in XAMPP, import the schema once: `mysql -u root < database/schema.sql`
2. Back end: `cd backend`, `composer install`, `php artisan key:generate`, `php artisan db:seed`, `php artisan serve` (see `backend/README.md`)
3. Front end:

| How | URL |
| --- | --- |
| XAMPP (pre-built) | `http://localhost/cinemasystem/dist/` (the root `index.html` redirects there) |
| Dev server | `npm install` then `npm run dev` → `http://localhost:5173` |
| Rebuild | `npm run build` (writes `dist/`) |

The front end calls the API at `http://localhost:8000/api` (override with `VITE_API_URL`). Signing in needs the back end running.

Stack: React 18, Vite 5, Tailwind CSS v4, react-router (hash routes), lucide-react; Laravel 12, MySQL/MariaDB.

## Demo accounts (stored in MySQL; password for all: `demo1234`)

| Role | Email |
| --- | --- |
| Customer | `ali.raza@example.com`, `sara.khan@example.com`, `hamza.ahmed@example.com`, `ayesha.malik@example.com`, `usman.tariq@example.com` |
| Customer (suspended) | `zainab.iqbal@example.com` |
| Admin (all branches) | `admin@qissa.pk` |
| Manager (Lahore) | `manager.lahore@qissa.pk` |
| Box office (Lahore) | `boxoffice.lahore@qissa.pk` |
| Manager (Karachi) | `manager.karachi@qissa.pk` |

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

- Users and the audit log live in MySQL. Everything else still lives in the browser; **Reset demo data** (site footer or admin sidebar) restores it and signs you out.
- Payments, QR codes and trailers are simulated until their modules are connected.
- The old static prototype in `legacy_html/` is no longer used and can be deleted.

## Structure

```
backend/          Laravel API (routes/api.php, app/Http/Controllers, database/seeders, tests)
database/         schema.sql (source of truth), erd.html, build_erd.cjs (regenerates the ERD from the live DB)
src/lib/          db.js (demo database + rules), analytics, format, cart, seatpick
src/context/      Auth + UI (toasts, confirm dialogs)
src/components/   shared UI, seat map, tickets, layouts
src/pages/        customer pages;  src/pages/admin/  staff pages
dist/             production build served by XAMPP
```
