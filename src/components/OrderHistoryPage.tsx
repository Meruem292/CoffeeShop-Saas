import React, { useState } from 'react';
import { ShoppingBag, Clock, Receipt, ChevronDown, ChevronUp, User, Tag, Award, Search, Filter, ArrowLeft } from 'lucide-react';
import { Order, ViewMode } from '../types';

interface OrderHistoryPageProps {
  orders: Order[];
  onNavigate?: (view: ViewMode) => void;
}

export function OrderHistoryPage({ orders = [], onNavigate }: OrderHistoryPageProps) {
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredOrders = orders.filter(order => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesSearch = !searchQuery || 
      order.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items?.some(i => i.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      order.voucherCode?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  }).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

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
    <div className="p-3 sm:p-6 md:p-8 max-w-4xl mx-auto space-y-5 sm:space-y-6 overflow-y-auto pb-24">
      {/* Top Customer Section Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/10 dark:border-white/10">
        <div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-amber-500 shrink-0" />
            Purchase <span className="text-amber-500">History</span>
          </h2>
          <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest mt-0.5">
            View & track all your past orders
          </p>
        </div>

        {/* Sub-Nav Pill Controls */}
        {onNavigate && (
          <div className="flex items-center gap-1 sm:gap-1.5 bg-black/5 dark:bg-white/5 p-1 rounded-2xl border border-black/10 dark:border-white/10 w-full sm:w-auto justify-stretch sm:justify-start">
            <button
              onClick={() => onNavigate('profile')}
              className="flex-1 sm:flex-none px-2.5 sm:px-3 py-1.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all flex items-center justify-center gap-1 sm:gap-1.5 shrink-0"
            >
              <User className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Profile
            </button>
            <button
              onClick={() => onNavigate('order-history')}
              className="flex-1 sm:flex-none px-2.5 sm:px-3 py-1.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider bg-amber-500 text-slate-900 shadow-md transition-all flex items-center justify-center gap-1 sm:gap-1.5 shrink-0"
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

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white dark:bg-[#0a0a0c] p-3 sm:p-4 rounded-2xl border border-black/10 dark:border-white/5 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search order ID or item..."
            className="w-full pl-10 pr-4 py-2.5 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-1 -mx-1 px-1 touch-pan-x">
          {['all', 'pending', 'preparing', 'ready', 'completed', 'cancelled'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap shrink-0 ${
                statusFilter === st
                  ? 'bg-amber-500 text-slate-900 font-black'
                  : 'bg-black/5 dark:bg-white/5 text-slate-500 hover:text-slate-900 dark:hover:text-white border border-black/5 dark:border-white/5'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white dark:bg-[#0a0a0c] p-8 sm:p-12 rounded-3xl border border-black/10 dark:border-white/5 text-center space-y-3">
          <ShoppingBag className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
          <p className="font-bold text-slate-500 uppercase tracking-widest text-xs">No orders found</p>
          <p className="text-xs text-slate-400">You haven't placed any orders matching this filter yet.</p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredOrders.map(order => {
            const isExpanded = expandedOrderId === order.id;
            return (
              <div key={order.id} className="bg-white dark:bg-[#0a0a0c] rounded-2xl border border-black/10 dark:border-white/5 shadow-sm overflow-hidden transition-all hover:border-amber-500/30">
                {/* Summary Header */}
                <div 
                  onClick={() => setExpandedOrderId(isExpanded ? null : order.id || null)}
                  className="p-3.5 sm:p-5 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-black text-xs shrink-0">
                        <Receipt className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex flex-wrap items-center gap-1.5 sm:gap-2">
                          <span className="truncate">Order #{order.id?.slice(-6) || '—'}</span>
                          <span className={`text-[8px] sm:text-[9px] font-black uppercase px-2 sm:px-2.5 py-0.5 rounded-full border shrink-0 ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider flex flex-wrap items-center gap-1.5 sm:gap-2 mt-0.5">
                          <span className="flex items-center gap-1 whitespace-nowrap">
                            <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                            {new Date(order.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                          <span className="whitespace-nowrap">• {order.items?.length || 0} ITEMS</span>
                          {order.paymentMethod && <span className="whitespace-nowrap">• {order.paymentMethod.toUpperCase()}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="w-8 h-8 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center text-slate-400 shrink-0">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between gap-2">
                    <div className="font-black text-sm sm:text-base text-slate-900 dark:text-white italic">
                      ₱{order.total.toLocaleString()}
                    </div>
                    {((order.pointsEarned || 0) > 0 || (order.pointsSpent || 0) > 0) && (
                      <div className="text-[9px] sm:text-[10px] font-black text-amber-500 uppercase tracking-wider bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                        {order.pointsEarned ? `+${order.pointsEarned} Pts` : ''} {order.pointsSpent ? `-${order.pointsSpent} Pts` : ''}
                      </div>
                    )}
                  </div>
                </div>

                {/* Expanded Itemized Receipt Details */}
                {isExpanded && (
                  <div className="p-3.5 sm:p-5 bg-slate-50 dark:bg-white/5 border-t border-black/5 dark:border-white/5 space-y-3 animate-in fade-in duration-200">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Order Items Breakdown</div>
                    
                    <div className="space-y-2">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white dark:bg-black/20 rounded-xl border border-black/5 dark:border-white/5 text-xs gap-1.5">
                          <div className="flex items-start gap-2 min-w-0">
                            <span className="font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-lg text-[10px] shrink-0">{item.quantity}x</span>
                            <div className="font-bold text-slate-800 dark:text-slate-200 break-words min-w-0">
                              {item.name}
                              {item.selectedSize && <span className="text-[10px] text-slate-400 ml-1">({item.selectedSize.name})</span>}
                              {item.sugarLevel && <span className="text-[10px] text-slate-400 ml-1">• Sugar: {item.sugarLevel}</span>}
                              {item.selectedAddons && item.selectedAddons.length > 0 && (
                                <div className="text-[10px] text-slate-400 mt-0.5">
                                  + {item.selectedAddons.map(a => a.name).join(', ')}
                                </div>
                              )}
                            </div>
                          </div>
                          <span className="font-bold text-slate-900 dark:text-white self-end sm:self-center shrink-0">
                            ₱{(item.price * item.quantity).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Breakdown */}
                    <div className="pt-3 border-t border-black/5 dark:border-white/5 space-y-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                      {order.subtotal && (
                        <div className="flex justify-between">
                          <span>Subtotal</span>
                          <span>₱{order.subtotal.toLocaleString()}</span>
                        </div>
                      )}
                      {order.discountAmount ? (
                        <div className="flex justify-between text-emerald-500 font-bold">
                          <span>Discount {order.voucherCode ? `(${order.voucherCode})` : ''}</span>
                          <span>-₱{order.discountAmount.toLocaleString()}</span>
                        </div>
                      ) : null}
                      {order.pointsSpent ? (
                        <div className="flex justify-between text-purple-500 font-bold">
                          <span>Points Redeemed</span>
                          <span>-{order.pointsSpent} Pts</span>
                        </div>
                      ) : null}
                      <div className="flex justify-between font-black text-slate-900 dark:text-white text-xs pt-2 border-t border-black/5 dark:border-white/5">
                        <span>Total Amount Paid ({order.paymentMethod?.toUpperCase() || 'COUNTER'})</span>
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
  );
}
