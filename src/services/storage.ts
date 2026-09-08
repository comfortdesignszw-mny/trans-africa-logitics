/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { INITIAL_SEED_LOADS, INITIAL_SEED_TRUCKS } from '../data/sadcData';
import { ChatMessage, LiveTelemetry, LoadItem, SOSAlert, TruckListing, UserProfile, UserReview } from '../types';

const STORAGE_KEYS = {
  LOADS: 'transafrica_loads_v2',
  TRUCKS: 'transafrica_trucks_v2',
  MESSAGES: 'transafrica_messages_v2',
  USER_PROFILE: 'transafrica_user_profile_v2',
  OUTBOX: 'transafrica_offline_outbox_v2',
  OFFLINE_SIMULATION: 'transafrica_simulate_offline_v2',
  REVIEWS: 'transafrica_reviews_v2',
  SOS_ALERTS: 'transafrica_sos_alerts_v2',
};

export interface OutboxItem {
  id: string;
  type: 'post_load' | 'post_truck' | 'send_message' | 'update_load_status' | 'bid_offer';
  payload: any;
  createdAt: string;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
}

// Local Storage Helper with safety check
class LocalStorageAdapter {
  getItem<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      if (!data) return defaultValue;
      return JSON.parse(data) as T;
    } catch (err) {
      console.warn(`Error reading localStorage key "${key}":`, err);
      return defaultValue;
    }
  }

  setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.error(`Error saving localStorage key "${key}":`, err);
    }
  }
}

const storage = new LocalStorageAdapter();

