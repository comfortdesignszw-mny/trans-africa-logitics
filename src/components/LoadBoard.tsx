/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Package,
  Truck,
  MapPin,
  Filter,
  Search,
  SlidersHorizontal,
  Compass,
  ArrowRight,
  MessageSquare,
  Clock,
  Sparkles,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Layers,
  Map as MapIcon,
  List,
  Building2,
  Globe2,
  Lock,
  Star,
  Navigation,
  FileCheck2,
  Award,
  AlertTriangle,
} from 'lucide-react';
import {
  CargoType,
  CurrencyCode,
  HaulType,
  LoadItem,
  RouteCorridor,
  SADCCountry,
  TruckListing,
  TruckType,
  UserProfile,
} from '../types';
import { rankLoadsForTrucker, calculateHaversineDistanceKm } from '../services/matchingEngine';

interface LoadBoardProps {
  loads: LoadItem[];
  trucks: TruckListing[];
  currentUser: UserProfile;
  activeViewMode: 'list' | 'map';
  onToggleViewMode: (mode: 'list' | 'map') => void;
  onOpenChat: (load: LoadItem) => void;
  onOpenTracking: (load: LoadItem) => void;
  onSelectLoadOnMap: (load: LoadItem) => void;
  onOpenPostLoadModal: () => void;
  onOpenPostTruckModal: () => void;
  onStartNavigation?: (load: LoadItem) => void;
  onOpenRatingModal?: (targetId: string, targetName: string, role: 'trucker' | 'shipper', loadId?: string, loadTitle?: string) => void;
  onOpenKYC?: () => void;
}

