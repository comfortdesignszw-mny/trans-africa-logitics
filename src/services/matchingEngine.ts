/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LoadItem, MatchScoreResult, TruckListing } from '../types';

/**
 * Calculates great-circle distance between two points in kilometers (Haversine formula).
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Checks if a truck's preferred corridor overlaps with the load route.
 */
export function checkCorridorOverlap(truckCorridor: string, loadCorridor: string): boolean {
  if (truckCorridor.includes('Any') || loadCorridor.includes('Any')) return true;

  const normalize = (c: string) => c.split('(')[0].trim().toLowerCase();
  const truckCore = normalize(truckCorridor);
  const loadCore = normalize(loadCorridor);

  if (truckCore === loadCore) return true;

  // Partial substring match for key highways
  const keywords = ['north-south', 'kalahari', 'dar es salaam', 'beira', 'maputo', 'kazungula', 'nacala'];
  for (const kw of keywords) {
    if (truckCore.includes(kw) && loadCore.includes(kw)) {
      return true;
    }
  }

  return false;
}

/**
 * Match Engine: Evaluates a load against a trucker's current position, corridor, and truck specs.
 */
export function evaluateLoadMatch(
  load: LoadItem,
  truckerLat: number,
  truckerLng: number,
  truck?: TruckListing
): MatchScoreResult {
  const pickupDistKm = calculateHaversineDistanceKm(
    truckerLat,
    truckerLng,
    load.origin.lat,
    load.origin.lng
  );

  let proximityScore = 0;
  if (pickupDistKm <= 50) {
    proximityScore = 40;
  } else if (pickupDistKm <= 150) {
    proximityScore = 30;
  } else if (pickupDistKm <= 350) {
    proximityScore = 20;
  } else if (pickupDistKm <= 750) {
    proximityScore = 10;
  } else {
    proximityScore = 5;
  }

  let corridorScore = 0;
  let corridorOverlap = false;
  if (truck) {
    corridorOverlap = checkCorridorOverlap(truck.preferredCorridor, load.corridor);
    corridorScore = corridorOverlap ? 30 : 10;
  } else {
    corridorOverlap = true;
    corridorScore = 20;
  }

  let capacityScore = 0;
  let capacityFit = false;
  if (truck) {
    const isWeightOk = truck.capacityTons >= load.weightTons;
    const isTypeOk = truck.truckType === load.truckTypeRequired;
    capacityFit = isWeightOk && isTypeOk;

    if (capacityFit) {
      capacityScore = 30;
    } else if (isWeightOk) {
      capacityScore = 15;
    } else {
      capacityScore = 5;
    }
  } else {
    capacityFit = true;
    capacityScore = 25;
  }

  const overallScore = Math.min(100, Math.round(proximityScore + corridorScore + capacityScore));

  let badge: MatchScoreResult['badge'] = 'Standard Match';
  let reasoning = '';

  if (pickupDistKm <= 75 && overallScore >= 80) {
    badge = 'Closest Pickup';
    reasoning = `Just ${pickupDistKm} km from your current staging position with strong route overlap.`;
  } else if (corridorOverlap && overallScore >= 75) {
    badge = 'Best Route Match';
    reasoning = `Aligned with your preferred corridor (${load.corridor.split('(')[0]}). Pickup is ${pickupDistKm} km away.`;
  } else if (capacityFit && overallScore >= 70) {
    badge = 'Top Capacity Fit';
    reasoning = `Direct capacity match: ${load.weightTons}t requires your ${truck?.truckType || 'specified'} truck.`;
  } else {
    badge = 'Standard Match';
    reasoning = `Pickup ${pickupDistKm} km away. Route: ${load.origin.city} to ${load.destination.city}.`;
  }

  return {
    load,
    truck,
    proximityKm: pickupDistKm,
    corridorOverlap,
    capacityFit,
    overallScore,
    badge,
    reasoning,
  };
}

/**
 * Evaluates all open loads against a trucker's GPS and truck specs, sorted by best match.
 */
export function rankLoadsForTrucker(
  loads: LoadItem[],
  truckerLat: number,
  truckerLng: number,
  truck?: TruckListing,
  sortBy: 'score' | 'distance' | 'budget' | 'date' = 'score'
): MatchScoreResult[] {
  const openLoads = loads.filter((l) => l.status === 'open');

  const evaluated = openLoads.map((l) => evaluateLoadMatch(l, truckerLat, truckerLng, truck));

  return evaluated.sort((a, b) => {
    if (sortBy === 'distance') {
      return a.proximityKm - b.proximityKm;
    }
    if (sortBy === 'budget') {
      return b.load.budget - a.load.budget;
    }
    if (sortBy === 'date') {
      return new Date(a.load.pickupDate).getTime() - new Date(b.load.pickupDate).getTime();
    }
    // default: match score
    return b.overallScore - a.overallScore;
  });
}
