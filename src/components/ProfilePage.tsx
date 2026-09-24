import React, { useState, useRef } from 'react';
import { User, Copy, Tag, Clock, ShoppingBag, Award, ArrowUpRight, ArrowDownRight, Coins, ArrowRight, QrCode, Camera, Sparkles, Upload, CheckCircle2, RefreshCw, Download, Maximize2, X, MessageSquare, Star, MessageSquareQuote, Trash2, Image as ImageIcon, Check, Eye, FlaskConical, BookmarkPlus } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { doc, setDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { db, auth } from '../firebase';
import { Voucher, Order, ClaimedVoucher, UserProfile, ViewMode, Review, SavedCustomMix } from '../types';
import { useToast } from '../lib/ToastContext';
import { CustomerReviewModal } from './CustomerReviewModal';

interface ProfilePageProps {
  user: any;
  userProfile?: UserProfile | null;
  vouchers: Voucher[];
  userClaimedVouchers?: ClaimedVoucher[];
  orders: Order[];
  savedMixes?: SavedCustomMix[];
  reviews?: Review[];
  onClaimVoucher?: (voucher: Voucher, currentBalance: number) => Promise<boolean>;
  onNavigate?: (view: ViewMode) => void;
  onSubmitReview?: (data: { rating: number; comment: string; userName?: string; userPhoto?: string }) => Promise<boolean | void>;
  onDeleteSavedMix?: (id: string) => Promise<void>;
  onAddToCartCustomMix?: (mix: SavedCustomMix) => void;
}

// Client-side image compression and square crop helper
const compressAndResizeImage = (file: File, maxSize: number = 400, quality: number = 0.85): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const width = img.width;
        const height = img.height;

        // Calculate center square crop
        const minDim = Math.min(width, height);
        const offsetX = (width - minDim) / 2;
        const offsetY = (height - minDim) / 2;

        const targetDim = Math.min(minDim, maxSize);
        canvas.width = targetDim;
        canvas.height = targetDim;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, offsetX, offsetY, minDim, minDim, 0, 0, targetDim, targetDim);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Failed to parse image file'));
      img.src = event.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

