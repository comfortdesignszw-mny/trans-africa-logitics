/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  Package,
  Calendar,
  DollarSign,
  AlertTriangle,
  ShieldCheck,
  Navigation,
  Truck,
  Building2,
  CheckCircle2,
  Lock,
  Globe2,
  FileCheck2,
} from 'lucide-react';
import {
  CargoType,
  CurrencyCode,
  GeoLocation,
  HaulType,
  LoadItem,
  RouteCorridor,
  SADCCountry,
  TruckType,
  UserProfile,
} from '../types';
import { SADC_CITIES } from '../data/sadcData';
import { StorageService } from '../services/storage';
import { ImageUploader } from './ImageUploader';

interface PostLoadModalProps {
  currentUser: UserProfile;
  onClose: () => void;
  onLoadCreated: (load: LoadItem, wasQueued: boolean) => void;
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

export const PostLoadModal: React.FC<PostLoadModalProps> = ({ currentUser, onClose, onLoadCreated }) => {
  const [title, setTitle] = useState('');
  const [haulType, setHaulType] = useState<HaulType>('cross_border');

  // Origin
  const [isCustomOrigin, setIsCustomOrigin] = useState(false);
  const [originCity, setOriginCity] = useState(SADC_CITIES[0].city);
  const [customOriginName, setCustomOriginName] = useState('');
  const [customOriginCountry, setCustomOriginCountry] = useState<SADCCountry>('South Africa');
  const [customOriginLandmark, setCustomOriginLandmark] = useState('');

  // Destination
  const [isCustomDestination, setIsCustomDestination] = useState(false);
  const [destinationCity, setDestinationCity] = useState(SADC_CITIES[4].city);
  const [customDestinationName, setCustomDestinationName] = useState('');
  const [customDestinationCountry, setCustomDestinationCountry] = useState<SADCCountry>('Zimbabwe');
  const [customDestinationLandmark, setCustomDestinationLandmark] = useState('');

  // Route Corridor
  const [corridor, setCorridor] = useState<RouteCorridor>(
    'North-South Corridor (Durban - Joburg - Beitbridge - Harare - Lusaka - Lubumbashi)'
  );
  const [customRouteName, setCustomRouteName] = useState('');

  // Cargo & Truck
  const [cargoType, setCargoType] = useState<CargoType>('mining_minerals');
  const [cargoDescription, setCargoDescription] = useState('');
  const [weightTons, setWeightTons] = useState<number>(30);
  const [volumeM3, setVolumeM3] = useState<number>(45);
  const [truckTypeRequired, setTruckTypeRequired] = useState<TruckType>('flatbed');
  const [customTruckTypeName, setCustomTruckTypeName] = useState('');

  // Timeline & Budget
  const [pickupDate, setPickupDate] = useState('2026-09-12');
  const [deliveryDate, setDeliveryDate] = useState('2026-09-17');
  const [budget, setBudget] = useState<number>(4500);
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [cargoPhotos, setCargoPhotos] = useState<string[]>([]);

  // Security & Trust features
  const [mandatoryKycRequired, setMandatoryKycRequired] = useState(false);
  const [escrowGuaranteed, setEscrowGuaranteed] = useState(true);

  // Auto-detect domestic haul if origin and destination countries match
  useEffect(() => {
    const originCountry = isCustomOrigin
      ? customOriginCountry
      : SADC_CITIES.find((c) => c.city === originCity)?.country || 'South Africa';
    const destCountry = isCustomDestination
      ? customDestinationCountry
      : SADC_CITIES.find((c) => c.city === destinationCity)?.country || 'Zimbabwe';

    if (originCountry === destCountry) {
      setHaulType('domestic');
      if (corridor !== 'Custom Route') {
        setCorridor('Domestic / Local Intra-Country Route');
      }
    }
  }, [originCity, destinationCity, isCustomOrigin, isCustomDestination, customOriginCountry, customDestinationCountry]);

  const handleCaptureCurrentGPS = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsCustomOrigin(true);
          setCustomOriginName(`GPS Point: ${pos.coords.latitude.toFixed(3)}, ${pos.coords.longitude.toFixed(3)}`);
          setCustomOriginLandmark('Live GPS captured coordinates');
        },
        () => {
          alert('GPS location permission denied or unavailable.');
        }
      );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || weightTons <= 0 || budget <= 0) return;

    let originLoc: GeoLocation;
    if (isCustomOrigin) {
      // Approximate coords from country baseline or SADC city
      const fallback = SADC_CITIES.find((c) => c.country === customOriginCountry) || SADC_CITIES[0];
      originLoc = {
        city: customOriginName.trim() || 'Custom Origin Facility',
        country: customOriginCountry,
        lat: fallback.lat + (Math.random() - 0.5) * 0.15,
        lng: fallback.lng + (Math.random() - 0.5) * 0.15,
        landmark: customOriginLandmark.trim() || undefined,
        isCustomLocation: true,
      };
    } else {
      originLoc = SADC_CITIES.find((c) => c.city === originCity) || SADC_CITIES[0];
    }

    let destLoc: GeoLocation;
    if (isCustomDestination) {
      const fallback = SADC_CITIES.find((c) => c.country === customDestinationCountry) || SADC_CITIES[1];
      destLoc = {
        city: customDestinationName.trim() || 'Custom Destination Site',
        country: customDestinationCountry,
        lat: fallback.lat + (Math.random() - 0.5) * 0.15,
        lng: fallback.lng + (Math.random() - 0.5) * 0.15,
        landmark: customDestinationLandmark.trim() || undefined,
        isCustomLocation: true,
      };
    } else {
      destLoc = SADC_CITIES.find((c) => c.city === destinationCity) || SADC_CITIES[4];
    }

    const newLoad: LoadItem = {
      id: `load-${Date.now()}`,
      referenceId: `REF-CN-${Math.floor(1000 + Math.random() * 9000)}`,
      title: title.trim(),
      shipperId: currentUser.id,
      shipperName: currentUser.fullName,
      shipperCompany: currentUser.companyName,
      shipperPhone: currentUser.phone,
      shipperVerified: currentUser.kycStatus === 'verified',
      haulType,
      origin: originLoc,
      destination: destLoc,
      corridor,
      customRouteName: customRouteName.trim() || undefined,
      cargoType,
      cargoPhotos,
      cargoDescription:
        cargoDescription.trim() ||
        `${weightTons} tons of ${cargoType.replace('_', ' ')} (${haulType === 'domestic' ? 'Local Domestic' : 'Cross-Border'})`,
      weightTons,
      volumeM3,
      truckTypeRequired,
      customTruckTypeName: truckTypeRequired === 'custom' ? customTruckTypeName.trim() || 'Specialized Custom Trailer' : undefined,
      pickupDate,
      deliveryDate,
      budget,
      currency,
      rateType: 'lump_sum',
      status: 'open',
      bidsCount: 0,
      specialInstructions: specialInstructions.trim(),
      mandatoryKycRequired,
      escrowGuaranteed,
      shipperRating: 4.9,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncStatus: StorageService.isOnline() ? 'synced' : 'queued_offline',
    };

    const { load, wasQueued } = StorageService.saveLoad(newLoad);
    onLoadCreated(load, wasQueued);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-slate-100 my-auto animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Post Freight Consignment</h3>
              <p className="text-xs text-slate-400">Local Intra-Country & Cross-Border SADC Logistics</p>
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
          {/* HAUL TYPE SELECTION */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Transport Classification *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setHaulType('domestic')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col gap-1 ${
                  haulType === 'domestic'
                    ? 'bg-emerald-950/50 border-emerald-500 text-emerald-300 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                    Local / Domestic Haul
                  </span>
                  {haulType === 'domestic' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
                <p className="text-[11px] text-slate-300">
                  Intra-country. No border posts, zero customs papers, simple local waybill.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setHaulType('cross_border')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col gap-1 ${
                  haulType === 'cross_border'
                    ? 'bg-amber-950/50 border-amber-500 text-amber-300 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs flex items-center gap-1.5">
                    <Globe2 className="w-3.5 h-3.5 text-amber-400" />
                    Cross-Border Transit
                  </span>
                  {haulType === 'cross_border' && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />}
                </div>
                <p className="text-[11px] text-slate-300">
                  Transits international borders (OSBP, SADC permits, customs clearance).
                </p>
              </button>
            </div>

            {haulType === 'domestic' && (
              <div className="mt-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                <span>
                  <strong>Domestic Haulage Selected:</strong> Border checkpoints, customs duties, and SADC cross-border permits will be bypassed on this shipment.
                </span>
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Consignment Title / Cargo Summary *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 30 Tons Domestic Maize Bulawayo, or 34T Copper Cathodes Export"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-white focus:outline-hidden focus:border-amber-500"
            />
          </div>

          {/* ORIGIN & DESTINATION WITH CUSTOM INPUT SUPPORT */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            {/* Origin (Pickup) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Origin (Pickup Point) *
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCaptureCurrentGPS}
                    className="text-[10px] text-amber-400 hover:underline font-bold"
                  >
                    GPS
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCustomOrigin(!isCustomOrigin)}
                    className="text-[10px] text-sky-400 hover:underline font-bold"
                  >
                    {isCustomOrigin ? 'Preset City' : '+ Custom Place'}
                  </button>
                </div>
              </div>

              {!isCustomOrigin ? (
                <select
                  value={originCity}
                  onChange={(e) => setOriginCity(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
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
                    value={customOriginName}
                    onChange={(e) => setCustomOriginName(e.target.value)}
                    placeholder="Custom location (e.g. Hwange Colliery Gate 3)"
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                  />
                  <div className="grid grid-cols-2 gap-1.5">
                    <select
                      value={customOriginCountry}
                      onChange={(e) => setCustomOriginCountry(e.target.value as SADCCountry)}
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
                      value={customOriginLandmark}
                      onChange={(e) => setCustomOriginLandmark(e.target.value)}
                      placeholder="Depot/Landmark"
                      className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Destination (Drop-off) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-red-400" /> Destination (Drop-off Point) *
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomDestination(!isCustomDestination)}
                  className="text-[10px] text-sky-400 hover:underline font-bold"
                >
                  {isCustomDestination ? 'Preset City' : '+ Custom Place'}
                </button>
              </div>

              {!isCustomDestination ? (
                <select
                  value={destinationCity}
                  onChange={(e) => setDestinationCity(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
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
                    value={customDestinationName}
                    onChange={(e) => setCustomDestinationName(e.target.value)}
                    placeholder="Custom destination (e.g. Belmont Mill Bulawayo)"
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                  />
                  <div className="grid grid-cols-2 gap-1.5">
                    <select
                      value={customDestinationCountry}
                      onChange={(e) => setCustomDestinationCountry(e.target.value as SADCCountry)}
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
                      value={customDestinationLandmark}
                      onChange={(e) => setCustomDestinationLandmark(e.target.value)}
                      placeholder="Depot/Terminal"
                      className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ROUTE CORRIDOR & CUSTOM ROUTE */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <Navigation className="w-3.5 h-3.5 text-amber-400" /> Route Corridor / Transit Highway
            </label>
            <select
              value={corridor}
              onChange={(e) => setCorridor(e.target.value as RouteCorridor)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white mb-2"
            >
              <option value="Domestic / Local Intra-Country Route">
                Domestic / Local Intra-Country Route (Single Country Internal)
              </option>
              <option value="North-South Corridor (Durban - Joburg - Beitbridge - Harare - Lusaka - Lubumbashi)">
                North-South Corridor (Durban - Joburg - Beitbridge - Harare - Lusaka)
              </option>
              <option value="Trans-Kalahari Corridor (Walvis Bay - Windhoek - Buitepos - Gaborone - Joburg)">
                Trans-Kalahari Corridor (Walvis Bay - Windhoek - Gaborone - Joburg)
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
              <option value="Dar es Salaam Corridor (Dar es Salaam - Mbeya - Nakonde - Lusaka)">
                Dar es Salaam Corridor (Tanzania - Zambia)
              </option>
              <option value="Custom Route">Custom Highway / Specific Road Waybill</option>
              <option value="Any / Regional SADC Corridor">Any / Other Regional SADC Corridor</option>
            </select>

            {(corridor === 'Custom Route' || corridor === 'Domestic / Local Intra-Country Route') && (
              <input
                type="text"
                value={customRouteName}
                onChange={(e) => setCustomRouteName(e.target.value)}
                placeholder="Enter custom route / highway (e.g. A5 Harare - Bulawayo, or N1 Joburg - Musina)"
                className="w-full px-3.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
              />
            )}
          </div>

          {/* CARGO CATEGORY & TRUCK TYPE WITH CUSTOM TRUCK SUPPORT */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Cargo Category *</label>
              <select
                value={cargoType}
                onChange={(e) => setCargoType(e.target.value as CargoType)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white capitalize"
              >
                <option value="agricultural_produce">Agricultural Produce, Maize & Grain</option>
                <option value="mining_minerals">Mining & Minerals (Copper, Chrome, Coal)</option>
                <option value="fmcg_retail">FMCG & Packaged Retail Goods</option>
                <option value="machinery_equipment">Heavy Machinery & Equipment</option>
                <option value="fuel_chemicals">Fuel & Industrial Chemicals</option>
                <option value="perishables_cold">Perishables & Cold Chain</option>
                <option value="timber_construction">Timber & Construction Materials</option>
                <option value="general_breakbulk">General Breakbulk Cargo</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-amber-400" /> Required Truck Configuration *
              </label>
              <select
                value={truckTypeRequired}
                onChange={(e) => setTruckTypeRequired(e.target.value as TruckType)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white capitalize"
              >
                <option value="flatbed">Flatbed (Tri-Axle / Superlink)</option>
                <option value="tautliner">Tautliner (Curtainsider)</option>
                <option value="refrigerated">Refrigerated (Reefer / Chilled)</option>
                <option value="tanker">Bulk Liquid Tanker (Hazchem / Fuel)</option>
                <option value="container_skeletal">Container Skeletal Trailer</option>
                <option value="side_tipper">Side Tipper (Bulk Ore/Minerals)</option>
                <option value="lowbed">Lowbed (Abnormal / Heavy Haul)</option>
                <option value="custom">Custom / Other Truck Type...</option>
              </select>
            </div>
          </div>

          {/* CUSTOM TRUCK TYPE NAME INPUT */}
          {truckTypeRequired === 'custom' && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <label className="block text-xs font-bold text-amber-300 mb-1">
                Specify Custom Truck Configuration *
              </label>
              <input
                type="text"
                required
                value={customTruckTypeName}
                onChange={(e) => setCustomTruckTypeName(e.target.value)}
                placeholder="e.g. 14-Ton Dropside Rigid, B-Double Side Loader, 65T Heavy Crane Carrier"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-amber-500/50 text-xs text-white placeholder:text-slate-500"
              />
            </div>
          )}

          {/* Weight & Volume */}
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Gross Weight (Tons) *</label>
              <input
                type="number"
                min="1"
                max="80"
                required
                value={weightTons}
                onChange={(e) => setWeightTons(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-white font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Estimated Volume (m³)</label>
              <input
                type="number"
                min="1"
                max="140"
                value={volumeM3}
                onChange={(e) => setVolumeM3(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-white"
              />
            </div>
          </div>

          {/* Timeline & Budget */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-400" /> Pickup Date Timeline *
              </label>
              <input
                type="date"
                required
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Freight Budget Offer *
              </label>
              <div className="flex gap-2">
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                  className="px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-bold"
                >
                  <option value="USD">USD ($)</option>
                  <option value="ZAR">ZAR (R)</option>
                  <option value="ZMW">ZMW (K)</option>
                  <option value="BWP">BWP (P)</option>
                  <option value="TZS">TZS</option>
                  <option value="MZN">MZN</option>
                </select>
                <input
                  type="number"
                  required
                  min="50"
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-white font-extrabold text-emerald-400"
                />
              </div>
            </div>
          </div>

          {/* SECURITY & TRUST CONTROLS (Ratings, Mandatory KYC, Guaranteed Escrow) */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Guaranteed Job & Security Preferences
            </h4>

            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400" />
                <div>
                  <p className="text-xs font-semibold text-white">Mandatory KYC Required</p>
                  <p className="text-[10px] text-slate-400">Only verified truckers with approved KYC can bid</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={mandatoryKycRequired}
                onChange={(e) => setMandatoryKycRequired(e.target.checked)}
                className="w-4 h-4 rounded-sm accent-amber-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <div>
                  <p className="text-xs font-semibold text-white">Guaranteed Escrow Payment</p>
                  <p className="text-[10px] text-slate-400">Funds held in Trans-Africa escrow for guaranteed trucker payout upon delivery</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={escrowGuaranteed}
                onChange={(e) => setEscrowGuaranteed(e.target.checked)}
                className="w-4 h-4 rounded-sm accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Cargo Photos Upload */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
            <ImageUploader
              images={cargoPhotos}
              onChange={setCargoPhotos}
              label="Consignment & Cargo Photos"
              helperText="Upload photos of cargo on pallets, loading bay, or container seal (Max 6)."
            />
          </div>

          {/* Special Instructions */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Handling, Delivery or Offload Notes
            </label>
            <textarea
              rows={2}
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="e.g. Fast offloading at destination depot, driver must carry steel toe boots and high-vis vest, tarpaulin required."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-amber-500"
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
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition cursor-pointer"
              >
                Publish Freight Consignment
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
