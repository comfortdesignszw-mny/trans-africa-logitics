/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Package,
  Search,
  Plus,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Layers,
  Building2,
  Navigation,
  MessageSquare,
  PackageSearch,
  FilterX,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { CargoType, CurrencyCode, HaulType, LoadItem, SADCCountry, UserProfile } from '../types';

interface ConsignmentsSectionProps {
  loads: LoadItem[];
  currentUser: UserProfile;
  onOpenPostLoadModal: () => void;
  onInspectLoad: (load: LoadItem) => void;
  onOpenChat: (load: LoadItem) => void;
  onStartNavigation?: (load: LoadItem) => void;
  onSelectOnMap?: (load: LoadItem) => void;
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

export const ConsignmentsSection: React.FC<ConsignmentsSectionProps> = ({
  loads,
  currentUser,
  onOpenPostLoadModal,
  onInspectLoad,
  onOpenChat,
  onStartNavigation,
  onSelectOnMap,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHaulType, setSelectedHaulType] = useState<'all' | 'domestic' | 'cross_border'>('all');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [selectedCargoType, setSelectedCargoType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'budget' | 'weight'>('newest');

  const filteredLoads = useMemo(() => {
    return loads.filter((load) => {
      // Haul Type
      if (selectedHaulType !== 'all') {
        const hType = load.haulType || 'cross_border';
        if (hType !== selectedHaulType) return false;
      }

      // Country filter
      if (selectedCountry !== 'all') {
        if (load.origin.country !== selectedCountry && load.destination.country !== selectedCountry) {
          return false;
        }
      }

      // Cargo type filter
      if (selectedCargoType !== 'all' && load.cargoType !== selectedCargoType) {
        return false;
      }

      // Search query (matches title, origin, destination, ref ID, shipper)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const refId = (load.referenceId || `REF-CN-${load.id}`).toLowerCase();
        const matchTitle = load.title.toLowerCase().includes(query);
        const matchOrigin = load.origin.city.toLowerCase().includes(query) || load.origin.country.toLowerCase().includes(query);
        const matchDest = load.destination.city.toLowerCase().includes(query) || load.destination.country.toLowerCase().includes(query);
        const matchRef = refId.includes(query);
        const matchShipper = load.shipperCompany.toLowerCase().includes(query) || load.shipperName.toLowerCase().includes(query);
        if (!matchTitle && !matchOrigin && !matchDest && !matchRef && !matchShipper) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'budget') {
        return b.budget - a.budget;
      }
      if (sortBy === 'weight') {
        return b.weightTons - a.weightTons;
      }
      return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
    });
  }, [loads, selectedHaulType, selectedCountry, selectedCargoType, searchQuery, sortBy]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedHaulType('all');
    setSelectedCountry('all');
    setSelectedCargoType('all');
    setSortBy('newest');
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">Consignments</h2>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {filteredLoads.length} {filteredLoads.length === 1 ? 'haul' : 'hauls'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Verified freight consignments across SADC corridors and single-country domestic haulage
          </p>
        </div>

        <button
          onClick={onOpenPostLoadModal}
          className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Post New Consignment</span>
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
              placeholder="Search by Ref ID (#REF-CN-001), city, cargo, or shipper..."
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

          {/* Haul Type Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 shrink-0 w-full md:w-auto overflow-x-auto">
            <button
              onClick={() => setSelectedHaulType('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                selectedHaulType === 'all'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Freight
            </button>
            <button
              onClick={() => setSelectedHaulType('domestic')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                selectedHaulType === 'domestic'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Domestic (Zero Customs)
            </button>
            <button
              onClick={() => setSelectedHaulType('cross_border')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                selectedHaulType === 'cross_border'
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
            <span className="text-slate-400 text-[11px]">Country:</span>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-hidden cursor-pointer"
            >
              <option value="all">All SADC Countries</option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px]">Cargo:</span>
            <select
              value={selectedCargoType}
              onChange={(e) => setSelectedCargoType(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-hidden cursor-pointer capitalize"
            >
              <option value="all">All Cargo Categories</option>
              <option value="mining_minerals">Mining & Minerals</option>
              <option value="agricultural_produce">Agricultural Produce</option>
              <option value="fmcg_retail">FMCG Retail & Foods</option>
              <option value="machinery_equipment">Machinery & Equipment</option>
              <option value="fuel_chemicals">Fuel & Chemicals</option>
              <option value="timber_construction">Timber & Construction</option>
              <option value="general_breakbulk">General Breakbulk</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-slate-400 text-[11px]">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-hidden cursor-pointer"
            >
              <option value="newest">Latest Posted</option>
              <option value="budget">Highest Budget</option>
              <option value="weight">Heaviest Payload</option>
            </select>
          </div>
        </div>
      </div>

      {/* Consignments List */}
      {filteredLoads.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredLoads.map((load) => {
            const refId = load.referenceId || `REF-CN-${load.id.replace(/[^0-9]/g, '').slice(-4) || '8841'}`;
            const primaryPhoto = load.cargoPhotos && load.cargoPhotos[0]
              ? load.cargoPhotos[0]
              : 'https://images.unsplash.com/photo-1586528116493-a029325540fa?auto=format&fit=crop&w=800&q=80';

            return (
              <div
                key={load.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl p-5 space-y-4 transition flex flex-col justify-between group shadow-lg"
              >
                {/* Top Identifiers Row */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                      {refId}
                    </span>
                    {load.haulType === 'domestic' ? (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Domestic Haul
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                        SADC Cross-Border
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-950 text-slate-300 uppercase border border-slate-800">
                    {load.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Main Card Content */}
                <div className="flex gap-3.5 items-start">
                  {/* Cargo Photo Thumbnail */}
                  <div
                    onClick={() => onInspectLoad(load)}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shrink-0 relative cursor-pointer group-hover:border-amber-500/50 transition"
                  >
                    <img
                      src={primaryPhoto}
                      alt={load.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      referrerPolicy="no-referrer"
                    />
                    {load.cargoPhotos && load.cargoPhotos.length > 1 && (
                      <span className="absolute bottom-1 right-1 bg-slate-950/80 text-slate-200 text-[9px] font-bold px-1 rounded">
                        +{load.cargoPhotos.length}
                      </span>
                    )}
                  </div>

                  {/* Title & Route Summary */}
                  <div className="min-w-0 flex-1">
                    <h3
                      onClick={() => onInspectLoad(load)}
                      className="text-sm sm:text-base font-black text-white hover:text-amber-400 transition cursor-pointer line-clamp-1"
                    >
                      {load.title}
                    </h3>

                    {/* Route Depots */}
                    <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-300 flex-wrap">
                      <span className="font-semibold text-white">{load.origin.city}</span>
                      <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />
                      <span className="font-semibold text-white">{load.destination.city}</span>
                    </div>

                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                      {load.cargoDescription}
                    </p>
                  </div>
                </div>

                {/* Specs Pill Grid */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/70 text-xs">
                  <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block">Payload</span>
                    <span className="font-bold text-white text-xs">{load.weightTons} Tons</span>
                  </div>
                  <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block">Trailer</span>
                    <span className="font-bold text-amber-400 text-xs capitalize truncate block">
                      {load.customTruckTypeName || load.truckTypeRequired}
                    </span>
                  </div>
                  <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block">Rate Budget</span>
                    <span className="font-bold text-emerald-400 text-xs truncate block">
                      {load.currency} {load.budget.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Footer Shipper info & Actions */}
                <div className="pt-2 border-t border-slate-800/70 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 text-xs">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-slate-300 font-medium truncate max-w-[140px] sm:max-w-[180px]">
                      {load.shipperCompany || load.shipperName}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onInspectLoad(load)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                    >
                      <span>Inspect</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onOpenChat(load)}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-sm"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Bid</span>
                    </button>
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
            <PackageSearch className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-black text-white">No Consignments Found</h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
              There are currently no active freight consignments matching your search or filters. You can clear your filters or post a new consignment to start connecting with transporters.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={onOpenPostLoadModal}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Post New Consignment</span>
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
