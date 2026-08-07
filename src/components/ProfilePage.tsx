import React, { useState } from 'react';
import { User, Copy, Tag, Sparkles, Clock, ShoppingBag, Award, ArrowUpRight, ArrowDownRight, ChevronDown, ChevronUp, CheckCircle2, Receipt, Coins, Check, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Voucher, Order, ClaimedVoucher, UserProfile } from '../types';
import { useToast } from '../lib/ToastContext';

interface ProfilePageProps {
  user: any;
  userProfile?: UserProfile | null;
  vouchers: Voucher[];
  userClaimedVouchers?: ClaimedVoucher[];
  orders: Order[];
  onClaimVoucher?: (voucher: Voucher, currentBalance: number) => Promise<boolean>;
}

export function ProfilePage({ user, userProfile, vouchers, userClaimedVouchers = [], orders, onClaimVoucher }: ProfilePageProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'points' | 'orders' | 'vouchers'>('points');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  if (!user) return <div className="p-8 text-center text-slate-500">Please log in to view your profile.</div>;

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

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'completed': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'ready': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'preparing': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'pending':
      case 'pending-verification': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'unpaid': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'cancelled': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-6 overflow-y-auto pb-24">
      {/* Header Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">
            Customer <span className="text-amber-500">Account</span>
          </h2>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
            Points Balance, Rewards & Purchase History
          </p>
        </div>
      </div>

      {/* Account Info Card & Points Corner Badge */}
      <div className="bg-white dark:bg-[#0a0a0c] p-6 rounded-3xl border border-black/10 dark:border-white/5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-black/5 dark:border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner shrink-0">
              {user.displayName?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || <User className="w-8 h-8" />}
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {user.displayName || user.email?.split('@')[0] || 'Valued Customer'}
              </h3>
              <p className="text-xs text-slate-500 font-medium">{user.email}</p>
              
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">ID:</span>
                <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300">{user.uid}</span>
                <button onClick={() => copyToClipboard(user.uid)} className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg text-slate-400 hover:text-amber-500 transition-colors">
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* QR Code section */}
          <div className="flex items-center gap-4 bg-slate-50 dark:bg-white/5 p-3 rounded-2xl border border-black/5 dark:border-white/5 shrink-0 self-stretch md:self-auto justify-center">
            <div className="bg-white p-2 rounded-xl shadow-sm">
              <QRCodeSVG value={user.uid} size={80} />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[9px] font-black uppercase tracking-widest text-amber-500">Member Pass</span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Scan at Counter</span>
              <span className="text-[9px] text-slate-400 mt-1">Scan for fast points credit</span>
            </div>
          </div>
        </div>

        {/* 3 Points Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
          <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400 block mb-1">Points Balance</span>
              <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight italic">{currentBalance.toLocaleString()} Pts</span>
            </div>
            <div className="w-10 h-10 bg-amber-500 text-slate-900 rounded-xl flex items-center justify-center font-black shadow-md">
              <Coins className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400 block mb-1">Total Earned</span>
              <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight italic">+{totalEarnedPoints.toLocaleString()} Pts</span>
            </div>
            <div className="w-10 h-10 bg-emerald-500/20 text-emerald-500 rounded-xl flex items-center justify-center font-black">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-purple-600 dark:text-purple-400 block mb-1">Points Redeemed</span>
              <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight italic">-{totalSpentPoints.toLocaleString()} Pts</span>
            </div>
            <div className="w-10 h-10 bg-purple-500/20 text-purple-500 rounded-xl flex items-center justify-center font-black">
              <ArrowDownRight className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-black/10 dark:border-white/10 gap-2 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setActiveTab('points')}
          className={`pb-3 px-4 text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === 'points'
              ? 'border-amber-500 text-amber-500'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Award className="w-4 h-4" />
          Points History ({pointsLog.length})
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 px-4 text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === 'orders'
              ? 'border-amber-500 text-amber-500'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          Purchases & Orders ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('vouchers')}
          className={`pb-3 px-4 text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeTab === 'vouchers'
              ? 'border-amber-500 text-amber-500'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Tag className="w-4 h-4" />
          Available Promos & Vouchers ({vouchers.filter(v => v.isActive && !v.isAdminOnly).length})
        </button>
      </div>

      {/* TAB 1: POINTS HISTORY LOG */}
      {activeTab === 'points' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black uppercase italic tracking-tighter">
              Points <span className="text-amber-500">Activity Log</span>
            </h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Every transaction point movement
            </span>
          </div>

          {pointsLog.length === 0 ? (
            <div className="bg-white dark:bg-[#0a0a0c] p-12 rounded-3xl border border-black/10 dark:border-white/5 text-center space-y-3">
              <Coins className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
              <p className="font-bold text-slate-500 uppercase tracking-widest text-xs">No points activity recorded yet</p>
              <p className="text-xs text-slate-400">Place an order to start earning loyalty points!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pointsLog.map(log => (
                <div key={log.id} className="p-4 bg-white dark:bg-[#0a0a0c] rounded-2xl border border-black/10 dark:border-white/5 shadow-sm flex items-center justify-between hover:border-amber-500/30 transition-all">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                      log.type === 'earned' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-purple-500/10 text-purple-500'
                    }`}>
                      {log.type === 'earned' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white">{log.description}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {new Date(log.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        {log.amount && <span>• Order Total: ₱{log.amount.toLocaleString()}</span>}
                      </div>
                    </div>
                  </div>

                  <div className={`text-right font-black text-base italic ${
                    log.type === 'earned' ? 'text-emerald-500' : 'text-purple-500'
                  }`}>
                    {log.type === 'earned' ? `+${log.points}` : `-${log.points}`} Pts
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PURCHASE & TRANSACTION HISTORY */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black uppercase italic tracking-tighter">
              Purchase <span className="text-amber-500">History</span>
            </h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {orders.length} Past {orders.length === 1 ? 'Order' : 'Orders'}
            </span>
          </div>

          {orders.length === 0 ? (
            <div className="bg-white dark:bg-[#0a0a0c] p-12 rounded-3xl border border-black/10 dark:border-white/5 text-center space-y-3">
              <ShoppingBag className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
              <p className="font-bold text-slate-500 uppercase tracking-widest text-xs">No purchase history found</p>
              <p className="text-xs text-slate-400">Order your favorite drinks to view them here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map(order => {
                const isExpanded = expandedOrderId === order.id;
                return (
                  <div key={order.id} className="bg-white dark:bg-[#0a0a0c] rounded-2xl border border-black/10 dark:border-white/5 shadow-sm overflow-hidden transition-all">
                    {/* Order Summary Row */}
                    <div 
                      onClick={() => setExpandedOrderId(isExpanded ? null : order.id || null)}
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-black text-xs shrink-0">
                          <Receipt className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                            Order #{order.id?.slice(-6) || '—'}
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                          </div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 mt-0.5">
                            <Clock className="w-3 h-3" />
                            {new Date(order.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                            <span>• {order.items?.length || 0} items</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-black text-base text-slate-900 dark:text-white italic">₱{order.total.toLocaleString()}</div>
                          {((order.pointsEarned || 0) > 0 || (order.pointsSpent || 0) > 0) && (
                            <div className="text-[9px] font-bold text-amber-500 uppercase tracking-wider">
                              {order.pointsEarned ? `+${order.pointsEarned} Pts` : ''} {order.pointsSpent ? `-${order.pointsSpent} Pts` : ''}
                            </div>
                          )}
                        </div>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </div>
                    </div>

                    {/* Expanded Order Details */}
                    {isExpanded && (
                      <div className="p-4 bg-slate-50 dark:bg-white/5 border-t border-black/5 dark:border-white/5 space-y-3 animate-in fade-in duration-200">
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Order Items Breakdown</div>
                        
                        <div className="space-y-2">
                          {order.items?.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2.5 bg-white dark:bg-black/20 rounded-xl border border-black/5 dark:border-white/5 text-xs">
                              <div className="flex items-center gap-2">
                                <span className="font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-lg text-[10px]">{item.quantity}x</span>
                                <div className="font-bold text-slate-800 dark:text-slate-200">
                                  {item.name}
                                  {item.selectedSize && <span className="text-[10px] text-slate-400 ml-1">({item.selectedSize.name})</span>}
                                  {item.sugarLevel && <span className="text-[10px] text-slate-400 ml-1">• Sugar: {item.sugarLevel}</span>}
                                </div>
                              </div>
                              <span className="font-bold text-slate-900 dark:text-white">₱{(item.price * item.quantity).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>

                        {/* Order Financial Breakdown */}
                        <div className="pt-3 border-t border-black/5 dark:border-white/5 space-y-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                          {order.subtotal && (
                            <div className="flex justify-between">
                              <span>Subtotal</span>
                              <span>₱{order.subtotal.toLocaleString()}</span>
                            </div>
                          )}
                          {order.discountAmount ? (
                            <div className="flex justify-between text-emerald-500 font-bold">
                              <span>Voucher Discount {order.voucherCode ? `(${order.voucherCode})` : ''}</span>
                              <span>-₱{order.discountAmount.toLocaleString()}</span>
                            </div>
                          ) : null}
                          {order.pointsSpent ? (
                            <div className="flex justify-between text-purple-500 font-bold">
                              <span>Points Redeemed</span>
                              <span>-{order.pointsSpent} Pts</span>
                            </div>
                          ) : null}
                          <div className="flex justify-between font-black text-slate-900 dark:text-white text-xs pt-1 border-t border-black/5 dark:border-white/5">
                            <span>Total Paid ({order.paymentMethod?.toUpperCase() || 'COUNTER'})</span>
                            <span className="text-amber-500 text-sm">₱{order.total.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: AVAILABLE VOUCHERS & REWARDS STORE */}
      {activeTab === 'vouchers' && (
        <div className="space-y-8">
          {/* Section 1: My Claimed Vouchers Wallet */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black uppercase italic tracking-tighter flex items-center gap-2">
                <Tag className="w-5 h-5 text-amber-500" />
                My Claimed Vouchers Wallet ({userClaimedVouchers.length})
              </h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Use at kiosk or checkout
              </span>
            </div>

            {userClaimedVouchers.length === 0 ? (
              <div className="bg-white dark:bg-[#0a0a0c] p-8 rounded-3xl border border-black/10 dark:border-white/5 text-center space-y-2">
                <Tag className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
                <p className="font-bold text-slate-500 uppercase tracking-widest text-xs">No claimed vouchers in your wallet</p>
                <p className="text-xs text-slate-400">Redeem vouchers from the rewards store below using your points!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userClaimedVouchers.map((cv, idx) => (
                  <div key={cv.id || idx} className="p-5 bg-white dark:bg-[#0a0a0c] rounded-3xl border-2 border-amber-500/30 shadow-md flex items-start gap-4 relative overflow-hidden group">
                    <div className="bg-white p-2 rounded-2xl shadow-sm shrink-0 border border-black/5">
                      <QRCodeSVG value={cv.code} size={70} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-black text-base text-slate-900 dark:text-white tracking-wider uppercase">{cv.code}</span>
                        <span className="text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                          Owned ({cv.pointsCost} Pts)
                        </span>
                      </div>

                      <div className="text-sm font-bold text-amber-500 mt-1">
                        {cv.type === 'percentage' ? `${cv.value}% OFF` : `₱${cv.value} OFF`}
                      </div>

                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                        {cv.minSpend ? `Min spend: ₱${cv.minSpend}` : 'No minimum spend'}
                      </div>

                      <div className="flex items-center gap-2 mt-3">
                        <button
                          onClick={() => copyToClipboard(cv.code, 'Voucher Code')}
                          className="px-3 py-1.5 bg-amber-500 text-slate-900 font-black uppercase text-[10px] tracking-wider rounded-xl hover:bg-amber-400 transition-all flex items-center gap-1 shadow-sm"
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
          <div className="space-y-4 pt-4 border-t border-black/10 dark:border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black uppercase italic tracking-tighter flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-500" />
                Rewards Store & Public Promos
              </h3>
              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">
                Balance: {currentBalance} Pts
              </span>
            </div>

            {vouchers.filter(v => v.isActive && !v.isAdminOnly).length === 0 ? (
              <p className="text-sm opacity-50">No active vouchers available at the moment.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vouchers.filter(v => v.isActive && !v.isAdminOnly).map(voucher => {
                  const isPointsVoucher = (voucher.pointsCost || 0) > 0;
                  const alreadyClaimed = userClaimedVouchers.some(cv => cv.voucherId === voucher.id || cv.code === voucher.code);
                  const canAfford = currentBalance >= (voucher.pointsCost || 0);

                  return (
                    <div key={voucher.id} className="p-5 bg-white dark:bg-[#0a0a0c] rounded-2xl border border-black/10 dark:border-white/5 shadow-sm flex items-start gap-4 relative overflow-hidden group hover:border-amber-500/50 transition-all">
                      <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                        <Tag className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-black text-base text-slate-900 dark:text-white tracking-wider uppercase">{voucher.code}</span>
                          {isPointsVoucher ? (
                            <span className="text-[10px] font-black uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
                              {voucher.pointsCost} Pts
                            </span>
                          ) : (
                            <span className="text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
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

                        <div className="mt-3 flex items-center gap-2">
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
                                    : 'bg-slate-200 dark:bg-white/10 text-slate-400 cursor-not-allowed'
                                }`}
                              >
                                {claimingId === voucher.id ? 'Claiming...' : canAfford ? `Redeem (${voucher.pointsCost} Pts)` : `Need ${voucher.pointsCost} Pts`}
                              </button>
                            )
                          ) : (
                            <button
                              onClick={() => copyToClipboard(voucher.code, 'Promo Code')}
                              className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:text-amber-500 flex items-center gap-1.5 transition-colors"
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
      )}
    </div>
  );
}