export function ProfilePage({ user, userProfile, vouchers = [], userClaimedVouchers = [], orders = [], savedMixes = [], reviews = [], onClaimVoucher, onNavigate, onSubmitReview, onDeleteSavedMix, onAddToCartCustomMix }: ProfilePageProps) {
  const [isSavedMixesModalOpen, setIsSavedMixesModalOpen] = useState(false);
  const { toast } = useToast();
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isMemberQrModalOpen, setIsMemberQrModalOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);
  const profilePhotoInputRef = useRef<HTMLInputElement>(null);

  const completedOrdersCount = orders.filter(o => o.status === 'completed').length;
  const userReview = reviews?.find(r => r.userId === user?.uid || r.id === user?.uid);
  const currentPhoto = userProfile?.photoURL || user?.photoURL || '';

  const handleUploadProfilePhoto = async (file: File) => {
    if (!user?.uid) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (JPEG, PNG, WebP, etc.).');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      toast.error('Image is too large. Please select a file under 15MB.');
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const compressedDataUrl = await compressAndResizeImage(file, 400, 0.85);

      // 1. Update Firestore Profile
      await setDoc(doc(db, 'profiles', user.uid), {
        photoURL: compressedDataUrl,
        updatedAt: Date.now()
      }, { merge: true });

      // 2. Update Firebase Auth Profile
      if (auth.currentUser) {
        try {
          await updateProfile(auth.currentUser, {
            photoURL: compressedDataUrl
          });
        } catch (authErr) {
          console.warn('Could not sync Auth profile photoURL:', authErr);
        }
      }

      toast.success('Profile picture updated successfully!');
    } catch (err) {
      console.error('Failed to upload profile picture:', err);
      toast.error('Failed to update profile picture. Please try again.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleProfileFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleUploadProfilePhoto(file);
    }
    // reset input so the same file can be re-selected if needed
    if (e.target) e.target.value = '';
  };

  const handleDropPhoto = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingPhoto(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await handleUploadProfilePhoto(file);
    }
  };

  const handleRemoveProfilePhoto = async () => {
    if (!user?.uid) return;
    setIsUploadingPhoto(true);
    try {
      await setDoc(doc(db, 'profiles', user.uid), {
        photoURL: '',
        updatedAt: Date.now()
      }, { merge: true });

      if (auth.currentUser) {
        try {
          await updateProfile(auth.currentUser, {
            photoURL: ''
          });
        } catch (authErr) {
          console.warn('Could not reset Auth photoURL:', authErr);
        }
      }

      toast.success('Profile picture removed.');
    } catch (err) {
      console.error('Failed to remove profile photo:', err);
      toast.error('Failed to remove profile picture.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleDownloadMemberQr = () => {
    const svgElement = document.getElementById(`member-pass-qr-svg`);
    if (!svgElement) return;
    
    const xml = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
    const blobURL = (window.URL || (window as any).webkitURL).createObjectURL(svgBlob);
    
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 400;
      const context = canvas.getContext('2d');
      if (context) {
        context.fillStyle = '#FFFFFF';
        context.fillRect(0, 0, 400, 400);
        context.drawImage(image, 20, 20, 360, 360);
        const png = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = png;
        downloadLink.download = `Member_Pass_QR_${userProfile?.shortId || user.uid.slice(0, 6)}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        toast.success('Member Pass QR downloaded successfully!');
      }
    };
    image.src = blobURL;
  };

  if (!user) return <div className="p-8 text-center text-slate-500 font-bold">Please log in to view your profile.</div>;

  // Compute Points stats
  const totalEarnedPoints = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, order) => sum + (order.pointsEarned || 0), 0);

  const totalSpentOrderPoints = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, order) => sum + (order.pointsSpent || 0), 0);

  const totalSpentClaimedPoints = userClaimedVouchers.reduce((sum, cv) => sum + (cv.pointsCost || 0), 0);

  const totalSpentPoints = totalSpentOrderPoints + totalSpentClaimedPoints;
  
  // Use userProfile.points as the centralized source of truth if available
  const currentBalance = userProfile ? (Number(userProfile.points) || 0) : Math.max(0, totalEarnedPoints - totalSpentPoints);

  const calculatedBalance = Math.max(0, totalEarnedPoints - totalSpentPoints);
  const adjustment = currentBalance - calculatedBalance;

  // Generate Points Log
  const pointsLog = [
    ...orders
      .filter(o => o.status !== 'cancelled' && ((o.pointsEarned || 0) > 0 || (o.pointsSpent || 0) > 0))
      .flatMap(order => {
        const logs = [];
        if ((order.pointsEarned || 0) > 0) {
          logs.push({
            id: `earn_${order.id}`,
            orderId: order.id,
            type: 'earned' as const,
            points: order.pointsEarned || 0,
            description: `Earned from Order #${order.id?.slice(-4) || '—'}`,
            date: order.createdAt,
            amount: order.total
          });
        }
        if ((order.pointsSpent || 0) > 0) {
          logs.push({
            id: `spend_${order.id}`,
            orderId: order.id,
            type: 'spent' as const,
            points: order.pointsSpent || 0,
            description: `Redeemed voucher ${order.voucherCode ? `(${order.voucherCode})` : ''} on Order #${order.id?.slice(-4) || '—'}`,
            date: order.createdAt,
            amount: order.total
          });
        }
        return logs;
      }),
    ...userClaimedVouchers.map(cv => ({
      id: `claim_${cv.id || cv.code}`,
      orderId: '',
      type: 'spent' as const,
      points: cv.pointsCost,
      description: `Purchased Voucher "${cv.code}" with points`,
      date: cv.claimedAt,
      amount: 0
    })),
    ...(adjustment !== 0 ? [{
      id: 'adjustment',
      orderId: '',
      type: adjustment > 0 ? 'earned' as const : 'spent' as const,
      points: Math.abs(adjustment),
      description: adjustment > 0 ? 'Admin Bonus Points' : 'Points Adjustment',
      date: Date.now(),
      amount: 0
    }] : [])
  ].sort((a, b) => b.date - a.date);

  const copyToClipboard = (text: string, label: string = 'Text') => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  return (
    <div className="p-3 sm:p-6 md:p-8 max-w-4xl mx-auto space-y-6 overflow-y-auto pb-24">
      {/* Top Header & Section Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-black/10 dark:border-white/10">
        <div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">
            Customer <span className="text-amber-500">Account</span>
          </h2>
          <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest mt-0.5">
            Loyalty Member Pass & Profile
          </p>
        </div>

        {/* Navigation Switcher Pills */}
        {onNavigate && (
          <div className="flex items-center gap-1 sm:gap-1.5 bg-black/5 dark:bg-white/5 p-1 rounded-2xl border border-black/10 dark:border-white/10 w-full sm:w-auto justify-stretch sm:justify-start">
            <button
              onClick={() => onNavigate('profile')}
              className="flex-1 sm:flex-none px-2.5 sm:px-3 py-1.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider bg-amber-500 text-slate-900 shadow-md transition-all flex items-center justify-center gap-1 sm:gap-1.5 shrink-0"
            >
              <User className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Profile
            </button>
            <button
              onClick={() => onNavigate('order-history')}
              className="flex-1 sm:flex-none px-2.5 sm:px-3 py-1.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all flex items-center justify-center gap-1 sm:gap-1.5 shrink-0"
            >
              <ShoppingBag className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Orders
            </button>
            <button
              onClick={() => onNavigate('rewards-store')}
              className="flex-1 sm:flex-none px-2.5 sm:px-3 py-1.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all flex items-center justify-center gap-1 sm:gap-1.5 shrink-0"
            >
              <Tag className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Rewards
            </button>
          </div>
        )}
      </div>

      {/* Account Info Card & Member Pass QR Code */}
      <div className="bg-white dark:bg-[#0a0a0c] p-4 sm:p-6 rounded-3xl border border-black/10 dark:border-white/5 shadow-xl relative overflow-hidden space-y-6">
        <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-5 pb-6 border-b border-black/5 dark:border-white/5">
          {/* Hidden File Input for Profile Picture */}
          <input
            type="file"
            ref={profilePhotoInputRef}
            onChange={handleProfileFileInputChange}
            accept="image/png, image/jpeg, image/webp, image/gif, image/heic"
            className="hidden"
          />

          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 w-full lg:w-auto">
            {/* Interactive Uploadable Profile Avatar */}
            <div 
              onDragOver={(e) => { e.preventDefault(); setIsDraggingPhoto(true); }}
              onDragLeave={() => setIsDraggingPhoto(false)}
              onDrop={handleDropPhoto}
              className={`relative group w-20 h-20 sm:w-24 sm:h-24 rounded-3xl p-1 transition-all duration-300 shrink-0 ${
                isDraggingPhoto 
                  ? 'ring-4 ring-amber-500 scale-105 bg-amber-500/20' 
                  : 'hover:ring-2 hover:ring-amber-500/60 bg-gradient-to-br from-amber-500/20 via-amber-500/5 to-slate-900/10'
              }`}
            >
              <div className="w-full h-full rounded-[22px] overflow-hidden bg-slate-100 dark:bg-slate-900 border border-amber-500/30 shadow-inner flex items-center justify-center relative">
                {currentPhoto ? (
                  <img
                    src={currentPhoto}
                    alt={user.displayName || 'Profile Avatar'}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full bg-amber-500/10 text-amber-500 font-black text-3xl flex items-center justify-center">
                    {user.displayName?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || <User className="w-10 h-10" />}
                  </div>
                )}

                {/* Uploading Overlay */}
                {isUploadingPhoto && (
                  <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center text-amber-400 gap-1 z-20">
                    <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
                    <span className="text-[9px] font-black uppercase tracking-wider text-white">Saving</span>
                  </div>
                )}

                {/* Hover / Tap Action Overlay */}
                {!isUploadingPhoto && (
                  <button
                    type="button"
                    onClick={() => profilePhotoInputRef.current?.click()}
                    className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1 z-10"
                    title="Click to Upload Profile Photo"
                  >
                    <Upload className="w-5 h-5 text-amber-400" />
                    <span className="text-[9px] font-black uppercase tracking-wider text-amber-200">Change</span>
                  </button>
                )}
              </div>

              {/* Quick Camera Action Badge */}
              <button
                type="button"
                onClick={() => profilePhotoInputRef.current?.click()}
                disabled={isUploadingPhoto}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/40 border-2 border-white dark:border-[#0a0a0c] transition-transform active:scale-90 z-20"
                title="Upload Photo from Device"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {/* User Meta & Action Buttons */}
            <div className="min-w-0 flex-1 space-y-2">
              <div>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight break-words">
                    {user.displayName || user.email?.split('@')[0] || 'Valued Customer'}
                  </h3>
                  {currentPhoto && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Photo Set
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 font-medium break-all mt-0.5">{user.email}</p>
              </div>

              {/* Profile Photo Quick Controls */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => profilePhotoInputRef.current?.click()}
                  disabled={isUploadingPhoto}
                  className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <Upload className="w-3 h-3" />
                  {currentPhoto ? 'Upload New Photo' : 'Upload Photo'}
                </button>

                {currentPhoto && (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsPhotoModalOpen(true)}
                      className="p-1.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/10 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-[10px] font-bold transition-all"
                      title="View Full Size Photo"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveProfilePhoto}
                      disabled={isUploadingPhoto}
                      className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-500 hover:text-rose-600 text-[10px] font-bold transition-all"
                      title="Remove Profile Photo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
              
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-xl">
                  <span className="text-[9px] font-black uppercase tracking-widest text-amber-500 shrink-0">Member ID:</span>
                  <span className="text-xs font-mono font-black text-amber-500 tracking-wider">#{(user as any).shortId || user.uid.slice(0, 5).toUpperCase()}</span>
                  <button onClick={() => copyToClipboard((user as any).shortId || user.uid.slice(0, 5).toUpperCase(), '5-Digit Member ID')} className="p-0.5 hover:bg-amber-500/20 rounded text-amber-500 transition-colors shrink-0" title="Copy Member ID">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-1.5 bg-black/5 dark:bg-white/5 px-2.5 py-1 rounded-xl">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 shrink-0">Full UID:</span>
                  <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 truncate max-w-[100px]">{user.uid}</span>
                  <button onClick={() => copyToClipboard(user.uid, 'Full UID')} className="p-0.5 hover:bg-black/10 dark:hover:bg-white/10 rounded text-slate-400 hover:text-amber-500 transition-colors shrink-0">
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Member QR Pass */}
          <div 
            onClick={() => setIsMemberQrModalOpen(true)}
            className="flex items-center gap-3.5 bg-slate-50 dark:bg-white/5 p-3 sm:p-4 rounded-2xl border border-black/5 dark:border-white/5 shrink-0 w-full lg:w-auto justify-center cursor-pointer hover:border-amber-500/40 hover:bg-amber-500/5 transition-all group"
            title="Click to Enlarge QR Code for Easy Scanning"
          >
            <div className="bg-white p-2 rounded-xl shadow-sm shrink-0 relative">
              <QRCodeSVG 
                id="member-pass-qr-svg"
                value={JSON.stringify({ 
                  type: 'member_pass', 
                  uid: user.uid, 
                  shortId: (userProfile as any)?.shortId || user.uid.slice(0, 5).toUpperCase(),
                  email: user.email, 
                  name: user.displayName || '' 
                })} 
                size={76} 
              />
              <div className="absolute inset-0 bg-slate-950/60 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                <Maximize2 className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[9px] font-black uppercase tracking-widest text-amber-500 flex items-center gap-1">
                <QrCode className="w-3 h-3" /> Member Pass
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 group-hover:text-amber-500 transition-colors">
                Tap to Enlarge QR
              </span>
              <span className="text-[9px] text-slate-400 leading-tight mt-1 max-w-[120px]">
                Scan at POS or Kiosk to earn & use points
              </span>
            </div>
          </div>
        </div>

        {/* Points Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400 block mb-1">Points Balance</span>
              <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight italic">{currentBalance.toLocaleString()} Pts</span>
            </div>
            <div className="w-10 h-10 bg-amber-500 text-slate-900 rounded-xl flex items-center justify-center font-black shadow-md shrink-0">
              <Coins className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400 block mb-1">Total Earned</span>
              <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight italic">+{totalEarnedPoints.toLocaleString()} Pts</span>
            </div>
            <div className="w-10 h-10 bg-emerald-500/20 text-emerald-500 rounded-xl flex items-center justify-center font-black shrink-0">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-purple-600 dark:text-purple-400 block mb-1">Redeemed</span>
              <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight italic">-{totalSpentPoints.toLocaleString()} Pts</span>
            </div>
            <div className="w-10 h-10 bg-purple-500/20 text-purple-500 rounded-xl flex items-center justify-center font-black shrink-0">
              <ArrowDownRight className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Direct Shortcuts to Order History, Rewards Store & Live Customer Chat Pages */}
      {onNavigate && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Saved Custom Mixes Shortcut Card */}
          <div 
            onClick={() => setIsSavedMixesModalOpen(true)}
            className="p-5 bg-white dark:bg-[#0a0a0c] rounded-3xl border border-purple-500/30 dark:border-purple-500/20 shadow-md hover:border-purple-500 transition-all cursor-pointer group flex flex-col justify-between space-y-4 relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                <FlaskConical className="w-6 h-6" />
              </div>
              <span className="text-xs font-black uppercase bg-purple-500/10 text-purple-400 px-3 py-1 rounded-full">
                {savedMixes.length} Saved Mixes
              </span>
            </div>

            <div>
              <h3 className="text-base font-black uppercase italic tracking-tight text-slate-900 dark:text-white group-hover:text-purple-400 transition-colors">
                My Saved Custom Mixes
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                View your personal custom mix formulas and reorder with 1-click.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-purple-400 pt-2 border-t border-black/5 dark:border-white/5">
              <span>View Saved Mixes</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
          {/* Order History Shortcut Card */}
          <div 
            onClick={() => onNavigate('order-history')}
            className="p-5 bg-white dark:bg-[#0a0a0c] rounded-3xl border border-black/10 dark:border-white/5 shadow-md hover:border-amber-500/50 transition-all cursor-pointer group flex flex-col justify-between space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <span className="text-xs font-black uppercase bg-black/5 dark:bg-white/5 px-3 py-1 rounded-full text-slate-500 dark:text-slate-400">
                {orders.length} {orders.length === 1 ? 'Order' : 'Orders'}
              </span>
            </div>

            <div>
              <h3 className="text-base font-black uppercase italic tracking-tight text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors">
                Order History & Receipts
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                View itemized breakdowns, total spent, and status of past purchases.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-500 pt-2 border-t border-black/5 dark:border-white/5">
              <span>View Order History</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Rewards Store Shortcut Card */}
          <div 
            onClick={() => onNavigate('rewards-store')}
            className="p-5 bg-white dark:bg-[#0a0a0c] rounded-3xl border border-black/10 dark:border-white/5 shadow-md hover:border-amber-500/50 transition-all cursor-pointer group flex flex-col justify-between space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                <Tag className="w-6 h-6" />
              </div>
              <span className="text-xs font-black uppercase bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full">
                {userClaimedVouchers.length} Owned Vouchers
              </span>
            </div>

            <div>
              <h3 className="text-base font-black uppercase italic tracking-tight text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors">
                Voucher & Rewards Store
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Redeem your {currentBalance} Pts for exclusive discounts and view your wallet.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-500 pt-2 border-t border-black/5 dark:border-white/5">
              <span>Open Rewards Store</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Live Customer Chat Page Card */}
          <div 
            onClick={() => onNavigate('customer-chat')}
            className="p-5 bg-white dark:bg-[#0a0a0c] rounded-3xl border border-amber-500/30 dark:border-amber-500/20 shadow-md hover:border-amber-500 transition-all cursor-pointer group flex flex-col justify-between space-y-4 relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black group-hover:scale-110 transition-transform shadow-lg">
                <MessageSquare className="w-6 h-6 fill-slate-950" />
              </div>
              <span className="text-xs font-black uppercase bg-green-500/10 text-green-500 px-3 py-1 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Live Barista
              </span>
            </div>

            <div>
              <h3 className="text-base font-black uppercase italic tracking-tight text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors">
                Barista Support Chat
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Chat live with store staff for custom orders, GCash payment help, and assistance.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-500 pt-2 border-t border-black/5 dark:border-white/5">
              <span>Open Live Chat Page</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      )}

      {/* Customer Review & Splash Spotlight Section */}
      <div className="bg-white dark:bg-[#0a0a0c] p-5 sm:p-6 rounded-3xl border border-black/10 dark:border-white/5 shadow-xl relative overflow-hidden space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
              <Star className="w-5 h-5 fill-amber-500" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black uppercase italic tracking-tight text-slate-900 dark:text-white">
                Customer Review & Spotlight
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {completedOrdersCount >= 3 
                  ? 'Share your experience to be featured on our front store splash screen!' 
                  : 'Complete 3 orders to unlock verified patron reviews.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsReviewModalOpen(true)}
            className={`w-full sm:w-auto px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md ${
              completedOrdersCount >= 3
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                : 'bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <MessageSquareQuote className="w-4 h-4" />
            {userReview ? 'Edit Your Review' : completedOrdersCount >= 3 ? 'Leave a Review' : 'Review Requirements'}
          </button>
        </div>

        {/* Status Display Card */}
        {userReview ? (
          <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <div className="flex items-center text-amber-400">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-3.5 h-3.5 ${s <= userReview.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`}
                    />
                  ))}
                </div>
                <span className="text-xs font-black text-amber-500 ml-1">{userReview.rating}.0</span>
              </div>
              <p className="text-xs italic text-slate-600 dark:text-slate-300 font-medium line-clamp-2">
                "{userReview.comment}"
              </p>
            </div>
            
            <div>
              {userReview.isApproved ? (
                <span className="text-[10px] font-black uppercase px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1 shrink-0">
                  <CheckCircle2 className="w-3 h-3" /> Live on Splash
                </span>
              ) : (
                <span className="text-[10px] font-black uppercase px-3 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1 shrink-0 animate-pulse">
                  <Clock className="w-3 h-3" /> Pending Admin Approval
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className={`w-4 h-4 ${completedOrdersCount >= 3 ? 'text-emerald-500' : 'text-slate-400'}`} />
              <span className="text-slate-600 dark:text-slate-300 font-medium">
                Verified Orders: <strong>{completedOrdersCount} / 3 Completed</strong>
              </span>
            </div>
            {completedOrdersCount < 3 && (
              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">
                {3 - completedOrdersCount} more needed
              </span>
            )}
          </div>
        )}
      </div>

      {/* Points Activity Log */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-black uppercase italic tracking-tighter flex items-center gap-2 text-slate-900 dark:text-white">
            <Award className="w-5 h-5 text-amber-500" />
            Points Activity Log ({pointsLog.length})
          </h3>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden xs:inline">
            Points earned & redeemed
          </span>
        </div>

        {pointsLog.length === 0 ? (
          <div className="bg-white dark:bg-[#0a0a0c] p-8 sm:p-12 rounded-3xl border border-black/10 dark:border-white/5 text-center space-y-3">
            <Coins className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
            <p className="font-bold text-slate-500 uppercase tracking-widest text-xs">No points activity recorded yet</p>
            <p className="text-xs text-slate-400">Place an order to start earning loyalty points!</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {pointsLog.map(log => (
              <div key={log.id} className="p-3.5 sm:p-4 bg-white dark:bg-[#0a0a0c] rounded-2xl border border-black/10 dark:border-white/5 shadow-sm flex items-center justify-between gap-3 hover:border-amber-500/30 transition-all">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                    log.type === 'earned' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-purple-500/10 text-purple-500'
                  }`}>
                    {log.type === 'earned' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">{log.description}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 mt-0.5">
                      <Clock className="w-3 h-3 shrink-0" />
                      {new Date(log.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      {log.amount > 0 && <span className="hidden xs:inline">• Total: ₱{log.amount.toLocaleString()}</span>}
                    </div>
                  </div>
                </div>

                <div className={`text-right font-black text-sm sm:text-base italic shrink-0 ${
                  log.type === 'earned' ? 'text-emerald-500' : 'text-purple-500'
                }`}>
                  {log.type === 'earned' ? `+${log.points}` : `-${log.points}`} Pts
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Enlarged Member Pass QR Modal */}
      {isMemberQrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-white/10 w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-6 text-white text-center relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-500 font-black text-xs uppercase tracking-widest">
                <QrCode className="w-4 h-4" /> Member Digital Pass
              </div>
              <button
                onClick={() => setIsMemberQrModalOpen(false)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-white p-6 rounded-3xl inline-block shadow-2xl border-4 border-amber-500/30">
              <QRCodeSVG 
                id="member-pass-qr-svg-modal"
                value={JSON.stringify({ 
                  type: 'member_pass', 
                  uid: user.uid, 
                  shortId: (userProfile as any)?.shortId || user.uid.slice(0, 5).toUpperCase(),
                  email: user.email, 
                  name: user.displayName || '' 
                })} 
                size={220} 
                level="H"
              />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-white">{user.displayName || 'Loyalty Member'}</h3>
              <p className="text-xs text-amber-400 font-mono font-bold uppercase tracking-wider">
                #{ (userProfile as any)?.shortId || user.uid.slice(0, 5).toUpperCase() }
              </p>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                Show this QR Code to Cashier or Kiosk Scanner
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleDownloadMemberQr}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" /> Download QR Code Image
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Photo Lightbox Modal */}
      {isPhotoModalOpen && userProfile?.photoURL && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-white/10 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 text-white text-center relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-500 font-black text-xs uppercase tracking-widest">
                <Camera className="w-4 h-4" /> Face ID Profile Photo
              </div>
              <button
                onClick={() => setIsPhotoModalOpen(false)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative rounded-2xl overflow-hidden border-2 border-amber-500/40 bg-black max-h-[60vh] flex items-center justify-center">
              <img 
                src={userProfile.photoURL} 
                alt={user.displayName || 'Customer'} 
                className="w-full h-auto max-h-[60vh] object-contain"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="space-y-1 text-center">
              <h4 className="text-sm font-bold text-white">{user.displayName || 'Customer'}</h4>
              <p className="text-[10px] text-slate-400 font-mono">{user.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Saved Custom Mixes Modal */}
      {isSavedMixesModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-white/15 p-6 rounded-3xl max-w-2xl w-full text-slate-100 space-y-5 relative shadow-2xl max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setIsSavedMixesModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-black">
                <FlaskConical className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white uppercase">My Saved Custom Mixes</h3>
                <p className="text-xs text-slate-400">Your personal laboratory mix formulas</p>
              </div>
            </div>

            {savedMixes.length === 0 ? (
              <div className="p-8 rounded-2xl bg-black/30 border border-white/10 text-center space-y-3">
                <FlaskConical className="w-12 h-12 text-slate-600 mx-auto" />
                <h4 className="text-sm font-black text-white uppercase">No Saved Formulas Yet</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Create your custom mix in the "Your MIX" Drink Studio and click "Save Mix" to keep your favorites here!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {savedMixes.map(mix => (
                  <div
                    key={mix.id}
                    className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-purple-500/50 transition-all"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-white uppercase">{mix.mixName}</h4>
                        <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-purple-500/20 text-purple-300">
                          {mix.cupSize?.name || '16 oz'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-mono">
                        {mix.recipeItems.map(i => `${i.quantity}${i.unit} ${i.name}`).join(', ')}
                      </p>
                      <div className="flex items-center gap-3 text-[10px] text-slate-500 pt-1">
                        <span>Price: <strong className="text-amber-400">₱{mix.totalPrice}</strong></span>
                        {mix.caffeineMg !== undefined && <span>Caffeine: <strong className="text-amber-300">{mix.caffeineMg}mg</strong></span>}
                        {mix.calories !== undefined && <span>Energy: <strong className="text-emerald-300">{mix.calories} kcal</strong></span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {onAddToCartCustomMix && (
                        <button
                          onClick={() => {
                            onAddToCartCustomMix(mix);
                            toast.success(`Added "${mix.mixName}" to your cart!`);
                            setIsSavedMixesModalOpen(false);
                          }}
                          className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider transition-all shadow-md"
                        >
                          Add to Order (₱{mix.totalPrice})
                        </button>
                      )}
                      {onDeleteSavedMix && (
                        <button
                          onClick={async () => {
                            await onDeleteSavedMix(mix.id);
                          }}
                          className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all"
                          title="Delete saved mix"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Customer Review Submission / Editing Modal */}
      {onSubmitReview && (
        <CustomerReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          userOrders={orders}
          userProfile={userProfile || null}
          currentUserUid={user?.uid}
          currentUserName={user?.displayName}
          currentUserPhoto={userProfile?.photoURL || user?.photoURL}
          existingReview={userReview || null}
          onSubmitReview={onSubmitReview}
        />
      )}
    </div>
  );
}
