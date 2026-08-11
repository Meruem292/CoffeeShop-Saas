export type ViewMode = 'pos' | 'kiosk' | 'mobile' | 'queue' | 'inventory' | 'admin-products' | 'admin-vouchers' | 'admin-customers' | 'settings' | 'cashier' | 'reports' | 'profile' | 'order-history' | 'rewards-store';
export type Category = 'Hot Coffee' | 'Cold Coffee' | 'Tea' | 'Food';

export interface FaceAnglesMap {
  front?: number[];
  left?: number[];
  right?: number[];
  smile?: number[];
}

export interface UserProfile {
  uid: string;
  shortId?: string;
  email: string;
  displayName: string;
  photoURL?: string;
  faceVectors?: any;
  faceAngles?: FaceAnglesMap;
  faceVector_front?: number[];
  faceVector_left?: number[];
  faceVector_right?: number[];
  faceVector_smile?: number[];
  points: number;
  isAdmin?: boolean;
  phoneNumber?: string;
  createdAt: number;
  lastLoginAt?: number;
}

export interface DynamicCategory {
  id: string;
  name: string;
  iconName: string;
  order?: number;
  isActive?: boolean;
}

export interface ProductSize {
  name: string;
  price: number;
}

export interface Addon {
  id: string;
  name: string;
  price: number;
  isActive: boolean;
}

export type SugarLevel = '0%' | '25%' | '50%' | '75%' | '100%';

export interface Product {
  id: string; // Firestore document ID
  name: string;
  category: string;
  subCategory?: string;
  price: number;
  image: string;
  description: string;
  stock: number;
  unit: string;
  lowStockThreshold: number;
  isActive: boolean;
  sizes?: ProductSize[];
  isCustomizable?: boolean;
  mixtureGuide?: string;
}

// Map Product to MenuItem and InventoryItem for backward compatibility with components,
// or we can just use Product directly everywhere.

export interface CartItem extends Product {
  cartId: string;
  quantity: number;
  notes: string;
  selectedSize?: ProductSize;
  sugarLevel?: SugarLevel;
  iceLevel?: string;
  selectedAddons?: Addon[];
}

export interface ShopSettings {
  id: string;
  name: string;
  initials: string;
  logoUrl?: string;
  receiptName?: string;
  receiptLogoUrl?: string;
  themeColor?: string;
  themeMode?: 'light' | 'dark';
  gridColumns?: number;
  mobileGridColumns?: number;
  address?: string;
  phone?: string;
  tagline?: string;
  notificationSoundUrl?: string;
  notificationVolume?: number;
  qrCodeUrl?: string;
  speakCustomerName?: boolean;
  kioskPin?: string;
  pointsEarnedPer100Pesos?: number;
  gcashQrUrl?: string;
  gcashNumber?: string;
  footerContent?: string;
}

export interface SplashScreen {
  id: string;
  imageUrl: string;
  title: string;
  subtitle: string;
  isActive: boolean;
  buttonText: string;
  useGlb?: boolean;
  glbUrl?: string;
}

export interface Voucher {
  id: string;
  code: string;
  type: 'percentage' | 'fixed' | 'buy_x_get_y';
  value: number;
  minSpend?: number;
  isActive: boolean;
  pointsCost?: number;
  usageLimit?: number;
  usedCount?: number;
  // Conditional promo fields (for 'buy_x_get_y' or custom conditions)
  conditionType?: 'none' | 'buy_x_get_y' | 'min_spend';
  buyQuantity?: number;
  buyCategoryOrName?: string;
  getQuantity?: number;
  getCategoryOrName?: string;
  isForSale?: boolean; // false = not for sale (for all / promo), true = can be bought with points
  isAdminOnly?: boolean; // true = only visible/usable by admin / cashier
  isPurchased?: boolean;
}

export interface ClaimedVoucher {
  id?: string;
  userId: string;
  voucherId: string;
  code: string;
  type: 'percentage' | 'fixed' | 'buy_x_get_y';
  value: number;
  minSpend?: number;
  pointsCost: number;
  claimedAt: number;
  isUsed?: boolean;
  conditionType?: 'none' | 'buy_x_get_y' | 'min_spend';
  buyQuantity?: number;
  buyCategoryOrName?: string;
  getQuantity?: number;
  getCategoryOrName?: string;
  isAdminOnly?: boolean;
}

export type OrderStatus = 'unpaid' | 'pending' | 'pending-verification' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export interface Order {
  id?: string;
  items: CartItem[];
  total: number;
  subtotal?: number;
  discountAmount?: number;
  voucherCode?: string;
  pointsSpent?: number;
  pointsEarned?: number;
  status: OrderStatus;
  createdAt: number;
  source: 'pos' | 'kiosk' | 'mobile';
  customerName: string;
  tableNumber?: string;
  orderType?: 'dine-in' | 'take-away';
  paymentMethod?: 'counter' | 'gcash';
  gcashReference?: string;
  receiptUrl?: string;
  customerId?: string;
  claimedVoucherId?: string;
  accountId?: string;
  voidReason?: string;
}
