import React, { useState } from 'react';
import { Product, ProductSize, Addon } from '../types';
import { Plus, Edit2, Trash2, Package, Database, ShieldAlert, X, Coffee } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

interface AdminProductsProps {
  products: Product[];
  addons: Addon[];
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onUpdateProduct: (id: string, product: Partial<Product>) => void;
  onDeleteProduct: (id: string) => void;
  onAddAddon: (addon: Omit<Addon, 'id'>) => void;
  onUpdateAddon: (id: string, addon: Partial<Addon>) => void;
  onDeleteAddon: (id: string) => void;
}

export function AdminProducts({ 
  products, 
  addons,
  onAddProduct, 
  onUpdateProduct, 
  onDeleteProduct,
  onAddAddon,
  onUpdateAddon,
  onDeleteAddon
}: AdminProductsProps) {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'products' | 'addons'>('products');

  const [isEditing, setIsEditing] = useState<Product | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const [isEditingAddon, setIsEditingAddon] = useState<Addon | null>(null);
  const [isAddingAddon, setIsAddingAddon] = useState(false);

  if (!isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center bg-coffee-50 text-coffee-500 p-8 text-center flex-col gap-4">
        <ShieldAlert className="w-12 h-12 text-coffee-300" />
        <h2 className="text-xl font-bold text-coffee-900">Access Restricted</h2>
        <p>This section is for staff members only. Please log in with an administrator account.</p>
      </div>
    );
  }

  const initialFormState = {
    name: '',
    category: 'Hot Coffee',
    price: 0,
    image: '',
    description: '',
    stock: 0,
    unit: 'pcs',
    lowStockThreshold: 0,
    isActive: true,
    sizes: [] as ProductSize[],
    isCustomizable: false,
  };

  const initialAddonState = {
    name: '',
    price: 0,
    isActive: true,
  };

  const [formData, setFormData] = useState<Omit<Product, 'id'>>(initialFormState);
  const [addonData, setAddonData] = useState<Omit<Addon, 'id'>>(initialAddonState);

  const [newCategory, setNewCategory] = useState('');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);

  // Get unique categories for the dropdown
  const categories = Array.from(new Set(products.map(p => p.category))).concat(['Hot Coffee', 'Cold Coffee', 'Tea', 'Food', 'Merch']);
  const uniqueCategories = Array.from(new Set(categories));

  const handleAddSize = () => {
    setFormData({
      ...formData,
      sizes: [...(formData.sizes || []), { name: '', price: 0 }]
    });
  };

  const handleRemoveSize = (index: number) => {
    const newSizes = [...(formData.sizes || [])];
    newSizes.splice(index, 1);
    setFormData({ ...formData, sizes: newSizes });
  };

  const handleSizeChange = (index: number, field: keyof ProductSize, value: string | number) => {
    const newSizes = [...(formData.sizes || [])];
    newSizes[index] = { ...newSizes[index], [field]: value };
    setFormData({ ...formData, sizes: newSizes });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      onUpdateProduct(isEditing.id, formData);
      setIsEditing(null);
    } else {
      onAddProduct(formData);
      setIsAdding(false);
    }
    setFormData(initialFormState);
  };

  const handleAddonSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditingAddon) {
      onUpdateAddon(isEditingAddon.id, addonData);
      setIsEditingAddon(null);
    } else {
      onAddAddon(addonData);
      setIsAddingAddon(false);
    }
    setAddonData(initialAddonState);
  };

  const handleEdit = (product: Product) => {
    setIsEditing(product);
    setFormData(product);
    setIsAdding(false);
  };

  const handleEditAddon = (addon: Addon) => {
    setIsEditingAddon(addon);
    setAddonData(addon);
    setIsAddingAddon(false);
  };

  const cancelEdit = () => {
    setIsEditing(null);
    setIsAdding(false);
    setFormData(initialFormState);
  };

  const cancelAddonEdit = () => {
    setIsEditingAddon(null);
    setIsAddingAddon(false);
    setAddonData(initialAddonState);
  };

  return (
    <div className="h-screen bg-transparent p-4 md:p-8 overflow-y-auto scrollbar-hide">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="px-3 py-1 bg-white/5 text-amber-500 text-[10px] font-black uppercase tracking-[0.3em] rounded-full border border-white/10">
                Catalog
              </div>
              <div className="h-[1px] flex-1 lg:w-48 bg-white/5" />
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white font-display uppercase italic tracking-tighter leading-[0.85] flex flex-wrap items-baseline gap-x-4">
              Product <span className="text-white/20 not-italic font-medium text-4xl md:text-5xl lg:text-6xl">Database</span>
            </h1>
            <div className="flex items-center gap-3 mt-6">
              <div className="h-1.5 w-16 bg-amber-600 rounded-full shadow-[0_0_15px_rgba(217,119,6,0.5)]" />
              <span className="text-xs font-bold text-coffee-500 uppercase tracking-widest">
                Manage menu items and inventory catalog
              </span>
            </div>
          </div>
          <div className="flex gap-3 shrink-0">
            {activeTab === 'products' ? (
              <button
                onClick={() => { setIsAdding(true); setIsEditing(null); setFormData(initialFormState); }}
                className="flex items-center gap-2 bg-white text-black px-6 py-3.5 rounded-2xl hover:bg-white/90 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] font-black uppercase tracking-widest text-xs active:scale-95"
              >
                <Plus className="w-5 h-5" />
                Add Product
              </button>
            ) : (
              <button
                onClick={() => { setIsAddingAddon(true); setIsEditingAddon(null); setAddonData(initialAddonState); }}
                className="flex items-center gap-2 bg-amber-600 text-white px-6 py-3.5 rounded-2xl hover:bg-amber-500 transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] font-black uppercase tracking-widest text-xs active:scale-95"
              >
                <Plus className="w-5 h-5" />
                Add Add-on
              </button>
            )}
          </div>
        </header>

        <div className="flex bg-white/5 backdrop-blur-md rounded-2xl p-1.5 shadow-sm border border-white/10 overflow-x-auto scrollbar-hide max-w-full shrink-0 mb-8 w-fit">
          <button 
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all shrink-0 ${activeTab === 'products' ? 'bg-white text-black shadow-lg scale-105' : 'text-coffee-500 hover:text-white'}`}
          >
            <Coffee className="w-4 h-4" />
            Products
          </button>
          <button 
            onClick={() => setActiveTab('addons')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all shrink-0 ${activeTab === 'addons' ? 'bg-amber-600 text-white shadow-lg scale-105' : 'text-coffee-500 hover:text-white'}`}
          >
            <Plus className="w-4 h-4" />
            Add-ons
          </button>
        </div>

        {activeTab === 'products' && (
          <>
            {(isAdding || isEditing) && (
              <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-2xl border border-white/10 mb-8 animate-in fade-in slide-in-from-top-4">
                <h2 className="text-xl font-bold text-white mb-6 uppercase tracking-widest">{isEditing ? 'Edit Product' : 'Add New Product'}</h2>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-black text-coffee-500 uppercase tracking-widest mb-2">Name</label>
                    <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl focus:border-amber-500 focus:bg-white/10 outline-none transition-all font-bold text-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-coffee-500 uppercase tracking-widest mb-2">Category</label>
                    <div className="flex gap-2">
                      {!showNewCategoryInput ? (
                        <select 
                          value={formData.category} 
                          onChange={e => {
                            if (e.target.value === 'ADD_NEW') {
                              setShowNewCategoryInput(true);
                            } else {
                              setFormData({ ...formData, category: e.target.value });
                            }
                          }} 
                          className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl focus:border-amber-500 focus:bg-white/10 outline-none transition-all font-bold text-white appearance-none"
                        >
                          {uniqueCategories.map(cat => (
                            <option key={cat} value={cat} className="bg-coffee-950">{cat}</option>
                          ))}
                          <option value="ADD_NEW" className="bg-coffee-950 font-bold text-amber-500">+ Add New Category...</option>
                        </select>
                      ) : (
                        <div className="flex-1 flex gap-2">
                          <input 
                            type="text" 
                            placeholder="New Category Name"
                            value={newCategory} 
                            onChange={e => setNewCategory(e.target.value)}
                            className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl focus:border-amber-500 focus:bg-white/10 outline-none transition-all font-bold text-white"
                          />
                          <button 
                            type="button"
                            onClick={() => {
                              if (newCategory) {
                                setFormData({ ...formData, category: newCategory });
                                setShowNewCategoryInput(false);
                                setNewCategory('');
                              }
                            }}
                            className="px-6 py-1 bg-amber-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs"
                          >
                            Add
                          </button>
                          <button 
                            type="button"
                            onClick={() => setShowNewCategoryInput(false)}
                            className="p-2 text-red-500"
                          >
                            <X className="w-6 h-6" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-coffee-500 uppercase tracking-widest mb-2">Base Price (₱)</label>
                    <input 
                      required 
                      type="number" 
                      step="0.01" 
                      min="0" 
                      placeholder="0.00"
                      value={formData.price || ''} 
                      onFocus={(e) => e.target.select()} 
                      onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })} 
                      className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl focus:border-amber-500 focus:bg-white/10 outline-none transition-all font-bold text-white" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-coffee-500 uppercase tracking-widest mb-2">Image URL</label>
                    <input required type="url" value={formData.image} onChange={e => setFormData({ ...formData, image: e.target.value })} className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl focus:border-amber-500 focus:bg-white/10 outline-none transition-all font-bold text-white" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-black text-coffee-500 uppercase tracking-widest mb-2">Description</label>
                    <textarea required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl focus:border-amber-500 focus:bg-white/10 outline-none transition-all font-bold text-white h-24" rows={2} />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-coffee-500 uppercase tracking-widest mb-2">Initial Stock</label>
                    <input 
                      required 
                      type="number" 
                      min="0" 
                      placeholder="0"
                      value={formData.stock || ''} 
                      onFocus={(e) => e.target.select()} 
                      onChange={e => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })} 
                      className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl focus:border-amber-500 focus:bg-white/10 outline-none transition-all font-bold text-white" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-coffee-500 uppercase tracking-widest mb-2">Unit</label>
                    <input required type="text" value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })} className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl focus:border-amber-500 focus:bg-white/10 outline-none transition-all font-bold text-white" placeholder="e.g. cups, kg, pcs" />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-coffee-500 uppercase tracking-widest mb-2">Low Stock Threshold</label>
                    <input 
                      required 
                      type="number" 
                      min="0" 
                      placeholder="0"
                      value={formData.lowStockThreshold || ''} 
                      onFocus={(e) => e.target.select()} 
                      onChange={e => setFormData({ ...formData, lowStockThreshold: parseInt(e.target.value) || 0 })} 
                      className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl focus:border-amber-500 focus:bg-white/10 outline-none transition-all font-bold text-white" 
                    />
                  </div>
                  
                  <div className="flex items-center gap-8 pt-4 md:col-span-2">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" id="isActive" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} className="w-5 h-5 text-amber-600 rounded-lg focus:ring-amber-500 border-white/10 bg-white/5" />
                      <label htmlFor="isActive" className="text-xs font-black text-coffee-500 uppercase tracking-widest">Available for Sale</label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input type="checkbox" id="isCustomizable" checked={formData.isCustomizable} onChange={e => setFormData({ ...formData, isCustomizable: e.target.checked })} className="w-5 h-5 text-purple-600 rounded-lg focus:ring-purple-500 border-white/10 bg-white/5" />
                      <label htmlFor="isCustomizable" className="text-xs font-black text-coffee-500 uppercase tracking-widest">Allow Customization</label>
                    </div>
                  </div>
                  
                  <div className="md:col-span-2 bg-white/5 p-6 rounded-3xl border border-white/5">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xs font-black text-white uppercase tracking-widest">Product Sizes</h3>
                      <button type="button" onClick={handleAddSize} className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 bg-white/10 border border-white/10 px-4 py-2 rounded-xl hover:bg-white/20 transition-all text-white">
                        <Plus className="w-3.5 h-3.5" /> Add Size
                      </button>
                    </div>
                    {formData.sizes && formData.sizes.length > 0 ? (
                      <div className="space-y-4">
                        {formData.sizes.map((size, index) => (
                          <div key={index} className="flex gap-4 items-end animate-in fade-in slide-in-from-left-2">
                            <div className="flex-1">
                              <label className="block text-[10px] uppercase font-black text-coffee-600 mb-2 tracking-widest">Size Name</label>
                              <input 
                                type="text" 
                                required
                                value={size.name} 
                                onChange={e => handleSizeChange(index, 'name', e.target.value)}
                                className="w-full p-3 bg-white/5 border border-white/5 rounded-xl text-white font-bold"
                              />
                            </div>
                            <div className="w-32">
                              <label className="block text-[10px] uppercase font-black text-coffee-600 mb-2 tracking-widest">Price (₱)</label>
                              <input 
                                type="number" 
                                required
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                value={size.price || ''} 
                                onFocus={(e) => e.target.select()}
                                onChange={e => handleSizeChange(index, 'price', parseFloat(e.target.value) || 0)}
                                className="w-full p-3 bg-white/5 border border-white/5 rounded-xl text-white font-bold"
                              />
                            </div>
                            <button type="button" onClick={() => handleRemoveSize(index)} className="p-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-all">
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-coffee-700 italic uppercase tracking-widest">No sizes defined. Base price will be used.</p>
                    )}
                  </div>

                  <div className="md:col-span-2 flex justify-end gap-4 mt-6">
                    <button type="button" onClick={cancelEdit} className="px-8 py-3.5 text-white/50 hover:text-white transition-all font-black uppercase tracking-widest text-xs">Cancel</button>
                    <button type="submit" className="px-8 py-3.5 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-white/90 transition-all shadow-xl active:scale-95">
                      {isEditing ? 'Save Changes' : 'Create Product'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/10 overflow-hidden mb-12">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/10 text-white/40 uppercase text-[10px] font-black tracking-[0.2em]">
                    <th className="p-6">Product & Actions</th>
                    <th className="hidden sm:table-cell p-6 text-center">Price</th>
                    <th className="hidden xs:table-cell p-6 text-center">Stock</th>
                    <th className="hidden md:table-cell p-6">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-white/5 transition-colors group">
                      <td className="p-6">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl overflow-hidden border border-white/10 group-hover:border-amber-500/50 transition-colors shrink-0">
                              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <div className="font-black text-white text-sm uppercase tracking-tight group-hover:text-amber-500 transition-colors whitespace-normal break-words max-w-[150px] md:max-w-[250px]">{product.name}</div>
                              <div className="text-[10px] text-coffee-600 font-bold uppercase tracking-widest">{product.category}</div>
                              <div className="sm:hidden text-xs font-black text-amber-500 mt-1">₱{product.price.toLocaleString()}</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleEdit(product)} className="p-3 text-coffee-500 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => onDeleteProduct(product.id)} className="p-3 text-red-500/50 hover:text-red-500 bg-white/5 hover:bg-red-500/10 rounded-xl transition-all">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="hidden sm:table-cell p-6 text-sm font-black text-white text-center">₱{product.price.toLocaleString()}</td>
                      <td className="hidden xs:table-cell p-6 text-center">
                        <span className={`text-xs font-black ${product.stock <= product.lowStockThreshold ? 'text-red-400' : 'text-coffee-500'}`}>
                          {product.stock} <span className="text-[8px] opacity-50 uppercase tracking-widest">{product.unit}</span>
                        </span>
                      </td>
                      <td className="hidden md:table-cell p-6">
                        <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full ${product.isActive ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-white/5 text-white/30 border border-white/5'}`}>
                          {product.isActive ? 'Live' : 'Draft'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-coffee-400 font-medium text-sm">
                        No products found. Add one to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'addons' && (
          <>
            {(isAddingAddon || isEditingAddon) && (
              <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-2xl border border-white/10 mb-8 animate-in fade-in slide-in-from-top-4">
                <h2 className="text-xl font-bold text-white mb-6 uppercase tracking-widest">{isEditingAddon ? 'Edit Add-on' : 'Add New Add-on'}</h2>
                <form onSubmit={handleAddonSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-black text-coffee-500 uppercase tracking-widest mb-2">Add-on Name</label>
                    <input required type="text" value={addonData.name} onChange={e => setAddonData({ ...addonData, name: e.target.value })} placeholder="e.g. Extra Shot, Almond Milk" className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl focus:border-amber-500 focus:bg-white/10 outline-none transition-all font-bold text-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-coffee-500 uppercase tracking-widest mb-2">Price (₱)</label>
                    <input 
                      required 
                      type="number" 
                      step="0.01" 
                      min="0" 
                      placeholder="0.00"
                      value={addonData.price || ''} 
                      onFocus={(e) => e.target.select()} 
                      onChange={e => setAddonData({ ...addonData, price: parseFloat(e.target.value) || 0 })} 
                      className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl focus:border-amber-500 focus:bg-white/10 outline-none transition-all font-bold text-white" 
                    />
                  </div>
                  <div className="flex items-center gap-3 pt-2 md:col-span-2">
                    <input type="checkbox" id="addonIsActive" checked={addonData.isActive} onChange={e => setAddonData({ ...addonData, isActive: e.target.checked })} className="w-5 h-5 text-amber-600 rounded-lg focus:ring-amber-500 border-white/10 bg-white/5" />
                    <label htmlFor="addonIsActive" className="text-xs font-black text-coffee-500 uppercase tracking-widest">Available for Sale</label>
                  </div>
                  <div className="md:col-span-2 flex justify-end gap-4 mt-2">
                    <button type="button" onClick={cancelAddonEdit} className="px-8 py-3.5 text-white/50 hover:text-white transition-all font-black uppercase tracking-widest text-xs">Cancel</button>
                    <button type="submit" className="px-8 py-3.5 bg-amber-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-amber-500 transition-all shadow-xl active:scale-95">
                      {isEditingAddon ? 'Save Add-on' : 'Create Add-on'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/10 overflow-hidden mb-12">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-amber-600/20 text-amber-500 uppercase text-[10px] font-black tracking-[0.2em]">
                    <th className="p-6">Add-on & Actions</th>
                    <th className="hidden sm:table-cell p-6 text-center">Price</th>
                    <th className="hidden sm:table-cell p-6">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {addons.map((addon) => (
                    <tr key={addon.id} className="hover:bg-white/5 transition-colors group">
                      <td className="p-6">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <div className="font-black text-white text-sm uppercase tracking-tight group-hover:text-amber-500 transition-colors whitespace-normal break-words max-w-[200px] md:max-w-[350px]">{addon.name}</div>
                            <div className="sm:hidden text-[10px] font-black text-amber-700 mt-1">₱{addon.price.toLocaleString()}</div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleEditAddon(addon)} className="p-3 text-coffee-500 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => onDeleteAddon(addon.id)} className="p-3 text-red-500/50 hover:text-red-500 bg-white/5 hover:bg-red-500/10 rounded-xl transition-all">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="hidden sm:table-cell p-6 text-sm font-black text-white text-center">₱{addon.price.toLocaleString()}</td>
                      <td className="hidden sm:table-cell p-6">
                        <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full ${addon.isActive ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-white/5 text-white/30 border border-white/5'}`}>
                          {addon.isActive ? 'Live' : 'Draft'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {addons.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-12 text-center text-coffee-700 uppercase font-black text-[10px] tracking-widest">
                        No add-ons found. Create one to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
