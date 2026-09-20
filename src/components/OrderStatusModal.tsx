import React, { useState } from 'react';
import { Order, OrderStatus } from '../types';
import { 
  X, CheckCircle2, Clock, Coffee, ShoppingBag, Eye, RefreshCw, 
  ChevronRight, AlertCircle, QrCode, Sparkles, ChefHat, Receipt,
  Check, ArrowRight, Layers
} from 'lucide-react';

interface OrderStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  selectedOrderId?: string | null;
  onSelectOrder?: (orderId: string) => void;
  onOrderMore?: () => void;
  onViewHistory?: () => void;
}

export function OrderStatusModal({
  isOpen,
  onClose,
  orders = [],
  selectedOrderId,
  onSelectOrder,
  onOrderMore,
  onViewHistory
}: OrderStatusModalProps) {
  const [viewingReceiptUrl, setViewingReceiptUrl] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter for pending / active orders first, but fallback to all orders if needed
  const activeOrders = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');
  const displayOrders = activeOrders.length > 0 ? activeOrders : orders.slice(0, 5);

  const activeOrder = displayOrders.find(o => o.id === selectedOrderId) || displayOrders[0];

  const getStatusStepIndex = (status: OrderStatus) => {
    switch (status) {
      case 'unpaid':
      case 'pending-verification':
        return 1; // Step 1: Placed, waiting payment/verification
      case 'pending':
        return 2; // Step 2: Payment verified, sent to kitchen
      case 'preparing':
        return 3; // Step 3: Kitchen preparing
      case 'ready':
        return 4; // Step 4: Ready for pickup
      case 'completed':
        return 5;
      default:
        return 1;
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending-verification':
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-600 dark:text-purple-400 text-xs font-black uppercase tracking-wider animate-pulse">
            <Clock className="w-3.5 h-3.5" /> GCash Verification Pending
          </div>
        );
      case 'unpaid':
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-black uppercase tracking-wider">
            <AlertCircle className="w-3.5 h-3.5" /> Pay at Counter
          </div>
        );
      case 'pending':
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-wider">
            <CheckCircle2 className="w-3.5 h-3.5" /> Sent to Kitchen
          </div>
        );
      case 'preparing':
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-wider animate-pulse">
            <Coffee className="w-3.5 h-3.5" /> Barista Preparing
          </div>
        );
      case 'ready':
        return (
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500 text-slate-900 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20">
            <Sparkles className="w-3.5 h-3.5" /> Ready for Pickup!
          </div>
        );
      case 'completed':
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-500/10 border border-slate-500/30 text-slate-400 text-xs font-black uppercase tracking-wider">
            <Check className="w-3.5 h-3.5" /> Completed
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#090D16] border-t sm:border border-black/10 dark:border-white/10 rounded-t-[2.5rem] sm:rounded-[2.5rem] max-w-lg w-full max-h-[92vh] sm:max-h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-black/10 dark:border-white/10 flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black uppercase tracking-tight text-slate-900 dark:text-white">
                Live Order Tracker
              </h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                {activeOrders.length > 0 ? `${activeOrders.length} Active Order${activeOrders.length > 1 ? 's' : ''}` : 'Order Summary'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Active Orders Tab Selector if multiple */}
        {displayOrders.length > 1 && (
          <div className="px-5 pt-3 pb-1 border-b border-black/5 dark:border-white/5 bg-slate-50/30 dark:bg-black/20 flex gap-2 overflow-x-auto scrollbar-hide">
            {displayOrders.map(order => {
              const isSelected = activeOrder?.id === order.id;
              return (
                <button
                  key={order.id}
                  onClick={() => onSelectOrder?.(order.id!)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 transition-all flex items-center gap-2 ${
                    isSelected
                      ? 'bg-amber-500 text-slate-900 shadow-md scale-105'
                      : 'bg-black/5 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-black/10 dark:hover:bg-white/10'
                  }`}
                >
                  <span>#{order.id?.slice(-4)}</span>
                  <span className={`w-2 h-2 rounded-full ${
                    order.status === 'ready' ? 'bg-emerald-400 animate-ping' :
                    order.status === 'preparing' ? 'bg-indigo-400 animate-pulse' :
                    order.status === 'pending-verification' ? 'bg-purple-400' : 'bg-amber-400'
                  }`} />
                </button>
              );
            })}
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 scrollbar-hide">
          {activeOrder ? (
            <>
              {/* Order Number & Status Card */}
              <div className="bg-slate-100/70 dark:bg-white/[0.03] border border-black/10 dark:border-white/10 rounded-2xl p-5 relative overflow-hidden">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Order Reference</span>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                      #{activeOrder.id?.slice(-4) || activeOrder.id}
                      <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                        ({activeOrder.orderType || 'take-away'})
                      </span>
                    </h2>
                    <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                      Placed at {new Date(activeOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div>
                    {getStatusBadge(activeOrder.status)}
                  </div>
                </div>

                {/* Specific Guidance Callout based on Status */}
                {activeOrder.status === 'pending-verification' && (
                  <div className="mt-4 p-3.5 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-700 dark:text-purple-300 text-xs space-y-2">
                    <div className="flex items-center gap-2 font-black uppercase tracking-wider text-[11px]">
                      <Clock className="w-4 h-4 shrink-0" />
                      <span>Payment Under Verification</span>
                    </div>
                    <p className="text-[11px] font-medium leading-relaxed opacity-90">
                      Your GCash payment receipt has been received and is waiting for cashier confirmation. Once verified, your order will automatically proceed to the kitchen!
                    </p>
                    {activeOrder.receiptUrl && (
                      <button
                        onClick={() => setViewingReceiptUrl(activeOrder.receiptUrl!)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg text-[10px] font-black uppercase tracking-wider text-purple-900 dark:text-purple-200 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Uploaded Receipt
                      </button>
                    )}
                  </div>
                )}

                {activeOrder.status === 'unpaid' && (
                  <div className="mt-4 p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-800 dark:text-amber-300 text-xs space-y-1">
                    <div className="flex items-center gap-2 font-black uppercase tracking-wider text-[11px]">
                      <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
                      <span>Proceed to Cashier Counter</span>
                    </div>
                    <p className="text-[11px] font-medium leading-relaxed opacity-90">
                      Please present sequence number <strong className="font-bold">#{activeOrder.id?.slice(-4)}</strong> to the cashier to complete your payment.
                    </p>
                  </div>
                )}

                {activeOrder.status === 'ready' && (
                  <div className="mt-4 p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs space-y-1 shadow-lg">
                    <div className="flex items-center gap-2 font-black uppercase tracking-wider text-xs text-emerald-600 dark:text-emerald-400">
                      <Sparkles className="w-4 h-4 shrink-0" />
                      <span>Order Ready for Pickup!</span>
                    </div>
                    <p className="text-[11px] font-bold leading-relaxed">
                      Your drinks & food are freshly prepared. Please present sequence <strong className="font-black text-sm">#{activeOrder.id?.slice(-4)}</strong> at the pickup counter.
                    </p>
                  </div>
                )}
              </div>

              {/* Step-by-Step Progress Timeline */}
              <div className="bg-slate-100/50 dark:bg-white/[0.02] border border-black/10 dark:border-white/10 rounded-2xl p-5">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white mb-4 flex items-center justify-between">
                  <span>Preparation Progress</span>
                  <span className="text-[10px] text-amber-500 font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" /> Live
                  </span>
                </h4>

                {(() => {
                  const currentStepIndex = getStatusStepIndex(activeOrder.status);
                  const steps = [
                    {
                      step: 1,
                      title: 'Order Placed',
                      desc: 'Submitted to system',
                      isCompleted: currentStepIndex >= 1,
                      isCurrent: currentStepIndex === 1,
                    },
                    {
                      step: 2,
                      title: activeOrder.paymentMethod === 'gcash' ? 'GCash Verification' : 'Payment Confirmation',
                      desc: activeOrder.status === 'pending-verification' ? 'Cashier verifying proof' : activeOrder.status === 'unpaid' ? 'Pay at counter' : 'Payment verified',
                      isCompleted: currentStepIndex >= 2,
                      isCurrent: currentStepIndex === 1 && activeOrder.status === 'pending-verification',
                    },
                    {
                      step: 3,
                      title: 'Kitchen & Barista Prep',
                      desc: activeOrder.status === 'preparing' ? 'Crafting your drinks' : 'Queueing in kitchen',
                      isCompleted: currentStepIndex >= 4,
                      isCurrent: currentStepIndex === 2 || currentStepIndex === 3,
                    },
                    {
                      step: 4,
                      title: 'Ready for Pickup',
                      desc: 'Collect at counter',
                      isCompleted: currentStepIndex >= 4,
                      isCurrent: currentStepIndex === 4,
                    },
                  ];

                  return (
                    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-white/10">
                      {steps.map((s, idx) => {
                        const isDone = s.isCompleted && !s.isCurrent;
                        const isCurrent = s.isCurrent;

                        return (
                          <div key={idx} className="relative flex items-start gap-3">
                            {/* Step Indicator Dot */}
                            <div className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                              isDone
                                ? 'bg-emerald-500 text-slate-900 ring-4 ring-emerald-500/20'
                                : isCurrent
                                ? 'bg-amber-500 text-slate-900 ring-4 ring-amber-500/30 animate-pulse'
                                : 'bg-slate-200 dark:bg-white/10 text-slate-400'
                            }`}>
                              {isDone ? <Check className="w-3 h-3 stroke-[3]" /> : s.step}
                            </div>

                            <div className="flex-1">
                              <p className={`text-xs font-black uppercase tracking-tight ${
                                isCurrent ? 'text-amber-500 dark:text-amber-400' : isDone ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'
                              }`}>
                                {s.title}
                              </p>
                              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                                {s.desc}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Itemized Order Breakdown */}
              <div className="bg-slate-100/50 dark:bg-white/[0.02] border border-black/10 dark:border-white/10 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-2">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-amber-500" /> Itemized Order
                  </h4>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                    {activeOrder.items?.length || 0} Items
                  </span>
                </div>

                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                  {activeOrder.items?.map((item, idx) => (
                    <div key={idx} className="flex items-start justify-between text-xs gap-3 py-1">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 dark:text-white truncate">
                          {item.quantity}x {item.name}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 space-x-1">
                          {item.selectedSize && <span>{item.selectedSize.name}</span>}
                          {item.sugarLevel && <span>• {item.sugarLevel} Sugar</span>}
                          {item.iceLevel && <span>• {item.iceLevel} Ice</span>}
                        </p>
                        {item.selectedAddons && item.selectedAddons.length > 0 && (
                          <p className="text-[9px] text-amber-600/80 dark:text-amber-400/80">
                            + {item.selectedAddons.map(a => a.name).join(', ')}
                          </p>
                        )}
                      </div>
                      <span className="font-black text-slate-900 dark:text-white shrink-0">
                        ₱{(item.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Total Summary */}
                <div className="border-t border-black/10 dark:border-white/10 pt-3 space-y-1 text-xs font-bold">
                  {activeOrder.discountAmount ? (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400 text-[11px]">
                      <span>Discount ({activeOrder.voucherCode || 'Voucher'})</span>
                      <span>-₱{activeOrder.discountAmount.toLocaleString()}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between text-slate-900 dark:text-white text-sm font-black pt-1">
                    <span>Total Amount</span>
                    <span className="text-amber-500">₱{activeOrder.total?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-0.5 uppercase tracking-wider">
                    <span>Payment Method</span>
                    <span className="font-bold">{activeOrder.paymentMethod === 'gcash' ? 'GCash Mobile' : 'Cash Counter'}</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-slate-400 space-y-3">
              <ShoppingBag className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="text-xs font-bold uppercase tracking-widest">No active orders found</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-black/10 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] flex items-center gap-3">
          <button
            onClick={() => {
              onClose();
              onOrderMore?.();
            }}
            className="flex-1 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" /> Order More
          </button>
          
          {onViewHistory && (
            <button
              onClick={() => {
                onClose();
                onViewHistory();
              }}
              className="px-4 py-3.5 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all"
            >
              Order History
            </button>
          )}
        </div>
      </div>

      {/* Lightbox Modal for Uploaded GCash Receipt Image */}
      {viewingReceiptUrl && (
        <div 
          className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4"
          onClick={() => setViewingReceiptUrl(null)}
        >
          <div className="relative max-w-md w-full bg-slate-900 border border-white/10 rounded-3xl p-4 overflow-hidden flex flex-col items-center">
            <button
              onClick={() => setViewingReceiptUrl(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <p className="text-xs font-black uppercase text-amber-500 tracking-wider mb-3">GCash Receipt Proof</p>
            <img 
              src={viewingReceiptUrl} 
              alt="Uploaded GCash Receipt" 
              className="max-h-[70vh] w-auto object-contain rounded-2xl border border-white/10"
            />
          </div>
        </div>
      )}
    </div>
  );
}
