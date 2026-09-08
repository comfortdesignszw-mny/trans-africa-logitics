/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Package,
  MapPin,
  Truck,
  DollarSign,
  ShieldCheck,
  Calendar,
  Phone,
  Building2,
  Navigation,
  MessageSquare,
  Copy,
  Check,
  Upload,
  Globe2,
  ChevronRight,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { LoadItem, UserProfile } from '../types';
import { ImageUploader } from './ImageUploader';
import { StorageService } from '../services/storage';

interface ConsignmentSmartWindowProps {
  load: LoadItem;
  currentUser: UserProfile;
  onClose: () => void;
  onOpenChat: (load: LoadItem) => void;
  onStartNavigation?: (load: LoadItem) => void;
  onSelectOnMap?: (load: LoadItem) => void;
  onLoadUpdated?: (load: LoadItem) => void;
}

export const ConsignmentSmartWindow: React.FC<ConsignmentSmartWindowProps> = ({
  load,
  currentUser,
  onClose,
  onOpenChat,
  onStartNavigation,
  onSelectOnMap,
  onLoadUpdated,
}) => {
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [isCopied, setIsCopied] = useState(false);
  const [photos, setPhotos] = useState<string[]>(
    load.cargoPhotos && load.cargoPhotos.length > 0
      ? load.cargoPhotos
      : [
          'https://images.unsplash.com/photo-1586528116493-a029325540fa?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=800&q=80',
        ]
  );
  const [isEditingPhotos, setIsEditingPhotos] = useState(false);

  const refId = load.referenceId || `REF-CN-${load.id.replace(/[^0-9]/g, '').slice(-4) || '8841'}`;

  const handleCopyRef = () => {
    navigator.clipboard.writeText(refId);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handlePhotosChange = (newPhotos: string[]) => {
    setPhotos(newPhotos);
    const updated = {
      ...load,
      cargoPhotos: newPhotos,
    };
    StorageService.saveLoad(updated);
    if (onLoadUpdated) onLoadUpdated(updated);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Smart Window Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 flex items-center gap-1">
                  {refId}
                  <button
                    onClick={handleCopyRef}
                    className="hover:text-amber-200 transition cursor-pointer"
                    title="Copy Consignment Reference ID"
                  >
                    {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </span>

                {load.haulType === 'domestic' ? (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Local Domestic Haul (Zero Customs)
                  </span>
                ) : (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                    Cross-Border SADC Corridor
                  </span>
                )}

                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 uppercase">
                  Status: {load.status.replace('_', ' ')}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white mt-1 line-clamp-1">{load.title}</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer shrink-0"
            title="Close window"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Smart Window Body - Scrollable */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Section 1: Cargo Photos Smart Gallery */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <span>Consignment Cargo Photos & Loading Condition</span>
                <span className="text-slate-500 font-normal">({photos.length} photos)</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsEditingPhotos(!isEditingPhotos)}
                className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 cursor-pointer font-bold"
              >
                <Upload className="w-3 h-3" />
                <span>{isEditingPhotos ? 'Done Editing' : 'Upload / Manage Photos'}</span>
              </button>
            </div>

            {isEditingPhotos ? (
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <ImageUploader
                  images={photos}
                  onChange={handlePhotosChange}
                  label="Cargo & Packaging Photos"
                  helperText="Upload photos of cargo on pallets, loading bay, or container seal."
                />
              </div>
            ) : (
              <div className="space-y-2">
                {/* Main Selected Image */}
                <div className="relative aspect-16/9 sm:aspect-21/9 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800">
                  <img
                    src={photos[activeImageIdx] || photos[0]}
                    alt="Cargo Preview"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute bottom-2 left-2 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-200 border border-slate-800">
                    Cargo Photo {activeImageIdx + 1} of {photos.length}
                  </div>
                </div>

                {/* Thumbnails */}
                {photos.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {photos.map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImageIdx(idx)}
                        className={`w-16 h-12 rounded-lg overflow-hidden border-2 transition shrink-0 cursor-pointer ${
                          activeImageIdx === idx
                            ? 'border-amber-400 ring-2 ring-amber-400/20'
                            : 'border-slate-800 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={p}
                          alt={`Thumb ${idx}`}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 2: Neatly Arranged Specs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 block">Cargo Weight</span>
              <span className="text-base font-black text-white">{load.weightTons} Metric Tons</span>
              <span className="text-[10px] text-slate-400 block">{load.volumeM3 ? `${load.volumeM3} m³ Volume` : 'Standard Volume'}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 block">Required Trailer</span>
              <span className="text-base font-black text-amber-400 capitalize">
                {load.customTruckTypeName || load.truckTypeRequired}
              </span>
              <span className="text-[10px] text-slate-400 block capitalize">{load.cargoType.replace('_', ' ')}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 block">Budget / Haul Rate</span>
              <span className="text-base font-black text-emerald-400">
                {load.currency} {load.budget.toLocaleString()}
              </span>
              <span className="text-[10px] text-emerald-300 font-semibold block flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                {load.escrowGuaranteed ? 'Escrow Guaranteed' : 'Direct Billing'}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 block">Pickup & Delivery</span>
              <span className="text-xs font-bold text-white block">{load.pickupDate}</span>
              <span className="text-[10px] text-slate-400 block">Deliver by: {load.deliveryDate}</span>
            </div>
          </div>

          {/* Section 3: Route & Corridor Details */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center justify-between">
              <span>Route & Corridor Waypoints</span>
              {onSelectOnMap && (
                <button
                  type="button"
                  onClick={() => {
                    onSelectOnMap(load);
                    onClose();
                  }}
                  className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 cursor-pointer font-bold"
                >
                  <MapPin className="w-3 h-3" />
                  <span>Inspect Route on GPS Map</span>
                </button>
              )}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0 font-bold text-xs">
                  A
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Origin Staging Depot</span>
                  <div className="text-xs font-black text-white">{load.origin.city}, {load.origin.country}</div>
                  {load.origin.landmark && (
                    <div className="text-[11px] text-slate-400 mt-0.5">{load.origin.landmark}</div>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 font-bold text-xs">
                  B
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Delivery Destination</span>
                  <div className="text-xs font-black text-white">{load.destination.city}, {load.destination.country}</div>
                  {load.destination.landmark && (
                    <div className="text-[11px] text-slate-400 mt-0.5">{load.destination.landmark}</div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
              <div>
                <span className="text-slate-500">Corridor Route: </span>
                <span className="text-slate-300 font-semibold">{load.customRouteName || load.corridor}</span>
              </div>
              <div>
                {load.haulType === 'domestic' ? (
                  <span className="text-emerald-400 font-semibold">Single-country domestic journey • No border clearance</span>
                ) : (
                  <span className="text-sky-400 font-semibold">Cross-border SADC transit • SADC COMESA permits required</span>
                )}
              </div>
            </div>
          </div>

          {/* Section 4: Cargo Details & Instructions */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Cargo Handling Instructions</h3>
            <p className="text-xs text-slate-200 leading-relaxed">
              {load.cargoDescription || 'No special handling instructions provided.'}
            </p>
            {load.specialInstructions && (
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-amber-300 font-medium">
                Note: {load.specialInstructions}
              </div>
            )}
          </div>

          {/* Section 5: Shipper Profile & Security */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 font-bold shrink-0">
                <Building2 className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-xs">{load.shipperName}</span>
                  {load.shipperVerified && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                      Verified Shipper
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400">{load.shipperCompany || 'Independent Shipper'}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={`tel:${load.shipperPhone}`}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                <span>Call Shipper</span>
              </a>
            </div>
          </div>
        </div>

        {/* Smart Window Footer Actions */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <div className="text-[11px] text-slate-400">
            Reference: <strong className="text-slate-200 font-mono">{refId}</strong> • {load.bidsCount || 0} active bids
          </div>

          <div className="flex items-center gap-2">
            {onStartNavigation && (
              <button
                type="button"
                onClick={() => {
                  onStartNavigation(load);
                  onClose();
                }}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Navigation className="w-3.5 h-3.5 text-sky-400" />
                <span>GPS Cockpit</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onOpenChat(load);
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Place Bid / Message Shipper</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
