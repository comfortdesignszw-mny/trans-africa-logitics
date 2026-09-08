/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Truck,
  Search,
  Plus,
  MapPin,
  ShieldCheck,
  Phone,
  Building2,
  Calendar,
  Layers,
  ChevronRight,
  FilterX,
  FileCheck,
} from 'lucide-react';
import { SADCCountry, TruckListing, TruckType, UserProfile } from '../types';

interface TrucksSectionProps {
  trucks: TruckListing[];
  currentUser: UserProfile;
  onOpenPostTruckModal: () => void;
  onInspectTruck: (truck: TruckListing) => void;
  onSelectOnMap?: (truck: TruckListing) => void;
}

const COUNTRIES: SADCCountry[] = [
  'South Africa',
  'Zimbabwe',
  'Zambia',
  'Botswana',
  'Namibia',
  'Mozambique',
  'Malawi',
  'Tanzania',
  'DR Congo',
];

export const TrucksSection: React.FC<TrucksSectionProps> = ({
  trucks,
  currentUser,
  onOpenPostTruckModal,
  onInspectTruck,
  onSelectOnMap,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHaulScope, setSelectedHaulScope] = useState<'all' | 'domestic' | 'cross_border'>('all');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [selectedTruckType, setSelectedTruckType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'capacity' | 'rate'>('date');

  const filteredTrucks = useMemo(() => {
    return trucks.filter((truck) => {
      // Haul scope filter
      if (selectedHaulScope !== 'all') {
        const scope = truck.haulScope || 'all';
        if (scope !== 'all' && scope !== selectedHaulScope) {
          return false;
        }
      }

      // Country filter
      if (selectedCountry !== 'all' && truck.currentLocation.country !== selectedCountry) {
        return false;
      }

      // Truck trailer type
      if (selectedTruckType !== 'all' && truck.truckType !== selectedTruckType) {
        return false;
      }

      // Search query (matches asset ID, plate, driver, company, city)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const assetId = (truck.referenceId || `ASSET-TRK-${truck.id}`).toLowerCase();
        const matchPlate = truck.truckReg.toLowerCase().includes(query) || (truck.trailerReg || '').toLowerCase().includes(query);
        const matchDriver = truck.truckerName.toLowerCase().includes(query) || truck.companyName.toLowerCase().includes(query);
        const matchCity = truck.currentLocation.city.toLowerCase().includes(query) || truck.currentLocation.country.toLowerCase().includes(query);
        const matchAsset = assetId.includes(query);
        if (!matchPlate && !matchDriver && !matchCity && !matchAsset) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'capacity') {
        return b.capacityTons - a.capacityTons;
      }
      if (sortBy === 'rate') {
        return (a.rateQuoteUsdPerKm || 0) - (b.rateQuoteUsdPerKm || 0);
      }
      return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
    });
  }, [trucks, selectedHaulScope, selectedCountry, selectedTruckType, searchQuery, sortBy]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedHaulScope('all');
    setSelectedCountry('all');
    setSelectedTruckType('all');
    setSortBy('date');
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">Trucks & Fleet</h2>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {filteredTrucks.length} {filteredTrucks.length === 1 ? 'unit' : 'units'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Verified carriers, rigs, and owner-operators available for corridor and domestic transport
          </p>
        </div>

        <button
          onClick={onOpenPostTruckModal}
          className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Register Carrier Truck</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Asset ID (#ASSET-TRK-101), plate, driver, or depot city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9.5 pr-4 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-hidden focus:border-amber-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Haul Scope Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 shrink-0 w-full md:w-auto overflow-x-auto">
            <button
              onClick={() => setSelectedHaulScope('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                selectedHaulScope === 'all'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Fleets
            </button>
            <button
              onClick={() => setSelectedHaulScope('domestic')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                selectedHaulScope === 'domestic'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Domestic Only
            </button>
            <button
              onClick={() => setSelectedHaulScope('cross_border')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                selectedHaulScope === 'cross_border'
                  ? 'bg-sky-500 text-slate-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Cross-Border SADC
            </button>
          </div>
        </div>

        {/* Secondary Filters */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px]">Staging Country:</span>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-hidden cursor-pointer"
            >
              <option value="all">All Countries</option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px]">Trailer Type:</span>
            <select
              value={selectedTruckType}
              onChange={(e) => setSelectedTruckType(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-hidden cursor-pointer capitalize"
            >
              <option value="all">All Trailer Types</option>
              <option value="flatbed">Flatbed / Superlink</option>
              <option value="tautliner">Tautliner Curtainsider</option>
              <option value="refrigerated">Reefer Cold Chain</option>
              <option value="tanker">Liquid Tanker (Hazchem / Fuel)</option>
              <option value="side_tipper">Side Tipper (Bulk Mining)</option>
              <option value="container_skeletal">Container Skeletal</option>
              <option value="lowbed">Heavy Haul Lowbed</option>
              <option value="custom">Custom Rig</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-slate-400 text-[11px]">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-hidden cursor-pointer"
            >
              <option value="date">Latest Available</option>
              <option value="capacity">Highest Payload (Tons)</option>
              <option value="rate">Lowest Rate ($/km)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Trucks List */}
      {filteredTrucks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTrucks.map((truck) => {
            const assetRef = truck.referenceId || `ASSET-TRK-${truck.id.replace(/[^0-9]/g, '').slice(-3) || '101'}`;
            const primaryPhoto = truck.truckPhotos && truck.truckPhotos[0]
              ? truck.truckPhotos[0]
              : 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=800&q=80';

            return (
              <div
                key={truck.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl p-5 space-y-4 transition flex flex-col justify-between group shadow-lg"
              >
                {/* Top Identifiers Row */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                      {assetRef}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-200 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                      {truck.truckReg}
                    </span>
                  </div>

                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    {truck.kycBadgeLevel || 'Verified Carrier'}
                  </span>
                </div>

                {/* Main Card Content */}
                <div className="flex gap-3.5 items-start">
                  {/* Truck Photo Thumbnail */}
                  <div
                    onClick={() => onInspectTruck(truck)}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shrink-0 relative cursor-pointer group-hover:border-amber-500/50 transition"
                  >
                    <img
                      src={primaryPhoto}
                      alt={truck.truckReg}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      referrerPolicy="no-referrer"
                    />
                    {truck.truckPhotos && truck.truckPhotos.length > 1 && (
                      <span className="absolute bottom-1 right-1 bg-slate-950/80 text-slate-200 text-[9px] font-bold px-1 rounded">
                        +{truck.truckPhotos.length}
                      </span>
                    )}
                  </div>

                  {/* Carrier & Rig Summary */}
                  <div className="min-w-0 flex-1">
                    <h3
                      onClick={() => onInspectTruck(truck)}
                      className="text-sm sm:text-base font-black text-white hover:text-amber-400 transition cursor-pointer line-clamp-1"
                    >
                      {truck.companyName || `${truck.truckerName} Freight`}
                    </h3>

                    {/* Staging Depot */}
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-300">
                      <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="font-semibold text-white truncate">
                        {truck.currentLocation.city}, {truck.currentLocation.country}
                      </span>
                    </div>

                    <div className="mt-1 text-[11px] text-slate-400 truncate">
                      Preferred: {truck.customRoutePreference || truck.preferredCorridor}
                    </div>
                  </div>
                </div>

                {/* Specs Pill Grid */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/70 text-xs">
                  <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block">Payload</span>
                    <span className="font-bold text-white text-xs">{truck.capacityTons} Tons</span>
                  </div>
                  <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block">Trailer Spec</span>
                    <span className="font-bold text-amber-400 text-xs capitalize truncate block">
                      {truck.customTruckTypeName || truck.truckType}
                    </span>
                  </div>
                  <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block">GIT Insurance</span>
                    <span className="font-bold text-emerald-400 text-xs truncate block">
                      ${(truck.gitInsuranceCoverageUsd || 100000) / 1000}k USD
                    </span>
                  </div>
                </div>

                {/* Footer Driver info & Actions */}
                <div className="pt-2 border-t border-slate-800/70 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 text-xs text-slate-300">
                    <span className="font-medium truncate">{truck.truckerName}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400">Available: {truck.availableDate}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onInspectTruck(truck)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                    >
                      <span>Smart Window</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    <a
                      href={`tel:${truck.truckerPhone}`}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-sm"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call</span>
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Enhanced Empty State */
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-900/60 border border-slate-800 text-center max-w-xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto">
            <Truck className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-black text-white">No Carrier Trucks Available</h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
              No carrier trucks currently match your staging country or trailer specifications. Broaden your search criteria or register your carrier rig to start receiving haul bookings.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={onOpenPostTruckModal}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Register Carrier Truck</span>
            </button>

            <button
              onClick={handleResetFilters}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition cursor-pointer"
            >
              <span>Reset All Filters</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
