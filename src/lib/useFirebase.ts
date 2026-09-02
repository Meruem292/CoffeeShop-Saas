import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy, where, serverTimestamp, setDoc, writeBatch, getDoc, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Product, Order, OrderStatus, SplashScreen, ShopSettings, Addon, DynamicCategory, Voucher, ClaimedVoucher, UserProfile, YourMixIngredient, YourMixBasePreset } from '../types';
import { DEFAULT_YOUR_MIX_INGREDIENTS, DEFAULT_YOUR_MIX_BASES } from '../data/yourMixDefaults';
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
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [userClaimedVouchers, setUserClaimedVouchers] = useState<ClaimedVoucher[]>([]);
  const [claimedVouchers, setClaimedVouchers] = useState<ClaimedVoucher[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [splashScreen, setSplashScreen] = useState<SplashScreen | null>(null);
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null);
  const [yourMixIngredients, setYourMixIngredients] = useState<YourMixIngredient[]>([]);
  const [yourMixBases, setYourMixBases] = useState<YourMixBasePreset[]>([]);
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
        setShopSettings({ id: snapshot.id, kioskPin: '0000', pointsEarnedPer10Pesos: 1, pointsEarnedPer100Pesos: 10, gcashQrUrl: '', gcashNumber: '', ...snapshot.data() } as ShopSettings);
      } else {
        setShopSettings({
          id: 'shop',
          name: 'CoffeeHouse OS',
          initials: 'CH',
          logoUrl: '',
          themeColor: '#4b2c20',
          kioskPin: '0000',
          pointsEarnedPer10Pesos: 1,
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

    // User Orders Listener
    let unsubUserOrders = () => {};
    if (userUid && !isAdmin) {
      const qUserOrders = query(collection(db, 'orders'), where('customerId', '==', userUid));
      unsubUserOrders = onSnapshot(qUserOrders, (snapshot) => {
        const o = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
        o.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setUserOrders(o);
      }, (err) => handleSnapshotError(err, OperationType.LIST, 'user-orders'));
    }

    // Claimed Vouchers Listener
    let unsubClaimed = () => {};
    const qClaimed = isAdmin
      ? query(collection(db, 'claimed_vouchers'))
      : userUid
        ? query(collection(db, 'claimed_vouchers'), where('userId', '==', userUid))
        : null;

    if (qClaimed) {
      unsubClaimed = onSnapshot(qClaimed, (snapshot) => {
        const cv = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClaimedVoucher));
        if (isAdmin) {
          setClaimedVouchers(cv);
        } else {
          setUserClaimedVouchers(cv);
        }
      }, (err) => handleSnapshotError(err, OperationType.LIST, 'claimed_vouchers'));
    }

    // Profiles Listener (Admin only)
    let unsubProfiles = () => {};
    if (isAdmin) {
      const qProfiles = query(collection(db, 'profiles'));
      unsubProfiles = onSnapshot(qProfiles, (snapshot) => {
        const p = snapshot.docs.map(doc => {
          const d = doc.data();
          return { uid: doc.id, shortId: d.shortId || doc.id.slice(0, 5).toUpperCase(), ...d } as UserProfile;
        });
        setProfiles(p);
      }, (err) => handleSnapshotError(err, OperationType.LIST, 'profiles'));
    }

    // Current User Profile Listener
    let unsubUserProfile = () => {};
    if (userUid) {
      const qUserProfile = doc(db, 'profiles', userUid);
      unsubUserProfile = onSnapshot(qUserProfile, (docSnap) => {
        if (docSnap.exists()) {
          const d = docSnap.data();
          setUserProfile({ uid: docSnap.id, shortId: d.shortId || docSnap.id.slice(0, 5).toUpperCase(), ...d } as UserProfile);
        }
      }, (err) => handleSnapshotError(err, OperationType.GET, `profiles/${userUid}`));
    }

    // Your MIX Ingredients Listener
    const qYourMixIngredients = query(collection(db, 'your_mix_ingredients'));
    const unsubYourMixIngredients = onSnapshot(qYourMixIngredients, (snapshot) => {
      if (snapshot.empty && isAdmin) {
        // Auto-seed default laboratory ingredients if empty
        DEFAULT_YOUR_MIX_INGREDIENTS.forEach(async (ing) => {
          try {
            await setDoc(doc(db, 'your_mix_ingredients', ing.id), ing);
          } catch (e) {
            console.error('Failed to seed default Your MIX ingredient', e);
          }
        });
        setYourMixIngredients(DEFAULT_YOUR_MIX_INGREDIENTS);
      } else {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as YourMixIngredient));
        setYourMixIngredients(list.length > 0 ? list : DEFAULT_YOUR_MIX_INGREDIENTS);
      }
    }, (err) => handleSnapshotError(err, OperationType.LIST, 'your_mix_ingredients'));

    // Your MIX Bases Listener
    const qYourMixBases = query(collection(db, 'your_mix_bases'));
    const unsubYourMixBases = onSnapshot(qYourMixBases, (snapshot) => {
      if (snapshot.empty && isAdmin) {
        // Auto-seed default laboratory bases if empty
        DEFAULT_YOUR_MIX_BASES.forEach(async (base) => {
          try {
            await setDoc(doc(db, 'your_mix_bases', base.id), base);
          } catch (e) {
            console.error('Failed to seed default Your MIX base', e);
          }
        });
        setYourMixBases(DEFAULT_YOUR_MIX_BASES);
      } else {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as YourMixBasePreset));
        setYourMixBases(list.length > 0 ? list : DEFAULT_YOUR_MIX_BASES);
      }
    }, (err) => handleSnapshotError(err, OperationType.LIST, 'your_mix_bases'));

    return () => {
      unsubSettings();
      unsubSplash();
      unsubProducts();
      unsubAddons();
      unsubCategories();
      unsubVouchers();
      unsubOrders();
      unsubUserOrders();
      unsubClaimed();
      unsubProfiles();
      unsubUserProfile();
      unsubYourMixIngredients();
      unsubYourMixBases();
    };
  }, [userUid, isAdmin]);

  const claimVoucher = async (voucher: Voucher, availablePoints: number) => {
    if (!userUid) {
      toast.error('Please log in to redeem vouchers');
      return false;
    }
    if ((voucher.pointsCost || 0) > availablePoints) {
      toast.error(`Not enough points. Need ${voucher.pointsCost} Pts`);
      return false;
    }

    try {
      const batch = writeBatch(db);
      
      // Generate a short, unique, easily manual-typable code for the claimed voucher
      const parentPart = voucher.code.replace(/[^A-Z0-9]/gi, '').slice(0, 8).toUpperCase();
      const uniquePart = Math.random().toString(36).substring(2, 6).toUpperCase();
      const uniqueClaimedCode = `${parentPart}-${uniquePart}`;
      
      const claimedData: Omit<ClaimedVoucher, 'id'> = {
        userId: userUid,
        voucherId: voucher.id,
        code: uniqueClaimedCode,
        type: voucher.type,
        value: voucher.value,
        minSpend: voucher.minSpend || 0,
        pointsCost: voucher.pointsCost || 0,
        claimedAt: Date.now(),
        isUsed: false,
        conditionType: voucher.conditionType || 'none',
        buyQuantity: voucher.buyQuantity || 0,
        buyCategoryOrName: voucher.buyCategoryOrName || '',
        getQuantity: voucher.getQuantity || 0,
        getCategoryOrName: voucher.getCategoryOrName || ''
      };

      const newClaimRef = doc(collection(db, 'claimed_vouchers'));
      batch.set(newClaimRef, claimedData);

      // Deduct points from profile
      const profileRef = doc(db, 'profiles', userUid);
      const pointsToDeduct = voucher.pointsCost || 0;
      if (pointsToDeduct > 0) {
        batch.update(profileRef, {
          points: Math.max(0, availablePoints - pointsToDeduct)
        });
      }

      await batch.commit();
      toast.success(`Successfully claimed voucher "${voucher.code}"!`);
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'claimed_vouchers');
      toast.error('Failed to claim voucher');
      return false;
    }
  };

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
    console.log('Attempting to delete voucher with ID:', id);
    try {
      const docRef = doc(db, 'vouchers', id);
      console.log('Doc ref path:', docRef.path);
      console.log('Before deleteDoc');
      await deleteDoc(docRef);
      console.log('After deleteDoc');
      console.log('Voucher successfully deleted from Firestore');
      toast.success('Voucher deleted successfully!');
    } catch (err) {
      console.error('Detailed Delete Voucher Error:', err);
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
    // If placing from kiosk, pos, or the logged-in user is an admin, the customer is either the specified accountId or a guest (null)
    const isKioskOrPos = order.source === 'kiosk' || order.source === 'pos';
    let finalCustomerId = (isKioskOrPos || isAdmin)
      ? (order.accountId || null)
      : (user?.uid || order.accountId || null);

    if (finalCustomerId) {
      try {
        const directSnap = await getDoc(doc(db, 'profiles', finalCustomerId));
        if (!directSnap.exists()) {
          const qShort = query(collection(db, 'profiles'), where('shortId', '==', finalCustomerId.toUpperCase()));
          const qSnap = await getDocs(qShort);
          if (!qSnap.empty) {
            finalCustomerId = qSnap.docs[0].id;
          }
        }
      } catch (err) {
        console.warn("Error resolving shortId customerId:", err);
      }
    }

    const orderData = {
      status: 'unpaid', // Default status
      ...order,
      createdAt: Date.now(), 
      customerId: finalCustomerId,
    };

    const cleanData = deepCleanUndefined(orderData);

    try {
      const batch = writeBatch(db);
      const newOrderRef = doc(collection(db, 'orders'));
      batch.set(newOrderRef, cleanData);

      // Deduct points if spent from the actual customer account
      if (finalCustomerId && order.pointsSpent && order.pointsSpent > 0) {
        const profileRef = doc(db, 'profiles', finalCustomerId);
        const profileSnap = await getDoc(profileRef);
        const currentPoints = profileSnap.exists() ? (profileSnap.data().points || 0) : 0;
        batch.update(profileRef, {
          points: Math.max(0, currentPoints - order.pointsSpent)
        });
      }

      // Mark claimed voucher as used if applicable
      if (order.claimedVoucherId) {
        const cvRef = doc(db, 'claimed_vouchers', order.claimedVoucherId);
        batch.update(cvRef, { isUsed: true, usedAt: Date.now() });
      }

      // Deduct inventory for regular products or Your MIX ingredients
      for (const item of (order.items || [])) {
        if (item.isCustomMix && item.customMixDetails?.ingredients) {
          for (const ing of item.customMixDetails.ingredients) {
            try {
              const ingRef = doc(db, 'your_mix_ingredients', ing.id);
              const ingSnap = await getDoc(ingRef);
              if (ingSnap.exists()) {
                const currentStock = ingSnap.data().inventoryStock || 0;
                const deductQty = (ing.quantity || 1) * (item.quantity || 1);
                batch.update(ingRef, {
                  inventoryStock: Math.max(0, currentStock - deductQty)
                });
              }
            } catch (err) {
              console.warn('Could not deduct custom mix ingredient stock', ing.id, err);
            }
          }
        }
      }

      await batch.commit();
    } catch (err) {
      console.error('Add Order Error:', err);
      handleFirestoreError(err, OperationType.CREATE, 'orders');
      throw err; // Re-throw so caller knows it failed
    }
  };

  const addYourMixIngredient = async (ingredient: Omit<YourMixIngredient, 'id'>) => {
    try {
      const clean = deepCleanUndefined(ingredient);
      const docRef = await addDoc(collection(db, 'your_mix_ingredients'), clean);
      toast.success(`Ingredient "${ingredient.name}" created!`);
      return docRef.id;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'your_mix_ingredients');
      toast.error('Failed to create ingredient');
    }
  };

  const updateYourMixIngredient = async (id: string, updates: Partial<YourMixIngredient>) => {
    try {
      const clean = deepCleanUndefined(updates);
      await setDoc(doc(db, 'your_mix_ingredients', id), clean, { merge: true });
      toast.success('Ingredient updated!');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `your_mix_ingredients/${id}`);
      toast.error('Failed to update ingredient');
    }
  };

  const deleteYourMixIngredient = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'your_mix_ingredients', id));
      toast.success('Ingredient deleted');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `your_mix_ingredients/${id}`);
      toast.error('Failed to delete ingredient');
    }
  };

  const addYourMixBase = async (base: Omit<YourMixBasePreset, 'id'>) => {
    try {
      const clean = deepCleanUndefined(base);
      const docRef = await addDoc(collection(db, 'your_mix_bases'), clean);
      toast.success(`Base preset "${base.name}" created!`);
      return docRef.id;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'your_mix_bases');
      toast.error('Failed to create base preset');
    }
  };

  const updateYourMixBase = async (id: string, updates: Partial<YourMixBasePreset>) => {
    try {
      const clean = deepCleanUndefined(updates);
      await setDoc(doc(db, 'your_mix_bases', id), clean, { merge: true });
      toast.success('Base preset updated!');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `your_mix_bases/${id}`);
      toast.error('Failed to update base preset');
    }
  };

  const deleteYourMixBase = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'your_mix_bases', id));
      toast.success('Base preset deleted');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `your_mix_bases/${id}`);
      toast.error('Failed to delete base preset');
    }
  };

  const resetYourMixDefaults = async () => {
    try {
      const batch = writeBatch(db);
      DEFAULT_YOUR_MIX_INGREDIENTS.forEach(ing => {
        batch.set(doc(db, 'your_mix_ingredients', ing.id), ing);
      });
      DEFAULT_YOUR_MIX_BASES.forEach(base => {
        batch.set(doc(db, 'your_mix_bases', base.id), base);
      });
      await batch.commit();
      toast.success('Your MIX ingredients & presets restored to defaults!');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'your_mix_defaults');
      toast.error('Failed to reset defaults');
    }
  };

  const updateOrderStatus = async (id: string, status: OrderStatus) => {
    try {
      // If marking as completed, award points
      if (status === 'completed') {
        const orderRef = doc(db, 'orders', id);
        const orderSnap = await getDoc(orderRef);
        
        if (orderSnap.exists()) {
          const orderData = orderSnap.data() as Order;
          if (orderData.status !== 'completed' && orderData.customerId) {
            const profileRef = doc(db, 'profiles', orderData.customerId);
            const profileSnap = await getDoc(profileRef);
            
            const profileData = profileSnap.exists() ? profileSnap.data() : null;
            const currentPoints = typeof profileData?.points === 'number' ? profileData.points : Number(profileData?.points ?? 0);
            const earned = typeof orderData.pointsEarned === 'number' ? orderData.pointsEarned : Number(orderData.pointsEarned || 0);
            
            await setDoc(profileRef, {
              points: currentPoints + earned
            }, { merge: true });
          }
        }
      }

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

  const updateUserProfile = async (uid: string, updates: Partial<UserProfile>) => {
    try {
      const { uid: _, ...data } = updates;
      // Ensure points is a number if it exists in updates
      if (data.points !== undefined) {
        data.points = Number(data.points);
      }
      await setDoc(doc(db, 'profiles', uid), data, { merge: true });
      toast.success('User profile updated successfully!');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `profiles/${uid}`);
      toast.error('Failed to update user profile');
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
    userOrders,
    vouchers,
    userClaimedVouchers,
    claimedVouchers,
    profiles,
    userProfile,
    splashScreen,
    shopSettings,
    yourMixIngredients,
    yourMixBases,
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
    claimVoucher,
    addOrder,
    updateOrderStatus,
    updateOrder,
    updateStock,
    updateUserProfile,
    deleteOrder,
    clearOrders,
    addYourMixIngredient,
    updateYourMixIngredient,
    deleteYourMixIngredient,
    addYourMixBase,
    updateYourMixBase,
    deleteYourMixBase,
    resetYourMixDefaults
  };
}
