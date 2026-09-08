/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldAlert, MapPin, Radio, PhoneCall, AlertTriangle, X, CheckCircle2 } from 'lucide-react';
import { SOSAlert, UserProfile } from '../types';
import { StorageService } from '../services/storage';

interface EmergencySOSModalProps {
  currentUser: UserProfile;
  currentLat?: number;
  currentLng?: number;
  onClose: () => void;
  onAlertBroadcasted?: (alert: SOSAlert) => void;
}

export const EmergencySOSModal: React.FC<EmergencySOSModalProps> = ({
  currentUser,
  currentLat = -22.218,
  currentLng = 29.989,
  onClose,
  onAlertBroadcasted,
}) => {
  const [emergencyType, setEmergencyType] = useState<SOSAlert['type']>('mechanical');
  const [description, setDescription] = useState('');
  const [truckReg, setTruckReg] = useState('AEZ 9921 ZW');
  const [phone, setPhone] = useState(currentUser.phone || '+263 77 400 1234');
  const [isTransmitted, setIsTransmitted] = useState(false);

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();

    const alertItem: SOSAlert = {
      id: `sos-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.fullName,
      userPhone: phone,
      truckReg,
      lat: currentLat,
      lng: currentLng,
      type: emergencyType,
      description: description.trim() || 'Urgent roadside assistance requested along transport corridor.',
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    StorageService.triggerSOS(alertItem);
    setIsTransmitted(true);

    if (onAlertBroadcasted) {
      onAlertBroadcasted(alertItem);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-5 overflow-y-auto">
      <div className="w-full max-w-lg bg-slate-950 border-2 border-red-600 rounded-3xl shadow-2xl shadow-red-950/60 overflow-hidden text-slate-100 my-auto animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 bg-red-950/80 border-b border-red-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center font-black animate-pulse">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-base text-white tracking-wide">HIGHWAY DISTRESS SOS BEACON</h3>
              <p className="text-xs text-red-200">SADC Regional Corridor Safety & Security Network</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-red-900/50 hover:bg-red-800 text-red-200 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isTransmitted ? (
          <form onSubmit={handleBroadcast} className="p-5 space-y-4">
            <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
              <Radio className="w-4 h-4 text-red-400 animate-ping flex-shrink-0" />
              <span>
                Broadcasting this SOS will immediately pin your GPS coordinates on the live radar for nearby truckers, recovery fleets, and emergency dispatch.
              </span>
            </div>

            {/* Emergency Type Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Nature of Distress / Emergency *
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                {[
                  { id: 'mechanical', label: 'Mechanical Breakdown', icon: '🔧' },
                  { id: 'security_threat', label: 'Security / Hijack Alert', icon: '🚨' },
                  { id: 'accident', label: 'Road Accident / Collision', icon: '💥' },
                  { id: 'medical', label: 'Medical Emergency', icon: '🚑' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setEmergencyType(item.id as SOSAlert['type'])}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2 transition cursor-pointer ${
                      emergencyType === item.id
                        ? 'bg-red-600 border-red-500 text-white shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-base">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Coordinates and Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Tractor / Horse Reg *</label>
                <input
                  type="text"
                  required
                  value={truckReg}
                  onChange={(e) => setTruckReg(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono uppercase"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Callback Phone *</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono"
                />
              </div>

              <div className="sm:col-span-2 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                <span className="flex items-center gap-1 text-sky-400 font-mono">
                  <MapPin className="w-3.5 h-3.5" />
                  GPS Coords: {currentLat.toFixed(4)}, {currentLng.toFixed(4)}
                </span>
                <span className="text-emerald-400 font-bold">Accuracy: ±5 meters</span>
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Distress Notes / Highway Landmark
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Blown steer tire and broken suspension 12 km before Rutenga weighbridge, stuck on hard shoulder."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-red-500"
              />
            </div>

            {/* Emergency Hotline numbers */}
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 space-y-1">
              <div className="font-bold text-white flex items-center gap-1.5">
                <PhoneCall className="w-3.5 h-3.5 text-emerald-400" /> SADC Corridor Emergency Dispatch Numbers:
              </div>
              <p>• South Africa N1/N3 Road Assist: <strong>0800 005 600</strong></p>
              <p>• Zimbabwe Beitbridge Patrol & Recovery: <strong>+263 286 22 233</strong></p>
              <p>• Zambia Trans-Highway Rescue: <strong>+260 211 254 321</strong></p>
            </div>

            {/* Broadcast CTA */}
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs shadow-xl shadow-red-600/40 flex items-center gap-2 cursor-pointer transition"
              >
                <Radio className="w-4 h-4 animate-ping" />
                TRANSMIT LIVE DISTRESS BEACON
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h4 className="text-lg font-black text-white">SOS BEACON TRANSMITTED</h4>
              <p className="text-xs text-slate-300 mt-1 max-w-sm mx-auto leading-relaxed">
                Your emergency distress signal has been broadcasted to all logged-in truckers within 150 km and logged in the regional highway recovery dispatch ledger.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-amber-400">
              Beacon ID: {`SOS-${Date.now().toString().slice(-6)}`} · Lat: {currentLat.toFixed(4)}, Lng: {currentLng.toFixed(4)}
            </div>
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer"
            >
              Return to Cockpit
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
