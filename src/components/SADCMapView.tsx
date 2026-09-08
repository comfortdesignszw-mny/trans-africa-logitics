/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Navigation,
  Truck,
  Package,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Clock,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { BorderPostInfo, LoadItem, TruckListing } from '../types';
import { SADC_BORDER_POSTS } from '../data/sadcData';
import { calculateHaversineDistanceKm } from '../services/matchingEngine';
import { RealGPSMap } from './RealGPSMap';

interface SADCMapViewProps {
  loads: LoadItem[];
  trucks: TruckListing[];
  userLat: number;
  userLng: number;
  selectedLoadId?: string | null;
  onSelectLoad?: (load: LoadItem) => void;
  onSelectTruck?: (truck: TruckListing) => void;
  onStartNavigation?: (load: LoadItem) => void;
}

// Map projection boundaries for Southern Africa (SADC)
// Latitude: -5° (North: Tanzania) to -35° (South: Cape Agulhas)
// Longitude: 11° (West: Atlantic / Namibia) to 41° (East: Indian Ocean / Mozambique)
const MAP_BOUNDS = {
  minLat: -35.0,
  maxLat: -5.0,
  minLng: 11.0,
  maxLng: 41.0,
};

function projectCoords(lat: number, lng: number, width: number, height: number) {
  // Simple Mercator-like projection mapped to SVG canvas
  const x = ((lng - MAP_BOUNDS.minLng) / (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng)) * width;
  const y = ((MAP_BOUNDS.maxLat - lat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat)) * height;
  return { x, y };
}

// SADC Key Highway Corridors coordinates
const HIGHWAY_CORRIDORS = [
  {
    name: 'North-South Corridor (Durban -> Joburg -> Beitbridge -> Harare -> Lusaka -> Lubumbashi)',
    color: '#f97316',
    points: [
      { lat: -29.8587, lng: 31.0218 }, // Durban
      { lat: -26.2041, lng: 28.0473 }, // Joburg
      { lat: -22.3486, lng: 30.0401 }, // Musina
      { lat: -22.2181, lng: 29.9897 }, // Beitbridge
      { lat: -20.1553, lng: 28.5833 }, // Bulawayo branch
      { lat: -17.8292, lng: 31.0522 }, // Harare
      { lat: -16.0378, lng: 28.8509 }, // Chirundu
      { lat: -15.3875, lng: 28.3228 }, // Lusaka
      { lat: -12.9696, lng: 28.6366 }, // Ndola
      { lat: -12.2592, lng: 27.7997 }, // Kasumbalesa
      { lat: -11.6876, lng: 27.5026 }, // Lubumbashi
    ],
  },
  {
    name: 'Trans-Kalahari Corridor (Walvis Bay -> Windhoek -> Buitepos -> Gaborone -> Joburg)',
    color: '#38bdf8',
    points: [
      { lat: -22.9575, lng: 14.5053 }, // Walvis Bay
      { lat: -22.5609, lng: 17.0658 }, // Windhoek
      { lat: -22.2858, lng: 19.9984 }, // Buitepos
      { lat: -24.6282, lng: 25.9231 }, // Gaborone
      { lat: -26.2041, lng: 28.0473 }, // Joburg
    ],
  },
  {
    name: 'Dar es Salaam Corridor (Dar -> Mbeya -> Nakonde -> Lusaka)',
    color: '#10b981',
    points: [
      { lat: -6.7924, lng: 39.2083 }, // Dar es Salaam
      { lat: -8.9000, lng: 33.4500 }, // Mbeya
      { lat: -9.3000, lng: 32.7667 }, // Nakonde
      { lat: -11.8333, lng: 31.4500 }, // Mpika
      { lat: -15.3875, lng: 28.3228 }, // Lusaka
    ],
  },
  {
    name: 'Beira Corridor (Beira -> Machipanda -> Mutare -> Harare)',
    color: '#eab308',
    points: [
      { lat: -19.8325, lng: 34.8389 }, // Beira
      { lat: -18.9728, lng: 32.6709 }, // Forbes/Machipanda
      { lat: -17.8292, lng: 31.0522 }, // Harare
    ],
  },
  {
    name: 'Maputo Corridor (Maputo -> Lebombo -> Joburg)',
    color: '#ec4899',
    points: [
      { lat: -25.9692, lng: 32.5732 }, // Maputo
      { lat: -25.4468, lng: 31.9792 }, // Lebombo
      { lat: -25.4753, lng: 30.9694 }, // Nelspruit
      { lat: -26.2041, lng: 28.0473 }, // Joburg
    ],
  },
  {
    name: 'Kazungula Corridor (Gaborone -> Francistown -> Kazungula -> Livingstone)',
    color: '#a855f7',
    points: [
      { lat: -24.6282, lng: 25.9231 }, // Gaborone
      { lat: -21.1736, lng: 27.5125 }, // Francistown
      { lat: -17.7918, lng: 25.2676 }, // Kazungula Bridge
      { lat: -15.3875, lng: 28.3228 }, // Lusaka
    ],
  },
];

