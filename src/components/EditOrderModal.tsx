import React, { useState, useEffect } from 'react';
import { Order, CartItem, Addon, Product, SugarLevel } from '../types';
import { X, Trash2, Plus, Minus, AlertTriangle, Save, RefreshCw } from 'lucide-react';
import { ConfirmationModal } from './ConfirmationModal';

interface EditOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onSave: (orderId: string, updatedItems: CartItem[], updatedTotal: number) => Promise<void>;
  onCancelOrder: (orderId: string) => Promise<void>;
  availableAddons: Addon[];
}

export function EditOrderModal({ isOpen, onClose, order, onSave, onCancelOrder, availableAddons }: EditOrderModalProps) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [orderToConfirmCancel, setOrderToConfirmCancel] = useState(false);
  const [editingItemIdx, setEditingItemIdx] = useState<number | null>(null);

  const isProductBeverage = (product: Product) => {
    const categoryLower = (product.category || '').toLowerCase();
    const nameLower = (product.name || '').toLowerCase();
    if (categoryLower.includes('food') || categoryLower.includes('pastry') || categoryLower.includes('dessert') || categoryLower.includes('meal') || categoryLower.includes('snack')) {
      return false; 
    }
    return ['coffee', 'tea', 'drink', 'beverage', 'iced', 'hot', 'latte', 'americano', 'matcha', 'macchiato', 'espresso', 'cappuccino'].some(keyword => 
      categoryLower.includes(keyword) || nameLower.includes(keyword)
    ) || !!product.isCustomizable;
  };

  useEffect(() => {
    if (order) {
      // Deep clone items to avoid mutating state directly
      setItems(JSON.parse(JSON.stringify(order.items)));
    } else {
      setItems([]);
    }
  }, [order, isOpen]);

  if (!isOpen || !order) return null;

  // Calculate the total of the order based on items
  const calculateTotal = (currentItems: CartItem[]): number => {
    return currentItems.reduce((sum, item) => {
      const basePrice = item.selectedSize ? item.selectedSize.price : item.price;
      const addonsPrice = item.selectedAddons ? item.selectedAddons.reduce((acc, curr) => acc + curr.price, 0) : 0;
      return sum + (basePrice + addonsPrice) * item.quantity;
    }, 0);
  };

  const currentTotal = calculateTotal(items);

  const handleQtyChange = (idx: number, delta: number) => {
    const updated = [...items];
    const newQty = updated[idx].quantity + delta;
    if (newQty <= 0) {
      // If qty is 0 or less, we remove the item from the list
      updated.splice(idx, 1);
    } else {
      updated[idx].quantity = newQty;
    }
    setItems(updated);
  };

  const handleRemoveItem = (idx: number) => {
    const updated = [...items];
    updated.splice(idx, 1);
    setItems(updated);
  };

  const handleNotesChange = (idx: number, value: string) => {
    const updated = [...items];
    updated[idx].notes = value;
    setItems(updated);
  };

  const handleSugarChange = (idx: number, level: SugarLevel) => {
    const updated = [...items];
    updated[idx].sugarLevel = level;
    setItems(updated);
  };

  const toggleAddon = (idx: number, addon: Addon) => {
    const updated = [...items];
    const item = updated[idx];
    const currentAddons = item.selectedAddons || [];
    
    if (currentAddons.find(a => a.id === addon.id)) {
      item.selectedAddons = currentAddons.filter(a => a.id !== addon.id);
    } else {
      item.selectedAddons = [...currentAddons, addon];
    }
    setItems(updated);
  };

  const handleSaveChanges = async () => {
    if (items.length === 0) {
      // If all items are removed, we can cancel the order
      setOrderToConfirmCancel(true);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(order.id!, items, currentTotal);
      onClose();
    } catch (err) {
      console.error('Failed to save order updates:', err);
      alert('An error occurred while saving changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEntireOrder = async () => {
    setIsCancelling(true);
    try {
      await onCancelOrder(order.id!);
      onClose();
    } catch (err) {
      console.error('Failed to cancel order:', err);
      alert('An error occurred while cancelling the order.');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-white dark:bg-[#0b1329] w-full max-w-2xl rounded-[2.5rem] border border-black/10 dark:border-white/10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-black/10 dark:border-white/5 flex items-center justify-between bg-black/[0.02] dark:bg-white/[0.02]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-amber-500/20">
                Adjust Mission
              </span>
              <span className="text-slate-500 dark:text-white/40 text-[10px] font-black uppercase tracking-widest">
                • {order.source.toUpperCase()} Channel
              </span>
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">
              Edit Order #{order.id?.slice(-4)}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full flex items-center justify-center transition-all active:scale-90"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content (Scrollable Items List) */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 scrollbar-hide">
          {items.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center justify-center text-slate-500">
              <AlertTriangle className="w-12 h-12 text-amber-500/40 mb-3" />
              <p className="text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">No Items Remaining</p>
              <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">Add items or cancel the order.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <label className="block text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">
                Order Content & Quantities
              </label>
              
              <div className="space-y-3.5">
                {items.map((item, idx) => {
                  const basePrice = item.selectedSize ? item.selectedSize.price : item.price;
                  const addonsPrice = item.selectedAddons ? item.selectedAddons.reduce((acc, curr) => acc + curr.price, 0) : 0;
                  const itemSubtotal = (basePrice + addonsPrice) * item.quantity;
                  const isEditing = editingItemIdx === idx;

                  return (
                    <div 
                      key={item.cartId || idx} 
                      className="bg-white/[0.03] border border-black/10 dark:border-white/5 hover:border-white/10 rounded-2xl p-4 transition-all"
                    >
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        {/* Left: Thumbnail & Name */}
                        <div className="flex items-center gap-4 flex-1">
                          {item.image ? (
                            <img 
                              src={item.image || undefined} 
                              alt={item.name} 
                              className="w-12 h-12 rounded-xl object-cover border border-black/10 dark:border-white/10 shrink-0"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center shrink-0">
                              <span className="text-white/20 font-bold text-xs">☕</span>
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">
                              {item.name}
                            </h4>
                            
                            {/* Options */}
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {item.selectedSize && (
                                <span className="text-[8px] bg-black/5 dark:bg-white/5 text-slate-700 dark:text-slate-300 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider border border-black/10 dark:border-white/5">
                                  Size: {item.selectedSize.name}
                                </span>
                              )}
                              {item.sugarLevel && (
                                <span className="text-[8px] bg-amber-500/10 text-amber-400 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider border border-amber-500/10">
                                  Sugar: {item.sugarLevel}
                                </span>
                              )}
                              {item.selectedAddons && item.selectedAddons.length > 0 && (
                                <span className="text-[8px] bg-blue-500/10 text-blue-400 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider border border-blue-500/10">
                                  +{item.selectedAddons.length} Addon{item.selectedAddons.length > 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Middle: Actions */}
                        <div className="flex gap-2">
                           <button
                            type="button"
                            onClick={() => setEditingItemIdx(isEditing ? null : idx)}
                            className="bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-[10px] font-black uppercase tracking-wider transition-all"
                           >
                             {isEditing ? 'Close' : 'Edit Options'}
                           </button>
                        </div>

                        {/* Right: Quantity Adjuster & Subtotal */}
                        <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 border-black/10 dark:border-white/5 pt-3 md:pt-0 shrink-0">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleQtyChange(idx, -1)}
                              className="w-8 h-8 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/10 dark:border-white/10 text-slate-900 dark:text-white rounded-lg flex items-center justify-center transition-all active:scale-90"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-8 text-center text-sm font-black text-slate-900 dark:text-white font-mono">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleQtyChange(idx, 1)}
                              className="w-8 h-8 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/10 dark:border-white/10 text-slate-900 dark:text-white rounded-lg flex items-center justify-center transition-all active:scale-90"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="text-right min-w-[70px]">
                            <div className="text-[8px] font-black uppercase text-slate-500 tracking-wider">Subtotal</div>
                            <div className="text-sm font-black text-slate-900 dark:text-white">₱{itemSubtotal.toLocaleString()}</div>
                          </div>

                          {/* Delete single item */}
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="w-8 h-8 bg-red-500/10 hover:bg-red-500 hover:text-slate-900 dark:hover:text-white border border-red-500/20 text-red-400 rounded-lg flex items-center justify-center transition-all active:scale-90"
                            title="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Expanded Options */}
                      {isEditing && (
                        <div className="mt-4 p-4 bg-slate-100 dark:bg-black/20 rounded-xl space-y-4 border border-black/10 dark:border-white/5 animate-in slide-in-from-top-2">
                          {(isProductBeverage(item)) && (
                            <>
                              <div>
                                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Sugar Level</label>
                                <div className="flex gap-2">
                                  {(['0%', '25%', '50%', '75%', '100%'] as SugarLevel[]).map(level => (
                                    <button
                                      key={level}
                                      onClick={() => handleSugarChange(idx, level)}
                                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${item.sugarLevel === level ? 'bg-amber-500 text-black' : 'bg-black/5 dark:bg-white/5 text-slate-600 dark:text-white/60 hover:bg-black/10 dark:hover:bg-white/10'}`}
                                    >
                                      {level}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Add-ons</label>
                                <div className="flex flex-wrap gap-2">
                                  {availableAddons.map(addon => (
                                    <button
                                      key={addon.id}
                                      onClick={() => toggleAddon(idx, addon)}
                                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 ${
                                        item.selectedAddons?.find(a => a.id === addon.id) 
                                          ? 'bg-blue-500 text-slate-900 dark:text-white' 
                                          : 'bg-black/5 dark:bg-white/5 text-slate-600 dark:text-white/60 hover:bg-black/10 dark:hover:bg-white/10'
                                      }`}
                                    >
                                      {addon.name} (+₱{addon.price})
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </>
                          )}
                          
                          <div>
                             <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Notes</label>
                             <input
                              type="text"
                              value={item.notes || ''}
                              onChange={(e) => handleNotesChange(idx, e.target.value)}
                              placeholder="Special requests..."
                              className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/5 rounded-xl px-3 py-2 text-[10px] text-slate-900 dark:text-white font-semibold uppercase placeholder-slate-600 focus:outline-none focus:border-white/10 transition-all"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-6 border-t border-black/10 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
          <div>
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest block mb-0.5">
              Live Total Recalculation
            </span>
            <div className="text-3xl font-black text-slate-900 dark:text-white italic font-display">
              ₱{currentTotal.toLocaleString()}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setOrderToConfirmCancel(true)}
              disabled={isCancelling || isSaving}
              className="px-5 py-3.5 bg-red-600/15 hover:bg-red-600 text-red-400 hover:text-slate-900 dark:hover:text-white border border-red-500/20 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
            >
              {isCancelling ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Cancel Order
            </button>

            <button
              type="button"
              onClick={handleSaveChanges}
              disabled={isCancelling || isSaving}
              className="px-7 py-3.5 bg-amber-500 hover:bg-amber-400 text-black rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Changes
            </button>
          </div>
        </div>

      </div>
      <ConfirmationModal
        isOpen={orderToConfirmCancel}
        onClose={() => setOrderToConfirmCancel(false)}
        onConfirm={handleCancelEntireOrder}
        title="Cancel Order"
        message="Are you sure you want to cancel and void this entire order?"
      />
    </div>
  );
}
