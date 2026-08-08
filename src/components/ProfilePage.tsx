import React from 'react';
import { User, Copy, Tag, Clock, ShoppingBag, Award, ArrowUpRight, ArrowDownRight, Coins, ArrowRight, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Voucher, Order, ClaimedVoucher, UserProfile, ViewMode } from '../types';
import { useToast } from '../lib/ToastContext';

interface ProfilePageProps {
  user: any;
  userProfile?: UserProfile | null;
  vouchers: Voucher[];
  userClaimedVouchers?: ClaimedVoucher[];
  orders: Order[];
  onClaimVoucher?: (voucher: Voucher, currentBalance: number) => Promise<boolean>;
  onNavigate?: (view: ViewMode) => void;
}

export function ProfilePage({ user, userProfile, vouchers, userClaimedVouchers = [], orders, onClaimVoucher, onNavigate }: ProfilePageProps) {
  const { toast } = useToast();

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
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 w-full lg:w-auto">
            <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-2xl flex items-center justify-center font-black text-2xl shadow-inner shrink-0">
              {user.displayName?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || <User className="w-8 h-8" />}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight break-words">
                {user.displayName || user.email?.split('@')[0] || 'Valued Customer'}
              </h3>
              <p className="text-xs text-slate-500 font-medium break-all">{user.email}</p>
              
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
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
          <div className="flex items-center gap-3.5 bg-slate-50 dark:bg-white/5 p-3 sm:p-4 rounded-2xl border border-black/5 dark:border-white/5 shrink-0 w-full lg:w-auto justify-center">
            <div className="bg-white p-2 rounded-xl shadow-sm shrink-0">
              <QRCodeSVG 
                value={JSON.stringify({ 
                  type: 'member_pass', 
                  uid: user.uid, 
                  shortId: (user as any).shortId || user.uid.slice(0, 5).toUpperCase(),
                  email: user.email, 
                  name: user.displayName || '' 
                })} 
                size={76} 
              />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[9px] font-black uppercase tracking-widest text-amber-500 flex items-center gap-1">
                <QrCode className="w-3 h-3" /> Member Pass
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">Scan at Counter</span>
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

      {/* Direct Shortcuts to Order History & Rewards Store Pages */}
      {onNavigate && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        </div>
      )}

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
    </div>
  );
}
