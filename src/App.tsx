/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Truck,
  Package,
  ShieldCheck,
  User,
  Plus,
  Navigation,
  Siren,
  CheckCircle2,
  Activity,
  LogIn,
  LogOut,
  ShieldAlert,
  Globe2,
  Sparkles,
} from 'lucide-react';
import {
  LoadItem,
  TruckListing,
  UserProfile,
  UserRole,
} from './types';
import { StorageService } from './services/storage';
import { AuthService } from './services/firebase';
import { SADC_CITIES } from './data/sadcData';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import { BottomFloatingNav, MainNavTab } from './components/BottomFloatingNav';
import { CorridorBoardSection } from './components/CorridorBoardSection';
import { ConsignmentsSection } from './components/ConsignmentsSection';
import { TrucksSection } from './components/TrucksSection';
import { BorderClearancePanel } from './components/BorderClearancePanel';
import { ConsignmentSmartWindow } from './components/ConsignmentSmartWindow';
import { TruckSmartWindow } from './components/TruckSmartWindow';
import { PostLoadModal } from './components/PostLoadModal';
import { PostTruckModal } from './components/PostTruckModal';
import { NegotiationChatModal } from './components/NegotiationChatModal';
import { LiveNavigationCockpit } from './components/LiveNavigationCockpit';
import { EmergencySOSModal } from './components/EmergencySOSModal';
import { RatingReviewModal } from './components/RatingReviewModal';
import { AuthModal } from './components/AuthModal';
import { AdminSupervisionModal } from './components/AdminSupervisionModal';