// Storage Service API
export const StorageService = {
  // Check if simulated offline mode is enabled
  isOfflineSimulation(): boolean {
    return storage.getItem<boolean>(STORAGE_KEYS.OFFLINE_SIMULATION, false);
  },

  setOfflineSimulation(enabled: boolean): void {
    storage.setItem(STORAGE_KEYS.OFFLINE_SIMULATION, enabled);
    window.dispatchEvent(new CustomEvent('transafrica-offline-mode-change', { detail: enabled }));
  },

  // Effective online status
  isOnline(): boolean {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return false;
    }
    return !this.isOfflineSimulation();
  },

  // LOADS
  getLoads(): LoadItem[] {
    const existing = storage.getItem<LoadItem[]>(STORAGE_KEYS.LOADS, []);
    if (existing.length === 0) {
      storage.setItem(STORAGE_KEYS.LOADS, INITIAL_SEED_LOADS);
      return INITIAL_SEED_LOADS;
    }
    return existing;
  },

  saveLoad(load: LoadItem): { load: LoadItem; wasQueued: boolean } {
    const loads = this.getLoads();
    const isOffline = !this.isOnline();

    const newLoad: LoadItem = {
      ...load,
      syncStatus: isOffline ? 'queued_offline' : 'synced',
      updatedAt: new Date().toISOString(),
    };

    const index = loads.findIndex((l) => l.id === newLoad.id);
    if (index >= 0) {
      loads[index] = newLoad;
    } else {
      loads.unshift(newLoad);
    }
    storage.setItem(STORAGE_KEYS.LOADS, loads);

    if (isOffline) {
      this.enqueueOutbox({
        id: `outbox-load-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        type: 'post_load',
        payload: newLoad,
        createdAt: new Date().toISOString(),
        status: 'pending',
      });
    }

    return { load: newLoad, wasQueued: isOffline };
  },

  updateLoadStatus(loadId: string, status: LoadItem['status'], truckerId?: string, truckerName?: string): LoadItem | null {
    const loads = this.getLoads();
    const target = loads.find((l) => l.id === loadId);
    if (!target) return null;

    target.status = status;
    if (truckerId) target.assignedTruckerId = truckerId;
    if (truckerName) target.assignedTruckerName = truckerName;
    target.updatedAt = new Date().toISOString();

    storage.setItem(STORAGE_KEYS.LOADS, loads);

    if (!this.isOnline()) {
      this.enqueueOutbox({
        id: `outbox-status-${Date.now()}`,
        type: 'update_load_status',
        payload: { loadId, status, truckerId, truckerName },
        createdAt: new Date().toISOString(),
        status: 'pending',
      });
    }

    return target;
  },

  // TRUCKS
  getTrucks(): TruckListing[] {
    const existing = storage.getItem<TruckListing[]>(STORAGE_KEYS.TRUCKS, []);
    if (existing.length === 0) {
      storage.setItem(STORAGE_KEYS.TRUCKS, INITIAL_SEED_TRUCKS);
      return INITIAL_SEED_TRUCKS;
    }
    return existing;
  },

  saveTruck(truck: TruckListing): { truck: TruckListing; wasQueued: boolean } {
    const trucks = this.getTrucks();
    const isOffline = !this.isOnline();

    const newTruck: TruckListing = {
      ...truck,
      syncStatus: isOffline ? 'queued_offline' : 'synced',
    };

    const index = trucks.findIndex((t) => t.id === newTruck.id);
    if (index >= 0) {
      trucks[index] = newTruck;
    } else {
      trucks.unshift(newTruck);
    }
    storage.setItem(STORAGE_KEYS.TRUCKS, trucks);

    if (isOffline) {
      this.enqueueOutbox({
        id: `outbox-truck-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        type: 'post_truck',
        payload: newTruck,
        createdAt: new Date().toISOString(),
        status: 'pending',
      });
    }

    return { truck: newTruck, wasQueued: isOffline };
  },

  // MESSAGES & NEGOTIATIONS
  getMessages(loadId?: string): ChatMessage[] {
    const messages = storage.getItem<ChatMessage[]>(STORAGE_KEYS.MESSAGES, []);
    if (loadId) {
      return messages.filter((m) => m.loadId === loadId);
    }
    return messages;
  },

  saveMessage(msg: ChatMessage): { message: ChatMessage; wasQueued: boolean } {
    const messages = storage.getItem<ChatMessage[]>(STORAGE_KEYS.MESSAGES, []);
    const isOffline = !this.isOnline();

    const newMessage: ChatMessage = {
      ...msg,
      syncStatus: isOffline ? 'queued_offline' : 'synced',
    };

    messages.push(newMessage);
    storage.setItem(STORAGE_KEYS.MESSAGES, messages);

    if (isOffline) {
      this.enqueueOutbox({
        id: `outbox-msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        type: 'send_message',
        payload: newMessage,
        createdAt: new Date().toISOString(),
        status: 'pending',
      });
    }

    return { message: newMessage, wasQueued: isOffline };
  },

  // OUTBOX MANAGEMENT FOR BACKGROUND SYNC
  getOutbox(): OutboxItem[] {
    return storage.getItem<OutboxItem[]>(STORAGE_KEYS.OUTBOX, []);
  },

  enqueueOutbox(item: OutboxItem): void {
    const outbox = this.getOutbox();
    outbox.push(item);
    storage.setItem(STORAGE_KEYS.OUTBOX, outbox);
  },

  clearOutbox(): void {
    storage.setItem(STORAGE_KEYS.OUTBOX, []);
  },

  // Execute Background Sync for all queued outbox records
  async syncOutbox(): Promise<{ syncedCount: number; errors: number }> {
    const outbox = this.getOutbox();
    if (outbox.length === 0) return { syncedCount: 0, errors: 0 };

    let syncedCount = 0;
    const loads = this.getLoads();
    const trucks = this.getTrucks();
    const messages = storage.getItem<ChatMessage[]>(STORAGE_KEYS.MESSAGES, []);

    for (const item of outbox) {
      try {
        if (item.type === 'post_load') {
          const lIndex = loads.findIndex((l) => l.id === item.payload.id);
          if (lIndex >= 0) loads[lIndex].syncStatus = 'synced';
        } else if (item.type === 'post_truck') {
          const tIndex = trucks.findIndex((t) => t.id === item.payload.id);
          if (tIndex >= 0) trucks[tIndex].syncStatus = 'synced';
        } else if (item.type === 'send_message') {
          const mIndex = messages.findIndex((m) => m.id === item.payload.id);
          if (mIndex >= 0) messages[mIndex].syncStatus = 'synced';
        }
        syncedCount++;
      } catch (e) {
        console.error('Sync item failed:', item, e);
      }
    }

    storage.setItem(STORAGE_KEYS.LOADS, loads);
    storage.setItem(STORAGE_KEYS.TRUCKS, trucks);
    storage.setItem(STORAGE_KEYS.MESSAGES, messages);
    this.clearOutbox();

    window.dispatchEvent(new CustomEvent('transafrica-sync-complete', { detail: { syncedCount } }));
    return { syncedCount, errors: 0 };
  },

  saveLoads(loads: LoadItem[]): void {
    storage.setItem(STORAGE_KEYS.LOADS, loads);
  },

  saveTrucks(trucks: TruckListing[]): void {
    storage.setItem(STORAGE_KEYS.TRUCKS, trucks);
  },

  // USER PROFILE & ROLE
  getUserProfile(): UserProfile {
    const defaultGuestProfile: UserProfile = {
      id: 'guest-anonymous-user',
      role: 'trucker',
      fullName: 'Guest Visitor',
      companyName: 'Browsing SADC Corridors',
      phone: '',
      email: '',
      country: 'Zimbabwe',
      currentCoords: { lat: -22.3486, lng: 30.0401 }, // Beitbridge corridor
      kycStatus: 'unverified',
      kycBadge: 'Standard',
      isAnonymous: true,
      authProvider: 'guest',
    };

    return storage.getItem<UserProfile>(STORAGE_KEYS.USER_PROFILE, defaultGuestProfile);
  },

  saveUserProfile(profile: UserProfile): void {
    storage.setItem(STORAGE_KEYS.USER_PROFILE, profile);
    window.dispatchEvent(new CustomEvent('transafrica-profile-updated', { detail: profile }));
  },

  // REVIEWS & RATINGS SYSTEM
  getReviews(targetUserId?: string): UserReview[] {
    const reviews = storage.getItem<UserReview[]>(STORAGE_KEYS.REVIEWS, [
      {
        id: 'rev-001',
        loadId: 'load-001',
        reviewerId: 'ship-katanga-copper',
        reviewerName: 'Tendai Mutasa',
        reviewerRole: 'shipper',
        targetUserId: 'tr-farai-dube',
        targetUserName: 'Farai Dube',
        rating: 5,
        feedback: 'Superb transporter. Safely navigated Beitbridge OSBP with zero transit delays. All copper cathodes arrived with original bonded seals intact.',
        categoryScores: {
          punctuality: 5,
          cargoCare: 5,
          communication: 5,
        },
        createdAt: '2026-09-06T11:00:00Z',
      },
      {
        id: 'rev-002',
        loadId: 'load-dom-001',
        reviewerId: 'tr-tatenda-gumbo',
        reviewerName: 'Tatenda Gumbo',
        reviewerRole: 'trucker',
        targetUserId: 'ship-gmb-zim',
        targetUserName: 'Grain Marketing & Feed Distribution ZW',
        rating: 5,
        feedback: 'Prompt payment released immediately upon POD delivery at Belmont Depot. Friendly offloading team, in and out within 90 minutes.',
        categoryScores: {
          punctuality: 5,
          cargoCare: 5,
          communication: 5,
          paymentPromptness: 5,
        },
        createdAt: '2026-09-07T15:20:00Z',
      },
    ]);

    if (targetUserId) {
      return reviews.filter((r) => r.targetUserId === targetUserId);
    }
    return reviews;
  },

  saveReview(review: UserReview): UserReview {
    const reviews = this.getReviews();
    reviews.unshift(review);
    storage.setItem(STORAGE_KEYS.REVIEWS, reviews);

    // Update target trucker rating if target is trucker
    const trucks = this.getTrucks();
    const truck = trucks.find((t) => t.truckerId === review.targetUserId);
    if (truck) {
      const truckerReviews = reviews.filter((r) => r.targetUserId === review.targetUserId);
      const avg = truckerReviews.reduce((sum, r) => sum + r.rating, 0) / truckerReviews.length;
      truck.rating = Math.round(avg * 10) / 10;
      truck.ratingsCount = truckerReviews.length;
      storage.setItem(STORAGE_KEYS.TRUCKS, trucks);
    }

    return review;
  },

  // EMERGENCY SOS SYSTEM
  getSOSAlerts(): SOSAlert[] {
    return storage.getItem<SOSAlert[]>(STORAGE_KEYS.SOS_ALERTS, []);
  },

  triggerSOS(alert: SOSAlert): SOSAlert {
    const alerts = this.getSOSAlerts();
    alerts.unshift(alert);
    storage.setItem(STORAGE_KEYS.SOS_ALERTS, alerts);
    window.dispatchEvent(new CustomEvent('transafrica-sos-alert', { detail: alert }));
    return alert;
  },

  // TELEMETRY UPDATE (Live GPS navigation pings)
  updateLoadTelemetry(loadId: string, telemetry: Partial<LiveTelemetry>): LoadItem | null {
    const loads = this.getLoads();
    const load = loads.find((l) => l.id === loadId);
    if (!load) return null;

    load.telemetry = {
      ...(load.telemetry || {
        currentLat: load.origin.lat,
        currentLng: load.origin.lng,
        speedKmh: 0,
        headingDeg: 0,
        lastPingTime: 'Just now',
        batteryPct: 98,
        signalQuality: 'strong',
        routeProgressPct: 0,
        nearestTown: load.origin.city,
        etaMinutes: 180,
      }),
      ...telemetry,
      lastPingTime: 'Just now (Live GPS)',
    };

    storage.setItem(STORAGE_KEYS.LOADS, loads);
    return load;
  },

  // Reset demo data
  resetDefaults(): void {
    storage.setItem(STORAGE_KEYS.LOADS, INITIAL_SEED_LOADS);
    storage.setItem(STORAGE_KEYS.TRUCKS, INITIAL_SEED_TRUCKS);
    storage.setItem(STORAGE_KEYS.MESSAGES, []);
    storage.setItem(STORAGE_KEYS.OUTBOX, []);
    storage.setItem(STORAGE_KEYS.REVIEWS, []);
    storage.setItem(STORAGE_KEYS.SOS_ALERTS, []);
  },
};
