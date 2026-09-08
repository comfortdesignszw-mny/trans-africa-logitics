/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Compass,
  MapPin,
  ShieldCheck,
  Truck,
  Package,
  Layers,
  Activity,
  ArrowRight,
  Siren,
  Globe2,
  Navigation,
  FileText,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { LoadItem, TruckListing, UserProfile } from '../types';
import { SADCMapView } from './SADCMapView';
import { SADC_BORDER_POSTS } from '../data/sadcData';

interface CorridorBoardSectionProps {
  loads: LoadItem[];
  trucks: TruckListing[];
  currentUser: UserProfile;
  onInspectLoad: (load: LoadItem) => void;
  onInspectTruck: (truck: TruckListing) => void;
  onOpenSOS: () => void;
  onOpenBordersTab: () => void;
}

export const CorridorBoardSection: React.FC<CorridorBoardSectionProps> = ({
  loads,
  trucks,
  currentUser,
  onInspectLoad,
  onInspectTruck,
  onOpenSOS,
  onOpenBordersTab,
}) => {
  const [boardFilter, setBoardFilter] = useState<'all' | 'domestic' | 'cross_border'>('all');
  const [selectedLoad, setSelectedLoad] = useState<LoadItem | undefined>(loads[0]);

  const domesticLoadsCount = loads.filter((l) => l.haulType === 'domestic').length;
  const crossBorderLoadsCount = loads.filter((l) => l.haulType !== 'domestic').length;
  const inTransitCount = loads.filter((l) => l.status === 'in_transit').length;

  const displayLoads = loads.filter((l) => {
    if (boardFilter === 'domestic') return l.haulType === 'domestic';
    if (boardFilter === 'cross_border') return l.haulType !== 'domestic';
    return true;
  });

  return (
    <div className="space-y-6 pb-24">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Corridor and Domestic Board
            </h2>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Live Regional Transit
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time SADC corridor network, domestic intra-country transit circuits, and highway border status
          </p>
        </div>

        {/* Action Toggles & SOS Trigger */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenSOS}
            className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-red-600/30 transition cursor-pointer"
          >
            <Siren className="w-4 h-4 animate-pulse" />
            <span>Highway SOS</span>
          </button>
        </div>
      </div>

      {/* Corridor Key Performance Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 block">Domestic Intra-Country</span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-emerald-400">{domesticLoadsCount}</span>
            <span className="text-[10px] text-emerald-300 font-semibold">Zero Customs</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 block">SADC Cross-Border</span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-sky-400">{crossBorderLoadsCount}</span>
            <span className="text-[10px] text-sky-300 font-semibold">8 Corridors</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 block">Active In-Transit Hauls</span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-amber-400">{inTransitCount}</span>
            <span className="text-[10px] text-slate-400 font-semibold">Live GPS</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 block">Key OSBP Border Posts</span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-purple-400">{SADC_BORDER_POSTS.length}</span>
            <button
              onClick={onOpenBordersTab}
              className="text-[10px] text-purple-300 font-bold hover:underline cursor-pointer"
            >
              Inspect Wait Times →
            </button>
          </div>
        </div>
      </div>

      {/* Main Map View & Corridor Flow */}
      <div className="rounded-3xl border border-slate-800 overflow-hidden shadow-2xl bg-slate-900">
        <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Real-Time Corridor Telemetry & Geographic Waypoints
            </span>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setBoardFilter('all')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                boardFilter === 'all'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Routes
            </button>
            <button
              onClick={() => setBoardFilter('domestic')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                boardFilter === 'domestic'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Domestic Only
            </button>
            <button
              onClick={() => setBoardFilter('cross_border')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                boardFilter === 'cross_border'
                  ? 'bg-sky-500 text-slate-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Cross-Border Corridors
            </button>
          </div>
        </div>

        {/* Map Container */}
        <div className="p-2 sm:p-4">
          <SADCMapView
            loads={displayLoads}
            trucks={trucks}
            selectedLoad={selectedLoad}
            onSelectLoad={(load) => {
              setSelectedLoad(load);
              onInspectLoad(load);
            }}
          />
        </div>
      </div>

      {/* Active Corridors & Domestic Arterials Quick Directory */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Domestic Intra-Country Arterials */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Domestic Arterial Circuits (Zero Customs)
              </h3>
            </div>
            <span className="text-[11px] text-emerald-400 font-bold">No SADC Permits Required</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="font-bold text-white">Zimbabwe (A5 Highway Corridor)</span>
                <p className="text-[11px] text-slate-400">Harare · Kwekwe · Gweru · Bulawayo Grain & Mineral Flow</p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                439 km
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="font-bold text-white">South Africa (N3 Freight Artery)</span>
                <p className="text-[11px] text-slate-400">Johannesburg City Deep · Harrismith · Durban Container Port</p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                568 km
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="font-bold text-white">Zambia (T2 Great North Circuit)</span>
                <p className="text-[11px] text-slate-400">Lusaka Heavy Industrial · Kabwe · Ndola Copperbelt Yard</p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                312 km
              </span>
            </div>
          </div>
        </div>

        {/* SADC Regional Corridors */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-sky-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Cross-Border SADC Strategic Corridors
              </h3>
            </div>
            <span className="text-[11px] text-sky-400 font-bold">COMESA / SADC Rules</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="font-bold text-white">North-South Corridor</span>
                <p className="text-[11px] text-slate-400">Durban · Joburg · Beitbridge · Harare · Chirundu · Lusaka · Lubumbashi</p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-bold">
                2,650 km
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="font-bold text-white">Trans-Kalahari Corridor</span>
                <p className="text-[11px] text-slate-400">Walvis Bay Port · Windhoek · Buitepos/Mamuno · Gaborone · Joburg</p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-bold">
                1,900 km
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="font-bold text-white">Kazungula Quadripoint Corridor</span>
                <p className="text-[11px] text-slate-400">Gaborone · Francistown · Kazungula Bridge OSBP · Livingstone · Lusaka</p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-bold">
                1,120 km
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
