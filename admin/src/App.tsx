import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Guests from "./pages/Guests";
import Hosts from "./pages/Hosts";
import Properties from "./pages/Properties";
import Bookings from "./pages/Bookings";
import UserDetails from "./pages/UserDetails";
import PropertyDetails from "./pages/PropertyDetails";
import BookingDetails from "./pages/BookingDetails";
import AdminSettings from "./pages/AdminSettings";
import AppSettings from "./pages/AppSettings";
import Team from "./pages/Team";
import Support from "./pages/Support";
import Payouts from "./pages/Payouts";
import PayoutDetails from "./pages/PayoutDetails";
import Refunds from "./pages/Refunds";
import RefundDetails from "./pages/RefundDetails";
import PaymentSettings from "./pages/PaymentSettings";
import Notifications from "./pages/Notifications";
import ContactSocialInfo from "./pages/ContactSocialInfo";
import Faqs from "./pages/Faqs";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<DashboardLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="guests" element={<Guests />} />
              <Route path="hosts" element={<Hosts />} />
              <Route path="properties" element={<Properties />} />
              <Route path="properties/:id" element={<PropertyDetails />} />
              <Route path="bookings" element={<Bookings />} />
              <Route path="bookings/:id" element={<BookingDetails />} />
              <Route path="guests/:id" element={<UserDetails />} />
              <Route path="hosts/:id" element={<UserDetails />} />
              <Route path="team" element={<Team />} />
              <Route path="settings" element={<AppSettings />} />
              <Route path="admin-settings" element={<AdminSettings />} />
              <Route path="support" element={<Support />} />
              <Route path="faqs" element={<Faqs />} />
              <Route path="payouts" element={<Payouts />} />
              <Route path="payouts/:id" element={<PayoutDetails />} />
              <Route path="refunds" element={<Refunds />} />
              <Route path="refunds/:id" element={<RefundDetails />} />
              <Route path="payment-settings" element={<PaymentSettings />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="contact-info" element={<ContactSocialInfo />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </ThemeProvider>
  );
}

export default App;
