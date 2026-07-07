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

              {/* ── Client-only dashboard & profile ─────────────────────── */}
              <Route
                path="/dashboard/client"
                element={
                  <RoleRoute allowedRoles={["client"]}>
                    <ClientDashboard />
                  </RoleRoute>
                }
              />
              <Route
                path="/profile/client"
                element={
                  <RoleRoute allowedRoles={["client"]}>
                    <ClientProfile />
                  </RoleRoute>
                }
              />

              {/* ── Worker-only dashboard & profile ─────────────────────── */}
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

              {/* ── Admin-only area ─────────────────────────────────────── */}
              <Route
                path="/admin"
                element={
                  <RoleRoute allowedRoles={["admin"]}>
                    <AdminDashboardPage />
                  </RoleRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <RoleRoute allowedRoles={["admin"]}>
                    <AdminUsersPage />
                  </RoleRoute>
                }
              />
              <Route
                path="/admin/workers"
                element={
                  <RoleRoute allowedRoles={["admin"]}>
                    <AdminWorkersPage />
                  </RoleRoute>
                }
              />
              <Route
                path="/admin/bookings"
                element={
                  <RoleRoute allowedRoles={["admin"]}>
                    <AdminBookingsPage />
                  </RoleRoute>
                }
              />
              <Route
                path="/admin/settings"
                element={
                  <RoleRoute allowedRoles={["admin"]}>
                    <AdminSettingsPage />
                  </RoleRoute>
                }
              />
              <Route
                path="/admin/analytics"
                element={
                  <RoleRoute allowedRoles={["admin"]}>
                    <AdminAnalyticsPage />
                  </RoleRoute>
                }
              />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </LoginGate>
        </BrowserRouter>
      </TooltipProvider>
    </FirebaseProvider>
  </QueryClientProvider>
);

export default App;

