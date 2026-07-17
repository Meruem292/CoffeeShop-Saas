import React from 'react';
import { Order, OrderStatus } from '../types';
import { Clock, CheckCircle, ChefHat, Smartphone, MonitorSmartphone, Tablet, Trash2 } from 'lucide-react';
import { ConfirmationModal } from './ConfirmationModal';

interface KitchenQueueProps {
  orders: Order[];
  onUpdateStatus: (orderId: string, newStatus: OrderStatus) => Promise<void>;
  onDeleteOrder: (id: string) => Promise<void>;
}

export function KitchenQueue({ orders, onUpdateStatus, onDeleteOrder }: KitchenQueueProps) {
  const [orderToCancel, setOrderToCancel] = React.useState<Order | null>(null);
  // Sort by created time (FIFO) - oldest first
  const activeOrders = orders
    .filter((o) => o.status !== 'completed' && o.status !== 'unpaid')
    .sort((a, b) => a.createdAt - b.createdAt);

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return 'bg-amber-500/10 text-amber-500 border-amber-500/30';
      case 'preparing': return 'bg-blue-500/10 text-blue-500 border-blue-500/30';
      case 'ready': return 'bg-green-500/10 text-green-500 border-green-500/30';
      default: return 'bg-white/5 text-white/40 border-white/10';
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
    <div className="h-screen bg-transparent p-4 md:p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="px-3 py-1 bg-white/5 text-amber-500 text-[10px] font-black uppercase tracking-[0.3em] rounded-full border border-white/10">
                Production
              </div>
              <div className="h-[1px] flex-1 lg:w-48 bg-white/5" />
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white uppercase italic tracking-tighter leading-[0.85] flex flex-wrap items-baseline gap-x-4">
              Kitchen <span className="text-white/20 not-italic font-medium text-4xl md:text-5xl lg:text-6xl">Display</span>
            </h1>
            <div className="flex items-center gap-3 mt-6">
              <div className="h-1.5 w-16 bg-amber-600 rounded-full shadow-[0_0_15px_rgba(217,119,6,0.5)]" />
              <span className="text-xs font-bold text-coffee-500 uppercase tracking-widest">
                Command Center Queue
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 md:gap-3 bg-white/5 p-2 rounded-2xl border border-white/10 backdrop-blur-xl">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-500 px-3 py-2 rounded-xl border border-amber-500/20">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></div> Incoming
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-400 px-3 py-2 rounded-xl border border-blue-500/20">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></div> Active
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-green-500/10 text-green-400 px-3 py-2 rounded-xl border border-green-500/20">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div> Launch
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {activeOrders.length === 0 ? (
              <div 
                className="col-span-full flex flex-col items-center justify-center py-32 text-coffee-600 bg-white/5 rounded-[2.5rem] border border-dashed border-white/10 backdrop-blur-xl"
              >
                <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mb-6 border border-amber-500/20">
                  <CheckCircle className="w-10 h-10 text-amber-500" />
                </div>
                <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">All Clear</h3>
                <p className="text-[10px] font-black uppercase tracking-widest mt-2">The orbit is empty</p>
              </div>
            ) : (
              activeOrders.map((order, index) => (
                <div
                  key={order.id}
                  className={`bg-white/5 backdrop-blur-xl rounded-[2rem] p-6 border-2 ${getStatusColor(order.status).split(' ')[2]} flex flex-col h-full relative overflow-hidden transition-all hover:scale-[1.02] hover:bg-white/[0.08] shadow-2xl`}
                >
                  {/* FIFO Position Indicator */}
                  {index === 0 && order.status === 'pending' && (
                     <div className="absolute top-0 right-0 bg-amber-500 text-black text-[10px] font-black px-4 py-1.5 rounded-bl-xl uppercase tracking-widest italic">
                       Priority 01
                     </div>
                  )}

                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="font-black text-xl text-white uppercase italic tracking-tighter">#{order.id?.slice(-4)}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <p className="text-white/40 text-xs font-black uppercase tracking-tighter italic">{order.customerName}</p>
                        {order.tableNumber && (
                          <span className="bg-amber-500/20 text-amber-500 text-[9px] font-black px-2 py-0.5 rounded-full border border-amber-500/30 uppercase tracking-widest">
                            Bay {order.tableNumber}
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

                  <div className="flex items-center gap-1.5 text-[10px] font-black text-amber-500/50 mb-6 bg-white/5 w-fit px-2.5 py-1.5 rounded-lg border border-white/5 uppercase tracking-widest">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>

                  <div className="flex-1 bg-black/20 rounded-2xl p-4 mb-6 space-y-4 border border-white/5">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex gap-4 items-start border-b border-white/5 last:border-0 pb-3 last:pb-0">
                        <div className="font-black text-xs text-white bg-white/10 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border border-white/10">
                          {item.quantity}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-black text-white uppercase tracking-tight italic truncate">
                            {item.name}
                          </div>
                          {item.selectedSize && (
                            <div className="mt-1">
                              <span className="text-[9px] text-white/40 font-black px-2 py-0.5 rounded bg-white/5 uppercase border border-white/5 tracking-widest">
                                {item.selectedSize.name}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mb-3">
                    <button 
                      onClick={() => setOrderToCancel(order)}
                      className="w-full py-2.5 bg-red-600/15 hover:bg-red-600 text-red-400 hover:text-white rounded-xl font-black uppercase tracking-widest text-[9px] border border-red-500/20 transition-all flex items-center justify-center gap-1 active:scale-95"
                      title="Cancel Order"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Cancel Order
                    </button>
                  </div>

                  <button
                    onClick={() => onUpdateStatus(order.id, advanceStatus(order.status))}
                    className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-95 shadow-xl flex justify-center items-center gap-2 
                      ${order.status === 'pending' ? 'bg-amber-600 text-white hover:bg-amber-500' : 
                        order.status === 'preparing' ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-green-600 text-white hover:bg-green-500'}`}
                  >
                    {order.status === 'pending' ? 'Initiate Sequence' :
                     order.status === 'preparing' ? 'Docking Ready' : 'Confirm Launch'}
                  </button>
                </div>
              ))
            )}
        </div>
      </div>
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
