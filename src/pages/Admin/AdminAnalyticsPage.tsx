import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ref, get } from "firebase/database";
import {
  Users, Briefcase, DollarSign, TrendingUp, Calendar,
  BarChart3, PieChart, Activity, ArrowUpRight, ArrowDownRight,
  Loader2, MapPin, Clock, CheckCircle2, AlertTriangle
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { database } from "@/lib/firebase";
import type { Booking } from "@/types";

interface FirebaseBooking extends Booking {
  createdAt: string;
  locality?: string;
}

interface FirebaseUser {
  role?: string;
}

interface AnalyticsData {
  totalUsers: number;
  totalWorkers: number;
  totalClients: number;
  totalBookings: number;
  totalRevenue: number;
  activeBookings: number;
  completedBookings: number;
  pendingBookings: number;
  categoryBreakdown: Record<string, number>;
  monthlyRevenue: Array<{ month: string; revenue: number; bookings: number }>;
  topLocalities: Array<{ locality: string; count: number }>;
}

type TimeRange = "7d" | "30d" | "90d";

const AdminAnalyticsPage = () => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [usersSnap, workersSnap, bookingsSnap] = await Promise.all([
        get(ref(database, "users")),
        get(ref(database, "workers")),
        get(ref(database, "bookings"))
      ]);

      const users = usersSnap.exists() ? usersSnap.val() : {};
      const workers = workersSnap.exists() ? workersSnap.val() : {};
      const bookings = bookingsSnap.exists() ? bookingsSnap.val() : {};

      const bookingsList = Object.entries(bookings).map(([id, b]: [string, FirebaseBooking]) => ({ id, ...b }));

      // Calculate time-based filter
      const now = new Date();
      const daysAgo = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
      const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

      const filteredBookings = bookingsList.filter((b: FirebaseBooking) => {
        const bookingDate = new Date(b.createdAt);
        return bookingDate >= cutoffDate;
      });

      // Category breakdown
      const categoryBreakdown: Record<string, number> = {};
      filteredBookings.forEach((b: FirebaseBooking) => {
        categoryBreakdown[b.category] = (categoryBreakdown[b.category] || 0) + 1;
      });

      // Monthly revenue
      const monthlyRevenue: Array<{ month: string; revenue: number; bookings: number }> = [];
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStr = `${months[monthDate.getMonth()]} ${monthDate.getFullYear()}`;

        const monthBookings = bookingsList.filter((b: FirebaseBooking) => {
          const bookingDate = new Date(b.createdAt);
          return bookingDate.getMonth() === monthDate.getMonth() &&
            bookingDate.getFullYear() === monthDate.getFullYear();
        });

        const revenue = monthBookings
          .filter((b: FirebaseBooking) => b.paymentStatus === "released")
          .reduce((sum: number, b: FirebaseBooking) => sum + (b.amount || 0), 0);

        monthlyRevenue.push({
          month: monthStr,
          revenue,
          bookings: monthBookings.length
        });
      }

      // Top localities
      const localityCounts: Record<string, number> = {};
      filteredBookings.forEach((b: FirebaseBooking) => {
        if (b.locality) {
          localityCounts[b.locality] = (localityCounts[b.locality] || 0) + 1;
        }
      });

      const topLocalities = Object.entries(localityCounts)
        .map(([locality, count]) => ({ locality, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const totalRevenue = filteredBookings
        .filter((b: FirebaseBooking) => b.paymentStatus === "released")
        .reduce((sum: number, b: FirebaseBooking) => sum + (b.amount || 0), 0);

      setAnalytics({
        totalUsers: Object.keys(users).length,
        totalWorkers: Object.keys(workers).length,
        totalClients: Object.values(users).filter((u: FirebaseUser) => u.role === "client").length,
        totalBookings: filteredBookings.length,
        totalRevenue,
        activeBookings: filteredBookings.filter((b: FirebaseBooking) => b.status === "accepted").length,
        completedBookings: filteredBookings.filter((b: FirebaseBooking) => b.status === "completed").length,
        pendingBookings: filteredBookings.filter((b: FirebaseBooking) => b.status === "pending").length,
        categoryBreakdown,
        monthlyRevenue,
        topLocalities
      });
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-20 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!analytics) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <p className="text-muted-foreground">Failed to load analytics data</p>
        </div>
      </Layout>
    );
  }

  const stats = [
    { label: "Total Users", value: analytics.totalUsers, icon: Users, color: "text-blue-600", change: "+12%" },
    { label: "Total Workers", value: analytics.totalWorkers, icon: Briefcase, color: "text-purple-600", change: "+8%" },
    { label: "Total Clients", value: analytics.totalClients, icon: Users, color: "text-green-600", change: "+15%" },
    { label: "Revenue", value: `₹${analytics.totalRevenue.toLocaleString("en-IN")}`, icon: DollarSign, color: "text-amber-600", change: "+23%" },
    { label: "Active Bookings", value: analytics.activeBookings, icon: Activity, color: "text-indigo-600", change: "+5%" },
    { label: "Completed", value: analytics.completedBookings, icon: CheckCircle2, color: "text-emerald-600", change: "+18%" },
  ];

  return (
    <Layout>
      {/* Header */}
      <section className="bg-gradient-hero py-10 lg:py-14">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div>
              <h1 className="font-heading text-2xl font-bold text-white">Analytics Dashboard</h1>
              <p className="mt-1 text-white/70">Platform performance metrics and insights</p>
            </div>

            {/* Time Range Selector */}
            <div className="flex items-center gap-2 bg-white/10 rounded-lg p-1">
              {["7d", "30d", "90d"].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range as TimeRange)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition ${timeRange === range
                    ? "bg-white text-foreground"
                    : "text-white/70 hover:text-white"
                    }`}
                >
                  {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : "90 Days"}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="py-10 border-b border-border bg-card">
        <div className="container">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {stats.map((stat) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-border bg-card p-4 shadow-sm"
              >
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                <p className="mt-2 text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="mt-1 text-xs font-medium text-green-600 flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3" />
                  {stat.change}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Charts Section */}
      <section className="py-10">
        <div className="container grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Monthly Revenue Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-border bg-card p-6 shadow-brand"
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" /> Monthly Revenue
              </h2>
            </div>

            <div className="space-y-4">
              {analytics.monthlyRevenue.map((month) => (
                <div key={month.month} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{month.month}</span>
                    <span className="font-semibold">₹{month.revenue.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${(month.revenue / (analytics.totalRevenue || 1)) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{month.bookings} bookings</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Category Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-border bg-card p-6 shadow-brand"
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold flex items-center gap-2">
                <PieChart className="h-5 w-5 text-primary" /> Category Breakdown
              </h2>
            </div>

            <div className="space-y-4">
              {Object.entries(analytics.categoryBreakdown).map(([category, count]) => (
                <div key={category} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="capitalize text-foreground">{category}</span>
                    <span className="font-semibold">{count} bookings</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full transition-all"
                      style={{ width: `${(count / analytics.totalBookings) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Top Localities */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-border bg-card p-6 shadow-brand"
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" /> Top Localities
              </h2>
            </div>

            <div className="space-y-3">
              {analytics.topLocalities.map((item, idx) => (
                <div key={item.locality} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {idx + 1}
                    </span>
                    <span className="text-sm text-foreground">{item.locality}</span>
                  </div>
                  <span className="text-sm font-semibold">{item.count} bookings</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Booking Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl border border-border bg-card p-6 shadow-brand"
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" /> Booking Status
              </h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-yellow-50 border border-yellow-200">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="font-semibold text-foreground">Pending</p>
                    <p className="text-xs text-muted-foreground">Awaiting worker acceptance</p>
                  </div>
                </div>
                <span className="text-xl font-bold text-yellow-600">{analytics.pendingBookings}</span>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-blue-50 border border-blue-200">
                <div className="flex items-center gap-3">
                  <Activity className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-semibold text-foreground">Active</p>
                    <p className="text-xs text-muted-foreground">Currently in progress</p>
                  </div>
                </div>
                <span className="text-xl font-bold text-blue-600">{analytics.activeBookings}</span>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-green-50 border border-green-200">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-semibold text-foreground">Completed</p>
                    <p className="text-xs text-muted-foreground">Successfully finished</p>
                  </div>
                </div>
                <span className="text-xl font-bold text-green-600">{analytics.completedBookings}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default AdminAnalyticsPage;
