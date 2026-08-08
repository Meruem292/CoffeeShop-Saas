import React, { useState } from 'react';
import { Tag, Coins, Copy, Check, User, ShoppingBag, Award, Sparkles, QrCode, Lock } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Voucher, ClaimedVoucher, ViewMode } from '../types';
import { useToast } from '../lib/ToastContext';

interface RewardsStorePageProps {
  vouchers: Voucher[];
  userClaimedVouchers?: ClaimedVoucher[];
  currentBalance: number;
  onClaimVoucher?: (voucher: Voucher, currentBalance: number) => Promise<boolean>;
  onNavigate?: (view: ViewMode) => void;
}

export function RewardsStorePage({
  vouchers,
  userClaimedVouchers = [],
  currentBalance,
  onClaimVoucher,
  onNavigate
}: RewardsStorePageProps) {
  const { toast } = useToast();
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string = 'Voucher code') => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const activeVouchers = vouchers.filter(v => v.isActive && !v.isAdminOnly);

  return (
    <div className="p-3 sm:p-6 md:p-8 max-w-4xl mx-auto space-y-6 overflow-y-auto pb-24">
      {/* Top Header & Section Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-black/10 dark:border-white/10">
        <div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter flex items-center gap-2">
            <Tag className="w-6 h-6 text-amber-500 shrink-0" />
            Rewards <span className="text-amber-500">& Voucher Store</span>
          </h2>
          <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest mt-0.5">
            Redeem points for discounts & promos
          </p>
        </div>

        {/* Sub-Nav Controls */}
        {onNavigate && (
          <div className="flex items-center gap-1.5 bg-black/5 dark:bg-white/5 p-1 rounded-2xl border border-black/10 dark:border-white/10 w-full sm:w-auto justify-stretch sm:justify-start">
            <button
              onClick={() => onNavigate('profile')}
              className="flex-1 sm:flex-none px-3 py-1.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all flex items-center justify-center gap-1.5"
            >
              <User className="w-3.5 h-3.5" /> Profile
            </button>
            <button
              onClick={() => onNavigate('order-history')}
              className="flex-1 sm:flex-none px-3 py-1.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all flex items-center justify-center gap-1.5"
            >
              <ShoppingBag className="w-3.5 h-3.5" /> Orders
            </button>
            <button
              onClick={() => onNavigate('rewards-store')}
              className="flex-1 sm:flex-none px-3 py-1.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider bg-amber-500 text-slate-900 shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <Tag className="w-3.5 h-3.5" /> Rewards
            </button>
          </div>
        )}
      </div>

      {/* Points Balance Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 p-4 sm:p-6 rounded-3xl border border-amber-500/30 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-lg shrink-0">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400 block">Available Points Balance</span>
            <span className="text-2xl sm:text-3xl font-black text-white italic tracking-tight">{currentBalance.toLocaleString()} Pts</span>
          </div>
        </div>

        <div className="text-[11px] font-bold text-amber-200/80 bg-amber-500/10 px-3.5 py-2 rounded-2xl border border-amber-500/20 max-w-xs">
          ✨ Earn +1 Point for every ₱10 spent on orders!
        </div>
      </div>

      {/* Section 1: My Claimed Vouchers Wallet */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-black uppercase italic tracking-tighter flex items-center gap-2 text-slate-900 dark:text-white">
            <QrCode className="w-5 h-5 text-amber-500" />
            My Claimed Vouchers Wallet ({userClaimedVouchers.length})
          </h3>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden xs:inline">
            Use code or scan QR at Kiosk/Checkout
          </span>
        </div>

        {userClaimedVouchers.length === 0 ? (
          <div className="bg-white dark:bg-[#0a0a0c] p-6 sm:p-10 rounded-3xl border border-black/10 dark:border-white/5 text-center space-y-2">
            <Tag className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
            <p className="font-bold text-slate-500 uppercase tracking-widest text-xs">No claimed vouchers in your wallet</p>
            <p className="text-xs text-slate-400">Claim vouchers below using your points to save on future orders!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {userClaimedVouchers.map((cv, idx) => (
              <div key={cv.id || idx} className="p-4 sm:p-5 bg-white dark:bg-[#0a0a0c] rounded-3xl border-2 border-amber-500/30 shadow-md flex flex-col xs:flex-row items-center xs:items-start gap-4 relative overflow-hidden group">
                <div className="bg-white p-2 rounded-2xl shadow-sm shrink-0 border border-black/10">
                  <QRCodeSVG value={cv.code} size={72} />
                </div>
                <div className="flex-1 min-w-0 text-center xs:text-left w-full">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="font-black text-base text-slate-900 dark:text-white tracking-wider uppercase truncate">{cv.code}</span>
                    <span className="text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-full shrink-0">
                      Owned ({cv.pointsCost} Pts)
                    </span>
                  </div>

                  <div className="text-sm font-bold text-amber-500 mt-1">
                    {cv.type === 'percentage' ? `${cv.value}% OFF` : `₱${cv.value} OFF`}
                  </div>

                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    {cv.minSpend ? `Min spend: ₱${cv.minSpend}` : 'No minimum spend'}
                  </div>

                  <div className="flex items-center justify-center xs:justify-start gap-2 mt-3">
                    <button
                      onClick={() => copyToClipboard(cv.code, 'Voucher Code')}
                      className="px-3 py-1.5 bg-amber-500 text-slate-900 font-black uppercase text-[10px] tracking-wider rounded-xl hover:bg-amber-400 transition-all flex items-center gap-1 shadow-sm active:scale-95"
                    >
                      <Copy className="w-3 h-3" /> Copy Code
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 2: Rewards Store & Public Promos */}
      <div className="space-y-4 pt-6 border-t border-black/10 dark:border-white/10">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-black uppercase italic tracking-tighter flex items-center gap-2 text-slate-900 dark:text-white">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Redeemable Rewards & Public Promos
          </h3>
          <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">
            {activeVouchers.length} Available
          </span>
        </div>

        {activeVouchers.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No active rewards vouchers available at the moment.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {activeVouchers.map(voucher => {
              const isPointsVoucher = (voucher.pointsCost || 0) > 0;
              const alreadyClaimed = userClaimedVouchers.some(cv => cv.voucherId === voucher.id || cv.code === voucher.code);
              const canAfford = currentBalance >= (voucher.pointsCost || 0);

              return (
                <div key={voucher.id} className="p-4 sm:p-5 bg-white dark:bg-[#0a0a0c] rounded-2xl border border-black/10 dark:border-white/5 shadow-sm flex flex-col xs:flex-row items-start gap-3.5 relative overflow-hidden group hover:border-amber-500/40 transition-all">
                  <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                    <Tag className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0 w-full">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-black text-base text-slate-900 dark:text-white tracking-wider uppercase truncate">{voucher.code}</span>
                      {isPointsVoucher ? (
                        <span className="text-[10px] font-black uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2.5 py-0.5 rounded-full shrink-0">
                          {voucher.pointsCost} Pts
                        </span>
                      ) : (
                        <span className="text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2.5 py-0.5 rounded-full shrink-0">
                          Public Code
                        </span>
                      )}
                    </div>
                    
                    <div className="text-sm font-bold text-amber-500 mt-1">
                      {voucher.type === 'percentage' ? `${voucher.value}% Discount` : `₱${voucher.value} Off Entire Order`}
                    </div>

                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 space-y-0.5">
                      {voucher.minSpend && <div>• Min spend: ₱{voucher.minSpend}</div>}
                      {voucher.usageLimit && <div>• Used {voucher.usedCount || 0} / {voucher.usageLimit} times</div>}
                    </div>

                    <div className="mt-3.5 flex items-center gap-2">
                      {isPointsVoucher ? (
                        alreadyClaimed ? (
                          <span className="text-[10px] font-black uppercase text-emerald-500 flex items-center gap-1 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                            <Check className="w-3.5 h-3.5" /> Claimed in Wallet
                          </span>
                        ) : (
                          <button
                            disabled={!canAfford || claimingId === voucher.id}
                            onClick={async () => {
                              if (onClaimVoucher) {
                                setClaimingId(voucher.id);
                                await onClaimVoucher(voucher, currentBalance);
                                setClaimingId(null);
                              }
                            }}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                              canAfford 
                                ? 'bg-amber-500 text-slate-900 hover:bg-amber-400 shadow-md active:scale-95' 
                                : 'bg-slate-200 dark:bg-white/10 text-slate-400 cursor-not-allowed flex items-center gap-1'
                            }`}
                          >
                            {!canAfford && <Lock className="w-3 h-3" />}
                            {claimingId === voucher.id ? 'Claiming...' : canAfford ? `Redeem (${voucher.pointsCost} Pts)` : `Need ${voucher.pointsCost} Pts`}
                          </button>
                        )
                      ) : (
                        <button
                          onClick={() => copyToClipboard(voucher.code, 'Promo Code')}
                          className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:text-amber-500 flex items-center gap-1.5 transition-colors bg-black/5 dark:bg-white/5 px-3 py-1.5 rounded-xl border border-black/5 dark:border-white/5"
                        >
                          <Copy className="w-3 h-3" /> Copy Promo Code
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
