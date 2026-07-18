import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy, where, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Product, Order, OrderStatus, SplashScreen, ShopSettings, Addon, DynamicCategory } from '../types';
import { handleFirestoreError } from './AuthContext';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function useFirebase(userUid?: string, isAdmin?: boolean) {
  const [products, setProducts] = useState<Product[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [categories, setCategories] = useState<DynamicCategory[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
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
        setShopSettings({ id: snapshot.id, ...snapshot.data() } as ShopSettings);
      } else {
        setShopSettings({
          id: 'shop',
          name: 'CoffeeHouse OS',
          initials: 'CH',
          logoUrl: '',
          themeColor: '#4b2c20'
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

    if (!userUid) {
       setOrders([]);
       setLoading(false);
       return () => {
         unsubSettings();
         unsubSplash();
         unsubProducts();
         unsubAddons();
         unsubCategories();
       };
    }

    // Orders Listener
    let qOrders;
    if (isAdmin) {
       qOrders = query(collection(db, 'orders'), orderBy('createdAt', 'asc'));
    } else {
       qOrders = query(collection(db, 'orders'), where('customerId', '==', userUid));
    }
    
    const unsubOrders = onSnapshot(qOrders, (snapshot) => {
      let o = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      if (!isAdmin) {
         o = o.sort((a, b) => a.createdAt - b.createdAt);
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
      unsubOrders();
    };
  }, [userUid, isAdmin]);

  // --- Shop Settings Operations ---
  const updateShopSettings = async (updates: Partial<ShopSettings>) => {
    try {
      const { id, ...data } = updates;
      await setDoc(doc(db, 'settings', 'shop'), data, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'settings/shop');
    }
  };

  // --- Splash Screen Operations ---
  const updateSplashScreen = async (updates: Partial<SplashScreen>) => {
    try {
      const { id, ...data } = updates;
      await setDoc(doc(db, 'settings', 'splash'), data, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'settings/splash');
    }
  };

  // --- Product Operations ---
  const addProduct = async (product: Omit<Product, 'id'>) => {
    try {
      const cleanData = Object.fromEntries(
        Object.entries(product).filter(([_, v]) => v !== undefined)
      );
      await addDoc(collection(db, 'products'), cleanData);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'products');
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      const cleanData = Object.fromEntries(
        Object.entries(updates).filter(([_, v]) => v !== undefined)
      );
      await updateDoc(doc(db, 'products', id), cleanData);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `products/${id}`);
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `products/${id}`);
    }
  };

  // --- Addon Operations ---
  const addAddon = async (addon: Omit<Addon, 'id'>) => {
    try {
      const cleanData = Object.fromEntries(
        Object.entries(addon).filter(([_, v]) => v !== undefined)
      );
      await addDoc(collection(db, 'addons'), cleanData);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'addons');
    }
  };

  const updateAddon = async (id: string, updates: Partial<Addon>) => {
    try {
      const cleanData = Object.fromEntries(
        Object.entries(updates).filter(([_, v]) => v !== undefined)
      );
      await updateDoc(doc(db, 'addons', id), cleanData);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `addons/${id}`);
    }
  };

  const deleteAddon = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'addons', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `addons/${id}`);
    }
  };

  // --- Category Operations ---
  const addCategory = async (category: Omit<DynamicCategory, 'id'>) => {
    try {
      await addDoc(collection(db, 'categories'), category);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'categories');
    }
  };

  const updateCategory = async (id: string, updates: Partial<DynamicCategory>) => {
    try {
      const { id: _, ...data } = updates;
      await updateDoc(doc(db, 'categories', id), data);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `categories/${id}`);
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'categories', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `categories/${id}`);
    }
  };

  // --- Order Operations ---
  const addOrder = async (order: Omit<Order, 'id' | 'createdAt'>) => {
    const user = auth.currentUser;
    const orderData = {
      status: 'unpaid', // Default status
      ...order,
      createdAt: Date.now(), 
      customerId: user?.uid || null,
    };

    // Clean up undefined values as Firestore doesn't like them
    const cleanData = Object.fromEntries(
      Object.entries(orderData).filter(([_, v]) => v !== undefined)
    );

    try {
      await addDoc(collection(db, 'orders'), cleanData);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'orders');
    }
  };

  const updateOrderStatus = async (id: string, status: OrderStatus) => {
    try {
      await updateDoc(doc(db, 'orders', id), { status });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${id}`);
    }
  };

  const updateOrder = async (id: string, updates: Partial<Order>) => {
    try {
      const cleanData = Object.fromEntries(
        Object.entries(updates).filter(([_, v]) => v !== undefined)
      );
      await updateDoc(doc(db, 'orders', id), cleanData);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${id}`);
    }
  };

  const updateStock = async (id: string, delta: number) => {
    const product = products.find(p => p.id === id);
    if (product) {
      const newStock = Math.max(0, product.stock + delta);
      try {
        await updateDoc(doc(db, 'products', id), { stock: newStock });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `products/${id}`);
      }
    }
  };

  const deleteOrder = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'orders', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `orders/${id}`);
    }
  };

  const clearOrders = async (orderIds: string[]) => {
    try {
      const batch = writeBatch(db);
      orderIds.forEach(id => {
        batch.delete(doc(db, 'orders', id));
      });
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'orders/clear');
    }
  };

  return {
    products,
    addons,
    categories,
    orders,
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
    addOrder,
    updateOrderStatus,
    updateOrder,
    updateStock,
    deleteOrder,
    clearOrders
  };
}
