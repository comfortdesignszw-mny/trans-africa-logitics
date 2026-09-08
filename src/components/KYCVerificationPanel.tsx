/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Award,
  FileText,
  CheckCircle2,
  AlertCircle,
  Truck,
  Building,
  UserCheck,
  Search
} from 'lucide-react';
import { UserProfile } from '../types';
import { StorageService } from '../services/storage';

interface KYCVerificationPanelProps {
  currentUser: UserProfile;
  onProfileUpdated: (profile: UserProfile) => void;
}

export const KYCVerificationPanel: React.FC<KYCVerificationPanelProps> = ({
  currentUser,
  onProfileUpdated,
}) => {
  const [profile, setProfile] = useState<UserProfile>(currentUser);
  const [idNumber, setIdNumber] = useState(currentUser.idNumber || '63-198201-P-44');
  const [passportNumber, setPassportNumber] = useState(currentUser.passportNumber || 'FN892110');
  const [companyRegNumber, setCompanyRegNumber] = useState('2024/99102/07');
  const [sadcPermitNo, setSadcPermitNo] = useState(currentUser.sadcPermitNo || 'CBRTA-SADC-2026-9921');
  const [gitInsuranceValue, setGitInsuranceValue] = useState(currentUser.gitInsuranceValue || 150000);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Admin review simulation items
  const [pendingVerifications, setPendingVerifications] = useState([
    {
      id: 'kyc-01',
      name: 'Simba Moyo (Zambezi Heavy Haul)',
      role: 'Fleet Manager (12 Trucks)',
      country: 'Zimbabwe',
      permit: 'CBRTA-ZW-2026-081',
      git: '$250,000 USD',
      status: 'pending',
    },
    {
      id: 'kyc-02',
      name: 'Kobus van Niekerk (Namaqua Freight)',
      role: 'Owner-Operator (Flatbed)',
      country: 'Namibia',
      permit: 'NAMRA-TRANS-0941',
      git: '$100,000 USD',
      status: 'pending',
    },
    {
      id: 'kyc-03',
      name: 'Mulenga Chanda (Copperbelt Logistics)',
      role: 'Transporter (Tankers)',
      country: 'Zambia',
      permit: 'RTSA-SADC-2026-441',
      git: '$200,000 USD',
      status: 'pending',
    },
  ]);

  const handleSaveKYC = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserProfile = {
      ...profile,
      idNumber,
      passportNumber,
      sadcPermitNo,
      gitInsuranceValue,
      kycStatus: 'verified',
      kycBadge: gitInsuranceValue >= 100000 ? 'Gold Corridor Transporter' : 'Silver Verified',
    };

    StorageService.saveUserProfile(updated);
    setProfile(updated);
    onProfileUpdated(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  const handleApproveAdminKyc = (id: string) => {
    setPendingVerifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'verified' } : item))
    );
  };

  return (
    <div className="space-y-6">
      {/* Current Status Header Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">Transporter & Shipper KYC Verification</h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-600/60 text-emerald-300 text-xs font-bold">
                {profile.kycBadge}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Verified transporters get 3.5x higher booking priority and instant border documentation pre-clearance.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-semibold">
            Role: <strong className="text-amber-400 uppercase">{profile.role.replace('_', ' ')}</strong>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* User's KYC Submission Form */}
        <div className="lg:col-span-7 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-400" />
              Transporter Cross-Border Credentials
            </h3>
            <span className="text-xs text-slate-400">Self-Declared for MVP · Instant Verification</span>
          </div>

          <form onSubmit={handleSaveKYC} className="space-y-3.5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  National ID / Driver ID Card Number *
                </label>
                <input
                  type="text"
                  required
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Passport Number (for SADC Border Crossing) *
                </label>
                <input
                  type="text"
                  required
                  value={passportNumber}
                  onChange={(e) => setPassportNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  SADC Cross-Border Permit Number (C-BRTA / RTSA / ZINARA) *
                </label>
                <input
                  type="text"
                  required
                  value={sadcPermitNo}
                  onChange={(e) => setSadcPermitNo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Goods-in-Transit (GIT) Policy Value ($ USD) *
                </label>
                <input
                  type="number"
                  step="10000"
                  required
                  value={gitInsuranceValue}
                  onChange={(e) => setGitInsuranceValue(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-emerald-400 font-bold"
                />
              </div>
            </div>

            {savedSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-600/60 text-emerald-300 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>KYC Credentials successfully updated! Badge: {profile.kycBadge}</span>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-500/20 transition cursor-pointer"
              >
                Save & Update Verification Badges
              </button>
            </div>
          </form>
        </div>

        {/* Admin Verification & Audit Portal */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              Admin Verification Queue
            </h3>
            <span className="text-[11px] text-amber-400 font-semibold">Corridor KYC Review</span>
          </div>

          <p className="text-xs text-slate-400">
            Admins audit uploaded vehicle registration certificates, driver cross-border visas, and insurance binders.
          </p>

          <div className="space-y-3">
            {pendingVerifications.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h5 className="font-bold text-white">{item.name}</h5>
                    <p className="text-[11px] text-slate-400">{item.role} · {item.country}</p>
                  </div>

                  {item.status === 'verified' ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-600 text-emerald-300 font-bold text-[10px] flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Approved
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-amber-950 border border-amber-600 text-amber-300 font-bold text-[10px]">
                      Pending Review
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                  <span>Permit: <strong className="text-slate-200">{item.permit}</strong></span>
                  <span>GIT: <strong className="text-emerald-400">{item.git}</strong></span>
                </div>

                {item.status !== 'verified' && (
                  <button
                    onClick={() => handleApproveAdminKyc(item.id)}
                    className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer"
                  >
                    Grant Gold Corridor Transporter Badge
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
