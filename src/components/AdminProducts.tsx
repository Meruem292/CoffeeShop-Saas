import React, { useState, useMemo } from 'react';
import { Product, ProductSize, Addon, DynamicCategory } from '../types';
import { 
  Plus, Edit2, Trash2, Package, Database, ShieldAlert, X, Coffee,
  IceCream, CupSoda, Croissant, Utensils, Sparkles, Leaf,
  GlassWater, Wine, Cookie, Cake, Pizza, Sandwich, Gift, Tag, Flame, Heart, Layout, AlertTriangle,
  Upload, Info, Check
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { uploadProductImage, isSupabaseConfigured } from '../lib/supabase';

interface AdminProductsProps {
  products: Product[];
  addons: Addon[];
  categories: DynamicCategory[];
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onUpdateProduct: (id: string, product: Partial<Product>) => void;
  onDeleteProduct: (id: string) => void;
  onAddAddon: (addon: Omit<Addon, 'id'>) => void;
  onUpdateAddon: (id: string, addon: Partial<Addon>) => void;
  onDeleteAddon: (id: string) => void;
  onAddCategory: (category: Omit<DynamicCategory, 'id'>) => void;
  onUpdateCategory: (id: string, category: Partial<DynamicCategory>) => void;
  onDeleteCategory: (id: string) => void;
}

const iconLookup: Record<string, React.ComponentType<any>> = {
  Coffee, IceCream, CupSoda, Croissant, Utensils, Sparkles, Leaf,
  GlassWater, Wine, Cookie, Cake, Pizza, Sandwich, Gift, Tag, Flame, Heart, Package, Layout
};

const AVAILABLE_ICONS = [
  { name: 'Coffee', label: 'Coffee Cup' },
  { name: 'IceCream', label: 'Cold drink / Frappe' },
  { name: 'CupSoda', label: 'Soda / Soft drink' },
  { name: 'Croissant', label: 'Pastry / Croissant' },
  { name: 'Utensils', label: 'Food / Meals' },
  { name: 'Leaf', label: 'Tea / Matcha' },
  { name: 'GlassWater', label: 'Water' },
  { name: 'Wine', label: 'Wine / Alcohol' },
  { name: 'Cookie', label: 'Cookies' },
  { name: 'Cake', label: 'Cakes / Desserts' },
  { name: 'Pizza', label: 'Pizza' },
  { name: 'Sandwich', label: 'Sandwich' },
  { name: 'Gift', label: 'Gift packs' },
  { name: 'Tag', label: 'Promos / Merch' },
  { name: 'Flame', label: 'Specials' },
  { name: 'Heart', label: 'Favorites' },
  { name: 'Sparkles', label: 'Special creations' },
  { name: 'Package', label: 'Merch / Retail' },
];

export function AdminProducts({ 
  products, 
  addons,
  categories = [],
  onAddProduct, 
  onUpdateProduct, 
  onDeleteProduct,
  onAddAddon,
  onUpdateAddon,
  onDeleteAddon,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory
}: AdminProductsProps) {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'products' | 'addons' | 'categories'>('products');

  const [isEditing, setIsEditing] = useState<Product | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const [isEditingAddon, setIsEditingAddon] = useState<Addon | null>(null);
  const [isAddingAddon, setIsAddingAddon] = useState(false);

  const [isEditingCategory, setIsEditingCategory] = useState<DynamicCategory | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    type: 'product' | 'addon' | 'category';
    name: string;
  } | null>(null);

  if (!isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center bg-coffee-50 text-coffee-500 p-8 text-center flex-col gap-4">
        <ShieldAlert className="w-12 h-12 text-coffee-300" />
        <h2 className="text-xl font-bold text-coffee-900">Access Restricted</h2>
        <p>This section is for staff members only. Please log in with an administrator account.</p>
      </div>
    );
  }

  // Get categories list from prop, fallback to defaults if empty
  const availableCategories = useMemo(() => {
    let list = categories && categories.length > 0 
      ? categories.map(c => c.name) 
      : ['Hot Coffee', 'Cold Coffee', 'Tea', 'Food'];
      
    // Include any categories already used by products to prevent orphaned products from losing their category
    const productCats = Array.from(new Set(products.map(p => p.category)));
    productCats.forEach(pCat => {
      if (pCat && !list.find(c => c.toLowerCase() === pCat.toLowerCase())) {
        list.push(pCat);
      }
    });
    
    return list;
  }, [categories, products]);

  const initialFormState = {
    name: '',
    category: availableCategories[0] || 'Hot Coffee',
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

  const initialCategoryState = {
    name: '',
    iconName: 'Coffee'
  };

  const [formData, setFormData] = useState<Omit<Product, 'id'>>(initialFormState);
  const [addonData, setAddonData] = useState<Omit<Addon, 'id'>>(initialAddonState);
  const [categoryFormData, setCategoryFormData] = useState<Omit<DynamicCategory, 'id'>>(initialCategoryState);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [imageInputMode, setImageInputMode] = useState<'upload' | 'url'>('upload');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    try {
      const publicUrl = await uploadProductImage(file);
      setFormData(prev => ({ ...prev, image: publicUrl }));
    } catch (err: any) {
      console.error('Failed to upload image:', err);
      setUploadError(err.message || 'An error occurred while uploading the image. Please verify your connection.');
    } finally {
      setUploading(false);
    }
  };

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

  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditingCategory) {
      onUpdateCategory(isEditingCategory.id, categoryFormData);
      setIsEditingCategory(null);
    } else {
      onAddCategory(categoryFormData);
      setIsAddingCategory(false);
    }
    setCategoryFormData(initialCategoryState);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'product') {
      onDeleteProduct(deleteTarget.id);
    } else if (deleteTarget.type === 'addon') {
      onDeleteAddon(deleteTarget.id);
    } else if (deleteTarget.type === 'category') {
      onDeleteCategory(deleteTarget.id);
    }
    setDeleteTarget(null);
  };

  const handleEdit = (product: Product) => {
    setIsEditing(product);
    setFormData(product);
    setIsAdding(false);
    setUploadError(null);
    setUploading(false);
    if (product.image && !product.image.includes('supabase')) {
      setImageInputMode('url');
    } else {
      setImageInputMode('upload');
    }
  };

  const handleEditAddon = (addon: Addon) => {
    setIsEditingAddon(addon);
    setAddonData(addon);
    setIsAddingAddon(false);
  };

  const handleEditCategory = (category: DynamicCategory) => {
    setIsEditingCategory(category);
    setCategoryFormData(category);
    setIsAddingCategory(false);
  };

  const cancelEdit = () => {
    setIsEditing(null);
    setIsAdding(false);
    setFormData(initialFormState);
    setUploadError(null);
    setUploading(false);
    setImageInputMode('upload');
  };

  const cancelAddonEdit = () => {
    setIsEditingAddon(null);
    setIsAddingAddon(false);
    setAddonData(initialAddonState);
  };

  const cancelCategoryEdit = () => {
    setIsEditingCategory(null);
    setIsAddingCategory(false);
    setCategoryFormData(initialCategoryState);
  };

  return (
    <div className="min-h-screen bg-transparent p-3 sm:p-6 md:p-8 overflow-y-auto scrollbar-hide">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 md:mb-12">
          <div>
            <div className="flex items-center gap-4 mb-3 md:mb-4">
              <div className="px-3 py-1 bg-black/5 dark:bg-white/5 text-amber-500 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] rounded-full border border-black/10 dark:border-white/10">
                Catalog
              </div>
              <div className="h-[1px] flex-1 lg:w-48 bg-black/5 dark:bg-white/5" />
            </div>
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-slate-900 dark:text-white font-display uppercase italic tracking-tighter leading-[0.85] flex flex-wrap items-baseline gap-x-3 sm:gap-x-4">
              Product <span className="text-white/20 not-italic font-medium text-2xl sm:text-4xl md:text-5xl lg:text-6xl">Database</span>
            </h1>
            <div className="flex items-center gap-3 mt-4 sm:mt-6">
              <div className="h-1.5 w-12 sm:w-16 bg-amber-600 rounded-full shadow-[0_0_15px_rgba(217,119,6,0.5)] shrink-0" />
              <span className="text-[10px] sm:text-xs font-bold text-coffee-500 uppercase tracking-widest leading-relaxed">
                Manage menu items and inventory catalog
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2.5 sm:gap-3 shrink-0">
            {activeTab === 'products' && (
              <button
                onClick={() => { setIsAdding(true); setIsEditing(null); setFormData(initialFormState); setUploadError(null); setUploading(false); setImageInputMode('upload'); }}
                className="flex items-center gap-2 bg-white text-black px-6 py-3.5 rounded-2xl hover:bg-white/90 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] font-black uppercase tracking-widest text-xs active:scale-95"
              >
                <Plus className="w-5 h-5" />
                Add Product
              </button>
            )}
            {activeTab === 'addons' && (
              <button
                onClick={() => { setIsAddingAddon(true); setIsEditingAddon(null); setAddonData(initialAddonState); }}
                className="flex items-center gap-2 bg-amber-600 text-slate-900 dark:text-white px-6 py-3.5 rounded-2xl hover:bg-amber-500 transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] font-black uppercase tracking-widest text-xs active:scale-95"
              >
                <Plus className="w-5 h-5" />
                Add Add-on
              </button>
            )}
            {activeTab === 'categories' && (
              <button
                onClick={() => { setIsAddingCategory(true); setIsEditingCategory(null); setCategoryFormData(initialCategoryState); }}
                className="flex items-center gap-2 bg-violet-600 text-slate-900 dark:text-white px-6 py-3.5 rounded-2xl hover:bg-violet-500 transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] font-black uppercase tracking-widest text-xs active:scale-95"
              >
                <Plus className="w-5 h-5" />
                Add Category
              </button>
            )}
          </div>
        </header>

        <div className="flex bg-black/5 dark:bg-white/5 backdrop-blur-md rounded-2xl p-1.5 shadow-sm border border-black/10 dark:border-white/10 overflow-x-auto scrollbar-hide max-w-full shrink-0 mb-8 w-fit">
          <button 
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all shrink-0 ${activeTab === 'products' ? 'bg-white text-black shadow-lg scale-105' : 'text-coffee-500 hover:text-slate-900 dark:hover:text-white'}`}
          >
            <Coffee className="w-4 h-4" />
            Products
          </button>
          <button 
            onClick={() => setActiveTab('addons')}
            className={`flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all shrink-0 ${activeTab === 'addons' ? 'bg-amber-600 text-slate-900 dark:text-white shadow-lg scale-105' : 'text-coffee-500 hover:text-slate-900 dark:hover:text-white'}`}
          >
            <Plus className="w-4 h-4" />
            Add-ons
          </button>
          <button 
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all shrink-0 ${activeTab === 'categories' ? 'bg-violet-600 text-slate-900 dark:text-white shadow-lg scale-105' : 'text-coffee-500 hover:text-slate-900 dark:hover:text-white'}`}
          >
            <Layout className="w-4 h-4" />
            Categories
          </button>
        </div>

        {activeTab === 'products' && (
          <>
            {(isAdding || isEditing) && (
              <div className="bg-black/5 dark:bg-white/5 backdrop-blur-xl p-5 sm:p-8 rounded-2xl sm:rounded-[2.5rem] shadow-2xl border border-black/10 dark:border-white/10 mb-6 sm:mb-8 animate-in fade-in slide-in-from-top-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-widest">{isEditing ? 'Edit Product' : 'Add New Product'}</h2>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-black text-coffee-500 uppercase tracking-widest mb-2">Name</label>
                    <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full p-4 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/5 rounded-2xl focus:border-amber-500 focus:bg-black/10 dark:focus:bg-white/10 outline-none transition-all font-bold text-slate-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-coffee-500 uppercase tracking-widest mb-2">Category</label>
                    <select 
                      value={formData.category} 
                      onChange={e => setFormData({ ...formData, category: e.target.value })} 
                      className="w-full p-4 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/5 rounded-2xl focus:border-amber-500 focus:bg-black/10 dark:focus:bg-white/10 outline-none transition-all font-bold text-slate-900 dark:text-white appearance-none"
                    >
                      {availableCategories.map(cat => (
                        <option key={cat} value={cat} className="bg-white dark:bg-[#111115]">{cat}</option>
                      ))}
                    </select>
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
                      className="w-full p-4 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/5 rounded-2xl focus:border-amber-500 focus:bg-black/10 dark:focus:bg-white/10 outline-none transition-all font-bold text-slate-900 dark:text-white" 
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-black text-coffee-500 uppercase tracking-widest mb-3">Product Image</label>
                    <div className="flex gap-4 mb-4">
                      <button
                        type="button"
                        onClick={() => setImageInputMode('upload')}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${
                          imageInputMode === 'upload' ? 'bg-amber-500 text-black shadow-md' : 'bg-black/5 dark:bg-white/5 text-slate-600 dark:text-white/60 hover:bg-black/10 dark:hover:bg-white/10'
                        }`}
                      >
                        Upload Photo
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageInputMode('url')}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${
                          imageInputMode === 'url' ? 'bg-amber-500 text-black shadow-md' : 'bg-black/5 dark:bg-white/5 text-slate-600 dark:text-white/60 hover:bg-black/10 dark:hover:bg-white/10'
                        }`}
                      >
                        Image URL
                      </button>
                    </div>

                    {imageInputMode === 'upload' ? (
                      <div className="space-y-4">
                        <div 
                          className={`relative border-2 border-dashed rounded-3xl p-6 text-center transition-all flex flex-col items-center justify-center min-h-[180px] ${
                            uploading ? 'border-amber-500/50 bg-amber-500/5' : 
                            uploadError ? 'border-red-500/30 bg-red-500/5' : 
                            formData.image ? 'border-green-500/30 bg-green-500/5' : 
                            'border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 bg-black/5 dark:bg-white/5'
                          }`}
                        >
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleFileChange}
                            disabled={uploading}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                          />
                          
                          {uploading ? (
                            <div className="flex flex-col items-center gap-3">
                              <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
                              <p className="text-xs font-black text-amber-500 uppercase tracking-widest animate-pulse">Uploading to Supabase Storage...</p>
                            </div>
                          ) : formData.image ? (
                            <div className="flex flex-col md:flex-row items-center gap-6 w-full p-2">
                              <img 
                                src={formData.image} 
                                alt="Preview" 
                                className="w-24 h-24 rounded-2xl object-cover border border-black/10 dark:border-white/10 shadow-lg shrink-0" 
                                referrerPolicy="no-referrer"
                              />
                              <div className="text-left flex-1 min-w-0">
                                <div className="flex items-center gap-2 text-green-500 font-bold text-xs uppercase tracking-wider mb-1">
                                  <Check className="w-4 h-4" /> Uploaded Successfully
                                </div>
                                <p className="text-[10px] text-slate-500 dark:text-white/40 break-all font-mono line-clamp-1">{formData.image}</p>
                                <button 
                                  type="button" 
                                  onClick={() => setFormData({ ...formData, image: '' })}
                                  className="mt-3 text-[10px] font-black text-red-400 hover:text-red-300 uppercase tracking-widest bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20 cursor-pointer"
                                >
                                  Remove Photo
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-3 py-4">
                              <div className="w-12 h-12 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-white/60">
                                <Upload className="w-6 h-6" />
                              </div>
                              <div>
                                <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Drag & drop your product photo here</p>
                                <p className="text-[10px] text-slate-500 dark:text-white/40 font-bold mt-1 uppercase tracking-widest">or click to browse files (PNG, JPG, WEBP)</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {uploadError && (
                          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium space-y-2">
                            <div className="flex items-center gap-2 font-bold uppercase tracking-wider">
                              <AlertTriangle className="w-4 h-4" /> Upload Failed
                            </div>
                            <p className="opacity-90 text-[11px] leading-relaxed">{uploadError}</p>
                            
                            {!isSupabaseConfigured() && (
                              <div className="mt-4 p-4 rounded-xl bg-slate-200 dark:bg-black/40 border border-red-500/10 text-[10px] leading-relaxed text-slate-600 dark:text-white/70 space-y-2">
                                <p className="font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                                  <Info className="w-3.5 h-3.5 text-amber-500" /> SUPABASE ENVIRONMENT CONFIGURATION REQUIRED
                                </p>
                                <p>
                                  To enable direct image uploads, you must configure your Supabase variables. Open the <strong>Secrets panel</strong> (or the <strong>Settings menu</strong>) in AI Studio and add:
                                </p>
                                <ul className="list-disc list-inside space-y-1 font-mono text-[9px] text-amber-300">
                                  <li>VITE_SUPABASE_URL</li>
                                  <li>VITE_SUPABASE_ANON_KEY</li>
                                </ul>
                                <p className="mt-2">
                                  Also, remember to create a <strong>Public bucket</strong> named <code className="bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded text-slate-900 dark:text-white font-mono">product-images</code> in your Supabase dashboard Storage settings!
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {!isSupabaseConfigured() && !uploadError && (
                          <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-[#131722]/50 border border-black/10 dark:border-white/5 text-[11px] leading-relaxed text-slate-600 dark:text-white/60 space-y-2">
                            <p className="font-black text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
                              <Info className="w-4 h-4" /> Supabase Storage Setup Checklist:
                            </p>
                            <ol className="list-decimal list-inside space-y-1.5 pl-1">
                              <li>Log in to your <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-amber-500 underline hover:text-amber-400">Supabase Dashboard</a>.</li>
                              <li>Go to <strong>Storage</strong> and create a new bucket named <code className="bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded text-slate-900 dark:text-white font-mono text-[10px]">product-images</code>.</li>
                              <li>Toggle <strong>"Public bucket"</strong> to <span className="text-green-500 font-bold">Enabled</span> so files can be accessed publicly.</li>
                              <li>Define <code className="bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded text-slate-900 dark:text-white font-mono text-[10px]">VITE_SUPABASE_URL</code> and <code className="bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded text-slate-900 dark:text-white font-mono text-[10px]">VITE_SUPABASE_ANON_KEY</code> in your environment secrets.</li>
                            </ol>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <input 
                          required={imageInputMode === 'url'} 
                          type="url" 
                          value={formData.image} 
                          onChange={e => setFormData({ ...formData, image: e.target.value })} 
                          className="w-full p-4 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/5 rounded-2xl focus:border-amber-500 focus:bg-black/10 dark:focus:bg-white/10 outline-none transition-all font-bold text-slate-900 dark:text-white placeholder:text-white/25" 
                          placeholder="https://example.com/image.jpg"
                        />
                        {formData.image && (
                          <div className="mt-4 flex items-center gap-4 p-3 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/10 dark:border-white/5">
                            <img src={formData.image} alt="Preview" className="w-16 h-16 rounded-xl object-cover border border-black/10 dark:border-white/5" onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=300&q=80' }} />
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-black text-coffee-500 uppercase tracking-widest">Image URL Preview</p>
                              <p className="text-xs text-slate-600 dark:text-white/60 truncate font-mono mt-0.5">{formData.image}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-black text-coffee-500 uppercase tracking-widest mb-2">Description</label>
                    <textarea required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full p-4 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/5 rounded-2xl focus:border-amber-500 focus:bg-black/10 dark:focus:bg-white/10 outline-none transition-all font-bold text-slate-900 dark:text-white h-24" rows={2} />
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
                      className="w-full p-4 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/5 rounded-2xl focus:border-amber-500 focus:bg-black/10 dark:focus:bg-white/10 outline-none transition-all font-bold text-slate-900 dark:text-white" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-coffee-500 uppercase tracking-widest mb-2">Unit</label>
                    <input required type="text" value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })} className="w-full p-4 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/5 rounded-2xl focus:border-amber-500 focus:bg-black/10 dark:focus:bg-white/10 outline-none transition-all font-bold text-slate-900 dark:text-white" placeholder="e.g. cups, kg, pcs" />
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
                      className="w-full p-4 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/5 rounded-2xl focus:border-amber-500 focus:bg-black/10 dark:focus:bg-white/10 outline-none transition-all font-bold text-slate-900 dark:text-white" 
                    />
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 pt-2 sm:pt-4 md:col-span-2">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" id="isActive" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} className="w-5 h-5 text-amber-600 rounded-lg focus:ring-amber-500 border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5" />
                      <label htmlFor="isActive" className="text-xs font-black text-coffee-500 uppercase tracking-widest">Available for Sale</label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input type="checkbox" id="isCustomizable" checked={formData.isCustomizable} onChange={e => setFormData({ ...formData, isCustomizable: e.target.checked })} className="w-5 h-5 text-purple-600 rounded-lg focus:ring-purple-500 border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5" />
                      <label htmlFor="isCustomizable" className="text-xs font-black text-coffee-500 uppercase tracking-widest">Allow Customization</label>
                    </div>
                  </div>
                  
                  <div className="md:col-span-2 bg-black/5 dark:bg-white/5 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-black/10 dark:border-white/5">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Product Sizes</h3>
                      <button type="button" onClick={handleAddSize} className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 bg-black/10 dark:bg-white/10 border border-black/10 dark:border-white/10 px-4 py-2 rounded-xl hover:bg-black/20 dark:hover:bg-white/20 transition-all text-slate-900 dark:text-white">
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
                                className="w-full p-3 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/5 rounded-xl text-slate-900 dark:text-white font-bold"
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
                                className="w-full p-3 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/5 rounded-xl text-slate-900 dark:text-white font-bold"
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
                    <button type="button" onClick={cancelEdit} className="px-8 py-3.5 text-slate-500 dark:text-white/50 hover:text-slate-900 dark:hover:text-white transition-all font-black uppercase tracking-widest text-xs">Cancel</button>
                    <button type="submit" className="px-8 py-3.5 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-white/90 transition-all shadow-xl active:scale-95">
                      {isEditing ? 'Save Changes' : 'Create Product'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="bg-black/5 dark:bg-white/5 backdrop-blur-xl rounded-2xl sm:rounded-[2.5rem] shadow-2xl border border-black/10 dark:border-white/10 overflow-hidden mb-12">
              <div className="overflow-x-auto scrollbar-hide">
                <table className="w-full text-left border-collapse min-w-0">
                  <thead>
                    <tr className="bg-black/10 dark:bg-white/10 text-slate-500 dark:text-white/40 uppercase text-[10px] font-black tracking-[0.2em]">
                      <th className="p-3 sm:p-6">Product & Actions</th>
                      <th className="hidden sm:table-cell p-3 sm:p-6 text-center">Price</th>
                      <th className="hidden xs:table-cell p-3 sm:p-6 text-center">Stock</th>
                      <th className="hidden md:table-cell p-3 sm:p-6">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/10 dark:divide-white/5">
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                        <td className="p-3 sm:p-6">
                          <div className="flex items-center justify-between gap-3 sm:gap-4">
                            <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 group-hover:border-amber-500/50 transition-colors shrink-0">
                                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                              </div>
                              <div className="min-w-0">
                                <div className="font-black text-slate-900 dark:text-white text-xs sm:text-sm uppercase tracking-tight group-hover:text-amber-500 transition-colors whitespace-normal break-words max-w-[130px] xs:max-w-[180px] sm:max-w-[250px]">{product.name}</div>
                                <div className="text-[9px] sm:text-[10px] text-coffee-600 font-bold uppercase tracking-widest">{product.category}</div>
                                <div className="sm:hidden text-xs font-black text-amber-500 mt-1">₱{product.price.toLocaleString()}</div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                              <button onClick={() => handleEdit(product)} className="p-2.5 sm:p-3 text-coffee-500 hover:text-slate-900 dark:hover:text-white bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-xl transition-all">
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button onClick={() => setDeleteTarget({ id: product.id, type: 'product', name: product.name })} className="p-2.5 sm:p-3 text-red-500/50 hover:text-red-500 bg-black/5 dark:bg-white/5 hover:bg-red-500/10 rounded-xl transition-all">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </td>
                        <td className="hidden sm:table-cell p-3 sm:p-6 text-sm font-black text-slate-900 dark:text-white text-center">₱{product.price.toLocaleString()}</td>
                        <td className="hidden xs:table-cell p-3 sm:p-6 text-center">
                          <span className={`text-xs font-black ${product.stock <= product.lowStockThreshold ? 'text-red-400' : 'text-coffee-500'}`}>
                            {product.stock} <span className="text-[8px] opacity-50 uppercase tracking-widest">{product.unit}</span>
                          </span>
                        </td>
                        <td className="hidden md:table-cell p-3 sm:p-6">
                          <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full ${product.isActive ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-black/5 dark:bg-white/5 text-white/30 border border-black/10 dark:border-white/5'}`}>
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
            </div>
          </>
        )}

        {activeTab === 'addons' && (
          <>
            {(isAddingAddon || isEditingAddon) && (
              <div className="bg-black/5 dark:bg-white/5 backdrop-blur-xl p-5 sm:p-8 rounded-2xl sm:rounded-[2.5rem] shadow-2xl border border-black/10 dark:border-white/10 mb-6 sm:mb-8 animate-in fade-in slide-in-from-top-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-widest">{isEditingAddon ? 'Edit Add-on' : 'Add New Add-on'}</h2>
                <form onSubmit={handleAddonSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-black text-coffee-500 uppercase tracking-widest mb-2">Add-on Name</label>
                    <input required type="text" value={addonData.name} onChange={e => setAddonData({ ...addonData, name: e.target.value })} placeholder="e.g. Extra Shot, Almond Milk" className="w-full p-4 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/5 rounded-2xl focus:border-amber-500 focus:bg-black/10 dark:focus:bg-white/10 outline-none transition-all font-bold text-slate-900 dark:text-white" />
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
                      className="w-full p-4 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/5 rounded-2xl focus:border-amber-500 focus:bg-black/10 dark:focus:bg-white/10 outline-none transition-all font-bold text-slate-900 dark:text-white" 
                    />
                  </div>
                  <div className="flex items-center gap-3 pt-2 md:col-span-2">
                    <input type="checkbox" id="addonIsActive" checked={addonData.isActive} onChange={e => setAddonData({ ...addonData, isActive: e.target.checked })} className="w-5 h-5 text-amber-600 rounded-lg focus:ring-amber-500 border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5" />
                    <label htmlFor="addonIsActive" className="text-xs font-black text-coffee-500 uppercase tracking-widest">Available for Sale</label>
                  </div>
                  <div className="md:col-span-2 flex justify-end gap-4 mt-2">
                    <button type="button" onClick={cancelAddonEdit} className="px-8 py-3.5 text-slate-500 dark:text-white/50 hover:text-slate-900 dark:hover:text-white transition-all font-black uppercase tracking-widest text-xs">Cancel</button>
                    <button type="submit" className="px-8 py-3.5 bg-amber-600 text-slate-900 dark:text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-amber-500 transition-all shadow-xl active:scale-95">
                      {isEditingAddon ? 'Save Add-on' : 'Create Add-on'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="bg-black/5 dark:bg-white/5 backdrop-blur-xl rounded-2xl sm:rounded-[2.5rem] shadow-2xl border border-black/10 dark:border-white/10 overflow-hidden mb-12">
              <div className="overflow-x-auto scrollbar-hide">
                <table className="w-full text-left border-collapse min-w-0">
                  <thead>
                    <tr className="bg-amber-600/20 text-amber-500 uppercase text-[10px] font-black tracking-[0.2em]">
                      <th className="p-3 sm:p-6">Add-on & Actions</th>
                      <th className="hidden sm:table-cell p-3 sm:p-6 text-center">Price</th>
                      <th className="hidden sm:table-cell p-3 sm:p-6">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/10 dark:divide-white/5">
                    {addons.map((addon) => (
                      <tr key={addon.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                        <td className="p-3 sm:p-6">
                          <div className="flex items-center justify-between gap-3 sm:gap-4">
                            <div className="min-w-0">
                              <div className="font-black text-slate-900 dark:text-white text-xs sm:text-sm uppercase tracking-tight group-hover:text-amber-500 transition-colors whitespace-normal break-words max-w-[140px] xs:max-w-[200px] sm:max-w-[350px]">{addon.name}</div>
                              <div className="sm:hidden text-[10px] font-black text-amber-700 mt-1">₱{addon.price.toLocaleString()}</div>
                            </div>
                            
                            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                              <button onClick={() => handleEditAddon(addon)} className="p-2.5 sm:p-3 text-coffee-500 hover:text-slate-900 dark:hover:text-white bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-xl transition-all">
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button onClick={() => setDeleteTarget({ id: addon.id, type: 'addon', name: addon.name })} className="p-2.5 sm:p-3 text-red-500/50 hover:text-red-500 bg-black/5 dark:bg-white/5 hover:bg-red-500/10 rounded-xl transition-all">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </td>
                        <td className="hidden sm:table-cell p-3 sm:p-6 text-sm font-black text-slate-900 dark:text-white text-center">₱{addon.price.toLocaleString()}</td>
                        <td className="hidden sm:table-cell p-3 sm:p-6">
                          <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full ${addon.isActive ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-black/5 dark:bg-white/5 text-white/30 border border-black/10 dark:border-white/5'}`}>
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
            </div>
          </>
        )}

        {activeTab === 'categories' && (
          <>
            {(isAddingCategory || isEditingCategory) && (
              <div className="bg-black/5 dark:bg-white/5 backdrop-blur-xl p-5 sm:p-8 rounded-2xl sm:rounded-[2.5rem] shadow-2xl border border-black/10 dark:border-white/10 mb-6 sm:mb-8 animate-in fade-in slide-in-from-top-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-widest">{isEditingCategory ? 'Edit Category' : 'Add New Category'}</h2>
                <form onSubmit={handleCategorySubmit} className="flex flex-col gap-6">
                  <div>
                    <label className="block text-xs font-black text-coffee-500 uppercase tracking-widest mb-2">Category Name</label>
                    <input 
                      required 
                      type="text" 
                      value={categoryFormData.name} 
                      onChange={e => setCategoryFormData({ ...categoryFormData, name: e.target.value })} 
                      placeholder="e.g. Special Brews, Pastries" 
                      className="w-full p-4 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/5 rounded-2xl focus:border-amber-500 focus:bg-black/10 dark:focus:bg-white/10 outline-none transition-all font-bold text-slate-900 dark:text-white" 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-black text-coffee-500 uppercase tracking-widest mb-3">Assign Icon</label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-9 gap-3 bg-slate-100 dark:bg-black/20 p-4 rounded-3xl border border-black/10 dark:border-white/5">
                      {AVAILABLE_ICONS.map(iconItem => {
                        const IconComponent = iconLookup[iconItem.name] || Coffee;
                        const isSelected = categoryFormData.iconName === iconItem.name;
                        return (
                          <button
                            key={iconItem.name}
                            type="button"
                            onClick={() => setCategoryFormData({ ...categoryFormData, iconName: iconItem.name })}
                            className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all ${
                              isSelected 
                                ? 'bg-violet-600/20 border-violet-500 text-violet-400 shadow-[0_0_15px_rgba(139,92,246,0.3)]' 
                                : 'bg-black/5 dark:bg-white/5 border-transparent text-coffee-400 hover:bg-black/10 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white'
                            }`}
                            title={iconItem.label}
                          >
                            <IconComponent className="w-6 h-6 shrink-0" />
                            <span className="text-[9px] font-black uppercase tracking-tight truncate max-w-full">{iconItem.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-end gap-4 mt-2">
                    <button type="button" onClick={cancelCategoryEdit} className="px-8 py-3.5 text-slate-500 dark:text-white/50 hover:text-slate-900 dark:hover:text-white transition-all font-black uppercase tracking-widest text-xs">Cancel</button>
                    <button type="submit" className="px-8 py-3.5 bg-violet-600 text-slate-900 dark:text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-violet-500 transition-all shadow-xl active:scale-95">
                      {isEditingCategory ? 'Save Category' : 'Create Category'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="bg-black/5 dark:bg-white/5 backdrop-blur-xl rounded-2xl sm:rounded-[2.5rem] shadow-2xl border border-black/10 dark:border-white/10 overflow-hidden mb-12">
              <div className="overflow-x-auto scrollbar-hide">
                <table className="w-full text-left border-collapse min-w-0">
                  <thead>
                    <tr className="bg-violet-600/20 text-violet-400 uppercase text-[10px] font-black tracking-[0.2em]">
                      <th className="p-3 sm:p-6 w-16 sm:w-24">Icon</th>
                      <th className="p-3 sm:p-6">Category Name & Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/10 dark:divide-white/5">
                    {categories.map((category) => {
                      const IconComponent = iconLookup[category.iconName] || Coffee;
                      return (
                        <tr key={category.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                          <td className="p-3 sm:p-6 w-16 sm:w-24">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/10 dark:border-white/10 flex items-center justify-center text-violet-400 group-hover:border-violet-500/50 group-hover:text-violet-300 transition-all">
                              <IconComponent className="w-5 h-5 sm:w-6 h-6" />
                            </div>
                          </td>
                          <td className="p-3 sm:p-6">
                            <div className="flex items-center justify-between gap-3 sm:gap-4">
                              <div className="min-w-0">
                                <div className="font-black text-slate-900 dark:text-white text-sm sm:text-base uppercase tracking-tight group-hover:text-violet-400 transition-colors whitespace-normal break-words max-w-[120px] xs:max-w-[180px] sm:max-w-[350px]">{category.name}</div>
                                <div className="text-[9px] text-coffee-600 font-bold uppercase tracking-widest mt-0.5">Icon: {category.iconName}</div>
                              </div>
                              
                              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                                <button onClick={() => handleEditCategory(category)} className="p-2.5 sm:p-3 text-coffee-500 hover:text-slate-900 dark:hover:text-white bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-xl transition-all">
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button onClick={() => setDeleteTarget({ id: category.id, type: 'category', name: category.name })} className="p-2.5 sm:p-3 text-red-500/50 hover:text-red-500 bg-black/5 dark:bg-white/5 hover:bg-red-500/10 rounded-xl transition-all">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {categories.length === 0 && (
                      <tr>
                        <td colSpan={2} className="p-12 text-center text-coffee-700 uppercase font-black text-[10px] tracking-widest">
                          No categories found. Create one to get started.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Custom Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0a0a0c] rounded-[2rem] p-8 max-w-sm w-full border border-black/10 dark:border-white/10 relative overflow-hidden animate-in zoom-in-95 duration-200 shadow-2xl">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-500 to-amber-500" />
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center text-red-400 mb-6">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight mb-2">
                Delete {deleteTarget.type === 'addon' ? 'Add-on' : deleteTarget.type === 'category' ? 'Category' : 'Product'}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-widest leading-relaxed mb-8">
                Are you sure you want to permanently delete {deleteTarget.type} <span className="text-slate-900 dark:text-white">"{deleteTarget.name}"</span>? This action cannot be undone.
              </p>
              <div className="flex w-full gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-3.5 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black/10 dark:hover:bg-white/10 transition-all text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="flex-1 py-3.5 bg-red-600 hover:bg-red-500 text-slate-900 dark:text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(220,38,38,0.2)] active:scale-95 flex items-center justify-center gap-2"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
