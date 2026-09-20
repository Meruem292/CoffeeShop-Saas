import React, { useState } from 'react';
import { Camera, QrCode, User, Coffee, Sparkles, X, ArrowRight, CheckCircle2, Search, Loader2 } from 'lucide-react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, ShopSettings } from '../types';
import { useToast } from '../lib/ToastContext';
import { QRScannerModal } from './QRScannerModal';

interface KioskMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMemberIdentified: (profile: UserProfile) => void;
  onContinueAsGuest: () => void;
  shopSettings?: ShopSettings | null;
}

export function KioskMemberModal({
  isOpen,
  onClose,
  onMemberIdentified,
  onContinueAsGuest,
  shopSettings,
}: KioskMemberModalProps) {
  const { toast } = useToast();
  const [memberIdInput, setMemberIdInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);

  if (!isOpen) return null;

  const handleLookupMember = async (idToSearch: string) => {
    const cleanId = idToSearch.trim();
    if (!cleanId) {
      toast.warning('Please enter your 5-character Member ID or scan your QR code.');
      return;
    }

    setIsSearching(true);
    try {
      // 1. Direct doc lookup by UID
      const directRef = doc(db, 'profiles', cleanId);
      const directSnap = await getDoc(directRef);
      if (directSnap.exists()) {
        const d = directSnap.data();
        const profile = {
          id: directSnap.id,
          uid: directSnap.id,
          shortId: d.shortId || directSnap.id.slice(0, 5).toUpperCase(),
          ...d
        } as unknown as UserProfile;
        onMemberIdentified(profile);
        return;
      }

      // 2. Lookup by shortId
      const qShort = query(collection(db, 'profiles'), where('shortId', '==', cleanId.toUpperCase()));
      const qSnap = await getDocs(qShort);
      if (!qSnap.empty) {
        const firstDoc = qSnap.docs[0];
        const d = firstDoc.data();
        const profile = {
          id: firstDoc.id,
          uid: firstDoc.id,
          shortId: d.shortId || firstDoc.id.slice(0, 5).toUpperCase(),
          ...d
        } as unknown as UserProfile;
        onMemberIdentified(profile);
        return;
      }

      toast.error(`No member account found with ID "${cleanId.toUpperCase()}".`);
    } catch (err) {
      console.error('Error looking up member:', err);
      toast.error('Failed to look up member ID. Please try again or continue as Guest.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleQRScan = async (scannedText: string) => {
    let cleanText = scannedText.trim();
    let scannedUserId: string | null = null;
    try {
      const parsed = JSON.parse(cleanText);
      if (parsed.uid) scannedUserId = parsed.uid;
      else if (parsed.userId) scannedUserId = parsed.userId;
      if (parsed.code) cleanText = parsed.code;
      else if (parsed.uid) cleanText = parsed.uid;
    } catch {
      // plain text scanned
    }

    const targetId = scannedUserId || cleanText;
    setIsQRScannerOpen(false);
    await handleLookupMember(targetId);
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 sm:p-6 bg-[#090D16]/85 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg bg-[#0F1422] border border-amber-500/30 rounded-[2.5rem] shadow-2xl shadow-amber-500/10 overflow-hidden flex flex-col p-6 sm:p-8 text-white">
        {/* Glow Accent */}
        <div className="absolute top-0 right-1/4 -translate-y-1/2 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close / Dismiss */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-10 h-10 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all active:scale-95"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-600 via-orange-500 to-amber-400 text-slate-950 shadow-xl shadow-amber-500/20 mb-4">
            <Coffee className="w-8 h-8" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500 flex items-center justify-center gap-1.5 mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            {shopSettings?.name || 'Caidez Coffee'}
          </span>
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight italic text-white">
            Are You a Member?
          </h2>
          <p className="text-xs font-semibold text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
            Identify yourself to earn loyalty points and redeem exclusive rewards, or continue right away as our guest.
          </p>
        </div>

        {/* Options */}
        <div className="space-y-4">
          {/* Option 1: Scan QR Pass */}
          <button
            type="button"
            onClick={() => setIsQRScannerOpen(true)}
            className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm uppercase tracking-wider p-4 rounded-2xl flex items-center justify-between shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-950/15 flex items-center justify-center text-slate-950">
                <Camera className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="leading-tight">Scan Member QR Pass</div>
                <div className="text-[10px] font-bold text-slate-900/70 lowercase tracking-normal">Hold your customer pass to camera</div>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Option 2: Enter Member ID */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 sm:p-4">
            <label className="block text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2 flex items-center gap-1.5">
              <QrCode className="w-3.5 h-3.5 text-amber-400" />
              Or Enter 5-Char Member ID
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={memberIdInput}
                onChange={(e) => setMemberIdInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleLookupMember(memberIdInput);
                  }
                }}
                maxLength={10}
                placeholder="E.G. #A89XK"
                className="flex-1 bg-black/40 border border-white/10 focus:border-amber-500/60 rounded-xl px-4 py-3 text-sm font-mono font-black text-amber-400 placeholder:text-slate-600 focus:outline-none transition-all uppercase"
              />
              <button
                type="button"
                onClick={() => handleLookupMember(memberIdInput)}
                disabled={isSearching || !memberIdInput.trim()}
                className="px-5 py-3 bg-amber-500/20 hover:bg-amber-500 text-amber-400 hover:text-slate-950 disabled:opacity-40 disabled:cursor-not-allowed border border-amber-500/30 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 active:scale-95 shrink-0"
              >
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span>Enter</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 py-1">
            <div className="h-px bg-white/10 flex-1" />
            <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">First Time or Just Visiting?</span>
            <div className="h-px bg-white/10 flex-1" />
          </div>

          {/* Option 3: Continue as Walk-in Guest */}
          <button
            type="button"
            onClick={onContinueAsGuest}
            className="w-full bg-white/5 hover:bg-white/10 border border-white/15 text-slate-200 hover:text-white font-black text-sm uppercase tracking-wider p-4 rounded-2xl flex items-center justify-between active:scale-[0.98] transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-amber-400">
                <User className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="leading-tight">Continue as Walk-in Guest</div>
                <div className="text-[10px] font-bold text-slate-400 tracking-normal capitalize">No login needed — order directly</div>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
          </button>
        </div>
      </div>

      {/* QR Scanner Submodal */}
      <QRScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        onScan={handleQRScan}
        title="Scan Customer QR Pass"
        description="Position your digital loyalty pass or member QR code in front of the kiosk camera"
      />
    </div>
  );
}
