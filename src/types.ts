export type ViewMode = 'pos' | 'kiosk' | 'mobile' | 'queue' | 'inventory' | 'admin-products' | 'settings';
export type Category = 'Hot Coffee' | 'Cold Coffee' | 'Tea' | 'Food';

export interface ProductSize {
  name: string;
  price: number;
}

export interface Product {
  id: string; // Firestore document ID
  name: string;
  category: string;
  price: number;
  image: string;
  description: string;
  stock: number;
  unit: string;
  lowStockThreshold: number;
  isActive: boolean;
  sizes?: ProductSize[];
}

// Map Product to MenuItem and InventoryItem for backward compatibility with components,
// or we can just use Product directly everywhere.

export interface CartItem extends Product {
  cartId: string;
  quantity: number;
  notes: string;
  selectedSize?: ProductSize;
}

export interface ShopSettings {
  id: string;
  name: string;
  initials: string;
  logoUrl?: string;
  themeColor?: string;
}

export interface SplashScreen {
  id: string;
  imageUrl: string;
  title: string;
  subtitle: string;
  isActive: boolean;
  buttonText: string;
}

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed';

export interface Order {
  id?: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  createdAt: number;
  source: 'pos' | 'kiosk' | 'mobile';
  customerName: string;
  tableNumber?: string;
  orderType?: 'dine-in' | 'take-away';
}
