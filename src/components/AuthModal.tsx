/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  Truck,
  Building2,
  Globe2,
  User,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { AuthService, RegisterPayload } from '../services/firebase';
import { SADCCountry, UserProfile, UserRole } from '../types';
import { SADC_CITIES } from '../data/sadcData';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (profile: UserProfile) => void;
  encouragementPrompt?: {
    actionTitle: string;
    description: string;
  } | null;
}

const SADC_COUNTRIES: { name: SADCCountry; code: string; flag: string }[] = [
  { name: 'South Africa', code: '+27', flag: '🇿🇦' },
  { name: 'Zimbabwe', code: '+263', flag: '🇿🇼' },
  { name: 'Zambia', code: '+260', flag: '🇿🇲' },
  { name: 'Botswana', code: '+267', flag: '🇧🇼' },
  { name: 'Namibia', code: '+264', flag: '🇳🇦' },
  { name: 'Mozambique', code: '+258', flag: '🇲🇿' },
  { name: 'Malawi', code: '+265', flag: '🇲🇼' },
  { name: 'Tanzania', code: '+255', flag: '🇹🇿' },
  { name: 'DR Congo', code: '+243', flag: '🇨🇩' },
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  encouragementPrompt,
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [method, setMethod] = useState<'email' | 'phone'>('email');

  // Form Fields
  const [email, setEmail] = useState('');
  const [phoneCountryCode, setPhoneCountryCode] = useState('+263');
  const [phoneLocalNumber, setPhoneLocalNumber] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('trucker');
  const [selectedCountry, setSelectedCountry] = useState<SADCCountry>('Zimbabwe');

  // Status
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const fullPhoneNumber = `${phoneCountryCode}${phoneLocalNumber.replace(/^0+/, '')}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      if (authMode === 'login') {
        if (method === 'email') {
          if (!email || !password) throw new Error('Please enter both your email and password.');
          const profile = await AuthService.loginWithEmail(email, password);
          onAuthSuccess(profile);
          onClose();
        } else {
          if (!phoneLocalNumber || !password) throw new Error('Please enter your phone number and password.');
          const profile = await AuthService.loginWithPhone(fullPhoneNumber, password);
          onAuthSuccess(profile);
          onClose();
        }
      } else {
        // Register Mode
        if (!fullName.trim()) throw new Error('Please enter your full name.');
        if (!password || password.length < 6) throw new Error('Password must be at least 6 characters.');

        const registerPayload: RegisterPayload = {
          fullName: fullName.trim(),
          role: selectedRole,
          companyName: companyName.trim() || 'Independent Operator',
          phone: method === 'phone' ? fullPhoneNumber : fullPhoneNumber || '+263771000000',
          email: method === 'email' ? email.trim() : `${fullPhoneNumber.replace(/[^0-9]/g, '')}@phone.transafrica.logistics`,
          country: selectedCountry,
        };

        if (method === 'email') {
          if (!email.trim()) throw new Error('Please provide an email address.');
          const profile = await AuthService.registerWithEmail(email, password, registerPayload);
          onAuthSuccess(profile);
          onClose();
        } else {
          if (!phoneLocalNumber.trim()) throw new Error('Please enter your phone number.');
          const profile = await AuthService.registerWithPhone(fullPhoneNumber, password, registerPayload);
          onAuthSuccess(profile);
          onClose();
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      let message = err?.message || 'Authentication failed. Please check your credentials.';
      if (message.includes('auth/invalid-credential') || message.includes('auth/wrong-password')) {
        message = 'Invalid credentials or user does not exist. Please check password or register.';
      } else if (message.includes('auth/email-already-in-use')) {
        message = 'This email or phone is already registered. Please sign in instead.';
      } else if (message.includes('auth/weak-password')) {
        message = 'Password should be at least 6 characters.';
      }
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      const profile = await AuthService.loginWithGoogle(selectedRole);
      onAuthSuccess(profile);
      onClose();
    } catch (err: any) {
      console.error('Google Sign-in error:', err);
      setErrorMsg(err?.message || 'Google Sign-In was cancelled or failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white">
                {authMode === 'login' ? 'Sign In to Trans-Africa' : 'Create Verified SADC Account'}
              </h3>
              <p className="text-[11px] text-slate-400">
                SADC Freight Network & REBAC Access
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

        {/* Encouragement Banner */}
        {encouragementPrompt && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-5 sm:px-6 py-3 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <div className="font-bold text-amber-300">{encouragementPrompt.actionTitle}</div>
              <p className="text-slate-300 text-[11px] mt-0.5 leading-relaxed">
                {encouragementPrompt.description}
              </p>
            </div>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          
          {/* Google One-Click Button */}
          <div>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2.5 shadow-sm transition cursor-pointer hover:border-slate-600"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-800 w-full"></div>
            <span className="bg-slate-900 px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Or with credentials
            </span>
          </div>

          {/* Tab Selector: Email vs Phone */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => {
                setMethod('email');
                setErrorMsg(null);
              }}
              className={`py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                method === 'email'
                  ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email & Password</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMethod('phone');
                setErrorMsg(null);
              }}
              className={`py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                method === 'phone'
                  ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Phone & Password</span>
            </button>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* If Register: Collect Name, Role, Company, Country */}
            {authMode === 'register' && (
              <>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 block">Full Name</label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Kudzai Ndlovu"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300 block">Your SADC Role</label>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-hidden focus:border-amber-500"
                    >
                      <option value="trucker">Transporter / Carrier</option>
                      <option value="shipper">Cargo Shipper / Owner</option>
                      <option value="fleet_manager">Fleet Manager</option>
                      <option value="admin">Border / Regulatory Admin</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300 block">Operating Country</label>
                    <select
                      value={selectedCountry}
                      onChange={(e) => setSelectedCountry(e.target.value as SADCCountry)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-hidden focus:border-amber-500"
                    >
                      {SADC_COUNTRIES.map((c) => (
                        <option key={c.name} value={c.name}>
                          {c.flag} {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 block">
                    Company / Fleet Name (Optional)
                  </label>
                  <div className="relative">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="e.g. Zambezi Haulage Logistics"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-amber-500"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Credential Inputs based on method */}
            {method === 'email' ? (
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 block">Email Address</label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-amber-500"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 block">SADC Mobile Phone</label>
                <div className="flex gap-2">
                  <select
                    value={phoneCountryCode}
                    onChange={(e) => setPhoneCountryCode(e.target.value)}
                    className="w-28 bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-xs text-white focus:outline-hidden focus:border-amber-500 font-mono shrink-0"
                  >
                    {SADC_COUNTRIES.map((c) => (
                      <option key={c.name} value={c.code}>
                        {c.flag} {c.code}
                      </option>
                    ))}
                  </select>
                  <div className="relative flex-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      placeholder="77 123 4567"
                      value={phoneLocalNumber}
                      onChange={(e) => setPhoneLocalNumber(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Password Input */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300 block">Password</label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-amber-500"
                />
              </div>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 transition cursor-pointer mt-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>{authMode === 'login' ? 'Sign In' : 'Create Account & Access REBAC'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Toggle between Register & Login */}
          <div className="pt-2 text-center text-xs text-slate-400">
            {authMode === 'login' ? (
              <div>
                Don't have a Trans-Africa account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    setErrorMsg(null);
                  }}
                  className="text-amber-400 hover:underline font-bold cursor-pointer"
                >
                  Create one now
                </button>
              </div>
            ) : (
              <div>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setErrorMsg(null);
                  }}
                  className="text-amber-400 hover:underline font-bold cursor-pointer"
                >
                  Sign In
                </button>
              </div>
            )}
          </div>

          {/* Anonymous / Guest Notice */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-300">Public Browsing Allowed:</strong> Guests can freely inspect
              corridor routes, domestic cargo boards, live GPS positions, and border post wait times.
              Account required for posting freight, listing fleet assets, or submitting bids.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
