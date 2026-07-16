// ─── User / Auth ──────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phone?: string;
  city?: string;
  locality?: string;
  /**
   * Primary account designation — never overwritten by BecomeWorker.
   * Use isWorkerRegistered to check worker capability instead of
   * comparing this against "worker".
   */
  role: 'client' | 'worker' | 'admin';
  /**
   * True once the user has completed the BecomeWorker registration form.
   * Independent of `role` — a client OR admin can both have this set.
   */
  isWorkerRegistered: boolean;
  isVerified: boolean;
  verificationStatus?: 'unverified' | 'phone_verified' | 'id_verified';
  category?: string; // Tagged primary service category for workers
  categories?: string[]; // Tagged skills/categories for workers
  createdAt: Date;
  lastLoginAt: Date;
}

// ─── Bookings ─────────────────────────────────────────────────────────────────

export type BookingStatus = 'pending' | 'accepted' | 'completed' | 'declined';
export type PaymentStatus = 'pending' | 'held' | 'released' | 'refunded' | 'disputed';

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
  paymentStatus?: PaymentStatus;
  createdAt: string;
  updatedAt: string;
  amount?: number;
  locality?: string;
  urgent?: boolean;
  voiceNoteBase64?: string;
  latitude?: number;     // Latitude coordinate
  longitude?: number;    // Longitude coordinate
  payoutType?: 'instant' | 'standard';
  payoutFeeDeduction?: number;
  actualPayoutAmount?: number;
}

// ─── Worker profile (workers/{uid} node) ──────────────────────────────────────

export interface WorkerRecord {
  uid: string;
  category: string;      // Primary service category
  categories?: string[]; // Tagged skills/categories
  experience: string;
  phone: string;
  city: string;
  locality?: string;
  bio: string;
  availability: boolean;
  isVerified: boolean;
  verificationStatus?: 'unverified' | 'phone_verified' | 'id_verified';
  idDocumentUrl?: string; // Doc uploaded by worker in verification portal
  registeredAt: string;
}

