# 🍿 CineMax — Modern Cinema Management & Booking System

An advanced, responsive, and reactive single-page cinema management and online ticketing web application built with **React**, **Vite**, **Tailwind CSS**, and **Lucide Icons**.

This system implements the complete domain model described in the Database Proposal and ERD (`Cinema_Management_Improved_ERD (3).pdf`), offering an immersive customer booking experience alongside an executive administrative operations portal.

---

## 🌟 Key Features

### 🎬 1. Customer Experience & Ticketing
- **Cinematic Homepage**:
  - High-impact movie hero spotlight with backdrop images and quick booking CTA.
  - Now Showing vs. Coming Soon catalog tabs.
  - Multi-parameter search & filtering (search query, genre pills, language, age rating, and sorting).
- **Rich Movie Details**:
  - Theatrical trailer preview modal.
  - Classification ratings (`PG-13`, `PG`, `R`, `G`), duration, release date, director, and starring cast.
  - Dynamic showtimes grouped by Cinema Branch and Screen Type (`IMAX`, `3D Luxe`, `VIP Recliners`, `Standard`).
  - Next 7 days interactive date selector pills.
- **Interactive Theater Seat Selection**:
  - Curved 3D cinema screen with ambient neon lighting.
  - Real-time seat grid generated from screen geometry (rows A–Z, column layout, center aisle gap).
  - Multi-tier seat pricing: **Standard** (1.0x), **Premium** (1.25x), and **VIP Recliner** (1.6x).
  - Max 8 seats reservation limit with interactive tooltips.
  - **5-Minute Reservation Hold Timer**: Seats are held in state with real-time countdown.
- **Refreshments & Concessions Pre-Ordering**:
  - Categorized menu: Popcorn, Nachos, Burgers, Drinks, Combos, and Desserts.
  - Calories, prices, description, and quantity increment/decrement controls.
  - Instant synchronization with the booking cart.
- **Streamlined Checkout & Payment**:
  - Promo code discounts (e.g. `CINEMA20` for 20% off, `WELCOME10` for 10% off).
  - Multiple payment gateways:
    - 💳 Credit / Debit Card (with interactive card preview & validation).
    - 📱 Easypaisa (mobile account input).
    - 📱 JazzCash (mobile account input).
    - 💵 Cash at counter (pay on arrival).
  - Testing simulation toggle (Simulate Success / Payment Failure) for grading and academic evaluation.
- **Digital Boarding Pass / E-Ticket**:
  - Perforated ticket styling with notch punch-outs and dashed separator.
  - Real SVG QR code and barcode for gate scanner simulation.
  - Concessions voucher for fast-track counter collection.
  - `window.print()` integration for 1-click printing or PDF download.
- **Customer Account & "My Bookings"**:
  - Complete booking history with status badges (`CONFIRMED`, `CANCELLED`).
  - One-click **Cancel & Refund** action that automatically releases reserved seats in the live seating map.

---

### 🛡️ 2. Administrative Operations Suite (`/admin`)
- **Operations Dashboard**:
  - Real-time KPI stat cards: Total Tickets Sold, Gross Collected Revenue, Total Bookings, and Screen Occupancy Rate.
  - Visual analytics bar tracks: Tickets sold per movie, revenue per cinema branch.
  - Today's schedule occupancy monitor.
  - Recent transactions table with quick inspection modal.
- **Movie Catalog & Genre Management**:
  - Full CRUD: Add Movie, Edit Movie, and Safe Delete (with foreign key checks).
  - Genre manager with movie counts and "+ Add Genre" modal with uniqueness validation.
- **Auditorium Screen Scheduling (`/admin/shows`)**:
  - Schedule shows with **automatic conflict / overlap detection** on the same screen.
  - Automatic end time computation (`start + duration + 15 min buffer`).
  - Base price defaults derived from screen types.
  - Cancel show functionality.
- **Cinemas & Screens Management (`/admin/cinemas`)**:
  - Cinema branch directory (Lahore, Karachi, Islamabad).
  - Add screen with custom row and column geometry.
  - **Live Visual Seat Layout Viewer**: Inspect the exact seating map of any screen.
- **Concessions Inventory (`/admin/food`)**:
  - Add, edit, and delete food items.
  - One-click **In Stock / Sold Out** availability toggle.
- **Sales Ledger & Booking Inspection (`/admin/bookings`)**:
  - Comprehensive customer booking records with search and status filters.
  - Detailed modal displaying normalized `Booking_Seat` rows (seat ID, tier, price snapshot) and `Order_Detail` concessions.
  - Direct Cancel & Refund capability.
