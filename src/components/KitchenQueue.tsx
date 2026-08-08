import React, { useEffect, useRef } from 'react';
import { Order, OrderStatus } from '../types';
import { Clock, CheckCircle, ChefHat, Smartphone, MonitorSmartphone, Tablet, Trash2, List, LayoutGrid, ChevronUp, ChevronDown } from 'lucide-react';
import { ConfirmationModal } from './ConfirmationModal';
import { VoidModal } from './VoidModal';

interface KitchenQueueProps {
  orders: Order[];
  onUpdateStatus: (orderId: string, newStatus: OrderStatus) => Promise<void>;
  onDeleteOrder: (id: string) => Promise<void>;
  onVoidOrder: (id: string, reason: string) => Promise<void>;
}

export function KitchenQueue({ orders = [], onUpdateStatus, onDeleteOrder, onVoidOrder }: KitchenQueueProps) {
  const [orderToCancel, setOrderToCancel] = React.useState<Order | null>(null);
  const [orderToVoid, setOrderToVoid] = React.useState<Order | null>(null);
  const [viewMode, setViewMode] = React.useState<'grid' | 'table'>('table');
  const [expandedOrders, setExpandedOrders] = React.useState<Record<string, boolean>>({});
  const prevOrderCountRef = useRef(0);
  
  // Sort by created time (FIFO) - oldest first
  const activeOrders = orders
    .filter((o) => o.status !== 'completed' && o.status !== 'unpaid' && o.status !== 'cancelled')
    .sort((a, b) => a.createdAt - b.createdAt);

  useEffect(() => {
    if (activeOrders.length > prevOrderCountRef.current) {
      // Play sound
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.value = 880; // A5
      gainNode.gain.value = 0.1;
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.1);
    }
    prevOrderCountRef.current = activeOrders.length;
  }, [activeOrders.length]);

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return 'bg-amber-500/10 text-amber-500 border-amber-500/30';
      case 'preparing': return 'bg-blue-500/10 text-blue-500 border-blue-500/30';
      case 'ready': return 'bg-green-500/10 text-green-500 border-green-500/30';
      default: return 'bg-black/5 dark:bg-white/5 text-slate-500 dark:text-white/40 border-black/10 dark:border-white/10';
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'mobile': return <Smartphone className="w-4 h-4" />;
      case 'kiosk': return <Tablet className="w-4 h-4" />;
      case 'pos': return <MonitorSmartphone className="w-4 h-4" />;
      default: return null;
    }
  };

  const advanceStatus = (currentStatus: OrderStatus): OrderStatus => {
    if (currentStatus === 'pending') return 'preparing';
    if (currentStatus === 'preparing') return 'ready';
    return 'completed';
  };

  return (
    <div className="h-full bg-transparent p-4 md:p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="px-3 py-1 bg-black/5 dark:bg-white/5 text-amber-500 text-[10px] font-black uppercase tracking-[0.3em] rounded-full border border-black/10 dark:border-white/10">
                Production
              </div>
              <div className="h-[1px] flex-1 lg:w-48 bg-black/5 dark:bg-white/5" />
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-[0.85] flex flex-wrap items-baseline gap-x-4">
              Kitchen <span className="text-white/20 not-italic font-medium text-4xl md:text-5xl lg:text-6xl">Display</span>
            </h1>
            <div className="flex items-center gap-3 mt-6">
              <div className="h-1.5 w-16 bg-amber-600 rounded-full shadow-[0_0_15px_rgba(217,119,6,0.5)]" />
              <span className="text-xs font-bold text-coffee-500 uppercase tracking-widest">
                Command Center Queue
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-lg border border-black/10 dark:border-white/10 backdrop-blur-xl">
            <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest bg-red-500/10 text-red-500 px-2 py-1.5 rounded-lg border border-red-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div> Pay ({orders.filter(o => o.status === 'unpaid').length})
            </div>
            <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-500 px-2 py-1.5 rounded-lg border border-amber-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div> Verify ({orders.filter(o => o.status === 'pending-verification').length})
            </div>
            <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-500 px-2 py-1.5 rounded-lg border border-amber-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div> Incoming ({orders.filter(o => o.status === 'pending').length})
            </div>
            <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-400 px-2 py-1.5 rounded-lg border border-blue-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div> Active ({orders.filter(o => o.status === 'preparing').length})
            </div>
            <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest bg-green-500/10 text-green-400 px-2 py-1.5 rounded-lg border border-green-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div> Ready ({orders.filter(o => o.status === 'ready').length})
            </div>
          </div>
        </header>

        {/* View Mode Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-black/5 dark:bg-white/5 p-4 rounded-3xl border border-black/10 dark:border-white/10 backdrop-blur-xl">
          <div className="text-xs font-black uppercase tracking-widest text-coffee-500">
            Queue Mode: <span className="text-slate-900 dark:text-white font-black">{viewMode === 'table' ? 'Tabular Row' : 'Card Grid'}</span>
          </div>

          <div className="flex bg-black/5 dark:bg-white/5 p-1 rounded-2xl border border-black/10 dark:border-white/10 gap-1 shrink-0 w-fit">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'table' ? 'bg-amber-600 text-slate-900 dark:text-white shadow-md' : 'text-coffee-500 hover:text-slate-900 dark:hover:text-white'}`}
              title="Tabular Row View"
            >
              <List className="w-3.5 h-3.5" />
              Row Table
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'grid' ? 'bg-amber-600 text-slate-900 dark:text-white shadow-md' : 'text-coffee-500 hover:text-slate-900 dark:hover:text-white'}`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Card Grid
            </button>
          </div>
        </div>

        {viewMode === 'table' && activeOrders.length > 0 && (
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-coffee-600 mb-2">
            <div className="col-span-1">Order #</div>
            <div className="col-span-2">Customer</div>
            <div className="col-span-2">Time</div>
            <div className="col-span-2">Channel / Type</div>
            <div className="col-span-3">Items Summary</div>
            <div className="col-span-2 text-center">Status</div>
          </div>
        )}

        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "flex flex-col gap-3"}>
            {activeOrders.length === 0 ? (
              <div 
                className="col-span-full flex flex-col items-center justify-center py-32 text-coffee-600 bg-black/5 dark:bg-white/5 rounded-[2.5rem] border border-dashed border-black/10 dark:border-white/10 backdrop-blur-xl"
              >
                <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mb-6 border border-amber-500/20">
                  <CheckCircle className="w-10 h-10 text-amber-500" />
                </div>
                <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-white">All Clear</h3>
                <p className="text-[10px] font-black uppercase tracking-widest mt-2">The orbit is empty</p>
              </div>
            ) : (
              activeOrders.map((order, index) => {
                const isExpanded = !!expandedOrders[order.id!];
                const toggleExpand = () => setExpandedOrders(prev => ({ ...prev, [order.id!]: !prev[order.id!] }));

                if (viewMode === 'table') {
                  return (
                    <div key={order.id} className="bg-black/5 dark:bg-white/5 rounded-2xl border border-black/10 dark:border-white/10 overflow-hidden transition-all hover:border-black/20 dark:hover:border-white/20">
                      <div 
                        onClick={toggleExpand}
                        className="p-4 md:px-6 md:py-4 flex flex-col md:grid md:grid-cols-12 gap-4 items-center cursor-pointer select-none"
                      >
                        <div className="col-span-1 flex items-center gap-3 w-full md:w-auto">
                          <span className="p-1 rounded bg-black/5 dark:bg-white/5 text-amber-500">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </span>
                          <span className="text-lg font-black text-slate-900 dark:text-white font-display">
                            #{order.id?.slice(-4)}
                          </span>
                        </div>

                        <div className="col-span-2 w-full md:w-auto">
                          <div className="text-xs font-black text-slate-900 dark:text-white uppercase truncate">{order.customerName}</div>
                          <div className="flex items-center gap-1.5 mt-1">
                            {order.orderType && (
                              <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                {order.orderType}
                              </span>
                            )}
                            {order.tableNumber && (
                              <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                Table: {order.tableNumber}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="col-span-2 w-full md:w-auto flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-coffee-500 shrink-0" />
                          <span className="text-xs font-bold text-coffee-500">
                            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <div className="col-span-2 w-full md:w-auto flex items-center gap-2">
                          <span className="flex items-center gap-1.5 text-[10px] text-white/50 font-black uppercase tracking-widest">
                            {getSourceIcon(order.source)} {order.source}
                          </span>
                        </div>

                        <div className="col-span-3 w-full md:w-auto text-xs font-bold text-coffee-600">
                          {order.items.length} {order.items.length === 1 ? 'item' : 'items'} ({order.items.reduce((acc, item) => acc + item.quantity, 0)} qty)
                        </div>

                        <div className="col-span-2 w-full md:w-auto flex items-center justify-between md:justify-end gap-3 w-full md:w-auto">
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="px-6 pb-6 pt-2 border-t border-black/15 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.01] animate-in fade-in slide-in-from-top-1 duration-150">
                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mt-2">
                            <div className="lg:col-span-8 bg-white dark:bg-[#111115]/40 border border-black/10 dark:border-white/5 rounded-2xl p-5 space-y-4">
                              <span className="block text-[9px] font-black uppercase tracking-widest text-coffee-500 mb-1">Queue Ticket Items</span>
                              {order.items.map((item, idx) => (
                                <div key={idx} className="flex gap-4 items-start border-b border-black/10 dark:border-white/5 last:border-0 pb-3 last:pb-0">
                                  <div className="font-black text-xs text-slate-900 dark:text-white bg-black/10 dark:bg-white/10 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border border-black/10 dark:border-white/10">
                                    {item.quantity}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight italic truncate">
                                      {item.name}
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                                      {item.selectedSize && (
                                        <span className="text-[9px] text-amber-500 font-black px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 uppercase tracking-widest shrink-0">
                                          Size: {item.selectedSize.name}
                                        </span>
                                      )}
                                      {item.sugarLevel && (
                                        <span className="text-[9px] text-blue-400 font-black px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 uppercase tracking-widest shrink-0">
                                          Sugar: {item.sugarLevel}
                                        </span>
                                      )}
                                      {item.selectedAddons && item.selectedAddons.length > 0 && item.selectedAddons.map((addon, aIdx) => (
                                        <span key={aIdx} className="text-[9px] text-green-400 font-black px-2 py-0.5 rounded bg-green-500/10 border border-green-500/20 uppercase tracking-widest shrink-0">
                                          + {addon.name}
                                        </span>
                                      ))}
                                    </div>
                                    {item.mixtureGuide && (
                                      <div className="mt-2 text-xs font-bold text-slate-600 dark:text-slate-400 bg-black/5 dark:bg-white/5 p-2.5 rounded-xl border border-black/10 dark:border-white/5 italic">
                                        <span className="block text-[9px] font-black uppercase tracking-widest text-coffee-500 not-italic mb-1">Mixture Guide</span>
                                        {item.mixtureGuide}
                                      </div>
                                    )}
                                    {item.notes && (
                                      <div className="mt-2 text-xs font-bold text-red-500/80 bg-red-500/10 p-2.5 rounded-xl border border-red-500/20 italic">
                                        <span className="block text-[9px] font-black uppercase tracking-widest text-red-500/50 not-italic mb-1">Customer Note</span>
                                        "{item.notes}"
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div className="lg:col-span-4 bg-white dark:bg-[#111115]/40 border border-black/10 dark:border-white/5 rounded-2xl p-5 space-y-4">
                              <span className="block text-[9px] font-black uppercase tracking-widest text-coffee-500">Actions</span>
                              
                              {order.status === 'pending-verification' ? (
                                <button 
                                  onClick={() => setOrderToVoid(order)}
                                  className="w-full py-2.5 bg-red-600/15 hover:bg-red-600 text-red-400 hover:text-slate-900 dark:hover:text-white rounded-xl font-black uppercase tracking-widest text-[9px] border border-red-500/20 transition-all flex items-center justify-center gap-1 active:scale-95"
                                  title="Void Order"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  Void Order
                                </button>
                              ) : (
                                <button 
                                  onClick={() => setOrderToCancel(order)}
                                  className="w-full py-2.5 bg-red-600/15 hover:bg-red-600 text-red-400 hover:text-slate-900 dark:hover:text-white rounded-xl font-black uppercase tracking-widest text-[9px] border border-red-500/20 transition-all flex items-center justify-center gap-1 active:scale-95"
                                  title="Cancel Order"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  Cancel Order
                                </button>
                              )}

                              <button
                                onClick={() => onUpdateStatus(order.id!, advanceStatus(order.status))}
                                className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-95 shadow-xl flex justify-center items-center gap-2 
                                  ${order.status === 'pending' ? 'bg-amber-600 text-slate-900 dark:text-white hover:bg-amber-500' : 
                                    order.status === 'preparing' ? 'bg-blue-600 text-slate-900 dark:text-white hover:bg-blue-500' : 'bg-green-600 text-slate-900 dark:text-white hover:bg-green-500'}`}
                              >
                                {order.status === 'pending' ? 'Initiate Sequence' :
                                 order.status === 'preparing' ? 'Docking Ready' : 'Confirm Launch'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <div
                    key={order.id}
                    className={`bg-black/5 dark:bg-white/5 backdrop-blur-xl rounded-[2rem] p-6 border-2 ${getStatusColor(order.status).split(' ')[2]} flex flex-col h-full relative overflow-hidden transition-all hover:scale-[1.02] hover:bg-white/[0.08] shadow-2xl`}
                  >
                    {/* FIFO Position Indicator */}
                    {index === 0 && order.status === 'pending' && (
                       <div className="absolute top-0 right-0 bg-amber-500 text-black text-[10px] font-black px-4 py-1.5 rounded-bl-xl uppercase tracking-widest italic">
                         Priority 01
                       </div>
                    )}

                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="font-black text-xl text-slate-900 dark:text-white uppercase italic tracking-tighter">#{order.id?.slice(-4)}</h3>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <p className="text-slate-900 dark:text-white text-xs font-black uppercase tracking-tighter italic">{order.customerName}</p>
                          {order.orderType && (
                            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                              {order.orderType}
                            </span>
                          )}
                          {order.tableNumber && (
                            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              Table: {order.tableNumber}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                        <span className="flex items-center gap-1.5 text-[10px] text-white/30 font-black uppercase tracking-widest">
                          {getSourceIcon(order.source)} {order.source}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] font-black text-amber-500/50 mb-6 bg-black/5 dark:bg-white/5 w-fit px-2.5 py-1.5 rounded-lg border border-black/10 dark:border-white/5 uppercase tracking-widest">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>

                    <div className="flex-1 bg-slate-100 dark:bg-black/20 rounded-2xl p-4 mb-6 space-y-4 border border-black/10 dark:border-white/5">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex gap-4 items-start border-b border-black/10 dark:border-white/5 last:border-0 pb-3 last:pb-0">
                          <div className="font-black text-xs text-slate-900 dark:text-white bg-black/10 dark:bg-white/10 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border border-black/10 dark:border-white/10">
                            {item.quantity}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight italic truncate">
                              {item.name}
                            </div>
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              {item.selectedSize && (
                                <span className="text-[9px] text-amber-500 font-black px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 uppercase tracking-widest shrink-0">
                                  Size: {item.selectedSize.name}
                                </span>
                              )}
                              {item.sugarLevel && (
                                <span className="text-[9px] text-blue-400 font-black px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 uppercase tracking-widest shrink-0">
                                  Sugar: {item.sugarLevel}
                                </span>
                              )}
                              {item.selectedAddons && item.selectedAddons.length > 0 && item.selectedAddons.map((addon, aIdx) => (
                                <span key={aIdx} className="text-[9px] text-green-400 font-black px-2 py-0.5 rounded bg-green-500/10 border border-green-500/20 uppercase tracking-widest shrink-0">
                                  + {addon.name}
                                </span>
                              ))}
                            </div>
                            {item.mixtureGuide && (
                              <div className="mt-2 text-xs font-bold text-slate-600 dark:text-slate-400 bg-black/5 dark:bg-white/5 p-2.5 rounded-xl border border-black/10 dark:border-white/5 italic">
                                <span className="block text-[9px] font-black uppercase tracking-widest text-coffee-500 not-italic mb-1">Mixture Guide</span>
                                {item.mixtureGuide}
                              </div>
                            )}
                            {item.notes && (
                              <div className="mt-2 text-xs font-bold text-red-500/80 bg-red-500/10 p-2.5 rounded-xl border border-red-500/20 italic">
                                <span className="block text-[9px] font-black uppercase tracking-widest text-red-500/50 not-italic mb-1">Customer Note</span>
                                "{item.notes}"
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mb-3">
                      {order.status === 'pending-verification' ? (
                        <button 
                          onClick={() => setOrderToVoid(order)}
                          className="w-full py-2.5 bg-red-600/15 hover:bg-red-600 text-red-400 hover:text-slate-900 dark:hover:text-white rounded-xl font-black uppercase tracking-widest text-[9px] border border-red-500/20 transition-all flex items-center justify-center gap-1 active:scale-95"
                          title="Void Order"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Void Order
                        </button>
                      ) : (
                        <button 
                          onClick={() => setOrderToCancel(order)}
                          className="w-full py-2.5 bg-red-600/15 hover:bg-red-600 text-red-400 hover:text-slate-900 dark:hover:text-white rounded-xl font-black uppercase tracking-widest text-[9px] border border-red-500/20 transition-all flex items-center justify-center gap-1 active:scale-95"
                          title="Cancel Order"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Cancel Order
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => onUpdateStatus(order.id!, advanceStatus(order.status))}
                      className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-95 shadow-xl flex justify-center items-center gap-2 
                        ${order.status === 'pending' ? 'bg-amber-600 text-slate-900 dark:text-white hover:bg-amber-500' : 
                          order.status === 'preparing' ? 'bg-blue-600 text-slate-900 dark:text-white hover:bg-blue-500' : 'bg-green-600 text-slate-900 dark:text-white hover:bg-green-500'}`}
                    >
                      {order.status === 'pending' ? 'Initiate Sequence' :
                       order.status === 'preparing' ? 'Docking Ready' : 'Confirm Launch'}
                    </button>
                  </div>
                );
              })
            )}
        </div>
      </div>
      <VoidModal
        isOpen={orderToVoid !== null}
        onClose={() => setOrderToVoid(null)}
        onConfirm={async (reason) => {
          if (orderToVoid) {
            await onVoidOrder(orderToVoid.id!, reason).catch(console.error);
            setOrderToVoid(null);
          }
        }}
        title="Void Order"
      />
      <ConfirmationModal
        isOpen={orderToCancel !== null}
        onClose={() => setOrderToCancel(null)}
        onConfirm={async () => {
          if (orderToCancel) {
            await onUpdateStatus(orderToCancel.id!, 'cancelled').catch(console.error);
            setOrderToCancel(null);
          }
        }}
        title="Cancel Order"
        message="Are you sure you want to cancel and void this order?"
      />
    </div>
  );
}
