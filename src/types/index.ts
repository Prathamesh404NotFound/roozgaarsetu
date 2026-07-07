// ─── User / Auth ──────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phone?: string;
  city?: string;
  role: 'client' | 'worker' | 'admin';
  isVerified: boolean;
  createdAt: Date;
  lastLoginAt: Date;
}

// ─── Bookings ─────────────────────────────────────────────────────────────────

export type BookingStatus = 'pending' | 'accepted' | 'completed' | 'declined';

export interface Booking {
  id: string;
  clientId: string;
  clientName: string;
  workerId: string;
  workerName: string;
  category: string;
  date: string;          // ISO string
  notes?: string;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
  amount?: number;
}

// ─── Worker profile (workers/{uid} node) ──────────────────────────────────────

export interface WorkerRecord {
  uid: string;
  category: string;
  experience: string;
  phone: string;
  city: string;
  bio: string;
  availability: boolean;
  isVerified: boolean;
  registeredAt: string;
}
