import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { firebaseAuth, userProfileService, UserProfile } from '@/services/firebase';

interface FirebaseContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  isAuthenticated: boolean;
  isJobSeeker: boolean;
  isEmployer: boolean;
  isAdmin: boolean;
  isClient: boolean;
  isWorker: boolean;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};

interface FirebaseProviderProps {
  children: ReactNode;
}

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      const signedInUser = await firebaseAuth.signInWithGoogle();
      setUser(signedInUser);

      // Fetch user profile after sign in
      const profile = await userProfileService.getUserProfile(signedInUser.uid);
      setUserProfile(profile);
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      await firebaseAuth.signOut();
      setUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  // Update user profile
  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error('No user logged in');

    try {
      await userProfileService.updateUserProfile(user.uid, updates);

      // Refresh user profile
      const updatedProfile = await userProfileService.getUserProfile(user.uid);
      setUserProfile(updatedProfile);
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  };

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = firebaseAuth.onAuthStateChanged(async (authUser) => {
      setUser(authUser);

      if (authUser) {
        // Fetch user profile
        const profile = await userProfileService.getUserProfile(authUser.uid);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Computed properties
  const isAuthenticated = !!user;
  const isJobSeeker = userProfile?.role === 'job_seeker' || userProfile?.role === 'client';
  const isEmployer = userProfile?.role === 'employer' || userProfile?.role === 'worker';
  const isAdmin = userProfile?.role === 'admin';
  /**
   * Every authenticated user is a client — regardless of primary role.
   * Admins and registered workers all retain client access.
   */
  const isClient = !!user;
  /**
   * True once the user has submitted the BecomeWorker form.
   * Checked via isWorkerRegistered flag, not the role field.
   */
  const isWorker = userProfile?.isWorkerRegistered === true;

  const value: FirebaseContextType = {
    user,
    userProfile,
    loading,
    signInWithGoogle,
    signOut,
    updateUserProfile,
    isAuthenticated,
    isJobSeeker,
    isEmployer,
    isAdmin,
    isClient,
    isWorker,
  };

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
};
