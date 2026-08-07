import React, { useState, useMemo, useCallback } from 'react';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Product, CartItem, Order, ProductSize, Addon, SugarLevel, ShopSettings, DynamicCategory, OrderStatus, Voucher, UserProfile, ClaimedVoucher } from '../types';
import { Coffee, Minus, Plus, ShoppingBag, X, Check, Store, ArrowRight, Search, ChevronDown, Flame, Sparkles, Layout, IceCream, QrCode, Upload, LogIn, LogOut, CheckCircle2, User as UserIcon, AlertTriangle, Copy, Download, Heart, Tag } from 'lucide-react';
import MagicBento from './MagicBento';
import { CategorySidebar } from './CategorySidebar';
import { ProductCard } from './ProductCard';
import { useAuth } from '../lib/AuthContext';
import { UnifiedAuthModal } from './UnifiedAuthModal';
import { useToast } from '../lib/ToastContext';
import { useBackButton } from '../lib/useBackButton';

interface OrderingScreenProps {
  mode: 'pos' | 'kiosk' | 'mobile';
  menu: Product[];
  addons?: Addon[];
  onPlaceOrder: (order: Omit<Order, 'id' | 'createdAt'>) => void;
  shopSettings?: ShopSettings | null;
  categoriesData?: DynamicCategory[];
  mostPickedProductIds?: Set<string>;
  vouchers?: Voucher[];
  userClaimedVouchers?: ClaimedVoucher[];
  userProfile?: UserProfile | null;
}

