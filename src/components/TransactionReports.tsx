import React, { useState, useMemo } from 'react';
import { Order } from '../types';
import { Calendar, FileText, Download, Table as TableIcon, File as FileWord, Search, Filter, ArrowLeft, Trash2, X, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType } from 'docx';
import { saveAs } from 'file-saver';

// Extend jsPDF with autotable types for TypeScript
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface TransactionReportsProps {
  orders: Order[];
  onDeleteOrder: (id: string) => Promise<void>;
  onClearOrders: (ids: string[]) => Promise<void>;
}

export function TransactionReports({ orders, onDeleteOrder, onClearOrders }: TransactionReportsProps) {
  const getTodayString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const [startDate, setStartDate] = useState(getTodayString());
  const [endDate, setEndDate] = useState(getTodayString());
  const [searchTerm, setSearchTerm] = useState('');

  // Modals & Action States
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      const isWithinDateRange = (!startDate || orderDate >= new Date(startDate)) && 
                                (!endDate || orderDate <= new Date(endDate + 'T23:59:59'));
      
      const matchesSearch = !searchTerm || 
                            order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            order.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            order.tableNumber?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return isWithinDateRange && matchesSearch;
    }).sort((a, b) => b.createdAt - a.createdAt);
  }, [orders, startDate, endDate, searchTerm]);

  const totalRevenue = useMemo(() => {
    return filteredOrders.reduce((sum, order) => {
      if (order.status === 'cancelled') return sum;
      return sum + order.total;
    }, 0);
  }, [filteredOrders]);

  const handleDeleteConfirm = async () => {
    if (!orderToDelete) return;
    setIsActionLoading(true);
    try {
      await onDeleteOrder(orderToDelete);
      setOrderToDelete(null);
    } catch (err) {
      console.error('Error deleting transaction:', err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleClearConfirm = async () => {
    setIsActionLoading(true);
    try {
      const idsToClear = filteredOrders.map(o => o.id).filter((id): id is string => !!id);
      await onClearOrders(idsToClear);
      setShowClearConfirm(false);
    } catch (err) {
      console.error('Error purging transactions:', err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const exportToExcel = () => {
    const data = filteredOrders.map(order => ({
      'Date': new Date(order.createdAt).toLocaleString(),
      'Order ID': order.id || 'N/A',
      'Customer': order.customerName,
      'Type': order.orderType || 'N/A',
      'Source': order.source,
      'Status': order.status,
      'Total (₱)': order.total
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
    XLSX.writeFile(wb, `Transaction_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text('Transaction Report', 14, 15);
    doc.text(`Period: ${startDate || 'All Time'} - ${endDate || 'Present'}`, 14, 25);
    doc.text(`Total Revenue: ₱${totalRevenue.toLocaleString()}`, 14, 35);

    const tableData = filteredOrders.map(order => [
      new Date(order.createdAt).toLocaleString(),
      order.id?.substring(0, 8) || 'N/A',
      order.customerName,
      order.status,
      `P${order.total.toLocaleString()}`
    ]);

    doc.autoTable({
      startY: 45,
      head: [['Date', 'ID', 'Customer', 'Status', 'Total']],
      body: tableData,
    });

    doc.save(`Transaction_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportToWord = async () => {
    const tableRows = filteredOrders.map(order => (
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph(new Date(order.createdAt).toLocaleString())] }),
          new TableCell({ children: [new Paragraph(order.id?.substring(0, 8) || 'N/A')] }),
          new TableCell({ children: [new Paragraph(order.customerName)] }),
          new TableCell({ children: [new Paragraph(order.status)] }),
          new TableCell({ children: [new Paragraph(`P${order.total.toLocaleString()}`)] }),
        ],
      })
    ));

    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: 'Transaction Report', bold: true, size: 32 }),
            ],
          }),
          new Paragraph({ text: `Period: ${startDate || 'All Time'} - ${endDate || 'Present'}` }),
          new Paragraph({ text: `Total Revenue: P${totalRevenue.toLocaleString()}` }),
          new Paragraph({ text: '' }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Date', bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'ID', bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Customer', bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Status', bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Total', bold: true })] })] }),
                ],
              }),
              ...tableRows,
            ],
          }),
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `Transaction_Report_${new Date().toISOString().split('T')[0]}.docx`);
  };

  return (
    <div className="min-h-screen bg-transparent p-3 sm:p-6 md:p-8 overflow-y-auto scrollbar-hide">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 md:mb-12">
          <div>
            <div className="flex items-center gap-4 mb-3 md:mb-4">
              <div className="px-3 py-1 bg-black/5 dark:bg-white/5 text-amber-500 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] rounded-full border border-black/10 dark:border-white/10">
                Performance
              </div>
              <div className="h-[1px] flex-1 lg:w-48 bg-black/5 dark:bg-white/5" />
            </div>
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-slate-900 dark:text-white font-display uppercase italic tracking-tighter leading-[0.85] flex flex-wrap items-baseline gap-x-3 sm:gap-x-4">
              Transaction <span className="text-white/20 not-italic font-medium text-2xl sm:text-4xl md:text-5xl lg:text-6xl">Reports</span>
            </h1>
            <div className="flex items-center gap-3 mt-4 sm:mt-6">
              <div className="h-1.5 w-12 sm:w-16 bg-amber-600 rounded-full shadow-[0_0_15px_rgba(217,119,6,0.5)] shrink-0" />
              <span className="text-[10px] sm:text-xs font-bold text-white/30 uppercase tracking-widest leading-relaxed">
                Review performance and export mission logs
              </span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2.5">
            {filteredOrders.length > 0 && (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="flex items-center gap-1.5 bg-red-600/10 border border-red-500/20 text-red-400 px-4 sm:px-6 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl hover:bg-red-600 hover:text-slate-900 dark:hover:text-white hover:border-red-600 transition-all shadow-[0_0_20px_rgba(220,38,38,0.1)] text-[9px] sm:text-[10px] font-black uppercase tracking-widest active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear ({filteredOrders.length})
              </button>
            )}
            <button
              onClick={exportToExcel}
              className="flex items-center gap-1.5 bg-emerald-600 text-slate-900 dark:text-white px-4 sm:px-6 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl hover:bg-emerald-500 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] text-[9px] sm:text-[10px] font-black uppercase tracking-widest active:scale-95"
            >
              <Download className="w-3.5 h-3.5" /> Excel
            </button>
            <button
              onClick={exportToPDF}
              className="flex items-center gap-1.5 bg-rose-600 text-slate-900 dark:text-white px-4 sm:px-6 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl hover:bg-rose-500 transition-all shadow-[0_0_20px_rgba(225,29,72,0.2)] text-[9px] sm:text-[10px] font-black uppercase tracking-widest active:scale-95"
            >
              <FileText className="w-3.5 h-3.5" /> PDF
            </button>
            <button
              onClick={exportToWord}
              className="flex items-center gap-1.5 bg-blue-600 text-slate-900 dark:text-white px-4 sm:px-6 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl hover:bg-blue-500 transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)] text-[9px] sm:text-[10px] font-black uppercase tracking-widest active:scale-95"
            >
              <FileWord className="w-3.5 h-3.5" /> Word
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-8 md:mb-12">
          <div className="bg-black/5 dark:bg-white/5 backdrop-blur-md p-5 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-black/10 dark:border-white/10 flex flex-col justify-center">
            <span className="text-[9px] sm:text-[10px] font-black text-amber-500/50 uppercase tracking-widest mb-1.5 sm:mb-2 opacity-50">Launch Count</span>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{filteredOrders.length}</span>
          </div>
          <div className="bg-black/5 dark:bg-white/5 backdrop-blur-md p-5 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-black/10 dark:border-white/10 flex flex-col justify-center">
            <span className="text-[9px] sm:text-[10px] font-black text-amber-500/50 uppercase tracking-widest mb-1.5 sm:mb-2 opacity-50">Total Fuel</span>
            <span className="text-2xl sm:text-3xl font-black text-amber-500">₱{totalRevenue.toLocaleString()}</span>
          </div>
          <div className="sm:col-span-2 bg-black/5 dark:bg-white/5 backdrop-blur-md p-5 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-black/10 dark:border-white/10 flex flex-col justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-[9px] sm:text-[10px] font-black text-amber-500/50 uppercase mb-1.5 tracking-widest opacity-50">Start Vector</label>
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-2.5 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/5 rounded-lg focus:border-amber-500/50 outline-none text-slate-900 dark:text-white font-bold transition-all text-[11px] sm:text-xs"
                />
              </div>
              <div className="flex-1">
                <label className="block text-[9px] sm:text-[10px] font-black text-amber-500/50 uppercase mb-1.5 tracking-widest opacity-50">End Vector</label>
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-2.5 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/5 rounded-lg focus:border-amber-500/50 outline-none text-slate-900 dark:text-white font-bold transition-all text-[11px] sm:text-xs"
                />
              </div>
            </div>
            
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setStartDate(getTodayString());
                  setEndDate(getTodayString());
                }}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                  startDate === getTodayString() && endDate === getTodayString()
                    ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                    : 'bg-black/5 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 border border-black/10 dark:border-white/5'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                  !startDate && !endDate
                    ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                    : 'bg-black/5 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 border border-black/10 dark:border-white/5'
                }`}
              >
                All Time
              </button>
            </div>
          </div>
        </div>

        <div className="bg-black/5 dark:bg-white/5 backdrop-blur-xl rounded-2xl sm:rounded-[2.5rem] shadow-2xl border border-black/10 dark:border-white/10 overflow-hidden mb-8 md:mb-12">
          <div className="p-4 sm:p-6 border-b border-black/10 dark:border-white/5 bg-black/5 dark:bg-white/5 flex items-center gap-3 sm:gap-4">
            <Search className="w-5 h-5 text-white/20 shrink-0" />
            <input 
              type="text" 
              placeholder="Search missions, pilots or stations..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none text-xs sm:text-sm w-full font-black text-slate-900 dark:text-white placeholder:text-white/10 uppercase tracking-tight"
            />
          </div>
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full text-left border-collapse min-w-0">
              <thead>
                <tr className="bg-black/10 dark:bg-white/10 text-slate-500 dark:text-white/40 uppercase text-[10px] font-black tracking-[0.2em]">
                  <th className="p-3 sm:p-6">Date & Time</th>
                  <th className="p-3 sm:p-6">Customer</th>
                  <th className="hidden sm:table-cell p-3 sm:p-6 text-center">Type</th>
                  <th className="hidden md:table-cell p-3 sm:p-6 text-center">Source</th>
                  <th className="p-3 sm:p-6 text-center whitespace-nowrap">Status</th>
                  <th className="hidden sm:table-cell p-3 sm:p-6 text-right">Total</th>
                  <th className="p-3 sm:p-6 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10 dark:divide-white/5">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                    <td className="p-3 sm:p-6">
                      <div className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight group-hover:text-amber-500 transition-colors">{new Date(order.createdAt).toLocaleDateString()}</div>
                      <div className="text-[10px] text-white/20 font-bold uppercase tracking-widest mt-1 opacity-50">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td className="p-3 sm:p-6">
                      <div className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight group-hover:text-amber-500 transition-colors break-words line-clamp-2 max-w-[80px] xs:max-w-[120px] sm:max-w-none">{order.customerName}</div>
                      <div className="flex items-center gap-2 flex-wrap mt-1">
                        {order.tableNumber && <div className="text-[9px] text-amber-500 font-black uppercase tracking-widest">Table {order.tableNumber}</div>}
                        <div className="sm:hidden text-[9px] font-black text-slate-900 dark:text-white bg-black/10 dark:bg-white/10 px-2 py-0.5 rounded-full border border-black/10 dark:border-white/10 uppercase tracking-widest">₱{order.total.toLocaleString()}</div>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell p-3 sm:p-6 text-center">
                      <span className={`text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest whitespace-nowrap ${order.orderType === 'dine-in' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'}`}>
                        {order.orderType}
                      </span>
                    </td>
                    <td className="hidden md:table-cell p-3 sm:p-6 text-center">
                      <span className="text-[10px] font-black text-white/30 uppercase tracking-widest whitespace-nowrap opacity-50">{order.source}</span>
                    </td>
                    <td className="p-3 sm:p-6 text-center">
                      <span className={`text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest whitespace-nowrap ${
                        order.status === 'completed' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
                        order.status === 'unpaid' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 
                        order.status === 'cancelled' ? 'bg-slate-500/10 text-slate-400 border border-slate-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="hidden sm:table-cell p-3 sm:p-6 text-right">
                      <div className="text-sm font-black text-slate-900 dark:text-white whitespace-nowrap">₱{order.total.toLocaleString()}</div>
                    </td>
                    <td className="p-3 sm:p-6 text-center whitespace-nowrap">
                      <button
                        onClick={() => setOrderToDelete(order.id || null)}
                        className="p-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl transition-all hover:scale-105 active:scale-95"
                        title="Delete Transaction"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-24 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-20">
                        <Calendar className="w-16 h-16 text-slate-900 dark:text-white" />
                        <p className="font-black uppercase tracking-[0.3em] text-xs text-slate-900 dark:text-white">No transactions found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Custom Delete Confirmation Modal */}
      {orderToDelete && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0a0a0c] rounded-[2rem] p-8 max-w-sm w-full border border-black/10 dark:border-white/10 relative overflow-hidden animate-in zoom-in-95 duration-200 shadow-2xl">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-500 to-amber-500" />
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center text-red-400 mb-6">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight mb-2">Delete Transaction</h3>
              <p className="text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-widest leading-relaxed mb-8">
                Are you sure you want to permanently delete transaction <span className="text-slate-900 dark:text-white">#{orderToDelete.substring(0, 8)}</span>? This action cannot be undone.
              </p>
              <div className="flex w-full gap-3">
                <button
                  onClick={() => setOrderToDelete(null)}
                  disabled={isActionLoading}
                  className="flex-1 py-3.5 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black/10 dark:hover:bg-white/10 transition-all text-slate-700 dark:text-slate-300 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={isActionLoading}
                  className="flex-1 py-3.5 bg-red-600 hover:bg-red-500 text-slate-900 dark:text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(220,38,38,0.2)] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isActionLoading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0a0a0c] rounded-[2rem] p-8 max-w-sm w-full border border-black/10 dark:border-white/10 relative overflow-hidden animate-in zoom-in-95 duration-200 shadow-2xl">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-500 to-amber-500" />
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center text-red-400 mb-6">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight mb-2">Purge Records</h3>
              <p className="text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-widest leading-relaxed mb-8">
                This will permanently delete the <span className="text-slate-900 dark:text-white">{filteredOrders.length}</span> transaction(s) match the current filter. This operation is irreversible.
              </p>
              <div className="flex w-full gap-3">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  disabled={isActionLoading}
                  className="flex-1 py-3.5 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black/10 dark:hover:bg-white/10 transition-all text-slate-700 dark:text-slate-300 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearConfirm}
                  disabled={isActionLoading}
                  className="flex-1 py-3.5 bg-red-600 hover:bg-red-500 text-slate-900 dark:text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(220,38,38,0.2)] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isActionLoading ? 'Purging...' : 'Purge All'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

