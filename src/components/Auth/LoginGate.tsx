import React, { ReactNode } from "react";
import { useAuth } from "./AuthProvider";

// ─── Loading spinner ──────────────────────────────────────────────────────────

const FullScreenSpinner: React.FC = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
    <div className="flex flex-col items-center gap-4">
      {/* Brand-coloured animated ring */}
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

// ─── Login screen ─────────────────────────────────────────────────────────────

const LoginScreen: React.FC = () => {
  const { loginWithGoogle } = useAuth();

  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleLogin = async () => {
    setBusy(true);
    setError(null);
    try {
      await loginWithGoogle();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Sign-in failed. Please try again.";
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      {/* Subtle gradient backdrop */}
      <div className="absolute inset-0 bg-gradient-hero opacity-90" />

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-md mx-4 rounded-2xl shadow-elevated overflow-hidden"
        style={{ background: "white" }}
      >
        {/* Top accent bar */}
        <div className="h-1.5 w-full bg-gradient-accent" />

        <div className="px-8 py-10 flex flex-col items-center gap-6 text-center">
          {/* Brand mark */}
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-hero shadow-brand">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="w-7 h-7 text-white"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          </div>

          {/* Heading */}
          <div>
            <h1
              className="text-2xl font-bold text-foreground"
              style={{ fontFamily: "'Poppins', system-ui, sans-serif" }}
            >
              RoozgaarSetu
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
              Connecting workers with opportunities across India.
              <br />
              Sign in to continue.
            </p>
          </div>

          {/* Divider */}
          <div className="w-full h-px bg-border" />

          {/* Google sign-in button */}
          <button
            id="btn-google-signin"
            onClick={handleLogin}
            disabled={busy}
            className="
              w-full flex items-center justify-center gap-3
              px-5 py-3 rounded-xl
              bg-white border border-border
              text-sm font-semibold text-foreground
              shadow-sm
              transition-all duration-200
              hover:shadow-card-hover hover:-translate-y-px
              active:translate-y-0
              disabled:opacity-60 disabled:cursor-not-allowed
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
            "
          >
            {busy ? (
              /* Mini spinner while popup is open */
              <span className="w-5 h-5 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
            ) : (
              /* Google G logo (inline SVG — no external dependency) */
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5 flex-shrink-0"
                aria-hidden="true"
              >
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            {busy ? "Opening sign-in…" : "Continue with Google"}
          </button>

          {/* Error message */}
          {error && (
            <p className="text-xs text-destructive text-center" role="alert">
              {error}
            </p>
          )}

          <p className="text-xs text-muted-foreground">
            By continuing you agree to our terms of service.
          </p>
        </div>
      </div>
    </div>
  );
};

// ─── Gate ─────────────────────────────────────────────────────────────────────

interface LoginGateProps {
  children: ReactNode;
}

const LoginGate: React.FC<LoginGateProps> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <FullScreenSpinner />;
  if (!user) return <LoginScreen />;
  return <>{children}</>;
};

export default LoginGate;
