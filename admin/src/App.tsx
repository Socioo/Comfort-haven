import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Guests from "./pages/Guests";
import Hosts from "./pages/Hosts";
import Properties from "./pages/Properties";
import Bookings from "./pages/Bookings";
import UserDetails from "./pages/UserDetails";
import PropertyDetails from "./pages/PropertyDetails";
import Settings from "./pages/Settings";
import Team from "./pages/Team";
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
              <Route path="guests/:id" element={<UserDetails />} />
              <Route path="hosts/:id" element={<UserDetails />} />
              <Route path="team" element={<Team />} />
              <Route path="settings" element={<Settings />} />
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