- **Management Reports & Aggregates (`/admin/reports`)**:
  - Mapped directly to the SQL queries from the database proposal:
    - `COUNT(Booking_Seat)` grouped by movie.
    - `SUM(Payment.amount)` grouped by cinema branch.
    - `SUM(Order_Detail.quantity)` grouped by refreshment item.
    - Subquery with `HAVING`: High-value VIP customers spending above average.
    - Payment settlement breakdown by gateway.
    - Printable executive report view.

---

## 🏗️ Project Architecture & Structure

```
cinemasystem/
├── dist/                               # Production build distribution
│   ├── index.html                      # Standalone compiled entry point
│   └── assets/                         # Bundled JS and CSS (Tailwind)
├── legacy_html/                        # Complete backup of original static HTML files
├── src/
│   ├── components/                     # Reusable UI components
│   │   ├── Navbar.jsx                  # Top navigation with user switcher & cart badge
│   │   ├── Footer.jsx                  # Global footer with locations
│   │   ├── MovieCard.jsx               # Movie card with hover actions
│   │   ├── BookingStepper.jsx          # 4-Step checkout progress bar
│   │   └── AdminLayout.jsx             # Admin sidebar and layout container
│   ├── context/                        # Reactive state management
│   │   ├── AuthContext.jsx             # Customer & admin authentication
│   │   ├── CinemaContext.jsx           # Reactive database with localStorage persistence
│   │   └── CartContext.jsx             # Seat reservation, hold timer, concessions, promo
│   ├── data/
│   │   └── initialData.js              # Seed data mirroring ERD (movies, shows, seats, food)
│   ├── pages/                          # Customer portal pages
│   │   ├── Home.jsx                    # Movies showcase & filters
│   │   ├── MovieDetails.jsx            # Trailer modal, showtimes & branch picker
│   │   ├── SeatSelection.jsx           # 3D curved screen & interactive seat map
│   │   ├── FoodSelection.jsx           # Concessions pre-order
│   │   ├── Checkout.jsx                # Multi-gateway payment & simulation
│   │   ├── TicketView.jsx              # Boarding pass & celebration confetti
│   │   ├── MyBookings.jsx              # Customer ticket history & refund action
│   │   ├── CinemasPage.jsx             # Branch directory & facilities
│   │   ├── FoodMenuPage.jsx            # Standalone food menu
│   │   ├── Login.jsx                   # Sign in with 1-click demo profiles
│   │   └── Register.jsx                # New customer registration
│   ├── pages/admin/                    # Admin portal pages
│   │   ├── AdminDashboard.jsx          # Live metrics, charts & recent bookings
│   │   ├── AdminMovies.jsx             # Catalog & genre manager
│   │   ├── AdminShows.jsx              # Conflict-aware show scheduler
│   │   ├── AdminCinemas.jsx            # Branches, screens & seat layout viewer
│   │   ├── AdminFood.jsx               # Refreshment stock & pricing manager
│   │   ├── AdminBookings.jsx           # Sales ledger & inspection modal
│   │   └── AdminReports.jsx            # Database aggregate reports
│   ├── App.jsx                         # Application router & layout controller
│   ├── index.css                       # Cinema design system & Tailwind styling
│   └── main.jsx                        # React root entry point
├── Cinema_Management_Improved_ERD (3).pdf  # Original ERD specification
├── Cinema_Management_Project_Proposal (1).pdf # Original project proposal
├── index.html                          # Root HTML (with XAMPP Apache auto-forwarding)
├── package.json                        # Dependencies & scripts
├── tailwind.config.js                  # Tailwind configuration
└── vite.config.js                      # Vite bundler configuration
```

---

## 🚀 How to Run

### Method 1: Vite Development Server (Recommended for Dev)
1. Open terminal in `c:\xampp\htdocs\cinemasystem`:
   ```bash
   npm run dev
   ```
2. Open your browser to:
   ```
   http://localhost:5173/
   ```

### Method 2: In XAMPP Apache
Because the project is located directly in `c:\xampp\htdocs\cinemasystem`:
1. Start **Apache** in your XAMPP Control Panel.
2. Open your browser to either:
   - `http://localhost/cinemasystem/` (automatically routes to compiled app)
   - `http://localhost/cinemasystem/dist/`

### Method 3: Rebuild Production Distribution
```bash
npm run build
```

---

## 🔑 Demo Credentials & Promo Codes

### Pre-Configured Test Accounts (Available in Navbar 1-Click Switcher):
- **Customer Account**: `ali.raza@example.com` (Password: `password123`)
- **Admin Manager**: `admin@cinemax.com` (Password: `password123`)

### Active Promo Codes (Try at Checkout):
- `CINEMA20` → 20% discount on total cart
- `WELCOME10` → 10% welcome discount
