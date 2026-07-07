import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from "firebase/auth";
import { getDatabase, ref, push, set, get, update, remove, query, orderByChild, equalTo, Database } from "firebase/database";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCDZdWRcSF65Mn2iWK0Le6_WDl3fo_XdWg",
  authDomain: "roozgaarsetu.firebaseapp.com",
  databaseURL: "https://roozgaarsetu-default-rtdb.firebaseio.com",
  projectId: "roozgaarsetu",
  storageBucket: "roozgaarsetu.firebasestorage.app",
  messagingSenderId: "942659327329",
  appId: "1:942659327329:web:c23a56ea50e4beeecd2120",
  measurementId: "G-DG42LHPD63"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);
const provider = new GoogleAuthProvider();

// Types
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'job_seeker' | 'employer' | 'admin' | 'client' | 'worker';
  createdAt: string;
  updatedAt: string;
  isVerified: boolean;
}

export interface Job {
  id?: string;
  title: string;
  description: string;
  requirements: string;
  location: string;
  jobType: 'full_time' | 'part_time' | 'contract' | 'internship' | 'freelance';
  salaryMin?: number;
  salaryMax?: number;
  experienceMin?: number;
  skills: string[];
  category: string;
  employerId: string;
  employerName: string;
  employerLogo?: string;
  isActive: boolean;
  isApproved: boolean;
  deadline?: string;
  createdAt: string;
  updatedAt: string;
  applicationCount: number;
}

export interface Application {
  id?: string;
  jobId: string;
  jobTitle: string;
  employerId: string;
  seekerId: string;
  seekerName: string;
  seekerEmail: string;
  status: 'applied' | 'shortlisted' | 'interview_scheduled' | 'rejected' | 'hired';
  coverLetter?: string;
  resumeUrl?: string;
  appliedAt: string;
  updatedAt: string;
}

export interface SavedJob {
  id?: string;
  jobId: string;
  jobTitle: string;
  employerId: string;
  seekerId: string;
  savedAt: string;
}

// Auth Services
export const firebaseAuth = {
  // Sign in with Google
  signInWithGoogle: async (): Promise<User> => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Create or update user profile in database
      await userProfileService.createUserProfile(user);

      return user;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  },

  // Sign out
  signOut: async (): Promise<void> => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  },

  // Get current user
  getCurrentUser: (): User | null => {
    return auth.currentUser;
  },

  // Listen to auth state changes
  onAuthStateChanged: (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, callback);
  }
};

// User Profile Services
export const userProfileService = {
  // Create user profile
  createUserProfile: async (user: User): Promise<void> => {
    const userRef = ref(database, `users/${user.uid}`);
    const userProfile: UserProfile = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || '',
      photoURL: user.photoURL || '',
      role: 'client', // Default role to match existing app
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isVerified: false
    };

    await set(userRef, userProfile);
  },

  // Get user profile
  getUserProfile: async (uid: string): Promise<UserProfile | null> => {
    const userRef = ref(database, `users/${uid}`);
    const snapshot = await get(userRef);

    if (snapshot.exists()) {
      return snapshot.val() as UserProfile;
    }
    return null;
  },

  // Update user profile
  updateUserProfile: async (uid: string, updates: Partial<UserProfile>): Promise<void> => {
    const userRef = ref(database, `users/${uid}`);
    await update(userRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  }
};

