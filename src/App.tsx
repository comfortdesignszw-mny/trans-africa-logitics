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
} from 'lucide-react';
import {
  LoadItem,
  TruckListing,
  UserProfile,
  UserRole,
} from './types';
import { StorageService } from './services/storage';
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

    const handleSyncComplete = () => {
      refreshData();
      showToast('Corridor Outbox Synced: Local loads, trucks & bids pushed to network.');
    };

    window.addEventListener('transafrica-sync-complete', handleSyncComplete);
    return () => {
      window.removeEventListener('transafrica-sync-complete', handleSyncComplete);
    };
  }, []);

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
      currentLocation: `${city.city}, ${city.country}`,
      currentCoords: { lat: city.lat, lng: city.lng },
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

          {/* Persona Switcher & Primary Action */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Persona Selector */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <User className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
              <select
                value={currentUser.role}
                onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                className="bg-transparent text-xs font-bold text-slate-200 py-1 pr-2 focus:outline-hidden cursor-pointer"
                title="Switch active user role persona"
              >
                <option value="trucker" className="bg-slate-900 text-white">
                  Role: Trucker / Transporter
                </option>
                <option value="shipper" className="bg-slate-900 text-white">
                  Role: Shipper / Cargo Owner
                </option>
                <option value="fleet_manager" className="bg-slate-900 text-white">
                  Role: Fleet Manager
                </option>
                <option value="admin" className="bg-slate-900 text-white">
                  Role: Border Regulatory Admin
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
              <span className="hidden sm:inline">Highway SOS</span>
            </button>

            {/* Quick Action Button Based on Role */}
            {currentUser.role === 'shipper' ? (
              <button
                onClick={() => setShowPostLoadModal(true)}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Post Consignment</span>
              </button>
            ) : (
              <button
                onClick={() => setShowPostTruckModal(true)}
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
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 space-y-6">
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
            onOpenPostLoadModal={() => setShowPostLoadModal(true)}
            onInspectLoad={(load) => setInspectedLoad(load)}
            onOpenChat={(load) => setChatLoad(load)}
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
            onOpenPostTruckModal={() => setShowPostTruckModal(true)}
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
          onOpenChat={(load) => setChatLoad(load)}
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
