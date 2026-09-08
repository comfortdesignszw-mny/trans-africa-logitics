/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'shipper' | 'trucker' | 'fleet_manager' | 'admin';

export type HaulType = 'domestic' | 'cross_border';

export type TruckType =
  | 'flatbed'
  | 'tautliner'
  | 'refrigerated'
  | 'tanker'
  | 'container_skeletal'
  | 'side_tipper'
  | 'lowbed'
  | 'custom';

export type CargoType =
  | 'mining_minerals'
  | 'agricultural_produce'
  | 'fmcg_retail'
  | 'machinery_equipment'
  | 'fuel_chemicals'
  | 'timber_construction'
  | 'general_breakbulk'
  | 'perishables_cold';

export type CurrencyCode = 'USD' | 'ZAR' | 'ZMW' | 'BWP' | 'TZS' | 'MZN';

export type SADCCountry =
  | 'South Africa'
  | 'Zimbabwe'
  | 'Zambia'
  | 'Botswana'
  | 'Namibia'
  | 'Mozambique'
  | 'Malawi'
  | 'Tanzania'
  | 'DR Congo';

export type RouteCorridor =
  | 'North-South Corridor (Durban - Joburg - Beitbridge - Harare - Lusaka - Lubumbashi)'
  | 'Trans-Kalahari Corridor (Walvis Bay - Windhoek - Buitepos - Gaborone - Joburg)'
  | 'Dar es Salaam Corridor (Dar es Salaam - Mbeya - Nakonde - Lusaka)'
  | 'Beira Corridor (Beira - Machipanda - Mutare - Harare)'
  | 'Maputo Corridor (Maputo - Lebombo - Nelspruit - Joburg)'
  | 'Kazungula Corridor (Gaborone - Francistown - Kazungula - Livingstone)'
  | 'Nacala Corridor (Nacala - Nampula - Cuamba - Blantyre - Lilongwe)'
  | 'Domestic / Local Intra-Country Route'
  | 'Any / Regional SADC Corridor'
  | 'Custom Route';

export type LoadStatus =
  | 'open'
  | 'matched'
  | 'in_transit'
  | 'border_clearance'
  | 'delivered'
  | 'cancelled';

export interface GeoLocation {
  city: string;
  country: SADCCountry;
  lat: number;
  lng: number;
  landmark?: string;
  isCustomLocation?: boolean;
}

export interface LiveTelemetry {
  currentLat: number;
  currentLng: number;
  speedKmh: number;
  headingDeg: number;
  lastPingTime: string;
  batteryPct: number;
  signalQuality: 'strong' | 'moderate' | 'weak' | 'offline';
  routeProgressPct: number;
  nearestTown: string;
  etaMinutes: number;
}

export interface LoadItem {
  id: string;
  title: string;
  shipperId: string;
  shipperName: string;
  shipperCompany: string;
  shipperPhone: string;
  shipperVerified: boolean;
  haulType: HaulType; // 'domestic' (no customs/border papers) or 'cross_border'
  origin: GeoLocation;
  destination: GeoLocation;
  corridor: RouteCorridor;
  customRouteName?: string;
  cargoType: CargoType;
  cargoDescription: string;
  weightTons: number;
  volumeM3?: number;
  truckTypeRequired: TruckType;
  customTruckTypeName?: string;
  pickupDate: string;
  deliveryDate: string;
  budget: number;
  currency: CurrencyCode;
  rateType: 'lump_sum' | 'per_ton';
  status: LoadStatus;
  assignedTruckerId?: string;
  assignedTruckerName?: string;
  bidsCount: number;
  highestBid?: number;
  lowestBid?: number;
  specialInstructions?: string;
  mandatoryKycRequired?: boolean; // True if shipper requires verified KYC trucker
  escrowGuaranteed?: boolean; // Guaranteed payment held in escrow
  shipperRating?: number;
  truckerRating?: number;
  referenceId?: string;
  cargoPhotos?: string[];
  documents?: { id: string; title: string; type: string; url: string; uploadedAt: string }[];
  telemetry?: LiveTelemetry;
  createdAt: string;
  updatedAt: string;
  syncStatus: 'synced' | 'queued_offline';
}

