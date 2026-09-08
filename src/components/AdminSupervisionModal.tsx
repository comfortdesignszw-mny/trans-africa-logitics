/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  ShieldAlert,
  ShieldCheck,
  Package,
  Truck,
  MessageSquare,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Award,
  DollarSign,
  Activity,
  Users,
} from 'lucide-react';
import { LoadItem, TruckListing, UserProfile, UserRole } from '../types';
import { StorageService } from '../services/storage';

interface AdminSupervisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  loads: LoadItem[];
  trucks: TruckListing[];
  onRefreshData: () => void;
  onShowToast: (msg: string) => void;
}

export const AdminSupervisionModal: React.FC<AdminSupervisionModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  loads,
  trucks,
  onRefreshData,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'transactions' | 'carriers' | 'rebac'>('transactions');
  const [filterQuery, setFilterQuery] = useState('');

  if (!isOpen) return null;

  // Transaction Actions
  const handleUpdateLoadStatus = (load: LoadItem, newStatus: LoadItem['status']) => {
    const updated = { ...load, status: newStatus };
    StorageService.saveLoad(updated);
    onRefreshData();
    onShowToast(`Admin Action: Consignment ${load.referenceId || load.id} updated to ${newStatus}`);
  };

  const handleDeleteLoad = (loadId: string) => {
    if (confirm('Admin confirmation: Are you sure you want to delete this consignment transaction?')) {
      const remaining = loads.filter((l) => l.id !== loadId);
      StorageService.saveLoads(remaining);
      onRefreshData();
      onShowToast('Admin Action: Consignment removed from regional corridor registry.');
    }
  };

  // Carrier Fleet Actions
  const handleUpgradeCarrierKyc = (truck: TruckListing) => {
    const nextBadge: TruckListing['kycBadgeLevel'] =
      truck.kycBadgeLevel === 'Gold Corridor Transporter'
        ? 'Silver Verified'
        : 'Gold Corridor Transporter';
    const updated: TruckListing = { ...truck, kycBadgeLevel: nextBadge };
    StorageService.saveTruck(updated);
    onRefreshData();
    onShowToast(`Admin Action: Upgraded ${truck.companyName} (${truck.truckReg}) to ${nextBadge}`);
  };

  const handleDeleteTruck = (truckId: string) => {
    if (confirm('Admin confirmation: Remove this carrier rig from active service?')) {
      const remaining = trucks.filter((t) => t.id !== truckId);
      StorageService.saveTrucks(remaining);
      onRefreshData();
      onShowToast('Admin Action: Truck rig de-registered from corridor directory.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">
                  SADC Regulatory Admin Command Center
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 uppercase font-black">
                  Total Control (REBAC)
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Supervisory override, transaction arbitration, KYC compliance & regional corridor moderation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="px-5 sm:px-6 pt-3 pb-2 border-b border-slate-800 bg-slate-950/40 flex items-center gap-2">
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'transactions'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>All Consignments ({loads.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('carriers')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'carriers'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Carrier Fleets ({trucks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('rebac')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'rebac'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>REBAC Architecture Matrix</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'transactions' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>Total Registered Freight Transactions: <strong>{loads.length}</strong></span>
                <span className="text-purple-300">Admin has root authority to edit, cancel, or re-route any load</span>
              </div>

              <div className="space-y-2.5">
                {loads.map((load) => (
                  <div
                    key={load.id}
                    className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-amber-400">
                          {load.referenceId || load.id}
                        </span>
                        <span className="text-xs font-bold text-white">{load.title}</span>
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                            load.status === 'open'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : load.status === 'in_transit'
                              ? 'bg-sky-500/20 text-sky-300'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {load.status}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                          {load.haulType}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {load.origin.city}, {load.origin.country} ➔ {load.destination.city},{' '}
                        {load.destination.country} • {load.weightTons} tons • Budget:{' '}
                        <strong className="text-white">
                          {load.currency} {load.budget.toLocaleString()}
                        </strong>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Owner: {load.shipperName} ({load.shipperCompany}) • Tel: {load.shipperPhone}
                      </div>
                    </div>

                    {/* Admin Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        value={load.status}
                        onChange={(e) =>
                          handleUpdateLoadStatus(load, e.target.value as LoadItem['status'])
                        }
                        className="bg-slate-900 border border-slate-700 text-xs text-white rounded-lg px-2 py-1.5 focus:outline-hidden"
                      >
                        <option value="open">Set Open</option>
                        <option value="matched">Set Matched</option>
                        <option value="in_transit">Set In-Transit</option>
                        <option value="border_clearance">Set Border OSBP</option>
                        <option value="delivered">Set Delivered</option>
                        <option value="cancelled">Set Cancelled</option>
                      </select>

                      <button
                        onClick={() => handleDeleteLoad(load.id)}
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition cursor-pointer"
                        title="Force Delete Transaction"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'carriers' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>Active Carrier Units: <strong>{trucks.length}</strong></span>
                <span className="text-purple-300">Admin can verify or revoke transporter KYC & SADC permits</span>
              </div>

              <div className="space-y-2.5">
                {trucks.map((truck) => (
                  <div
                    key={truck.id}
                    className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          {truck.truckReg}
                        </span>
                        <span className="text-xs font-bold text-white">{truck.companyName}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                          {truck.kycBadgeLevel}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Type: <span className="text-slate-200 capitalize">{truck.truckType}</span> • Payload:{' '}
                        <strong>{truck.capacityTons} Tons</strong> • Operator: {truck.truckerName} ({truck.truckerPhone})
                      </div>
                      <div className="text-[10px] text-slate-500">
                        GIT Insurance: ${(truck.gitInsuranceCoverageUsd || 100000).toLocaleString()} USD • Rate Quote: ${truck.rateQuoteUsdPerKm}/km
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleUpgradeCarrierKyc(truck)}
                        className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                        title="Toggle KYC Badge Level"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>Toggle KYC Badge</span>
                      </button>

                      <button
                        onClick={() => handleDeleteTruck(truck.id)}
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition cursor-pointer"
                        title="De-register Rig"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'rebac' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-xs space-y-2">
                <div className="font-bold text-purple-300 text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                  Relationship-Based Access Control (REBAC) Structure
                </div>
                <p className="text-slate-300 leading-relaxed">
                  The application implements clean REBAC rules enforced both client-side and via Firestore Security Rules:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="font-bold text-amber-400 flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    <span>Anonymous / Guest Users</span>
                  </div>
                  <ul className="text-slate-300 space-y-1.5 list-disc pl-4 text-[11px]">
                    <li>Full read-only permission to all SADC corridors & domestic freight boards</li>
                    <li>Unrestricted inspection of cargo manifests, trailer specifications & rates</li>
                    <li>Real-time GPS telemetry and border post waiting time monitoring</li>
                    <li><strong>Restriction:</strong> Must sign in before posting or bidding</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="font-bold text-sky-400 flex items-center gap-1.5">
                    <Package className="w-4 h-4" />
                    <span>Shippers & Cargo Owners</span>
                  </div>
                  <ul className="text-slate-300 space-y-1.5 list-disc pl-4 text-[11px]">
                    <li>Relationship: <code>shipperId == auth.uid</code></li>
                    <li>Can create, edit, close, or re-route their own consignments</li>
                    <li>Can participate in rate negotiations on their listed loads</li>
                    <li>Cannot modify consignments owned by other shippers</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <Truck className="w-4 h-4" />
                    <span>Transporters & Fleet Managers</span>
                  </div>
                  <ul className="text-slate-300 space-y-1.5 list-disc pl-4 text-[11px]">
                    <li>Relationship: <code>truckerId == auth.uid</code></li>
                    <li>Can register, update specs, and manage availability of their fleet units</li>
                    <li>Can submit rate quotes and counter-offers on open loads</li>
                    <li>Cannot edit rigs owned by other carriers</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="font-bold text-purple-400 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4" />
                    <span>SADC Regulatory Admin</span>
                  </div>
                  <ul className="text-slate-300 space-y-1.5 list-disc pl-4 text-[11px]">
                    <li>Relationship: <code>role == 'admin'</code> (Superuser Root)</li>
                    <li>Total control over all transactions across SADC member states</li>
                    <li>Can arbitrate disputes, reassign statuses, or delete fraudulent loads</li>
                    <li>Supervises and grants Gold/Silver KYC compliance credentials</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <div>
            Authenticated as: <strong className="text-white">{currentUser.fullName}</strong> ({currentUser.role})
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition cursor-pointer"
          >
            Close Panel
          </button>
        </div>
      </div>
    </div>
  );
};
