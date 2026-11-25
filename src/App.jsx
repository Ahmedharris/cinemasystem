import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { expireHolds } from './lib/db';
import { CustomerLayout, ScrollToTop } from './components/Layouts';
import AdminLayout from './components/AdminLayout';

import Home from './pages/Home';
import Movies from './pages/Movies';
import MovieDetails from './pages/MovieDetails';
import SeatSelection from './pages/SeatSelection';
import FoodSelection from './pages/FoodSelection';
import Checkout from './pages/Checkout';
import BookingView from './pages/BookingView';
import MyBookings from './pages/MyBookings';
import Profile from './pages/Profile';
import Cinemas from './pages/Cinemas';
import Offers from './pages/Offers';
import FoodMenu from './pages/FoodMenu';
import Help from './pages/Help';
import NotFound from './pages/NotFound';
import Login, { Register, ForgotPassword, ResetPassword } from './pages/Auth';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminMovies from './pages/admin/AdminMovies';
import AdminShowtimes from './pages/admin/AdminShowtimes';
import AdminCinemas from './pages/admin/AdminCinemas';
import AdminBookings from './pages/admin/AdminBookings';
import AdminCounter from './pages/admin/AdminCounter';
import AdminCheckIn from './pages/admin/AdminCheckIn';
import AdminPayments from './pages/admin/AdminPayments';
import AdminFood from './pages/admin/AdminFood';
import AdminPromotions from './pages/admin/AdminPromotions';
import AdminUsers from './pages/admin/AdminUsers';
import AdminReports from './pages/admin/AdminReports';
import AdminAudit from './pages/admin/AdminAudit';

export default function App() {
  // release unpaid seat holds (booking.payment_deadline) in the background
  useEffect(() => {
    const id = setInterval(() => expireHolds(), 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route element={<CustomerLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/movies" element={<Movies />} />
          <Route path="/movie/:id" element={<MovieDetails />} />
          <Route path="/book/seats/:showId" element={<SeatSelection />} />
          <Route path="/book/food" element={<FoodSelection />} />
          <Route path="/book/checkout" element={<Checkout />} />
          <Route path="/booking/:ref" element={<BookingView />} />
          <Route path="/my-bookings" element={<MyBookings />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/cinemas" element={<Cinemas />} />
          <Route path="/offers" element={<Offers />} />
          <Route path="/menu" element={<FoodMenu />} />
          <Route path="/help" element={<Help />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="movies" element={<AdminMovies />} />
          <Route path="showtimes" element={<AdminShowtimes />} />
          <Route path="cinemas" element={<AdminCinemas />} />
          <Route path="bookings" element={<AdminBookings />} />
          <Route path="counter" element={<AdminCounter />} />
          <Route path="checkin" element={<AdminCheckIn />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="food" element={<AdminFood />} />
          <Route path="promotions" element={<AdminPromotions />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="audit" element={<AdminAudit />} />
        </Route>
      </Routes>
    </>
  );
}
