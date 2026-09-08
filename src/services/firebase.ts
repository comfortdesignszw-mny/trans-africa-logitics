/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  onSnapshot,
  query,
  orderBy,
  deleteDoc,
  limit,
  getDocs,
} from 'firebase/firestore';
import firebaseConfigData from '../../firebase-applet-config.json';
import { UserProfile, UserRole, SADCCountry, LoadItem, TruckListing, ChatMessage } from '../types';

export const firebaseConfig = {
  apiKey: firebaseConfigData.apiKey,
  authDomain: firebaseConfigData.authDomain,
  projectId: firebaseConfigData.projectId,
  storageBucket: firebaseConfigData.storageBucket,
  messagingSenderId: firebaseConfigData.messagingSenderId,
  appId: firebaseConfigData.appId,
};

// Initialize Firebase App instance
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Firestore with specific provisioned databaseId
export const db = getFirestore(
  app,
  firebaseConfigData.firestoreDatabaseId || '(default)'
);

// Google Provider configuration
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Standardize phone number to valid internal Firebase auth format
 * e.g. "+263771234567" -> "263771234567@phone.transafrica.logistics"
 */
export function phoneToAuthEmail(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, '');
  return `${digits}@phone.transafrica.logistics`;
}

export interface RegisterPayload {
  fullName: string;
  role: UserRole;
  companyName: string;
  phone: string;
  email: string;
  country: SADCCountry;
}

