/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Navigation,
  Compass,
  Gauge,
  MapPin,
  AlertTriangle,
  Volume2,
  VolumeX,
  Play,
  Pause,
  FastForward,
  RotateCcw,
  CheckCircle2,
  ShieldAlert,
  Radio,
  Clock,
  Building2,
  Globe2,
  X,
  PhoneCall,
  FileCheck2,
} from 'lucide-react';
import { LoadItem, UserProfile } from '../types';
import { StorageService } from '../services/storage';

interface LiveNavigationCockpitProps {
  load: LoadItem;
  currentUser: UserProfile;
  onClose: () => void;
  onTripCompleted?: () => void;
  onOpenSOS?: () => void;
}

interface Waypoint {
  name: string;
  type: 'depot' | 'weighbridge' | 'checkpoint' | 'truck_stop' | 'destination';
  distanceKm: number;
  status: 'passed' | 'approaching' | 'upcoming';
  speedLimitKmh: number;
  instruction: string;
}

export const LiveNavigationCockpit: React.FC<LiveNavigationCockpitProps> = ({
  load,
  currentUser,
  onClose,
  onTripCompleted,
  onOpenSOS,
}) => {
  const isDomestic = load.haulType === 'domestic';

  // Navigation state
  const [isPlaying, setIsPlaying] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [currentSpeed, setCurrentSpeed] = useState(72); // km/h
  const [heading, setHeading] = useState(168); // degrees
  const [progressPercent, setProgressPercent] = useState(load.telemetry?.routeProgressPct || 35);
  const [distanceRemainingKm, setDistanceRemainingKm] = useState(240);
  const [currentLat, setCurrentLat] = useState(load.telemetry?.currentLat || -20.5);
  const [currentLng, setCurrentLng] = useState(load.telemetry?.currentLng || 29.8);
  const [simulationSpeedMultiplier, setSimulationSpeedMultiplier] = useState(1);

  // Dynamic route waypoints customized for domestic vs cross-border
  const [waypoints, setWaypoints] = useState<Waypoint[]>([
    {
      name: `${load.origin.city} Staging Depot`,
      type: 'depot',
      distanceKm: 0,
      status: 'passed',
      speedLimitKmh: 60,
      instruction: 'Departure verified. Consignment seals locked.',
    },
    {
      name: isDomestic ? 'Provincial Weighbridge & Axle Station' : 'Regional Transit Corridor Weighbridge',
      type: 'weighbridge',
      distanceKm: 42,
      status: 'approaching',
      speedLimitKmh: 80,
      instruction: 'Prepare for gross vehicle mass weigh-in. Maintain lane 1.',
    },
    {
      name: isDomestic ? 'Highway Rest Stop & Fuel Depot' : 'Safe Night Haven Truck Parking Depot',
      type: 'truck_stop',
      distanceKm: 110,
      status: 'upcoming',
      speedLimitKmh: 100,
      instruction: 'Recommended 30-minute mandatory tachograph driver rest break.',
    },
    {
      name: isDomestic ? 'District Municipal Toll & Gate' : 'One-Stop Border Post (OSBP) Clearance Gate',
      type: 'checkpoint',
      distanceKm: 185,
      status: 'upcoming',
      speedLimitKmh: 40,
      instruction: isDomestic
        ? 'Local highway transit. Show local consignment note.'
        : 'Border zone. Have SADC manifests, passport, and customs bond ready.',
    },
    {
      name: `${load.destination.city} Receiving Terminal`,
      type: 'destination',
      distanceKm: 240,
      status: 'upcoming',
      speedLimitKmh: 40,
      instruction: 'Final destination. Present waybill and sign digital POD upon offload.',
    },
  ]);

  // Current turn instruction
  const currentInstruction = waypoints.find((w) => w.status === 'approaching') || waypoints[waypoints.length - 1];

  // Speech Announcement simulator
  const announceVoice = (text: string) => {
    if (!audioEnabled || typeof window === 'undefined') return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Live navigation simulation interval
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setProgressPercent((prev) => {
        if (prev >= 100) {
          setIsPlaying(false);
          announceVoice('You have arrived at your delivery destination. Prepare for cargo offload.');
          return 100;
        }

        const next = Math.min(100, prev + 0.5 * simulationSpeedMultiplier);
        const remKm = Math.max(0, Math.round(380 * (1 - next / 100)));
        setDistanceRemainingKm(remKm);

        // Fluctuate speed realistically
        const speedJitter = Math.floor(Math.random() * 5) - 2;
        const newSpeed = Math.min(85, Math.max(55, currentSpeed + speedJitter));
        setCurrentSpeed(newSpeed);

        // Interpolate coordinates along route
        const latStep = load.origin.lat + (load.destination.lat - load.origin.lat) * (next / 100);
        const lngStep = load.origin.lng + (load.destination.lng - load.origin.lng) * (next / 100);
        setCurrentLat(latStep);
        setCurrentLng(lngStep);

        // Update telemetry in storage for shippers to track
        StorageService.updateLoadTelemetry(load.id, {
          currentLat: latStep,
          currentLng: lngStep,
          speedKmh: newSpeed,
          headingDeg: heading,
          routeProgressPct: Math.round(next),
          etaMinutes: Math.round((remKm / 70) * 60),
          nearestTown: remKm < 30 ? `Arriving ${load.destination.city}` : `En route corridor (${remKm}km away)`,
        });

        // Trigger announcement when crossing 50%
        if (Math.abs(next - 50) < 0.6) {
          announceVoice('In 5 kilometers, approach weighbridge station. Maintain safe following distance.');
        }

        return next;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [isPlaying, simulationSpeedMultiplier, load, currentSpeed, heading, audioEnabled]);

  const handleFastForward = () => {
    setProgressPercent((prev) => Math.min(99, prev + 15));
    announceVoice('Fast forwarding route waypoint simulation.');
  };

  const handleFinishTrip = () => {
    StorageService.updateLoadStatus(load.id, 'delivered');
    if (onTripCompleted) {
      onTripCompleted();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-slate-950 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-100 my-auto animate-in zoom-in-95 duration-150">
        {/* TOP COCKPIT HEADER */}
        <div className="p-3.5 sm:p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shadow-inner">
              <Navigation className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-white">Driver Navigation Cockpit</h3>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                    isDomestic ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                  }`}
                >
                  {isDomestic ? '🇿🇼 Domestic Haul' : '🌍 SADC Corridor'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {load.origin.city} &rarr; {load.destination.city} · {load.cargoDescription}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Sound Toggle */}
            <button
              onClick={() => {
                const next = !audioEnabled;
                setAudioEnabled(next);
                if (next) announceVoice('Navigation voice alerts enabled.');
              }}
              className={`p-2 rounded-xl border transition cursor-pointer ${
                audioEnabled
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
              title="Toggle voice alerts"
            >
              {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Emergency SOS Button */}
            <button
              onClick={() => {
                if (onOpenSOS) onOpenSOS();
              }}
              className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs shadow-lg shadow-red-600/30 flex items-center gap-1.5 cursor-pointer animate-pulse transition"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>SOS PANIC</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MAIN HUD DISPLAY */}
        <div className="p-4 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* TOP INSTRUMENTS ROW: Speed, Turn Card, ETA */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* Instrument 1: Digital Speedometer & Limits */}
            <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 flex flex-col justify-between items-center text-center shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between w-full text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Gauge className="w-3.5 h-3.5 text-sky-400" />
                  Speedometer
                </span>
                <span className="px-1.5 py-0.5 rounded-md bg-slate-800 text-[10px] text-amber-400 font-bold">
                  Limit: 80 km/h
                </span>
              </div>

              <div className="my-2">
                <div className="text-5xl font-black text-white tracking-tight font-mono">
                  {isPlaying ? currentSpeed : 0}
                </div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">km / hour</div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <Compass className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  Heading: <strong className="text-white">{heading}° SSE</strong>
                </span>
              </div>
            </div>

            {/* Instrument 2: Next Maneuver / Action Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 flex flex-col justify-between shadow-lg">
              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 animate-pulse" />
                  Next Waypoint Instruction
                </span>
                <span className="text-xs text-slate-400">In ~4.2 km</span>
              </div>

              <div className="my-1.5">
                <h4 className="text-lg font-extrabold text-white flex items-center gap-2">
                  <span>➡️</span> {currentInstruction.name}
                </h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {currentInstruction.instruction}
                </p>
              </div>

              <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
                <span>Waypoint Type: <strong className="text-white capitalize">{currentInstruction.type.replace('_', ' ')}</strong></span>
                <span className="text-emerald-400 font-semibold">Track Clear</span>
              </div>
            </div>

            {/* Instrument 3: ETA, Remaining Distance & Telemetry */}
            <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 flex flex-col justify-between shadow-lg">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Trip Telemetrics
                </span>
                <span className="text-emerald-400 font-bold">Live GPS Ping</span>
              </div>

              <div className="grid grid-cols-2 gap-2 my-1">
                <div>
                  <div className="text-2xl font-black text-white">{distanceRemainingKm} km</div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Remaining</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-amber-400">
                    ~{Math.round((distanceRemainingKm / 65) * 60)} mins
                  </div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Estimated ETA</div>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 flex items-center justify-between border-t border-slate-800 pt-1 font-mono">
                <span>Lat: {currentLat.toFixed(4)}</span>
                <span>Lng: {currentLng.toFixed(4)}</span>
              </div>
            </div>
          </div>

          {/* ROUTE PROGRESS BAR */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                {load.origin.city} &rarr; {load.destination.city}
              </span>
              <span className="font-mono font-bold text-emerald-400">{progressPercent.toFixed(1)}% Completed</span>
            </div>

            <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-sky-500 to-emerald-500 rounded-full transition-all duration-300 shadow-sm"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>

            {/* Waypoint markers along timeline */}
            <div className="grid grid-cols-5 gap-1 pt-1 text-center text-[10px]">
              {waypoints.map((wp, idx) => (
                <div
                  key={idx}
                  className={`p-1 rounded-lg border transition ${
                    wp.status === 'passed'
                      ? 'bg-slate-950 text-slate-500 border-slate-800'
                      : wp.status === 'approaching'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                      : 'bg-slate-950/40 text-slate-400 border-slate-800/40'
                  }`}
                >
                  <div className="truncate">{wp.name}</div>
                </div>
              ))}
            </div>
          </div>

          {/* SIMULATION & DRIVE CONTROLS */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-semibold">Simulate Driving:</span>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  isPlaying
                    ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                    : 'bg-emerald-600 text-white hover:bg-emerald-500'
                }`}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlaying ? 'Pause Auto-Drive' : 'Resume Auto-Drive'}</span>
              </button>

              <button
                onClick={handleFastForward}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer flex items-center gap-1"
              >
                <FastForward className="w-3.5 h-3.5 text-sky-400" />
                <span>Advance +15%</span>
              </button>

              <select
                value={simulationSpeedMultiplier}
                onChange={(e) => setSimulationSpeedMultiplier(Number(e.target.value))}
                className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
              >
                <option value={1}>1x Normal Speed</option>
                <option value={2}>2x Fast Speed</option>
                <option value={4}>4x Hyper Speed</option>
              </select>
            </div>

            {/* Delivery Action Button */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleFinishTrip}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 flex items-center gap-2 cursor-pointer transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Mark Arrived & Offloaded</span>
              </button>
            </div>
          </div>

          {/* CARGO & SHIPPER DISPATCH CONTACT */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-slate-400">Shipper / Dispatch Contact:</span>
              <div className="font-bold text-sm text-white mt-0.5">
                {load.shipperName} ({load.shipperCompany})
              </div>
              <p className="text-slate-400 mt-0.5">Phone: {load.shipperPhone}</p>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={`tel:${load.shipperPhone}`}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center gap-1.5 transition"
              >
                <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
                <span>Call Shipper</span>
              </a>
              <button
                onClick={() => {
                  announceVoice(`Current corridor location is approximately ${distanceRemainingKm} kilometers from ${load.destination.city}.`);
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <span>Read Status Aloud</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
