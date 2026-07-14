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
    <div className="h-screen bg-coffee-50 p-4 md:p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-coffee-900 flex items-center gap-3">
              <TableIcon className="w-8 h-8 text-coffee-600 shrink-0" />
              <span className="leading-tight">Transaction Reports</span>
            </h1>
            <p className="text-coffee-600 mt-1">Review performance and export historical data</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl hover:bg-emerald-700 transition-colors shadow-sm text-sm font-bold"
            >
              <Download className="w-4 h-4" /> Excel
            </button>
            <button
              onClick={exportToPDF}
              className="flex items-center gap-2 bg-rose-600 text-white px-4 py-2 rounded-xl hover:bg-rose-700 transition-colors shadow-sm text-sm font-bold"
            >
              <FileText className="w-4 h-4" /> PDF
            </button>
            <button
              onClick={exportToWord}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors shadow-sm text-sm font-bold"
            >
              <FileWord className="w-4 h-4" /> Word
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-coffee-100 flex flex-col justify-center">
            <span className="text-xs font-bold text-coffee-400 uppercase tracking-widest mb-1">Total Orders</span>
            <span className="text-2xl font-black text-coffee-950">{filteredOrders.length}</span>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-coffee-100 flex flex-col justify-center">
            <span className="text-xs font-bold text-coffee-400 uppercase tracking-widest mb-1">Total Revenue</span>
            <span className="text-2xl font-black text-amber-600">₱{totalRevenue.toLocaleString()}</span>
          </div>
          <div className="md:col-span-2 bg-white p-4 rounded-2xl shadow-sm border border-coffee-100">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-coffee-400 uppercase mb-1">From</label>
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-2 text-sm border border-coffee-100 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-coffee-400 uppercase mb-1">To</label>
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-2 text-sm border border-coffee-100 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-coffee-100 overflow-hidden">
          <div className="p-4 border-b border-coffee-50 bg-coffee-50/30 flex items-center gap-3">
            <Search className="w-5 h-5 text-coffee-300" />
            <input 
              type="text" 
              placeholder="Search customer, table or order ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-full font-medium text-coffee-900 placeholder:text-coffee-300"
            />
          </div>
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full text-left border-collapse min-w-[540px] sm:min-w-[700px]">
              <thead>
                <tr className="bg-coffee-900 text-white">
                  <th className="p-3 sm:p-4 font-semibold text-[10px] sm:text-xs uppercase tracking-wider">Date & Time</th>
                  <th className="p-3 sm:p-4 font-semibold text-[10px] sm:text-xs uppercase tracking-wider">Customer</th>
                  <th className="hidden sm:table-cell p-3 sm:p-4 font-semibold text-[10px] sm:text-xs uppercase tracking-wider text-center">Type</th>
                  <th className="hidden md:table-cell p-3 sm:p-4 font-semibold text-[10px] sm:text-xs uppercase tracking-wider text-center">Source</th>
                  <th className="p-3 pr-5 sm:p-4 font-semibold text-[10px] sm:text-xs uppercase tracking-wider text-center whitespace-nowrap">Status</th>
                  <th className="hidden sm:table-cell p-3 sm:p-4 font-semibold text-[10px] sm:text-xs uppercase tracking-wider text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b border-coffee-50 hover:bg-coffee-50/50 transition-colors">
                    <td className="p-3 sm:p-4">
                      <div className="text-[11px] sm:text-sm font-bold text-coffee-900 whitespace-nowrap">{new Date(order.createdAt).toLocaleDateString()}</div>
                      <div className="text-[9px] sm:text-[10px] text-coffee-400 font-mono whitespace-nowrap">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td className="p-3 sm:p-4">
                      <div className="text-[11px] sm:text-sm font-bold text-coffee-900 break-words line-clamp-2 max-w-[100px] sm:max-w-none">{order.customerName}</div>
                      <div className="flex items-center gap-2 flex-wrap mt-0.5">
                        {order.tableNumber && <div className="text-[9px] sm:text-[10px] text-amber-600 font-bold uppercase whitespace-nowrap">Table {order.tableNumber}</div>}
                        <div className="sm:hidden text-[10px] font-black text-coffee-950 bg-coffee-100 px-1 rounded">₱{order.total.toLocaleString()}</div>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell p-3 sm:p-4 text-center">
                      <span className={`text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full font-black uppercase whitespace-nowrap ${order.orderType === 'dine-in' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                        {order.orderType}
                      </span>
                    </td>
                    <td className="hidden md:table-cell p-3 sm:p-4 text-center">
                      <span className="text-[10px] sm:text-xs font-medium text-coffee-600 capitalize whitespace-nowrap">{order.source}</span>
                    </td>
                    <td className="p-3 pr-5 sm:p-4 text-center">
                      <span className={`text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full font-black uppercase whitespace-nowrap ${
                        order.status === 'completed' ? 'bg-green-100 text-green-700' : 
                        order.status === 'unpaid' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="hidden sm:table-cell p-3 sm:p-4 text-right">
                      <div className="text-[11px] sm:text-sm font-black text-coffee-950 whitespace-nowrap">₱{order.total.toLocaleString()}</div>
                    </td>
                  </tr>
                ))}
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center">
                      <div className="flex flex-col items-center gap-2 opacity-30">
                        <Calendar className="w-12 h-12" />
                        <p className="font-bold">No transactions found for this selection</p>
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