export const AuthService = {
  // Get current raw Firebase auth user
  getCurrentUser(): FirebaseUser | null {
    return auth.currentUser;
  },

  // Listen to Auth State Changes
  onAuthChange(callback: (user: FirebaseUser | null) => void) {
    return onAuthStateChanged(auth, callback);
  },

  // Email + Password Registration
  async registerWithEmail(email: string, pass: string, profile: RegisterPayload): Promise<UserProfile> {
    const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    const fbUser = userCredential.user;

    await updateProfile(fbUser, { displayName: profile.fullName });

    const userProfile: UserProfile = {
      id: fbUser.uid,
      role: profile.role,
      fullName: profile.fullName,
      companyName: profile.companyName,
      phone: profile.phone,
      email: email.trim(),
      country: profile.country,
      currentCoords: { lat: -17.8252, lng: 31.0335 }, // Default Harare/Beitbridge corridor
      kycStatus: 'verified',
      kycBadge: profile.role === 'trucker' ? 'Silver Verified' : 'Standard',
    };

    // Save to Firestore users collection
    try {
      await setDoc(doc(db, 'users', fbUser.uid), {
        ...userProfile,
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Could not write profile to Firestore immediately:', err);
    }

    return userProfile;
  },

  // Email + Password Login
  async loginWithEmail(email: string, pass: string): Promise<UserProfile> {
    const userCredential = await signInWithEmailAndPassword(auth, email.trim(), pass);
    return this.fetchOrBuildProfile(userCredential.user);
  },

  // Phone + Password Registration
  async registerWithPhone(phone: string, pass: string, profile: RegisterPayload): Promise<UserProfile> {
    const authEmail = phoneToAuthEmail(phone);
    const userCredential = await createUserWithEmailAndPassword(auth, authEmail, pass);
    const fbUser = userCredential.user;

    await updateProfile(fbUser, { displayName: profile.fullName });

    const userProfile: UserProfile = {
      id: fbUser.uid,
      role: profile.role,
      fullName: profile.fullName,
      companyName: profile.companyName,
      phone: phone.trim(),
      email: profile.email || `${phone.replace(/[^0-9]/g, '')}@transafrica.carrier`,
      country: profile.country,
      currentCoords: { lat: -22.2167, lng: 29.9833 }, // Beitbridge corridor
      kycStatus: 'verified',
      kycBadge: profile.role === 'trucker' ? 'Gold Corridor Transporter' : 'Standard',
    };

    try {
      await setDoc(doc(db, 'users', fbUser.uid), {
        ...userProfile,
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Could not write phone user profile to Firestore:', err);
    }

    return userProfile;
  },

  // Phone + Password Login
  async loginWithPhone(phone: string, pass: string): Promise<UserProfile> {
    const authEmail = phoneToAuthEmail(phone);
    const userCredential = await signInWithEmailAndPassword(auth, authEmail, pass);
    return this.fetchOrBuildProfile(userCredential.user);
  },

  // Google Sign-In with Popup
  async loginWithGoogle(defaultRole: UserRole = 'shipper'): Promise<UserProfile> {
    const result = await signInWithPopup(auth, googleProvider);
    const fbUser = result.user;

    // Check if user document already exists
    try {
      const userDocRef = doc(db, 'users', fbUser.uid);
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        const data = snap.data();
        return {
          id: fbUser.uid,
          role: (data.role as UserRole) || defaultRole,
          fullName: data.fullName || fbUser.displayName || 'SADC Operator',
          companyName: data.companyName || 'Regional Enterprise',
          phone: data.phone || '+263 77 100 0000',
          email: fbUser.email || '',
          country: (data.country as SADCCountry) || 'Zimbabwe',
          currentCoords: data.currentCoords || { lat: -26.2041, lng: 28.0473 },
          kycStatus: data.kycStatus || 'verified',
          kycBadge: data.kycBadge || 'Silver Verified',
        };
      }
    } catch (e) {
      console.warn('Error reading Google user document:', e);
    }

    // New Google user profile
    const newProfile: UserProfile = {
      id: fbUser.uid,
      role: defaultRole,
      fullName: fbUser.displayName || 'Google Corridor User',
      companyName: 'Verified Freight Partner',
      phone: '+263 77 123 4567',
      email: fbUser.email || '',
      country: 'South Africa',
      currentCoords: { lat: -26.2041, lng: 28.0473 },
      kycStatus: 'verified',
      kycBadge: 'Silver Verified',
    };

    try {
      await setDoc(doc(db, 'users', fbUser.uid), {
        ...newProfile,
        createdAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Could not write new Google user to Firestore:', e);
    }

    return newProfile;
  },

  // Logout
  async logout(): Promise<void> {
    await signOut(auth);
  },

  // Helper: Fetch Firestore profile or build default
  async fetchOrBuildProfile(fbUser: FirebaseUser): Promise<UserProfile> {
    try {
      const userDocRef = doc(db, 'users', fbUser.uid);
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        const data = snap.data();
        return {
          id: fbUser.uid,
          role: (data.role as UserRole) || 'trucker',
          fullName: data.fullName || fbUser.displayName || 'Registered Transporter',
          companyName: data.companyName || 'SADC Haulage Ltd',
          phone: data.phone || '+263 77 200 0000',
          email: fbUser.email || data.email || '',
          country: (data.country as SADCCountry) || 'Zimbabwe',
          currentCoords: data.currentCoords || { lat: -22.2167, lng: 29.9833 },
          kycStatus: data.kycStatus || 'verified',
          kycBadge: data.kycBadge || 'Gold Corridor Transporter',
        };
      }
    } catch (e) {
      console.warn('Failed to fetch user document from Firestore:', e);
    }

    // Fallback based on user display info
    return {
      id: fbUser.uid,
      role: 'trucker',
      fullName: fbUser.displayName || 'SADC Carrier',
      companyName: 'Independent Hauler',
      phone: '+27 11 000 0000',
      email: fbUser.email || '',
      country: 'South Africa',
      currentCoords: { lat: -26.2041, lng: 28.0473 },
      kycStatus: 'verified',
      kycBadge: 'Silver Verified',
    };
  },

  // Update profile role / details
  async updateUserRole(uid: string, newRole: UserRole): Promise<void> {
    try {
      const userDocRef = doc(db, 'users', uid);
      await updateDoc(userDocRef, { role: newRole });
    } catch (e) {
      console.warn('Could not update role in Firestore:', e);
    }
  },
};