export const LoadBoard: React.FC<LoadBoardProps> = ({
  loads,
  trucks,
  currentUser,
  activeViewMode,
  onToggleViewMode,
  onOpenChat,
  onOpenTracking,
  onSelectLoadOnMap,
  onOpenPostLoadModal,
  onOpenPostTruckModal,
  onStartNavigation,
  onOpenRatingModal,
  onOpenKYC,
}) => {
  // Tabs: Loads vs Trucks
  const [activeTab, setActiveTab] = useState<'loads' | 'trucks'>('loads');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHaulType, setSelectedHaulType] = useState<'all' | 'domestic' | 'cross_border'>('all');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [selectedCorridor, setSelectedCorridor] = useState<string>('all');
  const [selectedCargoType, setSelectedCargoType] = useState<string>('all');
  const [selectedTruckType, setSelectedTruckType] = useState<string>('all');
  const [currencyFilter, setCurrencyFilter] = useState<CurrencyCode | 'all'>('all');
  const [sortBy, setSortBy] = useState<'score' | 'distance' | 'budget' | 'date'>('score');

  // Matching Engine calculations
  const userTruck = useMemo(() => {
    return trucks.find((t) => t.truckerId === currentUser.id) || trucks[0];
  }, [trucks, currentUser.id]);

  const rankedLoads = useMemo(() => {
    return rankLoadsForTrucker(
      loads,
      currentUser.currentCoords.lat,
      currentUser.currentCoords.lng,
      userTruck,
      sortBy
    );
  }, [loads, currentUser.currentCoords, userTruck, sortBy]);

  // Filtered Loads
  const filteredRankedLoads = useMemo(() => {
    return rankedLoads.filter(({ load, proximityKm }) => {
      // Haul Type (Domestic vs Cross-border)
      if (selectedHaulType !== 'all') {
        const itemHaulType = load.haulType || 'cross_border';
        if (itemHaulType !== selectedHaulType) return false;
      }

      // Search
      if (
        searchQuery &&
        !load.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !load.origin.city.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !load.destination.city.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !load.cargoDescription.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !(load.customRouteName && load.customRouteName.toLowerCase().includes(searchQuery.toLowerCase()))
      ) {
        return false;
      }

      // Country
      if (
        selectedCountry !== 'all' &&
        load.origin.country !== selectedCountry &&
        load.destination.country !== selectedCountry
      ) {
        return false;
      }

      // Corridor
      if (selectedCorridor !== 'all' && !load.corridor.includes(selectedCorridor)) {
        return false;
      }

      // Cargo Type
      if (selectedCargoType !== 'all' && load.cargoType !== selectedCargoType) {
        return false;
      }

      // Truck Type
      if (selectedTruckType !== 'all' && load.truckTypeRequired !== selectedTruckType) {
        return false;
      }

      // Currency
      if (currencyFilter !== 'all' && load.currency !== currencyFilter) {
        return false;
      }

      return true;
    });
  }, [
    rankedLoads,
    selectedHaulType,
    searchQuery,
    selectedCountry,
    selectedCorridor,
    selectedCargoType,
    selectedTruckType,
    currencyFilter,
  ]);

  // Filtered Trucks
  const filteredTrucks = useMemo(() => {
    return trucks.filter((truck) => {
      // Haul Type match
      if (selectedHaulType === 'domestic' && truck.haulScope === 'cross_border') return false;
      if (selectedHaulType === 'cross_border' && truck.haulScope === 'domestic') return false;

      if (
        searchQuery &&
        !truck.companyName.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !truck.truckReg.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !truck.currentLocation.city.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !(truck.customTruckTypeName && truck.customTruckTypeName.toLowerCase().includes(searchQuery.toLowerCase()))
      ) {
        return false;
      }

      if (selectedCountry !== 'all' && truck.currentLocation.country !== selectedCountry) {
        return false;
      }

      if (selectedTruckType !== 'all' && truck.truckType !== selectedTruckType) {
        return false;
      }

      return true;
    });
  }, [trucks, selectedHaulType, searchQuery, selectedCountry, selectedTruckType]);

  const handleBidClick = (load: LoadItem) => {
    if (load.mandatoryKycRequired && currentUser.kycStatus !== 'verified') {
      const confirmKyc = window.confirm(
        '⚠️ Mandatory KYC Required for this consignment.\n\nThe cargo owner requires a verified transporter (Silver/Gold KYC badge) to bid on this load. Would you like to view KYC verification now?'
      );
      if (confirmKyc && onOpenKYC) {
        onOpenKYC();
      }
      return;
    }
    onOpenChat(load);
  };

  return (
    <div className="space-y-5">
      {/* Top Filter & Control Panel */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        {/* Row 1: Segment selector (Loads vs Trucks) + View mode */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('loads')}
              className={`px-4 py-2 rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-2 ${
                activeTab === 'loads'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Available Freight Consignments ({filteredRankedLoads.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('trucks')}
              className={`px-4 py-2 rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-2 ${
                activeTab === 'trucks'
                  ? 'bg-sky-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>Available Carrier Trucks ({filteredTrucks.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleViewMode('list')}
              className={`p-2 rounded-xl border transition cursor-pointer ${
                activeViewMode === 'list'
                  ? 'bg-slate-800 border-slate-700 text-amber-400'
                  : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>

            <button
              onClick={() => onToggleViewMode('map')}
              className={`p-2 rounded-xl border transition cursor-pointer ${
                activeViewMode === 'map'
                  ? 'bg-slate-800 border-slate-700 text-amber-400'
                  : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
              title="Corridor Map View"
            >
              <MapIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Row 2: HAULAGE CLASSIFICATION SWITCHER (Domestic vs Cross-border) */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
          <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-amber-400" /> Haulage Type:
          </span>

          <button
            onClick={() => setSelectedHaulType('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedHaulType === 'all'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-white bg-slate-950/60'
            }`}
          >
            All Haulage
          </button>

          <button
            onClick={() => setSelectedHaulType('domestic')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border ${
              selectedHaulType === 'domestic'
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/60 shadow-sm'
                : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:border-emerald-500/40 hover:text-emerald-300'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Local Domestic (Zero Customs / Single Country)</span>
          </button>

          <button
            onClick={() => setSelectedHaulType('cross_border')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border ${
              selectedHaulType === 'cross_border'
                ? 'bg-amber-950/80 text-amber-300 border-amber-500/60 shadow-sm'
                : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:border-amber-500/40 hover:text-amber-300'
            }`}
          >
            <Globe2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Cross-Border SADC Corridors (Customs Transit)</span>
          </button>
        </div>

        {/* Filters Row 3 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 pt-2 border-t border-slate-800 text-xs">
          {/* Search Input */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search towns, custom routes, copper, agricultural grain..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-hidden focus:border-amber-500"
            />
          </div>

          {/* SADC Country Filter */}
          <div>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white capitalize"
            >
              <option value="all">All SADC Countries</option>
              <option value="South Africa">South Africa</option>
              <option value="Zimbabwe">Zimbabwe</option>
              <option value="Zambia">Zambia</option>
              <option value="Botswana">Botswana</option>
              <option value="Namibia">Namibia</option>
              <option value="Mozambique">Mozambique</option>
              <option value="Malawi">Malawi</option>
              <option value="Tanzania">Tanzania</option>
            </select>
          </div>

          {/* Truck Type Filter */}
          <div>
            <select
              value={selectedTruckType}
              onChange={(e) => setSelectedTruckType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white capitalize"
            >
              <option value="all">All Truck Types</option>
              <option value="flatbed">Flatbed (Tri-Axle / Superlink)</option>
              <option value="tautliner">Tautliner (Curtainsider)</option>
              <option value="refrigerated">Refrigerated (Reefer)</option>
              <option value="tanker">Bulk Liquid Tanker</option>
              <option value="container_skeletal">Container Skeletal</option>
              <option value="side_tipper">Side Tipper (Bulk Ore)</option>
              <option value="lowbed">Lowbed (Abnormal)</option>
              <option value="custom">Custom Rig / Dropside</option>
            </select>
          </div>

          {/* Sorting Mechanic */}
          {activeTab === 'loads' && (
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-amber-500/50 text-amber-300 font-bold"
              >
                <option value="score">Sort: Best GPS Match %</option>
                <option value="distance">Sort: Closest to Me (km)</option>
                <option value="budget">Sort: Highest Budget Offer</option>
                <option value="date">Sort: Soonest Pickup Date</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* LOADS TAB CONTENT */}
      {activeTab === 'loads' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>
              Showing <strong className="text-white">{filteredRankedLoads.length}</strong> active freight consignments
            </span>
            <span className="flex items-center gap-1.5 text-amber-400 font-medium">
              <Compass className="w-3.5 h-3.5" />
              GPS Proximity calculated from your current staging position
            </span>
          </div>

          {filteredRankedLoads.length === 0 ? (
            <div className="p-12 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-3">
              <Package className="w-10 h-10 text-slate-600 mx-auto" />
              <h4 className="text-base font-bold text-white">No loads match your current filter criteria</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Try toggling between &quot;Local Domestic&quot; or &quot;Cross-Border SADC&quot; or clearing your search query.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRankedLoads.map(({ load, proximityKm, overallScore, badge }) => {
                const isDomestic = load.haulType === 'domestic';

                return (
                  <div
                    key={load.id}
                    className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition shadow-xl space-y-4 group relative"
                  >
                    {/* Match Score, Domestic/Cross-Border Badge, and Escrow */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Haul Classification Badge */}
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 ${
                            isDomestic
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/60'
                              : 'bg-amber-950/80 text-amber-300 border border-amber-600/60'
                          }`}
                        >
                          {isDomestic ? (
                            <>
                              <Building2 className="w-3 h-3 text-emerald-400" />
                              Local Domestic Haul
                            </>
                          ) : (
                            <>
                              <Globe2 className="w-3 h-3 text-amber-400" />
                              SADC Cross-Border
                            </>
                          )}
                        </span>

                        {/* Match Score */}
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-semibold flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          {overallScore}% Match
                        </span>

                        {/* Mandatory KYC Badge */}
                        {load.mandatoryKycRequired && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-extrabold flex items-center gap-1">
                            <Lock className="w-3 h-3 text-amber-400" />
                            KYC Required
                          </span>
                        )}

                        {/* Guaranteed Escrow */}
                        {load.escrowGuaranteed && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-extrabold flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            Guaranteed Escrow
                          </span>
                        )}
                      </div>

                      <div className="text-right">
                        <span className="text-sm sm:text-base font-extrabold text-amber-400">
                          {load.currency} {load.budget.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-400 block">Lump Sum Freight</span>
                      </div>
                    </div>

                    {/* Title & Route Display */}
                    <div>
                      <h4 className="text-base font-bold text-white group-hover:text-amber-400 transition">
                        {load.title}
                      </h4>

                      {/* Origin -> Destination Banner */}
                      <div className="flex items-center gap-2 mt-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs">
                        <div className="flex-1">
                          <span className="text-[10px] text-slate-400 block font-semibold">PICKUP</span>
                          <p className="font-bold text-slate-200">
                            {load.origin.city}, {load.origin.country}
                          </p>
                          {load.origin.landmark && (
                            <span className="text-[10px] text-slate-500 block">({load.origin.landmark})</span>
                          )}
                        </div>

                        <div className="flex flex-col items-center justify-center px-1">
                          <ArrowRight className="w-4 h-4 text-amber-400" />
                          <span className="text-[9px] text-slate-400 font-mono">
                            {calculateHaversineDistanceKm(
                              load.origin.lat,
                              load.origin.lng,
                              load.destination.lat,
                              load.destination.lng
                            )}{' '}
                            km
                          </span>
                        </div>

                        <div className="flex-1 text-right">
                          <span className="text-[10px] text-slate-400 block font-semibold">DROP-OFF</span>
                          <p className="font-bold text-slate-200">
                            {load.destination.city}, {load.destination.country}
                          </p>
                          {load.destination.landmark && (
                            <span className="text-[10px] text-slate-500 block">({load.destination.landmark})</span>
                          )}
                        </div>
                      </div>

                      {/* Custom Route or Domestic Note */}
                      {(load.customRouteName || isDomestic) && (
                        <div className="mt-1 text-[11px] text-slate-400 flex items-center gap-1.5 px-1">
                          <FileCheck2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          <span>
                            {load.customRouteName
                              ? `Route: ${load.customRouteName}`
                              : 'Intra-country domestic route. Zero border delays / customs clearance bypassed.'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Specifications Grid */}
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                        <span className="text-slate-400 block text-[10px]">WEIGHT</span>
                        <span className="font-bold text-white">{load.weightTons} Tons</span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                        <span className="text-slate-400 block text-[10px]">TRUCK NEEDED</span>
                        <span className="font-bold text-white capitalize truncate block">
                          {load.truckTypeRequired === 'custom'
                            ? load.customTruckTypeName || 'Custom Rig'
                            : load.truckTypeRequired}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                        <span className="text-slate-400 block text-[10px]">PICKUP DATE</span>
                        <span className="font-bold text-amber-300">{load.pickupDate}</span>
                      </div>
                    </div>

                    {/* Proximity & Shipper Ratings */}
                    <div className="flex items-center justify-between text-xs text-slate-300">
                      <p className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        <span>Pickup: {proximityKm} km away</span>
                      </p>

                      <div className="flex items-center gap-1 text-amber-400 font-bold text-[11px]">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span>{load.shipperRating || 4.9} (Shipper Rating)</span>
                      </div>
                    </div>

                    {/* Shipper Verified Badge & Action Buttons */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <span className="truncate max-w-[130px] font-medium text-slate-300">
                          {load.shipperCompany}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* GPS Navigation Cockpit Button */}
                        {onStartNavigation && (
                          <button
                            onClick={() => onStartNavigation(load)}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-700/30 hover:bg-emerald-700/50 text-emerald-300 border border-emerald-500/40 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                            title="Open Turn-by-Turn GPS Navigation Cockpit"
                          >
                            <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Navigate</span>
                          </button>
                        )}

                        {/* Map View */}
                        <button
                          onClick={() => onSelectLoadOnMap(load)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                          title="View route on SADC corridor map"
                        >
                          <MapIcon className="w-3.5 h-3.5 text-amber-400" />
                          <span className="hidden sm:inline">Map</span>
                        </button>

                        {/* Rate Shipper */}
                        {onOpenRatingModal && (
                          <button
                            onClick={() =>
                              onOpenRatingModal(
                                load.shipperId,
                                load.shipperName,
                                'shipper',
                                load.id,
                                load.title
                              )
                            }
                            className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold transition cursor-pointer"
                            title="Rate & Review Shipper"
                          >
                            ⭐
                          </button>
                        )}

                        {load.status !== 'open' ? (
                          <button
                            onClick={() => onOpenTracking(load)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/30 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>Track</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleBidClick(load)}
                            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition shadow-xs cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Bid & Chat</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TRUCKS TAB CONTENT */}
      {activeTab === 'trucks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>
              Showing <strong className="text-white">{filteredTrucks.length}</strong> available carrier units
            </span>
            <span className="text-sky-400 font-medium">Ready for immediate local or cross-border haulage</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTrucks.map((truck) => {
              const distFromUser = calculateHaversineDistanceKm(
                currentUser.currentCoords.lat,
                currentUser.currentCoords.lng,
                truck.currentLocation.lat,
                truck.currentLocation.lng
              );

              return (
                <div
                  key={truck.id}
                  className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition shadow-xl space-y-4"
                >
                  {/* Top info */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full bg-sky-950/80 border border-sky-600/60 text-sky-300 font-bold text-xs flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5" />
                        {truck.truckType === 'custom'
                          ? truck.customTruckTypeName || 'CUSTOM RIG'
                          : truck.truckType.toUpperCase()}
                      </span>

                      {/* Scope Badge */}
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          truck.haulScope === 'domestic'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                            : truck.haulScope === 'cross_border'
                            ? 'bg-amber-950 text-amber-300 border border-amber-700'
                            : 'bg-sky-950 text-sky-300 border border-sky-700'
                        }`}
                      >
                        {truck.haulScope === 'domestic'
                          ? '🇿🇼 Local Only'
                          : truck.haulScope === 'cross_border'
                          ? '🌍 Cross-Border'
                          : 'Domestic & Regional'}
                      </span>

                      <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-600/60 text-emerald-300 text-[11px] font-semibold flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> {truck.kycBadgeLevel}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-extrabold text-white font-mono">{truck.truckReg}</span>
                      <span className="text-[10px] text-amber-400 block font-semibold flex items-center gap-1 justify-end">
                        <Star className="w-3 h-3 fill-amber-400" /> ★ {truck.rating} ({truck.ratingsCount || truck.completedTrips} trips)
                      </span>
                    </div>
                  </div>

                  {/* Company & Driver */}
                  <div>
                    <h4 className="text-base font-bold text-white">{truck.companyName}</h4>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Driver: {truck.truckerName} · {truck.truckerPhone}
                    </p>
                  </div>

                  {/* Location & Radius */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Current Depot / Staging:</span>
                      <span className="font-bold text-slate-200">
                        {truck.currentLocation.city}, {truck.currentLocation.country}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Proximity to you:</span>
                      <span className="text-emerald-400 font-bold">{distFromUser} km</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Preferred Operating Corridor / Route:</span>
                      <span className="text-amber-300 text-[11px] truncate max-w-[200px]">
                        {truck.customRoutePreference || truck.preferredCorridor.split('(')[0]}
                      </span>
                    </div>
                  </div>

                  {/* Specs row */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">PAYLOAD</span>
                      <span className="font-bold text-white">{truck.capacityTons} Tons</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">GIT COVER</span>
                      <span className="font-bold text-emerald-400">
                        ${(truck.gitInsuranceCoverageUsd / 1000).toFixed(0)}k USD
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">AVAILABLE</span>
                      <span className="font-bold text-sky-300">{truck.availableDate}</span>
                    </div>
                  </div>

                  {/* Footer Action */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">
                        Est. Rate: <strong className="text-white">${truck.rateQuoteUsdPerKm}/km</strong>
                      </span>
                      {onOpenRatingModal && (
                        <button
                          onClick={() =>
                            onOpenRatingModal(
                              truck.truckerId,
                              truck.truckerName,
                              'trucker'
                            )
                          }
                          className="text-[11px] text-amber-400 hover:underline font-bold"
                        >
                          Review Driver
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        const matchingLoad = loads.find((l) => l.status === 'open');
                        if (matchingLoad) onOpenChat(matchingLoad);
                      }}
                      className="px-4 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition cursor-pointer"
                    >
                      Book & Contact Transporter
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
