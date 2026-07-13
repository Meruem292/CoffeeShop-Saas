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
    <div className="h-screen bg-coffee-50 p-4 md:p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-coffee-900 flex items-center gap-3">
              <Package className="w-8 h-8 text-coffee-600" />
              Inventory Management
            </h1>
            <p className="text-coffee-600 mt-1">Track stock levels and ingredients</p>
          </div>
          
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-coffee-400" />
            <input
              type="text"
              placeholder="Search items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-xl border border-coffee-200 focus:outline-none focus:ring-2 focus:ring-coffee-500 w-full md:w-64 bg-white shadow-sm"
            />
          </div>
        </header>

        <div className="bg-white rounded-2xl shadow-xl border border-coffee-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-coffee-900 text-white">
                  <th className="p-4 font-semibold text-sm">Item Name</th>
                  <th className="p-4 font-semibold text-sm">Status</th>
                  <th className="p-4 font-semibold text-sm text-right">Current Stock</th>
                  <th className="p-4 font-semibold text-sm text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map((item, index) => {
                  const isLow = item.stock <= item.lowStockThreshold;
                  return (
                    <tr 
                      key={item.id} 
                      className="border-b border-coffee-100 hover:bg-coffee-50 transition-colors"
                    >
                      <td className="p-4 font-medium text-coffee-900">{item.name}</td>
                      <td className="p-4">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                            Healthy
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <span className={`text-lg font-bold ${isLow ? 'text-red-600' : 'text-coffee-900'}`}>
                          {item.stock}
                        </span>
                        <span className="text-coffee-500 text-sm ml-1">{item.unit}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => onUpdateStock(item.id, -1)}
                            className="p-1.5 rounded-lg bg-coffee-100 text-coffee-700 hover:bg-coffee-200 transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onUpdateStock(item.id, 1)}
                            className="p-1.5 rounded-lg bg-coffee-900 text-white hover:bg-coffee-800 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {filteredInventory.length === 0 && (
              <div className="p-12 text-center text-coffee-400">
                No inventory items match your search.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
