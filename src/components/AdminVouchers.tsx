import React, { useState } from 'react';
import { Tag, Plus, Edit2, Trash2, X, Check, Save } from 'lucide-react';
import { Voucher, DynamicCategory } from '../types';
import { useToast } from '../lib/ToastContext';
import { ConfirmationModal } from './ConfirmationModal';

interface AdminVouchersProps {
  vouchers: Voucher[];
  categories?: DynamicCategory[];
  onAddVoucher: (voucher: Omit<Voucher, 'id'>) => Promise<void>;
  onUpdateVoucher: (id: string, voucher: Partial<Voucher>) => Promise<void>;
  onDeleteVoucher: (id: string) => Promise<void>;
}

export function AdminVouchers({ vouchers, categories = [], onAddVoucher, onUpdateVoucher, onDeleteVoucher }: AdminVouchersProps) {
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
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || formData.value === undefined) {
      toast.warning('Code and value are required');
      return;
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
              onClick={() => setFormData({ ...formData, type: 'buy_x_get_y', pointsCost: 0, conditionType: 'buy_x_get_y' })}
              className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${formData.type === 'buy_x_get_y' ? 'bg-amber-500 text-black' : 'bg-black/5 dark:bg-white/5 text-slate-500'}`}
            >
              Buy X Get Y Promo
            </button>
          </div>
        </div>

        {formData.type === 'buy_x_get_y' ? (
          <>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Buy Quantity & Category / Item</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={formData.buyQuantity || ''}
                  onChange={(e) => setFormData({ ...formData, buyQuantity: parseInt(e.target.value) || 0 })}
                  className="w-24 px-4 py-3 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl text-sm font-bold"
                  placeholder="e.g. 3"
                  min="1"
                />
                <select
                  value={formData.buyCategoryOrName || ''}
                  onChange={(e) => setFormData({ ...formData, buyCategoryOrName: e.target.value })}
                  className="flex-1 px-4 py-3 bg-white dark:bg-[#1a1a24] text-slate-900 dark:text-white border border-black/10 dark:border-white/10 rounded-xl text-sm font-bold uppercase focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                >
                  <option value="" className="bg-white dark:bg-[#1a1a24] text-slate-900 dark:text-white">Select Category / Item...</option>
                  {(categories.length > 0 ? categories.map(c => c.name) : ['Hot Coffee', 'Cold Coffee', 'Tea', 'Food', 'Pastries']).map(cat => (
                    <option key={cat} value={cat} className="bg-white dark:bg-[#1a1a24] text-slate-900 dark:text-white">{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Get Free Quantity & Category / Item</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={formData.getQuantity || ''}
                  onChange={(e) => setFormData({ ...formData, getQuantity: parseInt(e.target.value) || 0 })}
                  className="w-24 px-4 py-3 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl text-sm font-bold"
                  placeholder="e.g. 1"
                  min="1"
                />
                <select
                  value={formData.getCategoryOrName || ''}
                  onChange={(e) => setFormData({ ...formData, getCategoryOrName: e.target.value })}
                  className="flex-1 px-4 py-3 bg-white dark:bg-[#1a1a24] text-slate-900 dark:text-white border border-black/10 dark:border-white/10 rounded-xl text-sm font-bold uppercase focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                >
                  <option value="" className="bg-white dark:bg-[#1a1a24] text-slate-900 dark:text-white">Select Free Category / Item...</option>
                  {(categories.length > 0 ? categories.map(c => c.name) : ['Hot Coffee', 'Cold Coffee', 'Tea', 'Food', 'Pastries']).map(cat => (
                    <option key={cat} value={cat} className="bg-white dark:bg-[#1a1a24] text-slate-900 dark:text-white">{cat}</option>
                  ))}
                </select>
              </div>
            </div>
          </>
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
                    setFormData(voucher);
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
