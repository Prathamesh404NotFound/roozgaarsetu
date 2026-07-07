import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/components/Auth/AuthProvider";
import type { UserProfile } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = UserProfile["role"];

interface RoleRouteProps {
  children: ReactNode;
  allowedRoles: Role[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns the dashboard path for a given role. */
function dashboardFor(role: Role): string {
  switch (role) {
    case "worker": return "/dashboard/worker";
    case "admin":  return "/admin";
    case "client":
    default:       return "/dashboard/client";
  }
}

// ─── Loading spinner (same visual as LoginGate) ───────────────────────────────

const FullScreenSpinner = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
        <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin" />
      </div>
      <span
        className="text-sm font-medium text-muted-foreground tracking-wide"
        style={{ fontFamily: "'Poppins', system-ui, sans-serif" }}
      >
        Loading…
      </span>
    </div>
  </div>
);

// ─── Access Denied screen ─────────────────────────────────────────────────────

interface AccessDeniedProps {
  userRole: Role;
  allowedRoles: Role[];
}

const AccessDenied = ({ userRole, allowedRoles }: AccessDeniedProps) => {
  const ownDashboard = dashboardFor(userRole);
  const allowedLabel = allowedRoles
    .map((r) => r.charAt(0).toUpperCase() + r.slice(1))
    .join(" / ");

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background z-50 px-4">
      {/* Subtle gradient backdrop */}
      <div className="absolute inset-0 bg-gradient-hero opacity-90" />

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-md rounded-2xl shadow-elevated overflow-hidden"
        style={{ background: "white" }}
      >
        {/* Top destructive accent bar */}
        <div
          className="h-1.5 w-full"
          style={{
            background:
              "linear-gradient(135deg, hsl(0 72% 51%) 0%, hsl(14 100% 67%) 100%)",
          }}
        />

        <div className="px-8 py-10 flex flex-col items-center gap-5 text-center">
          {/* Icon */}
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-8 w-8 text-destructive"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>

          {/* Heading */}
          <div>
            <h1
              className="text-2xl font-bold text-foreground"
              style={{ fontFamily: "'Poppins', system-ui, sans-serif" }}
            >
              Access Denied
            </h1>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              This page is restricted to{" "}
              <span className="font-semibold text-foreground">{allowedLabel}</span>{" "}
              accounts. Your current role is{" "}
              <span className="font-semibold text-foreground capitalize">
                {userRole}
              </span>
              .
            </p>
          </div>

          <div className="w-full h-px bg-border" />

          {/* Back to own dashboard */}
          <a
            id="btn-access-denied-dashboard"
            href={ownDashboard}
            className="
              flex w-full items-center justify-center gap-2
              rounded-xl bg-primary px-6 py-3
              text-sm font-semibold text-primary-foreground
              shadow-brand transition-all duration-200
              hover:bg-primary/90 hover:-translate-y-px hover:shadow-card-hover
              active:translate-y-0
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
            "
          >
            Go to my Dashboard
          </a>
        </div>
      </div>
    </div>
  );
};

// ─── RoleRoute ────────────────────────────────────────────────────────────────

/**
 * Wraps a route subtree and enforces role access.
 *
 * Behaviour:
 *  - loading  → full-screen spinner
 *  - !user    → redirect to "/" (LoginGate will intercept and show login)
 *  - role not in allowedRoles → Access Denied screen with link to own dashboard
 *  - otherwise → renders children
 */
const RoleRoute = ({ children, allowedRoles }: RoleRouteProps) => {
  const { user, profile, loading } = useAuth();

  if (loading) return <FullScreenSpinner />;

  // LoginGate should already handle this, but be defensive
  if (!user || !profile) return <Navigate to="/" replace />;

  if (!allowedRoles.includes(profile.role)) {
    return <AccessDenied userRole={profile.role} allowedRoles={allowedRoles} />;
  }

  return <>{children}</>;
};

export default RoleRoute;
