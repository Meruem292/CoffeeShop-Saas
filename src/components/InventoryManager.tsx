import React, { useState } from 'react';
import { Product } from '../types';
import { Package, AlertTriangle, Plus, Minus, Search } from 'lucide-react';

interface InventoryManagerProps {
  products: Product[];
  onUpdateStock: (id: string, delta: number) => void;
}

export function InventoryManager({ products, onUpdateStock }: InventoryManagerProps) {
  const [search, setSearch] = useState('');

  const filteredInventory = products.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-screen bg-transparent p-4 md:p-8 overflow-y-auto scrollbar-hide">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="px-3 py-1 bg-white/5 text-amber-500 text-[10px] font-black uppercase tracking-[0.3em] rounded-full border border-white/10">
                Logistics
              </div>
              <div className="h-[1px] flex-1 lg:w-48 bg-white/5" />
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white font-display uppercase italic tracking-tighter leading-[0.85] flex flex-wrap items-baseline gap-x-4">
              Inventory <span className="text-white/20 not-italic font-medium text-4xl md:text-5xl lg:text-6xl">Control</span>
            </h1>
            <div className="flex items-center gap-3 mt-6">
              <div className="h-1.5 w-16 bg-amber-600 rounded-full shadow-[0_0_15px_rgba(217,119,6,0.5)]" />
              <span className="text-xs font-bold text-coffee-500 uppercase tracking-widest">
                Track stock levels and ingredients
              </span>
            </div>
          </div>
          
          <div className="relative group">
            <div className="absolute inset-0 bg-white/5 rounded-2xl blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex items-center bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden focus-within:border-amber-500/50 transition-all shadow-sm">
              <div className="pl-4">
                <Search className="w-5 h-5 text-coffee-500" />
              </div>
              <input
                type="text"
                placeholder="Find an item..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full md:w-64 pl-3 pr-4 py-3.5 text-sm font-bold text-white placeholder:text-coffee-700 focus:outline-none bg-transparent"
              />
            </div>
          </div>
        </header>

        <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full text-left border-collapse min-w-[280px] sm:min-w-[500px]">
              <thead>
                <tr className="bg-white/10 text-white/40 uppercase text-[10px] font-black tracking-[0.2em]">
                  <th className="p-6">Item & Control</th>
                  <th className="hidden sm:table-cell p-6">Status</th>
                  <th className="hidden sm:table-cell p-6 text-right">Current Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredInventory.map((item, index) => {
                  const isLow = item.stock <= item.lowStockThreshold;
                  return (
                    <tr 
                      key={item.id} 
                      className="hover:bg-white/5 transition-colors group"
                    >
                      <td className="p-6">
                        <div className="flex items-center justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="font-black text-white text-sm uppercase tracking-tight group-hover:text-amber-500 transition-colors whitespace-normal break-words max-w-[200px] md:max-w-[400px]">{item.name}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`font-black text-[10px] uppercase tracking-widest ${isLow ? 'text-red-400' : 'text-coffee-600'}`}>
                                {item.stock} {item.unit}
                              </span>
                              {isLow && <span className="text-[8px] bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded border border-red-500/20 uppercase font-black">Refill Needed</span>}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => onUpdateStock(item.id, -1)}
                              className="p-2.5 rounded-xl bg-white/5 text-white/50 hover:text-white hover:bg-rose-500/10 hover:text-rose-500 transition-all border border-white/5"
                              disabled={item.stock <= 0}
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onUpdateStock(item.id, 1)}
                              className="p-2.5 rounded-xl bg-white text-black hover:bg-white/90 transition-all shadow-lg active:scale-95"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="hidden sm:table-cell p-6">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-red-500/10 text-red-400 border border-red-500/20">
                            <AlertTriangle className="w-3 h-3" />
                            Low
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-green-500/10 text-green-400 border border-green-500/20">
                            Healthy
                          </span>
                        )}
                      </td>
                      <td className="hidden sm:table-cell p-6 text-right">
                        <span className={`text-xl font-black ${isLow ? 'text-red-400' : 'text-white'}`}>
                          {item.stock}
                        </span>
                        <span className="text-coffee-600 text-[10px] font-black uppercase tracking-widest ml-2">{item.unit}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {filteredInventory.length === 0 && (
              <div className="p-12 text-center text-coffee-700 uppercase font-black text-[10px] tracking-widest">
                No inventory items match your search.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
