import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { ref, get, set, update } from "firebase/database";
import { auth, googleProvider, database } from "@/lib/firebase";
import type { UserProfile } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Path in Realtime Database where all user profiles live. */
const userRef = (uid: string) => ref(database, `users/${uid}`);

/**
 * Converts the raw DB snapshot value into a typed UserProfile.
 * Dates come back from RTDB as ISO strings, so we re-hydrate them.
 */
function snapshotToProfile(uid: string, data: Record<string, unknown>): UserProfile {
  return {
    id: uid,
    email: (data.email as string) ?? "",
    displayName: (data.displayName as string) ?? "",
    photoURL: (data.photoURL as string | undefined) ?? undefined,
    phone: (data.phone as string | undefined) ?? undefined,
    role: (data.role as UserProfile["role"]) ?? "client",
    isVerified: (data.isVerified as boolean) ?? false,
    verificationStatus: (data.verificationStatus as UserProfile["verificationStatus"]) ?? "unverified",
    category: (data.category as string | undefined) ?? undefined,
    categories: (data.categories as string[] | undefined) ?? undefined,
    createdAt: new Date((data.createdAt as string) ?? Date.now()),
    lastLoginAt: new Date((data.lastLoginAt as string) ?? Date.now()),
  };
}

// ─── Context shape ────────────────────────────────────────────────────────────

interface AuthContextType {
  /** The raw Firebase Auth user object (or null when signed out). */
  user: User | null;
  /** The enriched profile stored in the Realtime Database (or null). */
  profile: UserProfile | null;
  /** True while the initial auth-state resolution is in flight. */
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  /**
   * Persists a new role to the database AND updates local state immediately
   * so consumers don't need a re-login to see the change.
   */
  updateUserRole: (role: UserProfile["role"]) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
};

// ─── Provider ────────────────────────────────────────────────────────────────

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Auth-state listener ────────────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        // Signed out
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setUser(firebaseUser);

      const snapshot = await get(userRef(firebaseUser.uid));
      const now = new Date().toISOString();

      if (!snapshot.exists()) {
        // ── First-ever sign-in: create the profile with role 'client' ────────
        const newProfile: UserProfile = {
          id: firebaseUser.uid,
          email: firebaseUser.email ?? "",
          displayName: firebaseUser.displayName ?? "",
          photoURL: firebaseUser.photoURL ?? undefined,
          role: "client",
          isVerified: false,
          verificationStatus: "unverified",
          createdAt: new Date(),
          lastLoginAt: new Date(),
        };

        await set(userRef(firebaseUser.uid), {
          ...newProfile,
          createdAt: now,
          lastLoginAt: now,
        });

        setProfile(newProfile);
      } else {
        // ── Returning user: update lastLoginAt only, keep existing role ───────
        await update(userRef(firebaseUser.uid), { lastLoginAt: now });

        const data = snapshot.val() as Record<string, unknown>;
        const existingProfile = snapshotToProfile(firebaseUser.uid, {
          ...data,
          lastLoginAt: now, // reflect the update locally right away
        });

        setProfile(existingProfile);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // ── loginWithGoogle ────────────────────────────────────────────────────────
  const loginWithGoogle = useCallback(async (): Promise<void> => {
    await signInWithPopup(auth, googleProvider);
    // onAuthStateChanged will fire and handle profile creation / update
  }, []);

  // ── logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(async (): Promise<void> => {
    await signOut(auth);
  }, []);

  // ── updateUserRole ─────────────────────────────────────────────────────────
  const updateUserRole = useCallback(
    async (role: UserProfile["role"]): Promise<void> => {
      if (!user) throw new Error("No authenticated user");

      await update(userRef(user.uid), { role });

      // Reflect the change in local state immediately — no re-login needed
      setProfile((prev) => (prev ? { ...prev, role } : prev));
    },
    [user]
  );

  // ── Context value ──────────────────────────────────────────────────────────
  const value: AuthContextType = {
    user,
    profile,
    loading,
    loginWithGoogle,
    logout,
    updateUserRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
