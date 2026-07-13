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
    <div className="flex-1 overflow-hidden flex flex-col bg-coffee-50">
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
        <div className="max-w-5xl mx-auto">
          <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between border-b border-coffee-200 pb-6 gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Banknote className="w-8 h-8 text-amber-600" />
                <h2 className="text-3xl md:text-4xl font-black text-coffee-950 uppercase italic tracking-tighter leading-none">
                  Cashier
                </h2>
              </div>
              <p className="text-coffee-600 font-medium">Manage payments and receipts</p>
            </div>
            
            <div className="flex bg-white rounded-xl p-1 shadow-sm border border-coffee-100 overflow-x-auto scrollbar-hide max-w-full shrink-0">
              <button 
                onClick={() => setActiveTab('unpaid')}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all shrink-0 ${activeTab === 'unpaid' ? 'bg-amber-500 text-white shadow-md' : 'text-coffee-500 hover:text-coffee-800'}`}
              >
                Awaiting Payment
                {unpaidOrders.length > 0 && (
                  <span className="ml-2 bg-black/10 px-2 py-0.5 rounded-full text-xs">{unpaidOrders.length}</span>
                )}
              </button>
              <button 
                onClick={() => setActiveTab('history')}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all shrink-0 ${activeTab === 'history' ? 'bg-amber-500 text-white shadow-md' : 'text-coffee-500 hover:text-coffee-800'}`}
              >
                Active / Paid
              </button>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeTab === 'unpaid' ? (
              unpaidOrders.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-20 text-coffee-400 bg-white rounded-2xl border border-dashed border-coffee-300">
                  <CheckCircle className="w-16 h-16 mb-4 text-coffee-300" />
                  <h3 className="text-xl font-bold text-coffee-900 mb-2">No Unpaid Orders</h3>
                  <p>All kiosk and mobile orders have been settled.</p>
                </div>
              ) : (
                unpaidOrders.map((order) => (
                  <div key={order.id} className="bg-white rounded-2xl p-5 shadow-lg border-2 border-amber-400 flex flex-col h-full relative overflow-hidden">
                    <div className="flex justify-between items-start mb-4 relative z-10">
                      <div>
                        <span className="text-3xl font-black text-coffee-950 block leading-none mb-1">
                          #{order.id?.slice(-4)}
                        </span>
                        <div className="text-sm font-bold text-coffee-500">{order.customerName}</div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {getSourceBadge(order.source)}
                        <span className="text-sm font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">Unpaid</span>
                      </div>
                    </div>

                    <div className="flex-1 bg-coffee-50 rounded-xl p-3 mb-4 overflow-y-auto min-h-[100px] relative z-10">
                      <ul className="space-y-3">
                        {order.items.map((item, idx) => (
                          <li key={idx} className="flex justify-between text-sm items-start">
                            <div className="flex-1 pr-2">
                              <span className="font-bold text-coffee-900">{item.quantity}x {item.name}</span>
                              {item.selectedSize && <div className="text-xs text-coffee-500">Size: {item.selectedSize.name}</div>}
                              {item.notes && <div className="text-xs text-coffee-400 italic">"{item.notes}"</div>}
                            </div>
                            <span className="font-bold text-coffee-700">₱{(item.price * item.quantity).toLocaleString()}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-auto relative z-10">
                      <div className="flex justify-between items-end mb-4 border-t border-coffee-100 pt-3">
                        <span className="text-sm font-bold text-coffee-400 uppercase">Total Due</span>
                        <span className="text-2xl font-black text-coffee-950">₱{order.total.toLocaleString()}</span>
                      </div>
                      <button 
                        onClick={() => handleMarkPaid(order)}
                        className="w-full py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold transition-colors shadow-lg flex items-center justify-center gap-2"
                      >
                        <Banknote className="w-5 h-5" />
                        Receive Cash & Print
                      </button>
                    </div>
                  </div>
                ))
              )
            ) : (
              pendingOrders.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-20 text-coffee-400 bg-white rounded-2xl border border-dashed border-coffee-300">
                  <Receipt className="w-16 h-16 mb-4 text-coffee-300" />
                  <h3 className="text-xl font-bold text-coffee-900 mb-2">No Active Orders</h3>
                  <p>Paid orders currently in progress will appear here.</p>
                </div>
              ) : (
                pendingOrders.map((order) => (
                  <div key={order.id} className={`bg-white rounded-2xl p-5 shadow-sm border border-coffee-200 flex flex-col h-full relative overflow-hidden ${order.status === 'completed' ? 'opacity-50 grayscale' : ''}`}>
                    <div className="flex justify-between items-start mb-4 relative z-10">
                      <div>
                        <span className="text-xl font-black text-coffee-950 block leading-none mb-1">
                          #{order.id?.slice(-4)}
                        </span>
                        <div className="text-sm font-bold text-coffee-500">{order.customerName}</div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {getSourceBadge(order.source)}
                        <span className="text-sm font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">Paid</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-end mt-auto pt-3 border-t border-coffee-100 relative z-10">
                      <span className="text-xs font-bold text-coffee-400 uppercase">Status</span>
                      <span className="text-sm font-black text-coffee-700 uppercase">{order.status}</span>
                    </div>
                    {order.status === 'ready' && (
                      <button 
                        onClick={() => onUpdateStatus(order.id!, 'completed')}
                        className="mt-4 w-full py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold transition-colors shadow-sm flex items-center justify-center gap-2"
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
