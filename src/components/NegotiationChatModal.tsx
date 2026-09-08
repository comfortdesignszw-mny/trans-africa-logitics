/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  DollarSign,
  Check,
  Clock,
  Radio,
  ShieldCheck,
  Truck,
  Building2,
  AlertCircle,
  FileCheck
} from 'lucide-react';
import { ChatMessage, LoadItem, UserProfile } from '../types';
import { StorageService } from '../services/storage';

interface NegotiationChatModalProps {
  load: LoadItem;
  currentUser: UserProfile;
  onClose: () => void;
  onLoadStatusUpdated?: (updatedLoad: LoadItem) => void;
}

export const NegotiationChatModal: React.FC<NegotiationChatModalProps> = ({
  load,
  currentUser,
  onClose,
  onLoadStatusUpdated,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [showCounterOfferForm, setShowCounterOfferForm] = useState(false);
  const [counterOfferAmount, setCounterOfferAmount] = useState<number>(load.budget);
  const [counterCurrency, setCounterCurrency] = useState(load.currency);
  const [currentLoad, setCurrentLoad] = useState<LoadItem>(load);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadThreadMessages = () => {
    const threadMsgs = StorageService.getMessages(load.id);
    if (threadMsgs.length === 0) {
      // Create initial conversation prompt
      const initial: ChatMessage = {
        id: `msg-init-${load.id}`,
        loadId: load.id,
        senderId: load.shipperId,
        senderName: load.shipperName,
        senderRole: 'shipper',
        message: `Hello! I have posted this consignment of ${load.weightTons} tons (${load.cargoDescription}) from ${load.origin.city} to ${load.destination.city}. Budget is ${load.currency} ${load.budget.toLocaleString()}. Please submit your rate or confirm availability.`,
        type: 'text',
        timestamp: load.createdAt,
        syncStatus: 'synced',
      };
      setMessages([initial]);
    } else {
      setMessages(threadMsgs);
    }
  };

  useEffect(() => {
    loadThreadMessages();

    const handleSync = () => {
      loadThreadMessages();
    };

    window.addEventListener('transafrica-sync-complete', handleSync);
    return () => {
      window.removeEventListener('transafrica-sync-complete', handleSync);
    };
  }, [load.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      loadId: load.id,
      senderId: currentUser.id,
      senderName: currentUser.fullName || 'Transporter',
      senderRole: currentUser.role,
      message: inputText.trim(),
      type: 'text',
      timestamp: new Date().toISOString(),
      syncStatus: StorageService.isOnline() ? 'synced' : 'queued_offline',
    };

    const { message } = StorageService.saveMessage(newMsg);
    setMessages((prev) => [...prev, message]);
    setInputText('');
  };

  const handleSendOffer = () => {
    if (!counterOfferAmount || counterOfferAmount <= 0) return;

    const offerMsg: ChatMessage = {
      id: `msg-offer-${Date.now()}`,
      loadId: load.id,
      senderId: currentUser.id,
      senderName: currentUser.fullName,
      senderRole: currentUser.role,
      message: `Submitted a freight rate offer of ${counterCurrency} ${counterOfferAmount.toLocaleString()}`,
      type: 'bid_offer',
      offerAmount: counterOfferAmount,
      offerCurrency: counterCurrency,
      timestamp: new Date().toISOString(),
      syncStatus: StorageService.isOnline() ? 'synced' : 'queued_offline',
    };

    const { message } = StorageService.saveMessage(offerMsg);
    setMessages((prev) => [...prev, message]);
    setShowCounterOfferForm(false);
  };

  const handleAcceptOffer = (offer: ChatMessage) => {
    const acceptMsg: ChatMessage = {
      id: `msg-accept-${Date.now()}`,
      loadId: load.id,
      senderId: currentUser.id,
      senderName: currentUser.fullName,
      senderRole: currentUser.role,
      message: `Rate agreement reached! Offer of ${offer.offerCurrency} ${offer.offerAmount?.toLocaleString()} accepted. Consignment assigned to transporter.`,
      type: 'bid_accepted',
      offerAmount: offer.offerAmount,
      offerCurrency: offer.offerCurrency,
      timestamp: new Date().toISOString(),
      syncStatus: StorageService.isOnline() ? 'synced' : 'queued_offline',
    };

    const { message } = StorageService.saveMessage(acceptMsg);
    setMessages((prev) => [...prev, message]);

    // Update load state
    const updated = StorageService.updateLoadStatus(
      load.id,
      'matched',
      offer.senderId,
      offer.senderName
    );
    if (updated) {
      setCurrentLoad(updated);
      onLoadStatusUpdated?.(updated);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-2 sm:p-4">
      <div className="w-full max-w-2xl h-[90vh] max-h-[750px] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Modal Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold uppercase">
                {currentLoad.status.replace('_', ' ')}
              </span>
              <h3 className="font-bold text-base text-white line-clamp-1">{currentLoad.title}</h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Corridor: <span className="text-slate-200">{currentLoad.origin.city} &rarr; {currentLoad.destination.city}</span> ·{' '}
              Weight: <span className="text-amber-400 font-semibold">{currentLoad.weightTons} tons</span> ·{' '}
              Budget: <span className="text-emerald-400 font-bold">{currentLoad.currency} {currentLoad.budget.toLocaleString()}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Offline notice bar if in offline mode */}
        {!StorageService.isOnline() && (
          <div className="bg-amber-950/80 border-b border-amber-600/50 px-3 py-1.5 text-xs text-amber-300 flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            <span>
              <strong>Offline Mode Active:</strong> Messages & bids are queued locally and will sync once network connectivity returns at the next truck stop.
            </span>
          </div>
        )}

        {/* Chat Thread Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-950/40">
          {messages.map((msg) => {
            const isMe = msg.senderId === currentUser.id;
            const isOffer = msg.type === 'bid_offer';
            const isAccepted = msg.type === 'bid_accepted';

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1 px-1">
                  <span className="font-semibold text-slate-300">{msg.senderName}</span>
                  <span className="capitalize px-1.5 py-0.2 rounded bg-slate-800 text-[10px]">
                    {msg.senderRole}
                  </span>
                  <span>· {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm shadow-md ${
                    isAccepted
                      ? 'bg-emerald-900/60 border border-emerald-500/60 text-emerald-100'
                      : isOffer
                      ? 'bg-amber-950/60 border border-amber-500/60 text-amber-100'
                      : isMe
                      ? 'bg-amber-600 text-slate-950 font-medium'
                      : 'bg-slate-800 border border-slate-700 text-slate-200'
                  }`}
                >
                  <p>{msg.message}</p>

                  {/* Offer Card Box */}
                  {isOffer && (
                    <div className="mt-2.5 pt-2.5 border-t border-amber-500/30 flex items-center justify-between gap-3">
                      <div>
                        <span className="text-[11px] text-amber-300 block">Proposed Rate</span>
                        <span className="text-base font-extrabold text-amber-200">
                          {msg.offerCurrency} {msg.offerAmount?.toLocaleString()}
                        </span>
                      </div>

                      {/* Shipper can accept offer if not accepted yet */}
                      {currentUser.role === 'shipper' && currentLoad.status === 'open' && (
                        <button
                          onClick={() => handleAcceptOffer(msg)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Accept Offer</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Accepted Badge */}
                  {isAccepted && (
                    <div className="mt-2 flex items-center gap-1.5 text-emerald-300 text-xs font-bold">
                      <FileCheck className="w-4 h-4" />
                      <span>Trip Matched & Ready for Dispatch</span>
                    </div>
                  )}
                </div>

                {/* Message Sync Indicator */}
                <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5 px-1">
                  {msg.syncStatus === 'queued_offline' ? (
                    <span className="flex items-center gap-1 text-amber-400/90 font-medium">
                      <Clock className="w-3 h-3" /> Queued (Offline)
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-slate-400">
                      <Check className="w-3 h-3 text-emerald-400" /> Synced
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Counter Offer Modal Sub-Panel */}
        {showCounterOfferForm && (
          <div className="p-3 bg-slate-800/90 border-t border-slate-700 animate-in slide-in-from-bottom-2 duration-150">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                <DollarSign className="w-4 h-4" /> Submit Freight Rate Proposal
              </span>
              <button
                onClick={() => setShowCounterOfferForm(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={counterCurrency}
                onChange={(e) => setCounterCurrency(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
              >
                <option value="USD">USD ($)</option>
                <option value="ZAR">ZAR (R)</option>
                <option value="ZMW">ZMW (K)</option>
                <option value="BWP">BWP (P)</option>
                <option value="TZS">TZS</option>
                <option value="MZN">MZN (MT)</option>
              </select>

              <input
                type="number"
                value={counterOfferAmount}
                onChange={(e) => setCounterOfferAmount(Number(e.target.value))}
                className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-bold text-white focus:outline-hidden focus:border-amber-500"
                placeholder="Rate amount"
              />

              <button
                onClick={handleSendOffer}
                className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition cursor-pointer"
              >
                Send Proposal
              </button>
            </div>
          </div>
        )}

        {/* Chat Input Bar */}
        <form
          onSubmit={handleSendMessage}
          className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
        >
          <button
            type="button"
            onClick={() => setShowCounterOfferForm(!showCounterOfferForm)}
            className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 font-bold text-xs flex items-center gap-1 transition cursor-pointer whitespace-nowrap"
            title="Make a rate offer"
          >
            <DollarSign className="w-4 h-4" />
            <span className="hidden sm:inline">Bid / Offer</span>
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your message, questions on clearance, or transit timeline..."
            className="flex-1 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-hidden focus:border-amber-500"
          />

          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 text-slate-950 font-bold transition cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
