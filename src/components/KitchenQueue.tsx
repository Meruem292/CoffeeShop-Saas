import React from 'react';
import { Order, OrderStatus } from '../types';
import { Clock, CheckCircle, ChefHat, Smartphone, MonitorSmartphone, Tablet } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface KitchenQueueProps {
  orders: Order[];
  onUpdateStatus: (orderId: string, newStatus: OrderStatus) => void;
}

export function KitchenQueue({ orders, onUpdateStatus }: KitchenQueueProps) {
  // Sort by created time (FIFO) - oldest first
  const activeOrders = orders
    .filter((o) => o.status !== 'completed')
    .sort((a, b) => a.createdAt - b.createdAt);

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'preparing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ready': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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
    <div className="h-screen bg-coffee-50 p-4 md:p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-coffee-900 flex items-center gap-3">
              <ChefHat className="w-8 h-8 text-coffee-600" />
              Kitchen Display System (KDS)
            </h1>
            <p className="text-coffee-600 mt-1">FIFO Queue Processing</p>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-2 text-sm bg-white px-3 py-1.5 rounded-full border border-coffee-200 shadow-sm">
              <div className="w-3 h-3 rounded-full bg-amber-400"></div> Pending
            </div>
            <div className="flex items-center gap-2 text-sm bg-white px-3 py-1.5 rounded-full border border-coffee-200 shadow-sm">
              <div className="w-3 h-3 rounded-full bg-blue-400"></div> Preparing
            </div>
            <div className="flex items-center gap-2 text-sm bg-white px-3 py-1.5 rounded-full border border-coffee-200 shadow-sm">
              <div className="w-3 h-3 rounded-full bg-green-400"></div> Ready
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence>
            {activeOrders.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="col-span-full flex flex-col items-center justify-center py-20 text-coffee-400 bg-white rounded-2xl border border-dashed border-coffee-300"
              >
                <CheckCircle className="w-16 h-16 mb-4 text-coffee-300" />
                <h3 className="text-xl font-medium text-coffee-600">All caught up!</h3>
                <p>No active orders in the queue.</p>
              </motion.div>
            ) : (
              activeOrders.map((order, index) => (
                <motion.div
                  key={order.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className={`bg-white rounded-2xl p-5 shadow-lg border-2 ${getStatusColor(order.status).split(' ')[2]} flex flex-col h-full relative overflow-hidden`}
                >
                  {/* FIFO Position Indicator */}
                  {index === 0 && order.status === 'pending' && (
                     <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                       NEXT UP
                     </div>
                  )}

                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-coffee-900">Order #{order.id?.slice(-4)}</h3>
                      <div className="flex items-center gap-2">
                        <p className="text-coffee-600 text-sm font-medium">{order.customerName}</p>
                        {order.tableNumber && (
                          <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-1.5 py-0.5 rounded border border-amber-200 uppercase">
                            Table {order.tableNumber}
                          </span>
                        )}
                        {order.orderType && (
                          <span className="bg-coffee-100 text-coffee-700 text-[10px] font-black px-1.5 py-0.5 rounded border border-coffee-200 uppercase">
                            {order.orderType.replace('-', ' ')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${getStatusColor(order.status).split(' ').slice(0,2).join(' ')}`}>
                        {order.status}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-coffee-500 font-medium">
                        {getSourceIcon(order.source)} <span className="capitalize">{order.source}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-coffee-500 mb-4 bg-coffee-50 w-fit px-2 py-1 rounded">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>

                  <div className="flex-1 bg-coffee-50/50 rounded-xl p-3 mb-4 space-y-3">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex gap-3 items-start border-b border-coffee-100 last:border-0 pb-2 last:pb-0">
                        <div className="font-bold text-coffee-800 bg-white w-6 h-6 rounded-md shadow-sm flex items-center justify-center shrink-0">
                          {item.quantity}
                        </div>
                        <div className="text-sm font-medium text-coffee-900 mt-0.5">
                          {item.name}
                          {item.selectedSize && (
                            <span className="ml-1 text-[10px] text-coffee-500 font-bold bg-white px-1 py-0.5 rounded uppercase border border-coffee-100">
                              {item.selectedSize.name}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => onUpdateStatus(order.id, advanceStatus(order.status))}
                    className="w-full py-3 rounded-xl font-bold text-white transition-transform active:scale-95 shadow-md flex justify-center items-center gap-2
                      bg-coffee-900 hover:bg-coffee-800"
                  >
                    {order.status === 'pending' ? 'Start Preparing' :
                     order.status === 'preparing' ? 'Mark Ready' : 'Complete Order'}
                  </button>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
