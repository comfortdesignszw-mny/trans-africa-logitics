/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Truck, MapPin, Navigation, ShieldCheck, DollarSign, Building2, Globe2, Layers } from 'lucide-react';
import { GeoLocation, RouteCorridor, SADCCountry, TruckListing, TruckType, UserProfile } from '../types';
import { SADC_CITIES } from '../data/sadcData';
import { StorageService } from '../services/storage';
import { ImageUploader } from './ImageUploader';
import { DocumentUploader, UploadedDoc } from './DocumentUploader';

interface PostTruckModalProps {
  currentUser: UserProfile;
  onClose: () => void;
  onTruckCreated: (truck: TruckListing, wasQueued: boolean) => void;
}

const SADC_COUNTRIES: SADCCountry[] = [
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

export const PostTruckModal: React.FC<PostTruckModalProps> = ({ currentUser, onClose, onTruckCreated }) => {
  const [truckReg, setTruckReg] = useState('AEZ 9921 ZW');
  const [trailerReg, setTrailerReg] = useState('TL 4001 ZW');
  const [haulScope, setHaulScope] = useState<'all' | 'domestic' | 'cross_border'>('all');
  const [truckType, setTruckType] = useState<TruckType>('flatbed');
  const [customTruckTypeName, setCustomTruckTypeName] = useState('');
  const [capacityTons, setCapacityTons] = useState<number>(34);

  // Staging Location
  const [isCustomLocation, setIsCustomLocation] = useState(false);
  const [currentCity, setCurrentCity] = useState(SADC_CITIES[3].city); // Musina / Beitbridge SA
  const [customLocationName, setCustomLocationName] = useState('');
  const [customLocationCountry, setCustomLocationCountry] = useState<SADCCountry>('Zimbabwe');
  const [customLocationLandmark, setCustomLocationLandmark] = useState('');

  const [operatingRadiusKm, setOperatingRadiusKm] = useState<number>(150);

  // Preferred Corridor / Route
  const [preferredCorridor, setPreferredCorridor] = useState<RouteCorridor>(
    'North-South Corridor (Durban - Joburg - Beitbridge - Harare - Lusaka - Lubumbashi)'
  );
  const [customRoutePreference, setCustomRoutePreference] = useState('');

  const [availableDate, setAvailableDate] = useState('2026-09-10');
  const [rateQuoteUsdPerKm, setRateQuoteUsdPerKm] = useState<number>(2.1);
  const [gitInsuranceCoverageUsd, setGitInsuranceCoverageUsd] = useState<number>(150000);
  const [hasCrossBorderPermits, setHasCrossBorderPermits] = useState(true);
  const [truckPhotos, setTruckPhotos] = useState<string[]>([]);
  const [documents, setDocuments] = useState<UploadedDoc[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!truckReg.trim() || capacityTons <= 0) return;

    let loc: GeoLocation;
    if (isCustomLocation) {
      const fallback = SADC_CITIES.find((c) => c.country === customLocationCountry) || SADC_CITIES[0];
      loc = {
        city: customLocationName.trim() || 'Custom Operating Depot',
        country: customLocationCountry,
        lat: fallback.lat + (Math.random() - 0.5) * 0.15,
        lng: fallback.lng + (Math.random() - 0.5) * 0.15,
        landmark: customLocationLandmark.trim() || undefined,
        isCustomLocation: true,
      };
    } else {
      loc = SADC_CITIES.find((c) => c.city === currentCity) || SADC_CITIES[3];
    }

    const newTruck: TruckListing = {
      id: `truck-${Date.now()}`,
      referenceId: `ASSET-TRK-${Math.floor(100 + Math.random() * 900)}`,
      truckerId: currentUser.id,
      truckerName: currentUser.fullName,
      truckerPhone: currentUser.phone,
      companyName: currentUser.companyName || `${currentUser.fullName} Transports`,
      truckReg: truckReg.trim().toUpperCase(),
      trailerReg: trailerReg.trim().toUpperCase(),
      truckType,
      customTruckTypeName: truckType === 'custom' ? customTruckTypeName.trim() || 'Custom Rigid/Specialized' : undefined,
      haulScope,
      capacityTons,
      truckPhotos,
      documents,
      currentLocation: loc,
      operatingRadiusKm,
      preferredCorridor,
      customRoutePreference: customRoutePreference.trim() || undefined,
      availableDate,
      rateQuoteUsdPerKm,
      verified: currentUser.kycStatus === 'verified',
      kycBadgeLevel: currentUser.kycBadge,
      gitInsuranceCoverageUsd,
      hasCrossBorderPermits: haulScope === 'domestic' ? false : hasCrossBorderPermits,
      rating: 4.9,
      ratingsCount: 38,
      completedTrips: 38,
      createdAt: new Date().toISOString(),
      syncStatus: StorageService.isOnline() ? 'synced' : 'queued_offline',
    };

    const { truck, wasQueued } = StorageService.saveTruck(newTruck);
    onTruckCreated(truck, wasQueued);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-slate-100 my-auto animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Post Truck Capacity / Availability</h3>
              <p className="text-xs text-slate-400">Truckers & Fleet Owners · Local & Cross-Border Freight</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 max-h-[82vh] overflow-y-auto">
          {/* HAUL SCOPE */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Haulage Scope & Operations *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setHaulScope('domestic')}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col gap-0.5 ${
                  haulScope === 'domestic'
                    ? 'bg-emerald-950/50 border-emerald-500 text-emerald-300 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span className="font-bold text-xs flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                  Local Domestic Only
                </span>
                <span className="text-[10px] text-slate-400">Intra-country transport (no cross-border permits needed)</span>
              </button>

              <button
                type="button"
                onClick={() => setHaulScope('cross_border')}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col gap-0.5 ${
                  haulScope === 'cross_border'
                    ? 'bg-amber-950/50 border-amber-500 text-amber-300 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span className="font-bold text-xs flex items-center gap-1">
                  <Globe2 className="w-3.5 h-3.5 text-amber-400" />
                  Cross-Border Only
                </span>
                <span className="text-[10px] text-slate-400">International corridors (SADC permits & customs active)</span>
              </button>

              <button
                type="button"
                onClick={() => setHaulScope('all')}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col gap-0.5 ${
                  haulScope === 'all'
                    ? 'bg-sky-950/50 border-sky-500 text-sky-300 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span className="font-bold text-xs flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-sky-400" />
                  Both Local & Cross-Border
                </span>
                <span className="text-[10px] text-slate-400">Available for any matching consignment</span>
              </button>
            </div>
          </div>

          {/* Truck Reg & Trailer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Horse / Tractor Unit Reg *
              </label>
              <input
                type="text"
                required
                value={truckReg}
                onChange={(e) => setTruckReg(e.target.value)}
                placeholder="e.g. AEZ 4419 ZW or CA 991-204"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-white font-mono uppercase focus:outline-hidden focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Trailer Registration (Optional)
              </label>
              <input
                type="text"
                value={trailerReg}
                onChange={(e) => setTrailerReg(e.target.value)}
                placeholder="e.g. TL 8829 ZW"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-white font-mono uppercase focus:outline-hidden focus:border-sky-500"
              />
            </div>
          </div>

          {/* Truck Type & Capacity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Trailer Configuration *</label>
              <select
                value={truckType}
                onChange={(e) => setTruckType(e.target.value as TruckType)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-white capitalize"
              >
                <option value="flatbed">Flatbed (Tri-Axle / Superlink)</option>
                <option value="tautliner">Tautliner (Curtainsider)</option>
                <option value="refrigerated">Refrigerated (Reefer)</option>
                <option value="tanker">Bulk Liquid Tanker</option>
                <option value="container_skeletal">Container Skeletal Trailer</option>
                <option value="side_tipper">Side Tipper (Bulk Ore)</option>
                <option value="lowbed">Lowbed (Abnormal / Heavy)</option>
                <option value="custom">Custom / Specialized Truck Type...</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Payload Capacity (Tons) *</label>
              <input
                type="number"
                min="1"
                max="80"
                required
                value={capacityTons}
                onChange={(e) => setCapacityTons(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-white font-bold"
              />
            </div>
          </div>

          {/* Custom Truck Type Input */}
          {truckType === 'custom' && (
            <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/30">
              <label className="block text-xs font-bold text-sky-300 mb-1">
                Describe Your Custom Truck / Rig Type *
              </label>
              <input
                type="text"
                required
                value={customTruckTypeName}
                onChange={(e) => setCustomTruckTypeName(e.target.value)}
                placeholder="e.g. 14-Ton Dropside Tri-Axle with Canvas, B-Double Side Loader, 60T Crane Carrier"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-sky-500/50 text-xs text-white placeholder:text-slate-500"
              />
            </div>
          )}

          {/* Current Staging / Depot Location with Custom Support */}
          <div className="space-y-2 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-sky-400" /> Current Staging / Depot Location *
              </label>
              <button
                type="button"
                onClick={() => setIsCustomLocation(!isCustomLocation)}
                className="text-[10px] text-sky-400 hover:underline font-bold"
              >
                {isCustomLocation ? 'Choose Preset City' : '+ Enter Custom Depot / Town'}
              </button>
            </div>

            {!isCustomLocation ? (
              <select
                value={currentCity}
                onChange={(e) => setCurrentCity(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white"
              >
                {SADC_CITIES.map((c) => (
                  <option key={c.city} value={c.city}>
                    {c.city} ({c.country})
                  </option>
                ))}
              </select>
            ) : (
              <div className="space-y-1.5">
                <input
                  type="text"
                  required
                  value={customLocationName}
                  onChange={(e) => setCustomLocationName(e.target.value)}
                  placeholder="Custom depot or staging town (e.g. Belmont Depot Bulawayo)"
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                />
                <div className="grid grid-cols-2 gap-1.5">
                  <select
                    value={customLocationCountry}
                    onChange={(e) => setCustomLocationCountry(e.target.value as SADCCountry)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                  >
                    {SADC_COUNTRIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={customLocationLandmark}
                    onChange={(e) => setCustomLocationLandmark(e.target.value)}
                    placeholder="Landmark / Yard name"
                    className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Preferred Corridor & Custom Route Preference */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <Navigation className="w-3.5 h-3.5 text-amber-400" /> Preferred Operating Corridor / Route
            </label>
            <select
              value={preferredCorridor}
              onChange={(e) => setPreferredCorridor(e.target.value as RouteCorridor)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white mb-2"
            >
              <option value="Domestic / Local Intra-Country Route">
                Domestic / Local Intra-Country Route (Internal Highways Only)
              </option>
              <option value="North-South Corridor (Durban - Joburg - Beitbridge - Harare - Lusaka - Lubumbashi)">
                North-South Corridor (Durban - Joburg - Beitbridge - Harare - Lusaka)
              </option>
              <option value="Trans-Kalahari Corridor (Walvis Bay - Windhoek - Buitepos - Gaborone - Joburg)">
                Trans-Kalahari Corridor (Walvis Bay - Windhoek - Buitepos - Gaborone)
              </option>
              <option value="Beira Corridor (Beira - Machipanda - Mutare - Harare)">
                Beira Corridor (Beira - Machipanda - Mutare - Harare)
              </option>
              <option value="Maputo Corridor (Maputo - Lebombo - Nelspruit - Joburg)">
                Maputo Corridor (Maputo - Lebombo - Nelspruit - Joburg)
              </option>
              <option value="Kazungula Corridor (Gaborone - Francistown - Kazungula - Livingstone)">
                Kazungula Corridor (Botswana - Zambia Bridge)
              </option>
              <option value="Custom Route">Custom Highway / Local Circuit</option>
              <option value="Any / Regional SADC Corridor">Any Regional Corridor</option>
            </select>

            {(preferredCorridor === 'Custom Route' || preferredCorridor === 'Domestic / Local Intra-Country Route') && (
              <input
                type="text"
                value={customRoutePreference}
                onChange={(e) => setCustomRoutePreference(e.target.value)}
                placeholder="Custom route preference (e.g. Harare - Bulawayo - Gweru circuit, or N3 Joburg - Durban)"
                className="w-full px-3.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
              />
            )}
          </div>

          {/* Available Date & Indicative Rate */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Available Ready Date *</label>
              <input
                type="date"
                required
                value={availableDate}
                onChange={(e) => setAvailableDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Indicative Rate (USD / km)
              </label>
              <input
                type="number"
                step="0.05"
                min="0.5"
                value={rateQuoteUsdPerKm}
                onChange={(e) => setRateQuoteUsdPerKm(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-white font-bold"
              />
            </div>
          </div>

          {/* Compliance & GIT */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Transporter Compliance & GIT
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Goods-in-Transit (GIT) Cover ($ USD)</label>
                <input
                  type="number"
                  step="10000"
                  value={gitInsuranceCoverageUsd}
                  onChange={(e) => setGitInsuranceCoverageUsd(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-semibold"
                />
              </div>

              {haulScope !== 'domestic' && (
                <div className="flex items-center gap-2 pt-4">
                  <input
                    type="checkbox"
                    id="chk-permits"
                    checked={hasCrossBorderPermits}
                    onChange={(e) => setHasCrossBorderPermits(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                  />
                  <label htmlFor="chk-permits" className="text-slate-300 text-xs font-medium cursor-pointer">
                    Valid SADC Cross-Border Permit active
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Truck Rig Photos */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
            <ImageUploader
              images={truckPhotos}
              onChange={setTruckPhotos}
              label="Truck Rig & Trailer Photos"
              helperText="Upload photos of cabin, trailer, and license disk (Max 6)."
            />
          </div>

          {/* KYC & Compliance Verification Documents */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
            <DocumentUploader
              documents={documents}
              onChange={setDocuments}
              label="KYC & Transporter Verification Documents"
            />
          </div>

          {/* Footer Submit */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              {StorageService.isOnline() ? (
                <span className="text-emerald-400">● Live sync ready</span>
              ) : (
                <span className="text-amber-400">● Will queue locally & sync when online</span>
              )}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shadow-md shadow-sky-500/20 transition cursor-pointer"
              >
                Broadcast Truck Capacity
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
