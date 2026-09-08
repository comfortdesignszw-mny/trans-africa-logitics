/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Star, ShieldCheck, X, ThumbsUp, MessageSquare, Award } from 'lucide-react';
import { UserProfile, UserReview } from '../types';
import { StorageService } from '../services/storage';

interface RatingReviewModalProps {
  currentUser: UserProfile;
  targetUserId: string;
  targetUserName: string;
  targetUserRole: 'trucker' | 'shipper';
  loadId?: string;
  loadTitle?: string;
  onClose: () => void;
  onReviewSubmitted: (review: UserReview) => void;
}

export const RatingReviewModal: React.FC<RatingReviewModalProps> = ({
  currentUser,
  targetUserId,
  targetUserName,
  targetUserRole,
  loadId,
  loadTitle,
  onClose,
  onReviewSubmitted,
}) => {
  const [stars, setStars] = useState(5);
  const [hoveredStars, setHoveredStars] = useState<number | null>(null);
  const [punctualityRating, setPunctualityRating] = useState(5);
  const [communicationRating, setCommunicationRating] = useState(5);
  const [cargoHandlingRating, setCargoHandlingRating] = useState(5);
  const [paymentRating, setPaymentRating] = useState(5);
  const [comment, setComment] = useState('');
  const [recommend, setRecommend] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    const newReview: UserReview = {
      id: `rev-${Date.now()}`,
      targetUserId,
      targetUserName: targetUserName || 'Verified Party',
      targetUserRole,
      reviewerId: currentUser.id,
      reviewerName: currentUser.fullName,
      reviewerRole: currentUser.role,
      rating: stars,
      comment: comment.trim(),
      feedback: comment.trim(),
      loadId,
      loadTitle,
      categoryRatings: {
        punctuality: punctualityRating,
        communication: communicationRating,
        cargoHandling: targetUserRole === 'trucker' ? cargoHandlingRating : undefined,
        paymentPromptness: targetUserRole === 'shipper' ? paymentRating : undefined,
      },
      createdAt: new Date().toISOString(),
      verifiedHaul: true,
    };

    StorageService.saveReview(newReview);
    onReviewSubmitted(newReview);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden text-slate-100 my-auto animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Star className="w-5 h-5 fill-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Rate & Review Transporter / Shipper</h3>
              <p className="text-xs text-slate-400">Guaranteed Trust & Security Rating System</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Target Profile summary */}
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400">Evaluating:</div>
              <div className="font-extrabold text-sm text-white">{targetUserName}</div>
              {loadTitle && <div className="text-[11px] text-amber-400 mt-0.5">Load: {loadTitle}</div>}
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700">
              {targetUserRole}
            </span>
          </div>

          {/* Star Selection */}
          <div className="text-center py-2">
            <label className="block text-xs font-bold text-slate-300 mb-2">Overall Performance Score</label>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((starVal) => {
                const isLit = (hoveredStars !== null ? hoveredStars : stars) >= starVal;
                return (
                  <button
                    key={starVal}
                    type="button"
                    onMouseEnter={() => setHoveredStars(starVal)}
                    onMouseLeave={() => setHoveredStars(null)}
                    onClick={() => setStars(starVal)}
                    className="p-1 cursor-pointer transition hover:scale-110"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        isLit ? 'text-amber-400 fill-amber-400' : 'text-slate-700 fill-slate-800'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
            <div className="text-xs font-bold text-amber-400 mt-1">
              {stars === 5
                ? '⭐ 5.0 - Excellent & Highly Reliable'
                : stars === 4
                ? '⭐ 4.0 - Good Performance'
                : stars === 3
                ? '⭐ 3.0 - Satisfactory'
                : stars === 2
                ? '⭐ 2.0 - Below Average'
                : '⭐ 1.0 - Poor Experience'}
            </div>
          </div>

          {/* Category sliders / ratings */}
          <div className="space-y-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Punctuality & Transit Time:</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setPunctualityRating(val)}
                    className={`w-6 h-6 rounded-md font-bold text-[10px] cursor-pointer ${
                      punctualityRating >= val ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-300">Communication & Coordination:</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setCommunicationRating(val)}
                    className={`w-6 h-6 rounded-md font-bold text-[10px] cursor-pointer ${
                      communicationRating >= val ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            {targetUserRole === 'trucker' ? (
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Cargo Care & Secure Offloading:</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setCargoHandlingRating(val)}
                      className={`w-6 h-6 rounded-md font-bold text-[10px] cursor-pointer ${
                        cargoHandlingRating >= val ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Payment & Escrow Release:</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setPaymentRating(val)}
                      className={`w-6 h-6 rounded-md font-bold text-[10px] cursor-pointer ${
                        paymentRating >= val ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Written Feedback */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
              Written Review & Experience Details *
            </label>
            <textarea
              required
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="e.g. Excellent trucker, arrived on schedule at Belmont Depot Bulawayo, goods arrived in 100% intact condition. Highly recommended!"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-amber-500"
            />
          </div>

          {/* Recommend Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <ThumbsUp className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-300 font-semibold">I recommend this operator to other SADC shippers & truckers</span>
            </div>
            <input
              type="checkbox"
              checked={recommend}
              onChange={(e) => setRecommend(e.target.checked)}
              className="w-4 h-4 rounded-sm accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Verified KYC Stamp Notice */}
          <div className="flex items-center gap-2 text-[11px] text-emerald-400 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
            <ShieldCheck className="w-4 h-4 flex-shrink-0" />
            <span>This review will be permanently stamped as a Verified Completed Trip on the platform.</span>
          </div>

          {/* Footer Submit */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2">
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
              Publish Verified Review
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
