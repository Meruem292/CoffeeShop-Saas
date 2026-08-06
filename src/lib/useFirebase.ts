import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy, where, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Product, Order, OrderStatus, SplashScreen, ShopSettings, Addon, DynamicCategory, Voucher } from '../types';
import { handleFirestoreError } from './AuthContext';
import { useToast } from './ToastContext';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function useFirebase(userUid?: string, isAdmin?: boolean) {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [categories, setCategories] = useState<DynamicCategory[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [splashScreen, setSplashScreen] = useState<SplashScreen | null>(null);
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleSnapshotError = (err: any, type: OperationType, path: string) => {
      handleFirestoreError(err, type, path);
      if (err?.message?.includes('Could not reach Cloud Firestore backend')) {
        setError('Connection is weak. Operating in offline mode.');
      }
      setLoading(false); // Stop infinite loading on connection error
    };

    // Shop Settings Sync
    const unsubSettings = onSnapshot(doc(db, 'settings', 'shop'), (snapshot) => {
      if (snapshot.exists()) {
        setShopSettings({ id: snapshot.id, kioskPin: '0000', pointsEarnedPer100Pesos: 10, gcashQrUrl: '', gcashNumber: '', ...snapshot.data() } as ShopSettings);
      } else {
        setShopSettings({
          id: 'shop',
          name: 'CoffeeHouse OS',
          initials: 'CH',
          logoUrl: '',
          themeColor: '#4b2c20',
          kioskPin: '0000',
          pointsEarnedPer100Pesos: 10,
          gcashQrUrl: '',
          gcashNumber: '0917-123-4567'
        });
      }
    }, (err) => handleSnapshotError(err, OperationType.GET, 'settings/shop'));

    // Splash Screen Sync
    const unsubSplash = onSnapshot(doc(db, 'settings', 'splash'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setSplashScreen({ 
          id: snapshot.id, 
          useGlb: data.useGlb !== undefined ? data.useGlb : true,
          glbUrl: data.glbUrl || '/coffee_cup_with_plate.glb',
          ...data 
        } as SplashScreen);
      } else {
        setSplashScreen({
          id: 'splash',
          imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80',
          title: 'Premium Coffee Experience',
          subtitle: 'Savor every moment with our handcrafted blends',
          isActive: true,
          buttonText: 'Start Ordering',
          useGlb: true,
          glbUrl: '/coffee_cup_with_plate.glb'
        });
      }
    }, (err) => handleSnapshotError(err, OperationType.GET, 'settings/splash'));

    // Products Listener
    const qProducts = query(collection(db, 'products'));
    const unsubProducts = onSnapshot(qProducts, (snapshot) => {
      const p = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(p);
      setError(null); // Clear error if we get a successful snapshot
    }, (err) => handleSnapshotError(err, OperationType.LIST, 'products'));

    // Addons Listener
    const qAddons = query(collection(db, 'addons'));
    const unsubAddons = onSnapshot(qAddons, (snapshot) => {
      const a = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Addon));
      setAddons(a);
    }, (err) => handleSnapshotError(err, OperationType.LIST, 'addons'));

    // Categories Listener
    const qCategories = query(collection(db, 'categories'));
    const unsubCategories = onSnapshot(qCategories, (snapshot) => {
      if (snapshot.empty && isAdmin) {
        const defaults = [
          { name: 'Hot Coffee', iconName: 'Coffee' },
          { name: 'Cold Coffee', iconName: 'IceCream' },
          { name: 'Tea', iconName: 'Leaf' },
          { name: 'Food', iconName: 'Croissant' }
        ];
        defaults.forEach(async (cat) => {
          try {
            await addDoc(collection(db, 'categories'), cat);
          } catch (e) {
            console.error('Failed to seed default category', e);
          }
        });
      } else {
        const c = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DynamicCategory));
        c.sort((a, b) => {
          const orderA = a.order !== undefined ? a.order : 999;
          const orderB = b.order !== undefined ? b.order : 999;
          return orderA - orderB;
        });
        setCategories(c);
      }
    }, (err) => handleSnapshotError(err, OperationType.LIST, 'categories'));

    // Vouchers Listener
    const unsubVouchers = onSnapshot(collection(db, 'vouchers'), (snapshot) => {
      const v = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Voucher));
      setVouchers(v);
    }, (err) => handleSnapshotError(err, OperationType.LIST, 'vouchers'));

    // Removed early return so public clients can listen to orders for the TV queue

    // Orders Listener
    // Admin gets all orders, public/customer gets only active/unsettled orders to securecompleted history
    const qOrders = isAdmin
      ? query(collection(db, 'orders'), orderBy('createdAt', 'asc'))
      : query(collection(db, 'orders'), where('status', 'in', ['unpaid', 'pending-verification', 'pending', 'preparing', 'ready']));
    
    const unsubOrders = onSnapshot(qOrders, (snapshot) => {
      let o = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      if (!isAdmin) {
        o.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
      }
      setOrders(o);
      setLoading(false);
    }, (err) => handleSnapshotError(err, OperationType.LIST, 'orders'));

    return () => {
      unsubSettings();
      unsubSplash();
      unsubProducts();
      unsubAddons();
      unsubCategories();
      unsubVouchers();
      unsubOrders();
    };
  }, [userUid, isAdmin]);

  // --- Shop Settings Operations ---
  const updateShopSettings = async (updates: Partial<ShopSettings>) => {
    try {
      const { id, ...data } = updates;
      await setDoc(doc(db, 'settings', 'shop'), data, { merge: true });
      toast.success('Shop settings updated successfully!');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'settings/shop');
      toast.error('Failed to update shop settings');
    }
  };

  // --- Splash Screen Operations ---
  const updateSplashScreen = async (updates: Partial<SplashScreen>) => {
    try {
      const { id, ...data } = updates;
      await setDoc(doc(db, 'settings', 'splash'), data, { merge: true });
      toast.success('Splash screen updated successfully!');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'settings/splash');
      toast.error('Failed to update splash screen');
    }
  };

  // --- Product Operations ---
  const addProduct = async (product: Omit<Product, 'id'>) => {
    try {
      const cleanData = Object.fromEntries(
        Object.entries(product).filter(([_, v]) => v !== undefined)
      );
      await addDoc(collection(db, 'products'), cleanData);
      toast.success(`Product "${product.name}" added successfully!`);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'products');
      toast.error('Failed to add product');
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      const cleanData = Object.fromEntries(
        Object.entries(updates).filter(([_, v]) => v !== undefined)
      );
      await updateDoc(doc(db, 'products', id), cleanData);
      toast.success(`Product updated successfully!`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `products/${id}`);
      toast.error('Failed to update product');
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'products', id));
      toast.success('Product deleted successfully!');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `products/${id}`);
      toast.error('Failed to delete product');
    }
  };

  // --- Addon Operations ---
  const addAddon = async (addon: Omit<Addon, 'id'>) => {
    try {
      const cleanData = Object.fromEntries(
        Object.entries(addon).filter(([_, v]) => v !== undefined)
      );
      await addDoc(collection(db, 'addons'), cleanData);
      toast.success(`Add-on "${addon.name}" added successfully!`);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'addons');
      toast.error('Failed to add add-on');
    }
  };

  const updateAddon = async (id: string, updates: Partial<Addon>) => {
    try {
      const cleanData = Object.fromEntries(
        Object.entries(updates).filter(([_, v]) => v !== undefined)
      );
      await updateDoc(doc(db, 'addons', id), cleanData);
      toast.success('Add-on updated successfully!');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `addons/${id}`);
      toast.error('Failed to update add-on');
    }
  };

  const deleteAddon = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'addons', id));
      toast.success('Add-on deleted successfully!');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `addons/${id}`);
      toast.error('Failed to delete add-on');
    }
  };

  // --- Category Operations ---
  const addCategory = async (category: Omit<DynamicCategory, 'id'>) => {
    try {
      await addDoc(collection(db, 'categories'), category);
      toast.success(`Category "${category.name}" added successfully!`);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'categories');
      toast.error('Failed to add category');
    }
  };

  const updateCategory = async (id: string, updates: Partial<DynamicCategory>) => {
    try {
      const { id: _, ...data } = updates;
      await updateDoc(doc(db, 'categories', id), data);
      toast.success('Category updated successfully!');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `categories/${id}`);
      toast.error('Failed to update category');
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'categories', id));
      toast.success('Category deleted successfully!');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `categories/${id}`);
      toast.error('Failed to delete category');
    }
  };

  const addVoucher = async (voucher: Omit<Voucher, 'id'>) => {
    try {
      await addDoc(collection(db, 'vouchers'), voucher);
      toast.success(`Voucher "${voucher.code}" added successfully!`);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'vouchers');
      toast.error('Failed to add voucher');
    }
  };

  const updateVoucher = async (id: string, updates: Partial<Voucher>) => {
    try {
      const { id: _, ...data } = updates as any;
      await updateDoc(doc(db, 'vouchers', id), data);
      toast.success('Voucher updated successfully!');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `vouchers/${id}`);
      toast.error('Failed to update voucher');
    }
  };

  const deleteVoucher = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'vouchers', id));
      toast.success('Voucher deleted successfully!');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `vouchers/${id}`);
      toast.error('Failed to delete voucher');
    }
  };

  // --- Order Operations ---
  // Clean up undefined values as Firestore doesn't like them
  const deepCleanUndefined = (obj: any): any => {
    if (Array.isArray(obj)) {
      return obj.map(deepCleanUndefined);
    } else if (obj !== null && typeof obj === 'object') {
      return Object.fromEntries(
        Object.entries(obj)
          .filter(([_, v]) => v !== undefined)
          .map(([k, v]) => [k, deepCleanUndefined(v)])
      );
    }
    return obj;
  };

  const addOrder = async (order: Omit<Order, 'id' | 'createdAt'>) => {
    const user = auth.currentUser;
    const orderData = {
      status: 'unpaid', // Default status
      ...order,
      createdAt: Date.now(), 
      customerId: user?.uid || null,
    };

    const cleanData = deepCleanUndefined(orderData);

    try {
      await addDoc(collection(db, 'orders'), cleanData);
    } catch (err) {
      console.error('Add Order Error:', err);
      handleFirestoreError(err, OperationType.CREATE, 'orders');
      throw err; // Re-throw so caller knows it failed
    }
  };

  const updateOrderStatus = async (id: string, status: OrderStatus) => {
    try {
      await updateDoc(doc(db, 'orders', id), { status });
      toast.success(`Order status updated to ${status}!`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${id}`);
      toast.error('Failed to update order status');
    }
  };

  const updateOrder = async (id: string, updates: Partial<Order>) => {
    try {
      const cleanData = deepCleanUndefined(updates);
      await updateDoc(doc(db, 'orders', id), cleanData);
      toast.success('Order details updated successfully!');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${id}`);
      toast.error('Failed to update order details');
    }
  };

  const updateStock = async (id: string, delta: number) => {
    const product = products.find(p => p.id === id);
    if (product) {
      const newStock = Math.max(0, product.stock + delta);
      try {
        await updateDoc(doc(db, 'products', id), { stock: newStock });
        toast.success(`Updated stock for "${product.name}"!`);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `products/${id}`);
        toast.error('Failed to update stock');
      }
    }
  };

  const deleteOrder = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'orders', id));
      toast.success('Order deleted successfully!');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `orders/${id}`);
      toast.error('Failed to delete order');
    }
  };

  const clearOrders = async (orderIds: string[]) => {
    try {
      const batch = writeBatch(db);
      orderIds.forEach(id => {
        batch.delete(doc(db, 'orders', id));
      });
      await batch.commit();
      toast.success('All completed orders cleared successfully!');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'orders/clear');
      toast.error('Failed to clear completed orders');
    }
  };

  return {
    products,
    addons,
    categories,
    orders,
    vouchers,
    splashScreen,
    shopSettings,
    loading,
    error,
    updateShopSettings,
    updateSplashScreen,
    addProduct,
    updateProduct,
    deleteProduct,
    addAddon,
    updateAddon,
    deleteAddon,
    addCategory,
    updateCategory,
    deleteCategory,
    addVoucher,
    updateVoucher,
    deleteVoucher,
    addOrder,
    updateOrderStatus,
    updateOrder,
    updateStock,
    deleteOrder,
    clearOrders
  };
}