export const SADCMapView: React.FC<SADCMapViewProps> = ({
  loads,
  trucks,
  userLat,
  userLng,
  selectedLoadId,
  onSelectLoad,
  onSelectTruck,
  onStartNavigation,
}) => {
  const [mapEngine, setMapEngine] = useState<'real_gps' | 'vector_offline'>('real_gps');
  const [showLoads, setShowLoads] = useState(true);
  const [showTrucks, setShowTrucks] = useState(true);
  const [showBorders, setShowBorders] = useState(true);
  const [showCorridors, setShowCorridors] = useState(true);
  const [selectedBorder, setSelectedBorder] = useState<BorderPostInfo | null>(null);
  const [hoveredEntity, setHoveredEntity] = useState<any | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  const SVG_WIDTH = 960;
  const SVG_HEIGHT = 760;

  // Selected load details
  const activeSelectedLoad = useMemo(() => {
    return loads.find((l) => l.id === selectedLoadId) || null;
  }, [loads, selectedLoadId]);

  const userPoint = useMemo(() => {
    return projectCoords(userLat, userLng, SVG_WIDTH, SVG_HEIGHT);
  }, [userLat, userLng]);

  return (
    <div className="flex flex-col gap-3">
      {/* Top Map Engine Switcher: Real GPS vs Offline Vector */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMapEngine('real_gps')}
            className={`px-3.5 py-2 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-2 ${
              mapEngine === 'real_gps'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <span>🛰️ Real GPS Mapping System</span>
            <span
              className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                mapEngine === 'real_gps' ? 'bg-slate-950/30 text-slate-950' : 'bg-emerald-500/20 text-emerald-300'
              }`}
            >
              Online Data
            </span>
          </button>

          <button
            onClick={() => setMapEngine('vector_offline')}
            className={`px-3.5 py-2 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-2 ${
              mapEngine === 'vector_offline'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <span>⚡ Lightweight Vector Map</span>
            <span
              className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                mapEngine === 'vector_offline' ? 'bg-slate-950/30 text-slate-950' : 'bg-sky-500/20 text-sky-300'
              }`}
            >
              Zero-Data Mode
            </span>
          </button>
        </div>

        <div className="text-xs text-slate-400">
          {mapEngine === 'real_gps' ? (
            <span className="text-emerald-400 font-semibold">
              ● Live satellite & road map active with turn-by-turn navigation & live tracking
            </span>
          ) : (
            <span className="text-amber-400 font-semibold">
              ● Low-bandwidth SVG mode active (suitable for 2G / zero-data cross-border checkpoints)
            </span>
          )}
        </div>
      </div>

      {mapEngine === 'real_gps' ? (
        <RealGPSMap
          loads={loads}
          trucks={trucks}
          selectedLoad={activeSelectedLoad}
          onSelectLoad={onSelectLoad}
          onStartNavigation={onStartNavigation}
        />
      ) : (
        <div className="relative w-full h-[620px] bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl flex flex-col">
      {/* Top Map Toolbar */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Layer Filters */}
        <div className="pointer-events-auto flex items-center gap-1.5 p-1.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700/80 shadow-lg text-xs">
          <span className="flex items-center gap-1 text-slate-400 font-semibold px-2">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Layers:</span>
          </span>

          <button
            onClick={() => setShowLoads(!showLoads)}
            className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
              showLoads ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Package className="w-3 h-3 text-amber-400" />
            <span>Loads ({loads.length})</span>
          </button>

          <button
            onClick={() => setShowTrucks(!showTrucks)}
            className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
              showTrucks ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Truck className="w-3 h-3 text-sky-400" />
            <span>Trucks ({trucks.length})</span>
          </button>

          <button
            onClick={() => setShowBorders(!showBorders)}
            className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
              showBorders ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span className="hidden md:inline">Border OSBPs</span>
            <span className="md:hidden">Borders</span>
          </button>

          <button
            onClick={() => setShowCorridors(!showCorridors)}
            className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
              showCorridors ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Navigation className="w-3 h-3 text-purple-400" />
            <span className="hidden lg:inline">Corridors</span>
          </button>
        </div>

        {/* Zoom & Reset Controls */}
        <div className="pointer-events-auto flex items-center gap-1 p-1 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700/80 shadow-lg text-slate-300">
          <button
            onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
            className="p-1.5 hover:bg-slate-800 rounded-lg transition"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoomLevel((z) => Math.max(0.8, z - 0.25))}
            className="p-1.5 hover:bg-slate-800 rounded-lg transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setZoomLevel(1);
              setPanOffset({ x: 0, y: 0 });
            }}
            className="p-1.5 hover:bg-slate-800 rounded-lg transition"
            title="Reset Map View"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* SVG Canvas for Southern Africa Map */}
      <div className="flex-1 w-full h-full relative cursor-grab active:cursor-grabbing overflow-hidden">
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="w-full h-full select-none"
          style={{
            transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
            transformOrigin: 'center center',
            transition: 'transform 0.15s ease-out',
          }}
        >
          {/* Subtle Latitude / Longitude Guide Grid */}
          <g opacity="0.12" stroke="#64748b" strokeWidth="0.75" strokeDasharray="4 6">
            {[-10, -15, -20, -25, -30].map((lat) => {
              const p1 = projectCoords(lat, MAP_BOUNDS.minLng, SVG_WIDTH, SVG_HEIGHT);
              const p2 = projectCoords(lat, MAP_BOUNDS.maxLng, SVG_WIDTH, SVG_HEIGHT);
              return <line key={lat} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} />;
            })}
            {[15, 20, 25, 30, 35, 40].map((lng) => {
              const p1 = projectCoords(MAP_BOUNDS.maxLat, lng, SVG_WIDTH, SVG_HEIGHT);
              const p2 = projectCoords(MAP_BOUNDS.minLat, lng, SVG_WIDTH, SVG_HEIGHT);
              return <line key={lng} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} />;
            })}
          </g>

          {/* SADC Landmass Abstract Contours */}
          <path
            d="
              M 360,50 
              L 650,40 
              L 890,70 
              L 900,160 
              L 790,260 
              L 720,380 
              L 680,480 
              L 580,590 
              L 530,680 
              L 440,730 
              L 230,730 
              L 160,650 
              L 120,490 
              L 110,400 
              L 130,260 
              L 260,120 
              Z
            "
            fill="#090d16"
            stroke="#1e293b"
            strokeWidth="1.5"
            opacity="0.85"
          />

          {/* SADC Country Regional Outlines & Labels */}
          <g opacity="0.25" fill="none" stroke="#334155" strokeWidth="1">
            {/* South Africa */}
            <path d="M 230,730 L 440,730 L 530,680 L 580,590 L 540,510 L 410,500 L 320,530 L 220,560 L 160,650 Z" />
            {/* Zimbabwe */}
            <path d="M 490,440 L 590,420 L 640,480 L 560,510 L 490,480 Z" />
            {/* Zambia */}
            <path d="M 420,310 L 560,280 L 630,340 L 540,410 L 420,400 Z" />
            {/* Botswana */}
            <path d="M 320,530 L 420,500 L 490,440 L 420,400 L 320,420 Z" />
            {/* Namibia */}
            <path d="M 120,490 L 220,560 L 320,530 L 320,420 L 210,380 L 130,390 Z" />
            {/* Mozambique */}
            <path d="M 590,420 L 720,380 L 680,480 L 580,590 L 540,510 Z" />
            {/* Tanzania */}
            <path d="M 560,110 L 890,70 L 900,160 L 790,260 L 680,240 L 560,200 Z" />
          </g>

          {/* Country Name Labels */}
          <g fill="#475569" fontSize="11" fontWeight="700" letterSpacing="1.5" textAnchor="middle">
            <text x="360" y="650">SOUTH AFRICA</text>
            <text x="560" y="470">ZIMBABWE</text>
            <text x="510" y="340">ZAMBIA</text>
            <text x="390" y="470">BOTSWANA</text>
            <text x="210" y="480">NAMIBIA</text>
            <text x="690" y="470">MOZAMBIQUE</text>
            <text x="660" y="320">MALAWI</text>
            <text x="730" y="160">TANZANIA</text>
            <text x="440" y="210">DR CONGO</text>
          </g>

          {/* SADC Highway Corridors Paths */}
          {showCorridors &&
            HIGHWAY_CORRIDORS.map((corridor, idx) => {
              const svgPoints = corridor.points.map((pt) => {
                const projected = projectCoords(pt.lat, pt.lng, SVG_WIDTH, SVG_HEIGHT);
                return `${projected.x},${projected.y}`;
              });
              return (
                <g key={idx}>
                  {/* Outer Glow */}
                  <polyline
                    points={svgPoints.join(' ')}
                    fill="none"
                    stroke={corridor.color}
                    strokeWidth="5"
                    strokeOpacity="0.15"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Core Road Polyline */}
                  <polyline
                    points={svgPoints.join(' ')}
                    fill="none"
                    stroke={corridor.color}
                    strokeWidth="2.5"
                    strokeOpacity="0.7"
                    strokeDasharray={idx === 0 ? '8 4' : '6 3'}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>
              );
            })}

          {/* Active Selected Load Route & Distance Arc */}
          {activeSelectedLoad && (
            <g>
              {(() => {
                const originPt = projectCoords(
                  activeSelectedLoad.origin.lat,
                  activeSelectedLoad.origin.lng,
                  SVG_WIDTH,
                  SVG_HEIGHT
                );
                const destPt = projectCoords(
                  activeSelectedLoad.destination.lat,
                  activeSelectedLoad.destination.lng,
                  SVG_WIDTH,
                  SVG_HEIGHT
                );
                const distKm = calculateHaversineDistanceKm(
                  activeSelectedLoad.origin.lat,
                  activeSelectedLoad.origin.lng,
                  activeSelectedLoad.destination.lat,
                  activeSelectedLoad.destination.lng
                );
                const midX = (originPt.x + destPt.x) / 2;
                const midY = (originPt.y + destPt.y) / 2 - 25;

                return (
                  <>
                    {/* Pulsing Highlight Corridor Path */}
                    <path
                      d={`M ${originPt.x},${originPt.y} Q ${midX},${midY} ${destPt.x},${destPt.y}`}
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="3.5"
                      strokeDasharray="6 4"
                      className="animate-pulse"
                    />
                    {/* Distance Tag at Midpoint */}
                    <g transform={`translate(${midX}, ${midY})`}>
                      <rect
                        x="-45"
                        y="-12"
                        width="90"
                        height="24"
                        rx="6"
                        fill="#0f172a"
                        stroke="#f59e0b"
                        strokeWidth="1.5"
                      />
                      <text
                        x="0"
                        y="4"
                        fill="#fbbf24"
                        fontSize="10"
                        fontWeight="700"
                        textAnchor="middle"
                      >
                        {distKm} km Route
                      </text>
                    </g>
                  </>
                );
              })()}
            </g>
          )}

          {/* SADC Border Clearance Points (OSBPs) */}
          {showBorders &&
            SADC_BORDER_POSTS.map((border) => {
              const pt = projectCoords(border.coords.lat, border.coords.lng, SVG_WIDTH, SVG_HEIGHT);
              const isSelected = selectedBorder?.id === border.id;
              const statusColor =
                border.status === 'normal'
                  ? '#10b981'
                  : border.status === 'moderate_delay'
                  ? '#f59e0b'
                  : '#ef4444';

              return (
                <g
                  key={border.id}
                  transform={`translate(${pt.x}, ${pt.y})`}
                  className="cursor-pointer group"
                  onClick={() => setSelectedBorder(border)}
                  onMouseEnter={() => setHoveredEntity({ type: 'border', data: border })}
                  onMouseLeave={() => setHoveredEntity(null)}
                >
                  <circle r={isSelected ? 10 : 7} fill={statusColor} opacity="0.25" />
                  <circle
                    r={isSelected ? 6 : 4.5}
                    fill={statusColor}
                    stroke="#020617"
                    strokeWidth="1.5"
                  />
                  {/* Subtle Label */}
                  <text
                    x="8"
                    y="3"
                    fill="#94a3b8"
                    fontSize="9"
                    fontWeight="600"
                    className="opacity-70 group-hover:opacity-100 transition"
                  >
                    {border.name.split(' ')[0]}
                  </text>
                </g>
              );
            })}

          {/* Available Trucks Pins (Cyan / Blue) */}
          {showTrucks &&
            trucks.map((truck) => {
              const pt = projectCoords(
                truck.currentLocation.lat,
                truck.currentLocation.lng,
                SVG_WIDTH,
                SVG_HEIGHT
              );
              const distFromUser = calculateHaversineDistanceKm(
                userLat,
                userLng,
                truck.currentLocation.lat,
                truck.currentLocation.lng
              );

              return (
                <g
                  key={truck.id}
                  transform={`translate(${pt.x}, ${pt.y})`}
                  className="cursor-pointer group"
                  onClick={() => onSelectTruck?.(truck)}
                  onMouseEnter={() =>
                    setHoveredEntity({ type: 'truck', data: truck, distance: distFromUser })
                  }
                  onMouseLeave={() => setHoveredEntity(null)}
                >
                  {/* Radar pulse */}
                  <circle r="12" fill="#0284c7" opacity="0.2" className="animate-ping" />
                  {/* Truck Pin Shape */}
                  <circle r="9" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />
                  <circle r="4" fill="#38bdf8" />
                  {/* Floating Distance Tag */}
                  <text
                    x="12"
                    y="-5"
                    fill="#38bdf8"
                    fontSize="9"
                    fontWeight="700"
                    className="drop-shadow-md"
                  >
                    {truck.capacityTons}t {truck.truckType.toUpperCase()}
                  </text>
                </g>
              );
            })}

          {/* Active Loads Pins (Amber / Orange) */}
          {showLoads &&
            loads.map((load) => {
              const pt = projectCoords(load.origin.lat, load.origin.lng, SVG_WIDTH, SVG_HEIGHT);
              const isSelected = selectedLoadId === load.id;
              const distFromUser = calculateHaversineDistanceKm(
                userLat,
                userLng,
                load.origin.lat,
                load.origin.lng
              );

              return (
                <g
                  key={load.id}
                  transform={`translate(${pt.x}, ${pt.y})`}
                  className="cursor-pointer group"
                  onClick={() => onSelectLoad?.(load)}
                  onMouseEnter={() =>
                    setHoveredEntity({ type: 'load', data: load, distance: distFromUser })
                  }
                  onMouseLeave={() => setHoveredEntity(null)}
                >
                  {isSelected && (
                    <circle r="16" fill="#f59e0b" opacity="0.3" className="animate-pulse" />
                  )}
                  {/* Amber cargo marker */}
                  <polygon
                    points="0,-12 10,0 0,12 -10,0"
                    fill={isSelected ? '#fbbf24' : '#f97316'}
                    stroke="#ffffff"
                    strokeWidth={isSelected ? '2.5' : '1.5'}
                  />
                  <circle r="3" fill="#ffffff" />
                  <text
                    x="12"
                    y="4"
                    fill="#fbbf24"
                    fontSize="9"
                    fontWeight="700"
                    className="drop-shadow-md"
                  >
                    {load.weightTons}t · {load.currency} {load.budget.toLocaleString()}
                  </text>
                </g>
              );
            })}

          {/* Trucker / Current User Real-time GPS Position */}
          <g transform={`translate(${userPoint.x}, ${userPoint.y})`}>
            {/* GPS Pulse Radar waves */}
            <circle r="22" fill="#10b981" opacity="0.2" className="animate-ping" />
            <circle r="14" fill="#10b981" opacity="0.3" />
            <circle r="8" fill="#10b981" stroke="#ffffff" strokeWidth="2.5" />
            <circle r="3" fill="#ffffff" />
            <text
              x="0"
              y="-14"
              fill="#34d399"
              fontSize="10"
              fontWeight="800"
              textAnchor="middle"
              className="drop-shadow-md"
            >
              YOU ARE HERE (GPS)
            </text>
          </g>
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredEntity && (
          <div className="absolute top-16 right-4 z-30 w-72 p-3.5 rounded-xl bg-slate-900/95 border border-slate-700 shadow-2xl backdrop-blur-md text-slate-100 pointer-events-none animate-in fade-in duration-150">
            {hoveredEntity.type === 'load' && (
              <div>
                <div className="flex items-center justify-between text-xs text-amber-400 font-bold mb-1">
                  <span className="flex items-center gap-1">
                    <Package className="w-3.5 h-3.5" /> Cargo Load
                  </span>
                  <span>{hoveredEntity.distance} km from you</span>
                </div>
                <h4 className="text-sm font-bold text-white line-clamp-1">
                  {hoveredEntity.data.title}
                </h4>
                <p className="text-xs text-slate-300 mt-1">
                  {hoveredEntity.data.origin.city} &rarr; {hoveredEntity.data.destination.city}
                </p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800 text-xs">
                  <span className="text-slate-400 font-medium">
                    {hoveredEntity.data.weightTons} tons · {hoveredEntity.data.truckTypeRequired}
                  </span>
                  <span className="font-extrabold text-amber-400">
                    {hoveredEntity.data.currency} {hoveredEntity.data.budget.toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {hoveredEntity.type === 'truck' && (
              <div>
                <div className="flex items-center justify-between text-xs text-sky-400 font-bold mb-1">
                  <span className="flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5" /> Available Truck
                  </span>
                  <span>{hoveredEntity.distance} km from you</span>
                </div>
                <h4 className="text-sm font-bold text-white">
                  {hoveredEntity.data.companyName}
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  Reg: {hoveredEntity.data.truckReg} · Driver: {hoveredEntity.data.truckerName}
                </p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800 text-xs">
                  <span className="text-slate-400">
                    {hoveredEntity.data.capacityTons}t capacity · {hoveredEntity.data.truckType}
                  </span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> {hoveredEntity.data.kycBadgeLevel}
                  </span>
                </div>
              </div>
            )}

            {hoveredEntity.type === 'border' && (
              <div>
                <div className="flex items-center justify-between text-xs text-emerald-400 font-bold mb-1">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> SADC Border Checkpoint
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] ${
                      hoveredEntity.data.status === 'normal'
                        ? 'bg-emerald-950 text-emerald-300'
                        : hoveredEntity.data.status === 'moderate_delay'
                        ? 'bg-amber-950 text-amber-300'
                        : 'bg-red-950 text-red-300'
                    }`}
                  >
                    {hoveredEntity.data.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white">{hoveredEntity.data.name}</h4>
                <p className="text-xs text-slate-300 mt-1">
                  Wait time: <strong>{hoveredEntity.data.typicalWaitHours}</strong>
                </p>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                  {hoveredEntity.data.statusNote}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected Border Details Modal / Bottom Drawer */}
      {selectedBorder && (
        <div className="absolute bottom-3 left-3 right-3 z-30 p-4 rounded-xl bg-slate-900/98 border border-slate-700 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <h3 className="text-sm sm:text-base font-bold text-white">
                  {selectedBorder.name}
                </h3>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {selectedBorder.countries.join(' ⇄ ')}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Corridor: <span className="text-slate-200">{selectedBorder.corridor}</span> · Hours:{' '}
                <span className="text-amber-400">{selectedBorder.commercialHours}</span>
              </p>
            </div>

            <button
              onClick={() => setSelectedBorder(null)}
              className="text-xs font-bold px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 pt-3 border-t border-slate-800 text-xs">
            <div>
              <span className="text-slate-400 block mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" /> Current Clearance Wait
              </span>
              <p className="text-sm font-extrabold text-amber-300">
                {selectedBorder.typicalWaitHours}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">{selectedBorder.statusNote}</p>
            </div>

            <div>
              <span className="text-slate-400 block mb-1">Estimated Cross-Border Fees</span>
              <p className="font-semibold text-emerald-400">
                {selectedBorder.crossingFeesApproxUSD}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Includes road toll & processing</p>
            </div>

            <div>
              <span className="text-slate-400 block mb-1">Key Documents Required</span>
              <ul className="text-[11px] text-slate-300 space-y-0.5">
                {selectedBorder.requiredDocs.slice(0, 3).map((d, i) => (
                  <li key={i} className="truncate">
                    • {d}
                  </li>
                ))}
                {selectedBorder.requiredDocs.length > 3 && (
                  <li className="text-amber-400 font-semibold">
                    +{selectedBorder.requiredDocs.length - 3} more required documents
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Map Legend */}
      <div className="px-3 py-2 bg-slate-900/90 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-emerald-400/30" />
            <span className="text-slate-200 font-medium">Your Current GPS</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rotate-45 bg-amber-500" />
            <span className="text-slate-200 font-medium">Cargo Loads</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
            <span className="text-slate-200 font-medium">Available Trucks</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            <span className="text-slate-300">SADC Corridors</span>
          </span>
        </div>

        <div className="text-[11px] text-slate-500">
          *100% Offline Vector Map · Coordinates verified across SADC
        </div>
      </div>
    </div>
  )}
</div>
);
};
