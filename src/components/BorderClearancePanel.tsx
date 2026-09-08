/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Clock,
  FileText,
  DollarSign,
  Info,
  Search,
  CheckCircle2,
  ExternalLink,
  MapPin,
  HelpCircle
} from 'lucide-react';
import { SADC_BORDER_POSTS } from '../data/sadcData';
import { BorderPostInfo } from '../types';

export const BorderClearancePanel: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPost, setSelectedPost] = useState<BorderPostInfo>(SADC_BORDER_POSTS[0]);

  const filteredPosts = SADC_BORDER_POSTS.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.countries.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase())) ||
      p.corridor.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h2 className="text-lg font-bold text-white">SADC Border Posts & Customs Guide</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Static reference and operational intelligence for major cross-border corridors in Southern Africa.
              Cached offline for access during remote border connectivity dead zones.
            </p>
          </div>

          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search border, country, or route..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-hidden focus:border-amber-500"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Border Post Selector Column */}
        <div className="lg:col-span-5 space-y-2.5">
          <div className="text-xs font-bold text-slate-400 px-1 uppercase tracking-wider">
            Key Border Checkpoints ({filteredPosts.length})
          </div>

          <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
            {filteredPosts.map((post) => {
              const isSelected = selectedPost.id === post.id;
              const isCongested = post.status === 'severe_congestion';
              const isDelay = post.status === 'moderate_delay';

              return (
                <div
                  key={post.id}
                  onClick={() => setSelectedPost(post)}
                  className={`p-3.5 rounded-xl border transition cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800/90 border-amber-500/70 shadow-lg shadow-amber-500/5'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-white">{post.name}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {post.countries[0]} ⇄ {post.countries[1]}
                      </p>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isCongested
                          ? 'bg-red-950/80 border border-red-700/60 text-red-300'
                          : isDelay
                          ? 'bg-amber-950/80 border border-amber-700/60 text-amber-300'
                          : 'bg-emerald-950/80 border border-emerald-700/60 text-emerald-300'
                      }`}
                    >
                      {post.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 mt-2 pt-2 border-t border-slate-800/80">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-400" />
                      Wait: <strong className="text-slate-200">{post.typicalWaitHours}</strong>
                    </span>
                    <span className="text-[11px] text-slate-400">{post.commercialHours}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Border Detail & Checklist Column */}
        <div className="lg:col-span-7">
          {selectedPost ? (
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-5 shadow-xl">
              {/* Header Title */}
              <div className="border-b border-slate-800 pb-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-lg font-bold text-white">{selectedPost.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                      {selectedPost.countries.join(' ⇄ ')}
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300">
                      {selectedPost.isOpen24Hours ? 'Open 24/7' : selectedPost.commercialHours}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  Corridor Route: <span className="text-slate-200 font-medium">{selectedPost.corridor}</span>
                </p>
              </div>

              {/* Status Alert Callout */}
              <div
                className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                  selectedPost.status === 'severe_congestion'
                    ? 'bg-red-950/40 border-red-600/50 text-red-200'
                    : selectedPost.status === 'moderate_delay'
                    ? 'bg-amber-950/40 border-amber-600/50 text-amber-200'
                    : 'bg-emerald-950/40 border-emerald-600/50 text-emerald-200'
                }`}
              >
                {selectedPost.status === 'severe_congestion' ? (
                  <ShieldAlert className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider">
                    Operational Status: {selectedPost.status.replace('_', ' ')}
                  </h4>
                  <p className="text-xs mt-0.5 opacity-90">{selectedPost.statusNote}</p>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-400" /> Average Truck Clearance Queue
                  </span>
                  <p className="text-base font-extrabold text-amber-300">{selectedPost.typicalWaitHours}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block mb-1 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Approximate Crossing Fees
                  </span>
                  <p className="text-sm font-extrabold text-emerald-400">{selectedPost.crossingFeesApproxUSD}</p>
                </div>
              </div>

              {/* Required Documents Checklist */}
              <div>
                <h4 className="text-xs font-bold uppercase text-slate-300 tracking-wider mb-2.5 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-amber-400" />
                  Mandatory Clearing Documents
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {selectedPost.requiredDocs.map((doc, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-200"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span className="line-clamp-1">{doc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Corridor Transit Tips */}
              <div>
                <h4 className="text-xs font-bold uppercase text-slate-300 tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-sky-400" />
                  Corridor Driver Directives & Tips
                </h4>
                <div className="space-y-2 text-xs">
                  {selectedPost.transitTips.map((tip, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800 text-slate-300 flex items-start gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 mt-1.5" />
                      <p>{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-400 text-sm">
              Select a border post from the list to review documents, fees, and clearance protocol.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
