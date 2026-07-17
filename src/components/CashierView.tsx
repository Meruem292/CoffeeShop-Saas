import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Order, OrderStatus } from '../types';
import { CheckCircle, Clock, Banknote, Coffee, Receipt, Printer } from 'lucide-react';

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
    }, 250);
  };

  const handleReprintReceipt = (order: Order) => {
    setPrintingOrder(order);
    setTimeout(() => {
      window.print();
      setPrintingOrder(null);
    }, 250);
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
            body {
              background: white !important;
              color: black !important;
              margin: 0 !important;
              padding: 0 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            #root, .print\\:hidden, header, nav, button {
              display: none !important;
            }
            #printable-receipt {
              display: block !important;
              width: 76mm !important;
              margin: 0 auto !important;
              padding: 5px 10px !important;
              background: white !important;
              color: black !important;
              font-family: 'Courier New', Courier, monospace !important;
            }
            @page {
              size: 80mm auto;
              margin: 0;
            }
          }
        `}
      </style>

      {printingOrder && createPortal(
        <div id="printable-receipt" className="hidden print:block bg-white text-black p-4 font-mono text-xs w-[76mm] mx-auto">
          {[
            { label: 'CUSTOMER COPY', isMerchant: false },
            { label: 'MERCHANT COPY', isMerchant: true }
          ].map((copy, copyIdx) => (
            <div key={copyIdx} className={copyIdx > 0 ? 'mt-8 border-t border-dashed border-black pt-8' : ''}>
              
              {/* Header */}
              <div className="text-center mb-4">
                <h2 className="text-xl font-black uppercase tracking-tight mb-0.5">ASTRO COFFEE</h2>
                <p className="text-[9px] uppercase tracking-widest font-black text-gray-800">Refuel Station</p>
                <p className="text-[8px] text-gray-500 mt-0.5">123 Nebula Boulevard, Spaceport</p>
                <p className="text-[8px] text-gray-500">Tel: +63 900 123 4567</p>
                <div className="border-b border-black border-double my-2" />
                <div className="bg-black text-white py-1 px-3 text-[10px] font-black uppercase tracking-widest inline-block rounded">
                  {copy.label}
                </div>
              </div>

              {/* Order Meta */}
              <div className="space-y-1 text-[9px] mb-3">
                <div className="flex justify-between">
                  <span>ORDER ID:</span>
                  <span className="font-bold">#{printingOrder.id?.toUpperCase().slice(-6) || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>DATE/TIME:</span>
                  <span>
                    {new Date(printingOrder.createdAt || Date.now()).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                    })}{' '}
                    {new Date(printingOrder.createdAt || Date.now()).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>CUSTOMER:</span>
                  <span className="font-bold uppercase">{printingOrder.customerName || 'GUEST'}</span>
                </div>
                {printingOrder.orderType && (
                  <div className="flex justify-between">
                    <span>ORDER TYPE:</span>
                    <span className="font-bold uppercase">{printingOrder.orderType === 'dine-in' ? 'DINE-IN' : 'TAKE-OUT'}</span>
                  </div>
                )}
                {printingOrder.tableNumber && (
                  <div className="flex justify-between">
                    <span>STATION / TABLE:</span>
                    <span className="font-bold">{printingOrder.tableNumber}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>CHANNEL/SOURCE:</span>
                  <span className="font-bold uppercase">{printingOrder.source || 'POS'}</span>
                </div>
              </div>

              {/* Line Divider */}
              <div className="border-b border-dashed border-black my-2" />
              
              {/* Table Columns */}
              <div className="grid grid-cols-12 gap-1 text-[9px] font-bold pb-1 text-gray-800">
                <span className="col-span-8">ITEM</span>
                <span className="col-span-1 text-center">QTY</span>
                <span className="col-span-3 text-right">PRICE</span>
              </div>
              <div className="border-b border-dashed border-black mb-2" />

              {/* Items List */}
              <div className="space-y-2 text-[9px]">
                {printingOrder.items.map((item, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="grid grid-cols-12 gap-1 font-bold">
                      <span className="col-span-8 truncate uppercase">{item.name}</span>
                      <span className="col-span-1 text-center">{item.quantity}</span>
                      <span className="col-span-3 text-right">₱{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                    {/* Item Customizations */}
                    {item.selectedSize && (
                      <div className="text-[8px] text-gray-700 pl-3 uppercase">
                        • SIZE: {item.selectedSize.name}
                      </div>
                    )}
                    {item.sugarLevel && (
                      <div className="text-[8px] text-gray-700 pl-3 uppercase">
                        • SUGAR: {item.sugarLevel}
                      </div>
                    )}
                    {item.selectedAddons && item.selectedAddons.length > 0 && (
                      <div className="text-[8px] text-gray-700 pl-3 space-y-0.5">
                        {item.selectedAddons.map((addon) => (
                          <div key={addon.id} className="flex justify-between">
                            <span>+ {addon.name.toUpperCase()}</span>
                            <span>₱{addon.price.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {item.notes && (
                      <div className="text-[8px] text-gray-600 pl-3 italic">
                        * "{item.notes}"
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Line Divider */}
              <div className="border-b border-dashed border-black my-2" />

              {/* Summary Block */}
              <div className="space-y-1 text-[10px] mt-2">
                <div className="flex justify-between font-black text-xs">
                  <span>TOTAL AMOUNT:</span>
                  <span>₱{printingOrder.total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[8px] mt-1">
                  <span>PAYMENT METHOD:</span>
                  <span className="font-bold uppercase">{printingOrder.source === 'pos' ? 'CASH' : 'ONLINE'}</span>
                </div>
                <div className="flex justify-between text-[8px]">
                  <span>PAYMENT STATUS:</span>
                  <span className="font-bold uppercase px-1 border border-black leading-none py-0.5 bg-black text-white">
                    PAID
                  </span>
                </div>
              </div>

              {/* Line Divider */}
              <div className="border-b border-dashed border-black my-2" />

              {/* Footer messages */}
              <div className="text-center space-y-1 mt-3">
                <p className="text-[8px] font-black uppercase tracking-wider">THANK YOU FOR REFUELING!</p>
                <p className="text-[7px] text-gray-500">Please keep this ticket for your order collection.</p>
                <div className="text-[7px] font-mono tracking-tight mt-2 opacity-80 select-none">
                  ||||| | |||| ||| ||| ||| | ||| ||| | |||||
                  <br />
                  ASTRO-{printingOrder.id?.toUpperCase().slice(-6) || '000000'}
                </div>
              </div>

              {copyIdx === 0 && (
                <div className="text-center text-[8px] text-black font-black uppercase tracking-widest my-4 border-y border-dashed border-black/40 py-1.5 select-none">
                  ✂️ [TEAR HERE] ------------------------
                </div>
              )}
            </div>
          ))}
        </div>,
        document.body
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

                    <div className="mt-6 space-y-2 relative z-10">
                      {order.status === 'ready' && (
                        <button 
                          onClick={() => onUpdateStatus(order.id!, 'completed')}
                          className="w-full py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-black uppercase tracking-widest text-[10px] transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Release / Claim
                        </button>
                      )}
                      <button 
                        onClick={() => handleReprintReceipt(order)}
                        className="w-full py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 active:scale-95"
                      >
                        <Printer className="w-4 h-4 text-amber-500" />
                        Print Invoice
                      </button>
                    </div>
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
