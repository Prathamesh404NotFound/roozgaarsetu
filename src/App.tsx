import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { FirebaseProvider } from "@/context/FirebaseContext";
import LoginGate from "@/components/Auth/LoginGate";
import RoleRoute from "@/components/Auth/RoleRoute";
import Index from "./pages/Index";
import Services from "./pages/Services";
import Workers from "./pages/Workers";
import WorkerProfile from "./pages/WorkerProfile";
import Booking from "./pages/Booking";
import About from "./pages/About";
import Contact from "./pages/Contact";
import BecomeWorker from "./pages/BecomeWorker";
import ClientDashboard from "./pages/Client/ClientDashboard";
import ClientProfile from "./pages/Client/ClientProfile";
import WorkerDashboard from "./pages/Worker/WorkerDashboard";
import MyWorkerProfile from "./pages/Worker/WorkerProfile";
import AdminDashboardPage from "./pages/Admin/AdminDashboardPage";
import AdminUsersPage from "./pages/Admin/AdminUsersPage";
import AdminWorkersPage from "./pages/Admin/AdminWorkersPage";
import AdminBookingsPage from "./pages/Admin/AdminBookingsPage";
import AdminSettingsPage from "./pages/Admin/AdminSettingsPage";
import AdminAnalyticsPage from "./pages/Admin/AdminAnalyticsPage";
import AdminLayoutPage from "./components/Admin/AdminLayoutPage";
import BookingDetail from "./pages/BookingDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <FirebaseProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <LoginGate>
            <Routes>
              {/* ── Public routes ───────────────────────────────────────── */}
              <Route path="/" element={<Index />} />
              <Route path="/services" element={<Services />} />
              <Route path="/workers" element={<Workers />} />
              <Route path="/worker/:id" element={<WorkerProfile />} />
              <Route path="/booking" element={<Booking />} />
              <Route path="/booking/:id" element={<BookingDetail />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/become-worker" element={<BecomeWorker />} />

              {/* ── Client dashboard & profile ─────────────────────────── */}
              <Route
                path="/dashboard/client"
                element={
                  <RoleRoute allowedRoles={["any"]}>
                    <ClientDashboard />
                  </RoleRoute>
                }
              />
              <Route
                path="/profile/client"
                element={
                  <RoleRoute allowedRoles={["any"]}>
                    <ClientProfile />
                  </RoleRoute>
                }
              />

              {/* ── Worker dashboard & profile ─────────────────────────── */}
              <Route
                path="/dashboard/worker"
                element={
                  <RoleRoute allowedRoles={["worker"]}>
                    <WorkerDashboard />
                  </RoleRoute>
                }
              />
              <Route
                path="/profile/worker"
                element={
                  <RoleRoute allowedRoles={["worker"]}>
                    <MyWorkerProfile />
                  </RoleRoute>
                }
              />

              {/* ── Admin area ───────────────────────────────────── */}
              {/* One RoleRoute guards the entire /admin tree; all children   */}
              {/* render inside AdminLayoutPage's <Outlet /> — no per-page wrapping */}
              <Route
                path="/admin"
                element={
                  <RoleRoute allowedRoles={["admin"]}>
                    <AdminLayoutPage />
                  </RoleRoute>
                }
              >
                <Route index element={<AdminDashboardPage />} />
                <Route path="users" element={<AdminUsersPage />} />
                <Route path="workers" element={<AdminWorkersPage />} />
                <Route path="bookings" element={<AdminBookingsPage />} />
                <Route path="analytics" element={<AdminAnalyticsPage />} />
                <Route path="settings" element={<AdminSettingsPage />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </LoginGate>
        </BrowserRouter>
      </TooltipProvider>
    </FirebaseProvider>
  </QueryClientProvider>
);

export default App;

