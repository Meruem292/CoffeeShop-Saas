import React, { useState } from 'react';
import { Tag, Plus, Edit2, Trash2, X, Check, Save, Search, CheckCircle2 } from 'lucide-react';
import { Voucher, DynamicCategory, Product } from '../types';
import { useToast } from '../lib/ToastContext';
import { ConfirmationModal } from './ConfirmationModal';

interface AdminVouchersProps {
  vouchers: Voucher[];
  categories?: DynamicCategory[];
  products?: Product[];
  onAddVoucher: (voucher: Omit<Voucher, 'id'>) => Promise<void>;
  onUpdateVoucher: (id: string, voucher: Partial<Voucher>) => Promise<void>;
  onDeleteVoucher: (id: string) => Promise<void>;
}

function ProductTagPicker({
  products = [],
  selectedProductIds = [],
  onChange,
  placeholder = "Search and pick products..."
}: {
  products?: Product[];
  selectedProductIds?: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const selectedProducts = products.filter(p => selectedProductIds.includes(p.id));
  const filteredAvailable = products.filter(p => {
    if (selectedProductIds.includes(p.id)) return false;
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    return (p.name || '').toLowerCase().includes(term) || (p.category || '').toLowerCase().includes(term);
  });

  const toggleProduct = (id: string) => {
    if (selectedProductIds.includes(id)) {
      onChange(selectedProductIds.filter(pid => pid !== id));
    } else {
      onChange([...selectedProductIds, id]);
    }
  };

  const removeProduct = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedProductIds.filter(pid => pid !== id));
  };

  return (
    <div className="space-y-2">
      {/* Selected tags */}
      {selectedProducts.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-2 bg-black/5 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/5 max-h-32 overflow-y-auto">
          {selectedProducts.map(product => (
            <span
              key={product.id}
              className="inline-flex items-center gap-1.5 pl-1.5 pr-2 py-1 bg-white dark:bg-[#1a1f2e] border border-amber-500/30 text-slate-800 dark:text-slate-100 rounded-lg text-xs font-bold shadow-sm animate-in fade-in"
            >
              {product.image ? (
                <img src={product.image} alt={product.name} className="w-4 h-4 rounded object-cover" referrerPolicy="no-referrer" />
              ) : (
                <Tag className="w-3 h-3 text-amber-500" />
              )}
              <span className="truncate max-w-[140px]">{product.name}</span>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono font-bold">₱{product.price}</span>
              <button
                type="button"
                onClick={(e) => removeProduct(product.id, e)}
                className="p-0.5 hover:bg-rose-500/20 hover:text-rose-500 rounded text-slate-400 transition-colors ml-0.5"
                title="Remove item"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {selectedProducts.length > 1 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="text-[10px] uppercase font-black tracking-wider text-rose-500 hover:underline px-2 py-1"
            >
              Clear all ({selectedProducts.length})
            </button>
          )}
        </div>
      )}

      {/* Search & dropdown trigger */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 absolute left-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsDropdownOpen(true);
            }}
            onFocus={() => setIsDropdownOpen(true)}
            placeholder={placeholder}
            className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-[#1a1a24] text-slate-900 dark:text-white border border-black/10 dark:border-white/10 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown list */}
        {isDropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-white dark:bg-[#131722] border border-black/10 dark:border-white/10 rounded-xl shadow-2xl max-h-56 overflow-y-auto p-1.5 space-y-1">
            <div className="flex items-center justify-between px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-black/5 dark:border-white/5">
              <span>Select Product to Add</span>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(false)}
                className="text-amber-500 hover:underline"
              >
                Done
              </button>
            </div>
            {filteredAvailable.length > 0 ? (
              filteredAvailable.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    toggleProduct(p.id);
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-amber-500/10 dark:hover:bg-amber-500/15 text-left transition-colors group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-md bg-black/10 overflow-hidden flex-shrink-0">
                      {p.image ? (
                        <img src={p.image} alt={p.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold">₱</div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-amber-600 dark:group-hover:text-amber-400">
                        {p.name}
                      </div>
                      <div className="text-[9px] text-slate-400 uppercase font-medium">
                        {p.category}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs font-black text-amber-500">₱{p.price}</span>
                    <span className="px-2 py-0.5 rounded bg-black/5 dark:bg-white/5 text-[9px] font-bold text-slate-500 group-hover:bg-amber-500 group-hover:text-black transition-colors">
                      + Add
                    </span>
                  </div>
                </button>
              ))
            ) : (
              <div className="py-4 text-center text-xs text-slate-400 font-medium">
                {searchTerm ? 'No matching products found' : 'All products have been selected'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function AdminVouchers({ vouchers, categories = [], products = [], onAddVoucher, onUpdateVoucher, onDeleteVoucher }: AdminVouchersProps) {
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [voucherToDelete, setVoucherToDelete] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<Voucher>>({
    code: '',
    type: 'percentage',
    value: 0,
    minSpend: 0,
    isActive: true,
    pointsCost: 0,
    usageLimit: 0,
    buyQuantity: 1,
    buyScope: 'category',
    buyCategoryOrName: '',
    buyProductIds: [],
    getQuantity: 1,
    getCategoryOrName: '',
    getProductIds: [],
  });

  const resetForm = () => {
    setFormData({
      code: '',
      type: 'percentage',
      value: 0,
      minSpend: 0,
      isActive: true,
      pointsCost: 0,
      usageLimit: 0,
      buyQuantity: 1,
      buyScope: 'category',
      buyCategoryOrName: '',
      buyProductIds: [],
      getQuantity: 1,
      getCategoryOrName: '',
      getProductIds: [],
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code) {
      toast.warning('Promo code is required');
      return;
    }
    if (formData.type !== 'buy_x_get_y' && formData.value === undefined) {
      toast.warning('Discount value is required');
      return;
    }

    if (formData.type === 'buy_x_get_y') {
      if (!formData.getProductIds || formData.getProductIds.length === 0) {
        toast.warning('Please select at least 1 free reward product');
        return;
      }
    }

    if (editingId) {
      await onUpdateVoucher(editingId, formData);
    } else {
      await onAddVoucher(formData as Omit<Voucher, 'id'>);
    }
    resetForm();
  };

  const renderForm = () => (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-[#131722] p-6 rounded-3xl border border-black/10 dark:border-white/5 space-y-6 animate-in slide-in-from-top-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-black uppercase tracking-tighter italic flex items-center gap-2 text-slate-900 dark:text-white">
          <Tag className="w-5 h-5 text-amber-500" />
          {editingId ? 'Edit Voucher' : 'New Voucher'}
        </h3>
        <button type="button" onClick={resetForm} className="p-2 bg-black/5 dark:bg-white/5 rounded-full hover:bg-black/10 transition-colors">
          <X className="w-5 h-5 text-slate-500" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Promo Code</label>
          <input
            type="text"
            required
            value={formData.code || ''}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            className="w-full px-4 py-3 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/50 uppercase"
            placeholder="SUMMER24"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Voucher Category & Type</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'percentage', pointsCost: 0 })}
              className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${formData.type === 'percentage' && !formData.pointsCost ? 'bg-amber-500 text-black' : 'bg-black/5 dark:bg-white/5 text-slate-500'}`}
            >
              Percentage %
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'fixed', pointsCost: 0 })}
              className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${formData.type === 'fixed' && !formData.pointsCost ? 'bg-amber-500 text-black' : 'bg-black/5 dark:bg-white/5 text-slate-500'}`}
            >
              Fixed ₱
            </button>
            <button
              type="button"
              onClick={() => setFormData({ 
                ...formData, 
                type: 'buy_x_get_y', 
                pointsCost: 0, 
                conditionType: 'buy_x_get_y',
                buyScope: formData.buyScope || 'category',
                buyQuantity: formData.buyQuantity || 1,
                getQuantity: formData.getQuantity || 1
              })}
              className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${formData.type === 'buy_x_get_y' ? 'bg-amber-500 text-black' : 'bg-black/5 dark:bg-white/5 text-slate-500'}`}
            >
              Buy X Get Y Promo
            </button>
          </div>
        </div>

        {formData.type === 'buy_x_get_y' ? (
          <div className="col-span-full space-y-6 p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-black text-xs uppercase tracking-wider">
              <Tag className="w-4 h-4" />
              Buy X Get Y Configuration
            </div>

            {/* BUY SECTION */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  1. Customer Must Purchase
                </label>
                <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, buyScope: 'category' })}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                      formData.buyScope === 'category' ? 'bg-amber-500 text-black shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                    }`}
                  >
                    Category
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, buyScope: 'products' })}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                      formData.buyScope === 'products' ? 'bg-amber-500 text-black shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                    }`}
                  >
                    Specific Products
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, buyScope: 'all', buyCategoryOrName: '', buyProductIds: [] })}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                      formData.buyScope === 'all' ? 'bg-amber-500 text-black shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                    }`}
                  >
                    Any Item
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="sm:w-32">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Quantity to Buy</span>
                  <input
                    type="number"
                    value={formData.buyQuantity || ''}
                    onChange={(e) => setFormData({ ...formData, buyQuantity: Math.max(1, parseInt(e.target.value) || 1) })}
                    className="w-full px-4 py-3 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl text-sm font-bold"
                    placeholder="e.g. 2"
                    min="1"
                  />
                </div>

                <div className="flex-1">
                  {formData.buyScope === 'category' && (
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Qualifying Category</span>
                      <select
                        value={formData.buyCategoryOrName || ''}
                        onChange={(e) => setFormData({ ...formData, buyCategoryOrName: e.target.value })}
                        className="w-full px-4 py-3 bg-white dark:bg-[#1a1a24] text-slate-900 dark:text-white border border-black/10 dark:border-white/10 rounded-xl text-sm font-bold uppercase focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                      >
                        <option value="">Select Category...</option>
                        {(categories.length > 0 ? categories.map(c => c.name) : ['Hot Coffee', 'Cold Coffee', 'Tea', 'Food', 'Pastries']).map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {formData.buyScope === 'products' && (
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Qualifying Products</span>
                      <ProductTagPicker
                        products={products}
                        selectedProductIds={formData.buyProductIds || []}
                        onChange={(ids) => setFormData({ ...formData, buyProductIds: ids })}
                        placeholder="Search & select qualifying products..."
                      />
                    </div>
                  )}

                  {formData.buyScope === 'all' && (
                    <div className="py-3 px-4 rounded-xl bg-black/5 dark:bg-white/5 border border-dashed border-black/10 dark:border-white/10 text-xs font-bold text-slate-500 flex items-center gap-2">
                      <span>Any item on the menu counts towards the {formData.buyQuantity || 1} required purchase{formData.buyQuantity && formData.buyQuantity > 1 ? 's' : ''}.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* GET FREE SECTION */}
            <div className="space-y-3 pt-4 border-t border-amber-500/20">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  2. Free Reward (Select Specific Products)
                </label>
                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
                  {formData.getProductIds?.length === 1 
                    ? '✨ 1 Product (Auto-awarded)' 
                    : formData.getProductIds?.length 
                      ? `✨ ${formData.getProductIds.length} Products (Customer Chooses)` 
                      : 'Select products below'}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="sm:w-32">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Free Quantity</span>
                  <input
                    type="number"
                    value={formData.getQuantity || ''}
                    onChange={(e) => setFormData({ ...formData, getQuantity: Math.max(1, parseInt(e.target.value) || 1) })}
                    className="w-full px-4 py-3 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl text-sm font-bold"
                    placeholder="e.g. 1"
                    min="1"
                  />
                </div>

                <div className="flex-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Eligible Free Products (Admin Defined)
                  </span>
                  <ProductTagPicker
                    products={products}
                    selectedProductIds={formData.getProductIds || []}
                    onChange={(ids) => setFormData({ ...formData, getProductIds: ids })}
                    placeholder="Search products to include as free reward..."
                  />
                  <div className="mt-2 text-[10px] text-slate-500 font-medium">
                    {!formData.getProductIds || formData.getProductIds.length === 0 ? (
                      <span className="text-amber-500 font-bold">⚠️ Please pick at least 1 product that customers can receive for free.</span>
                    ) : formData.getProductIds.length === 1 ? (
                      <span className="text-emerald-500 font-bold">✨ 1 product configured: Automatically added as free when customer qualifies.</span>
                    ) : (
                      <span className="text-emerald-500 font-bold">✨ {formData.getProductIds.length} products configured: Customer can choose any 1 of these as their free item.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Discount Value</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black">
                {formData.type === 'fixed' ? '₱' : ''}
              </span>
              <input
                type="number"
                required
                value={formData.value || ''}
                onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                className={`w-full px-4 py-3 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${formData.type === 'fixed' ? 'pl-8' : ''}`}
                placeholder="0"
                min="0"
              />
              {formData.type === 'percentage' && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-black">%</span>
              )}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Minimum Spend (₱)</label>
          <input
            type="number"
            value={formData.minSpend || ''}
            onChange={(e) => setFormData({ ...formData, minSpend: parseFloat(e.target.value) || 0 })}
            className="w-full px-4 py-3 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            placeholder="0"
            min="0"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Points Cost (Customer Reward Store)</label>
          <input
            type="number"
            value={formData.pointsCost || ''}
            onChange={(e) => setFormData({ ...formData, pointsCost: parseInt(e.target.value) || 0 })}
            className="w-full px-4 py-3 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            placeholder="0"
            min="0"
          />
          <p className="text-[9px] font-medium text-slate-500 mt-1">Set to 0 for a <b>Promo Voucher (For All / Not for Sale)</b>. Set &gt; 0 for a <b>Points-Purchased Voucher</b> in the customer rewards store.</p>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Usage Limit (Optional)</label>
          <input
            type="number"
            value={formData.usageLimit || ''}
            onChange={(e) => setFormData({ ...formData, usageLimit: parseInt(e.target.value) || 0 })}
            className="w-full px-4 py-3 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            placeholder="0"
            min="0"
          />
        </div>
      </div>

      <div className="flex items-center gap-6 pt-4 border-t border-black/5 dark:border-white/5">
        <div 
          onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${formData.isActive ? 'border-emerald-500 bg-emerald-500 shadow-md' : 'border-black/20 dark:border-white/20 bg-transparent group-hover:border-black/40'}`}>
            {formData.isActive && <Check className="w-4 h-4 text-white" />}
          </div>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Active</span>
        </div>

        <div 
          onClick={() => setFormData({ ...formData, isAdminOnly: !formData.isAdminOnly })}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${formData.isAdminOnly ? 'border-amber-500 bg-amber-500 shadow-md' : 'border-black/20 dark:border-white/20 bg-transparent group-hover:border-black/40'}`}>
            {formData.isAdminOnly && <div className="w-2.5 h-2.5 rounded-full bg-slate-900" />}
          </div>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Admin Only (Hidden from Kiosk)</span>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={resetForm}
          className="px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-slate-500 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-3 bg-amber-500 text-black rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20 active:scale-95"
        >
          <Save className="w-4 h-4" />
          Save Voucher
        </button>
      </div>
    </form>
  );

  return (
    <div className="h-full flex flex-col p-6 sm:p-8 overflow-y-auto scrollbar-hide">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-display font-black text-slate-900 dark:text-white uppercase tracking-tighter italic flex items-center gap-3">
            <Tag className="w-8 h-8 text-amber-500" />
            Vouchers & Promos
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
            Manage discount codes and customer rewards.
          </p>
        </div>
        {!isAdding && !editingId && (
          <button
            onClick={() => setIsAdding(true)}
            className="px-6 py-3 bg-amber-500 text-black rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            New Voucher
          </button>
        )}
      </div>

      {(isAdding || editingId) && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto my-auto animate-in zoom-in-95 duration-200">
            {renderForm()}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {vouchers.map((voucher) => (
          <div
            key={voucher.id}
            className={`p-6 rounded-3xl border transition-all flex flex-col justify-between gap-6 ${voucher.isActive ? 'bg-white dark:bg-[#131722] border-black/10 dark:border-white/5 shadow-xl shadow-black/5' : 'bg-black/5 dark:bg-white/5 border-transparent opacity-60 grayscale'}`}
          >
            <div className="flex justify-between items-start gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">{voucher.code}</span>
                  {!voucher.isActive && (
                    <span className="px-2 py-0.5 bg-slate-500/10 text-slate-500 text-[9px] font-black uppercase tracking-widest rounded-full">Inactive</span>
                  )}
                  {voucher.isAdminOnly && (
                    <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[9px] font-black uppercase tracking-widest rounded-full border border-amber-500/20">Admin Only</span>
                  )}
                </div>
                <div className="flex flex-col gap-1 mt-1">
                  {voucher.type === 'buy_x_get_y' ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        <span className="text-[11px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                          Buy {voucher.buyQuantity || 1} Get {voucher.getQuantity || 1} Free
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                        <span className="font-bold text-slate-700 dark:text-slate-300">Buy: </span>
                        {voucher.buyScope === 'products' && voucher.buyProductIds && voucher.buyProductIds.length > 0 ? (
                          <span>{voucher.buyProductIds.length} product(s) ({products.filter(p => voucher.buyProductIds?.includes(p.id)).map(p => p.name).slice(0, 2).join(', ')}{voucher.buyProductIds.length > 2 ? '...' : ''})</span>
                        ) : voucher.buyCategoryOrName ? (
                          <span>Category "{voucher.buyCategoryOrName}"</span>
                        ) : (
                          <span>Any item</span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                        <span className="font-bold text-slate-700 dark:text-slate-300">Free: </span>
                        {voucher.getProductIds && voucher.getProductIds.length > 0 ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                            {voucher.getProductIds.length === 1 
                              ? (products.find(p => p.id === voucher.getProductIds![0])?.name || '1 specific product')
                              : `Choice of ${voucher.getProductIds.length} items (${products.filter(p => voucher.getProductIds?.includes(p.id)).map(p => p.name).slice(0, 2).join(', ')}${voucher.getProductIds.length > 2 ? '...' : ''})`}
                          </span>
                        ) : voucher.getCategoryOrName ? (
                          <span>Category "{voucher.getCategoryOrName}"</span>
                        ) : (
                          <span>Any item</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        {voucher.type === 'percentage' ? `${voucher.value}% OFF` : `₱${voucher.value} OFF`}
                      </span>
                      {voucher.minSpend > 0 && (
                        <span className="flex items-center gap-1 border-l border-black/10 dark:border-white/10 pl-2">
                          Min. Spend: ₱{voucher.minSpend}
                        </span>
                      )}
                      {voucher.pointsCost > 0 && (
                        <span className="flex items-center gap-1 border-l border-black/10 dark:border-white/10 pl-2 text-amber-500">
                          Cost: {voucher.pointsCost} Pts
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onUpdateVoucher(voucher.id, { isActive: !voucher.isActive })}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                    voucher.isActive 
                      ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20' 
                      : 'bg-slate-500/10 text-slate-500 hover:bg-slate-500/20'
                  }`}
                  title="Toggle Active Status"
                >
                  {voucher.isActive ? 'Active' : 'Inactive'}
                </button>
                <button
                  onClick={() => {
                    setFormData({
                      ...voucher,
                      buyScope: voucher.buyScope || (voucher.buyProductIds?.length ? 'products' : voucher.buyCategoryOrName ? 'category' : 'all'),
                      buyProductIds: voucher.buyProductIds || [],
                      getProductIds: voucher.getProductIds || [],
                    });
                    setEditingId(voucher.id);
                    setIsAdding(false);
                  }}
                  className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-500/10 rounded-xl transition-all"
                  title="Edit Voucher"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setVoucherToDelete(voucher.id);
                  }}
                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                  title="Delete Voucher"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <ConfirmationModal
              isOpen={!!voucherToDelete}
              onClose={() => setVoucherToDelete(null)}
              onConfirm={() => {
                if (voucherToDelete) {
                  onDeleteVoucher(voucherToDelete);
                  setVoucherToDelete(null);
                }
              }}
              title="Delete Voucher"
              message="Are you sure you want to delete this voucher? This action cannot be undone."
            />

            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest border-t border-black/5 dark:border-white/5 pt-4">
              <div className="text-slate-400">
                Used: <span className="text-slate-700 dark:text-slate-200">{voucher.usedCount || 0}</span>
                {voucher.usageLimit > 0 && ` / ${voucher.usageLimit}`}
              </div>
              {voucher.usageLimit > 0 && (voucher.usedCount || 0) >= voucher.usageLimit && (
                <span className="text-rose-500 flex items-center gap-1"><X className="w-3 h-3" /> Fully Claimed</span>
              )}
            </div>
          </div>
        ))}
        {vouchers.length === 0 && !isAdding && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-500 dark:text-white/40 space-y-4">
            <div className="w-20 h-20 bg-black/5 dark:bg-white/5 rounded-full flex items-center justify-center border border-black/10 dark:border-white/10">
              <Tag className="w-10 h-10 text-amber-500/50" />
            </div>
            <p className="font-black uppercase tracking-[0.3em] text-[10px]">No Vouchers Found</p>
          </div>
        )}
      </div>
    </div>
  );
}
