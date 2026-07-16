import React, { useState } from 'react';
import { Order, OrderStatus } from '../types';
import { CheckCircle, Clock, Banknote, Coffee, Receipt } from 'lucide-react';

interface CashierViewProps {
  orders: Order[];
  onUpdateStatus: (id: string, status: OrderStatus) => void;
}

export function CashierView({ orders, onUpdateStatus }: CashierViewProps) {
  // Only show unpaid orders
  const unpaidOrders = orders.filter((o) => o.status === 'unpaid');
  const pendingOrders = orders.filter((o) => o.status === 'pending' || o.status === 'preparing' || o.status === 'ready' || o.status === 'completed');

  const [activeTab, setActiveTab] = useState<'unpaid' | 'history'>('unpaid');
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);

  const handleMarkPaid = (order: Order) => {
    onUpdateStatus(order.id!, 'pending');
    setPrintingOrder(order);
    setTimeout(() => {
      window.print();
      setPrintingOrder(null);
    }, 100);
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'kiosk':
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Kiosk</span>;
      case 'mobile':
        return <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Mobile</span>;
      case 'pos':
        return <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">POS</span>;
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-transparent">
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            #printable-receipt, #printable-receipt * {
              visibility: visible;
            }
            #printable-receipt {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              padding: 20px;
              color: black !important;
            }
          }
        `}
      </style>

      {printingOrder && (
        <div id="printable-receipt" className="hidden print:block bg-white text-black p-8 max-w-sm mx-auto font-mono text-sm">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-black uppercase mb-1">CoffeeHouse</h2>
            <p className="text-gray-500">Official Receipt</p>
          </div>
          
          <div className="mb-4 border-b border-dashed border-gray-400 pb-4">
            <div className="flex justify-between"><span>Order #:</span> <span>{printingOrder.id?.slice(-4)}</span></div>
            <div className="flex justify-between"><span>Date:</span> <span>{new Date().toLocaleDateString()}</span></div>
            <div className="flex justify-between"><span>Time:</span> <span>{new Date().toLocaleTimeString()}</span></div>
            <div className="flex justify-between"><span>Customer:</span> <span>{printingOrder.customerName}</span></div>
          </div>

          <div className="mb-4 border-b border-dashed border-gray-400 pb-4">
            {printingOrder.items.map((item, idx) => (
              <div key={idx} className="mb-2">
                <div className="flex justify-between font-bold">
                  <span>{item.quantity}x {item.name}</span>
                  <span>₱{(item.price * item.quantity).toLocaleString()}</span>
                </div>
                {item.selectedSize && <div className="text-gray-500 ml-4">Size: {item.selectedSize.name}</div>}
              </div>
            ))}
          </div>

          <div className="flex justify-between text-lg font-black mt-4">
            <span>TOTAL:</span>
            <span>₱{printingOrder.total.toLocaleString()}</span>
          </div>
          
          <div className="text-center mt-8 text-gray-500">
            <p>Thank you for your order!</p>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 scrollbar-hide print:hidden">
        <div className="max-w-6xl mx-auto">
          <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="px-3 py-1 bg-white/5 text-amber-500 text-[10px] font-black uppercase tracking-[0.3em] rounded-full border border-white/10">
                  Payments
                </div>
                <div className="h-[1px] flex-1 lg:w-48 bg-white/5" />
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white font-display uppercase italic tracking-tighter leading-[0.85] flex flex-wrap items-baseline gap-x-4">
                Cashier <span className="text-white/20 not-italic font-medium text-4xl md:text-5xl lg:text-6xl">Console</span>
              </h1>
              <div className="flex items-center gap-3 mt-6">
                <div className="h-1.5 w-16 bg-amber-600 rounded-full shadow-[0_0_15px_rgba(217,119,6,0.5)]" />
                <span className="text-xs font-bold text-coffee-500 uppercase tracking-widest">
                  Manage payments and receipts
                </span>
              </div>
            </div>
            
            <div className="flex bg-white/5 backdrop-blur-md rounded-2xl p-1.5 shadow-sm border border-white/10 overflow-x-auto scrollbar-hide max-w-full shrink-0 w-fit">
              <button 
                onClick={() => setActiveTab('unpaid')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all shrink-0 ${activeTab === 'unpaid' ? 'bg-amber-600 text-white shadow-lg scale-105' : 'text-coffee-500 hover:text-white'}`}
              >
                Awaiting Payment
                {unpaidOrders.length > 0 && (
                  <span className="ml-2 bg-black/20 px-2 py-0.5 rounded-full text-[10px]">{unpaidOrders.length}</span>
                )}
              </button>
              <button 
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all shrink-0 ${activeTab === 'history' ? 'bg-amber-600 text-white shadow-lg scale-105' : 'text-coffee-500 hover:text-white'}`}
              >
                Active / Paid
              </button>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {activeTab === 'unpaid' ? (
              unpaidOrders.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-24 text-coffee-700 bg-white/5 rounded-[2.5rem] border-2 border-dashed border-white/5">
                  <CheckCircle className="w-16 h-16 mb-4 opacity-20" />
                  <h3 className="text-xl font-black text-white uppercase tracking-widest mb-2">No Unpaid Orders</h3>
                  <p className="text-xs font-bold uppercase tracking-widest opacity-50">All kiosk and mobile orders have been settled.</p>
                </div>
              ) : (
                unpaidOrders.map((order) => (
                  <div key={order.id} className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-2xl border-2 border-amber-500/50 flex flex-col h-full relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-[50px] -mr-16 -mt-16 group-hover:bg-amber-500/20 transition-all" />
                    
                    <div className="flex justify-between items-start mb-6 relative z-10">
                      <div>
                        <span className="text-4xl font-black text-white block leading-none mb-2 font-display">
                          #{order.id?.slice(-4)}
                        </span>
                        <div className="text-[10px] font-black text-coffee-500 uppercase tracking-[0.2em]">{order.customerName}</div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {getSourceBadge(order.source)}
                        <span className="text-[9px] font-black text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 uppercase tracking-widest">Unpaid</span>
                      </div>
                    </div>

                    <div className="flex-1 bg-white/5 border border-white/5 rounded-2xl p-4 mb-6 overflow-y-auto min-h-[120px] relative z-10 scrollbar-hide">
                      <ul className="space-y-4">
                        {order.items.map((item, idx) => (
                          <li key={idx} className="flex justify-between text-xs items-start">
                            <div className="flex-1 pr-4">
                              <div className="font-black text-white uppercase tracking-tight">{item.quantity}x {item.name}</div>
                              {item.selectedSize && <div className="text-[9px] text-coffee-600 font-bold uppercase tracking-widest mt-1">Size: {item.selectedSize.name}</div>}
                              {item.notes && <div className="text-[9px] text-amber-500/70 font-bold italic mt-1 uppercase tracking-widest">"{item.notes}"</div>}
                            </div>
                            <span className="font-black text-white opacity-40 whitespace-nowrap">₱{(item.price * item.quantity).toLocaleString()}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-auto relative z-10">
                      <div className="flex justify-between items-end mb-6 border-t border-white/5 pt-4">
                        <span className="text-[10px] font-black text-coffee-500 uppercase tracking-widest">Total Due</span>
                        <span className="text-3xl font-black text-white">₱{order.total.toLocaleString()}</span>
                      </div>
                      <button 
                        onClick={() => handleMarkPaid(order)}
                        className="w-full py-4 bg-white hover:bg-white/90 text-black rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl flex items-center justify-center gap-2 active:scale-95"
                      >
                        <Banknote className="w-5 h-5" />
                        Collect Payment
                      </button>
                    </div>
                  </div>
                ))
              )
            ) : (
              pendingOrders.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-24 text-coffee-700 bg-white/5 rounded-[2.5rem] border-2 border-dashed border-white/5">
                  <Receipt className="w-16 h-16 mb-4 opacity-20" />
                  <h3 className="text-xl font-black text-white uppercase tracking-widest mb-2">No Active Orders</h3>
                  <p className="text-xs font-bold uppercase tracking-widest opacity-50">Paid orders currently in progress will appear here.</p>
                </div>
              ) : (
                pendingOrders.map((order) => (
                  <div key={order.id} className={`bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-2xl border border-white/10 flex flex-col h-full relative overflow-hidden transition-all ${order.status === 'completed' ? 'opacity-30' : 'hover:border-white/20'}`}>
                    <div className="flex justify-between items-start mb-6 relative z-10">
                      <div>
                        <span className="text-3xl font-black text-white block leading-none mb-2 font-display">
                          #{order.id?.slice(-4)}
                        </span>
                        <div className="text-[10px] font-black text-coffee-500 uppercase tracking-[0.2em]">{order.customerName}</div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {getSourceBadge(order.source)}
                        <span className="text-[9px] font-black text-green-400 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20 uppercase tracking-widest">Paid</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-end mt-auto pt-4 border-t border-white/5 relative z-10">
                      <span className="text-[10px] font-black text-coffee-500 uppercase tracking-widest">Status</span>
                      <span className="text-xs font-black text-amber-500 uppercase tracking-[0.1em]">{order.status}</span>
                    </div>
                    {order.status === 'ready' && (
                      <button 
                        onClick={() => onUpdateStatus(order.id!, 'completed')}
                        className="mt-6 w-full py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-black uppercase tracking-widest text-[10px] transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Release / Claim
                      </button>
                    )}
                  </div>
                ))
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