export default function App() {
  // Navigation: Bottom Floating Navigation
  const [currentTab, setCurrentTab] = useState<MainNavTab>('board');

  // Core Data
  const [currentUser, setCurrentUser] = useState<UserProfile>(StorageService.getUserProfile());
  const [loads, setLoads] = useState<LoadItem[]>([]);
  const [trucks, setTrucks] = useState<TruckListing[]>([]);

  // Smart Windows for Neatly Arranged Inspection
  const [inspectedLoad, setInspectedLoad] = useState<LoadItem | null>(null);
  const [inspectedTruck, setInspectedTruck] = useState<TruckListing | null>(null);

  // Modals & Active Workflows
  const [showPostLoadModal, setShowPostLoadModal] = useState(false);
  const [showPostTruckModal, setShowPostTruckModal] = useState(false);
  const [chatLoad, setChatLoad] = useState<LoadItem | null>(null);
  const [navigatingLoad, setNavigatingLoad] = useState<LoadItem | null>(null);
  const [showEmergencySOS, setShowEmergencySOS] = useState(false);
  const [ratingTarget, setRatingTarget] = useState<{
    id: string;
    name: string;
    role: 'trucker' | 'shipper';
    loadId?: string;
    loadTitle?: string;
  } | null>(null);

  // Authentication & REBAC Modals
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authEncouragement, setAuthEncouragement] = useState<{
    actionTitle: string;
    description: string;
  } | null>(null);
  const [showAdminModal, setShowAdminModal] = useState(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const refreshData = () => {
    setLoads(StorageService.getLoads());
    setTrucks(StorageService.getTrucks());
    setCurrentUser(StorageService.getUserProfile());
  };

  useEffect(() => {
    refreshData();

    // Firebase Auth State Listener
    const unsubscribeAuth = AuthService.onAuthChange(async (fbUser) => {
      if (fbUser) {
        const profile = await AuthService.fetchOrBuildProfile(fbUser);
        profile.isAnonymous = false;
        StorageService.saveUserProfile(profile);
        setCurrentUser(profile);
      }
    });

    const handleSyncComplete = () => {
      refreshData();
      showToast('Corridor Outbox Synced: Local loads, trucks & bids pushed to network.');
    };

    window.addEventListener('transafrica-sync-complete', handleSyncComplete);
    return () => {
      unsubscribeAuth();
      window.removeEventListener('transafrica-sync-complete', handleSyncComplete);
    };
  }, []);

  const triggerAuthEncouragement = (actionTitle: string, description: string) => {
    setAuthEncouragement({ actionTitle, description });
    setShowAuthModal(true);
  };

  const handlePostLoadClick = () => {
    if (currentUser.isAnonymous) {
      triggerAuthEncouragement(
        'Shipper Account Required to Post Consignment',
        'Guests can freely inspect all corridors, cargo boards, and border posts. To publish your consignment and receive transporter bids across SADC, please sign in or register with Google, Phone, or Email.'
      );
      return;
    }
    setShowPostLoadModal(true);
  };

  const handlePostTruckClick = () => {
    if (currentUser.isAnonymous) {
      triggerAuthEncouragement(
        'Transporter Sign-In Required',
        'Guests can view all loads and trucks freely. To register your carrier rig, publish trailer availability, and receive freight assignments, please sign in or create an account.'
      );
      return;
    }
    setShowPostTruckModal(true);
  };

  const handleInitiateChat = (load: LoadItem) => {
    if (currentUser.isAnonymous) {
      triggerAuthEncouragement(
        'Sign In to Negotiate & Place Bids',
        'Guests can freely browse cargo manifests. To submit freight proposals, exchange counter-offers, or message the shipper directly, please sign in with Phone, Email, or Google.'
      );
      return;
    }
    setChatLoad(load);
  };

  const handleLogout = async () => {
    try {
      await AuthService.logout();
    } catch (e) {
      console.warn('Logout error:', e);
    }
    const guestProfile: UserProfile = {
      id: 'guest-anonymous-user',
      role: 'trucker',
      fullName: 'Guest Visitor',
      companyName: 'Browsing SADC Corridors',
      phone: '',
      email: '',
      country: 'Zimbabwe',
      currentCoords: { lat: -22.3486, lng: 30.0401 },
      kycStatus: 'unverified',
      kycBadge: 'Standard',
      isAnonymous: true,
      authProvider: 'guest',
    };
    StorageService.saveUserProfile(guestProfile);
    setCurrentUser(guestProfile);
    showToast('Signed out. You are now browsing in open Guest mode.');
  };

  const handleRoleChange = (role: UserRole) => {
    let name = 'Kudzai Ndlovu';
    let company = 'Zambezi Freightlines';
    let city = SADC_CITIES[3]; // Beitbridge / Musina

    if (role === 'shipper') {
      name = 'Johan van der Merwe';
      company = 'Anglo-Southern Exporters';
      city = SADC_CITIES[0]; // Johannesburg
    } else if (role === 'fleet_manager') {
      name = 'Blessing Mupfumira';
      company = 'Trans-Limpopo Fleet Logistics (22 Trucks)';
      city = SADC_CITIES[4]; // Harare
    } else if (role === 'admin') {
      name = 'Tariro Chidzero';
      company = 'SADC Border Regulatory Directorate';
      city = SADC_CITIES[3]; // Beitbridge OSBP
    }

    const updatedProfile: UserProfile = {
      ...currentUser,
      role,
      fullName: name,
      companyName: company,
      currentCoords: { lat: city.lat, lng: city.lng },
      isAnonymous: false,
    };

    StorageService.saveUserProfile(updatedProfile);
    setCurrentUser(updatedProfile);
    showToast(`Switched active persona: ${name} (${role.replace('_', ' ')})`);
  };

  const handleLoadCreated = (load: LoadItem, wasQueued: boolean) => {
    refreshData();
    if (wasQueued) {
      showToast(`Consignment ${load.referenceId || ''} saved locally. Queued for broadcast!`);
    } else {
      showToast(`Consignment ${load.referenceId || ''} broadcast live across SADC corridors!`);
    }
  };

  const handleTruckCreated = (truck: TruckListing, wasQueued: boolean) => {
    refreshData();
    if (wasQueued) {
      showToast(`Truck ${truck.truckReg} saved locally. Queued for broadcast!`);
    } else {
      showToast(`Truck ${truck.truckReg} availability broadcast live across SADC corridors!`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top Utility & Offline Status Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-3 sm:px-6 py-2">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5 text-xs">
          {/* SADC Regional Coverage */}
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 uppercase tracking-wider">
              SADC Network
            </span>
            <span className="text-slate-400 hidden md:inline text-[11px]">
              South Africa · Zimbabwe · Zambia · Botswana · Namibia · Mozambique · Malawi · Tanzania
            </span>
            <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold hidden sm:inline">
              Domestic & Cross-Border
            </span>
          </div>

          {/* Right Tools: PWA Install + Offline Sync Indicator */}
          <div className="flex items-center gap-3">
            <PWAInstallButton />
            <OfflineIndicator />
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-slate-950 font-black shadow-md shadow-amber-500/20">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-white">TRANS-AFRICA</h1>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 font-extrabold uppercase">
                  Logistics
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Southern Africa Cross-Border & Domestic Freight
              </p>
            </div>
          </div>

          {/* Authentication, Persona & Primary Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Guest vs Authenticated Status */}
            {currentUser.isAnonymous ? (
              <div className="flex items-center gap-2">
                <span className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300">
                  <Globe2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Guest Browsing (Read-Only)</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setAuthEncouragement(null);
                    setShowAuthModal(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In / Register</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {/* Authenticated User Pill */}
                <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
                  <User className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <div className="flex flex-col text-left">
                    <span className="font-bold text-white max-w-[130px] truncate leading-tight">
                      {currentUser.fullName}
                    </span>
                    <span className="text-[10px] text-amber-300 uppercase font-black tracking-wide">
                      {currentUser.role.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Admin REBAC Command Center Button */}
                {currentUser.role === 'admin' && (
                  <button
                    type="button"
                    onClick={() => setShowAdminModal(true)}
                    className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/30 transition cursor-pointer"
                    title="Total REBAC Control Over All Transactions"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span className="hidden sm:inline">Admin Control (REBAC)</span>
                    <span className="sm:hidden">Admin</span>
                  </button>
                )}

                {/* Sign Out */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
                  title="Sign out to Guest mode"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Quick Demo Persona Switcher */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <select
                value={currentUser.role}
                onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                className="bg-transparent text-xs font-bold text-slate-200 py-1 pr-1.5 focus:outline-hidden cursor-pointer"
                title="Switch test role persona"
              >
                <option value="trucker" className="bg-slate-900 text-white">
                  Demo: Carrier Rig
                </option>
                <option value="shipper" className="bg-slate-900 text-white">
                  Demo: Cargo Shipper
                </option>
                <option value="fleet_manager" className="bg-slate-900 text-white">
                  Demo: Fleet Manager
                </option>
                <option value="admin" className="bg-slate-900 text-white">
                  Demo: Regulatory Admin (Total Control)
                </option>
              </select>
            </div>

            {/* Emergency SOS Distress Button */}
            <button
              onClick={() => setShowEmergencySOS(true)}
              className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-red-600/30 transition cursor-pointer"
              title="Broadcast Highway Distress SOS Beacon"
            >
              <Siren className="w-4 h-4 animate-pulse" />
              <span className="hidden sm:inline">SOS</span>
            </button>

            {/* Post Action Button */}
            {currentUser.role === 'shipper' ? (
              <button
                onClick={handlePostLoadClick}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Post Consignment</span>
              </button>
            ) : (
              <button
                onClick={handlePostTruckClick}
                className="px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-sky-500/20 transition cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Post Truck</span>
              </button>
            )}

            {/* Turn-by-Turn GPS Active Resume indicator */}
            {navigatingLoad && (
              <button
                onClick={() => setNavigatingLoad(navigatingLoad)}
                className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 animate-pulse cursor-pointer"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>GPS Cockpit</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Dedicated Page Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 space-y-6 pb-24 sm:pb-28">
        {/* Section 1: Corridor and Domestic Board */}
        {currentTab === 'board' && (
          <CorridorBoardSection
            loads={loads}
            trucks={trucks}
            currentUser={currentUser}
            onInspectLoad={(load) => setInspectedLoad(load)}
            onInspectTruck={(truck) => setInspectedTruck(truck)}
            onOpenSOS={() => setShowEmergencySOS(true)}
            onOpenBordersTab={() => setCurrentTab('borders')}
          />
        )}

        {/* Section 2: Consignments */}
        {currentTab === 'consignments' && (
          <ConsignmentsSection
            loads={loads}
            currentUser={currentUser}
            onOpenPostLoadModal={handlePostLoadClick}
            onInspectLoad={(load) => setInspectedLoad(load)}
            onOpenChat={handleInitiateChat}
            onStartNavigation={(load) => setNavigatingLoad(load)}
            onSelectOnMap={(load) => {
              setCurrentTab('board');
              setInspectedLoad(load);
            }}
          />
        )}

        {/* Section 3: Trucks */}
        {currentTab === 'trucks' && (
          <TrucksSection
            trucks={trucks}
            currentUser={currentUser}
            onOpenPostTruckModal={handlePostTruckClick}
            onInspectTruck={(truck) => setInspectedTruck(truck)}
            onSelectOnMap={(truck) => {
              setCurrentTab('board');
              setInspectedTruck(truck);
            }}
          />
        )}

        {/* Section 4: Border Posts & Customs Clearance */}
        {currentTab === 'borders' && <BorderClearancePanel />}
      </main>

      {/* Dedicated Bottom Floating Navigation Bar */}
      <BottomFloatingNav
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        consignmentsCount={loads.length}
        trucksCount={trucks.length}
      />

      {/* Smart Window: Consignment Details & Photos */}
      {inspectedLoad && (
        <ConsignmentSmartWindow
          load={inspectedLoad}
          currentUser={currentUser}
          onClose={() => setInspectedLoad(null)}
          onOpenChat={handleInitiateChat}
          onStartNavigation={(load) => setNavigatingLoad(load)}
          onSelectOnMap={(load) => {
            setCurrentTab('board');
          }}
          onLoadUpdated={refreshData}
        />
      )}

      {/* Smart Window: Truck Details, Photos & KYC Documents */}
      {inspectedTruck && (
        <TruckSmartWindow
          truck={inspectedTruck}
          currentUser={currentUser}
          onClose={() => setInspectedTruck(null)}
          onSelectOnMap={(truck) => {
            setCurrentTab('board');
          }}
          onTruckUpdated={refreshData}
        />
      )}

      {/* Authentication Modal (Google, Phone & Password, Email & Password) */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => {
            setShowAuthModal(false);
            setAuthEncouragement(null);
          }}
          encouragementPrompt={authEncouragement}
          onAuthSuccess={(profile) => {
            profile.isAnonymous = false;
            StorageService.saveUserProfile(profile);
            setCurrentUser(profile);
            setShowAuthModal(false);
            setAuthEncouragement(null);
            showToast(`Welcome back, ${profile.fullName}! Authenticated as ${profile.role.replace('_', ' ')}.`);
          }}
        />
      )}

      {/* Admin REBAC Supervision Modal */}
      {showAdminModal && (
        <AdminSupervisionModal
          isOpen={showAdminModal}
          onClose={() => setShowAdminModal(false)}
          currentUser={currentUser}
          loads={loads}
          trucks={trucks}
          onRefreshData={refreshData}
          onShowToast={showToast}
        />
      )}

      {/* Post Consignment Modal */}
      {showPostLoadModal && (
        <PostLoadModal
          currentUser={currentUser}
          onClose={() => setShowPostLoadModal(false)}
          onLoadCreated={handleLoadCreated}
        />
      )}

      {/* Post Truck Modal */}
      {showPostTruckModal && (
        <PostTruckModal
          currentUser={currentUser}
          onClose={() => setShowPostTruckModal(false)}
          onTruckCreated={handleTruckCreated}
        />
      )}

      {/* Negotiation Chat Modal */}
      {chatLoad && (
        <NegotiationChatModal
          load={chatLoad}
          currentUser={currentUser}
          onClose={() => setChatLoad(null)}
          onLoadStatusUpdated={() => refreshData()}
        />
      )}

      {/* Live Turn-by-Turn GPS Navigation Cockpit */}
      {navigatingLoad && (
        <LiveNavigationCockpit
          load={navigatingLoad}
          currentUser={currentUser}
          onClose={() => setNavigatingLoad(null)}
          onTripCompleted={() => {
            refreshData();
            setRatingTarget({
              id: navigatingLoad.shipperId,
              name: navigatingLoad.shipperName,
              role: 'shipper',
              loadId: navigatingLoad.id,
              loadTitle: navigatingLoad.title,
            });
            setNavigatingLoad(null);
            showToast('Trip completed! Verified trip rating request unlocked.');
          }}
          onOpenSOS={() => setShowEmergencySOS(true)}
        />
      )}

      {/* Highway SOS Emergency Distress Modal */}
      {showEmergencySOS && (
        <EmergencySOSModal
          currentUser={currentUser}
          currentLat={currentUser.currentCoords.lat}
          currentLng={currentUser.currentCoords.lng}
          onClose={() => setShowEmergencySOS(false)}
          onAlertBroadcasted={() => {
            showToast('🚨 Highway Distress Beacon broadcasted! SADC recovery units & nearby truckers alerted.');
          }}
        />
      )}

      {/* Verified Ratings & Review Modal */}
      {ratingTarget && (
        <RatingReviewModal
          currentUser={currentUser}
          targetUserId={ratingTarget.id}
          targetUserName={ratingTarget.name}
          targetUserRole={ratingTarget.role}
          loadId={ratingTarget.loadId}
          loadTitle={ratingTarget.loadTitle}
          onClose={() => setRatingTarget(null)}
          onReviewSubmitted={() => {
            refreshData();
            showToast('Verified rating recorded on corridor ledger.');
          }}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 right-5 z-50 max-w-md p-3.5 rounded-2xl bg-slate-900 border border-amber-500/50 text-white text-xs shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="flex-1">{toastMessage}</p>
        </div>
      )}
    </div>
  );
}
