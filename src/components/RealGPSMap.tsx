/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Compass,
  Layers,
  MapPin,
  Navigation,
  Truck,
  Package,
  ShieldCheck,
  Building2,
  Globe2,
  Crosshair,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { LoadItem, TruckListing } from '../types';
import { SADC_BORDER_POSTS } from '../data/sadcData';

interface RealGPSMapProps {
  loads: LoadItem[];
  trucks: TruckListing[];
  selectedLoad?: LoadItem | null;
  onSelectLoad?: (load: LoadItem) => void;
  onStartNavigation?: (load: LoadItem) => void;
}

export const RealGPSMap: React.FC<RealGPSMapProps> = ({
  loads,
  trucks,
  selectedLoad,
  onSelectLoad,
  onStartNavigation,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  const [tileLayerType, setTileLayerType] = useState<'streets' | 'dark' | 'satellite'>('dark');
  const [filterDomestic, setFilterDomestic] = useState(true);
  const [filterCrossBorder, setFilterCrossBorder] = useState(true);
  const [filterTrucks, setFilterTrucks] = useState(true);
  const [filterBorders, setFilterBorders] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);

  // Initialize map once
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [-20.5, 27.5],
      zoom: 5,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    layerGroupRef.current = layerGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update base tile layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove existing tile layers
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    let tileUrl = '';
    let attribution = '';
    const cartoApiKey = (import.meta.env.VITE_CARTO_API_KEY as string | undefined)?.trim();
    const cartoKeyParam = cartoApiKey ? `?api_key=${encodeURIComponent(cartoApiKey)}` : '';

    if (tileLayerType === 'dark') {
      tileUrl = `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png${cartoKeyParam}`;
      attribution = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions" target="_blank" rel="noreferrer">CARTO</a>';
    } else if (tileLayerType === 'streets') {
      // CARTO Voyager raster/vector basemap
      tileUrl = `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png${cartoKeyParam}`;
      attribution = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions" target="_blank" rel="noreferrer">CARTO</a>';
    } else if (tileLayerType === 'satellite') {
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      attribution = 'Tiles &copy; Esri, Earthstar Geographics';
    }

    L.tileLayer(tileUrl, {
      attribution,
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);
  }, [tileLayerType]);

  // Update markers, routes and pins
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    // 1. Render User GPS Marker if active
    if (userLocation) {
      const userIcon = L.divIcon({
        className: 'custom-gps-beacon',
        html: `
          <div style="position: relative; width: 24px; height: 24px;">
            <div style="position: absolute; inset: 0; border-radius: 9999px; background: rgba(59, 130, 246, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: absolute; inset: 4px; border-radius: 9999px; background: #3b82f6; border: 2px solid #ffffff; box-shadow: 0 0 10px rgba(59,130,246,0.8);"></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
        .bindPopup(
          `<div style="font-family: sans-serif; font-size: 12px; color: #0f172a; padding: 4px;">
            <strong>Your Live GPS Device Position</strong><br/>
            Lat: ${userLocation.lat.toFixed(4)}, Lng: ${userLocation.lng.toFixed(4)}
          </div>`
        )
        .addTo(layerGroup);
    }

    // 2. Render Consignment Loads (Domestic & Cross-Border)
    loads.forEach((load) => {
      const isDomestic = load.haulType === 'domestic';
      if (isDomestic && !filterDomestic) return;
      if (!isDomestic && !filterCrossBorder) return;

      const originColor = isDomestic ? '#10b981' : '#f59e0b';
      const destColor = isDomestic ? '#059669' : '#ef4444';

      // Origin Pin
      const originIcon = L.divIcon({
        className: 'load-origin-pin',
        html: `
          <div style="background: ${originColor}; color: #090d16; font-weight: 800; font-size: 10px; padding: 3px 6px; border-radius: 8px; border: 1.5px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.4); white-space: nowrap; display: flex; align-items: center; gap: 3px;">
            <span>📦 ${load.origin.city}</span>
          </div>
        `,
        iconSize: [80, 24],
        iconAnchor: [40, 12],
      });

      const originMarker = L.marker([load.origin.lat, load.origin.lng], { icon: originIcon }).addTo(layerGroup);

      // Destination Pin
      const destIcon = L.divIcon({
        className: 'load-dest-pin',
        html: `
          <div style="background: ${destColor}; color: #ffffff; font-weight: 800; font-size: 10px; padding: 3px 6px; border-radius: 8px; border: 1.5px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.4); white-space: nowrap;">
            <span>🏁 ${load.destination.city}</span>
          </div>
        `,
        iconSize: [80, 24],
        iconAnchor: [40, 12],
      });

      const destMarker = L.marker([load.destination.lat, load.destination.lng], { icon: destIcon }).addTo(layerGroup);

      // Route Polyline
      const routeLine = L.polyline(
        [
          [load.origin.lat, load.origin.lng],
          [load.destination.lat, load.destination.lng],
        ],
        {
          color: originColor,
          weight: 3,
          opacity: selectedLoad?.id === load.id ? 0.9 : 0.6,
          dashArray: isDomestic ? '6, 6' : '8, 8',
        }
      ).addTo(layerGroup);

      // If active telemetry exists, render real-time moving truck on route
      if (load.telemetry) {
        const liveTruckIcon = L.divIcon({
          className: 'live-telemetry-truck',
          html: `
            <div style="background: #0284c7; color: white; padding: 4px 7px; border-radius: 12px; border: 2px solid #38bdf8; box-shadow: 0 0 12px rgba(56,189,248,0.7); display: flex; align-items: center; gap: 4px; font-size: 10px; font-weight: bold; transform: rotate(${load.telemetry.headingDeg}deg);">
              🚚 ${load.telemetry.speedKmh} km/h
            </div>
          `,
          iconSize: [80, 26],
          iconAnchor: [40, 13],
        });

        L.marker([load.telemetry.currentLat, load.telemetry.currentLng], { icon: liveTruckIcon })
          .bindPopup(
            `<div style="font-family: sans-serif; font-size: 12px; min-width: 180px; color: #0f172a;">
              <strong style="color: #0284c7;">📡 Real-Time GPS Tracking</strong><br/>
              <b>Load:</b> ${load.title}<br/>
              <b>Speed:</b> ${load.telemetry.speedKmh} km/h (Heading ${load.telemetry.headingDeg}°)<br/>
              <b>Position:</b> ${load.telemetry.nearestTown}<br/>
              <b>ETA:</b> ~${Math.round(load.telemetry.etaMinutes / 60)}h remaining
            </div>`
          )
          .addTo(layerGroup);
      }

      const popupContent = document.createElement('div');
      popupContent.style.fontFamily = 'sans-serif';
      popupContent.style.fontSize = '12px';
      popupContent.style.minWidth = '220px';
      popupContent.style.color = '#0f172a';
      popupContent.innerHTML = `
        <div style="padding-bottom: 6px; border-bottom: 1px solid #e2e8f0; margin-bottom: 6px;">
          <span style="font-size: 9px; font-weight: 800; text-transform: uppercase; padding: 2px 6px; border-radius: 4px; background: ${
            isDomestic ? '#d1fae5' : '#fef3c7'
          }; color: ${isDomestic ? '#065f46' : '#92400e'};">
            ${isDomestic ? '🇿🇼 Local Domestic Haul' : '🌍 SADC Cross-Border'}
          </span>
          <h4 style="margin: 6px 0 2px 0; font-size: 13px; font-weight: bold;">${load.title}</h4>
          <p style="margin: 0; color: #64748b; font-size: 11px;">
            ${load.origin.city} &rarr; ${load.destination.city} (${load.weightTons} Tons)
          </p>
        </div>
        <div style="margin-bottom: 8px;">
          <strong>Budget:</strong> ${load.currency} ${load.budget.toLocaleString()}<br/>
          <strong>Truck Type:</strong> ${load.truckTypeRequired === 'custom' ? load.customTruckTypeName || 'Custom' : load.truckTypeRequired}<br/>
          ${load.mandatoryKycRequired ? '<span style="color: #d97706; font-size: 10px;">🔒 Mandatory KYC Required</span><br/>' : ''}
          ${load.escrowGuaranteed ? '<span style="color: #059669; font-size: 10px;">🛡️ Escrow Guaranteed Pay</span>' : ''}
        </div>
      `;

      const actionsRow = document.createElement('div');
      actionsRow.style.display = 'flex';
      actionsRow.style.gap = '6px';

      const navBtn = document.createElement('button');
      navBtn.innerText = '🗺️ Navigate';
      navBtn.style.cssText =
        'flex: 1; padding: 5px 8px; background: #059669; color: white; border: none; border-radius: 6px; font-size: 11px; font-weight: bold; cursor: pointer;';
      navBtn.onclick = () => {
        if (onStartNavigation) onStartNavigation(load);
      };

      const viewBtn = document.createElement('button');
      viewBtn.innerText = 'View Bids';
      viewBtn.style.cssText =
        'flex: 1; padding: 5px 8px; background: #f59e0b; color: #0f172a; border: none; border-radius: 6px; font-size: 11px; font-weight: bold; cursor: pointer;';
      viewBtn.onclick = () => {
        if (onSelectLoad) onSelectLoad(load);
      };

      actionsRow.appendChild(navBtn);
      actionsRow.appendChild(viewBtn);
      popupContent.appendChild(actionsRow);

      originMarker.bindPopup(popupContent);
      destMarker.bindPopup(popupContent);
      routeLine.bindPopup(popupContent);
    });

    // 3. Render Available Trucks
    if (filterTrucks) {
      trucks.forEach((truck) => {
        const truckIcon = L.divIcon({
          className: 'truck-pin',
          html: `
            <div style="background: #0284c7; color: #ffffff; font-weight: 700; font-size: 9px; padding: 3px 6px; border-radius: 8px; border: 1.5px solid #7dd3fc; box-shadow: 0 2px 6px rgba(0,0,0,0.4); white-space: nowrap;">
              🚛 ${truck.capacityTons}T (${truck.truckType})
            </div>
          `,
          iconSize: [80, 22],
          iconAnchor: [40, 11],
        });

        L.marker([truck.currentLocation.lat, truck.currentLocation.lng], { icon: truckIcon })
          .bindPopup(
            `<div style="font-family: sans-serif; font-size: 12px; min-width: 200px; color: #0f172a;">
              <strong style="color: #0284c7; font-size: 13px;">${truck.companyName}</strong><br/>
              <b>Truck Reg:</b> ${truck.truckReg} (${truck.capacityTons} Tons)<br/>
              <b>Driver:</b> ${truck.truckerName} (${truck.truckerPhone})<br/>
              <b>Base Location:</b> ${truck.currentLocation.city} (${truck.currentLocation.country})<br/>
              <b>Scope:</b> ${truck.haulScope === 'domestic' ? 'Local Domestic Hauls' : 'Cross-Border & Corridors'}<br/>
              <b>Rating:</b> ⭐ ${truck.rating} (${truck.ratingsCount || truck.completedTrips} reviews)<br/>
              <b>Status:</b> ${truck.kycBadgeLevel}
            </div>`
          )
          .addTo(layerGroup);
      });
    }

    // 4. Render SADC Border Posts
    if (filterBorders) {
      SADC_BORDER_POSTS.forEach((border) => {
        const borderIcon = L.divIcon({
          className: 'border-pin',
          html: `
            <div style="background: #7c3aed; color: #ffffff; font-size: 9px; font-weight: 800; padding: 2px 5px; border-radius: 6px; border: 1px solid #c4b5fd; box-shadow: 0 1px 4px rgba(0,0,0,0.5); white-space: nowrap;">
              🛂 ${border.name}
            </div>
          `,
          iconSize: [90, 20],
          iconAnchor: [45, 10],
        });

        L.marker([border.coords.lat, border.coords.lng], { icon: borderIcon })
          .bindPopup(
            `<div style="font-family: sans-serif; font-size: 12px; min-width: 180px; color: #0f172a;">
              <strong style="color: #7c3aed; font-size: 13px;">${border.name}</strong><br/>
              <b>Connecting:</b> ${border.countries[0]} &harr; ${border.countries[1]}<br/>
              <b>Average Wait:</b> ${border.typicalWaitHours}<br/>
              <b>Commercial Hours:</b> ${border.isOpen24Hours ? '24 Hours Open' : border.commercialHours}<br/>
              <b>Status:</b> <span style="color: green; font-weight: bold;">${border.status.toUpperCase()}</span>
            </div>`
          )
          .addTo(layerGroup);
      });
    }
  }, [loads, trucks, filterDomestic, filterCrossBorder, filterTrucks, filterBorders, userLocation, selectedLoad]);

  // Capture user GPS position
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your device browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(coords);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([coords.lat, coords.lng], 10, { duration: 1.5 });
        }
      },
      (err) => {
        setLocating(false);
        alert('Could not retrieve GPS coordinates. Please check location permissions.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="relative w-full h-[580px] sm:h-[680px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950 flex flex-col">
      {/* MAP CONTROLS BAR (Top) */}
      <div className="absolute top-3 left-3 right-3 z-40 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left: Tile Layer & Filters */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700/80 shadow-lg pointer-events-auto text-xs">
          <div className="flex items-center gap-1 border-r border-slate-700 pr-2">
            <span className="font-bold text-slate-300 text-[11px] px-1">Map View:</span>
            <button
              onClick={() => setTileLayerType('dark')}
              className={`px-2 py-1 rounded-md font-bold transition cursor-pointer ${
                tileLayerType === 'dark' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Dark High-Contrast
            </button>
            <button
              onClick={() => setTileLayerType('streets')}
              className={`px-2 py-1 rounded-md font-bold transition cursor-pointer ${
                tileLayerType === 'streets' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Roads & Towns
            </button>
            <button
              onClick={() => setTileLayerType('satellite')}
              className={`px-2 py-1 rounded-md font-bold transition cursor-pointer ${
                tileLayerType === 'satellite' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Satellite
            </button>
          </div>

          {/* Toggle Layer Checkboxes */}
          <div className="flex items-center gap-2 pl-1">
            <button
              onClick={() => setFilterDomestic(!filterDomestic)}
              className={`px-2 py-1 rounded-md text-[11px] font-bold border transition cursor-pointer flex items-center gap-1 ${
                filterDomestic
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-800 text-slate-500 border-slate-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Domestic Hauls
            </button>

            <button
              onClick={() => setFilterCrossBorder(!filterCrossBorder)}
              className={`px-2 py-1 rounded-md text-[11px] font-bold border transition cursor-pointer flex items-center gap-1 ${
                filterCrossBorder
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800 text-slate-500 border-slate-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              Cross-Border
            </button>

            <button
              onClick={() => setFilterTrucks(!filterTrucks)}
              className={`px-2 py-1 rounded-md text-[11px] font-bold border transition cursor-pointer flex items-center gap-1 ${
                filterTrucks
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                  : 'bg-slate-800 text-slate-500 border-slate-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-sky-400"></span>
              Trucks
            </button>

            <button
              onClick={() => setFilterBorders(!filterBorders)}
              className={`px-2 py-1 rounded-md text-[11px] font-bold border transition cursor-pointer flex items-center gap-1 ${
                filterBorders
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                  : 'bg-slate-800 text-slate-500 border-slate-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-purple-400"></span>
              Borders (OSBP)
            </button>
          </div>
        </div>

        {/* Right: CARTO Status & Locate Me Button */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {import.meta.env.VITE_CARTO_API_KEY ? (
            <span
              className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-[11px] flex items-center gap-1.5 shadow-sm"
              title="CARTO Maps API Key authenticated"
            >
              <Globe2 className="w-3.5 h-3.5 text-emerald-400" />
              CARTO Active
            </span>
          ) : (
            <span
              className="px-2.5 py-1.5 rounded-xl bg-slate-900/90 text-slate-400 border border-slate-700 font-bold text-[11px] hidden sm:flex items-center gap-1.5 shadow-sm"
              title="Using standard CARTO basemap layers"
            >
              <Globe2 className="w-3.5 h-3.5 text-slate-400" />
              CARTO Basemap
            </span>
          )}

          <button
            onClick={handleLocateMe}
            disabled={locating}
            className="px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-white font-bold text-xs border border-slate-700 shadow-xl flex items-center gap-2 cursor-pointer transition"
          >
            <Crosshair className={`w-4 h-4 text-sky-400 ${locating ? 'animate-spin' : ''}`} />
            {locating ? 'Acquiring GPS...' : userLocation ? 'GPS Locked' : 'Locate My Rig'}
          </button>
        </div>
      </div>

      {/* LEAFLET CONTAINER */}
      <div ref={mapContainerRef} className="flex-1 w-full h-full z-0" />

      {/* BOTTOM FLOATING STATUS BAR */}
      <div className="absolute bottom-3 left-3 z-40 p-2.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-800 text-xs text-slate-300 shadow-xl flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Live GPS Telemetry Active
        </div>
        <span className="text-slate-600">|</span>
        <span>Click any pin to inspect cargo or launch turn-by-turn navigation</span>
      </div>
    </div>
  );
};
