import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Order, OrderStatus, ShopSettings } from '../types';
import { CheckCircle, Clock, Banknote, Coffee, Receipt, Printer, Settings, AlertCircle } from 'lucide-react';

interface CashierViewProps {
  orders: Order[];
  onUpdateStatus: (id: string, status: OrderStatus) => void;
  shopSettings: ShopSettings | null;
}

export function CashierView({ orders, onUpdateStatus, shopSettings }: CashierViewProps) {
  // Only show unpaid orders
  const unpaidOrders = orders.filter((o) => o.status === 'unpaid');
  const pendingOrders = orders.filter((o) => o.status === 'pending' || o.status === 'preparing' || o.status === 'ready' || o.status === 'completed');

  const [activeTab, setActiveTab] = useState<'unpaid' | 'history'>('unpaid');
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);

  // Printer Settings State
  const [printMode, setPrintMode] = useState<'browser' | 'serial'>(() => {
    return (localStorage.getItem('pos_print_mode') as 'browser' | 'serial') || 'browser';
  });
  const [paperSize, setPaperSize] = useState<'58mm' | '80mm'>(() => {
    return (localStorage.getItem('pos_paper_size') as '58mm' | '80mm') || '58mm';
  });
  const [baudRate, setBaudRate] = useState<string>(() => {
    return localStorage.getItem('pos_baud_rate') || '115200';
  });
  const [copies, setCopies] = useState<'customer' | 'merchant' | 'both'>(() => {
    return (localStorage.getItem('pos_copies') as 'customer' | 'merchant' | 'both') || 'both';
  });
  const [showPrinterSettings, setShowPrinterSettings] = useState<boolean>(false);

  const savePrintMode = (mode: 'browser' | 'serial') => {
    setPrintMode(mode);
    localStorage.setItem('pos_print_mode', mode);
  };

  const savePaperSize = (size: '58mm' | '80mm') => {
    setPaperSize(size);
    localStorage.setItem('pos_paper_size', size);
  };

  const saveBaudRate = (baud: string) => {
    setBaudRate(baud);
    localStorage.setItem('pos_baud_rate', baud);
  };

  const saveCopies = (c: 'customer' | 'merchant' | 'both') => {
    setCopies(c);
    localStorage.setItem('pos_copies', c);
  };

  const printToSerial = async (order: Order) => {
    if (!("serial" in navigator)) {
      alert("Web Serial API is not supported in this browser. Please use Google Chrome or Microsoft Edge on a desktop computer or Android device.");
      return;
    }

    const width = paperSize === '58mm' ? 32 : 42;
    const lineChar = '-';
    const divider = lineChar.repeat(width) + '\n';

    const centerText = (text: string) => {
      const trimmed = text.trim();
      const space = Math.max(0, Math.floor((width - trimmed.length) / 2));
      return " ".repeat(space) + trimmed + "\n";
    };

    const padText = (left: string, right: string) => {
      const spaceCount = width - left.length - right.length;
      if (spaceCount <= 0) {
        return left.slice(0, width - right.length - 1) + " " + right + "\n";
      }
      return left + " ".repeat(spaceCount) + right + "\n";
    };

    try {
      let port;
      try {
        port = await (navigator as any).serial.requestPort();
      } catch (e) {
        console.log("Port selection canceled or failed", e);
        return; // User canceled the dialog
      }

      await port.open({ baudRate: parseInt(baudRate, 10) });
      const encoder = new TextEncoder();
      const writer = port.writable.getWriter();

      // ESC/POS Commands
      const ESC = "\x1b";
      const INIT = ESC + "@";

      const nameToPrint = shopSettings?.name || 'Astro Coffee';

      const buildReceiptText = (copyLabel: string) => {
        let data = INIT;
        
        // Header
        data += centerText(nameToPrint.toUpperCase());
        data += centerText("REFUEL STATION");
        data += centerText("123 NEBULA BLVD, SPACEPORT");
        data += centerText("TEL: +63 900 123 4567");
        data += divider;
        data += centerText(`[ ${copyLabel} ]`);
        data += divider;

        // Meta Info
        data += padText("ORDER ID:", `#${order.id?.toUpperCase().slice(-6) || 'N/A'}`);
        data += padText("DATE:", new Date(order.createdAt || Date.now()).toLocaleDateString());
        data += padText("TIME:", new Date(order.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        data += padText("CUSTOMER:", (order.customerName || 'GUEST').toUpperCase());
        if (order.orderType) {
          data += padText("ORDER TYPE:", order.orderType.toUpperCase());
        }
        if (order.tableNumber) {
          data += padText("TABLE/STATION:", order.tableNumber.toUpperCase());
        }
        data += padText("SOURCE:", (order.source || 'POS').toUpperCase());
        data += divider;

        // Columns
        data += padText("ITEM", "QTY   PRICE");
        data += divider;

        // Items list
        order.items.forEach(item => {
          const namePart = item.name.toUpperCase();
          const priceStr = `PHP ${Math.round(item.price * item.quantity).toLocaleString()}`;
          const qtyStr = `${item.quantity}`;
          
          // Print main item line
          data += padText(namePart, `${qtyStr}   ${priceStr}`);

          // Customizations
          if (item.selectedSize) {
            data += `  * SIZE: ${item.selectedSize.name.toUpperCase()}\n`;
          }
          if (item.sugarLevel) {
            data += `  * SUGAR: ${item.sugarLevel.toUpperCase()}\n`;
          }
          if (item.selectedAddons && item.selectedAddons.length > 0) {
            item.selectedAddons.forEach(addon => {
              data += `  + ${addon.name.toUpperCase()} (PHP ${addon.price})\n`;
            });
          }
          if (item.notes) {
            data += `  * "${item.notes.toUpperCase()}"\n`;
          }
        });

        data += divider;
        data += padText("TOTAL AMOUNT:", `PHP ${Math.round(order.total).toLocaleString()}`);
        data += padText("PAYMENT:", order.source === 'pos' ? 'CASH' : 'ONLINE');
        data += padText("STATUS:", "PAID");
        data += divider;

        // Footer Messages
        data += centerText("THANK YOU FOR REFUELING!");
        data += centerText("PLEASE COME AGAIN!");
        data += "\n\n\n\n"; // Feeds paper to allow clean tearing

        return data;
      };

      let fullOutput = "";
      if (copies === 'both' || copies === 'customer') {
        fullOutput += buildReceiptText("CUSTOMER COPY");
      }
      if (copies === 'both') {
        fullOutput += "\n" + "-".repeat(width) + " [TEAR HERE] " + "-".repeat(width) + "\n\n\n";
      }
      if (copies === 'both' || copies === 'merchant') {
        fullOutput += buildReceiptText("MERCHANT COPY");
      }

      const dataBuffer = encoder.encode(fullOutput);
      await writer.write(dataBuffer);

      writer.releaseLock();
      await port.close();
      console.log("Thermal print request successfully completed.");
    } catch (error: any) {
      console.error("Direct thermal printing failed:", error);
      alert("Error printing directly to printer: " + error.message + "\n\nTip: Make sure the printer is paired, turned on, and you selected the correct Bluetooth/USB serial port.");
    }
  };

  const handleMarkPaid = (order: Order) => {
    onUpdateStatus(order.id!, 'pending');
    if (printMode === 'serial') {
      printToSerial(order);
    } else {
      setPrintingOrder(order);
      setTimeout(() => {
        window.print();
        setPrintingOrder(null);
      }, 250);
    }
  };

  const handleReprintReceipt = (order: Order) => {
    if (printMode === 'serial') {
      printToSerial(order);
    } else {
      setPrintingOrder(order);
      setTimeout(() => {
        window.print();
        setPrintingOrder(null);
      }, 250);
    }
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
                <h2 className="text-xl font-black uppercase tracking-tight mb-0.5">{(shopSettings?.name || 'Astro Coffee').toUpperCase()}</h2>
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

          {/* Hardware Thermal Printer Setup Controls */}
          <div className="mb-8">
            <button 
              onClick={() => setShowPrinterSettings(!showPrinterSettings)}
              className="flex items-center gap-2.5 px-5 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl border border-white/10 text-[10px] font-black uppercase tracking-widest transition-all hover:border-white/20 active:scale-95"
            >
              <Settings className="w-4 h-4 text-amber-500" />
              Receipt Printer Setup
              <span className={`text-[8px] px-2 py-0.5 rounded-full font-black tracking-widest ${printMode === 'serial' ? 'bg-green-500/20 text-green-400 border border-green-500/20' : 'bg-blue-500/20 text-blue-400 border border-blue-500/20'}`}>
                {printMode === 'serial' ? 'Direct Thermal' : 'System PDF / Print'}
              </span>
            </button>

            {showPrinterSettings && (
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 mt-4 backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-200">
                <div className="flex items-center gap-3 mb-2">
                  <Printer className="w-5 h-5 text-amber-500" />
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">
                    Hardware Receipt Printer Configuration
                  </h3>
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-coffee-600 mb-6">
                  Select printing mode, paper widths, and print copies for cash payments.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Printer Mode */}
                  <div>
                    <label className="block text-[10px] font-black text-amber-500/50 uppercase tracking-[0.2em] mb-2.5">
                      Print Method
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => savePrintMode('browser')}
                        className={`py-2.5 px-3 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all ${printMode === 'browser' ? 'bg-amber-600 text-white border-transparent shadow-lg' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'}`}
                      >
                        System PDF
                      </button>
                      <button
                        onClick={() => savePrintMode('serial')}
                        className={`py-2.5 px-3 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all ${printMode === 'serial' ? 'bg-amber-600 text-white border-transparent shadow-lg' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'}`}
                      >
                        Direct Thermal
                      </button>
                    </div>
                  </div>

                  {/* Paper Size */}
                  <div>
                    <label className="block text-[10px] font-black text-amber-500/50 uppercase tracking-[0.2em] mb-2.5">
                      Roll Width (Chars)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => savePaperSize('58mm')}
                        disabled={printMode !== 'serial'}
                        className={`py-2.5 px-3 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all disabled:opacity-40 ${paperSize === '58mm' ? 'bg-amber-600 text-white border-transparent shadow-lg' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'}`}
                      >
                        58mm (32 ch)
                      </button>
                      <button
                        onClick={() => savePaperSize('80mm')}
                        disabled={printMode !== 'serial'}
                        className={`py-2.5 px-3 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all disabled:opacity-40 ${paperSize === '80mm' ? 'bg-amber-600 text-white border-transparent shadow-lg' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'}`}
                      >
                        80mm (42 ch)
                      </button>
                    </div>
                  </div>

                  {/* Baud Rate */}
                  <div>
                    <label className="block text-[10px] font-black text-amber-500/50 uppercase tracking-[0.2em] mb-2.5">
                      Baud Rate
                    </label>
                    <select
                      value={baudRate}
                      onChange={(e) => saveBaudRate(e.target.value)}
                      disabled={printMode !== 'serial'}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-[10px] text-white font-black uppercase tracking-widest outline-none disabled:opacity-40 h-[42px]"
                    >
                      <option value="9600" className="bg-neutral-900 text-white">9600 bps</option>
                      <option value="19200" className="bg-neutral-900 text-white">19200 bps</option>
                      <option value="38400" className="bg-neutral-900 text-white">38400 bps</option>
                      <option value="115200" className="bg-neutral-900 text-white">115200 bps</option>
                    </select>
                  </div>

                  {/* Print Copies */}
                  <div>
                    <label className="block text-[10px] font-black text-amber-500/50 uppercase tracking-[0.2em] mb-2.5">
                      Print Copies
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        onClick={() => saveCopies('customer')}
                        disabled={printMode !== 'serial'}
                        className={`py-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all disabled:opacity-40 ${copies === 'customer' ? 'bg-amber-600 text-white border-transparent shadow-lg' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'}`}
                      >
                        Cust
                      </button>
                      <button
                        onClick={() => saveCopies('merchant')}
                        disabled={printMode !== 'serial'}
                        className={`py-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all disabled:opacity-40 ${copies === 'merchant' ? 'bg-amber-600 text-white border-transparent shadow-lg' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'}`}
                      >
                        Merch
                      </button>
                      <button
                        onClick={() => saveCopies('both')}
                        disabled={printMode !== 'serial'}
                        className={`py-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all disabled:opacity-40 ${copies === 'both' ? 'bg-amber-600 text-white border-transparent shadow-lg' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'}`}
                      >
                        Both
                      </button>
                    </div>
                  </div>
                </div>

                {printMode === 'serial' && (
                  <div className="mt-6 p-4 bg-amber-600/10 border border-amber-500/20 rounded-2xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="text-[10px] font-black text-white uppercase tracking-wider">Pairing Your Bluetooth / USB Thermal Printer:</h4>
                      <p className="text-[9px] font-bold text-coffee-600 leading-relaxed uppercase tracking-wider normal-case">
                        1. First, pair your thermal printer inside your computer/Android OS Bluetooth settings.<br />
                        2. When you click <span className="text-white font-black">&quot;Collect Payment&quot;</span> or <span className="text-white font-black">&quot;Print Invoice&quot;</span>, a Google Chrome / Edge selection pop-up will show paired serial devices.<br />
                        3. Choose your thermal printer&apos;s paired virtual serial port to instantly execute direct driverless ESC/POS hardware printing.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

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
