import React, { useState, useMemo } from 'react';
import { Order } from '../types';
import { Calendar, FileText, Download, Table as TableIcon, File as FileWord, Search, Filter, ArrowLeft } from 'lucide-react';
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
}

export function TransactionReports({ orders }: TransactionReportsProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

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
    return filteredOrders.reduce((sum, order) => sum + order.total, 0);
  }, [filteredOrders]);

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
    <div className="h-screen bg-transparent p-4 md:p-8 overflow-y-auto scrollbar-hide">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="px-3 py-1 bg-white/5 text-amber-500 text-[10px] font-black uppercase tracking-[0.3em] rounded-full border border-white/10">
                Performance
              </div>
              <div className="h-[1px] flex-1 lg:w-48 bg-white/5" />
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white font-display uppercase italic tracking-tighter leading-[0.85] flex flex-wrap items-baseline gap-x-4">
              Transaction <span className="text-white/20 not-italic font-medium text-4xl md:text-5xl lg:text-6xl">Reports</span>
            </h1>
            <div className="flex items-center gap-3 mt-6">
              <div className="h-1.5 w-16 bg-amber-600 rounded-full shadow-[0_0_15px_rgba(217,119,6,0.5)]" />
              <span className="text-xs font-bold text-white/30 uppercase tracking-widest">
                Review performance and export mission logs
              </span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3.5 rounded-2xl hover:bg-emerald-500 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] text-[10px] font-black uppercase tracking-widest active:scale-95"
            >
              <Download className="w-4 h-4" /> Excel
            </button>
            <button
              onClick={exportToPDF}
              className="flex items-center gap-2 bg-rose-600 text-white px-6 py-3.5 rounded-2xl hover:bg-rose-500 transition-all shadow-[0_0_20px_rgba(225,29,72,0.2)] text-[10px] font-black uppercase tracking-widest active:scale-95"
            >
              <FileText className="w-4 h-4" /> PDF
            </button>
            <button
              onClick={exportToWord}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3.5 rounded-2xl hover:bg-blue-500 transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)] text-[10px] font-black uppercase tracking-widest active:scale-95"
            >
              <FileWord className="w-4 h-4" /> Word
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white/5 backdrop-blur-md p-6 rounded-[2rem] border border-white/10 flex flex-col justify-center">
            <span className="text-[10px] font-black text-amber-500/50 uppercase tracking-widest mb-2 opacity-50">Launch Count</span>
            <span className="text-3xl font-black text-white">{filteredOrders.length}</span>
          </div>
          <div className="bg-white/5 backdrop-blur-md p-6 rounded-[2rem] border border-white/10 flex flex-col justify-center">
            <span className="text-[10px] font-black text-amber-500/50 uppercase tracking-widest mb-2 opacity-50">Total Fuel</span>
            <span className="text-3xl font-black text-amber-500">₱{totalRevenue.toLocaleString()}</span>
          </div>
          <div className="md:col-span-2 bg-white/5 backdrop-blur-md p-6 rounded-[2rem] border border-white/10">
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="flex-1">
                <label className="block text-[10px] font-black text-amber-500/50 uppercase mb-2 tracking-widest opacity-50">Start Vector</label>
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-3 bg-white/5 border border-white/5 rounded-xl focus:border-amber-500/50 outline-none text-white font-bold transition-all text-xs"
                />
              </div>
              <div className="flex-1">
                <label className="block text-[10px] font-black text-amber-500/50 uppercase mb-2 tracking-widest opacity-50">End Vector</label>
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-3 bg-white/5 border border-white/5 rounded-xl focus:border-amber-500/50 outline-none text-white font-bold transition-all text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/10 overflow-hidden mb-12">
          <div className="p-6 border-b border-white/5 bg-white/5 flex items-center gap-4">
            <Search className="w-5 h-5 text-white/20" />
            <input 
              type="text" 
              placeholder="Search missions, pilots or stations..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-full font-black text-white placeholder:text-white/10 uppercase tracking-tight"
            />
          </div>
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full text-left border-collapse min-w-[540px] sm:min-w-[700px]">
              <thead>
                <tr className="bg-white/10 text-white/40 uppercase text-[10px] font-black tracking-[0.2em]">
                  <th className="p-6">Date & Time</th>
                  <th className="p-6">Customer</th>
                  <th className="hidden sm:table-cell p-6 text-center">Type</th>
                  <th className="hidden md:table-cell p-6 text-center">Source</th>
                  <th className="p-6 text-center whitespace-nowrap">Status</th>
                  <th className="hidden sm:table-cell p-6 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-white/5 transition-colors group">
                    <td className="p-6">
                      <div className="text-xs font-black text-white uppercase tracking-tight group-hover:text-amber-500 transition-colors">{new Date(order.createdAt).toLocaleDateString()}</div>
                      <div className="text-[10px] text-white/20 font-bold uppercase tracking-widest mt-1 opacity-50">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td className="p-6">
                      <div className="text-xs font-black text-white uppercase tracking-tight group-hover:text-amber-500 transition-colors break-words line-clamp-2 max-w-[100px] sm:max-w-none">{order.customerName}</div>
                      <div className="flex items-center gap-2 flex-wrap mt-1">
                        {order.tableNumber && <div className="text-[9px] text-amber-500 font-black uppercase tracking-widest">Table {order.tableNumber}</div>}
                        <div className="sm:hidden text-[9px] font-black text-white bg-white/10 px-2 py-0.5 rounded-full border border-white/10 uppercase tracking-widest">₱{order.total.toLocaleString()}</div>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell p-6 text-center">
                      <span className={`text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest whitespace-nowrap ${order.orderType === 'dine-in' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'}`}>
                        {order.orderType}
                      </span>
                    </td>
                    <td className="hidden md:table-cell p-6 text-center">
                      <span className="text-[10px] font-black text-white/30 uppercase tracking-widest whitespace-nowrap opacity-50">{order.source}</span>
                    </td>
                    <td className="p-6 text-center">
                      <span className={`text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest whitespace-nowrap ${
                        order.status === 'completed' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
                        order.status === 'unpaid' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="hidden sm:table-cell p-6 text-right">
                      <div className="text-sm font-black text-white whitespace-nowrap">₱{order.total.toLocaleString()}</div>
                    </td>
                  </tr>
                ))}
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-24 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-20">
                        <Calendar className="w-16 h-16 text-white" />
                        <p className="font-black uppercase tracking-[0.3em] text-xs text-white">No transactions found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
