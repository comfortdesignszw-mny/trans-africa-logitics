/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  Clock,
  Truck,
  ShieldCheck,
  FileCheck,
  MapPin,
  Send,
  AlertCircle
} from 'lucide-react';
import { LoadItem, LoadStatus, UserProfile } from '../types';
import { StorageService } from '../services/storage';

interface TripTrackingModalProps {
  load: LoadItem;
  currentUser: UserProfile;
  onClose: () => void;
  onLoadUpdated: (load: LoadItem) => void;
}

const STAGES: { key: LoadStatus; label: string; desc: string }[] = [
  { key: 'open', label: 'Consignment Posted', desc: 'Awaiting trucker bid or acceptance' },
  { key: 'matched', label: 'Matched & Booked', desc: 'Truck assigned & loading scheduled' },
  { key: 'in_transit', label: 'In Transit on Corridor', desc: 'Driver dispatched & cargo en route' },
  { key: 'border_clearance', label: 'Customs & Border Crossing', desc: 'Inspection, toll payment & bond clearance' },
  { key: 'delivered', label: 'Delivered (POD Signed)', desc: 'Consignee received & signed off' },
];

export const TripTrackingModal: React.FC<TripTrackingModalProps> = ({
  load,
  currentUser,
  onClose,
  onLoadUpdated,
}) => {
  const [currentStatus, setCurrentStatus] = useState<LoadStatus>(load.status);
  const [statusNote, setStatusNote] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const getStageIndex = (status: LoadStatus) => {
    return STAGES.findIndex((s) => s.key === status);
  };

  const currentIdx = getStageIndex(currentStatus);

  const handleAdvanceStatus = (nextStatus: LoadStatus) => {
    setIsUpdating(true);
    const updated = StorageService.updateLoadStatus(
      load.id,
      nextStatus,
      load.assignedTruckerId || currentUser.id,
      load.assignedTruckerName || currentUser.fullName
    );

    if (updated) {
      setCurrentStatus(nextStatus);
      onLoadUpdated(updated);
    }
    setIsUpdating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-5">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-slate-100 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
              Cross-Border Trip Milestone Tracker
            </span>
            <h3 className="font-bold text-base text-white line-clamp-1">{load.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Corridor & Route Summary */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">Route Corridors</span>
              <p className="font-bold text-white">
                {load.origin.city} ({load.origin.country}) &rarr; {load.destination.city} ({load.destination.country})
              </p>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block mb-0.5">Freight Rate</span>
              <p className="font-extrabold text-amber-400">
                {load.currency} {load.budget.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Stepper Timeline */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Corridor Progress Milestones
            </h4>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
              {STAGES.map((stg, idx) => {
                const isPassed = idx < currentIdx;
                const isCurrent = idx === currentIdx;

                return (
                  <div key={stg.key} className="relative group">
                    {/* Circle Node */}
                    <div
                      className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center transition ${
                        isPassed
                          ? 'bg-emerald-500 text-slate-950'
                          : isCurrent
                          ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-500/20'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {isPassed ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <span className="text-[10px] font-bold">{idx + 1}</span>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h5
                          className={`text-xs sm:text-sm font-bold ${
                            isCurrent
                              ? 'text-amber-300'
                              : isPassed
                              ? 'text-emerald-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {stg.label}
                        </h5>
                        <p className="text-xs text-slate-400">{stg.desc}</p>
                      </div>

                      {/* Action trigger button */}
                      {idx === currentIdx + 1 && (
                        <button
                          onClick={() => handleAdvanceStatus(stg.key)}
                          disabled={isUpdating}
                          className="self-start sm:self-auto px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition cursor-pointer shadow-xs whitespace-nowrap"
                        >
                          Mark as {stg.label.split(' ')[0]}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Proof of Delivery (POD) Simulation when delivered */}
          {currentStatus === 'delivered' && (
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-600/50 text-emerald-200 text-xs space-y-2 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 font-bold text-emerald-300">
                <FileCheck className="w-4 h-4" />
                <span>Consignment Successfully Delivered (POD Approved)</span>
              </div>
              <p className="text-[11px] opacity-80">
                Goods verified and signed for at {load.destination.city}. Invoicing released for automated payment settlement.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
