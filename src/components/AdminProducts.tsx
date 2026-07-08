import React, { useState } from 'react';
import { Product, ProductSize } from '../types';
import { Plus, Edit2, Trash2, Package, Database, ShieldAlert, X } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

interface AdminProductsProps {
  products: Product[];
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onUpdateProduct: (id: string, product: Partial<Product>) => void;
  onDeleteProduct: (id: string) => void;
}

export function AdminProducts({ products, onAddProduct, onUpdateProduct, onDeleteProduct }: AdminProductsProps) {
  const { isAdmin } = useAuth();
  const [isEditing, setIsEditing] = useState<Product | null>(null);
  const [isAdding, setIsAdding] = useState(false);

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
  };

  const [formData, setFormData] = useState<Omit<Product, 'id'>>(initialFormState);
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

  const handleEdit = (product: Product) => {
    setIsEditing(product);
    setFormData(product);
    setIsAdding(false);
  };

  const cancelEdit = () => {
    setIsEditing(null);
    setIsAdding(false);
    setFormData(initialFormState);
  };

  return (
    <div className="h-screen bg-coffee-50 p-4 md:p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-coffee-900 flex items-center gap-3">
              <Package className="w-8 h-8 text-coffee-600" />
              Product Catalog
            </h1>
            <p className="text-coffee-600 mt-1">Manage menu items and inventory catalog</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { setIsAdding(true); setIsEditing(null); setFormData(initialFormState); }}
              className="flex items-center gap-2 bg-coffee-900 text-white px-4 py-2.5 rounded-xl hover:bg-coffee-800 transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5" />
              Add Product
            </button>
          </div>
        </header>

        {(isAdding || isEditing) && (
          <div className="bg-white p-6 rounded-2xl shadow-xl border border-coffee-100 mb-8 animate-in fade-in slide-in-from-top-4">
            <h2 className="text-xl font-bold text-coffee-900 mb-4">{isEditing ? 'Edit Product' : 'Add New Product'}</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-coffee-700 mb-1">Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full p-2 border border-coffee-200 rounded-lg focus:ring-2 focus:ring-coffee-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-coffee-700 mb-1">Category</label>
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
                      className="w-full p-2 border border-coffee-200 rounded-lg focus:ring-2 focus:ring-coffee-500"
                    >
                      {uniqueCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                      <option value="ADD_NEW" className="font-bold text-coffee-600">+ Add New Category...</option>
                    </select>
                  ) : (
                    <div className="flex-1 flex gap-2">
                      <input 
                        type="text" 
                        placeholder="New Category Name"
                        value={newCategory} 
                        onChange={e => setNewCategory(e.target.value)}
                        className="w-full p-2 border border-coffee-200 rounded-lg focus:ring-2 focus:ring-coffee-500"
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
                        className="px-3 py-1 bg-coffee-100 text-coffee-700 rounded-lg font-bold"
                      >
                        Add
                      </button>
                      <button 
                        type="button"
                        onClick={() => setShowNewCategoryInput(false)}
                        className="p-2 text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-coffee-700 mb-1">Base Price (₱)</label>
                <input 
                  required 
                  type="number" 
                  step="0.01" 
                  min="0" 
                  placeholder="0.00"
                  value={formData.price || ''} 
                  onFocus={(e) => e.target.select()} 
                  onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })} 
                  className="w-full p-2 border border-coffee-200 rounded-lg focus:ring-2 focus:ring-coffee-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-coffee-700 mb-1">Image URL</label>
                <input required type="url" value={formData.image} onChange={e => setFormData({ ...formData, image: e.target.value })} className="w-full p-2 border border-coffee-200 rounded-lg focus:ring-2 focus:ring-coffee-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-coffee-700 mb-1">Description</label>
                <textarea required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full p-2 border border-coffee-200 rounded-lg focus:ring-2 focus:ring-coffee-500" rows={2} />
              </div>
              <div>
                <label className="block text-sm font-medium text-coffee-700 mb-1">Initial Stock</label>
                <input 
                  required 
                  type="number" 
                  min="0" 
                  placeholder="0"
                  value={formData.stock || ''} 
                  onFocus={(e) => e.target.select()} 
                  onChange={e => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })} 
                  className="w-full p-2 border border-coffee-200 rounded-lg focus:ring-2 focus:ring-coffee-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-coffee-700 mb-1">Unit</label>
                <input required type="text" value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })} className="w-full p-2 border border-coffee-200 rounded-lg focus:ring-2 focus:ring-coffee-500" placeholder="e.g. cups, kg, pcs" />
              </div>
              <div>
                <label className="block text-sm font-medium text-coffee-700 mb-1">Low Stock Threshold</label>
                <input 
                  required 
                  type="number" 
                  min="0" 
                  placeholder="0"
                  value={formData.lowStockThreshold || ''} 
                  onFocus={(e) => e.target.select()} 
                  onChange={e => setFormData({ ...formData, lowStockThreshold: parseInt(e.target.value) || 0 })} 
                  className="w-full p-2 border border-coffee-200 rounded-lg focus:ring-2 focus:ring-coffee-500" 
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input type="checkbox" id="isActive" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} className="w-4 h-4 text-coffee-600 rounded focus:ring-coffee-500 border-coffee-300" />
                <label htmlFor="isActive" className="text-sm font-medium text-coffee-700">Available for Sale</label>
              </div>
              
              <div className="md:col-span-2 bg-coffee-50 p-4 rounded-xl border border-coffee-100">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-coffee-900">Product Sizes (Optional)</h3>
                  <button type="button" onClick={handleAddSize} className="text-xs flex items-center gap-1 bg-white border border-coffee-200 px-2 py-1 rounded-lg hover:bg-coffee-100 transition-colors">
                    <Plus className="w-3 h-3" /> Add Size
                  </button>
                </div>
                {formData.sizes && formData.sizes.length > 0 ? (
                  <div className="space-y-3">
                    {formData.sizes.map((size, index) => (
                      <div key={index} className="flex gap-3 items-end">
                        <div className="flex-1">
                          <label className="block text-[10px] uppercase font-bold text-coffee-500 mb-1">Size Name (e.g. Tall, Grande)</label>
                          <input 
                            type="text" 
                            required
                            value={size.name} 
                            onChange={e => handleSizeChange(index, 'name', e.target.value)}
                            className="w-full p-2 text-sm border border-coffee-200 rounded-lg bg-white"
                          />
                        </div>
                        <div className="w-32">
                          <label className="block text-[10px] uppercase font-bold text-coffee-500 mb-1">Price (₱)</label>
                          <input 
                            type="number" 
                            required
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            value={size.price || ''} 
                            onFocus={(e) => e.target.select()}
                            onChange={e => handleSizeChange(index, 'price', parseFloat(e.target.value) || 0)}
                            className="w-full p-2 text-sm border border-coffee-200 rounded-lg bg-white"
                          />
                        </div>
                        <button type="button" onClick={() => handleRemoveSize(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg mb-0.5">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-coffee-400 italic">No sizes defined. Base price will be used.</p>
                )}
              </div>

              <div className="md:col-span-2 flex justify-end gap-3 mt-4">
                <button type="button" onClick={cancelEdit} className="px-4 py-2 text-coffee-700 hover:bg-coffee-100 rounded-lg font-medium transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-coffee-900 text-white rounded-lg font-medium hover:bg-coffee-800 transition-colors">
                  {isEditing ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl border border-coffee-100 overflow-hidden">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-coffee-900 text-white">
                <th className="p-4 font-semibold text-sm rounded-tl-xl">Product</th>
                <th className="p-4 font-semibold text-sm">Category</th>
                <th className="p-4 font-semibold text-sm">Price</th>
                <th className="p-4 font-semibold text-sm">Stock</th>
                <th className="p-4 font-semibold text-sm">Status</th>
                <th className="p-4 font-semibold text-sm text-right rounded-tr-xl">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-coffee-100 hover:bg-coffee-50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img src={product.image} alt={product.name} className="w-10 h-10 rounded-lg object-cover bg-coffee-100" />
                      <div>
                        <div className="font-bold text-coffee-900">{product.name}</div>
                        <div className="text-xs text-coffee-500 truncate max-w-xs">{product.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-coffee-700">{product.category}</td>
                  <td className="p-4 font-medium">₱{product.price.toLocaleString()}</td>
                  <td className="p-4">
                    <span className={`font-medium ${product.stock <= product.lowStockThreshold ? 'text-red-600' : 'text-coffee-900'}`}>
                      {product.stock} {product.unit}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${product.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {product.isActive ? 'Active' : 'Hidden'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleEdit(product)} className="p-2 text-coffee-600 hover:bg-coffee-100 hover:text-coffee-900 rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => onDeleteProduct(product.id)} className="p-2 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-coffee-400 font-medium">
                    No products found. Add one to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