export function OrderingScreen({ mode, menu, addons = [], onPlaceOrder, shopSettings, categoriesData, mostPickedProductIds, vouchers = [], userClaimedVouchers = [], userProfile }: OrderingScreenProps) {
  const { toast } = useToast();
  const categories = useMemo(() => {
    let list: string[] = [];
    if (categoriesData && categoriesData.length > 0) {
      // First, get all active categories
      list = categoriesData.filter(c => c.isActive !== false).map(c => c.name);
      
      // We also need all configured categories (even hidden) to avoid accidentally adding them back
      const allConfiguredCategories = categoriesData.map(c => c.name);
      
      // Also include categories from products that might not be in categoriesData
      const productCats = Array.from(new Set(menu.map(p => p.category)));
      productCats.forEach(pCat => {
        const pCatLower = (pCat || '').trim().toLowerCase();
        
        const isCovered = allConfiguredCategories.some(cName => {
          const cNameLower = cName.trim().toLowerCase();
          if (cNameLower === pCatLower) return true;
          
          const pParts = pCatLower.split('/').map(s => s.trim());
          if (pParts.includes(cNameLower)) return true;
          
          const cParts = cNameLower.split('/').map(s => s.trim());
          return cParts.some(cp => pParts.includes(cp) || pCatLower === cp);
        });
        
        // Only add if it's not configured AT ALL. If it's configured and hidden, skip it.
        if (!isCovered && pCat && pCat.trim()) {
          list.push(pCat.trim());
        }
      });
    } else {
      list = Array.from(new Set(menu.map(p => p.category)));
      if (list.length === 0) {
        list = ['Hot Coffee', 'Cold Coffee', 'Tea', 'Food'];
      }
    }
    
    // Show all configured categories, plus any implied by products
    return list;
  }, [categoriesData, menu]);

  const [activeCategory, setActiveCategory] = useState<string>(categories[0] || '');
  const [activeSubCategory, setActiveSubCategory] = useState<string>('All');

  // Keep activeCategory in sync with available categories
  React.useEffect(() => {
    if (categories.length > 0) {
      const exists = categories.some(c => c.trim().toLowerCase() === activeCategory.trim().toLowerCase());
      if (!exists) {
        setActiveCategory(categories[0]);
      }
    } else {
      setActiveCategory('');
    }
  }, [categories, activeCategory]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const { user, logOut } = useAuth();
  const [showCustomerAuth, setShowCustomerAuth] = useState(false);
  const [receiptBase64, setReceiptBase64] = useState('');
  const [compressingImage, setCompressingImage] = useState(false);

  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'best-seller' | 'alphabetical' | 'price-asc' | 'price-desc'>('best-seller');
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);
  const [showPersonalVoucherModal, setShowPersonalVoucherModal] = useState(false);
  const [personalVoucherInput, setPersonalVoucherInput] = useState('');
  const [showFreeItemModal, setShowFreeItemModal] = useState(false);
  const [selectedFreeProduct, setSelectedFreeProduct] = useState<Product | null>(null);

  const { isBuyXGetYEligible, buyCount, requiredQty } = useMemo(() => {
    if (!appliedVoucher || appliedVoucher.type !== 'buy_x_get_y') return { isBuyXGetYEligible: false, buyCount: 0, requiredQty: 0 };
    const buyQty = appliedVoucher.buyQuantity || 1;
    const buyTerm = (appliedVoucher.buyCategoryOrName || '').toLowerCase().trim();
    const buyCount = cart.reduce((sum, item) => {
      const itemCat = (item.category || '').toLowerCase();
      const itemName = (item.name || '').toLowerCase();
      if (!buyTerm || itemCat.includes(buyTerm) || itemName.includes(buyTerm)) {
        return sum + item.quantity;
      }
      return sum;
    }, 0);
    return { isBuyXGetYEligible: buyCount >= buyQty, buyCount, requiredQty: buyQty };
  }, [appliedVoucher, cart]);

  const eligibleFreeProducts = useMemo(() => {
    if (!appliedVoucher || appliedVoucher.type !== 'buy_x_get_y') return [];
    const getTerm = (appliedVoucher.getCategoryOrName || '').toLowerCase().trim();
    return menu.filter(item => {
      const itemCat = (item.category || '').toLowerCase();
      const itemName = (item.name || '').toLowerCase();
      if (!getTerm || itemCat.includes(getTerm) || itemName.includes(getTerm)) {
        return true;
      }
      return false;
    });
  }, [appliedVoucher, menu]);

  const handleLookupPersonalVoucher = async () => {
    const code = personalVoucherInput.trim().toUpperCase();
    if (!code) return;

    try {
      const foundAdmin = vouchers.find(v => v.code === code && v.isActive);
      if (foundAdmin) {
        if (foundAdmin.minSpend && subtotal < foundAdmin.minSpend) {
          toast.error(`Minimum spend of ₱${foundAdmin.minSpend} required`);
          return;
        }
        setAppliedVoucher(foundAdmin);
        setShowPersonalVoucherModal(false);
        setPersonalVoucherInput('');
        toast.success(`Voucher "${foundAdmin.code}" applied!`);
        return;
      }

      const q = query(collection(db, 'claimed_vouchers'), where('code', '==', code));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const cvData = snap.docs[0].data();
        const vObj: Voucher = {
          id: cvData.voucherId || snap.docs[0].id,
          code: cvData.code,
          type: cvData.type,
          value: cvData.value,
          minSpend: cvData.minSpend || 0,
          isActive: true
        };
        if (vObj.minSpend && subtotal < vObj.minSpend) {
          toast.error(`Minimum spend of ₱${vObj.minSpend} required`);
          return;
        }
        setAppliedVoucher(vObj);
        setShowPersonalVoucherModal(false);
        setPersonalVoucherInput('');
        toast.success(`Personal voucher "${vObj.code}" activated & applied!`);
        return;
      }

      toast.error('Voucher code or Member QR not found');
    } catch (e) {
      console.error('Voucher lookup error:', e);
      toast.error('Failed to verify voucher');
    }
  };

  // Real-time listener for the logged-in customer's orders to calculate favorites
  React.useEffect(() => {
    if (!user) {
      setCustomerOrders([]);
      return;
    }

    const q = query(
      collection(db, 'orders'),
      where('customerId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      setCustomerOrders(ordersList);
    }, (err) => {
      console.warn('Error listening to customer orders:', err);
    });

    return () => unsubscribe();
  }, [user]);

  // Compute available points
  const availablePoints = useMemo(() => {
    // Priority 1: Use centralized userProfile points if available
    if (userProfile && userProfile.points !== undefined) {
      return userProfile.points;
    }

    if (!user || customerOrders.length === 0) return 0;
    
    const earnRate = shopSettings?.pointsEarnedPer100Pesos || 10;
    
    const totalEarned = customerOrders
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => {
        if (o.pointsEarned !== undefined) return sum + o.pointsEarned;
        return sum + Math.floor((o.total || 0) / 100) * earnRate;
      }, 0);
      
    const totalSpent = customerOrders
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + (o.pointsSpent || 0), 0);
      
    return Math.max(0, totalEarned - totalSpent);
  }, [customerOrders, user, shopSettings?.pointsEarnedPer100Pesos, userProfile]);

  // Compute customer's favorites: count item occurrences and sort descending
  const customerFavorites = useMemo(() => {
    if (!user || customerOrders.length === 0) return [];

    const counts: Record<string, number> = {};
    customerOrders.forEach(order => {
      if (order.status === 'cancelled') return;

      order.items?.forEach(item => {
        counts[item.id] = (counts[item.id] || 0) + (item.quantity || 1);
      });
    });

    // Sort products by their purchase count descending
    const sortedFavs = Object.entries(counts)
      .filter(([_, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([prodId, count]) => {
        const prod = menu.find(p => p.id === prodId);
        return prod ? { product: prod, count } : null;
      })
      .filter((item): item is { product: Product; count: number } => item !== null);

    return sortedFavs;
  }, [user, customerOrders, menu]);

  // Sync customer name if logged in
  React.useEffect(() => {
    if (user && !user.email?.endsWith('@astro.local') && user.email !== 'newroskoto@gmail.com') { // exclude admin
      setCustomerName(user.displayName || user.email.split('@')[0] || '');
      setAccountId(user.uid);
    }
  }, [user]);

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setCompressingImage(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
          const img = new Image();
          img.src = event.target?.result as string;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 500;
            const MAX_HEIGHT = 500;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.5));
          };
          img.onerror = reject;
        };
        reader.onerror = reject;
      });
      setReceiptBase64(base64);
    } catch (err) {
      console.error('Failed to process image:', err);
      toast.error('Failed to process receipt image. Please try another image.');
    } finally {
      setCompressingImage(false);
    }
  };

  const [customerName, setCustomerName] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [accountId, setAccountId] = useState('');
  const [orderType, setOrderType] = useState<'dine-in' | 'take-away' | null>('take-away');
  const [paymentMethod, setPaymentMethod] = useState<'counter' | 'gcash'>('counter');
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [isKioskCartOpen, setIsKioskCartOpen] = useState(false);
  const [isPosCartDrawerOpen, setIsPosCartDrawerOpen] = useState(false);
  const [gridColumns, setGridColumns] = useState<number>(shopSettings?.gridColumns || 5);
  const [selectedProductForConfig, setSelectedProductForConfig] = useState<Product | null>(null);

  // Natural Back Button hooks for modals/drawers in OrderingScreen
  useBackButton(showCustomerAuth, () => setShowCustomerAuth(false), 'ord_customer_auth');
  useBackButton(isMobileCartOpen, () => setIsMobileCartOpen(false), 'ord_mobile_cart');
  useBackButton(isKioskCartOpen, () => setIsKioskCartOpen(false), 'ord_kiosk_cart');
  useBackButton(isPosCartDrawerOpen, () => setIsPosCartDrawerOpen(false), 'ord_pos_cart');
  useBackButton(!!selectedProductForConfig, () => setSelectedProductForConfig(null), 'ord_product_config');

  // Sync grid columns if shopSettings change
  React.useEffect(() => {
    if (shopSettings?.gridColumns) {
      setGridColumns(shopSettings.gridColumns);
    }
  }, [shopSettings?.gridColumns]);

  const [selectedSizeConfig, setSelectedSizeConfig] = useState<ProductSize | null>(null);
  const [selectedSugarConfig, setSelectedSugarConfig] = useState<SugarLevel>('100%');
  const [selectedAddonsConfig, setSelectedAddonsConfig] = useState<Addon[]>([]);

  // Category Change Handler
  const handleCategoryChange = useCallback((cat: string) => {
    setActiveCategory(cat);
    setActiveSubCategory('All');
  }, []);

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

  const addToCart = useCallback((product: Product, size?: ProductSize, sugarLevel?: SugarLevel, selectedAddons?: Addon[]) => {
    const basePrice = size ? size.price : product.price;
    const addonsPrice = selectedAddons ? selectedAddons.reduce((sum, a) => sum + a.price, 0) : 0;
    const finalPrice = basePrice + addonsPrice;
    
    const cartId = Math.random().toString(36).substr(2, 9);
    
    let isExisting = false;
    setCart((prev) => {
      // Check for identical item (same size, sugar, and addons)
      const existingIndex = prev.findIndex(ci => 
        ci.id === product.id && 
        ci.selectedSize?.name === size?.name &&
        ci.sugarLevel === sugarLevel &&
        JSON.stringify(ci.selectedAddons?.map(a => a.id).sort()) === JSON.stringify(selectedAddons?.map(a => a.id).sort())
      );
      if (existingIndex > -1) {
        isExisting = true;
        return prev.map((ci, idx) => idx === existingIndex ? { ...ci, quantity: ci.quantity + 1 } : ci);
      }
      return [...prev, { ...product, cartId, quantity: 1, notes: '', selectedSize: size, price: finalPrice, sugarLevel, selectedAddons }];
    });

    if (isExisting) {
      toast.success(`Increased ${product.name} quantity in cart`);
    } else {
      toast.success(`${product.name} added to cart`);
    }
  }, [toast]);

  // Product Click Handler
  const handleProductClick = useCallback((product: Product) => {
    if ((product.sizes && product.sizes.length > 0) || product.isCustomizable || isProductBeverage(product)) {
      setSelectedProductForConfig(product);
      setSelectedSizeConfig(product.sizes && product.sizes.length > 0 ? product.sizes[0] : null);
      setSelectedSugarConfig('100%');
      setSelectedAddonsConfig([]);
    } else {
      addToCart(product);
    }
  }, [addToCart]);

  const handleConfigSubmit = () => {
    if (selectedProductForConfig) {
      const isBev = isProductBeverage(selectedProductForConfig);
      addToCart(
        selectedProductForConfig, 
        selectedSizeConfig || undefined, 
        isBev ? selectedSugarConfig : undefined, 
        isBev ? selectedAddonsConfig : undefined
      );
      setSelectedProductForConfig(null);
    }
  };

  const toggleAddon = (addon: Addon) => {
    setSelectedAddonsConfig(prev => {
      const isSelected = prev.some(a => a.id === addon.id);
      if (isSelected) {
        return prev.filter(a => a.id !== addon.id);
      } else {
        return [...prev, addon];
      }
    });
  };

  const updateQuantity = (cartId: string, delta: number) => {
    let removedItemName: string | null = null;
    setCart((prev) => {
      const itemToUpdate = prev.find(item => item.cartId === cartId);
      if (itemToUpdate && itemToUpdate.quantity + delta <= 0) {
        removedItemName = itemToUpdate.name;
      }
      return prev.map((item) => {
        if (item.cartId === cartId) {
          const newQuantity = Math.max(0, item.quantity + delta);
          return { ...item, quantity: newQuantity };
        }
        return item;
      }).filter((item) => item.quantity > 0);
    });

    if (removedItemName) {
      toast.info(`Removed ${removedItemName} from cart`);
    }
  };

  const availableSubCategories = useMemo(() => {
    if (!activeCategory) return ['All'];
    const activeCatLower = (activeCategory || '').trim().toLowerCase();
    const catItems = menu.filter(item => {
      const itemCatLower = (item.category || '').trim().toLowerCase();
      if (itemCatLower === activeCatLower) return true;
      const productParts = itemCatLower.split('/').map(s => s.trim());
      if (productParts.includes(activeCatLower)) return true;
      const activeParts = activeCatLower.split('/').map(s => s.trim());
      return activeParts.some(ap => productParts.includes(ap) || itemCatLower === ap);
    });
    
    const subCats = new Set<string>();
    catItems.forEach(item => {
      if (item.subCategory && item.subCategory.trim()) {
        subCats.add(item.subCategory.trim());
      }
    });
    return ['All', ...Array.from(subCats).sort()];
  }, [menu, activeCategory]);

  const filteredMenu = useMemo(() => {
    let list = [...menu];
    
    if (localSearchQuery) {
      list = list.filter(item => 
        item.name.toLowerCase().includes(localSearchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(localSearchQuery.toLowerCase()) ||
        (item.description || '').toLowerCase().includes(localSearchQuery.toLowerCase())
      );
    } else {
      const activeCatLower = (activeCategory || '').trim().toLowerCase();
      const catFiltered = list.filter(item => {
        const itemCatLower = (item.category || '').trim().toLowerCase();
        if (itemCatLower === activeCatLower) return true;
        
        // Support slash-separated combined categories (e.g., "Matcha/Non-Coffee" matches "Non-Coffee")
        const productParts = itemCatLower.split('/').map(s => s.trim());
        if (productParts.includes(activeCatLower)) return true;
        
        const activeParts = activeCatLower.split('/').map(s => s.trim());
        return activeParts.some(ap => productParts.includes(ap) || itemCatLower === ap);
      });
      
      if (activeSubCategory === 'All') {
        list = catFiltered;
      } else {
        list = catFiltered.filter(item => 
          (item.subCategory || '').trim().toLowerCase() === activeSubCategory.toLowerCase()
        );
      }
    }

    // Apply sorting
    if (sortBy === 'alphabetical') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'price-asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'best-seller') {
      list.sort((a, b) => {
        const aIsMost = mostPickedProductIds?.has(a.id) ? 1 : 0;
        const bIsMost = mostPickedProductIds?.has(b.id) ? 1 : 0;
        return bIsMost - aIsMost;
      });
    }

    return list;
  }, [menu, localSearchQuery, activeCategory, activeSubCategory, sortBy, mostPickedProductIds]);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  const discountAmount = useMemo(() => {
    if (!appliedVoucher) return 0;
    if (appliedVoucher.type === 'percentage') {
      return subtotal * (appliedVoucher.value / 100);
    }
    if (appliedVoucher.type === 'fixed') {
      return appliedVoucher.value;
    }
    if (appliedVoucher.type === 'buy_x_get_y') {
      const buyQty = appliedVoucher.buyQuantity || 1;
      const getQty = appliedVoucher.getQuantity || 1;
      const selectedId = selectedFreeProduct?.id;
      const buyTerm = (appliedVoucher.buyCategoryOrName || '').toLowerCase().trim();

      const buyCount = cart.reduce((sum, item) => {
        const itemCat = (item.category || '').toLowerCase();
        const itemName = (item.name || '').toLowerCase();
        if (!buyTerm || itemCat.includes(buyTerm) || itemName.includes(buyTerm)) {
          return sum + item.quantity;
        }
        return sum;
      }, 0);

      if (buyCount >= buyQty) {
        if (!selectedFreeProduct) return 0;
        const sets = Math.floor(buyCount / buyQty);
        const freeAllowed = sets * getQty;
        let freeRemaining = freeAllowed;
        let totalDiscount = 0;

        const getItems = cart.filter(item => {
          if (selectedId && item.id === selectedId) return true;
          const getTerm = (appliedVoucher.getCategoryOrName || '').toLowerCase().trim();
          const itemCat = (item.category || '').toLowerCase();
          const itemName = (item.name || '').toLowerCase();
          if (!getTerm || itemCat.includes(getTerm) || itemName.includes(getTerm)) {
            return true;
          }
          return false;
        });

        if (selectedId) {
          const foundTarget = getItems.find(i => i.id === selectedId);
          if (foundTarget) {
            const take = Math.min(foundTarget.quantity, freeRemaining);
            totalDiscount += foundTarget.price * take;
            freeRemaining -= take;
          }
        }

        if (freeRemaining > 0) {
          const sortedGetItems = [...getItems].sort((a, b) => a.price - b.price);
          for (const item of sortedGetItems) {
            const take = Math.min(item.quantity, freeRemaining);
            totalDiscount += item.price * take;
            freeRemaining -= take;
            if (freeRemaining <= 0) break;
          }
        }

        return totalDiscount;
      }
      return 0;
    }
    return 0;
  }, [appliedVoucher, subtotal, cart]);
    
  const total = Math.max(0, subtotal - discountAmount);

  const handleDownloadQR = async () => {
    if (!shopSettings?.gcashQrUrl) return;
    try {
      const response = await fetch(shopSettings.gcashQrUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'gcash-qr.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('QR code downloaded');
    } catch (error) {
      toast.error('Failed to download QR code');
    }
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    
    // Ensure we have a default order type if not set
    const finalOrderType = orderType || 'take-away';
    
    // Enforce Customer Login in mobile view
    if (mode === 'mobile' && !user) {
      setShowCustomerAuth(true);
      return;
    }
    
    if (!customerName.trim()) {
      toast.warning('Please enter your name before placing the order.');
      return;
    }

    if (paymentMethod === 'gcash') {
      if (!receiptBase64) {
        toast.warning('Please upload your GCash payment receipt screenshot.');
        return;
      }
    }
    
    const earnRate = shopSettings?.pointsEarnedPer100Pesos || 10;
    const pointsEarned = Math.floor(total / 100) * earnRate;

    onPlaceOrder({
      items: cart,
      total,
      subtotal,
      discountAmount,
      voucherCode: appliedVoucher?.code,
      pointsSpent: appliedVoucher?.pointsCost || 0,
      pointsEarned,
      claimedVoucherId: (appliedVoucher as any)?.isPurchased ? appliedVoucher?.id : undefined,
      source: mode === 'kiosk' ? 'mobile' : mode,
      customerName: customerName.trim(),
      tableNumber: finalOrderType === 'dine-in' ? (tableNumber || undefined) : undefined,
      orderType: finalOrderType,
      paymentMethod: paymentMethod,
      status: paymentMethod === 'gcash' ? 'pending-verification' : 'unpaid',
      receiptUrl: paymentMethod === 'gcash' ? receiptBase64 : undefined,
      accountId: accountId.trim() || undefined
    });

    setCart([]);
    setCustomerName('');
    setTableNumber('');
    setAccountId('');
    setReceiptBase64('');
    setOrderType('take-away');
    setIsMobileCartOpen(false);
    setIsKioskCartOpen(false);
    setIsPosCartDrawerOpen(false);
  };

  const containerClasses = {
    pos: 'flex h-full overflow-hidden bg-transparent',
    kiosk: 'flex flex-col h-full w-full bg-transparent relative',
    mobile: 'flex flex-col h-full w-full bg-transparent relative',
  };

  const getMobileGridClasses = (configuredCols: number) => {
    if (configuredCols <= 1) return 'grid-cols-1';
    if (configuredCols === 2) return 'grid-cols-2';
    if (configuredCols === 3) return 'grid-cols-2 sm:grid-cols-3';
    return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4';
  };

  const gridColsMap: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
    7: 'grid-cols-7',
    8: 'grid-cols-8',
  };

  const lgGridColsMap: Record<number, string> = {
    2: 'lg:grid-cols-2',
    3: 'lg:grid-cols-3',
    4: 'lg:grid-cols-4',
    5: 'lg:grid-cols-5',
    6: 'lg:grid-cols-6',
    7: 'lg:grid-cols-7',
    8: 'lg:grid-cols-8',
  };

  const renderMenuGrid = () => (
    <div className={`flex-1 overflow-hidden flex ${mode !== 'pos' ? 'flex-row' : 'flex-col'}`}>
      {/* Sidebar Navigation for Kiosk/Mobile */}
      {mode !== 'pos' && (
        <CategorySidebar 
          categories={categories}
          activeCategory={activeCategory}
          setActiveCategory={handleCategoryChange}
          mode={mode}
          categoriesData={categoriesData}
          shopSettings={shopSettings}
          user={user}
          onSignOut={logOut}
          onSignInClick={() => setShowCustomerAuth(true)}
        />
      )}

      <div className="flex-1 flex flex-col overflow-hidden bg-transparent">
        {/* Horizontal Categories for POS only */}
        {mode === 'pos' && (
          <div className="p-4 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-white/5 flex gap-2.5 overflow-x-auto shrink-0 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap px-8 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all active:scale-95 ${
                  activeCategory === cat
                    ? 'bg-amber-500 text-slate-900 dark:text-white shadow-lg'
                    : 'text-slate-600 dark:text-slate-400 hover:text-foreground hover:bg-slate-50 dark:hover:bg-white/5 border border-slate-100 dark:border-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        <div className={`flex-1 overflow-y-auto p-4 sm:p-6 md:p-10 lg:p-12 ${mode === 'mobile' ? 'scrollbar-hide pb-32' : 'pb-24'}`}>
          <div className="w-full max-w-[1600px] mx-auto">
            <header className={`${mode === 'mobile' ? 'mb-4 flex items-center px-1' : 'mb-8 flex flex-col lg:flex-row lg:items-end justify-between gap-6'}`}>
              <div className={`${mode === 'mobile' ? 'flex items-center gap-2' : 'flex flex-col'}`}>
                {mode === 'mobile' ? (
                  <>
                    <div className="w-1 h-5 bg-amber-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                    <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                      {localSearchQuery ? 'Search Results' : activeCategory}
                    </h2>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="px-3 py-1 bg-amber-500/10 text-amber-600 text-[10px] font-black uppercase tracking-[0.3em] rounded-full border border-amber-500/20">
                        Catalog
                      </div>
                      <div className="h-[1px] flex-1 bg-slate-200" />
                    </div>
                    <h2 className="text-5xl md:text-6xl lg:text-7xl font-black text-foreground uppercase italic tracking-tighter leading-[0.85] flex flex-wrap items-baseline gap-x-4">
                      {localSearchQuery ? 'Results' : activeCategory.split(' ')[0]}
                      {!localSearchQuery && activeCategory.split(' ')[1] && (
                        <span className="text-slate-700 dark:text-slate-300 not-italic font-medium text-4xl md:text-5xl lg:text-6xl">{activeCategory.split(' ')[1]}</span>
                      )}
                    </h2>
                    <div className="flex items-center gap-3 mt-6">
                      <div className="h-1.5 w-16 bg-amber-500 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.2)]" />
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">
                        {filteredMenu.length} items available
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div className={`${mode === 'mobile' ? 'hidden' : 'flex items-center gap-4'}`}>
                {/* Column Toggle - POS/Kiosk Only */}
                {mode !== 'mobile' && !localSearchQuery && (
                  <div className="flex flex-col items-end gap-2 pl-4 border-l border-slate-200">
                    <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-[0.2em]">Layout</span>
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                      {[4, 5, 6].map((cols) => (
                        <button
                           key={cols}
                           onClick={() => setGridColumns(cols as 4 | 5 | 6)}
                           className={`w-9 h-9 rounded-lg flex items-center justify-center text-[11px] font-black transition-all ${
                             gridColumns === cols
                               ? 'bg-amber-500 text-slate-900 dark:text-white shadow-[0_0_15px_rgba(245,158,11,0.4)] scale-105'
                               : 'text-slate-600 dark:text-slate-400 hover:text-foreground hover:bg-white'
                           }`}
                        >
                          {cols}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </header>

            {/* Product Search and Sort Controls Row */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative w-full sm:max-w-xs">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={localSearchQuery}
                  onChange={(e) => setLocalSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-white/40 dark:bg-slate-900/40 border border-black/10 dark:border-white/5 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500/20 transition-all placeholder:text-slate-500 backdrop-blur-xl"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                {localSearchQuery && (
                  <button 
                    onClick={() => setLocalSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                <div className="relative group">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="appearance-none pl-3 pr-8 py-2 bg-transparent text-[11px] font-bold text-slate-600 dark:text-slate-400 focus:outline-none cursor-pointer uppercase tracking-wider hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    <option value="best-seller">🔥 Best Seller</option>
                    <option value="alphabetical">🔠 A-Z</option>
                    <option value="price-asc">📈 Price ↑</option>
                    <option value="price-desc">📉 Price ↓</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
                </div>
              </div>
            </div>

            {/* Customer Favorites / Most Purchased Section (Compact Row ~200px) */}
            {user && customerFavorites.length > 0 && (
              <div className="mb-6 p-4 bg-rose-500/5 dark:bg-rose-500/5 rounded-3xl border border-rose-500/20 shadow-sm animate-in fade-in slide-in-from-top-4 max-h-[200px] overflow-hidden flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-rose-500 fill-rose-500 animate-pulse" />
                    <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                      Your Favorites
                      <span className="text-[8px] text-rose-500 font-extrabold bg-rose-500/10 px-2 py-0.5 rounded-full uppercase border border-rose-500/10 tracking-widest">
                        Most Purchased Suggestion
                      </span>
                    </h3>
                  </div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest hidden sm:inline">
                    Scroll →
                  </span>
                </div>

                <div className="flex gap-3 overflow-x-auto scrollbar-hide py-1 h-[140px] items-center">
                  {customerFavorites.slice(0, 8).map(({ product, count }) => {
                    const cartCount = cart.filter(c => c.id === product.id).reduce((sum, item) => sum + item.quantity, 0);
                    return (
                      <div
                        key={`fav-${product.id}`}
                        onClick={() => product.isActive !== false && handleProductClick(product)}
                        className="shrink-0 w-60 h-[125px] bg-white dark:bg-[#0d121f] rounded-2xl border border-rose-500/30 p-2.5 flex gap-3 items-center cursor-pointer hover:border-rose-500 hover:shadow-md transition-all relative group"
                      >
                        <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 relative shrink-0">
                          <img src={product.image || undefined} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          <div className="absolute top-1 left-1 bg-rose-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full shadow">
                            ❤️ {count}x
                          </div>
                          {cartCount > 0 && (
                            <div className="absolute bottom-1 right-1 bg-amber-500 text-slate-900 text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border border-white">
                              {cartCount}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
                          <div>
                            <span className="text-[8px] font-extrabold uppercase text-rose-500 tracking-wider block">Most Ordered</span>
                            <h4 className="text-xs font-black text-slate-900 dark:text-white truncate mt-0.5">{product.name}</h4>
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">{product.category}</span>
                          </div>
                          <div className="flex items-center justify-between mt-auto">
                            <span className="text-xs font-black text-amber-500 italic">₱{product.price}</span>
                            <button className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-colors">
                              + Add
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {availableSubCategories.length > 1 && !localSearchQuery && (
              <div className="flex flex-wrap gap-2 mb-8 animate-in fade-in slide-in-from-top-4">
                {availableSubCategories.map(subCat => (
                  <button
                    key={subCat}
                    onClick={() => setActiveSubCategory(subCat)}
                    className={`px-6 py-2.5 rounded-full font-bold text-[10px] uppercase tracking-widest transition-all active:scale-95 ${
                      activeSubCategory === subCat
                        ? 'bg-amber-500 text-slate-900 shadow-md'
                        : 'bg-white dark:bg-[#111115] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/5 hover:border-amber-500/50'
                    }`}
                  >
                    {subCat}
                  </button>
                ))}
              </div>
            )}

            {filteredMenu.length === 0 ? (
              <div className="py-24 text-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
                <div className="w-32 h-32 bg-slate-100 dark:bg-slate-900 rounded-[3rem] flex items-center justify-center mx-auto mb-8 border border-slate-200 dark:border-white/5 shadow-inner">
                  <Search className="w-12 h-12 text-slate-700 dark:text-slate-300" />
                </div>
                <h3 className="text-2xl font-black text-foreground uppercase italic tracking-tighter mb-4">No Galactic Findings</h3>
                <p className="text-slate-600 dark:text-slate-400 font-bold uppercase tracking-widest text-xs max-w-xs mx-auto">Our sensors couldn't locate any matching items in this sector.</p>
              </div>
            ) : (
              <div 
                className={`grid ${
                  mode === 'mobile' ? `${getMobileGridClasses(shopSettings?.mobileGridColumns || 3)} gap-1.5` : 
                  `gap-3 md:gap-4 lg:gap-5 grid-cols-2 ${lgGridColsMap[gridColumns] || 'lg:grid-cols-5'}`
                }`}
                key={localSearchQuery ? 'search' : activeCategory}
              >
                {filteredMenu.map((item) => (
                  <ProductCard
                    key={item.id}
                    item={item}
                    mode={mode}
                    cartCount={cart.filter(c => c.id === item.id).reduce((sum, item) => sum + item.quantity, 0)}
                    onClick={handleProductClick}
                    isMostPicked={mostPickedProductIds ? mostPickedProductIds.has(item.id) : false}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderCart = () => (
    <div className="flex flex-col h-auto bg-white/95 dark:bg-[#0D0F14]/95 backdrop-blur-2xl text-slate-900 dark:text-white">
      <div className="p-6 border-b border-black/10 dark:border-white/5 bg-slate-50/80 dark:bg-[#131722]/80 flex justify-between items-center shrink-0">
        <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3 uppercase tracking-tighter italic">
          <ShoppingBag className="w-5 h-5 text-amber-500" />
          Order Orbit
        </h2>
        {(mode === 'mobile' || mode === 'kiosk' || isPosCartDrawerOpen) && (
          <button onClick={() => {
            setIsMobileCartOpen(false);
            setIsKioskCartOpen(false);
            setIsPosCartDrawerOpen(false);
          }} className="p-2 text-slate-500 dark:text-white/40 bg-black/5 dark:bg-white/5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-all">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-6 flex flex-col gap-4 scrollbar-hide">
          {cart.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 dark:text-white/40 space-y-4">
              <div className="w-20 h-20 bg-black/5 dark:bg-white/5 rounded-full flex items-center justify-center border border-black/10 dark:border-white/10 opacity-50">
                <Coffee className="w-10 h-10 text-amber-500" />
              </div>
              <p className="font-black uppercase tracking-[0.3em] text-[10px]">Your orbit is empty</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.cartId}
                className="flex items-center justify-between p-4 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/5 rounded-3xl shadow-sm group hover:border-amber-500/30 transition-all"
              >
                <div className="flex-1 pr-4">
                  <div className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-tight group-hover:text-amber-500 transition-colors">
                    {item.name}
                    {item.selectedSize && (
                      <span className="ml-2 text-[9px] text-amber-500 font-black bg-amber-500/10 px-2 py-0.5 rounded-full uppercase border border-amber-500/20">
                        {item.selectedSize.name}
                      </span>
                    )}
                  </div>
                  {(item.sugarLevel || (item.selectedAddons && item.selectedAddons.length > 0)) && (
                    <div className="text-[10px] text-slate-500 dark:text-white/40 font-bold uppercase tracking-widest mt-1 space-y-0.5">
                      {item.sugarLevel && <div>Sugar: {item.sugarLevel}</div>}
                      {item.selectedAddons && item.selectedAddons.length > 0 && (
                        <div className="text-amber-500/60">+ {item.selectedAddons.map(a => a.name).join(', ')}</div>
                      )}
                    </div>
                  )}
                  <div className="text-slate-900 dark:text-white font-black text-xs mt-2">₱{(item.price * item.quantity).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-3 bg-black/5 dark:bg-white/5 p-1.5 rounded-2xl border border-black/10 dark:border-white/10">
                  <button
                    onClick={() => updateQuantity(item.cartId, -1)}
                    className="p-2 bg-black/5 dark:bg-white/5 rounded-xl text-slate-600 dark:text-white/60 hover:bg-black/10 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-all active:scale-90"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-6 text-center font-black text-slate-900 dark:text-white text-sm">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.cartId, 1)}
                    className="p-2 bg-amber-500 text-black rounded-xl hover:bg-amber-400 shadow-lg transition-all active:scale-90"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
      </div>

      <div className="p-4 md:p-6 bg-slate-50/80 dark:bg-[#131722]/80 backdrop-blur-xl border-t border-black/10 dark:border-white/5 shrink-0">
        <div className="space-y-4 md:space-y-6 mb-4 md:mb-8">
          {/* Ordering Preferences */}
          <div className="space-y-3">
            <label className="block text-[9px] font-black text-slate-500 dark:text-white/40 uppercase tracking-[0.3em] ml-1">Ordering Preference</label>
            <div className="flex gap-3">
              <button
                onClick={() => setOrderType('dine-in')}
                className={`flex-1 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 border ${orderType === 'dine-in' ? 'bg-amber-500 text-black border-amber-500 shadow-lg shadow-amber-500/10' : 'bg-black/5 dark:bg-white/5 text-slate-500 dark:text-white/40 border-black/10 dark:border-white/5 hover:text-slate-900 dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10'}`}
              >
                <Store className="w-4 h-4" /> Dine-in
              </button>
              <button
                onClick={() => setOrderType('take-away')}
                className={`flex-1 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 border ${orderType === 'take-away' ? 'bg-amber-500 text-black border-amber-500 shadow-lg shadow-amber-500/10' : 'bg-black/5 dark:bg-white/5 text-slate-500 dark:text-white/40 border-black/10 dark:border-white/5 hover:text-slate-900 dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10'}`}
              >
                <ShoppingBag className="w-4 h-4" /> Take-out
              </button>
            </div>
            
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setPaymentMethod('counter')}
                className={`flex-1 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 border ${paymentMethod === 'counter' ? 'bg-amber-500 text-black border-amber-500 shadow-lg shadow-amber-500/10' : 'bg-black/5 dark:bg-white/5 text-slate-500 dark:text-white/40 border-black/10 dark:border-white/5 hover:text-slate-900 dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10'}`}
              >
                Pay Over Counter
              </button>
              <button
                onClick={() => setPaymentMethod('gcash')}
                className={`flex-1 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 border ${paymentMethod === 'gcash' ? 'bg-amber-500 text-black border-amber-500 shadow-lg shadow-amber-500/10' : 'bg-black/5 dark:bg-white/5 text-slate-500 dark:text-white/40 border-black/10 dark:border-white/5 hover:text-slate-900 dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10'}`}
              >
                Pay Online (GCash)
              </button>
            </div>
          </div>

          {/* Customer Information */}
          <div className="space-y-3 pt-2 border-t border-black/5 dark:border-white/5">
            <label className="block text-[9px] font-black text-slate-500 dark:text-white/40 uppercase tracking-[0.3em] ml-1">Customer Details</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              disabled={!!user}
              className={`w-full p-4 border border-black/10 dark:border-white/10 rounded-2xl focus:outline-none focus:border-amber-500/50 text-sm font-bold transition-all ${user ? 'bg-black/10 dark:bg-white/10 text-slate-500 cursor-not-allowed' : 'bg-black/5 dark:bg-white/5 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500'}`}
              placeholder="Reference Name"
            />
            {mode === 'kiosk' && (
              <input
                type="text"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                disabled={!!user}
                className={`w-full p-4 border border-black/10 dark:border-white/10 rounded-2xl focus:outline-none focus:border-amber-500/50 text-sm font-bold transition-all ${user ? 'bg-black/10 dark:bg-white/10 text-slate-500 cursor-not-allowed' : 'bg-black/5 dark:bg-white/5 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500'}`}
                placeholder="Account ID (Optional)"
              />
            )}
            {orderType === 'dine-in' && (
              <input
                type="text"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                className="w-full p-4 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl focus:outline-none focus:border-amber-500/50 text-slate-900 dark:text-white text-sm font-bold transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                placeholder="Table Number"
              />
            )}
          </div>

          {/* Payment Verification */}
          {paymentMethod === 'gcash' && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-500 space-y-4 pt-2 border-t border-black/5 dark:border-white/5">
              <label className="block text-[9px] font-black text-slate-500 dark:text-white/40 uppercase tracking-[0.3em] ml-1">Payment Verification</label>
              {/* Payment Details Box */}
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex flex-col gap-1.5">
                <div className="flex items-center gap-2 text-amber-500">
                  <QrCode className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-wider">GCash Payment Details</span>
                </div>
                {shopSettings?.gcashQrUrl && (
                  <div className="flex justify-center my-3 relative">
                    <div className="bg-white p-2 rounded-2xl border border-amber-500/20 shadow-md max-w-[180px] relative">
                      <img 
                        src={shopSettings.gcashQrUrl} 
                        alt="GCash Payment QR" 
                        className="w-full h-auto object-contain rounded-xl"
                        referrerPolicy="no-referrer"
                      />
                      <button 
                        onClick={handleDownloadQR}
                        className="absolute top-3 right-3 p-1.5 bg-black/50 backdrop-blur rounded-full text-white hover:bg-amber-500 transition-colors"
                        title="Download QR"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-wider text-center mt-1">Scan to Pay</p>
                    </div>
                  </div>
                )}
                <div className="text-xs text-slate-800 dark:text-slate-200">
                  Send exactly <span className="font-black text-amber-500">₱{total.toLocaleString()}</span> to:
                </div>
                <div className="flex items-center justify-between mt-1 text-sm bg-black/10 dark:bg-white/5 px-3 py-2 rounded-xl">
                  <span className="font-bold text-slate-900 dark:text-white">{shopSettings?.gcashNumber || '0917-123-4567'}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(shopSettings?.gcashNumber || '0917-123-4567');
                      toast.success('GCash number copied to clipboard');
                    }}
                    className="p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-all"
                  >
                    <Copy className="w-4 h-4 text-slate-500" />
                  </button>
                  <span className="text-[9px] font-black uppercase tracking-widest text-amber-500 bg-amber-500/10 border border-amber-500/10 px-2 py-0.5 rounded-full">{shopSettings?.name || 'Astro Coffee'}</span>
                </div>
              </div>

              {/* Screenshot Upload */}
              <div className="space-y-2">
                <label className="block text-[9px] font-black text-slate-500 dark:text-white/40 uppercase tracking-[0.3em] ml-1">
                  Receipt Screenshot
                </label>
                {receiptBase64 ? (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between gap-3 animate-in zoom-in-95">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <img src={receiptBase64} className="w-12 h-12 object-cover rounded-xl border border-emerald-500/10" alt="Receipt Preview" referrerPolicy="no-referrer" />
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-wider flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Uploaded successfully
                        </span>
                        <span className="text-[8px] font-medium text-slate-500 uppercase truncate">
                          payment_screenshot.jpg
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setReceiptBase64('')}
                      className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                      title="Remove receipt"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-6 border border-dashed border-black/20 dark:border-white/10 hover:border-amber-500/40 bg-black/5 dark:bg-white/5 rounded-2xl cursor-pointer hover:bg-black/10 transition-all text-center">
                    <Upload className="w-6 h-6 text-slate-400 group-hover:text-amber-500 mb-2 transition-colors" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-300">
                      {compressingImage ? 'Processing Image...' : 'Choose or Drag Receipt File'}
                    </span>
                    <span className="text-[8px] font-medium text-slate-500 dark:text-white/30 uppercase tracking-widest mt-1">
                      PNG or JPG (will be compressed)
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleReceiptUpload}
                      className="hidden"
                      disabled={compressingImage}
                    />
                  </label>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Vouchers & Promos */}
        <div className="space-y-4 pt-4 mt-4 border-t border-black/5 dark:border-white/5">
          <div className="flex items-center justify-between">
            <label className="block text-[9px] font-black text-slate-500 dark:text-white/40 uppercase tracking-[0.3em] ml-1">Apply Voucher or Promo Code</label>
            {mode === 'kiosk' && (
              <button
                onClick={() => setShowPersonalVoucherModal(true)}
                className="text-[10px] font-black text-amber-500 uppercase tracking-wider flex items-center gap-1 hover:underline"
              >
                <QrCode className="w-3.5 h-3.5" /> Scan Personal Voucher
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={promoCodeInput}
              onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
              className="flex-1 p-3 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl focus:outline-none focus:border-amber-500/50 text-slate-900 dark:text-white text-xs font-bold transition-all uppercase placeholder:text-slate-400 dark:placeholder:text-slate-500"
              placeholder="Enter Promo Code"
            />
            <button
              onClick={() => {
                if (!promoCodeInput) return;
                const isCustomerMode = mode === 'kiosk' || mode === 'mobile';
                
                // First check if user owns this voucher (claimed/purchased)
                const foundInClaimed = userClaimedVouchers.find(cv => cv.code === promoCodeInput && !cv.isUsed);
                
                // If not owned, check general active vouchers
                const found = foundInClaimed 
                  ? { ...foundInClaimed, pointsCost: 0, isPurchased: true } as any
                  : vouchers?.find(v => v.code === promoCodeInput && v.isActive && (isCustomerMode ? !v.isAdminOnly : true));

                if (found) {
                  if (found.minSpend && subtotal < found.minSpend) {
                    toast.error(`Minimum spend of ₱${found.minSpend} required`);
                    return;
                  }
                  
                  // Only check points if it's NOT a purchased voucher
                  const isPurchased = found.isPurchased;
                  if (!isPurchased) {
                    if (found.usageLimit && (found.usedCount || 0) >= found.usageLimit) {
                      toast.error('Voucher usage limit reached');
                      return;
                    }
                    if (found.pointsCost && found.pointsCost > availablePoints) {
                      toast.error(`Not enough points. Need ${found.pointsCost} Pts`);
                      return;
                    }
                  }

                  setAppliedVoucher(found);
                  setPromoCodeInput('');
                  toast.success(isPurchased ? `Purchased voucher "${found.code}" applied!` : `Voucher "${found.code}" applied!`);
                } else {
                  toast.error('Invalid, inactive, or already used promo code');
                }
              }}
              className="px-4 py-3 bg-amber-500 text-slate-900 font-black uppercase text-[10px] tracking-widest hover:bg-amber-400 active:scale-95 transition-all shadow-md rounded-2xl"
            >
              Apply
            </button>
          </div>
          
          {appliedVoucher && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex flex-col gap-2 shadow-sm animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase text-emerald-500 tracking-wider flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" /> Voucher Applied
                  </span>
                  <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest mt-0.5">
                    {appliedVoucher.code} ({appliedVoucher.type === 'buy_x_get_y' ? `Buy ${appliedVoucher.buyQuantity} Get ${appliedVoucher.getQuantity} Free` : (appliedVoucher.type === 'percentage' ? `${appliedVoucher.value}% OFF` : `₱${appliedVoucher.value} OFF`)})
                  </span>
                </div>
                <button
                  onClick={() => {
                    setAppliedVoucher(null);
                    setSelectedFreeProduct(null);
                    toast.info('Voucher removed');
                  }}
                  className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors font-bold text-xs"
                  title="Remove voucher"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {appliedVoucher.type === 'buy_x_get_y' && (
                <div className="pt-2 border-t border-emerald-500/25 flex items-center justify-between">
                  <div className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300">
                    {isBuyXGetYEligible ? (
                      selectedFreeProduct ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-black">Free Item: {selectedFreeProduct.name}</span>
                      ) : (
                        <span className="text-amber-500 font-black animate-pulse">Condition met! Please choose free item.</span>
                      )
                    ) : (
                      <span className="text-amber-600 dark:text-amber-400 font-bold">
                        Add {Math.max(0, requiredQty - buyCount)} more {appliedVoucher.buyCategoryOrName || 'items'} ({buyCount}/{requiredQty})
                      </span>
                    )}
                  </div>
                  {isBuyXGetYEligible && (
                    <button
                      onClick={() => setShowFreeItemModal(true)}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all shadow-sm"
                    >
                      {selectedFreeProduct ? 'Change Free Item' : 'Choose Free Item'}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Quick Select Vouchers List */}
          {(() => {
            const isCustomerMode = mode === 'kiosk' || mode === 'mobile';
            
            // Get active general promos (no points cost)
            const promoVouchers = vouchers ? vouchers.filter(v => v.isActive && (isCustomerMode ? (!v.pointsCost || v.pointsCost === 0) && !v.isAdminOnly : true)) : [];
            
            // Get user's purchased/claimed vouchers that are NOT yet used
            const purchasedVouchers = userClaimedVouchers
              .filter(cv => !cv.isUsed)
              .map(cv => ({
                ...cv,
                // Override pointsCost to 0 because it's already paid for
                pointsCost: 0,
                isPurchased: true
              } as Voucher & { isPurchased: boolean }));

            // Merge them, prioritizing purchased ones
            const allAvailableVouchers = [...purchasedVouchers, ...promoVouchers.filter(pv => !purchasedVouchers.some(p => p.id === pv.id))];

            if (allAvailableVouchers.length === 0) return null;
            return (
              <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black text-slate-500 dark:text-white/40 uppercase tracking-[0.3em] ml-1">
                    {mode === 'kiosk' ? 'Available Promo Vouchers' : 'Available Vouchers & Rewards'}
                  </span>
                  {mode !== 'kiosk' && user && (
                    <span className="text-[9px] font-black text-amber-500 uppercase tracking-wider">Balance: {availablePoints} Pts</span>
                  )}
                </div>
                
                <div className="flex overflow-x-auto gap-2.5 pb-2 scrollbar-hide">
                  {allAvailableVouchers.map(v => {
                    const isApplied = appliedVoucher?.id === v.id;
                    const isPurchased = (v as any).isPurchased;
                    const isPointsCostHigh = !isPurchased && mode !== 'kiosk' && !!(v.pointsCost && v.pointsCost > availablePoints);
                    const isBelowMinSpend = !!(v.minSpend && subtotal < v.minSpend);
                    const isLimitReached = !!(v.usageLimit && (v.usedCount || 0) >= v.usageLimit);
                    const isDisabled = isPointsCostHigh || isBelowMinSpend || isLimitReached;

                    return (
                      <button
                        key={v.id}
                        onClick={() => {
                          if (isBelowMinSpend) {
                            toast.error(`Minimum spend of ₱${v.minSpend} required`);
                            return;
                          }
                          if (isLimitReached) {
                            toast.error('Voucher usage limit reached');
                            return;
                          }
                          if (isPointsCostHigh) {
                            toast.error(`Not enough points. Needs ${v.pointsCost} Pts`);
                            return;
                          }
                          setAppliedVoucher(v);
                          toast.success(isPurchased ? `Purchased voucher "${v.code}" applied!` : `Voucher "${v.code}" applied!`);
                        }}
                        disabled={isDisabled}
                        className={`shrink-0 p-3 rounded-2xl border flex flex-col gap-1.5 min-w-[150px] text-left transition-all ${
                          isApplied 
                            ? 'bg-amber-500/20 border-amber-500 shadow-md' 
                            : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 hover:border-amber-500/50'
                        } ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'active:scale-95'}`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-1">
                            <Tag className="w-3.5 h-3.5 text-amber-500" />
                            {isPurchased && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                          </div>
                          <span className="text-[9px] font-black uppercase tracking-widest text-amber-500">
                            {isPurchased ? 'OWNED' : (v.type === 'buy_x_get_y' ? 'Buy X Get Y' : (v.pointsCost ? `${v.pointsCost} Pts` : (v.type === 'percentage' ? `${v.value}% OFF` : `₱${v.value} OFF`)))}
                          </span>
                        </div>
                        <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{v.code}</span>
                        <span className="text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                          {v.type === 'buy_x_get_y' ? `Buy ${v.buyQuantity} ${v.buyCategoryOrName || 'items'} get ${v.getQuantity} free` : (v.type === 'percentage' ? `${v.value}% discount` : `₱${v.value} off`)} {v.minSpend ? `(Min ₱${v.minSpend})` : ''}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Verification & Payment Notice */}
        <div className="mt-4 mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase text-amber-500 tracking-[0.2em]">Order Notice</p>
            <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 leading-relaxed uppercase tracking-wider">
              Your order will <span className="font-black text-amber-500">not</span> be made if not confirmed by the cashier (the e-payment) or not paid personally.
            </p>
          </div>
        </div>

        <div className="space-y-2 mb-8 px-2">
          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
            <span>Subtotal</span>
            <span>₱{subtotal.toLocaleString()}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-emerald-500">
              <span>Discount</span>
              <span>-₱{discountAmount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-2 border-t border-black/5 dark:border-white/5">
            <span className="text-slate-500 dark:text-white/40 font-black uppercase tracking-[0.2em] text-[10px]">Total Fuel</span>
            <span className="text-3xl font-black text-slate-900 dark:text-white italic">₱{total.toLocaleString()}</span>
          </div>
        </div>
        <button
          onClick={handleCheckout}
          disabled={cart.length === 0}
          className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-black/5 dark:disabled:bg-white/10 disabled:text-black/30 dark:disabled:text-white/50 text-black py-5 rounded-[2rem] font-black text-xl uppercase tracking-widest shadow-xl transition-all active:scale-[0.98] mb-2"
        >
          {mode === 'mobile' ? 'Launch Order' : 'Checkout'}
        </button>
      </div>
    </div>
  );

  return (
    <div className={containerClasses[mode]}>
      {/* Mobile/Kiosk local header removed as search moved to global header */}

      {/* Main Layout */}
      <div className={`flex-1 overflow-hidden ${mode === 'kiosk' ? 'flex flex-col' : 'flex'}`}>
        <div className="flex-1 flex flex-col overflow-hidden">
          {renderMenuGrid()}
        </div>
      </div>

      {/* Cart Area - Mobile, Kiosk & POS (Floating Button & Drawer) */}
      {(mode === 'mobile' || mode === 'kiosk' || mode === 'pos') && (
        <>
          {cart.length > 0 && !isMobileCartOpen && !isPosCartDrawerOpen && (
            <button
              onClick={() => mode === 'pos' ? setIsPosCartDrawerOpen(true) : setIsMobileCartOpen(true)}
              className="fixed bottom-8 right-8 z-[60] bg-white dark:bg-slate-900 text-black dark:text-white p-5 rounded-[2.5rem] shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)] flex items-center gap-4 group transition-all active:scale-95 animate-in fade-in zoom-in-95 duration-500 border border-black/10 dark:border-white/10"
            >
              <div className="relative">
                <ShoppingBag className="w-7 h-7" />
                <span className="absolute -top-3 -right-3 bg-amber-600 text-slate-900 dark:text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-4 border-black shadow-lg">
                  {cart.reduce((a, b) => a + b.quantity, 0)}
                </span>
              </div>
              <div className="flex flex-col items-start pr-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] leading-none mb-1 opacity-50">Fuel Check</span>
                <span className="font-black text-lg italic leading-none">₱{total.toLocaleString()}</span>
              </div>
            </button>
          )}

          {(isMobileCartOpen || isPosCartDrawerOpen) && (
              <div
                className="fixed inset-0 z-[70] flex flex-col justify-end bg-slate-300 dark:bg-black/60 backdrop-blur-md transition-all animate-in fade-in duration-500"
                onClick={() => {
                  setIsMobileCartOpen(false);
                  setIsPosCartDrawerOpen(false);
                }}
              >
                <div 
                  className={`bg-black/90 w-full ${mode === 'mobile' || mode === 'kiosk' ? 'h-[90vh]' : 'max-w-md ml-auto h-full'} rounded-t-[3rem] md:rounded-t-none md:rounded-l-[3rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,1)] border-t border-black/10 dark:border-white/5 md:border-t-0 md:border-l border-black/10 dark:border-white/5 flex flex-col animate-in ${mode === 'mobile' || mode === 'kiosk' ? 'slide-in-from-bottom' : 'slide-in-from-right'} duration-700`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex-1 overflow-y-auto">
                    {renderCart()}
                  </div>
                </div>
              </div>
            )}
        </>
      )}

      {showCustomerAuth && (
        <UnifiedAuthModal 
          onClose={() => setShowCustomerAuth(false)} 
          onSuccess={(displayName) => {
            setCustomerName(displayName);
          }} 
        />
      )}
        {/* Customization Modal */}
        {selectedProductForConfig && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md"
          >
            <div
              className="bg-white dark:bg-[#0b1329] w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] border border-black/10 dark:border-white/10 flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-300"
            >
              <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden">
                <img src={selectedProductForConfig.image || undefined} alt={selectedProductForConfig.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0b1329] via-[#0b1329]/30 to-transparent" />
                <button 
                  onClick={() => setSelectedProductForConfig(null)}
                  className="absolute top-5 right-5 w-10 h-10 bg-white dark:bg-slate-950/50 backdrop-blur-md border border-white/15 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-950/80 transition-all active:scale-90 z-20"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 sm:p-8 flex-1 overflow-y-auto scrollbar-hide space-y-6">
                <div>
                  <div className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1.5">{selectedProductForConfig.category}</div>
                  <h3 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 dark:text-white mb-2 leading-tight">{selectedProductForConfig.name}</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed font-normal">{selectedProductForConfig.description}</p>
                </div>
                
                {selectedProductForConfig.sizes && selectedProductForConfig.sizes.length > 0 && (
                  <div className="space-y-3">
                    <label className="block text-[10px] sm:text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Size / Variant</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedProductForConfig.sizes.map((size) => {
                        const isSelected = selectedSizeConfig?.name === size.name;
                        return (
                          <button
                            key={size.name}
                            onClick={() => setSelectedSizeConfig(size)}
                            className={`flex items-center justify-between p-4 border rounded-2xl transition-all duration-200 active:scale-98 ${isSelected ? 'border-amber-500 bg-amber-500/10 text-slate-900 dark:text-white shadow-sm' : 'border-black/10 dark:border-white/5 bg-black/5 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:border-white/10 hover:bg-black/10 dark:hover:bg-white/10'}`}
                          >
                            <span className="font-bold uppercase text-xs sm:text-sm tracking-wider">{size.name}</span>
                            <span className="font-bold text-amber-400 text-xs sm:text-sm">₱{size.price.toLocaleString()}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {isProductBeverage(selectedProductForConfig) && (
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="block text-[10px] sm:text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Sugar Level</label>
                      <div className="grid grid-cols-5 bg-black/5 dark:bg-white/5 p-1 rounded-2xl border border-black/10 dark:border-white/5 gap-1">
                        {(['0%', '25%', '50%', '75%', '100%'] as SugarLevel[]).map((level) => {
                          const isSelected = selectedSugarConfig === level;
                          return (
                            <button
                              key={level}
                              onClick={() => setSelectedSugarConfig(level)}
                              className={`py-2 rounded-xl text-xs font-semibold transition-all ${isSelected ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/10' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                            >
                              {level}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {addons.length > 0 && (
                      <div className="space-y-3">
                        <label className="block text-[10px] sm:text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Add-ons</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {addons.map((addon) => {
                            const isSelected = selectedAddonsConfig.some(a => a.id === addon.id);
                            return (
                              <button
                                key={addon.id}
                                onClick={() => toggleAddon(addon)}
                                className={`flex items-center justify-between p-4 border rounded-2xl transition-all duration-200 active:scale-98 ${isSelected ? 'border-amber-500 bg-amber-500/10 text-slate-900 dark:text-white' : 'border-black/10 dark:border-white/5 bg-black/5 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:border-white/10 hover:bg-black/10 dark:hover:bg-white/10'}`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all ${isSelected ? 'border-amber-500 bg-amber-500 text-black' : 'border-black/10 dark:border-white/10 bg-transparent'}`}>
                                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                  </div>
                                  <span className="font-bold text-xs sm:text-sm uppercase tracking-wider text-left">{addon.name}</span>
                                </div>
                                <span className="font-bold text-amber-400 text-xs sm:text-sm">+₱{addon.price.toLocaleString()}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="p-6 sm:p-8 border-t border-black/10 dark:border-white/5 bg-white/95 dark:bg-[#0b1329]/95 backdrop-blur-md shrink-0">
                <button
                  onClick={handleConfigSubmit}
                  className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-black rounded-2xl font-bold text-sm uppercase tracking-wider transition-all duration-200 shadow-[0_8px_30px_rgba(245,158,11,0.25)] active:scale-98 flex items-center justify-center gap-2"
                >
                  Add to Order - ₱{((selectedSizeConfig ? selectedSizeConfig.price : selectedProductForConfig.price) + selectedAddonsConfig.reduce((sum, a) => sum + a.price, 0)).toLocaleString()}
                </button>
              </div>
            </div>
          </div>
        )}
        {showPersonalVoucherModal && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#0d1527] border border-black/10 dark:border-white/10 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black uppercase tracking-wider text-slate-900 dark:text-white">Activate Personal Voucher</h3>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest">Walk-in Kiosk Mode</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowPersonalVoucherModal(false)}
                  className="p-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 text-slate-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Enter Voucher Code or Scan QR text</label>
                  <input
                    type="text"
                    value={personalVoucherInput}
                    onChange={(e) => setPersonalVoucherInput(e.target.value.toUpperCase())}
                    placeholder="e.g. VOUCHER-ABCD"
                    className="w-full p-4 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl font-bold uppercase text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                    autoFocus
                  />
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">
                  Scan your personal voucher QR code from your customer account profile, or type your voucher code to redeem your points-claimed voucher right here at the kiosk without logging in!
                </p>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowPersonalVoucherModal(false)}
                    className="flex-1 py-3 bg-black/5 dark:bg-white/5 hover:bg-black/10 rounded-2xl font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleLookupPersonalVoucher}
                    className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-2xl font-black text-xs uppercase tracking-wider shadow-md transition-all active:scale-95"
                  >
                    Activate & Apply
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showFreeItemModal && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#0d1527] border border-black/10 dark:border-white/10 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
                    <Tag className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black uppercase tracking-wider text-slate-900 dark:text-white">Choose Your Free Item</h3>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest">Category / Item: {appliedVoucher?.getCategoryOrName || 'Any'}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowFreeItemModal(false)}
                  className="p-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 text-slate-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 max-h-[350px] overflow-y-auto pr-1">
                {eligibleFreeProducts.length > 0 ? (
                  eligibleFreeProducts.map(prod => {
                    const isSelected = selectedFreeProduct?.id === prod.id;
                    return (
                      <button
                        key={prod.id}
                        onClick={() => {
                          setSelectedFreeProduct(prod);
                          setShowFreeItemModal(false);
                          const cartId = Math.random().toString(36).substr(2, 9);
                          const existingIndex = cart.findIndex(i => i.id === prod.id);
                          if (existingIndex === -1) {
                            setCart(prev => [...prev, {
                              ...prod,
                              cartId,
                              quantity: 1,
                              notes: 'Free item from promo',
                              sugarLevel: '100%',
                              selectedSize: prod.sizes?.[0],
                              selectedAddons: []
                            }]);
                          }
                          toast.success(`Selected free item: ${prod.name}`);
                        }}
                        className={`p-3 rounded-2xl border text-left flex flex-col gap-2 transition-all ${
                          isSelected 
                            ? 'bg-amber-500/20 border-amber-500 shadow-md ring-2 ring-amber-500/40' 
                            : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 hover:border-amber-500/50'
                        }`}
                      >
                        <div className="w-full h-24 rounded-xl overflow-hidden bg-black/10 relative">
                          <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          <div className="absolute top-2 right-2 px-2 py-0.5 bg-amber-500 text-slate-900 font-black text-[9px] rounded-md uppercase">
                            FREE
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900 dark:text-white uppercase truncate">{prod.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold line-through">₱{prod.price}</p>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="col-span-2 py-8 text-center text-slate-400 text-xs uppercase tracking-widest font-bold">
                    No products found in category "{appliedVoucher?.getCategoryOrName}"
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setShowFreeItemModal(false)}
                  className="px-6 py-3 bg-black/5 dark:bg-white/5 hover:bg-black/10 rounded-2xl font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300 transition-all"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
