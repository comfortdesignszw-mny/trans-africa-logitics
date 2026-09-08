/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Package, Truck, Compass, ShieldCheck } from 'lucide-react';

export type MainNavTab = 'board' | 'consignments' | 'trucks' | 'borders';

interface BottomFloatingNavProps {
  currentTab: MainNavTab;
  onSelectTab: (tab: MainNavTab) => void;
  consignmentsCount?: number;
  trucksCount?: number;
}

export const BottomFloatingNav: React.FC<BottomFloatingNavProps> = ({
  currentTab,
  onSelectTab,
  consignmentsCount,
  trucksCount,
}) => {
  return (
    <aside aria-label="Quick Navigation" className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-[94vw] sm:max-w-none">
      <nav 
        aria-label="Corridor Transport Navigation"
        className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-full shadow-2xl shadow-black/80 px-2 py-1.5 flex items-center gap-1 sm:gap-1.5"
      >
        {/* Corridor and Domestic Board */}
        <button
          id="nav-corridor-board"
          onClick={() => onSelectTab('board')}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
            currentTab === 'board'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
          }`}
        >
          <Compass className="w-4 h-4 shrink-0" />
          <span className="whitespace-nowrap">Corridor and Domestic Board</span>
        </button>

        {/* Consignments */}
        <button
          id="nav-consignments"
          onClick={() => onSelectTab('consignments')}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer relative ${
            currentTab === 'consignments'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
          }`}
        >
          <Package className="w-4 h-4 shrink-0" />
          <span className="whitespace-nowrap">Consignments</span>
          {typeof consignmentsCount === 'number' && (
            <span
              className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                currentTab === 'consignments'
                  ? 'bg-slate-950/20 text-slate-950'
                  : 'bg-slate-800 text-slate-300 border border-slate-700'
              }`}
            >
              {consignmentsCount}
            </span>
          )}
        </button>

        {/* Trucks */}
        <button
          id="nav-trucks"
          onClick={() => onSelectTab('trucks')}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer relative ${
            currentTab === 'trucks'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
          }`}
        >
          <Truck className="w-4 h-4 shrink-0" />
          <span className="whitespace-nowrap">Trucks</span>
          {typeof trucksCount === 'number' && (
            <span
              className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                currentTab === 'trucks'
                  ? 'bg-slate-950/20 text-slate-950'
                  : 'bg-slate-800 text-slate-300 border border-slate-700'
              }`}
            >
              {trucksCount}
            </span>
          )}
        </button>

        {/* Borders & Customs */}
        <button
          id="nav-borders"
          onClick={() => onSelectTab('borders')}
          className={`hidden md:flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
            currentTab === 'borders'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
          }`}
          title="Border Posts & Customs Clearance"
        >
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span className="whitespace-nowrap">Customs & Borders</span>
        </button>
      </nav>
    </aside>
  );
};