export interface TruckListing {
  id: string;
  referenceId?: string;
  truckerId: string;
  truckerName: string;
  truckerPhone: string;
  companyName: string;
  truckReg: string;
  trailerReg?: string;
  truckType: TruckType;
  customTruckTypeName?: string;
  haulScope?: 'all' | 'domestic' | 'cross_border';
  capacityTons: number;
  volumeCapacityM3?: number;
  currentLocation: GeoLocation;
  operatingRadiusKm: number;
  preferredCorridor: RouteCorridor;
  customRoutePreference?: string;
  availableDate: string;
  rateQuoteUsdPerKm?: number;
  verified: boolean;
  kycBadgeLevel: 'Unverified' | 'Silver Verified' | 'Gold Corridor Transporter';
  gitInsuranceCoverageUsd: number;
  hasCrossBorderPermits: boolean;
  truckPhotos?: string[];
  documents?: { id: string; title: string; type: string; url: string; uploadedAt: string; status?: 'verified' | 'pending' }[];
  rating: number;
  ratingsCount?: number;
  completedTrips: number;
  createdAt: string;
  syncStatus: 'synced' | 'queued_offline';
}

export interface UserReview {
  id: string;
  loadId?: string;
  loadTitle?: string;
  reviewerId: string;
  reviewerName: string;
  reviewerRole: UserRole;
  targetUserId: string;
  targetUserName: string;
  targetUserRole?: 'trucker' | 'shipper';
  rating: number; // 1 - 5
  feedback?: string;
  comment?: string;
  categoryRatings?: {
    punctuality?: number;
    cargoCare?: number;
    cargoHandling?: number;
    communication?: number;
    paymentPromptness?: number;
  };
  categoryScores?: {
    punctuality: number;
    cargoCare: number;
    communication: number;
    paymentPromptness?: number;
  };
  verifiedHaul?: boolean;
  createdAt: string;
}

export interface SOSAlert {
  id: string;
  loadId?: string;
  userId?: string;
  userName?: string;
  userPhone?: string;
  truckerId?: string;
  truckerName?: string;
  truckReg: string;
  phone?: string;
  type?: 'mechanical' | 'medical' | 'accident' | 'security_hijack' | 'weather_blocked' | string;
  emergencyType?: 'breakdown' | 'medical' | 'hijack_threat' | 'accident' | 'weather_blocked' | string;
  lat?: number;
  lng?: number;
  coords?: { lat: number; lng: number };
  nearestCorridor?: string;
  description?: string;
  note?: string;
  createdAt?: string;
  timestamp?: string;
  status: 'active' | 'resolved';
}

export interface ChatMessage {
  id: string;
  loadId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  message: string;
  type: 'text' | 'bid_offer' | 'bid_accepted' | 'bid_declined' | 'status_update';
  offerAmount?: number;
  offerCurrency?: CurrencyCode;
  timestamp: string;
  syncStatus: 'synced' | 'queued_offline';
}

export interface BorderPostInfo {
  id: string;
  name: string;
  countries: [SADCCountry, SADCCountry];
  corridor: string;
  coords: { lat: number; lng: number };
  typicalWaitHours: string;
  commercialHours: string;
  isOpen24Hours: boolean;
  status: 'normal' | 'moderate_delay' | 'severe_congestion';
  statusNote: string;
  requiredDocs: string[];
  crossingFeesApproxUSD: string;
  transitTips: string[];
}

export interface TripCheckpoint {
  id: string;
  loadId: string;
  stage: 'posted' | 'matched' | 'in_transit' | 'border_clearance' | 'delivered';
  title: string;
  locationName: string;
  notes: string;
  timestamp: string;
  completed: boolean;
  podDocument?: string;
  recipientName?: string;
}

export interface MatchScoreResult {
  load: LoadItem;
  truck?: TruckListing;
  proximityKm: number;
  corridorOverlap: boolean;
  capacityFit: boolean;
  overallScore: number; // 0 - 100
  badge: 'Closest Pickup' | 'Best Route Match' | 'Top Capacity Fit' | 'Standard Match';
  reasoning: string;
}

export interface UserProfile {
  id: string;
  role: UserRole;
  fullName: string;
  companyName: string;
  phone: string;
  email: string;
  country: SADCCountry;
  currentCoords: { lat: number; lng: number };
  kycStatus: 'unverified' | 'pending' | 'verified';
  kycBadge: 'Standard' | 'Silver Verified' | 'Gold Corridor Transporter';
  idNumber?: string;
  passportNumber?: string;
  sadcPermitNo?: string;
  gitInsuranceValue?: number;
  isAnonymous?: boolean;
  authProvider?: 'google' | 'phone' | 'email' | 'guest';
}
