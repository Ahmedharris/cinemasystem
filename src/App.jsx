import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Customer Pages
import Home from './pages/Home';
import MovieDetails from './pages/MovieDetails';
import SeatSelection from './pages/SeatSelection';
import FoodSelection from './pages/FoodSelection';
import Checkout from './pages/Checkout';
import TicketView from './pages/TicketView';
import MyBookings from './pages/MyBookings';
import CinemasPage from './pages/CinemasPage';
import FoodMenuPage from './pages/FoodMenuPage';
import Login from './pages/Login';
import Register from './pages/Register';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminMovies from './pages/admin/AdminMovies';
import AdminShows from './pages/admin/AdminShows';
import AdminCinemas from './pages/admin/AdminCinemas';
import AdminFood from './pages/admin/AdminFood';
import AdminBookings from './pages/admin/AdminBookings';
import AdminReports from './pages/admin/AdminReports';

export default function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-['Plus_Jakarta_Sans']">
      {!isAdminRoute && <Navbar />}

      <main className={`flex-1 ${!isAdminRoute ? 'cinemax-container py-8' : ''}`}>
        <Routes>
          {/* Customer Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/movie/:id" element={<MovieDetails />} />
          <Route path="/book/seats/:showId" element={<SeatSelection />} />
          <Route path="/book/food" element={<FoodSelection />} />
          <Route path="/book/checkout" element={<Checkout />} />
          <Route path="/tickets/:bookingId" element={<TicketView />} />
          <Route path="/my-bookings" element={<MyBookings />} />
          <Route path="/cinemas" element={<CinemasPage />} />
          <Route path="/menu" element={<FoodMenuPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Admin Suite Routes */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/movies" element={<AdminMovies />} />
          <Route path="/admin/shows" element={<AdminShows />} />
          <Route path="/admin/cinemas" element={<AdminCinemas />} />
          <Route path="/admin/food" element={<AdminFood />} />
          <Route path="/admin/bookings" element={<AdminBookings />} />
          <Route path="/admin/reports" element={<AdminReports />} />

          {/* Fallback */}
          <Route path="*" element={<Home />} />
        </Routes>
      </main>

      {!isAdminRoute && <Footer />}
    </div>
  );
}
