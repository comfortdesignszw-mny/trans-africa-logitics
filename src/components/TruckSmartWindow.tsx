/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Truck,
  MapPin,
  ShieldCheck,
  Phone,
  Building2,
  Calendar,
  FileText,
  Copy,
  Check,
  Upload,
  Layers,
  Award,
} from 'lucide-react';
import { TruckListing, UserProfile } from '../types';
import { ImageUploader } from './ImageUploader';
import { DocumentUploader, UploadedDoc } from './DocumentUploader';
import { StorageService } from '../services/storage';

interface TruckSmartWindowProps {
  truck: TruckListing;
  currentUser: UserProfile;
  onClose: () => void;
  onSelectOnMap?: (truck: TruckListing) => void;
  onTruckUpdated?: (truck: TruckListing) => void;
}

export const TruckSmartWindow: React.FC<TruckSmartWindowProps> = ({
  truck,
  currentUser,
  onClose,
  onSelectOnMap,
  onTruckUpdated,
}) => {
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [isCopied, setIsCopied] = useState(false);
  const [isEditingPhotos, setIsEditingPhotos] = useState(false);
  const [isManagingDocs, setIsManagingDocs] = useState(false);

  // Photos
  const [photos, setPhotos] = useState<string[]>(
    truck.truckPhotos && truck.truckPhotos.length > 0
      ? truck.truckPhotos
      : [
          'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=800&q=80',
        ]
  );

  // Documents
  const [documents, setDocuments] = useState<UploadedDoc[]>(
    truck.documents && truck.documents.length > 0
      ? truck.documents
      : [
          {
            id: `doc-git-${truck.id}`,
            title: `Goods in Transit (GIT) Cover - $${(truck.gitInsuranceCoverageUsd || 100000).toLocaleString()}`,
            type: 'Goods in Transit (GIT) Insurance',
            url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
            uploadedAt: '2026-09-01T10:00:00Z',
            status: 'verified',
          },
          {
            id: `doc-cbrta-${truck.id}`,
            title: `Cross-Border Permit C-BRTA (${truck.truckReg})`,
            type: 'Cross-Border Road Transport Permit (C-BRTA)',
            url: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=600&q=80',
            uploadedAt: '2026-08-15T14:30:00Z',
            status: 'verified',
          },
          {
            id: `doc-cof-${truck.id}`,
            title: `Certificate of Fitness (COF) - SADC Roadworthy`,
            type: 'Certificate of Road Fitness (COF)',
            url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
            uploadedAt: '2026-07-20T08:15:00Z',
            status: 'verified',
          },
        ]
  );

  const assetRefId = truck.referenceId || `ASSET-TRK-${truck.id.replace(/[^0-9]/g, '').slice(-3) || '101'}`;

  const handleCopyRef = () => {
    navigator.clipboard.writeText(assetRefId);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handlePhotosChange = (newPhotos: string[]) => {
    setPhotos(newPhotos);
    const updated: TruckListing = {
      ...truck,
      truckPhotos: newPhotos,
    };
    StorageService.saveTruck(updated);
    if (onTruckUpdated) onTruckUpdated(updated);
  };

  const handleDocsChange = (newDocs: UploadedDoc[]) => {
    setDocuments(newDocs);
    const updated: TruckListing = {
      ...truck,
      documents: newDocs,
    };
    StorageService.saveTruck(updated);
    if (onTruckUpdated) onTruckUpdated(updated);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Smart Window Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 flex items-center gap-1">
                  {assetRefId}
                  <button
                    onClick={handleCopyRef}
                    className="hover:text-amber-200 transition cursor-pointer"
                    title="Copy Truck Asset ID"
                  >
                    {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </span>

                <span className="text-xs font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                  Plate: {truck.truckReg}
                </span>

                {truck.trailerReg && (
                  <span className="text-xs font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
                    Trailer: {truck.trailerReg}
                  </span>
                )}

                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  {truck.kycBadgeLevel || 'Verified Carrier'}
                </span>
              </div>

              <h2 className="text-base sm:text-lg font-black text-white mt-1">
                {truck.companyName || `${truck.truckerName} Logistics`}
              </h2>
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
          {/* Section 1: Truck Photos Gallery */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <span>Truck Rig & Trailer Photos</span>
                <span className="text-slate-500 font-normal">({photos.length} photos)</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsEditingPhotos(!isEditingPhotos)}
                className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 cursor-pointer font-bold"
              >
                <Upload className="w-3 h-3" />
                <span>{isEditingPhotos ? 'Done Editing' : 'Upload Truck Photos'}</span>
              </button>
            </div>

            {isEditingPhotos ? (
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <ImageUploader
                  images={photos}
                  onChange={handlePhotosChange}
                  label="Rig & Trailer Photos"
                  helperText="Upload photos showing truck cabin, trailer bed, and license disk."
                />
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative aspect-16/9 sm:aspect-21/9 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800">
                  <img
                    src={photos[activeImageIdx] || photos[0]}
                    alt="Truck Rig Preview"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute bottom-2 left-2 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-200 border border-slate-800">
                    Photo {activeImageIdx + 1} of {photos.length}
                  </div>
                </div>

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

          {/* Section 2: Technical & Capacity Specs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 block">Payload Capacity</span>
              <span className="text-base font-black text-white">{truck.capacityTons} Metric Tons</span>
              <span className="text-[10px] text-slate-400 block">{truck.volumeCapacityM3 ? `${truck.volumeCapacityM3} m³ Volume` : 'High Cube'}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 block">Trailer Spec</span>
              <span className="text-base font-black text-amber-400 capitalize">
                {truck.customTruckTypeName || truck.truckType}
              </span>
              <span className="text-[10px] text-slate-400 block">
                {truck.haulScope === 'domestic' ? 'Local Domestic Spec' : 'Cross-Border SADC Spec'}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 block">GIT Insurance Cover</span>
              <span className="text-base font-black text-emerald-400">
                ${(truck.gitInsuranceCoverageUsd || 100000).toLocaleString()} USD
              </span>
              <span className="text-[10px] text-emerald-300 font-semibold block">Underwritten Policy</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 block">Indicative Rate Quote</span>
              <span className="text-base font-black text-white">
                ${truck.rateQuoteUsdPerKm || 2.1} / km
              </span>
              <span className="text-[10px] text-slate-400 block">Available: {truck.availableDate}</span>
            </div>
          </div>

          {/* Section 3: Verified KYC & Compliance Documents */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Verified Cross-Border & Regulatory Documents</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsManagingDocs(!isManagingDocs)}
                className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 cursor-pointer font-bold"
              >
                <Upload className="w-3 h-3" />
                <span>{isManagingDocs ? 'Done Managing' : 'Upload / Add Document'}</span>
              </button>
            </div>

            {isManagingDocs ? (
              <DocumentUploader
                documents={documents}
                onChange={handleDocsChange}
                label="Manage Transporter Documents"
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-2.5"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 font-bold">
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-100 truncate">{doc.title}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{doc.type}</div>
                      <div className="text-[9px] text-emerald-400 font-semibold mt-1">Verified Authenticity</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 4: Current Staging Depot & Operating Radius */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Staging Territory & Preferred Corridors</span>
              {onSelectOnMap && (
                <button
                  type="button"
                  onClick={() => {
                    onSelectOnMap(truck);
                    onClose();
                  }}
                  className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 cursor-pointer font-bold"
                >
                  <MapPin className="w-3 h-3" />
                  <span>Inspect Staging on GPS Map</span>
                </button>
              )}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Current Staging Depot</span>
                <div className="text-xs font-black text-white mt-0.5">
                  {truck.currentLocation.city}, {truck.currentLocation.country}
                </div>
                {truck.currentLocation.landmark && (
                  <div className="text-[11px] text-slate-400 mt-0.5">{truck.currentLocation.landmark}</div>
                )}
                <div className="text-[10px] text-amber-400 mt-1 font-semibold">
                  Operating Radius: {truck.operatingRadiusKm} km from depot
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Preferred Corridor</span>
                <div className="text-xs font-bold text-slate-200 mt-0.5">
                  {truck.customRoutePreference || truck.preferredCorridor}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Completed SADC Cross-Border Trips: <strong className="text-white">{truck.completedTrips || 42} hauls</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Driver & Transporter Profile */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 font-bold shrink-0">
                <Building2 className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-xs">{truck.truckerName}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-semibold">
                    Owner-Operator
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">{truck.companyName}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={`tel:${truck.truckerPhone}`}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shadow-md shadow-amber-500/20"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Driver ({truck.truckerPhone})</span>
              </a>
            </div>
          </div>
        </div>

        {/* Smart Window Footer */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <div className="text-[11px] text-slate-400">
            Asset ID: <strong className="text-slate-200 font-mono">{assetRefId}</strong> • Available {truck.availableDate}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