// Job Services
export const jobService = {
  // Create job
  createJob: async (job: Omit<Job, 'id' | 'createdAt' | 'updatedAt' | 'applicationCount'>): Promise<string> => {
    const jobsRef = ref(database, 'jobs');
    const newJobRef = push(jobsRef);

    const jobData: Job = {
      ...job,
      id: newJobRef.key || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      applicationCount: 0
    };

    await set(newJobRef, jobData);
    return newJobRef.key || '';
  },

  // Get all jobs
  getJobs: async (): Promise<Job[]> => {
    const jobsRef = ref(database, 'jobs');
    const snapshot = await get(jobsRef);

    if (snapshot.exists()) {
      const jobs = snapshot.val() as Record<string, Job>;
      return Object.values(jobs).filter(job => job.isActive && job.isApproved);
    }
    return [];
  },

  // Get job by ID
  getJobById: async (jobId: string): Promise<Job | null> => {
    const jobRef = ref(database, `jobs/${jobId}`);
    const snapshot = await get(jobRef);

    if (snapshot.exists()) {
      return snapshot.val() as Job;
    }
    return null;
  },

  // Get jobs by employer
  getJobsByEmployer: async (employerId: string): Promise<Job[]> => {
    const jobsQuery = query(
      ref(database, 'jobs'),
      orderByChild('employerId'),
      equalTo(employerId)
    );

    const snapshot = await get(jobsQuery);

    if (snapshot.exists()) {
      const jobs = snapshot.val() as Record<string, Job>;
      return Object.values(jobs);
    }
    return [];
  },

  // Update job
  updateJob: async (jobId: string, updates: Partial<Job>): Promise<void> => {
    const jobRef = ref(database, `jobs/${jobId}`);
    await update(jobRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  },

  // Delete job
  deleteJob: async (jobId: string): Promise<void> => {
    const jobRef = ref(database, `jobs/${jobId}`);
    await remove(jobRef);
  }
};

// Application Services
export const applicationService = {
  // Submit application
  submitApplication: async (application: Omit<Application, 'id' | 'appliedAt' | 'updatedAt'>): Promise<string> => {
    const applicationsRef = ref(database, 'applications');
    const newApplicationRef = push(applicationsRef);

    const applicationData: Application = {
      ...application,
      id: newApplicationRef.key || '',
      appliedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await set(newApplicationRef, applicationData);

    // Update job application count
    const jobRef = ref(database, `jobs/${application.jobId}`);
    await update(jobRef, {
      applicationCount: increment(1)
    });

    return newApplicationRef.key || '';
  },

  // Get applications by job
  getApplicationsByJob: async (jobId: string): Promise<Application[]> => {
    const applicationsQuery = query(
      ref(database, 'applications'),
      orderByChild('jobId'),
      equalTo(jobId)
    );

    const snapshot = await get(applicationsQuery);

    if (snapshot.exists()) {
      const applications = snapshot.val() as Record<string, Application>;
      return Object.values(applications);
    }
    return [];
  },

  // Get applications by seeker
  getApplicationsBySeeker: async (seekerId: string): Promise<Application[]> => {
    const applicationsQuery = query(
      ref(database, 'applications'),
      orderByChild('seekerId'),
      equalTo(seekerId)
    );

    const snapshot = await get(applicationsQuery);

    if (snapshot.exists()) {
      const applications = snapshot.val() as Record<string, Application>;
      return Object.values(applications);
    }
    return [];
  },

  // Update application status
  updateApplicationStatus: async (applicationId: string, status: Application['status']): Promise<void> => {
    const applicationRef = ref(database, `applications/${applicationId}`);
    await update(applicationRef, {
      status,
      updatedAt: new Date().toISOString()
    });
  }
};

// Saved Jobs Services
export const savedJobService = {
  // Save job
  saveJob: async (savedJob: Omit<SavedJob, 'id' | 'savedAt'>): Promise<string> => {
    const savedJobsRef = ref(database, 'savedJobs');
    const newSavedJobRef = push(savedJobsRef);

    const savedJobData: SavedJob = {
      ...savedJob,
      id: newSavedJobRef.key || '',
      savedAt: new Date().toISOString()
    };

    await set(newSavedJobRef, savedJobData);
    return newSavedJobRef.key || '';
  },

  // Get saved jobs by seeker
  getSavedJobsBySeeker: async (seekerId: string): Promise<SavedJob[]> => {
    const savedJobsQuery = query(
      ref(database, 'savedJobs'),
      orderByChild('seekerId'),
      equalTo(seekerId)
    );

    const snapshot = await get(savedJobsQuery);

    if (snapshot.exists()) {
      const savedJobs = snapshot.val() as Record<string, SavedJob>;
      return Object.values(savedJobs);
    }
    return [];
  },

  // Remove saved job
  removeSavedJob: async (savedJobId: string): Promise<void> => {
    const savedJobRef = ref(database, `savedJobs/${savedJobId}`);
    await remove(savedJobRef);
  }
};

// Helper function for incrementing counters
const increment = (count: number): number => count + 1;

export { auth, database, provider };
