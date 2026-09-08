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
    <aside
      aria-label="Quick Navigation"
      className="fixed bottom-2.5 sm:bottom-6 left-0 right-0 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-40 flex justify-center px-2 sm:px-0 pointer-events-none"
    >
      <nav
        aria-label="Corridor Transport Navigation"
        className="pointer-events-auto bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl sm:rounded-full shadow-2xl shadow-black/90 p-1 sm:px-2 sm:py-1.5 flex items-center justify-between sm:justify-center gap-1 sm:gap-1.5 w-full max-w-md sm:max-w-none sm:w-auto"
      >
        {/* Corridor and Domestic Board */}
        <button
          id="nav-corridor-board"
          onClick={() => onSelectTab('board')}
          className={`flex-1 sm:flex-initial flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-1.5 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-full text-xs font-bold transition-all cursor-pointer min-w-0 ${
            currentTab === 'board'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30 font-black'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
          }`}
          title="Corridor and Domestic Board"
        >
          <Compass className="w-4 h-4 shrink-0" />
          <span className="truncate text-[10px] sm:text-xs leading-none font-bold sm:whitespace-nowrap">
            <span className="sm:hidden">Board</span>
            <span className="hidden sm:inline">Corridor and Domestic Board</span>
          </span>
        </button>

        {/* Consignments */}
        <button
          id="nav-consignments"
          onClick={() => onSelectTab('consignments')}
          className={`flex-1 sm:flex-initial flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-1.5 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-full text-xs font-bold transition-all cursor-pointer min-w-0 relative ${
            currentTab === 'consignments'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30 font-black'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
          }`}
          title="Consignments & Cargo Directory"
        >
          <div className="relative flex items-center justify-center">
            <Package className="w-4 h-4 shrink-0" />
            {typeof consignmentsCount === 'number' && (
              <span
                className={`sm:hidden absolute -top-1.5 -right-2.5 min-w-[14px] h-3.5 px-0.5 rounded-full text-[9px] font-black flex items-center justify-center leading-none ${
                  currentTab === 'consignments'
                    ? 'bg-slate-950 text-amber-400'
                    : 'bg-amber-500 text-slate-950'
                }`}
              >
                {consignmentsCount}
              </span>
            )}
          </div>
          <span className="truncate text-[10px] sm:text-xs leading-none font-bold sm:whitespace-nowrap">
            <span className="sm:hidden">Cargo</span>
            <span className="hidden sm:inline">Consignments</span>
          </span>
          {typeof consignmentsCount === 'number' && (
            <span
              className={`hidden sm:inline-flex text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
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
          className={`flex-1 sm:flex-initial flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-1.5 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-full text-xs font-bold transition-all cursor-pointer min-w-0 relative ${
            currentTab === 'trucks'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30 font-black'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
          }`}
          title="Trucks & Fleet Directory"
        >
          <div className="relative flex items-center justify-center">
            <Truck className="w-4 h-4 shrink-0" />
            {typeof trucksCount === 'number' && (
              <span
                className={`sm:hidden absolute -top-1.5 -right-2.5 min-w-[14px] h-3.5 px-0.5 rounded-full text-[9px] font-black flex items-center justify-center leading-none ${
                  currentTab === 'trucks'
                    ? 'bg-slate-950 text-amber-400'
                    : 'bg-amber-500 text-slate-950'
                }`}
              >
                {trucksCount}
              </span>
            )}
          </div>
          <span className="truncate text-[10px] sm:text-xs leading-none font-bold sm:whitespace-nowrap">
            Trucks
          </span>
          {typeof trucksCount === 'number' && (
            <span
              className={`hidden sm:inline-flex text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
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
          className={`flex-1 sm:flex-initial flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-1.5 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-full text-xs font-bold transition-all cursor-pointer min-w-0 ${
            currentTab === 'borders'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30 font-black'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
          }`}
          title="Border Posts & Customs Clearance"
        >
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span className="truncate text-[10px] sm:text-xs leading-none font-bold sm:whitespace-nowrap">
            <span className="sm:hidden">Borders</span>
            <span className="hidden sm:inline">Customs & Borders</span>
          </span>
        </button>
      </nav>
    </aside>
  );
};
