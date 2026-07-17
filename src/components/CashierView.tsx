import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Order, OrderStatus, ShopSettings, CartItem } from '../types';
import { CheckCircle, Clock, Banknote, Coffee, Receipt, Printer, Settings, AlertCircle, Edit3, Trash2 } from 'lucide-react';
import { EditOrderModal } from './EditOrderModal';
import { ConfirmationModal } from './ConfirmationModal';

interface CashierViewProps {
  orders: Order[];
  onUpdateStatus: (id: string, status: OrderStatus) => Promise<void>;
  onUpdateOrder: (id: string, updates: Partial<Order>) => Promise<void>;
  onDeleteOrder: (id: string) => Promise<void>;
  shopSettings: ShopSettings | null;
  addons: Addon[];
}

// Keep track of the active serial and Bluetooth ports globally at module scope to preserve the connection
let activeSerialPort: any = null;
let activeBleDevice: any = null;
let activeBleCharacteristic: any = null;

export function CashierView({ orders, onUpdateStatus, onUpdateOrder, onDeleteOrder, shopSettings, addons }: CashierViewProps) {
  // Only show unpaid orders
  const unpaidOrders = orders.filter((o) => o.status === 'unpaid');
  const pendingOrders = orders.filter((o) => o.status === 'pending' || o.status === 'preparing' || o.status === 'ready' || o.status === 'completed');

  const [activeTab, setActiveTab] = useState<'unpaid' | 'history'>('unpaid');
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [orderToCancel, setOrderToCancel] = useState<{order: Order, action: 'delete' | 'status'} | null>(null);

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

  // Cash Register State
  const [kickDrawer, setKickDrawer] = useState<boolean>(() => {
    return localStorage.getItem('pos_kick_drawer') !== 'false';
  });
  const [drawerCommand, setDrawerCommand] = useState<'primary' | 'alternative2' | 'alternative3'>(() => {
    return (localStorage.getItem('pos_drawer_command') as 'primary' | 'alternative2' | 'alternative3') || 'primary';
  });
  const [serialSearchType, setSerialSearchType] = useState<'usb' | 'bluetooth' | 'ble'>(() => {
    return (localStorage.getItem('pos_serial_search_type') as 'usb' | 'bluetooth' | 'ble') || 'usb';
  });
  const [isPrinterConnected, setIsPrinterConnected] = useState<boolean>(false);

  useEffect(() => {
    if ("serial" in navigator) {
      (navigator as any).serial.getPorts().then((ports: any[]) => {
        setIsPrinterConnected(ports && ports.length > 0);
      }).catch((e: any) => console.log("Error checking serial ports:", e));
    }
  }, []);

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

  const saveKickDrawer = (kick: boolean) => {
    setKickDrawer(kick);
    localStorage.setItem('pos_kick_drawer', kick ? 'true' : 'false');
  };

  const saveDrawerCommand = (cmd: 'primary' | 'alternative2' | 'alternative3') => {
    setDrawerCommand(cmd);
    localStorage.setItem('pos_drawer_command', cmd);
  };

  const saveSerialSearchType = (type: 'usb' | 'bluetooth' | 'ble') => {
    setSerialSearchType(type);
    localStorage.setItem('pos_serial_search_type', type);
  };

  const connectPrinter = async () => {
    if (serialSearchType === 'ble') {
      if (!("bluetooth" in navigator)) {
        alert("Web Bluetooth is not supported in this browser. Please use Google Chrome, Edge, or Opera over HTTPS.");
        return;
      }
      try {
        console.log("Requesting Bluetooth device...");
        const device = await (navigator as any).bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: [
            '0000ffe0-0000-1000-8000-00805f9b34fb', // Very common custom serial/printer service
            '000018f0-0000-1000-8000-00805f9b34fb', // Generic thermal printer service
            '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC Microchip
            '6e400001-b5a3-f393-e0a9-e50e24dcca9e'  // Nordic UART
          ]
        });

        setIsPrinterConnected(false);
        console.log("Connecting to GATT Server of device:", device.name);
        const server = await device.gatt.connect();

        let service;
        let characteristic;

        const uuids = [
          { service: '0000ffe0-0000-1000-8000-00805f9b34fb', char: '0000ffe1-0000-1000-8000-00805f9b34fb' },
          { service: '000018f0-0000-1000-8000-00805f9b34fb', char: '00002af1-0000-1000-8000-00805f9b34fb' },
          { service: '49535343-fe7d-4ae5-8fa9-9fafd205e455', char: '49535343-8841-43f4-a8d4-ecbe34729bb3' },
          { service: '6e400001-b5a3-f393-e0a9-e50e24dcca9e', char: '6e400002-b5a3-f393-e0a9-e50e24dcca9e' }
        ];

        // Try standard UUIDs
        for (const uuid of uuids) {
          try {
            service = await server.getPrimaryService(uuid.service);
            characteristic = await service.getCharacteristic(uuid.char);
            if (characteristic) {
              console.log("Discovered BLE primary service:", uuid.service);
              break;
            }
          } catch (e) {
            // Silently try next UUID
          }
        }

        // If not found via standard list, traverse ALL services and characteristics to auto-discover ANY writable characteristic!
        if (!characteristic) {
          try {
            console.log("Searching all services for writable characteristic fallback...");
            const services = await server.getPrimaryServices();
            for (const s of services) {
              const chars = await s.getCharacteristics();
              for (const c of chars) {
                if (c.properties.write || c.properties.writeWithoutResponse) {
                  service = s;
                  characteristic = c;
                  console.log("Autodetected GATT fallback write service/char:", s.uuid, c.uuid);
                  break;
                }
              }
              if (characteristic) break;
            }
          } catch (e) {
            console.log("Traversing GATT services failed:", e);
          }
        }

        if (!characteristic) {
          throw new Error("Could not find any compatible write/print characteristic on this device. Make sure it is a BLE-capable thermal printer.");
        }

        activeBleDevice = device;
        activeBleCharacteristic = characteristic;
        setIsPrinterConnected(true);
        alert(`Bluetooth BLE printer "${device.name || 'Thermal Printer'}" paired and connected successfully!`);
      } catch (e: any) {
        console.error("BLE Connection failed", e);
        if (e.name !== 'AbortError' && !e.message?.includes("canceled") && !e.message?.includes("cancelled")) {
          alert("Bluetooth BLE Error: " + e.message);
        }
      }
      return;
    }

    if (!("serial" in navigator)) {
      alert("Web Serial API is not supported in this browser. Please use Chrome or Edge.");
      return;
    }
    try {
      let port;
      if (serialSearchType === 'bluetooth') {
        try {
          port = await (navigator as any).serial.requestPort({
            filters: [{ bluetoothServiceClassId: '00001101-0000-1000-8000-00805f9b34fb' }]
          });
        } catch (e: any) {
          if (e.name === 'NotFoundError' || e.message?.includes("No compatible devices found")) {
            const fallback = confirm(
              "Direct Bluetooth RFCOMM scanning could not discover your printer.\n\n" +
              "Tip: Make sure the printer is paired inside your computer's Bluetooth settings first.\n\n" +
              "Often, the OS registers paired printers as Virtual COM Ports. Would you like to scan via all available Virtual COM/USB ports instead?"
            );
            if (fallback) {
              port = await (navigator as any).serial.requestPort();
            } else {
              throw e;
            }
          } else {
            throw e;
          }
        }
      } else {
        port = await (navigator as any).serial.requestPort();
      }
      activeSerialPort = port;
      setIsPrinterConnected(true);
      alert(`${serialSearchType === 'bluetooth' ? 'Bluetooth (Classic SPP)' : 'USB/Serial'} thermal printer authorized and connected successfully!`);
    } catch (e: any) {
      console.log("Port selection canceled or failed", e);
      if (e.name !== 'AbortError' && !e.message?.includes("canceled") && !e.message?.includes("cancelled")) {
        alert("Error connecting printer: " + e.message);
      }
    }
  };

  const testCashDrawer = async () => {
    if (serialSearchType === 'ble') {
      if (!activeBleCharacteristic) {
        await connectPrinter();
      }
      if (!activeBleCharacteristic) {
        alert("No active Bluetooth BLE printer connected.");
        return;
      }
      try {
        let kickCode = "";
        if (drawerCommand === 'primary') {
          kickCode = "\x1b\x70\x00\x19\xfa";
        } else if (drawerCommand === 'alternative2') {
          kickCode = "\x1b\x70\x01\x19\xfa";
        } else if (drawerCommand === 'alternative3') {
          kickCode = "\x10\x14\x01\x00\x05";
        }
        const encoder = new TextEncoder();
        const bytes = encoder.encode(kickCode);
        await activeBleCharacteristic.writeValue(bytes);
        console.log("BLE Cash drawer kick code sent successfully.");
      } catch (error: any) {
        console.error("BLE cash drawer test failed:", error);
        alert("Failed to kick cash drawer: " + error.message);
      }
      return;
    }

    if (!("serial" in navigator)) {
      alert("Web Serial API is not supported in this browser.");
      return;
    }
    try {
      let port = activeSerialPort;
      if (!port) {
        const ports = await (navigator as any).serial.getPorts();
        if (ports && ports.length > 0) {
          port = ports[0];
        } else {
          if (serialSearchType === 'bluetooth') {
            try {
              port = await (navigator as any).serial.requestPort({
                filters: [{ bluetoothServiceClassId: '00001101-0000-1000-8000-00805f9b34fb' }]
              });
            } catch (e: any) {
              if (e.name === 'NotFoundError' || e.message?.includes("No compatible devices found")) {
                const fallback = confirm(
                  "Direct Bluetooth RFCOMM scanning could not discover your printer.\n\n" +
                  "Would you like to scan via all available Virtual COM/USB ports instead?"
                );
                if (fallback) {
                  port = await (navigator as any).serial.requestPort();
                } else {
                  throw e;
                }
              } else {
                throw e;
              }
            }
          } else {
            port = await (navigator as any).serial.requestPort();
          }
        }
        activeSerialPort = port;
        setIsPrinterConnected(true);
      }

      if (!port.writable) {
        await port.open({ baudRate: parseInt(baudRate, 10) });
      }

      const encoder = new TextEncoder();
      const writer = port.writable.getWriter();

      let kickCode = "";
      if (drawerCommand === 'primary') {
        kickCode = "\x1b\x70\x00\x19\xfa";
      } else if (drawerCommand === 'alternative2') {
        kickCode = "\x1b\x70\x01\x19\xfa";
      } else if (drawerCommand === 'alternative3') {
        kickCode = "\x10\x14\x01\x00\x05";
      }

      await writer.write(encoder.encode(kickCode));
      writer.releaseLock();
      console.log("Test cash drawer kick code sent successfully.");
    } catch (error: any) {
      activeSerialPort = null;
      setIsPrinterConnected(false);
      console.error("Cash drawer test failed:", error);
      alert("Failed to kick cash drawer: " + error.message);
    }
  };

  const printToSerial = async (order: Order) => {
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

    const buildReceiptText = (copyLabel: string) => {
      const ESC = "\x1b";
      const INIT = ESC + "@";
      let data = INIT;
      
      // Header
      const nameToPrint = shopSettings?.name || 'Astro Coffee';
      data += centerText(nameToPrint.toUpperCase());
      data += centerText((shopSettings?.tagline || "Refuel Station").toUpperCase());
      data += centerText((shopSettings?.address || "123 NEBULA BLVD, SPACEPORT").toUpperCase());
      data += centerText((shopSettings?.phone ? `TEL: ${shopSettings.phone}` : "TEL: +63 900 123 4567").toUpperCase());
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

    if (serialSearchType === 'ble') {
      let characteristic = activeBleCharacteristic;
      if (!characteristic) {
        if (activeBleDevice) {
          try {
            console.log("Reconnecting BLE device GATT...");
            const server = await activeBleDevice.gatt.connect();
            const uuids = [
              { service: '0000ffe0-0000-1000-8000-00805f9b34fb', char: '0000ffe1-0000-1000-8000-00805f9b34fb' },
              { service: '000018f0-0000-1000-8000-00805f9b34fb', char: '00002af1-0000-1000-8000-00805f9b34fb' },
              { service: '49535343-fe7d-4ae5-8fa9-9fafd205e455', char: '49535343-8841-43f4-a8d4-ecbe34729bb3' },
              { service: '6e400001-b5a3-f393-e0a9-e50e24dcca9e', char: '6e400002-b5a3-f393-e0a9-e50e24dcca9e' }
            ];
            for (const uuid of uuids) {
              try {
                const s = await server.getPrimaryService(uuid.service);
                characteristic = await s.getCharacteristic(uuid.char);
                if (characteristic) break;
              } catch (e) {}
            }
            if (!characteristic) {
              const services = await server.getPrimaryServices();
              for (const s of services) {
                const chars = await s.getCharacteristics();
                for (const c of chars) {
                  if (c.properties.write || c.properties.writeWithoutResponse) {
                    characteristic = c;
                    break;
                  }
                }
                if (characteristic) break;
              }
            }
            activeBleCharacteristic = characteristic;
          } catch (e) {
            console.log("BLE reconnect failed, forcing connection prompt", e);
          }
        }
      }

      if (!characteristic) {
        await connectPrinter();
        characteristic = activeBleCharacteristic;
      }

      if (!characteristic) {
        alert("Please connect/pair a Bluetooth BLE printer first.");
        return;
      }

      try {
        let drawerKickCode = "";
        if (kickDrawer) {
          if (drawerCommand === 'primary') {
            drawerKickCode = "\x1b\x70\x00\x19\xfa";
          } else if (drawerCommand === 'alternative2') {
            drawerKickCode = "\x1b\x70\x01\x19\xfa";
          } else if (drawerCommand === 'alternative3') {
            drawerKickCode = "\x10\x14\x01\x00\x05";
          }
        }

        let fullOutput = drawerKickCode;
        if (copies === 'both' || copies === 'customer') {
          fullOutput += buildReceiptText("CUSTOMER COPY");
        }
        if (copies === 'both') {
          fullOutput += "\n" + "-".repeat(width) + " [TEAR HERE] " + "-".repeat(width) + "\n\n\n";
        }
        if (copies === 'both' || copies === 'merchant') {
          fullOutput += buildReceiptText("MERCHANT COPY");
        }

        const paperCutCommand = "\n\n\n\n\n\x1d\x56\x01";
        fullOutput += paperCutCommand;

        const encoder = new TextEncoder();
        const dataBytes = encoder.encode(fullOutput);

        const CHUNK_SIZE = 20;
        for (let i = 0; i < dataBytes.length; i += CHUNK_SIZE) {
          const chunk = dataBytes.slice(i, i + CHUNK_SIZE);
          await characteristic.writeValue(chunk);
          await new Promise(resolve => setTimeout(resolve, 15));
        }
        console.log("BLE print completed successfully!");
      } catch (error: any) {
        activeBleCharacteristic = null;
        console.error("BLE printing failed:", error);
        alert("Failed to print via Bluetooth: " + error.message);
      }
      return;
    }

    if (!("serial" in navigator)) {
      alert("Web Serial API is not supported in this browser. Please use Google Chrome or Microsoft Edge on a desktop computer or Android device.");
      return;
    }

    try {
      let port = activeSerialPort;

      if (!port) {
        const ports = await (navigator as any).serial.getPorts();
        if (ports && ports.length > 0) {
          port = ports[0];
        } else {
          try {
            if (serialSearchType === 'bluetooth') {
              try {
                port = await (navigator as any).serial.requestPort({
                  filters: [{ bluetoothServiceClassId: '00001101-0000-1000-8000-00805f9b34fb' }]
                });
              } catch (e: any) {
                if (e.name === 'NotFoundError' || e.message?.includes("No compatible devices found")) {
                  const fallback = confirm(
                    "Direct Bluetooth RFCOMM scanning could not discover your printer.\n\n" +
                    "Would you like to scan via all available Virtual COM/USB ports instead?"
                  );
                  if (fallback) {
                    port = await (navigator as any).serial.requestPort();
                  } else {
                    throw e;
                  }
                } else {
                  throw e;
                }
              }
            } else {
              port = await (navigator as any).serial.requestPort();
            }
          } catch (e) {
            console.log("Port selection canceled or failed", e);
            return; // User canceled the dialog
          }
        }
        activeSerialPort = port;
      }

      // Check if port needs to be opened
      if (!port.writable) {
        try {
          await port.open({ baudRate: parseInt(baudRate, 10) });
        } catch (openError: any) {
          if (!openError.message?.includes("already open")) {
            throw openError;
          }
        }
      }

      const encoder = new TextEncoder();
      const writer = port.writable.getWriter();

      let drawerKickCode = "";
      if (kickDrawer) {
        if (drawerCommand === 'primary') {
          drawerKickCode = "\x1b\x70\x00\x19\xfa";
        } else if (drawerCommand === 'alternative2') {
          drawerKickCode = "\x1b\x70\x01\x19\xfa";
        } else if (drawerCommand === 'alternative3') {
          drawerKickCode = "\x10\x14\x01\x00\x05";
        }
      }

      let fullOutput = drawerKickCode;
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
      console.log("Thermal print request successfully completed.");
    } catch (error: any) {
      activeSerialPort = null;
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
                <p className="text-[9px] uppercase tracking-widest font-black text-gray-800">{shopSettings?.tagline || 'Refuel Station'}</p>
                <p className="text-[8px] text-gray-500 mt-0.5">{shopSettings?.address || '123 Nebula Boulevard, Spaceport'}</p>
                <p className="text-[8px] text-gray-500">{shopSettings?.phone ? `Tel: ${shopSettings.phone}` : 'Tel: +63 900 123 4567'}</p>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
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

                  {/* Port Discovery Filter */}
                  <div className="lg:col-span-2">
                    <label className="block text-[10px] font-black text-amber-500/50 uppercase tracking-[0.2em] mb-2.5">
                      Port Type / Discovery
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => saveSerialSearchType('usb')}
                        disabled={printMode !== 'serial'}
                        className={`py-2.5 px-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all disabled:opacity-40 ${serialSearchType === 'usb' ? 'bg-amber-600 text-white border-transparent shadow-lg' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'}`}
                      >
                        USB / COM
                      </button>
                      <button
                        onClick={() => saveSerialSearchType('bluetooth')}
                        disabled={printMode !== 'serial'}
                        className={`py-2.5 px-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all disabled:opacity-40 ${serialSearchType === 'bluetooth' ? 'bg-amber-600 text-white border-transparent shadow-lg' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'}`}
                      >
                        OS Paired COM
                      </button>
                      <button
                        onClick={() => saveSerialSearchType('ble')}
                        disabled={printMode !== 'serial'}
                        className={`py-2.5 px-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all disabled:opacity-40 ${serialSearchType === 'ble' ? 'bg-amber-600 text-white border-transparent shadow-lg' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'}`}
                      >
                        Direct BT Scan
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

                {/* Cash Drawer & Connection Controls */}
                <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                  {/* Drawer Kick Toggle */}
                  <div>
                    <label className="block text-[10px] font-black text-amber-500/50 uppercase tracking-[0.2em] mb-2.5">
                      Cash Drawer Auto-Open
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => saveKickDrawer(true)}
                        className={`py-2.5 px-3 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all ${kickDrawer ? 'bg-amber-600 text-white border-transparent shadow-lg' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'}`}
                      >
                        Enabled
                      </button>
                      <button
                        onClick={() => saveKickDrawer(false)}
                        className={`py-2.5 px-3 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all ${!kickDrawer ? 'bg-amber-600 text-white border-transparent shadow-lg' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'}`}
                      >
                        Disabled
                      </button>
                    </div>
                  </div>

                  {/* Drawer Trigger Selection */}
                  <div>
                    <label className="block text-[10px] font-black text-amber-500/50 uppercase tracking-[0.2em] mb-2.5">
                      Drawer Command / Pin Pulse
                    </label>
                    <select
                      value={drawerCommand}
                      onChange={(e) => saveDrawerCommand(e.target.value as any)}
                      disabled={!kickDrawer}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-[10px] text-white font-black uppercase tracking-widest outline-none disabled:opacity-40 h-[42px]"
                    >
                      <option value="primary" className="bg-neutral-900 text-white">Primary Pin 2 (1B 70 00 19 FA)</option>
                      <option value="alternative2" className="bg-neutral-900 text-white">Alt Pin 5 (1B 70 01 19 FA)</option>
                      <option value="alternative3" className="bg-neutral-900 text-white">Status Pulse (10 14 01 00 05)</option>
                    </select>
                  </div>

                  {/* Test Trigger / Manual Connect Actions */}
                  <div className="flex gap-2.5">
                    <button
                      type="button"
                      onClick={connectPrinter}
                      className={`flex-1 py-2.5 px-4 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all active:scale-95 h-[42px] ${
                        (serialSearchType === 'ble' ? !!activeBleCharacteristic : isPrinterConnected)
                          ? 'bg-green-600/20 text-green-400 border-green-500/20' 
                          : 'bg-amber-500 text-black font-black hover:bg-amber-400 border-transparent'
                      }`}
                    >
                      {serialSearchType === 'ble' 
                        ? (activeBleCharacteristic ? '✓ BLE Printer Paired' : 'Scan & Pair Printer (BLE)')
                        : (isPrinterConnected ? '✓ Port Authorized' : serialSearchType === 'bluetooth' ? 'Search Bluetooth' : 'Connect USB / COM')
                      }
                    </button>
                    {kickDrawer && (
                      <button
                        type="button"
                        onClick={testCashDrawer}
                        className="flex-1 py-2.5 px-4 rounded-xl text-[9px] font-black uppercase tracking-wider bg-white/5 text-white border border-white/10 hover:bg-white/10 transition-all active:scale-95 h-[42px]"
                      >
                        Test Drawer
                      </button>
                    )}
                  </div>
                </div>

                {printMode === 'serial' && (
                  <div className="mt-6 p-5 bg-[#111115] border border-amber-500/20 rounded-2xl flex flex-col md:flex-row gap-5">
                    <div className="flex items-start gap-3 flex-1">
                      <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <h4 className="text-[10px] font-black text-white uppercase tracking-wider">Pairing Your Printer (Desktop or Android Phone):</h4>
                        <p className="text-[9px] font-bold text-coffee-600 leading-relaxed uppercase tracking-wider normal-case">
                          1. For Bluetooth thermal printers, we highly recommend selecting <span className="text-amber-500 font-black">Direct BT Scan</span> in the grid above. It works perfectly on BOTH Android phones and desktop computers without system pairing hacks!<br />
                          2. Click <span className="text-white font-black">&quot;Scan & Pair Printer (BLE)&quot;</span> below, select your printer, and start printing instantly.<br />
                          3. For USB cables or older Bluetooth adapters, use <span className="text-amber-500 font-black">USB / COM</span> or <span className="text-amber-500 font-black">OS Paired COM</span>.
                        </p>
                      </div>
                    </div>
                    <div className="h-px md:h-auto md:w-px bg-white/10" />
                    <div className="flex items-start gap-3 flex-1">
                      <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-wider">How to resolve connection issues:</h4>
                        <p className="text-[9px] font-bold text-coffee-600 leading-relaxed uppercase tracking-wider normal-case">
                          If your printer fails to connect or says no compatible devices found:<br />
                          <span className="text-white font-black">Tip 1:</span> Ensure the printer is fully powered on and not connected to another device/phone.<br />
                          <span className="text-white font-black">Tip 2:</span> If using Direct BT Scan, make sure Location/Bluetooth is enabled on your device.<br />
                          <span className="text-white font-black">Tip 3:</span> For Android users on older hardware, use <span className="text-amber-500 font-black">Direct BT Scan</span> first, or switch to <span className="text-white font-black">System PDF</span> mode as a bulletproof fallback.
                        </p>
                      </div>
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
                      
                      <div className="flex gap-2 mb-3">
                        <button 
                          onClick={() => setEditingOrder(order)}
                          className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl font-black uppercase tracking-widest text-[9px] transition-all flex items-center justify-center gap-1.5 active:scale-95"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-amber-500" />
                          Edit Order
                        </button>
                        <button 
                          onClick={() => setOrderToCancel({order, action: 'delete'})}
                          className="py-3 px-4 bg-red-600/15 hover:bg-red-600 text-red-400 hover:text-white rounded-xl font-black uppercase tracking-widest text-[9px] border border-red-500/20 transition-all flex items-center justify-center gap-1.5 active:scale-95"
                          title="Cancel Order"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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
                      
                      {order.status !== 'completed' && (
                        <div className="grid grid-cols-2 gap-2">
                          <button 
                            onClick={() => setEditingOrder(order)}
                            className="py-2.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl font-black uppercase tracking-widest text-[9px] transition-all flex items-center justify-center gap-1 active:scale-95"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-amber-500" />
                            Edit
                          </button>
                          <button 
                            onClick={() => setOrderToCancel({order, action: 'status'})}
                            className="py-2.5 bg-red-600/15 hover:bg-red-600 text-red-400 hover:text-white rounded-xl font-black uppercase tracking-widest text-[9px] border border-red-500/20 transition-all flex items-center justify-center gap-1 active:scale-95"
                            title="Cancel Order"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Cancel
                          </button>
                        </div>
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

      <EditOrderModal
        isOpen={editingOrder !== null}
        onClose={() => setEditingOrder(null)}
        order={editingOrder}
        availableAddons={addons}
        onSave={async (orderId, updatedItems, updatedTotal) => {
          await onUpdateOrder(orderId, { items: updatedItems, total: updatedTotal });
          setEditingOrder(null);
        }}
        onCancelOrder={async (orderId) => {
          await onDeleteOrder(orderId);
          setEditingOrder(null);
        }}
      />
      
      <ConfirmationModal
        isOpen={orderToCancel !== null}
        onClose={() => setOrderToCancel(null)}
        onConfirm={async () => {
          if (orderToCancel) {
            if (orderToCancel.action === 'delete') {
              await onDeleteOrder(orderToCancel.order.id!).catch(console.error);
            } else {
              await onUpdateStatus(orderToCancel.order.id!, 'cancelled').catch(console.error);
            }
            setOrderToCancel(null);
          }
        }}
        title="Cancel Order"
        message="Are you sure you want to cancel and void this order?"
      />
    </div>
  );
}
